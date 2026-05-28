export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          preferred_language: string
          preferred_model_id: string | null
          extension_settings: any
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_language?: string
          preferred_model_id?: string | null
          extension_settings?: any
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_language?: string
          preferred_model_id?: string | null
          extension_settings?: any
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          currency: string
          billing_cycle: string
          tokens_per_month: number
          max_requests_per_day: number | null
          features: any
          allowed_models: any
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          currency?: string
          billing_cycle: string
          tokens_per_month: number
          max_requests_per_day?: number | null
          features?: any
          allowed_models?: any
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          currency?: string
          billing_cycle?: string
          tokens_per_month?: number
          max_requests_per_day?: number | null
          features?: any
          allowed_models?: any
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          tokens_remaining: number
          cancel_at_period_end: boolean
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: string
          current_period_start: string
          current_period_end: string
          tokens_remaining: number
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          tokens_remaining?: number
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      token_transactions: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          transaction_type: string
          amount: number
          balance_after: number
          model_id: string | null
          description: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          transaction_type: string
          amount: number
          balance_after: number
          model_id?: string | null
          description?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          transaction_type?: string
          amount?: number
          balance_after?: number
          model_id?: string | null
          description?: string | null
          metadata?: any
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          permissions: any
          rate_limit_per_minute: number
          is_active: boolean
          last_used_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          permissions?: any
          rate_limit_per_minute?: number
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_prefix?: string
          key_hash?: string
          permissions?: any
          rate_limit_per_minute?: number
          is_active?: boolean
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          model_id: string | null
          tokens_input: number
          tokens_output: number
          tokens_total: number
          duration_ms: number | null
          metadata: any
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_type: string
          model_id?: string | null
          tokens_input?: number
          tokens_output?: number
          tokens_total?: number
          duration_ms?: number | null
          metadata?: any
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          model_id?: string | null
          tokens_input?: number
          tokens_output?: number
          tokens_total?: number
          duration_ms?: number | null
          metadata?: any
          started_at?: string
          ended_at?: string | null
        }
      }
      ai_models: {
        Row: {
          id: string
          name: string
          provider: string
          model_id: string
          description: string | null
          capabilities: any
          context_window: number | null
          cost_per_input_token: number | null
          cost_per_output_token: number | null
          is_active: boolean
          requires_plan: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          provider: string
          model_id: string
          description?: string | null
          capabilities?: any
          context_window?: number | null
          cost_per_input_token?: number | null
          cost_per_output_token?: number | null
          is_active?: boolean
          requires_plan?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          provider?: string
          model_id?: string
          description?: string | null
          capabilities?: any
          context_window?: number | null
          cost_per_input_token?: number | null
          cost_per_output_token?: number | null
          is_active?: boolean
          requires_plan?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      response_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          template_content: string
          variables: any
          category: string | null
          is_public: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          template_content: string
          variables?: any
          category?: string | null
          is_public?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          template_content?: string
          variables?: any
          category?: string | null
          is_public?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: any
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: any
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          invoice_number: string
          amount: number
          tax_amount: number
          currency: string
          status: string
          billing_period_start: string
          billing_period_end: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          invoice_number: string
          amount: number
          tax_amount?: number
          currency?: string
          status?: string
          billing_period_start: string
          billing_period_end: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          invoice_number?: string
          amount?: number
          tax_amount?: number
          currency?: string
          status?: string
          billing_period_start?: string
          billing_period_end?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_model_configs: {
        Row: {
          id: string
          user_id: string
          name: string
          provider: string
          model_id: string
          api_base_url: string | null
          api_key_encrypted: string | null
          extra_params: any
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          provider: string
          model_id: string
          api_base_url?: string | null
          api_key_encrypted?: string | null
          extra_params?: any
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          provider?: string
          model_id?: string
          api_base_url?: string | null
          api_key_encrypted?: string | null
          extra_params?: any
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          model_id: string | null
          mode: string
          message_count: number
          total_tokens_used: number
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          model_id?: string | null
          mode?: string
          message_count?: number
          total_tokens_used?: number
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          model_id?: string | null
          mode?: string
          message_count?: number
          total_tokens_used?: number
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          tokens_used: number
          model_id: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          tokens_used?: number
          model_id?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          tokens_used?: number
          model_id?: string | null
          metadata?: any
          created_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string | null
          description: string | null
          system_prompt: string | null
          model_id: string | null
          config_yaml: string | null
          is_public: boolean
          downloads: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug?: string | null
          description?: string | null
          system_prompt?: string | null
          model_id?: string | null
          config_yaml?: string | null
          is_public?: boolean
          downloads?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string | null
          description?: string | null
          system_prompt?: string | null
          model_id?: string | null
          config_yaml?: string | null
          is_public?: boolean
          downloads?: number
          created_at?: string
          updated_at?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          provider: string
          event_type: string
          event_id: string
          payload: any
          status: string
          error_message: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider: string
          event_type: string
          event_id: string
          payload: any
          status?: string
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider?: string
          event_type?: string
          event_id?: string
          payload?: any
          status?: string
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
      }
      daily_usage: {
        Row: {
          id: string
          user_id: string
          date: string
          requests_count: number
          tokens_used: number
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          requests_count?: number
          tokens_used?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          requests_count?: number
          tokens_used?: number
        }
      }
    }
  }
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type SubscriptionPlanInsert = Database['public']['Tables']['subscription_plans']['Insert']
export type SubscriptionPlanUpdate = Database['public']['Tables']['subscription_plans']['Update']

export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']
export type UserSubscriptionInsert = Database['public']['Tables']['user_subscriptions']['Insert']
export type UserSubscriptionUpdate = Database['public']['Tables']['user_subscriptions']['Update']

export type TokenTransaction = Database['public']['Tables']['token_transactions']['Row']
export type TokenTransactionInsert = Database['public']['Tables']['token_transactions']['Insert']
export type TokenTransactionUpdate = Database['public']['Tables']['token_transactions']['Update']

export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert']
export type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update']

export type UsageSession = Database['public']['Tables']['usage_sessions']['Row']
export type UsageSessionInsert = Database['public']['Tables']['usage_sessions']['Insert']
export type UsageSessionUpdate = Database['public']['Tables']['usage_sessions']['Update']

export type UserModelConfig = Database['public']['Tables']['user_model_configs']['Row']
export type UserModelConfigInsert = Database['public']['Tables']['user_model_configs']['Insert']
export type UserModelConfigUpdate = Database['public']['Tables']['user_model_configs']['Update']

export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert']
export type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update']

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

export type Assistant = Database['public']['Tables']['assistants']['Row']
export type AssistantInsert = Database['public']['Tables']['assistants']['Insert']
export type AssistantUpdate = Database['public']['Tables']['assistants']['Update']

export type DailyUsage = Database['public']['Tables']['daily_usage']['Row']
export type DailyUsageInsert = Database['public']['Tables']['daily_usage']['Insert']
export type DailyUsageUpdate = Database['public']['Tables']['daily_usage']['Update']

export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row']
export type WebhookEventInsert = Database['public']['Tables']['webhook_events']['Insert']
export type WebhookEventUpdate = Database['public']['Tables']['webhook_events']['Update']

export type AiModel = Database['public']['Tables']['ai_models']['Row']
export type AiModelInsert = Database['public']['Tables']['ai_models']['Insert']
export type AiModelUpdate = Database['public']['Tables']['ai_models']['Update']

export type ResponseTemplate = Database['public']['Tables']['response_templates']['Row']
export type ResponseTemplateInsert = Database['public']['Tables']['response_templates']['Insert']
export type ResponseTemplateUpdate = Database['public']['Tables']['response_templates']['Update']

export type SystemLog = Database['public']['Tables']['system_logs']['Row']
export type SystemLogInsert = Database['public']['Tables']['system_logs']['Insert']
export type SystemLogUpdate = Database['public']['Tables']['system_logs']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

// ── Collaboration ──────────────────────────────────────────────────────────────
export interface CollaborationRoom {
  id: string
  name: string
  owner_id: string
  invite_token: string
  is_active: boolean
  max_members: number
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  display_name: string
  last_seen_at: string
  joined_at: string
}

export interface CollabMessage {
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  role: 'user' | 'assistant'
  content: string
  model_id: string | null
  created_at: string
}
