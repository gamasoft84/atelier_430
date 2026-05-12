#!/usr/bin/env node
/**
 * Recodifica una obra cuando su categoría cambia y el prefijo del code queda
 * inconsistente. Ejemplo: E-009 cuya categoría se actualizó a "nacional" debería
 * pasar a ser N-XYZ (siguiente disponible en la serie nacional).
 *
 * El script hace TODO en orden seguro:
 *   1. Lee la obra por code y verifica que existe.
 *   2. Determina la nueva categoría (la actual de BD, o --to-category=<X>).
 *   3. Calcula el siguiente <PREFIJO>-XYZ libre.
 *   4. Renombra cada asset en Cloudinary (mueve la carpeta).
 *   5. Actualiza artwork_images con las nuevas URLs/public_ids.
 *   6. Actualiza artworks.code y artworks.category.
 *   7. Te sugiere correr `npm run cloudinary:purge-folders` para limpiar
 *      la carpeta vieja vacía.
 *
 * IMPORTANTE — efectos colaterales que NO maneja el script:
 *   - La URL pública /catalogo/<code-viejo> queda 404. Si compartiste el link
 *     vas a romper esa referencia. Para SEO/redirects: este flujo no los crea.
 *   - Caches de Next.js (ISR/PPR): revalidan automáticamente la próxima visita;
 *     si querés invalidar inmediatamente, reinicia el dev server o redeploy.
 *
 * Requiere en .env:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (UPDATE bypaseando RLS)
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *
 * Uso:
 *   npm run recode:artwork -- <CODE>                          # interactivo
 *   npm run recode:artwork -- <CODE> --to-category=nacional   # cambia categoría también
 *   npm run recode:artwork -- <CODE> --dry-run                # solo imprime el plan
 *   npm run recode:artwork -- <CODE> --yes                    # skip confirmación
 *
 * Ejemplos:
 *   npm run recode:artwork -- E-009                   # asume que la categoría
 *                                                     # actual en BD ya es 'nacional'
 *   npm run recode:artwork -- E-009 --to-category=nacional --dry-run
 */

import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"
import readline from "node:readline/promises"

// ─── Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run") || args.includes("--dry")
const skipConfirm = args.includes("--yes") || args.includes("-y")

const code = args.find((a) => !a.startsWith("--") && !a.startsWith("-"))
const toCategoryArg = args.find((a) => a.startsWith("--to-category="))?.split("=")[1]

if (!code) {
  console.error("Uso: npm run recode:artwork -- <CODE> [--to-category=<cat>] [--dry-run] [--yes]")
  console.error("Ejemplo: npm run recode:artwork -- E-009 --to-category=nacional")
  process.exit(1)
}

const VALID_CATEGORIES = ["religiosa", "nacional", "europea", "moderna"]
if (toCategoryArg && !VALID_CATEGORIES.includes(toCategoryArg)) {
  console.error(`--to-category debe ser uno de: ${VALID_CATEGORIES.join(", ")}`)
  process.exit(1)
}

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
const CATEGORY_PREFIX = { religiosa: "R", nacional: "N", europea: "E", moderna: "M" }

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

function canonicalPublicIdFor(currentPublicId, newCode) {
  const fileName = currentPublicId.split("/").pop() ?? currentPublicId
  const lastDash = fileName.lastIndexOf("-")
  const suffix = lastDash >= 0 ? fileName.slice(lastDash + 1) : fileName
  return `${FOLDER_PREFIX}/${newCode}/${newCode}-${suffix}`
}

// ─── Main ────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

console.log(`\n${dryRun ? "[DRY-RUN] " : ""}Recodificación de obra ${code}\n`)

// 1. Buscar la obra
const { data: artwork, error: aErr } = await supabase
  .from("artworks")
  .select("id, code, title, category")
  .eq("code", code)
  .maybeSingle()

if (aErr) {
  console.error("Error leyendo obra:", aErr.message)
  process.exit(1)
}
if (!artwork) {
  console.error(`No existe la obra con code=${code}`)
  process.exit(1)
}

// 2. Determinar nueva categoría
const newCategory = toCategoryArg ?? artwork.category
const newPrefix = CATEGORY_PREFIX[newCategory]
if (!newPrefix) {
  console.error(`Categoría inválida: ${newCategory}`)
  process.exit(1)
}

const currentPrefix = code.split("-")[0]
if (currentPrefix === newPrefix && artwork.category === newCategory) {
  console.log(`La obra ${code} ya tiene el prefijo correcto (${newPrefix}-) y la categoría '${newCategory}'.`)
  console.log("Nada que hacer.\n")
  process.exit(0)
}

