import { createClient } from '@supabase/supabase-js'

// Supabase configuration using Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'moderator' | 'teacher' | 'student'
          is_active: boolean
          last_login: string | null
          profile_picture_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'moderator' | 'teacher' | 'student'
          is_active?: boolean
          last_login?: string | null
          profile_picture_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'moderator' | 'teacher' | 'student'
          is_active?: boolean
          last_login?: string | null
          profile_picture_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          content: string
          excerpt: string | null
          category: string
          author_id: string
          status: 'draft' | 'under_review' | 'published' | 'archived'
          is_featured: boolean
          is_moderated: boolean
          image_url: string | null
          tags: string[]
          likes: number
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          excerpt?: string | null
          category: string
          author_id: string
          status?: 'draft' | 'under_review' | 'published' | 'archived'
          is_featured?: boolean
          is_moderated?: boolean
          image_url?: string | null
          tags?: string[]
          likes?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          excerpt?: string | null
          category?: string
          author_id?: string
          status?: 'draft' | 'under_review' | 'published' | 'archived'
          is_featured?: boolean
          is_moderated?: boolean
          image_url?: string | null
          tags?: string[]
          likes?: number
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      confessions: {
        Row: {
          id: string
          author_id: string
          content: string
          category: 'general' | 'academic' | 'personal' | 'other'
          is_anonymous: boolean
          likes: number
          tags: string[]
          is_moderated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          category?: 'general' | 'academic' | 'personal' | 'other'
          is_anonymous?: boolean
          likes?: number
          tags?: string[]
          is_moderated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          category?: 'general' | 'academic' | 'personal' | 'other'
          is_anonymous?: boolean
          likes?: number
          tags?: string[]
          is_moderated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          article_id: string
          user_id: string
          content: string
          likes: number
          is_moderated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          user_id: string
          content: string
          likes?: number
          is_moderated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string
          content?: string
          likes?: number
          is_moderated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_content_type: string
          reported_content_id: string
          reason: string
          description: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_content_type: string
          reported_content_id: string
          reason: string
          description?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_content_type?: string
          reported_content_id?: string
          reason?: string
          description?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string | null
          target_id: string | null
          details: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          details?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string | null
          target_id?: string | null
          details?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'moderator' | 'teacher' | 'student'
      article_status: 'draft' | 'under_review' | 'published' | 'archived'
      confession_category: 'general' | 'academic' | 'personal' | 'other'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
