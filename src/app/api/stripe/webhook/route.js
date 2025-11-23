import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

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
      // 1. SUBSCRIPTION CREATED / UPDATED
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

        // Handle Cancellations
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
          console.log(
            `Subscription marked for cancellation: ${subscription.id}`
          );
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
        else console.log(`Subscription activated for user ${user.user_id}`);
        break;
      }

      // =====================================================
      // 2. INVOICE PAID (Handles Subscription Payments)
      // =====================================================
      case "invoice.paid": {
        const eventInvoice = event.data.object;
        console.log(`\n[DEBUG] Invoice Paid: ${eventInvoice.id}`);

        // --- 1. ROBUST CHARGE ID FINDER ---
        let finalChargeId = eventInvoice.charge;

        // Step A: Check event payload for Payment Intent ID
        if (!finalChargeId && eventInvoice.payment_intent) {
          console.log(
            `[DEBUG] Charge missing in event, fetching PI: ${eventInvoice.payment_intent}`
          );
          try {
            const pi = await stripe.paymentIntents.retrieve(
              eventInvoice.payment_intent
            );
            finalChargeId = pi.latest_charge;
          } catch (e) {
            console.error("[DEBUG] Failed to fetch PI from event:", e.message);
          }
        }

        // Step B: Fallback - Refetch Invoice WITH EXPANSION
        if (!finalChargeId) {
          console.log(
            "[DEBUG] Still no Charge ID. Refetching Invoice with expansion..."
          );
          try {
            // EXPAND payment_intent to get the object immediately
            const freshInvoice = await stripe.invoices.retrieve(
              eventInvoice.id,
              {
                expand: ["payment_intent"],
              }
            );

            finalChargeId = freshInvoice.charge;

            // If charge is null, check the expanded payment_intent
            if (!finalChargeId && freshInvoice.payment_intent) {
              if (typeof freshInvoice.payment_intent === "object") {
                finalChargeId = freshInvoice.payment_intent.latest_charge;
                console.log(
                  `[DEBUG] Found Charge ID via Fresh Invoice PI: ${finalChargeId}`
                );
              }
            }
          } catch (e) {
            console.error("[DEBUG] Invoice refetch failed", e.message);
          }
        }

        // 🛑 STOP if we still can't find it
        if (!finalChargeId) {
          if (eventInvoice.amount_paid === 0) {
            console.log("✅ [DEBUG] $0 Invoice (Trial). Skipping payment log.");
            break;
          }
          console.error(
            "🛑 [DEBUG] Critical: Charge ID not found anywhere. Aborting."
          );
          break;
        }

        // --- 2. FIND USER ---
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .eq("stripe_customer_id", eventInvoice.customer)
          .single();

        if (!user) {
          console.error("User not found for invoice:", eventInvoice.id);
          break;
        }

        // --- 3. FIND OR RECOVER SUBSCRIPTION ---
        let subscriptionId = null;
        if (eventInvoice.subscription) {
          const { data: sub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("user_subscriptions_id")
            .eq("stripe_subscription_id", eventInvoice.subscription)
            .single();

          if (sub) {
            subscriptionId = sub.user_subscriptions_id;
          } else {
            console.log("⚠️ Subscription missing in DB. Recovering...");
            try {
              const stripeSub = await stripe.subscriptions.retrieve(
                eventInvoice.subscription
              );
              const priceId = stripeSub.items.data[0].price.id;
              const { data: plan } = await supabaseAdmin
                .from("subscription_plans")
                .select("subscription_plans_id")
                .eq("stripe_price_id", priceId)
                .single();

              if (plan) {
                const { data: newSub } = await supabaseAdmin
                  .from("user_subscriptions")
                  .upsert(
                    {
                      user_id: user.user_id,
                      subscription_plans_id: plan.subscription_plans_id,
                      stripe_subscription_id: stripeSub.id,
                      start_date: new Date(
                        stripeSub.current_period_start * 1000
                      ).toISOString(),
                      end_date: new Date(
                        stripeSub.current_period_end * 1000
                      ).toISOString(),
                      status: "active",
                    },
                    { onConflict: "stripe_subscription_id" }
                  )
                  .select("user_subscriptions_id")
                  .single();

                if (newSub) subscriptionId = newSub.user_subscriptions_id;
              }
            } catch (err) {
              console.error("Recovery failed:", err.message);
            }
          }
        }

        // --- 4. UPSERT PAYMENT ---
        console.log(`✅ [DEBUG] Upserting Sub Payment: ${finalChargeId}`);
        const { error } = await supabaseAdmin.from("payments").upsert(
          {
            stripe_charge_id: finalChargeId,
            user_id: user.user_id,
            subscription_id: subscriptionId,
            amount: eventInvoice.amount_paid / 100,
            status: "succeeded",
            booking_id: null,
          },
          { onConflict: "stripe_charge_id" }
        );

        if (error) console.error("Payment Insert Error:", error);

        // --- 5. RENEWAL ---
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
            console.log(`Subscription renewed: ${eventInvoice.subscription}`);
          } catch (e) {
            console.error("Renewal update failed", e);
          }
        }
        break;
      }

      // =====================================================
      // 3. PAYMENT INTENT (Handles One-Time Bookings)
      // =====================================================
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`\n[DEBUG] PaymentIntent: ${paymentIntent.id}`);

        if (paymentIntent.invoice) {
          console.log("🛑 [DEBUG] Skipping PI: It is a subscription.");
          break;
        }

        const bookingId = paymentIntent.metadata?.booking_id;
        if (!bookingId) {
          console.log("🛑 [DEBUG] Skipping PI: No booking_id found.");
          break;
        }

        const userId = paymentIntent.metadata?.user_id;
        const chargeId = paymentIntent.latest_charge;

        if (!userId || !chargeId) {
          console.error("🛑 [DEBUG] Missing user/charge ID in PI metadata");
          break;
        }

        console.log(`✅ [DEBUG] Inserting Booking Payment: ${chargeId}`);

        const { error } = await supabaseAdmin.from("payments").upsert(
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

        if (error) {
          console.error("[DEBUG] DB Error (PI):", error);
        } else {
          await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);
          console.log(`✅ [DEBUG] Booking ${bookingId} confirmed.`);
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
          console.log(`Payment failed for: ${invoice.subscription}`);
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
        console.log(`Subscription canceled: ${subscription.id}`);
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
