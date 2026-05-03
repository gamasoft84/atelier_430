import { NextResponse } from "next/server"
import { buildPosterGlbBuffer } from "@/lib/ar/build-poster-glb"
import { cloudinaryUrlForArTexture } from "@/lib/cloudinary/transform"
import { getArtworkByCodeAnon } from "@/lib/supabase/queries/public"

export const runtime = "nodejs"

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

  if (artwork.width_cm && artwork.height_cm) {
    widthM = artwork.width_cm / 100
    heightM = artwork.height_cm / 100
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
