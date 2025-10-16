import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: 'Email and password are required.' },
    });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: 'Invalid login credentials.' },
    });
  }

  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError || !profileData) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: 'Could not find user profile.' },
    });
  } return NextResponse.json({
    success: true,
    message: 'successful',
    data: {
      session: authData.session,
      role: profileData.role,
    },
  });
}