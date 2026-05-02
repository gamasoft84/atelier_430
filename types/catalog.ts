export type SortOption =
  | "recientes"
  | "precio_asc"
  | "precio_desc"
  | "tamano_asc"
  | "tamano_desc"

export type SizeOption = "chico" | "mediano" | "grande" | "xl"
export type MarcoOption = "con" | "sin"

export interface CatalogParams {
  categorias: string[]
  tecnicas: string[]
  tamanos: SizeOption[]
  marco: MarcoOption | null
  precio_min: number | null
  precio_max: number | null
  solo_disponibles: boolean
  orden: SortOption
  page: number
  q: string
}

export interface CatalogResult {
  artworks: import("@/types/artwork").ArtworkPublic[]
  total: number
  page: number
  totalPages: number
}

// ─── URL param parser ──────────────────────────────────────────────────────

type RawParams = Record<string, string | string[] | undefined>

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? ""
}

const VALID_SORTS: SortOption[] = [
  "recientes", "precio_asc", "precio_desc", "tamano_asc", "tamano_desc",
]
const VALID_SIZES: SizeOption[] = ["chico", "mediano", "grande", "xl"]
const VALID_MARCO: MarcoOption[] = ["con", "sin"]
const VALID_CATEGORIES = ["religiosa", "nacional", "europea", "moderna"]
const VALID_TECHNIQUES = ["oleo", "impresion", "mixta", "acrilico"]

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const categorias = str(raw.categoria)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_CATEGORIES.includes(s))

  const tecnicas = str(raw.tecnica)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_TECHNIQUES.includes(s))

  const tamanos = str(raw.tamano)
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SizeOption => VALID_SIZES.includes(s as SizeOption))

  const marcoRaw = str(raw.marco)
  const marco = VALID_MARCO.includes(marcoRaw as MarcoOption)
    ? (marcoRaw as MarcoOption)
    : null

  const precio_min = str(raw.precio_min) ? Number(str(raw.precio_min)) || null : null
  const precio_max = str(raw.precio_max) ? Number(str(raw.precio_max)) || null : null

  const soloRaw = str(raw.solo)
  const solo_disponibles = soloRaw === "" ? true : soloRaw !== "false"

  const ordenRaw = str(raw.orden) as SortOption
  const orden = VALID_SORTS.includes(ordenRaw) ? ordenRaw : "recientes"

  const page = Math.max(1, parseInt(str(raw.page) || "1", 10))
  const q = str(raw.q).trim()

  return {
    categorias,
    tecnicas,
    tamanos,
    marco,
    precio_min,
    precio_max,
    solo_disponibles,
    orden,
    page,
    q,
  }
}

// Returns true when any non-default filter is active
export function hasActiveFilters(p: CatalogParams): boolean {
  return (
    p.categorias.length > 0 ||
    p.tecnicas.length > 0 ||
    p.tamanos.length > 0 ||
    p.marco !== null ||
    p.precio_min !== null ||
    p.precio_max !== null ||
    !p.solo_disponibles ||
    p.q !== ""
  )
}
