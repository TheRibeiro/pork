import { useState } from 'react'
import { TrendingDown, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'
import type { MonthSummary } from '../../types'

interface MonthSummaryCardProps {
  summary: MonthSummary
}

export function MonthSummaryCard({ summary }: MonthSummaryCardProps) {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <Card highlight className="relative overflow-hidden">
      <div className="pt-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Total do Mês
          </p>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {/* Elegant Currency Display */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            R$
          </span>
          <AnimatePresence mode="wait">
            {isVisible ? (
              <motion.span
                key="visible"
                className="text-4xl font-bold"
                style={{ 
                  letterSpacing: '-0.05em',
                  color: 'var(--text-primary)',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {formatCurrency(summary.totalSpent).replace('R$', '').trim()}
              </motion.span>
            ) : (
              <motion.span
                key="hidden"
                className="text-4xl font-bold tracking-widest translate-y-[-2px]"
                style={{ color: 'var(--text-primary)' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                ••••••••
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <motion.div
          className="flex-1 flex items-center gap-2 p-3 rounded-xl"
          style={{ backgroundColor: 'var(--bg-input)' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.15 }}
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
        </motion.div>

        <motion.div
          className="flex-1 flex items-center gap-2 p-3 rounded-xl"
          style={{ backgroundColor: 'var(--bg-input)' }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }}
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
        </motion.div>
      </div>
    </Card>
  )
}
