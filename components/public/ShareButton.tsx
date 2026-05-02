"use client"

import { useState } from "react"
import { Share2, Check, Copy } from "lucide-react"
import { WHATSAPP_NUMBER } from "@/lib/constants"

interface ShareButtonProps {
  title: string
  url?: string
}

export default function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const currentUrl = typeof window !== "undefined" ? window.location.href : ""

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
    setOpen(false)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${currentUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener")
    setOpen(false)
  }

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      "_blank",
      "noopener,width=600,height=400"
    )
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:border-stone-300 hover:text-carbon-900 transition-colors w-full justify-center"
      >
        <Share2 size={15} />
        Compartir
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full mb-2 right-0 z-20 w-44 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: "#25D366" }} />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={shareFacebook}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <span className="w-4 h-4 rounded-full bg-blue-600 flex-shrink-0" />
              Facebook
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
