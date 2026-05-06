import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import {
  ImageIcon,
  ShoppingBag,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Upload,
  TrendingUp,
  Wallet,
  FileSpreadsheet,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import {
  getInventoryStats,
  getMonthlySales,
  getCurrentMonthStats,
} from "@/lib/supabase/queries/dashboard"
import SalesChart from "@/components/admin/SalesChart"

export const metadata: Metadata = { title: "Dashboard" }

function fmt(n: number) {
  return n.toLocaleString("es-MX")
}
function fmtMXN(n: number) {
  return `$${n.toLocaleString("es-MX")}`
}

// ─── Metric card ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</span>
        <Icon size={15} className={accent ? "text-gold-500" : "text-stone-300"} />
      </div>
      <p className="text-3xl font-semibold text-carbon-900 tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1.5">{sub}</p>}
    </div>
  )
}

// ─── Page data ─────────────────────────────────────────────────────────────

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [inv, monthly, thisMonth] = await Promise.all([
    getInventoryStats(),
    getMonthlySales(6),
    getCurrentMonthStats(),
  ])

  const displayName = user?.email?.split("@")[0] ?? "admin"
  const avgTicket   = inv.sold > 0
    ? monthly.reduce((s, m) => s + m.revenue, 0) / Math.max(1, monthly.reduce((s, m) => s + m.count, 0))
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Bienvenida */}
      <div>
        <h1 className="font-display text-2xl text-carbon-900">
          Hola, {displayName}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {inv.total} referencias en inventario · {inv.availablePieces} piezas disponibles ·{" "}
          {inv.available} referencias listadas
        </p>
      </div>

      {/* Inventario */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Inventario
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard
            label="Total"
            value={fmt(inv.total)}
            icon={ImageIcon}
          />
          <MetricCard
            label="Disponibles"
            value={fmt(inv.availablePieces)}
            sub={`${fmt(inv.available)} ref. · ${fmtMXN(inv.inventoryValue)} MXN`}
            icon={Eye}
            accent
          />
          <MetricCard
            label="Vendidas"
            value={fmt(inv.sold)}
            icon={ShoppingBag}
            accent
          />
          <MetricCard
            label="Apartadas"
            value={fmt(inv.reserved)}
            icon={Clock}
          />
          <MetricCard
            label="Ocultas"
            value={fmt(inv.hidden)}
            icon={EyeOff}
          />
          <MetricCard
            label="Borradores"
            value={fmt(inv.draft)}
            icon={FileSpreadsheet}
          />
        </div>
      </section>

      {/* Ventas este mes + chart */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Ventas
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Mini stats */}
          <div className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Este mes
                </span>
                <TrendingUp size={15} className="text-stone-300" />
              </div>
              <p className="text-3xl font-semibold text-carbon-900 tabular-nums leading-none">
                {fmt(thisMonth.count)}
              </p>
              <p className="text-xs text-stone-400 mt-1.5">
                {thisMonth.revenue > 0
                  ? fmtMXN(thisMonth.revenue) + " MXN"
                  : "Sin ingresos registrados"}
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Ticket prom.
                </span>
                <Wallet size={15} className="text-stone-300" />
              </div>
              <p className="text-3xl font-semibold text-carbon-900 tabular-nums leading-none">
                {avgTicket > 0 ? fmtMXN(Math.round(avgTicket)) : "—"}
              </p>
              <p className="text-xs text-stone-400 mt-1.5">últimos 6 meses</p>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">
              Ingresos mensuales (MXN)
            </p>
            <SalesChart data={monthly} />
          </div>
        </div>
      </section>

      {/* Acciones rápidas */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/obras/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nueva obra
          </Link>
          <Link
            href="/admin/obras/importar"
            className="inline-flex items-center gap-2 px-4 py-2 border border-carbon-900 text-carbon-900 hover:bg-carbon-900 hover:text-cream text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload size={15} />
            Importar masivo
          </Link>
          <Link
            href="/admin/obras"
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 hover:border-stone-300 text-sm font-medium rounded-lg transition-colors"
          >
            Ver todas las obras
          </Link>
          <Link
            href="/admin/ventas"
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 hover:border-stone-300 text-sm font-medium rounded-lg transition-colors"
          >
            Ver ventas
          </Link>
        </div>
      </section>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
          <div className="h-8 w-48 bg-stone-100 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-stone-100 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="h-28 bg-stone-100 rounded-xl" />
              <div className="h-28 bg-stone-100 rounded-xl" />
            </div>
            <div className="lg:col-span-2 h-64 bg-stone-100 rounded-xl" />
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
