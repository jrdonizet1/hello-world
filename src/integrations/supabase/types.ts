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
      duel_logs: {
        Row: {
          created_at: string | null
          id: string
          loser_id: string | null
          loser_score: number | null
          room_id: string | null
          winner_id: string | null
          winner_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          loser_id?: string | null
          loser_score?: number | null
          room_id?: string | null
          winner_id?: string | null
          winner_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          loser_id?: string | null
          loser_score?: number | null
          room_id?: string | null
          winner_id?: string | null
          winner_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "duel_logs_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_logs_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_history: {
        Row: {
          command_text: string
          created_at: string
          display_word: string | null
          id: string
          is_correct: boolean
          theme: string | null
          user_answer: boolean
          user_id: string
        }
        Insert: {
          command_text: string
          created_at?: string
          display_word?: string | null
          id?: string
          is_correct: boolean
          theme?: string | null
          user_answer: boolean
          user_id: string
        }
        Update: {
          command_text?: string
          created_at?: string
          display_word?: string | null
          id?: string
          is_correct?: boolean
          theme?: string | null
          user_answer?: boolean
          user_id?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          created_at: string
          id: string
          score: number
          score_capital: number | null
          score_color: number | null
          score_curiosity: number | null
          score_general: number | null
          score_math: number | null
          score_scale: number | null
          score_sequence: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number
          score_capital?: number | null
          score_color?: number | null
          score_curiosity?: number | null
          score_general?: number | null
          score_math?: number | null
          score_scale?: number | null
          score_sequence?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          score_capital?: number | null
          score_color?: number | null
          score_curiosity?: number | null
          score_general?: number | null
          score_math?: number | null
          score_scale?: number | null
          score_sequence?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string | null
          description: string
          goal_type: string
          goal_value: number
          id: string
          is_daily: boolean | null
          reward_coins: number | null
          reward_power_shield: number | null
          reward_power_slow: number | null
          reward_xp: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          goal_type: string
          goal_value: number
          id?: string
          is_daily?: boolean | null
          reward_coins?: number | null
          reward_power_shield?: number | null
          reward_power_slow?: number | null
          reward_xp?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          goal_type?: string
          goal_value?: number
          id?: string
          is_daily?: boolean | null
          reward_coins?: number | null
          reward_power_shield?: number | null
          reward_power_slow?: number | null
          reward_xp?: number | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          duel_elo: number | null
          duel_wins: number | null
          id: string
          is_admin: boolean | null
          is_ready: boolean | null
          last_daily_reward: string | null
          level: number
          nickname: string | null
          power_shield_count: number | null
          power_slow_count: number | null
          referral_code: string | null
          referral_count: number | null
          referred_by_id: string | null
          room_id: string | null
          selected_arena_effect: Json | null
          selected_effect: Json | null
          selected_font: Json | null
          selected_frame: Json | null
          selected_icon: Json | null
          selected_skin: string | null
          selected_title: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          duel_elo?: number | null
          duel_wins?: number | null
          id: string
          is_admin?: boolean | null
          is_ready?: boolean | null
          last_daily_reward?: string | null
          level?: number
          nickname?: string | null
          power_shield_count?: number | null
          power_slow_count?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by_id?: string | null
          room_id?: string | null
          selected_arena_effect?: Json | null
          selected_effect?: Json | null
          selected_font?: Json | null
          selected_frame?: Json | null
          selected_icon?: Json | null
          selected_skin?: string | null
          selected_title?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          duel_elo?: number | null
          duel_wins?: number | null
          id?: string
          is_admin?: boolean | null
          is_ready?: boolean | null
          last_daily_reward?: string | null
          level?: number
          nickname?: string | null
          power_shield_count?: number | null
          power_slow_count?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by_id?: string | null
          room_id?: string | null
          selected_arena_effect?: Json | null
          selected_effect?: Json | null
          selected_font?: Json | null
          selected_frame?: Json | null
          selected_icon?: Json | null
          selected_skin?: string | null
          selected_title?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_id_fkey"
            columns: ["referred_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          acceleration_enabled: boolean | null
          acceleration_intensity: string | null
          base_time: number | null
          code: string
          created_at: string
          host_id: string
          id: string
          is_private: boolean | null
          max_players: number | null
          name: string | null
          password: string | null
          player_count: number | null
          selected_themes: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          acceleration_enabled?: boolean | null
          acceleration_intensity?: string | null
          base_time?: number | null
          code: string
          created_at?: string
          host_id: string
          id?: string
          is_private?: boolean | null
          max_players?: number | null
          name?: string | null
          password?: string | null
          player_count?: number | null
          selected_themes?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          acceleration_enabled?: boolean | null
          acceleration_intensity?: string | null
          base_time?: number | null
          code?: string
          created_at?: string
          host_id?: string
          id?: string
          is_private?: boolean | null
          max_players?: number | null
          name?: string | null
          password?: string | null
          player_count?: number | null
          selected_themes?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          item_data: Json
          name: string
          preview_url: string | null
          price: number
          rarity: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_data?: Json
          name: string
          preview_url?: string | null
          price?: number
          rarity?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_data?: Json
          name?: string
          preview_url?: string | null
          price?: number
          rarity?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          id: string
          item_id: string
          purchased_at: string | null
          quantity: number | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string | null
          quantity?: number | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string | null
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          claimed: boolean | null
          completed: boolean | null
          id: string
          last_updated: string | null
          mission_id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          completed?: boolean | null
          id?: string
          last_updated?: string | null
          mission_id: string
          progress?: number | null
          user_id?: string
        }
        Update: {
          claimed?: boolean | null
          completed?: boolean | null
          id?: string
          last_updated?: string | null
          mission_id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      purchase_item: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: Json
      }
      redeem_referral: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
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
    Enums: {},
  },
} as const
