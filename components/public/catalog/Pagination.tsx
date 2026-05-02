import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

export default function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPageRange(page, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1 pt-10">
      <PaginationLink
        href={page > 1 ? buildHref(page - 1) : null}
        aria-label="Anterior"
      >
        <ChevronLeft size={16} />
      </PaginationLink>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-stone-400 text-sm select-none">
            …
          </span>
        ) : (
          <PaginationLink
            key={p}
            href={buildHref(p as number)}
            active={p === page}
          >
            {p}
          </PaginationLink>
        )
      )}

      <PaginationLink
        href={page < totalPages ? buildHref(page + 1) : null}
        aria-label="Siguiente"
      >
        <ChevronRight size={16} />
      </PaginationLink>
    </nav>
  )
}

function PaginationLink({
  href,
  children,
  active,
  "aria-label": ariaLabel,
}: {
  href: string | null
  children: React.ReactNode
  active?: boolean
  "aria-label"?: string
}) {
  const base =
    "flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-colors"

  if (!href) {
    return (
      <span className={`${base} text-stone-300 cursor-default`} aria-label={ariaLabel}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`${base} ${
        active
          ? "bg-carbon-900 text-white font-semibold"
          : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {children}
    </Link>
  )
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "…")[] = [1]

  if (current > 3) pages.push("…")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("…")

  pages.push(total)
  return pages
}
