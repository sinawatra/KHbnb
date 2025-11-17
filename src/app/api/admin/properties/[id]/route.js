import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// =================================================================
//  HELPER FUNCTIONS (for clean code)
// =================================================================

/**
 * Checks if the current user is an admin.
 * Returns the user object if they are an admin, otherwise null.
 */
async function getAdminUser(request) {
  let user = null;

  // 1. Get Token from Authorization Header (The only source for curl)
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // 2. Client to Validate Token (Must use Service Role Key)
    const supabaseAdminAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. Validate the Token
    const { data } = await supabaseAdminAuth.auth.getUser(token);

    if (data?.user) {
      user = data.user;
    }
  }

  if (!user) {
    return null;
  }

  // 4. Client for Role Check (Must use Service Role Key to bypass RLS)
  const supabaseAdminRoleCheck = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabaseAdminRoleCheck
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  console.log("Profile role:", profile?.role);

  return profile && profile.role === "admin" ? user : null;
}

/**
 * Uploads an array of new image files to a property's folder.
 * Returns an array of public URLs.
 */
async function uploadPropertyImages(supabase, images, propertyId) {
  const imageUrls = [];
  if (!images || images.length === 0) {
    return imageUrls;
  }

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

/**
 * Deletes an array of images from storage.
 * The `imageUrls` are the full public URLs.
 */
async function deletePropertyImages(supabase, imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  // Extract the 'path' (e.g., '123/image.png') from the full URL
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/properties/`;
  const filePaths = imageUrls.map((url) => url.replace(bucketUrl, ""));

  const { error } = await supabase.storage.from("properties").remove(filePaths);

  if (error) {
    console.error("Failed to delete images:", error.message);
  }
}

// =================================================================
// MAIN API ENDPOINTS
// =================================================================

/**
 * GET: Fetches a single property's details.
 * (Used to fill the "Edit Property" form [cite: image_e0dd09.png])
 */
export async function GET(request) {
  const urlParts = new URL(request.url).pathname.split("/");
  const propertyId = urlParts[urlParts.length - 1];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Security: Check for admin
  if (!(await getAdminUser(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  // 2. Logic: Fetch this specific property
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("properties_id", propertyId)
    .single();

  if (error || !property) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Property not found." },
      },
      { status: 404 }
    );
  }

  // 3. Response: Success
  return NextResponse.json({
    success: true,
    message: "successful",
    data: property,
  });
}

/**
 * PUT: Handles updating an existing property from the edit form.
 */
export async function PUT(request) {
  const urlParts = new URL(request.url).pathname.split("/");
  const propertyId = urlParts[urlParts.length - 1];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Security: Check for admin
  if (!(await getAdminUser(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  // 2. Fetch current property (we need its old image list)
  const { data: currentProperty, error: fetchError } = await supabase
    .from("properties")
    .select("image_urls")
    .eq("properties_id", propertyId)
    .single();

  if (fetchError) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Property not found." },
      },
      { status: 404 }
    );
  }

  // 3. Parse the Form Data
  const formData = await request.formData();

  // This is a much cleaner way to build the update object.
  // It only adds fields that are actually in the form.
  const propertyUpdates = {};

  // Handle strings
  if (formData.has("title")) propertyUpdates.title = formData.get("title");
  if (formData.has("description"))
    propertyUpdates.description = formData.get("description");
  if (formData.has("host_name"))
    propertyUpdates.host_name = formData.get("host_name");
  if (formData.has("host_phone"))
    propertyUpdates.host_phone = formData.get("host_phone");
  if (formData.has("host_email"))
    propertyUpdates.host_email = formData.get("host_email");
  if (formData.has("status")) propertyUpdates.status = formData.get("status");

  // Handle numbers
  if (formData.has("price_per_night"))
    propertyUpdates.price_per_night = parseFloat(
      formData.get("price_per_night")
    );
  if (formData.has("max_guests"))
    propertyUpdates.max_guests = parseInt(formData.get("max_guests"));
  if (formData.has("num_bedrooms"))
    propertyUpdates.num_bedrooms = parseInt(formData.get("num_bedrooms"));
  if (formData.has("latitude"))
    propertyUpdates.latitude = parseFloat(formData.get("latitude"));
  if (formData.has("longitude"))
    propertyUpdates.longitude = parseFloat(formData.get("longitude"));
  if (formData.has("province_id"))
    propertyUpdates.province_id = parseInt(formData.get("province_id"));

  // Handle amenities (JSON string)
  if (formData.has("amenities")) {
    propertyUpdates.amenities = JSON.parse(formData.get("amenities") || "[]");
  }

  // 4. Handle Image Uploads & Deletions
  const newImages = formData.getAll("images");
  const imagesToRemove = JSON.parse(formData.get("images_to_remove") || "[]");

  if (newImages.length > 0 || imagesToRemove.length > 0) {
    const newImageUrls = await uploadPropertyImages(
      supabase,
      newImages,
      propertyId
    );
    await deletePropertyImages(supabase, imagesToRemove);

    const currentImageUrls = currentProperty.image_urls || [];
    propertyUpdates.image_urls = [
      ...currentImageUrls.filter((url) => !imagesToRemove.includes(url)),
      ...newImageUrls,
    ];
  }

  // 5. Update the Property in the database
  const { data: updatedProperty, error: updateError } = await supabase
    .from("properties")
    .update(propertyUpdates)
    .eq("properties_id", propertyId)
    .select("*")
    .single();

  if (updateError) {
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
    message: "Property updated successfully",
    data: updatedProperty,
  });
}

/**
 * DELETE: Deletes a property.
 */
export async function DELETE(request) {
  const urlParts = new URL(request.url).pathname.split("/");
  const propertyId = urlParts[urlParts.length - 1];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Security: Check for admin
  if (!(await getAdminUser(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  const { error: bookingDeleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("property_id", propertyId);

  if (bookingDeleteError) {
    console.error("Booking deletion failed:", bookingDeleteError.message);
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: {
          details: `Failed to clean up bookings: ${bookingDeleteError.message}`,
        },
      },
      { status: 500 }
    );
  }

  // 2. Cleanup: Delete all images from storage
  // We do this first, in case the database delete fails
  const { data: files, error: listError } = await supabase.storage
    .from("properties")
    .list(propertyId); // List all files in the property's folder (e.g., '123/')

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${propertyId}/${file.name}`);
    await supabase.storage.from("properties").remove(filePaths);
  }

  // 3. Logic: Delete the property from the table
  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("properties_id", propertyId);

  if (deleteError) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: deleteError.message },
      },
      { status: 500 }
    );
  }

  // 4. Response: Success
  return NextResponse.json({
    success: true,
    message: "Property and all associated images deleted successfully",
  });
}
