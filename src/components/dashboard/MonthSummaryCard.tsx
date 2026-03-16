import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'
import type { MonthSummary } from '../../types'

interface MonthSummaryCardProps {
  summary: MonthSummary
}

export function MonthSummaryCard({ summary }: MonthSummaryCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
        }}
      />

      <div className="pt-2">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          Total do Mês
        </p>
        <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(summary.totalSpent)}
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <div
          className="flex-1 flex items-center gap-2 p-3 rounded-xl"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10">
            <TrendingDown size={16} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fixos</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(summary.fixedTotal)}
            </p>
          </div>
        </div>

        <div
          className="flex-1 flex items-center gap-2 p-3 rounded-xl"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10">
            <TrendingUp size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Variáveis</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(summary.variableTotal)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
