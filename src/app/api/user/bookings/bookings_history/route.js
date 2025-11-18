import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  // 1. Setup Supabase
  const cookieStore = await cookies();
  let supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let user = null;

  // 2. AUTH CHECK (Hybrid: Cookies OR Bearer Token)
  const { data: { session: cookieSession } } = await supabase.auth.getSession();

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
      const { data: { user: tokenUser } } = await supabaseGeneric.auth.getUser();
      if (tokenUser) {
        user = tokenUser;
        supabase = supabaseGeneric; // Use this client to bypass RLS if needed
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // 3. Fetch Data
  // NOTE: Check if your column is named 'created_at' or 'booked_at'. 
  // Your previous code used 'booked_at'.
  const { data, error } = await supabase
    .from("bookings")
    .select("*, properties(title)") 
    .eq("user_id", user.id) 
    .order("created_at", { ascending: false }); 

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. Return Success (Status 200)
  return NextResponse.json(
    { success: true, booking: data },
    { status: 200 }
  );
}