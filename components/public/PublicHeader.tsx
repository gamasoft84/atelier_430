import Link from "next/link"

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-display text-xl text-carbon-900 tracking-wide hover:text-gold-500 transition-colors"
          >
            Atelier 430
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-stone-600 hover:text-carbon-900 transition-colors"
            >
              Catálogo
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
