import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Eye, EyeOff, AtSign } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
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
      const { error } = await signIn(username, password)
      if (error) setError(error)
    } else {
      if (!fullName.trim()) {
        setError('Informe seu nome')
        setLoading(false)
        return
      }
      const { error } = await signUp(username, password, fullName.trim())
      if (error) {
        setError(error)
      }
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background */}
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, stiffness: 300 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springTransition, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              boxShadow: '0 8px 32px rgba(20, 184, 166, 0.35)',
            }}
          >
            B$
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            BolsoCheio
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Finanças Inteligentes
          </p>
        </div>

        {/* Toggle Login/Cadastro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
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
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={springTransition}
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
            <AtSign
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
              required
              autoCapitalize="none"
              autoCorrect="off"
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
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={springTransition}
                className="text-xs text-red-500 text-center px-2"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={springTransition}
                className="text-xs text-green-500 text-center px-2"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>
        </motion.form>
      </motion.div>
    </div>
  )
}
