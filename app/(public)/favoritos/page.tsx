import type { Metadata } from "next"
import FavoritosPageClient from "@/components/public/favoritos/FavoritosPageClient"
import { getShowPrices, getPreferPremiumInCatalog } from "@/lib/supabase/queries/public"
import { getWishlistArtworksForSession } from "@/lib/supabase/queries/wishlist"

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Obras guardadas en tu selección Atelier 430",
}

const LIST_PARAM_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function FavoritosPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>
}) {
  const { list } = await searchParams
  const sharedSessionId =
    typeof list === "string" && LIST_PARAM_UUID.test(list) ? list : null

  const [showPrices, sharedArtworks, preferPremium] = await Promise.all([
    getShowPrices(),
    sharedSessionId ? getWishlistArtworksForSession(sharedSessionId) : Promise.resolve(null),
    getPreferPremiumInCatalog(),
  ])

  return (
    <FavoritosPageClient
      showPrices={showPrices}
      sharedSessionId={sharedSessionId}
      sharedArtworks={sharedArtworks}
      preferPremium={preferPremium}
    />
  )
}
