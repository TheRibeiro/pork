export type PaymentMethod = 'dinheiro' | 'debito' | 'credito' | 'pix'

export type ExpenseType = 'fixo' | 'variavel'

export type AccountType = 'adult' | 'parent' | 'child' | 'teen'

export type Category =
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'moradia'
  | 'vestuario'
  | 'assinaturas'
  | 'outros'

export interface Expense {
  id: string
  title: string
  amount: number
  category: Category
  date: string // ISO date string
  paymentMethod: PaymentMethod
  type: ExpenseType
  description?: string
  tags?: string[]
  isRecurring: boolean
  billingMonth?: string // YYYY-MM format - mês da fatura (para cartão de crédito)
  source?: string
  child_id?: string | null
  // Campos de sinalização pelo responsável
  parent_flagged?: boolean
  parent_flag_note?: string | null
  parent_flag_read?: boolean
}

export interface Envelope {
  category: Category
  limit: number // 0 = sem limite definido
}

export interface CreditCardConfig {
  closingDay: number // dia de fechamento (1-31)
  dueDay: number // dia de vencimento (1-31)
}

export interface ChildProfile {
  id: string
  name: string
  pin: string
  pin_expires_at?: number
  is_connected?: boolean
  allowance: number
  avatarUrl?: string
}

export interface AppSettings {
  creditCard: CreditCardConfig
  envelopes: Envelope[]
  children: ChildProfile[]
  parentPin: string | null
  theme: 'light' | 'dark' | 'system'
}

export interface MonthSummary {
  totalSpent: number
  byCategory: Record<Category, number>
  fixedTotal: number
  variableTotal: number
  dailySpending: { date: string; total: number }[]
}

export type PiggyState = 'full' | 'ok' | 'low' | 'critical' | 'wave'

export function getPiggyState(spent: number, limit: number): PiggyState {
  if (limit <= 0) return 'ok'
  const pct = spent / limit
  if (pct < 0.15) return 'full'    // Quase nada gasto → porquinho gordo e feliz
  if (pct < 0.60) return 'ok'     // Tudo bem
  if (pct < 0.85) return 'low'    // Apertando
  return 'critical'               // Crítico
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; emoji: string }> = {
  alimentacao: { label: 'Alimentação', color: '#f97316', emoji: '🍔' },
  transporte: { label: 'Transporte', color: '#3b82f6', emoji: '🚗' },
  lazer: { label: 'Lazer', color: '#a855f7', emoji: '🎮' },
  saude: { label: 'Saúde', color: '#ef4444', emoji: '💊' },
  educacao: { label: 'Educação', color: '#14b8a6', emoji: '📚' },
  moradia: { label: 'Moradia', color: '#eab308', emoji: '🏠' },
  vestuario: { label: 'Vestuário', color: '#ec4899', emoji: '👕' },
  assinaturas: { label: 'Assinaturas', color: '#14b8a6', emoji: '📱' },
  outros: { label: 'Outros', color: '#6b7280', emoji: '📦' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Cartão de Crédito',
  pix: 'PIX',
}
