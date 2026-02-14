import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helper";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { total, paymentMethodId, bookingId, encryptedPaymentData } =
      await request.json();
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

    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id, full_name") // Added full_name
      .eq("user_id", user.id)
      .single();

    if (error || !profile) {
      console.error("User profile not found for user:", user.id);
      throw new Error("User profile not found.");
    }

    // Use helper to ensure valid Stripe customer
    const customerId = await getOrCreateStripeCustomer(supabase, user, profile);

    const amount = Math.round(total * 100);

    // --- SCENARIO A: PAYING WITH SAVED CARD ---
    if (paymentMethodId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          booking_id: bookingId || "",
          user_id: user.id,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });

      // Insert into payments table
      if (encryptedPaymentData) {
        await supabase.from("payments").insert({
          user_id: user.id,
          status: "paid", // or 'pending' depending on logic, but flow usually implies attempt
          amount_encrypted: encryptedPaymentData,
        });
      }

      // 1. If payment succeeded immediately
      if (paymentIntent.status === "succeeded") {
        return NextResponse.json({ success: true, paymentIntent });
      }

      // 2. If payment requires 3D Secure (Bank verification)
      else if (paymentIntent.status === "requires_action") {
        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          requiresAction: true,
        });
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }
    }

    // --- SCENARIO B: PAYING WITH NEW CARD ---
    else {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: customerId,
        setup_future_usage: "off_session",
        metadata: {
          booking_id: bookingId || "",
          user_id: user.id,
        },
        automatic_payment_methods: { enabled: true },
      });

      // Insert into payments table
      if (encryptedPaymentData) {
        await supabase.from("payments").insert({
          user_id: user.id,
          status: "pending",
          amount_encrypted: encryptedPaymentData,
        });
      }

      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }
  } catch (error) {
    console.error("Stripe Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
