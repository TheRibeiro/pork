import { Card } from '../ui/Card'
import { formatCurrency, getEnvelopeColor } from '../../lib/utils'
import { CATEGORY_CONFIG } from '../../types'
import type { Category, Envelope, MonthSummary } from '../../types'

interface CategoryBreakdownProps {
  summary: MonthSummary
  envelopes: Envelope[]
}

export function CategoryBreakdown({ summary, envelopes }: CategoryBreakdownProps) {
  const categories = (Object.entries(summary.byCategory) as [Category, number][])
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)

  if (categories.length === 0) {
    return (
      <Card>
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          Nenhum gasto registrado neste mês
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Gastos por Categoria
      </h3>
      <div className="flex flex-col gap-3">
        {categories.map(([category, spent]) => {
          const config = CATEGORY_CONFIG[category]
          const envelope = envelopes.find((e) => e.category === category)
          const hasLimit = envelope && envelope.limit > 0
          const percentage = hasLimit ? Math.min((spent / envelope.limit) * 100, 100) : 0
          const barColor = hasLimit ? getEnvelopeColor(spent, envelope.limit) : config.color

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{config.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {config.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(spent)}
                  </span>
                  {hasLimit && (
                    <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                      / {formatCurrency(envelope.limit)}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: hasLimit
                      ? `${percentage}%`
                      : `${Math.min((spent / summary.totalSpent) * 100, 100)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
