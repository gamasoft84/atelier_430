#!/usr/bin/env node
/**
 * Borra carpetas residuales en Cloudinary bajo `atelier430/artworks/`. Filtra
 * sólo las que empiezan con `tmp-` o `IMP-` (las del formato X-NNN nunca se
 * tocan).
 *
 * Cloudinary sólo deja borrar una carpeta si NO tiene assets dentro. Hay 2 modos:
 *
 *   - Modo normal:    intenta borrar; si la carpeta tiene contenido, la salta.
 *   - Modo --force:   si la carpeta tiene contenido, inspecciona cada asset,
 *                     borra los que NO estén referenciados en `artwork_images`
 *                     y reintenta borrar la carpeta. Si algún asset SÍ está
 *                     referenciado en BD, la respeta y reporta el código de
 *                     la obra que lo usa.
 *
 * Requiere en `.env`:
 *   - NEXT_PUBLIC_SUPABASE_URL          (sólo necesario con --force)
 *   - SUPABASE_SERVICE_ROLE_KEY         (sólo necesario con --force)
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *
 * Uso:
 *   npm run cloudinary:purge-folders                # interactivo, sólo borra carpetas vacías
 *   npm run cloudinary:purge-folders -- --dry       # solo lista
 *   npm run cloudinary:purge-folders -- --yes       # sin confirmación
 *   npm run cloudinary:purge-folders -- --force     # borra huérfanos dentro y luego la carpeta
 *   npm run cloudinary:purge-folders -- --force --yes
 *
 * Recomendado correr DESPUÉS de:
 *   1. npm run cloudinary:migrate   (mueve assets a su carpeta canónica)
 *   2. npm run cloudinary:cleanup   (borra assets huérfanos)
 *
 * Pero con --force ya no necesitás correr cleanup primero: este script hace ambas
 * cosas en un solo paso para las carpetas tmp-/IMP-.
 */

import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"
import readline from "node:readline"

const dryRun = process.argv.includes("--dry")
const skipConfirm = process.argv.includes("--yes")
const force = process.argv.includes("--force")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error(
    "Faltan envs: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
  )
  process.exit(1)
}

if (force && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error("Modo --force requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env")
  process.exit(1)
}

const PARENT = "atelier430/artworks"

// ─── Cloudinary helpers ──────────────────────────────────────────────────

function basicAuth() {
  return "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64")
}

function signParams(params, secret) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&")
  return createHash("sha1").update(toSign + secret).digest("hex")
}

async function listSubfolders(folderPath) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/folders/${folderPath}`
  const res = await fetch(url, { headers: { Authorization: basicAuth() } })
  if (!res.ok) {
    throw new Error(`list folders ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()
  return data.folders ?? []
}

async function listResourcesInFolder(prefix) {
  const out = []
  let cursor
  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`)
    url.searchParams.set("type", "upload")
    url.searchParams.set("prefix", prefix)
    url.searchParams.set("max_results", "500")
    if (cursor) url.searchParams.set("next_cursor", cursor)
    const res = await fetch(url.toString(), { headers: { Authorization: basicAuth() } })
    if (!res.ok) throw new Error(`list ${res.status}: ${await res.text()}`)
    const data = await res.json()
    out.push(...data.resources)
    cursor = data.next_cursor
  } while (cursor)
  return out
}

async function destroyAsset(publicId) {
  const timestamp = Math.round(Date.now() / 1000)
  const signature = signParams({ public_id: publicId, timestamp }, API_SECRET)
  const form = new FormData()
  form.append("public_id", publicId)
  form.append("api_key", API_KEY)
  form.append("timestamp", String(timestamp))
  form.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: "POST",
    body: form,
  })
  const data = await res.json()
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error(`destroy: ${data.result}`)
  }
  return data.result
}

async function deleteFolder(folderPath) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/folders/${folderPath}`
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: basicAuth() } })
  if (res.status === 200) return "deleted"
  if (res.status === 400) return "not_empty"
  throw new Error(`delete folder ${res.status}: ${await res.text()}`)
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (a) => {
      rl.close()
      const x = a.trim().toLowerCase()
      resolve(x === "y" || x === "yes")
    })
  })
}

// ─── Main ────────────────────────────────────────────────────────────────

console.log(
  `\n${dryRun ? "[DRY-RUN] " : ""}${force ? "[FORCE] " : ""}Buscando carpetas bajo ${PARENT}/...\n`,
)

