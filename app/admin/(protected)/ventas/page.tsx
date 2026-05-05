import type { Metadata } from "next"
import Image from "next/image"
import { getVentas, type VentasPeriod } from "@/lib/supabase/queries/dashboard"

export const metadata: Metadata = { title: "Ventas" }

const PERIOD_LABELS: Record<VentasPeriod, string> = {
  month:   "Último mes",
  quarter: "Últimos 3 meses",
  all:     "Todo el historial",
}

const CATEGORY_LABELS: Record<string, string> = {
  religiosa: "Religiosa",
  nacional:  "Nacional",
  europea:   "Europea",
  moderna:   "Moderna",
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp:     "WhatsApp",
  presencial:   "Presencial",
  mercadolibre: "Mercado Libre",
  marketplace:  "Marketplace",
  instagram:    "Instagram",
  otro:         "Otro",
}

function formatDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period: VentasPeriod =
    rawPeriod === "month" || rawPeriod === "quarter" ? rawPeriod : "all"

  const ventas = await getVentas(period)

  const totalRevenue = ventas.reduce((s, v) => s + (v.sold_price ?? 0), 0)
  const avgTicket    = ventas.length > 0 ? totalRevenue / ventas.length : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-carbon-900">Ventas</h1>
          <p className="text-sm text-stone-500 mt-1">Historial de obras vendidas</p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          {(["month", "quarter", "all"] as VentasPeriod[]).map((p) => (
            <a
              key={p}
              href={`?period=${p}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? "bg-white text-carbon-900 shadow-sm"
                  : "text-stone-500 hover:text-carbon-900"
              }`}
            >
              {PERIOD_LABELS[p]}
            </a>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Piezas vendidas", value: String(ventas.length) },
          {
            label: "Ingresos totales",
            value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString("es-MX")}` : "—",
          },
          {
            label: "Ticket promedio",
            value: avgTicket > 0 ? `$${Math.round(avgTicket).toLocaleString("es-MX")}` : "—",
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-2xl font-semibold text-carbon-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {ventas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center">
          <p className="text-sm text-stone-500">
            No hay ventas registradas para{" "}
            <span className="font-medium">{PERIOD_LABELS[period].toLowerCase()}</span>.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Registra ventas desde el menú de acciones (⋯) en el listado de obras.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  {["Foto", "Obra", "Fecha", "Precio", "Canal", "Comprador"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide ${
                        i === 0 ? "w-14" : i === 3 ? "text-right" : "text-left"
                      } ${i === 5 ? "hidden md:table-cell" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3">
                      {v.image_url ? (
                        <div className="w-10 h-12 rounded overflow-hidden bg-stone-100 flex-shrink-0">
                          <Image
                            src={v.image_url}
                            alt={v.title}
                            width={40}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-12 rounded bg-stone-100 flex-shrink-0" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-carbon-900 truncate max-w-[200px]">{v.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        <span className="font-mono">{v.code}</span>
                        {" · "}
                        <span>{CATEGORY_LABELS[v.category] ?? v.category}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                      {formatDate(v.sold_at)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-carbon-900 tabular-nums whitespace-nowrap">
                      {v.sold_price != null
                        ? `$${v.sold_price.toLocaleString("es-MX")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {v.sold_channel ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                          {CHANNEL_LABELS[v.sold_channel] ?? v.sold_channel}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell truncate max-w-[160px]">
                      {v.sold_buyer_name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-stone-100 bg-stone-50 text-xs text-stone-400">
            {ventas.length} venta{ventas.length !== 1 ? "s" : ""} · {PERIOD_LABELS[period]}
          </div>
        </div>
      )}
    </div>
  )
}
