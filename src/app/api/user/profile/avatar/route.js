import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "error", data: { details: "Unauthorized" } },
      { status: 401 }
    );
  }

  // 2. Get the file from the request
  const formData = await request.formData();
  const file = formData.get("avatar"); // 'avatar' must match the key in Postman

  if (!file) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "No file provided." },
      },
      { status: 400 }
    );
  }

  // 3. Upload the file to Supabase Storage
  const filePath = `avatar_${user.id}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars") // The bucket name
    .upload(filePath, file, {
      upsert: true, // This will overwrite the user's old avatar
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: uploadError.message },
      },
      { status: 500 }
    );
  }

  // 4. Get the public URL of the uploaded file
  const { data: publicUrl } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // 5. Update the user's profile in the 'users' table
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, avatar_url: avatarUrl });
}