"use client"

import { useEffect, useMemo, useState } from "react"
import { DollarSign } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"

const SETTING_KEY = "show_prices_globally"

function parseValue(v: unknown): boolean {
  if (typeof v === "boolean") return v
  if (typeof v === "object" && v !== null && "enabled" in v) {
    return Boolean((v as { enabled: unknown }).enabled)
  }
  return true
}

export default function ShowPricesGloballySettings() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPrices, setShowPrices] = useState(true)
  const [original, setOriginal] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", SETTING_KEY)
          .maybeSingle()
        if (error) throw error
        if (cancelled) return
        const v = parseValue(data?.value)
        setShowPrices(v)
        setOriginal(v)
      } catch {
        if (!cancelled) {
          setShowPrices(true)
          setOriginal(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const save = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from("site_settings").upsert({
        key: SETTING_KEY,
        value: { enabled: showPrices },
      })
      if (error) throw error
      setOriginal(showPrices)
      toast.success(showPrices ? "Precios visibles en el sitio" : "Precios ocultos en el sitio")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const dirty = showPrices !== original

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-800">
          <DollarSign size={16} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-carbon-900">Precios en el sitio público</h2>
          <p className="mt-1 text-sm text-stone-500">
            Controla si los visitantes ven precios en catálogo, ficha de obra, favoritos y PDF de
            ficha. Las obras con precio oculto individual siguen respetando su flag{" "}
            <span className="font-medium">show_price</span>. El admin siempre ve precios.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 transition-colors hover:bg-stone-50">
          <input
            type="radio"
            name="show_prices_globally"
            checked={showPrices}
            onChange={() => setShowPrices(true)}
            disabled={loading}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-carbon-900">Mostrar precios</p>
            <p className="mt-0.5 text-xs text-stone-500">
              Listado, detalle, favoritos y filtros por rango de precio activos cuando la obra lo
              permite.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 transition-colors hover:bg-stone-50">
          <input
            type="radio"
            name="show_prices_globally"
            checked={!showPrices}
            onChange={() => setShowPrices(false)}
            disabled={loading}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-carbon-900">Ocultar precios</p>
            <p className="mt-0.5 text-xs text-stone-500">
              Experiencia tipo galería: sin montos en público; consulta por WhatsApp.
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          onClick={save}
          disabled={loading || saving || !dirty}
          className="bg-carbon-900 text-white hover:bg-carbon-800"
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  )
}
