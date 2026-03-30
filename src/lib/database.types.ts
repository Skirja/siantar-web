export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      distance_matrix: {
        Row: {
          distance_km: number;
          from_village: string;
          id: string;
          to_village: string;
        };
        Insert: {
          distance_km: number;
          from_village: string;
          id?: string;
          to_village: string;
        };
        Update: {
          distance_km?: number;
          from_village?: string;
          id?: string;
          to_village?: string;
        };
        Relationships: [];
      };
      fee_settings: {
        Row: {
          description: string | null;
          id: string;
          key: string;
          updated_at: string;
          value: number;
        };
        Insert: {
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string;
          value: number;
        };
        Update: {
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string;
          value?: number;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          item_total: number;
          name: string;
          order_id: string;
          price: number;
          product_id: string | null;
          quantity: number;
          selected_extras: string[] | null;
          selected_variant: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_total: number;
          name: string;
          order_id: string;
          price: number;
          product_id?: string | null;
          quantity?: number;
          selected_extras?: string[] | null;
          selected_variant?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_total?: number;
          name?: string;
          order_id?: string;
          price?: number;
          product_id?: string | null;
          quantity?: number;
          selected_extras?: string[] | null;
          selected_variant?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          order_id: string;
          status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          order_id: string;
          status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          order_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          address: string;
          admin_fee: number;
          charged_distance: number;
          created_at: string;
          customer_name: string;
          customer_phone: string;
          customer_village: string;
          delivery_data: Json | null;
          delivery_fee: number;
          distance: number;
          driver_id: string | null;
          driver_name: string | null;
          final_payment_amount: number | null;
          id: string;
          is_delivery_service: boolean;
          is_manual_order: boolean;
          outlet_id: string;
          outlet_name: string;
          payment_method: string;
          payment_proof_url: string | null;
          payment_provider: string | null;
          payment_status: string | null;
          service_fee: number;
          status: string;
          subtotal: number;
          total: number;
          unique_payment_code: number | null;
          updated_at: string;
        };
        Insert: {
          address: string;
          admin_fee?: number;
          charged_distance: number;
          created_at?: string;
          customer_name: string;
          customer_phone: string;
          customer_village: string;
          delivery_data?: Json | null;
          delivery_fee: number;
          distance: number;
          driver_id?: string | null;
          driver_name?: string | null;
          final_payment_amount?: number | null;
          id: string;
          is_delivery_service?: boolean;
          is_manual_order?: boolean;
          outlet_id: string;
          outlet_name: string;
          payment_method: string;
          payment_proof_url?: string | null;
          payment_provider?: string | null;
          payment_status?: string | null;
          service_fee: number;
          status?: string;
          subtotal: number;
          total: number;
          unique_payment_code?: number | null;
          updated_at?: string;
        };
        Update: {
          address?: string;
          admin_fee?: number;
          charged_distance?: number;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_village?: string;
          delivery_data?: Json | null;
          delivery_fee?: number;
          distance?: number;
          driver_id?: string | null;
          driver_name?: string | null;
          final_payment_amount?: number | null;
          id?: string;
          is_delivery_service?: boolean;
          is_manual_order?: boolean;
          outlet_id?: string;
          outlet_name?: string;
          payment_method?: string;
          payment_proof_url?: string | null;
          payment_provider?: string | null;
          payment_status?: string | null;
          service_fee?: number;
          status?: string;
          subtotal?: number;
          total?: number;
          unique_payment_code?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_outlet_id_fkey";
            columns: ["outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["id"];
          }
        ];
      };
      outlets: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          updated_at: string;
          village: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          updated_at?: string;
          village: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
          village?: string;
        };
        Relationships: [];
      };
      payment_accounts: {
        Row: {
          account_name: string;
          account_number: string;
          created_at: string;
          id: string;
          is_active: boolean;
          provider: string;
          updated_at: string;
        };
        Insert: {
          account_name: string;
          account_number: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          provider: string;
          updated_at?: string;
        };
        Update: {
          account_name?: string;
          account_number?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_extras: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          price: number;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          price?: number;
          product_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          price?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_extras_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          price_adjustment: number;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          price_adjustment?: number;
          product_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          price_adjustment?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          discount_price: number | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          outlet_id: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          discount_price?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name: string;
          outlet_id: string;
          price: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          discount_price?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name?: string;
          outlet_id?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_outlet_id_fkey";
            columns: ["outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          phone: string | null;
          role: string;
          updated_at: string;
          village: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_active?: boolean;
          name: string;
          phone?: string | null;
          role: string;
          updated_at?: string;
          village?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
          village?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Row"];

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Insert"];

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Update"];
