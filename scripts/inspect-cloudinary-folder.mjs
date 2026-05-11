#!/usr/bin/env node
/**
 * Inspecciona una carpeta específica en Cloudinary bajo `atelier430/artworks/`,
 * lista cada asset que contiene y verifica si está referenciado en
 * `artwork_images`. Marca cada asset como REFERENCIADO o HUÉRFANO.
 *
 * Útil cuando `purge-folders` reporta una carpeta como "no vacía" pero estás
 * seguro de que su contenido es residual: este script te muestra exactamente
 * qué tiene adentro y te permite forzar la eliminación con `--force`.
 *
 * Requiere en `.env`:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *
 * Uso:
 *   # Solo inspeccionar (no borra nada):
 *   npm run cloudinary:inspect-folder -- tmp-fe836d57
 *
 *   # Con prefijo completo también funciona:
 *   npm run cloudinary:inspect-folder -- atelier430/artworks/tmp-fe836d57
 *
 *   # Forzar borrado de los assets HUÉRFANOS (no toca los referenciados):
 *   npm run cloudinary:inspect-folder -- tmp-fe836d57 --force
 *
 *   # Combinar con --yes para no pedir confirmación al borrar:
 *   npm run cloudinary:inspect-folder -- tmp-fe836d57 --force --yes
 */

import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"
import readline from "node:readline"

const args = process.argv.slice(2)
const force = args.includes("--force")
const skipConfirm = args.includes("--yes")
const folderArg = args.find((a) => !a.startsWith("--"))

if (!folderArg) {
  console.error("Uso: npm run cloudinary:inspect-folder -- <carpeta> [--force] [--yes]")
  console.error("Ej.: npm run cloudinary:inspect-folder -- tmp-fe836d57")
  process.exit(1)
}

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

const BASE = "atelier430/artworks"

// Normaliza el path: acepta "tmp-XXX" o "atelier430/artworks/tmp-XXX".
const folderPath = folderArg.startsWith(BASE + "/")
  ? folderArg
  : `${BASE}/${folderArg.replace(/^\/+|\/+$/g, "")}`

// ─── Helpers Cloudinary ──────────────────────────────────────────────────

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

async function deleteFolder(path) {
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/folders/${path}`, {
    method: "DELETE",
    headers: { Authorization: basicAuth() },
  })
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

console.log(`\nInspeccionando carpeta: ${folderPath}\n`)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// Lista assets dentro de la carpeta y obtiene todas las referencias en BD
const [resources, dbRes] = await Promise.all([
  listResourcesInFolder(folderPath + "/"),
  supabase.from("artwork_images").select("cloudinary_public_id, artwork_id, artworks!inner(code)"),
])

if (dbRes.error) {
  console.error("Error leyendo BD:", dbRes.error.message)
  process.exit(1)
}

if (resources.length === 0) {
  console.log("La carpeta está vacía en Cloudinary (o no existe).\n")

  // Si la carpeta existe pero está vacía, intentamos limpiarla
  try {
    const r = await deleteFolder(folderPath)
    if (r === "deleted") console.log(`Carpeta ${folderPath} eliminada. ✓\n`)
  } catch {
    /* ignore */
  }
  process.exit(0)
}

const referenceMap = new Map()
for (const r of dbRes.data) {
  referenceMap.set(r.cloudinary_public_id, { artworkCode: r.artworks.code })
}

console.log(`Assets en Cloudinary  : ${resources.length}\n`)

const orphans = []
const referenced = []

for (const r of resources) {
  const ref = referenceMap.get(r.public_id)
  if (ref) {
    referenced.push({ ...r, ref })
    console.log(`  REFERENCIADO  ${r.public_id}`)
    console.log(`                → obra ${ref.artworkCode}`)
  } else {
    orphans.push(r)
    console.log(`  HUÉRFANO      ${r.public_id}  (${(r.bytes / 1024).toFixed(0)} KB)`)
  }
}

console.log("\n─── Resumen ───")
console.log(`  Referenciados : ${referenced.length}`)
console.log(`  Huérfanos     : ${orphans.length}`)

if (orphans.length === 0) {
  console.log("\nNada que borrar. ✓\n")
  process.exit(0)
}

if (!force) {
  console.log("\nPara borrar los huérfanos:")
  console.log(`  npm run cloudinary:inspect-folder -- ${folderArg} --force\n`)
  process.exit(0)
}

if (referenced.length > 0) {
  console.log(
    `\n⚠️  ATENCIÓN: ${referenced.length} asset(s) están referenciados en BD y NO se tocarán.`,
  )
  console.log(`   Se borrarán solo los ${orphans.length} marcados como HUÉRFANO.\n`)
}

if (!skipConfirm) {
  const ok = await confirm(`¿Borrar ${orphans.length} asset(s) huérfano(s)? (y/N) `)
  if (!ok) {
    console.log("Cancelado.\n")
    process.exit(0)
  }
}

console.log("\nBorrando...\n")
let okCount = 0
let failCount = 0
for (const r of orphans) {
  try {
    const result = await destroyAsset(r.public_id)
    console.log(`  ✓ ${r.public_id} (${result})`)
    okCount++
  } catch (e) {
    console.warn(`  ✗ ${r.public_id}: ${e.message}`)
    failCount++
  }
}

// Si la carpeta quedó vacía (sin referencias y todos los huérfanos borrados), purgarla
if (referenced.length === 0 && failCount === 0) {
  try {
    const r = await deleteFolder(folderPath)
    if (r === "deleted") console.log(`\nCarpeta ${folderPath} eliminada. ✓`)
  } catch {
    /* ignore */
  }
}

console.log(`\nListo. Borrados: ${okCount}.${failCount ? ` Fallaron: ${failCount}.` : ""}\n`)
