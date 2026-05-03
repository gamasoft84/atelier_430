import type { SizeOption } from "@/types/catalog"

/** Lado mayor en cm; mismos rangos que el filtro del catálogo (FilterSidebar). */
export const ARTWORK_SIZE_CM_RANGES: Record<SizeOption, readonly [number, number]> = {
  chico: [0, 50],
  mediano: [50, 80],
  grande: [80, 120],
  xl: [120, Infinity],
} as const

export const ARTWORK_SIZE_LABEL: Record<SizeOption, string> = {
  chico: "Chico",
  mediano: "Mediano",
  grande: "Grande",
  xl: "XL",
}

export function maxSideCm(widthCm: number | null, heightCm: number | null): number {
  return Math.max(widthCm ?? 0, heightCm ?? 0)
}

/** Categoría por lado mayor; `null` si no hay medidas útiles. */
export function artworkSizeCategory(
  widthCm: number | null,
  heightCm: number | null
): SizeOption | null {
  const maxSide = maxSideCm(widthCm, heightCm)
  if (maxSide <= 0) return null
  const keys: SizeOption[] = ["chico", "mediano", "grande", "xl"]
  for (const key of keys) {
    const [min, max] = ARTWORK_SIZE_CM_RANGES[key]
    if (maxSide >= min && maxSide < max) return key
  }
  return "xl"
}

export function artworkSizeLabelFromDimensions(
  widthCm: number | null,
  heightCm: number | null
): string | null {
  const cat = artworkSizeCategory(widthCm, heightCm)
  return cat ? ARTWORK_SIZE_LABEL[cat] : null
}

export function isArtworkInSizeCategories(
  widthCm: number | null,
  heightCm: number | null,
  categories: SizeOption[]
): boolean {
  if (categories.length === 0) return true
  const maxSide = maxSideCm(widthCm, heightCm)
  return categories.some((s) => {
    const [min, max] = ARTWORK_SIZE_CM_RANGES[s]
    return maxSide >= min && maxSide < max
  })
}
