"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { applyBulkPriceForSize, type SizeGroup } from "@/app/actions/bulk-pricing"

function sizeKey(w: number, h: number) {
  return `${w}x${h}`
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
      initial[sizeKey(g.width_cm, g.height_cm)] = {
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
      { total: 0, sold: 0, reserved: 0, locked: 0, eligible: 0 }
    )
  }, [groups])

  const applyFor = (g: SizeGroup) => {
    const k = sizeKey(g.width_cm, g.height_cm)
    const v = values[k] ?? { price: "", original_price: "" }

    const price = v.price.trim() === "" ? null : Number(v.price)
    const originalPrice = v.original_price.trim() === "" ? null : Number(v.original_price)

    startTransition(() => {
      void applyBulkPriceForSize({
        widthCm: g.width_cm,
        heightCm: g.height_cm,
        price,
        originalPrice,
        applyOriginalPrice: applyOriginal,
      }).then((res) => {
        if ("error" in res) {
          toast.error(res.error)
          return
        }
        toast.success(`Actualizadas: ${res.updated}`)
      })
    })
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-carbon-900">Ajuste masivo de precios por tamaño</h2>
          <p className="text-sm text-stone-500 mt-1">
            Agrupado por dimensión exacta (ancho × alto). No modifica <span className="font-medium">vendidas</span> ni{" "}
            <span className="font-medium">reservadas</span>, ni obras con{" "}
            <span className="font-medium">precio bloqueado</span>.
          </p>
        </div>
        <div className="text-xs text-stone-500 text-right shrink-0">
          <p>Total: <span className="font-medium text-carbon-900">{totals.total}</span></p>
          <p>Elegibles: <span className="font-medium text-carbon-900">{totals.eligible}</span></p>
          <p className="text-stone-400">Excluidas: {totals.sold + totals.reserved + totals.locked}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={applyOriginal}
          onChange={(e) => setApplyOriginal(e.target.checked)}
          className="w-4 h-4 accent-gold-500"
          id="apply-original"
        />
        <label htmlFor="apply-original" className="text-sm text-stone-700 select-none">
          También aplicar <span className="font-medium">precio anterior (tachado)</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Tamaño</th>
              <th className="text-right px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Total</th>
              <th className="text-right px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Vendidas</th>
              <th className="text-right px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Reservadas</th>
              <th className="text-right px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Bloqueadas</th>
              <th className="text-right px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Elegibles</th>
              <th className="text-left px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Nuevo precio</th>
              {applyOriginal && (
                <th className="text-left px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Nuevo precio anterior</th>
              )}
              <th className="text-right px-3 py-2.5 font-medium text-stone-500 whitespace-nowrap">Aplicar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {groups.map((g) => {
              const k = sizeKey(g.width_cm, g.height_cm)
              const v = values[k] ?? { price: "", original_price: "" }
              return (
                <tr key={k} className="hover:bg-stone-50/60">
                  <td className="px-3 py-2.5 font-mono text-xs text-stone-700 whitespace-nowrap">
                    {g.width_cm} × {g.height_cm}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-stone-600">{g.total}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-stone-600">{g.sold}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-stone-600">{g.reserved}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-stone-600">{g.locked}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium text-carbon-900">{g.eligible}</td>
                  <td className="px-3 py-2.5">
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
                      className="h-9 w-28"
                      disabled={isPending}
                    />
                  </td>
                  {applyOriginal && (
                    <td className="px-3 py-2.5">
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
                        className="h-9 w-32"
                        disabled={isPending}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-right">
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

