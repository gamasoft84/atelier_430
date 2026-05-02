import Link from "next/link"
import { WHATSAPP_NUMBER } from "@/lib/constants"

export default function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-carbon-900 text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <p className="font-display text-lg text-cream">Atelier 430</p>
            <p className="text-sm text-stone-400 leading-relaxed">
              430 piezas únicas. Arte curado, listo para tu hogar.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Contacto</p>
            {WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-stone-300 hover:text-cream transition-colors"
              >
                WhatsApp
              </a>
            )}
            <a
              href="mailto:contacto@atelier430.com"
              className="flex items-center gap-2 text-sm text-stone-300 hover:text-cream transition-colors"
            >
              contacto@atelier430.com
            </a>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Síguenos</p>
            <a
              href="#"
              className="block text-sm text-stone-300 hover:text-cream transition-colors"
            >
              Instagram
            </a>
            <a
              href="#"
              className="block text-sm text-stone-300 hover:text-cream transition-colors"
            >
              Facebook
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-carbon-700">
          <p className="text-xs text-stone-500 text-center">
            © {year} Atelier 430. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
