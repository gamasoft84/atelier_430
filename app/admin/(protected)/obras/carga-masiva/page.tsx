import type { Metadata } from "next"
import PhotoImportClient from "@/components/admin/import/PhotoImportClient"

export const metadata: Metadata = { title: "Carga de fotos" }

export default function CargaMasivaPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Carga de fotos</h1>
        <p className="text-sm text-stone-500 mt-1">
          Sube fotos directamente — la IA clasifica y genera el contenido de cada obra automáticamente.
          Se crean como borradores para que los revises antes de publicar.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">Antes de subir</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li>Una foto por obra (la principal). Puedes agregar más desde la ficha de edición.</li>
          <li>Máximo {50} fotos por lote. Si tienes más, sube en tandas.</li>
          <li>Cada foto tarda ~5–10 s (Cloudinary + IA). 20 fotos ≈ 2–3 min.</li>
        </ul>
      </div>

      <PhotoImportClient />
    </div>
  )
}
