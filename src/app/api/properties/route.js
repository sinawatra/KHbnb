import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/permission";

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get the URL search parameters
  const { searchParams } = new URL(request.url);
  const provinceName = searchParams.get("province");
  const guests = searchParams.get("guests");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const beds = searchParams.get("beds");
  const amenitiesParam = searchParams.get("amenities");

  const amenities = amenitiesParam ? JSON.parse(amenitiesParam) : [];

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
  // Check if user is trying to use premium filters
  if (premiumAmenities.length > 0) {
    try {
      const authHeader = request.headers.get("authorization");

      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: authHeader ? { Authorization: authHeader } : {},
          },
        }
      );

      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();

      if (user) {
        const subscription = await getUserSubscription(user.id);

        if (!subscription.isPremium) {
          return NextResponse.json(
            {
              success: false,
              message: "error",
              data: {
                details:
                  "Premium subscription required for advanced amenity filters",
              },
            },
            { status: 403 }
          );
        }
      } else {
        // Not logged in but trying to use premium filters
        return NextResponse.json(
          {
            success: false,
            message: "error",
            data: {
              details:
                "Login and premium subscription required for advanced amenity filters",
            },
          },
          { status: 401 }
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

  // Start building the query
  let query = supabase
    .from("properties")
    .select(
      `
      *,
      provinces!inner ( name )
    `
    )
    .eq("status", "Active");

  // Add filters if they exist
  if (provinceName) {
    query = query.eq("provinces.name", provinceName);
  }

  if (guests) {
    query = query.gte("max_guests", guests);
  }

  if (minPrice) {
    query = query.gte("price_per_night", minPrice);
  }

  if (maxPrice) {
    query = query.lte("price_per_night", maxPrice);
  }

  if (beds && beds !== "any") {
    query = query.gte("num_bedrooms", beds);
  }

  // Execute the query
  const { data: properties, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, message: "error", data: { details: error.message } },
      { status: 500 }
    );
  }

  // Client-side amenity filtering (Supabase doesn't support array contains all)
  let filteredProperties = properties;

  if (amenities.length > 0) {
    filteredProperties = properties.filter((property) => {
      const propertyAmenities = property.amenities || [];

      // Check if property has ALL selected amenities
      return amenities.every((selectedAmenity) =>
        propertyAmenities.some(
          (propertyAmenity) =>
            propertyAmenity.toLowerCase() === selectedAmenity.toLowerCase()
        )
      );
    });
  }

  return NextResponse.json({
    success: true,
    message: "successful",
    data: filteredProperties,
  });
}
