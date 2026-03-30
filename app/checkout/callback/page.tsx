'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')

  useEffect(() => {
    const reference = searchParams.get('reference')
    const urlStatus = searchParams.get('status')

    if (urlStatus === 'canceled') {
      setStatus('failed')
      return
    }

    if (!reference) {
      setStatus('failed')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/payments/verify?reference=${reference}`)
        const data = await res.json()

        if (data.status === 'complete') {
          setStatus('success')
          showToast('Paiement confirmé !', 'success')

          // Envoyer email de confirmation
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
          // Encore en cours, re-vérifier dans 3s
          setTimeout(verify, 3000)
        }
      } catch {
        setStatus('failed')
      }
    }

    verify()
  }, [searchParams, router, showToast, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Vérification du paiement...</h1>
            <p className="text-gray-300">Veuillez patienter pendant que nous confirmons votre paiement.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Paiement réussi !</h1>
            <p className="text-gray-300 mb-8">Votre abonnement est maintenant actif. Redirection...</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Paiement échoué</h1>
            <p className="text-gray-300 mb-8">Le paiement n'a pas pu être traité. Veuillez réessayer.</p>
            <Link href="/#pricing">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Réessayer
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
