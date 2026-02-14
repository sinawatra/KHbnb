import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  const { fullName, email, password, phone_number } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({
      success: false,
      error: "Full name, email, and password are required.",
    });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Check if user already exists in public.users table to prevent duplicate key error
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({
      success: false,
      error: "An account with this email already exists. Please log in instead.",
    });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
      error: authError.message,
    });
  }

  const user = authData.user;
  if (!user) {
    return NextResponse.json({
      success: false,
      error: "Signup failed, user not created.",
    });
  }

  let customerId;

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: fullName,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;
  } catch (stripeError) {
    console.error("Stripe customer creation failed:", stripeError.message);
    await supabase.auth.admin.deleteUser(user.id);
    return NextResponse.json({
      success: false,
      error: "Could not create billing profile.",
    });
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    user_id: user.id,
    email: user.email,
    full_name: fullName,
    stripe_customer_id: customerId,
    phone_number: phone_number,
    role: "user",
  });

  if (insertError) {
    console.error("Failed to save user profile:", insertError.message);
    
    await supabase.auth.admin.deleteUser(user.id);
    await stripe.customers.del(customerId);

    return NextResponse.json({
      success: false,
      error: "Failed to link billing profile to user.",
    });
  }

  // SUCCESS!
  return NextResponse.json({
    success: true,
    message: "successful",
    data: {
      details:
        "Signup complete! Please check your email to verify your account.",
    },
  });
}
