import { Receipt, Repeat } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { EmptyState } from '../ui/EmptyState'
import { formatCurrency, formatDate } from '../../lib/utils'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../../types'
import type { Expense, PaymentMethod } from '../../types'

interface RecentExpensesProps {
  expenses: Expense[]
  onClick: (expense: Expense) => void
}

const listVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
}

const paymentColors: Record<PaymentMethod, { bg: string; border: string; text: string }> = {
  credito: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
  debito: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
  pix: { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.2)', text: '#2dd4bf' },
  dinheiro: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
}

export function RecentExpenses({ expenses, onClick }: RecentExpensesProps) {
  const recent = expenses.slice(0, 10)

  if (recent.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={28} style={{ color: 'var(--color-primary)' }} />}
        title="Nenhum gasto recente"
        description="Toque no + para registrar seu primeiro gasto"
      />
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
      <motion.div
        className="flex flex-col gap-2"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence>
          {recent.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category]
            const colors = paymentColors[expense.paymentMethod]
            return (
              <motion.div
                key={expense.id}
                layout
                variants={itemVariants}
                exit="exit"
                whileTap={{ scale: 0.98 }}
                onClick={() => onClick(expense)}
                className="flex items-center gap-3 p-3.5 rounded-2xl transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    backgroundColor: config.color + '15',
                    border: `1px solid ${config.color}20`
                  }}
                >
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] font-semibold truncate mb-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {expense.title}
                  </p>
                  <p className="text-[11px] font-medium tracking-wide uppercase flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(expense.date).substring(0, 5)} • {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                    {expense.isRecurring && (
                      <Repeat size={10} style={{ color: 'var(--color-primary)' }} />
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div
                    className="px-2.5 py-1 rounded-lg border flex items-center"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border
                    }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: colors.text }}
                    >
                      -{formatCurrency(expense.amount).replace('R$', '').trim()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
