"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const MIN_SCALE = 1
const MAX_SCALE = 4

function touchDistance(touches: React.TouchList): number {
  if (touches.length < 2) return 0
  const a = touches[0]
  const b = touches[1]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

type PanStart = { x: number; y: number; tx: number; ty: number }

export function usePinchZoom(onZoomedChange?: (zoomed: boolean) => void) {
  const [scale, setScale] = useState(MIN_SCALE)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const scaleRef = useRef(MIN_SCALE)
  const translateRef = useRef({ x: 0, y: 0 })
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null)
  const panStart = useRef<PanStart | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const notifyZoomed = useCallback(
    (nextScale: number) => {
      onZoomedChange?.(nextScale > 1.02)
    },
    [onZoomedChange],
  )

  const applyScale = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
      scaleRef.current = clamped
      setScale(clamped)
      if (clamped <= MIN_SCALE) {
        translateRef.current = { x: 0, y: 0 }
        setTranslate({ x: 0, y: 0 })
      }
      notifyZoomed(clamped)
    },
    [notifyZoomed],
  )

  const reset = useCallback(() => {
    pinchStart.current = null
    panStart.current = null
    scaleRef.current = MIN_SCALE
    translateRef.current = { x: 0, y: 0 }
    setScale(MIN_SCALE)
    setTranslate({ x: 0, y: 0 })
    notifyZoomed(MIN_SCALE)
  }, [notifyZoomed])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const blockScroll = (e: TouchEvent) => {
      if (e.touches.length >= 2 || scaleRef.current > MIN_SCALE) {
        e.preventDefault()
      }
    }
    el.addEventListener("touchmove", blockScroll, { passive: false })
    return () => el.removeEventListener("touchmove", blockScroll)
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart.current = {
          distance: touchDistance(e.touches),
          scale: scaleRef.current,
        }
        panStart.current = null
        return
      }
      if (e.touches.length === 1 && scaleRef.current > MIN_SCALE) {
        panStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx: translateRef.current.x,
          ty: translateRef.current.y,
        }
        pinchStart.current = null
      }
    },
    [],
  )

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const distance = touchDistance(e.touches)
      if (distance > 0 && pinchStart.current.distance > 0) {
        applyScale(pinchStart.current.scale * (distance / pinchStart.current.distance))
      }
      return
    }
    if (e.touches.length === 1 && panStart.current && scaleRef.current > MIN_SCALE) {
      const dx = e.touches[0].clientX - panStart.current.x
      const dy = e.touches[0].clientY - panStart.current.y
      const next = {
        x: panStart.current.tx + dx,
        y: panStart.current.ty + dy,
      }
      translateRef.current = next
      setTranslate(next)
    }
  }, [applyScale])

  const onTouchEnd = useCallback((e?: React.TouchEvent) => {
    if (e && e.touches.length > 0) return
    if (scaleRef.current < 1.05) {
      reset()
    } else {
      pinchStart.current = null
      panStart.current = null
    }
  }, [reset])

  const isZoomed = scale > 1.02

  return {
    containerRef,
    scale,
    translate,
    isZoomed,
    reset,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
