import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendBookingReceipt } from "@/lib/sendReceipt";

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
    const body = await request.json();
    const {
      property_id,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      platform_revenue,
      billing_address_line1,
      billing_city,
      billing_country,
      billing_postal_code,
    } = body;

    // --- Step 3: Insert the new booking ---
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: session.user.id,
        property_id,
        check_in_date,
        check_out_date,
        num_guests,
        total_price,
        platform_revenue,
        status: "pending",
        billing_address_line1,
        billing_city,
        billing_country,
        billing_postal_code,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking.", details: bookingError.message },
        { status: 500 }
      );
    }

    // --- Step 4: Fetch Property Details for the Email ---
    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("title, host_name, price_per_night, provinces(name)")
      .eq("properties_id", property_id)
      .single();

    if (propertyError) {
      console.error(
        "Could not fetch property details for email:",
        propertyError
      );
    }

    // --- Step 5: Send the Email ---
    if (propertyData) {
      sendBookingReceipt(
        session.user.email,
        {
          property: propertyData,
          check_in_date,
          check_out_date,
          num_guests,
        },
        total_price
      );
    }

    return NextResponse.json(
      { message: "Booking created successfully.", booking: bookingData },
      { status: 201 }
    );
  } catch (err) {
    console.error("General Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
