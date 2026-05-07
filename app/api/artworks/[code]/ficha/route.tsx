import { NextResponse } from "next/server"
import {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  Image as PdfImage,
  StyleSheet,
} from "@react-pdf/renderer"
import { createAnonSupabaseClient } from "@/lib/supabase/anon"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import type { ArtworkPublic } from "@/types/artwork"

// ─── Constants ─────────────────────────────────────────────────────────────

const GOLD   = "#B8860B"
const CARBON = "#0F0F0F"
const CREAM  = "#FAF7F0"
const STONE  = "#57534E"
const LIGHT  = "#E7E5E0"
const WHITE  = "#FFFFFF"

const CAT_LABELS: Record<string, string> = {
  religiosa: "RELIGIOSA",
  nacional:  "NACIONAL",
  europea:   "EUROPEA",
  moderna:   "MODERNA",
}

const TECHNIQUE_LABELS: Record<string, string> = {
  oleo:      "Óleo sobre tela",
  impresion: "Impresión",
  mixta:     "Técnica mixta",
  acrilico:  "Acrílico",
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT,
  },
  headerBrand: { fontSize: 16, color: CARBON, letterSpacing: 1.5 },
  headerSub:   { fontSize: 7, color: STONE, marginTop: 2 },
  headerDate:  { fontSize: 7, color: STONE, textAlign: "right" },

  // Body — two-column layout
  body: { flexDirection: "row", gap: 20, flex: 1 },

  // Left column: image
  imageCol: { width: "45%", flexShrink: 0 },
  image: { width: "100%", borderRadius: 4 },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: "3/4",
    backgroundColor: LIGHT,
    borderRadius: 4,
  },

  // Right column: info
  infoCol: { flex: 1, gap: 0 },
  category: {
    fontSize: 7,
    color: STONE,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    color: CARBON,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
    marginBottom: 4,
  },
  artist: { fontSize: 9, color: STONE, marginBottom: 10 },
  code: {
    fontSize: 7,
    color: "#A8A29E",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 14,
  },

  divider: {
    height: 1,
    backgroundColor: LIGHT,
    marginVertical: 12,
  },

  // Specs
  specRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  specLabel: { fontSize: 7, color: STONE, width: 70, letterSpacing: 0.5 },
  specValue: { fontSize: 8, color: CARBON, flex: 1, lineHeight: 1.4 },

  // Price
  priceBlock: { marginTop: 4 },
  price:      { fontSize: 18, color: GOLD, fontFamily: "Helvetica-Bold" },
  priceSub:   { fontSize: 7, color: STONE, marginTop: 1 },

  // Stock badge
  stockBadge: {
    alignSelf: "flex-start",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: LIGHT,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
  },
  stockText: { fontSize: 7, color: STONE },

  // Description
  descBlock:  { marginTop: 16 },
  descTitle:  { fontSize: 7, color: STONE, letterSpacing: 1, marginBottom: 5 },
  descText:   { fontSize: 8.5, color: CARBON, lineHeight: 1.6 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LIGHT,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: STONE },
})

// ─── Helpers ───────────────────────────────────────────────────────────────

function pdfImageUrl(url: string): string {
  const marker = "/image/upload/"
  const i = url.indexOf(marker)
  if (i === -1) return url
  return url.slice(0, i + marker.length) + "w_800,c_limit,q_80,f_jpg/" + url.slice(i + marker.length)
}

function dims(a: ArtworkPublic): string {
  if (a.width_cm && a.height_cm) return `${a.width_cm} × ${a.height_cm} cm`
  if (a.width_cm) return `${a.width_cm} cm`
  if (a.height_cm) return `${a.height_cm} cm`
  return "—"
}

function frameDesc(a: ArtworkPublic): string {
  if (!a.has_frame) return "Sin marco"
  const parts = [a.frame_color, a.frame_material].filter(Boolean)
  return parts.length ? `Con marco ${parts.join(" ")}` : "Con marco"
}

// ─── PDF Component ─────────────────────────────────────────────────────────

