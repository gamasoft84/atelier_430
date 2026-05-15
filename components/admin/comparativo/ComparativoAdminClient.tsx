"use client"

import ComparativoPicker from "@/components/comparativo/ComparativoPicker"

export default function ComparativoAdminClient() {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-carbon-900">Seleccionar obras</h2>
        <p className="mt-1 text-xs text-stone-500">
          Toca las miniaturas para elegir entre 3 y 5 piezas. El comparativo respeta medidas con marco
          (o lienzo si no hay marco registrado).
        </p>
      </div>
      <ComparativoPicker variant="admin" />
    </section>
  )
}
