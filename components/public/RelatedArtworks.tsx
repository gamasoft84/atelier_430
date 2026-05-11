import ArtworkCard from "@/components/public/ArtworkCard"
import type { ArtworkPublic } from "@/types/artwork"

interface RelatedArtworksProps {
  artworks: ArtworkPublic[]
  showPrice: boolean
  preferPremium?: boolean
}

export default function RelatedArtworks({
  artworks,
  showPrice,
  preferPremium = false,
}: RelatedArtworksProps) {
  if (artworks.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-stone-100">
      <h2 className="font-display text-2xl text-carbon-900 mb-6">Obras relacionadas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {artworks.map((artwork) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            showPrice={showPrice}
            preferPremium={preferPremium}
          />
        ))}
      </div>
    </section>
  )
}
