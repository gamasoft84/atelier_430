import Link from "next/link"
import { ChevronLeft, ChevronRight, ImageIcon, Pin } from "lucide-react"
import { cn } from "@/lib/utils"
import ArtworkActionsMenu from "@/components/admin/ArtworkActionsMenu"
import ArtworksTableThumb from "@/components/admin/ArtworksTableThumb"
import type { ArtworkCategory, ArtworkStatus } from "@/types/artwork"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ArtworkRow {
  id: string
  code: string
  title: string
  category: ArtworkCategory
  status: ArtworkStatus
  price: number | null
  original_price: number | null
  show_price: boolean
  width_cm: number | null
  height_cm: number | null
  price_locked: boolean
  stock_quantity: number
  created_at: string
  artwork_images: {
    cloudinary_url: string
    cloudinary_public_id: string
    is_primary: boolean
    position: number
  }[]
}

interface ArtworksTableProps {
  artworks: ArtworkRow[]
  page: number
  totalPages: number
  currentParams: Record<string, string | undefined>
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ArtworkStatus, { label: string; className: string }> = {
  available: { label: "Disponible", className: "bg-green-50 text-green-700 border border-green-200" },
  reserved:  { label: "Reservada",  className: "bg-amber-50 text-amber-700 border border-amber-200" },
  sold:      { label: "Vendida",    className: "bg-stone-100 text-stone-500 border border-stone-200" },
  hidden:    { label: "Oculta",     className: "bg-stone-50 text-stone-400 border border-stone-200" },
  draft:     { label: "Borrador",   className: "bg-violet-50 text-violet-800 border border-violet-200" },
}

const CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  religiosa: "Religiosa",
  nacional:  "Nacional",
  europea:   "Europea",
  moderna:   "Moderna",
}

function formatPrice(price: number | null, show: boolean): string {
  if (!show) return "Privado"
  if (price === null) return "—"
  return `$${price.toLocaleString("es-MX")}`
}

function formatOriginalPrice(originalPrice: number | null, show: boolean): string {
  if (!show) return "Privado"
  if (originalPrice === null) return "—"
  return `$${originalPrice.toLocaleString("es-MX")}`
}

function formatSize(widthCm: number | null, heightCm: number | null): string {
  if (typeof widthCm === "number" && typeof heightCm === "number") return `${widthCm} × ${heightCm}`
  if (typeof widthCm === "number") return `${widthCm} × —`
  if (typeof heightCm === "number") return `— × ${heightCm}`
  return "—"
}

function buildPageUrl(params: Record<string, string | undefined>, page: number): string {
  const url = new URLSearchParams()
  Object.entries({ ...params, page: String(page) }).forEach(([k, v]) => {
    if (v && !(k === "page" && page === 1)) url.set(k, v)
  })
  const qs = url.toString()
  return qs ? `/admin/obras?${qs}` : "/admin/obras"
}

/**
 * Querystring que representa el estado actual de la lista (filtros + page).
 * Se pasa como `?from=<qs>` a la pantalla de edición para que al guardar
 * podamos restaurar la lista exactamente como estaba.
 */
function buildCurrentListQs(params: Record<string, string | undefined>, page: number): string {
  const url = new URLSearchParams()
  Object.entries({ ...params, page: String(page) }).forEach(([k, v]) => {
    if (v && !(k === "page" && page === 1)) url.set(k, v)
  })
  return url.toString()
}

function buildEditUrl(id: string, currentQs: string): string {
  return currentQs
    ? `/admin/obras/${id}?from=${encodeURIComponent(currentQs)}`
    : `/admin/obras/${id}`
}

function buildSortUrl(
  params: Record<string, string | undefined>,
  sort: string
): string {
  const currentSort = params.sort ?? "created_at"
  const currentDir = params.dir ?? "desc"
  const nextDir =
    currentSort === sort ? (currentDir === "asc" ? "desc" : "asc") : "asc"

  const url = new URLSearchParams()
  Object.entries({ ...params, page: undefined, sort, dir: nextDir }).forEach(([k, v]) => {
    if (v) url.set(k, v)
  })
  const qs = url.toString()
  return qs ? `/admin/obras?${qs}` : "/admin/obras"
}

function SortHeader({
  label,
  sortKey,
  align = "left",
  params,
  className,
}: {
  label: string
  sortKey: string
  align?: "left" | "right"
  params: Record<string, string | undefined>
  className?: string
}) {
  const active = (params.sort ?? "created_at") === sortKey
  const dir = (params.dir ?? "desc") as "asc" | "desc"
  const indicator = active ? (dir === "asc" ? "↑" : "↓") : ""

  return (
    <th className={cn(
      align === "right" ? "text-right" : "text-left",
      "px-4 py-3 font-medium text-stone-500 select-none",
      className
    )}>
      <Link
        href={buildSortUrl(params, sortKey)}
        className="inline-flex items-center gap-1 hover:text-carbon-900 transition-colors"
      >
        {label}
        <span className={cn("text-xs", active ? "text-carbon-900" : "text-stone-300")}>
          {indicator || "↕"}
        </span>
      </Link>
    </th>
  )
}

