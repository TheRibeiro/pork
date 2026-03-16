import { Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { formatCurrency, formatDate } from '../../lib/utils'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../../types'
import type { Expense } from '../../types'

interface RecentExpensesProps {
  expenses: Expense[]
  onDelete: (id: string) => void
}

export function RecentExpenses({ expenses, onDelete }: RecentExpensesProps) {
  const recent = expenses.slice(0, 10)

  if (recent.length === 0) {
    return (
      <Card>
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          Nenhum gasto recente. Toque em + para adicionar.
        </p>
      </Card>
    )
  }

  return (
    <div>
      <h3
        className="text-sm font-semibold mb-3 px-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        Últimos Gastos
      </h3>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {recent.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category]
            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: config.color + '15' }}
                >
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {expense.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(expense.date)} · {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                    {expense.isRecurring && ' · 🔄'}
                  </p>
                </div>
                <p
                  className="text-sm font-bold shrink-0"
                  style={{ color: 'var(--text-primary)' }}
                >
                  -{formatCurrency(expense.amount)}
                </p>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
