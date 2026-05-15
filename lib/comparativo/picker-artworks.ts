import { getCloudinaryUrl } from "@/lib/cloudinary/transform"
import { getComparativoDisplayDimensionsCm } from "@/lib/comparativo/display-dimensions"
import { selectShowcaseImage } from "@/lib/images/select-showcase"
import type { ArtworkPublic } from "@/types/artwork"

export type ComparativoPickerArtwork = {
  code: string
  title: string
  thumbnailUrl: string
}

export function artworksToPickerItems(
  artworks: ArtworkPublic[],
  preferPremium: boolean,
): ComparativoPickerArtwork[] {
  const out: ComparativoPickerArtwork[] = []
  for (const a of artworks) {
    const disp = getComparativoDisplayDimensionsCm(a)
    if (disp.widthCm <= 0 || disp.heightCm <= 0) continue
    const showcase = selectShowcaseImage(a.images, preferPremium)
    const pid =
      typeof showcase?.cloudinary_public_id === "string" ? showcase.cloudinary_public_id.trim() : ""
    if (!pid) continue
    out.push({
      code: a.code,
      title: a.title,
      thumbnailUrl: getCloudinaryUrl(pid, "card"),
    })
  }
  return out
}
