"use client"

import { useState, useCallback, useRef } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import { MAX_IMAGES_PER_ARTWORK } from "@/lib/constants"

export interface UploadedImage {
  tempId: string
  cloudinary_url: string
  cloudinary_public_id: string
  width: number
  height: number
  position: number
  is_primary: boolean
  file_name: string
  status: "uploading" | "done" | "error"
  progress: number
  error?: string
}

export interface ValidationError {
  file_name: string
  message: string
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Formato no soportado. Usa JPG, PNG, WebP o HEIC."
  }
  if (file.size > 10 * 1024 * 1024) {
    return "El archivo excede el límite de 10 MB."
  }
  return null
}

async function fetchSignature(
  folder: string,
  publicId: string,
  timestamp: number
): Promise<{ signature: string; api_key: string; cloud_name: string }> {
  const res = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, public_id: publicId, timestamp }),
  })
  if (!res.ok) throw new Error("No se pudo obtener la firma de Cloudinary")
  return res.json()
}

function uploadViaXHR(
  file: File,
  params: {
    cloud_name: string
    api_key: string
    signature: string
    timestamp: number
    folder: string
    public_id: string
  },
  onProgress: (percent: number) => void
): Promise<{ secure_url: string; public_id: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err?.error?.message ?? `Error ${xhr.status}`))
        } catch {
          reject(new Error(`Error al subir imagen (${xhr.status})`))
        }
      }
    })

    xhr.addEventListener("error", () => reject(new Error("Error de conexión al subir imagen")))

    const form = new FormData()
    form.append("file", file)
    form.append("api_key", params.api_key)
    form.append("timestamp", String(params.timestamp))
    form.append("signature", params.signature)
    form.append("folder", params.folder)
    form.append("public_id", params.public_id)

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${params.cloud_name}/image/upload`)
    xhr.send(form)
  })
}

export interface UseImageUploadReturn {
  images: UploadedImage[]
  isUploading: boolean
  canAddMore: boolean
  doneImages: UploadedImage[]
  upload: (files: File[], uploadId: string) => Promise<ValidationError[]>
  remove: (tempId: string) => void
  reorder: (activeId: string, overId: string) => void
  setPrimary: (tempId: string) => void
  initialize: (existing: Omit<UploadedImage, "tempId" | "status" | "progress" | "file_name">[]) => void
  reset: () => void
}

export function useImageUpload(): UseImageUploadReturn {
  const [images, _setImages] = useState<UploadedImage[]>([])
  // Mirror state in a ref so callbacks always see latest value without stale closures
  const imagesRef = useRef<UploadedImage[]>([])

  const setImages = useCallback(
    (updater: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => {
      _setImages((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        imagesRef.current = next
        return next
      })
    },
    []
  )

  const doneImages = images
    .filter((i) => i.status === "done")
    .sort((a, b) => a.position - b.position)

  const uploadingCount = images.filter((i) => i.status === "uploading").length
  const canAddMore = doneImages.length + uploadingCount < MAX_IMAGES_PER_ARTWORK
  const isUploading = uploadingCount > 0

  const upload = useCallback(
    async (files: File[], uploadId: string): Promise<ValidationError[]> => {
      const current = imagesRef.current
      const currentDone = current.filter((i) => i.status === "done").length
      const currentPending = current.filter((i) => i.status === "uploading").length
      const available = MAX_IMAGES_PER_ARTWORK - currentDone - currentPending

      if (available <= 0) return []

      const filesToProcess = files.slice(0, available)
      const validationErrors: ValidationError[] = []
      const validFiles: File[] = []

      for (const file of filesToProcess) {
        const err = validateFile(file)
        if (err) {
          validationErrors.push({ file_name: file.name, message: err })
        } else {
          validFiles.push(file)
        }
      }

      if (validFiles.length === 0) return validationErrors

      // Add all valid files as "uploading" immediately for instant UI feedback
      const newImages: UploadedImage[] = validFiles.map((file, i) => ({
        tempId: crypto.randomUUID(),
        cloudinary_url: "",
        cloudinary_public_id: "",
        width: 0,
        height: 0,
        position: currentDone + i,
        is_primary: currentDone === 0 && currentPending === 0 && i === 0,
        file_name: file.name,
        status: "uploading",
        progress: 0,
      }))

      setImages((prev) => [...prev, ...newImages])

      // Upload all in parallel
      await Promise.all(
        validFiles.map(async (file, i) => {
          const tempId = newImages[i].tempId
          const position = currentDone + i
          const folder = `atelier430/artworks/${uploadId}`
          const publicId = `${uploadId}-${position + 1}`
          const timestamp = Math.round(Date.now() / 1000)

          try {
            const signParams = await fetchSignature(folder, publicId, timestamp)

            const result = await uploadViaXHR(
              file,
              { ...signParams, folder, public_id: publicId, timestamp },
              (progress) => {
                setImages((prev) =>
                  prev.map((img) => (img.tempId === tempId ? { ...img, progress } : img))
                )
              }
            )

            setImages((prev) =>
              prev.map((img) =>
                img.tempId === tempId
                  ? {
                      ...img,
                      cloudinary_url: result.secure_url,
                      cloudinary_public_id: result.public_id,
                      width: result.width,
                      height: result.height,
                      status: "done",
                      progress: 100,
                    }
                  : img
              )
            )
          } catch (err) {
            setImages((prev) =>
              prev.map((img) =>
                img.tempId === tempId
                  ? {
                      ...img,
                      status: "error",
                      error: err instanceof Error ? err.message : "Error desconocido",
                    }
                  : img
              )
            )
          }
        })
      )

      return validationErrors
    },
    [setImages]
  )

  const remove = useCallback(
    (tempId: string) => {
      setImages((prev) => {
        const image = prev.find((i) => i.tempId === tempId)

        // Fire-and-forget delete from Cloudinary
        if (image?.status === "done" && image.cloudinary_public_id) {
          fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: image.cloudinary_public_id }),
          }).catch(console.error)
        }

        const filtered = prev.filter((i) => i.tempId !== tempId)

        // Reassign positions and auto-set primary if needed
        let doneIdx = 0
        const hasPrimary = filtered.filter((i) => i.status === "done").some((i) => i.is_primary)
        const newImages = filtered.map((img) => {
          if (img.status !== "done") return img
          const pos = doneIdx++
          return {
            ...img,
            position: pos,
            is_primary: !hasPrimary && pos === 0 ? true : img.is_primary,
          }
        })

        return newImages
      })
    },
    [setImages]
  )

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      setImages((prev) => {
        const done = prev.filter((i) => i.status === "done")
        const others = prev.filter((i) => i.status !== "done")
        const activeIdx = done.findIndex((i) => i.tempId === activeId)
        const overIdx = done.findIndex((i) => i.tempId === overId)
        if (activeIdx === -1 || overIdx === -1) return prev

        const reordered = arrayMove(done, activeIdx, overIdx).map((img, idx) => ({
          ...img,
          position: idx,
        }))

        return [...reordered, ...others]
      })
    },
    [setImages]
  )

  const setPrimary = useCallback(
    (tempId: string) => {
      setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.tempId === tempId })))
    },
    [setImages]
  )

  const initialize = useCallback(
    (existing: Omit<UploadedImage, "tempId" | "status" | "progress" | "file_name">[]) => {
      const initialized: UploadedImage[] = existing
        .sort((a, b) => a.position - b.position)
        .map((img) => ({
          ...img,
          tempId: crypto.randomUUID(),
          file_name: img.cloudinary_public_id.split("/").pop() ?? "",
          status: "done",
          progress: 100,
        }))
      setImages(initialized)
    },
    [setImages]
  )

  const reset = useCallback(() => setImages([]), [setImages])

  return {
    images,
    isUploading,
    canAddMore,
    doneImages,
    upload,
    remove,
    reorder,
    setPrimary,
    initialize,
    reset,
  }
}
