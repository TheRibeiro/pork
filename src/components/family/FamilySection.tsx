import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFamily } from '../../contexts/FamilyContext'
import { useAuth } from '../../contexts/AuthContext'
import { vibrate } from '../../lib/utils'

export function FamilySection() {
  const { profile } = useAuth()
  const {
    isParent, isSupervised,
    inviteToken, generateToken,
    supervisedUsers, loadingSupervisedUsers, refreshSupervisedUsers,
    parentName,
  } = useFamily()

  const [generatingToken, setGeneratingToken] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerateToken() {
    vibrate(20)
    setGeneratingToken(true)
    await generateToken()
    setGeneratingToken(false)
  }

  function handleCopy() {
    if (!inviteToken) return
    navigator.clipboard?.writeText(inviteToken)
    setCopied(true)
    vibrate(20)
    setTimeout(() => setCopied(false), 2000)
  }

  // Supervised user: show parent info
  if (isSupervised) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <span className="text-lg">🔗</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-[#775159] dark:text-pink-200">Supervisão</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-3">
          {profile?.parent_id ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="font-bold text-[#775159] dark:text-pink-200">
                  {parentName || 'Responsável vinculado'}
                </p>
                <p className="text-xs text-[#775159]/60 dark:text-pink-300/60">
                  Sua conta está sendo supervisionada
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <span className="text-3xl">🔗</span>
              <p className="text-sm text-[#775159]/70 dark:text-pink-300/70 font-medium">
                Nenhum responsável vinculado ainda.
              </p>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Parent: manage invite token and supervised users
  if (!isParent) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
          <span className="text-lg">👨‍👩‍👧</span>
        </div>
        <h3 className="font-headline font-bold text-xl text-[#775159] dark:text-pink-200">Supervisão Familiar</h3>
        <button
          onClick={() => refreshSupervisedUsers()}
          className="ml-auto text-[#775159]/50 dark:text-pink-300/50 hover:text-[#775159] dark:hover:text-pink-300 transition-colors"
          title="Atualizar"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
        </button>
      </div>

      {/* Invite Token */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-[#775159] dark:text-pink-200 text-sm">Código de Convite</p>
            <p className="text-xs text-[#775159]/60 dark:text-pink-300/60 mt-0.5">
              Compartilhe para vincular contas
            </p>
          </div>
          <span className="text-2xl">🔑</span>
        </div>

        {inviteToken ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-pink-50 dark:bg-slate-800 border-2 border-dashed border-pink-200 dark:border-pink-800 rounded-xl py-3 px-4">
              <span className="font-headline font-black text-2xl tracking-[0.2em] text-[#775159] dark:text-pink-200">
                {inviteToken}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-pink-100 dark:bg-pink-900/30 text-[#775159] dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800/30'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerateToken}
            disabled={generatingToken}
            className="w-full py-3 rounded-xl bg-[#775159] dark:bg-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#6a464d] dark:hover:bg-pink-700 transition-colors disabled:opacity-60"
          >
            {generatingToken ? (
              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
            ) : (
              <span className="material-symbols-outlined text-sm">add</span>
            )}
            Gerar Código de Convite
          </button>
        )}

        {inviteToken && (
          <button
            onClick={handleGenerateToken}
            disabled={generatingToken}
            className="w-full text-xs text-[#775159]/50 dark:text-pink-300/50 hover:text-[#775159]/80 dark:hover:text-pink-300/80 transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">autorenew</span>
            Regenerar código
          </button>
        )}
      </div>

      {/* Supervised Users List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-pink-100 dark:border-slate-800 space-y-3">
        <p className="font-bold text-[#775159] dark:text-pink-200 text-sm">Usuários Vinculados</p>

        {loadingSupervisedUsers ? (
          <div className="flex items-center justify-center py-6">
            <span className="material-symbols-outlined animate-spin text-[#775159] dark:text-pink-300">sync</span>
          </div>
        ) : supervisedUsers.length === 0 ? (
          <div className="text-center py-4 space-y-1">
            <span className="text-3xl">👥</span>
            <p className="text-sm text-[#775159]/60 dark:text-pink-300/60 font-medium">
              Nenhum usuário vinculado ainda
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {supervisedUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-slate-800 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <span className="font-bold text-[#775159] dark:text-pink-200">
                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#775159] dark:text-pink-200 truncate">
                    {user.full_name || user.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-[#775159]/50 dark:text-pink-300/50">
                    Vinculado
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
