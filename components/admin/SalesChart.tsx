"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { SalesStat } from "@/lib/supabase/queries/dashboard"

interface TooltipPayload {
  value: number
  name: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const revenue = payload.find((p) => p.name === "revenue")?.value ?? 0
  const count   = payload.find((p) => p.name === "count")?.value ?? 0
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-carbon-900 mb-1">{label}</p>
      <p className="text-stone-500">
        {count} venta{count !== 1 ? "s" : ""}
      </p>
      <p className="text-gold-600 font-medium">
        ${revenue.toLocaleString("es-MX")} MXN
      </p>
    </div>
  )
}

interface SalesChartProps {
  data: SalesStat[]
}

export default function SalesChart({ data }: SalesChartProps) {
  const hasData = data.some((d) => d.revenue > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-stone-400">
        Sin ventas registradas en este período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={24} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#78716c" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#78716c" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
          }
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f4" }} />
        <Bar dataKey="revenue" name="revenue" fill="#B8860B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="count"   name="count"   fill="#0F0F0F" radius={[4, 4, 0, 0]} hide />
      </BarChart>
    </ResponsiveContainer>
  )
}
