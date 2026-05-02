"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronRight, ChevronLeft, Sparkles, Loader2, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import ImageUploader from "@/components/admin/ImageUploader"
import { createArtwork, updateArtwork } from "@/app/actions/artworks"
import { ARTWORK_CATEGORIES, ARTWORK_TECHNIQUES, SOLD_CHANNELS } from "@/lib/constants"
import type { Artwork } from "@/types/artwork"
import type { PriceSuggestion } from "@/types/api"
import type { UploadedImage } from "@/hooks/useImageUpload"

// ─── Schema ───────────────────────────────────────────────────────────────

const artworkSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(200),
  description: z.string().max(2000).optional().default(""),
  category: z.enum(["religiosa", "nacional", "europea", "moderna"]),
  subcategory: z.string().max(50).optional().default(""),
  technique: z.string().max(50).optional().default(""),
  width_cm: z.coerce.number().min(1).max(500).nullable().optional(),
  height_cm: z.coerce.number().min(1).max(500).nullable().optional(),
  has_frame: z.boolean().default(false),
  frame_material: z.string().max(50).optional().default(""),
  frame_color: z.string().max(50).optional().default(""),
  price: z.coerce.number().min(0).nullable().optional(),
  original_price: z.coerce.number().min(0).nullable().optional(),
  cost: z.coerce.number().min(0).nullable().optional(),
  show_price: z.boolean().default(true),
  status: z.enum(["available", "reserved", "sold", "hidden"]).default("available"),
  location_in_storage: z.string().max(50).optional().default(""),
  admin_notes: z.string().max(500).optional().default(""),
  tags: z.string().optional().default(""),
})

type ArtworkFormValues = z.infer<typeof artworkSchema>

// ─── Subcategory options ──────────────────────────────────────────────────

const SUBCATEGORIES: Record<string, Array<{ value: string; label: string }>> = {
  religiosa: [
    { value: "virgen_guadalupe",   label: "Virgen de Guadalupe" },
    { value: "san_charbel",        label: "San Charbel" },
    { value: "san_judas_tadeo",    label: "San Judas Tadeo" },
    { value: "san_miguel_arcangel",label: "San Miguel Arcángel" },
    { value: "la_sagrada_familia", label: "La Sagrada Familia" },
    { value: "la_ultima_cena",     label: "La Última Cena" },
  ],
  nacional: [
    { value: "Paisaje rural",   label: "Paisaje rural" },
    { value: "Paisaje marino",  label: "Paisaje marino" },
    { value: "Paisaje urbano",  label: "Paisaje urbano" },
    { value: "Puente",          label: "Puente" },
    { value: "Montaña",         label: "Montaña" },
    { value: "Bosque",          label: "Bosque" },
    { value: "Otro",            label: "Otro" },
  ],
  europea: [
    { value: "Paisaje clásico", label: "Paisaje clásico" },
    { value: "Retrato",         label: "Retrato" },
    { value: "Bodegón",         label: "Bodegón" },
    { value: "Mitología",       label: "Mitología" },
    { value: "Arquitectura",    label: "Arquitectura" },
    { value: "Otro",            label: "Otro" },
  ],
  moderna: [
    { value: "Abstracto",     label: "Abstracto" },
    { value: "Geométrico",    label: "Geométrico" },
    { value: "Expresionista", label: "Expresionista" },
    { value: "Minimalista",   label: "Minimalista" },
    { value: "Otro",          label: "Otro" },
  ],
}

const STEP_LABELS = ["Imágenes", "Datos básicos", "Contenido", "Precio", "Publicar"]

