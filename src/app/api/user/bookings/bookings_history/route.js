import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures dynamic cookie handling

export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // 2. Fetch all bookings where the 'user_id' matches the current user.
  // This is the key security step that ensures users only see their own bookings.
  // We also fetch the 'name' of the associated property for a better user experience.
  const { data, error } = await supabase
    .from("bookings")
    .select("*, properties(title)") // Fetches all booking columns and the property's name
    .eq("user_id", session.user.id) // The crucial security filter
    .order("created_at", { ascending: false }); // Show newest first

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Return the list of bookings
  return NextResponse.json(
    { message: "successful", booking: data },
    { status: 201 }
  );
}
