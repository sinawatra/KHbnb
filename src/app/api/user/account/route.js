import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures dynamic cookie handling

export async function GET(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Check if a user is logged in by getting their session.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  // 2. Use the user's ID from the session to fetch their profile.
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single(); // .single() returns one object instead of an array

  if (profileError) {
    return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
  }

  // 3. Return the user's profile data.
  return NextResponse.json(userProfile);
}
