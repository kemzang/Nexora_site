'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function ContinueRedirectPage() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Initialisation...')

  useEffect(() => {
    // Délai pour éviter les problèmes d'hydration
    const timer = setTimeout(async () => {
      try {
        setMessage('Vérification de l\'authentification...')
        
        // Import dynamique pour éviter les problèmes SSR
        const { supabase } = await import('@/lib/supabase')
        
        // Récupération sécurisée des paramètres URL
        let state = null
        let error = null
        
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          state = urlParams.get('state')
          error = urlParams.get('error')
        }
        
        if (error) {
          setStatus('error')
          setMessage(`Erreur d'authentification: ${error}`)
          return
        }

        setMessage('Vérification de la session utilisateur...')
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setMessage('Redirection vers la page de connexion...')
          
          if (typeof window !== 'undefined') {
            const loginUrl = `/auth/login?redirect=${encodeURIComponent(window.location.href)}`
            setTimeout(() => {
              window.location.href = loginUrl
            }, 1000)
          }
          return
        }

        setMessage('Génération du code d\'authentification...')

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

        setStatus('success')
        setMessage('Authentification réussie! Redirection vers VS Code...')

        if (typeof window !== 'undefined') {
          const vscodeUrl = new URL('vscode://Nexora.nexora/auth')
          vscodeUrl.searchParams.set('code', data.code)
          if (state) vscodeUrl.searchParams.set('state', state)

          setTimeout(() => {
            window.location.href = vscodeUrl.toString()
          }, 2000)
        }

      } catch (err) {
        console.error('Auth error:', err)
        setStatus('error')
        setMessage('Erreur inattendue lors de l\'authentification')
      }
    }, 500) // Délai de 500ms pour éviter les problèmes d'hydration

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Authentification VS Code</h1>
          <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full"></div>
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-300">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-medium">{message}</p>
            <p className="text-gray-400 text-sm">
              Si VS Code ne s'ouvre pas automatiquement, vous pouvez fermer cette fenêtre.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 font-medium">{message}</p>
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm">Nexora - Extension VS Code</p>
        </div>
      </div>
    </div>
  )
}