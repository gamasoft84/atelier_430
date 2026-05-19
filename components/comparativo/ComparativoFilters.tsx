"use client"

import { useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { SlidersHorizontal, X } from "lucide-react"
import { ARTWORK_CATEGORIES, ARTWORK_TECHNIQUES } from "@/lib/constants"
import { ARTWORK_SIZE_LABEL } from "@/lib/artwork-size"
import type { SizeOption, MarcoOption } from "@/types/catalog"
import type { ArtworkCategory, CatalogFormat } from "@/types/artwork"
import {
  EMPTY_COMPARATIVO_PICKER_FILTERS,
  exactSizeKey,
  formatExactSizeLabel,
  hasActiveComparativoPickerFilters,
  type ComparativoExactSize,
  type ComparativoPickerFilters,
} from "@/types/comparativo-picker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CATEGORY_LABEL: Record<ArtworkCategory, string> = {
  religiosa: "Religiosa",
  nacional: "Nacional",
  europea: "Europea",
  moderna: "Moderna",
}

const TECHNIQUE_LABEL: Record<string, string> = {
  oleo: "Óleo",
  impresion: "Impresión",
}

const SIZE_OPTIONS: SizeOption[] = ["chico", "mediano", "grande", "xl"]

const MARCO_OPTIONS: { value: MarcoOption; label: string }[] = [
  { value: "con", label: "Con marco" },
  { value: "sin", label: "Sin marco" },
]

const FORMAT_OPTIONS: { value: CatalogFormat; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
]

