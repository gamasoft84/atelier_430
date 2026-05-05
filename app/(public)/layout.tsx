import PublicHeader from "@/components/public/PublicHeader"
import PublicFooter from "@/components/public/PublicFooter"
import WhatsAppFloat from "@/components/public/WhatsAppFloat"
import { WishlistProvider } from "@/components/public/WishlistProvider"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <div className="flex flex-col min-h-screen">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
        <WhatsAppFloat />
      </div>
    </WishlistProvider>
  )
}
