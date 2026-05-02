import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants"

const CATEGORIES = ["religiosa", "nacional", "europea", "moderna"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: artworks } = await supabase
    .from("artworks")
    .select("code, updated_at")
    .eq("status", "available")
    .order("updated_at", { ascending: false })
    .limit(500)

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...CATEGORIES.map((cat) => ({
      url: `${SITE_URL}/categoria/${cat}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]

  const artworkRoutes: MetadataRoute.Sitemap = (artworks ?? []).map((a) => ({
    url: `${SITE_URL}/catalogo/${a.code}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...artworkRoutes]
}
