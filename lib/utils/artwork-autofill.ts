import type { ClassificationResult, AutoFillResult } from "@/types/classification"

export function applyAutoFill(classification: ClassificationResult): AutoFillResult {
  if (classification.category === "religiosa") {
    return {
      category: "religiosa",
      subcategory: classification.subcategory ?? "",
      technique: "impresion",
      has_frame: true,
      frame_material: "pino",
      frame_color: classification.frame_color ?? "dorado",
      width_cm: 55,
      height_cm: 65,
    }
  }

  return {
    category: classification.category,
    subcategory: "",
    technique: "oleo",
    has_frame: classification.has_frame,
    frame_material: classification.has_frame ? "pino" : "",
    frame_color: classification.frame_color ?? "",
  }
}
