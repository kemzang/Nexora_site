'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')

  useEffect(() => {
    const provider = searchParams.get('provider')
    const urlStatus = searchParams.get('status')
    if (urlStatus === 'canceled') { setStatus('failed'); return }

    // ── Lemon Squeezy / Paddle : pas de statut à interroger côté fournisseur
    // — la vraie activation vient d'un webhook asynchrone (app/api/webhooks/
    // lemonsqueezy ou app/api/webhooks/paddle). On sonde donc notre propre
    // backend jusqu'à ce que le plan attendu apparaisse (généralement
    // quelques secondes).
    if (provider === 'lemonsqueezy' || provider === 'paddle') {
      const expectedPlan = searchParams.get('plan')
      let attempts = 0
      const MAX_ATTEMPTS = 15 // ~30s à 2s d'intervalle

      const poll = async () => {
        attempts++
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const authToken = session?.access_token
          const res = await fetch('/api/proxy/ide/credits', {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          })
          const data = await res.json()
          if (data.plan && (!expectedPlan || data.plan === expectedPlan)) {
            setStatus('success')
            showToast('Paiement confirmé !', 'success')
            setTimeout(() => router.push('/dashboard'), 2500)
            return
          }
        } catch { /* on retente */ }

        if (attempts >= MAX_ATTEMPTS) {
          // Le paiement a probablement réussi (Lemon Squeezy nous a renvoyés
          // ici) mais le webhook n'est pas encore arrivé — on ne montre pas
          // "échec", on renvoie vers le dashboard qui reflétera l'état dès
          // que le webhook aura été traité.
          showToast('Paiement en cours de confirmation — ça va apparaître dans quelques instants.', 'info')
          router.push('/dashboard')
          return
        }
        setTimeout(poll, 2000)
      }

      poll()
      return
    }

    // ── Autres fournisseurs (legacy) : vérification synchrone par référence.
    const reference = searchParams.get('reference')
    if (!reference) { setStatus('failed'); return }

    const verify = async () => {
      try {
        const res = await fetch(`/api/payments/verify?reference=${reference}`)
        const data = await res.json()

        if (data.status === 'complete') {
          setStatus('success')
          showToast('Paiement confirmé !', 'success')
          if (user?.email) {
            fetch('/api/email/payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                userName: user.firstName || user.email.split('@')[0],
                planName: data.transaction?.metadata?.plan || 'Pro',
                amount: `${data.transaction?.amount} ${data.transaction?.currency}`,
                cardLast4: '••••',
              }),
            }).catch(() => {})
          }
          setTimeout(() => router.push('/dashboard'), 3000)
        } else if (data.status === 'failed') {
          setStatus('failed')
        } else {
          setTimeout(verify, 3000)
        }
      } catch { setStatus('failed') }
    }

    verify()
  }, [searchParams, router, showToast, user])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/[0.03] blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md relative z-10">
        {status === 'loading' && (
          <div className="glass rounded-2xl p-10">
            <div className="relative inline-flex mb-6">
              <div className="w-12 h-12 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-foreground/20 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <h1 className="text-xl font-bold tracking-tight mb-3">Vérification du paiement...</h1>
            <p className="text-muted-foreground text-sm">Veuillez patienter pendant la confirmation.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="glass rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">Paiement réussi !</h1>
            <p className="text-muted-foreground mb-8">Votre abonnement est actif. Redirection...</p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
        {status === 'failed' && (
          <div className="glass rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">Paiement échoué</h1>
            <p className="text-muted-foreground mb-8">Le paiement n'a pas pu être traité.</p>
            <Link href="/#pricing">
              <Button variant="outline">Réessayer</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
