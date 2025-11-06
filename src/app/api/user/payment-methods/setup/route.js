import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Unauthorized' } },
      { status: 401 }
    );
  }

  let customerId;

  // 2. Check if the user is already a Stripe customer
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('stripe_customer_id, full_name, email')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'User profile not found.' } },
      { status: 404 }
    );
  }

  if (profile.stripe_customer_id) {
    customerId = profile.stripe_customer_id;
  } else {
    // 3. IF NOT, create a new Stripe Customer
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
    });
    customerId = customer.id;

    // 3b. Save the new customer ID to the user's profile
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id);
  }

  // 4. Create a Stripe Setup Intent
  // This intent prepares Stripe to securely capture payment details
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session', // Indicates you plan to charge them later
  });

  // 5. Return the client_secret to the frontend
  return NextResponse.json({
    success: true,
    message: 'Setup intent created successfully',
    data: {
      client_secret: setupIntent.client_secret,
    },
  });
}