import type { ArtworkCategory, CatalogFormat } from "@/types/artwork"
import type { MarcoOption, SizeOption } from "@/types/catalog"

export type ComparativoExactSize = {
  width_cm: number
  height_cm: number
}

export type ComparativoPickerFilters = {
  categorias: ArtworkCategory[]
  tecnicas: string[]
  tamanos: SizeOption[]
  marco: MarcoOption | null
  /** Un solo formato; vacío = todos. */
  formato: CatalogFormat | null
  medida: ComparativoExactSize | null
  precio_min: number | null
  precio_max: number | null
}

export const EMPTY_COMPARATIVO_PICKER_FILTERS: ComparativoPickerFilters = {
  categorias: [],
  tecnicas: [],
  tamanos: [],
  marco: null,
  formato: null,
  medida: null,
  precio_min: null,
  precio_max: null,
}

const VALID_CATEGORIES: ArtworkCategory[] = ["religiosa", "nacional", "europea", "moderna"]
const VALID_TECHNIQUES = ["oleo", "impresion"]
const VALID_SIZES: SizeOption[] = ["chico", "mediano", "grande", "xl"]
const VALID_MARCO: MarcoOption[] = ["con", "sin"]
const VALID_FORMATOS: CatalogFormat[] = ["horizontal", "vertical"]

function str(v: string | null): string {
  return v ?? ""
}

function parseList(raw: string, valid: readonly string[]): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => valid.includes(s))
}

function parseMedida(raw: string): ComparativoExactSize | null {
  const m = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i.exec(raw.trim())
  if (!m) return null
  const width_cm = Number(m[1])
  const height_cm = Number(m[2])
  if (!Number.isFinite(width_cm) || !Number.isFinite(height_cm) || width_cm <= 0 || height_cm <= 0) {
    return null
  }
  return { width_cm, height_cm }
}

export function parseComparativoPickerSearchParams(
  params: URLSearchParams | { get: (key: string) => string | null },
): { filters: ComparativoPickerFilters; q: string } {
  const categorias = parseList(str(params.get("categoria")), VALID_CATEGORIES) as ArtworkCategory[]
  const tecnicas = parseList(str(params.get("tecnica")), VALID_TECHNIQUES)
  const tamanos = parseList(str(params.get("tamano")), VALID_SIZES) as SizeOption[]

  const marcoRaw = str(params.get("marco"))
  const marco = VALID_MARCO.includes(marcoRaw as MarcoOption) ? (marcoRaw as MarcoOption) : null

  const formatoRaw = str(params.get("formato"))
  const formato = VALID_FORMATOS.includes(formatoRaw as CatalogFormat)
    ? (formatoRaw as CatalogFormat)
    : null

  const medida = parseMedida(str(params.get("medida")))

  const precioMinRaw = str(params.get("precio_min"))
  const precioMaxRaw = str(params.get("precio_max"))
  const precio_min = precioMinRaw ? Number(precioMinRaw) || null : null
  const precio_max = precioMaxRaw ? Number(precioMaxRaw) || null : null

  const q = str(params.get("q")).trim()

  return {
    filters: {
      categorias,
      tecnicas,
      tamanos,
      marco,
      formato,
      medida,
      precio_min,
      precio_max,
    },
    q,
  }
}

export function buildComparativoPickerSearchParams(
  q: string,
  filters: ComparativoPickerFilters,
): URLSearchParams {
  const params = new URLSearchParams()

  if (q.trim()) params.set("q", q.trim())
  if (filters.categorias.length > 0) params.set("categoria", filters.categorias.join(","))
  if (filters.tecnicas.length > 0) params.set("tecnica", filters.tecnicas.join(","))
  if (filters.tamanos.length > 0) params.set("tamano", filters.tamanos.join(","))
  if (filters.marco) params.set("marco", filters.marco)
  if (filters.formato) params.set("formato", filters.formato)
  if (filters.medida) {
    params.set(
      "medida",
      `${filters.medida.width_cm}x${filters.medida.height_cm}`,
    )
  }
  if (filters.precio_min !== null) params.set("precio_min", String(filters.precio_min))
  if (filters.precio_max !== null) params.set("precio_max", String(filters.precio_max))

  return params
}

export function hasActiveComparativoPickerFilters(f: ComparativoPickerFilters): boolean {
  return (
    f.categorias.length > 0 ||
    f.tecnicas.length > 0 ||
    f.tamanos.length > 0 ||
    f.marco !== null ||
    f.formato !== null ||
    f.medida !== null ||
    f.precio_min !== null ||
    f.precio_max !== null
  )
}

export function formatExactSizeLabel(size: ComparativoExactSize): string {
  return `${size.width_cm} × ${size.height_cm} cm`
}

export function exactSizeKey(size: ComparativoExactSize): string {
  return `${size.width_cm}x${size.height_cm}`
}
