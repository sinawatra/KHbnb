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
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        const periodStart =
          subscription.current_period_start || subscription.start_date;

        // Use fallback if current_period_end is missing
        const periodEnd =
          subscription.current_period_end || subscription.billing_cycle_anchor;

        // If we still don't have a valid date, we can't proceed safely
        if (!periodEnd) {
          console.error("Missing period dates in webhook:", subscription.id);
          break;
        }
        // IMPORTANT: If marked for cancellation, update status to "cancelling" in DB
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

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (!user) {
          console.error("User not found for customer:", subscription.customer);
          break;
        }

        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("subscription_plans_id")
          .eq("stripe_price_id", priceId)
          .single();

        if (!plan) {
          console.error("Plan not found for price:", priceId);
          break;
        }

        // Deactivate ALL old subscriptions
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "inactive" })
          .eq("user_id", user.user_id);

        // Insert/update THIS subscription
        const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
          {
            user_id: user.user_id,
            subscription_plans_id: plan.subscription_plans_id,
            stripe_subscription_id: subscription.id,
            start_date: new Date(periodStart * 1000).toISOString(),
            end_date: new Date(periodEnd * 1000).toISOString(),
            status: "active",
          },
          {
            onConflict: "stripe_subscription_id",
          }
        );

        if (error) {
          console.error("Supabase error:", error);
        } else {
          console.log(`Subscription activated for user ${user.user_id}`);
        }
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object;

        // Only log if it's NOT a subscription charge (subscriptions handled by invoice.paid)
        if (charge.invoice) {
          console.log("Subscription charge - will be handled by invoice.paid");
          break;
        }

        console.log(`Charge succeeded: ${charge.id}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("user_id")
          .eq("stripe_customer_id", invoice.customer)
          .single();

        if (user) {
          const { data: sub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("user_subscriptions_id")
            .eq("stripe_subscription_id", invoice.subscription)
            .single();

          const { error: paymentError } = await supabaseAdmin
            .from("payments")
            .insert({
              stripe_charge_id: invoice.charge,
              user_id: user.user_id,
              subscription_id: sub ? sub.user_subscriptions_id : null,
              amount: invoice.amount_paid / 100,
              status: "succeeded",
              booking_id: null,
            });

          if (paymentError)
            console.error("Error logging payment:", paymentError);
          else console.log(`Payment logged for user ${user.user_id}`);
        }

        if (
          invoice.subscription &&
          invoice.billing_reason === "subscription_cycle"
        ) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          );

          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              end_date: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              status: "active",
            })
            .eq("stripe_subscription_id", invoice.subscription);

          console.log(`Subscription renewed: ${invoice.subscription}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // Skip if this is a subscription payment (handled by invoice.paid)
        if (paymentIntent.invoice) {
          console.log("Skipping subscription payment_intent");
          break;
        }

        const userId = paymentIntent.metadata.user_id;
        const bookingId = paymentIntent.metadata.booking_id;

        if (!userId) {
          console.error(
            "Missing user_id in payment intent metadata:",
            paymentIntent.id
          );
          break;
        }

        const { error } = await supabaseAdmin.from("payments").insert({
          stripe_charge_id: paymentIntent.latest_charge,
          user_id: userId,
          booking_id: bookingId ? bookingId : null,
          subscription_id: null,
          amount: paymentIntent.amount / 100,
          status: "succeeded",
        });

        if (bookingId) {
          await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);

          console.log(`Booking ${bookingId} confirmed!`);
        }

        if (error) {
          console.error("Error logging one-time payment:", error);
        } else {
          console.log(`One-time payment logged for Booking ${bookingId}`);
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
