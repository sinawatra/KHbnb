import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  const cookieStore = await cookies();
  let supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let user = null;

  // 1. AUTH CHECK (Try Cookies first, then Bearer Token)
  const {
    data: { session: cookieSession },
  } = await supabase.auth.getSession();

  if (cookieSession) {
    user = cookieSession.user;
  } else {
    // Fallback for Postman/cURL
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Create temporary client to verify token
      const supabaseGeneric = createClient(supabaseUrl, serviceKey);
      const { data } = await supabaseGeneric.auth.getUser(token);

      if (data?.user) {
        user = data.user;
      }
    }
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Admin Verification
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userProfile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (userProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Fetch All Bookings
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

  // 4. Manually Fetch User Names
  const userIds = bookings.map((b) => b.user_id).filter((id) => id);

  // Use existing supabaseAdmin instance
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("user_id, full_name, email")
    .in("user_id", userIds);

  // 5. Merge the data in JavaScript
  const bookingsWithUsers = bookings.map((booking) => {
    const user = users?.find((u) => u.user_id === booking.user_id);
    return {
      ...booking,
      users: user || null,
    };
  });

  return NextResponse.json(bookingsWithUsers);
}
