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

  // Query 3: Get the total booking volume from confirmed bookings
  const totalBookingVolumeQuery = adminClient
    .from("bookings")
    .select("total_price")
    .eq("status", "confirmed");

  // Query 4: Get the total number of guests
  const totalGuestsQuery = adminClient.from("bookings").select("num_guests");

  // Query 5: Get platform service fee revenue
  const platformRevenueQuery = adminClient
    .from("bookings")
    .select("platform_revenue")
    .eq("status", "confirmed");

  // Query 6: Get total bookings
  const totalBookingQuery = adminClient.from("bookings").select("*");

  // Query 7: Get total properties
  const totalPropertiesQuery = adminClient.from("properties").select("*");

  // Run both queries at the same time
  const [
    bookingsResult,
    propertiesResult,
    bookingVolumeResult,
    guestsResult,
    revenueResult,
    totalBookingsResult,
    totalPropertiesResult,
  ] = await Promise.all([
    recentBookingsQuery,
    recentPropertiesQuery,
    totalBookingVolumeQuery,
    totalGuestsQuery,
    platformRevenueQuery,
    totalBookingQuery,
    totalPropertiesQuery,
  ]);

  const totalBookingVolume =
    bookingVolumeResult.data?.reduce(
      (sum, b) => sum + (b.total_price || 0),
      0
    ) || 0;
  const totalGuests =
    guestsResult.data?.reduce((sum, b) => sum + (b.num_guests || 0), 0) || 0;
  const totalRevenue =
    revenueResult.data?.reduce(
      (sum, b) => sum + (b.platform_revenue || 0),
      0
    ) || 0;
  const totalBookings = totalBookingsResult.data?.length || 0;
  const totalProperties = totalPropertiesResult.data?.length || 0;

  // 3. Handle Errors
  if (
    bookingsResult.error ||
    propertiesResult.error ||
    bookingVolumeResult.error ||
    guestsResult.error ||
    revenueResult.error ||
    totalBookingsResult.error ||
    totalPropertiesResult.error
  ) {
    const error =
      bookingsResult.error ||
      propertiesResult.error ||
      bookingVolumeResult.error ||
      guestsResult.error ||
      revenueResult.error ||
      totalBookingsResult.error ||
      totalPropertiesResult.error;
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: error.message },
      },
      { status: 500 }
    );
  }

  // 4. Response: Success
  return NextResponse.json({
    success: true,
    message: "Overview data retrieved successfully",
    data: {
      totalBookingVolume,
      totalGuests,
      totalRevenue,
      totalBookings,
      totalProperties,
      recentBookings: bookingsResult.data,
      recentProperties: propertiesResult.data,
    },
  });
}
