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
      categories: {
        Row: {
          created_at: string
          id: string
          nom: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          position?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          badge: string | null
          categorie_id: string | null
          created_at: string
          description: string | null
          disponible: boolean
          id: string
          image_url: string | null
          nom: string
          position: number
          prix: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          categorie_id?: string | null
          created_at?: string
          description?: string | null
          disponible?: boolean
          id?: string
          image_url?: string | null
          nom: string
          position?: number
          prix?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          categorie_id?: string | null
          created_at?: string
          description?: string | null
          disponible?: boolean
          id?: string
          image_url?: string | null
          nom?: string
          position?: number
          prix?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          nom: string
          order_id: string
          prix_unitaire: number
          quantite: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          nom: string
          order_id: string
          prix_unitaire?: number
          quantite?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          nom?: string
          order_id?: string
          prix_unitaire?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          note: string | null
          numero: number
          numero_table: string
          statut: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          numero?: number
          numero_table: string
          statut?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          numero?: number
          numero_table?: string
          statut?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          role: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          role: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          role?: string
          token_hash?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          adresse: string | null
          couleur_principale: string
          couleur_secondaire: string
          created_at: string
          devise: string
          id: string
          logo_url: string | null
          nom: string
          slogan: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          couleur_principale?: string
          couleur_secondaire?: string
          created_at?: string
          devise?: string
          id?: string
          logo_url?: string | null
          nom?: string
          slogan?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          couleur_principale?: string
          couleur_secondaire?: string
          created_at?: string
          devise?: string
          id?: string
          logo_url?: string | null
          nom?: string
          slogan?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_calls: {
        Row: {
          created_at: string
          id: string
          numero_table: string
          raison: string | null
          statut: string
          table_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          numero_table: string
          raison?: string | null
          statut?: string
          table_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          numero_table?: string
          raison?: string | null
          statut?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_calls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_pins: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          pin_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          pin_hash: string
          role: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          pin_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          active: boolean
          created_at: string
          id: string
          numero_table: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          numero_table: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          numero_table?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "gerant"
      order_status: "recu" | "en_preparation" | "pret" | "servi"
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
    Enums: {
      app_role: ["admin", "staff", "gerant"],
      order_status: ["recu", "en_preparation", "pret", "servi"],
    },
  },
} as const
