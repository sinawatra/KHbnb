import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This function handles POST requests to /api/auth/login
export async function POST(request) {
  // Get the credentials from the request body
  const { email, password } = await request.json();

  // Basic validation
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  // Initialize the Supabase client
  const supabase = createRouteHandlerClient({ cookies });

  // Attempt to sign in the user with their email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle any login errors (e.g., incorrect password, user not found)
  if (error) {
    return NextResponse.json(
      { error: 'Invalid login credentials. Please check your email and password.' },
      { status: 401 } // 401 status means "Unauthorized"
    );
  }

  // If login is successful, return the user's session information
  return NextResponse.json({
    message: 'Login successful!',
    session: data.session,
  });
}
