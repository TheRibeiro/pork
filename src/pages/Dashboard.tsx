import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useFamily } from '../contexts/FamilyContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PiggyCharacter } from '../components/family/PiggyCharacter'
import { getPiggyState, CATEGORY_CONFIG } from '../types'

export function Dashboard() {
  const { expenses, settings, unreadFlagCount, markFlagRead } = useApp()
  const { envelopes, monthlyBudget } = settings
  const { profile } = useAuth()
  const { isSupervised, parentName } = useFamily()
  const [showBalance, setShowBalance] = useState(true)

  const now = new Date()
  const userName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Usuário'

  // Current month expenses
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Calculate total limit
  const totalLimit = monthlyBudget > 0
    ? monthlyBudget
    : envelopes.reduce((sum, env) => sum + env.limit, 0)

  const remaining = Math.max(0, totalLimit - totalMonth)
  const piggyState = getPiggyState(totalMonth, totalLimit)

  // Recent expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Top categories this month
  const categoryTotals: Record<string, number> = {}
  monthExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const getGreeting = () => {
    const hour = now.getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getStatusMessage = () => {
    if (totalLimit === 0) return 'Defina um orçamento mensal nas configurações'
    const pct = (totalMonth / totalLimit) * 100
    if (pct < 25) return 'Excelente! Você está indo muito bem'
    if (pct < 50) return 'Ótimo controle dos gastos'
    if (pct < 75) return 'Atenção aos gastos este mês'
    if (pct < 100) return 'Cuidado! Próximo do limite'
    return 'Limite ultrapassado!'
  }

  return (
    <div className="min-h-screen pb-32 bg-[#fff4f6] dark:bg-slate-950 font-body text-on-surface">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              savings
            </span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159] dark:text-pink-300">
              BolsoCheio
            </h1>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#ffe0eb] dark:bg-pink-900/50 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm">
              <span className="font-bold text-[#775159] dark:text-pink-200 text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {unreadFlagCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadFlagCount > 9 ? '9+' : unreadFlagCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-8">
        {/* Greeting */}
        <section className="space-y-1">
          <h2 className="font-headline font-extrabold text-3xl text-[#775159] dark:text-pink-200 tracking-tight">
            {getGreeting()}, {userName}!
          </h2>
          <p className="text-[#775159]/70 dark:text-pink-300/70 font-medium">
            {isSupervised && parentName ? `Supervisionado por ${parentName}` : getStatusMessage()}
          </p>
        </section>

        {/* Main Card - Piggy + Balance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-pink-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-6">
            <PiggyCharacter state={piggyState} size={100} showMessage={false} />

            <div className="flex-1 space-y-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-left"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
                  {totalLimit > 0 ? 'Disponível' : 'Gasto este mês'}
                </p>
                <p className="font-headline font-black text-3xl text-[#775159] dark:text-pink-200">
                  {showBalance ? fmt(totalLimit > 0 ? remaining : totalMonth) : 'R$ ••••'}
                </p>
              </button>

              {totalLimit > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[#775159]/60 dark:text-pink-300/60">
                    <span>Gasto: {fmt(totalMonth)}</span>
                    <span>Meta: {fmt(totalLimit)}</span>
                  </div>
                  <div className="h-2 bg-pink-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (totalMonth / totalLimit) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        piggyState === 'critical' ? 'bg-red-500' :
                        piggyState === 'low' ? 'bg-amber-500' :
                        'bg-[#775159] dark:bg-pink-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <section className="space-y-4">
            <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200">
              Principais categorias
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {topCategories.map(([cat, amount]) => {
                const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-pink-50 dark:border-slate-800"
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <p className="text-xs font-bold text-[#775159]/70 dark:text-pink-300/70 mt-1 truncate">
                      {config.label}
                    </p>
                    <p className="font-bold text-[#775159] dark:text-pink-200 text-sm">
                      {fmt(amount)}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent Expenses */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200">
              Últimos gastos
            </h3>
          </div>

          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((exp, index) => {
                const config = CATEGORY_CONFIG[exp.category]
                const d = new Date(exp.date)
                const isToday = d.toDateString() === now.toDateString()
                const isFlagged = exp.parent_flagged && !exp.parent_flag_read

                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => isFlagged && markFlagRead(exp.id)}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4 border transition-all ${
                      isFlagged
                        ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 cursor-pointer'
                        : 'border-pink-50 dark:border-slate-800'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {config.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#775159] dark:text-pink-200 truncate">
                          {exp.description || config.label}
                        </p>
                        {isFlagged && <span className="text-amber-500">⚠️</span>}
                      </div>
                      <p className="text-xs text-[#775159]/60 dark:text-pink-300/60">
                        {isToday ? 'Hoje' : format(d, "dd MMM", { locale: ptBR })}
                      </p>
                      {isFlagged && exp.parent_flag_note && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                          "{exp.parent_flag_note}"
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-red-500 dark:text-red-400">
                      -{fmt(exp.amount)}
                    </p>
                  </motion.div>
                )
              })
            ) : (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-pink-50 dark:border-slate-800">
                <span className="text-4xl">🐷</span>
                <p className="text-[#775159]/60 dark:text-pink-300/60 font-medium mt-2">
                  Nenhum gasto registrado ainda
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
