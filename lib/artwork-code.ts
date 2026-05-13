import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { ArtworkCategory } from "@/types/artwork"

const CATEGORY_PREFIX: Record<ArtworkCategory, string> = {
  religiosa: "R",
  nacional: "N",
  europea: "E",
  moderna: "M",
}

/**
 * Siguiente código `PREFIX-NNN` rellenando huecos: el menor entero ≥ 1 que no exista en `codes`.
 */
export function computeNextAvailableArtworkCode(
  prefix: string,
  codes: readonly string[],
): string {
  const used = new Set<number>()
  const re = new RegExp(`^${prefix}-(\\d+)$`)
  for (const code of codes) {
    const m = code.match(re)
    if (!m) continue
    const n = parseInt(m[1], 10)
    if (n > 0 && Number.isFinite(n)) used.add(n)
  }
  let n = 1
  while (used.has(n)) n += 1
  return `${prefix}-${String(n).padStart(3, "0")}`
}

export async function fetchNextAvailableArtworkCodeByPrefix(
  supabase: SupabaseClient<Database>,
  prefix: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("artworks")
    .select("code")
    .like("code", `${prefix}-%`)
    .limit(2000)

  if (error || !data?.length) {
    return `${prefix}-001`
  }
  return computeNextAvailableArtworkCode(
    prefix,
    data.map((r) => r.code),
  )
}

export async function fetchNextAvailableArtworkCode(
  supabase: SupabaseClient<Database>,
  category: ArtworkCategory,
): Promise<string> {
  const prefix = CATEGORY_PREFIX[category]
  return fetchNextAvailableArtworkCodeByPrefix(supabase, prefix)
}
