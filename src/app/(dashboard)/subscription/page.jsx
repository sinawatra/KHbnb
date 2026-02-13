import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionContent from "./SubscriptionContent";

export default async function SubscriptionPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("status, end_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPro =
    subscription && ["active", "cancelling"].includes(subscription.status);
  const isCanceling = subscription?.status === "cancelling";
  const currentPeriodEnd = subscription?.end_date
    ? new Date(subscription.end_date).toLocaleDateString()
    : null;

  return (
    <SubscriptionContent
      isPro={isPro}
      isCanceling={isCanceling}
      currentPeriodEnd={currentPeriodEnd}
    />
  );
}
