/**
 * Leyenda de barra gráfica para la vista a escala (módulo aparte para evitar
 * problemas de resolución de import en el bundle cliente de Turbopack).
 */

export interface ScaleBarChoice {
  /** Longitud del segmento dibujado en centímetros (50 o 100). */
  segmentCm: 50 | 100
  /** Texto junto a la barra; vacío cuando el segmento es 100 cm (evita confusión con la referencia humana en cm). */
  label: string
}

/**
 * Elige entre una marca de 50 cm o 100 cm según el zoom efectivo en pantalla,
 * para que la barra gráfica siga siendo legible. El segmento de 100 cm no muestra leyenda textual.
 */
export function pickScaleBarSegment(effectivePxPerCm: number): ScaleBarChoice {
  if (!Number.isFinite(effectivePxPerCm) || effectivePxPerCm <= 0) {
    return { segmentCm: 100, label: "" }
  }
  const px100 = 100 * effectivePxPerCm
  const px50 = 50 * effectivePxPerCm
  if (px100 >= 56) return { segmentCm: 100, label: "" }
  if (px50 >= 40) return { segmentCm: 50, label: "50 cm" }
  return px100 >= px50 ? { segmentCm: 100, label: "" } : { segmentCm: 50, label: "50 cm" }
}
