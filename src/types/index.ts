export type PaymentMethod = 'dinheiro' | 'debito' | 'credito' | 'pix'

export type ExpenseType = 'fixo' | 'variavel'

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
}

export interface Envelope {
  category: Category
  limit: number // 0 = sem limite definido
}

export interface CreditCardConfig {
  closingDay: number // dia de fechamento (1-31)
  dueDay: number // dia de vencimento (1-31)
}

export interface AppSettings {
  creditCard: CreditCardConfig
  envelopes: Envelope[]
  theme: 'light' | 'dark' | 'system'
}

export interface MonthSummary {
  totalSpent: number
  byCategory: Record<Category, number>
  fixedTotal: number
  variableTotal: number
  dailySpending: { date: string; total: number }[]
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; emoji: string }> = {
  alimentacao: { label: 'Alimentação', color: '#f97316', emoji: '🍔' },
  transporte: { label: 'Transporte', color: '#3b82f6', emoji: '🚗' },
  lazer: { label: 'Lazer', color: '#a855f7', emoji: '🎮' },
  saude: { label: 'Saúde', color: '#ef4444', emoji: '💊' },
  educacao: { label: 'Educação', color: '#14b8a6', emoji: '📚' },
  moradia: { label: 'Moradia', color: '#eab308', emoji: '🏠' },
  vestuario: { label: 'Vestuário', color: '#ec4899', emoji: '👕' },
  assinaturas: { label: 'Assinaturas', color: '#6366f1', emoji: '📱' },
  outros: { label: 'Outros', color: '#6b7280', emoji: '📦' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Cartão de Crédito',
  pix: 'PIX',
}
