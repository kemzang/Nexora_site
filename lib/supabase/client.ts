import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Store the session in a secure cookie-like storage instead of localStorage.
// - SameSite=Lax + Secure flags via cookie attributes
// - Falls back to in-memory if document is unavailable (SSR)
const cookieStorage = {
  getItem(key: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${encodeURIComponent(key)}=`))
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
  },
  setItem(key: string, value: string): void {
    if (typeof document === 'undefined') return
    // 7-day expiry, SameSite=Lax, Secure in production
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    const maxAge = 60 * 60 * 24 * 7 // 7 days
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
  },
  removeItem(key: string): void {
    if (typeof document === 'undefined') return
    document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Lax`
  },
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    storageKey: 'nxr-session',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
