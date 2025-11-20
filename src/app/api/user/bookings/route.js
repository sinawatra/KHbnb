import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // --- Step 1: Check if the user is logged in ---
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // --- Step 2: Get all the booking details ---
    const {
      property_id,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      billing_address_line1,
      billing_city,
      billing_country,
      billing_postal_code,
    } = await request.json();

    // Debugging log to see what the SERVER received
    console.log("SERVER RECEIVED Property ID:", property_id);

    // --- Step 3: Insert the new booking ---
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: session.user.id,
        property_id, // This was failing because it was null
        check_in_date,
        check_out_date,
        num_guests,
        total_price,
        status: "pending",
        billing_address_line1,
        billing_city,
        billing_country,
        billing_postal_code,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      return NextResponse.json(
        { error: "Failed to create booking.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Booking created successfully.", booking: data },
      { status: 201 }
    );
  } catch (err) {
    console.error("General Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
