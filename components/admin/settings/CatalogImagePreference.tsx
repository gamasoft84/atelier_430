"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"

const SETTING_KEY = "prefer_premium_in_catalog"

function parseValue(v: unknown): boolean {
  if (typeof v === "boolean") return v
  if (typeof v === "object" && v !== null && "enabled" in v) {
    return Boolean((v as { enabled: unknown }).enabled)
  }
  return true
}

export default function CatalogImagePreference() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferPremium, setPreferPremium] = useState(true)
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
        setPreferPremium(v)
        setOriginal(v)
      } catch {
        if (!cancelled) {
          setPreferPremium(true)
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
        value: preferPremium,
      })
      if (error) throw error
      setOriginal(preferPremium)
      toast.success("Preferencia guardada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const dirty = preferPremium !== original

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-carbon-900">
            Imagen en catálogo público
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Cuando una obra tiene una imagen marcada como premium (✦), ¿quieres
            que se prefiera sobre la imagen principal en el listado del catálogo
            y en la página de detalle? El PDF y los posts en redes siempre
            prefieren premium si existe (este toggle no los afecta).
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-stone-200 p-3 hover:bg-stone-50 transition-colors">
          <input
            type="radio"
            name="prefer_premium"
            checked={preferPremium}
            onChange={() => setPreferPremium(true)}
            disabled={loading}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-carbon-900">
              Preferir imagen premium (recomendado)
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              Si la obra tiene ✦, se muestra esa en el catálogo. Si no, cae a la
              imagen principal.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-stone-200 p-3 hover:bg-stone-50 transition-colors">
          <input
            type="radio"
            name="prefer_premium"
            checked={!preferPremium}
            onChange={() => setPreferPremium(false)}
            disabled={loading}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-carbon-900">
              Siempre la imagen principal
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              El catálogo y la página de detalle muestran siempre la imagen
              técnica (★), aunque haya una marcada como premium.
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          onClick={save}
          disabled={loading || saving || !dirty}
          className="bg-carbon-900 hover:bg-carbon-800 text-white"
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  )
}
