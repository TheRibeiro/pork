import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../contexts/AppContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../types'

export function History() {
  const { expenses, deleteExpense } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR })
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const prevMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  const nextMonth = () => {
    const d = new Date(currentDate)
    d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const filtered = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
  })

  const totalMonth = filtered.reduce((sum, e) => sum + e.amount, 0)

  // Group by day
  const grouped = filtered.reduce<Record<string, typeof expenses>>((acc, exp) => {
    const key = exp.date
    if (!acc[key]) acc[key] = []
    acc[key].push(exp)
    return acc
  }, {})

  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
  }

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este gasto?')) {
      deleteExpense(id)
      setExpandedId(null)
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-[#fff4f6] dark:bg-slate-950 font-body">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              history
            </span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159] dark:text-pink-300">
              Histórico
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-4 border border-pink-100 dark:border-slate-800">
          <button
            onClick={prevMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-slate-800 text-[#775159] dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <div className="text-center">
            <p className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200">
              {monthLabelCap}
            </p>
            <p className="text-sm text-[#775159]/60 dark:text-pink-300/60">
              {filtered.length} gastos · {fmt(totalMonth)}
            </p>
          </div>

          <button
            onClick={nextMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-pink-50 dark:bg-slate-800 text-[#775159] dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Expenses List */}
        <div className="space-y-6">
          {sortedDays.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-pink-100 dark:border-slate-800"
            >
              <span className="text-5xl mb-4 block">🐷</span>
              <p className="font-bold text-[#775159] dark:text-pink-200 text-lg">
                Nenhum gasto neste mês
              </p>
              <p className="text-sm text-[#775159]/60 dark:text-pink-300/60 mt-1">
                O porquinho está feliz!
              </p>
            </motion.div>
          ) : (
            sortedDays.map((dayStr, dayIdx) => {
              const dayExpenses = grouped[dayStr]
              const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
              const dayLabel = getDayLabel(dayStr)
              const isToday = dayLabel === 'Hoje'

              return (
                <motion.section
                  key={dayStr}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIdx * 0.05 }}
                  className="space-y-3"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                      <h3 className={`font-bold text-sm capitalize ${
                        isToday ? 'text-green-600 dark:text-green-400' : 'text-[#775159]/70 dark:text-pink-300/70'
                      }`}>
                        {dayLabel}
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-[#775159]/50 dark:text-pink-300/50">
                      {fmt(dayTotal)}
                    </span>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-2">
                    {dayExpenses.map((exp, idx) => {
                      const config = CATEGORY_CONFIG[exp.category]
                      const isExpanded = expandedId === exp.id

                      return (
                        <motion.div
                          key={exp.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (dayIdx * 0.05) + (idx * 0.03) }}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-pink-50 dark:border-slate-800 overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                            className="w-full p-4 flex items-center gap-4 text-left"
                          >
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                              style={{ backgroundColor: `${config.color}20` }}
                            >
                              {config.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#775159] dark:text-pink-200 truncate">
                                {exp.description || config.label}
                              </p>
                              <p className="text-xs text-[#775159]/50 dark:text-pink-300/50">
                                {config.label} · {PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-red-500 dark:text-red-400">
                                -{fmt(exp.amount)}
                              </p>
                            </div>
                            <span className={`material-symbols-outlined text-[#775159]/30 dark:text-pink-300/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-2 border-t border-pink-50 dark:border-slate-800 space-y-3">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-[#775159]/50 dark:text-pink-300/50 text-xs">Data</p>
                                      <p className="font-medium text-[#775159] dark:text-pink-200">
                                        {format(new Date(exp.date), "dd/MM/yyyy")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[#775159]/50 dark:text-pink-300/50 text-xs">Tipo</p>
                                      <p className="font-medium text-[#775159] dark:text-pink-200">
                                        {exp.type === 'fixo' ? 'Despesa Fixa' : 'Gasto Único'}
                                      </p>
                                    </div>
                                    {exp.billingMonth && (
                                      <div className="col-span-2">
                                        <p className="text-[#775159]/50 dark:text-pink-300/50 text-xs">Fatura</p>
                                        <p className="font-medium text-[#775159] dark:text-pink-200">
                                          {format(new Date(exp.billingMonth + '-01'), "MMMM/yyyy", { locale: ptBR })}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDelete(exp.id)}
                                    className="w-full py-2 text-red-500 dark:text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                    Excluir
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.section>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
