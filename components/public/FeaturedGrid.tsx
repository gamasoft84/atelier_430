"use client"

import { motion, type Variants } from "framer-motion"
import ArtworkCard from "@/components/public/ArtworkCard"
import type { ArtworkPublic } from "@/types/artwork"

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

interface FeaturedGridProps {
  artworks: ArtworkPublic[]
  showPrices: boolean
}

export default function FeaturedGrid({ artworks, showPrices }: FeaturedGridProps) {
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {artworks.map((artwork, i) => (
        <motion.div key={artwork.id} variants={card}>
          <ArtworkCard artwork={artwork} showPrice={showPrices} priority={i < 4} />
        </motion.div>
      ))}
    </motion.div>
  )
}
