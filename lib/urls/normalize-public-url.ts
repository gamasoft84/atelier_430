/** Asegura esquema https para enlaces en mensajes (WhatsApp, clipboard, etc.). */
export function normalizePublicUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://")
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`
  }

  return `https://${trimmed.replace(/^\/+/, "")}`
}

export function artworkCatalogUrl(siteUrl: string, code: string): string {
  const base = siteUrl.replace(/\/$/, "")
  return normalizePublicUrl(`${base}/catalogo/${encodeURIComponent(code)}`)
}
