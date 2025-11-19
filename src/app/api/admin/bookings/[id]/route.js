import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request, { params }) {
  const { id } = await params;

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

      const supabaseGeneric = createClient(supabaseUrl, serviceKey);
      const { data } = await supabaseGeneric.auth.getUser(token);

      if (data?.user) {
        user = data.user;
      }
    }
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Admin Verification (Service Role)
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

  // 3. Fetch Single Booking & Property
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

  // 4. Manually Fetch User Details
  const { data: guestUser } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("user_id", booking.user_id)
    .single();

  // 5. Return Combined Data
  return NextResponse.json({
    ...booking,
    users: guestUser || null,
  });
}
