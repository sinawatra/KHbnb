import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookieStore = cookies();
  // We use the 'server' client, as this is a public route
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore }); 
  
  // Get the URL search parameters
  // (e.g., /api/properties?province=Kampot&guests=2)
  const { searchParams } = new URL(request.url);
  const provinceName = searchParams.get('province');
  const guests = searchParams.get('guests');

  // Start building the query
  // We don't need .eq('is_featured', true) because our RLS policy
  // handles this for us automatically.
  let query = supabase
    .from('properties')
    .select(`
      *,
      provinces ( name )
    `);

  // Add filters if they exist
  if (provinceName) {
    // We filter on the *joined* table's name
    query = query.ilike('provinces.name', provinceName);
  }
  
  if (guests) {
    // Find properties that can host *at least* this many guests
    query = query.gte('max_guests', guests);
  }
  
  // Execute the query
  const { data: properties, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'successful',
    data: properties
  });
}