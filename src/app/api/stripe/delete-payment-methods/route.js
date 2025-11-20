import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { paymentMethodId } = await request.json();
    if (!paymentMethodId) {
      throw new Error("Payment Method ID is required.");
    }

    // --- 1. Authenticate the user (same as your other routes) ---
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

    // --- 2. Get the user's Stripe Customer ID ---
    const { data: profile } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!profile || !profile.stripe_customer_id) {
      throw new Error("Stripe customer ID not found.");
    }

    const customerId = profile.stripe_customer_id;

    // --- 3. CRITICAL Security Check ---
    // Retrieve the payment method to ensure it belongs to the logged-in customer.
    // This prevents a user from deleting someone else's card.
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== customerId) {
      return NextResponse.json(
        { error: { message: "Not authorized to delete this card." } },
        { status: 403 }
      );
    }

    // --- 4. Detach the Payment Method ---
    // This "deletes" it from the customer's saved list.
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
