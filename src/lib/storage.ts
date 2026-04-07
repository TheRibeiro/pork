import type { Expense, AppSettings } from '../types'

const STORAGE_KEYS = {
  expenses: 'bolsocheio_expenses',
  settings: 'bolsocheio_settings',
} as const

const DEFAULT_SETTINGS: AppSettings = {
  creditCard: {
    closingDay: 25,
    dueDay: 5,
  },
  envelopes: [],
  monthlyBudget: 0,
  theme: 'light',
}

export function loadExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.expenses)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses))
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.settings)
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}
