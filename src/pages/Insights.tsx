import { useMemo } from 'react'
import { Sparkles, TrendingUp, PiggyBank, CreditCard, Repeat } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion, type Variants } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { useApp } from '../contexts/AppContext'
import {
  calculateMonthSummary,
  formatCurrency,
  getCurrentMonth,
  formatMonth,
  generateInsights,
} from '../lib/utils'
import { CATEGORY_CONFIG } from '../types'
import type { Category } from '../types'

const insightIcons = [Sparkles, TrendingUp, PiggyBank, CreditCard, Repeat]

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

const insightListVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const insightItemVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
}

export function Insights() {
  const { expenses, theme } = useApp()
  const currentMonth = getCurrentMonth()

  const summary = useMemo(
    () => calculateMonthSummary(expenses, currentMonth),
    [expenses, currentMonth]
  )

  const insights = useMemo(
    () => generateInsights(expenses, currentMonth),
    [expenses, currentMonth]
  )

  // Pie chart data
  const pieData = (Object.entries(summary.byCategory) as [Category, number][])
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_CONFIG[category].label,
      value,
      color: CATEGORY_CONFIG[category].color,
    }))

  const fixedPercent =
    summary.totalSpent > 0 ? ((summary.fixedTotal / summary.totalSpent) * 100).toFixed(0) : '0'
  const variablePercent =
    summary.totalSpent > 0
      ? ((summary.variableTotal / summary.totalSpent) * 100).toFixed(0)
      : '0'

  return (
    <motion.div
      className="flex flex-col gap-4 pb-4"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles size={24} className="text-[var(--color-primary)]" />
          Insights IA
        </h1>
        <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
          Análise de {formatMonth(currentMonth)}
        </p>
      </motion.div>

      {/* Fixo vs Variável */}
      <motion.div variants={itemVariants}>
        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Fixo vs. Variável
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Fixos ({fixedPercent}%)
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(summary.fixedTotal)}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                <motion.div
                  className="h-full rounded-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${fixedPercent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Variáveis ({variablePercent}%)
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(summary.variableTotal)}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                <motion.div
                  className="h-full rounded-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${variablePercent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Distribuição por Categoria
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#141420' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      fontSize: '12px',
                      backdropFilter: 'blur(20px)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Insights — Staggered Cascade (Manifesto §2) */}
      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-semibold mb-3 px-1" style={{ color: 'var(--text-secondary)' }}>
          Dicas da IA
        </h3>
        <motion.div
          className="flex flex-col gap-3"
          variants={insightListVariants}
          initial="initial"
          animate="animate"
        >
          {insights.map((insight, index) => {
            const Icon = insightIcons[index % insightIcons.length]
            return (
              <motion.div
                key={index}
                variants={insightItemVariants}
              >
                <Card className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.9))',
                    }}
                  >
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {insight}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
