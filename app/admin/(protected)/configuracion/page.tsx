import type { Metadata } from "next"
import ArtworkCreateDefaultsSettings from "@/components/admin/settings/ArtworkCreateDefaultsSettings"
import BulkPricingBySize from "@/components/admin/settings/BulkPricingBySize"
import CatalogImagePreference from "@/components/admin/settings/CatalogImagePreference"
import ComparativoEditorialSettings from "@/components/admin/settings/ComparativoEditorialSettings"
import { getSizeGroups } from "@/app/actions/bulk-pricing"

export const metadata: Metadata = {
  title: "Configuración",
}

export default async function AdminConfiguracionPage() {
  const groups = await getSizeGroups()
  return (
    <div className="space-y-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-carbon-900">Configuración</h1>
          <p className="mt-1 text-sm text-stone-500">
            Ajustes del sitio y defaults del panel admin.
          </p>
        </div>

        <ArtworkCreateDefaultsSettings />

        <CatalogImagePreference />

        <ComparativoEditorialSettings />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <BulkPricingBySize groups={groups} />
      </div>
    </div>
  )
}
