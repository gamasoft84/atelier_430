"use client"

import { useCallback, useRef } from "react"

const MIN_SWIPE_PX = 48

type TouchPoint = { x: number; y: number }

/**
 * Deslizar horizontalmente (← →) en móvil.
 * Si hubo swipe, `consumeClick()` devuelve true una vez para no disparar el tap (p. ej. abrir lightbox).
 */
export function useHorizontalSwipe(
  onPrev: () => void,
  onNext: () => void,
  enabled = true,
) {
  const touchStart = useRef<TouchPoint | null>(null)
  const blockNextClick = useRef(false)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || e.touches.length !== 1) return
      const t = e.touches[0]
      touchStart.current = { x: t.clientX, y: t.clientY }
      blockNextClick.current = false
    },
    [enabled],
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchStart.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      touchStart.current = null

      if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dy) > Math.abs(dx)) return

      blockNextClick.current = true
      if (dx < 0) onNext()
      else onPrev()
    },
    [enabled, onPrev, onNext],
  )

  const consumeClick = useCallback(() => {
    if (blockNextClick.current) {
      blockNextClick.current = false
      return true
    }
    return false
  }, [])

  return { onTouchStart, onTouchEnd, consumeClick }
}