function ArtworkFicha({
  artwork,
  showPrice,
  generatedAt,
}: {
  artwork: ArtworkPublic
  showPrice: boolean
  generatedAt: string
}) {
  const img = artwork.images?.find((i) => i.is_primary) ?? artwork.images?.[0]
  const imgUrl = img?.cloudinary_url ? pdfImageUrl(img.cloudinary_url) : null

  const isHorizontal =
    img?.width && img?.height && img.width > img.height

  return (
    <Document
      title={`Atelier 430 — ${artwork.title}`}
      author="Atelier 430"
      subject="Ficha de obra"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerBrand}>Atelier 430</Text>
            <Text style={s.headerSub}>Galería privada · Arte curado</Text>
          </View>
          <Text style={s.headerDate}>{generatedAt}</Text>
        </View>

        {/* Body */}
        <View style={s.body}>
          {/* Left — image */}
          <View style={s.imageCol}>
            {imgUrl ? (
              <PdfImage
                src={imgUrl}
                style={[s.image, { aspectRatio: isHorizontal ? "4/3" : "3/4" }]}
              />
            ) : (
              <View style={s.imagePlaceholder} />
            )}
          </View>

          {/* Right — info */}
          <View style={s.infoCol}>
            <Text style={s.category}>{CAT_LABELS[artwork.category] ?? artwork.category}</Text>
            <Text style={s.title}>{artwork.title}</Text>
            {artwork.artist?.trim() ? (
              <Text style={s.artist}>{artwork.artist.trim()}</Text>
            ) : null}
            <Text style={s.code}>{artwork.code}</Text>

            <View style={s.divider} />

            {/* Specs */}
            <View style={s.specRow}>
              <Text style={s.specLabel}>Técnica</Text>
              <Text style={s.specValue}>
                {artwork.technique ? (TECHNIQUE_LABELS[artwork.technique] ?? artwork.technique) : "—"}
              </Text>
            </View>
            <View style={s.specRow}>
              <Text style={s.specLabel}>Medidas</Text>
              <Text style={s.specValue}>{dims(artwork)}</Text>
            </View>
            <View style={s.specRow}>
              <Text style={s.specLabel}>Marco</Text>
              <Text style={s.specValue}>{frameDesc(artwork)}</Text>
            </View>

            {/* Price */}
            {showPrice && artwork.show_price && artwork.price ? (
              <>
                <View style={s.divider} />
                <View style={s.priceBlock}>
                  <Text style={s.price}>${artwork.price.toLocaleString("es-MX")}</Text>
                  <Text style={s.priceSub}>MXN · Precio de lista</Text>
                </View>
              </>
            ) : null}

            {/* Stock (religiosa con varios) */}
            {artwork.category === "religiosa" && artwork.stock_quantity > 1 ? (
              <View style={s.stockBadge}>
                <Text style={s.stockText}>{artwork.stock_quantity} piezas disponibles</Text>
              </View>
            ) : null}

            {/* Description */}
            {artwork.description ? (
              <View style={s.descBlock}>
                <View style={s.divider} />
                <Text style={s.descTitle}>DESCRIPCIÓN</Text>
                <Text style={s.descText}>{artwork.description}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Atelier 430 · Galería privada</Text>
          <Text style={s.footerText}>Precios sujetos a cambio sin previo aviso</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const supabase = createAnonSupabaseClient()

  const [artworkRes, settingRes] = await Promise.all([
    supabase
      .from("artworks")
      .select(ARTWORK_SELECT)
      .eq("code", code.toUpperCase())
      .in("status", ["available", "reserved", "sold"])
      .maybeSingle(),
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "show_prices_globally")
      .maybeSingle(),
  ])

  if (!artworkRes.data) {
    return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 })
  }

  const artwork = normalizeArtworkRow(artworkRes.data) as ArtworkPublic

  const sv = settingRes.data?.value
  const showPrice =
    sv == null ? true
    : typeof sv === "boolean" ? sv
    : typeof sv === "object" && sv !== null && "enabled" in sv
      ? Boolean((sv as { enabled: unknown }).enabled)
      : true

  const generatedAt = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  })

  const pdfBuffer = await renderToBuffer(
    <ArtworkFicha artwork={artwork} showPrice={showPrice} generatedAt={generatedAt} />
  )

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="Atelier430_${code}.pdf"`,
      "Cache-Control":       "no-store",
    },
  })
}
