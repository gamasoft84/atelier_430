/**
 * Helpers para elegir qué imagen de una obra mostrar en distintos contextos.
 *
 * Una obra tiene 0..N imágenes. Cada imagen tiene flags ortogonales:
 *   - `is_primary`: imagen "técnica", default para vistas admin y AR.
 *   - `is_premium`: imagen "para vender" (render/styled lifestyle).
 *
 * Reglas:
 *   - PDF de ficha y posts de redes → SIEMPRE premium si existe (fallback primary).
 *   - Catálogo público y detalle    → según setting `prefer_premium_in_catalog`.
 *   - Admin (tabla, dashboard, AR)  → SIEMPRE primary (sin premium).
 *
 * Estos helpers son tolerantes a parciales: aceptan cualquier shape con los
 * flags + position, para servir tanto a `ArtworkImage` completo como a
 * subselects de Supabase con sólo unas columnas.
 */

export interface MinimalImage {
  is_primary?: boolean | null
  is_premium?: boolean | null
  position?: number | null
}

function sortedByPosition<T extends MinimalImage>(images: T[]): T[] {
  return [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

/**
 * Imagen "técnica": la marcada como `is_primary`, o la primera por posición.
 * Sin caer nunca a una imagen marcada como premium si hay otra primary.
 */
export function selectPrimaryImage<T extends MinimalImage>(
  images: T[] | null | undefined,
): T | undefined {
  if (!images || images.length === 0) return undefined
  const primary = images.find((i) => i.is_primary)
  if (primary) return primary
  return sortedByPosition(images)[0]
}

/**
 * Imagen "para vender": la marcada como `is_premium`. Si no hay, cae a
 * `is_primary`, y como último recurso a la primera por posición.
 */
export function selectPremiumImage<T extends MinimalImage>(
  images: T[] | null | undefined,
): T | undefined {
  if (!images || images.length === 0) return undefined
  const premium = images.find((i) => i.is_premium)
  if (premium) return premium
  return selectPrimaryImage(images)
}

/**
 * Decide entre premium o primary según el contexto. Usado en catálogo público
 * y detalle de obra, donde un setting global decide qué cara mostrar.
 */
export function selectShowcaseImage<T extends MinimalImage>(
  images: T[] | null | undefined,
  preferPremium: boolean,
): T | undefined {
  return preferPremium ? selectPremiumImage(images) : selectPrimaryImage(images)
}
