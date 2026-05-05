import Link from "next/link"
import { Suspense } from "react"
import ArtworkCard from "@/components/public/ArtworkCard"
import CategorySection from "@/components/public/CategorySection"
import NewsletterForm from "@/components/public/NewsletterForm"
import {
  getAvailableCount,
  getFeaturedArtworks,
  getCategoryStats,
  getShowPrices,
} from "@/lib/supabase/queries/public"

// ─── Hero ──────────────────────────────────────────────────────────────────

async function HeroCounter() {
  const count = await getAvailableCount()
  return (
    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gold-100 text-gold-500 border border-gold-500/20">
      {count} obras disponibles
    </span>
  )
}

function HeroSection() {
  return (
    <section className="relative bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl space-y-6">
          <Suspense
            fallback={
              <span className="inline-block px-3 py-1 rounded-full text-sm bg-stone-100 text-stone-400 w-40 h-7 animate-pulse" />
            }
          >
            <HeroCounter />
          </Suspense>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-carbon-900 leading-tight">
            Arte curado,
            <br />
            <span className="text-gold-500">listo para tu hogar</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-lg">
            Piezas seleccionadas de paisajes nacionales, arte religioso,
            reproducciones europeas y arte moderno. Todas listas para colgar.
          </p>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-500 text-white font-semibold text-sm hover:bg-gold-400 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-stone-200 to-transparent hidden lg:block" />
    </section>
  )
}

// ─── Featured artworks ─────────────────────────────────────────────────────

async function FeaturedSection() {
  const [artworks, showPrices] = await Promise.all([
    getFeaturedArtworks(8),
    getShowPrices(),
  ])

  if (artworks.length === 0) return null

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl sm:text-3xl text-carbon-900">Obras destacadas</h2>
        <Link
          href="/catalogo"
          className="text-sm font-medium text-gold-500 hover:text-gold-400 transition-colors"
        >
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {artworks.map((artwork, i) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            showPrice={showPrices}
            priority={i < 4}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const stats = await getCategoryStats()

  return (
    <>
      <HeroSection />

      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedSection />
      </Suspense>

      <div className="border-t border-stone-100" />

      <CategorySection stats={stats} />

      <div className="border-t border-stone-100" />

      {/* Newsletter */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-xl">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Mantente al tanto
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-carbon-900 mb-3">
            Obras nuevas, primero tú
          </h2>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            Avisamos cuando llegan piezas nuevas o hay precios especiales.
            Sin spam — solo arte.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}

function FeaturedSkeleton() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="h-8 w-48 bg-stone-200 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-stone-200 rounded-lg animate-pulse" />
            <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  )
}
