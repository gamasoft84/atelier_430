import type { Metadata } from "next"
import ArtworkCreateDefaultsSettings from "@/components/admin/settings/ArtworkCreateDefaultsSettings"
import BulkPricingBySize from "@/components/admin/settings/BulkPricingBySize"
import CatalogImagePreference from "@/components/admin/settings/CatalogImagePreference"
import { getSizeGroups } from "@/app/actions/bulk-pricing"

export const metadata: Metadata = {
  title: "Configuración",
}

export default async function AdminConfiguracionPage() {
  const groups = await getSizeGroups()
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Configuración</h1>
        <p className="text-sm text-stone-500 mt-1">
          Ajustes del sitio y defaults del panel admin.
        </p>
      </div>

      <ArtworkCreateDefaultsSettings />

      <CatalogImagePreference />

      {/* Bulk pricing */}
      <BulkPricingBySize groups={groups} />
    </div>
  )
}
