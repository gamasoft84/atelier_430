"use client"

import dynamic from "next/dynamic"
import type { CollectionScaleFloorProps } from "@/components/public/CollectionScaleFloor"

const CollectionScaleFloor = dynamic(
  () => import("@/components/public/CollectionScaleFloor"),
  {
    ssr: false,
    loading: () => (
      <div
        className="space-y-4"
        role="status"
        aria-busy="true"
        aria-label="Cargando vista a escala"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-16 max-w-xl flex-1 rounded bg-stone-200/50 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-md bg-stone-200/50 animate-pulse" />
            <div className="h-9 w-9 rounded-md bg-stone-200/50 animate-pulse" />
            <div className="h-9 w-28 rounded-md bg-stone-200/50 animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-72 max-w-full rounded bg-stone-200/40 animate-pulse" />
        <div className="min-h-[220px] w-full rounded-[4px] border border-stone-200 bg-[#FAF7F0]/70 animate-pulse" />
      </div>
    ),
  },
)

export default function CollectionScaleFloorDynamic(props: CollectionScaleFloorProps) {
  return <CollectionScaleFloor {...props} />
}
