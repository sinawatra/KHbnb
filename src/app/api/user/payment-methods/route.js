import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
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

  // 2. Get the user's Stripe Customer ID
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile || !profile.stripe_customer_id) {
    // If they have no Stripe ID, they have no cards. Return an empty array.
    return NextResponse.json({
      success: true,
      message: 'No payment methods found.',
      data: []
    });
  }
  
  const customerId = profile.stripe_customer_id;

  // 3. Fetch the list of payment methods from Stripe
  let savedCards = [];
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    // 4. Format the data for the frontend
    // We only want to send the necessary, safe-to-display info
    savedCards = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
    }));
    
  } catch (stripeError) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: `Stripe Error: ${stripeError.message}` } },
      { status: 400 }
    );
  }

  // 5. Return the list of cards
  return NextResponse.json({
    success: true,
    message: 'Payment methods retrieved successfully',
    data: savedCards
  });
}