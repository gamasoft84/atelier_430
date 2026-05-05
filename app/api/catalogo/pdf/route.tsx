import { NextResponse } from "next/server"
import { renderToBuffer, Document, Page, View, Text, Image as PdfImage, StyleSheet, Font } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import type { ArtworkPublic, ArtworkCategory } from "@/types/artwork"

// ─── Styles ────────────────────────────────────────────────────────────────

const GOLD   = "#B8860B"
const CARBON = "#0F0F0F"
const CREAM  = "#FAF7F0"
const STONE  = "#57534E"
const LIGHT  = "#E7E5E0"

const styles = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT,
  },
  headerTitle: {
    fontSize: 20,
    color: CARBON,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 8,
    color: STONE,
    marginTop: 2,
  },
  headerMeta: {
    fontSize: 7,
    color: STONE,
    textAlign: "right",
  },
  // Category title page
  catBanner: {
    backgroundColor: CARBON,
    padding: 14,
    marginBottom: 16,
    borderRadius: 4,
  },
  catBannerText: {
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  catBannerCount: {
    fontSize: 8,
    color: "#FFFFFF80",
    marginTop: 3,
  },
  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47.8%",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LIGHT,
  },
  cardImage: {
    width: "100%",
    height: 170,
    objectFit: "cover",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 170,
    backgroundColor: LIGHT,
  },
  cardBody: {
    padding: 10,
  },
  cardCategory: {
    fontSize: 6.5,
    color: STONE,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 9.5,
    color: CARBON,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.3,
    marginBottom: 5,
  },
  cardMeta: {
    fontSize: 7.5,
    color: STONE,
    lineHeight: 1.5,
  },
  cardPrice: {
    fontSize: 10,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  cardCode: {
    fontSize: 6.5,
    color: "#A8A29E",
    fontFamily: "Helvetica-Oblique",
    marginTop: 3,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LIGHT,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: STONE,
  },
  noResults: {
    padding: 24,
    textAlign: "center",
    color: STONE,
    fontSize: 10,
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  religiosa: "OBRAS RELIGIOSAS",
  nacional:  "PAISAJES NACIONALES",
  europea:   "REPRODUCCIONES EUROPEAS",
  moderna:   "ARTE MODERNO",
}

function techLabel(t: string | null | undefined) {
  if (!t) return ""
  return { oleo: "Óleo", impresion: "Impresión", mixta: "Técnica mixta", acrilico: "Acrílico" }[t] ?? t
}

function sizeLabel(a: ArtworkPublic) {
  if (a.width_cm && a.height_cm) return `${a.width_cm} × ${a.height_cm} cm`
  if (a.width_cm) return `${a.width_cm} cm`
  if (a.height_cm) return `${a.height_cm} cm`
  return ""
}

function frameLabel(a: ArtworkPublic) {
  if (!a.has_frame) return "Sin marco"
  const parts = [a.frame_material, a.frame_color].filter(Boolean)
  return parts.length ? `Marco ${parts.join(" ")}` : "Con marco"
}

// ─── PDF Document ──────────────────────────────────────────────────────────

function CatalogPdf({
  artworks,
  category,
  generatedAt,
}: {
  artworks: ArtworkPublic[]
  category: string
  generatedAt: string
}) {
  const catTitle = category === "todas" ? "CATÁLOGO COMPLETO" : (CAT_LABELS[category] ?? category.toUpperCase())

  // Group by category when showing all
  const groups: Array<{ label: string; items: ArtworkPublic[] }> =
    category === "todas"
      ? (["religiosa", "nacional", "europea", "moderna"] as ArtworkCategory[])
          .map((c) => ({
            label: CAT_LABELS[c] ?? c.toUpperCase(),
            items: artworks.filter((a) => a.category === c),
          }))
          .filter((g) => g.items.length > 0)
      : [{ label: catTitle, items: artworks }]

  return (
    <Document
      title={`Atelier 430 — ${catTitle}`}
      author="Atelier 430"
      subject="Catálogo de obras de arte"
    >
      {groups.map((group, gi) => {
        // Chunk into pages of 6 cards (3 rows × 2 cols)
        const pages: ArtworkPublic[][] = []
        for (let i = 0; i < group.items.length; i += 6) {
          pages.push(group.items.slice(i, i + 6))
        }
        if (pages.length === 0) pages.push([])

        return pages.map((pageItems, pi) => (
          <Page key={`${gi}-${pi}`} size="LETTER" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Atelier 430</Text>
                <Text style={styles.headerSub}>430 piezas únicas · Arte para tu hogar</Text>
              </View>
              <Text style={styles.headerMeta}>
                {group.label}{"\n"}
                Generado: {generatedAt}{"\n"}
                Pág. {pi + 1}
              </Text>
            </View>

            {/* Category banner on first page of each group */}
            {pi === 0 && (
              <View style={styles.catBanner}>
                <Text style={styles.catBannerText}>{group.label}</Text>
                <Text style={styles.catBannerCount}>{group.items.length} obras disponibles</Text>
              </View>
            )}

            {/* Cards grid */}
            <View style={styles.grid}>
              {pageItems.map((artwork) => {
                const img = artwork.images?.find((i) => i.is_primary) ?? artwork.images?.[0]
                // Use Cloudinary URL with small transform for PDF size
                const imgUrl = img?.cloudinary_url
                  ? img.cloudinary_url.replace("/upload/", "/upload/w_400,h_500,c_fill,q_70/")
                  : null

                return (
                  <View key={artwork.id} style={styles.card}>
                    {imgUrl ? (
                      <PdfImage src={imgUrl} style={styles.cardImage} />
                    ) : (
                      <View style={styles.cardImagePlaceholder} />
                    )}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardCategory}>{artwork.category}</Text>
                      <Text style={styles.cardTitle}>{artwork.title}</Text>
                      <Text style={styles.cardMeta}>
                        {[techLabel(artwork.technique), sizeLabel(artwork), frameLabel(artwork)]
                          .filter(Boolean)
                          .join("  ·  ")}
                      </Text>
                      {artwork.show_price && artwork.price ? (
                        <Text style={styles.cardPrice}>
                          ${artwork.price.toLocaleString("es-MX")} MXN
                        </Text>
                      ) : null}
                      <Text style={styles.cardCode}>{artwork.code}</Text>
                    </View>
                  </View>
                )
              })}
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>Atelier 430 · Galería privada</Text>
              <Text style={styles.footerText}>Precios sujetos a cambio sin previo aviso</Text>
            </View>
          </Page>
        ))
      })}
    </Document>
  )
}

// ─── Route handler ─────────────────────────────────────────────────────────

const VALID_CATEGORIES = ["todas", "religiosa", "nacional", "europea", "moderna"]

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("categoria") ?? "todas"
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
  }

  let query = supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .eq("status", "available")
    .order("category")
    .order("code")

  if (category !== "todas") {
    query = query.eq("category", category as ArtworkCategory)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: "Error al cargar obras" }, { status: 500 })
  }

  const artworks = (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]

  const generatedAt = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  })

  const pdfBuffer = await renderToBuffer(
    <CatalogPdf artworks={artworks} category={category} generatedAt={generatedAt} />
  )

  const filename = category === "todas"
    ? "Atelier430_Catalogo_Completo.pdf"
    : `Atelier430_${category.charAt(0).toUpperCase() + category.slice(1)}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  })
}
