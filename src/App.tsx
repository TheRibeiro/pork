import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Clock, Sparkles, Settings as SettingsIcon, Plus } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Insights } from './pages/Insights'
import { Settings } from './pages/Settings'
import { ExpenseForm } from './components/expense/ExpenseForm'
import { AuthScreen } from './components/auth/AuthScreen'

type Tab = 'home' | 'history' | 'insights' | 'settings'

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'history', label: 'Histórico', icon: Clock },
  { id: 'insights', label: 'IA', icon: Sparkles },
  { id: 'settings', label: 'Config', icon: SettingsIcon },
]

// Page transition variants (Manifesto §2)
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showExpenseForm, setShowExpenseForm] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mesh Gradient Blobs (Manifesto §1) */}
      <div className="mesh-gradient-container">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Noise Grain Overlay (Manifesto §1) */}
      <div className="noise-overlay" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 safe-top relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'history' && <History />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - Add Expense */}
      <motion.button
        onClick={() => setShowExpenseForm(true)}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="fixed z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{
          bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
          right: '1rem',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35)',
        }}
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      {/* Bottom Tab Bar — Glassmorphism (Manifesto §4) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 safe-bottom glass dark:glass"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <motion.button
                key={id}
                onClick={() => setActiveTab(id)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl min-w-[48px]"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="w-5 h-0.5 rounded-full mt-0.5"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* Expense Form Bottom Sheet */}
      <ExpenseForm open={showExpenseForm} onClose={() => setShowExpenseForm(false)} />
    </div>
  )
}

function AuthGate() {
  const { user, loading, isOnline } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center relative"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Mesh Gradient behind loader */}
        <div className="mesh-gradient-container">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
        </div>
        <div className="noise-overlay" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35)',
            }}
          >
            B$
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // If Supabase not configured, run in offline mode (no auth required)
  if (!isOnline) {
    return (
      <AppProvider>
        <AppContent />
      </AppProvider>
    )
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen />
  }

  // Authenticated
  return (
    <AppProvider>
      <AppContent />
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
