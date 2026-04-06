import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { UserProfile } from '../types/supabase'
import type { AccountType } from '../types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isOnline: boolean
  signUp: (username: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  // Onboarding
  needsOnboarding: boolean
  completeOnboarding: (accountType: AccountType, inviteToken?: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isOnline = isSupabaseConfigured
  const loadingResolved = useRef(false)

  function resolveLoading() {
    if (!loadingResolved.current) {
      loadingResolved.current = true
      setLoading(false)
    }
  }

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar profile:', error)
        return null
      }
      return data as UserProfile
    } catch (err) {
      console.error('Erro de rede ao buscar profile:', err)
      return null
    }
  }, [])

  useEffect(() => {
    if (!isOnline) {
      resolveLoading()
      return
    }

    const safetyTimeout = setTimeout(() => {
      console.warn('Auth timeout - forçando loading = false')
      resolveLoading()
    }, 4000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          fetchProfile(newSession.user.id).then((p) => {
            setProfile(p)
          })
        } else {
          setProfile(null)
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          resolveLoading()
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!loadingResolved.current) {
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          fetchProfile(s.user.id).then((p) => setProfile(p))
        }
        resolveLoading()
      }
    }).catch((err) => {
      console.error('Erro em getSession:', err)
      resolveLoading()
    })

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [isOnline, fetchProfile])

  const signUp = useCallback(async (username: string, password: string, fullName: string) => {
    const raw = username.toLowerCase().trim()
    const email = raw.includes('@') ? raw : `${raw}@bolsocheio.app`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username: raw },
      },
    })
    if (error?.message === 'User already registered') {
      return { error: 'Este usuário já existe' }
    }
    return { error: error?.message ?? null }
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    const raw = username.toLowerCase().trim()
    const email = raw.includes('@') ? raw : `${raw}@bolsocheio.app`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error?.message === 'Invalid login credentials') {
      return { error: 'Usuário ou senha incorretos' }
    }
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }, [])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null)
    }

    return { error: error?.message ?? null }
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }, [user, fetchProfile])

  // Determina se o onboarding é necessário
  // Contas novas (sem account_type definido ou onboarding_completed = false)
  const needsOnboarding = Boolean(
    user &&
    isOnline &&
    profile &&
    !profile.onboarding_completed
  )

  // Completa o onboarding: define account_type e opcionalmente vincula ao responsável
  const completeOnboarding = useCallback(async (
    accountType: AccountType,
    inviteToken?: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Usuário não autenticado' }

    // Se for filho/teen e forneceu token → vincula via RPC
    if ((accountType === 'child' || accountType === 'teen') && inviteToken) {
      const { data, error } = await supabase.rpc('link_child_to_parent', {
        p_invite_token: inviteToken.trim().toUpperCase(),
      })

      if (error) return { error: error.message }

      const result = data as { success: boolean; error?: string }
      if (!result.success) return { error: result.error ?? 'Erro ao vincular conta' }

      // Atualiza account_type local
      await supabase
        .from('profiles')
        .update({ account_type: accountType, onboarding_completed: true })
        .eq('id', user.id)

      await refreshProfile()
      return { error: null }
    }

    // Responsável ou adulto: apenas marca onboarding como completo
    const updates: Partial<UserProfile> = {
      account_type: accountType,
      onboarding_completed: true,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null)
    }

    return { error: error?.message ?? null }
  }, [user, refreshProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isOnline,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
        needsOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
