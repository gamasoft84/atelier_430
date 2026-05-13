import Link from "next/link"
import PublicHeaderNav from "@/components/public/PublicHeaderNav"

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-cream/95 backdrop-blur-sm pt-[calc(env(safe-area-inset-top,0px)+0.375rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-display text-xl text-carbon-900 tracking-wide hover:text-gold-500 transition-colors"
          >
            Atelier 430
          </Link>

          <PublicHeaderNav />
        </div>
      </div>
    </header>
  )
}
