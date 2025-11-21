import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function getAuthenticatedUser(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Try cookie session first
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    return { user: session.user, supabase };
  }

  // Fallback to Bearer token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data?.user) {
      return { user: data.user, supabase: supabaseAdmin };
    }
  }

  return null;
}
