/**
 * EduNode Analytics - Supabase Database Types
 *
 * Auto-generated types for Supabase tables
 * Run `npm run db:generate` to update from live schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          name: string;
          legal_name: string | null;
          domain: string | null;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          subscription_tier: 'starter' | 'pro' | 'enterprise';
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled';
          trial_ends_at: string | null;
          bigquery_dataset_id: string | null;
          clever_district_id: string | null;
          classlink_tenant_id: string | null;
          timezone: string;
          academic_year_start_month: number;
          contact_email: string;
          contact_phone: string | null;
          address: Json | null;
          authorizer_id: string | null;
          is_active: boolean;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug: string;
          name: string;
          legal_name?: string | null;
          domain?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          subscription_tier?: 'starter' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
          trial_ends_at?: string | null;
          bigquery_dataset_id?: string | null;
          clever_district_id?: string | null;
          classlink_tenant_id?: string | null;
          timezone?: string;
          academic_year_start_month?: number;
          contact_email: string;
          contact_phone?: string | null;
          address?: Json | null;
          authorizer_id?: string | null;
          is_active?: boolean;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug?: string;
          name?: string;
          legal_name?: string | null;
          domain?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          subscription_tier?: 'starter' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
          trial_ends_at?: string | null;
          bigquery_dataset_id?: string | null;
          clever_district_id?: string | null;
          classlink_tenant_id?: string | null;
          timezone?: string;
          academic_year_start_month?: number;
          contact_email?: string;
          contact_phone?: string | null;
          address?: Json | null;
          authorizer_id?: string | null;
          is_active?: boolean;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'schools_authorizer_id_fkey';
            columns: ['authorizer_id'];
            referencedRelation: 'authorizers';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          clerk_user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          platform_role: 'platform_admin' | 'support' | 'sales' | null;
          is_active: boolean;
          last_login_at: string | null;
          preferences: Json | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          clerk_user_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          platform_role?: 'platform_admin' | 'support' | 'sales' | null;
          is_active?: boolean;
          last_login_at?: string | null;
          preferences?: Json | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          clerk_user_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          platform_role?: 'platform_admin' | 'support' | 'sales' | null;
          is_active?: boolean;
          last_login_at?: string | null;
          preferences?: Json | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      school_memberships: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          school_id: string;
          role: 'school_admin' | 'principal' | 'teacher' | 'counselor' | 'data_manager' | 'viewer';
          is_primary: boolean;
          sis_staff_id: string | null;
          department: string | null;
          grade_levels: number[] | null;
          is_active: boolean;
          invited_at: string | null;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          school_id: string;
          role?: 'school_admin' | 'principal' | 'teacher' | 'counselor' | 'data_manager' | 'viewer';
          is_primary?: boolean;
          sis_staff_id?: string | null;
          department?: string | null;
          grade_levels?: number[] | null;
          is_active?: boolean;
          invited_at?: string | null;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          school_id?: string;
          role?: 'school_admin' | 'principal' | 'teacher' | 'counselor' | 'data_manager' | 'viewer';
          is_primary?: boolean;
          sis_staff_id?: string | null;
          department?: string | null;
          grade_levels?: number[] | null;
          is_active?: boolean;
          invited_at?: string | null;
          accepted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'school_memberships_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'school_memberships_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          }
        ];
      };
      dashboard_configs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          school_id: string;
          user_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          is_default: boolean;
          is_shared: boolean;
          layout_config: Json;
          widget_configs: Json;
          filters: Json | null;
          refresh_interval_seconds: number | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id: string;
          user_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          is_default?: boolean;
          is_shared?: boolean;
          layout_config?: Json;
          widget_configs?: Json;
          filters?: Json | null;
          refresh_interval_seconds?: number | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          is_default?: boolean;
          is_shared?: boolean;
          layout_config?: Json;
          widget_configs?: Json;
          filters?: Json | null;
          refresh_interval_seconds?: number | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboard_configs_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_configs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      authorizers: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          contact_email: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          slug: string;
          contact_email: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          slug?: string;
          contact_email?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          created_at: string;
          school_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          school_id?: string | null;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          school_id?: string | null;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      students: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          school_id: string;
          sis_student_id: string;
          first_name: string;
          last_name: string;
          display_name: string;
          grade_level: number;
          date_of_birth: string | null;
          gender: string | null;
          ethnicity: string | null;
          has_iep: boolean;
          has_504_plan: boolean;
          is_english_learner: boolean;
          is_gifted: boolean;
          is_free_reduced_lunch: boolean;
          homeroom_teacher: string | null;
          counselor: string | null;
          attendance_rate: number | null;
          days_present: number;
          days_absent: number;
          is_chronically_absent: boolean;
          proficiency_level: number | null;
          growth_percentile: number | null;
          risk_level: 'on_track' | 'at_risk' | 'critical';
          risk_score: number;
          risk_factors: Json | null;
          reading_scores: Json | null;
          math_scores: Json | null;
          purpose_driven_metrics: Json | null;
          is_active: boolean;
          enrolled_at: string | null;
          withdrawn_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id: string;
          sis_student_id: string;
          first_name: string;
          last_name: string;
          display_name: string;
          grade_level: number;
          date_of_birth?: string | null;
          gender?: string | null;
          ethnicity?: string | null;
          has_iep?: boolean;
          has_504_plan?: boolean;
          is_english_learner?: boolean;
          is_gifted?: boolean;
          is_free_reduced_lunch?: boolean;
          homeroom_teacher?: string | null;
          counselor?: string | null;
          attendance_rate?: number | null;
          days_present?: number;
          days_absent?: number;
          is_chronically_absent?: boolean;
          proficiency_level?: number | null;
          growth_percentile?: number | null;
          risk_level?: 'on_track' | 'at_risk' | 'critical';
          risk_score?: number;
          risk_factors?: Json | null;
          reading_scores?: Json | null;
          math_scores?: Json | null;
          purpose_driven_metrics?: Json | null;
          is_active?: boolean;
          enrolled_at?: string | null;
          withdrawn_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id?: string;
          sis_student_id?: string;
          first_name?: string;
          last_name?: string;
          display_name?: string;
          grade_level?: number;
          date_of_birth?: string | null;
          gender?: string | null;
          ethnicity?: string | null;
          has_iep?: boolean;
          has_504_plan?: boolean;
          is_english_learner?: boolean;
          is_gifted?: boolean;
          is_free_reduced_lunch?: boolean;
          homeroom_teacher?: string | null;
          counselor?: string | null;
          attendance_rate?: number | null;
          days_present?: number;
          days_absent?: number;
          is_chronically_absent?: boolean;
          proficiency_level?: number | null;
          growth_percentile?: number | null;
          risk_level?: 'on_track' | 'at_risk' | 'critical';
          risk_score?: number;
          risk_factors?: Json | null;
          reading_scores?: Json | null;
          math_scores?: Json | null;
          purpose_driven_metrics?: Json | null;
          is_active?: boolean;
          enrolled_at?: string | null;
          withdrawn_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'students_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          }
        ];
      };
      interventions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          school_id: string;
          student_id: string;
          created_by_user_id: string | null;
          assigned_to_user_id: string | null;
          type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
          title: string;
          description: string | null;
          status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          start_date: string | null;
          target_end_date: string | null;
          actual_end_date: string | null;
          goal: string | null;
          success_criteria: string | null;
          baseline_value: number | null;
          target_value: number | null;
          current_value: number | null;
          progress_notes: Json | null;
          outcome_summary: string | null;
          was_successful: boolean | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id: string;
          student_id: string;
          created_by_user_id?: string | null;
          assigned_to_user_id?: string | null;
          type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
          title: string;
          description?: string | null;
          status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          goal?: string | null;
          success_criteria?: string | null;
          baseline_value?: number | null;
          target_value?: number | null;
          current_value?: number | null;
          progress_notes?: Json | null;
          outcome_summary?: string | null;
          was_successful?: boolean | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id?: string;
          student_id?: string;
          created_by_user_id?: string | null;
          assigned_to_user_id?: string | null;
          type?: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
          title?: string;
          description?: string | null;
          status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          goal?: string | null;
          success_criteria?: string | null;
          baseline_value?: number | null;
          target_value?: number | null;
          current_value?: number | null;
          progress_notes?: Json | null;
          outcome_summary?: string | null;
          was_successful?: boolean | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'interventions_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interventions_student_id_fkey';
            columns: ['student_id'];
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interventions_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interventions_assigned_to_user_id_fkey';
            columns: ['assigned_to_user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      data_sources: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          school_id: string;
          name: string;
          type: 'sis' | 'lms' | 'assessment' | 'attendance' | 'behavior';
          provider: 'clever' | 'classlink' | 'powerschool' | 'canvas' | 'google_classroom' | 'nwea_map' | 'iready' | 'renaissance_star' | 'custom';
          connection_config: Json | null;
          sync_enabled: boolean;
          sync_frequency_hours: number;
          last_sync_at: string | null;
          next_sync_at: string | null;
          sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
          sync_error: string | null;
          field_mappings: Json | null;
          records_synced: number;
          last_record_count: number;
          is_active: boolean;
          connected_at: string | null;
          disconnected_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id: string;
          name: string;
          type: 'sis' | 'lms' | 'assessment' | 'attendance' | 'behavior';
          provider: 'clever' | 'classlink' | 'powerschool' | 'canvas' | 'google_classroom' | 'nwea_map' | 'iready' | 'renaissance_star' | 'custom';
          connection_config?: Json | null;
          sync_enabled?: boolean;
          sync_frequency_hours?: number;
          last_sync_at?: string | null;
          next_sync_at?: string | null;
          sync_status?: 'pending' | 'syncing' | 'completed' | 'failed';
          sync_error?: string | null;
          field_mappings?: Json | null;
          records_synced?: number;
          last_record_count?: number;
          is_active?: boolean;
          connected_at?: string | null;
          disconnected_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          school_id?: string;
          name?: string;
          type?: 'sis' | 'lms' | 'assessment' | 'attendance' | 'behavior';
          provider?: 'clever' | 'classlink' | 'powerschool' | 'canvas' | 'google_classroom' | 'nwea_map' | 'iready' | 'renaissance_star' | 'custom';
          connection_config?: Json | null;
          sync_enabled?: boolean;
          sync_frequency_hours?: number;
          last_sync_at?: string | null;
          next_sync_at?: string | null;
          sync_status?: 'pending' | 'syncing' | 'completed' | 'failed';
          sync_error?: string | null;
          field_mappings?: Json | null;
          records_synced?: number;
          last_record_count?: number;
          is_active?: boolean;
          connected_at?: string | null;
          disconnected_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'data_sources_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          created_at: string;
          school_id: string;
          user_id: string;
          type: 'alert' | 'insight' | 'system' | 'action';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          title: string;
          message: string;
          action_url: string | null;
          action_label: string | null;
          related_student_id: string | null;
          related_intervention_id: string | null;
          is_read: boolean;
          read_at: string | null;
          is_dismissed: boolean;
          dismissed_at: string | null;
          expires_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          school_id: string;
          user_id: string;
          type: 'alert' | 'insight' | 'system' | 'action';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          title: string;
          message: string;
          action_url?: string | null;
          action_label?: string | null;
          related_student_id?: string | null;
          related_intervention_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          is_dismissed?: boolean;
          dismissed_at?: string | null;
          expires_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          school_id?: string;
          user_id?: string;
          type?: 'alert' | 'insight' | 'system' | 'action';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          title?: string;
          message?: string;
          action_url?: string | null;
          action_label?: string | null;
          related_student_id?: string | null;
          related_intervention_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          is_dismissed?: boolean;
          dismissed_at?: string | null;
          expires_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_student_id_fkey';
            columns: ['related_student_id'];
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_related_intervention_id_fkey';
            columns: ['related_intervention_id'];
            referencedRelation: 'interventions';
            referencedColumns: ['id'];
          }
        ];
      };
      resource_progress: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          school_id: string;
          module_slug: string;
          module_category: 'data_literacy' | 'culture_change' | 'implementation';
          is_started: boolean;
          started_at: string | null;
          is_completed: boolean;
          completed_at: string | null;
          sections_completed: number;
          total_sections: number;
          current_section: number;
          time_spent_minutes: number;
          is_bookmarked: boolean;
          bookmarked_at: string | null;
          user_notes: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          school_id: string;
          module_slug: string;
          module_category: 'data_literacy' | 'culture_change' | 'implementation';
          is_started?: boolean;
          started_at?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          sections_completed?: number;
          total_sections: number;
          current_section?: number;
          time_spent_minutes?: number;
          is_bookmarked?: boolean;
          bookmarked_at?: string | null;
          user_notes?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          school_id?: string;
          module_slug?: string;
          module_category?: 'data_literacy' | 'culture_change' | 'implementation';
          is_started?: boolean;
          started_at?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          sections_completed?: number;
          total_sections?: number;
          current_section?: number;
          time_spent_minutes?: number;
          is_bookmarked?: boolean;
          bookmarked_at?: string | null;
          user_notes?: string | null;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_progress_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resource_progress_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          }
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          digest_frequency: string;
          alert_critical_students: boolean;
          alert_attendance_drops: boolean;
          alert_assessment_results: boolean;
          alert_intervention_updates: boolean;
          alert_system_updates: boolean;
          theme: string;
          compact_mode: boolean;
          show_student_photos: boolean;
          default_dashboard: string | null;
          date_format: string;
          number_format: string;
          reduce_motion: boolean;
          high_contrast: boolean;
          share_usage_data: boolean;
          custom_preferences: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          digest_frequency?: string;
          alert_critical_students?: boolean;
          alert_attendance_drops?: boolean;
          alert_assessment_results?: boolean;
          alert_intervention_updates?: boolean;
          alert_system_updates?: boolean;
          theme?: string;
          compact_mode?: boolean;
          show_student_photos?: boolean;
          default_dashboard?: string | null;
          date_format?: string;
          number_format?: string;
          reduce_motion?: boolean;
          high_contrast?: boolean;
          share_usage_data?: boolean;
          custom_preferences?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          digest_frequency?: string;
          alert_critical_students?: boolean;
          alert_attendance_drops?: boolean;
          alert_assessment_results?: boolean;
          alert_intervention_updates?: boolean;
          alert_system_updates?: boolean;
          theme?: string;
          compact_mode?: boolean;
          show_student_photos?: boolean;
          default_dashboard?: string | null;
          date_format?: string;
          number_format?: string;
          reduce_motion?: boolean;
          high_contrast?: boolean;
          share_usage_data?: boolean;
          custom_preferences?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: 'starter' | 'pro' | 'enterprise';
      subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled';
      school_role: 'school_admin' | 'principal' | 'teacher' | 'counselor' | 'data_manager' | 'viewer';
      platform_role: 'platform_admin' | 'support' | 'sales';
      risk_level: 'on_track' | 'at_risk' | 'critical';
      intervention_status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
      intervention_type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
      data_source_type: 'sis' | 'lms' | 'assessment' | 'attendance' | 'behavior';
      data_source_provider: 'clever' | 'classlink' | 'powerschool' | 'canvas' | 'google_classroom' | 'nwea_map' | 'iready' | 'renaissance_star' | 'custom';
      sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
      notification_type: 'alert' | 'insight' | 'system' | 'action';
      notification_priority: 'low' | 'medium' | 'high' | 'urgent';
      resource_category: 'data_literacy' | 'culture_change' | 'implementation';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier access
export type School = Database['public']['Tables']['schools']['Row'];
export type SchoolInsert = Database['public']['Tables']['schools']['Insert'];
export type SchoolUpdate = Database['public']['Tables']['schools']['Update'];

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type SchoolMembership = Database['public']['Tables']['school_memberships']['Row'];
export type SchoolMembershipInsert = Database['public']['Tables']['school_memberships']['Insert'];
export type SchoolMembershipUpdate = Database['public']['Tables']['school_memberships']['Update'];

export type DashboardConfig = Database['public']['Tables']['dashboard_configs']['Row'];
export type DashboardConfigInsert = Database['public']['Tables']['dashboard_configs']['Insert'];
export type DashboardConfigUpdate = Database['public']['Tables']['dashboard_configs']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

export type Intervention = Database['public']['Tables']['interventions']['Row'];
export type InterventionInsert = Database['public']['Tables']['interventions']['Insert'];
export type InterventionUpdate = Database['public']['Tables']['interventions']['Update'];

export type DataSource = Database['public']['Tables']['data_sources']['Row'];
export type DataSourceInsert = Database['public']['Tables']['data_sources']['Insert'];
export type DataSourceUpdate = Database['public']['Tables']['data_sources']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type ResourceProgress = Database['public']['Tables']['resource_progress']['Row'];
export type ResourceProgressInsert = Database['public']['Tables']['resource_progress']['Insert'];
export type ResourceProgressUpdate = Database['public']['Tables']['resource_progress']['Update'];

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];
