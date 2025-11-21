import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-helper";
import { createClient } from "@supabase/supabase-js";

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

async function deletePropertyImages(supabase, imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/properties/`;
  const filePaths = imageUrls.map((url) => url.replace(bucketUrl, ""));

  const { error } = await supabase.storage.from("properties").remove(filePaths);

  if (error) {
    console.error("Failed to delete images:", error.message);
  }
}

export async function GET(request, { params }) {
  const { id: propertyId } = await params;

  const authResult = await getAdminUser(request);
  if (!authResult) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  const { data: property, error } = await authResult.adminClient
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

  return NextResponse.json({
    success: true,
    message: "successful",
    data: property,
  });
}

export async function PUT(request, { params }) {
  const { id: propertyId } = await params;

  const authResult = await getAdminUser(request);
  if (!authResult) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  const { data: currentProperty, error: fetchError } =
    await authResult.adminClient
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

  const formData = await request.formData();

  const propertyUpdates = {};

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

  if (formData.has("amenities")) {
    propertyUpdates.amenities = JSON.parse(formData.get("amenities") || "[]");
  }

  const newImages = formData.getAll("images");
  const imagesToRemove = JSON.parse(formData.get("images_to_remove") || "[]");

  if (newImages.length > 0 || imagesToRemove.length > 0) {
    const newImageUrls = await uploadPropertyImages(
      authResult.adminClient,
      newImages,
      propertyId
    );

    await deletePropertyImages(authResult.adminClient, imagesToRemove);

    const currentImageUrls = currentProperty.image_urls || [];
    propertyUpdates.image_urls = [
      ...currentImageUrls.filter((url) => !imagesToRemove.includes(url)),
      ...newImageUrls,
    ];
  }

  const { data: updatedProperty, error: updateError } =
    await authResult.adminClient
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

  return NextResponse.json({
    success: true,
    message: "Property updated successfully",
    data: updatedProperty,
  });
}

export async function DELETE(request, { params }) {
  const { id: propertyId } = await params;

  const authResult = await getAdminUser(request);
  if (!authResult) {
    return NextResponse.json(
      {
        success: false,
        message: "error",
        data: { details: "Forbidden: Admin access required." },
      },
      { status: 403 }
    );
  }

  const { error: bookingDeleteError } = await authResult.adminClient
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

  const { data: files, error: listError } = await authResult.adminClient.storage
    .from("properties")
    .list(propertyId);

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${propertyId}/${file.name}`);
    await authResult.adminClient.storage.from("properties").remove(filePaths);
  }

  const { error: deleteError } = await authResult.adminClient
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

  return NextResponse.json({
    success: true,
    message: "Property and all associated images deleted successfully",
  });
}
