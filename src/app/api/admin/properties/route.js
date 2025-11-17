import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAdminUser(supabase, request) {
  let user = null;

  // Try cookie-based auth first (for browser)
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser();

  if (cookieUser) {
    user = cookieUser;
  } else {
    // Check Authorization header (for external apps/API calls)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Create a new supabase client with the token
      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      const {
        data: { user: tokenUser },
      } = await supabaseWithToken.auth.getUser();
      user = tokenUser;
    }
  }

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return profile && profile.role === "admin" ? user : null;
}

async function uploadPropertyImages(supabase, images, propertyId) {
  const imageUrls = [];
  if (!images || images.length === 0) {
    return imageUrls;
  }

  console.log(
    `Uploading ${images.length} images for property ${propertyId}...`
  );

  await Promise.all(
    images.map(async (image) => {
      if (!image || image.size === 0) return;

      const fileName = `${propertyId}/${Date.now()}-${image.name}`;

      const { error } = await supabase.storage
        .from("properties")
        .upload(fileName, image);

      if (error) {
        console.error(`Failed to upload ${image.name}:`, error.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("properties")
          .getPublicUrl(fileName);
        imageUrls.push(publicUrlData.publicUrl);
      }
    })
  );

  return imageUrls;
}

export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminUser = await getAdminUser(supabase, request);
  if (!adminUser) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  console.log("Admin fetching all properties...");
  const { data: properties, error } = await supabase.from("properties").select(`
      *,
      provinces ( name )
    `);

  if (error) {
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

export async function POST(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const adminUser = await getAdminUser(supabase, request);
  if (!adminUser) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const images = formData.getAll("images");
  const amenities = JSON.parse(formData.get("amenities") || "[]");

  const propertyData = {
    title: formData.get("title"),
    description: formData.get("description"),
    price_per_night: parseFloat(formData.get("price_per_night")),
    max_guests: parseInt(formData.get("max_guests")),
    num_bedrooms: parseInt(formData.get("num_bedrooms")),
    amenities: amenities,
    latitude: parseFloat(formData.get("latitude")),
    longitude: parseFloat(formData.get("longitude")),
    province_id: parseInt(formData.get("province_id")),
    host_name: formData.get("host_name"),
    host_phone: formData.get("host_phone"),
    host_email: formData.get("host_email"),
    status: formData.get("status"),
    owner_id: adminUser.id,
  };

  const { data: newProperty, error: insertError } = await supabase
    .from("properties")
    .insert(propertyData)
    .select()
    .single();

  if (insertError) {
    console.error("Property insert error:", insertError.message);
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: insertError.message },
      },
      { status: 500 }
    );
  }

  const imageUrls = await uploadPropertyImages(
    supabase,
    images,
    newProperty.properties_id
  );

  const { data: finalProperty, error: updateError } = await supabase
    .from("properties")
    .update({ image_urls: imageUrls })
    .eq("properties_id", newProperty.properties_id)
    .select("*, provinces(name)")
    .single();

  if (updateError) {
    console.error("Image URL update error:", updateError.message);
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: updateError.message },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Property created successfully",
    data: finalProperty,
  });
}
