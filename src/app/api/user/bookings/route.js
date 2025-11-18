import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // 1. NEXT.JS 15: Await cookies
    const cookieStore = await cookies();
    let supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    let user = null;

    // 2. AUTH CHECK (Hybrid: Cookies OR Bearer Token)
    const {
      data: { session: cookieSession },
    } = await supabase.auth.getSession();

    if (cookieSession) {
      user = cookieSession.user;
    } else {
      // Fallback for Postman/cURL
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const supabaseGeneric = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          { global: { headers: { Authorization: authHeader } } }
        );
        const {
          data: { user: tokenUser },
        } = await supabaseGeneric.auth.getUser();
        if (tokenUser) {
          user = tokenUser;
          supabase = supabaseGeneric;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // --- Step 3: Get input ---
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

    // --- Step 4: Insert ---
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        property_id,
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
