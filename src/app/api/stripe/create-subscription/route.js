import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // Your server-side Stripe instance
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    // priceId: The ID of the plan (e.g., "price_123...")
    // paymentMethodId: The ID of the card they want to use
    const { priceId, paymentMethodId } = await request.json();

    if (!priceId || !paymentMethodId) {
      throw new Error("Price ID and Payment Method ID are required.");
    }

    // --- 1. Authenticate user ---
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // --- 2. Get user's Stripe Customer ID ---
    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .single();

    if (error || !profile || !profile.stripe_customer_id) {
      console.error(
        "Stripe customer ID not found for user:",
        session.user.id,
        error
      );
      throw new Error("Stripe customer ID not found.");
    }
    const customerId = profile.stripe_customer_id;

    // --- 3. Attach the new payment method to the customer ---
    // This links the card to the customer in Stripe
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // --- 4. Set this new card as the customer's default ---
    // This tells Stripe to use this card for all future subscription invoices
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // --- 5. Create the subscription ---
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"], // So we can check status
    });

    // --- 6. Send success response ---
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error creating subscription:", error.message);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
