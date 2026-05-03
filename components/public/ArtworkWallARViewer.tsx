"use client"

import { useEffect, useState } from "react"
import "@google/model-viewer"

interface ArtworkWallARViewerProps {
  artworkCode: string
  title: string
}

function isNgrokHost(hostname: string): boolean {
  return (
    hostname.includes("ngrok-free.app") ||
    hostname.includes("ngrok-free.dev") ||
    hostname.includes("ngrok.io") ||
    hostname.includes("ngrok.app")
  )
}

/**
 * Origen real del navegador. En ngrok Free el GLB debe pedirse con header o devuelve HTML.
 * En Vercel / localhost usamos la URL del modelo directamente (sin parpadeo innecesario).
 */
export default function ArtworkWallARViewer({ artworkCode, title }: ArtworkWallARViewerProps) {
  const [modelSrc, setModelSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const path = `/api/artwork-ar/${encodeURIComponent(artworkCode)}`
    const absoluteUrl = `${window.location.origin}${path}`
    let blobUrl: string | null = null
    let cancelled = false

    setError(false)

    if (!isNgrokHost(window.location.hostname)) {
      setModelSrc(absoluteUrl)
      return () => {
        cancelled = true
      }
    }

    setModelSrc(null)

    ;(async () => {
      try {
        const res = await fetch(absoluteUrl, {
          headers: { "ngrok-skip-browser-warning": "1" },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        setModelSrc(blobUrl)
      } catch {
        if (!cancelled) setError(true)
      }
    })()

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [artworkCode])

  if (error) {
    return (
      <div className="h-[min(70vh,420px)] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center px-4 text-center">
        <p className="text-xs text-stone-500">
          No se pudo cargar el modelo 3D. Si usas ngrok gratuito, recarga la página tras el aviso del túnel.
        </p>
      </div>
    )
  }

  if (!modelSrc) {
    return (
      <div
        className="h-[min(70vh,420px)] rounded-xl bg-stone-100 animate-pulse"
        aria-hidden
      />
    )
  }

  return (
    <model-viewer
      src={modelSrc}
      alt={title}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-placement="wall"
      ar-scale="fixed"
      camera-controls
      shadow-intensity="0.55"
      exposure="1"
      style={{
        width: "100%",
        height: "min(70vh, 420px)",
        backgroundColor: "rgb(250 250 249)",
      }}
      className="rounded-xl [&::part(default-progress-mask)]:rounded-xl"
    />
  )
}
