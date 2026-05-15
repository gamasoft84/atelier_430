import Link from "next/link"
import ComparativoBoard from "@/components/comparativo/ComparativoBoard"
import type { ComparativoPreparedItem } from "@/lib/comparativo/prepare-items"
import type { ComparativoEditorialCopy } from "@/lib/supabase/queries/comparativo"

interface ComparativoViewProps {
  items: ComparativoPreparedItem[]
  copy: ComparativoEditorialCopy
  codes: string[]
  showExport?: boolean
  backHref?: string
  backLabel?: string
}

export default function ComparativoView({
  items,
  copy,
  codes,
  showExport = true,
  backHref,
  backLabel = "Volver",
}: ComparativoViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 print:hidden">
        {backHref ? (
          <Link href={backHref} className="text-sm font-medium text-gold-600 hover:text-gold-500">
            ← {backLabel}
          </Link>
        ) : null}
        <Link href="/comparativo" className="text-sm font-medium text-stone-500 hover:text-carbon-900">
          Cambiar selección
        </Link>
      </div>

      <p className="text-xs text-stone-500 print:hidden">
        Comparativo a escala ({codes.join(" · ")}). Las piezas más altas en centímetros se ven más
        grandes; la escala usa marco cuando está registrado, si no, lienzo.
      </p>

      <ComparativoBoard items={items} copy={copy} showExport={showExport} />
    </div>
  )
}
