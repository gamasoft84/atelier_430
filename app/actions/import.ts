"use server"

import * as XLSX from "xlsx"
import { createClient } from "@/lib/supabase/server"
import {
  IMPORT_CATEGORIES,
  IMPORT_TECHNIQUES,
  CODE_REGEX,
  MAX_IMPORT_ROWS,
  EXCEL_COLUMN_DEFS,
  type ExcelRowData,
  type ValidatedRow,
  type ValidationSummary,
  type RowStatus,
} from "@/types/import"

// ─── Parse raw cell value to string ────────────────────────────────────────

function str(val: unknown): string {
  if (val === null || val === undefined) return ""
  return String(val).trim()
}

function num(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

// ─── Validate a single row ──────────────────────────────────────────────────

function validateRow(
  raw: Record<string, unknown>,
  rowIndex: number,
  seenCodes: Set<string>,
  existingCodes: Set<string>
): ValidatedRow {
  const errors: string[] = []
  const warnings: string[] = []

  // code
  const code = str(raw.code)
  if (!code) {
    errors.push("Código requerido (columna A)")
  } else if (!CODE_REGEX.test(code)) {
    errors.push(`Código "${code}" inválido — formato esperado: R-001, N-002, E-003 o M-004`)
  } else if (seenCodes.has(code)) {
    errors.push(`Código "${code}" duplicado en este archivo`)
  } else {
    seenCodes.add(code)
    if (existingCodes.has(code)) {
      warnings.push(`Código "${code}" ya existe en la base de datos — se omitirá en el paso 3`)
    }
  }

  // category
  const category = str(raw.category).toLowerCase()
  if (!category) {
    errors.push("Categoría requerida (columna B)")
  } else if (!(IMPORT_CATEGORIES as readonly string[]).includes(category)) {
    errors.push(`Categoría "${category}" inválida — usa: religiosa, nacional, europea, moderna`)
  }

  // technique
  const technique = str(raw.technique).toLowerCase()
  if (!technique) {
    errors.push("Técnica requerida (columna D)")
  } else if (!(IMPORT_TECHNIQUES as readonly string[]).includes(technique)) {
    errors.push(`Técnica "${technique}" inválida — usa: oleo, impresion`)
  }

  // width_cm
  const width = num(raw.width_cm)
  if (width === null) {
    errors.push("Ancho (width_cm) requerido (columna E)")
  } else if (width <= 0) {
    errors.push("Ancho debe ser mayor a 0")
  }

  // height_cm
  const height = num(raw.height_cm)
  if (height === null) {
    errors.push("Alto (height_cm) requerido (columna F)")
  } else if (height <= 0) {
    errors.push("Alto debe ser mayor a 0")
  }

  // has_frame
  const hasFrame = str(raw.has_frame).toLowerCase()
  if (!hasFrame) {
    errors.push("has_frame requerido (columna G) — escribe: si  o  no")
  } else if (hasFrame !== "si" && hasFrame !== "no") {
    errors.push(`has_frame "${hasFrame}" inválido — escribe exactamente: si  o  no`)
  }

  // cost
  const cost = num(raw.cost)
  if (cost === null) {
    errors.push("Costo requerido (columna J) — usa 0 si no lo tienes")
  } else if (cost < 0) {
    errors.push("Costo debe ser 0 o mayor")
  }

  // price (optional, but if present must be > 0)
  const priceRaw = raw.price
  const price = num(priceRaw)
  if (priceRaw !== "" && priceRaw !== null && priceRaw !== undefined) {
    if (price === null || isNaN(price) || price <= 0) {
      errors.push("Precio debe ser mayor a 0 si se ingresa (columna K)")
    }
  }

  const status: RowStatus = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"

  const data: ExcelRowData = {
    code,
    category,
    subcategory:         str(raw.subcategory),
    technique,
    width_cm:            width,
    height_cm:           height,
    has_frame:           hasFrame,
    frame_material:      str(raw.frame_material),
    frame_color:         str(raw.frame_color),
    cost,
    price:               (priceRaw !== "" && priceRaw !== null && priceRaw !== undefined) ? price : null,
    location_in_storage: str(raw.location_in_storage),
    admin_notes:         str(raw.admin_notes),
  }

  return { rowIndex, data, status, errors, warnings }
}

// ─── Server action ──────────────────────────────────────────────────────────

export async function validateImportFile(
  formData: FormData
): Promise<{ summary: ValidationSummary } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "No se recibió ningún archivo" }

  // Read file buffer
  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: "array" })
  } catch {
    return { error: "No se pudo leer el archivo. Asegúrate de que sea un .xlsx o .csv válido." }
  }

  // Find sheet — accept "Obras" or first sheet (for CSV)
  const sheetName = workbook.SheetNames.includes("Obras")
    ? "Obras"
    : workbook.SheetNames[0]

  if (!sheetName) return { error: "El archivo no contiene hojas de datos." }

  const worksheet = workbook.Sheets[sheetName]
  // sheet_to_json with header:1 returns array of arrays
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  })

  if (rawRows.length < 2) {
    return { error: "El archivo está vacío o solo tiene la fila de encabezados." }
  }

  // Parse headers (first row)
  const headers = (rawRows[0] as unknown[]).map((h) => str(h).toLowerCase())
  const expectedKeys = EXCEL_COLUMN_DEFS.map((c) => c.key)
  const missingHeaders = expectedKeys.filter((k) => !headers.includes(k))
  if (missingHeaders.length > 0) {
    return {
      error: `Encabezados faltantes: ${missingHeaders.join(", ")}. ¿Estás usando la plantilla oficial?`,
    }
  }

  // Build header index map
  const colIndex: Record<string, number> = {}
  headers.forEach((h, i) => { if (h) colIndex[h] = i })

  // Data rows (skip header)
  const dataRows = rawRows.slice(1).filter((row) =>
    (row as unknown[]).some((cell) => cell !== "" && cell !== null && cell !== undefined)
  )

  if (dataRows.length === 0) {
    return { error: "No hay filas de datos en el archivo (solo encabezados)." }
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return { error: `El archivo tiene ${dataRows.length} filas. El máximo permitido es ${MAX_IMPORT_ROWS}.` }
  }

  // Extract typed objects using header index
  const typedRows = dataRows.map((row) => {
    const obj: Record<string, unknown> = {}
    expectedKeys.forEach((key) => {
      const idx = colIndex[key]
      obj[key] = idx !== undefined ? (row as unknown[])[idx] : ""
    })
    return obj
  })

  // Check existing codes in DB
  const allCodes = typedRows
    .map((r) => str(r.code))
    .filter((c) => CODE_REGEX.test(c))

  let existingCodes = new Set<string>()
  if (allCodes.length > 0) {
    const { data: dbRows } = await supabase
      .from("artworks")
      .select("code")
      .in("code", allCodes)
    if (dbRows) {
      existingCodes = new Set(dbRows.map((r: { code: string }) => r.code))
    }
  }

  // Validate each row
  const seenCodes = new Set<string>()
  const validatedRows: ValidatedRow[] = typedRows.map((row, i) =>
    validateRow(row, i + 2, seenCodes, existingCodes) // rowIndex = Excel row (2-based)
  )

  const summary: ValidationSummary = {
    total:        validatedRows.length,
    valid:        validatedRows.filter((r) => r.status === "valid").length,
    withErrors:   validatedRows.filter((r) => r.status === "error").length,
    withWarnings: validatedRows.filter((r) => r.status === "warning").length,
    rows:         validatedRows,
  }

  return { summary }
}
