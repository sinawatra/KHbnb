import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-helper";

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

  console.log("Admin fetching all properties...");

  const { data: properties, error } = await authResult.adminClient.from(
    "properties"
  ).select(`
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
    owner_id: authResult.user.id,
  };

  const { data: newProperty, error: insertError } = await authResult.adminClient
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
    authResult.adminClient,
    images,
    newProperty.properties_id
  );

  const { data: finalProperty, error: updateError } =
    await authResult.adminClient
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
