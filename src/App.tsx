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

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showExpenseForm, setShowExpenseForm] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 safe-top">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'history' && <History />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - Add Expense */}
      <button
        onClick={() => setShowExpenseForm(true)}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 safe-bottom"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="w-5 h-0.5 rounded-full mt-0.5"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                )}
              </button>
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
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            B$
          </div>
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
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
