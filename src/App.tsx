import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { FamilyProvider } from './contexts/FamilyContext'
import { vibrate } from './lib/utils'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Insights } from './pages/Insights'
import { Settings } from './pages/Settings'
import { ExpenseForm } from './components/expense/ExpenseForm'
import { AuthScreen } from './components/auth/AuthScreen'
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
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: 'home', label: 'Início' },
    { id: 'history', icon: 'history', label: 'Histórico' },
    { id: 'add', icon: 'add_circle', label: 'Add' },
    { id: 'insights', icon: 'insights', label: 'Análises' },
    { id: 'settings', icon: 'settings', label: 'Ajustes' },
  ]

  return (
    <div className="min-h-dvh flex flex-col relative bg-[#fff4f6] dark:bg-slate-950">
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

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-pink-100 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); vibrate(20) }}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-[#775159] dark:text-pink-300 scale-110'
                : 'text-[#775159]/40 dark:text-pink-300/40 hover:text-[#775159]/70 dark:hover:text-pink-300/70'
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl transition-all ${
                activeTab === tab.id ? 'text-[28px]' : ''
              }`}
              style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className={`text-[10px] font-bold mt-0.5 uppercase tracking-wider ${
              activeTab === tab.id ? 'opacity-100' : 'opacity-60'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function AuthGate() {
  const { user, loading, isOnline, needsOnboarding } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#fff4f6] dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-[#ffe0eb] dark:bg-pink-900/50 shadow-lg"
          >
            🐷
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#775159] dark:bg-pink-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Offline mode
  if (!isOnline) {
    return (
      <AppProvider>
        <FamilyProvider>
          <AppContent />
        </FamilyProvider>
      </AppProvider>
    )
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen />
  }

  // Needs onboarding
  if (needsOnboarding) {
    return (
      <AppProvider>
        <FamilyProvider>
          <Onboarding />
        </FamilyProvider>
      </AppProvider>
    )
  }

  // Authenticated and onboarded
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
