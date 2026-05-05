import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import type { ArtworkCategory, ArtworkStatus } from "@/types/artwork"

export const metadata: Metadata = { title: "Reportes" }

type ArtworkRow = {
  id: string
  category: ArtworkCategory
  status: ArtworkStatus
  width_cm: number | null
  height_cm: number | null
  price: number | null
  original_price: number | null
  sold_price: number | null
  price_locked: boolean
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

function dimKey(w: number, h: number) {
  return `${w}x${h}`
}

type Agg = {
  soldCount: number
  stockCount: number
  otherCount: number
  stockSumPrice: number
  stockSumOriginal: number
  soldSum: number
}

function emptyAgg(): Agg {
  return {
    soldCount: 0,
    stockCount: 0,
    otherCount: 0,
    stockSumPrice: 0,
    stockSumOriginal: 0,
    soldSum: 0,
  }
}

export default async function AdminReportesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("artworks")
    .select("id, category, status, width_cm, height_cm, price, original_price, sold_price, price_locked")
    .limit(2000)

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-carbon-900">Reportes</h1>
          <p className="text-sm text-stone-500 mt-1">No se pudo cargar el reporte.</p>
        </div>
      </div>
    )
  }

  const rows = data as unknown as ArtworkRow[]

  const byDim = new Map<string, Agg>()
  const byCategory = new Map<ArtworkCategory, Agg>()
  const total = emptyAgg()

  for (const r of rows) {
    const isSold = r.status === "sold"
    const isStock = r.status === "available"

    const apply = (agg: Agg) => {
      if (isSold) {
        agg.soldCount += 1
        agg.soldSum += r.sold_price ?? r.price ?? 0
      } else if (isStock) {
        agg.stockCount += 1
        agg.stockSumPrice += r.price ?? 0
        agg.stockSumOriginal += r.original_price ?? 0
      } else {
        agg.otherCount += 1
      }
    }

    apply(total)

    const catAgg = byCategory.get(r.category) ?? emptyAgg()
    apply(catAgg)
    byCategory.set(r.category, catAgg)

    if (typeof r.width_cm === "number" && typeof r.height_cm === "number") {
      const k = dimKey(r.width_cm, r.height_cm)
      const dAgg = byDim.get(k) ?? emptyAgg()
      apply(dAgg)
      byDim.set(k, dAgg)
    }
  }

  const dimRows = [...byDim.entries()]
    .map(([k, a]) => {
      const [w, h] = k.split("x").map(Number)
      return { w, h, k, ...a }
    })
    .sort((a, b) => (a.w !== b.w ? a.w - b.w : a.h - b.h))

  const categoryRows = (["religiosa", "nacional", "europea", "moderna"] as ArtworkCategory[])
    .map((c) => ({ category: c, ...(byCategory.get(c) ?? emptyAgg()) }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Reportes</h1>
        <p className="text-sm text-stone-500 mt-1">
          Resumen ejecutivo por dimensión y categoría.
        </p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Vendidas</p>
          <p className="text-2xl font-semibold text-carbon-900 mt-1">{total.soldCount}</p>
          <p className="text-xs text-stone-500 mt-1">Suma: {money(total.soldSum)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Stock (disponibles)</p>
          <p className="text-2xl font-semibold text-carbon-900 mt-1">{total.stockCount}</p>
          <p className="text-xs text-stone-500 mt-1">Suma: {money(total.stockSumPrice)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Precio anterior (stock)</p>
          <p className="text-2xl font-semibold text-carbon-900 mt-1">
            {money(total.stockSumOriginal)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Suma `original_price`</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Otros estados</p>
          <p className="text-2xl font-semibold text-carbon-900 mt-1">{total.otherCount}</p>
          <p className="text-xs text-stone-500 mt-1">Reservadas / ocultas / draft</p>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-carbon-900">Por categoría</h2>
          <p className="text-sm text-stone-500 mt-1">
            Stock y ventas, con sumas de precios y precios anteriores.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Vendidas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma ventas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categoryRows.map((r) => (
                <tr key={r.category} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 capitalize text-stone-700">{r.category}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.soldCount}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{money(r.soldSum)}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.stockCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-carbon-900">{money(r.stockSumPrice)}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{money(r.stockSumOriginal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-carbon-900">Por dimensión (ancho × alto)</h2>
          <p className="text-sm text-stone-500 mt-1">
            Ideal para ver ventas y stock por tamaño exacto.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Tamaño</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Vendidas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma ventas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {dimRows.map((r) => (
                <tr key={r.k} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-stone-700 whitespace-nowrap">
                    {r.w} × {r.h}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.soldCount}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{money(r.soldSum)}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.stockCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-carbon-900">{money(r.stockSumPrice)}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{money(r.stockSumOriginal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

