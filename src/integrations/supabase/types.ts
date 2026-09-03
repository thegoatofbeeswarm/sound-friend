export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_reports: {
        Row: {
          comparison_summary: string | null
          created_at: string
          error: string | null
          file_name: string
          file_path: string
          id: string
          mime_type: string
          next_steps: string | null
          source_label: string | null
          status: string
          summary: string | null
          test_date: string | null
          user_id: string
        }
        Insert: {
          comparison_summary?: string | null
          created_at?: string
          error?: string | null
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          next_steps?: string | null
          source_label?: string | null
          status?: string
          summary?: string | null
          test_date?: string | null
          user_id?: string
        }
        Update: {
          comparison_summary?: string | null
          created_at?: string
          error?: string | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          next_steps?: string | null
          source_label?: string | null
          status?: string
          summary?: string | null
          test_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clinical_threshold_points: {
        Row: {
          ear: string
          frequency_hz: number
          id: string
          report_id: string
          threshold_db: number
          user_id: string
        }
        Insert: {
          ear: string
          frequency_hz: number
          id?: string
          report_id: string
          threshold_db: number
          user_id?: string
        }
        Update: {
          ear?: string
          frequency_hz?: number
          id?: string
          report_id?: string
          threshold_db?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_threshold_points_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "clinical_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      hearing_tests: {
        Row: {
          avg_threshold_db: number | null
          created_at: string
          device_type: string | null
          environment_db: number | null
          id: string
          notes: string | null
          safe_volume_offset_db: number | null
          trials: number
          user_id: string
          worst_threshold_db: number | null
        }
        Insert: {
          avg_threshold_db?: number | null
          created_at?: string
          device_type?: string | null
          environment_db?: number | null
          id?: string
          notes?: string | null
          safe_volume_offset_db?: number | null
          trials?: number
          user_id: string
          worst_threshold_db?: number | null
        }
        Update: {
          avg_threshold_db?: number | null
          created_at?: string
          device_type?: string | null
          environment_db?: number | null
          id?: string
          notes?: string | null
          safe_volume_offset_db?: number | null
          trials?: number
          user_id?: string
          worst_threshold_db?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      threshold_points: {
        Row: {
          confidence: number
          ear: string
          frequency_hz: number
          id: string
          test_id: string
          threshold_db: number
          user_id: string
        }
        Insert: {
          confidence?: number
          ear: string
          frequency_hz: number
          id?: string
          test_id: string
          threshold_db: number
          user_id: string
        }
        Update: {
          confidence?: number
          ear?: string
          frequency_hz?: number
          id?: string
          test_id?: string
          threshold_db?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threshold_points_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "hearing_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      training_schedules: {
        Row: {
          days: number[]
          enabled: boolean
          id: string
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          days?: number[]
          enabled?: boolean
          id?: string
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          days?: number[]
          enabled?: boolean
          id?: string
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          accuracy: number
          correct: number
          created_at: string
          duration_sec: number
          end_level: number
          id: string
          mode: string
          quietest_db: number | null
          rounds: number
          start_level: number
          user_id: string
          xp: number
        }
        Insert: {
          accuracy?: number
          correct?: number
          created_at?: string
          duration_sec?: number
          end_level?: number
          id?: string
          mode?: string
          quietest_db?: number | null
          rounds?: number
          start_level?: number
          user_id: string
          xp?: number
        }
        Update: {
          accuracy?: number
          correct?: number
          created_at?: string
          duration_sec?: number
          end_level?: number
          id?: string
          mode?: string
          quietest_db?: number | null
          rounds?: number
          start_level?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
