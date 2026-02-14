import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helper";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 1. Create a server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Get the user's session from the cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // 3. Get the user's Stripe customer ID
    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id, full_name")
      .eq("user_id", user.id)
      .single();

    if (error || !profile) {
      console.error("User profile not found for user:", user.id);
      throw new Error("User profile not found.");
    }

    // Use helper to ensure valid Stripe customer
    const customerId = await getOrCreateStripeCustomer(supabase, user, profile);

    // 4. Get the user's active subscription (if any)
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let activePaymentMethodId = null;

    // 5. If user has a subscription, get the active payment method
    if (subscription && subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        // Only mark as active if subscription is actually active
        if (stripeSubscription.status === "active") {
          activePaymentMethodId = stripeSubscription.default_payment_method;
        }
      } catch (subError) {
        console.error("Error fetching subscription:", subError);
        // Continue without marking any card as active
      }
    }

    // 6. Get all payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
      activePaymentMethodId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
