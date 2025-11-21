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

};

export default nextConfig;