import { useState, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { Search, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ExpenseDetailsSheet } from '../components/expenses/ExpenseDetailsSheet'
import { useApp } from '../contexts/AppContext'
import type { Expense } from '../types'
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
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
}

export function History() {
  const { expenses, deleteExpense, editExpense, theme } = useApp()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

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
  const chartData: { day: string; total: number }[] = summary.dailySpending.map((d) => ({
    day: d.date.slice(8),
    total: d.total,
  }))

  const maxSpendingDay = useMemo(() => {
    if (chartData.length === 0) return null
    return chartData.reduce((max, current) => (current.total > max.total ? current : max))
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="px-4 py-3 rounded-2xl shadow-xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            {label} de {formatMonth(selectedMonth).split(' ')[0]}
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Histórico
        </h1>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download size={16} className="mr-1" />
          CSV
        </Button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={() => navigateMonth(-1)}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <p
          className="text-base font-semibold capitalize"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatMonth(selectedMonth)}
        </p>
        <motion.button
          onClick={() => navigateMonth(1)}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <ChevronRight size={20} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
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
        <Card className="!p-0 overflow-hidden" highlight={false}>
          <div className="p-4 pb-0 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Evolução no Mês
              </h3>
              {maxSpendingDay && maxSpendingDay.total > 0 && (
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                  Pico: {formatCurrency(maxSpendingDay.total)} no dia {maxSpendingDay.day}
                </p>
              )}
            </div>
          </div>
          <div className="h-56 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#64748b' : '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={15}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#64748b' : '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} 
                />
                <Bar 
                  dataKey="total" 
                  fill="url(#barGradient)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="none"
                  fill="url(#colorTotal)"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 3, 
                    stroke: 'var(--bg-card)', 
                    fill: "var(--color-primary)" 
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Total */}
      <motion.div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-input)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {filteredExpenses.length} gastos encontrados
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
        </span>
      </motion.div>

      {/* Expense List — Staggered Cascade (Manifesto §2) */}
      <motion.div
        className="flex flex-col gap-2"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence>
          {filteredExpenses.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category]
            return (
              <motion.div
                key={expense.id}
                layout
                variants={itemVariants}
                exit="exit"
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedExpense(expense)}
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
                  <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(expense.date).substring(0, 5)} • {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                    {expense.type === 'fixo' && ' • Fixo'}
                    {expense.isRecurring && ' • 🔄'}
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
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div 
                    className="px-2.5 py-1 rounded-lg border flex items-center"
                    style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      borderColor: 'rgba(239, 68, 68, 0.2)' 
                    }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#f87171' }}
                    >
                      -{formatCurrency(expense.amount).replace('R$', '').trim()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredExpenses.length === 0 && (
          <EmptyState
            icon={<FileText size={28} style={{ color: 'var(--color-primary)' }} />}
            title="Nenhum gasto encontrado"
            description="Tente alterar o mês ou os filtros de busca"
          />
        )}
      </motion.div>

      <ExpenseDetailsSheet
        expense={selectedExpense}
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDelete={deleteExpense}
        onSave={editExpense}
      />
    </div>
  )
}
