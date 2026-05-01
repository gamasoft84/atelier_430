import type { Metadata } from "next"

export const metadata: Metadata = { title: "Configuración" }

export default function ConfiguracionPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-carbon-900 mb-2">Configuración</h1>
      <p className="text-stone-500 text-sm">
        Ajustes globales del sitio — se implementa en Fase 8.
      </p>
    </div>
  )
}
