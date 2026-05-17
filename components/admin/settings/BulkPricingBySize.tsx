"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { applyBulkPriceForSize, type SizeGroup } from "@/app/actions/bulk-pricing"

function sizeKey(g: Pick<SizeGroup, "width_cm" | "height_cm" | "has_frame">) {
  return `${g.width_cm}x${g.height_cm}:${g.has_frame ? "1" : "0"}`
}

function frameLabel(hasFrame: boolean): string {
  return hasFrame ? "Con marco" : "Sin marco"
}

export default function BulkPricingBySize({ groups }: { groups: SizeGroup[] }) {
  const [isPending, startTransition] = useTransition()
  const [applyOriginal, setApplyOriginal] = useState(false)

  const [values, setValues] = useState<Record<
    string,
    { price: string; original_price: string }
  >>(() => {
    const initial: Record<string, { price: string; original_price: string }> = {}
    for (const g of groups) {
      initial[sizeKey(g)] = {
        price: g.mixed_price ? "" : g.current_price === null ? "" : String(g.current_price),
        original_price: g.mixed_original_price
          ? ""
          : g.current_original_price === null
            ? ""
            : String(g.current_original_price),
      }
    }
    return initial
  })

  const totals = useMemo(() => {
    return groups.reduce(
      (acc, g) => {
        acc.total += g.total
        acc.sold += g.sold
        acc.reserved += g.reserved
        acc.locked += g.locked
        acc.eligible += g.eligible
        return acc
      },
      { total: 0, sold: 0, reserved: 0, locked: 0, eligible: 0 },
    )
  }, [groups])

  const applyFor = (g: SizeGroup) => {
    const k = sizeKey(g)
    const v = values[k] ?? { price: "", original_price: "" }

    const price = v.price.trim() === "" ? null : Number(v.price)
    const originalPrice = v.original_price.trim() === "" ? null : Number(v.original_price)

    startTransition(() => {
      void applyBulkPriceForSize({
        widthCm: g.width_cm,
        heightCm: g.height_cm,
        hasFrame: g.has_frame,
        price,
        originalPrice,
        applyOriginalPrice: applyOriginal,
      }).then((res) => {
        if ("error" in res) {
          toast.error(res.error)
          return
        }
        toast.success(
          `Actualizadas ${res.updated} obra${res.updated === 1 ? "" : "s"} (${g.width_cm} × ${g.height_cm}, ${frameLabel(g.has_frame).toLowerCase()})`,
        )
      })
    })
  }

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-carbon-900">
            Ajuste masivo de precios por tamaño
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Agrupado por dimensión de lienzo (ancho × alto) y si lleva marco. El mismo tamaño puede
            tener dos filas: <span className="font-medium">con marco</span> y{" "}
            <span className="font-medium">sin marco</span>, cada una con precios distintos. No
            modifica vendidas, reservadas ni obras con precio bloqueado.
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-stone-500">
          <p>
            Total: <span className="font-medium text-carbon-900">{totals.total}</span>
          </p>
          <p>
            Elegibles: <span className="font-medium text-carbon-900">{totals.eligible}</span>
          </p>
          <p className="text-stone-400">
            Excluidas: {totals.sold + totals.reserved + totals.locked}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={applyOriginal}
          onChange={(e) => setApplyOriginal(e.target.checked)}
          className="h-4 w-4 accent-gold-500"
          id="apply-original"
        />
        <label htmlFor="apply-original" className="select-none text-sm text-stone-700">
          También aplicar <span className="font-medium">precio anterior (tachado)</span>
        </label>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-stone-500">
                Lienzo
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-stone-500">
                Marco
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-500">
                Total
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-500">
                Vendidas
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-500">
                Reservadas
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-500">
                Bloqueadas
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-500">
                Elegibles
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-stone-500 min-w-[9rem]">
                Nuevo precio
              </th>
              {applyOriginal ? (
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-stone-500 min-w-[10rem]">
                  Precio anterior
                </th>
              ) : null}
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-500 min-w-[6.5rem]">
                Aplicar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {groups.map((g) => {
              const k = sizeKey(g)
              const v = values[k] ?? { price: "", original_price: "" }
              return (
                <tr key={k} className="hover:bg-stone-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-stone-700">
                    {g.width_cm} × {g.height_cm}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        g.has_frame
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-stone-200 bg-stone-100 text-stone-600",
                      )}
                    >
                      {frameLabel(g.has_frame)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-stone-600">{g.total}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-stone-600">{g.sold}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-stone-600">{g.reserved}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-stone-600">{g.locked}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-carbon-900">
                    {g.eligible}
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={g.mixed_price ? "Mixto" : "1500"}
                      value={v.price}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [k]: { ...v, price: e.target.value },
                        }))
                      }
                      className="h-10 w-full min-w-[7.5rem] max-w-[9rem]"
                      disabled={isPending}
                    />
                  </td>
                  {applyOriginal ? (
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={g.mixed_original_price ? "Mixto" : "2500"}
                        value={v.original_price}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [k]: { ...v, original_price: e.target.value },
                          }))
                        }
                        className="h-10 w-full min-w-[7.5rem] max-w-[9rem]"
                        disabled={isPending}
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFor(g)}
                      disabled={isPending || g.eligible === 0}
                      className="border-stone-200 text-stone-700"
                    >
                      Aplicar
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
