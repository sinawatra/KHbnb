import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // 2. Fetch all bookings where the 'user_id' matches the current user.
  const { data, error } = await supabase
    .from("bookings")
    .select("*, properties(title, image_urls)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Return the list of bookings
  return NextResponse.json(
    { message: "successful", booking: data },
    { status: 201 }
  );
}
