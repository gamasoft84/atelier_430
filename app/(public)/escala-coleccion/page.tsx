import type { Metadata } from "next"
import CollectionScaleFloor from "@/components/public/CollectionScaleFloor"
import { getScaleCollectionData } from "@/lib/supabase/queries/public"
import { SITE_NAME } from "@/lib/constants"

/** Altura de referencia humana (cm); debe coincidir con la prop enviada al cliente para evitar hydration mismatch. */
const ESCALA_REFERENCE_HUMAN_CM = 170

export const metadata: Metadata = {
  title: `Colección a escala · ${SITE_NAME}`,
  description: `Comparación visual del tamaño real de las obras disponibles, con referencia humana de ${ESCALA_REFERENCE_HUMAN_CM} cm y proporciones según las medidas de ficha.`,
  robots: { index: false, follow: false },
}

export default async function EscalaColeccionPage() {
  const { items, excludedWithoutDimensions } = await getScaleCollectionData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Visualización</p>
        <h1 className="font-display text-3xl sm:text-4xl text-carbon-900 tracking-tight">
          Colección a escala
        </h1>
        <p className="text-sm text-stone-600 mt-3 leading-relaxed">
          Las obras se muestran en fila, alineadas por la base, con el tamaño relativo de sus medidas en
          centímetros. La silueta representa una persona de{" "}
          <span className="font-medium text-carbon-900">{ESCALA_REFERENCE_HUMAN_CM} cm</span> de altura para situar el volumen
          frente a un muro. Solo se incluyen piezas disponibles con ancho y alto registrados.
        </p>
      </header>

      <CollectionScaleFloor
        items={items}
        excludedWithoutDimensions={excludedWithoutDimensions}
        humanHeightCm={ESCALA_REFERENCE_HUMAN_CM}
        introPieces={{
          before:
            "Cada rectángulo respeta las medidas de la ficha (ancho × alto). La silueta de ",
          humanCm: ESCALA_REFERENCE_HUMAN_CM,
          after:
            " queda fija a la izquierda como referencia; desplázate horizontalmente para recorrer las obras.",
        }}
      />
    </div>
  )
}
