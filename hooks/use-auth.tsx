'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AuthService } from '@/lib/supabase/auth'
import type { AuthUser, LoginCredentials, RegisterCredentials } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<{ error?: string, token?: string }>
  signUp: (credentials: RegisterCredentials) => Promise<{ error?: string, token?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
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
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const result = await AuthService.signIn(credentials)
      if (result.user) {
        setUser(result.user)
      }
      return { error: result.error, token: result.session?.access_token }
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
      if (result.user) {
        setUser(result.user)
      }
      return { error: result.error, token: result.session?.access_token }
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
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
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
