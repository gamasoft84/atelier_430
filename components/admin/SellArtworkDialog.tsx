"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { DollarSign, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sellArtwork } from "@/app/actions/artworks"

// ─── Schema ───────────────────────────────────────────────────────────────

const sellSchema = z.object({
  sold_price: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  sold_channel: z.enum(["whatsapp", "presencial", "mercadolibre", "marketplace", "instagram", "otro"]),
  sold_buyer_name: z.string().max(100).optional().default(""),
  sold_buyer_contact: z.string().max(200).optional().default(""),
})

type SellFormValues = z.infer<typeof sellSchema>

// ─── Channel labels ────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp:    "WhatsApp",
  presencial:  "Presencial",
  mercadolibre:"MercadoLibre",
  marketplace: "Marketplace (Facebook)",
  instagram:   "Instagram",
  otro:        "Otro",
}

// ─── Component ────────────────────────────────────────────────────────────

interface SellArtworkDialogProps {
  artworkId: string
  artworkCode: string
  artworkTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function SellArtworkDialog({
  artworkId,
  artworkCode,
  artworkTitle,
  open,
  onOpenChange,
  onSuccess,
}: SellArtworkDialogProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema) as never,
    defaultValues: {
      sold_price: undefined,
      sold_channel: undefined,
      sold_buyer_name: "",
      sold_buyer_contact: "",
    },
  })

  const handleSubmit = async (values: SellFormValues) => {
    setIsSaving(true)
    try {
      const result = await sellArtwork(artworkId, {
        sold_price: values.sold_price,
        sold_channel: values.sold_channel,
        sold_buyer_name: values.sold_buyer_name ?? "",
        sold_buyer_contact: values.sold_buyer_contact ?? "",
      })
      if ("error" in result) throw new Error(result.error)
      toast.success(`Obra ${artworkCode} marcada como vendida`)
      form.reset()
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar venta")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isSaving) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar venta</DialogTitle>
          <DialogDescription>
            Esta acción cambia el estado de la obra a "Vendida".
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 mb-2">
          <p className="text-xs text-stone-500 font-mono mb-0.5">{artworkCode}</p>
          <p className="text-sm font-medium text-carbon-900 line-clamp-2">{artworkTitle}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Precio de venta */}
            <FormField
              control={form.control}
              name="sold_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de venta <span className="text-error">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-8"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Canal */}
            <FormField
              control={form.control}
              name="sold_channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal de venta <span className="text-error">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar canal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comprador (opcional) */}
            <FormField
              control={form.control}
              name="sold_buyer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del comprador <span className="text-stone-400 font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: María García" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contacto (opcional) */}
            <FormField
              control={form.control}
              name="sold_buyer_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono o contacto <span className="text-stone-400 font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 55 1234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gold-500 hover:bg-gold-400 text-white"
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 size={14} className="animate-spin mr-1.5" />Guardando...</>
                ) : (
                  "Registrar venta"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
