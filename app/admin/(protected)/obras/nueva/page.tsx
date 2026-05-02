import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ArtworkForm from "@/components/admin/ArtworkForm"

export const metadata: Metadata = {
  title: "Nueva obra",
}

export default function NuevaObraPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/obras"
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-carbon-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Obras
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-sm text-carbon-900 font-medium">Nueva obra</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Nueva obra</h1>
        <p className="text-sm text-stone-500 mt-1">Completa los datos para agregar una obra al inventario.</p>
      </div>

      <ArtworkForm mode="create" />
    </div>
  )
}
