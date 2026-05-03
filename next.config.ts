import type { NextConfig } from "next"

/**
 * Política explícita sin `browsing-topics` (Topics API de Chrome): algunos navegadores
 * muestran aviso en consola si el edge envía esa directiva y ellos no la reconocen.
 * `camera` y `xr-spatial-tracking` en self ayudan a model-viewer / AR en el mismo origen.
 */
const permissionsPolicy = [
  "accelerometer=(self)",
  "camera=(self)",
  "gyroscope=(self)",
  "magnetometer=(self)",
  "geolocation=()",
  "microphone=()",
  "payment=()",
  "usb=()",
  "xr-spatial-tracking=(self)",
].join(", ")

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
        headers: [{ key: "Permissions-Policy", value: permissionsPolicy }],
      },
    ]
  },
}

export default nextConfig
