import { createClient } from "@/lib/supabase/server"

export interface InventoryStats {
  total: number
  available: number
  reserved: number
  sold: number
  hidden: number
  draft: number
  inventoryValue: number   // suma price obras available
}

export interface SalesStat {
  month: string            // "2026-04"
  label: string            // "Abr 26"
  count: number
  revenue: number
}

export interface VentasRow {
  id: string
  code: string
  title: string
  category: string
  sold_at: string
  sold_price: number | null
  sold_channel: string | null
  sold_buyer_name: string | null
  image_url: string | null
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-")
  return `${MONTH_LABELS[m] ?? m} ${y?.slice(2)}`
}

// ─── Inventory counts + value ──────────────────────────────────────────────

export async function getInventoryStats(): Promise<InventoryStats> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("artworks")
    .select("status, price")

  if (error || !data) {
    return { total: 0, available: 0, reserved: 0, sold: 0, hidden: 0, draft: 0, inventoryValue: 0 }
  }

  const stats: InventoryStats = {
    total: data.length,
    available: 0,
    reserved: 0,
    sold: 0,
    hidden: 0,
    draft: 0,
    inventoryValue: 0,
  }

  for (const row of data) {
    const s = row.status as string
    if (s === "available") {
      stats.available++
      stats.inventoryValue += Number(row.price ?? 0)
    } else if (s === "reserved") stats.reserved++
    else if (s === "sold")      stats.sold++
    else if (s === "hidden")    stats.hidden++
    else if (s === "draft")     stats.draft++
  }

  return stats
}

// ─── Monthly sales for last N months ──────────────────────────────────────

export async function getMonthlySales(months = 6): Promise<SalesStat[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setMonth(since.getMonth() - months + 1)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("artworks")
    .select("sold_at, sold_price")
    .eq("status", "sold")
    .gte("sold_at", since.toISOString())
    .order("sold_at", { ascending: true })

  if (error || !data) return []

  const map = new Map<string, SalesStat>()

  // Pre-fill all months so chart has no gaps
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    map.set(ym, { month: ym, label: monthLabel(ym), count: 0, revenue: 0 })
  }

  for (const row of data) {
    if (!row.sold_at) continue
    const ym = row.sold_at.slice(0, 7)
    const entry = map.get(ym)
    if (entry) {
      entry.count++
      entry.revenue += Number(row.sold_price ?? 0)
    }
  }

  return Array.from(map.values())
}

// ─── Current month quick stats ─────────────────────────────────────────────

export interface CurrentMonthStats {
  count: number
  revenue: number
}

export async function getCurrentMonthStats(): Promise<CurrentMonthStats> {
  const supabase = await createClient()

  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from("artworks")
    .select("sold_price")
    .eq("status", "sold")
    .gte("sold_at", from)
    .lte("sold_at", to)

  if (error || !data) return { count: 0, revenue: 0 }

  return {
    count:   data.length,
    revenue: data.reduce((s, r) => s + Number(r.sold_price ?? 0), 0),
  }
}

// ─── Sales table ───────────────────────────────────────────────────────────

export type VentasPeriod = "month" | "quarter" | "all"

export async function getVentas(period: VentasPeriod = "all"): Promise<VentasRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from("artworks")
    .select(`
      id, code, title, category,
      sold_at, sold_price, sold_channel, sold_buyer_name,
      artwork_images(cloudinary_url, is_primary, position)
    `)
    .eq("status", "sold")
    .order("sold_at", { ascending: false })

  if (period !== "all") {
    const since = new Date()
    since.setMonth(since.getMonth() - (period === "month" ? 1 : 3))
    query = query.gte("sold_at", since.toISOString())
  }

  const { data, error } = await query
  if (error || !data) return []

  return (data as unknown[]).map((r) => {
    const row = r as Record<string, unknown>
    const images = Array.isArray(row.artwork_images)
      ? [...(row.artwork_images as { cloudinary_url: string; is_primary: boolean; position: number }[])]
          .sort((a, b) => a.position - b.position)
      : []
    const primary = images.find((i) => i.is_primary) ?? images[0]
    return {
      id:               String(row.id ?? ""),
      code:             String(row.code ?? ""),
      title:            String(row.title ?? ""),
      category:         String(row.category ?? ""),
      sold_at:          String(row.sold_at ?? ""),
      sold_price:       row.sold_price != null ? Number(row.sold_price) : null,
      sold_channel:     row.sold_channel != null ? String(row.sold_channel) : null,
      sold_buyer_name:  row.sold_buyer_name != null ? String(row.sold_buyer_name) : null,
      image_url:        primary?.cloudinary_url ?? null,
    }
  })
}
