'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'

type Status = 'loading' | 'redirecting' | 'success' | 'error'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setStatus('error')
      setErrorMsg('No authorization code received. Please try logging in again.')
      return
    }

    async function exchangeCode() {
      try {
        const res = await fetch('/api/auth/exchange-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })

        const data = await res.json()

        if (!res.ok || !data.access_token) {
          setStatus('error')
          setErrorMsg(data.error || 'Failed to exchange authorization code.')
          return
        }

        setToken(data.access_token)
        setStatus('redirecting')

        // Redirect to VS Code extension with the token
        const vscodeUrl = `vscode://nexora.nexora/auth?token=${encodeURIComponent(data.access_token)}&user=${encodeURIComponent(data.user?.name || '')}`

        // Try deep-link redirect
        setTimeout(() => {
          window.location.href = vscodeUrl
        }, 800)

        // After 3s, if still here, mark as success (user can copy token)
        setTimeout(() => setStatus('success'), 3000)
      } catch (err) {
        setStatus('error')
        setErrorMsg('Connection error. Please check your network and try again.')
      }
    }

    exchangeCode()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="orb orb-float-1 w-[500px] h-[500px] bg-indigo-600/10 top-[-10%] left-[-10%]" />
      <div className="orb orb-float-2 w-[400px] h-[400px] bg-violet-600/8 bottom-[-10%] right-[-10%]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="p-8 text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Nexora</h1>
              <p className="text-sm text-muted-foreground">VS Code Extension</p>
            </div>

            <AnimatePresence mode="wait">
              {/* Loading */}
              {status === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex justify-center">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">Verifying your credentials…</p>
                </motion.div>
              )}

              {/* Redirecting */}
              {status === 'redirecting' && (
                <motion.div key="redirecting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-indigo-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-30" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Opening VS Code…</p>
                    <p className="text-xs text-muted-foreground mt-1">Allow the browser to open VS Code when prompted.</p>
                  </div>
                  <div className="text-left bg-white/[0.04] rounded-xl border border-white/[0.08] p-3">
                    <p className="text-xs text-muted-foreground mb-1">Your access token:</p>
                    <p className="text-xs font-mono text-indigo-300 break-all select-all">{token.slice(0, 40)}…</p>
                  </div>
                </motion.div>
              )}

              {/* Success */}
              {status === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Authentication successful!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If VS Code didn't open automatically, click the button below.
                    </p>
                  </div>
                  <a
                    href={`vscode://nexora.nexora/auth?token=${encodeURIComponent(token)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open VS Code
                  </a>
                  <p className="text-xs text-muted-foreground">
                    You can close this tab after VS Code opens.
                  </p>
                </motion.div>
              )}

              {/* Error */}
              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex justify-center">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Authentication failed</p>
                    <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
                  </div>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                  >
                    Try again
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          <div className="px-8 py-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground/50">nexora-mu-henna.vercel.app</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Secure</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function TokensCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
