import type { ArtworkCategory } from "@/types/artwork"

export function normalizeStockQuantityForSave(
  category: ArtworkCategory,
  raw: number | null | undefined
): number {
  if (category !== "religiosa") return 1
  const x = Math.floor(Number(raw))
  if (!Number.isFinite(x)) return 1
  return Math.min(Math.max(0, x), 99999)
}
