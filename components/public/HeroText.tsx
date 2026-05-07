"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const base = { opacity: 0, y: 18 }
const show = (delay: number) => ({
  opacity: 1,
  y: 0,
  transition: { duration: 0.55, delay },
})

export default function HeroText() {
  return (
    <>
      <motion.h1
        className="font-display text-4xl sm:text-5xl lg:text-6xl text-carbon-900 leading-tight"
        initial={base}
        animate={show(0)}
      >
        Arte curado,
        <br />
        <span className="text-gold-500">listo para tu hogar</span>
      </motion.h1>

      <motion.p
        className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-lg"
        initial={base}
        animate={show(0.12)}
      >
        Piezas seleccionadas de paisajes nacionales, arte religioso,
        reproducciones europeas y arte moderno. Todas listas para colgar.
      </motion.p>

      <motion.div initial={base} animate={show(0.24)}>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-500 text-white font-semibold text-sm hover:bg-gold-400 transition-colors"
        >
          Ver catálogo
        </Link>
      </motion.div>
    </>
  )
}
