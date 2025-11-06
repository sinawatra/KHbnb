import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// =================================================================
//  HELPER FUNCTION
// =================================================================

/**
 * Checks if the current user is an admin.
 * Returns the user object if they are an admin, otherwise null.
 */
async function getAdminUser(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();
    
  return (profile && profile.role === 'admin') ? user : null;
}

// =================================================================
//  API ENDPOINT
// =================================================================

/**
 * GET: Fetches a paginated list of all customers (users)
 * for the Admin Analytics page.
 */
export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Security: Check for admin
  const adminUser = await getAdminUser(supabase);
  if (!adminUser) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Forbidden: Admin access required.' } },
      { status: 403 }
    );
  }

  // 2. Handle Pagination
  // Get the page number from the URL (e.g., .../analytics?page=1)
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const PAGE_SIZE = 10; // You can adjust this
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 3. Logic: Fetch all users (customers)
  console.log(`Admin fetching customers, page ${page}...`);
  
  const { data: users, error, count } = await supabase
    .from('users')
    .select(
      `
      user_id,
      full_name,
      email,
      phone_number,
      created_at
    `, 
      { count: 'exact' } // Request the total count
    )
    .neq('role', 'admin') // Exclude other admins from the "customer" list
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ success: false, message: 'error', data: { details: error.message } }, { status: 500 });
  }
  
  // 4. Response: Success
  return NextResponse.json({
    success: true,
    message: 'Customers retrieved successfully',
    data: {
      customers: users,
      totalCount: count,
      pageSize: PAGE_SIZE,
      currentPage: page,
    }
  });
}