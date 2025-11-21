import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-helper";

export async function GET(request) {
  // 1. Security: Check for admin
  const authResult = await getAdminUser(request);
  if (!authResult) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );

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
      created_at,
      properties ( title )
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  // Query 2: Get the 5 most recent properties
  const recentPropertiesQuery = adminClient
    .from("properties")
    .select(
      `
      title,
      price_per_night,
      province_id,
      provinces ( name )
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
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: propertiesResult.error.message },
      },
      recentBookings,
      topProperties
    }, { status: 200, message: 'Overview data fetched successfully' });

  } catch (error) {
    console.error('Error fetching overview:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
