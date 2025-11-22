import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    // 1. Authenticate User
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

    // 2. Get the Active Subscription from DB
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("start_date", { ascending: false })
      .limit(1)
      .single();

    if (!subscription || subError) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // 3. Verify subscription exists in Stripe
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );
    } catch (stripeError) {
      // If subscription doesn't exist in Stripe, mark as inactive in DB
      await supabase
        .from("user_subscriptions")
        .update({ status: "inactive" })
        .eq("user_subscriptions_id", subscription.user_subscriptions_id);

      return NextResponse.json(
        { error: "Subscription not found in Stripe. Database updated." },
        { status: 400 }
      );
    }

    // 4. Check if already cancelled
    if (
      stripeSubscription.status === "canceled" ||
      stripeSubscription.cancel_at_period_end
    ) {
      return NextResponse.json(
        {
          error: "Subscription is already cancelled or marked for cancellation",
        },
        { status: 400 }
      );
    }

    // 5. Cancel at period end
    const deletedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    return NextResponse.json({ subscription: deletedSubscription });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
