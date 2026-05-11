import { notFound } from "next/navigation"
import Link from "next/link"
import { FileDown } from "lucide-react"
import type { Metadata } from "next"
import ArtworkGallery from "@/components/public/ArtworkGallery"
import ArtworkSizeBadge from "@/components/public/ArtworkSizeBadge"
import ArtworkARViewerIsland from "@/components/public/ArtworkARViewerIsland"
import ArtworkWishlistButton from "@/components/public/ArtworkWishlistButton"
import WhatsAppButton from "@/components/public/WhatsAppButton"
import ArtworkWhatsAppSetter from "@/components/public/ArtworkWhatsAppSetter"
import ShareButton from "@/components/public/ShareButton"
import RelatedArtworks from "@/components/public/RelatedArtworks"
import ViewTracker from "@/components/public/ViewTracker"
import PhotoPreviewLauncher from "@/components/public/PhotoPreview/PhotoPreviewLauncher"
import {
  getArtworkByCode,
  getPreferPremiumInCatalog,
  getRelatedArtworks,
  getShowPrices,
} from "@/lib/supabase/queries/public"
import {
  selectPrimaryImage,
  selectShowcaseImage,
} from "@/lib/images/select-showcase"

// ─── Metadata ──────────────────────────────────────────────────────────────

import { SITE_URL, SITE_NAME } from "@/lib/constants"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  const [artwork, preferPremium] = await Promise.all([
    getArtworkByCode(code),
    getPreferPremiumInCatalog(),
  ])
  if (!artwork) return { title: "Obra no encontrada" }

  const ogImage = selectShowcaseImage(artwork.images, preferPremium)
  const url = `${SITE_URL}/catalogo/${code}`
  const description = artwork.description ?? `${artwork.title} — ${SITE_NAME}`

  return {
    title: artwork.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: artwork.title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      locale: "es_MX",
      ...(ogImage && {
        images: [
          {
            url: ogImage.cloudinary_url,
            width: ogImage.width ?? 800,
            height: ogImage.height ?? 1066,
            alt: artwork.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: artwork.title,
      description,
      ...(ogImage && { images: [ogImage.cloudinary_url] }),
    },
  }
}

// ─── Labels ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  religiosa: "Religiosa",
  nacional:  "Nacional",
  europea:   "Europea",
  moderna:   "Moderna",
}

const TECHNIQUE_LABEL: Record<string, string> = {
  oleo:      "Óleo sobre tela",
  impresion: "Impresión",
  mixta:     "Técnica mixta",
  acrilico:  "Acrílico",
}

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "sold") {
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-carbon-900 text-cream">
        VENDIDA
      </span>
    )
  }
  if (status === "reserved") {
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        RESERVADA
      </span>
    )
  }
  return null
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────

