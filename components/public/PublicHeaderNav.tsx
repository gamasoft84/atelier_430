import Link from "next/link"
import PublicHeaderNavFavoritos from "@/components/public/PublicHeaderNavFavoritos"

const linkClass =
  "py-2 px-1 text-sm font-medium text-stone-600 hover:text-carbon-900 transition-colors"

export default function PublicHeaderNav() {
  return (
    <nav className="flex items-center gap-5 sm:gap-6">
      <Link href="/catalogo" className={linkClass}>
        Catálogo
      </Link>
      <Link href="/escala-coleccion" className={linkClass}>
        Escala
      </Link>
      <PublicHeaderNavFavoritos />
    </nav>
  )
}
