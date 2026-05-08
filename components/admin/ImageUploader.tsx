"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Star, X, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MAX_IMAGES_PER_ARTWORK } from "@/lib/constants"
import { useImageUpload, type UploadedImage } from "@/hooks/useImageUpload"

// ─── Sortable Thumbnail ────────────────────────────────────────────────────

interface ThumbProps {
  image: UploadedImage
  onRemove: (tempId: string) => void
  onSetPrimary: (tempId: string) => void
}

function SortableThumb({ image, onRemove, onSetPrimary }: ThumbProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.tempId, disabled: image.status !== "done" })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "relative aspect-[4/5] rounded-lg overflow-hidden group select-none",
        image.status === "done" && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-xl z-10 scale-105",
        image.is_primary && image.status === "done" && "ring-2 ring-gold-500",
        image.status === "error" && "ring-2 ring-error"
      )}
    >
      {/* Image */}
      {image.status === "done" && image.cloudinary_url && (
        <Image
          src={image.cloudinary_url}
          alt={image.file_name}
          fill
          className="object-cover pointer-events-none"
          sizes="120px"
          draggable={false}
        />
      )}

      {/* Uploading overlay */}
      {image.status === "uploading" && (
        <div className="absolute inset-0 bg-carbon-900 flex flex-col items-center justify-center gap-2 p-2">
          <p className="text-white text-[10px] truncate w-full text-center">{image.file_name}</p>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div
              className="bg-gold-400 h-1 rounded-full transition-all duration-150"
              style={{ width: `${image.progress}%` }}
            />
          </div>
          <p className="text-white/60 text-[10px]">{image.progress}%</p>
        </div>
      )}

      {/* Error overlay */}
      {image.status === "error" && (
        <div className="absolute inset-0 bg-error/90 flex flex-col items-center justify-center gap-1 p-2">
          <p className="text-white text-[10px] text-center line-clamp-3">{image.error}</p>
          <button
            type="button"
            onClick={() => onRemove(image.tempId)}
            className="mt-1 text-white/80 hover:text-white text-[10px] underline"
          >
            Quitar
          </button>
        </div>
      )}

      {/* Done controls */}
      {image.status === "done" && (
        <>
          <div className="absolute inset-0 bg-carbon-900/0 group-hover:bg-carbon-900/35 transition-colors duration-150" />

          {image.is_primary && (
            <div className="absolute top-1.5 left-1.5 bg-gold-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-tight pointer-events-none">
              Principal
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {!image.is_primary && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onSetPrimary(image.tempId) }}
                title="Establecer como principal"
                className="w-6 h-6 rounded bg-white/90 hover:bg-gold-500 hover:text-white text-stone-600 flex items-center justify-center transition-colors shadow-sm"
              >
                <Star size={11} fill="currentColor" />
              </button>
            )}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(image.tempId) }}
              title="Eliminar imagen"
              className="w-6 h-6 rounded bg-white/90 hover:bg-error hover:text-white text-stone-600 flex items-center justify-center transition-colors shadow-sm"
            >
              <X size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export interface ImageUploaderHandle {
  clearPendingDeletes: () => void
}

export interface ImageUploaderProps {
  uploadId: string
  onChange: (images: UploadedImage[]) => void
  /** Notifica los public_id de imágenes ya en BD que el usuario quitó del form pero aún no se borran de Cloudinary */
  onPendingDeletesChange?: (publicIds: string[]) => void
  initialImages?: Omit<UploadedImage, "tempId" | "status" | "progress" | "file_name">[]
  maxImages?: number
  className?: string
}

