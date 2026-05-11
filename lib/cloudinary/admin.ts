import { createHash } from "crypto"

/**
 * Helpers server-side para administrar assets en Cloudinary (rename, destroy,
 * listar). Todo usa la REST API directa para no depender del SDK oficial.
 *
 * Las firmas siguen el algoritmo de Cloudinary:
 *   sha1(<params_alfabeticos_join_&> + API_SECRET)
 *
 * El prefijo de carpetas del proyecto es `atelier430/artworks/<código>`.
 */

interface CloudinaryEnv {
  cloudName: string
  apiKey: string
  apiSecret: string
}

function readEnv(): CloudinaryEnv {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan envs de Cloudinary: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET",
    )
  }
  return { cloudName, apiKey, apiSecret }
}

function signParams(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&")
  return createHash("sha1").update(toSign + secret).digest("hex")
}

function basicAuth(env: CloudinaryEnv): string {
  return "Basic " + Buffer.from(`${env.apiKey}:${env.apiSecret}`).toString("base64")
}

// ─── Rename ──────────────────────────────────────────────────────────────

export interface RenameResult {
  public_id: string
  secure_url: string
  width: number
  height: number
}

/**
 * Mueve un asset de un public_id a otro. Soporta cambio de carpeta (la carpeta
 * destino se crea automáticamente si no existe).
 *
 * Idempotente parcial: si el destino ya existe, retorna error a menos que
 * `overwrite=true`. Por defecto NO sobrescribe para evitar pérdidas.
 */
export async function renameCloudinaryAsset(
  fromPublicId: string,
  toPublicId: string,
  options: { overwrite?: boolean; invalidate?: boolean } = {},
): Promise<RenameResult> {
  const env = readEnv()
  const timestamp = Math.round(Date.now() / 1000)

  const params: Record<string, string | number> = {
    from_public_id: fromPublicId,
    to_public_id: toPublicId,
    timestamp,
  }
  if (options.overwrite) params.overwrite = "true"
  if (options.invalidate) params.invalidate = "true"

  const signature = signParams(params, env.apiSecret)

  const form = new FormData()
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append("api_key", env.apiKey)
  form.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/image/rename`, {
    method: "POST",
    body: form,
  })

  const data = (await res.json()) as Partial<RenameResult> & { error?: { message: string } }

  if (!res.ok || data.error) {
    throw new Error(`Cloudinary rename falló: ${data.error?.message ?? `HTTP ${res.status}`}`)
  }

  if (!data.public_id || !data.secure_url || data.width == null || data.height == null) {
    throw new Error("Cloudinary rename: respuesta incompleta")
  }

  return {
    public_id: data.public_id,
    secure_url: data.secure_url,
    width: data.width,
    height: data.height,
  }
}

// ─── Destroy ─────────────────────────────────────────────────────────────

export async function destroyCloudinaryAsset(publicId: string): Promise<"ok" | "not found"> {
  const env = readEnv()
  const timestamp = Math.round(Date.now() / 1000)
  const signature = signParams({ public_id: publicId, timestamp }, env.apiSecret)

  const form = new FormData()
  form.append("public_id", publicId)
  form.append("api_key", env.apiKey)
  form.append("timestamp", String(timestamp))
  form.append("signature", signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  })
  const data = (await res.json()) as { result: string }
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error(`Cloudinary destroy falló: ${data.result}`)
  }
  return data.result as "ok" | "not found"
}

// ─── List (Admin API) ────────────────────────────────────────────────────

export interface CloudinaryResource {
  public_id: string
  secure_url: string
  width: number
  height: number
  bytes: number
  created_at: string
  folder?: string
}

/**
 * Lista assets con un prefijo de public_id (paginado). Usa la Admin API.
 * Devuelve hasta `maxPerPage` por página; sigue paginando con `next_cursor`.
 */
export async function listCloudinaryResources(
  prefix: string,
  options: { maxPerPage?: number } = {},
): Promise<CloudinaryResource[]> {
  const env = readEnv()
  const out: CloudinaryResource[] = []
  let cursor: string | undefined

  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${env.cloudName}/resources/image`)
    url.searchParams.set("type", "upload")
    url.searchParams.set("prefix", prefix)
    url.searchParams.set("max_results", String(options.maxPerPage ?? 500))
    if (cursor) url.searchParams.set("next_cursor", cursor)

    const res = await fetch(url.toString(), {
      headers: { Authorization: basicAuth(env) },
    })
    if (!res.ok) {
      throw new Error(`Cloudinary list (${res.status}): ${await res.text()}`)
    }
    const data = (await res.json()) as {
      resources: CloudinaryResource[]
      next_cursor?: string
    }
    out.push(...data.resources)
    cursor = data.next_cursor
  } while (cursor)

  return out
}

