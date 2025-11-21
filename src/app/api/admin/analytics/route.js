import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth-helper";

export async function GET(request) {
  // 1. Security: Check for admin
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

  // 2. Handle Pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const PAGE_SIZE = 10;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 3. Logic: Fetch all users (customers)
  console.log(`Admin fetching customers, page ${page}...`);

  const {
    data: users,
    error,
    count,
  } = await authResult.adminClient
    .from("users")
    .select(
      `
      user_id,
      full_name,
      email,
      phone_number,
      created_at
    `,
      { count: "exact" }
    )
    .or("role.eq.user,role.is.null")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, message: "error", data: { details: error.message } },
      { status: 500 }
    );
  }

  // 4. Response: Success
  return NextResponse.json({
    success: true,
    message: "Customers retrieved successfully",
    data: {
      customers: users,
      totalCount: count,
      pageSize: PAGE_SIZE,
      currentPage: page,
    },
  });
}
