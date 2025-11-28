import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getUserSubscription(userId) {
  try {
    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions")
      .select("status, end_date, stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError) {
      console.error("DB Error:", subError);
      return createDefaultSubscription();
    }

    if (!subData) {
      return createDefaultSubscription();
    }

    // Check if subscription is active or cancelling (both are premium)
    const isValidStatus = ["active", "cancelling"].includes(subData.status);

    return {
      isPremium: isValidStatus,
      tier: isValidStatus ? "premium" : "free",
      status: subData.status,
      endDate: subData.end_date,
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return createDefaultSubscription();
  }
}

function createDefaultSubscription() {
  return {
    isPremium: false,
    tier: "free",
    status: null,
    endDate: null,
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
