import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures dynamic cookie handling

export async function POST(request, { params }) {
  const { id: bookingId } = params; // Get the booking ID from the URL
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // 2. Fetch the booking to ensure the user owns it
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("user_id, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 3. SECURITY CHECK: Ensure the person cancelling is the one who made the booking
  if (booking.user_id !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden. You do not own this booking." },
      { status: 403 }
    );
  }

  // 4. Update the booking status to 'cancelled'
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // TODO: Add logic here to trigger a refund with Stripe if the status was 'confirmed'

  return NextResponse.json({ message: "Booking successfully cancelled." });
}
