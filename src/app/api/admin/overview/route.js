import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// --- Environment Variable Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Key environment variables.');
}

// --- API ENDPOINT ---

export async function GET(request) {
  const supabaseUserClient = createRouteHandlerClient({ cookies });

  // --- Step 1: Securely Verify User is an Admin ---
  const { data: { session } } = await supabaseUserClient.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Correctly uses 'user_id' as you confirmed
  const { data: userProfile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', session.user.id) 
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Could not verify user role.' }, { status: 500 });
  }

  if (userProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
  }

  try {
    // --- Step 2: Define Queries to Run in Parallel ---

    // Query 1: Get the 5 most recent bookings
    const recentBookingsQuery = supabaseUserClient
      .from('bookings')
      .select(`
        id, 
        created_at, 
        status,
        total_price,
        check_in_date,
        check_out_date,
        properties ( title ) 
      `) // <-- FIX: Uses 'id', 'created_at', and 'title'
      .order('created_at', { ascending: false }) 
      .limit(5);

    // Query 2: Get a list of properties
    const propertiesQuery = supabaseUserClient
      .from('properties')
      .select(`
        title, 
        price_per_night,
        provinces ( name )
      `) // <-- FIX: Uses 'title'
      .order('title', { ascending: true }); // Order by title

    // --- Step 3: Run Both Queries at the Same Time ---
    const [bookingsResult, propertiesResult] = await Promise.all([
      recentBookingsQuery,
      propertiesQuery,
    ]);

    // Handle any errors from the parallel queries
    if (bookingsResult.error) throw bookingsResult.error;
    if (propertiesResult.error) throw propertiesResult.error;

    // --- Step 4: Return the Combined Data ---
    return NextResponse.json({
      message: 'Overview data retrieved successfully',
      recentBookings: bookingsResult.data,
      allProperties: propertiesResult.data,
    });

  } catch (error) {
    console.error('Error fetching overview data:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}