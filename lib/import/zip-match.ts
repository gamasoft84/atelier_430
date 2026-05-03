import { CODE_REGEX } from "@/types/import"

/** Resultado de interpretar un nombre de archivo dentro del ZIP. */
export interface ParsedZipArtwork {
  /** Código de obra: E-001, N-042, etc. */
  code: string
  /**
   * Orden para elegir imagen principal si hay varias: menor = preferida.
   * 0 = archivo tipo `E-001.jpg` (sin sufijo de posición).
   * 1 = `E-001-1.jpg`, 2 = `E-001-2.jpg`, …
   */
  sortKey: number
}

/**
 * Interpreta rutas como:
 * - `E-001.jpg`, `sub/E-001.JPEG` → código E-001, sortKey 0
 * - `E-001-1.jpg`, `E-001-2.png` → código E-001, sortKey 1, 2, … (convención helper de fotos)
 * - `r-001` en dos segmentos legados → R-001, sortKey 0
 */
export function parseArtworkFromZipPath(path: string): ParsedZipArtwork | null {
  const base = path.split("/").pop()?.split("\\").pop()?.trim() ?? ""
  const withoutExt = base.replace(/\.[^.]+$/i, "")
  const upper = withoutExt.toUpperCase()

  const multi = upper.match(/^([RNEM]-\d{3})-(\d+)$/)
  if (multi) {
    const code = multi[1]
    const seq = Number.parseInt(multi[2], 10)
    if (!Number.isFinite(seq) || seq < 1) return null
    return CODE_REGEX.test(code) ? { code, sortKey: seq } : null
  }

  if (CODE_REGEX.test(upper)) {
    return { code: upper, sortKey: 0 }
  }

  const parts = withoutExt.split("-")
  if (parts.length !== 2) return null
  const letter = parts[0].toUpperCase()
  const num = parts[1].replace(/\D/g, "").padStart(3, "0").slice(-3)
  const candidate = `${letter}-${num}`
  return CODE_REGEX.test(candidate) ? { code: candidate, sortKey: 0 } : null
}

/** Normaliza basename a código válido (sin elegir entre varias fotos). */
export function artworkCodeFromZipEntry(path: string): string | null {
  const p = parseArtworkFromZipPath(path)
  return p ? p.code : null
}

export function mimeFromFilename(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}
