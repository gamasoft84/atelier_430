"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { bulkPublishDrafts } from "@/app/actions/bulk-import"
import type { ArtworkCategory } from "@/types/artwork"
import { toast } from "sonner"

export interface DraftRow {
  id: string
  code: string
  title: string
  category: ArtworkCategory
  technique: string | null
  created_at: string
  artwork_images: {
    cloudinary_url: string
    is_primary: boolean
    position: number
  }[]
}

const CATEGORY_LABEL: Record<ArtworkCategory, string> = {
  religiosa: "Religiosa",
  nacional: "Nacional",
  europea: "Europea",
  moderna: "Moderna",
}

interface DraftsReviewClientProps {
  drafts: DraftRow[]
}

export default function DraftsReviewClient({ drafts }: DraftsReviewClientProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const allIds = useMemo(() => drafts.map((d) => d.id), [drafts])

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(allIds) : new Set())
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const publish = async () => {
    if (selected.size === 0) {
      toast.error("Selecciona al menos una obra")
      return
    }
    setBusy(true)
    try {
      const res = await bulkPublishDrafts([...selected])
      if ("error" in res) {
        toast.error(res.error)
      } else {
        toast.success(`Publicadas: ${res.published}`)
        setSelected(new Set())
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  if (drafts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-14 text-center text-sm text-stone-500">
        No hay borradores. Importa un lote desde{" "}
        <Link href="/admin/obras/importar" className="text-gold-600 hover:underline font-medium">
          Importar masivo
        </Link>
        .
      </div>
    )
  }

  const allSelected = allIds.length > 0 && selected.size === allIds.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            id="select-all"
            type="checkbox"
            className="h-4 w-4 rounded border-stone-300 text-gold-600 focus:ring-gold-500"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          <label htmlFor="select-all" className="text-sm text-stone-600 cursor-pointer">
            Seleccionar todas ({drafts.length})
          </label>
        </div>
        <Button
          type="button"
          disabled={busy || selected.size === 0}
          onClick={() => void publish()}
          className="bg-gold-500 hover:bg-gold-400 text-white gap-2"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          Publicar seleccionadas ({selected.size})
        </Button>
      </div>

      <div className="rounded-lg border border-stone-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-left">
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2 font-semibold text-stone-500 text-xs uppercase">Miniatura</th>
              <th className="px-3 py-2 font-semibold text-stone-500 text-xs uppercase">Código</th>
              <th className="px-3 py-2 font-semibold text-stone-500 text-xs uppercase">Título</th>
              <th className="px-3 py-2 font-semibold text-stone-500 text-xs uppercase">Cat.</th>
              <th className="px-3 py-2 font-semibold text-stone-500 text-xs uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {drafts.map((d) => {
              const img =
                d.artwork_images.find((i) => i.is_primary) ??
                [...d.artwork_images].sort((a, b) => a.position - b.position)[0]
              return (
                <tr key={d.id} className="hover:bg-stone-50/80">
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-stone-300 text-gold-600 focus:ring-gold-500"
                      checked={selected.has(d.id)}
                      onChange={(e) => toggleOne(d.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative w-12 h-14 rounded-md overflow-hidden bg-stone-100">
                      {img ? (
                        <Image src={img.cloudinary_url} alt="" fill className="object-cover" sizes="48px" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{d.code}</td>
                  <td className="px-3 py-2 text-stone-700 max-w-[200px] truncate">{d.title}</td>
                  <td className="px-3 py-2 text-xs capitalize">{CATEGORY_LABEL[d.category]}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/obras/${d.id}`}
                      className="text-xs font-medium text-gold-600 hover:text-gold-500"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-400">
        Al publicar, las obras pasan a estado disponible y aparecen en el catálogo público. Revisa título y
        descripción en cada ficha antes si lo necesitas.
      </p>
    </div>
  )
}
