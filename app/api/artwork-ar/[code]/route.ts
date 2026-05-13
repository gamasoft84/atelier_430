import { NextResponse } from "next/server"
import { buildPosterGlbBuffer } from "@/lib/ar/build-poster-glb"
import { cloudinaryUrlForArTexture } from "@/lib/cloudinary/transform"
import { getArtworkByCodeAnon } from "@/lib/supabase/queries/public"
import type { ArtworkPublic } from "@/types/artwork"

export const runtime = "nodejs"

/**
 * Dimensiones físicas del plano AR en cm (se pasan a metros tal cual; ancho = X, alto = Y en muro).
 * - Si hay marco y existen medidas exteriores (`frame_outer_*`), usamos esas: la primary suele
 *   mostrar la pieza enmarcada y el tamaño en sala debe coincidir con el contorno visible.
 * - Si no, usamos `width_cm` / `height_cm` (obra / lienzo según lo capturado en admin como “Ancho/Alto”).
 */
function pickPhysicalDimensionsCm(artwork: ArtworkPublic): {
  widthCm: number
  heightCm: number
} | null {
  const innerOk =
    typeof artwork.width_cm === "number" &&
    typeof artwork.height_cm === "number" &&
    artwork.width_cm > 0 &&
    artwork.height_cm > 0

  const outerOk =
    artwork.has_frame &&
    typeof artwork.frame_outer_width_cm === "number" &&
    typeof artwork.frame_outer_height_cm === "number" &&
    artwork.frame_outer_width_cm > 0 &&
    artwork.frame_outer_height_cm > 0

  if (outerOk) {
    return {
      widthCm: artwork.frame_outer_width_cm ?? 0,
      heightCm: artwork.frame_outer_height_cm ?? 0,
    }
  }
  if (innerOk) {
    return {
      widthCm: artwork.width_cm ?? 0,
      heightCm: artwork.height_cm ?? 0,
    }
  }
  return null
}

function normalizeImageMime(headerMime: string | null, url: string): string {
  const h = headerMime?.split(";")[0]?.trim().toLowerCase()
  if (h && h.startsWith("image/")) return h
  const path = url.split("?")[0]?.toLowerCase() ?? ""
  if (path.endsWith(".png")) return "image/png"
  if (path.endsWith(".webp")) return "image/webp"
  if (path.endsWith(".gif")) return "image/gif"
  return "image/jpeg"
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params
  const artwork = await getArtworkByCodeAnon(code)

  if (!artwork) {
    return NextResponse.json(
      {
        error: "No hay obra con ese código, está oculta o el entorno apunta a otra base de datos.",
        reason: "artwork_not_found",
        code,
      },
      { status: 404 }
    )
  }

  if (!artwork.images?.length) {
    return NextResponse.json(
      {
        error: "La obra existe pero no tiene imágenes en artwork_images (sube fotos en el admin).",
        reason: "no_images",
        code: artwork.code,
      },
      { status: 404 }
    )
  }

  const sorted = [...artwork.images].sort((a, b) => a.position - b.position)
  const primary =
    sorted.find((i) => i.is_primary) ?? sorted[0]

  const imageUri = cloudinaryUrlForArTexture(primary.cloudinary_url)

  let widthM: number
  let heightM: number

  const physical = pickPhysicalDimensionsCm(artwork)

  if (physical) {
    // Usar siempre ancho/alto tal como están en BD (ancho = eje X en muro, alto = eje Y).
    // No inferir swap desde la orientación del archivo de imagen: una pieza vertical (p. ej. 88×108 cm)
    // suele fotografiarse en horizontal y el aspect ratio de la foto no coincide con el objeto físico;
    // intercambiar por foto invertía altura y ancho en AR (bug reportado con obras verticales).
    widthM = physical.widthCm / 100
    heightM = physical.heightCm / 100
  } else if (primary.width && primary.height && primary.height > 0) {
    const aspect = primary.width / primary.height
    heightM = 0.9
    widthM = heightM * aspect
  } else {
    heightM = 0.9
    widthM = heightM * (3 / 4)
  }

  const imgRes = await fetch(imageUri, {
    headers: { Accept: "image/*" },
    next: { revalidate: 3600 },
  })

  if (!imgRes.ok) {
    return NextResponse.json(
      { error: "No se pudo descargar la imagen para el modelo 3D" },
      { status: 502 }
    )
  }

  const imageBytes = Buffer.from(await imgRes.arrayBuffer())
  const imageMimeType = normalizeImageMime(imgRes.headers.get("content-type"), imageUri)

  const glb = buildPosterGlbBuffer({
    widthMeters: widthM,
    heightMeters: heightM,
    imageBytes,
    imageMimeType,
  })

  return new NextResponse(new Uint8Array(glb), {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
