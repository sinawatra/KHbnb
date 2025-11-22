import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { total, paymentMethodId, bookingId } = await request.json();
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

    const { data: profile } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new Error("Stripe customer ID not found.");
    }

    const amount = Math.round(total * 100);

    // --- SCENARIO A: PAYING WITH SAVED CARD ---
    if (paymentMethodId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: profile.stripe_customer_id,
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
        customer: profile.stripe_customer_id,
        setup_future_usage: "off_session",
        metadata: {
          booking_id: bookingId,
          user_id: user.id,
        },
        automatic_payment_methods: { enabled: true },
      });
      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }
  } catch (error) {
    console.error("Stripe Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
