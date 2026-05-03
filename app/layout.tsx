import type { Metadata } from "next"
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

export const metadata: Metadata = {
  title: {
    default: "Atelier 430",
    template: "%s | Atelier 430",
  },
  description: "430 piezas. Una sola colección. Arte curado, listo para tu hogar.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
