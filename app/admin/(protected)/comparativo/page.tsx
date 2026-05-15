import type { Metadata } from "next"
import ComparativoAdminClient from "@/components/admin/comparativo/ComparativoAdminClient"

export const metadata: Metadata = {
  title: "Comparativo editorial",
}

export default function AdminComparativoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Comparativo editorial</h1>
        <p className="text-sm text-stone-500 mt-1">
          Elige 3 a 5 obras y genera una lámina a escala con exportación PNG. Los textos se editan en
          Configuración.
        </p>
      </div>
      <ComparativoAdminClient />
    </div>
  )
}
