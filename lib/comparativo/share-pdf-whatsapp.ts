import { WHATSAPP_NUMBER } from "@/lib/constants"
import { buildComparativoWhatsAppMessage } from "@/lib/whatsapp/comparativo-message"
import { normalizePublicUrl } from "@/lib/urls/normalize-public-url"

function comparativoPdfFilename(codes: string[]): string {
  return `atelier430-comparativo-${codes.join("-")}.pdf`.replace(/[^a-zA-Z0-9._-]+/g, "-")
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function canSharePdfFile(file: File): boolean {
  if (typeof navigator === "undefined") return false
  if (typeof navigator.share !== "function") return false
  if (typeof navigator.canShare !== "function") return false
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * Genera el PDF del comparativo y lo comparte por WhatsApp.
 * Móvil: hoja de compartir nativa con el PDF adjunto.
 * Escritorio: descarga el PDF y abre wa.me con el mensaje (el usuario adjunta el archivo).
 */
export async function shareComparativoPdfViaWhatsApp(codes: string[]): Promise<void> {
  if (codes.length < 3) {
    throw new Error("Se requieren al menos 3 obras")
  }

  const pdfPath = `/api/comparativo/pdf?obras=${encodeURIComponent(codes.join(","))}`
  const res = await fetch(pdfPath)
  if (!res.ok) {
    throw new Error("No se pudo generar el PDF")
  }

  const blob = await res.blob()
  const filename = comparativoPdfFilename(codes)
  const file = new File([blob], filename, { type: "application/pdf" })

  const pageUrl =
    typeof window !== "undefined"
      ? normalizePublicUrl(window.location.href)
      : normalizePublicUrl(`/comparativo?obras=${encodeURIComponent(codes.join(","))}`)

  const text = buildComparativoWhatsAppMessage(codes, pageUrl)

  if (canSharePdfFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title: "Comparativo Atelier 430",
        text,
      })
      return
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return
    }
  }

  downloadBlob(blob, filename)

  if (!WHATSAPP_NUMBER) {
    throw new Error("WhatsApp no configurado")
  }

  const msg = `${text}\n\n(Adjunta el PDF que acaba de descargarse)`
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  window.open(href, "_blank", "noopener,noreferrer")
}
