import { cn } from "@/lib/utils"

interface ArtworkDescriptionProps {
  text: string
  className?: string
}

/** Respeta saltos de línea del textarea (\\n) en pantalla. */
export default function ArtworkDescription({ text, className }: ArtworkDescriptionProps) {
  return (
    <p className={cn("text-sm text-stone-600 leading-relaxed whitespace-pre-line", className)}>
      {text}
    </p>
  )
}
