import { useState } from 'react'
import { format } from 'date-fns'
import { ConfirmToast } from '../ui/ConfirmToast'
import { useApp } from '../../contexts/AppContext'
import { CATEGORY_CONFIG } from '../../types'
import type { Category, PaymentMethod, ExpenseType } from '../../types'
import { vibrate } from '../../lib/utils'

interface ExpenseFormProps {
  onSaved?: () => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
]

export function ExpenseForm({ onSaved }: ExpenseFormProps) {
  const { addExpense, settings, activeChildId, expenses } = useApp()
  const activeChild = activeChildId ? settings.children.find(c => c.id === activeChildId) : null
  const now = new Date()

  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('alimentacao')
  const [date, setDate] = useState(format(now, 'yyyy-MM-dd'))
  // Se for criança, sempre Dinheiro/Variável por padrão e ocultos
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(activeChild ? 'dinheiro' : 'pix')
  const [type, setType] = useState<ExpenseType>('variavel')
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [showBlock, setShowBlock] = useState(false)

  // Calcular total gasto pela criança no mês para verificação de limite
  const totalMonthChild = activeChild ? expenses
    .filter(e => e.child_id === activeChildId && new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear())
    .reduce((sum, e) => sum + e.amount, 0) : 0

  function resetForm() {
    setAmount('')
    setTitle('')
    setCategory('alimentacao')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setPaymentMethod(activeChild ? 'dinheiro' : 'pix')
    setType('variavel')
  }

  function handleAmountInput(val: string) {
    const cleaned = val.replace(/[^0-9,\.]/g, '')
    setAmount(cleaned)
  }

  function handleSubmit() {
    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (!numericAmount || numericAmount <= 0) return

    if (activeChild) {
      const remainingLimit = activeChild.allowance - totalMonthChild
      if (numericAmount > remainingLimit) {
        setShowBlock(true)
        vibrate([50, 50, 50])
        return
      }
    }

    setShowConfirm(true)
  }

  function handleConfirmSubmit() {
    const numericAmount = parseFloat(amount.replace(',', '.'))
    addExpense({
      title: title.trim() || CATEGORY_CONFIG[category].label,
      amount: numericAmount,
      category,
      date,
      paymentMethod,
      type,
      isRecurring: type === 'fixo',
    })
    setShowConfirm(false)
    resetForm()
    vibrate(50)
    if (onSaved) onSaved() // To trigger any parent state change (e.g. going back to home)
  }

  const billingInfo = (paymentMethod === 'credito' && !activeChild)
    ? (() => {
        const expDay = new Date(date + 'T12:00:00').getDate()
        return expDay > settings.creditCard.closingDay
          ? `Fatura mês seguinte (fecha dia ${settings.creditCard.closingDay})`
          : `Fatura mês atual (fecha dia ${settings.creditCard.closingDay})`
      })()
    : null

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0

  // Função para cores das chips de categoria
  const getCategoryColorClass = (idx: number, isSelected: boolean) => {
    if (!isSelected) return 'bg-white text-on-surface hover:bg-surface-container shadow-sm border border-outline-variant/30'
    const colors = [
      'bg-tertiary-container text-on-tertiary-container border-tertiary shadow-md transform scale-105',
      'bg-primary-container text-on-primary-container border-primary shadow-md transform scale-105',
      'bg-secondary-container text-on-secondary-container border-secondary shadow-md transform scale-105',
      'bg-surface-container-highest text-on-surface-variant border-outline shadow-md transform scale-105'
    ]
    return colors[idx % colors.length]
  }

  const getPaymentColorClass = (_val: string, isSelected: boolean) => {
    if (!isSelected) return 'bg-white text-on-surface-variant border border-outline-variant/30'
    return 'bg-secondary text-white font-bold squish-shadow scale-105'
  }

  return (
    <div className="min-h-screen bg-background font-body text-on-background flex flex-col pb-32">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky bg-[#fff4f6]/95 backdrop-blur-md shadow-[0_20px_40px_rgba(119,81,89,0.08)] z-40">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#775159] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159]">BolsoCheio</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer border-2 border-white squish-shadow">
            <span className="text-xl leading-none">{activeChild ? '👧' : '🧑‍🏫'}</span>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-12 relative overflow-hidden">
        {/* Decorative Background "Toy" Elements */}
        <div className="absolute top-20 -left-10 w-40 h-40 bg-tertiary-container rounded-full opacity-20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-40 -right-10 w-60 h-60 bg-primary-container rounded-full opacity-30 blur-3xl pointer-events-none"></div>

        {/* Hero Section / Context */}
        <div className="text-center mb-12 relative z-10">
          <h2 className="font-headline font-extrabold text-4xl text-primary leading-tight mb-4">Novo Gasto?</h2>
          <p className="text-on-surface-variant font-medium">O porquinho está com fome!</p>
        </div>

        {/* Add Expense "Coin Slot" Board Simulator */}
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl squish-shadow p-6 sm:p-8 mt-auto relative overflow-visible border-b-8 border-primary-container z-10 mb-8">
          
          {/* Coin Slot Visual (Topo do Modal Simulator) */}
          <div className="absolute -top-3 sm:-top-6 left-1/2 -translate-x-1/2 w-32 h-4 sm:h-5 bg-primary/90 rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)]"></div>
          
          <div className="space-y-10">
            {/* Amount Input Section (The Golden Coin) */}
            <div className="flex flex-col items-center pt-2 sm:pt-4">
              <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full gold-specular flex flex-col items-center justify-center p-4 transition-transform hover:scale-105 active:scale-95 duration-200 cursor-text shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                <span className="text-secondary font-headline font-bold text-xs tracking-widest uppercase mb-1 z-10">VALOR</span>
                <div className="flex items-baseline z-10 justify-center">
                  <span className="text-secondary font-bold text-xl sm:text-2xl mr-1">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountInput(e.target.value)}
                    placeholder="0,00"
                    className="bg-transparent border-none text-secondary font-headline font-extrabold text-4xl sm:text-[2.75rem] w-32 sm:w-36 text-center focus:ring-0 placeholder:text-secondary/40 outline-none p-0"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Category Selection (Bubble Chips) */}
            <div className="space-y-4 pt-4">
              <p className="font-headline font-bold text-primary text-center uppercase tracking-widest text-xs">
                Escolha uma Categoria
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {(Object.entries(CATEGORY_CONFIG) as [Category, { label: string; emoji: string; color: string }][]).map(
                  ([key, cfg], idx) => {
                    const isSelected = category === key
                    return (
                      <button
                        key={key}
                        onClick={() => { setCategory(key); vibrate(20) }}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-xs sm:text-sm hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 border-2 ${getCategoryColorClass(idx, isSelected)}`}
                      >
                        <span className="text-lg leading-none">{cfg.emoji}</span>
                        <span>{cfg.label.split(' ')[0]}</span>
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {/* Description Input (Inset Tray) */}
              <div className="space-y-2">
                <label className="font-headline font-bold text-primary text-[10px] sm:text-xs ml-4 uppercase tracking-widest">
                  {activeChild ? 'O QUE VOCÊ COMPROU?' : 'NOTAS'}
                </label>
                <div className="w-full bg-surface-container-low rounded-xl p-3 sm:p-4 inner-press border border-outline-variant/10">
                  <input
                    type="text"
                    placeholder="Ex: Alfajor na cantina"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 font-medium text-sm sm:text-base outline-none p-0"
                  />
                </div>
              </div>

              {/* Data Input (Inset Tray) - Menos importante para criança */}
              {!activeChild && (
                <div className="space-y-2">
                  <label className="font-headline font-bold text-primary text-[10px] sm:text-xs ml-4 uppercase tracking-widest">
                    DATA
                  </label>
                  <div className="w-full bg-surface-container-low rounded-xl p-3 sm:p-4 inner-press border border-outline-variant/10">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-medium text-sm sm:text-base outline-none p-0 appearance-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pagamento & Tipo */}
            {!activeChild && (
              <div className="space-y-4 pt-2">
                <div className="bg-surface-container rounded-2xl p-1 flex border border-outline-variant/20 shadow-sm">
                  {(['variavel', 'fixo'] as ExpenseType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setType(t); vibrate(10) }}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                        type === t ? 'bg-primary text-white shadow-md scale-100' : 'text-on-surface-variant bg-transparent opacity-70 hover:opacity-100 scale-95'
                      }`}
                    >
                      {t === 'variavel' ? 'Gasto Único' : 'Despesa Fixa'}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="font-headline font-bold text-primary text-center text-[10px] sm:text-xs uppercase tracking-widest px-2">
                    Forma de Pagamento
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {PAYMENT_METHODS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => { setPaymentMethod(value); vibrate(10) }}
                        className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 ${getPaymentColorClass(value, paymentMethod === value)}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {billingInfo && (
                    <p className="text-[10px] sm:text-xs font-bold text-secondary text-center px-4 py-2 mt-2 bg-secondary-container/30 rounded-full w-fit mx-auto animate-pulse">
                      {billingInfo}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Save Button (Squishy CTA) */}
            <button
              onClick={handleSubmit}
              disabled={!amount || numericAmount <= 0}
              className="w-full py-5 sm:py-6 rounded-full bg-primary text-on-primary font-headline font-extrabold text-lg sm:text-xl shadow-[0_12px_0_#502e36] active:shadow-none active:translate-y-2 transition-all duration-75 flex items-center justify-center gap-3 group mt-10 disabled:opacity-50 disabled:active:shadow-[0_12px_0_#502e36] disabled:active:translate-y-0 disabled:cursor-not-allowed"
            >
              <span>Alimentar o Porquinho</span>
              <span className="material-symbols-outlined group-active:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                savings
              </span>
            </button>
          </div>
        </div>
      </main>

      <ConfirmToast
        open={showConfirm}
        title="Alimentar o porquinho?"
        description={`Dar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericAmount)} para a pilha de "${title.trim() || CATEGORY_CONFIG[category].label}"`}
        confirmLabel="Sim, Oinc!"
        cancelLabel="Cancelar"
        danger={false}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      {activeChild && (
        <ConfirmToast
          open={showBlock}
          title="Oinc! Sem energia!"
          description={`Você tentou usar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericAmount)}, mas só sobraram ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeChild.allowance - totalMonthChild)} da sua mesada.`}
          confirmLabel="Poxa..."
          cancelLabel="Voltar"
          danger={true}
          onConfirm={() => setShowBlock(false)}
          onCancel={() => setShowBlock(false)}
        />
      )}
    </div>
  )
}
