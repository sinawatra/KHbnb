import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";

const freeFeatures = [
  "Access basic booking features",
  "Browse Properties and see details",
];

const proFeatures = [
  "Everything included in Free",
  "Free Cancellation",
  "Book with no service fee",
];

export default async function SubscriptionPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let isPro = false;

  if (session) {
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .single();

    if (subscription) {
      isPro = true;
    }
  }

  return (
    <section className="w-full max-w-4xl mx-auto py-12 md:py-24 px-4">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-gray-600">
          See your current plan details. Choose a plan to ensure that everything
          you booked is beneficial financially and emotionally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* --- FREE CARD --- */}
        <Card
          className={`border-gray-300 ${
            !isPro ? "border-2 border-blue-500 shadow-lg" : ""
          }`}
        >
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">
              For casual travelers
            </p>
            <CardTitle className="text-4xl">Free</CardTitle>
            <CardDescription>
              Perfect for first time travelers and those who wants to explore
              without commitment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Logic: If NOT Pro, this is the current plan */}
            <Button
              variant={!isPro ? "secondary" : "outline"}
              className="w-full"
              disabled={!isPro} // Disable if this is current plan
            >
              {!isPro ? "Current Plan" : "Downgrade to Free"}
            </Button>

            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-red-500" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* --- PRO CARD --- */}
        <Card className={`${isPro ? "border-2 border-red-500 shadow-lg" : ""}`}>
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">
              For frequent travelers
            </p>
            <CardTitle className="text-4xl">Pro</CardTitle>
            <CardDescription>
              Designed for those who travels frequently and loves convenience
              and flexibility
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Logic: Show Cancel button if Pro, otherwise Get Started */}
            {isPro ? (
              <div className="flex flex-col gap-2">
                <Button className="w-full bg-green-600 hover:bg-green-700 cursor-default">
                  Current Plan (Active)
                </Button>
                <CancelSubscriptionButton />
              </div>
            ) : (
              <Link href="/subscription/billing">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Get Started
                </Button>
              </Link>
            )}

            <ul className="space-y-3">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-red-500" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