// ─── Step indicator ───────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`
              flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
              ${i < current ? "bg-gold-500 text-white" : i === current ? "bg-carbon-900 text-white" : "bg-stone-200 text-stone-400"}
            `}
          >
            {i < current ? <Check size={13} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-6 ${i < current ? "bg-gold-500" : "bg-stone-200"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-stone-500">{STEP_LABELS[current]}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

interface ArtworkFormProps {
  mode?: "create" | "edit"
  artwork?: Artwork
}

export default function ArtworkForm({ mode = "create", artwork }: ArtworkFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<PriceSuggestion | null>(null)
  const [priceFromAI, setPriceFromAI] = useState(false)

  // Stable upload session ID — never changes for this form instance
  const uploadId = useMemo(
    () => artwork?.code ?? `tmp-${crypto.randomUUID().slice(0, 8)}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const form = useForm<ArtworkFormValues, unknown, ArtworkFormValues>({
    resolver: zodResolver(artworkSchema) as Resolver<ArtworkFormValues, unknown, ArtworkFormValues>,
    defaultValues: {
      title: artwork?.title ?? "",
      description: artwork?.description ?? "",
      category: artwork?.category ?? "nacional",
      subcategory: artwork?.subcategory ?? "",
      technique: artwork?.technique ?? "",
      width_cm: artwork?.width_cm ?? undefined,
      height_cm: artwork?.height_cm ?? undefined,
      has_frame: artwork?.has_frame ?? false,
      frame_material: artwork?.frame_material ?? "",
      frame_color: artwork?.frame_color ?? "",
      price: artwork?.price ?? undefined,
      original_price: artwork?.original_price ?? undefined,
      cost: artwork?.cost ?? undefined,
      show_price: artwork?.show_price ?? true,
      status: artwork?.status ?? "available",
      location_in_storage: artwork?.location_in_storage ?? "",
      admin_notes: artwork?.admin_notes ?? "",
      tags: artwork?.tags?.join(", ") ?? "",
    },
  })

  const watchCategory = form.watch("category")
  const watchHasFrame = form.watch("has_frame")

  // Auto-fill defaults when switching to "religiosa" in create mode
  useEffect(() => {
    if (mode !== "create" || watchCategory !== "religiosa") return
    const { width_cm, height_cm, technique } = form.getValues()
    if (!width_cm)  form.setValue("width_cm", 55)
    if (!height_cm) form.setValue("height_cm", 65)
    if (!technique) form.setValue("technique", "impresion")
    if (!form.getValues("has_frame")) form.setValue("has_frame", true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCategory, mode])

  const handleImagesChange = useCallback((imgs: UploadedImage[]) => {
    setImages(imgs)
  }, [])

  // ── AI generation ───────────────────────────────────────────────────────

  const handleGenerateAI = async () => {
    const primaryImage = images.find((img) => img.is_primary) ?? images[0]
    if (!primaryImage) {
      toast.error("Agrega al menos una imagen para generar contenido con IA")
      return
    }

    setIsGenerating(true)
    const values = form.getValues()

    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: primaryImage.cloudinary_url,
          category: values.category,
          subcategory: values.subcategory || undefined,
          technique: values.technique || undefined,
          width_cm: values.width_cm ?? undefined,
          height_cm: values.height_cm ?? undefined,
          has_frame: values.has_frame,
          frame_material: values.frame_material || undefined,
          frame_color: values.frame_color || undefined,
          cost: values.cost ?? undefined,
        }),
      })

      const data = await res.json() as {
        title?: string
        description?: string
        tags?: string[]
        subcategory?: string
        price_suggestion?: PriceSuggestion
        error?: string
      }

      if (!res.ok) throw new Error(data.error ?? "Error al generar contenido")

      if (data.title) form.setValue("title", data.title, { shouldValidate: true, shouldDirty: true })
      if (data.description) form.setValue("description", data.description, { shouldValidate: true, shouldDirty: true })
      if (data.tags?.length) form.setValue("tags", data.tags.join(", "), { shouldDirty: true })
      if (data.subcategory) form.setValue("subcategory", data.subcategory, { shouldDirty: true })
      if (data.price_suggestion) {
        setAiPriceSuggestion(data.price_suggestion)
      }

      setAiGenerated(true)
      toast.success("Contenido generado. Puedes editarlo antes de continuar.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar contenido")
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  const canGoNext = () => {
    if (step === 0 && images.length === 0) {
      toast.error("Agrega al menos una imagen para continuar")
      return false
    }
    return true
  }

  const next = () => {
    if (!canGoNext()) return
    setStep((s) => Math.min(s + 1, 4))
  }

  const prev = () => setStep((s) => Math.max(s - 1, 0))

  // ── Submit ──────────────────────────────────────────────────────────────

  const onSubmit = async (values: ArtworkFormValues, asDraft = false) => {
    if (images.length === 0) {
      toast.error("Agrega al menos una imagen")
      setStep(0)
      return
    }

    setIsSubmitting(true)

    const formData = {
      ...values,
      width_cm: values.width_cm ?? null,
      height_cm: values.height_cm ?? null,
      price: values.price ?? null,
      original_price: values.original_price ?? null,
      cost: values.cost ?? null,
      status: asDraft ? ("hidden" as const) : values.status,
      tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    }

    try {
      if (mode === "edit" && artwork) {
        const result = await updateArtwork(artwork.id, formData, images)
        if ("error" in result) throw new Error(result.error)
        toast.success("Obra actualizada")
        router.push("/admin/obras")
      } else {
        const result = await createArtwork(formData, images)
        if ("error" in result) throw new Error(result.error)
        toast.success(`Obra ${result.code} creada`)
        router.push("/admin/obras")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render steps ────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StepIndicator current={step} total={5} />
      <Separator />

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* ─ Step 0: Images ─────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-carbon-900">Imágenes de la obra</h2>
                <p className="text-sm text-stone-500 mt-0.5">Sube hasta 5 fotos. La primera se usará como portada.</p>
              </div>
              <ImageUploader
                uploadId={uploadId}
                onChange={handleImagesChange}
                initialImages={artwork?.images?.map((img) => ({
                  cloudinary_url: img.cloudinary_url,
                  cloudinary_public_id: img.cloudinary_public_id,
                  width: img.width ?? 0,
                  height: img.height ?? 0,
                  position: img.position,
                  is_primary: img.is_primary,
                }))}
              />
            </div>
          )}

          {/* ─ Step 1: Basic data ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-carbon-900">Datos básicos</h2>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ARTWORK_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="capitalize">
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(SUBCATEGORIES[watchCategory] ?? []).map((sub) => (
                            <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="technique"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnica</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ARTWORK_TECHNIQUES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="width_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancho (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alto (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Frame */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="has_frame"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 accent-gold-500"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">Tiene marco</FormLabel>
                    </FormItem>
                  )}
                />

                {watchHasFrame && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    <FormField
                      control={form.control}
                      name="frame_material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material del marco</FormLabel>
                          <FormControl>
                            <Input placeholder="pino, importado europeo…" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="frame_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color del marco</FormLabel>
                          <FormControl>
                            <Input placeholder="dorado, negro, natural…" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─ Step 2: Content / AI ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-carbon-900">Título y descripción</h2>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {images.length === 0
                      ? "Vuelve al paso anterior y sube una imagen para usar la IA."
                      : "Escríbelo tú o genera con IA usando la imagen principal."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || images.length === 0}
                  className={
                    aiGenerated
                      ? "gap-1.5 shrink-0 bg-gold-500 hover:bg-gold-400 text-white border-gold-500"
                      : "gap-1.5 shrink-0"
                  }
                >
                  {isGenerating ? (
                    <><Loader2 size={14} className="animate-spin" />Generando...</>
                  ) : aiGenerated ? (
                    <><RefreshCw size={14} />Regenerar</>
                  ) : (
                    <><Sparkles size={14} />Generar con IA</>
                  )}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Puente al pueblo dormido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe la obra: estilo, colores, sensación, espacio ideal…"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (separados por coma)</FormLabel>
                    <FormControl>
                      <Input placeholder="paisaje, rural, verde, puente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {aiPriceSuggestion && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-3">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    Sugerencia de precio — selecciona para pre-llenar
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "aggressive",   label: "Venta rápida",    value: aiPriceSuggestion.aggressive },
                      { key: "balanced",     label: "Recomendado",     value: aiPriceSuggestion.balanced },
                      { key: "conservative", label: "Precio premium",  value: aiPriceSuggestion.conservative },
                    ] as const).map(({ key, label, value }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          form.setValue("price", value, { shouldValidate: true, shouldDirty: true })
                          setPriceFromAI(true)
                        }}
                        className={`rounded-lg border p-3 text-left transition-colors hover:border-gold-500 ${
                          form.watch("price") === value
                            ? "border-gold-500 bg-amber-50"
                            : "border-stone-200 bg-white"
                        }`}
                      >
                        <p className="text-[11px] text-stone-400 font-medium">{label}</p>
                        <p className="text-base font-semibold text-carbon-900">
                          ${value.toLocaleString("es-MX")}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400">{aiPriceSuggestion.rationale}</p>
                </div>
              )}
            </div>
          )}

          {/* ─ Step 3: Price & private data ──────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-carbon-900">Precio y datos privados</h2>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Precio público (MXN)</FormLabel>
                        {priceFromAI && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <Sparkles size={9} />
                            Sugerido por IA
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1200"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e)
                            setPriceFromAI(false)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="original_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio anterior (tachado)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1800"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo (privado)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="209"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <p className="text-xs text-stone-400">Solo visible para ti</p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_in_storage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación en bodega</FormLabel>
                      <FormControl>
                        <Input placeholder="Estante A-3" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="show_price"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 accent-gold-500"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Mostrar precio al público</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admin_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas privadas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas internas sobre esta obra…" rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* ─ Step 4: Publish ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-carbon-900">Vista previa y publicación</h2>

              {/* Mini preview */}
              <div className="border border-stone-200 rounded-xl p-5 bg-white space-y-3">
                <div className="flex gap-4">
                  {images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images[0].cloudinary_url}
                      alt="preview"
                      className="w-24 h-32 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest text-stone-400">{form.watch("category")}</p>
                    <p className="font-display text-lg text-carbon-900 leading-snug">
                      {form.watch("title") || <span className="text-stone-300 italic">Sin título</span>}
                    </p>
                    {(form.watch("width_cm") || form.watch("height_cm")) && (
                      <p className="text-sm text-stone-500">
                        {form.watch("width_cm")} × {form.watch("height_cm")} cm
                        {form.watch("has_frame") && " · Con marco"}
                      </p>
                    )}
                    {form.watch("price") && (
                      <p className="text-base font-semibold text-carbon-900">
                        ${Number(form.watch("price")).toLocaleString("es-MX")} MXN
                      </p>
                    )}
                    <p className="text-xs text-stone-400">{images.length} imagen{images.length !== 1 ? "es" : ""}</p>
                  </div>
                </div>
                {form.watch("description") && (
                  <p className="text-sm text-stone-600 line-clamp-3">{form.watch("description")}</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado al publicar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="hidden">Borrador (oculto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* ─ Navigation buttons ─────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={prev}
              disabled={step === 0}
              className="gap-1.5 text-stone-500"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={next}
                className="gap-1.5 bg-carbon-900 hover:bg-carbon-800 text-white"
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.handleSubmit((v) => onSubmit(v, true))()}
                  disabled={isSubmitting}
                  className="border-stone-200 text-stone-600"
                >
                  Guardar como borrador
                </Button>
                <Button
                  type="button"
                  onClick={() => form.handleSubmit((v) => onSubmit(v, false))()}
                  disabled={isSubmitting}
                  className="bg-gold-500 hover:bg-gold-400 text-white font-semibold gap-1.5"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {mode === "edit" ? "Guardar cambios" : "Publicar obra"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
