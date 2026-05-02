import Link from "next/link"
import PublicHeader from "@/components/public/PublicHeader"
import PublicFooter from "@/components/public/PublicFooter"
import WhatsAppFloat from "@/components/public/WhatsAppFloat"

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm">
          <p className="font-display text-6xl text-stone-200 select-none">404</p>
          <h1 className="font-display text-2xl text-carbon-900">
            Esta página no existe
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Es posible que la obra haya sido vendida o que el enlace sea incorrecto.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/catalogo"
              className="px-5 py-2.5 rounded-lg bg-gold-500 text-white text-sm font-semibold hover:bg-gold-400 transition-colors"
            >
              Ver catálogo
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
      <WhatsAppFloat />
    </div>
  )
}
