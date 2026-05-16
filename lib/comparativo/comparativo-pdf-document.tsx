import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import { buildComparativoImageUrl } from "@/lib/comparativo/image-url"
import {
  COMPARATIVO_PDF_PAGE,
  layoutComparativoPdfPieces,
} from "@/lib/comparativo/pdf-layout"
import type { ComparativoPreparedItem } from "@/lib/comparativo/prepare-items"
import type { ComparativoEditorialCopy } from "@/lib/supabase/queries/comparativo"

const LINEN = "#f3efe8"
const ESPRESSO = "#3b2e2a"
const WARM = "#6e655d"
const WARM_MUTED = "#8a8178"
const GOLD_PRICE = "#8a6b3c"
const GOLD_RULE = "#9a8468"

const s = StyleSheet.create({
  page: {
    backgroundColor: LINEN,
    paddingTop: COMPARATIVO_PDF_PAGE.paddingPt,
    paddingBottom: COMPARATIVO_PDF_PAGE.paddingPt,
    paddingHorizontal: COMPARATIVO_PDF_PAGE.paddingPt,
    fontFamily: "Helvetica",
    color: ESPRESSO,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    letterSpacing: 10,
    color: ESPRESSO,
  },
  tagline: {
    marginTop: 14,
    fontSize: 7,
    letterSpacing: 4,
    color: WARM,
    textTransform: "uppercase",
  },
  gallery: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: COMPARATIVO_PDF_PAGE.artGapPt,
  },
  piece: {
    alignItems: "center",
  },
  artSlot: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  artImage: {
    objectFit: "contain",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: COMPARATIVO_PDF_PAGE.artGapPt,
    marginTop: COMPARATIVO_PDF_PAGE.metaGapPt,
  },
  metaCol: {
    alignItems: "center",
  },
  metaIndex: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: ESPRESSO,
  },
  metaTitle: {
    marginTop: 4,
    fontSize: 10,
    textAlign: "center",
    color: ESPRESSO,
  },
  metaLine: {
    marginTop: 2,
    fontSize: 7.5,
    textAlign: "center",
    color: WARM_MUTED,
  },
  metaPrice: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GOLD_PRICE,
  },
  footer: {
    position: "absolute",
    left: COMPARATIVO_PDF_PAGE.paddingPt,
    right: COMPARATIVO_PDF_PAGE.paddingPt,
    bottom: COMPARATIVO_PDF_PAGE.paddingPt,
    alignItems: "center",
  },
  footerRule: {
    width: 320,
    height: 1,
    backgroundColor: GOLD_RULE,
    opacity: 0.38,
    marginBottom: 14,
  },
  footerText: {
    fontSize: 7,
    letterSpacing: 3,
    color: WARM,
    textTransform: "uppercase",
  },
})

function formatPrice(item: ComparativoPreparedItem): string {
  if (!item.showPrice || item.priceMxn == null) return "Privado"
  return `$${item.priceMxn.toLocaleString("es-MX")}`
}

function formatDims(w: number, h: number): string {
  return `${Math.round(w)} × ${Math.round(h)} cm`
}

function hasFrame(item: ComparativoPreparedItem): boolean {
  return (
    item.frameOuterWidthCm != null &&
    item.frameOuterHeightCm != null &&
    item.frameOuterWidthCm > 0 &&
    item.frameOuterHeightCm > 0
  )
}

function hasCanvas(item: ComparativoPreparedItem): boolean {
  return item.canvasWidthCm > 0 && item.canvasHeightCm > 0
}

export function ComparativoPdfDocument({
  items,
  copy,
}: {
  items: ComparativoPreparedItem[]
  copy: ComparativoEditorialCopy
}) {
  const { pieces } = layoutComparativoPdfPieces(items)
  const pieceByCode = new Map(pieces.map((p) => [p.code, p]))
  const showCanvas = items.some(hasCanvas)
  const showFrame = items.some(hasFrame)

  return (
    <Document title="Atelier 430 — Comparativo editorial" author="Atelier 430">
      <Page
        size={[COMPARATIVO_PDF_PAGE.widthPt, COMPARATIVO_PDF_PAGE.heightPt]}
        style={s.page}
      >
        <View style={s.header}>
          <Text style={s.title}>ATELIER 430</Text>
          <Text style={s.tagline}>{copy.tagline}</Text>
        </View>

        <View style={s.gallery}>
          {items.map((item) => {
            const layout = pieceByCode.get(item.code)
            if (!layout) return null
            const imgUrl = buildComparativoImageUrl(
              item.imagePublicId,
              item.displayWidthCm,
              item.displayHeightCm,
              "pdf",
            )
            return (
              <View key={item.code} style={[s.piece, { width: layout.widthPt }]}>
                <View
                  style={[
                    s.artSlot,
                    { width: layout.widthPt, height: layout.heightPt },
                  ]}
                >
                  <PdfImage
                    src={imgUrl}
                    style={{
                      width: layout.artWidthPt,
                      height: layout.artHeightPt,
                    }}
                  />
                </View>
              </View>
            )
          })}
        </View>

        <View style={s.metaRow}>
          {items.map((item, index) => {
            const layout = pieceByCode.get(item.code)
            if (!layout) return null
            return (
              <View key={item.code} style={[s.metaCol, { width: layout.widthPt }]}>
                <Text style={s.metaIndex}>{String(index + 1).padStart(2, "0")}</Text>
                <Text style={s.metaTitle}>{item.title}</Text>
                <Text style={s.metaLine}>{item.techniqueLabel}</Text>
                {showCanvas ? (
                  <Text style={s.metaLine}>
                    {hasCanvas(item)
                      ? `Lienzo: ${formatDims(item.canvasWidthCm, item.canvasHeightCm)}`
                      : " "}
                  </Text>
                ) : null}
                {showFrame ? (
                  <Text style={s.metaLine}>
                    {hasFrame(item)
                      ? `Con marco: ${formatDims(item.frameOuterWidthCm!, item.frameOuterHeightCm!)}`
                      : " "}
                  </Text>
                ) : null}
                <Text style={s.metaPrice}>{formatPrice(item)}</Text>
              </View>
            )
          })}
        </View>

        <View style={s.footer} fixed>
          <View style={s.footerRule} />
          <Text style={s.footerText}>{copy.footer}</Text>
        </View>
      </Page>
    </Document>
  )
}
