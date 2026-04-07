import { motion } from 'framer-motion'
import { useApp } from '../contexts/AppContext'
import { CATEGORY_CONFIG } from '../types'

export function Insights() {
  const { expenses, settings } = useApp()
  const { envelopes, monthlyBudget } = settings
  const now = new Date()

  // This month's expenses
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  // Totals
  const totalSpent = thisMonth.reduce((sum, e) => sum + e.amount, 0)
  const totalLimit = monthlyBudget > 0
    ? monthlyBudget
    : envelopes.reduce((sum, env) => sum + env.limit, 0) || totalSpent * 1.2
  const remaining = Math.max(0, totalLimit - totalSpent)
  const spentPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0

  // Category breakdown
  const categoryTotals: Record<string, number> = {}
  thisMonth.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])

  // Daily spending for chart
  const dailySpending: Record<string, number> = {}
  thisMonth.forEach(e => {
    const day = new Date(e.date).getDate().toString()
    dailySpending[day] = (dailySpending[day] || 0) + e.amount
  })

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    amount: dailySpending[(i + 1).toString()] || 0,
  }))

  const maxDaily = Math.max(...chartData.map(d => d.amount), 1)

  // Fixed vs Variable
  const fixedTotal = thisMonth.filter(e => e.type === 'fixo').reduce((sum, e) => sum + e.amount, 0)
  const variableTotal = thisMonth.filter(e => e.type === 'variavel').reduce((sum, e) => sum + e.amount, 0)

  // Today's spending
  const todayTotal = thisMonth
    .filter(e => new Date(e.date).toDateString() === now.toDateString())
    .reduce((sum, e) => sum + e.amount, 0)

  // Smart insight
  const getInsight = () => {
    if (sortedCategories.length === 0) return 'Comece a registrar seus gastos para ver insights personalizados!'

    const topCat = sortedCategories[0]
    const topCatConfig = CATEGORY_CONFIG[topCat[0] as keyof typeof CATEGORY_CONFIG]
    const topCatPct = Math.round((topCat[1] / totalSpent) * 100)

    if (topCatPct > 50) {
      return `${topCatConfig.emoji} ${topCatConfig.label} representa ${topCatPct}% dos seus gastos. Considere revisar esta categoria.`
    }

    if (spentPct > 80) {
      return '⚠️ Você já usou mais de 80% do seu orçamento. Cuidado com gastos extras!'
    }

    if (spentPct < 50 && now.getDate() > 15) {
      return '🎉 Ótimo trabalho! Você está abaixo de 50% do orçamento na metade final do mês.'
    }

    return `Seu maior gasto é com ${topCatConfig.label} (${topCatPct}%). Continue acompanhando!`
  }

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen pb-32 bg-[#fff4f6] dark:bg-slate-950 font-body">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              insights
            </span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159] dark:text-pink-300">
              Análises
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
              Gasto Total
            </p>
            <p className="font-headline font-black text-2xl text-[#775159] dark:text-pink-200 mt-1">
              {fmt(totalSpent)}
            </p>
            <div className="mt-3 h-1.5 bg-pink-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spentPct}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  spentPct > 80 ? 'bg-red-500' : spentPct > 60 ? 'bg-amber-500' : 'bg-[#775159]'
                }`}
              />
            </div>
            <p className="text-xs text-[#775159]/60 dark:text-pink-300/60 mt-1">
              {Math.round(spentPct)}% do orçamento
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
              Disponível
            </p>
            <p className="font-headline font-black text-2xl text-green-600 dark:text-green-400 mt-1">
              {fmt(remaining)}
            </p>
            <p className="text-xs text-[#775159]/60 dark:text-pink-300/60 mt-3">
              Meta: {fmt(totalLimit)}
            </p>
          </motion.div>
        </div>

        {/* Smart Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#775159] to-[#9d6b73] dark:from-pink-800 dark:to-pink-900 rounded-2xl p-5 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="font-bold text-sm">Dica do mês</p>
              <p className="text-sm text-white/90 mt-1 leading-relaxed">{getInsight()}</p>
            </div>
          </div>
        </motion.div>

        {/* Daily Chart */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
        >
          <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200 mb-4">
            Gastos diários
          </h3>
          <div className="flex items-end gap-1 h-32">
            {chartData.slice(0, now.getDate()).map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (d.amount / maxDaily) * 100)}%` }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
                className={`flex-1 rounded-t ${
                  d.day === now.getDate()
                    ? 'bg-[#775159] dark:bg-pink-500'
                    : 'bg-pink-200 dark:bg-pink-800/50'
                }`}
                title={`Dia ${d.day}: ${fmt(d.amount)}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#775159]/50 dark:text-pink-300/50">
            <span>1</span>
            <span>{Math.ceil(now.getDate() / 2)}</span>
            <span>{now.getDate()}</span>
          </div>
        </motion.section>

        {/* Category Breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
        >
          <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200 mb-4">
            Por categoria
          </h3>
          <div className="space-y-3">
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([cat, amount], i) => {
                const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]
                const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {config.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm text-[#775159] dark:text-pink-200">
                          {config.label}
                        </span>
                        <span className="font-bold text-sm text-[#775159] dark:text-pink-200">
                          {fmt(amount)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-pink-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#775159]/60 dark:text-pink-300/60 w-12 text-right">
                      {Math.round(pct)}%
                    </span>
                  </motion.div>
                )
              })
            ) : (
              <p className="text-center text-[#775159]/60 dark:text-pink-300/60 py-4">
                Nenhum gasto este mês
              </p>
            )}
          </div>
        </motion.section>

        {/* Fixed vs Variable */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500 text-xl">calendar_month</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
                Fixos
              </span>
            </div>
            <p className="font-headline font-black text-xl text-[#775159] dark:text-pink-200">
              {fmt(fixedTotal)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-purple-500 text-xl">shuffle</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
                Variáveis
              </span>
            </div>
            <p className="font-headline font-black text-xl text-[#775159] dark:text-pink-200">
              {fmt(variableTotal)}
            </p>
          </motion.div>
        </div>

        {/* Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
                Gasto hoje
              </p>
              <p className="font-headline font-black text-2xl text-[#775159] dark:text-pink-200 mt-1">
                {fmt(todayTotal)}
              </p>
            </div>
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
              <span className="text-3xl">📅</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
