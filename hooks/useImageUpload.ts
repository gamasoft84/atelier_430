"use client"

// Implementación completa en Fase 2
export function useImageUpload() {
  return {
    files: [],
    uploading: false,
    upload: async (_files: File[]) => {},
    remove: (_publicId: string) => {},
    reorder: (_from: number, _to: number) => {},
  }
}
