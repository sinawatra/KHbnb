import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  const { fullName, email, password } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({
      success: false,
      message: "error",
      data: { details: "Full name, email, and password are required." },
    });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // ONLY Step 1 is needed now. The trigger handles the rest.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return NextResponse.json({
      success: false,
      message: "error",
      data: { details: authError.message },
    });
  }

  if (!authData.user) {
    return NextResponse.json({
      success: false,
      message: "error",
      data: { details: "Signup failed, user not created." },
    });
  }

  let customerId;
  try {
    const customer = await stripe.customers.create({
      email: authData.user.email,
      name: fullName,
      metadata: {
        supabase_user_id: authData.user.id,
      },
    });
    customerId = customer.id;
  } catch (stripeError) {
    console.error("Stripe customer creation failed:", stripeError.message);
    await supabase.auth.admin.deleteUser(authData.user.id);

    return NextResponse.json({
      success: false,
      message: "error",
      data: { details: "Could not create billing profile." },
    });
  }

  // Save the Stripe ID
  const { error: updateError } = await supabase
    .from("users")
    .update({ stripe_customer_id: customerId })
    .eq("user_id", authData.user.id);

  if (updateError) {
    console.error("Failed to save stripe_customer_id:", updateError.message);
    await supabase.auth.admin.deleteUser(authData.user.id);
    await stripe.customers.del(customerId);

    return NextResponse.json({
      success: false,
      message: "error",
      data: { details: "Failed to link billing profile to user." },
    });
  }

  // SUCCESS RESPONSE
  return NextResponse.json({
    success: true,
    message: "successful",
    data: {
      details:
        "Signup complete! Please check your email to verify your account.",
    },
  });
}
