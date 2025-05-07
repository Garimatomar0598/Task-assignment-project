export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          created_at: string
          updated_at: string | null
          created_by: string
          assigned_to: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string | null
          created_by: string
          assigned_to?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string
          assigned_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          read: boolean
          created_at: string
          task_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          read?: boolean
          created_at?: string
          task_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}