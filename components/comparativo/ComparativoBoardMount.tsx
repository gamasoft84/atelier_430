"use client"

import { useEffect } from "react"
import { COMPARATIVO_BOARD_ID } from "@/components/comparativo/ComparativoBoard"
import { COMPARATIVO_EXPORTING_CLASS } from "@/lib/comparativo/export-png"

const EXPORT_INLINE_PROPS = ["overflow", "overflowX", "width", "maxWidth"] as const

function clearExportInlineStyles(board: HTMLElement) {
  const nodes = [
    board,
    ...Array.from(
      board.querySelectorAll(
        ".comparativo-gallery-scroll-inner, .comparativo-gallery",
      ),
    ),
  ]
  for (const el of nodes) {
    if (!(el instanceof HTMLElement)) continue
    for (const prop of EXPORT_INLINE_PROPS) {
      el.style[prop] = ""
    }
  }
}

/** Resetea scroll y estilos residuales de export al montar / resize. */
export default function ComparativoBoardMount() {
  useEffect(() => {
    const reset = () => {
      const board = document.getElementById(COMPARATIVO_BOARD_ID)
      if (!board) return

      board.classList.remove(COMPARATIVO_EXPORTING_CLASS)
      clearExportInlineStyles(board)

      const scroll = board.querySelector(
        ".comparativo-gallery-scroll-inner",
      ) as HTMLElement | null
      if (scroll) scroll.scrollLeft = 0
    }

    reset()
    window.addEventListener("resize", reset)
    return () => window.removeEventListener("resize", reset)
  }, [])

  return null
}
