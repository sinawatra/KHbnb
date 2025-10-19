import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// This function handles POST requests to /api/auth/logout
export async function POST(request) {
  // Initialize the Supabase client
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Sign out the currently logged-in user
  // This invalidates their session cookie
  await supabase.auth.signOut();

  // Return a success message
  return NextResponse.json({ message: "Logout successful" });
}
