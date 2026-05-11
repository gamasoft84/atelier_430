#!/usr/bin/env node
/**
 * Mueve en Cloudinary todas las imágenes que aún viven bajo carpetas
 * `tmp-XXXXXXXX/` o `IMP-XXX/` (heredadas del flujo viejo) hacia la convención
 * canónica del proyecto:
 *
 *   atelier430/artworks/<CÓDIGO>/<CÓDIGO>-<sufijo>
 *
 * El script:
 *   1. Lee todas las filas de `artwork_images` JOIN `artworks` (para conocer el code).
 *   2. Para cada imagen cuyo `cloudinary_public_id` no comience con la carpeta
 *      canónica del código de su obra, llama a Cloudinary `rename`.
 *   3. Si el rename tiene éxito, hace UPDATE en `artwork_images` con la nueva
 *      `cloudinary_url` y `cloudinary_public_id`.
 *   4. Idempotente: si la imagen ya está en la carpeta correcta la salta.
 *
 * Requiere en `.env`:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (necesario para UPDATE en BD bypaseando RLS)
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *
 * Uso:
 *   npm run cloudinary:migrate            # corre en modo real
 *   npm run cloudinary:migrate -- --dry   # solo imprime qué movería, sin tocar nada
 *
 * Después de correrlo, las carpetas vacías `tmp-*`/`IMP-*` quedan en Cloudinary
 * pero ya sin assets dentro. Cloudinary las depura automáticamente con el tiempo
 * o pueden eliminarse a mano desde el panel.
 */

import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"

const dryRun = process.argv.includes("--dry")

// ─── Env ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!SUPABASE_URL || !SERVICE_KEY || !CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error(
    "Faltan envs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, " +
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
  )
  process.exit(1)
}

const FOLDER_PREFIX = "atelier430/artworks"

// ─── Cloudinary helpers ──────────────────────────────────────────────────

function signParams(params, secret) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&")
  return createHash("sha1").update(toSign + secret).digest("hex")
}

async function renameAsset(fromPublicId, toPublicId) {
  const timestamp = Math.round(Date.now() / 1000)
  const params = { from_public_id: fromPublicId, to_public_id: toPublicId, timestamp }
  const signature = signParams(params, API_SECRET)
  const form = new FormData()
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append("api_key", API_KEY)
  form.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/rename`, {
    method: "POST",
    body: form,
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`)
  }
  return { public_id: data.public_id, secure_url: data.secure_url }
}

// ─── Path helpers ────────────────────────────────────────────────────────

function isCanonical(publicId, code) {
  return publicId.startsWith(`${FOLDER_PREFIX}/${code}/`)
}

function canonicalPublicId(currentPublicId, code) {
  const fileName = currentPublicId.split("/").pop() ?? currentPublicId
  const lastDash = fileName.lastIndexOf("-")
  const suffix = lastDash >= 0 ? fileName.slice(lastDash + 1) : fileName
  return `${FOLDER_PREFIX}/${code}/${code}-${suffix}`
}

// ─── Main ────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

console.log(`\n${dryRun ? "[DRY-RUN] " : ""}Migración de carpetas Cloudinary\n`)

const { data: rows, error } = await supabase
  .from("artwork_images")
  .select("id, cloudinary_url, cloudinary_public_id, artworks!inner(code)")
  .order("id")

if (error) {
  console.error("Error leyendo BD:", error.message)
  process.exit(1)
}

let toMigrate = 0
let migrated = 0
let skipped = 0
let failed = 0

for (const row of rows) {
  const code = row.artworks.code
  const current = row.cloudinary_public_id

  if (isCanonical(current, code)) {
    skipped++
    continue
  }

  const target = canonicalPublicId(current, code)
  toMigrate++

  console.log(`• ${code}`)
  console.log(`    de: ${current}`)
  console.log(`    a:  ${target}`)

  if (dryRun) continue

  try {
    const renamed = await renameAsset(current, target)
    const { error: upErr } = await supabase
      .from("artwork_images")
      .update({
        cloudinary_url: renamed.secure_url,
        cloudinary_public_id: renamed.public_id,
      })
      .eq("id", row.id)

    if (upErr) {
      console.warn(`    ⚠️  Cloudinary OK pero BD falló: ${upErr.message}`)
      failed++
    } else {
      migrated++
    }
  } catch (e) {
    console.warn(`    ⚠️  ${e.message}`)
    failed++
  }
}

console.log("\n─── Resumen ───")
console.log(`  Total imágenes en BD : ${rows.length}`)
console.log(`  Ya canónicas          : ${skipped}`)
console.log(`  ${dryRun ? "Por migrar" : "Migradas  "}            : ${dryRun ? toMigrate : migrated}`)
if (!dryRun && failed) console.log(`  Fallidas              : ${failed}`)
console.log("")

if (dryRun && toMigrate > 0) {
  console.log("Dry-run sin cambios. Quita --dry para aplicar.\n")
}
