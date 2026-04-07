import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// Perfil resumido de um usuário supervisionado
export interface SupervisedUser {
  id: string
  full_name: string | null
  email: string | null
}

interface FamilyContextType {
  // Para responsáveis (quem gerou invite token)
  supervisedUsers: SupervisedUser[]
  inviteToken: string | null
  loadingSupervisedUsers: boolean
  generateToken: () => Promise<string | null>
  refreshSupervisedUsers: () => Promise<void>
  // Para qualquer tipo
  isParent: boolean
  isSupervised: boolean
  parentName: string | null
  // Sinalização de transações
  flagTransaction: (transactionId: string, note: string) => Promise<void>
  unflagTransaction: (transactionId: string) => Promise<void>
}

const FamilyContext = createContext<FamilyContextType | null>(null)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, profile, isOnline } = useAuth()

  const [supervisedUsers, setSupervisedUsers] = useState<SupervisedUser[]>([])
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [loadingSupervisedUsers, setLoadingSupervisedUsers] = useState(false)
  const [parentName, setParentName] = useState<string | null>(null)

  const accountType = profile?.account_type ?? 'adult'
  const isParent = accountType === 'adult' && Boolean(profile?.invite_token)
  const isSupervised = accountType === 'supervised'

  // Sync invite token
  useEffect(() => {
    if (profile?.invite_token) {
      setInviteToken(profile.invite_token)
    }
  }, [profile?.invite_token])

  // Load parent name for supervised users
  useEffect(() => {
    async function loadParent() {
      if (!isOnline || !user || !isSupervised || !profile?.parent_id) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profile.parent_id)
        .single()
      if (data) setParentName(data.full_name)
    }
    loadParent()
  }, [isOnline, user, isSupervised, profile?.parent_id])

  // Load supervised users (for parents)
  const refreshSupervisedUsers = useCallback(async () => {
    if (!isOnline || !user || !isParent) return
    setLoadingSupervisedUsers(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('parent_id', user.id)

      if (!error && data) {
        setSupervisedUsers(data as SupervisedUser[])
      }
    } finally {
      setLoadingSupervisedUsers(false)
    }
  }, [isOnline, user, isParent])

  useEffect(() => {
    if (isParent) refreshSupervisedUsers()
  }, [isParent, refreshSupervisedUsers])

  // Realtime for new supervised users
  useEffect(() => {
    if (!isOnline || !user || !isParent) return

    const channel = supabase
      .channel(`family-supervised-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `parent_id=eq.${user.id}`,
        },
        () => { refreshSupervisedUsers() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isOnline, user, isParent, refreshSupervisedUsers])

  // Generate or regenerate invite token
  const generateToken = useCallback(async (): Promise<string | null> => {
    if (!isOnline || !user) return null
    try {
      const { data, error } = await supabase.rpc('generate_invite_token')
      if (error) return null
      setInviteToken(data as string)
      return data as string
    } catch {
      return null
    }
  }, [isOnline, user])

  // Flag a transaction (parent → supervised user)
  const flagTransaction = useCallback(async (transactionId: string, note: string) => {
    if (!isOnline) return
    await supabase
      .from('transactions')
      .update({ parent_flagged: true, parent_flag_note: note, parent_flag_read: false })
      .eq('id', transactionId)
  }, [isOnline])

  // Unflag a transaction
  const unflagTransaction = useCallback(async (transactionId: string) => {
    if (!isOnline) return
    await supabase
      .from('transactions')
      .update({ parent_flagged: false, parent_flag_note: null, parent_flag_read: false })
      .eq('id', transactionId)
  }, [isOnline])

  return (
    <FamilyContext.Provider
      value={{
        supervisedUsers,
        inviteToken,
        loadingSupervisedUsers,
        generateToken,
        refreshSupervisedUsers,
        isParent,
        isSupervised,
        parentName,
        flagTransaction,
        unflagTransaction,
      }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
