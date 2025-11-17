import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe'; // Your server-side Stripe instance
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Ensure dynamic cookie handling

/**
 * --- Helper Function 1: Get User Details ---
 * A "human-like" step that securely gets the logged-in user's
 * session and their Stripe Customer ID from our database.
 */
async function getUserDetails(supabase) {
  // 1. Verify the user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // 2. Get the user's Stripe ID from our database (SECURE)
  const { data: profile, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', session.user.id) // Use the authenticated user's ID
    .single();

  if (error || !profile || !profile.stripe_customer_id) {
    throw new Error('Stripe customer ID not found.');
  }

  return { session, customerId: profile.stripe_customer_id };
}

/**
 * --- Helper Function 2: Handle a Saved Card Payment ---
 * This logic runs if the user is paying with a card they've already saved.
 * It tries to charge the card immediately.
 */
async function handleSavedCardPayment(customerId, paymentMethodId, amountInCents, bookingId) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId, // Secure customer ID from our DB
      payment_method: paymentMethodId,
      confirm: true, // Try to charge immediately
      off_session: true, // Indicates the user isn't re-entering details
      error_on_requires_action: true,
      metadata: {
        booking_id: bookingId, // This links the payment to the booking
      },
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    if (err.code === 'card_declined' || err.code === 'card_error') {
      return NextResponse.json(
        { error: 'Your card was declined.' },
        { status: 400 }
      );
    }
    console.error('Stripe Error (Saved Card):', err.message);
    throw new Error(err.message); // Let the main catch block handle it
  }
}

/**
 * --- Helper Function 3: Handle a New Card Payment ---
 * This logic runs if the user is paying with a new card.
 * It creates a secure session and sends a "client secret" to the frontend.
 */
async function handleNewCardPayment(customerId, amountInCents, bookingId) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    customer: customerId, // Attach to the customer
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      booking_id: bookingId, // This links the payment to the booking
    },
  });

  // Send the clientSecret to the frontend to show the Stripe card form
  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}

// ---
// --- MAIN API ENDPOINT (POST Request) ---
// ---
export async function POST(request) {
  try {
    // This is our main "story"
    const supabase = createRouteHandlerClient({ cookies });

    // 1. First, make sure the user is logged in and get their Stripe ID.
    const { customerId } = await getUserDetails(supabase);

    // 2. Next, get the details of the purchase from the frontend.
    const {
      total,
      paymentMethodId, // This will be provided if they use a saved card
      bookingId,       // The ID of the booking we're paying for
    } = await request.json();

    // 3. Check if the purchase details are valid.
    if (!total || total <= 0 || !bookingId) {
      return NextResponse.json(
        { error: 'Invalid total amount or missing booking ID' },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(total * 100);

    // 4. Finally, decide how to handle the payment.
    if (paymentMethodId) {
      // The user is paying with a saved card.
      return await handleSavedCardPayment(
        customerId,
        paymentMethodId,
        amountInCents,
        bookingId
      );
    } else {
      // The user is paying with a new card.
      return await handleNewCardPayment(
        customerId,
        amountInCents,
        bookingId
      );
    }
  } catch (error) {
    // This is our "catch-all" for any unexpected errors
    console.error('General Error:', error.message);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === 'Stripe customer ID not found.') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}