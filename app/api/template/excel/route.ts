import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { createClient } from "@/lib/supabase/server"
import { EXCEL_COLUMN_DEFS } from "@/types/import"

// ─── Colors ────────────────────────────────────────────────────────────────

const GOLD_ARGB   = "FFB8860B"
const CARBON_ARGB = "FF0F0F0F"
const WHITE_ARGB  = "FFFFFFFF"
const CREAM_ARGB  = "FFF5E6C8"
const GRAY_ARGB   = "FFD1D5DB"
const GOLD_LIGHT  = "FFFFF8E7"

const borderThin = (argb = GRAY_ARGB): ExcelJS.Border => ({ style: "thin", color: { argb } })
const allBorders = () => ({
  top: borderThin(), bottom: borderThin(),
  left: borderThin(), right: borderThin(),
  diagonal: {} as ExcelJS.BorderDiagonal,
})
const solidFill = (argb: string): ExcelJS.Fill => ({
  type: "pattern", pattern: "solid", fgColor: { argb },
})

// ExcelJS has dataValidations at runtime but it's not in the TS types
interface WSWithValidations extends ExcelJS.Worksheet {
  dataValidations: {
    add(range: string, validation: ExcelJS.DataValidation): void
  }
}

// ─── Example rows ──────────────────────────────────────────────────────────

// ─── Build Obras sheet ─────────────────────────────────────────────────────

function buildObrasSheet(
  wb: ExcelJS.Workbook,
  exampleCodes: { r: string; n: string; e: string }
) {
  const EXAMPLE_ROWS = [
    [exampleCodes.r, "religiosa", "virgen_guadalupe", "impresion", 55, 65, "si", "pino", "dorado", 200, 850, "A-1", ""],
    [exampleCodes.n, "nacional", "Paisaje rural", "oleo", 60, 80, "no", "", "", 150, "", "B-2", "Paisaje verde"],
    [exampleCodes.e, "europea", "Retrato", "oleo", 70, 90, "si", "importada_europea", "café", 300, 1800, "C-1", ""],
  ]
  const ws = wb.addWorksheet("Obras", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: "landscape" },
  }) as WSWithValidations

  ws.columns = EXCEL_COLUMN_DEFS.map((col) => ({
    header: col.label,
    key: col.key,
    width: col.width,
  }))

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.height = 22
  EXCEL_COLUMN_DEFS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.fill      = solidFill(col.required ? GOLD_ARGB : CARBON_ARGB)
    cell.font      = { bold: true, color: { argb: WHITE_ARGB }, size: 10, name: "Calibri" }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border    = allBorders()
    cell.note      = { texts: [{ text: col.tooltip }] }
  })

  // Data validations (range-based via runtime API)
  ws.dataValidations.add("B2:B501", {
    type: "list", allowBlank: false,
    formulae: ['"religiosa,nacional,europea,moderna"'],
    showErrorMessage: true, errorStyle: "error",
    errorTitle: "Categoría inválida",
    error: "Usa: religiosa · nacional · europea · moderna",
  })
  ws.dataValidations.add("D2:D501", {
    type: "list", allowBlank: false,
    formulae: ['"oleo,impresion"'],
    showErrorMessage: true, errorStyle: "error",
    errorTitle: "Técnica inválida",
    error: "Usa: oleo · impresion",
  })
  ws.dataValidations.add("G2:G501", {
    type: "list", allowBlank: false,
    formulae: ['"si,no"'],
    showErrorMessage: true, errorStyle: "error",
    errorTitle: "Valor inválido",
    error: "Escribe exactamente: si  o  no",
  })
  ws.dataValidations.add("H2:H501", {
    type: "list", allowBlank: true,
    formulae: ['"pino,importada_europea,sin_marco"'],
    showErrorMessage: false, errorStyle: "warning",
    errorTitle: "Material no estándar",
    error: "Sugeridos: pino · importada_europea · sin_marco",
  })
  ws.dataValidations.add("E2:E501", {
    type: "decimal", operator: "greaterThan", formulae: [0],
    showErrorMessage: true, errorStyle: "error",
    errorTitle: "Medida inválida", error: "Ancho debe ser mayor a 0",
  })
  ws.dataValidations.add("F2:F501", {
    type: "decimal", operator: "greaterThan", formulae: [0],
    showErrorMessage: true, errorStyle: "error",
    errorTitle: "Medida inválida", error: "Alto debe ser mayor a 0",
  })
  ws.dataValidations.add("J2:J501", {
    type: "decimal", operator: "greaterThanOrEqual", formulae: [0],
    showErrorMessage: true, errorStyle: "error",
    errorTitle: "Costo inválido", error: "Costo debe ser 0 o mayor",
  })
  ws.dataValidations.add("K2:K501", {
    type: "decimal", operator: "greaterThan", formulae: [0],
    showErrorMessage: true, errorStyle: "warning",
    errorTitle: "Precio inválido", error: "Si ingresas precio, debe ser mayor a 0",
  })

  // Example rows (cream background)
  EXAMPLE_ROWS.forEach((rowData) => {
    const row = ws.addRow(rowData)
    row.height = 18
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill   = solidFill(CREAM_ARGB)
      cell.border = allBorders()
      cell.font   = { size: 10, name: "Calibri" }
    })
  })
}

