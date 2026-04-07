import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function History() {
  const { expenses } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())

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

  // Group by day
  const grouped = filtered.reduce<Record<string, typeof expenses>>((acc, exp) => {
    const key = format(new Date(exp.date), 'dd/MM/yyyy', { locale: ptBR })
    if (!acc[key]) acc[key] = []
    acc[key].push(exp)
    return acc
  }, {})

  const sortedDays = Object.keys(grouped).sort((a, b) => {
    const [da, ma, ya] = a.split('/').map(Number)
    const [db, mb, yb] = b.split('/').map(Number)
    return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime()
  })

  // Style rotation based on index to recreate the "scrapbook" sticker effect
  const getRotation = (idx: number) => {
    if (idx % 3 === 0) return 'rotate-1'
    if (idx % 3 === 1) return '-rotate-1'
    return 'rotate-2'
  }

  const getDayInfo = (dateStr: string) => {
    const [d, m, y] = dateStr.split('/')
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return { label: 'Hoje! ✨', badge: 'bg-tertiary-container text-on-tertiary-container', rot: '-rotate-6' }
    } else if (date.toDateString() === yesterday.toDateString()) {
      return { label: 'Ontem 🕰️', badge: 'bg-primary-container text-on-primary-container', rot: 'rotate-2' }
    }
    return { label: format(date, "dd MMM", { locale: ptBR }), badge: 'bg-secondary-container text-on-secondary-container', rot: 'rotate-1' }
  }

  const getIconData = (e: typeof expenses[0]) => {
    switch (e.category) {
      case 'alimentacao': return { icon: 'restaurant', iconAlt: 'icecream', bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed' }
      case 'lazer': return { icon: 'movie', iconAlt: 'sports_esports', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' }
      case 'transporte': return { icon: 'local_taxi', iconAlt: 'directions_bus', bg: 'bg-primary-container', text: 'text-on-primary-container' }
      default: return { icon: 'shopping_bag', iconAlt: 'store', bg: 'bg-surface-container-highest', text: 'text-primary' }
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-pattern font-body text-on-surface">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 backdrop-blur-md shadow-[0_20px_40px_rgba(119,81,89,0.08)] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#775159] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
          <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159]">BolsoCheio</h1>
        </div>
        <div className="flex gap-4">
          <button className="hover:scale-105 transition-transform duration-200 active:scale-95 text-[#775159]">
            <span className="material-symbols-outlined text-2xl">search</span>
          </button>
        </div>
      </header>

      <main className="px-6 pt-10 max-w-2xl mx-auto">
        {/* Title Section */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-full font-headline font-bold text-sm tracking-widest uppercase mb-4 shadow-sm">
            Log de Aventuras
          </div>
          <h2 className="font-headline font-extrabold text-4xl text-primary tracking-tight">Onde o dinheiro viajou?</h2>
        </div>

        {/* Chunky Navigation */}
        <div className="flex justify-between items-center mb-10 px-4">
          <button 
            onClick={prevMonth}
            className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_8px_0_rgba(119,81,89,0.1)] active:translate-y-1 active:shadow-none transition-all text-primary"
          >
            <span className="material-symbols-outlined text-3xl font-bold">arrow_back_ios_new</span>
          </button>
          <div className="text-center">
            <p className="font-headline font-bold text-lg text-on-surface">{monthLabelCap}</p>
            <p className="text-on-surface-variant text-sm font-medium">{filtered.length} missões concluídas</p>
          </div>
          <button 
            onClick={nextMonth}
            className="bg-surface-container-lowest p-5 rounded-xl shadow-[0_8px_0_rgba(119,81,89,0.1)] active:translate-y-1 active:shadow-none transition-all text-primary"
          >
            <span className="material-symbols-outlined text-3xl font-bold">arrow_forward_ios</span>
          </button>
        </div>

        {/* Scrapbook Sections */}
        <div className="space-y-16">
          {sortedDays.length === 0 ? (
            <div className="mt-20 flex flex-col items-center text-center opacity-70">
              <span className="text-5xl mb-4">🌪️</span>
              <p className="text-lg font-bold text-primary">Nenhuma aventura aqui</p>
            </div>
          ) : (
            sortedDays.map((dayStr, dayIdx) => {
              const dayExpenses = grouped[dayStr]
              const dayInfo = getDayInfo(dayStr)

              return (
                <section key={dayStr} className="relative mt-8">
                  {/* Title Badge Sticker */}
                  <div className={`absolute -left-4 -top-6 ${dayInfo.rot} ${dayInfo.badge} px-6 py-3 rounded-lg font-headline font-black text-xl shadow-lg z-10`}>
                    {dayInfo.label}
                  </div>
                  
                  <div className="grid gap-8 pt-8">
                    {dayExpenses.map((exp, idx) => {
                      const rotation = getRotation(idx + dayIdx)
                      const ui = getIconData(exp)
                      
                      return (
                        <div 
                          key={exp.id} 
                          className={`bg-surface-container-lowest p-6 rounded-xl shadow-[0_15px_30px_rgba(119,81,89,0.06)] border-4 border-white ${rotation} hover:rotate-0 transition-transform cursor-pointer relative overflow-hidden group`}
                        >
                          {/* Ghost background icon */}
                          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-8xl">{ui.iconAlt}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 sm:gap-6 z-10 relative">
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${ui.bg} flex items-center justify-center border-4 border-dashed border-white/40 shrink-0`}>
                              <span className={`material-symbols-outlined ${ui.text} text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {ui.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-headline font-bold text-lg sm:text-xl text-on-surface truncate">{exp.description || exp.category}</h4>
                              <p className="text-on-surface-variant font-medium text-xs sm:text-sm capitalize">{exp.category}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-headline font-black text-lg sm:text-2xl text-error">- {fmt(exp.amount)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })
          )}
        </div>

        {/* Fun Sticker Decoration */}
        {sortedDays.length > 0 && (
          <div className="my-20 flex justify-center pb-20">
            <div className="relative w-48 h-48 rounded-full border-8 border-dashed border-primary/20 flex items-center justify-center">
              <span className="text-8xl animate-pulse">🐷</span>
              <div className="absolute -right-4 top-0 bg-secondary px-4 py-2 rounded-full text-white font-black text-sm rotate-12 shadow-lg">
                POUPADOR!
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
