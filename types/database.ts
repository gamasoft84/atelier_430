export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      artworks: {
        Row: {
          id: string
          code: string
          title: string
          artist: string | null
          description: string | null
          ai_generated: boolean
          manually_edited: boolean
          category: "religiosa" | "nacional" | "europea" | "moderna"
          subcategory: string | null
          stock_quantity: number
          tags: string[] | null
          technique: string | null
          width_cm: number | null
          height_cm: number | null
          has_frame: boolean
          frame_material: string | null
          frame_color: string | null
          frame_outer_width_cm: number | null
          frame_outer_height_cm: number | null
          price: number | null
          original_price: number | null
          cost: number | null
          price_locked: boolean
          show_price: boolean
          status: "available" | "reserved" | "sold" | "hidden" | "draft"
          reserved_until: string | null
          reserved_by: string | null
          sold_at: string | null
          sold_price: number | null
          sold_channel: "whatsapp" | "presencial" | "mercadolibre" | "marketplace" | "instagram" | "otro" | null
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
        Insert: {
          id?: string
          code: string
          title: string
          artist?: string | null
          description?: string | null
          ai_generated?: boolean
          manually_edited?: boolean
          category: "religiosa" | "nacional" | "europea" | "moderna"
          subcategory?: string | null
          stock_quantity?: number
          tags?: string[] | null
          technique?: string | null
          width_cm?: number | null
          height_cm?: number | null
          has_frame?: boolean
          frame_material?: string | null
          frame_color?: string | null
          frame_outer_width_cm?: number | null
          frame_outer_height_cm?: number | null
          price?: number | null
          original_price?: number | null
          cost?: number | null
          price_locked?: boolean
          show_price?: boolean
          status?: "available" | "reserved" | "sold" | "hidden" | "draft"
          reserved_until?: string | null
          reserved_by?: string | null
          sold_at?: string | null
          sold_price?: number | null
          sold_channel?: string | null
          sold_buyer_name?: string | null
          sold_buyer_contact?: string | null
          location_in_storage?: string | null
          admin_notes?: string | null
          views_count?: number
          wishlist_count?: number
          whatsapp_clicks?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          title?: string
          artist?: string | null
          description?: string | null
          ai_generated?: boolean
          manually_edited?: boolean
          category?: "religiosa" | "nacional" | "europea" | "moderna"
          subcategory?: string | null
          stock_quantity?: number
          tags?: string[] | null
          technique?: string | null
          width_cm?: number | null
          height_cm?: number | null
          has_frame?: boolean
          frame_material?: string | null
          frame_color?: string | null
          frame_outer_width_cm?: number | null
          frame_outer_height_cm?: number | null
          price?: number | null
          original_price?: number | null
          cost?: number | null
          price_locked?: boolean
          show_price?: boolean
          status?: "available" | "reserved" | "sold" | "hidden" | "draft"
          reserved_until?: string | null
          reserved_by?: string | null
          sold_at?: string | null
          sold_price?: number | null
          sold_channel?: string | null
          sold_buyer_name?: string | null
          sold_buyer_contact?: string | null
          location_in_storage?: string | null
          admin_notes?: string | null
          views_count?: number
          wishlist_count?: number
          whatsapp_clicks?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: []
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
        Insert: {
          id?: string
          artwork_id: string
          cloudinary_url: string
          cloudinary_public_id: string
          width?: number | null
          height?: number | null
          position?: number
          is_primary?: boolean
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          artwork_id?: string
          cloudinary_url?: string
          cloudinary_public_id?: string
          width?: number | null
          height?: number | null
          position?: number
          is_primary?: boolean
          alt_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_images_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          }
        ]
      }
      wishlist_items: {
        Row: {
          id: string
          session_id: string
          artwork_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          artwork_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          artwork_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          }
        ]
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
        Insert: {
          id?: string
          email: string
          name?: string | null
          preferences?: Json
          status?: "active" | "unsubscribed" | "bounced"
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          preferences?: Json
          status?: "active" | "unsubscribed" | "bounced"
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
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
        Insert: {
          id?: string
          artwork_id?: string | null
          name?: string | null
          phone?: string | null
          email?: string | null
          message?: string | null
          source?: string | null
          status?: "new" | "contacted" | "closed" | "converted"
          created_at?: string
        }
        Update: {
          id?: string
          artwork_id?: string | null
          name?: string | null
          phone?: string | null
          email?: string | null
          message?: string | null
          source?: string | null
          status?: "new" | "contacted" | "closed" | "converted"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          filename?: string | null
          total_rows?: number | null
          processed_rows?: number
          successful_rows?: number
          failed_rows?: number
          status?: "pending" | "processing" | "completed" | "failed" | "cancelled"
          error_log?: Json | null
          metadata?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string | null
          total_rows?: number | null
          processed_rows?: number
          successful_rows?: number
          failed_rows?: number
          status?: "pending" | "processing" | "completed" | "failed" | "cancelled"
          error_log?: Json | null
          metadata?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_artwork_views: {
        Args: { p_id: string }
        Returns: undefined
      }
      increment_artwork_whatsapp_clicks: {
        Args: { p_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
