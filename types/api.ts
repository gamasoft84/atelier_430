import type { Artwork, ArtworkImage, ArtworkPublic } from "./artwork"

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ArtworkListParams {
  page?: number
  per_page?: number
  category?: string
  status?: string
  search?: string
  min_price?: number
  max_price?: number
  has_frame?: boolean
  sort?: "created_at_desc" | "created_at_asc" | "price_asc" | "price_desc"
}

export interface GenerateContentRequest {
  artwork_id?: string
  image_url: string
  category: string
  subcategory?: string
  technique?: string
  width_cm?: number
  height_cm?: number
  has_frame?: boolean
  frame_material?: string
  frame_color?: string
}

export interface GenerateContentResponse {
  title: string
  description: string
  tags: string[]
  subcategory?: string
}

export interface GeneratePostRequest {
  artwork: Pick<ArtworkPublic, "title" | "description" | "category" | "width_cm" | "height_cm" | "price">
  url: string
}

export interface GeneratePostResponse {
  instagram: string
  facebook: string
  whatsapp: string
}

export interface UploadImageResponse {
  cloudinary_url: string
  cloudinary_public_id: string
  width: number
  height: number
}

export interface ImportValidateResponse {
  valid: boolean
  total_rows: number
  errors: Array<{ row: number; field: string; message: string }>
  preview: Array<Record<string, string>>
}

export interface ImportStatusResponse {
  job_id: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  total_rows: number
  processed_rows: number
  successful_rows: number
  failed_rows: number
  percent: number
}

export interface DashboardStats {
  total: number
  available: number
  reserved: number
  sold: number
  hidden: number
  revenue_month: number
  revenue_total: number
  net_profit: number
  top_viewed: Array<Pick<Artwork, "id" | "code" | "title" | "views_count"> & { images?: ArtworkImage[] }>
}
