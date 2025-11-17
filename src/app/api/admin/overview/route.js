import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =================================================================
//  HELPER FUNCTION
// =================================================================

/**
 * Checks if the current user is an admin.
 * Returns the user object if they are an admin, otherwise null.
 */
async function getAdminUser(supabaseCookieClient, request) {
  let user = null;

  const {
    data: { user: cookieUser },
  } = await supabaseCookieClient.auth.getUser();

  if (cookieUser) {
    user = cookieUser;
  } else {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    return null;
  }

  // Use service role client to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  console.log("Profile role:", profile?.role);

  if (profile && profile.role === "admin") {
    return { user, adminClient: supabaseAdmin };
  }

  return null;
}

// =================================================================
//  API ENDPOINT
// =================================================================

/**
 * GET: Fetches all data required for the Admin Overview dashboard.
 * This includes recent bookings and a list of properties.
 */
export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Security: Check for admin
  const authResult = await getAdminUser(supabase, request);
  if (!authResult) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  const { adminClient } = authResult;

  // 2. Logic: We'll run our queries in parallel for speed
  console.log("Admin fetching overview data...");

  // Query 1: Get the 5 most recent bookings
  const recentBookingsQuery = adminClient
    .from("bookings")
    .select(
      `
      id,
      user_id,
      property_id, 
      status,
      total_price,
      num_guests,
      check_in_date,
      check_out_date,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  // Query 2: Get the 5 most recent properties
  // Note: We need to know your properties table 'created_at' column name
  // Assuming it's 'created_at' for now.
  const recentPropertiesQuery = adminClient
    .from("properties")
    .select(
      `
      title,
      price_per_night,
      province_id
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  // Run both queries at the same time
  const [bookingsResult, propertiesResult] = await Promise.all([
    recentBookingsQuery,
    recentPropertiesQuery,
  ]);

  // 3. Handle Errors
  if (bookingsResult.error) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: bookingsResult.error.message },
      },
      { status: 500 }
    );
  }
  if (propertiesResult.error) {
    // This might fail if your properties table also doesn't have 'created_at'
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: propertiesResult.error.message },
      },
      { status: 500 }
    );
  }

  // 4. Response: Success
  return NextResponse.json({
    success: true,
    message: "Overview data retrieved successfully",
    data: {
      recentBookings: bookingsResult.data,
      recentProperties: propertiesResult.data,
    },
  });
}
