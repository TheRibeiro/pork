import { useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { PlayCircle, ShieldCheck } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'
import { CATEGORY_CONFIG } from '../../types'
import type { Expense } from '../../types'

interface SubscriptionCardProps {
  expenses: Expense[]
}

const listVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
}

export function SubscriptionCard({ expenses }: SubscriptionCardProps) {
  const subscriptions = useMemo(() => {
    // Map to keep only the latest instance of each subscription
    const subsMap = new Map<string, Expense>()
    expenses.forEach((e) => {
      // É assinatura se estiver na categoria OU marcado como isRecurring
      if (e.isRecurring || e.category === 'assinaturas') {
        const titleLower = e.title.toLowerCase().trim()
        const existing = subsMap.get(titleLower)
        // Se ainda não temos essa sub, ou esta é mais recente, guarda ela
        if (!existing || e.date > existing.date) {
          subsMap.set(titleLower, e)
        }
      }
    })
    return Array.from(subsMap.values()).sort((a, b) => b.amount - a.amount)
  }, [expenses])

  if (subscriptions.length === 0) return null

  const totalCommitted = subscriptions.reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(13, 148, 136, 0.1))',
            border: '1px solid rgba(20, 184, 166, 0.2)'
          }}
        >
          <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Sua Trilha de Assinaturas
          </h3>
          <p className="text-2xl font-bold tracking-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalCommitted)}
            <span className="text-xs font-medium ml-1" style={{ color: 'var(--text-muted)' }}>/mês</span>
          </p>
        </div>
      </div>

      <motion.div 
        variants={listVariants} 
        initial="initial" 
        animate="animate" 
        className="flex flex-col gap-2 pt-2"
        style={{ borderTop: '1px dashed var(--border-color)' }}
      >
        {subscriptions.map(sub => {
          const config = CATEGORY_CONFIG[sub.category]
          return (
            <motion.div 
              key={sub.id} 
              variants={itemVariants}
              className="flex items-center justify-between p-3 rounded-2xl transition-colors"
              style={{ backgroundColor: 'var(--bg-input)' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ 
                    backgroundColor: config.color + '15',
                    border: `1px solid ${config.color}20`
                  }}
                >
                  {config.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {sub.title}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide font-medium mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <ShieldCheck size={11} style={{ color: 'var(--color-primary)' }} />
                    Ativa
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(sub.amount)}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </Card>
  )
}
