"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Pencil, DollarSign, Eye, EyeOff, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import SellArtworkDialog from "@/components/admin/SellArtworkDialog"
import DeleteArtworkDialog from "@/components/admin/DeleteArtworkDialog"
import { toggleArtworkVisibility } from "@/app/actions/artworks"
import type { ArtworkStatus } from "@/types/artwork"

interface ArtworkActionsMenuProps {
  id: string
  code: string
  title: string
  status: ArtworkStatus
}

export default function ArtworkActionsMenu({ id, code, title, status }: ArtworkActionsMenuProps) {
  const router = useRouter()
  const [sellOpen, setSellOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggleVisibility = () => {
    startTransition(async () => {
      const result = await toggleArtworkVisibility(id, status)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        const msg = status === "hidden" ? "Obra visible en catálogo" : "Obra ocultada del catálogo"
        toast.success(msg)
        router.refresh()
      }
    })
  }

  const isHidden = status === "hidden"
  const isSold = status === "sold"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-stone-400 hover:text-carbon-900 hover:bg-stone-100"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MoreHorizontal size={14} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/admin/obras/${id}`} className="flex items-center gap-2 cursor-pointer">
              <Pencil size={13} />
              Editar
            </Link>
          </DropdownMenuItem>

          {!isSold && (
            <DropdownMenuItem
              onClick={() => setSellOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <DollarSign size={13} />
              Registrar venta
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={handleToggleVisibility}
            className="flex items-center gap-2 cursor-pointer"
            disabled={isSold}
          >
            {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
            {isHidden ? "Hacer visible" : "Ocultar"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 size={13} />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SellArtworkDialog
        artworkId={id}
        artworkCode={code}
        artworkTitle={title}
        open={sellOpen}
        onOpenChange={setSellOpen}
      />

      <DeleteArtworkDialog
        artworkId={id}
        artworkCode={code}
        artworkTitle={title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
