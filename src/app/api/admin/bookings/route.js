import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  const supabaseUserClient = createRouteHandlerClient({ cookies });

  // 1. Verify Admin
  const { data: { session } } = await supabaseUserClient.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Fetch All Bookings (Without joining 'users' to avoid the relationship error)
  const { data: bookings, error: bookingsError } = await supabaseUserClient
    .from('bookings')
    .select(`
      id,
      created_at,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      status,
      user_id, 
      properties ( title )
    `)
    .order('created_at', { ascending: false });

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  // 3. Manually Fetch User Names
  // This bypasses the schema relationship error by fetching users separately
  const userIds = bookings.map(b => b.user_id).filter(id => id); // Get list of user IDs
  
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('user_id, full_name, email')
    .in('user_id', userIds);

  // 4. Merge the data in JavaScript
  const bookingsWithUsers = bookings.map(booking => {
    const user = users?.find(u => u.user_id === booking.user_id);
    return {
      ...booking,
      users: user || null // Attach the user object manually
    };
  });

  return NextResponse.json(bookingsWithUsers);
}