import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// List of your provinces
const provinces = ['Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Kampot', 'Kep'];

export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // We will run 5 parallel queries, one for each province
    const provinceQueries = provinces.map(provinceName => {
      return supabase
        .from('properties')
        .select(`
          *,
          provinces!inner( name )
        `)
        .eq('provinces.name', provinceName)
        // RLS (is_featured=true) is still applied!
        .limit(4); // Get the top 4 for the landing page
    });
    
    const results = await Promise.all(provinceQueries);
    
    // Structure the data for the frontend
    const featuredByProvince = {
      'Phnom Penh': results[0].data,
      'Siem Reap': results[1].data,
      'Sihanoukville': results[2].data,
      'Kampot': results[3].data,
      'Kep': results[4].data,
    };
    
    // Handle any individual query errors (e.g., if one query failed)
    const errors = results.map(res => res.error).filter(Boolean);
    if (errors.length > 0) {
      throw new Error(errors.map(e => e.message).join(', '));
    }
    
    return NextResponse.json({
      success: true,
      message: 'successful',
      data: featuredByProvince
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'error', data: { details: error.message } },
      { status: 500 }
    );
  }
}