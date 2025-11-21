import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // 1. AUTH CHECK
  const authResult = await getAdminUser(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adminClient: supabaseAdmin } = authResult;

  // 2. Fetch All Bookings
  const { data: bookings, error: bookingsError } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      id,
      created_at,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      status,
      user_id, 
      properties ( title )
    `
    )
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  // 3. Manually Fetch User Names
  const userIds = bookings.map((b) => b.user_id).filter((id) => id);

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("user_id, full_name, email")
    .in("user_id", userIds);

  // 4. Merge the data in JavaScript
  const bookingsWithUsers = bookings.map((booking) => {
    const user = users?.find((u) => u.user_id === booking.user_id);
    return {
      ...booking,
      users: user || null,
    };
  });

  return NextResponse.json(bookingsWithUsers);
}
