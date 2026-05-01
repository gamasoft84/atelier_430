import type { Metadata } from "next"

export const metadata: Metadata = { title: "Obras" }

export default function ObrasPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-carbon-900 mb-2">Obras</h1>
      <p className="text-stone-500 text-sm">
        Gestión del catálogo — se implementa en Fase 2.
      </p>
    </div>
  )
}
