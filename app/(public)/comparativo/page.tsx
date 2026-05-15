import type { Metadata } from "next"
import ComparativoPicker from "@/components/comparativo/ComparativoPicker"
import ComparativoView from "@/components/comparativo/ComparativoView"
import { parseComparativoCodesParam } from "@/lib/comparativo/parse-codes"
import { prepareComparativoItems } from "@/lib/comparativo/prepare-items"
import {
  getComparativoArtworksByCodes,
  getComparativoEditorialCopy,
} from "@/lib/supabase/queries/comparativo"
import { getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"
import { SITE_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Comparativo editorial · ${SITE_NAME}`,
  description:
    "Compara de 3 a 5 obras a escala real con medidas de lienzo y marco. Ideal para presentaciones y WhatsApp.",
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<{ obras?: string }>
}

export default async function ComparativoPublicPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const parsed = parseComparativoCodesParam(sp.obras)

  if (!parsed.ok) {
    const hint =
      parsed.error === "empty"
        ? "Elige entre 3 y 5 obras del catálogo para compararlas a escala real."
        : parsed.error === "count"
          ? "La URL debe incluir entre 3 y 5 códigos. Puedes volver a elegir las obras abajo."
          : "Algunos códigos en la URL no son válidos. Elige de nuevo en el selector."

    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl text-carbon-900 sm:text-3xl">Comparativo editorial</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">{hint}</p>
        <div className="mt-8">
          <ComparativoPicker variant="public" />
        </div>
      </div>
    )
  }

  const [copy, preferPremium, artworks] = await Promise.all([
    getComparativoEditorialCopy(),
    getPreferPremiumInCatalog(),
    getComparativoArtworksByCodes(parsed.codes),
  ])

  const items = prepareComparativoItems(artworks, preferPremium)

  if (items.length < 3) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl text-carbon-900 sm:text-3xl">Comparativo editorial</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          No hay al menos 3 obras disponibles con imagen y medidas para los códigos solicitados.
          Verifica que estén publicadas, con ancho/alto en cm y foto en Cloudinary.
        </p>
        <p className="mt-2 font-mono text-xs text-stone-500">{parsed.codes.join(", ")}</p>
        <div className="mt-8">
          <ComparativoPicker variant="public" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full px-4 py-10 sm:px-6 lg:px-8">
      <ComparativoView
        items={items}
        copy={copy}
        codes={parsed.codes}
        backHref="/catalogo"
        backLabel="Catálogo"
      />
    </div>
  )
}
