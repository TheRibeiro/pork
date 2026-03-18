import { useState, useEffect } from 'react'
import { Trash2, Save, Smartphone, Globe } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../../types'
import type { Expense } from '../../types'

interface ExpenseDetailsSheetProps {
  expense: Expense | null
  open: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onSave: (id: string, updates: Partial<Expense>) => void
}

export function ExpenseDetailsSheet({ expense, open, onClose, onDelete, onSave }: ExpenseDetailsSheetProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (expense && open) {
      setTitle(expense.title)
      setAmount(expense.amount.toString())
      setDate(expense.date)
    }
  }, [expense, open])

  if (!expense) return null

  const handleSave = () => {
    onSave(expense.id, {
      title,
      amount: Number(amount) || expense.amount,
      date,
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete(expense.id)
    onClose()
  }

  const config = CATEGORY_CONFIG[expense.category]
  const sourceIcon = expense.source === 'telegram' ? <Smartphone size={16} className="text-blue-400" /> : <Globe size={16} className="text-emerald-400" />
  const sourceLabel = expense.source === 'telegram' ? 'Via Telegram' : 'Via Aplicativo'

  return (
    <BottomSheet open={open} onClose={onClose} title="Detalhes da Transação">
      <div className="flex flex-col gap-4">

        {/* Header Visualizer */}
        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{
              backgroundColor: config.color + '20',
              border: `1px solid ${config.color}30`
            }}
          >
            {config.emoji}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
            </p>
          </div>
        </div>

        {/* Edit fields */}
        <div className="space-y-3">
          <Input
            label="Nome da Despesa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Read-only metadata */}
        <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl space-y-2">
          {expense.description && (
             <div className="flex justify-between items-center">
               <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Descrição:</span>
               <span className="text-xs font-medium text-right max-w-[60%] truncate" style={{ color: 'var(--text-primary)' }}>{expense.description}</span>
             </div>
          )}
          <div className="flex justify-between items-center">
             <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Origem:</span>
             <div className="flex items-center gap-1.5 opacity-80">
                {sourceIcon}
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{sourceLabel}</span>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="danger" size="lg" className="flex-1 flex items-center justify-center gap-2" onClick={handleDelete}>
            <Trash2 size={16} /> Excluir
          </Button>
          <Button variant="primary" size="lg" className="flex-1 flex items-center justify-center gap-2" onClick={handleSave}>
            <Save size={16} /> Salvar
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
