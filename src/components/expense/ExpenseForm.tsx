import { useState } from 'react'
import { format } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import { useApp } from '../../contexts/AppContext'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../../types'
import type { Category, PaymentMethod, ExpenseType } from '../../types'
import { extractTags } from '../../lib/utils'

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
}

const categoryOptions = Object.entries(CATEGORY_CONFIG).map(([value, { label, emoji }]) => ({
  value,
  label: `${emoji} ${label}`,
}))

const paymentOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const typeOptions = [
  { value: 'variavel', label: 'Variável' },
  { value: 'fixo', label: 'Fixo' },
]

export function ExpenseForm({ open, onClose }: ExpenseFormProps) {
  const { addExpense, settings } = useApp()

  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('alimentacao')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [type, setType] = useState<ExpenseType>('variavel')
  const [description, setDescription] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  function resetForm() {
    setAmount('')
    setTitle('')
    setCategory('alimentacao')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setPaymentMethod('pix')
    setType('variavel')
    setDescription('')
    setIsRecurring(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (!numericAmount || numericAmount <= 0 || !title.trim()) return

    const tags = extractTags(description)

    addExpense({
      title: title.trim(),
      amount: numericAmount,
      category,
      date,
      paymentMethod,
      type,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isRecurring,
    })

    resetForm()
    onClose()
  }

  // Mostra aviso de fatura quando pagamento é cartão
  const showBillingInfo = paymentMethod === 'credito'
  const billingInfo = showBillingInfo
    ? (() => {
        const expDay = new Date(date + 'T12:00:00').getDate()
        if (expDay > settings.creditCard.closingDay) {
          return `Cairá na fatura do mês seguinte (fecha dia ${settings.creditCard.closingDay})`
        }
        return `Cairá na fatura do mês atual (fecha dia ${settings.creditCard.closingDay})`
      })()
    : null

  return (
    <BottomSheet open={open} onClose={onClose} title="Novo Gasto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Valor */}
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Valor (R$)
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-2xl font-bold outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Título */}
        <Input
          label="Título"
          placeholder="Ex: Almoço no restaurante"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Categoria e Tipo (lado a lado) */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoria"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          />
          <Select
            label="Tipo"
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as ExpenseType)}
          />
        </div>

        {/* Data e Pagamento (lado a lado) */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Pagamento"
            options={paymentOptions}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          />
        </div>

        {/* Info de fatura do cartão */}
        {billingInfo && (
          <div
            className="px-3 py-2 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              opacity: 0.9,
            }}
          >
            💳 {billingInfo}
          </div>
        )}

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Descrição (opcional - use #tags)
          </label>
          <textarea
            placeholder="Ex: Almoço com amigos #social #restaurante"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
        </div>

        {/* Gasto Recorrente */}
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Gasto Mensal Fixo
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Repete todo mês automaticamente
            </p>
          </div>
          <Toggle enabled={isRecurring} onChange={setIsRecurring} />
        </div>

        {/* Botão Submit */}
        <Button type="submit" size="lg" className="w-full mt-2">
          Adicionar Gasto
        </Button>
      </form>
    </BottomSheet>
  )
}
