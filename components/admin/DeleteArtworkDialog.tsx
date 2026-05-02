"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteArtwork } from "@/app/actions/artworks"

interface DeleteArtworkDialogProps {
  artworkId: string
  artworkTitle: string
  artworkCode: string
  // Uncontrolled mode: provide a trigger
  trigger?: React.ReactNode
  // Controlled mode: provide open + onOpenChange
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export default function DeleteArtworkDialog({
  artworkId,
  artworkTitle,
  artworkCode,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: DeleteArtworkDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled
    ? (v: boolean) => setControlledOpen?.(v)
    : setInternalOpen

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteArtwork(artworkId)
      if ("error" in result) throw new Error(result.error)
      toast.success(`Obra ${artworkCode} eliminada`)
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    } finally {
      setIsDeleting(false)
    }
  }

  const content = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Eliminar obra</DialogTitle>
        <DialogDescription>
          Esta acción no se puede deshacer. Se eliminarán la obra y todas sus imágenes.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 my-2">
        <p className="text-xs text-stone-500 font-mono mb-0.5">{artworkCode}</p>
        <p className="text-sm font-medium text-carbon-900 line-clamp-2">{artworkTitle}</p>
      </div>

      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isDeleting}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="gap-1.5"
        >
          {isDeleting ? (
            <><Loader2 size={14} className="animate-spin" />Eliminando...</>
          ) : (
            <><Trash2 size={14} />Sí, eliminar</>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!isDeleting) setOpen(v) }}>
        {content}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isDeleting) setOpen(v) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" size="sm" className="gap-1.5">
            <Trash2 size={14} />
            Eliminar
          </Button>
        )}
      </DialogTrigger>
      {content}
    </Dialog>
  )
}
