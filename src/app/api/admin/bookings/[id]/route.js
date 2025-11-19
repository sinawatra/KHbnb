import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request, { params }) {
  const { id } = params; // Booking ID
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

  // 2. Fetch Single Booking & Property
  const { data: booking, error: bookingError } = await supabaseUserClient
    .from('bookings')
    .select(`
      *,
      properties ( * )
    `)
    .eq('id', id)
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  // 3. Manually Fetch User Details
  const { data: guestUser } = await supabaseUserClient
    .from('users')
    .select('*')
    .eq('user_id', booking.user_id)
    .single();

  // 4. Return Combined Data
  return NextResponse.json({
    ...booking,
    users: guestUser || null
  });
}