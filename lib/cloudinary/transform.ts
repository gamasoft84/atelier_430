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
