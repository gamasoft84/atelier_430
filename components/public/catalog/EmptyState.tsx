"use client"

import Link from "next/link"

interface EmptyStateProps {
  hasFilters: boolean
  onClear?: () => void
}

export default function EmptyState({ hasFilters, onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-stone-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {hasFilters ? (
        <>
          <p className="font-display text-xl text-carbon-900">
            Sin resultados con estos filtros
          </p>
          <p className="text-sm text-stone-500 max-w-xs">
            Intenta ajustar o limpiar los filtros para ver más obras.
          </p>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="mt-2 px-5 py-2 rounded-lg border border-stone-200 text-sm font-medium text-carbon-900 hover:bg-stone-50 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </>
      ) : (
        <>
          <p className="font-display text-xl text-carbon-900">
            Próximamente nuevas obras
          </p>
          <p className="text-sm text-stone-500 max-w-xs">
            Estamos preparando nuestra colección. Vuelve pronto.
          </p>
          <Link
            href="/"
            className="mt-2 px-5 py-2 rounded-lg bg-gold-500 text-white text-sm font-medium hover:bg-gold-400 transition-colors"
          >
            Ir al inicio
          </Link>
        </>
      )}
    </div>
  )
}
