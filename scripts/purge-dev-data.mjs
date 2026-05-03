#!/usr/bin/env node
/**
 * Purga datos de desarrollo/prueba: registros en Supabase y archivos en Cloudinary.
 *
 * Requisitos:
 * - Variables en .env (o pasarlas al proceso): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Uso:
 *   node --env-file=.env scripts/purge-dev-data.mjs --dry-run
 *   node --env-file=.env scripts/purge-dev-data.mjs --confirm
 *
 * Opciones:
 *   --confirm          Ejecuta borrado real (obligatorio sin --dry-run)
 *   --dry-run          Solo muestra conteos; no borra nada
 *   --skip-cloudinary  Solo vacía tablas (no llama a Cloudinary)
 *   --skip-database    Solo borra en Cloudinary según artwork_images (no toca tablas)
 *   --keep-site-settings  No borra ni modifica site_settings (teléfono, hero, etc.)
 *
 * Orden DB: respeta FKs (inquiries → artworks; imágenes/wishlist tienen ON DELETE CASCADE desde artworks).
 */

import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const ZERO_UUID = "00000000-0000-0000-0000-000000000000"

function parseArgs(argv) {
  return {
    confirm: argv.includes("--confirm"),
    dryRun: argv.includes("--dry-run"),
    skipCloudinary: argv.includes("--skip-cloudinary"),
    skipDatabase: argv.includes("--skip-database"),
    keepSiteSettings: argv.includes("--keep-site-settings"),
  }
}

function assertEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  const missing = []
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")
  if (!process.argv.includes("--skip-cloudinary")) {
    if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME")
    if (!apiKey) missing.push("CLOUDINARY_API_KEY")
    if (!apiSecret) missing.push("CLOUDINARY_API_SECRET")
  }

  if (missing.length) {
    console.error("Faltan variables de entorno:", missing.join(", "))
    process.exit(1)
  }

  return { url, serviceKey, cloudName, apiKey, apiSecret }
}

/**
 * Misma firma que app/api/upload/route.ts (destroy por public_id).
 */
async function destroyCloudinaryImage(cloudName, apiKey, apiSecret, publicId) {
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = createHash("sha1").update(paramsToSign + apiSecret).digest("hex")

  const form = new FormData()
  form.append("public_id", publicId)
  form.append("signature", signature)
  form.append("api_key", apiKey)
  form.append("timestamp", String(timestamp))

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  })

  const data = await res.json()
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error(`Cloudinary destroy falló para ${publicId}: ${JSON.stringify(data)}`)
  }
}

async function deleteAllFromTable(supabase, table, idColumn = "id") {
  const { error } = await supabase.from(table).delete().neq(idColumn, ZERO_UUID)
  if (error) throw new Error(`${table}: ${error.message}`)
}

/** Defaults alineados con supabase/migrations/001_initial_schema.sql */
const SITE_SETTINGS_SEED = [
  { key: "show_prices_globally", value: { enabled: true } },
  { key: "total_inventory", value: { count: 430 } },
  { key: "contact_whatsapp", value: { phone: "+52XXXXXXXXXX" } },
  {
    key: "hero_message",
    value: {
      title: "430 piezas. Una sola colección.",
      subtitle: "Arte curado, listo para tu hogar",
    },
  },
]

async function main() {
  const opts = parseArgs(process.argv)

  if (!opts.dryRun && !opts.confirm) {
    console.error(
      "Indica --dry-run para simular, o --confirm para ejecutar el borrado real."
    )
    process.exit(1)
  }

  if (opts.skipCloudinary && opts.skipDatabase) {
    console.error("--skip-cloudinary y --skip-database juntos no hacen nada útil.")
    process.exit(1)
  }

  const env = assertEnv()
  const supabase = createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: imageRows, error: imgErr } = await supabase
    .from("artwork_images")
    .select("cloudinary_public_id")

  if (imgErr) throw new Error(`artwork_images: ${imgErr.message}`)

  const publicIds = [...new Set((imageRows ?? []).map((r) => r.cloudinary_public_id).filter(Boolean))]

  const counts = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase.from("artworks").select("id", { count: "exact", head: true }),
    supabase.from("artwork_images").select("id", { count: "exact", head: true }),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
    supabase.from("import_jobs").select("id", { count: "exact", head: true }),
    supabase.from("admin_activity").select("id", { count: "exact", head: true }),
    supabase.from("site_settings").select("key", { count: "exact", head: true }),
  ])

  const labels = [
    "inquiries",
    "artworks",
    "artwork_images",
    "wishlist_items",
    "newsletter_subscribers",
    "import_jobs",
    "admin_activity",
    "site_settings",
  ]

  console.log(opts.dryRun ? "[dry-run] Conteos actuales:" : "Conteos actuales:")
  labels.forEach((label, i) => {
    const c = counts[i].count ?? "?"
    console.log(`  ${label}: ${c}`)
  })
  console.log(`  Cloudinary (public_ids únicos desde artwork_images): ${publicIds.length}`)

  if (opts.dryRun) {
    console.log("\n[dry-run] No se borró nada. Quita --dry-run y usa --confirm para ejecutar.")
    return
  }

  if (!opts.skipCloudinary) {
    console.log("\nEliminando en Cloudinary...")
    let ok = 0
    for (const pid of publicIds) {
      await destroyCloudinaryImage(env.cloudName, env.apiKey, env.apiSecret, pid)
      ok += 1
      if (ok % 25 === 0) console.log(`  … ${ok}/${publicIds.length}`)
    }
    console.log(`Cloudinary: ${ok} destroy(s) (ok o not found).`)
  }

  if (!opts.skipDatabase) {
    console.log("\nVaciando tablas en Supabase…")

    await deleteAllFromTable(supabase, "inquiries")
    await deleteAllFromTable(supabase, "newsletter_subscribers")
    await deleteAllFromTable(supabase, "import_jobs")
    await deleteAllFromTable(supabase, "admin_activity")

    const { error: artErr } = await supabase.from("artworks").delete().neq("id", ZERO_UUID)
    if (artErr) throw new Error(`artworks: ${artErr.message}`)

    if (!opts.keepSiteSettings) {
      const { error: settingsErr } = await supabase.from("site_settings").delete().neq("key", "")
      if (settingsErr) throw new Error(`site_settings: ${settingsErr.message}`)
      const { error: seedErr } = await supabase.from("site_settings").insert(SITE_SETTINGS_SEED)
      if (seedErr) throw new Error(`site_settings seed: ${seedErr.message}`)
      console.log("site_settings: vaciado y repoblado con valores por defecto (migration inicial).")
    } else {
      console.log("site_settings: sin cambios (--keep-site-settings).")
    }

    console.log("Base de datos: tablas de aplicación vaciadas.")
  }

  console.log("\nListo.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
