"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { ImageIcon } from "lucide-react"

const GAP = 10

interface ArtworksTableThumbProps {
  src: string | null
  alt: string
}

export default function ArtworksTableThumb({ src, alt }: ArtworksTableThumbProps) {
  const ref = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ left: 0, top: 0 })

  const hoverSrc = src?.trim() ? src : ""

  const updatePos = useCallback(() => {
    const el = ref.current
    if (!el || !hoverSrc) return
    const r = el.getBoundingClientRect()

    const maxW = window.innerWidth - 24
    const maxH = window.innerHeight - 24

    const imgEl = previewRef.current
    const dispW = imgEl ? Math.min(imgEl.offsetWidth || maxW, maxW) : maxW
    const dispH = imgEl ? Math.min(imgEl.offsetHeight || maxH, maxH) : maxH

    let left = r.right + GAP
    if (left + dispW > window.innerWidth - 12) {
      left = r.left - GAP - dispW
    }
    if (left < 12) left = 12

    const centerY = r.top + r.height / 2
    const half = dispH / 2
    let top = centerY
    if (centerY - half < 12) top = 12 + half
    if (centerY + half > window.innerHeight - 12) {
      top = window.innerHeight - 12 - half
    }

    setCoords({ left, top })
  }, [hoverSrc])

  useLayoutEffect(() => {
    if (!show) return
    updatePos()
  }, [show, updatePos])

  useEffect(() => {
    if (!show) return
    const onScrollOrResize = () => updatePos()
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [show, updatePos])

  return (
    <>
      <div
        ref={ref}
        className="relative w-10 h-12 rounded bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center cursor-zoom-in"
        onPointerEnter={() => {
          if (!hoverSrc) return
          setShow(true)
        }}
        onPointerLeave={() => setShow(false)}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={40}
            height={50}
            className="object-cover w-full h-full"
            sizes="40px"
          />
        ) : (
          <ImageIcon size={14} className="text-stone-300" />
        )}
      </div>
      {show && hoverSrc && typeof document !== "undefined"
        ? createPortal(
            <img
              ref={previewRef}
              src={hoverSrc}
              alt=""
              className="pointer-events-none fixed z-[100] block h-auto w-auto max-h-[calc(100vh-24px)] max-w-[calc(100vw-24px)] border-0 bg-transparent object-contain shadow-none outline-none ring-0 select-none"
              style={{
                left: coords.left,
                top: coords.top,
                transform: "translateY(-50%)",
              }}
              draggable={false}
              aria-hidden
              onLoad={() => updatePos()}
            />,
            document.body,
          )
        : null}
    </>
  )
}
