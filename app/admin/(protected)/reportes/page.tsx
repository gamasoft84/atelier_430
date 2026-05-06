import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import type { ArtworkCategory, ArtworkStatus } from "@/types/artwork"

export const metadata: Metadata = { title: "Reportes" }

type ArtworkRow = {
  id: string
  category: ArtworkCategory
  status: ArtworkStatus
  subcategory: string | null
  width_cm: number | null
  height_cm: number | null
  price: number | null
  original_price: number | null
  sold_price: number | null
  price_locked: boolean
  stock_quantity: number | null
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

function dimKey(w: number, h: number) {
  return `${w}x${h}`
}

type Agg = {
  soldCount: number
  /** Referencias (filas) en disponible. */
  stockSkuCount: number
  /** Piezas físicas en stock disponible. */
  stockPieces: number
  otherCount: number
  stockSumPrice: number
  stockSumOriginal: number
  soldSum: number
}

function emptyAgg(): Agg {
  return {
    soldCount: 0,
    stockSkuCount: 0,
    stockPieces: 0,
    otherCount: 0,
    stockSumPrice: 0,
    stockSumOriginal: 0,
    soldSum: 0,
  }
}

function applyRow(agg: Agg, r: ArtworkRow) {
  const isSold = r.status === "sold"
  const isStock = r.status === "available"
  const units =
    isStock ? Math.max(0, typeof r.stock_quantity === "number" ? r.stock_quantity : 1) : 0

  if (isSold) {
    agg.soldCount += 1
    agg.soldSum += r.sold_price ?? r.price ?? 0
  } else if (isStock) {
    agg.stockSkuCount += 1
    agg.stockPieces += units
    agg.stockSumPrice += (r.price ?? 0) * units
    agg.stockSumOriginal += (r.original_price ?? 0) * units
  } else {
    agg.otherCount += 1
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
    .select(
      "id, category, subcategory, status, width_cm, height_cm, price, original_price, sold_price, price_locked, stock_quantity"
    )
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
  const byReligiousSub = new Map<string, Agg>()
  const total = emptyAgg()

  for (const r of rows) {
    applyRow(total, r)

    const catAgg = byCategory.get(r.category) ?? emptyAgg()
    applyRow(catAgg, r)
    byCategory.set(r.category, catAgg)

    if (r.category === "religiosa") {
      const sk = r.subcategory?.trim() || "(sin clasificar)"
      const relAgg = byReligiousSub.get(sk) ?? emptyAgg()
      applyRow(relAgg, r)
      byReligiousSub.set(sk, relAgg)
    }

    if (typeof r.width_cm === "number" && typeof r.height_cm === "number") {
      const k = dimKey(r.width_cm, r.height_cm)
      const dAgg = byDim.get(k) ?? emptyAgg()
      applyRow(dAgg, r)
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

  const religiousRows = [...byReligiousSub.entries()]
    .map(([subcategory, a]) => ({ subcategory, ...a }))
    .sort((a, b) => b.stockPieces - a.stockPieces || a.subcategory.localeCompare(b.subcategory))

  const sumAgg = (acc: Agg, r: Agg): Agg => ({
    soldCount: acc.soldCount + r.soldCount,
    stockSkuCount: acc.stockSkuCount + r.stockSkuCount,
    stockPieces: acc.stockPieces + r.stockPieces,
    otherCount: acc.otherCount + r.otherCount,
    stockSumPrice: acc.stockSumPrice + r.stockSumPrice,
    stockSumOriginal: acc.stockSumOriginal + r.stockSumOriginal,
    soldSum: acc.soldSum + r.soldSum,
  })

  const categorySubtotal = categoryRows.reduce(sumAgg, emptyAgg())

  const dimSubtotal = dimRows.reduce(sumAgg, emptyAgg())

  const religiousSubtotal = religiousRows.reduce(sumAgg, emptyAgg())

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-carbon-900">Reportes</h1>
        <p className="text-sm text-stone-500 mt-1">
          Stock en piezas (incluye religiosas con varias unidades por referencia) y sumas de precio por
          unidad.
        </p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Vendidas</p>
          <p className="text-2xl font-semibold text-carbon-900 mt-1">{total.soldCount}</p>
          <p className="text-xs text-stone-400 mt-1">Suma: {money(total.soldSum)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Stock (disponibles)</p>
          <p className="text-2xl font-semibold text-green-700 mt-1">{money(total.stockSumPrice)}</p>
          <p className="text-xs text-stone-500 mt-1">
            {total.stockPieces} piezas · {total.stockSkuCount} referencias
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Precio ORIGINAL EN TIENDA</p>
          <p className="text-lg font-semibold text-stone-600 mt-1 line-through">
            {money(total.stockSumOriginal)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">Otros estados</p>
          <p className="text-2xl font-semibold text-carbon-900 mt-1">{total.otherCount}</p>
          <p className="text-xs text-stone-500 mt-1">Reservadas / ocultas / draft</p>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-carbon-900">Religiosa por subcategoría</h2>
          <p className="text-sm text-stone-500 mt-1">
            Piezas y valores agrupados por motivo (subcategoría).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Subcategoría</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Vendidas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma ventas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Piezas en stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total precio de remate</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total precio tienda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {religiousRows.map((r) => (
                <tr key={r.subcategory} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 text-stone-700 font-mono text-xs">{r.subcategory}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.soldCount}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{money(r.soldSum)}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.stockPieces}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{money(r.stockSumPrice)}</td>
                  <td className="px-4 py-3 text-right text-stone-600 line-through">{money(r.stockSumOriginal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone-200 bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-600">Subtotal</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">{religiousSubtotal.soldCount}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-600">{money(religiousSubtotal.soldSum)}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">{religiousSubtotal.stockPieces}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{money(religiousSubtotal.stockSumPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700 line-through">{money(religiousSubtotal.stockSumOriginal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-carbon-900">Por categoría</h2>
          <p className="text-sm text-stone-500 mt-1">
            Stock en piezas y sumas (precio unitario × piezas en disponible).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Vendidas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma ventas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Piezas en stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total precio de remate</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total precio tienda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categoryRows.map((r) => (
                <tr key={r.category} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 capitalize text-stone-700">{r.category}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.soldCount}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{money(r.soldSum)}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.stockPieces}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{money(r.stockSumPrice)}</td>
                  <td className="px-4 py-3 text-right text-stone-600 line-through">{money(r.stockSumOriginal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone-200 bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-600">Subtotal</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">{categorySubtotal.soldCount}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-600">{money(categorySubtotal.soldSum)}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">{categorySubtotal.stockPieces}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{money(categorySubtotal.stockSumPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700 line-through">{money(categorySubtotal.stockSumOriginal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-carbon-900">Por dimensión (ancho × alto)</h2>
          <p className="text-sm text-stone-500 mt-1">
            Ideal para ver ventas y stock por tamaño exacto (piezas en stock).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Tamaño</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Vendidas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Suma ventas</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Piezas en stock</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total precio de remate</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total precio tienda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {dimRows.map((r) => (
                <tr key={r.k} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-stone-700 whitespace-nowrap">
                    {r.w} × {r.h}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.soldCount}</td>
                  <td className="px-4 py-3 text-right text-stone-600">{money(r.soldSum)}</td>
                  <td className="px-4 py-3 text-right text-stone-700">{r.stockPieces}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{money(r.stockSumPrice)}</td>
                  <td className="px-4 py-3 text-right text-stone-600 line-through">{money(r.stockSumOriginal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone-200 bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-600">Subtotal</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">{dimSubtotal.soldCount}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-600">{money(dimSubtotal.soldSum)}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">{dimSubtotal.stockPieces}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{money(dimSubtotal.stockSumPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-700 line-through">{money(dimSubtotal.stockSumOriginal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}
