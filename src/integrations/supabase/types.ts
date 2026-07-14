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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      asset_unlocks: {
        Row: {
          amount: number
          asset_id: string
          created_at: string
          id: string
          payment_id: string
          payment_method: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          asset_id: string
          created_at?: string
          id?: string
          payment_id: string
          payment_method: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          asset_id?: string
          created_at?: string
          id?: string
          payment_id?: string
          payment_method?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          address: string
          admin_memo: string | null
          asking_building_price: number | null
          asking_land_price: number | null
          asset_type: string
          building_condition: string | null
          building_coverage: number | null
          commercial_density: string | null
          created_at: string
          current_building_coverage: number | null
          current_floor_area: number | null
          current_floor_area_ratio: number | null
          distance_to_center: number | null
          floor_area_ratio: number | null
          gov_cooperation: boolean | null
          grade: string | null
          has_conversion_precedent: boolean | null
          historical_value: string | null
          id: string
          idle_years: number | null
          irr_result: Json | null
          is_abandoned_school_budget: boolean | null
          is_balanced_dev_budget: boolean | null
          is_citizen_proposal: boolean | null
          is_military_heritage_zone: boolean | null
          is_private_negotiation: boolean | null
          is_published: boolean | null
          is_urban_facility_conflict: boolean | null
          is_urban_regeneration_area: boolean | null
          is_waterfront_environmental: boolean | null
          land_area: number | null
          land_value_per_sqm: number | null
          latitude: number | null
          legal_max_building_coverage: number | null
          legal_max_floor_area_ratio: number | null
          longitude: number | null
          natural_scenery: string | null
          ownership_type: string | null
          population_trend: string | null
          recommended_dev_direction: string | null
          recommended_use_type: string | null
          scoring_detail: Json | null
          scoring_grade: string | null
          scoring_total: number | null
          use_change_expansion: string | null
          utilization_status: string
          zoning: string | null
          zoning_upgrade_gain: string | null
        }
        Insert: {
          address: string
          admin_memo?: string | null
          asking_building_price?: number | null
          asking_land_price?: number | null
          asset_type: string
          building_condition?: string | null
          building_coverage?: number | null
          commercial_density?: string | null
          created_at?: string
          current_building_coverage?: number | null
          current_floor_area?: number | null
          current_floor_area_ratio?: number | null
          distance_to_center?: number | null
          floor_area_ratio?: number | null
          gov_cooperation?: boolean | null
          grade?: string | null
          has_conversion_precedent?: boolean | null
          historical_value?: string | null
          id?: string
          idle_years?: number | null
          irr_result?: Json | null
          is_abandoned_school_budget?: boolean | null
          is_balanced_dev_budget?: boolean | null
          is_citizen_proposal?: boolean | null
          is_military_heritage_zone?: boolean | null
          is_private_negotiation?: boolean | null
          is_published?: boolean | null
          is_urban_facility_conflict?: boolean | null
          is_urban_regeneration_area?: boolean | null
          is_waterfront_environmental?: boolean | null
          land_area?: number | null
          land_value_per_sqm?: number | null
          latitude?: number | null
          legal_max_building_coverage?: number | null
          legal_max_floor_area_ratio?: number | null
          longitude?: number | null
          natural_scenery?: string | null
          ownership_type?: string | null
          population_trend?: string | null
          recommended_dev_direction?: string | null
          recommended_use_type?: string | null
          scoring_detail?: Json | null
          scoring_grade?: string | null
          scoring_total?: number | null
          use_change_expansion?: string | null
          utilization_status?: string
          zoning?: string | null
          zoning_upgrade_gain?: string | null
        }
        Update: {
          address?: string
          admin_memo?: string | null
          asking_building_price?: number | null
          asking_land_price?: number | null
          asset_type?: string
          building_condition?: string | null
          building_coverage?: number | null
          commercial_density?: string | null
          created_at?: string
          current_building_coverage?: number | null
          current_floor_area?: number | null
          current_floor_area_ratio?: number | null
          distance_to_center?: number | null
          floor_area_ratio?: number | null
          gov_cooperation?: boolean | null
          grade?: string | null
          has_conversion_precedent?: boolean | null
          historical_value?: string | null
          id?: string
          idle_years?: number | null
          irr_result?: Json | null
          is_abandoned_school_budget?: boolean | null
          is_balanced_dev_budget?: boolean | null
          is_citizen_proposal?: boolean | null
          is_military_heritage_zone?: boolean | null
          is_private_negotiation?: boolean | null
          is_published?: boolean | null
          is_urban_facility_conflict?: boolean | null
          is_urban_regeneration_area?: boolean | null
          is_waterfront_environmental?: boolean | null
          land_area?: number | null
          land_value_per_sqm?: number | null
          latitude?: number | null
          legal_max_building_coverage?: number | null
          legal_max_floor_area_ratio?: number | null
          longitude?: number | null
          natural_scenery?: string | null
          ownership_type?: string | null
          population_trend?: string | null
          recommended_dev_direction?: string | null
          recommended_use_type?: string | null
          scoring_detail?: Json | null
          scoring_grade?: string | null
          scoring_total?: number | null
          use_change_expansion?: string | null
          utilization_status?: string
          zoning?: string | null
          zoning_upgrade_gain?: string | null
        }
        Relationships: []
      }
      deal_signals: {
        Row: {
          admin_response: string | null
          admin_status: string
          asset_id: string
          created_at: string
          id: string
          responded_at: string | null
          responded_by: string | null
          signal_type: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          admin_status?: string
          asset_id: string
          created_at?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          signal_type: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          admin_status?: string
          asset_id?: string
          created_at?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          signal_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_rates: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          rate_type: string
          rate_value: number
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          rate_type: string
          rate_value: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          rate_type?: string
          rate_value?: number
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          contact: string
          created_at: string
          id: string
          message: string
          name: string
          organization: string
        }
        Insert: {
          contact: string
          created_at?: string
          id?: string
          message: string
          name: string
          organization: string
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          organization?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          subscription_tier: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          subscription_tier?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          subscription_tier?: string
        }
        Relationships: []
      }
      saved_assets: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          price_id: string
          product_id: string
          provider: string
          status: string
          toss_billing_key: string | null
          toss_card_company: string | null
          toss_card_number: string | null
          toss_customer_key: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          price_id: string
          product_id: string
          provider?: string
          status?: string
          toss_billing_key?: string | null
          toss_card_company?: string | null
          toss_card_number?: string | null
          toss_customer_key?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          price_id?: string
          product_id?: string
          provider?: string
          status?: string
          toss_billing_key?: string | null
          toss_card_company?: string | null
          toss_card_number?: string | null
          toss_customer_key?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      assets_public: {
        Row: {
          address: string | null
          asking_building_price: number | null
          asking_land_price: number | null
          asset_type: string | null
          building_condition: string | null
          building_coverage: number | null
          commercial_density: string | null
          created_at: string | null
          current_building_coverage: number | null
          current_floor_area: number | null
          current_floor_area_ratio: number | null
          distance_to_center: number | null
          floor_area_ratio: number | null
          gov_cooperation: boolean | null
          grade: string | null
          has_conversion_precedent: boolean | null
          historical_value: string | null
          id: string | null
          idle_years: number | null
          is_abandoned_school_budget: boolean | null
          is_balanced_dev_budget: boolean | null
          is_citizen_proposal: boolean | null
          is_military_heritage_zone: boolean | null
          is_private_negotiation: boolean | null
          is_published: boolean | null
          is_urban_facility_conflict: boolean | null
          is_urban_regeneration_area: boolean | null
          is_waterfront_environmental: boolean | null
          land_area: number | null
          land_value_per_sqm: number | null
          latitude: number | null
          legal_max_building_coverage: number | null
          legal_max_floor_area_ratio: number | null
          longitude: number | null
          natural_scenery: string | null
          ownership_type: string | null
          population_trend: string | null
          recommended_dev_direction: string | null
          recommended_use_type: string | null
          use_change_expansion: string | null
          utilization_status: string | null
          zoning: string | null
          zoning_upgrade_gain: string | null
        }
        Insert: {
          address?: string | null
          asking_building_price?: number | null
          asking_land_price?: number | null
          asset_type?: string | null
          building_condition?: string | null
          building_coverage?: number | null
          commercial_density?: string | null
          created_at?: string | null
          current_building_coverage?: number | null
          current_floor_area?: number | null
          current_floor_area_ratio?: number | null
          distance_to_center?: number | null
          floor_area_ratio?: number | null
          gov_cooperation?: boolean | null
          grade?: string | null
          has_conversion_precedent?: boolean | null
          historical_value?: string | null
          id?: string | null
          idle_years?: number | null
          is_abandoned_school_budget?: boolean | null
          is_balanced_dev_budget?: boolean | null
          is_citizen_proposal?: boolean | null
          is_military_heritage_zone?: boolean | null
          is_private_negotiation?: boolean | null
          is_published?: boolean | null
          is_urban_facility_conflict?: boolean | null
          is_urban_regeneration_area?: boolean | null
          is_waterfront_environmental?: boolean | null
          land_area?: number | null
          land_value_per_sqm?: number | null
          latitude?: number | null
          legal_max_building_coverage?: number | null
          legal_max_floor_area_ratio?: number | null
          longitude?: number | null
          natural_scenery?: string | null
          ownership_type?: string | null
          population_trend?: string | null
          recommended_dev_direction?: string | null
          recommended_use_type?: string | null
          use_change_expansion?: string | null
          utilization_status?: string | null
          zoning?: string | null
          zoning_upgrade_gain?: string | null
        }
        Update: {
          address?: string | null
          asking_building_price?: number | null
          asking_land_price?: number | null
          asset_type?: string | null
          building_condition?: string | null
          building_coverage?: number | null
          commercial_density?: string | null
          created_at?: string | null
          current_building_coverage?: number | null
          current_floor_area?: number | null
          current_floor_area_ratio?: number | null
          distance_to_center?: number | null
          floor_area_ratio?: number | null
          gov_cooperation?: boolean | null
          grade?: string | null
          has_conversion_precedent?: boolean | null
          historical_value?: string | null
          id?: string | null
          idle_years?: number | null
          is_abandoned_school_budget?: boolean | null
          is_balanced_dev_budget?: boolean | null
          is_citizen_proposal?: boolean | null
          is_military_heritage_zone?: boolean | null
          is_private_negotiation?: boolean | null
          is_published?: boolean | null
          is_urban_facility_conflict?: boolean | null
          is_urban_regeneration_area?: boolean | null
          is_waterfront_environmental?: boolean | null
          land_area?: number | null
          land_value_per_sqm?: number | null
          latitude?: number | null
          legal_max_building_coverage?: number | null
          legal_max_floor_area_ratio?: number | null
          longitude?: number | null
          natural_scenery?: string | null
          ownership_type?: string | null
          population_trend?: string | null
          recommended_dev_direction?: string | null
          recommended_use_type?: string | null
          use_change_expansion?: string | null
          utilization_status?: string | null
          zoning?: string | null
          zoning_upgrade_gain?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_asset_unlocked: {
        Args: { _asset_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
