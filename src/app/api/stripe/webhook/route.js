import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");
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
      // When a subscription is first created (your flow uses direct API)
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // Only process active subscriptions
        if (subscription.status !== "active") break;

        const priceId = subscription.items.data[0].price.id;

        // Get user
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (!user) {
          console.error("User not found for customer:", subscription.customer);
          break;
        }

        // Get plan from your DB
        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("id")
          .eq("stripe_price_id", priceId)
          .single();

        if (!plan) {
          console.error("Plan not found for price:", priceId);
          break;
        }

        // Deactivate old subscriptions
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "inactive" })
          .eq("user_id", user.id)
          .eq("status", "active");

        // Create or update subscription record
        const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
          {
            user_id: user.id,
            subscription_plans_id: plan.id,
            stripe_subscription_id: subscription.id,
            start_date: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            end_date: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            status: "active",
          },
          {
            onConflict: "stripe_subscription_id",
          }
        );

        if (error) {
          console.error("Supabase error:", error);
        } else {
          console.log(`✅ Subscription activated for user ${user.id}`);
        }
        break;
      }

      // When subscription renews successfully
      case "invoice.paid": {
        const invoice = event.data.object;

        // 1. Fetch the User (we need user_id for the payments table)
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", invoice.customer)
          .single();

        if (user) {
          // 2. Fetch the internal Subscription ID (needed if payments.subscription_id is a foreign key)
          // Note: This might return null on the very first invoice if the subscription
          // insert happens milliseconds after this event.
          const { data: sub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription)
            .single();

          // 3. INSERT into the 'payments' table
          const { error: paymentError } = await supabaseAdmin
            .from("payments")
            .insert({
              stripe_charge_id: invoice.charge,
              user_id: user.id,
              subscription_id: sub ? sub.id : null, // Use internal ID if found
              amount: invoice.amount_paid / 100, // Stripe is in cents, your DB is likely standard units
              status: "succeeded",
              booking_id: null, // Null because this is a subscription, not a one-off booking
            });

          if (paymentError)
            console.error("Error logging payment:", paymentError);
          else console.log(`💰 Payment logged for user ${user.id}`);
        }

        // 4. Handle Subscription Renewal Logic (Existing logic)
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

          console.log(`✅ Subscription renewed: ${invoice.subscription}`);
        }
        break;
      }

      // One time payments
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // 1. Extract the data you saved in Step 1
        const userId = paymentIntent.metadata.user_id;
        const bookingId = paymentIntent.metadata.booking_id;

        // 2. Insert into Payments Table
        const { error } = await supabaseAdmin.from("payments").insert({
          stripe_charge_id: paymentIntent.latest_charge,
          user_id: userId,
          booking_id: bookingId ? parseInt(bookingId) : null,
          subscription_id: null,
          amount: paymentIntent.amount / 100,
          status: "succeeded",
          // created_at is usually auto-handled by DB, but can be added if needed
        });

        if (bookingId) {
          await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);

          console.log(`✅ Booking ${bookingId} confirmed!`);
        }

        if (error) {
          console.error("❌ Error logging one-time payment:", error);
        } else {
          console.log(`💰 One-time payment logged for Booking ${bookingId}`);
        }
        break;
      }

      // When payment fails
      case "invoice.payment_failed": {
        const invoice = event.data.object;

        if (invoice.subscription) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "inactive" })
            .eq("stripe_subscription_id", invoice.subscription);

          console.log(`❌ Payment failed for: ${invoice.subscription}`);

          // TODO: Send payment failed notification
        }
        break;
      }

      // When subscription is canceled
      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabaseAdmin
          .from("user_subscriptions")
          .update({
            status: "inactive",
            end_date: new Date().toISOString(), // Mark as ended now
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`🚫 Subscription canceled: ${subscription.id}`);
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
