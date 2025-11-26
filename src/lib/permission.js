// @/lib/permission.js
import "server-only"; // 1. Prevents client-side bundle leakage
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

// Create the admin client once
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getUserSubscription(userId) {
  try {
    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError) {
      console.error("DB Error:", subError);
      // Fail safely to free tier
      return createDefaultSubscription();
    }

    if (!subData?.stripe_subscription_id) {
      return createDefaultSubscription();
    }

    // Optimization: In the future, select 'status' from DB here
    // to avoid the await stripe.subscriptions.retrieve call below.

    const subscription = await stripe.subscriptions.retrieve(
      subData.stripe_subscription_id
    );

    // 2. Logic Check: Include 'trialing' as a premium state
    const isValidStatus = ["active", "trialing"].includes(subscription.status);

    return {
      isPremium: isValidStatus,
      tier: isValidStatus ? "premium" : "free",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      // 3. Robust Date Handling: Ensure we handle nulls
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      status: subscription.status,
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return createDefaultSubscription();
  }
}

// Helper to standardise the 'free' return object
function createDefaultSubscription() {
  return {
    isPremium: false,
    tier: "free",
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    status: null,
  };
}

export const FEATURES = {
  ADVANCED_FILTERS: "ADVANCED_FILTERS",
  MAP_PIN_SEARCH: "MAP_PIN_SEARCH",
};

export function canAccessFeature(isPremium, feature) {
  const premiumFeatures = [FEATURES.ADVANCED_FILTERS, FEATURES.MAP_PIN_SEARCH];
  if (premiumFeatures.includes(feature)) {
    return isPremium;
  }
  return true;
}
