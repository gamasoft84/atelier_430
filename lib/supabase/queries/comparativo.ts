import { createClient } from "@/lib/supabase/server"
import { ARTWORK_SELECT, normalizeArtworkRow } from "@/lib/supabase/queries/artwork-row"
import type { ArtworkPublic } from "@/types/artwork"

export type ComparativoEditorialCopy = {
  tagline: string
  footer: string
}

const DEFAULT_COPY: ComparativoEditorialCopy = {
  tagline: "ARTE QUE TRANSFORMA ESPACIOS",
  footer: "COLECCIÓN MÉXICO | OBRAS ORIGINALES | PIEZAS ÚNICAS",
}

export async function getComparativoEditorialCopy(): Promise<ComparativoEditorialCopy> {
  const supabase = await createClient()
  const { data } = await supabase.from("site_settings").select("value").eq("key", "comparativo_editorial").maybeSingle()
  const v = data?.value
  if (v && typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>
    const tagline =
      typeof o.tagline === "string" && o.tagline.trim() ? o.tagline.trim() : DEFAULT_COPY.tagline
    const footer =
      typeof o.footer === "string" && o.footer.trim() ? o.footer.trim() : DEFAULT_COPY.footer
    return { tagline, footer }
  }
  return DEFAULT_COPY
}

/** Solo `available`, en el mismo orden que `codesInOrder`. Omite códigos no encontrados. */
export async function getComparativoArtworksByCodes(codesInOrder: string[]): Promise<ArtworkPublic[]> {
  if (codesInOrder.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("artworks")
    .select(ARTWORK_SELECT)
    .in("code", codesInOrder)
    .eq("status", "available")
  if (error || !data) return []
  const rows = (data as unknown[]).map(normalizeArtworkRow) as ArtworkPublic[]
  const byCode = new Map(rows.map((r) => [r.code, r]))
  return codesInOrder.map((c) => byCode.get(c)).filter((r): r is ArtworkPublic => Boolean(r))
}
