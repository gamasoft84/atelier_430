import type { Metadata, Viewport } from "next"
import { Sora, Playfair_Display } from "next/font/google"
import { WishlistProvider } from "@/components/public/WishlistProvider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

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
