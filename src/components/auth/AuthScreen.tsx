import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else {
      if (!fullName.trim()) {
        setError('Informe seu nome')
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password, fullName.trim())
      if (error) {
        setError(error)
      }
      // Se "Confirm email" está desabilitado no Supabase, o login é automático
      // (onAuthStateChange dispara e redireciona para o app)
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            B$
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            BolsoCheio
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Finanças Inteligentes
          </p>
        </div>

        {/* Toggle Login/Cadastro */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isLogin ? 'bg-[var(--color-primary)] text-white shadow-sm' : ''
            }`}
            style={!isLogin ? { color: 'var(--text-secondary)' } : undefined}
          >
            Entrar
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isLogin ? 'bg-[var(--color-primary)] text-white shadow-sm' : ''
            }`}
            style={isLogin ? { color: 'var(--text-secondary)' } : undefined}
          >
            Criar Conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff size={18} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <Eye size={18} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          </div>

          {/* Error/Success */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 text-center px-2"
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-green-500 text-center px-2"
            >
              {success}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
