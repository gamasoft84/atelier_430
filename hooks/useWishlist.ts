"use client"

// Implementación completa en Fase 5
export function useWishlist() {
  return {
    items: [] as string[],
    add: (_id: string) => {},
    remove: (_id: string) => {},
    toggle: (_id: string) => {},
    has: (_id: string) => false,
    count: 0,
  }
}
