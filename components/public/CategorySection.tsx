import Image from "next/image"
import Link from "next/link"
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
  thumbnail: string | null
}

function CategoryCard({ category, count, thumbnail }: CategoryCardProps) {
  const meta = CATEGORY_META[category]

  return (
    <Link
      href={`/catalogo?categoria=${category}`}
      className="group relative overflow-hidden rounded-xl aspect-[4/5] block bg-stone-800"
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={meta.label}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />
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
  stats: Array<{ category: ArtworkCategory; count: number; thumbnail: string | null }>
}

export default function CategorySection({ stats }: CategorySectionProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="font-display text-2xl sm:text-3xl text-carbon-900 mb-8">Por categoría</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ category, count, thumbnail }) => (
          <CategoryCard
            key={category}
            category={category}
            count={count}
            thumbnail={thumbnail}
          />
        ))}
      </div>
    </section>
  )
}
