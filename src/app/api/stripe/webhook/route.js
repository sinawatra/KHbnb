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

  // 1. Verify the event came from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    );
  }

  // 2. Handle the specific event type
  try {
    switch (event.type) {
      // --- SUBSCRIPTIONS ---

      // A subscription was created or an invoice was paid successfully
      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          console.log("Invoice paid for subscription:", invoice.subscription);

          // --- ❗ YOUR DATABASE LOGIC ---
          // Update your 'users' table
          // 1. Find the user with stripe_customer_id: invoice.customer
          // 2. Set their `subscription_status` to 'active'
          // 3. Set their `current_period_end` to the new period end

          // Example Supabase update:
          // await supabaseAdmin
          //   .from('users')
          //   .update({
          //     subscription_status: 'active',
          //     current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString()
          //   })
          //   .eq('stripe_customer_id', invoice.customer);
        }
        break;
      }

      // A subscription payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("Invoice payment failed for:", invoice.customer);

        // --- ❗ YOUR DATABASE LOGIC ---
        // 1. Find user with stripe_customer_id: invoice.customer
        // 2. Set `subscription_status` to 'past_due' or 'failed'
        // 3. (Optional) Send them an email to update their card

        // Example Supabase update:
        // await supabaseAdmin
        //   .from('users')
        //   .update({ subscription_status: 'past_due' })
        //   .eq('stripe_customer_id', invoice.customer);

        break;
      }

      // A subscription was canceled (by user or by Stripe)
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("Subscription deleted for:", subscription.customer);

        // --- ❗ YOUR DATABASE LOGIC ---
        // 1. Find user with stripe_customer_id: subscription.customer
        // 2. Set `subscription_status` to 'canceled'

        // Example Supabase update:
        // await supabaseAdmin
        //   .from('users')
        //   .update({ subscription_status: 'canceled' })
        //   .eq('stripe_customer_id', subscription.customer);

        break;
      }

      // --- ONE-TIME PAYMENTS ---

      // This is for your `CheckoutPage` one-time payments
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        // --- ❗ YOUR DATABASE LOGIC ---
        // This is where you would save the order to your database
        // 1. Find user with stripe_customer_id: paymentIntent.customer
        // 2. Create a new row in your 'bookings' or 'orders' table
        // 3. Save the paymentIntent.id as the payment_id

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // 3. Respond to Stripe
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
