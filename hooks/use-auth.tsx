'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AuthService } from '@/lib/supabase/auth'
import type { AuthUser, LoginCredentials, RegisterCredentials } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  token: string | null
  signIn: (credentials: LoginCredentials) => Promise<{ error?: string, token?: string }>
  signUp: (credentials: RegisterCredentials) => Promise<{ error?: string, token?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const currentUser = await AuthService.getCurrentUser()
          setUser(currentUser)
          setToken(session.access_token)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = await AuthService.getCurrentUser()
          setUser(authUser)
          setToken(session.access_token)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setToken(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const result = await AuthService.signIn(credentials)
      if (result.error) {
        return { error: result.error }
      }
      if (result.user && result.session) {
        setUser(result.user)
        setToken(result.session.access_token)
        return { error: undefined, token: result.session.access_token }
      }
      return { error: 'Erreur lors de la récupération de la session' }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (credentials: RegisterCredentials) => {
    setLoading(true)
    try {
      const result = await AuthService.signUp(credentials)
      if (result.error) {
        return { error: result.error }
      }
      if (result.user && result.session) {
        setUser(result.user)
        setToken(result.session.access_token)
        return { error: undefined, token: result.session.access_token }
      }
      return { error: undefined, token: undefined } // Succès mais confirmation email requise
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
      setUser(null)
      setToken(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
      if (session) setToken(session.access_token)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  /** Connexion via Google (OAuth Supabase). Redirige vers Google puis revient
   *  sur le dashboard. Nécessite que le provider Google soit activé dans Supabase. */
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard`
            : undefined,
      },
    })
    return error ? { error: error.message } : {}
  }

  const value: AuthContextType = {
    user,
    loading,
    token,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
