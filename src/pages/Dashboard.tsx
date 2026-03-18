import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useApp } from '../contexts/AppContext'
import { MonthSummaryCard } from '../components/dashboard/MonthSummaryCard'
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown'
import { RecentExpenses } from '../components/dashboard/RecentExpenses'
import { ExpenseDetailsSheet } from '../components/expenses/ExpenseDetailsSheet'
import { calculateMonthSummary, getCurrentMonth, formatMonth } from '../lib/utils'
import type { Expense } from '../types'

const containerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
}

export function Dashboard() {
  const { expenses, settings, deleteExpense, editExpense } = useApp()
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  
  const currentMonth = getCurrentMonth()

  const summary = useMemo(
    () => calculateMonthSummary(expenses, currentMonth),
    [expenses, currentMonth]
  )

  return (
    <motion.div
      className="flex flex-col gap-4 pb-4"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header — Elegant Typography (Manifesto §1) */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          BolsoCheio
        </h1>
        <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
          {formatMonth(currentMonth)}
        </p>
      </motion.div>

      {/* Resumo do Mês */}
      <motion.div variants={itemVariants}>
        <MonthSummaryCard summary={summary} />
      </motion.div>

      {/* Categorias com Envelopes */}
      <motion.div variants={itemVariants}>
        <CategoryBreakdown summary={summary} envelopes={settings.envelopes} />
      </motion.div>

      {/* Gastos Recentes */}
      <motion.div variants={itemVariants}>
        <RecentExpenses expenses={expenses} onClick={setSelectedExpense} />
      </motion.div>

      <ExpenseDetailsSheet
        expense={selectedExpense}
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDelete={deleteExpense}
        onSave={editExpense}
      />
    </motion.div>
  )
}