const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(function ImageUploader(
  {
    uploadId,
    onChange,
    onPendingDeletesChange,
    initialImages,
    maxImages = MAX_IMAGES_PER_ARTWORK,
    className,
  },
  ref,
) {
  const {
    images,
    isUploading,
    canAddMore,
    doneImages,
    pendingDeletes,
    upload,
    remove,
    reorder,
    setPrimary,
    initialize,
    clearPendingDeletes,
  } = useImageUpload()

  useImperativeHandle(ref, () => ({ clearPendingDeletes }), [clearPendingDeletes])

  // Initialize with existing images (edit mode) — only on first mount
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current && initialImages && initialImages.length > 0) {
      initializedRef.current = true
      initialize(initialImages)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of changes — use ref to avoid stale closure
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onChangeRef.current(doneImages) }, [doneImages])

  const onPendingDeletesChangeRef = useRef(onPendingDeletesChange)
  useEffect(() => { onPendingDeletesChangeRef.current = onPendingDeletesChange }, [onPendingDeletesChange])
  useEffect(() => { onPendingDeletesChangeRef.current?.(pendingDeletes) }, [pendingDeletes])

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - doneImages.length
      if (remaining <= 0) {
        toast.error(`Límite de ${maxImages} imágenes alcanzado`)
        return
      }

      const toProcess = files.slice(0, remaining)
      if (files.length > remaining) {
        toast.info(`Solo se agregarán ${remaining} imagen${remaining !== 1 ? "es" : ""} (límite: ${maxImages})`)
      }

      const errors = await upload(toProcess, uploadId)
      errors.forEach(({ file_name, message }) => toast.error(`${file_name}: ${message}`))
    },
    [upload, uploadId, doneImages.length, maxImages]
  )

  // ── Dropzone ─────────────────────────────────────────────────────────────

  const isDropDisabled = !canAddMore || isUploading
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: isDropDisabled,
    onDrop: handleFiles,
    onDropRejected: (rejections) => {
      rejections.forEach(({ file, errors }) => {
        const msg = errors[0]?.code === "file-too-large"
          ? "El archivo excede 10 MB"
          : errors[0]?.message ?? "Archivo no válido"
        toast.error(`${file.name}: ${msg}`)
      })
    },
  })

  // ── Clipboard paste ───────────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isDropDisabled) return
      const items = Array.from(e.clipboardData?.items ?? [])
      const files = items
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)
      if (files.length > 0) handleFiles(files)
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [handleFiles, isDropDisabled])

  // ── dnd-kit ───────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorder(String(active.id), String(over.id))
    }
  }

  const sortableIds = doneImages.map((i) => i.tempId)
  const uploadingImages = images.filter((i) => i.status === "uploading")
  const errorImages = images.filter((i) => i.status === "error")

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200",
          isDragActive
            ? "border-gold-500 bg-gold-100/30 scale-[1.01]"
            : isDropDisabled
            ? "border-stone-100 bg-stone-50 opacity-50 cursor-default"
            : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100/50 cursor-pointer",
          images.length === 0 ? "py-12" : "py-4"
        )}
      >
        <input {...getInputProps()} />

        {images.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
              <Upload size={20} strokeWidth={1.5} className="text-stone-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-600">
                {isDragActive ? "Suelta las imágenes aquí" : "Arrastra imágenes o haz click para seleccionar"}
              </p>
              <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP, HEIC · Máx 10 MB · Hasta {maxImages} imágenes</p>
              <p className="text-xs text-stone-400 mt-0.5">También puedes pegar con Ctrl+V</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <ImageIcon size={14} />
            <p className="text-sm">
              {isDragActive
                ? "Suelta aquí para agregar"
                : isDropDisabled
                ? `Límite alcanzado (${maxImages}/${maxImages})`
                : `Agregar más · ${doneImages.length}/${maxImages}`}
            </p>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {doneImages.map((image) => (
                <SortableThumb key={image.tempId} image={image} onRemove={remove} onSetPrimary={setPrimary} />
              ))}
              {uploadingImages.map((image) => (
                <SortableThumb key={image.tempId} image={image} onRemove={remove} onSetPrimary={setPrimary} />
              ))}
              {errorImages.map((image) => (
                <SortableThumb key={image.tempId} image={image} onRemove={remove} onSetPrimary={setPrimary} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Helper */}
      {doneImages.length > 1 && (
        <p className="text-xs text-stone-400">
          Arrastra para reordenar · ★ establece la imagen principal
        </p>
      )}
    </div>
  )
})

export default ImageUploader
