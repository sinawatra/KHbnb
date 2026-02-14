import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helper";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      throw new Error("Payment Method ID is required.");
    }

    // --- 1. Authenticate the user ---
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

    // --- 2. Get the user's Stripe Customer ID from users table ---
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("stripe_customer_id, full_name")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      throw new Error("User profile not found.");
    }

    // Use helper to ensure valid Stripe customer
    const customerId = await getOrCreateStripeCustomer(supabase, user, profile);

    // --- 3. Get the user's active subscription from user_subscriptions table ---
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no subscription case

    if (subError) {
      console.error("Subscription query error:", subError);
    }

    // --- 4. Security Check: Verify payment method belongs to this customer ---
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== customerId) {
      return NextResponse.json(
        { error: { message: "Not authorized to delete this card." } },
        { status: 403 }
      );
    }

    // --- 5. Check if this card is attached to an active subscription ---
    if (subscription && subscription.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      if (
        stripeSubscription.status === "active" &&
        stripeSubscription.default_payment_method === paymentMethodId
      ) {
        return NextResponse.json(
          {
            error: {
              message:
                "Cannot delete the payment method attached to your active subscription. Please add another card and set it as default, or cancel your subscription first.",
            },
          },
          { status: 400 }
        );
      }
    }

    // --- 6. Safe to detach/delete ---
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
