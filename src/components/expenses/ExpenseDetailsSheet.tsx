import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Check, Smartphone, Globe, Calendar, DollarSign, Tag, FileText } from 'lucide-react'
import { CATEGORY_CONFIG, PAYMENT_METHOD_LABELS } from '../../types'
import type { Expense } from '../../types'
import { ConfirmToast } from '../ui/ConfirmToast'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'

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
  const [confirm, setConfirm] = useState<{ open: boolean; mode: 'save' | 'delete' }>({ open: false, mode: 'save' })

  const { markFlagRead } = useApp()
  const { profile } = useAuth()
  const isChildOrTeen = profile?.account_type === 'child' || profile?.account_type === 'teen'

  useEffect(() => {
    if (expense && open) {
      setTitle(expense.title)
      setAmount(expense.amount.toString())
      setDate(expense.date)
      setConfirm({ open: false, mode: 'save' })

      // Auto-marca flag como lida quando criança abre o gasto sinalizado
      if (isChildOrTeen && expense.parent_flagged && !expense.parent_flag_read) {
        markFlagRead(expense.id)
      }
    }
  }, [expense, open, isChildOrTeen, markFlagRead])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!expense) return null

  const config = CATEGORY_CONFIG[expense.category]
  const sourceIcon = expense.source === 'telegram'
    ? <Smartphone size={14} className="text-blue-400" />
    : <Globe size={14} className="text-emerald-400" />
  const sourceLabel = expense.source === 'telegram' ? 'Telegram' : 'Aplicativo'

  const handleSave = () => {
    setConfirm({ open: true, mode: 'save' })
  }

  const handleDelete = () => {
    setConfirm({ open: true, mode: 'delete' })
  }

  const handleConfirm = () => {
    setConfirm({ open: false, mode: 'save' })
    if (confirm.mode === 'save') {
      onSave(expense.id, {
        title: title.trim() || expense.title,
        amount: Number(amount) || expense.amount,
        date: date || expense.date,
      })
      onClose()
    } else {
      onDelete(expense.id)
      onClose()
    }
  }

  const handleCancelConfirm = () => {
    setConfirm({ open: false, mode: 'save' })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ backgroundColor: 'var(--bg-primary)' }}
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Top Bar */}
          <div
            className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 safe-top"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-input)' }}
            >
              <X size={20} style={{ color: 'var(--text-primary)' }} />
            </motion.button>

            <h1
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Editar Despesa
            </h1>

            <motion.button
              onClick={handleSave}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              <Check size={20} className="text-white" />
            </motion.button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="px-4 py-5 flex flex-col gap-5">

              {/* ── BANNER: Flag do responsável (visível apenas para filhos) ── */}
              {isChildOrTeen && expense.parent_flagged && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200"
                >
                  <span className="text-2xl shrink-0 mt-0.5">🚩</span>
                  <div className="flex-1">
                    <p className="font-bold text-amber-800 text-sm">Seu responsável sinalizou este gasto</p>
                    {expense.parent_flag_note && (
                      <p className="text-amber-700 text-sm mt-1 font-medium">
                        "{expense.parent_flag_note}"
                      </p>
                    )}
                    {!expense.parent_flag_read && (
                      <span className="inline-block mt-2 text-xs bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        Novo
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Category Hero */}
              <div
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${config.color}15, ${config.color}08)`,
                  border: `1px solid ${config.color}25`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{
                    backgroundColor: config.color + '20',
                    boxShadow: `0 4px 16px ${config.color}20`,
                  }}
                >
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold" style={{ color: config.color }}>
                    {config.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-70">
                  {sourceIcon}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {sourceLabel}
                  </span>
                </div>
              </div>

              {/* Title Field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Tag size={13} />
                  Nome da Despesa
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Almoço no restaurante"
                  className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>

              {/* Amount + Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <DollarSign size={13} />
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={13} />
                    Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
              </div>

              {/* Description (read-only) */}
              {expense.description && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <FileText size={13} />
                    Descrição
                  </label>
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {expense.description}
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <div className="pt-2">
                <motion.button
                  onClick={handleDelete}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                  }}
                >
                  <Trash2 size={16} />
                  Excluir Despesa
                </motion.button>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Toast */}
      <ConfirmToast
        open={confirm.open}
        title={confirm.mode === 'delete' ? 'Excluir despesa?' : 'Salvar alterações?'}
        description={
          confirm.mode === 'delete'
            ? `"${expense?.title}" será removida permanentemente. Essa ação não pode ser desfeita.`
            : `Tem certeza que quer salvar as alterações em "${expense?.title}"?`
        }
        confirmLabel={confirm.mode === 'delete' ? 'Sim, excluir' : 'Sim, salvar'}
        cancelLabel="Cancelar"
        danger={confirm.mode === 'delete'}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </AnimatePresence>
  )
}
