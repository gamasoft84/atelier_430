"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { ARTWORK_CATEGORIES, ARTWORK_TECHNIQUES } from "@/lib/constants"
import type { SizeOption, MarcoOption } from "@/types/catalog"
import type { CatalogFormat } from "@/types/artwork"

const CATEGORY_LABEL: Record<string, string> = {
  religiosa: "Religiosa",
  nacional:  "Nacional",
  europea:   "Europea",
  moderna:   "Moderna",
}

const TECHNIQUE_LABEL: Record<string, string> = {
  oleo:      "Óleo",
  impresion: "Impresión",
}

const SIZE_OPTIONS: { value: SizeOption; label: string; desc: string }[] = [
  { value: "chico",   label: "Chico",   desc: "< 50 cm" },
  { value: "mediano", label: "Mediano", desc: "50 – 80 cm" },
  { value: "grande",  label: "Grande",  desc: "80 – 120 cm" },
  { value: "xl",      label: "XL",      desc: "> 120 cm" },
]

const FORMAT_BUTTONS: CatalogFormat[] = ["horizontal", "vertical"]

interface FilterSidebarProps {
  categorias: string[]
  tecnicas: string[]
  tamanos: SizeOption[]
  formatos: CatalogFormat[]
  marco: MarcoOption | null
  precioMin: number | null
  precioMax: number | null
  soloDisponibles: boolean
  showPrices: boolean
  priceRange: { min: number; max: number }
  lockedCategory?: string
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function FilterSidebar({
  categorias,
  tecnicas,
  tamanos,
  formatos,
  marco,
  precioMin,
  precioMax,
  soloDisponibles,
  showPrices,
  priceRange,
  lockedCategory,
  mobileOpen,
  onMobileClose,
}: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value !== null && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const toggleList = useCallback(
    (key: string, current: string[], value: string) => {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      updateParam(key, next.length > 0 ? next.join(",") : null)
    },
    [updateParam]
  )

  const content = (
    <div className="space-y-6">
      {/* Solo disponibles */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={soloDisponibles}
          onChange={() => updateParam("solo", soloDisponibles ? "false" : null)}
          className="w-4 h-4 accent-gold-500"
        />
        <span className="text-sm font-medium text-carbon-900 group-hover:text-gold-500 transition-colors">
          Solo disponibles
        </span>
      </label>

      <div className="h-px bg-stone-100" />

      {/* Categoría */}
      {!lockedCategory && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Categoría
          </p>
          <div className="space-y-2">
            {ARTWORK_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={categorias.includes(cat)}
                  onChange={() => toggleList("categoria", categorias, cat)}
                  className="w-4 h-4 accent-gold-500"
                />
                <span className="text-sm text-stone-600 group-hover:text-carbon-900 transition-colors">
                  {CATEGORY_LABEL[cat]}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Técnica */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Técnica
        </p>
        <div className="space-y-2">
          {ARTWORK_TECHNIQUES.map((t) => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={tecnicas.includes(t)}
                onChange={() => toggleList("tecnica", tecnicas, t)}
                className="w-4 h-4 accent-gold-500"
              />
              <span className="text-sm text-stone-600 group-hover:text-carbon-900 transition-colors">
                {TECHNIQUE_LABEL[t]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Formato en catálogo (mismo patrón que Marco) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Formato
        </p>
        <div className="flex gap-2">
          {FORMAT_BUTTONS.map((m) => {
            const active = formatos.length === 1 && formatos[0] === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => updateParam("formato", active ? null : m)}
                className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  active
                    ? "border-gold-500 bg-gold-100 text-gold-500 font-medium"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                {m === "horizontal" ? "Horizontal" : "Vertical"}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tamaño */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Tamaño
        </p>
        <div className="space-y-2">
          {SIZE_OPTIONS.map(({ value, label, desc }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={tamanos.includes(value)}
                onChange={() => toggleList("tamano", tamanos, value)}
                className="w-4 h-4 accent-gold-500"
              />
              <span className="text-sm text-stone-600 group-hover:text-carbon-900 transition-colors">
                {label}
                <span className="text-stone-400 ml-1">{desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Marco */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
          Marco
        </p>
        <div className="flex gap-2">
          {(["con", "sin"] as MarcoOption[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateParam("marco", marco === m ? null : m)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize ${
                marco === m
                  ? "border-gold-500 bg-gold-100 text-gold-500 font-medium"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {m} marco
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      {showPrices && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Precio (MXN)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={String(priceRange.min)}
              value={precioMin ?? ""}
              onChange={(e) =>
                updateParam("precio_min", e.target.value || null)
              }
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-gold-500"
            />
            <span className="text-stone-300 text-sm flex-shrink-0">—</span>
            <input
              type="number"
              placeholder={String(priceRange.max)}
              value={precioMax ?? ""}
              onChange={(e) =>
                updateParam("precio_max", e.target.value || null)
              }
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-gold-500"
            />
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Rango: ${priceRange.min.toLocaleString("es-MX")} – ${priceRange.max.toLocaleString("es-MX")}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
        <p className="text-sm font-semibold text-carbon-900 mb-4">Filtrar</p>
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-carbon-900/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.div
              className="relative ml-auto w-72 max-w-[85vw] h-full bg-white shadow-xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <p className="font-semibold text-carbon-900">Filtros</p>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">{content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
