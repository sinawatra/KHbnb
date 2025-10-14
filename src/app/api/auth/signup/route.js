import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This function handles POST requests to /api/auth/signup
export async function POST(request) {
  // Get the form data from the request body
  const { fullName, email, password, phoneNumber } = await request.json();

  // Basic validation to ensure required fields are present
  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: 'Full name, email, and password are required.' },
      { status: 400 }
    );
  }

  // Initialize the Supabase client for route handlers
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Create the user in the Supabase Authentication system
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  // Handle any errors from the Supabase Auth signUp process
  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  // 2. Add the user's profile to the public 'users' table
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: data.user.id, // Links the auth user to their profile
      full_name: fullName,
      email: data.user.email,
      phone_number: phoneNumber,
      // The 'role' column will default to 'user'
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create user profile.' }, { status: 500 });
  }

  // 3. Return a success message
  return NextResponse.json(
    { message: 'Signup successful! Please check your email to verify your account.' },
    { status: 201 }
  );
}
