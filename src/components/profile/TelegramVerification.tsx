import { useState, useEffect, useRef } from 'react'
import { Send, Check, Shield, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const BOT_USERNAME = 'LeofinancaTeste_bot'

export function TelegramVerification() {
  const { profile, updateProfile, refreshProfile } = useAuth()
  const [step, setStep] = useState<'idle' | 'waiting' | 'verified'>(
    profile?.is_telegram_verified ? 'verified' : 'idle'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkCode, setLinkCode] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Limpa o polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Atualiza o step se o profile mudar
  useEffect(() => {
    if (profile?.is_telegram_verified) {
      setStep('verified')
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [profile?.is_telegram_verified])

  async function handleConnect() {
    setLoading(true)
    setError(null)

    // Gera código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // Salva o código no profile (reutiliza os campos de verificação existentes)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        whatsapp_verification_code: code,
        whatsapp_verification_expires_at: expiresAt,
        is_telegram_verified: false,
      })
      .eq('id', profile!.id)

    if (updateError) {
      setError('Erro ao gerar código. Tente novamente.')
      setLoading(false)
      return
    }

    setLinkCode(code)
    setStep('waiting')
    setLoading(false)

    // Inicia polling a cada 3 segundos para verificar se o bot vinculou
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_telegram_verified, telegram_chat_id')
        .eq('id', profile!.id)
        .single()

      if (data?.is_telegram_verified) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        await refreshProfile()
        setStep('verified')
      }
    }, 3000)

    // Para o polling após 10 minutos (expiração do código)
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        if (step === 'waiting') {
          setError('Código expirado. Tente novamente.')
          setStep('idle')
        }
      }
    }, 10 * 60 * 1000)
  }

  async function handleDisconnect() {
    setLoading(true)
    await supabase
      .from('profiles')
      .update({
        telegram_chat_id: null,
        is_telegram_verified: false,
      })
      .eq('id', profile!.id)
    await refreshProfile()
    setLinkCode(null)
    setStep('idle')
    setLoading(false)
  }

  const telegramLink = linkCode
    ? `https://t.me/${BOT_USERNAME}?start=${linkCode}`
    : null

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
        <Send size={16} className="text-blue-500" />
        Telegram Bot
      </h3>

      {step === 'verified' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#3b82f615' }}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Check size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Telegram Conectado
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                @{BOT_USERNAME}
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Envie mensagens como "Gastei 50 reais no almoço" para registrar gastos automaticamente.
          </p>
          <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={loading}>
            Desconectar Telegram
          </Button>
        </motion.div>
      )}

      {step === 'idle' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Conecte seu Telegram para registrar gastos por mensagem de texto com IA.
          </p>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <Button
            size="md"
            className="w-full !bg-blue-600 hover:!bg-blue-700"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Gerando link...' : 'Conectar Telegram'}
          </Button>
        </div>
      )}

      {step === 'waiting' && telegramLink && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <div
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-input)' }}
          >
            <Shield size={16} className="text-blue-500" />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Clique no botão abaixo para abrir o bot no Telegram
            </p>
          </div>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Send size={16} />
            Abrir no Telegram
            <ExternalLink size={14} />
          </a>

          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Aguardando vinculação...
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={() => {
              if (pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
              }
              setStep('idle')
              setError(null)
              setLinkCode(null)
            }}
            className="text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
        </motion.div>
      )}
    </Card>
  )
}
