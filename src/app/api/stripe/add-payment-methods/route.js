import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // 1. Create a server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Get the user's session from the cookies
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

    // 3. Get the user's Stripe ID from your database
    //    We use the user_id from the *secure session*, not from the client
    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (error || !profile || !profile.stripe_customer_id) {
      console.error("Stripe customer ID not found for user:", user.id);
      throw new Error("Stripe customer ID not found.");
    }

    const customerId = profile.stripe_customer_id;

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
