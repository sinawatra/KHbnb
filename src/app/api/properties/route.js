import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/permission";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 1. Safe Parameter Parsing
  const { searchParams } = new URL(request.url);
  const provinceName = searchParams.get("province");

  // Parse numeric filters safely
  const guests = parseInt(searchParams.get("guests")) || 0;
  const minPrice = parseInt(searchParams.get("minPrice")) || 0;
  const maxPrice = parseInt(searchParams.get("maxPrice")) || 10000;
  const beds = searchParams.get("beds");

  // Safe JSON parse for amenities
  const amenitiesParam = searchParams.get("amenities");
  // Fix: Handle comma-separated strings instead of JSON.parse
  const amenities = amenitiesParam ? amenitiesParam.split(",") : [];

  // 2. Premium Check Logic
  const FREE_AMENITIES = [
    "no smoking",
    "smoke free",
    "no pets",
    "pets",
    "pet friendly",
    "air conditioning",
    "wifi",
    "parking",
  ];

  // Lowercase comparison to ensure safety
  const premiumAmenities = amenities.filter(
    (a) => !FREE_AMENITIES.includes(a.toLowerCase())
  );

  // console.log("--- API Request Debug ---");
  // console.log("Requested Amenities:", amenities);
  // console.log("Detected Premium Amenities:", premiumAmenities);

  if (premiumAmenities.length > 0) {
    try {
      const authHeader = request.headers.get("authorization");
      // console.log("Auth Header Present:", !!authHeader); // Log if header exists (don't log the full token for security)

      if (!authHeader) {
        console.log("Error: Missing Authorization Header");
        return NextResponse.json(
          {
            success: false,
            message: "error",
            data: { details: "Login required for premium filters (No Token)" },
          },
          { status: 401 }
        );
      }

      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      );

      const {
        data: { user },
        error: authError,
      } = await supabaseAuth.auth.getUser();

      if (authError || !user) {
        console.log("Error: User fetch failed", authError);
        return NextResponse.json(
          {
            success: false,
            message: "error",
            data: { details: "Invalid session or token expired" },
          },
          { status: 401 }
        );
      }

      // console.log("User Found:", user.id);

      const subscription = await getUserSubscription(user.id);
      // console.log("Subscription Status:", subscription);

      if (!subscription || !subscription.isPremium) {
        console.log("Error: User is not premium");
        return NextResponse.json(
          {
            success: false,
            message: "error",
            data: { details: "Premium subscription required" },
          },
          { status: 403 }
        );
      }
    } catch (err) {
      console.error("CRITICAL AUTH CRASH:", err);
      return NextResponse.json(
        {
          success: false,
          message: "error",
          data: { details: "Authentication check failed internally" },
        },
        { status: 401 }
      );
    }
  }

  // 3. Build Query
  let query = supabase
    .from("properties")
    .select(`*, provinces!inner(name)`)
    .eq("status", "Active");

  // Filters
  if (provinceName) {
    query = query.eq("provinces.name", provinceName);
  }

  if (guests > 0) {
    query = query.gte("max_guests", guests);
  }

  if (minPrice > 0) {
    query = query.gte("price_per_night", minPrice);
  }

  if (maxPrice < 10000 && maxPrice > 0) {
    query = query.lte("price_per_night", maxPrice);
  }

  if (beds && beds !== "any") {
    const bedCount = parseInt(beds);
    if (!isNaN(bedCount)) {
      query = query.gte("num_bedrooms", bedCount);
    }
  }

  if (amenities.length > 0) {
    query = query.contains("amenities", amenities);
  }

  // Then just use the direct query result:
  const { data: properties, error } = await query;

  if (error) {
    console.error("Query Error:", error);
    return NextResponse.json(
      { success: false, message: "error", data: { details: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "successful",
    data: properties,
  });
}
