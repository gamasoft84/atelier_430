import {
  canonicalPublicId,
  isInCanonicalFolder,
  renameCloudinaryAsset,
} from "@/lib/cloudinary/admin"

export interface NormalizableImage {
  cloudinary_url: string
  cloudinary_public_id: string
}

export interface NormalizedImage {
  cloudinary_url: string
  cloudinary_public_id: string
  /** true si el rename realmente movió el asset; false si ya estaba bien o el rename falló */
  changed: boolean
}

/**
 * Mueve en Cloudinary cada imagen de la obra a su carpeta canónica
 * `atelier430/artworks/<code>/<code>-<sufijo>` cuando aún reside bajo `tmp-XXX`,
 * `IMP-XXX` o cualquier otra ruta no canónica.
 *
 * Estrategia tolerante a fallos:
 *   - Si el rename falla (red, conflicto de nombre, etc.), conserva el asset
 *     original y devuelve la URL vieja con `changed: false`. La obra sigue
 *     funcionando aunque la carpeta no esté limpia.
 *   - Nunca lanza: cualquier error se loggea y se sigue con la siguiente imagen.
 *
 * Llamar SIEMPRE después de haber commiteado las imágenes a BD con sus URLs
 * actuales. Si alguna se renombró, hay que actualizar `artwork_images` con la
 * nueva URL/public_id (este helper sólo realiza el rename en Cloudinary; el
 * caller decide cómo persistir el cambio).
 */
export async function normalizeImagesForCode(
  images: NormalizableImage[],
  code: string,
): Promise<NormalizedImage[]> {
  return Promise.all(
    images.map(async (img) => {
      if (isInCanonicalFolder(img.cloudinary_public_id, code)) {
        return { ...img, changed: false }
      }

      const newPublicId = canonicalPublicId(img.cloudinary_public_id, code)
      try {
        const renamed = await renameCloudinaryAsset(img.cloudinary_public_id, newPublicId)
        return {
          cloudinary_url: renamed.secure_url,
          cloudinary_public_id: renamed.public_id,
          changed: true,
        }
      } catch (err) {
        console.warn(
          `[cloudinary] No se pudo renombrar ${img.cloudinary_public_id} → ${newPublicId}:`,
          err instanceof Error ? err.message : err,
        )
        return { ...img, changed: false }
      }
    }),
  )
}
