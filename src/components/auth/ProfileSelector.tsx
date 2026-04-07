import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../contexts/AppContext'
import { vibrate } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'

interface ProfileSelectorProps {
  onSelect: (id: string | null) => void
}

export function ProfileSelector({ onSelect }: ProfileSelectorProps) {
  const { settings, updateSettings } = useApp()
  const { profile } = useAuth()
  
  const [entryMode, setEntryMode] = useState<'select' | 'guardian-pin' | 'adventurer-code'>('select')
  const [pinInput, setPinInput] = useState('')
  const [errorLine, setErrorLine] = useState(false)

  const triggerError = () => {
    vibrate([50, 50, 50])
    setErrorLine(true)
    setTimeout(() => {
      setErrorLine(false)
      if (entryMode === 'guardian-pin') {
        setPinInput('')
      }
    }, 500)
  }

  const handleGuardianClick = () => {
    vibrate(20)
    if (!settings.parentPin) {
      onSelect(null)
    } else {
      setPinInput('')
      setEntryMode('guardian-pin')
    }
  }

  const handleAdventurerClick = () => {
    vibrate(20)
    setPinInput('GP-')
    setEntryMode('adventurer-code')
  }

  const submitGuardianPin = () => {
    if (pinInput === settings.parentPin) {
      onSelect(null)
    } else {
      triggerError()
    }
  }

  const submitAdventurerCode = () => {
    const code = pinInput.trim().toUpperCase()
    const child = settings.children.find(c => c.pin === code)

    if (child) {
      if (child.pin_expires_at && Date.now() > child.pin_expires_at) {
        alert('Este Código de Vínculo expirou! Peça para o Guardião gerar um novo.')
        triggerError()
      } else {
        if (!child.is_connected) {
          const updatedChildren = settings.children.map(c => 
            c.id === child.id ? { ...c, is_connected: true } : c
          )
          updateSettings({ children: updatedChildren })
        }
        onSelect(child.id)
      }
    } else {
      triggerError()
    }
  }

  // --- GUARDIAN PIN PAD ---
  if (entryMode === 'guardian-pin') {
    let guardianName = 'Guardião'
    if (profile?.full_name) guardianName = profile.full_name.split(' ')[0]
    else if (profile?.email) guardianName = profile.email.split('@')[0]

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-surface-container flex items-center justify-center shadow-lg border-4 border-white mb-4">
              <span className="text-4xl">🧑‍🏫</span>
            </div>
            <h2 className="font-headline font-bold text-2xl text-primary">Oi, {guardianName}!</h2>
            <p className="text-on-surface-variant font-medium mt-1">Qual é o seu PIN Fixo?</p>
          </motion.div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_-5px_rgba(119,81,89,0.1)]">
            <motion.div animate={errorLine ? { x: [-10, 10, -10, 10, 0] } : {}} className="space-y-6">
              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all ${pinInput.length > i ? 'bg-primary' : 'bg-outline-variant/30'}`} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'go'].map((key) => {
                  if (key === 'back') {
                    return (
                      <button key={key} onClick={() => setPinInput(p => p.slice(0, -1))} className="h-16 rounded-full flex items-center justify-center text-outline hover:bg-surface-container active:scale-95 transition-all">
                        <span className="material-symbols-outlined">backspace</span>
                      </button>
                    )
                  }
                  if (key === 'go') {
                    return (
                      <button key={key} onClick={submitGuardianPin} className="h-16 rounded-full flex items-center justify-center bg-primary text-white hover:bg-primary-dim active:scale-95 transition-all shadow-md">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </button>
                    )
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        vibrate(10)
                        if (pinInput.length < 4) setPinInput(p => p + key)
                      }}
                      className="h-16 rounded-full bg-surface-container shadow-sm flex items-center justify-center font-headline font-bold text-2xl text-on-surface hover:bg-surface-container-high active:translate-y-1 active:shadow-none transition-all"
                    >
                      {key}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
          
          <button onClick={() => setEntryMode('select')} className="mt-8 text-on-surface-variant font-bold hover:underline text-sm uppercase tracking-widest">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // --- ADVENTURER CODE SCREEN ---
  if (entryMode === 'adventurer-code') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#fdfaf2] p-6 relative overflow-hidden" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')" }}>
        <div className="w-full max-w-sm text-center relative z-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#dabd9c]/30 flex items-center justify-center shadow-lg border-4 border-white mb-4">
              <span className="text-4xl">🗺️</span>
            </div>
            <h2 className="font-headline font-extrabold text-3xl text-[#7d532a] uppercase tracking-wider">A Jornada Começa</h2>
            <p className="text-[#c29668] font-bold mt-2">Digite o Código de Vínculo</p>
          </motion.div>

          <div className="bg-white border-2 border-[#dabd9c]/50 p-8 rounded-3xl shadow-lg">
            <motion.div animate={errorLine ? { x: [-10, 10, -10, 10, 0] } : {}} className="space-y-6">
              
              <input 
                type="text" 
                value={pinInput}
                onChange={e => setPinInput(e.target.value.toUpperCase())}
                className="w-full bg-[#fdfaf2] border-2 border-[#dabd9c] outline-none text-[#7d532a] font-black text-center text-3xl tracking-widest p-4 rounded-xl shadow-inner focus:border-[#7d532a] transition-colors"
                autoFocus
              />

              <button 
                onClick={submitAdventurerCode}
                className="w-full py-4 bg-[#7d532a] text-[#fdfaf2] font-headline font-bold text-lg rounded-xl shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all outline-none uppercase tracking-widest"
              >
                Conectar Conta
              </button>
            </motion.div>
          </div>
          
          <button onClick={() => setEntryMode('select')} className="mt-8 text-[#7d532a] font-bold hover:underline text-sm uppercase tracking-widest">
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  // --- PRIMARY SELECTION SCREEN ---
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
       <div className="text-center mb-12 relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-surface-container-highest shadow-[0_20px_40px_rgba(119,81,89,0.15)] flex items-center justify-center -rotate-3 mb-6"
          >
            <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              savings
            </span>
          </motion.div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tight text-primary">Conta Família</h1>
          <p className="text-on-surface-variant font-bold mt-2">Escolha seu lado da jornada.</p>
       </div>

       <div className="flex flex-col gap-6 w-full max-w-sm relative z-10">
          
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
            onClick={handleGuardianClick}
            className="w-full bg-white p-6 rounded-3xl shadow-md border-2 border-outline-variant/30 flex items-center gap-6 group hover:scale-[1.03] hover:shadow-lg transition-all active:scale-95"
          >
             <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center group-hover:bg-secondary transition-colors">
                <span className="text-3xl">🧑‍🏫</span>
             </div>
             <div className="text-left">
                <h3 className="font-headline font-black text-2xl text-on-surface">Sou Guardião</h3>
                <p className="text-sm text-on-surface-variant font-medium">Painel Financeiro Pai/Mãe</p>
             </div>
          </motion.button>

          <motion.button 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={handleAdventurerClick}
            className="w-full bg-[#fcf5e5] p-6 rounded-3xl shadow-md border-2 border-[#d2ab86] flex items-center gap-6 group hover:scale-[1.03] hover:shadow-lg transition-all active:scale-95"
          >
             <div className="w-16 h-16 rounded-full bg-[#e8cda8] border-2 border-white flex items-center justify-center group-hover:bg-[#d2ab86] transition-colors shadow-sm">
                <span className="text-3xl">🗺️</span>
             </div>
             <div className="text-left">
                <h3 className="font-headline font-black text-2xl text-[#8b5a2b]">Sou Aventureiro</h3>
                <p className="text-sm text-[#a8825c] font-bold">Conectar com Código</p>
             </div>
          </motion.button>

       </div>
    </div>
  )
}
