'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function OnboardingCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setStatus('error')
      setErrorMsg('No authorization code received.')
      return
    }

    async function completeOnboarding() {
      try {
        const res = await fetch('/api/auth/exchange-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })

        const data = await res.json()

        if (!res.ok || !data.access_token) {
          setStatus('error')
          setErrorMsg(data.error || 'Onboarding failed.')
          return
        }

        setStatus('success')

        // Try to pass token back to VS Code
        const vscodeUrl = `vscode://Nexora.nexora/onboarding?token=${encodeURIComponent(data.access_token)}`
        setTimeout(() => { window.location.href = vscodeUrl }, 1000)

        // Redirect to dashboard after 3s
        setTimeout(() => router.push('/dashboard'), 3000)
      } catch {
        setStatus('error')
        setErrorMsg('Connection error. Please try again.')
      }
    }

    completeOnboarding()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="orb orb-float-1 w-[500px] h-[500px] bg-foreground/[0.03] top-0 left-0" />
      <div className="orb orb-float-2 w-[400px] h-[400px] bg-foreground/[0.02] bottom-0 right-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass-strong rounded-2xl border border-white/[0.08] overflow-hidden p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          {status === 'loading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <Loader2 className="w-10 h-10 text-foreground/70 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Setting up your account…</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <p className="text-base font-semibold text-foreground">Welcome to Nexora!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account is ready. Redirecting to your dashboard…
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <p className="text-base font-semibold text-foreground">Onboarding failed</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
              <Link href="/auth/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors">
                Try again
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function OnboardingCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-foreground/70 animate-spin" />
      </div>
    }>
      <OnboardingCallbackContent />
    </Suspense>
  )
}
