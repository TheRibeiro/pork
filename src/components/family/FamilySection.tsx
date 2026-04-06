import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFamily } from '../../contexts/FamilyContext'
import { useAuth } from '../../contexts/AuthContext'
import { vibrate } from '../../lib/utils'

export function FamilySection() {
  const { profile } = useAuth()
  const {
    isParent, isChild, isTeen,
    inviteToken, generateToken,
    children, loadingChildren, refreshChildren,
  } = useFamily()

  const [generatingToken, setGeneratingToken] = useState(false)
  const [copied, setCopied] = useState(false)

  const accountType = profile?.account_type ?? 'adult'

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

  // ─── FILHO / TEEN: vê o responsável vinculado ───
  if (isChild || isTeen) {
    const parentName = profile?.parent_id ? 'Responsável vinculado' : null

    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-lg">👨‍👩‍👧</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-[#775159]">Minha Família</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20 space-y-3">
          {profile?.parent_id ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="font-bold text-on-surface">{parentName}</p>
                <p className="text-xs text-on-surface-variant">Conta vinculada com sucesso</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <span className="text-3xl">🔗</span>
              <p className="text-sm text-on-surface-variant font-medium">
                Nenhum responsável vinculado ainda.
              </p>
              <p className="text-xs text-on-surface-variant">
                Peça o código para seu responsável e insira em Configurações.
              </p>
            </div>
          )}

          <div className="text-xs text-on-surface-variant/50 text-center pt-2 border-t border-outline-variant/10">
            Tipo de conta: <span className="font-bold capitalize">{accountType === 'teen' ? 'Teen (Adolescente)' : 'Criança'}</span>
          </div>
        </div>
      </section>
    )
  }

  // ─── RESPONSÁVEL / ADULTO: gerencia filhos e token ───
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
          <span className="text-lg">👨‍👩‍👧</span>
        </div>
        <h3 className="font-headline font-bold text-xl text-[#775159]">Família</h3>
        {isParent && (
          <button
            onClick={refreshChildren}
            className="ml-auto text-[#775159]/50 hover:text-[#775159] transition-colors"
            title="Atualizar"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        )}
      </div>

      {/* Token de convite */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-on-surface text-sm">Código de Convite</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Compartilhe com seus filhos para vincular as contas
            </p>
          </div>
          <span className="text-2xl">🔑</span>
        </div>

        {inviteToken ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#fff0f5] border-2 border-dashed border-pink-200 rounded-xl py-3 px-4">
              <span className="font-headline font-black text-2xl tracking-[0.2em] text-[#775159]">
                {inviteToken}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                copied ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-[#775159] hover:bg-pink-200'
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
            className="w-full py-3 rounded-xl bg-[#775159] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#6a464d] transition-colors disabled:opacity-60"
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
            className="w-full text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">autorenew</span>
            Regenerar código
          </button>
        )}
      </div>

      {/* Lista de filhos vinculados */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/20 space-y-3">
        <p className="font-bold text-on-surface text-sm">Filhos Vinculados</p>

        {loadingChildren ? (
          <div className="flex items-center justify-center py-6">
            <span className="material-symbols-outlined animate-spin text-[#775159]">sync</span>
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-4 space-y-1">
            <span className="text-3xl">🐣</span>
            <p className="text-sm text-on-surface-variant font-medium">Nenhum filho vinculado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-xl">
                  {child.account_type === 'teen' ? '🧑' : '🧒'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">
                    {child.full_name || child.email?.split('@')[0] || 'Filho'}
                  </p>
                  <p className="text-xs text-on-surface-variant capitalize">
                    {child.account_type === 'teen' ? 'Teen' : 'Criança'} • Vinculado
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
