import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Persistance de session : on laisse Supabase utiliser localStorage (défaut,
// fiable). L'ancien stockage en cookie cassait l'auth — une session (access +
// refresh + user, URL-encodée) dépasse souvent la limite ~4KB d'un cookie, qui
// est alors rejeté silencieusement → session non persistée → « l'auth ne donne
// pas ». Un cookie lisible en JS n'était de toute façon pas plus sûr que
// localStorage (non httpOnly). storageKey conservé.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'nxr-session',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
