"use client"

import dynamic from "next/dynamic"

/**
 * El visor debe cargarse solo en el cliente (`ssr: false`).
 * Importar `@google/model-viewer` durante el SSR de Vercel rompe la sección entera.
 */
const ArtworkWallARViewer = dynamic(
  () => import("./ArtworkWallARViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(70vh,420px)] rounded-xl bg-stone-100 animate-pulse"
        aria-hidden
      />
    ),
  }
)

export interface ArtworkWallARProps {
  artworkCode: string
  title: string
  hasImages: boolean
}

export default function ArtworkWallAR({
  artworkCode,
  title,
  hasImages,
}: ArtworkWallARProps) {
  return (
    <section className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="font-display text-lg text-carbon-900 tracking-tight">
          Prueba este cuadro en tu espacio
        </h2>
        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
          Gira el modelo con el dedo. En iPhone (Safari) o Android (Chrome), usa el botón de
          realidad aumentada para colocar el cuadro en una pared; la escala se basa en las medidas
          de la ficha cuando están cargadas.
        </p>
      </div>
      {hasImages ? (
        <ArtworkWallARViewer artworkCode={artworkCode} title={title} />
      ) : (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
          <p className="text-xs text-stone-500">
            Esta obra aún no tiene fotos en el catálogo. Sube imágenes en el admin para activar la
            vista 3D.
          </p>
        </div>
      )}
    </section>
  )
}
