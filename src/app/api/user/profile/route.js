import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET: Read User Profile
export async function GET(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { success: false, error: "User profile not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: profile });
}

// PUT: Update User Profile
export async function PUT(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get data from body
  const { full_name, phone_number } = await request.json();

  const { data: updatedProfile, error } = await supabase
    .from("users")
    .update({
      full_name,
      phone_number,
      updated_at: new Date(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
    data: updatedProfile,
  });
}

// DELETE: Delete User Account
export async function DELETE(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

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

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  );

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    message: "Account deleted successfully",
  });
}
