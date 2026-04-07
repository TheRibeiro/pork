import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import { vibrate } from '../lib/utils'
import { CATEGORY_CONFIG } from '../types'

interface SupervisionDashboardProps {
  childId: string
  onBack: () => void
}

export function SupervisionDashboard({ childId, onBack }: SupervisionDashboardProps) {
  const { expenses, settings, updateSettings } = useApp()
  const child = settings.children.find(c => c.id === childId)
  
  if (!child) return null

  const [isEditingLimit, setIsEditingLimit] = useState(false)
  const [newLimitInput, setNewLimitInput] = useState(child.allowance.toString())

  const handleSaveLimit = () => {
    const lim = parseFloat(newLimitInput.replace(',', '.')) || 0
    const updated = settings.children.map(c => c.id === childId ? { ...c, allowance: lim } : c)
    updateSettings({ children: updated })
    setIsEditingLimit(false)
    vibrate(10)
  }

  const now = new Date()
  
  const childExpenses = useMemo(() => {
    return expenses.filter(e => e.child_id === childId)
  }, [expenses, childId])

  const currentMonthExpenses = useMemo(() => {
    return childExpenses.filter(e => {
       const d = new Date(e.date)
       return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [childExpenses, now])

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = Math.max(0, child.allowance - totalSpent)
  const percentSpent = Math.min(100, (totalSpent / child.allowance) * 100) || 0

  // Agrupar gastos por categoria
  const catTotals = currentMonthExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(catTotals)
    .map(([cat, amount]) => ({
      category: cat,
      label: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label || cat,
      emoji: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.emoji || '🏷️',
      color: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color || '#cbd5e1', // Fallback color
      amount,
      pct: (amount / totalSpent) * 100
    }))
    .sort((a, b) => b.amount - a.amount)

  // Preparar os segmentos do donut SVG
  let cumulativePct = 0
  const segments = pieData.map(slice => {
    const strokeDasharray = `${slice.pct} ${100 - slice.pct}`
    const strokeDashoffset = -cumulativePct
    cumulativePct += slice.pct
    return { ...slice, strokeDasharray, strokeDashoffset }
  })

  // Tradução do mapa de cores das categorias para HEX válido no SVG
  const getColorHex = (catClass: string) => {
    if (catClass.includes('tertiary')) return '#87a8d0' // Azul
    if (catClass.includes('primary')) return '#ff9db0' // Rosa/vermelho
    if (catClass.includes('secondary')) return '#fbcfe8' // Rosa claro
    if (catClass.includes('quaternary')) return '#fde047' // Amarelo
    return '#c29668'
  }

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Pegar os 5 gastos mais recentes
  const recentExpenses = [...childExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-[#fdfaf2] font-body text-on-surface pb-32 relative overflow-hidden">
      {/* Decorative Treasure Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#dabd9c]/20 rounded-full blur-3xl rounded-tr-none z-0"></div>
      <div className="absolute top-40 -left-10 w-40 h-40 bg-[#c29668]/10 rounded-full blur-2xl z-0"></div>

      {/* App Bar (Supervision) */}
      <header className="relative z-10 w-full top-0 sticky bg-[#fdfaf2]/90 backdrop-blur shadow-sm p-4 flex items-center gap-4 border-b border-[#dabd9c]/30">
        <button 
          onClick={() => { vibrate(10); onBack() }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-[#dabd9c]/50 text-[#7d532a] hover:bg-[#dabd9c]/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-black text-xl text-[#7d532a] tracking-tight truncate uppercase">Visão do Herói</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-8 relative z-10">
        
        {/* Herói Info */}
        <section className="bg-white p-6 rounded-3xl shadow-md border-2 border-[#dabd9c]/30 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#dabd9c]/30 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-3xl">
            👧
          </div>
          <div>
            <h2 className="font-headline font-black text-2xl text-[#7d532a] capitalize">{child.name}</h2>
            <p className="text-secondary font-bold text-xs uppercase inline-flex items-center gap-1 bg-secondary-container px-2 py-0.5 rounded-full mt-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Em Missão
            </p>
          </div>
        </section>

        {/* Progresso da Jornada */}
        <section className="space-y-4">
          <h3 className="font-headline font-extrabold text-[#7d532a] text-lg uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined">map</span>
            Progresso da Jornada
          </h3>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#dabd9c]/20 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Gasto Atual</p>
                <p className="font-headline font-black text-3xl text-error mt-1">{fmt(totalSpent)}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1 justify-end">
                  Limite Mês
                  <button onClick={() => setIsEditingLimit(!isEditingLimit)} className="material-symbols-outlined text-[14px] hover:text-primary">edit</button>
                </p>
                {isEditingLimit ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-primary font-bold">R$</span>
                    <input 
                      autoFocus
                      type="text" 
                      inputMode="decimal"
                      value={newLimitInput}
                      onChange={e => setNewLimitInput(e.target.value.replace(/[^0-9,\.]/g, ''))}
                      onBlur={handleSaveLimit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveLimit()}
                      className="w-16 bg-[#dabd9c]/20 rounded border-b-2 border-primary px-1 outline-none font-headline font-black text-xl text-primary text-right"
                    />
                  </div>
                ) : (
                  <p className="font-headline font-black text-xl text-primary mt-1">{fmt(child.allowance)}</p>
                )}
              </div>
            </div>

            {/* Health Bar Lúdica */}
            <div className="w-full h-8 bg-surface-container-highest rounded-full p-1 overflow-hidden shadow-inner border border-outline-variant/10 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentSpent}%` }}
                className={`h-full rounded-full relative ${percentSpent > 80 ? 'bg-error' : percentSpent > 50 ? 'bg-tertiary' : 'bg-primary'}`}
              >
                {/* Efeito de brilho na barra */}
                <div className="absolute top-1 right-1 w-4 h-1.5 bg-white/30 rounded-full"></div>
              </motion.div>
            </div>
            
            <p className="text-center font-bold text-sm text-[#7d532a]">
              Sobram {fmt(remaining)} na mochila do Aventureiro.
            </p>
          </div>
        </section>

        {/* Estatísticas de Gastos (Donut Chart) */}
        {totalSpent > 0 && (
          <section className="space-y-4">
            <h3 className="font-headline font-extrabold text-[#7d532a] text-lg uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined">pie_chart</span>
              Inventário Gasto
            </h3>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#dabd9c]/20 flex flex-col items-center">
              
              {/* O Donut Mágico SVG */}
              <div className="relative w-48 h-48 drop-shadow-lg">
                <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90 rounded-full">
                  <circle r="16" cx="16" cy="16" fill="white" />
                  {segments.map((slice, i) => (
                    <motion.circle
                      key={i}
                      r="16"
                      cx="16"
                      cy="16"
                      fill="transparent"
                      stroke={getColorHex(slice.color)}
                      strokeWidth="32"
                      pathLength="100"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    />
                  ))}
                  {/* Buraco do Donut para criar formato de anel com o ícone central */}
                  <circle r="10" cx="16" cy="16" fill="white" />
                </svg>
                {/* Ícone no Centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">💰</span>
                </div>
              </div>

              {/* Legenda das Fatias */}
              <div className="w-full mt-8 space-y-3">
                {pieData.map((slice, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: getColorHex(slice.color) }}>
                        <span className="text-sm">{slice.emoji}</span>
                      </div>
                      <span className="font-bold text-[#7d532a] text-sm">{slice.label.split(' ')[0]}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{fmt(slice.amount)}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">{Math.round(slice.pct)}%</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* Diário de Bordo (Relatório de Transações) */}
        <section className="space-y-4">
          <h3 className="font-headline font-extrabold text-[#7d532a] text-lg uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined">menu_book</span>
            Diário de Bordo
          </h3>
          <div className="space-y-3 relative">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((exp, i) => {
                const ui = CATEGORY_CONFIG[exp.category as keyof typeof CATEGORY_CONFIG] || { emoji: '🏷️', color: 'bg-surface-container' }
                const d = new Date(exp.date)
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={exp.id} 
                    className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-[#dabd9c]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${ui.color} flex items-center justify-center text-xl shadow-sm`}>
                        {ui.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-[#7d532a]">{exp.description || ui.label}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                          {format(d, "dd MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <p className="font-headline font-black text-error text-md">- {fmt(exp.amount)}</p>
                  </motion.div>
                )
              })
            ) : (
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-[#dabd9c]/40 text-center">
                <span className="material-symbols-outlined text-4xl text-[#dabd9c]/60 mb-2">savings</span>
                <p className="text-[#7d532a] font-bold">O Aventureiro ainda não registrou nenhum gasto na jornada.</p>
              </div>
            )}

            {/* Read Only Layer / Watermark */}
            {recentExpenses.length > 0 && (
              <div className="absolute -bottom-8 left-0 w-full text-center">
                <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest"><span className="material-symbols-outlined text-[10px] mr-1">visibility</span> Somente Visualização</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
