import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get the property ID from the URL
  const propertyId = params.id;

  // Start building the query.
  // The RLS policy (is_featured = true) is applied automatically
  // by the database.
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      provinces ( name )
    `)
    .eq('properties_id', propertyId)
    .single(); // We only expect one result

  if (error || !property) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: 'Property not found or is not available.' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'successful',
    data: property
  });
}