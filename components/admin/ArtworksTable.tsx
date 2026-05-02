import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import ArtworkActionsMenu from "@/components/admin/ArtworkActionsMenu"
import type { ArtworkCategory, ArtworkStatus } from "@/types/artwork"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ArtworkRow {
  id: string
  code: string
  title: string
  category: ArtworkCategory
  status: ArtworkStatus
  price: number | null
  show_price: boolean
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

function buildPageUrl(params: Record<string, string | undefined>, page: number): string {
  const url = new URLSearchParams()
  Object.entries({ ...params, page: String(page) }).forEach(([k, v]) => {
    if (v && !(k === "page" && page === 1)) url.set(k, v)
  })
  const qs = url.toString()
  return qs ? `/admin/obras?${qs}` : "/admin/obras"
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
              <th className="text-left px-4 py-3 font-medium text-stone-500 w-24">Código</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">Título</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 hidden md:table-cell w-28">Categoría</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 w-28">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 hidden sm:table-cell w-28">Precio</th>
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
                    <div className="w-10 h-12 rounded bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {img ? (
                        <Image
                          src={img.cloudinary_url}
                          alt={artwork.title}
                          width={40}
                          height={50}
                          className="object-cover w-full h-full"
                          sizes="40px"
                        />
                      ) : (
                        <ImageIcon size={14} className="text-stone-300" />
                      )}
                    </div>
                  </td>

                  {/* Code */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {artwork.code}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/obras/${artwork.id}`}
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

                  {/* Price */}
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span
                      className={cn(
                        "text-sm",
                        artwork.show_price ? "text-carbon-900" : "text-stone-400 italic"
                      )}
                    >
                      {formatPrice(artwork.price, artwork.show_price)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <ArtworkActionsMenu
                      id={artwork.id}
                      code={artwork.code}
                      title={artwork.title}
                      status={artwork.status}
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
