import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { UserProfile } from '../types/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isOnline: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
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

    // Timeout de segurança: se getSession travar, desbloqueia em 4s
    const safetyTimeout = setTimeout(() => {
      console.warn('Auth timeout - forçando loading = false')
      resolveLoading()
    }, 4000)

    // Listener de auth state - executa ANTES do getSession para pegar o evento INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          // Busca profile sem bloquear o loading
          fetchProfile(newSession.user.id).then((p) => {
            setProfile(p)
          })
        } else {
          setProfile(null)
        }

        // Resolve loading no evento INITIAL_SESSION ou SIGNED_IN
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          resolveLoading()
        }
      }
    )

    // getSession como fallback (caso onAuthStateChange não dispare)
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

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    return { error: error?.message ?? null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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
