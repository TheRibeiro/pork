import type { AccountType } from './index'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          whatsapp_number: string | null
          closing_day_card: number
          due_day_card: number
          is_whatsapp_verified: boolean
          whatsapp_verification_code: string | null
          whatsapp_verification_expires_at: string | null
          telegram_chat_id: number | null
          is_telegram_verified: boolean
          envelopes: EnvelopeJson[]
          children: ChildProfileJson[]
          parent_pin: string | null
          theme: 'light' | 'dark' | 'system'
          account_type: AccountType
          parent_id: string | null
          invite_token: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          whatsapp_number?: string | null
          closing_day_card?: number
          due_day_card?: number
          is_whatsapp_verified?: boolean
          whatsapp_verification_code?: string | null
          whatsapp_verification_expires_at?: string | null
          telegram_chat_id?: number | null
          is_telegram_verified?: boolean
          envelopes?: EnvelopeJson[]
          children?: ChildProfileJson[]
          parent_pin?: string | null
          theme?: 'light' | 'dark' | 'system'
          account_type?: AccountType
          parent_id?: string | null
          invite_token?: string | null
          onboarding_completed?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          category: string
          description: string | null
          date_transaction: string
          payment_type: string
          expense_type: string
          billing_month: string | null
          is_recurring: boolean
          tags: string[]
          child_id: string | null
          source: 'pwa' | 'whatsapp' | 'telegram'
          parent_flagged: boolean
          parent_flag_note: string | null
          parent_flag_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          amount: number
          category?: string
          description?: string | null
          date_transaction?: string
          payment_type?: string
          expense_type?: string
          billing_month?: string | null
          is_recurring?: boolean
          tags?: string[]
          child_id?: string | null
          source?: 'pwa' | 'whatsapp' | 'telegram'
          parent_flagged?: boolean
          parent_flag_note?: string | null
          parent_flag_read?: boolean
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      whatsapp_log: {
        Row: {
          id: string
          phone_number: string
          message_text: string | null
          ai_response: Record<string, unknown> | null
          transaction_id: string | null
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          phone_number: string
          message_text?: string | null
          ai_response?: Record<string, unknown> | null
          transaction_id?: string | null
          status?: string
          error_message?: string | null
        }
        Update: Partial<Database['public']['Tables']['whatsapp_log']['Insert']>
      }
      telegram_log: {
        Row: {
          id: string
          chat_id: number
          message_text: string | null
          ai_response: Record<string, unknown> | null
          transaction_id: string | null
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          chat_id: number
          message_text?: string | null
          ai_response?: Record<string, unknown> | null
          transaction_id?: string | null
          status?: string
          error_message?: string | null
        }
        Update: Partial<Database['public']['Tables']['telegram_log']['Insert']>
      }
    }
  }
}

export interface EnvelopeJson {
  category: string
  limit: number
}

export interface ChildProfileJson {
  id: string
  name: string
  pin: string
  pin_expires_at?: number
  is_connected?: boolean
  allowance: number
  avatarUrl?: string
}

// Tipo do profile para uso no app
export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  whatsapp_number: string | null
  closing_day_card: number
  due_day_card: number
  is_whatsapp_verified: boolean
  telegram_chat_id: number | null
  is_telegram_verified: boolean
  envelopes: EnvelopeJson[]
  monthly_budget?: number
  theme: 'light' | 'dark' | 'system'
  account_type: AccountType
  parent_id: string | null
  invite_token: string | null
  onboarding_completed: boolean
}

// Tipo da transaction para uso no app (mapeado do DB)
export interface TransactionRow {
  id: string
  user_id: string
  title: string
  amount: number
  category: string
  description: string | null
  date_transaction: string
  payment_type: string
  expense_type: string
  billing_month: string | null
  is_recurring: boolean
  tags: string[]
  child_id: string | null
  source: 'pwa' | 'whatsapp' | 'telegram'
  parent_flagged: boolean
  parent_flag_note: string | null
  parent_flag_read: boolean
  created_at: string
}
