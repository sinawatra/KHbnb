import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  let userId = null;

  // 1. Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    userId = session.user.id;
  } else {
    // Check for Bearer token
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
      }
    }
  }

  if (!userId) {
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
