"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { toast } from "sonner"
import { browseComparativoArtworks } from "@/app/actions/comparativo"
import type { ComparativoPickerArtwork } from "@/lib/comparativo/picker-artworks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const MAX = 5
const MIN = 3

interface ComparativoPickerProps {
  variant?: "public" | "admin"
}

export default function ComparativoPicker({ variant = "public" }: ComparativoPickerProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<ComparativoPickerArtwork[]>([])
  const [query, setQuery] = useState("")
  const [browse, setBrowse] = useState<ComparativoPickerArtwork[]>([])
  const [pending, startTransition] = useTransition()

  const selectedCodes = useMemo(() => new Set(selected.map((s) => s.code)), [selected])

  const loadBrowse = useCallback((q: string) => {
    startTransition(async () => {
      const list = await browseComparativoArtworks(q)
      setBrowse(list)
    })
  }, [])

  useEffect(() => {
    const delay = query.trim() ? 280 : 0
    const t = window.setTimeout(() => loadBrowse(query), delay)
    return () => window.clearTimeout(t)
  }, [query, loadBrowse])

  const gridItems = useMemo(
    () => browse.filter((item) => !selectedCodes.has(item.code)),
    [browse, selectedCodes],
  )

  const toggle = (item: ComparativoPickerArtwork) => {
    if (selectedCodes.has(item.code)) {
      setSelected((s) => s.filter((x) => x.code !== item.code))
      return
    }
    if (selected.length >= MAX) {
      toast.error(`Máximo ${MAX} obras`)
      return
    }
    setSelected((s) => [...s, item])
  }

  const remove = (code: string) => {
    setSelected((s) => s.filter((x) => x.code !== code))
  }

  const openComparativo = () => {
    if (selected.length < MIN) {
      toast.error(`Selecciona al menos ${MIN} obras`)
      return
    }
    const obras = selected.map((s) => s.code).join(",")
    router.push(`/comparativo?obras=${encodeURIComponent(obras)}`)
  }

  const selectionHint =
    selected.length === 0
      ? `Elige entre ${MIN} y ${MAX} obras`
      : selected.length < MIN
        ? `${selected.length} de ${MIN} mínimo`
        : `${selected.length} de ${MAX}`

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código o título…"
          className="pl-9"
        />
      </div>

      {selected.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500">{selectionHint}</p>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {selected.map((s, i) => (
              <li key={s.code} className="relative shrink-0">
                <div className="relative h-24 w-20 overflow-hidden rounded-lg border-2 border-gold-500 bg-stone-100">
                  <Image
                    src={s.thumbnailUrl}
                    alt={s.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <span className="absolute left-1 top-1 rounded bg-carbon-900/80 px-1 font-mono text-[10px] text-cream">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-1 max-w-20 truncate font-mono text-[10px] text-gold-700">{s.code}</p>
                <button
                  type="button"
                  onClick={() => remove(s.code)}
                  className="absolute -right-1 -top-1 rounded-full bg-carbon-900 p-0.5 text-cream shadow hover:bg-stone-700"
                  aria-label={`Quitar ${s.code}`}
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-stone-500">{selectionHint}</p>
      )}

      {pending ? <p className="text-xs text-stone-400">Cargando obras…</p> : null}

      {gridItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gridItems.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => toggle(item)}
              disabled={selected.length >= MAX}
              className={cn(
                "group relative overflow-hidden rounded-lg border-2 text-left transition-colors",
                "border-stone-200 bg-stone-50 hover:border-stone-300 disabled:opacity-50",
              )}
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform group-hover:scale-[1.02]"
                />
              </div>
              <div className="border-t border-stone-100 bg-white px-2 py-2">
                <p className="font-mono text-[10px] text-stone-500">{item.code}</p>
                <p className="truncate text-xs text-carbon-900">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      ) : !pending ? (
        <p className="text-sm text-stone-500">
          {query.trim()
            ? "Sin resultados con imagen y medidas. Prueba otro código o título."
            : "No hay obras listas para comparativo en este momento."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={openComparativo}
          disabled={selected.length < MIN}
          className="bg-gold-500 text-white hover:bg-gold-400"
        >
          Ver comparativo a escala
        </Button>
        {variant === "admin" ? (
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/configuracion">Textos del comparativo</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild>
            <Link href="/catalogo">Ir al catálogo</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
