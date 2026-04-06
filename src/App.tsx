import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { FamilyProvider } from './contexts/FamilyContext'
import { vibrate } from './lib/utils'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Insights } from './pages/Insights'
import { Settings } from './pages/Settings'
import { ExpenseForm } from './components/expense/ExpenseForm'
import { AuthScreen } from './components/auth/AuthScreen'
import { ProfileSelector } from './components/auth/ProfileSelector'
import { Onboarding } from './components/family/Onboarding'

type Tab = 'home' | 'history' | 'add' | 'insights' | 'settings'

const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
}

function AppContent() {
  const { settings, setActiveChildId } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isProfileSelected, setIsProfileSelected] = useState(false)

  if (!isProfileSelected && (settings.children?.length ?? 0) > 0) {
    return <ProfileSelector onSelect={(id) => { setActiveChildId(id); setIsProfileSelected(true) }} />
  }

  return (
    <div className="min-h-dvh flex flex-col relative bg-pattern">
      <main className="flex-1 overflow-y-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="w-full"
          >
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'history' && <History />}
            {activeTab === 'add' && <ExpenseForm onSaved={() => setActiveTab('home')} />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-8 pt-4 bg-[#ffe0eb]/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(119,81,89,0.1)] rounded-t-[3rem]">

        <button
          onClick={() => { setActiveTab('home'); vibrate(20) }}
          className={`flex flex-col items-center justify-center transition-all duration-150 ${
            activeTab === 'home' ? 'bg-[#775159] text-white rounded-full p-3 active-nav-shadow scale-110' : 'text-[#775159] opacity-70 p-3 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[10px] uppercase tracking-wider mt-1">Início</span>
        </button>

        <button
          onClick={() => { setActiveTab('history'); vibrate(20) }}
          className={`flex flex-col items-center justify-center transition-all duration-150 ${
            activeTab === 'history' ? 'bg-[#775159] text-white rounded-full p-3 active-nav-shadow scale-110' : 'text-[#775159] opacity-70 p-3 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}>history</span>
          <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[10px] uppercase tracking-wider mt-1">Histórico</span>
        </button>

        <button
          onClick={() => { setActiveTab('add'); vibrate(50) }}
          className={`flex flex-col items-center justify-center transition-all duration-150 ${
            activeTab === 'add' ? 'bg-[#775159] text-white rounded-full p-3 active-nav-shadow scale-110' : 'text-[#775159] opacity-70 p-3 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'add' ? "'FILL' 1" : "'FILL' 0" }}>add_circle</span>
          <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[10px] uppercase tracking-wider mt-1">Add</span>
        </button>

        <button
          onClick={() => { setActiveTab('insights'); vibrate(20) }}
          className={`flex flex-col items-center justify-center transition-all duration-150 ${
            activeTab === 'insights' ? 'bg-[#775159] text-white rounded-full p-3 active-nav-shadow scale-110' : 'text-[#775159] opacity-70 p-3 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'insights' ? "'FILL' 1" : "'FILL' 0" }}>insights</span>
          <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[10px] uppercase tracking-wider mt-1">Análises</span>
        </button>

        <button
          onClick={() => { setActiveTab('settings'); vibrate(20) }}
          className={`flex flex-col items-center justify-center transition-all duration-150 ${
            activeTab === 'settings' ? 'bg-[#775159] text-white rounded-full p-3 active-nav-shadow scale-110' : 'text-[#775159] opacity-70 p-3 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
          <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[10px] uppercase tracking-wider mt-1">Ajustes</span>
        </button>

      </nav>
    </div>
  )
}

function AuthGate() {
  const { user, loading, isOnline, needsOnboarding } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center relative bg-[#fff4f6]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl squish-shadow bg-primary-container"
          >
            🐷
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#775159]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <AppProvider>
        <FamilyProvider>
          <AppContent />
        </FamilyProvider>
      </AppProvider>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  // Gate de onboarding: novos usuários precisam completar o perfil
  if (needsOnboarding) {
    return (
      <AppProvider>
        <FamilyProvider>
          <Onboarding />
        </FamilyProvider>
      </AppProvider>
    )
  }

  return (
    <AppProvider>
      <FamilyProvider>
        <AppContent />
      </FamilyProvider>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
