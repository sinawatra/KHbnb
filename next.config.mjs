/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Ensure Next.js doesn't force a redirect for trailing slashes
  trailingSlash: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upkmmzocmwzxpdtdfxri.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**', 
      },
    ],
  },

  // 2. Add CORS headers so localhost can talk to production
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, 
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

export default nextConfig;