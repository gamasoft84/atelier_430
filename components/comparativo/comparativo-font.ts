import { Cormorant_Garamond } from "next/font/google"

export const comparativoSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-comparativo",
  display: "swap",
})
