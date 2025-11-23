// lib/permissions.js
import { createClient } from "@supabase/supabase-js";

// Feature flags
export const FEATURES = {
  ADVANCED_FILTERS: "advanced_filters",
  MAP_PIN_SEARCH: "map_pin_search",
};

// Get user's subscription tier
export async function getUserSubscription(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
      *,
      subscription_plans (
        name,
        stripe_price_id
      )
    `
    )
    .eq("user_id", userId)
    .in("status", ["active", "cancelling"])
    .order("end_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { tier: "free", isPremium: false };
  }

  const endDate = new Date(data.end_date);
  const isExpired = endDate < new Date();

  if (isExpired) {
    return { tier: "free", isPremium: false };
  }

  return {
    tier: "premium",
    isPremium: true,
    subscriptionId: data.stripe_subscription_id,
    endDate: data.end_date,
  };
}

// Check if user can access a specific feature
export function canAccessFeature(isPremium, feature) {
  const premiumFeatures = [FEATURES.ADVANCED_FILTERS, FEATURES.MAP_PIN_SEARCH];

  if (premiumFeatures.includes(feature)) {
    return isPremium;
  }

  return true;
}
