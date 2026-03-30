'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, CreditCard, Lock, CheckCircle, ArrowLeft, Loader2, Shield 
} from 'lucide-react'

const planDetails: Record<string, { name: string; price: string; features: string[] }> = {
  free: {
    name: 'Free',
    price: '0€',
    features: ['500 tokens/mois', '50 requêtes/jour', 'DeepSeek uniquement', 'Support communautaire']
  },
  pro: {
    name: 'Pro',
    price: '9,99€/mois',
    features: ['10 000 tokens/mois', '500 requêtes/jour', 'GPT-4o Mini, Claude Haiku, Gemini', 'Agent + Auto-complétion', 'Support prioritaire']
  },
  business: {
    name: 'Business',
    price: '29,99€/mois',
    features: ['50 000 tokens/mois', '2 000 requêtes/jour', 'GPT-4o, Claude Sonnet', 'Mode équipe', 'Support prioritaire']
  },
  enterprise: {
    name: 'Enterprise',
    price: '99,99€/mois',
    features: ['200 000 tokens/mois', 'Requêtes illimitées', 'Tous les modèles + custom', 'SSO + Support 24/7']
  }
}

function formatCardNumber(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 16)
  const parts = []
  for (let i = 0; i < v.length; i += 4) {
    parts.push(v.slice(i, i + 4))
  }
  return parts.join(' ')
}

function formatExpiry(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 4)
  if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2)
  return v
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') || 'pro'
  const currentPlan = planDetails[plan] || planDetails.pro

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateCard = () => {
    const num = cardNumber.replace(/\s/g, '')
    if (num.length < 13 || num.length > 16) return 'Numéro de carte invalide'
    if (!cardName.trim()) return 'Nom du titulaire requis'
    const [month, year] = expiry.split('/')
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) return 'Date d\'expiration invalide'
    if (cvv.length < 3 || cvv.length > 4) return 'CVV invalide'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateCard()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    // Simulation du traitement de paiement
    // En production, ici on enverrait les données à un processeur de paiement (Stripe, etc.)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simuler l'enregistrement de la carte et le débit
      const priceInCents = parseInt(searchParams.get('price') || '0')
      
      console.log('Traitement du paiement:', {
        plan,
        amount: priceInCents,
        cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        cardName,
      })

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch {
      setError('Erreur lors du traitement du paiement. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Paiement réussi !</h1>
          <p className="text-gray-300 mb-2">
            Votre abonnement <span className="text-purple-400 font-semibold">{currentPlan.name}</span> est maintenant actif.
          </p>
          <p className="text-gray-400 text-sm mb-8">Redirection vers votre dashboard...</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back link */}
          <Link href="/#pricing" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux tarifs
          </Link>

          {/* Plan Summary */}
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Plan sélectionné</p>
                  <p className="text-white text-xl font-bold">{currentPlan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-2xl font-bold">{currentPlan.price}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentPlan.features.map((f) => (
                  <span key={f} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl text-white">Informations de paiement</CardTitle>
                <CardDescription className="text-gray-300">
                  Entrez les informations de votre carte prépayée ou bancaire
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-white">Numéro de carte</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400 pl-10"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-white">Nom du titulaire</Label>
                  <Input
                    id="cardName"
                    placeholder="NOM PRÉNOM"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-white">Expiration</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-white">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 transition-all duration-300 hover:scale-105 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Payer {currentPlan.price}
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>Paiement sécurisé — Vos données sont chiffrées</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}
