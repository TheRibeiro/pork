import { useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { MonthSummaryCard } from '../components/dashboard/MonthSummaryCard'
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown'
import { RecentExpenses } from '../components/dashboard/RecentExpenses'
import { calculateMonthSummary, getCurrentMonth, formatMonth } from '../lib/utils'

export function Dashboard() {
  const { expenses, settings, deleteExpense } = useApp()
  const currentMonth = getCurrentMonth()

  const summary = useMemo(
    () => calculateMonthSummary(expenses, currentMonth),
    [expenses, currentMonth]
  )

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          BolsoCheio
        </h1>
        <p className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
          {formatMonth(currentMonth)}
        </p>
      </div>

      {/* Resumo do Mês */}
      <MonthSummaryCard summary={summary} />

      {/* Categorias com Envelopes */}
      <CategoryBreakdown summary={summary} envelopes={settings.envelopes} />

      {/* Gastos Recentes */}
      <RecentExpenses expenses={expenses} onDelete={deleteExpense} />
    </div>
  )
}
