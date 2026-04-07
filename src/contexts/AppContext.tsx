import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Expense, AppSettings, Category, Envelope } from '../types'
import { loadExpenses, saveExpenses, loadSettings, saveSettings } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { calculateBillingMonth } from '../lib/utils'
import { useAuth } from './AuthContext'

interface AppContextType {
  expenses: Expense[]
  settings: AppSettings
  loading: boolean
  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'billingMonth'>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  editExpense: (id: string, expense: Partial<Expense>) => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => void
  updateEnvelope: (category: Category, limit: number) => void
  setMonthlyBudget: (budget: number) => void
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void
  // Flags (para usuários supervisionados)
  markFlagRead: (expenseId: string) => void
  unreadFlagCount: number
}

const AppContext = createContext<AppContextType | null>(null)


function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    amount: Number(row.amount ?? 0),
    category: (row.category ?? 'outros') as Category,
    date: String(row.date_transaction ?? new Date().toISOString().split('T')[0]),
    paymentMethod: (row.payment_type ?? 'pix') as Expense['paymentMethod'],
    type: (row.expense_type ?? 'variavel') as Expense['type'],
    description: row.description ? String(row.description) : undefined,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
    isRecurring: Boolean(row.is_recurring),
    billingMonth: row.billing_month ? String(row.billing_month) : undefined,
    source: row.source ? String(row.source) : undefined,
    parent_flagged: Boolean(row.parent_flagged),
    parent_flag_note: row.parent_flag_note ? String(row.parent_flag_note) : null,
    parent_flag_read: Boolean(row.parent_flag_read),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, profile, isOnline, updateProfile } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const isSupervised = profile?.account_type === 'supervised'
  const isParent = profile?.account_type === 'adult' && profile?.invite_token

  // Settings from profile or localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (profile) {
      return {
        creditCard: {
          closingDay: profile.closing_day_card ?? 1,
          dueDay: profile.due_day_card ?? 10,
        },
        envelopes: (profile.envelopes || []).map((e) => ({
          category: e.category as Category,
          limit: e.limit,
        })),
        monthlyBudget: profile.monthly_budget ?? 0,
        theme: profile.theme ?? 'light',
      }
    }
    return loadSettings()
  })

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = settings.theme
    if (saved === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return saved
  })

  // Sync settings from profile
  useEffect(() => {
    if (profile) {
      setSettings({
        creditCard: {
          closingDay: profile.closing_day_card ?? 1,
          dueDay: profile.due_day_card ?? 10,
        },
        envelopes: (profile.envelopes || []).map((e) => ({
          category: e.category as Category,
          limit: e.limit,
        })),
        monthlyBudget: profile.monthly_budget ?? 0,
        theme: profile.theme ?? 'light',
      })
    }
  }, [profile])

  // Load expenses
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        if (isOnline && user) {
          let query = supabase
            .from('transactions')
            .select('*')
            .order('date_transaction', { ascending: false })
            .order('created_at', { ascending: false })

          // If user is a parent, they can see children's expenses too (via RLS)
          // If user is supervised or regular adult, filter by own user_id
          if (!isParent) {
            query = query.eq('user_id', user.id)
          }

          const { data, error } = await query
          if (!error && data) {
            setExpenses(data.map(rowToExpense))
          }
        } else {
          setExpenses(loadExpenses())
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isOnline, user, isParent])

  // Realtime subscription
  useEffect(() => {
    if (!isOnline || !user) return

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: isParent ? undefined : `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newExpense = rowToExpense(payload.new as Record<string, unknown>)
            setExpenses((prev) => {
              if (prev.some((e) => e.id === newExpense.id)) return prev
              return [newExpense, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = rowToExpense(payload.new as Record<string, unknown>)
            setExpenses((prev) => prev.map(e => e.id === updated.id ? updated : e))
          } else if (payload.eventType === 'DELETE') {
            setExpenses((prev) => prev.filter(e => e.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isOnline, user, isParent])

  // Persist offline
  useEffect(() => {
    if (!isOnline) saveExpenses(expenses)
  }, [expenses, isOnline])

  useEffect(() => {
    if (!isOnline) saveSettings(settings)
  }, [settings, isOnline])

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#fff4f6')
    }
  }, [theme])

  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  // Count unread flags (for supervised users)
  const unreadFlagCount = isSupervised
    ? expenses.filter(e => e.parent_flagged && !e.parent_flag_read).length
    : 0

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id' | 'billingMonth'>) => {
      const billingMonth =
        expense.paymentMethod === 'credito'
          ? calculateBillingMonth(expense.date, settings.creditCard)
          : undefined

      if (isOnline && user) {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            description: expense.description || null,
            date_transaction: expense.date,
            payment_type: expense.paymentMethod,
            expense_type: expense.type,
            billing_month: billingMonth || null,
            is_recurring: expense.isRecurring,
            tags: expense.tags || [],
            source: 'pwa',
          })
          .select()
          .single()

        if (!error && data) {
          setExpenses((prev) => [rowToExpense(data), ...prev])
        }
      } else {
        const newExpense: Expense = { ...expense, id: uuidv4(), billingMonth }
        setExpenses((prev) => [newExpense, ...prev])
      }
    },
    [settings.creditCard, isOnline, user]
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      if (isOnline && user) {
        await supabase.from('transactions').delete().eq('id', id)
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    },
    [isOnline, user]
  )

  const editExpense = useCallback(
    async (id: string, updates: Partial<Expense>) => {
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e
          const updated = { ...e, ...updates }
          if (updated.paymentMethod === 'credito') {
            updated.billingMonth = calculateBillingMonth(updated.date, settings.creditCard)
          } else {
            updated.billingMonth = undefined
          }
          return updated
        })
      )

      if (isOnline && user) {
        const dbUpdates: Record<string, unknown> = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount
        if (updates.category !== undefined) dbUpdates.category = updates.category
        if (updates.date !== undefined) dbUpdates.date_transaction = updates.date
        if (updates.paymentMethod !== undefined) dbUpdates.payment_type = updates.paymentMethod
        if (updates.type !== undefined) dbUpdates.expense_type = updates.type
        if (updates.description !== undefined) dbUpdates.description = updates.description
        if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring

        await supabase.from('transactions').update(dbUpdates).eq('id', id)
      }
    },
    [settings.creditCard, isOnline, user]
  )

  const markFlagRead = useCallback(
    (expenseId: string) => {
      setExpenses((prev) =>
        prev.map(e => e.id === expenseId ? { ...e, parent_flag_read: true } : e)
      )
      if (isOnline && isSupervised) {
        supabase.from('transactions').update({ parent_flag_read: true }).eq('id', expenseId)
      }
    },
    [isOnline, isSupervised]
  )

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        if (partial.theme) {
          if (partial.theme === 'system') {
            setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          } else {
            setTheme(partial.theme)
          }
        }

        if (isOnline && user) {
          const profileUpdates: Record<string, unknown> = {}
          if (partial.creditCard) {
            profileUpdates.closing_day_card = partial.creditCard.closingDay
            profileUpdates.due_day_card = partial.creditCard.dueDay
          }
          if (partial.theme) profileUpdates.theme = partial.theme
          if (partial.monthlyBudget !== undefined) profileUpdates.monthly_budget = partial.monthlyBudget
          if (Object.keys(profileUpdates).length > 0) {
            updateProfile(profileUpdates)
          }
        }

        return next
      })
    },
    [isOnline, user, updateProfile]
  )

  const updateEnvelope = useCallback(
    (category: Category, limit: number) => {
      setSettings((prev) => {
        const existing = prev.envelopes.find((e) => e.category === category)
        let envelopes: Envelope[]
        if (existing) {
          envelopes = limit === 0
            ? prev.envelopes.filter((e) => e.category !== category)
            : prev.envelopes.map((e) => (e.category === category ? { ...e, limit } : e))
        } else if (limit > 0) {
          envelopes = [...prev.envelopes, { category, limit }]
        } else {
          envelopes = prev.envelopes
        }

        if (isOnline && user) {
          updateProfile({ envelopes: envelopes.map((e) => ({ category: e.category, limit: e.limit })) })
        }

        return { ...prev, envelopes }
      })
    },
    [isOnline, user, updateProfile]
  )

  const setMonthlyBudget = useCallback(
    (budget: number) => {
      updateSettings({ monthlyBudget: budget })
    },
    [updateSettings]
  )

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setSettings((prev) => ({ ...prev, theme: next }))
    if (isOnline && user) {
      updateProfile({ theme: next })
    }
  }, [theme, isOnline, user, updateProfile])

  return (
    <AppContext.Provider
      value={{
        expenses,
        settings,
        loading,
        addExpense,
        deleteExpense,
        editExpense,
        updateSettings,
        updateEnvelope,
        setMonthlyBudget,
        theme,
        toggleTheme,
        markFlagRead,
        unreadFlagCount,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
