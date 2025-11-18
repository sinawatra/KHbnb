import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures dynamic cookie handling

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // --- Step 1: Check if the user is logged in ---
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    // --- Step 2: Get all the booking details from the request body ---
    const {
      property_id, // This will be the number (bigint) from your properties table
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      billing_address_line1,
      billing_city,
      billing_country,
      billing_postal_code,
    } = await request.json();

    // --- Step 3: Insert the new booking into the 'bookings' table ---
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: session.user.id, // The ID of the person making the booking
        property_id,
        check_in_date,
        check_out_date,
        num_guests,
        total_price,
        status: 'pending', // Set initial status to 'pending' (waiting for payment)
        billing_address_line1,
        billing_city,
        billing_country,
        billing_postal_code,
      })
      .select() // Ask Supabase to return the new row
      .single(); // Get it as a single object, not an array

    if (error) {
      // The DB will automatically check constraints (dates > 0, guests > 0)
      // If a check fails, the error message will be sent here.
      console.error('Error creating booking:', error);
      return NextResponse.json({ error: 'Failed to create booking.', details: error.message }, { status: 500 });
    }

    // --- Step 4: Return the newly created booking (including its ID) ---
    // The frontend will use this ID for the next step (payment)
    return NextResponse.json({ message: 'Booking created successfully.', booking: data }, { status: 201 }); 

  } catch (err) {
    console.error('General Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
