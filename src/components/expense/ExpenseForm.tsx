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

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'pix', label: 'Pix', icon: '⚡' },
  { value: 'credito', label: 'Crédito', icon: '💳' },
  { value: 'debito', label: 'Débito', icon: '🏦' },
  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
]

export function ExpenseForm({ onSaved }: ExpenseFormProps) {
  const { addExpense, settings } = useApp()
  const now = new Date()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('alimentacao')
  const [date, setDate] = useState(format(now, 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [type, setType] = useState<ExpenseType>('variavel')
  const [showConfirm, setShowConfirm] = useState(false)

  function resetForm() {
    setAmount('')
    setDescription('')
    setCategory('alimentacao')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setPaymentMethod('pix')
    setType('variavel')
  }

  function handleAmountInput(val: string) {
    const cleaned = val.replace(/[^0-9,\.]/g, '')
    setAmount(cleaned)
  }

  function handleSubmit() {
    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (!numericAmount || numericAmount <= 0) {
      vibrate([50, 50])
      return
    }
    setShowConfirm(true)
  }

  function handleConfirmSubmit() {
    const numericAmount = parseFloat(amount.replace(',', '.'))
    addExpense({
      title: description.trim() || CATEGORY_CONFIG[category].label,
      amount: numericAmount,
      category,
      date,
      paymentMethod,
      type,
      isRecurring: type === 'fixo',
      description: description.trim() || undefined,
    })
    setShowConfirm(false)
    resetForm()
    vibrate(50)
    if (onSaved) onSaved()
  }

  const billingInfo = paymentMethod === 'credito'
    ? (() => {
        const expDay = new Date(date + 'T12:00:00').getDate()
        return expDay > settings.creditCard.closingDay
          ? `Fatura do próximo mês (fecha dia ${settings.creditCard.closingDay})`
          : `Fatura deste mês (fecha dia ${settings.creditCard.closingDay})`
      })()
    : null

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen bg-[#fff4f6] dark:bg-slate-950 font-body pb-32">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159] dark:text-pink-300">
              Novo Gasto
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Amount Input */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-pink-100 dark:border-slate-800 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50 mb-2">
            Valor
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-[#775159]/50 dark:text-pink-300/50">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountInput(e.target.value)}
              placeholder="0,00"
              className="bg-transparent text-center font-headline font-black text-5xl text-[#775159] dark:text-pink-200 w-48 outline-none placeholder:text-[#775159]/20 dark:placeholder:text-pink-300/20"
              autoFocus
            />
          </div>
        </div>

        {/* Category */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
            Categoria
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [Category, { label: string; emoji: string; color: string }][]).map(
              ([key, cfg]) => {
                const isSelected = category === key
                return (
                  <button
                    key={key}
                    onClick={() => { setCategory(key); vibrate(15) }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#775159] dark:bg-pink-600 text-white scale-105'
                        : 'bg-pink-50 dark:bg-slate-800 text-[#775159] dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-lg">{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </button>
                )
              }
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
            Descrição (opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Almoço no restaurante"
            className="w-full bg-pink-50 dark:bg-slate-800 border border-pink-100 dark:border-slate-700 rounded-xl px-4 py-3 text-[#775159] dark:text-pink-200 outline-none focus:border-[#775159] dark:focus:border-pink-500 placeholder:text-[#775159]/30 dark:placeholder:text-pink-300/30"
          />
        </div>

        {/* Date & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-pink-50 dark:bg-slate-800 border border-pink-100 dark:border-slate-700 rounded-xl px-4 py-3 text-[#775159] dark:text-pink-200 outline-none"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
              Tipo
            </label>
            <div className="flex gap-2">
              {(['variavel', 'fixo'] as ExpenseType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); vibrate(10) }}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                    type === t
                      ? 'bg-[#775159] dark:bg-pink-600 text-white'
                      : 'bg-pink-50 dark:bg-slate-800 text-[#775159]/60 dark:text-pink-300/60'
                  }`}
                >
                  {t === 'variavel' ? 'Único' : 'Fixo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
            Forma de Pagamento
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => { setPaymentMethod(value); vibrate(10) }}
                className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === value
                    ? 'bg-[#775159] dark:bg-pink-600 text-white scale-[1.02]'
                    : 'bg-pink-50 dark:bg-slate-800 text-[#775159] dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          {billingInfo && (
            <p className="text-xs text-center text-[#775159]/60 dark:text-pink-300/60 bg-pink-50 dark:bg-slate-800 rounded-lg py-2">
              {billingInfo}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!amount || numericAmount <= 0}
          className="w-full py-5 rounded-2xl bg-[#775159] dark:bg-pink-600 text-white font-headline font-bold text-lg shadow-[0_8px_0_#502e36] dark:shadow-[0_8px_0_#9f1239] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:shadow-[0_8px_0_#502e36] disabled:active:translate-y-0 flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
          <span>Registrar Gasto</span>
        </button>
      </main>

      <ConfirmToast
        open={showConfirm}
        title="Confirmar gasto?"
        description={`${fmt(numericAmount)} em ${description.trim() || CATEGORY_CONFIG[category].label}`}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        danger={false}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
