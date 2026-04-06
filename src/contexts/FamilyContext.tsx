import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { AccountType } from '../types'

// Perfil resumido de um filho (usado pelo responsável)
export interface ChildSummary {
  id: string
  full_name: string | null
  email: string | null
  account_type: AccountType
  parent_id: string | null
}

interface FamilyContextType {
  // Para responsáveis
  children: ChildSummary[]
  inviteToken: string | null
  loadingChildren: boolean
  generateToken: () => Promise<string | null>
  // Para qualquer tipo de conta
  isParent: boolean
  isChild: boolean
  isTeen: boolean
  // Sinalização de transações
  flagTransaction: (transactionId: string, note: string) => Promise<void>
  unflagTransaction: (transactionId: string) => Promise<void>
  markFlagRead: (transactionId: string) => Promise<void>
  // Contagem de flags não lidas (para filhos)
  unreadFlagCount: number
  refreshChildren: () => Promise<void>
}

const FamilyContext = createContext<FamilyContextType | null>(null)

export function FamilyProvider({ children: reactChildren }: { children: ReactNode }) {
  const { user, profile, isOnline } = useAuth()

  const [children, setChildren] = useState<ChildSummary[]>([])
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [loadingChildren, setLoadingChildren] = useState(false)
  const [unreadFlagCount, setUnreadFlagCount] = useState(0)

  const accountType = profile?.account_type ?? 'adult'
  const isParent = accountType === 'parent'
  const isChild = accountType === 'child'
  const isTeen = accountType === 'teen'

  // Sincroniza invite_token do perfil
  useEffect(() => {
    if (profile?.invite_token) {
      setInviteToken(profile.invite_token)
    }
  }, [profile?.invite_token])

  // Carrega filhos (somente responsável)
  const refreshChildren = useCallback(async () => {
    if (!isOnline || !user || !isParent) return
    setLoadingChildren(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, account_type, parent_id')
        .eq('parent_id', user.id)

      if (!error && data) {
        setChildren(data as ChildSummary[])
      }
    } finally {
      setLoadingChildren(false)
    }
  }, [isOnline, user, isParent])

  useEffect(() => {
    if (isParent) refreshChildren()
  }, [isParent, refreshChildren])

  // Conta flags não lidas para filhos/teens
  useEffect(() => {
    if (!isOnline || !user || (!isChild && !isTeen)) return

    async function countUnread() {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('parent_flagged', true)
        .eq('parent_flag_read', false)

      setUnreadFlagCount(count ?? 0)
    }

    countUnread()

    // Realtime: atualiza contagem quando flags mudam
    const channel = supabase
      .channel(`family-flags-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => { countUnread() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isOnline, user, isChild, isTeen])

  // Realtime para responsável: atualiza lista de filhos quando há alterações de perfil
  useEffect(() => {
    if (!isOnline || !user || !isParent) return

    const channel = supabase
      .channel(`family-children-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `parent_id=eq.${user.id}`,
        },
        () => { refreshChildren() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isOnline, user, isParent, refreshChildren])

  // Gera ou regenera token de convite
  const generateToken = useCallback(async (): Promise<string | null> => {
    if (!isOnline || !user) return null
    try {
      const { data, error } = await supabase.rpc('generate_invite_token')
      if (error) {
        console.error('Erro ao gerar token:', error)
        return null
      }
      setInviteToken(data as string)
      return data as string
    } catch (err) {
      console.error('Erro ao gerar token:', err)
      return null
    }
  }, [isOnline, user])

  // Sinaliza transação (responsável → filho)
  const flagTransaction = useCallback(async (transactionId: string, note: string) => {
    if (!isOnline) return
    await supabase
      .from('transactions')
      .update({ parent_flagged: true, parent_flag_note: note, parent_flag_read: false })
      .eq('id', transactionId)
  }, [isOnline])

  // Remove sinalização
  const unflagTransaction = useCallback(async (transactionId: string) => {
    if (!isOnline) return
    await supabase
      .from('transactions')
      .update({ parent_flagged: false, parent_flag_note: null, parent_flag_read: false })
      .eq('id', transactionId)
  }, [isOnline])

  // Filho marca flag como lida
  const markFlagRead = useCallback(async (transactionId: string) => {
    if (!isOnline) return
    await supabase
      .from('transactions')
      .update({ parent_flag_read: true })
      .eq('id', transactionId)

    setUnreadFlagCount(prev => Math.max(0, prev - 1))
  }, [isOnline])

  return (
    <FamilyContext.Provider
      value={{
        children,
        inviteToken,
        loadingChildren,
        generateToken,
        isParent,
        isChild,
        isTeen,
        flagTransaction,
        unflagTransaction,
        markFlagRead,
        unreadFlagCount,
        refreshChildren,
      }}
    >
      {reactChildren}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
