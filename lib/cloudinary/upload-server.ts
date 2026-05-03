import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_BASE_FOLDER } from "@/lib/constants"
import type { UploadImageResponse } from "@/types/api"

/**
 * Sube un buffer a Cloudinary (misma lógica que el cliente, para importación en servidor).
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  mimeType: string,
  artworkCode: string,
  position: number
): Promise<UploadImageResponse> {
  const folder = `${CLOUDINARY_BASE_FOLDER}/${artworkCode}`
  const publicId = `${artworkCode}-${position}`

  const formData = new FormData()
  const uint8 = new Uint8Array(buffer)
  const blob = new Blob([uint8], { type: mimeType || "image/jpeg" })
  formData.append("file", blob, "image.jpg")
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
  formData.append("folder", folder)
  formData.append("public_id", publicId)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Cloudinary: ${res.status} ${t.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    secure_url: string
    public_id: string
    width: number
    height: number
  }

  return {
    cloudinary_url: data.secure_url,
    cloudinary_public_id: data.public_id,
    width: data.width,
    height: data.height,
  }
}
