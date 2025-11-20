import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  const supabaseUser = createRouteHandlerClient({ cookies });

  // --- 1. Verify that the user is logged in ---
  const { data: { session } } = await supabaseUser.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- 2. Check if the user is an admin ---
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userProfile, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (userError) throw userError;

  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // --- 3. Fetch data in parallel ---
    
    // A. 5 most recent bookings
    const recentBookingsPromise = supabaseUser
      .from('bookings')
      .select(`
        property_id, created_at, status, total_price, 
        check_in_date, check_out_date, 
        properties ( title )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // B. All confirmed bookings (for stats)
    const confirmedBookingsPromise = supabaseUser
      .from('bookings')
      .select('total_price, num_guests, property_id')
      .eq('status', 'confirmed');

    // C. All properties (for totals and rankings)
    const allPropertiesPromise = supabaseUser
      .from('properties')
      .select('properties_id, title, price_per_night, provinces ( name )');

    const [recentRes, confirmedRes, propertiesRes] = await Promise.all([
      recentBookingsPromise,
      confirmedBookingsPromise,
      allPropertiesPromise
    ]);

    if (recentRes.error) throw recentRes.error;
    if (confirmedRes.error) throw confirmedRes.error;
    if (propertiesRes.error) throw propertiesRes.error;

    const recentBookings = recentRes.data;
    const confirmedBookings = confirmedRes.data;
    const allProperties = propertiesRes.data;

    // --- 4. Calculate stats ---
    const totalProperties = allProperties.length;
    const activeBookings = confirmedBookings.length;

    const totalRevenue = confirmedBookings.reduce(
      (sum, booking) => sum + (Number(booking.total_price) || 0),
      0
    );

    const totalGuests = confirmedBookings.reduce(
      (sum, booking) => sum + (Number(booking.num_guests) || 0),
      0
    );

    // --- 5. Determine top properties ---
    const bookingCounts = confirmedBookings.reduce((acc, booking) => {
      const propId = booking.property_id;
      acc[propId] = (acc[propId] || 0) + 1;
      return acc;
    }, {});

    const propertiesWithStats = allProperties.map(prop => ({
      ...prop,
      bookingCount: bookingCounts[prop.properties_id] || 0
    }));

    const topProperties = propertiesWithStats
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // --- 6. Return the response ---
    return NextResponse.json({
      stats: {
        totalProperties,
        activeBookings,
        totalGuests,
        revenue: totalRevenue
      },
      recentBookings,
      topProperties
    }, { status: 200, message: 'Overview data fetched successfully' });

  } catch (error) {
    console.error('Error fetching overview:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
