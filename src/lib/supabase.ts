import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'BolsoCheio: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas. ' +
    'O app funcionará em modo offline (localStorage).'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
