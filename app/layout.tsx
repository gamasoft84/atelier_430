import type { Metadata } from "next"
import { Sora, Playfair_Display } from "next/font/google"
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
  openGraph: {
    siteName: "Atelier 430",
    locale: "es_MX",
    type: "website",
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
        {children}
      </body>
    </html>
  )
}
