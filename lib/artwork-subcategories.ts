export type ArtworkCategorySlug = "religiosa" | "nacional" | "europea" | "moderna"

export type SubcategoryOption = { value: string; label: string }

/**
 * Opciones de subcategoría por categoría (misma fuente que el formulario de obra).
 */
export const ARTWORK_SUBCATEGORY_OPTIONS: Record<
  ArtworkCategorySlug,
  readonly SubcategoryOption[]
> = {
  religiosa: [
    { value: "virgen_guadalupe", label: "Virgen de Guadalupe" },
    { value: "virgen_guadalupe_tepeyac", label: "Virgen de Guadalupe (Tepeyac)" },
    { value: "san_charbel", label: "San Charbel" },
    { value: "san_judas_tadeo", label: "San Judas Tadeo" },
    { value: "san_judas_tadeo_dorado_grande", label: "San Judas Tadeo (marco grande dorado)" },
    { value: "san_miguel_arcangel", label: "San Miguel Arcángel" },
    { value: "san_miguel_arcangel_dorado", label: "San Miguel Arcángel (marco grande dorado)" },
    { value: "la_sagrada_familia", label: "La Sagrada Familia" },
    { value: "la_ultima_cena", label: "La Última Cena" },
  ],
  nacional: [
    { value: "Paisaje rural", label: "Paisaje rural" },
    { value: "Paisaje marino", label: "Paisaje marino" },
    { value: "Paisaje urbano", label: "Paisaje urbano" },
    { value: "Puente", label: "Puente" },
    { value: "Montaña", label: "Montaña" },
    { value: "Bosque", label: "Bosque" },
    { value: "Bodegón", label: "Bodegón" },
    { value: "Otro", label: "Otro" },
  ],
  europea: [
    { value: "Paisaje clásico", label: "Paisaje clásico" },
    { value: "Retrato", label: "Retrato" },
    { value: "Bodegón", label: "Bodegón" },
    { value: "Mitología", label: "Mitología" },
    { value: "Arquitectura", label: "Arquitectura" },
    { value: "Otro", label: "Otro" },
  ],
  moderna: [
    { value: "Abstracto", label: "Abstracto" },
    { value: "Geométrico", label: "Geométrico" },
    { value: "Expresionista", label: "Expresionista" },
    { value: "Minimalista", label: "Minimalista" },
    { value: "Contemporánea decorativa", label: "Contemporánea decorativa" },
    { value: "Otro", label: "Otro" },
  ],
}

/** Si `subcategory` no pertenece a la categoría, usa la primera opción válida. */
export function normalizeSubcategoryForCategory<D extends { category: ArtworkCategorySlug; subcategory?: string }>(
  d: D,
): D {
  const opts = ARTWORK_SUBCATEGORY_OPTIONS[d.category]
  const cur = d.subcategory ?? ""
  if (opts.some((o) => o.value === cur)) return d
  return { ...d, subcategory: opts[0]?.value ?? "" }
}
