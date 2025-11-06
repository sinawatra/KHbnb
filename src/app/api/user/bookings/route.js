import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // =================================================================
  // 1. SECURITY: Check if user is logged in
  // =================================================================
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Unauthorized' } },
      { status: 401 }
    );
  }

  // =================================================================
  // 2. LOGIC: Fetch user's bookings
  // =================================================================
  
  // We don't need to add .eq('user_id', user.id) to this query.
  // Our RLS policy "Users can view their own bookings"
  // handles this for us automatically at the database level.
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      properties ( name, properties_id )
    `)
    .order('check_in_date', { ascending: false }); // Show newest first

  if (error) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: error.message } },
      { status: 500 }
    );
  }

  // =================================================================
  // 3. RESPONSE: Success
  // =================================================================
  
  return NextResponse.json({
    success: true,
    message: 'successful',
    data: bookings
  });
}