function Breadcrumb({
  category,
  title,
}: {
  category: string
  title: string
}) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-6 overflow-hidden">
      <Link href="/" className="hover:text-stone-600 transition-colors whitespace-nowrap">Inicio</Link>
      <span className="flex-shrink-0">/</span>
      <Link href="/catalogo" className="hover:text-stone-600 transition-colors whitespace-nowrap">Catálogo</Link>
      <span className="flex-shrink-0">/</span>
      <Link
        href={`/catalogo?categoria=${category}`}
        className="hover:text-stone-600 transition-colors capitalize whitespace-nowrap"
      >
        {CATEGORY_LABEL[category] ?? category}
      </Link>
      <span className="flex-shrink-0">/</span>
      <span className="text-stone-600 truncate min-w-0">{title}</span>
    </nav>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const [artwork, showPrices, preferPremium] = await Promise.all([
    getArtworkByCode(code),
    getShowPrices(),
    getPreferPremiumInCatalog(),
  ])

  if (!artwork) notFound()

  const related = await getRelatedArtworks(artwork.category, artwork.id)

  const dimensions =
    artwork.width_cm && artwork.height_cm
      ? `${artwork.width_cm} × ${artwork.height_cm} cm`
      : artwork.width_cm
        ? `${artwork.width_cm} cm de ancho`
        : artwork.height_cm
          ? `${artwork.height_cm} cm de alto`
          : null

  const outerDimensions =
    artwork.has_frame &&
    artwork.frame_outer_width_cm &&
    artwork.frame_outer_height_cm
      ? `${artwork.frame_outer_width_cm} × ${artwork.frame_outer_height_cm} cm con marco`
      : null

  const isSold = artwork.status === "sold"
  const images = artwork.images ?? []
  // Imagen "para enviar" (WhatsApp, OG): depende del setting.
  const showcaseImage = selectShowcaseImage(images, preferPremium) ?? null
  // Imagen plana de la obra (sin styling) — necesaria para el "preview en tu pared".
  const flatPrimaryImage = selectPrimaryImage(images) ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ViewTracker artworkId={artwork.id} />
      <ArtworkWhatsAppSetter
        artworkId={artwork.id}
        code={artwork.code}
        title={artwork.title}
        price={artwork.price}
        showPrice={showPrices && artwork.show_price}
        widthCm={artwork.width_cm}
        heightCm={artwork.height_cm}
        hasFrame={artwork.has_frame}
        frameOuterWidthCm={artwork.frame_outer_width_cm}
        frameOuterHeightCm={artwork.frame_outer_height_cm}
        primaryImageUrl={showcaseImage?.cloudinary_url ?? null}
        pageUrl={`${SITE_URL}/catalogo/${artwork.code}`}
      />
      <Breadcrumb category={artwork.category} title={artwork.title} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Left: Gallery */}
        <div className={isSold ? "opacity-70" : ""}>
          <ArtworkGallery images={images} title={artwork.title} />
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          {/* Category + status */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">
              {CATEGORY_LABEL[artwork.category]}
            </span>
            <StatusBadge status={artwork.status} />
          </div>

          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl sm:text-4xl text-carbon-900 leading-tight flex-1">
              {artwork.title}
            </h1>
            <ArtworkWishlistButton artworkId={artwork.id} />
          </div>

          {/* Artist (optional) */}
          {artwork.artist?.trim() ? (
            <p className="text-sm text-stone-500">
              {artwork.artist.trim()}
            </p>
          ) : null}

          {/* Code */}
          <p className="text-xs text-stone-400 font-mono">{artwork.code}</p>

          {artwork.category === "religiosa" &&
            !isSold &&
            artwork.stock_quantity > 1 && (
            <p className="text-sm text-stone-600">
              {artwork.stock_quantity} piezas disponibles
            </p>
          )}

          {/* Price */}
          {showPrices && !isSold ? (
            artwork.show_price && artwork.price ? (
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-carbon-900">
                  ${artwork.price.toLocaleString("es-MX")}
                  <span className="text-sm font-normal text-stone-400 ml-1">MXN</span>
                </p>
                {artwork.original_price && artwork.original_price > artwork.price && (
                  <p className="text-sm text-stone-400 line-through">
                    ${artwork.original_price.toLocaleString("es-MX")} MXN
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Consultar precio por WhatsApp</p>
            )
          ) : null}

          {/* Specs */}
          {(dimensions || artwork.technique || artwork.has_frame) && (
            <div className="flex flex-wrap gap-2">
              {dimensions && (
                <span className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs text-stone-600">
                  {dimensions}
                </span>
              )}
              {outerDimensions && (
                <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-gold-500/20 text-xs text-stone-700">
                  {outerDimensions}
                </span>
              )}
              <ArtworkSizeBadge
                variant="chip"
                widthCm={artwork.width_cm}
                heightCm={artwork.height_cm}
              />
              {artwork.technique && (
                <span className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs text-stone-600">
                  {TECHNIQUE_LABEL[artwork.technique] ?? artwork.technique}
                </span>
              )}
              {artwork.has_frame && (
                <span className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs text-stone-600">
                  {[artwork.frame_color, artwork.frame_material, "con marco"]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {artwork.description && (
            <p className="text-sm text-stone-600 leading-relaxed">{artwork.description}</p>
          )}

          {/* Vista 3D / AR — siempre en ficha (evita ocultarla si vendida + imágenes vacías en edge); sin fotos solo aviso */}
          <section className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="font-display text-lg text-carbon-900 tracking-tight">
                Prueba este cuadro en tu espacio
              </h2>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                Gira el modelo con el dedo. En iPhone (Safari) o Android (Chrome), usa el botón de
                realidad aumentada para colocar el cuadro en una pared; la escala se basa en las
                medidas de la ficha cuando están cargadas.
              </p>
            </div>
            {images.length > 0 ? (
              <ArtworkARViewerIsland
                artworkCode={artwork.code}
                title={artwork.title}
                widthCm={artwork.width_cm}
                heightCm={artwork.height_cm}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
                <p className="text-xs text-stone-500">
                  Esta obra aún no tiene fotos en el catálogo. Sube imágenes en el admin para activar
                  la vista 3D.
                </p>
              </div>
            )}

            {flatPrimaryImage &&
              typeof artwork.width_cm === "number" &&
              typeof artwork.height_cm === "number" && (
                <div className="pt-1 space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-stone-400 font-medium">
                    O mejor: con tu propia foto
                  </p>
                  <PhotoPreviewLauncher
                    artworkId={artwork.id}
                    artworkCode={artwork.code}
                    title={artwork.title}
                    widthCm={
                      artwork.has_frame && artwork.frame_outer_width_cm
                        ? artwork.frame_outer_width_cm
                        : artwork.width_cm
                    }
                    heightCm={
                      artwork.has_frame && artwork.frame_outer_height_cm
                        ? artwork.frame_outer_height_cm
                        : artwork.height_cm
                    }
                    artworkImageUrl={flatPrimaryImage.cloudinary_url}
                    pageUrl={`${SITE_URL}/catalogo/${artwork.code}`}
                  />
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {artwork.has_frame && artwork.frame_outer_width_cm
                      ? "Se escala al tamaño exterior con marco. La foto nunca sale de tu dispositivo."
                      : "Sube una foto de tu pared, marca un objeto de medida conocida y la obra se escalará a su tamaño real. La foto nunca sale de tu dispositivo."}
                  </p>
                </div>
              )}
          </section>

          {/* CTAs */}
          {!isSold && (
            <div className="space-y-3 pt-2">
              <WhatsAppButton
                artworkId={artwork.id}
                code={artwork.code}
                title={artwork.title}
                widthCm={artwork.width_cm}
                heightCm={artwork.height_cm}
                hasFrame={artwork.has_frame}
                frameOuterWidthCm={artwork.frame_outer_width_cm}
                frameOuterHeightCm={artwork.frame_outer_height_cm}
                price={artwork.price}
                showPrice={showPrices && artwork.show_price}
                primaryImageUrl={showcaseImage?.cloudinary_url ?? null}
              />
              <div className="grid grid-cols-2 gap-3">
                <ShareButton title={artwork.title} />
                <a
                  href={`/api/artworks/${artwork.code}/ficha`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:border-stone-300 hover:text-carbon-900 transition-colors"
                >
                  <FileDown size={15} />
                  Ficha PDF
                </a>
              </div>
            </div>
          )}

          {isSold && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-stone-500 text-center">
                Esta obra ya fue vendida. Contáctanos para ver obras similares.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ShareButton title={artwork.title} />
                <a
                  href={`/api/artworks/${artwork.code}/ficha`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:border-stone-300 hover:text-carbon-900 transition-colors"
                >
                  <FileDown size={15} />
                  Ficha PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related artworks */}
      <RelatedArtworks artworks={related} showPrice={showPrices} preferPremium={preferPremium} />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: artwork.title,
            description: artwork.description ?? undefined,
            image: (artwork.images ?? []).map((i) => i.cloudinary_url),
            brand: { "@type": "Brand", name: "Atelier 430" },
            offers: {
              "@type": "Offer",
              priceCurrency: "MXN",
              price: showPrices && artwork.show_price && artwork.price
                ? String(artwork.price)
                : undefined,
              availability:
                artwork.status === "available"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: `${SITE_URL}/catalogo/${artwork.code}`,
            },
          }),
        }}
      />
    </div>
  )
}
