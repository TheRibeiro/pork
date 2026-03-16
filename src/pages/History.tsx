import { useState, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { Search, Download, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useApp } from '../contexts/AppContext'
import {
  calculateMonthSummary,
  formatCurrency,
  formatDate,
  formatMonth,
  getCurrentMonth,
  exportToCSV,
  downloadCSV,
} from '../lib/utils'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../types'

export function History() {
  const { expenses, deleteExpense, theme } = useApp()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [searchQuery, setSearchQuery] = useState('')

  const summary = useMemo(
    () => calculateMonthSummary(expenses, selectedMonth),
    [expenses, selectedMonth]
  )

  const filteredExpenses = useMemo(() => {
    let filtered = expenses.filter((e) => {
      const expMonth = e.billingMonth || e.date.slice(0, 7)
      return expMonth === selectedMonth
    })

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.includes(q.replace('#', '')))
      )
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, selectedMonth, searchQuery])

  function navigateMonth(direction: -1 | 1) {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    const newDate = direction === -1 ? subMonths(date, 1) : subMonths(date, -1)
    setSelectedMonth(format(newDate, 'yyyy-MM'))
  }

  function handleExport() {
    const csv = exportToCSV(filteredExpenses)
    downloadCSV(csv, `bolsocheio-${selectedMonth}.csv`)
  }

  // Chart data
  const chartData = summary.dailySpending
    .filter((d) => d.total > 0)
    .map((d) => ({
      day: d.date.slice(8),
      total: d.total,
    }))

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Histórico
        </h1>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download size={16} className="mr-1" />
          CSV
        </Button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
        <p
          className="text-base font-semibold capitalize"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatMonth(selectedMonth)}
        </p>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Buscar por título, descrição ou #tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Gastos Diários
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === 'dark' ? '#334155' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Total */}
      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {filteredExpenses.length} gastos encontrados
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>

      {/* Expense List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {filteredExpenses.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category]
            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
                    {expense.type === 'fixo' && ' · Fixo'}
                    {expense.isRecurring && ' · 🔄'}
                  </p>
                  {expense.tags && expense.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {expense.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            opacity: 0.8,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p
                  className="text-sm font-bold shrink-0"
                  style={{ color: 'var(--text-primary)' }}
                >
                  -{formatCurrency(expense.amount)}
                </p>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredExpenses.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            Nenhum gasto encontrado
          </p>
        )}
      </div>
    </div>
  )
}
