import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // Your server-side Stripe instance
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { priceId, paymentMethodId } = await request.json();

    if (!priceId || !paymentMethodId) {
      throw new Error("Price ID and Payment Method ID are required.");
    }

    // --- 1. Authenticate user ---
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // --- 2. Get user's Stripe Customer ID ---
    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .single();

    if (error || !profile || !profile.stripe_customer_id) {
      console.error(
        "Stripe customer ID not found for user:",
        session.user.id,
        error
      );
      throw new Error("Stripe customer ID not found.");
    }
    const customerId = profile.stripe_customer_id;

    // A. Check Stripe directly for active subscriptions
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // B. If Stripe says they are subscribed...
    if (stripeSubscriptions.data.length > 0) {
      const activeSub = stripeSubscriptions.data[0];
      
      // C. Check if Supabase knows about this
      const { data: localSub } = await supabase
        .from("user_subscriptions")
        .select("user_subscriptions_id, status")
        .eq("stripe_subscription_id", activeSub.id)
        .single();

      // D. "Self-Healing": If Supabase is missing data, fix it now.
      if (!localSub || localSub.status !== 'active') {
        console.log("Desync detected. Syncing Supabase with Stripe...");
        
        const currentPriceId = activeSub.items.data[0].price.id;
        
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("subscription_plans_id") 
          .eq("stripe_price_id", currentPriceId)
          .single();

        if (plan) {
           await supabase.from("user_subscriptions").upsert({
            user_id: session.user.id,
            subscription_plans_id: plan.subscription_plans_id,
            stripe_subscription_id: activeSub.id,
            start_date: new Date(activeSub.current_period_start * 1000).toISOString(),
            end_date: new Date(activeSub.current_period_end * 1000).toISOString(),
            status: "active",
          }, { onConflict: 'stripe_subscription_id' });
        }
      }

      // E. BLOCK the new subscription
      return NextResponse.json(
        { error: { message: "You already have an active subscription." } },
        { status: 400 }
      );
    }

    // --- 3. Attach the new payment method to the customer ---
    // This links the card to the customer in Stripe
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // --- 4. Set this new card as the customer's default ---
    // This tells Stripe to use this card for all future subscription invoices
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // --- 5. Create the subscription ---
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });

    // --- 6. Send success response ---
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error creating subscription:", error.message);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
