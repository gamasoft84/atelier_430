export type ParseComparativoCodesResult =
  | { ok: true; codes: string[] }
  | { ok: false; error: "empty" | "count" | "format" }

/** Códigos tipo `N-011`, `E-006` (prefijo + guion + dígitos). Entre 3 y 5, sin duplicados, orden preservado. */
export function parseComparativoCodesParam(raw: string | undefined | null): ParseComparativoCodesResult {
  if (raw == null || !String(raw).trim()) return { ok: false, error: "empty" }
  const parts = String(raw)
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  const seen = new Set<string>()
  const codes: string[] = []
  for (const p of parts) {
    if (seen.has(p)) continue
    seen.add(p)
    codes.push(p)
  }
  if (codes.length < 3 || codes.length > 5) return { ok: false, error: "count" }
  const codeRe = /^[A-Z]+-\d+$/i
  if (!codes.every((c) => codeRe.test(c))) return { ok: false, error: "format" }
  return { ok: true, codes }
}
