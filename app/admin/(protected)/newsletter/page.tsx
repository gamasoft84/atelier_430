import type { Metadata } from "next"

export const metadata: Metadata = { title: "Newsletter" }

export default function NewsletterPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-carbon-900 mb-2">Newsletter</h1>
      <p className="text-stone-500 text-sm">
        Suscriptores y campañas — se implementa en Fase 7.
      </p>
    </div>
  )
}
