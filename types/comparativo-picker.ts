import type { ArtworkCategory } from "@/types/artwork"
import type { MarcoOption, SizeOption } from "@/types/catalog"

export type ComparativoPickerFilters = {
  categorias: ArtworkCategory[]
  tecnicas: string[]
  tamanos: SizeOption[]
  marco: MarcoOption | null
}

export const EMPTY_COMPARATIVO_PICKER_FILTERS: ComparativoPickerFilters = {
  categorias: [],
  tecnicas: [],
  tamanos: [],
  marco: null,
}

export function hasActiveComparativoPickerFilters(f: ComparativoPickerFilters): boolean {
  return (
    f.categorias.length > 0 ||
    f.tecnicas.length > 0 ||
    f.tamanos.length > 0 ||
    f.marco !== null
  )
}
