// Mirrors the output of `npm run db:types` for the current migrations.
// Regenerate it after every schema change once the local stack is running.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          id: string
          name: string
          split_method: 'equal' | 'proportional'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          split_method: 'equal' | 'proportional'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          split_method?: 'equal' | 'proportional'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          space_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          space_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          space_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'space_members_space_id_fkey'
            columns: ['space_id']
            isOneToOne: false
            referencedRelation: 'spaces'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_invitation: {
        Args: { p_email: string }
        Returns: string
      }
      accept_invitation: {
        Args: { p_token: string }
        Returns: string
      }
      create_space: {
        Args: { p_name: string; p_split_method: string }
        Returns: string
      }
      is_space_member: {
        Args: { p_space_id: string }
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
