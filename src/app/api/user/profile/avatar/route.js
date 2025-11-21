import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. Get User
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get File
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Upload to Supabase
    const filePath = user.id;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage Error:", uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // 4. Get Public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // We need to manually grab .publicUrl from the returned data object
    const finalAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    // 5. Update Profile
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: finalAvatarUrl })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("DB Update Error:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, avatar_url: finalAvatarUrl });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
