"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getOrCreateWishlistSessionId } from "@/lib/wishlist/session-id"

export interface WishlistContextValue {
  sessionId: string | null
  ready: boolean
  ids: string[]
  count: number
  has: (artworkId: string) => boolean
  add: (artworkId: string) => Promise<void>
  remove: (artworkId: string) => Promise<void>
  toggle: (artworkId: string) => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [ids, setIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const sid = getOrCreateWishlistSessionId()
    setSessionId(sid)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("artwork_id")
      .eq("session_id", sid)
      .order("created_at", { ascending: false })
    if (error) {
      toast.error("No se pudo actualizar favoritos")
      return
    }
    setIds((data ?? []).map((r) => r.artwork_id))
  }, [])

  useEffect(() => {
    const sid = getOrCreateWishlistSessionId()
    setSessionId(sid)
    const supabase = createClient()
    void supabase
      .from("wishlist_items")
      .select("artwork_id")
      .eq("session_id", sid)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setIds(data.map((r) => r.artwork_id))
        setReady(true)
      })
  }, [])

  const add = useCallback(async (artworkId: string) => {
    const sid = getOrCreateWishlistSessionId()
    setSessionId(sid)
    let previous: string[] = []
    let skipInsert = false
    setIds((p) => {
      previous = p
      if (p.includes(artworkId)) {
        skipInsert = true
        return p
      }
      return [artworkId, ...p]
    })
    if (skipInsert) return
    const supabase = createClient()
    const { error } = await supabase.from("wishlist_items").insert({
      session_id: sid,
      artwork_id: artworkId,
    })
    if (error) {
      setIds(previous)
      if (error.code === "23505") return
      toast.error("No se pudo guardar en favoritos")
    }
  }, [])

  const remove = useCallback(async (artworkId: string) => {
    const sid = getOrCreateWishlistSessionId()
    let previous: string[] = []
    setIds((p) => {
      previous = p
      return p.filter((id) => id !== artworkId)
    })
    const supabase = createClient()
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("session_id", sid)
      .eq("artwork_id", artworkId)
    if (error) {
      setIds(previous)
      toast.error("No se pudo quitar de favoritos")
    }
  }, [])

  const toggle = useCallback(
    async (artworkId: string) => {
      if (ids.includes(artworkId)) await remove(artworkId)
      else await add(artworkId)
    },
    [ids, add, remove]
  )

  const has = useCallback((artworkId: string) => ids.includes(artworkId), [ids])

  const value = useMemo<WishlistContextValue>(
    () => ({
      sessionId,
      ready,
      ids,
      count: ids.length,
      has,
      add,
      remove,
      toggle,
      refresh,
    }),
    [sessionId, ready, ids, has, add, remove, toggle, refresh]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error("useWishlist debe usarse dentro de WishlistProvider")
  }
  return ctx
}
