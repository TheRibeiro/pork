import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../contexts/AppContext'
import { useFamily } from '../../contexts/FamilyContext'
import { CATEGORY_CONFIG } from '../../types'
import { FlagTransactionSheet } from './FlagTransactionSheet'
import type { Expense } from '../../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ChildrenOverview() {
  const { expenses, settings } = useApp()
  const { children } = useFamily()
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null)
  const [flagTarget, setFlagTarget] = useState<Expense | null>(null)
  const [flagOpen, setFlagOpen] = useState(false)

  const now = new Date()
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Combina filhos do novo sistema (vinculados por parent_id) e do sistema legado (JSONB)
  const legacyChildren = settings.children ?? []

  // Dados dos filhos do novo sistema (linked accounts)
  const linkedChildrenData = children.map(child => {
    const childExpenses = expenses.filter(e => e.child_id === child.id)
    const monthExpenses = childExpenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const flaggedCount = monthExpenses.filter(e => e.parent_flagged).length
    return { ...child, monthExpenses, totalSpent, flaggedCount, allowance: 0, type: 'linked' as const }
  })

  // Dados dos filhos legados (JSONB)
  const legacyChildrenData = legacyChildren.map(child => {
    const childExpenses = expenses.filter(e => e.child_id === child.id)
    const monthExpenses = childExpenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const flaggedCount = monthExpenses.filter(e => e.parent_flagged).length
    return { ...child, monthExpenses, totalSpent, flaggedCount, type: 'legacy' as const }
  })

  const allChildren = [...linkedChildrenData, ...legacyChildrenData]

  if (allChildren.length === 0) return null

  const totalFlags = allChildren.reduce((s, c) => s + c.flaggedCount, 0)

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline font-bold text-xl">Minha Família</h3>
          {totalFlags > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
              🚩 {totalFlags} sinalizad{totalFlags === 1 ? 'o' : 'os'}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {allChildren.map((child) => {
            const isExpanded = expandedChildId === child.id
            const allowance = child.type === 'legacy' ? (child as typeof legacyChildrenData[0]).allowance : 0
            const pct = allowance > 0 ? Math.min(100, (child.totalSpent / allowance) * 100) : 0
            const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f97316' : '#22c55e'
            const name = child.type === 'linked'
              ? ((child as typeof linkedChildrenData[0]).full_name || (child as typeof linkedChildrenData[0]).email?.split('@')[0] || 'Filho')
              : (child as typeof legacyChildrenData[0]).name

            return (
              <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpandedChildId(isExpanded ? null : child.id)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-surface-container-lowest transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-xl shrink-0">
                    {child.type === 'linked' && (child as typeof linkedChildrenData[0]).account_type === 'teen' ? '🧑' : '🧒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-on-surface truncate capitalize">{name}</p>
                      {child.flaggedCount > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                          🚩 {child.flaggedCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {fmt(child.totalSpent)} este mês
                    </p>
                    {allowance > 0 && (
                      <div className="mt-1.5 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: barColor }}
                        />
                      </div>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Expanded: recent expenses */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2 border-t border-outline-variant/10 pt-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                          Últimos gastos
                        </p>
                        {child.monthExpenses.length === 0 ? (
                          <p className="text-sm text-on-surface-variant text-center py-3">
                            Nenhum gasto este mês.
                          </p>
                        ) : (
                          child.monthExpenses.slice(0, 5).map(exp => {
                            const cfg = CATEGORY_CONFIG[exp.category]
                            return (
                              <div
                                key={exp.id}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                  exp.parent_flagged
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-surface-container-lowest'
                                }`}
                              >
                                <span className="text-xl">{cfg.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-on-surface truncate">{exp.title}</p>
                                  <p className="text-xs text-on-surface-variant">
                                    {format(new Date(exp.date), "dd MMM", { locale: ptBR })}
                                    {exp.parent_flag_note && (
                                      <span className="text-amber-600 ml-1">· {exp.parent_flag_note}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <p className="text-sm font-bold text-error">
                                    -{fmt(exp.amount)}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFlagTarget(exp)
                                      setFlagOpen(true)
                                    }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                      exp.parent_flagged
                                        ? 'bg-amber-200 text-amber-700'
                                        : 'bg-surface-container text-on-surface-variant hover:bg-amber-100 hover:text-amber-600'
                                    }`}
                                    title={exp.parent_flagged ? 'Editar sinalização' : 'Sinalizar gasto'}
                                  >
                                    <span className="text-sm">🚩</span>
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                        {child.monthExpenses.length > 5 && (
                          <p className="text-xs text-center text-on-surface-variant/60 pt-1">
                            +{child.monthExpenses.length - 5} mais gastos
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      <FlagTransactionSheet
        expense={flagTarget}
        open={flagOpen}
        onClose={() => { setFlagOpen(false); setFlagTarget(null) }}
      />
    </>
  )
}
