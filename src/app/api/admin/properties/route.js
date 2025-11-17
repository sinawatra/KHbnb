import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAdminUser(supabase, request) {
  // Try to get user from session (cookies) first
  let user = null;
  const {
    data: { user: cookieUser },
  } = await supabase.auth.getUser();

  if (cookieUser) {
    user = cookieUser;
  } else {
    // If no cookie session, check Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user: tokenUser },
      } = await supabase.auth.getUser(token);
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
    return imageUrls; // No images, just return empty array
  }

  console.log(
    `Uploading ${images.length} images for property ${propertyId}...`
  );

  // We use Promise.all to run all uploads in parallel
  await Promise.all(
    images.map(async (image) => {
      if (!image || image.size === 0) return; // Skip empty file inputs

      const fileName = `${propertyId}/${Date.now()}-${image.name}`;

      const { error } = await supabase.storage
        .from("properties")
        .upload(fileName, image);

      if (error) {
        console.error(`Failed to upload ${image.name}:`, error.message);
      } else {
        // If upload is successful, get the public URL
        const { data: publicUrlData } = supabase.storage
          .from("properties")
          .getPublicUrl(fileName);
        imageUrls.push(publicUrlData.publicUrl);
      }
    })
  );

  return imageUrls;
}

/**
 * GET: Handles fetching all properties for the admin dashboard.
 */
export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Security: Check for admin
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

  // 2. Logic: Fetch all properties
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

  // 3. Response: Success
  return NextResponse.json({
    success: true,
    message: "successful",
    data: properties,
  });
}

/**
 * POST: Handles creating a new property.
 */
export async function POST(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Security: Check for admin
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

  // 2. Parse the Form Data
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

  // 3. Create the Property
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

  // 4. Upload Images
  const imageUrls = await uploadPropertyImages(
    supabase,
    images,
    newProperty.properties_id
  );

  // 5. Final Step: Update property with image URLs
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

  // 6. All done!
  return NextResponse.json({
    success: true,
    message: "Property created successfully",
    data: finalProperty,
  });
}
