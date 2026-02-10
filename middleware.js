import { NextResponse } from "next/server";

export function middleware(request) {
  // Check if the request is for an API route
  if (request.nextUrl.pathname.startsWith('/api')) {
    // 1. Get the origin of the app making the request
    const origin = request.headers.get("origin");

    // 2. Handle "Preflight" (OPTIONS) Requests
    // Browsers send this first to check if they are allowed to connect.
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    // 3. Handle the Actual Request
    const response = NextResponse.next();

    // If an origin exists, mirror it back to allow credentials
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version");
    }

    return response;
  }
  
  // For all other routes, just continue
  return NextResponse.next();
}

export const config = {
  // Match API routes for CORS handling
  matcher: ['/api/:path*']
};
