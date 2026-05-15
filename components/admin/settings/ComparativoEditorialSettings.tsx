"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"

const SETTING_KEY = "comparativo_editorial"

type EditorialValue = {
  tagline: string
  footer: string
}

const DEFAULTS: EditorialValue = {
  tagline: "ARTE QUE TRANSFORMA ESPACIOS",
  footer: "COLECCIÓN MÉXICO | OBRAS ORIGINALES | PIEZAS ÚNICAS",
}

function parseValue(v: unknown): EditorialValue {
  if (!v || typeof v !== "object") return DEFAULTS
  const o = v as Record<string, unknown>
  return {
    tagline:
      typeof o.tagline === "string" && o.tagline.trim() ? o.tagline.trim() : DEFAULTS.tagline,
    footer:
      typeof o.footer === "string" && o.footer.trim() ? o.footer.trim() : DEFAULTS.footer,
  }
}

export default function ComparativoEditorialSettings() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tagline, setTagline] = useState(DEFAULTS.tagline)
  const [footer, setFooter] = useState(DEFAULTS.footer)
  const [original, setOriginal] = useState<EditorialValue>(DEFAULTS)

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
        setTagline(v.tagline)
        setFooter(v.footer)
        setOriginal(v)
      } catch {
        if (!cancelled) {
          setTagline(DEFAULTS.tagline)
          setFooter(DEFAULTS.footer)
          setOriginal(DEFAULTS)
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
      const value = { tagline: tagline.trim(), footer: footer.trim() }
      const { error } = await supabase.from("site_settings").upsert({
        key: SETTING_KEY,
        value,
      })
      if (error) throw error
      setOriginal(value)
      toast.success("Textos del comparativo guardados")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const dirty = tagline !== original.tagline || footer !== original.footer

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
          <LayoutTemplate size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-carbon-900">Comparativo editorial</h2>
          <p className="mt-1 text-xs text-stone-500">
            Subtítulo bajo “ATELIER 430” y pie de página del PNG comparativo (público y admin).
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-stone-400">Cargando…</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comparativo-tagline">Subtítulo (tagline)</Label>
            <Input
              id="comparativo-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comparativo-footer">Pie de página</Label>
            <Input
              id="comparativo-footer"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              maxLength={160}
            />
          </div>
          <Button type="button" onClick={() => void save()} disabled={!dirty || saving}>
            {saving ? "Guardando…" : "Guardar textos"}
          </Button>
        </div>
      )}
    </div>
  )
}
