import type { Metadata } from "next"
import ImportWizard from "@/components/admin/import/ImportWizard"

export const metadata: Metadata = {
  title: "Importar masivo — Atelier 430",
}

export default function ImportPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-carbon-900">Importación masiva</h1>
        <p className="text-sm text-stone-500 mt-1">
          Carga hasta 500 obras desde una hoja de cálculo. La IA procesará imágenes en el Paso 3.
        </p>
      </div>
      <ImportWizard />
    </div>
  )
}
