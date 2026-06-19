'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return

    const handleAuth = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const urlParams = new URLSearchParams(window.location.search)
        const state = urlParams.get('state')
        const error = urlParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Erreur d'authentification: ${error}`)
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.href)}`
          return
        }

        const response = await fetch('/api/auth/generate-auth-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, state })
        })
        const data = await response.json()

        if (!response.ok || !data.success) {
          setStatus('error')
          setMessage(data.error || 'Erreur lors de la génération du code')
          return
        }

        const ALLOWED_SCHEMES = ['vscode', 'vscode-insiders', 'vscodium', 'cursor', 'windsurf', 'code-oss', 'trae']
        const rawScheme = urlParams.get('uriScheme') || 'vscode'
        const scheme = ALLOWED_SCHEMES.includes(rawScheme) ? rawScheme : 'vscode'

        const editorUrl = new URL(`${scheme}://Nexora.nexora/auth`)
        editorUrl.searchParams.set('code', data.code)
        if (state) editorUrl.searchParams.set('state', state)

        setStatus('success')
        setMessage('Authentification réussie ! Redirection vers ton éditeur…')

        setTimeout(() => { window.location.href = editorUrl.toString() }, 1500)
      } catch (err) {
        console.error('Auth error:', err)
        setStatus('error')
        setMessage('Erreur inattendue lors de l\'authentification')
      }
    }

    handleAuth()
  }, [mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/[0.03] blur-[120px] rounded-full" />

      <div className="glass rounded-2xl p-8 max-w-md w-full text-center relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Authentification de ton éditeur</h1>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="relative inline-flex">
              <div className="w-8 h-8 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-foreground/20 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <p className="text-muted-foreground">Authentification en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-medium">{message}</p>
            <p className="text-muted-foreground text-sm">
              Si ton éditeur ne s'ouvre pas automatiquement, fermez cette fenêtre.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 font-medium">{message}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-muted-foreground text-sm">Nexora — Extension éditeur</p>
        </div>
      </div>
    </div>
  )
}
