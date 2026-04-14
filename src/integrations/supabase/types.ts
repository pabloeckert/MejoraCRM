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
      clients: {
        Row: {
          assigned_to: string | null
          channel: string | null
          company: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          first_contact_date: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          segment: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          company?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          company?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          client_id: string
          created_at: string
          follow_up_date: string | null
          id: string
          interaction_date: string
          medium: Database["public"]["Enums"]["interaction_medium"]
          next_step: string | null
          notes: string | null
          product_id: string | null
          result: Database["public"]["Enums"]["interaction_result"] | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interaction_date?: string
          medium: Database["public"]["Enums"]["interaction_medium"]
          next_step?: string | null
          notes?: string | null
          product_id?: string | null
          result?: Database["public"]["Enums"]["interaction_result"] | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interaction_date?: string
          medium?: Database["public"]["Enums"]["interaction_medium"]
          next_step?: string | null
          notes?: string | null
          product_id?: string | null
          result?: Database["public"]["Enums"]["interaction_result"] | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_to: string
          client_id: string
          created_at: string
          estimated_amount: number | null
          id: string
          loss_reason: string | null
          product_id: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          updated_at: string
        }
        Insert: {
          assigned_to: string
          client_id: string
          created_at?: string
          estimated_amount?: number | null
          id?: string
          loss_reason?: string | null
          product_id?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          client_id?: string
          created_at?: string
          estimated_amount?: number | null
          id?: string
          loss_reason?: string | null
          product_id?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          id: string
          name: string
          price: number | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "vendedor"
      client_status: "lead" | "cliente" | "inactivo"
      interaction_medium: "whatsapp" | "email" | "llamada" | "redes" | "reunion"
      interaction_result: "interes" | "venta" | "sin_respuesta" | "rechazo"
      interaction_type: "consulta" | "cotizacion" | "seguimiento" | "cierre"
      opportunity_stage:
        | "prospecto"
        | "contactado"
        | "cotizacion"
        | "negociacion"
        | "cerrado_ganado"
        | "cerrado_perdido"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "vendedor"],
      client_status: ["lead", "cliente", "inactivo"],
      interaction_medium: ["whatsapp", "email", "llamada", "redes", "reunion"],
      interaction_result: ["interes", "venta", "sin_respuesta", "rechazo"],
      interaction_type: ["consulta", "cotizacion", "seguimiento", "cierre"],
      opportunity_stage: [
        "prospecto",
        "contactado",
        "cotizacion",
        "negociacion",
        "cerrado_ganado",
        "cerrado_perdido",
      ],
    },
  },
} as const
