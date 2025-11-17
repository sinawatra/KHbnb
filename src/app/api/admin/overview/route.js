import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// =================================================================
//  HELPER FUNCTION
// =================================================================

/**
 * Checks if the current user is an admin.
 * Returns the user object if they are an admin, otherwise null.
 */
async function getAdminUser(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();
    
  return (profile && profile.role === 'admin') ? user : null;
}

// =================================================================
//  API ENDPOINT
// =================================================================

/**
 * GET: Fetches all data required for the Admin Overview dashboard.
 * This includes recent bookings and a list of properties.
 */
export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Security: Check for admin
  const adminUser = await getAdminUser(supabase);
  if (!adminUser) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Forbidden: Admin access required.' } },
      { status: 403 }
    );
  }

  // 2. Logic: We'll run our queries in parallel for speed
  console.log('Admin fetching overview data...');
  
  // Query 1: Get the 5 most recent bookings
  const recentBookingsQuery = supabase
    .from('bookings')
    .select(`
      booking_id,
      booked_at, 
      status,
      total_price,
      num_guests,
      check_in_date,
      check_out_date,
      properties ( title )
    `)
    .order('booked_at', { ascending: false }) // <-- FIXED
    .limit(5);

  // Query 2: Get the 5 most recent properties
  // Note: We need to know your properties table 'created_at' column name
  // Assuming it's 'created_at' for now.
  const recentPropertiesQuery = supabase
    .from('properties')
    .select(`
      title,
      price_per_night,
      provinces ( name )
    `)
    .order('created_at', { ascending: false }) 
    .limit(5);

  // Run both queries at the same time
  const [bookingsResult, propertiesResult] = await Promise.all([
    recentBookingsQuery,
    recentPropertiesQuery
  ]);

  // 3. Handle Errors
  if (bookingsResult.error) {
    return NextResponse.json({ success: false, message: 'error', data: { details: bookingsResult.error.message } }, { status: 500 });
  }
  if (propertiesResult.error) {
    // This might fail if your properties table also doesn't have 'created_at'
    return NextResponse.json({ success: false, message: 'error', data: { details: propertiesResult.error.message } }, { status: 500 });
  }
  
  // 4. Response: Success
  return NextResponse.json({
    success: true,
    message: 'Overview data retrieved successfully',
    data: {
      recentBookings: bookingsResult.data,
      recentProperties: propertiesResult.data
    }
  });
}
