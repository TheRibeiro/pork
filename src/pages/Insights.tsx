import { useMemo } from 'react'
import { Sparkles, TrendingUp, PiggyBank, CreditCard, Repeat } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
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
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles size={24} className="text-[var(--color-primary)]" />
          Insights IA
        </h1>
        <p className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
          Análise de {formatMonth(currentMonth)}
        </p>
      </div>

      {/* Fixo vs Variável */}
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
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${fixedPercent}%` }}
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
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-700"
                style={{ width: `${variablePercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Pie Chart */}
      {pieData.length > 0 && (
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
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    fontSize: '12px',
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
      )}

      {/* AI Insights */}
      <div>
        <h3 className="text-sm font-semibold mb-3 px-1" style={{ color: 'var(--text-secondary)' }}>
          Dicas da IA
        </h3>
        <div className="flex flex-col gap-3">
          {insights.map((insight, index) => {
            const Icon = insightIcons[index % insightIcons.length]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)', opacity: 0.9 }}
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
        </div>
      </div>
    </div>
  )
}
