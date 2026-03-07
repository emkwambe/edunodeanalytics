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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          anonymization_level: string | null
          audit_id: string | null
          cost_cents: number
          created_at: string
          error_message: string | null
          feature: string
          id: string
          input_tokens: number
          latency_ms: number | null
          model: string
          output_tokens: number
          pii_detected: boolean | null
          provider: string
          school_id: string
          student_count: number | null
          success: boolean
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          anonymization_level?: string | null
          audit_id?: string | null
          cost_cents?: number
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          model: string
          output_tokens?: number
          pii_detected?: boolean | null
          provider: string
          school_id: string
          student_count?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          anonymization_level?: string | null
          audit_id?: string | null
          cost_cents?: number
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          model?: string
          output_tokens?: number
          pii_detected?: boolean | null
          provider?: string
          school_id?: string
          student_count?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_limits: {
        Row: {
          alert_sent_at: string | null
          alert_threshold_percent: number | null
          created_at: string
          current_month_cost_cents: number
          current_month_tokens: number
          id: string
          monthly_cost_limit_cents: number | null
          monthly_token_limit: number | null
          period_start: string
          school_id: string
          updated_at: string
        }
        Insert: {
          alert_sent_at?: string | null
          alert_threshold_percent?: number | null
          created_at?: string
          current_month_cost_cents?: number
          current_month_tokens?: number
          id?: string
          monthly_cost_limit_cents?: number | null
          monthly_token_limit?: number | null
          period_start?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          alert_sent_at?: string | null
          alert_threshold_percent?: number | null
          created_at?: string
          current_month_cost_cents?: number
          current_month_tokens?: number
          id?: string
          monthly_cost_limit_cents?: number | null
          monthly_token_limit?: number | null
          period_start?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_limits_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          school_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          school_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          school_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      authorizers: {
        Row: {
          contact_email: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_configs: {
        Row: {
          created_at: string
          description: string | null
          filters: Json | null
          id: string
          is_default: boolean
          is_shared: boolean
          layout_config: Json
          metadata: Json | null
          name: string
          refresh_interval_seconds: number | null
          school_id: string
          slug: string
          updated_at: string
          user_id: string | null
          widget_configs: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout_config?: Json
          metadata?: Json | null
          name: string
          refresh_interval_seconds?: number | null
          school_id: string
          slug: string
          updated_at?: string
          user_id?: string | null
          widget_configs?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout_config?: Json
          metadata?: Json | null
          name?: string
          refresh_interval_seconds?: number | null
          school_id?: string
          slug?: string
          updated_at?: string
          user_id?: string | null
          widget_configs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_configs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          access_token_encrypted: string | null
          connected_at: string | null
          connection_config: Json | null
          created_at: string
          disconnected_at: string | null
          field_mappings: Json | null
          id: string
          is_active: boolean
          last_record_count: number | null
          last_sync_at: string | null
          metadata: Json | null
          name: string
          next_sync_at: string | null
          provider: Database["public"]["Enums"]["data_source_provider"]
          records_synced: number | null
          refresh_token_encrypted: string | null
          school_id: string
          sync_enabled: boolean
          sync_error: string | null
          sync_frequency_hours: number | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          token_expires_at: string | null
          type: Database["public"]["Enums"]["data_source_type"]
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          connected_at?: string | null
          connection_config?: Json | null
          created_at?: string
          disconnected_at?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean
          last_record_count?: number | null
          last_sync_at?: string | null
          metadata?: Json | null
          name: string
          next_sync_at?: string | null
          provider: Database["public"]["Enums"]["data_source_provider"]
          records_synced?: number | null
          refresh_token_encrypted?: string | null
          school_id: string
          sync_enabled?: boolean
          sync_error?: string | null
          sync_frequency_hours?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          token_expires_at?: string | null
          type: Database["public"]["Enums"]["data_source_type"]
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          connected_at?: string | null
          connection_config?: Json | null
          created_at?: string
          disconnected_at?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean
          last_record_count?: number | null
          last_sync_at?: string | null
          metadata?: Json | null
          name?: string
          next_sync_at?: string | null
          provider?: Database["public"]["Enums"]["data_source_provider"]
          records_synced?: number | null
          refresh_token_encrypted?: string | null
          school_id?: string
          sync_enabled?: boolean
          sync_error?: string | null
          sync_frequency_hours?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          token_expires_at?: string | null
          type?: Database["public"]["Enums"]["data_source_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_error: string | null
          delivery_status: string | null
          expires_at: string | null
          file_size_bytes: number | null
          filters: Json | null
          format: string
          generated_at: string
          generated_by: string
          generation_time_ms: number | null
          id: string
          record_count: number | null
          report_type: string
          scheduled_report_id: string | null
          school_id: string
          storage_path: string | null
          title: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          filters?: Json | null
          format: string
          generated_at?: string
          generated_by: string
          generation_time_ms?: number | null
          id?: string
          record_count?: number | null
          report_type: string
          scheduled_report_id?: string | null
          school_id: string
          storage_path?: string | null
          title: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          filters?: Json | null
          format?: string
          generated_at?: string
          generated_by?: string
          generation_time_ms?: number | null
          id?: string
          record_count?: number | null
          report_type?: string
          scheduled_report_id?: string | null
          school_id?: string
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          actual_end_date: string | null
          assigned_to_user_id: string | null
          baseline_value: number | null
          created_at: string
          created_by_user_id: string | null
          current_value: number | null
          description: string | null
          goal: string | null
          id: string
          is_stale: boolean | null
          metadata: Json | null
          outcome_summary: string | null
          priority: Database["public"]["Enums"]["notification_priority"]
          progress_notes: Json | null
          school_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["intervention_status"]
          student_id: string
          success_criteria: string | null
          target_end_date: string | null
          target_value: number | null
          title: string
          type: Database["public"]["Enums"]["intervention_type"]
          updated_at: string
          was_successful: boolean | null
        }
        Insert: {
          actual_end_date?: string | null
          assigned_to_user_id?: string | null
          baseline_value?: number | null
          created_at?: string
          created_by_user_id?: string | null
          current_value?: number | null
          description?: string | null
          goal?: string | null
          id?: string
          is_stale?: boolean | null
          metadata?: Json | null
          outcome_summary?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          progress_notes?: Json | null
          school_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["intervention_status"]
          student_id: string
          success_criteria?: string | null
          target_end_date?: string | null
          target_value?: number | null
          title: string
          type: Database["public"]["Enums"]["intervention_type"]
          updated_at?: string
          was_successful?: boolean | null
        }
        Update: {
          actual_end_date?: string | null
          assigned_to_user_id?: string | null
          baseline_value?: number | null
          created_at?: string
          created_by_user_id?: string | null
          current_value?: number | null
          description?: string | null
          goal?: string | null
          id?: string
          is_stale?: boolean | null
          metadata?: Json | null
          outcome_summary?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          progress_notes?: Json | null
          school_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["intervention_status"]
          student_id?: string
          success_criteria?: string | null
          target_end_date?: string | null
          target_value?: number | null
          title?: string
          type?: Database["public"]["Enums"]["intervention_type"]
          updated_at?: string
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          related_intervention_id: string | null
          related_student_id: string | null
          school_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          related_intervention_id?: string | null
          related_student_id?: string | null
          school_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          related_intervention_id?: string | null
          related_student_id?: string | null
          school_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_intervention_id_fkey"
            columns: ["related_intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_student_id_fkey"
            columns: ["related_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          metadata: Json | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          refunded_at: string | null
          school_id: string
          status: string
          stripe_charge_id: string | null
          stripe_invoice_id: string
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          student_count: number | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          metadata?: Json | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          refunded_at?: string | null
          school_id: string
          status: string
          stripe_charge_id?: string | null
          stripe_invoice_id: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          student_count?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          metadata?: Json | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          refunded_at?: string | null
          school_id?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_invoice_id?: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          student_count?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_progress: {
        Row: {
          bookmarked_at: string | null
          completed_at: string | null
          created_at: string
          current_section: number | null
          id: string
          is_bookmarked: boolean
          is_completed: boolean
          is_started: boolean
          metadata: Json | null
          module_category: Database["public"]["Enums"]["resource_category"]
          module_slug: string
          school_id: string
          sections_completed: number | null
          started_at: string | null
          time_spent_minutes: number | null
          total_sections: number
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          bookmarked_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          id?: string
          is_bookmarked?: boolean
          is_completed?: boolean
          is_started?: boolean
          metadata?: Json | null
          module_category: Database["public"]["Enums"]["resource_category"]
          module_slug: string
          school_id: string
          sections_completed?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          total_sections: number
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          bookmarked_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          id?: string
          is_bookmarked?: boolean
          is_completed?: boolean
          is_started?: boolean
          metadata?: Json | null
          module_category?: Database["public"]["Enums"]["resource_category"]
          module_slug?: string
          school_id?: string
          sections_completed?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          total_sections?: number
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          cooldown_key: string | null
          created_at: string
          data: Json
          evaluation_id: string | null
          id: string
          intervention_id: string | null
          message: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          rule_id: string | null
          school_id: string
          severity: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          cooldown_key?: string | null
          created_at?: string
          data?: Json
          evaluation_id?: string | null
          id?: string
          intervention_id?: string | null
          message: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          rule_id?: string | null
          school_id: string
          severity: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          cooldown_key?: string | null
          created_at?: string
          data?: Json
          evaluation_id?: string | null
          id?: string
          intervention_id?: string | null
          message?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          rule_id?: string | null
          school_id?: string
          severity?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_alerts_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "current_risk_scores"
            referencedColumns: ["evaluation_id"]
          },
          {
            foreignKeyName: "risk_alerts_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "risk_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_alerts_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_alerts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_evaluations: {
        Row: {
          computed_at: string
          confidence_level: number | null
          config_id: string
          created_at: string
          id: string
          level_changed: boolean
          metrics_snapshot: Json
          previous_level: Database["public"]["Enums"]["risk_level"] | null
          recommended_actions: Json | null
          risk_factors: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          school_id: string
          student_id: string
          trajectory: string | null
          trigger_type: string
        }
        Insert: {
          computed_at?: string
          confidence_level?: number | null
          config_id: string
          created_at?: string
          id?: string
          level_changed?: boolean
          metrics_snapshot?: Json
          previous_level?: Database["public"]["Enums"]["risk_level"] | null
          recommended_actions?: Json | null
          risk_factors?: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          school_id: string
          student_id: string
          trajectory?: string | null
          trigger_type?: string
        }
        Update: {
          computed_at?: string
          confidence_level?: number | null
          config_id?: string
          created_at?: string
          id?: string
          level_changed?: boolean
          metrics_snapshot?: Json
          previous_level?: Database["public"]["Enums"]["risk_level"] | null
          recommended_actions?: Json | null
          risk_factors?: Json
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          school_id?: string
          student_id?: string
          trajectory?: string | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_evaluations_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "risk_model_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_evaluations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_model_configs: {
        Row: {
          assessment_floor_pct: number
          assignment_missing_warn: number
          attendance_critical: number
          attendance_floor: number
          behavior_incident_cap: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          threshold_at_risk: number
          threshold_on_track: number
          threshold_watch: number
          trend_decline_threshold: number
          trend_lookback_weeks: number
          updated_at: string
          weight_academic: number
          weight_assignments: number
          weight_attendance: number
          weight_behavior: number
          weight_trend: number
        }
        Insert: {
          assessment_floor_pct?: number
          assignment_missing_warn?: number
          attendance_critical?: number
          attendance_floor?: number
          behavior_incident_cap?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id: string
          threshold_at_risk?: number
          threshold_on_track?: number
          threshold_watch?: number
          trend_decline_threshold?: number
          trend_lookback_weeks?: number
          updated_at?: string
          weight_academic?: number
          weight_assignments?: number
          weight_attendance?: number
          weight_behavior?: number
          weight_trend?: number
        }
        Update: {
          assessment_floor_pct?: number
          assignment_missing_warn?: number
          attendance_critical?: number
          attendance_floor?: number
          behavior_incident_cap?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          threshold_at_risk?: number
          threshold_on_track?: number
          threshold_watch?: number
          trend_decline_threshold?: number
          trend_lookback_weeks?: number
          updated_at?: string
          weight_academic?: number
          weight_assignments?: number
          weight_attendance?: number
          weight_behavior?: number
          weight_trend?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_model_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_model_configs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string
          day_of_month: number | null
          day_of_week: number | null
          filters: Json | null
          format: string
          frequency: string
          id: string
          is_active: boolean
          last_error: string | null
          last_run_at: string | null
          next_run_at: string | null
          options: Json | null
          recipients: Json
          report_type: string
          school_id: string
          time_of_day: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          day_of_month?: number | null
          day_of_week?: number | null
          filters?: Json | null
          format?: string
          frequency: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          options?: Json | null
          recipients?: Json
          report_type: string
          school_id: string
          time_of_day?: string
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          day_of_month?: number | null
          day_of_week?: number | null
          filters?: Json | null
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          options?: Json | null
          recipients?: Json
          report_type?: string
          school_id?: string
          time_of_day?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          department: string | null
          grade_levels: number[] | null
          id: string
          invited_at: string | null
          is_active: boolean
          is_primary: boolean
          role: Database["public"]["Enums"]["school_role"]
          school_id: string
          sis_staff_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          grade_levels?: number[] | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          is_primary?: boolean
          role?: Database["public"]["Enums"]["school_role"]
          school_id: string
          sis_staff_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          grade_levels?: number[] | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          is_primary?: boolean
          role?: Database["public"]["Enums"]["school_role"]
          school_id?: string
          sis_staff_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_year_start_month: number
          accent_color: string
          address: Json | null
          authorizer_id: string | null
          bigquery_dataset_id: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          classlink_tenant_id: string | null
          clever_district_id: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          domain: string | null
          id: string
          is_active: boolean
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          student_count: number
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          academic_year_start_month?: number
          accent_color?: string
          address?: Json | null
          authorizer_id?: string | null
          bigquery_dataset_id?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          classlink_tenant_id?: string | null
          clever_district_id?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          primary_color?: string
          secondary_color?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_count?: number
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_start_month?: number
          accent_color?: string
          address?: Json | null
          authorizer_id?: string | null
          bigquery_dataset_id?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          classlink_tenant_id?: string | null
          clever_district_id?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_count?: number
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_authorizer_id_fkey"
            columns: ["authorizer_id"]
            isOneToOne: false
            referencedRelation: "authorizers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_metric_history: {
        Row: {
          attendance_rate: number | null
          behavior_incident_count: number | null
          created_at: string
          engagement_score: number | null
          gpa_current: number | null
          growth_percentile: number | null
          id: string
          math_assessment_pct: number | null
          missing_assignment_rate: number | null
          proficiency_level: number | null
          reading_assessment_pct: number | null
          school_id: string
          snapshot_date: string
          snapshot_week: number
          snapshot_year: number
          student_id: string
        }
        Insert: {
          attendance_rate?: number | null
          behavior_incident_count?: number | null
          created_at?: string
          engagement_score?: number | null
          gpa_current?: number | null
          growth_percentile?: number | null
          id?: string
          math_assessment_pct?: number | null
          missing_assignment_rate?: number | null
          proficiency_level?: number | null
          reading_assessment_pct?: number | null
          school_id: string
          snapshot_date: string
          snapshot_week: number
          snapshot_year: number
          student_id: string
        }
        Update: {
          attendance_rate?: number | null
          behavior_incident_count?: number | null
          created_at?: string
          engagement_score?: number | null
          gpa_current?: number | null
          growth_percentile?: number | null
          id?: string
          math_assessment_pct?: number | null
          missing_assignment_rate?: number | null
          proficiency_level?: number | null
          reading_assessment_pct?: number | null
          school_id?: string
          snapshot_date?: string
          snapshot_week?: number
          snapshot_year?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_metric_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_metric_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_metrics: {
        Row: {
          assessment_trend: number | null
          assignment_trend: number | null
          attendance_rate: number | null
          attendance_trend: number | null
          behavior_incident_count: number | null
          behavior_incident_trend: number | null
          chronic_absence_flag: boolean | null
          computed_at: string
          created_at: string
          data_completeness: number | null
          days_absent_last_30: number | null
          engagement_score: number | null
          gpa_current: number | null
          gpa_trend: number | null
          growth_percentile: number | null
          id: string
          last_assessment_sync: string | null
          last_lms_sync: string | null
          last_sis_sync: string | null
          math_assessment_pct: number | null
          missing_assignment_rate: number | null
          missing_assignments_count: number | null
          proficiency_level: number | null
          reading_assessment_pct: number | null
          school_id: string
          student_id: string
          suspensions_count: number | null
          total_assignments_count: number | null
          updated_at: string
        }
        Insert: {
          assessment_trend?: number | null
          assignment_trend?: number | null
          attendance_rate?: number | null
          attendance_trend?: number | null
          behavior_incident_count?: number | null
          behavior_incident_trend?: number | null
          chronic_absence_flag?: boolean | null
          computed_at?: string
          created_at?: string
          data_completeness?: number | null
          days_absent_last_30?: number | null
          engagement_score?: number | null
          gpa_current?: number | null
          gpa_trend?: number | null
          growth_percentile?: number | null
          id?: string
          last_assessment_sync?: string | null
          last_lms_sync?: string | null
          last_sis_sync?: string | null
          math_assessment_pct?: number | null
          missing_assignment_rate?: number | null
          missing_assignments_count?: number | null
          proficiency_level?: number | null
          reading_assessment_pct?: number | null
          school_id: string
          student_id: string
          suspensions_count?: number | null
          total_assignments_count?: number | null
          updated_at?: string
        }
        Update: {
          assessment_trend?: number | null
          assignment_trend?: number | null
          attendance_rate?: number | null
          attendance_trend?: number | null
          behavior_incident_count?: number | null
          behavior_incident_trend?: number | null
          chronic_absence_flag?: boolean | null
          computed_at?: string
          created_at?: string
          data_completeness?: number | null
          days_absent_last_30?: number | null
          engagement_score?: number | null
          gpa_current?: number | null
          gpa_trend?: number | null
          growth_percentile?: number | null
          id?: string
          last_assessment_sync?: string | null
          last_lms_sync?: string | null
          last_sis_sync?: string | null
          math_assessment_pct?: number | null
          missing_assignment_rate?: number | null
          missing_assignments_count?: number | null
          proficiency_level?: number | null
          reading_assessment_pct?: number | null
          school_id?: string
          student_id?: string
          suspensions_count?: number | null
          total_assignments_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_metrics_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_metrics_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          attendance_rate: number | null
          counselor: string | null
          created_at: string
          date_of_birth: string | null
          days_absent: number | null
          days_present: number | null
          display_name: string
          enrolled_at: string | null
          ethnicity: string | null
          first_name: string
          gender: string | null
          grade_level: number
          growth_percentile: number | null
          has_504_plan: boolean
          has_iep: boolean
          homeroom_teacher: string | null
          id: string
          is_active: boolean
          is_chronically_absent: boolean | null
          is_english_learner: boolean
          is_free_reduced_lunch: boolean
          is_gifted: boolean
          last_name: string
          math_scores: Json | null
          metadata: Json | null
          proficiency_level: number | null
          purpose_driven_metrics: Json | null
          reading_scores: Json | null
          risk_factors: Json | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          school_id: string
          sis_student_id: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          attendance_rate?: number | null
          counselor?: string | null
          created_at?: string
          date_of_birth?: string | null
          days_absent?: number | null
          days_present?: number | null
          display_name: string
          enrolled_at?: string | null
          ethnicity?: string | null
          first_name: string
          gender?: string | null
          grade_level: number
          growth_percentile?: number | null
          has_504_plan?: boolean
          has_iep?: boolean
          homeroom_teacher?: string | null
          id?: string
          is_active?: boolean
          is_chronically_absent?: boolean | null
          is_english_learner?: boolean
          is_free_reduced_lunch?: boolean
          is_gifted?: boolean
          last_name: string
          math_scores?: Json | null
          metadata?: Json | null
          proficiency_level?: number | null
          purpose_driven_metrics?: Json | null
          reading_scores?: Json | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          school_id: string
          sis_student_id: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          attendance_rate?: number | null
          counselor?: string | null
          created_at?: string
          date_of_birth?: string | null
          days_absent?: number | null
          days_present?: number | null
          display_name?: string
          enrolled_at?: string | null
          ethnicity?: string | null
          first_name?: string
          gender?: string | null
          grade_level?: number
          growth_percentile?: number | null
          has_504_plan?: boolean
          has_iep?: boolean
          homeroom_teacher?: string | null
          id?: string
          is_active?: boolean
          is_chronically_absent?: boolean | null
          is_english_learner?: boolean
          is_free_reduced_lunch?: boolean
          is_gifted?: boolean
          last_name?: string
          math_scores?: Json | null
          metadata?: Json | null
          proficiency_level?: number | null
          purpose_driven_metrics?: Json | null
          reading_scores?: Json | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          school_id?: string
          sis_student_id?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_history: {
        Row: {
          completed_at: string | null
          created_at: string
          data_source_id: string
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          errors: Json | null
          id: string
          records_created: number | null
          records_deleted: number | null
          records_processed: number | null
          records_skipped: number | null
          records_updated: number | null
          school_id: string
          started_at: string
          status: Database["public"]["Enums"]["sync_status"]
          sync_type: string
          triggered_by: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data_source_id: string
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          errors?: Json | null
          id?: string
          records_created?: number | null
          records_deleted?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          records_updated?: number | null
          school_id: string
          started_at: string
          status?: Database["public"]["Enums"]["sync_status"]
          sync_type: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data_source_id?: string
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          errors?: Json | null
          id?: string
          records_created?: number | null
          records_deleted?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          records_updated?: number | null
          school_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["sync_status"]
          sync_type?: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_history_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_history_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          alert_assessment_results: boolean
          alert_attendance_drops: boolean
          alert_critical_students: boolean
          alert_intervention_updates: boolean
          alert_system_updates: boolean
          compact_mode: boolean
          created_at: string
          custom_preferences: Json | null
          date_format: string | null
          default_dashboard: string | null
          digest_frequency: string | null
          email_notifications: boolean
          high_contrast: boolean
          id: string
          number_format: string | null
          push_notifications: boolean
          reduce_motion: boolean
          share_usage_data: boolean
          show_student_photos: boolean
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_assessment_results?: boolean
          alert_attendance_drops?: boolean
          alert_critical_students?: boolean
          alert_intervention_updates?: boolean
          alert_system_updates?: boolean
          compact_mode?: boolean
          created_at?: string
          custom_preferences?: Json | null
          date_format?: string | null
          default_dashboard?: string | null
          digest_frequency?: string | null
          email_notifications?: boolean
          high_contrast?: boolean
          id?: string
          number_format?: string | null
          push_notifications?: boolean
          reduce_motion?: boolean
          share_usage_data?: boolean
          show_student_photos?: boolean
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_assessment_results?: boolean
          alert_attendance_drops?: boolean
          alert_critical_students?: boolean
          alert_intervention_updates?: boolean
          alert_system_updates?: boolean
          compact_mode?: boolean
          created_at?: string
          custom_preferences?: Json | null
          date_format?: string | null
          default_dashboard?: string | null
          digest_frequency?: string | null
          email_notifications?: boolean
          high_contrast?: boolean
          id?: string
          number_format?: string | null
          push_notifications?: boolean
          reduce_motion?: boolean
          share_usage_data?: boolean
          show_student_photos?: boolean
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          clerk_user_id: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          metadata: Json | null
          platform_role: Database["public"]["Enums"]["platform_role"] | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          clerk_user_id: string
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          platform_role?: Database["public"]["Enums"]["platform_role"] | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          clerk_user_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          platform_role?: Database["public"]["Enums"]["platform_role"] | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          result: Json | null
          retry_count: number
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          result?: Json | null
          retry_count?: number
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          result?: Json | null
          retry_count?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_risk_scores: {
        Row: {
          computed_at: string | null
          confidence_level: number | null
          evaluation_id: string | null
          first_name: string | null
          grade_level: number | null
          has_504_plan: boolean | null
          has_iep: boolean | null
          is_chronically_absent: boolean | null
          last_name: string | null
          level_changed: boolean | null
          previous_level: Database["public"]["Enums"]["risk_level"] | null
          recommended_actions: Json | null
          risk_factors: Json | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          school_id: string | null
          student_id: string | null
          student_name: string | null
          trajectory: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_evaluations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ai_usage_monthly: {
        Row: {
          avg_latency_ms: number | null
          feature: string | null
          month: string | null
          provider: string | null
          request_count: number | null
          school_id: string | null
          success_rate: number | null
          total_cost_cents: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_report_summary: {
        Row: {
          avg_generation_ms: number | null
          delivered_count: number | null
          last_generated: string | null
          report_type: string | null
          school_id: string | null
          total_generated: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_next_sync_at: {
        Args: { frequency_hours: number; last_sync?: string }
        Returns: string
      }
      calculate_student_risk_score: {
        Args: {
          p_attendance_rate: number
          p_growth_percentile: number
          p_has_iep: boolean
          p_is_chronically_absent: boolean
          p_is_english_learner: boolean
          p_proficiency_level: number
        }
        Returns: {
          risk_factors: string[]
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
        }[]
      }
      get_school_by_stripe_customer: {
        Args: { customer_id: string }
        Returns: string
      }
      get_school_by_stripe_subscription: {
        Args: { subscription_id: string }
        Returns: string
      }
      get_schools_due_for_sync: {
        Args: never
        Returns: {
          data_source_id: string
          last_sync_at: string
          provider: Database["public"]["Enums"]["data_source_provider"]
          school_id: string
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_school_ids: { Args: { user_uuid: string }; Returns: string[] }
    }
    Enums: {
      data_source_provider:
        | "clever"
        | "classlink"
        | "powerschool"
        | "canvas"
        | "google_classroom"
        | "nwea_map"
        | "iready"
        | "renaissance_star"
        | "custom"
      data_source_type: "sis" | "lms" | "assessment" | "attendance" | "behavior"
      intervention_status: "planned" | "in_progress" | "completed" | "cancelled"
      intervention_type:
        | "academic"
        | "attendance"
        | "behavior"
        | "sel"
        | "family_engagement"
      notification_priority: "low" | "medium" | "high" | "urgent"
      notification_type: "alert" | "insight" | "system" | "action"
      platform_role: "platform_admin" | "support" | "sales"
      resource_category: "data_literacy" | "culture_change" | "implementation"
      risk_level: "on_track" | "watch" | "at_risk" | "critical"
      school_role:
        | "school_admin"
        | "principal"
        | "teacher"
        | "counselor"
        | "data_manager"
        | "viewer"
      subscription_status: "active" | "trialing" | "past_due" | "canceled"
      subscription_tier: "starter" | "pro" | "enterprise"
      sync_status: "pending" | "syncing" | "completed" | "failed"
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
      data_source_provider: [
        "clever",
        "classlink",
        "powerschool",
        "canvas",
        "google_classroom",
        "nwea_map",
        "iready",
        "renaissance_star",
        "custom",
      ],
      data_source_type: ["sis", "lms", "assessment", "attendance", "behavior"],
      intervention_status: ["planned", "in_progress", "completed", "cancelled"],
      intervention_type: [
        "academic",
        "attendance",
        "behavior",
        "sel",
        "family_engagement",
      ],
      notification_priority: ["low", "medium", "high", "urgent"],
      notification_type: ["alert", "insight", "system", "action"],
      platform_role: ["platform_admin", "support", "sales"],
      resource_category: ["data_literacy", "culture_change", "implementation"],
      risk_level: ["on_track", "watch", "at_risk", "critical"],
      school_role: [
        "school_admin",
        "principal",
        "teacher",
        "counselor",
        "data_manager",
        "viewer",
      ],
      subscription_status: ["active", "trialing", "past_due", "canceled"],
      subscription_tier: ["starter", "pro", "enterprise"],
      sync_status: ["pending", "syncing", "completed", "failed"],
    },
  },
} as const

// ============================================================

// ============================================================
// Convenience type aliases (used across codebase)
// ============================================================
export type School = Database['public']['Tables']['schools']['Row'];
export type SchoolInsert = Database['public']['Tables']['schools']['Insert'];
export type SchoolUpdate = Database['public']['Tables']['schools']['Update'];
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type Intervention = Database['public']['Tables']['interventions']['Row'];
export type InterventionInsert = Database['public']['Tables']['interventions']['Insert'];
export type InterventionUpdate = Database['public']['Tables']['interventions']['Update'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type ResourceProgress = Database['public']['Tables']['resource_progress']['Row'];
export type ResourceProgressInsert = Database['public']['Tables']['resource_progress']['Insert'];
export type ResourceProgressUpdate = Database['public']['Tables']['resource_progress']['Update'];
export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row'];
export type WebhookEventInsert = Database['public']['Tables']['webhook_events']['Insert'];
export type DashboardConfig = Database['public']['Tables']['dashboard_configs']['Row'];
export type DashboardConfigInsert = Database['public']['Tables']['dashboard_configs']['Insert'];
export type DashboardConfigUpdate = Database['public']['Tables']['dashboard_configs']['Update'];