// ─── Build Instrucciones sheet ─────────────────────────────────────────────

function buildInstruccionesSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Instrucciones")
  ws.getColumn("A").width = 85

  const addTitle = (text: string, row: number) => {
    const cell = ws.getCell(`A${row}`)
    cell.value = text
    cell.font  = { bold: true, size: 13, color: { argb: CARBON_ARGB }, name: "Calibri" }
    cell.fill  = solidFill(GOLD_LIGHT)
    cell.alignment = { vertical: "middle", indent: 1 }
    ws.getRow(row).height = 24
  }

  const addLine = (
    text: string,
    row: number,
    opts?: { bold?: boolean; indent?: number; color?: string }
  ) => {
    const cell = ws.getCell(`A${row}`)
    cell.value = text
    cell.font  = {
      size: 10, name: "Calibri",
      bold: opts?.bold ?? false,
      color: { argb: opts?.color ?? "FF374151" },
    }
    cell.alignment = { vertical: "middle", indent: opts?.indent ?? 1, wrapText: true }
    ws.getRow(row).height = 16
  }

  let r = 1
  addTitle("INSTRUCCIONES — ATELIER 430 IMPORTACION MASIVA", r++)
  r++
  addLine("1. COMO LLENAR LA PLANTILLA", r++, { bold: true })
  addLine("Llena la hoja 'Obras'. No modifiques los encabezados (fila 1).", r++, { indent: 2 })
  addLine("Columnas con fondo DORADO son obligatorias. Las de fondo NEGRO son opcionales.", r++, { indent: 2 })
  addLine("Elimina las 3 filas de ejemplo (filas 2-4) antes de subir.", r++, { indent: 2 })
  addLine("Maximo 500 obras por importacion.", r++, { indent: 2 })
  r++
  addLine("2. CONVENCION DE CODIGOS", r++, { bold: true })
  addLine("R-001, R-002 ...  Obras religiosas", r++, { indent: 2 })
  addLine("N-001, N-002 ...  Obras nacionales (paisajes)", r++, { indent: 2 })
  addLine("E-001, E-002 ...  Obras europeas (reproducciones)", r++, { indent: 2 })
  addLine("M-001, M-002 ...  Obras modernas", r++, { indent: 2 })
  addLine("Los codigos deben ser unicos en el archivo y no repetir codigos ya existentes en el sistema.", r++, { indent: 2 })
  r++
  addLine("3. FOTOS PARA EL PASO 3 (Session 2)", r++, { bold: true })
  addLine("Guarda las fotos con el nombre:  CODIGO-NUMERO.jpg  ej: R-001-1.jpg, R-001-2.jpg", r++, { indent: 2 })
  addLine("La primera foto (sufijo -1) sera la imagen principal.", r++, { indent: 2 })
  addLine("Agrupa todas las fotos en un ZIP para subirlas en el Paso 3.", r++, { indent: 2 })
  r++
  addLine("4. TABLA DE PRECIOS DE REFERENCIA (MXN)", r++, { bold: true })
  addLine("Tamano < 50 cm    Sin marco: $800-$1,500    Con marco: $1,200-$2,200", r++, { indent: 2 })
  addLine("Tamano 50-80 cm   Sin marco: $1,500-$3,500  Con marco: $2,500-$5,000", r++, { indent: 2 })
  addLine("Tamano > 80 cm    Sin marco: $3,000-$7,000  Con marco: $5,000-$12,000", r++, { indent: 2 })
  addLine("Las obras religiosas y reproducciones europeas tienen mayor margen.", r++, { indent: 2 })
  r++
  addLine("5. LO QUE HACE LA IA AUTOMATICAMENTE (Session 2)", r++, { bold: true })
  addLine("Genera titulo y descripcion para cada obra segun su foto.", r++, { indent: 2 })
  addLine("Sugiere subcategoria si no la capturaste.", r++, { indent: 2 })
  addLine("Sugiere precio en 3 niveles (agresivo / recomendado / premium).", r++, { indent: 2 })
  addLine("Todo queda como borrador para que lo revises antes de publicar.", r++, { indent: 2 })
}

