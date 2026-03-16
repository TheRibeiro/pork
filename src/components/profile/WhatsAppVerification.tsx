import { useState } from 'react'
import { MessageCircle, Check, Shield, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export function WhatsAppVerification() {
  const { profile, updateProfile, refreshProfile } = useAuth()
  const [phone, setPhone] = useState(profile?.whatsapp_number || '')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'input' | 'verify' | 'verified'>(
    profile?.is_whatsapp_verified ? 'verified' : 'input'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return `+${digits}`
    if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`
    if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`
  }

  function getCleanPhone(): string {
    return '+' + phone.replace(/\D/g, '')
  }

  async function handleSendCode() {
    const cleanPhone = getCleanPhone()
    if (cleanPhone.length < 12) {
      setError('Número inválido. Use formato: +55 11 99999-9999')
      return
    }

    setLoading(true)
    setError(null)

    // Gera código de 6 dígitos
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // Salva o número e código no profile
    const { error: updateError } = await updateProfile({
      whatsapp_number: cleanPhone,
      is_whatsapp_verified: false,
    } as Partial<typeof profile & { whatsapp_verification_code: string; whatsapp_verification_expires_at: string }>)

    if (updateError) {
      setError(updateError)
      setLoading(false)
      return
    }

    // Atualiza código diretamente (campos não expostos no UserProfile)
    await supabase
      .from('profiles')
      .update({
        whatsapp_verification_code: verificationCode,
        whatsapp_verification_expires_at: expiresAt,
      })
      .eq('id', profile!.id)

    // Na produção, aqui chamaria a API do WhatsApp para enviar o código.
    // Por enquanto, mostramos no console para desenvolvimento.
    console.log(`[DEV] Código de verificação WhatsApp: ${verificationCode}`)

    setStep('verify')
    setLoading(false)
  }

  async function handleVerifyCode() {
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos')
      return
    }

    setLoading(true)
    setError(null)

    // Busca código armazenado
    const { data } = await supabase
      .from('profiles')
      .select('whatsapp_verification_code, whatsapp_verification_expires_at')
      .eq('id', profile!.id)
      .single()

    if (!data) {
      setError('Erro ao verificar. Tente novamente.')
      setLoading(false)
      return
    }

    // Verifica expiração
    if (new Date(data.whatsapp_verification_expires_at!) < new Date()) {
      setError('Código expirado. Solicite um novo.')
      setStep('input')
      setLoading(false)
      return
    }

    // Verifica código
    if (data.whatsapp_verification_code !== code) {
      setError('Código incorreto')
      setLoading(false)
      return
    }

    // Marca como verificado
    await supabase
      .from('profiles')
      .update({
        is_whatsapp_verified: true,
        whatsapp_verification_code: null,
        whatsapp_verification_expires_at: null,
      })
      .eq('id', profile!.id)

    await refreshProfile()
    setStep('verified')
    setLoading(false)
  }

  async function handleDisconnect() {
    setLoading(true)
    await updateProfile({
      whatsapp_number: null,
      is_whatsapp_verified: false,
    })
    await refreshProfile()
    setPhone('')
    setCode('')
    setStep('input')
    setLoading(false)
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
        <MessageCircle size={16} className="text-green-500" />
        WhatsApp Bot
      </h3>

      {step === 'verified' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#22c55e15' }}
          >
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                WhatsApp Conectado
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {profile?.whatsapp_number}
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Envie mensagens como "Gastei 50 reais no almoço" para registrar gastos automaticamente.
          </p>
          <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={loading}>
            Desconectar WhatsApp
          </Button>
        </motion.div>
      )}

      {step === 'input' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Conecte seu WhatsApp para registrar gastos por mensagem de texto.
          </p>
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="tel"
              placeholder="+55 (11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/30"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <Button
            size="md"
            className="w-full !bg-green-600 hover:!bg-green-700"
            onClick={handleSendCode}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Código de Verificação'}
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <div
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-input)' }}
          >
            <Shield size={16} className="text-green-500" />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Código enviado para {getCleanPhone()}
            </p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3.5 rounded-xl text-2xl font-bold text-center tracking-[0.5em] outline-none focus:ring-2 focus:ring-green-500/30"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
          <Button
            size="md"
            className="w-full !bg-green-600 hover:!bg-green-700"
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </Button>
          <button
            onClick={() => { setStep('input'); setError(null); setCode('') }}
            className="text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Usar outro número
          </button>
        </motion.div>
      )}
    </Card>
  )
}
