import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useFamily } from '../contexts/FamilyContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PiggyCharacter } from '../components/family/PiggyCharacter'
import { ChildrenOverview } from '../components/family/ChildrenOverview'
import { getPiggyState } from '../types'

export function Dashboard() {
  const { expenses, settings, activeChildId } = useApp()
  const { envelopes, children } = settings
  const { user, profile } = useAuth()
  const { isParent, isChild, isTeen, unreadFlagCount } = useFamily()
  const [showBalance, setShowBalance] = useState(true)

  const activeChild = activeChildId ? children.find(c => c.id === activeChildId) : null
  const now = new Date()

  // Nome de exibição por tipo de conta
  const userName = activeChild
    ? activeChild.name
    : profile?.full_name?.split(' ')[0]
      || user?.email?.split('@')[0]
      || 'Guardião'

  // Filtro de despesas por perfil ativo
  const profileExpenses = activeChildId
    ? expenses.filter(e => e.child_id === activeChildId)
    : expenses.filter(e => !e.child_id)

  // Gastos do mês atual
  const monthExpenses = profileExpenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const recentExpenses = [...profileExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const totalLimit = activeChild
    ? activeChild.allowance
    : envelopes.reduce((sum, env) => sum + env.limit, 0)

  // Estado do porquinho baseado no % gasto
  const piggyState = getPiggyState(totalMonth, totalLimit)

  // Saudação adaptada por tipo de conta
  const getGreeting = () => {
    const hour = now.getHours()
    const timeGreet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

    if (isChild) return `${timeGreet}, ${userName}! 🐷`
    if (isTeen) return `${timeGreet}, ${userName}!`
    if (isParent) return `${timeGreet}, ${userName}! 👨‍👩‍👧`
    return `Oi, ${userName}!`
  }

  // Mensagem de subheadline adaptada
  const getSubline = () => {
    if (isChild) {
      if (piggyState === 'full') return 'Uau! Seu bolsinho tá cheio! 🎉'
      if (piggyState === 'ok') return 'Tá indo bem! Segura aí! ✨'
      if (piggyState === 'low') return 'Ei! Tô ficando com fome... cuida aí 🐷'
      if (piggyState === 'critical') return 'Socorro! Meu bolso tá quase vazio! 😱'
      return 'O porquinho está feliz hoje! ✨'
    }
    if (isTeen) {
      if (piggyState === 'full') return 'Mandou bem no controle dos gastos! 💪'
      if (piggyState === 'critical') return 'Atenção: orçamento quase no limite'
      return 'Seus gastos este mês:'
    }
    if (isParent) {
      const totalChildren = settings.children.length
      return totalChildren > 0
        ? `Gerenciando família · ${totalChildren} filho${totalChildren > 1 ? 's' : ''}`
        : 'Painel Financeiro Familiar'
    }
    return 'O porquinho está feliz hoje! ✨'
  }

  // Mapa de progresso de categoria (apenas guardião)
  const getCategoryProgress = (categoryName: string) => {
    const env = envelopes.find(e => e.category === categoryName)
    const spent = profileExpenses
      .filter(e => e.category === categoryName && new Date(e.date).getMonth() === now.getMonth())
      .reduce((sum, e) => sum + e.amount, 0)
    if (!env || env.limit === 0) return { spent, pct: Math.min(100, spent > 0 ? 100 : 0) }
    return { spent, pct: Math.min(100, Math.round((spent / env.limit) * 100)) }
  }

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const foodProgress = getCategoryProgress('alimentacao')
  const funProgress = getCategoryProgress('lazer')

  const getIconData = (e: typeof expenses[0]) => {
    switch (e.category) {
      case 'alimentacao': return { icon: 'restaurant', bg: 'bg-tertiary-container', color: 'text-on-tertiary-container' }
      case 'transporte': return { icon: 'local_taxi', bg: 'bg-secondary-container', color: 'text-on-secondary-container' }
      case 'lazer': return { icon: 'movie', bg: 'bg-primary-container', color: 'text-on-primary-container' }
      default: return { icon: 'shopping_bag', bg: 'bg-surface-container', color: 'text-primary' }
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-surface font-body text-on-surface">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6] dark:bg-slate-950 shadow-[0_20px_40px_rgba(119,81,89,0.08)]">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775159] dark:text-[#fdcad3] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159] dark:text-[#fdcad3]">BolsoCheio</h1>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-white squish-shadow">
              <span className="text-xl leading-none">
                {isChild ? '🧒' : isTeen ? '🧑' : isParent ? '👨‍👩‍👧' : activeChild ? '👧' : '🧑‍🏫'}
              </span>
            </div>
            {/* Badge de flags não lidas (para filhos) */}
            {(isChild || isTeen) && unreadFlagCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadFlagCount > 9 ? '9+' : unreadFlagCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-8 space-y-12">

        {/* Greeting & Hero Section */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">{getGreeting()}</h2>
            <p className="text-on-surface-variant font-medium">{getSubline()}</p>
          </div>

          {/* Porquinho Animado */}
          <div className="relative bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center aspect-square squish-shadow overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary-fixed-dim/20 to-transparent opacity-50" />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <PiggyCharacter state={piggyState} size={180} showMessage={false} />

              {/* Saldo disponível */}
              <div
                className="bg-surface-container-lowest/80 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 squish-shadow cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowBalance(!showBalance)}
              >
                <div className={`w-3 h-3 rounded-full ${
                  piggyState === 'critical' ? 'bg-error animate-pulse' :
                  piggyState === 'low' ? 'bg-orange-400 animate-pulse' :
                  'bg-secondary-fixed-dim animate-pulse'
                }`} />
                <span className="font-headline font-bold text-primary text-lg">
                  {showBalance
                    ? fmt(totalLimit > 0 ? totalLimit - totalMonth : totalMonth)
                    : 'R$ ••••••'}
                </span>
              </div>
            </div>

            {totalLimit > 0 && (
              <p className="text-[10px] mt-2 text-primary font-bold uppercase tracking-widest z-10">
                {activeChild ? 'Mesada Restante' : isChild || isTeen ? 'Saldo Restante' : 'Resta do Limite Mensal'}
              </p>
            )}
          </div>
        </section>

        {/* ── VISÃO DOS FILHOS (só para pais) ── */}
        {(isParent || (!isChild && !isTeen && settings.children.length > 0)) && (
          <ChildrenOverview />
        )}

        {/* ── PILHAS DE GASTOS (só para adultos/guardião) ── */}
        {!activeChild && !isChild && !isTeen && !isParent && (
          <section className="space-y-6">
            <h3 className="font-headline font-bold text-xl px-2">Suas Pilhas (Limites)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-xl p-6 space-y-4 hover:scale-105 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-tertiary-container text-on-tertiary-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  </div>
                  <span className="font-bold text-xs text-on-surface-variant">{foodProgress.pct}%</span>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm">Comida</p>
                  <div className="w-full h-8 bg-surface-container-highest rounded-full overflow-hidden inset-tray p-1">
                    <div className="h-full bg-secondary rounded-full relative" style={{ width: `${Math.max(foodProgress.pct, 5)}%` }}>
                      <div className="absolute right-1 top-1 w-4 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl p-6 space-y-4 hover:scale-105 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-primary-container text-on-primary-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
                  </div>
                  <span className="font-bold text-xs text-on-surface-variant">{funProgress.pct}%</span>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm">Lazer</p>
                  <div className="w-full h-8 bg-surface-container-highest rounded-full overflow-hidden inset-tray p-1">
                    <div className="h-full bg-secondary rounded-full relative" style={{ width: `${Math.max(funProgress.pct, 5)}%` }}>
                      <div className="absolute right-1 top-1 w-2 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── PILHAS DE CATEGORIA (para pais em modo pai) ── */}
        {isParent && !activeChild && envelopes.length > 0 && (
          <section className="space-y-6">
            <h3 className="font-headline font-bold text-xl px-2">Seus Limites</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-xl p-6 space-y-4 hover:scale-105 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-tertiary-container text-on-tertiary-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  </div>
                  <span className="font-bold text-xs text-on-surface-variant">{foodProgress.pct}%</span>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm">Comida</p>
                  <div className="w-full h-8 bg-surface-container-highest rounded-full overflow-hidden inset-tray p-1">
                    <div className="h-full bg-secondary rounded-full relative" style={{ width: `${Math.max(foodProgress.pct, 5)}%` }}>
                      <div className="absolute right-1 top-1 w-4 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-6 space-y-4 hover:scale-105 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-primary-container text-on-primary-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
                  </div>
                  <span className="font-bold text-xs text-on-surface-variant">{funProgress.pct}%</span>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm">Lazer</p>
                  <div className="w-full h-8 bg-surface-container-highest rounded-full overflow-hidden inset-tray p-1">
                    <div className="h-full bg-secondary rounded-full relative" style={{ width: `${Math.max(funProgress.pct, 5)}%` }}>
                      <div className="absolute right-1 top-1 w-2 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── ÚLTIMOS GASTOS ── */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h3 className="font-headline font-bold text-xl">Últimos Gastos</h3>
            <button className="text-primary font-bold text-sm hover:underline">Ver tudo</button>
          </div>
          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map(exp => {
                const ui = getIconData(exp)
                const d = new Date(exp.date)
                const isToday = d.toDateString() === now.toDateString()
                const dateStr = isToday ? 'Hoje' : format(d, "dd MMM", { locale: ptBR })
                const timeStr = format(d, "HH:mm")
                const isFlagged = exp.parent_flagged && !exp.parent_flag_read

                return (
                  <div
                    key={exp.id}
                    className={`backdrop-blur-xl p-5 rounded-lg flex items-center justify-between squish-shadow transition-colors ${
                      isFlagged
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-surface-container-lowest/60 hover:bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full ${ui.bg} flex items-center justify-center ${ui.color}`}>
                        <span className="material-symbols-outlined text-2xl">{ui.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-on-surface">{exp.description || exp.category}</p>
                          {isFlagged && (
                            <span className="text-sm">🚩</span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant">{dateStr}, {timeStr}</p>
                      </div>
                    </div>
                    <p className="font-headline font-extrabold text-error text-lg">- {fmt(exp.amount)}</p>
                  </div>
                )
              })
            ) : (
              <p className="text-center text-on-surface-variant py-4 bg-surface-container rounded-lg font-medium">Nenhum gasto recente.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