const folders = await listSubfolders(PARENT)
const candidates = folders.filter(
  (f) => f.name.startsWith("tmp-") || f.name.startsWith("IMP-"),
)

console.log(`Subcarpetas totales : ${folders.length}`)
console.log(`Candidatas a purgar : ${candidates.length} (tmp-..., IMP-...)\n`)

if (candidates.length === 0) {
  console.log("No hay carpetas tmp-/IMP- residuales. ✓\n")
  process.exit(0)
}

candidates.forEach((f) => console.log(`  · ${f.path}`))
console.log()

if (dryRun) {
  console.log("Dry-run. No se borró nada.\n")
  process.exit(0)
}

if (!skipConfirm) {
  const message = force
    ? `¿Borrar contenido huérfano y luego ${candidates.length} carpetas? (y/N) `
    : `¿Intentar borrar ${candidates.length} carpetas? (y/N) `
  const ok = await confirm(message)
  if (!ok) {
    console.log("Cancelado.\n")
    process.exit(0)
  }
}

// Para --force: pre-cargar todas las referencias de BD una sola vez.
let referenceMap = new Map()
if (force) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from("artwork_images")
    .select("cloudinary_public_id, artworks!inner(code)")
  if (error) {
    console.error("Error leyendo BD:", error.message)
    process.exit(1)
  }
  referenceMap = new Map(data.map((r) => [r.cloudinary_public_id, r.artworks.code]))
  console.log(`Cargadas ${referenceMap.size} referencias desde artwork_images.\n`)
}

console.log("Procesando...\n")

let foldersDeleted = 0
let foldersKept = 0
let foldersFailed = 0
let assetsDeleted = 0
let assetsKept = 0

for (const f of candidates) {
  try {
    let result = await deleteFolder(f.path)

    if (result === "deleted") {
      console.log(`  ✓ ${f.path}  (estaba vacía)`)
      foldersDeleted++
      continue
    }

    // not_empty: si no es modo force, saltamos
    if (!force) {
      console.log(`  · ${f.path}  (no vacía, se omitió)`)
      foldersKept++
      continue
    }

    // Modo force: inspeccionar y borrar huérfanos
    const resources = await listResourcesInFolder(f.path + "/")
    const orphans = resources.filter((r) => !referenceMap.has(r.public_id))
    const referenced = resources.filter((r) => referenceMap.has(r.public_id))

    if (referenced.length > 0) {
      console.log(`  ⚠️  ${f.path}  (${referenced.length} referencia(s) en BD; se omite)`)
      for (const r of referenced) {
        const code = referenceMap.get(r.public_id)
        console.log(`        ↳ ${r.public_id.split("/").pop()}  → obra ${code}`)
      }
      assetsKept += referenced.length
      foldersKept++
      continue
    }

    // Todos huérfanos: borrar uno por uno
    let allOk = true
    for (const r of orphans) {
      try {
        await destroyAsset(r.public_id)
        assetsDeleted++
      } catch (e) {
        console.warn(`        ✗ ${r.public_id}: ${e.message}`)
        allOk = false
      }
    }

    if (!allOk) {
      console.log(`  ⚠️  ${f.path}  (algunos assets no se pudieron borrar)`)
      foldersFailed++
      continue
    }

    // Reintentar borrar carpeta ahora vacía
    result = await deleteFolder(f.path)
    if (result === "deleted") {
      console.log(`  ✓ ${f.path}  (borrados ${orphans.length} huérfanos + carpeta)`)
      foldersDeleted++
    } else {
      console.log(`  · ${f.path}  (borrados ${orphans.length} huérfanos pero la carpeta sigue)`)
      foldersKept++
    }
  } catch (e) {
    console.warn(`  ✗ ${f.path}: ${e.message}`)
    foldersFailed++
  }
}

console.log("\n─── Resumen ───")
console.log(`  Carpetas eliminadas : ${foldersDeleted}`)
console.log(`  Carpetas con BD     : ${foldersKept}${force ? " (tienen assets en uso)" : ""}`)
if (foldersFailed) console.log(`  Errores             : ${foldersFailed}`)
if (force) {
  console.log(`  Assets borrados     : ${assetsDeleted}`)
  console.log(`  Assets en uso       : ${assetsKept}`)
}
console.log("")
