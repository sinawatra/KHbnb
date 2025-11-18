import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 1. Create a server-side Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // 2. Get the user's session from the cookies
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", session.user.id) // Use the authenticated user's ID
      .single();

    if (error || !profile || !profile.stripe_customer_id) {
      console.error("Stripe customer ID not found for user:", session.user.id);
      throw new Error("Stripe customer ID not found.");
    }

    const customerId = profile.stripe_customer_id;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return NextResponse.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
