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

        if (
          invoice.subscription &&
          invoice.billing_reason === "subscription_cycle"
        ) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          );

          // Update end_date for renewal
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

          // TODO: Send renewal notification email here
          // Get user email and send via your email service
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
