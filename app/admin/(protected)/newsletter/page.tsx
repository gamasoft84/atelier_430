import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Newsletter" }

const STATUS_LABELS: Record<string, string> = {
  active:        "Activo",
  unsubscribed:  "Baja",
  bounced:       "Rebote",
}

const STATUS_STYLES: Record<string, string> = {
  active:       "bg-emerald-50 text-emerald-700",
  unsubscribed: "bg-stone-100 text-stone-500",
  bounced:      "bg-red-50 text-red-600",
}

function formatDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export default async function NewsletterPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, name, status, subscribed_at")
    .order("subscribed_at", { ascending: false })

  const subscribers = data ?? []
  const active = subscribers.filter((s) => s.status === "active").length

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-carbon-900">Newsletter</h1>
        <p className="text-sm text-stone-500 mt-1">Suscriptores al catálogo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",   value: String(subscribers.length) },
          { label: "Activos", value: String(active) },
          { label: "Bajas",   value: String(subscribers.length - active) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-2xl font-semibold text-carbon-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Resend note */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
        Los emails se envían desde{" "}
        <span className="font-mono font-medium">{process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}</span>.
        Para enviar a todos los suscriptores, verifica tu dominio en{" "}
        <span className="font-medium">resend.com/domains</span>.
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-500">
          Error al cargar suscriptores
        </div>
      ) : subscribers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center">
          <p className="text-sm text-stone-500">Sin suscriptores aún.</p>
          <p className="text-xs text-stone-400 mt-1">
            El formulario de suscripción está en la página de inicio del catálogo.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  {["Email", "Nombre", "Suscrito", "Estado"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide text-left
                                  ${i === 2 ? "hidden md:table-cell" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-carbon-900">{s.email}</td>
                    <td className="px-4 py-3 text-stone-500 truncate max-w-[160px]">
                      {s.name ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-stone-400 whitespace-nowrap hidden md:table-cell">
                      {formatDate(s.subscribed_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${STATUS_STYLES[s.status as string] ?? "bg-stone-100 text-stone-500"}`}>
                        {STATUS_LABELS[s.status as string] ?? s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-stone-100 bg-stone-50 text-xs text-stone-400">
            {subscribers.length} suscriptor{subscribers.length !== 1 ? "es" : ""} · {active} activo{active !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  )
}
