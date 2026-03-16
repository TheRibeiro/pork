import { useState } from 'react'
import { Moon, Sun, CreditCard, Wallet, ChevronRight, LogOut, User } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { BottomSheet } from '../components/ui/BottomSheet'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { TelegramVerification } from '../components/profile/TelegramVerification'
import { CATEGORY_CONFIG } from '../types'
import type { Category } from '../types'
import { formatCurrency } from '../lib/utils'

export function Settings() {
  const { settings, updateSettings, updateEnvelope, theme, toggleTheme } = useApp()
  const { user, profile, isOnline, signOut } = useAuth()
  const [showCardConfig, setShowCardConfig] = useState(false)
  const [showEnvelopes, setShowEnvelopes] = useState(false)
  const [closingDay, setClosingDay] = useState(String(settings.creditCard.closingDay))
  const [dueDay, setDueDay] = useState(String(settings.creditCard.dueDay))

  function saveCardConfig() {
    const closing = Math.min(Math.max(parseInt(closingDay) || 1, 1), 31)
    const due = Math.min(Math.max(parseInt(dueDay) || 1, 1), 31)
    updateSettings({
      creditCard: { closingDay: closing, dueDay: due },
    })
    setShowCardConfig(false)
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Configurações
      </h1>

      {/* Perfil do Usuário (só quando logado) */}
      {isOnline && user && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full p-2.5 rounded-xl transition-colors hover:bg-red-500/10"
          >
            <LogOut size={16} className="text-red-400" />
            <span className="text-sm text-red-400">Sair da conta</span>
          </button>
        </Card>
      )}

      {/* Telegram Bot (só quando logado) */}
      {isOnline && user && <TelegramVerification />}

      {/* Tema */}
      <Card>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Aparência
        </h3>
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full p-3 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon size={20} style={{ color: 'var(--text-primary)' }} />
            ) : (
              <Sun size={20} style={{ color: 'var(--text-primary)' }} />
            )}
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Toque para alternar
          </span>
        </button>
      </Card>

      {/* Cartão de Crédito */}
      <Card>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Cartão de Crédito
        </h3>
        <button
          onClick={() => setShowCardConfig(true)}
          className="flex items-center justify-between w-full p-3 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div className="flex items-center gap-3">
            <CreditCard size={20} style={{ color: 'var(--text-primary)' }} />
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Datas da Fatura
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Fecha dia {settings.creditCard.closingDay} · Vence dia{' '}
                {settings.creditCard.dueDay}
              </p>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
      </Card>

      {/* Envelopes */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Teto de Gastos (Envelopes)
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowEnvelopes(true)}>
            Editar
          </Button>
        </div>

        {settings.envelopes.length === 0 ? (
          <button
            onClick={() => setShowEnvelopes(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--bg-input)' }}
          >
            <Wallet size={20} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum teto definido. Toque para configurar.
            </p>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {settings.envelopes.map((env) => {
              const config = CATEGORY_CONFIG[env.category]
              return (
                <div
                  key={env.category}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-input)' }}
                >
                  <div className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(env.limit)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* About */}
      <Card>
        <div className="text-center py-2">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            BolsoCheio
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Finanças Inteligentes · v2.0.0
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {isOnline
              ? 'Dados sincronizados na nuvem'
              : 'Dados salvos localmente no dispositivo'}
          </p>
        </div>
      </Card>

      {/* Card Config Sheet */}
      <BottomSheet
        open={showCardConfig}
        onClose={() => setShowCardConfig(false)}
        title="Configurar Cartão de Crédito"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Dia de Fechamento"
            type="number"
            min="1"
            max="31"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
            placeholder="Ex: 25"
          />
          <Input
            label="Dia de Vencimento"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="Ex: 5"
          />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Gastos no cartão feitos após o dia de fechamento serão contabilizados na fatura do mês
            seguinte.
          </p>
          <Button size="lg" className="w-full" onClick={saveCardConfig}>
            Salvar
          </Button>
        </div>
      </BottomSheet>

      {/* Envelopes Sheet */}
      <BottomSheet
        open={showEnvelopes}
        onClose={() => setShowEnvelopes(false)}
        title="Teto de Gastos por Categoria"
      >
        <EnvelopeEditor
          envelopes={settings.envelopes}
          onUpdate={updateEnvelope}
          onClose={() => setShowEnvelopes(false)}
        />
      </BottomSheet>
    </div>
  )
}

interface EnvelopeEditorProps {
  envelopes: { category: Category; limit: number }[]
  onUpdate: (category: Category, limit: number) => void
  onClose: () => void
}

function EnvelopeEditor({ envelopes, onUpdate, onClose }: EnvelopeEditorProps) {
  const categories = Object.keys(CATEGORY_CONFIG) as Category[]
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    categories.forEach((cat) => {
      const env = envelopes.find((e) => e.category === cat)
      initial[cat] = env ? String(env.limit) : ''
    })
    return initial
  })

  function handleSave() {
    categories.forEach((cat) => {
      const limit = parseFloat(values[cat]?.replace(',', '.') || '0')
      onUpdate(cat, limit >= 0 ? limit : 0)
    })
    onClose()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Defina um teto mensal por categoria. Deixe em branco ou 0 para não limitar.
      </p>
      {categories.map((cat) => {
        const config = CATEGORY_CONFIG[cat]
        return (
          <div key={cat} className="flex items-center gap-3">
            <span className="text-lg w-8 text-center">{config.emoji}</span>
            <span
              className="text-sm font-medium flex-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {config.label}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={values[cat]}
              onChange={(e) => setValues((v) => ({ ...v, [cat]: e.target.value }))}
              className="w-24 px-3 py-2 rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
        )
      })}
      <Button size="lg" className="w-full mt-2" onClick={handleSave}>
        Salvar Limites
      </Button>
    </div>
  )
}
