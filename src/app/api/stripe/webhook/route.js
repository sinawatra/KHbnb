import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { sendBookingReceipt } from "@/lib/sendReceipt";
import { after } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signature or secret missing." },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // =====================================================
      // 1. SUBSCRIPTION CREATED
      // =====================================================
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const periodStart =
          subscription.current_period_start || subscription.start_date;
        const periodEnd =
          subscription.current_period_end || subscription.billing_cycle_anchor;

        if (!periodEnd) {
          console.error("Missing period dates in webhook:", subscription.id);
          break;
        }

        if (
          subscription.cancel_at_period_end &&
          subscription.status === "active"
        ) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: "cancelling",
              end_date: new Date(periodEnd * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
          break;
        }

        if (subscription.status !== "active") break;

        const priceId = subscription.items.data[0].price.id;

        // Find User
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (!user) {
          console.error("User not found for customer:", subscription.customer);
          break;
        }

        // Find Plan
        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("subscription_plans_id")
          .eq("stripe_price_id", priceId)
          .single();

        if (!plan) {
          console.error("Plan not found for price:", priceId);
          break;
        }

        // Deactivate old subs
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "inactive" })
          .eq("user_id", user.user_id);

        // Upsert Subscription
        const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
          {
            user_id: user.user_id,
            subscription_plans_id: plan.subscription_plans_id,
            stripe_subscription_id: subscription.id,
            start_date: new Date(periodStart * 1000).toISOString(),
            end_date: new Date(periodEnd * 1000).toISOString(),
            status: "active",
          },
          { onConflict: "stripe_subscription_id" }
        );

        if (error) console.error("Supabase error:", error);
        break;
      }

      // =====================================================
      // 2. INVOICE PAID
      // =====================================================
      case "invoice.paid": {
        const eventInvoice = event.data.object;
        let finalChargeId = eventInvoice.charge;

        if (!finalChargeId && typeof eventInvoice.payment_intent === "string") {
          finalChargeId = eventInvoice.payment_intent;
        }

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .eq("stripe_customer_id", eventInvoice.customer)
          .single();

        if (!user) {
          console.error("User not found for invoice:", eventInvoice.id);
          break;
        }

        const { error } = await supabaseAdmin.from("payments").upsert(
          {
            stripe_charge_id: finalChargeId,
            user_id: user.user_id,
            subscription_id: "subscription",
            amount: eventInvoice.amount_paid / 100,
            status: "succeeded",
            booking_id: null,
          },
          { onConflict: "stripe_charge_id" }
        );

        if (error) console.error("Payment Insert Error:", error);

        // Renewal Logic
        if (
          eventInvoice.subscription &&
          eventInvoice.billing_reason === "subscription_cycle"
        ) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              eventInvoice.subscription
            );
            await supabaseAdmin
              .from("user_subscriptions")
              .update({
                end_date: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
                status: "active",
              })
              .eq("stripe_subscription_id", eventInvoice.subscription);
          } catch (e) {
            console.error("Renewal update failed", e);
          }
        }
        break;
      }

      // =====================================================
      // 3. PAYMENT INTENT
      // =====================================================
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        if (paymentIntent.invoice) {
          console.log("[DEBUG] Skipping PI: It is a subscription.");
          break;
        }

        const bookingId = paymentIntent.metadata?.booking_id;
        const userId = paymentIntent.metadata?.user_id;
        const chargeId = paymentIntent.latest_charge;

        if (!bookingId || !userId || !chargeId) break;

        const { data: existingBooking } = await supabaseAdmin
          .from("bookings")
          .select("status")
          .eq("id", bookingId)
          .single();

        if (existingBooking?.status === "confirmed") {
          console.log(
            `[WEBHOOK] Booking ${bookingId} already confirmed. Skipping.`
          );
          break;
        }

        // A. Insert Payment
        const { error: payError } = await supabaseAdmin.from("payments").upsert(
          {
            stripe_charge_id: chargeId,
            user_id: userId,
            booking_id: bookingId,
            subscription_id: null,
            amount: paymentIntent.amount / 100,
            status: "succeeded",
          },
          { onConflict: "stripe_charge_id" }
        );

        if (!payError) {
          // B. Confirm Booking & Fetch Data
          const { data: bookingData, error: bookingError } = await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId)
            .select(
              `
              *,
              property:properties ( title, location ),
              user:users ( email )
            `
            )
            .single();

          if (bookingData && !bookingError) {
            console.log(`[WEBHOOK] Booking ${bookingId} confirmed.`);

            // C. Send Email (SAFE FOR GMAIL)
            // 'after' runs this in the background so Stripe gets a 200 OK immediately
            after(async () => {
              await sendBookingReceipt(
                bookingData.user?.email,
                bookingData,
                paymentIntent.amount / 100
              );
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "inactive" })
            .eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await supabaseAdmin
          .from("user_subscriptions")
          .update({
            status: "inactive",
            end_date: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
