import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { fullName, email, password } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: 'Full name, email, and password are required.' },
    });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // ONLY Step 1 is needed now. The trigger handles the rest.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // Pass full_name to the trigger
      }
    }
  });

  if (error) {
    return NextResponse.json({
      success: false,
      message: 'error',
      data: { details: error.message },
    });
  }

  // SUCCESS RESPONSE
  return NextResponse.json({
    success: true,
    message: 'successful',
    data: { details: 'Signup complete! Please check your email to verify your account.' },
  });
}