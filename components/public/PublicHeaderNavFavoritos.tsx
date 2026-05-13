"use client"

import Link from "next/link"
import { useWishlist } from "@/components/public/WishlistProvider"

export default function PublicHeaderNavFavoritos() {
  const { count, ready } = useWishlist()

  return (
    <Link
      href="/favoritos"
      className="py-2 px-1 text-sm font-medium text-stone-600 hover:text-carbon-900 transition-colors inline-flex items-center gap-1.5"
    >
      Favoritos
      {ready && count > 0 ? (
        <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-gold-500 text-[10px] font-semibold text-white flex items-center justify-center tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  )
}
