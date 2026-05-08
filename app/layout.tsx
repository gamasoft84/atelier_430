import type { Metadata, Viewport } from "next"
import { Sora, Playfair_Display } from "next/font/google"
import { WishlistProvider } from "@/components/public/WishlistProvider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

type SplashDevice = { w: number; h: number; dw: number; dh: number; dpr: number }

const SPLASH_DEVICES: SplashDevice[] = [
  { w: 1290, h: 2796, dw: 430, dh: 932, dpr: 3 },
  { w: 1179, h: 2556, dw: 393, dh: 852, dpr: 3 },
  { w: 1284, h: 2778, dw: 428, dh: 926, dpr: 3 },
  { w: 1170, h: 2532, dw: 390, dh: 844, dpr: 3 },
  { w: 1125, h: 2436, dw: 375, dh: 812, dpr: 3 },
  { w: 1242, h: 2688, dw: 414, dh: 896, dpr: 3 },
  { w: 828, h: 1792, dw: 414, dh: 896, dpr: 2 },
  { w: 1242, h: 2208, dw: 414, dh: 736, dpr: 3 },
  { w: 750, h: 1334, dw: 375, dh: 667, dpr: 2 },
  { w: 2048, h: 2732, dw: 1024, dh: 1366, dpr: 2 },
  { w: 1668, h: 2388, dw: 834, dh: 1194, dpr: 2 },
  { w: 1640, h: 2360, dw: 820, dh: 1180, dpr: 2 },
  { w: 1668, h: 2224, dw: 834, dh: 1112, dpr: 2 },
  { w: 1620, h: 2160, dw: 810, dh: 1080, dpr: 2 },
  { w: 1536, h: 2048, dw: 768, dh: 1024, dpr: 2 },
]

const appleStartupImages = SPLASH_DEVICES.flatMap(({ w, h, dw, dh, dpr }) => [
  {
    rel: "apple-touch-startup-image",
    url: `/splash/splash-${w}x${h}.png`,
    media: `(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
  },
  {
    rel: "apple-touch-startup-image",
    url: `/splash/splash-${h}x${w}.png`,
    media: `(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: landscape)`,
  },
])

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#D4AF37",
}

export const metadata: Metadata = {
  title: {
    default: "Atelier 430",
    template: "%s | Atelier 430",
  },
  description: "430 piezas. Una sola colección. Arte curado, listo para tu hogar.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  manifest: "/manifest.json",
  applicationName: "Atelier 430",
  appleWebApp: {
    capable: true,
    title: "Atelier 430",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: appleStartupImages,
  },
  openGraph: {
    siteName: "Atelier 430",
    locale: "es_MX",
    type: "website",
    title: "Atelier 430",
    description: "430 piezas. Una sola colección. Arte curado, listo para tu hogar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier 430",
    description: "430 piezas. Una sola colección. Arte curado, listo para tu hogar.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${sora.variable} ${playfair.variable} font-sans antialiased`}>
        <WishlistProvider>
          {children}
          <Toaster position="top-center" richColors className="font-sans" />
        </WishlistProvider>
      </body>
    </html>
  )
}
