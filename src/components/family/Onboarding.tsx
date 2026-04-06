import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useFamily } from '../../contexts/FamilyContext'
import { PiggyCharacter } from './PiggyCharacter'
import { vibrate } from '../../lib/utils'
import type { AccountType } from '../../types'

type Step = 'welcome' | 'choose' | 'parent-done' | 'child-token'

export function Onboarding() {
  const { completeOnboarding, profile } = useAuth()
  const { generateToken, inviteToken } = useFamily()

  const [step, setStep] = useState<Step>('welcome')
  const [chosenType, setChosenType] = useState<AccountType | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(inviteToken)

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Olá'

  // Step 1 → Step 2
  function handleStart() {
    vibrate(20)
    setStep('choose')
  }

  // Step 2 → choose parent or child
  async function handleChooseParent() {
    vibrate(20)
    setChosenType('parent')
    setLoading(true)
    setError(null)
    try {
      // Complete onboarding as parent first, then generate token
      const { error: err } = await completeOnboarding('parent')
      if (err) { setError(err); return }
      const token = await generateToken()
      setGeneratedToken(token)
      setStep('parent-done')
    } finally {
      setLoading(false)
    }
  }

  function handleChooseChild(type: 'child' | 'teen') {
    vibrate(20)
    setChosenType(type)
    setStep('child-token')
  }

  // Child submits invite token
  async function handleLinkChild() {
    if (!tokenInput.trim() || !chosenType) return
    vibrate(20)
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await completeOnboarding(chosenType, tokenInput.trim())
      if (err) {
        setError(err)
        vibrate([50, 50, 50])
      }
      // If success, AuthContext will update profile.onboarding_completed → App gate handles redirect
    } finally {
      setLoading(false)
    }
  }

  // Parent skips invite for now
  async function handleParentSkip() {
    // Already completed in handleChooseParent; just close onboarding
    // profile.onboarding_completed should already be true
    window.location.reload()
  }

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }
  const transition = { type: 'spring' as const, stiffness: 350, damping: 28 }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-[#fff0f5] to-[#fff8fc] relative overflow-hidden">
      {/* Blobs decorativos */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-56 h-56 bg-purple-100/40 rounded-full blur-2xl pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: BOAS-VINDAS ── */}
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
                <h1 className="font-headline font-extrabold text-4xl text-[#775159] tracking-tight">
                  Oi, {firstName}!
                </h1>
                <p className="text-[#775159]/70 font-medium text-base leading-relaxed">
                  Bem-vindo ao <span className="font-bold text-[#775159]">BolsoCheio</span> —<br />
                  onde o dinheiro encontra a família!
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-pink-100 text-left space-y-3 w-full">
                {[
                  { icon: '🐷', text: 'Porquinho animado que reflete seu bolso' },
                  { icon: '👨‍👩‍👧', text: 'Conta familiar espelhada pai ↔ filho' },
                  { icon: '🚩', text: 'Responsável pode sinalizar gastos e orientar' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-sm font-medium text-[#775159]/80">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStart}
                className="w-full py-5 rounded-full bg-[#775159] text-white font-headline font-extrabold text-lg shadow-[0_8px_0_#502e36] active:shadow-none active:translate-y-2 transition-all"
              >
                Vamos Começar! 🐷
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: ESCOLHER PERFIL ── */}
          {step === 'choose' && (
            <motion.div
              key="choose"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-8 text-center"
            >
              <div className="space-y-2">
                <h2 className="font-headline font-extrabold text-3xl text-[#775159]">Você é...</h2>
                <p className="text-[#775159]/60 text-sm font-medium">Escolha o tipo de conta</p>
              </div>

              {/* Opção: Responsável */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleChooseParent}
                disabled={loading}
                className="w-full bg-white p-6 rounded-3xl shadow-md border-2 border-pink-100 flex items-center gap-5 text-left hover:border-[#775159]/30 transition-all disabled:opacity-60"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#fff0f5] flex items-center justify-center text-3xl border-2 border-pink-100 shadow-sm shrink-0">
                  👨‍👩‍👧
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-[#775159]">Sou Responsável</h3>
                  <p className="text-sm text-[#775159]/60 mt-0.5">Pai, mãe ou guardião da família</p>
                </div>
                {loading && chosenType === 'parent' && (
                  <span className="material-symbols-outlined animate-spin text-[#775159] ml-auto">sync</span>
                )}
              </motion.button>

              {/* Opção: Criança */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleChooseChild('child')}
                className="w-full bg-[#fef9ee] p-6 rounded-3xl shadow-md border-2 border-amber-100 flex items-center gap-5 text-left hover:border-amber-300 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl border-2 border-amber-100 shadow-sm shrink-0">
                  🧒
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-amber-800">Sou Criança</h3>
                  <p className="text-sm text-amber-700/70 mt-0.5">Tenho código do meu responsável</p>
                </div>
              </motion.button>

              {/* Opção: Teen */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleChooseChild('teen')}
                className="w-full bg-[#f5f0ff] p-6 rounded-3xl shadow-md border-2 border-purple-100 flex items-center gap-5 text-left hover:border-purple-300 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl border-2 border-purple-100 shadow-sm shrink-0">
                  🧑
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-purple-800">Sou Teen</h3>
                  <p className="text-sm text-purple-700/70 mt-0.5">11-17 anos, mais autonomia</p>
                </div>
              </motion.button>

              {error && (
                <p className="text-red-500 text-sm font-semibold text-center">{error}</p>
              )}
            </motion.div>
          )}

          {/* ── STEP 3A: RESPONSÁVEL CONCLUI ── */}
          {step === 'parent-done' && (
            <motion.div
              key="parent-done"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
            >
              <PiggyCharacter state="full" size={110} showMessage={false} />

              <div className="space-y-2">
                <h2 className="font-headline font-extrabold text-3xl text-[#775159]">Tudo pronto! 🎉</h2>
                <p className="text-[#775159]/70 text-sm font-medium">
                  Compartilhe o código abaixo com seu filho para vincularem as contas.
                </p>
              </div>

              {generatedToken ? (
                <div className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-pink-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#775159]/50">Código de Convite</p>
                  <div className="font-headline font-black text-4xl text-[#775159] tracking-[0.2em]">
                    {generatedToken}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(generatedToken)
                      vibrate(20)
                    }}
                    className="flex items-center gap-2 mx-auto text-xs font-bold text-[#775159]/60 hover:text-[#775159] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copiar código
                  </button>
                </div>
              ) : (
                <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-pink-100 text-sm text-[#775159]/60">
                  Você poderá gerar o código nas Configurações → Família.
                </div>
              )}

              <div className="bg-[#fff0f5] rounded-2xl p-4 text-left text-sm text-[#775159]/70 space-y-2 w-full">
                <p className="font-bold text-[#775159]">Como funciona:</p>
                <p>1. Seu filho baixa o BolsoCheio e cria uma conta</p>
                <p>2. Ele digita o código acima no onboarding</p>
                <p>3. As contas ficam vinculadas automaticamente</p>
              </div>

              <button
                onClick={handleParentSkip}
                className="w-full py-5 rounded-full bg-[#775159] text-white font-headline font-extrabold text-lg shadow-[0_8px_0_#502e36] active:shadow-none active:translate-y-2 transition-all"
              >
                Ir para o App 🐷
              </button>
            </motion.div>
          )}

          {/* ── STEP 3B: FILHO INSERE TOKEN ── */}
          {step === 'child-token' && (
            <motion.div
              key="child-token"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
            >
              <PiggyCharacter state="ok" size={100} showMessage={false} />

              <div className="space-y-2">
                <h2 className="font-headline font-extrabold text-3xl text-amber-800">
                  Código do Responsável
                </h2>
                <p className="text-amber-700/70 text-sm font-medium">
                  Peça o código de 8 letras para quem te cadastrou!
                </p>
              </div>

              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="w-full text-center font-headline font-black text-3xl tracking-[0.25em] bg-white border-2 border-amber-200 rounded-2xl py-5 px-4 outline-none focus:border-amber-400 transition-colors uppercase text-amber-800"
                  autoFocus
                />

                {error && (
                  <p className="text-red-500 text-sm font-semibold">{error}</p>
                )}
              </div>

              <button
                onClick={handleLinkChild}
                disabled={loading || tokenInput.length < 4}
                className="w-full py-5 rounded-full bg-amber-700 text-white font-headline font-extrabold text-lg shadow-[0_8px_0_#92400e] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  'Vincular Conta 🔗'
                )}
              </button>

              <button
                onClick={() => setStep('choose')}
                className="text-amber-700/60 font-bold text-sm hover:text-amber-700 transition-colors"
              >
                ← Voltar
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pb-8 z-10">
        {(['welcome', 'choose', step === 'parent-done' ? 'parent-done' : 'child-token'] as const).map((_s, i) => {
          const current = step === 'welcome' ? 0 : step === 'choose' ? 1 : 2
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2.5 bg-[#775159]'
                  : i < current
                  ? 'w-2.5 h-2.5 bg-[#775159]/40'
                  : 'w-2.5 h-2.5 bg-[#775159]/20'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
