import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, CheckCircle2, XCircle } from "lucide-react";
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
    <section className="w-full max-w-5xl mx-auto py-12 md:py-4 px-6 md:px-8">
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
          className={`p-6 flex flex-col h-full border transition-all duration-200${
            !isPro
              ? "border-slate-400 shadow-md bg-white"
              : "border-gray-200 bg-gray-50/50 opacity-75 hover:opacity-100"
          }`}
        >
          <CardHeader>
            <p className="text-sm font-medium text-gray-500">
              For casual travelers
            </p>
            <CardTitle className="text-4xl">Free</CardTitle>
            <CardDescription>
              Perfect for first time travelers and those who want to explore
              without commitment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 flex-1 p-6 pt-0">
            <div className="flex flex-col gap-3 min-h-[3rem]">
              {" "}
              {!isPro ? (
                <div className="w-full h-12 rounded-md bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center gap-2 font-medium cursor-default">
                  <CheckCircle2 className="h-4 w-4" />
                  Current Plan
                </div>
              ) : (
                <></>
              )}
            </div>

            <ul className="space-y-3 mt-auto">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-slate-400" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* --- PRO CARD --- */}
        <Card
          className={`p-6 flex flex-col h-full border transition-all duration-200 ${
            isPro
              ? "border-red-500 shadow-xl bg-white ring-1 ring-red-100"
              : "border-gray-200 bg-white hover:border-red-200 hover:shadow-md"
          }`}
        >
          <CardHeader>
            <p className="text-sm font-medium">For frequent travelers</p>
            <CardTitle className="text-4xl">Pro</CardTitle>
            <CardDescription>
              Designed for those who travel frequently and love convenience and
              flexibility
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 flex-1 p-6">
            <div className="flex flex-col gap-3">
              {isPro ? (
                <>
                  <div className="w-full h-12 rounded-md bg-green-50 border border-green-200 text-green-700 flex items-center justify-center gap-2 font-medium cursor-default">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Active Plan
                  </div>

                  <div className="w-full">
                    <CancelSubscriptionButton />
                  </div>
                </>
              ) : (
                <Link href="/subscription/billing" className="w-full">
                  <Button className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>

            <ul className="space-y-3 mt-auto">
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
