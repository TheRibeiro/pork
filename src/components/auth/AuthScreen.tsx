import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        const result = await signIn(email, password)
        if (result.error) throw new Error(result.error)
      } else {
        const result = await signUp(email, password, fullName || 'Poupador')
        if (result.error) throw new Error(result.error)
        
        // If registration successful, we can auto-login or just show a message.
        // Assuming the auth context handles the user state change automatically on sign up.
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6 relative overflow-hidden bg-background selection:bg-primary-container">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-container rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-tertiary-container rounded-full blur-3xl opacity-30 pointer-events-none" />

      <main className="w-full max-w-sm mx-auto z-10 space-y-10">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-24 h-24 mx-auto rounded-[2.5rem] bg-surface-container-highest shadow-[0_20px_40px_rgba(119,81,89,0.15)] flex items-center justify-center -rotate-3"
          >
            <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              savings
            </span>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="font-headline font-extrabold text-4xl tracking-tight text-primary">BolsoCheio</h1>
            <p className="text-on-surface-variant font-medium mt-2 text-sm uppercase tracking-widest">
              Alimente o seu Cofre
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_20px_40px_-5px_rgba(119,81,89,0.1)] border-4 border-white"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="font-headline font-bold text-xl text-on-surface mb-6">
              {isLogin ? 'Bem-vindo de volta!' : 'Criar seu Cofre'}
            </h2>

            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm font-semibold border border-error/20">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-4">
                  Seu Nome
                </label>
                <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/30 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-outline">person</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-on-surface font-medium placeholder:text-on-surface-variant/40"
                    placeholder="Como quer ser chamado?"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-4">
                E-mail ou Usuário
              </label>
              <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/30 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-outline">mail</span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-on-surface font-medium placeholder:text-on-surface-variant/40"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-4">
                Senha
              </label>
              <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/30 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-outline">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-on-surface font-medium placeholder:text-on-surface-variant/40"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-4 rounded-full bg-primary text-on-primary font-headline font-extrabold text-lg shadow-[0_12px_20px_rgba(119,81,89,0.2),inset_0__2px_0_rgba(255,255,255,0.2)] active:shadow-[0_4px_10px_rgba(119,81,89,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center h-16"
            >
              {loading ? (
                 <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>
                   sync
                 </span>
              ) : isLogin ? (
                'Entrar no Cofre'
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-on-surface-variant">
            {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
              }}
              className="text-primary font-bold hover:underline"
              type="button"
            >
              {isLogin ? 'Criar agora' : 'Faça login'}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
