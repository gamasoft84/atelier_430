"use client"

import WishlistHeartButton from "@/components/public/WishlistHeartButton"

export default function ArtworkWishlistButton({ artworkId }: { artworkId: string }) {
  return (
    <WishlistHeartButton artworkId={artworkId} size="md" className="shrink-0 mt-1 shadow-md" />
  )
}
