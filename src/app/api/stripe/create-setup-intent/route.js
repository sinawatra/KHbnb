import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // Your server-side Stripe instance
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"; // ✅ Import Supabase server helper
import { cookies } from "next/headers"; // ✅ Import Next.js cookies

export async function POST() {
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

    // 3. Get the user's Stripe ID from your database
    //    We use the user_id from the *secure session*, not from the client
    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id) // Use the authenticated user's ID
      .single();

    if (error || !profile || !profile.stripe_customer_id) {
      console.error("Stripe customer ID not found for user:", session.user.id);
      throw new Error("Stripe customer ID not found.");
    }

    const customerId = profile.stripe_customer_id; // ✅ Now we have it!

    // 4. Create the Setup Intent with the real customer ID
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "on_session",
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
