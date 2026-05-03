import { CODE_REGEX } from "@/types/import"

/** Normaliza `r-001`, `E-001.jpg` basename a código válido. */
export function artworkCodeFromZipEntry(path: string): string | null {
  const base = path.split("/").pop()?.split("\\").pop()?.trim() ?? ""
  const withoutExt = base.replace(/\.[^.]+$/i, "")
  const upper = withoutExt.toUpperCase()
  if (CODE_REGEX.test(upper)) return upper
  const parts = withoutExt.split("-")
  if (parts.length !== 2) return null
  const letter = parts[0].toUpperCase()
  const num = parts[1].replace(/\D/g, "").padStart(3, "0").slice(-3)
  const candidate = `${letter}-${num}`
  return CODE_REGEX.test(candidate) ? candidate : null
}

export function mimeFromFilename(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}
