import { useApp } from '../contexts/AppContext'

export function Insights() {
  const { expenses, settings } = useApp()
  const { envelopes } = settings
  const now = new Date()

  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  // Calculate totals
  const totalLimit = envelopes.reduce((sum, env) => sum + env.limit, 0) || 5000 // default 5000 se nao tiver limit
  const totalSpent = thisMonth.reduce((sum, e) => sum + e.amount, 0)
  const remaining = Math.max(0, totalLimit - totalSpent)

  // Categorize for pie chart
  const categories: Record<string, number> = {}
  thisMonth.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + e.amount
  })

  const spentEssentials = (categories['alimentacao'] || 0) + (categories['transporte'] || 0)
  const spentFun = categories['lazer'] || 0
  const spentOthers = categories['outros'] || 0

  const getPct = (val: number) => totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen pb-32 bg-surface font-body text-on-surface selection:bg-primary-container">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 backdrop-blur-md shadow-[0_20px_40px_rgba(119,81,89,0.08)] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#775159] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
          <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159]">BolsoCheio</h1>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-white squish-shadow">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
        {/* Hero Section: Trilha do Tesouro */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-label uppercase tracking-widest text-primary font-bold text-sm">Progresso do Mês</span>
              <h2 className="font-headline text-5xl font-extrabold text-on-surface mt-2 tracking-tight">Trilha do Tesouro</h2>
            </div>
            <div className="bg-secondary-container px-6 py-3 rounded-full flex items-center gap-2 squish-shadow">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="font-bold text-on-secondary-container">Nível: Poupador</span>
            </div>
          </div>

          {/* Path Visualization */}
          <div className="relative bg-surface-container rounded-xl p-8 min-h-[400px] overflow-hidden toy-path">
            {/* Milestone Path SVG Representation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <svg className="w-full h-full" fill="none" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 350C150 350 150 50 300 50C450 50 450 350 600 350C750 350 750 150 850 150" stroke="#fdcad3" strokeWidth="24" strokeLinecap="round"></path>
                <path d="M50 350C150 350 150 50 300 50C350 50 380 150 400 200" stroke="#775159" strokeWidth="24" strokeLinecap="round"></path>
              </svg>
            </div>

            {/* Milestone: Start */}
            <div className="absolute left-4 bottom-10 group z-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center squish-shadow border-4 border-primary-container hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
              </div>
              <div className="mt-2 text-center bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">Início</div>
            </div>

            {/* Milestone: Golden Egg */}
            <div className="absolute left-[30%] top-[10%] group z-10 hidden sm:block">
              <div className="w-20 h-24 bg-specular-gold rounded-[40%_40%_50%_50%] flex items-center justify-center squish-shadow border-4 border-white hover:scale-110 transition-transform cursor-pointer">
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>egg</span>
              </div>
              <div className="mt-4 text-center bg-secondary-container px-4 py-2 rounded-xl text-sm font-bold shadow-md">
                Meio Caminho<br/><span className="text-[10px] opacity-70">GOGOGO</span>
              </div>
            </div>

            {/* Milestone: Current Position */}
            <div className="absolute left-[45%] top-[45%] z-20">
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center squish-shadow animate-bounce">
                  <span className="material-symbols-outlined text-white">person_pin_circle</span>
                </div>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-on-surface text-white px-3 py-1 rounded-lg text-[10px] whitespace-nowrap">Você está aqui!</div>
              </div>
            </div>

            {/* Milestone: Full Jar (The Goal) */}
            <div className="absolute right-4 bottom-10 group z-10 w-28 text-center flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-tertiary-container rounded-full flex items-center justify-center squish-shadow border-4 border-white opacity-80 hover:opacity-100 hover:scale-110 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-tertiary text-4xl sm:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
              </div>
              <div className="mt-2 text-center bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap">
                Meta: {fmt(totalLimit)}<br/>
                <span className="text-[10px] text-tertiary">Restam {fmt(remaining)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Insights Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Category Breakdown (The Candy Pie) */}
          <div className="md:col-span-7 bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center space-y-8 squish-shadow">
            <h3 className="font-headline text-2xl font-bold w-full text-left">Onde está o Tesouro?</h3>
            <div className="relative w-48 h-48 sm:w-64 sm:h-64">
              {/* Custom Pie-like visualization with rounded pods */}
              <div className="absolute inset-0 rounded-full border-[16px] sm:border-[24px] border-tertiary-container"></div>
              {/* Fake wedges for layout since SVG pie chart can be tricky directly in css without defined percentages */}
              <div className="absolute inset-0 rounded-full border-[16px] sm:border-[24px] border-primary-container" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 70%)' }}></div>
              <div className="absolute inset-0 rounded-full border-[16px] sm:border-[24px] border-secondary-container" style={{ clipPath: 'polygon(50% 50%, 0 70%, 0 0, 50% 0)' }}></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-black text-on-surface">{fmt(totalSpent)}</span>
                <span className="text-xs font-bold text-on-surface/60 uppercase">Este Mês</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex items-center gap-3 bg-white p-4 rounded-full shadow-sm">
                <div className="w-4 h-4 rounded-full bg-secondary-container shrink-0"></div>
                <span className="font-bold text-sm truncate">Essenciais ({getPct(spentEssentials)}%)</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-full shadow-sm">
                <div className="w-4 h-4 rounded-full bg-primary-container shrink-0"></div>
                <span className="font-bold text-sm truncate">Lazer ({getPct(spentFun)}%)</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-full shadow-sm">
                <div className="w-4 h-4 rounded-full bg-tertiary-container shrink-0"></div>
                <span className="font-bold text-sm truncate">Outros ({getPct(spentOthers)}%)</span>
              </div>
              <div className="flex items-center justify-center gap-3 bg-white p-4 rounded-full shadow-sm border-2 border-dashed border-outline-variant/30 text-center">
                <span className="font-bold text-xs text-outline mx-auto truncate">+ Ver detalhes</span>
              </div>
            </div>
          </div>

          {/* AI Piggy Tips */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="bg-primary-container rounded-xl p-8 squish-shadow relative overflow-hidden flex-1">
              <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                <span className="material-symbols-outlined text-9xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6 z-10 relative">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center squish-shadow overflow-hidden p-1 shrink-0">
                  <span className="text-4xl">🐷</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-on-primary-container leading-tight">Dica do Piggy</h4>
                  <p className="text-xs text-on-primary-container/70">Inteligência Amigável</p>
                </div>
              </div>
              
              <p className="text-on-primary-container leading-relaxed font-medium relative z-10 text-sm sm:text-base">
                 "Oinc! Notei que você gastou um pouco mais com <span className="bg-white/40 px-2 rounded">Delivery</span> este mês. Que tal cozinhar algo divertido no próximo fim de semana? Isso pode te dar um boost na sua Trilha!"
              </p>
              
              <button className="mt-8 w-full bg-primary text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_0_rgba(0,0,0,0.1)] relative z-10">
                <span className="material-symbols-outlined text-sm">task_alt</span>
                Aceitar Desafio
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-tertiary text-on-tertiary rounded-xl p-8 squish-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">Despesas Hoje</span>
                  <h5 className="text-3xl font-black mt-1">
                     {fmt(thisMonth.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).reduce((s, e) => s + e.amount, 0))}
                  </h5>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">trending_up</span>
                </div>
              </div>
              
              <div className="mt-6 h-12 w-full bg-white/10 rounded-full relative overflow-hidden">
                <div className="h-full w-[100%] bg-secondary-fixed rounded-full relative">
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/40 rounded-full blur-[2px]"></div>
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-center">Continua assim, o porquinho agradece! ✨</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
