import type { Metadata } from "next"
import ImportWizard from "@/components/admin/import/ImportWizard"
import { BULK_IMPORT_MAX_ROWS } from "@/lib/constants"

/** Server Actions en esta página (ZIP + IA) pueden tardar varios minutos en Vercel. */
export const maxDuration = 300

export const metadata: Metadata = {
  title: "Importar masivo — Atelier 430",
}

export default function ImportPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-carbon-900">Importación masiva</h1>
        <p className="text-sm text-stone-500 mt-1">
          Valida tu Excel y sube un ZIP por lote: hasta {BULK_IMPORT_MAX_ROWS} obras por ejecución. Repite el
          ciclo para cubrir inventarios grandes. La IA procesa imágenes en el paso final.
        </p>
      </div>
      <ImportWizard />
    </div>
  )
}
