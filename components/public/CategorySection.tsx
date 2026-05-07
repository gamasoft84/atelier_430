"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import type { ArtworkCategory } from "@/types/artwork"

const CATEGORY_META: Record<ArtworkCategory, { label: string; description: string; color: string }> = {
  religiosa: {
    label: "Religiosa",
    description: "Íconos sacros e impresiones devocionas",
    color: "from-red-950/60",
  },
  nacional: {
    label: "Nacional",
    description: "Paisajes mexicanos al óleo",
    color: "from-green-950/60",
  },
  europea: {
    label: "Europea",
    description: "Reproducciones clásicas al óleo",
    color: "from-blue-950/60",
  },
  moderna: {
    label: "Moderna",
    description: "Arte contemporáneo y abstracto",
    color: "from-purple-950/60",
  },
}

interface CategoryCardProps {
  category: ArtworkCategory
  count: number
  thumbnail: { url: string; width: number | null; height: number | null } | null
}

function CategoryCard({ category, count, thumbnail }: CategoryCardProps) {
  const meta = CATEGORY_META[category]
  const isHorizontal =
    typeof thumbnail?.width === "number" &&
    typeof thumbnail?.height === "number" &&
    thumbnail.height > 0 &&
    thumbnail.width > thumbnail.height

  return (
    <Link
      href={`/catalogo?categoria=${category}`}
      className={[
        "group relative overflow-hidden rounded-xl block",
        isHorizontal ? "aspect-[4/3]" : "aspect-[3/4]",
      ].join(" ")}
    >
      {thumbnail ? (
        <div className="relative h-full w-full">
          <Image
            src={thumbnail.url}
            alt={meta.label}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover scale-[0.98] transition-transform duration-500 group-hover:scale-100"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-stone-200" />
      )}

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${meta.color} to-transparent`} />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-display text-lg text-white leading-tight">{meta.label}</p>
        <p className="text-xs text-white/70 mt-0.5">{count > 0 ? `${count} obras` : "Próximamente"}</p>
      </div>
    </Link>
  )
}

interface CategorySectionProps {
  stats: Array<{
    category: ArtworkCategory
    count: number
    thumbnail: { url: string; width: number | null; height: number | null } | null
  }>
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function CategorySection({ stats }: CategorySectionProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.h2
        className="font-display text-2xl sm:text-3xl text-carbon-900 mb-8"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        Por categoría
      </motion.h2>
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {stats.map(({ category, count, thumbnail }) => (
          <motion.div key={category} variants={cardVariant}>
            <CategoryCard
              category={category}
              count={count}
              thumbnail={thumbnail}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
