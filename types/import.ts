export const IMPORT_CATEGORIES = ["religiosa", "nacional", "europea", "moderna"] as const
export const IMPORT_TECHNIQUES = ["oleo", "impresion", "mixta", "acrilico"] as const
export const IMPORT_FRAME_MATERIALS = ["pino", "importada_europea", "sin_marco"] as const
export const CODE_REGEX = /^[RNEM]-\d{3}$/
export const MAX_IMPORT_ROWS = 500

export type ImportCategory = (typeof IMPORT_CATEGORIES)[number]
export type ImportTechnique = (typeof IMPORT_TECHNIQUES)[number]

export const EXCEL_COLUMN_DEFS = [
  {
    key: "code", label: "code", required: true, width: 12,
    tooltip: "Código único. Formato: R-001 (religiosa), N-001 (nacional), E-001 (europea), M-001 (moderna)",
  },
  {
    key: "category", label: "category", required: true, width: 14,
    tooltip: "Categoría. Valores permitidos: religiosa, nacional, europea, moderna",
  },
  {
    key: "subcategory", label: "subcategory", required: false, width: 18,
    tooltip: "Subcategoría (opcional). Religiosa: virgen_guadalupe, san_charbel… Nacional: Paisaje rural…",
  },
  {
    key: "technique", label: "technique", required: true, width: 14,
    tooltip: "Técnica. Valores: oleo, impresion, mixta, acrilico",
  },
  {
    key: "width_cm", label: "width_cm", required: true, width: 12,
    tooltip: "Ancho en centímetros (número mayor a 0)",
  },
  {
    key: "height_cm", label: "height_cm", required: true, width: 12,
    tooltip: "Alto en centímetros (número mayor a 0)",
  },
  {
    key: "has_frame", label: "has_frame", required: true, width: 12,
    tooltip: "¿Tiene marco? Escribe exactamente: si  o  no",
  },
  {
    key: "frame_material", label: "frame_material", required: false, width: 20,
    tooltip: "Material del marco (opcional): pino, importada_europea, sin_marco",
  },
  {
    key: "frame_color", label: "frame_color", required: false, width: 14,
    tooltip: "Color del marco en español: dorado, negro, plateado, café, natural",
  },
  {
    key: "cost", label: "cost", required: true, width: 10,
    tooltip: "Costo de adquisición en MXN (privado, no se publica). Mínimo 0",
  },
  {
    key: "price", label: "price", required: false, width: 10,
    tooltip: "Precio de venta en MXN (opcional, la IA puede sugerirlo). Mayor a 0 si se ingresa",
  },
  {
    key: "location_in_storage", label: "location_in_storage", required: false, width: 22,
    tooltip: "Ubicación en bodega, ej: A-1, B-3",
  },
  {
    key: "admin_notes", label: "admin_notes", required: false, width: 30,
    tooltip: "Notas privadas sobre la obra (no se publican)",
  },
] as const

export type ExcelColumnKey = (typeof EXCEL_COLUMN_DEFS)[number]["key"]

export interface ExcelRowData {
  code: string
  category: string
  subcategory: string
  technique: string
  width_cm: number | null
  height_cm: number | null
  has_frame: string
  frame_material: string
  frame_color: string
  cost: number | null
  price: number | null
  location_in_storage: string
  admin_notes: string
}

export type RowStatus = "valid" | "error" | "warning"

export interface ValidatedRow {
  rowIndex: number
  data: ExcelRowData
  status: RowStatus
  errors: string[]
  warnings: string[]
}

export interface ValidationSummary {
  total: number
  valid: number
  withErrors: number
  withWarnings: number
  rows: ValidatedRow[]
}