// 3. Calcular siguiente <PREFIJO>-XYZ disponible
const { data: lastOfPrefix, error: lErr } = await supabase
  .from("artworks")
  .select("code")
  .like("code", `${newPrefix}-%`)
  .order("code", { ascending: false })
  .limit(1)

if (lErr) {
  console.error("Error calculando siguiente code:", lErr.message)
  process.exit(1)
}

const lastNum =
  lastOfPrefix && lastOfPrefix.length > 0
    ? parseInt(lastOfPrefix[0].code.split("-")[1] ?? "0", 10)
    : 0
const newCode = `${newPrefix}-${String(lastNum + 1).padStart(3, "0")}`

// 4. Cargar imágenes de la obra
const { data: images, error: iErr } = await supabase
  .from("artwork_images")
  .select("id, cloudinary_url, cloudinary_public_id, position")
  .eq("artwork_id", artwork.id)
  .order("position")

if (iErr) {
  console.error("Error leyendo imágenes:", iErr.message)
  process.exit(1)
}

// 5. Plan
console.log(`Obra        : "${artwork.title}"`)
console.log(`Code actual : ${artwork.code}   (categoría '${artwork.category}')`)
console.log(`Code nuevo  : ${newCode}   (categoría '${newCategory}')`)
console.log(`Imágenes    : ${images?.length ?? 0}`)
if (images && images.length > 0) {
  for (const img of images) {
    const target = canonicalPublicIdFor(img.cloudinary_public_id, newCode)
    console.log(`  • ${img.cloudinary_public_id}`)
    console.log(`    → ${target}`)
  }
}

if (artwork.category !== newCategory) {
  console.log(`\n⚠️  Además se actualizará artworks.category de '${artwork.category}' → '${newCategory}'`)
}

console.log("")

if (dryRun) {
  console.log("Dry-run sin cambios. Quita --dry-run para aplicar.\n")
  process.exit(0)
}

// 6. Confirmación
if (!skipConfirm) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`¿Confirmar recodificación ${code} → ${newCode}? [y/N] `)).trim().toLowerCase()
  rl.close()
  if (answer !== "y" && answer !== "s" && answer !== "yes" && answer !== "si" && answer !== "sí") {
    console.log("Cancelado.\n")
    process.exit(0)
  }
}

// 7. Ejecutar — rename en Cloudinary primero, después UPDATE en BD
let renamed = 0
let renameFailed = 0
const renamedRows = [] // { id, newUrl, newPublicId }

for (const img of images ?? []) {
  const target = canonicalPublicIdFor(img.cloudinary_public_id, newCode)
  try {
    const r = await renameAsset(img.cloudinary_public_id, target)
    renamedRows.push({
      id: img.id,
      newUrl: r.secure_url,
      newPublicId: r.public_id,
    })
    renamed++
    console.log(`✓ rename ${img.cloudinary_public_id} → ${r.public_id}`)
  } catch (e) {
    renameFailed++
    console.warn(`⚠️  rename FAILED ${img.cloudinary_public_id}: ${e.message}`)
  }
}

if (renameFailed > 0) {
  console.error(
    `\nAbortando: fallaron ${renameFailed} renames en Cloudinary. ` +
      `Los ${renamed} que sí se renombraron quedaron movidos. ` +
      `Resolvé los problemas y volvé a correr el script (es idempotente).\n`,
  )
  process.exit(1)
}

// 8. UPDATE artwork_images con las nuevas URLs
for (const r of renamedRows) {
  const { error: upErr } = await supabase
    .from("artwork_images")
    .update({ cloudinary_url: r.newUrl, cloudinary_public_id: r.newPublicId })
    .eq("id", r.id)
  if (upErr) {
    console.error(`Error actualizando artwork_images.id=${r.id}: ${upErr.message}`)
    process.exit(1)
  }
}

// 9. UPDATE artworks (code + category si cambió)
const updatePayload = { code: newCode }
if (artwork.category !== newCategory) updatePayload.category = newCategory

const { error: aupErr } = await supabase
  .from("artworks")
  .update(updatePayload)
  .eq("id", artwork.id)

if (aupErr) {
  console.error(`Error actualizando artworks.id=${artwork.id}: ${aupErr.message}`)
  process.exit(1)
}

console.log("\n─── Resumen ───")
console.log(`  Code           : ${code} → ${newCode}`)
console.log(`  Categoría      : ${artwork.category} → ${newCategory}`)
console.log(`  Assets movidos : ${renamed}`)
console.log("")
console.log("Sugerencia: corré `npm run cloudinary:purge-folders` para limpiar")
console.log(`la carpeta vacía en Cloudinary atelier430/artworks/${code}/.`)
console.log("")