interface ComparativoFiltersProps {
  filters: ComparativoPickerFilters
  onChange: (next: ComparativoPickerFilters) => void
  mobileOpen: boolean
  onMobileOpen: () => void
  onMobileClose: () => void
  resultCount?: number
  pending?: boolean
  priceRange?: { min: number; max: number }
  dimensionOptions?: ComparativoExactSize[]
}

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function ComparativoFilters({
  filters,
  onChange,
  mobileOpen,
  onMobileOpen,
  onMobileClose,
  resultCount,
  pending,
  priceRange = { min: 0, max: 10000 },
  dimensionOptions = [],
}: ComparativoFiltersProps) {
  const active = hasActiveComparativoPickerFilters(filters)

  const toggleCategory = useCallback(
    (cat: ArtworkCategory) => {
      onChange({
        ...filters,
        categorias: toggleInList(filters.categorias, cat),
      })
    },
    [filters, onChange],
  )

  const toggleTechnique = useCallback(
    (t: string) => {
      onChange({
        ...filters,
        tecnicas: toggleInList(filters.tecnicas, t),
      })
    },
    [filters, onChange],
  )

  const toggleSize = useCallback(
    (s: SizeOption) => {
      onChange({
        ...filters,
        tamanos: toggleInList(filters.tamanos, s),
      })
    },
    [filters, onChange],
  )

  const setMarco = useCallback(
    (marco: MarcoOption | null) => {
      onChange({ ...filters, marco })
    },
    [filters, onChange],
  )

  const setFormato = useCallback(
    (formato: CatalogFormat | null) => {
      onChange({ ...filters, formato })
    },
    [filters, onChange],
  )

  const setMedida = useCallback(
    (medida: ComparativoExactSize | null) => {
      onChange({ ...filters, medida })
    },
    [filters, onChange],
  )

  const setPrecioMin = useCallback(
    (raw: string) => {
      const precio_min = raw ? Number(raw) || null : null
      onChange({ ...filters, precio_min })
    },
    [filters, onChange],
  )

  const setPrecioMax = useCallback(
    (raw: string) => {
      const precio_max = raw ? Number(raw) || null : null
      onChange({ ...filters, precio_max })
    },
    [filters, onChange],
  )

  const clearFilters = useCallback(() => {
    onChange(EMPTY_COMPARATIVO_PICKER_FILTERS)
  }, [onChange])

  const filterPanel = (
    <div className="space-y-5">
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Categoría
        </p>
        <div className="flex flex-wrap gap-2">
          {ARTWORK_CATEGORIES.map((cat) => {
            const on = filters.categorias.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  on
                    ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                )}
              >
                {CATEGORY_LABEL[cat]}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Marco
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMarco(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filters.marco === null
                ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
            )}
          >
            Todos
          </button>
          {MARCO_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMarco(filters.marco === value ? null : value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filters.marco === value
                  ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Técnica
        </p>
        <div className="flex flex-wrap gap-2">
          {ARTWORK_TECHNIQUES.map((t) => {
            const on = filters.tecnicas.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTechnique(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  on
                    ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                )}
              >
                {TECHNIQUE_LABEL[t] ?? t}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Tamaño (lado mayor)
        </p>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => {
            const on = filters.tamanos.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  on
                    ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                )}
              >
                {ARTWORK_SIZE_LABEL[s]}
              </button>
            )
          })}
        </div>
      </section>

      {dimensionOptions.length > 0 ? (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Medida exacta (lienzo)
          </p>
          <select
            value={filters.medida ? exactSizeKey(filters.medida) : ""}
            onChange={(e) => {
              const key = e.target.value
              if (!key) {
                setMedida(null)
                return
              }
              const found = dimensionOptions.find((d) => exactSizeKey(d) === key)
              setMedida(found ?? null)
            }}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-carbon-900 focus:border-gold-500 focus:outline-none"
          >
            <option value="">Todas las medidas</option>
            {dimensionOptions.map((d) => (
              <option key={exactSizeKey(d)} value={exactSizeKey(d)}>
                {formatExactSizeLabel(d)}
              </option>
            ))}
          </select>
        </section>
      ) : null}

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Orientación
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormato(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filters.formato === null
                ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
            )}
          >
            Todas
          </button>
          {FORMAT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormato(filters.formato === value ? null : value)}
              className={cn(
                "flex-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filters.formato === value
                  ? "border-gold-500 bg-gold-500/10 text-carbon-900"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Precio (MXN)
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={String(priceRange.min)}
            value={filters.precio_min ?? ""}
            onChange={(e) => setPrecioMin(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-gold-500 focus:outline-none"
          />
          <span className="shrink-0 text-sm text-stone-300">—</span>
          <input
            type="number"
            placeholder={String(priceRange.max)}
            value={filters.precio_max ?? ""}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-gold-500 focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-stone-400">
          Rango en catálogo: ${priceRange.min.toLocaleString("es-MX")} – $
          {priceRange.max.toLocaleString("es-MX")}
        </p>
      </section>

      {active ? (
        <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="w-full">
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 lg:hidden"
          onClick={onMobileOpen}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtros
          {active ? (
            <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              activos
            </span>
          ) : null}
        </Button>

        {typeof resultCount === "number" ? (
          <span className="text-xs text-stone-500 tabular-nums">
            {pending ? "Cargando…" : `${resultCount} obra${resultCount === 1 ? "" : "s"}`}
          </span>
        ) : null}

        {active ? (
          <button
            type="button"
            onClick={clearFilters}
            className="hidden text-xs font-medium text-gold-600 hover:text-gold-500 lg:inline"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      {/* Desktop: filtros visibles */}
      <div className="hidden rounded-lg border border-stone-200 bg-stone-50/80 p-4 lg:block">
        {filterPanel}
      </div>

      {/* Móvil: drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              className="absolute inset-0 bg-carbon-900/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              aria-hidden
            />
            <motion.div
              className="relative ml-auto flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              role="dialog"
              aria-modal
              aria-label="Filtros del comparativo"
            >
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <p className="font-semibold text-carbon-900">Filtros</p>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="rounded-lg p-2 transition-colors hover:bg-stone-100"
                  aria-label="Cerrar filtros"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">{filterPanel}</div>
              <div className="border-t border-stone-100 p-4">
                <Button type="button" className="w-full bg-gold-500 text-white hover:bg-gold-400" onClick={onMobileClose}>
                  Ver resultados
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
