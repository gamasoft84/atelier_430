"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
      <p className="font-display text-xl text-carbon-900">
        No pudimos cargar el catálogo
      </p>
      <p className="text-sm text-stone-500">
        Hubo un problema al conectarse. Por favor intenta de nuevo.
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2 rounded-lg bg-gold-500 text-white text-sm font-semibold hover:bg-gold-400 transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-5 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
