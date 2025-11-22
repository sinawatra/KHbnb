import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Get the URL search parameters
  const { searchParams } = new URL(request.url);
  const provinceName = searchParams.get('province');
  const guests = searchParams.get('guests');

  // Start building the query
  let query = supabase
    .from('properties')
    .select(`
      *,
      provinces!inner ( name )
    `)
    .eq('status', 'Active');

  // Add filters if they exist
  if (provinceName) {
    query = query.eq('provinces.name', provinceName);
  }
  
  if (guests) {
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