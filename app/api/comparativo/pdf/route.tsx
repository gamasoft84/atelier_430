import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { ComparativoPdfDocument } from "@/lib/comparativo/comparativo-pdf-document"
import { parseComparativoCodesParam } from "@/lib/comparativo/parse-codes"
import { prepareComparativoItems } from "@/lib/comparativo/prepare-items"
import {
  getComparativoArtworksByCodes,
  getComparativoEditorialCopy,
} from "@/lib/supabase/queries/comparativo"
import { getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = parseComparativoCodesParam(searchParams.get("obras"))

  if (!parsed.ok) {
    return NextResponse.json({ error: "Códigos inválidos (3 a 5 obras)." }, { status: 400 })
  }

  const [copy, preferPremium, artworks] = await Promise.all([
    getComparativoEditorialCopy(),
    getPreferPremiumInCatalog(),
    getComparativoArtworksByCodes(parsed.codes),
  ])

  const items = prepareComparativoItems(artworks, preferPremium)
  if (items.length < 3) {
    return NextResponse.json(
      { error: "No hay al menos 3 obras con imagen y medidas." },
      { status: 404 },
    )
  }

  const pdfBuffer = await renderToBuffer(
    <ComparativoPdfDocument items={items} copy={copy} />,
  )

  const filename = `atelier430-comparativo-${parsed.codes.join("-")}.pdf`.replace(
    /[^a-zA-Z0-9._-]+/g,
    "-",
  )

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
