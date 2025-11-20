import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id: bookingId } = await params;

  const cookieStore = await cookies();
  let supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. Securely get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this booking." },
        { status: 403 }
      );
    }

    // 4. Optional: Check if it's already cancelled to avoid redundant updates
    if (booking.status === "cancelled") {
      return NextResponse.json({ message: "Booking is already cancelled." });
    }

    // 5. Update the booking status to 'cancelled'
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Booking successfully cancelled." });
  } catch (error) {
    console.error("Cancel Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
