const STORAGE_KEY = "atelier430_wishlist_session_v1"

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Solo en el navegador. */
export function getOrCreateWishlistSessionId(): string {
  if (typeof window === "undefined") {
    return randomUUID()
  }
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing && existing.length >= 8) return existing
    const id = randomUUID()
    window.localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return randomUUID()
  }
}

export function readWishlistSessionIdFromStorage(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}
