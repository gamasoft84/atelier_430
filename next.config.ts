import type { NextConfig } from "next"
import { PERMISSIONS_POLICY } from "./lib/http/permissions-policy"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "atelier430"}/**`,
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Permissions-Policy", value: PERMISSIONS_POLICY }],
      },
    ]
  },
}

export default nextConfig