// ─── Build Resumen sheet ───────────────────────────────────────────────────

function buildResumenSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Resumen")
  ws.getColumn("A").width = 30
  ws.getColumn("B").width = 18

  const addSectionHeader = (text: string, row: number) => {
    const aCell = ws.getCell(`A${row}`)
    const bCell = ws.getCell(`B${row}`)
    aCell.value = text
    aCell.font  = { bold: true, size: 11, color: { argb: WHITE_ARGB }, name: "Calibri" }
    aCell.fill  = solidFill(CARBON_ARGB)
    bCell.fill  = solidFill(CARBON_ARGB)
    ws.getRow(row).height = 20
  }

  const addFormula = (label: string, formula: string, row: number, numFmt?: string) => {
    const labelCell = ws.getCell(`A${row}`)
    labelCell.value     = label
    labelCell.font      = { size: 10, name: "Calibri" }
    labelCell.alignment = { indent: 1 }
    labelCell.border    = allBorders()

    const valCell = ws.getCell(`B${row}`)
    valCell.value  = { formula }
    valCell.font   = { size: 10, bold: true, name: "Calibri" }
    valCell.border = allBorders()
    if (numFmt) valCell.numFmt = numFmt

    ws.getRow(row).height = 16
  }

  let r = 1
  addSectionHeader("RESUMEN DEL ARCHIVO DE IMPORTACION", r)
  ws.mergeCells(`A${r}:B${r}`)
  r += 2

  addSectionHeader("Por categoria", r++)
  addFormula("Total de obras",  "COUNTA(Obras!A2:A501)", r++)
  addFormula("Religiosas",      'COUNTIF(Obras!B2:B501,"religiosa")', r++)
  addFormula("Nacionales",      'COUNTIF(Obras!B2:B501,"nacional")', r++)
  addFormula("Europeas",        'COUNTIF(Obras!B2:B501,"europea")', r++)
  addFormula("Modernas",        'COUNTIF(Obras!B2:B501,"moderna")', r++)
  r++

  addSectionHeader("Marco", r++)
  addFormula("Con marco",  'COUNTIF(Obras!G2:G501,"si")', r++)
  addFormula("Sin marco",  'COUNTIF(Obras!G2:G501,"no")', r++)
  r++

  addSectionHeader("Financiero (MXN)", r++)
  addFormula("Suma de costos",              "SUM(Obras!J2:J501)", r++, '"$"#,##0')
  addFormula("Suma de precios",             "SUM(Obras!K2:K501)", r++, '"$"#,##0')
  addFormula("Obras con precio capturado",  'COUNTIF(Obras!K2:K501,">0")', r++)
  addFormula(
    "Margen estimado (%)",
    "IF(SUM(Obras!J2:J501)>0,(SUM(Obras!K2:K501)-SUM(Obras!J2:J501))/SUM(Obras!J2:J501),0)",
    r++,
    "0.0%"
  )
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const getNextCode = async (prefix: string): Promise<string> => {
    const { data } = await supabase
      .from("artworks")
      .select("code")
      .like("code", `${prefix}-%`)
      .order("code", { ascending: false })
      .limit(1)
    const last = data?.[0]?.code
    if (!last) return `${prefix}-001`
    const lastNum = parseInt(last.split("-")[1] ?? "0", 10)
    const next = String(lastNum + 1).padStart(3, "0")
    return `${prefix}-${next}`
  }

  const [nextR, nextN, nextE, nextM] = await Promise.all([
    getNextCode("R"),
    getNextCode("N"),
    getNextCode("E"),
    getNextCode("M"),
  ])

  const wb = new ExcelJS.Workbook()
  wb.creator  = "Atelier 430"
  wb.created  = new Date()
  wb.modified = new Date()

  buildObrasSheet(wb, { r: nextR, n: nextN, e: nextE })
  // Pass next-code hints into instructions
  ;(() => {
    const ws = wb.addWorksheet("Instrucciones")
    ws.getColumn("A").width = 85

    const addTitle = (text: string, row: number) => {
      const cell = ws.getCell(`A${row}`)
      cell.value = text
      cell.font  = { bold: true, size: 13, color: { argb: CARBON_ARGB }, name: "Calibri" }
      cell.fill  = solidFill(GOLD_LIGHT)
      cell.alignment = { vertical: "middle", indent: 1 }
      ws.getRow(row).height = 24
    }

    const addLine = (
      text: string,
      row: number,
      opts?: { bold?: boolean; indent?: number; color?: string }
    ) => {
      const cell = ws.getCell(`A${row}`)
      cell.value = text
      cell.font  = {
        size: 10, name: "Calibri",
        bold: opts?.bold ?? false,
        color: { argb: opts?.color ?? "FF374151" },
      }
      cell.alignment = { vertical: "middle", indent: opts?.indent ?? 1, wrapText: true }
      ws.getRow(row).height = 16
    }

    let r = 1
    addTitle("INSTRUCCIONES — ATELIER 430 IMPORTACION MASIVA", r++)
    r++
    addLine("1. COMO LLENAR LA PLANTILLA", r++, { bold: true })
    addLine("Llena la hoja 'Obras'. No modifiques los encabezados (fila 1).", r++, { indent: 2 })
    addLine("Columnas con fondo DORADO son obligatorias. Las de fondo NEGRO son opcionales.", r++, { indent: 2 })
    addLine("Elimina las 3 filas de ejemplo (filas 2-4) antes de subir.", r++, { indent: 2 })
    addLine("Maximo 500 obras por importacion.", r++, { indent: 2 })
    r++
    addLine("2. CONVENCION DE CODIGOS", r++, { bold: true })
    addLine(`R-001, R-002 ...  Obras religiosas (siguiente sugerido: ${nextR})`, r++, { indent: 2 })
    addLine(`N-001, N-002 ...  Obras nacionales (paisajes) (siguiente sugerido: ${nextN})`, r++, { indent: 2 })
    addLine(`E-001, E-002 ...  Obras europeas (reproducciones) (siguiente sugerido: ${nextE})`, r++, { indent: 2 })
    addLine(`M-001, M-002 ...  Obras modernas (siguiente sugerido: ${nextM})`, r++, { indent: 2 })
    addLine("Los codigos deben ser unicos en el archivo y no repetir codigos ya existentes en el sistema.", r++, { indent: 2 })
    r++
    addLine("3. FOTOS PARA EL PASO 3 (Session 2)", r++, { bold: true })
    addLine("Guarda las fotos con el nombre:  CODIGO-NUMERO.jpg  ej: R-001-1.jpg, R-001-2.jpg", r++, { indent: 2 })
    addLine("La primera foto (sufijo -1) sera la imagen principal.", r++, { indent: 2 })
    addLine("Agrupa todas las fotos en un ZIP para subirlas en el Paso 3.", r++, { indent: 2 })
    r++
    addLine("4. TABLA DE PRECIOS DE REFERENCIA (MXN)", r++, { bold: true })
    addLine("Tamano < 50 cm    Sin marco: $800-$1,500    Con marco: $1,200-$2,200", r++, { indent: 2 })
    addLine("Tamano 50-80 cm   Sin marco: $1,500-$3,500  Con marco: $2,500-$5,000", r++, { indent: 2 })
    addLine("Tamano > 80 cm    Sin marco: $3,000-$7,000  Con marco: $5,000-$12,000", r++, { indent: 2 })
    addLine("Las obras religiosas y reproducciones europeas tienen mayor margen.", r++, { indent: 2 })
    r++
    addLine("5. LO QUE HACE LA IA AUTOMATICAMENTE (Session 2)", r++, { bold: true })
    addLine("Genera titulo y descripcion para cada obra segun su foto.", r++, { indent: 2 })
    addLine("Sugiere subcategoria si no la capturaste.", r++, { indent: 2 })
    addLine("Sugiere precio en 3 niveles (agresivo / recomendado / premium).", r++, { indent: 2 })
    addLine("Todo queda como borrador para que lo revises antes de publicar.", r++, { indent: 2 })
  })()
  buildResumenSheet(wb)

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Atelier430_Plantilla_Carga_Masiva.xlsx"',
      "Cache-Control":       "no-store, no-cache",
    },
  })
}
