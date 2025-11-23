import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUserSubscription } from "@/lib/permission";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ isPremium: false, tier: "free" });
    }

    const subscription = await getUserSubscription(user.id);

    return NextResponse.json(subscription);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ isPremium: false, tier: "free" });
  }
}
