import type { Metadata } from "next"
import ArtworkCreateDefaultsSettings from "@/components/admin/settings/ArtworkCreateDefaultsSettings"

export const metadata: Metadata = {
  title: "Configuración",
}

export default function AdminConfiguracionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Configuración</h1>
        <p className="text-sm text-stone-500 mt-1">
          Ajustes del sitio y defaults del panel admin.
        </p>
      </div>

      <ArtworkCreateDefaultsSettings />
    </div>
  )
}
