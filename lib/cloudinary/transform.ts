import { CLOUDINARY_CLOUD_NAME } from "@/lib/constants"

type ImageTransform = "thumbnail" | "card" | "detail" | "og"

const TRANSFORMS: Record<ImageTransform, string> = {
  thumbnail: "w_400,h_500,c_fill,q_auto:eco,f_auto",
  card: "w_600,h_750,c_fill,q_auto:good,f_auto",
  detail: "w_1200,h_1500,c_fit,q_auto:good,f_auto",
  og: "w_1200,h_630,c_fill,q_auto:good,f_auto",
}

export function getCloudinaryUrl(
  publicId: string,
  transform: ImageTransform = "card"
): string {
  const t = TRANSFORMS[transform]
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${t}/${publicId}`
}

export function getArtworkFolder(artworkCode: string): string {
  return `atelier430/artworks/${artworkCode}`
}

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/"

/**
 * URL listada en BD suele ser la original sin transformaciones: los JPEG siguen llevando EXIF.
 * El visor 3D embebe bytes en glTF sin reinterpretar EXIF (a diferencia del img del catálogo).
 * Pedir una derivada con `q_auto` hace que Cloudinary aplique orientación y optimice; así la textura
 * coincide con lo que ves en el resto del sitio.
 */
export function cloudinaryUrlForArTexture(originalUrl: string): string {
  try {
    const u = new URL(originalUrl)
    if (!u.hostname.includes("res.cloudinary.com")) return originalUrl
    const i = u.pathname.indexOf(CLOUDINARY_UPLOAD_MARKER)
    if (i === -1) return originalUrl
    const afterUpload = u.pathname.slice(i + CLOUDINARY_UPLOAD_MARKER.length)
    const firstSeg = afterUpload.split("/")[0] ?? ""
    if (firstSeg.includes("q_auto")) return originalUrl
    const prefix = u.pathname.slice(0, i + CLOUDINARY_UPLOAD_MARKER.length)
    return `${u.origin}${prefix}q_auto/${afterUpload}${u.search}`
  } catch {
    return originalUrl
  }
}
