import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFamily } from '../../contexts/FamilyContext'
import { vibrate } from '../../lib/utils'
import type { Expense } from '../../types'
import { CATEGORY_CONFIG } from '../../types'

interface FlagTransactionSheetProps {
  expense: Expense | null
  open: boolean
  onClose: () => void
}

const SUGGESTION_CHIPS = [
  { label: 'Não reconheço', icon: '🤔' },
  { label: 'Muito caro', icon: '💸' },
  { label: 'Não autorizado', icon: '🚫' },
  { label: 'Confira comigo', icon: '💬' },
  { label: 'Cuidado!', icon: '⚠️' },
]

export function FlagTransactionSheet({ expense, open, onClose }: FlagTransactionSheetProps) {
  const { flagTransaction, unflagTransaction } = useFamily()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && expense) {
      setNote(expense.parent_flag_note ?? '')
    }
  }, [open, expense])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!expense) return null

  const cfg = CATEGORY_CONFIG[expense.category]
  const isFlagged = expense.parent_flagged

  async function handleSave() {
    if (!note.trim()) return
    vibrate(20)
    setSaving(true)
    await flagTransaction(expense!.id, note.trim())
    setSaving(false)
    onClose()
  }

  async function handleRemove() {
    vibrate([30, 30])
    setSaving(true)
    await unflagTransaction(expense!.id)
    setSaving(false)
    onClose()
  }

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[95] bg-white rounded-t-3xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
            </div>

            <div className="px-6 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3 pt-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: cfg.color + '20' }}
                >
                  {cfg.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{expense.title}</p>
                  <p className="text-sm text-on-surface-variant">
                    {fmt(expense.amount)} · {cfg.label}
                  </p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                  <span className="text-amber-500">🚩</span>
                  {isFlagged ? 'Editar Sinalização' : 'Sinalizar Gasto'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Seu filho verá esta mensagem quando abrir o gasto.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_CHIPS.map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => { setNote(label); vibrate(10) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                      note === label
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-amber-200'
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Custom note */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Mensagem personalizada
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ex: Conversa comigo antes de gastar nisso..."
                  rows={3}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 border border-outline-variant/20 focus:border-amber-300 outline-none resize-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {isFlagged && (
                  <button
                    onClick={handleRemove}
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl bg-surface-container text-error font-bold text-sm border border-error/20 hover:bg-error/5 transition-colors disabled:opacity-60"
                  >
                    Remover Flag
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !note.trim()}
                  className="flex-1 py-4 rounded-2xl bg-amber-500 text-white font-headline font-bold text-sm shadow-[0_4px_0_#b45309] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    '🚩 Sinalizar'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
