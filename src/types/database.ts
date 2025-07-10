export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      mt_companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          settings: Json;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          settings?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          settings?: Json;
        };
      };
      mt_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'employee';
          company_id: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'employee';
          company_id: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'employee';
          company_id?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mt_vehicles: {
        Row: {
          id: string;
          company_id: string;
          make: string;
          model: string;
          year: number;
          vin: string | null;
          license_plate: string | null;
          current_mileage: number;
          asset_value: number | null;
          purchase_date: string | null;
          purchase_price: number | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          make: string;
          model: string;
          year: number;
          vin?: string | null;
          license_plate?: string | null;
          current_mileage: number;
          asset_value?: number | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          make?: string;
          model?: string;
          year?: number;
          vin?: string | null;
          license_plate?: string | null;
          current_mileage?: number;
          asset_value?: number | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mt_maintenance_types: {
        Row: {
          id: string;
          name: string;
          is_custom: boolean;
          company_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_custom?: boolean;
          company_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_custom?: boolean;
          company_id?: string | null;
          created_at?: string;
        };
      };
      mt_maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string;
          mileage: number;
          type_id: string | null;
          custom_type: string | null;
          description: string | null;
          cost: number | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          user_id: string;
          mileage: number;
          type_id?: string | null;
          custom_type?: string | null;
          description?: string | null;
          cost?: number | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          user_id?: string;
          mileage?: number;
          type_id?: string | null;
          custom_type?: string | null;
          description?: string | null;
          cost?: number | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mt_maintenance_images: {
        Row: {
          id: string;
          maintenance_id: string;
          url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          maintenance_id: string;
          url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          maintenance_id?: string;
          url?: string;
          caption?: string | null;
          created_at?: string;
        };
      };
      mt_maintenance_recommendations: {
        Row: {
          id: string;
          maintenance_id: string;
          description: string;
          recommended_date: string | null;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          maintenance_id: string;
          description: string;
          recommended_date?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          maintenance_id?: string;
          description?: string;
          recommended_date?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      mt_reminders: {
        Row: {
          id: string;
          recommendation_id: string;
          user_id: string;
          reminder_date: string;
          is_sent: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          user_id: string;
          reminder_date: string;
          is_sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          user_id?: string;
          reminder_date?: string;
          is_sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      mt_reminder_rules: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string | null;
          maintenance_type_id: string | null;
          custom_type: string | null;
          rule_name: string;
          description: string | null;
          is_active: boolean;
          trigger_type:
            | 'mileage_interval'
            | 'time_interval'
            | 'mileage_since_last'
            | 'time_since_last';
          mileage_interval: number | null;
          mileage_threshold: number | null;
          time_interval_days: number | null;
          time_threshold_days: number | null;
          lead_time_days: number;
          priority: 'low' | 'medium' | 'high' | 'critical';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vehicle_id?: string | null;
          maintenance_type_id?: string | null;
          custom_type?: string | null;
          rule_name: string;
          description?: string | null;
          is_active?: boolean;
          trigger_type:
            | 'mileage_interval'
            | 'time_interval'
            | 'mileage_since_last'
            | 'time_since_last';
          mileage_interval?: number | null;
          mileage_threshold?: number | null;
          time_interval_days?: number | null;
          time_threshold_days?: number | null;
          lead_time_days?: number;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          vehicle_id?: string | null;
          maintenance_type_id?: string | null;
          custom_type?: string | null;
          rule_name?: string;
          description?: string | null;
          is_active?: boolean;
          trigger_type?:
            | 'mileage_interval'
            | 'time_interval'
            | 'mileage_since_last'
            | 'time_since_last';
          mileage_interval?: number | null;
          mileage_threshold?: number | null;
          time_interval_days?: number | null;
          time_threshold_days?: number | null;
          lead_time_days?: number;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
          updated_at?: string;
        };
      };
      mt_active_reminders: {
        Row: {
          id: string;
          reminder_rule_id: string;
          vehicle_id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical';
          due_date: string | null;
          current_mileage: number | null;
          target_mileage: number | null;
          status: 'active' | 'completed' | 'dismissed' | 'snoozed';
          completed_at: string | null;
          dismissed_at: string | null;
          snoozed_until: string | null;
          completed_maintenance_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reminder_rule_id: string;
          vehicle_id: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          due_date?: string | null;
          current_mileage?: number | null;
          target_mileage?: number | null;
          status?: 'active' | 'completed' | 'dismissed' | 'snoozed';
          completed_at?: string | null;
          dismissed_at?: string | null;
          snoozed_until?: string | null;
          completed_maintenance_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reminder_rule_id?: string;
          vehicle_id?: string;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          due_date?: string | null;
          current_mileage?: number | null;
          target_mileage?: number | null;
          status?: 'active' | 'completed' | 'dismissed' | 'snoozed';
          completed_at?: string | null;
          dismissed_at?: string | null;
          snoozed_until?: string | null;
          completed_maintenance_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin' | 'employee';
    };
  };
};
