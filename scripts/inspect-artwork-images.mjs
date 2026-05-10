#!/usr/bin/env node
/**
 * Diagnóstico de obras: imprime medidas, marco e imágenes registradas en BD para
 * una obra dada por su código. Útil para validar que los datos guardados coinciden
 * con lo que se ve en el sitio público y detectar `cloudinary_public_id` o URLs
 * duplicadas tras editar imágenes.
 *
 * Requisitos en `.env`:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (sólo lectura local; nunca subir a cliente)
 *
 * Uso:
 *   npm run inspect:artwork -- N-011
 *   # equivalente directo:
 *   node --env-file=.env scripts/inspect-artwork-images.mjs N-011
 *
 * Ejemplo de salida:
 *   Obra: N-011 — Ex-Convento de San Francisco y Popocatépetl
 *   Medidas: 70 × 90 cm · marco: 92 × 112 cm
 *   Imágenes (4):
 *     pos=0 primary=true
 *       id           = ...
 *       public_id    = atelier430/artworks/N-011/N-011-a3f9b2c1
 *       url          = https://res.cloudinary.com/...
 *       size         = 1416x1111
 *     ...
 *
 * Si detecta `public_id` o URLs duplicadas en `artwork_images`, las imprime al
 * final como advertencia (síntoma típico: dos thumbs renderizan la misma foto).
 */

import { createClient } from "@supabase/supabase-js"

const code = process.argv[2]
if (!code) {
  console.error("Uso: npm run inspect:artwork -- <code>")
  console.error("Ej.: npm run inspect:artwork -- N-011")
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: art, error } = await supabase
  .from("artworks")
  .select("*, artwork_images(*)")
  .eq("code", code)
  .single()

if (error || !art) {
  console.error("Obra no encontrada:", error?.message)
  process.exit(1)
}

console.log(`\nObra: ${art.code} — ${art.title}`)
console.log(
  `Medidas: ${art.width_cm ?? "?"} × ${art.height_cm ?? "?"} cm` +
    (art.has_frame
      ? ` · marco: ${art.frame_outer_width_cm ?? "?"} × ${art.frame_outer_height_cm ?? "?"} cm`
      : " · sin marco"),
)
console.log(`Imágenes (${art.artwork_images.length}):\n`)

const sorted = [...art.artwork_images].sort((a, b) => a.position - b.position)
for (const img of sorted) {
  console.log(`  pos=${img.position} primary=${img.is_primary}`)
  console.log(`    id           = ${img.id}`)
  console.log(`    public_id    = ${img.cloudinary_public_id}`)
  console.log(`    url          = ${img.cloudinary_url}`)
  console.log(`    size         = ${img.width}x${img.height}`)
  console.log()
}

const ids = sorted.map((i) => i.cloudinary_public_id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
if (dupes.length > 0) {
  console.log("⚠️  PUBLIC_IDs DUPLICADOS:", [...new Set(dupes)])
}

const urls = sorted.map((i) => i.cloudinary_url)
const dupeUrls = urls.filter((u, i) => urls.indexOf(u) !== i)
if (dupeUrls.length > 0) {
  console.log("⚠️  URLs DUPLICADAS:", [...new Set(dupeUrls)])
}