function getPrimaryImage(images: ArtworkRow["artwork_images"]) {
  return (
    images.find((i) => i.is_primary) ??
    [...images].sort((a, b) => a.position - b.position)[0] ??
    null
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <ImageIcon size={22} className="text-stone-400" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-carbon-900">
        {filtered ? "Sin resultados" : "No hay obras aún"}
      </p>
      <p className="text-xs text-stone-400 mt-1">
        {filtered
          ? "Prueba con otros filtros o limpia la búsqueda"
          : "Agrega la primera obra al inventario"}
      </p>
      {!filtered && (
        <Link
          href="/admin/obras/nueva"
          className="mt-4 text-sm text-gold-500 hover:text-gold-400 font-medium transition-colors"
        >
          Nueva obra →
        </Link>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ArtworksTable({
  artworks,
  page,
  totalPages,
  currentParams,
}: ArtworksTableProps) {
  const isFiltered = !!(currentParams.q || currentParams.category || currentParams.status)
  const currentListQs = buildCurrentListQs(currentParams, page)

  if (artworks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200">
        <EmptyState filtered={isFiltered} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 font-medium text-stone-500 w-14">Img</th>
              <SortHeader label="Código" sortKey="code" params={currentParams} className="w-24" />
              <SortHeader label="Título" sortKey="title" params={currentParams} />
              <SortHeader label="Categoría" sortKey="category" params={currentParams} className="hidden md:table-cell w-28" />
              <SortHeader label="Tamaño" sortKey="size" params={currentParams} className="hidden md:table-cell w-24" />
              <SortHeader label="Estado" sortKey="status" params={currentParams} className="w-28" />
              <th className="text-right px-4 py-3 font-medium text-stone-500 hidden lg:table-cell w-32">Precio anterior</th>
              <SortHeader label="Precio" sortKey="price" params={currentParams} align="right" className="hidden sm:table-cell w-28" />
              <th className="text-right px-4 py-3 font-medium text-stone-500 w-20">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {artworks.map((artwork) => {
              const img = getPrimaryImage(artwork.artwork_images)
              const status = STATUS_CONFIG[artwork.status]

              return (
                <tr key={artwork.id} className="hover:bg-stone-50/60 transition-colors">
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <ArtworksTableThumb src={img?.cloudinary_url ?? null} alt={artwork.title} />
                  </td>

                  {/* Code */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      {artwork.code}
                      {artwork.category === "religiosa" &&
                        artwork.status === "available" &&
                        (artwork.stock_quantity ?? 1) > 1 && (
                          <span className="text-[10px] font-semibold text-green-700 tabular-nums">
                            ×{artwork.stock_quantity}
                          </span>
                        )}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3">
                    <Link
                      href={buildEditUrl(artwork.id, currentListQs)}
                      className="font-medium text-carbon-900 hover:text-gold-500 transition-colors line-clamp-2 leading-snug"
                    >
                      {artwork.title}
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-stone-600 text-xs">
                      {CATEGORY_LABELS[artwork.category]}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-stone-600 text-xs font-mono whitespace-nowrap">
                      {formatSize(artwork.width_cm, artwork.height_cm)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* Original price */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span
                      className={cn(
                        "text-sm",
                        artwork.show_price ? "text-stone-500" : "text-stone-400 italic"
                      )}
                    >
                      {formatOriginalPrice(artwork.original_price, artwork.show_price)}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <div className="inline-flex items-center justify-end gap-2">
                      {artwork.price_locked && artwork.status !== "sold" && (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-500/15 text-gold-500 border border-gold-500/25"
                          title="Precio fijo (excluido de ajuste masivo)"
                          aria-label="Precio fijo"
                        >
                          <Pin size={12} />
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          artwork.show_price ? "text-carbon-900" : "text-stone-400 italic"
                        )}
                      >
                        {formatPrice(artwork.price, artwork.show_price)}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <ArtworkActionsMenu
                      id={artwork.id}
                      code={artwork.code}
                      title={artwork.title}
                      status={artwork.status}
                      category={artwork.category}
                      stockQuantity={artwork.stock_quantity ?? 1}
                      editHref={buildEditUrl(artwork.id, currentListQs)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50">
          <p className="text-xs text-stone-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildPageUrl(currentParams, page - 1)}
                className="flex items-center gap-1 text-sm text-stone-600 hover:text-carbon-900 transition-colors px-2 py-1 rounded hover:bg-stone-100"
              >
                <ChevronLeft size={15} />
                Anterior
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-stone-300 px-2 py-1 cursor-default">
                <ChevronLeft size={15} />
                Anterior
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildPageUrl(currentParams, page + 1)}
                className="flex items-center gap-1 text-sm text-stone-600 hover:text-carbon-900 transition-colors px-2 py-1 rounded hover:bg-stone-100"
              >
                Siguiente
                <ChevronRight size={15} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-stone-300 px-2 py-1 cursor-default">
                Siguiente
                <ChevronRight size={15} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
