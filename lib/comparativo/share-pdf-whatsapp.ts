import { WHATSAPP_NUMBER } from "@/lib/constants"
import { buildComparativoWhatsAppMessage } from "@/lib/whatsapp/comparativo-message"

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

export async function fetchComparativoPdfBlob(
  codes: string[],
): Promise<{ blob: Blob; filename: string }> {
  if (codes.length < 3) {
    throw new Error("Se requieren al menos 3 obras")
  }

  const pdfPath = `/api/comparativo/pdf?obras=${encodeURIComponent(codes.join(","))}`
  const res = await fetch(pdfPath)
  if (!res.ok) {
    throw new Error("No se pudo generar el PDF")
  }

  const blob = await res.blob()
  return { blob, filename: comparativoPdfFilename(codes) }
}

export async function downloadComparativoPdf(codes: string[]): Promise<void> {
  const { blob, filename } = await fetchComparativoPdfBlob(codes)
  downloadBlob(blob, filename)
}

/**
 * Genera el PDF y lo comparte por WhatsApp.
 * Móvil: solo el archivo PDF (sin URL en el mensaje).
 * Escritorio: descarga el PDF y abre wa.me con texto sin enlaces.
 */
export async function shareComparativoPdfViaWhatsApp(codes: string[]): Promise<void> {
  const { blob, filename } = await fetchComparativoPdfBlob(codes)
  const file = new File([blob], filename, { type: "application/pdf" })
  const text = buildComparativoWhatsAppMessage(codes)

  if (canSharePdfFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title: "Comparativo Atelier 430",
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
