import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = await params;

  // 1. AUTH CHECK
  const authResult = await getAdminUser(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adminClient: supabaseAdmin } = authResult;

  // 2. Fetch Single Booking & Property
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      *,
      properties ( * )
    `
    )
    .eq("id", id)
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  // 3. Manually Fetch User Details
  const { data: guestUser } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("user_id", booking.user_id)
    .single();

  // 4. Return Combined Data
  return NextResponse.json({
    ...booking,
    users: guestUser || null,
  });
}
