export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      artworks: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          ai_generated: boolean
          manually_edited: boolean
          category: "religiosa" | "nacional" | "europea" | "moderna"
          subcategory: string | null
          tags: string[] | null
          technique: string | null
          width_cm: number | null
          height_cm: number | null
          has_frame: boolean
          frame_material: string | null
          frame_color: string | null
          price: number | null
          original_price: number | null
          cost: number | null
          show_price: boolean
          status: "available" | "reserved" | "sold" | "hidden"
          reserved_until: string | null
          reserved_by: string | null
          sold_at: string | null
          sold_price: number | null
          sold_channel: string | null
          sold_buyer_name: string | null
          sold_buyer_contact: string | null
          location_in_storage: string | null
          admin_notes: string | null
          views_count: number
          wishlist_count: number
          whatsapp_clicks: number
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: Omit<
          Database["public"]["Tables"]["artworks"]["Row"],
          "id" | "created_at" | "updated_at" | "views_count" | "wishlist_count" | "whatsapp_clicks"
        > & { id?: string }
        Update: Partial<Database["public"]["Tables"]["artworks"]["Insert"]>
      }
      artwork_images: {
        Row: {
          id: string
          artwork_id: string
          cloudinary_url: string
          cloudinary_public_id: string
          width: number | null
          height: number | null
          position: number
          is_primary: boolean
          alt_text: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["artwork_images"]["Row"], "id" | "created_at"> & {
          id?: string
        }
        Update: Partial<Database["public"]["Tables"]["artwork_images"]["Insert"]>
      }
      wishlist_items: {
        Row: {
          id: string
          session_id: string
          artwork_id: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["wishlist_items"]["Row"], "id" | "created_at"> & {
          id?: string
        }
        Update: Partial<Database["public"]["Tables"]["wishlist_items"]["Insert"]>
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          name: string | null
          preferences: Json
          status: "active" | "unsubscribed" | "bounced"
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: Omit<
          Database["public"]["Tables"]["newsletter_subscribers"]["Row"],
          "id" | "subscribed_at"
        > & { id?: string }
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>
      }
      inquiries: {
        Row: {
          id: string
          artwork_id: string | null
          name: string | null
          phone: string | null
          email: string | null
          message: string | null
          source: string | null
          status: "new" | "contacted" | "closed" | "converted"
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["inquiries"]["Row"], "id" | "created_at"> & {
          id?: string
        }
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["site_settings"]["Row"], "updated_at">
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>
      }
      import_jobs: {
        Row: {
          id: string
          filename: string | null
          total_rows: number | null
          processed_rows: number
          successful_rows: number
          failed_rows: number
          status: "pending" | "processing" | "completed" | "failed" | "cancelled"
          error_log: Json | null
          metadata: Json | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<
          Database["public"]["Tables"]["import_jobs"]["Row"],
          "id" | "created_at" | "processed_rows" | "successful_rows" | "failed_rows"
        > & { id?: string }
        Update: Partial<Database["public"]["Tables"]["import_jobs"]["Insert"]>
      }
      admin_activity: {
        Row: {
          id: string
          action: string | null
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["admin_activity"]["Row"], "id" | "created_at"> & {
          id?: string
        }
        Update: Partial<Database["public"]["Tables"]["admin_activity"]["Insert"]>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
