import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_BASE_FOLDER } from "@/lib/constants"
import type { UploadImageResponse } from "@/types/api"

export async function uploadToCloudinary(
  file: File,
  artworkCode: string,
  position: number = 0
): Promise<UploadImageResponse> {
  const folder = `${CLOUDINARY_BASE_FOLDER}/${artworkCode}`
  const publicId = `${artworkCode}-${position}`

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
  formData.append("folder", folder)
  formData.append("public_id", publicId)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.statusText}`)
  }

  const data = await res.json()

  return {
    cloudinary_url: data.secure_url,
    cloudinary_public_id: data.public_id,
    width: data.width,
    height: data.height,
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await fetch("/api/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_id: publicId }),
  })
}
