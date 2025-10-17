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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_employee_deployment_requests: {
        Row: {
          business_profile_id: string | null
          created_at: string | null
          deployment_config: Json | null
          helper_template_id: string
          id: string
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_profile_id?: string | null
          created_at?: string | null
          deployment_config?: Json | null
          helper_template_id: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_profile_id?: string | null
          created_at?: string | null
          deployment_config?: Json | null
          helper_template_id?: string
          id?: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_employee_deployment_requests_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_employee_deployment_requests_helper_template_id_fkey"
            columns: ["helper_template_id"]
            isOneToOne: false
            referencedRelation: "ai_helper_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_employee_deployments: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          created_at: string | null
          deployed_at: string | null
          deployment_config: Json | null
          deployment_request_at: string | null
          helper_id: string | null
          id: string
          performance_metrics: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_config?: Json | null
          deployment_request_at?: string | null
          helper_id?: string | null
          id?: string
          performance_metrics?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_config?: Json | null
          deployment_request_at?: string | null
          helper_id?: string | null
          id?: string
          performance_metrics?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_employee_deployments_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "helpers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_employee_usage: {
        Row: {
          action_type: string
          cost_cents: number | null
          created_at: string
          employee_type: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          success: boolean | null
          task_description: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          cost_cents?: number | null
          created_at?: string
          employee_type: string
          error_message?: string | null
      }
      user_analytics: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          event_data: Json;
          page_path: string | null;
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          event_data?: Json;
          page_path?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          event_data?: Json;
          page_path?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
        }
        Relationships: []
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          success?: boolean | null
          task_description?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          cost_cents?: number | null
          created_at?: string
          employee_type?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          success?: boolean | null
          task_description?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_helper_templates: {
        Row: {
          capabilities: Json | null
          category: string
          color_scheme: string
          created_at: string | null
          created_by: string | null
          deployment_eligibility: Json | null
          description: string
          icon_name: string
          id: string
          is_active: boolean | null
          is_public: boolean
          name: string
          prompt_template: string
          tier_requirement: string
          updated_at: string | null
          user_id: string | null
          visibility_level: string | null
        }
        Insert: {
          capabilities?: Json | null
          category: string
          color_scheme: string
          created_at?: string | null
          created_by?: string | null
          deployment_eligibility?: Json | null
          description: string
          icon_name: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean
          name: string
          prompt_template: string
          tier_requirement?: string
          updated_at?: string | null
          user_id?: string | null
          visibility_level?: string | null
        }
        Update: {
          capabilities?: Json | null
          category?: string
          color_scheme?: string
          created_at?: string | null
          created_by?: string | null
          deployment_eligibility?: Json | null
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean
          name?: string
          prompt_template?: string
          tier_requirement?: string
          updated_at?: string | null
          user_id?: string | null
          visibility_level?: string | null
        }
        Relationships: []
      }
      ai_shared_knowledge: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          is_verified: boolean | null
          knowledge_type: string | null
          metadata: Json
          relevance_tags: string[] | null
          source_employee: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          knowledge_type?: string | null
          metadata?: Json
          relevance_tags?: string[] | null
          source_employee?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          knowledge_type?: string | null
          metadata?: Json
          relevance_tags?: string[] | null
          source_employee?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_team_communications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          metadata: Json
          recipient_employee: string | null
          sender_employee: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json
          recipient_employee?: string | null
          sender_employee?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json
          recipient_employee?: string | null
          sender_employee?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_team_executions: {
        Row: {
          created_at: string
          current_step: number | null
          id: string
          status: string | null
          type: string | null
          updated_at: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          current_step?: number | null
          id?: string
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          current_step?: number | null
          id?: string
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_team_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflows: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          workflow_steps: Json
          trigger_config: Json | null
          is_active: boolean | null
          is_template: boolean | null
          execution_count: number | null
          success_rate: number | null
          last_executed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          workflow_steps?: Json
          trigger_config?: Json | null
          is_active?: boolean | null
          is_template?: boolean | null
          execution_count?: number | null
          success_rate?: number | null
          last_executed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          workflow_steps?: Json
          trigger_config?: Json | null
          is_active?: boolean | null
          is_template?: boolean | null
          execution_count?: number | null
          success_rate?: number | null
          last_executed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          id: string
          name: string
          description: string | null
          parameters_schema: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parameters_schema?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parameters_schema?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      agent_tasks: {
        Row: {
          id: string
          target_id: string
          owner_user: string
          status: string
          action: string
          parameters: Json | null
          result: Json | null
          error: string | null
          scheduled_for: string
          started_at: string | null
          finished_at: string | null
          created_at: string
          attempt_count: number
          max_attempts: number
          next_run_at: string | null
        }
        Insert: {
          id?: string
          target_id: string
          owner_user: string
          status?: string
          action: string
          parameters?: Json | null
          result?: Json | null
          error?: string | null
          scheduled_for?: string
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          attempt_count?: number
          max_attempts?: number
          next_run_at?: string | null
        }
        Update: {
          id?: string
          target_id?: string
          owner_user?: string
          status?: string
          action?: string
          parameters?: Json | null
          result?: Json | null
          error?: string | null
          scheduled_for?: string
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          attempt_count?: number
          max_attempts?: number
          next_run_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "integration_targets"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_task_events: {
        Row: {
          id: string
          task_id: string
          timestamp: string
          type: string
          message: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          task_id: string
          timestamp?: string
          type: string
          message: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          task_id?: string
          timestamp?: string
          type?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_credentials: {
        Row: {
          id: string
          target_id: string
          owner_user: string
          credentials_encrypted: string
          created_at: string
        }
        Insert: {
          id?: string
          target_id: string
          owner_user: string
          credentials_encrypted: string
          created_at?: string
        }
        Update: {
          id?: string
          target_id?: string
          owner_user?: string
          credentials_encrypted?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "integration_targets"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_targets: {
        Row: {
          id: string
          owner_user: string
          name: string
          base_url: string
          auth_type: string
          public_key: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_user: string
          name: string
          base_url: string
          auth_type?: string
          public_key: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_user?: string
          name?: string
          base_url?: string
          auth_type?: string
          public_key?: string
          created_at?: string
        }
        Relationships: []
      }
      rate_limit_rules: {
        Row: {
          id: string
          action: string
          tier: string
          limit: number
          period_seconds: number
        }
        Insert: {
          id?: string
          action: string
          tier: string
          limit: number
          period_seconds: number
        }
        Update: {
          id?: string
          action?: string
          tier?: string
          limit?: number
          period_seconds?: number
        }
        Relationships: []
      }
      rate_limit_usage: {
        Row: {
          id: string
          user_id: string
          action: string
          last_reset: string
          count: number
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          last_reset?: string
          count?: number
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          last_reset?: string
          count?: number
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          industry: string | null
          target_audience: string | null
          website_url: string | null
          brand_voice: string | null
          business_data: Json | null
          is_default: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          industry?: string | null
          target_audience?: string | null
          website_url?: string | null
          brand_voice?: string | null
          business_data?: Json | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          industry?: string | null
          target_audience?: string | null
          website_url?: string | null
          brand_voice?: string | null
          business_data?: Json | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      helpers: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: string
          template_id: string | null
          configuration: Json | null
          is_deployed: boolean | null
          deployment_status: string | null
          deployment_config: Json | null
          last_deployed_at: string | null
          is_active: boolean | null
          performance_metrics: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type?: string
          template_id?: string | null
          configuration?: Json | null
          is_deployed?: boolean | null
          deployment_status?: string | null
          deployment_config?: Json | null
          last_deployed_at?: string | null
          is_active?: boolean | null
          performance_metrics?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: string
          template_id?: string | null
          configuration?: Json | null
          is_deployed?: boolean | null
          deployment_status?: string | null
          deployment_config?: Json | null
          last_deployed_at?: string | null
          is_active?: boolean | null
          performance_metrics?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      agent_metrics: {
        Row: {
          owner_user: string | null
          action: string | null
          status: string | null
          total_tasks: number | null
          avg_duration_seconds: number | null
          p95_duration_seconds: number | null
        }
        Insert: {
          owner_user?: string | null
          action?: string | null
          status?: string | null
          total_tasks?: number | null
          avg_duration_seconds?: number | null
          p95_duration_seconds?: number | null
        }
        Update: {
          owner_user?: string | null
          action?: string | null
          status?: string | null
          total_tasks?: number | null
          avg_duration_seconds?: number | null
          p95_duration_seconds?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_admin_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      check_user_access: {
        Args: { record_user_id?: string; required_roles?: string[] }
        Returns: boolean
      }
      get_user_integrations_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          config: Json
          created_at: string
          credentials_status: Json
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean
          last_sync: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_ai_employee_deployment: {
        Args: {
          p_deployment_config: Json
          p_helper_template_id: string
          p_user_id: string
        }
        Returns: {
          deployment_limit: number
          is_valid: boolean
          message: string
        }[]
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
    : never,
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
