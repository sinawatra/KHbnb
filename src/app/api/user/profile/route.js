import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// =================================================================
// GET Function (Read User Profile)
// =================================================================
export async function GET(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Unauthorized' } },
      { status: 401 }
    );
  }

  // 2. Fetch their profile from the 'users' table
  // Our RLS policy "Users can view their own profile"
  // automatically handles the security.
  const { data: profile, error } = await supabase
    .from('users')
    .select('*') // Get all columns (full_name, email, phone_number, etc.)
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'User profile not found.' } },
      { status: 404 }
    );
  }

  // 3. Return the profile data
  return NextResponse.json({
    success: true,
    message: 'successful',
    data: profile
  });
}

// =================================================================
// PUT Function (Update User Profile)
// =================================================================
export async function PUT(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Unauthorized' } },
      { status: 401 }
    );
  }

  // 2. Get the new data from the request body
  const { full_name, phone_number } = await request.json();

  // 3. Update the user's profile
  // Our RLS policy "Users can update their own profile"
  // ensures they can only update their own row.
  const { data: updatedProfile, error } = await supabase
    .from('users')
    .update({
      full_name: full_name,
      phone_number: phone_number,
      updated_at: new Date() // Manually set the updated_at timestamp
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: error.message } },
      { status: 500 }
    );
  }

  // 4. Return the *updated* profile data
  return NextResponse.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile
  });
}

// =================================================================
// DELETE Function (Delete User Account)
// =================================================================
export async function DELETE(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Get the logged-in user (to confirm who they are)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Unauthorized' } },
      { status: 401 }
    );
  }

  // 2. Create a Supabase "Admin Client"
  // This client uses the Service Role key to bypass all RLS policies
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // 3. Call the admin function to delete the user
  // This one command will delete the user from 'auth.users'
  // and our "ON DELETE CASCADE" rules will automatically
  // delete their profile, bookings, payments, etc.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  );

  if (deleteError) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: deleteError.message } },
      { status: 500 }
    );
  }
  
  // 4. Clear the user's auth cookie
  const response = NextResponse.json({
    success: true,
    message: 'Account deleted successfully',
    data: null
  });
  
  response.cookies.delete('sb-upkmmzocmwzxpdtdfxri-auth-token'); // Clear the session
  
  return response;
}