#!/usr/bin/env node
/**
 * Borra de Cloudinary los assets que NO están referenciados por ninguna fila
 * de `artwork_images`. Estas imágenes son huérfanas — típicamente provienen de:
 *
 *   - Sesiones del form admin "Nueva obra" que el usuario abandonó.
 *   - Imágenes IMP-* del flujo de foto-import abortado a mitad.
 *   - Restos de migraciones previas.
 *
 * El script:
 *   1. Lista TODOS los assets bajo `atelier430/artworks/` (paginado).
 *   2. Lee todos los `cloudinary_public_id` de `artwork_images`.
 *   3. Marca como huérfanos los assets de Cloudinary que no aparecen en BD.
 *   4. Imprime el listado y pide confirmación (a menos que pase --yes o --dry).
 *   5. Borra los huérfanos uno por uno.
 *
 * Requiere en `.env`:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *
 * Uso:
 *   npm run cloudinary:cleanup            # interactivo
 *   npm run cloudinary:cleanup -- --dry   # solo lista, no borra
 *   npm run cloudinary:cleanup -- --yes   # borra sin pedir confirmación
 *
 * IMPORTANTE: este script NO borra carpetas vacías; sólo assets. Cloudinary
 * limpia carpetas vacías en background, o pueden eliminarse a mano desde el panel.
 */

import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"
import readline from "node:readline"

const dryRun = process.argv.includes("--dry")
const skipConfirm = process.argv.includes("--yes")

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

const PREFIX = "atelier430/artworks/"

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

async function listAllResources() {
  const out = []
  let cursor

  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`)
    url.searchParams.set("type", "upload")
    url.searchParams.set("prefix", PREFIX)
    url.searchParams.set("max_results", "500")
    if (cursor) url.searchParams.set("next_cursor", cursor)

    const res = await fetch(url.toString(), { headers: { Authorization: basicAuth() } })
    if (!res.ok) {
      throw new Error(`Admin API ${res.status}: ${await res.text()}`)
    }
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
    throw new Error(`destroy failed: ${data.result}`)
  }
  return data.result
}

// ─── Confirmación interactiva ────────────────────────────────────────────

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (ans) => {
      rl.close()
      resolve(ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes")
    })
  })
}

// ─── Main ────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

console.log(`\n${dryRun ? "[DRY-RUN] " : ""}Buscando huérfanas en Cloudinary...\n`)

const [resources, dbRes] = await Promise.all([
  listAllResources(),
  supabase.from("artwork_images").select("cloudinary_public_id"),
])

if (dbRes.error) {
  console.error("Error leyendo BD:", dbRes.error.message)
  process.exit(1)
}

const referenced = new Set(dbRes.data.map((r) => r.cloudinary_public_id))
const orphans = resources.filter((r) => !referenced.has(r.public_id))

console.log(`Cloudinary    : ${resources.length} assets bajo ${PREFIX}`)
console.log(`Supabase      : ${referenced.size} referencias en artwork_images`)
console.log(`Huérfanas     : ${orphans.length}\n`)

if (orphans.length === 0) {
  console.log("Nada que limpiar. ✓\n")
  process.exit(0)
}

// Agrupar por carpeta para output más legible
const byFolder = new Map()
for (const r of orphans) {
  const folder = r.public_id.split("/").slice(0, -1).join("/")
  if (!byFolder.has(folder)) byFolder.set(folder, [])
  byFolder.get(folder).push(r)
}

let totalBytes = 0
for (const [folder, items] of byFolder) {
  const bytes = items.reduce((sum, r) => sum + (r.bytes ?? 0), 0)
  totalBytes += bytes
  console.log(`  ${folder}  (${items.length} ${items.length === 1 ? "asset" : "assets"}, ${(bytes / 1024).toFixed(0)} KB)`)
  for (const r of items) console.log(`    · ${r.public_id.split("/").pop()}`)
}
console.log(`\nTotal a liberar: ${(totalBytes / 1024 / 1024).toFixed(2)} MB\n`)

if (dryRun) {
  console.log("Dry-run. No se borró nada. Quita --dry para ejecutar.\n")
  process.exit(0)
}

if (!skipConfirm) {
  const ok = await confirm(`¿Borrar ${orphans.length} assets huérfanos? (y/N) `)
  if (!ok) {
    console.log("Cancelado.\n")
    process.exit(0)
  }
}

console.log("\nBorrando...\n")
let ok = 0
let fail = 0
for (const r of orphans) {
  try {
    const result = await destroyAsset(r.public_id)
    console.log(`  ✓ ${r.public_id} (${result})`)
    ok++
  } catch (e) {
    console.warn(`  ✗ ${r.public_id}: ${e.message}`)
    fail++
  }
}

console.log(`\nListo. Borrados: ${ok}.${fail ? ` Fallaron: ${fail}.` : ""}\n`)
