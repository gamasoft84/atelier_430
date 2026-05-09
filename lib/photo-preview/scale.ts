export interface Point {
  x: number
  y: number
}

export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calcula píxeles por centímetro a partir de dos puntos en una imagen y la
 * medida real del segmento que delimitan (en cm).
 */
export function pixelsPerCm(p1: Point, p2: Point, realCm: number): number {
  if (realCm <= 0) return 0
  const px = distance(p1, p2)
  return px / realCm
}

/**
 * Tamaño en pixeles de la obra dentro del canvas, dado px/cm.
 */
export function artworkPixelSize(
  widthCm: number,
  heightCm: number,
  pxPerCm: number,
): { width: number; height: number } {
  return {
    width: Math.max(8, Math.round(widthCm * pxPerCm)),
    height: Math.max(8, Math.round(heightCm * pxPerCm)),
  }
}

/**
 * Limita una imagen a `maxSide` en su lado mayor (preserva proporción).
 * Si ya cabe, devuelve las dimensiones originales.
 */
export function fitWithinMaxSide(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number; scale: number } {
  const longest = Math.max(width, height)
  if (longest <= maxSide) return { width, height, scale: 1 }
  const scale = maxSide / longest
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  }
}

/**
 * Carga una imagen desde una URL/objectURL respetando CORS para que el canvas
 * resultante se pueda exportar via toBlob() sin "tainted canvas".
 */
export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
    img.src = src
  })
}

/**
 * Convierte un File de imagen a HTMLImageElement en memoria.
 * Reduce automáticamente a `maxSide` para evitar canvas gigantes en móviles.
 */
export async function fileToScaledImage(
  file: File,
  maxSide = 2400,
): Promise<{ image: HTMLImageElement; width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const raw = await loadImage(url, false)
    const fitted = fitWithinMaxSide(raw.naturalWidth, raw.naturalHeight, maxSide)

    if (fitted.scale === 1) {
      return { image: raw, width: raw.naturalWidth, height: raw.naturalHeight }
    }

    // Redimensionar via canvas y devolver una nueva HTMLImageElement
    const canvas = document.createElement("canvas")
    canvas.width = fitted.width
    canvas.height = fitted.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D no disponible")
    ctx.drawImage(raw, 0, 0, fitted.width, fitted.height)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    const scaled = await loadImage(dataUrl, false)
    return { image: scaled, width: fitted.width, height: fitted.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}
