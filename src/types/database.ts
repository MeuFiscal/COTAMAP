import type { UserRole } from "@/types/auth";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      quote_requests: {
        Row: QuoteRequestRow;
        Insert: QuoteRequestInsert;
        Update: Partial<QuoteRequestInsert>;
        Relationships: [];
      };
      quote_request_images: {
        Row: QuoteRequestImageRow;
        Insert: QuoteRequestImageInsert;
        Update: Partial<QuoteRequestImageInsert>;
        Relationships: [];
      };
      quote_request_items: { Row: QuoteRequestItemRow; Insert: Record<string, never>; Update: Partial<QuoteRequestItemRow>; Relationships: [] };
      quote_notifications: {
        Row: QuoteNotificationRow;
        Insert: QuoteNotificationInsert;
        Update: Partial<QuoteNotificationInsert>;
        Relationships: [];
      };
      quotations: {
        Row: QuotationRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      quotation_items: { Row: QuotationItemRow; Insert: Record<string, never>; Update: Partial<QuotationItemRow>; Relationships: [] };
      businesses: {
        Row: BusinessRow;
        Insert: Record<string, never>;
        Update: { latitude?: number | null; longitude?: number | null };
        Relationships: [];
      };
      business_employees: {
        Row: { id: string; business_id: string; profile_id: string; role: UserRole; is_active: boolean; hired_at: string | null; pin_hash: string | null; last_access_at: string | null; last_activity_at: string | null; presence_status: "online" | "away" | "offline"; deleted_at: string | null; created_at: string };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      orders: {
        Row: { id: string; quotation_id: string; status: "pending" | "preparing" | "ready" | "completed" | "cancelled"; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      order_items: { Row: OrderItemRow; Insert: Record<string, never>; Update: Partial<OrderItemRow>; Relationships: [] };
      quotation_images: {
        Row: { id: string; quotation_id: string; storage_path: string; file_name: string | null; mime_type: string | null; size_bytes: number | null; position: number; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      notification_center: {
        Row: { id: string; recipient_profile_id: string; type: string; title: string; message: string; entity_type: string | null; entity_id: string | null; read_at: string | null; realtime_sent_at: string | null; push_sent_at: string | null; created_at: string; updated_at: string; deleted_at: string | null };
        Insert: Record<string, never>; Update: Record<string, never>; Relationships: [];
      };
      saas_plans: { Row: { id: string; code: string; name: string; description: string; price: number; promotional_price: number | null; promotion_starts_at: string | null; promotion_ends_at: string | null; daily_quote_limit: number | null; is_unlimited: boolean; benefits: string[]; provider: string | null; provider_product_id: string | null; provider_offer_id: string | null; provider_checkout_id: string | null; provider_checkout_url: string | null; is_public: boolean; is_default_free: boolean; sort_order: number; is_active: boolean; created_at: string; updated_at: string }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      saas_features: { Row: { id: string; key: string; description: string }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      saas_plan_features: { Row: { plan_id: string; feature_id: string; enabled: boolean }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      business_subscriptions: { Row: { business_id: string; plan_id: string; status: string; activated_at: string; changed_at: string; provider: string | null; provider_subscription_id: string | null; provider_order_id: string | null; provider_product_id: string | null; provider_offer_id: string | null; provider_status: string | null; provider_event_at: string | null; cancellation_requested_at: string | null; current_period_end: string | null }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      business_provider_subscriptions: { Row: { id: string; business_id: string; plan_id: string; provider: string; provider_subscription_id: string; provider_order_id: string | null; provider_product_id: string; provider_offer_id: string; provider_status: string; provider_event_at: string | null; is_current: boolean; was_activated: boolean; cancellation_status: string; cancellation_attempts: number; cancellation_requested_at: string | null; cancellation_last_attempt_at: string | null; cancellation_sent_at: string | null; cancellation_completed_at: string | null; cancellation_error: string | null; current_period_end: string | null; expired_at: string | null; created_at: string; updated_at: string }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      saas_daily_usage: { Row: { business_id: string; usage_date: string; quotes_received: number }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      saas_checkouts: { Row: { id: string; name: string; url: string; description: string | null; is_active: boolean; display_order: number; deleted_at: string | null }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      push_devices: { Row: { id: string; profile_id: string; token: string; platform: string; active: boolean; last_seen_at: string; created_at: string; updated_at: string; deleted_at: string | null }; Insert: { profile_id: string; token: string; platform: string; active?: boolean; last_seen_at?: string; deleted_at?: string | null }; Update: { active?: boolean; last_seen_at?: string; deleted_at?: string | null }; Relationships: [] };
      platform_admins: { Row: { id: string; email: string; active: boolean; created_at: string }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
      audit_logs: { Row: { id: string; actor_profile_id: string | null; entity_type: string; entity_id: string | null; action: string; created_at: string }; Insert: Record<string, never>; Update: Record<string, never>; Relationships: [] };
    };
    Views: Record<never, never>;
    Functions: { verify_employee_pin: { Args: { target_employee_id: string; submitted_pin: string }; Returns: boolean }; set_my_business_availability: { Args: { p_is_available: boolean }; Returns: boolean }; mark_notification_read: { Args: { target_id: string }; Returns: Database["public"]["Tables"]["notification_center"]["Row"] }; mark_all_notifications_read: { Args: Record<never, never>; Returns: number }; delete_notification: { Args: { target_id: string }; Returns: boolean } };
    Enums: { user_role: UserRole; quote_status: QuoteStatus; quotation_status: QuotationStatus; notification_status: NotificationStatus };
    CompositeTypes: Record<never, never>;
  };
};

export type QuoteStatus = "waiting" | "accepted" | "expired" | "cancelled" | "finished";
export type QuotationStatus = "pending" | "sent" | "accepted" | "rejected" | "expired";
export type NotificationStatus = "pending" | "sent" | "responded" | "rejected" | "ignored" | "expired" | "cancelled";

export type QuoteRequestRow = {
  id: string;
  customer_id: string;
  business_category_id: string | null;
  part_name: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_engine: string | null;
  observation: string | null;
  description: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  status: QuoteStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type QuoteRequestInsert = Omit<QuoteRequestRow, "id" | "created_at" | "updated_at" | "deleted_at" | "status"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  status?: QuoteStatus;
};

export type QuoteRequestImageRow = {
  id: string;
  quote_request_id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type QuoteRequestImageInsert = Omit<QuoteRequestImageRow, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string; created_at?: string; updated_at?: string; deleted_at?: string | null };
export type QuoteRequestItemRow = { id: string; quote_request_id: string; position: number; name: string; brand: string | null; quantity: number; unit: string | null; notes: string | null; created_at: string; updated_at: string };
export type QuotationItemRow = { id: string; quotation_id: string; quote_request_item_id: string; available: boolean; unit_price: number; quantity_available: number | null; notes: string | null; created_at: string; updated_at: string };
export type OrderItemRow = { id: string; order_id: string; quotation_item_id: string | null; name: string; quantity: number; unit_price: number; subtotal: number; created_at: string };

export type QuoteNotificationRow = {
  id: string;
  quote_request_id: string;
  business_id: string;
  recipient_profile_id: string | null;
  sent_at: string | null;
  read_at: string | null;
  status: NotificationStatus;
  dispatch_order: number | null;
  distance_meters: number | null;
  expires_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type QuoteNotificationInsert = Omit<QuoteNotificationRow, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string; created_at?: string; updated_at?: string; deleted_at?: string | null };

export type BusinessRow = { id: string; name: string; logo_url: string | null; phone?: string | null; whatsapp?: string | null; address_line: string | null; address_number?: string | null; city: string | null; state: string | null; opening_hours: Record<string, unknown>; latitude: number | null; longitude: number | null; location_accuracy?: number | null; location_captured_at?: string | null; is_available_for_requests: boolean; availability_updated_at: string | null; status: "active" | "inactive" | "blocked"; updated_at: string };
export type QuotationRow = { id: string; quote_request_id: string; business_id: string; submitted_by_profile_id: string | null; amount: number; brand: string | null; notes: string | null; status: QuotationStatus; response_time_seconds: number | null; expires_at: string | null; created_at: string; business?: BusinessRow; items?: QuotationItemRow[] };
