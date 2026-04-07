import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { useFamily } from '../contexts/FamilyContext'
import { vibrate } from '../lib/utils'
import { CATEGORY_CONFIG, type Category } from '../types'

export function Settings() {
  const { profile, signOut } = useAuth()
  const { settings, updateSettings, updateEnvelope, setMonthlyBudget, theme, toggleTheme } = useApp()
  const { isParent, isSupervised, parentName, supervisedUsers, inviteToken, generateToken, loadingSupervisedUsers, refreshSupervisedUsers } = useFamily()

  const [showBudgetEdit, setShowBudgetEdit] = useState(false)
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget.toString())
  const [showCategoryLimits, setShowCategoryLimits] = useState(false)

  const userName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Usuário'

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleSaveBudget = () => {
    const value = parseFloat(budgetInput.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    setMonthlyBudget(value)
    setShowBudgetEdit(false)
    vibrate(20)
  }

  const handleGenerateToken = async () => {
    vibrate(20)
    await generateToken()
  }

  const handleCopyToken = () => {
    if (inviteToken) {
      navigator.clipboard?.writeText(inviteToken)
      vibrate(20)
    }
  }

  return (
    <div className="min-h-screen pb-32 bg-[#fff4f6] dark:bg-slate-950 font-body">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              settings
            </span>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-[#775159] dark:text-pink-300">
              Configurações
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Profile Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-pink-100 dark:border-slate-800 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-[#ffe0eb] dark:bg-pink-900/50 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm">
            <span className="font-bold text-[#775159] dark:text-pink-200 text-2xl">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-headline font-bold text-xl text-[#775159] dark:text-pink-200">
              {profile?.full_name || userName}
            </h2>
            <p className="text-sm text-[#775159]/60 dark:text-pink-300/60">
              {isSupervised && parentName ? `Supervisionado por ${parentName}` : profile?.email}
            </p>
          </div>
        </motion.section>

        {/* Budget Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-4"
        >
          <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200">
            Orçamento Mensal
          </h3>

          {showBudgetEdit ? (
            <div className="space-y-3">
              <input
                type="text"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                placeholder="Ex: 3000"
                className="w-full bg-pink-50 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-[#775159] dark:text-pink-200 outline-none focus:border-[#775159] dark:focus:border-pink-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBudgetEdit(false)}
                  className="flex-1 py-3 rounded-xl border border-pink-200 dark:border-slate-700 font-bold text-[#775159]/60 dark:text-pink-300/60"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBudget}
                  className="flex-1 py-3 rounded-xl bg-[#775159] dark:bg-pink-600 text-white font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowBudgetEdit(true); setBudgetInput(settings.monthlyBudget.toString()) }}
              className="w-full flex items-center justify-between p-4 bg-pink-50 dark:bg-slate-800 rounded-xl hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-[#775159]/70 dark:text-pink-300/70">Meta mensal</span>
              <span className="font-bold text-[#775159] dark:text-pink-200">
                {settings.monthlyBudget > 0 ? fmt(settings.monthlyBudget) : 'Não definido'}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowCategoryLimits(!showCategoryLimits)}
            className="w-full flex items-center justify-between p-4 bg-pink-50 dark:bg-slate-800 rounded-xl hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-[#775159]/70 dark:text-pink-300/70">Limites por categoria</span>
            <span className="material-symbols-outlined text-[#775159]/50 dark:text-pink-300/50">
              {showCategoryLimits ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showCategoryLimits && (
            <div className="space-y-2 pt-2">
              {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                const config = CATEGORY_CONFIG[cat]
                const current = settings.envelopes.find(e => e.category === cat)?.limit || 0
                return (
                  <div key={cat} className="flex items-center gap-3 p-3 bg-pink-50/50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xl">{config.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-[#775159] dark:text-pink-200">
                      {config.label}
                    </span>
                    <input
                      type="number"
                      value={current || ''}
                      onChange={e => updateEnvelope(cat, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 text-right bg-white dark:bg-slate-700 border border-pink-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-[#775159] dark:text-pink-200 outline-none"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </motion.section>

        {/* Family Section - For Parents */}
        {isParent && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200">
                Supervisão Familiar
              </h3>
              <button
                onClick={() => refreshSupervisedUsers()}
                className="p-2 text-[#775159]/50 dark:text-pink-300/50 hover:text-[#775159] dark:hover:text-pink-300"
              >
                <span className="material-symbols-outlined text-xl">refresh</span>
              </button>
            </div>

            {/* Invite Token */}
            <div className="bg-pink-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#775159]/50 dark:text-pink-300/50">
                Código de Convite
              </p>
              {inviteToken ? (
                <div className="flex items-center gap-2">
                  <span className="font-headline font-black text-2xl text-[#775159] dark:text-pink-200 tracking-wider flex-1">
                    {inviteToken}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 bg-white dark:bg-slate-700 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-xl">content_copy</span>
                  </button>
                  <button
                    onClick={handleGenerateToken}
                    className="p-2 bg-white dark:bg-slate-700 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[#775159] dark:text-pink-300 text-xl">refresh</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateToken}
                  className="w-full py-3 bg-[#775159] dark:bg-pink-600 text-white rounded-xl font-bold"
                >
                  Gerar Código
                </button>
              )}
              <p className="text-xs text-[#775159]/50 dark:text-pink-300/50">
                Compartilhe este código para vincular contas
              </p>
            </div>

            {/* Supervised Users List */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#775159]/70 dark:text-pink-300/70">
                Usuários vinculados
              </p>
              {loadingSupervisedUsers ? (
                <div className="flex justify-center py-4">
                  <span className="material-symbols-outlined animate-spin text-[#775159]/50">sync</span>
                </div>
              ) : supervisedUsers.length > 0 ? (
                supervisedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#ffe0eb] dark:bg-pink-900/50 flex items-center justify-center">
                      <span className="font-bold text-[#775159] dark:text-pink-200">
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#775159] dark:text-pink-200">
                        {user.full_name || user.email}
                      </p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-sm text-[#775159]/50 dark:text-pink-300/50">
                  Nenhum usuário vinculado ainda
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* Credit Card Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-4"
        >
          <h3 className="font-headline font-bold text-lg text-[#775159] dark:text-pink-200">
            Cartão de Crédito
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#775159]/50 dark:text-pink-300/50">
                Dia de fechamento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={settings.creditCard.closingDay}
                onChange={e => updateSettings({
                  creditCard: { ...settings.creditCard, closingDay: parseInt(e.target.value) || 1 }
                })}
                className="w-full bg-pink-50 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-[#775159] dark:text-pink-200 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#775159]/50 dark:text-pink-300/50">
                Dia de vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={settings.creditCard.dueDay}
                onChange={e => updateSettings({
                  creditCard: { ...settings.creditCard, dueDay: parseInt(e.target.value) || 10 }
                })}
                className="w-full bg-pink-50 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-[#775159] dark:text-pink-200 outline-none"
              />
            </div>
          </div>
        </motion.section>

        {/* Theme Toggle */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800"
        >
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#775159] dark:text-pink-300">
                  {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <span className="font-bold text-[#775159] dark:text-pink-200">Tema</span>
            </div>
            <div className="px-4 py-2 bg-pink-100 dark:bg-slate-700 rounded-full text-sm font-bold text-[#775159] dark:text-pink-200">
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </div>
          </button>
        </motion.section>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <button
            onClick={() => { vibrate(20); signOut() }}
            className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">logout</span>
            Sair da conta
          </button>

          <p className="text-center text-xs text-[#775159]/40 dark:text-pink-300/40 mt-6">
            BolsoCheio v5.0
          </p>
        </motion.div>
      </main>
    </div>
  )
}
