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
  let amenities = [];
  try {
    amenities = amenitiesParam ? JSON.parse(amenitiesParam) : [];
  } catch (e) {
    console.error("Failed to parse amenities JSON", e);
    amenities = [];
  }

  // 2. Premium Check Logic (Unchanged but cleaned up)
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
  const premiumAmenities = amenities.filter((a) => !FREE_AMENITIES.includes(a));

  if (premiumAmenities.length > 0) {
    try {
      const authHeader = request.headers.get("authorization");
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
      );

      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "error",
            data: { details: "Login required for premium filters" },
          },
          { status: 401 }
        );
      }

      const subscription = await getUserSubscription(user.id);
      if (!subscription.isPremium) {
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
      console.error("Auth check error:", err);
      return NextResponse.json(
        {
          success: false,
          message: "error",
          data: { details: "Authentication failed" },
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

  // Execute
  const { data: properties, error } = await query;

  if (error) {
    console.error("Query Error:", error);
    return NextResponse.json(
      { success: false, message: "error", data: { details: error.message } },
      { status: 500 }
    );
  }

  // 4. Client-side Exact Amenity Match
  let filteredProperties = properties;

  if (amenities.length > 0) {
    filteredProperties = properties.filter((property) => {
      const propertyAmenities = property.amenities || [];
      const normPropAmenities = propertyAmenities.map((a) =>
        typeof a === "string" ? a.toLowerCase() : a
      );

      return amenities.every((selectedAmenity) =>
        normPropAmenities.includes(selectedAmenity.toLowerCase())
      );
    });
  }

  return NextResponse.json({
    success: true,
    message: "successful",
    data: filteredProperties,
  });
}
