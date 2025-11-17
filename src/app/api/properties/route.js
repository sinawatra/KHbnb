import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // We use the 'server' client, as this is a public route
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Get the URL search parameters
  // (e.g., /api/properties?province=Kampot&guests=2)
  const { searchParams } = new URL(request.url);
  const provinceName = searchParams.get('province');
  const guests = searchParams.get('guests');

  // Start building the query
  let query = supabase
    .from('properties')
    .select(`
      *,
      provinces ( name )
    `)
    .eq('status', 'active');

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