// ─── Folders (Admin API) ─────────────────────────────────────────────────

export interface CloudinaryFolder {
  name: string
  path: string
}

/** Lista las subcarpetas inmediatas de un path (no recursivo). */
export async function listCloudinarySubfolders(folderPath: string): Promise<CloudinaryFolder[]> {
  const env = readEnv()
  const url = `https://api.cloudinary.com/v1_1/${env.cloudName}/folders/${folderPath}`
  const res = await fetch(url, { headers: { Authorization: basicAuth(env) } })
  if (!res.ok) {
    throw new Error(`Cloudinary list folders (${res.status}): ${await res.text()}`)
  }
  const data = (await res.json()) as { folders: CloudinaryFolder[] }
  return data.folders
}

/**
 * Borra una carpeta. Cloudinary rechaza con 400 si la carpeta no está vacía.
 * Devuelve true si se borró, false si tenía contenido.
 */
export async function deleteCloudinaryFolder(folderPath: string): Promise<boolean> {
  const env = readEnv()
  const url = `https://api.cloudinary.com/v1_1/${env.cloudName}/folders/${folderPath}`
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: basicAuth(env) },
  })
  if (res.status === 200) return true
  if (res.status === 400) return false // tipicamente "Folder is not empty"
  throw new Error(`Cloudinary delete folder (${res.status}): ${await res.text()}`)
}

// ─── Helpers de path ─────────────────────────────────────────────────────

const FOLDER_PREFIX = "atelier430/artworks"

/**
 * Determina si un public_id ya pertenece a la carpeta del código real de la obra.
 * @example
 *   isInCanonicalFolder("atelier430/artworks/N-011/N-011-abc", "N-011") // true
 *   isInCanonicalFolder("atelier430/artworks/tmp-XXX/tmp-XXX-1", "N-011") // false
 */
export function isInCanonicalFolder(publicId: string, code: string): boolean {
  return publicId.startsWith(`${FOLDER_PREFIX}/${code}/`)
}

/**
 * Construye el public_id canónico al renombrar de tmp/IMP a la carpeta del
 * código real, conservando el sufijo aleatorio del archivo original.
 *
 * @example
 *   canonicalPublicId("atelier430/artworks/tmp-abc12345/tmp-abc12345-9f0a1b2c", "N-012")
 *   // → "atelier430/artworks/N-012/N-012-9f0a1b2c"
 *
 *   canonicalPublicId("atelier430/artworks/IMP-1234-ab/IMP-1234-ab-0", "N-012")
 *   // → "atelier430/artworks/N-012/N-012-0"
 */
export function canonicalPublicId(currentPublicId: string, code: string): string {
  const fileName = currentPublicId.split("/").pop() ?? currentPublicId
  // Reemplaza el prefijo del archivo (lo que va antes del último "-") por el código.
  // Si no hay "-" deja el archivo tal cual.
  const lastDash = fileName.lastIndexOf("-")
  const suffix = lastDash >= 0 ? fileName.slice(lastDash + 1) : fileName
  return `${FOLDER_PREFIX}/${code}/${code}-${suffix}`
}
