"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"
import { ARTWORK_CATEGORIES, ARTWORK_TECHNIQUES } from "@/lib/constants"
import { ARTWORK_SUBCATEGORY_OPTIONS } from "@/lib/artwork-subcategories"
import {
  ARTWORK_CREATE_DEFAULTS_SETTING_KEY,
  DEFAULT_ARTWORK_CREATE_DEFAULTS,
  parseArtworkCreateDefaults,
  type ArtworkCreateDefaults,
} from "@/lib/site-settings/artwork-create-defaults"

const FormSchema = z.object({
  category: z.enum(["religiosa", "nacional", "europea", "moderna"]),
  subcategory: z.string().max(50).optional().default(""),
  technique: z.string().max(50).optional().default(""),
  artist: z.string().max(120).optional().default(""),
  width_cm: z.coerce.number().min(1).max(500).optional(),
  height_cm: z.coerce.number().min(1).max(500).optional(),
  has_frame: z.coerce.boolean().optional(),
  price: z.coerce.number().min(0).optional(),
  original_price: z.coerce.number().min(0).optional(),
})

export default function ArtworkCreateDefaultsSettings() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<ArtworkCreateDefaults>(DEFAULT_ARTWORK_CREATE_DEFAULTS)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", ARTWORK_CREATE_DEFAULTS_SETTING_KEY)
          .maybeSingle()
        if (error) throw error
        if (cancelled) return
        setValues(parseArtworkCreateDefaults(data?.value))
      } catch {
        if (!cancelled) setValues(DEFAULT_ARTWORK_CREATE_DEFAULTS)
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
      const parsed = FormSchema.parse(values)
      const { error } = await supabase.from("site_settings").upsert({
        key: ARTWORK_CREATE_DEFAULTS_SETTING_KEY,
        value: parsed,
      })
      if (error) throw error
      toast.success("Configuración guardada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-carbon-900">Defaults: Nueva obra</h2>
        <p className="text-sm text-stone-500 mt-1">
          Valores que se pre-llenan cuando creas una obra nueva. Si ya empezaste a editar el form, no se pisan.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Categoría</p>
          <Select
            value={values.category}
            onValueChange={(v) => {
              const cat = v as ArtworkCreateDefaults["category"]
              setValues((prev) => {
                const opts = ARTWORK_SUBCATEGORY_OPTIONS[cat]
                const cur = prev.subcategory ?? ""
                const stillValid = opts.some((o) => o.value === cur)
                return {
                  ...prev,
                  category: cat,
                  subcategory: stillValid ? cur : (opts[0]?.value ?? ""),
                }
              })
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {ARTWORK_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Subcategoría</p>
          <Select
            value={values.subcategory ?? ""}
            onValueChange={(v) => setValues((prev) => ({ ...prev, subcategory: v }))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {ARTWORK_SUBCATEGORY_OPTIONS[values.category].map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-carbon-900">Artista (opcional)</p>
        <Input
          value={values.artist ?? ""}
          onChange={(e) => setValues((prev) => ({ ...prev, artist: e.target.value }))}
          placeholder="F. Caltenco"
          disabled={loading}
        />
        <p className="text-xs text-stone-400">
          Se pre-llena en “Nueva obra”. Déjalo vacío si no quieres default.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Técnica</p>
          <Select
            value={values.technique ?? ""}
            onValueChange={(v) => setValues((prev) => ({ ...prev, technique: v }))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {ARTWORK_TECHNIQUES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Tiene marco</p>
          <Select
            value={String(Boolean(values.has_frame))}
            onValueChange={(v) => setValues((prev) => ({ ...prev, has_frame: v === "true" }))}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Sí</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Ancho (cm)</p>
          <Input
            type="number"
            value={values.width_cm ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, width_cm: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="60"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Alto (cm)</p>
          <Input
            type="number"
            value={values.height_cm ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, height_cm: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="80"
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Precio (MXN)</p>
          <Input
            type="number"
            value={values.price ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="1000"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-carbon-900">Precio anterior (tachado)</p>
          <Input
            type="number"
            value={values.original_price ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, original_price: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="4560"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => setValues(DEFAULT_ARTWORK_CREATE_DEFAULTS)}
          disabled={loading || saving}
          className="border-stone-200 text-stone-700"
        >
          Restaurar defaults
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="bg-carbon-900 hover:bg-carbon-800 text-white"
        >
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  )
}

