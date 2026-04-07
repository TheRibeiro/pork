import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useFamily } from '../../contexts/FamilyContext'
import { PiggyCharacter } from './PiggyCharacter'

type Step = 'welcome' | 'choose' | 'adult-done' | 'supervised-token'

export function Onboarding() {
  const { completeOnboarding, profile } = useAuth()
  const { generateToken, inviteToken } = useFamily()

  const [step, setStep] = useState<Step>('welcome')
  const [tokenInput, setTokenInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(inviteToken)
  const [wantsToSupervise, setWantsToSupervise] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Olá'

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }
  const transition = { type: 'spring' as const, stiffness: 350, damping: 28 }

  async function handleChooseAdult() {
    setLoading(true)
    setError(null)
    try {
      // Complete as adult
      const { error: err } = await completeOnboarding('adult')
      if (err) { setError(err); return }

      // If user wants to supervise, generate token
      if (wantsToSupervise) {
        const token = await generateToken()
        setGeneratedToken(token)
        setStep('adult-done')
      } else {
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleLinkToParent() {
    if (!tokenInput.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await completeOnboarding('supervised', tokenInput.trim())
      if (err) {
        setError(err)
      }
      // If success, App gate will redirect
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-[#fff0f5] to-[#fff8fc] dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-pink-200/30 dark:bg-pink-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-56 h-56 bg-purple-100/40 dark:bg-purple-900/20 rounded-full blur-2xl pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        <AnimatePresence mode="wait">

          {/* STEP 1: Welcome */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-8 text-center"
            >
              <PiggyCharacter state="wave" size={140} showMessage={false} />

              <div className="space-y-2">
                <h1 className="font-headline font-extrabold text-4xl text-[#775159] dark:text-pink-200 tracking-tight">
                  Oi, {firstName}!
                </h1>
                <p className="text-[#775159]/70 dark:text-pink-200/70 font-medium text-base leading-relaxed">
                  Bem-vindo ao <span className="font-bold text-[#775159] dark:text-pink-200">BolsoCheio</span><br />
                  Seu app de finanças pessoais
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100 dark:border-slate-700 text-left space-y-3 w-full">
                {[
                  { icon: '💰', text: 'Controle seus gastos de forma simples' },
                  { icon: '📊', text: 'Veja insights sobre suas finanças' },
                  { icon: '🎯', text: 'Defina metas e limites por categoria' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-sm font-medium text-[#775159]/80 dark:text-pink-200/80">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('choose')}
                className="w-full py-5 rounded-full bg-[#775159] dark:bg-pink-600 text-white font-headline font-extrabold text-lg shadow-[0_8px_0_#502e36] dark:shadow-[0_8px_0_#9f1239] active:shadow-none active:translate-y-2 transition-all"
              >
                Começar
              </button>
            </motion.div>
          )}

          {/* STEP 2: Choose type */}
          {step === 'choose' && (
            <motion.div
              key="choose"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
            >
              <div className="space-y-2">
                <h2 className="font-headline font-extrabold text-3xl text-[#775159] dark:text-pink-200">
                  Como quer usar?
                </h2>
                <p className="text-[#775159]/60 dark:text-pink-200/60 text-sm font-medium">
                  Escolha o que melhor se encaixa
                </p>
              </div>

              {/* Option 1: Personal use */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setWantsToSupervise(false); handleChooseAdult() }}
                disabled={loading}
                className="w-full bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-md border-2 border-pink-100 dark:border-slate-700 flex items-center gap-5 text-left hover:border-[#775159]/30 transition-all disabled:opacity-60"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#fff0f5] dark:bg-slate-700 flex items-center justify-center text-3xl border-2 border-pink-100 dark:border-slate-600 shrink-0">
                  💰
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-black text-xl text-[#775159] dark:text-pink-200">Uso Pessoal</h3>
                  <p className="text-sm text-[#775159]/60 dark:text-pink-200/60 mt-0.5">Controlar minhas próprias finanças</p>
                </div>
                {loading && !wantsToSupervise && (
                  <span className="material-symbols-outlined animate-spin text-[#775159] dark:text-pink-200">sync</span>
                )}
              </motion.button>

              {/* Option 2: Supervise others */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setWantsToSupervise(true); handleChooseAdult() }}
                disabled={loading}
                className="w-full bg-[#fff9ee] dark:bg-amber-900/30 p-6 rounded-3xl shadow-md border-2 border-amber-100 dark:border-amber-800 flex items-center gap-5 text-left hover:border-amber-300 transition-all disabled:opacity-60"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/50 flex items-center justify-center text-3xl border-2 border-amber-100 dark:border-amber-700 shrink-0">
                  👨‍👩‍👧
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-black text-xl text-amber-800 dark:text-amber-200">Supervisionar</h3>
                  <p className="text-sm text-amber-700/70 dark:text-amber-300/70 mt-0.5">Acompanhar gastos de familiares</p>
                </div>
                {loading && wantsToSupervise && (
                  <span className="material-symbols-outlined animate-spin text-amber-800">sync</span>
                )}
              </motion.button>

              {/* Option 3: Be supervised */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('supervised-token')}
                className="w-full bg-[#f0f5ff] dark:bg-blue-900/30 p-6 rounded-3xl shadow-md border-2 border-blue-100 dark:border-blue-800 flex items-center gap-5 text-left hover:border-blue-300 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-3xl border-2 border-blue-100 dark:border-blue-700 shrink-0">
                  🔗
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-blue-800 dark:text-blue-200">Vincular Conta</h3>
                  <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-0.5">Tenho código de um responsável</p>
                </div>
              </motion.button>

              {error && (
                <p className="text-red-500 text-sm font-semibold text-center">{error}</p>
              )}
            </motion.div>
          )}

          {/* STEP 3A: Adult done with supervision */}
          {step === 'adult-done' && (
            <motion.div
              key="adult-done"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
            >
              <PiggyCharacter state="full" size={110} showMessage={false} />

              <div className="space-y-2">
                <h2 className="font-headline font-extrabold text-3xl text-[#775159] dark:text-pink-200">Tudo pronto!</h2>
                <p className="text-[#775159]/70 dark:text-pink-200/70 text-sm font-medium">
                  Compartilhe o código abaixo para vincular contas
                </p>
              </div>

              {generatedToken ? (
                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border-2 border-dashed border-pink-200 dark:border-pink-800 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#775159]/50 dark:text-pink-200/50">
                    Código de Convite
                  </p>
                  <div className="font-headline font-black text-4xl text-[#775159] dark:text-pink-200 tracking-[0.2em]">
                    {generatedToken}
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(generatedToken)}
                    className="flex items-center gap-2 mx-auto text-xs font-bold text-[#775159]/60 dark:text-pink-200/60 hover:text-[#775159] dark:hover:text-pink-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copiar código
                  </button>
                </div>
              ) : (
                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-pink-100 dark:border-slate-700 text-sm text-[#775159]/60 dark:text-pink-200/60">
                  Você poderá gerar o código nas Configurações.
                </div>
              )}

              <div className="bg-[#fff0f5] dark:bg-slate-800/50 rounded-2xl p-4 text-left text-sm text-[#775159]/70 dark:text-pink-200/70 space-y-2 w-full">
                <p className="font-bold text-[#775159] dark:text-pink-200">Como funciona:</p>
                <p>1. A pessoa baixa o BolsoCheio e cria uma conta</p>
                <p>2. No início, escolhe "Vincular Conta"</p>
                <p>3. Digita o código e as contas são vinculadas</p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-5 rounded-full bg-[#775159] dark:bg-pink-600 text-white font-headline font-extrabold text-lg shadow-[0_8px_0_#502e36] dark:shadow-[0_8px_0_#9f1239] active:shadow-none active:translate-y-2 transition-all"
              >
                Ir para o App
              </button>
            </motion.div>
          )}

          {/* STEP 3B: Enter token to link */}
          {step === 'supervised-token' && (
            <motion.div
              key="supervised-token"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
            >
              <PiggyCharacter state="ok" size={100} showMessage={false} />

              <div className="space-y-2">
                <h2 className="font-headline font-extrabold text-3xl text-blue-800 dark:text-blue-200">
                  Código de Vínculo
                </h2>
                <p className="text-blue-700/70 dark:text-blue-300/70 text-sm font-medium">
                  Digite o código fornecido pelo responsável
                </p>
              </div>

              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={10}
                  className="w-full text-center font-headline font-black text-3xl tracking-[0.25em] bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-2xl py-5 px-4 outline-none focus:border-blue-400 transition-colors uppercase text-blue-800 dark:text-blue-200"
                  autoFocus
                />

                {error && (
                  <p className="text-red-500 text-sm font-semibold">{error}</p>
                )}
              </div>

              <button
                onClick={handleLinkToParent}
                disabled={loading || tokenInput.length < 4}
                className="w-full py-5 rounded-full bg-blue-600 text-white font-headline font-extrabold text-lg shadow-[0_8px_0_#1e40af] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  'Vincular Conta'
                )}
              </button>

              <button
                onClick={() => setStep('choose')}
                className="text-blue-700/60 dark:text-blue-300/60 font-bold text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Voltar
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pb-8 z-10">
        {[0, 1, 2].map((i) => {
          const current = step === 'welcome' ? 0 : step === 'choose' ? 1 : 2
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2.5 bg-[#775159] dark:bg-pink-400'
                  : i < current
                  ? 'w-2.5 h-2.5 bg-[#775159]/40 dark:bg-pink-400/40'
                  : 'w-2.5 h-2.5 bg-[#775159]/20 dark:bg-pink-400/20'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
