import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, ShoppingBag, Clock, Eye, Plus, Upload } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
}

const metricCards = [
  {
    label: "Total obras",
    value: "430",
    sub: "inventario inicial",
    icon: ImageIcon,
    iconColor: "text-info",
  },
  {
    label: "Disponibles",
    value: "—",
    sub: "se calcula en Fase 8",
    icon: Eye,
    iconColor: "text-success",
  },
  {
    label: "Vendidas",
    value: "—",
    sub: "se calcula en Fase 8",
    icon: ShoppingBag,
    iconColor: "text-gold-500",
  },
  {
    label: "Apartadas",
    value: "—",
    sub: "se calcula en Fase 8",
    icon: Clock,
    iconColor: "text-warning",
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName = user?.email?.split("@")[0] ?? "admin"

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Bienvenida */}
      <div>
        <h1 className="font-display text-2xl text-carbon-900">
          Hola, {displayName}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Gestiona tu inventario de 430 obras de arte
        </p>
      </div>

      {/* Métricas */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Inventario
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map(({ label, value, sub, icon: Icon, iconColor }) => (
            <Card key={label} className="border-stone-200 bg-white shadow-none">
              <CardHeader className="pb-1 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    {label}
                  </CardTitle>
                  <Icon size={15} className={iconColor} />
                </div>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-3xl font-semibold text-carbon-900 tabular-nums">{value}</p>
                <p className="text-xs text-stone-400 mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-white text-sm font-semibold rounded-md transition-colors"
          >
            <Plus size={15} />
            Nueva obra
          </Link>
          <Link
            href="/admin/obras/carga-masiva"
            className="inline-flex items-center gap-2 px-4 py-2 border border-carbon-900 text-carbon-900 hover:bg-carbon-900 hover:text-cream text-sm font-semibold rounded-md transition-colors"
          >
            <Upload size={15} />
            Carga masiva
          </Link>
          <Link
            href="/admin/obras"
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 hover:border-stone-300 text-sm font-medium rounded-md transition-colors"
          >
            Ver todas las obras
          </Link>
        </div>
      </section>
    </div>
  )
}
