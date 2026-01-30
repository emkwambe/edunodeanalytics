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
