import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Expense, AppSettings, Category, Envelope } from '../types'
import { loadExpenses, saveExpenses, loadSettings, saveSettings } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { vibrate } from '../lib/utils'
import { calculateBillingMonth } from '../lib/utils'
import { useAuth } from './AuthContext'

interface AppContextType {
  expenses: Expense[]
  settings: AppSettings
  activeChildId: string | null
  setActiveChildId: (id: string | null) => void
  addExpense: (expense: Omit<Expense, 'id' | 'billingMonth' | 'child_id'>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  editExpense: (id: string, expense: Partial<Expense>) => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => void
  updateEnvelope: (category: Category, limit: number) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  loading: boolean
  markFlagRead: (expenseId: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

// Converte row do Supabase para o formato Expense do app
function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    amount: Number(row.amount ?? 0),
    category: (row.category ?? 'outros') as Category,
    date: String(row.date_transaction ?? new Date().toISOString().split('T')[0]),
    paymentMethod: row.payment_type === 'credito' ? 'credito' :
                   (row.payment_type ?? 'pix') as Expense['paymentMethod'],
    type: (row.expense_type ?? 'variavel') as Expense['type'],
    description: row.description ? String(row.description) : undefined,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
    isRecurring: Boolean(row.is_recurring),
    billingMonth: row.billing_month ? String(row.billing_month) : undefined,
    source: row.source ? String(row.source) : undefined,
    child_id: row.child_id ? String(row.child_id) : null,
    parent_flagged: Boolean(row.parent_flagged),
    parent_flag_note: row.parent_flag_note ? String(row.parent_flag_note) : null,
    parent_flag_read: Boolean(row.parent_flag_read),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, profile, isOnline, updateProfile } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChildId, setActiveChildId] = useState<string | null>(null)

  const isParent = profile?.account_type === 'parent'
  const isChildOrTeen = profile?.account_type === 'child' || profile?.account_type === 'teen'

  // Settings: vem do profile (online) ou localStorage (offline)
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (profile) {
      return {
        creditCard: {
          closingDay: profile.closing_day_card,
          dueDay: profile.due_day_card,
        },
        envelopes: (profile.envelopes || []).map((e) => ({
          category: e.category as Category,
          limit: e.limit,
        })),
        children: profile.children || [],
        parentPin: profile.parent_pin || null,
        theme: profile.theme,
      }
    }
    const cached = loadSettings()
    return { ...cached, children: cached.children || [], parentPin: cached.parentPin || null }
  })

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = settings.theme
    if (saved === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return saved
  })

  // Sync settings from profile when it changes
  useEffect(() => {
    if (profile) {
      setSettings({
        creditCard: {
          closingDay: profile.closing_day_card,
          dueDay: profile.due_day_card,
        },
        envelopes: (profile.envelopes || []).map((e) => ({
          category: e.category as Category,
          limit: e.limit,
        })),
        children: profile.children || [],
        parentPin: profile.parent_pin || null,
        theme: profile.theme,
      })
    }
  }, [profile])

  // Load expenses: from Supabase if online, localStorage if offline
  // Parent também carrega transações dos filhos vinculados (via RLS policy)
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

          if (isParent) {
            // Pai vê as próprias + as dos filhos (RLS permite via parent_id)
            // Sem filtro de user_id → RLS cuida do escopo
          } else {
            query = query.eq('user_id', user.id)
          }

          const { data, error } = await query

          if (!error && data) {
            setExpenses(data.map(rowToExpense))
          } else if (error) {
            console.error('Erro ao carregar transações:', error)
          }
        } else {
          setExpenses(loadExpenses())
        }
      } catch (err) {
        console.error('Erro crítico ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isOnline, user, isParent])

  // Realtime subscription for new/updated/deleted transactions
  useEffect(() => {
    if (!isOnline || !user) return

    const filterClause = isParent
      ? undefined  // Pai vê tudo que a RLS permitir
      : `user_id=eq.${user.id}`

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          ...(filterClause ? { filter: filterClause } : {}),
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const newExpense = rowToExpense(payload.new as Record<string, unknown>)
              setExpenses((prev) => {
                if (prev.some((e) => e.id === newExpense.id)) return prev
                if (newExpense.child_id === activeChildId) vibrate([50, 100, 50])
                return [newExpense, ...prev]
              })
            } else if (payload.eventType === 'UPDATE') {
              const updatedExpense = rowToExpense(payload.new as Record<string, unknown>)
              setExpenses((prev) => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e))
            } else if (payload.eventType === 'DELETE') {
              setExpenses((prev) => prev.filter(e => e.id !== payload.old.id))
            }
          } catch (err) {
            console.error('Erro ao processar transação realtime:', err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOnline, user, activeChildId, isParent])

  // Persist expenses offline
  useEffect(() => {
    if (!isOnline) saveExpenses(expenses)
  }, [expenses, isOnline])

  // Persist settings offline
  useEffect(() => {
    if (!isOnline) saveSettings(settings)
  }, [settings, isOnline])

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff')
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id' | 'billingMonth' | 'child_id'>) => {
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
            child_id: activeChildId || null
          })
          .select()
          .single()

        if (!error && data) {
          setExpenses((prev) => [rowToExpense(data), ...prev])
        }
      } else {
        const newExpense: Expense = {
          ...expense,
          id: uuidv4(),
          billingMonth,
          child_id: activeChildId || undefined
        }
        setExpenses((prev) => [newExpense, ...prev])
      }
    },
    [settings.creditCard, isOnline, user, activeChildId]
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
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags

        await supabase.from('transactions').update(dbUpdates).eq('id', id)
      }
    },
    [settings.creditCard, isOnline, user]
  )

  // Filho marca flag como lida (atualiza localmente também)
  const markFlagRead = useCallback(
    (expenseId: string) => {
      setExpenses((prev) =>
        prev.map(e => e.id === expenseId ? { ...e, parent_flag_read: true } : e)
      )
      if (isOnline && isChildOrTeen) {
        supabase
          .from('transactions')
          .update({ parent_flag_read: true })
          .eq('id', expenseId)
          .then(() => {})
      }
    },
    [isOnline, isChildOrTeen]
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

        // Sync to Supabase profile
        if (isOnline && user) {
          const profileUpdates: Record<string, unknown> = {}
          if (partial.creditCard) {
            profileUpdates.closing_day_card = partial.creditCard.closingDay
            profileUpdates.due_day_card = partial.creditCard.dueDay
          }
          if (partial.theme) {
            profileUpdates.theme = partial.theme
          }
          if (partial.children !== undefined) {
            profileUpdates.children = partial.children
          }
          if (partial.parentPin !== undefined) {
            profileUpdates.parent_pin = partial.parentPin
          }
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

        const next = { ...prev, envelopes }

        // Sync envelopes to Supabase
        if (isOnline && user) {
          updateProfile({
            envelopes: envelopes.map((e) => ({ category: e.category, limit: e.limit })),
          })
        }

        return next
      })
    },
    [isOnline, user, updateProfile]
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
        activeChildId,
        setActiveChildId,
        addExpense,
        deleteExpense,
        editExpense,
        updateSettings,
        updateEnvelope,
        theme,
        toggleTheme,
        loading,
        markFlagRead,
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
