import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { fullName, email, password, phoneNumber } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: 'Full name, email, and password are required.' },
    });
  }
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: signUpError.message }, // Specific error from Supabase
    });
  }

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      user_id: data.user.id,
      full_name: fullName,
      email: data.user.email,
      phone_number: phoneNumber,
    });

  if (insertError) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: 'Failed to create user profile.' },
    });
  } return NextResponse.json({
    success: true,
    message: 'successful',
    data: { details: 'Signup complete! Please check your email to verify your account.' },
  });
}