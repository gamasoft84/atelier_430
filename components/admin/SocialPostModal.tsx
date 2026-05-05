"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SocialPosts {
  instagram: string
  facebook:  string
  whatsapp:  string
}

interface SocialPostModalProps {
  artworkId:    string
  artworkTitle: string
  open:         boolean
  onOpenChange: (open: boolean) => void
}

const TABS: { key: keyof SocialPosts; label: string }[] = [
  { key: "instagram", label: "Instagram"       },
  { key: "facebook",  label: "Facebook"        },
  { key: "whatsapp",  label: "WhatsApp Status" },
]

export default function SocialPostModal({
  artworkId,
  artworkTitle,
  open,
  onOpenChange,
}: SocialPostModalProps) {
  const [posts,   setPosts]   = useState<SocialPosts | null>(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState("")
  const [tab,     setTab]     = useState<keyof SocialPosts>("instagram")
  const [copied,  setCopied]  = useState(false)

  const generate = useCallback(() => {
    setLoading(true)
    setErr("")
    fetch("/api/ai/generate-post", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ artworkId }),
    })
      .then((r) => r.json())
      .then((data: { posts?: SocialPosts; error?: string }) => {
        if (data.error) setErr(data.error)
        else setPosts(data.posts ?? null)
      })
      .catch(() => setErr("Error de conexión"))
      .finally(() => setLoading(false))
  }, [artworkId])

  useEffect(() => {
    if (open && !posts && !loading) generate()
  }, [open, posts, loading, generate])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setPosts(null)
      setErr("")
      setLoading(false)
    }
  }, [open])

  async function handleCopy() {
    if (!posts) return
    await navigator.clipboard.writeText(posts[tab])
    setCopied(true)
    toast.success("Copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-carbon-900">
            Generar post
          </DialogTitle>
          <p className="text-xs text-stone-400 mt-0.5 truncate">{artworkTitle}</p>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === key
                  ? "bg-white text-carbon-900 shadow-sm"
                  : "text-stone-500 hover:text-carbon-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[140px] relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <Loader2 size={20} className="animate-spin text-gold-500" />
              <p className="text-xs text-stone-400">Generando con IA...</p>
            </div>
          ) : err ? (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <p className="text-sm text-red-500">{err}</p>
              <button
                onClick={generate}
                className="text-xs text-stone-500 hover:text-carbon-900 underline"
              >
                Reintentar
              </button>
            </div>
          ) : posts ? (
            <div className="relative">
              <textarea
                readOnly
                value={posts[tab]}
                rows={6}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm
                           text-carbon-900 leading-relaxed resize-none focus:outline-none"
              />
              {tab === "instagram" && (
                <p className="text-xs text-stone-400 mt-1">
                  {posts.instagram.length} caracteres
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-1 border-t border-stone-100">
          <button
            onClick={() => { setPosts(null); generate() }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-carbon-900 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} />
            Regenerar
          </button>

          <button
            onClick={handleCopy}
            disabled={!posts || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500
                       hover:bg-gold-400 disabled:opacity-40 text-white text-xs font-semibold
                       transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
