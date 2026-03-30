'use client'

import { useState, Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard, Lock, CheckCircle, ArrowLeft, Loader2, Shield,
  ChevronDown, Smartphone, Globe, Search
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { countries, validatePhone, type Country } from '@/lib/countries'

const planDetails: Record<string, { name: string; price: string; priceXAF: number; features: string[] }> = {
  free: {
    name: 'Free', price: '0€', priceXAF: 0,
    features: ['500 tokens/mois', '50 requêtes/jour', 'DeepSeek uniquement', 'Support communautaire'],
  },
  pro: {
    name: 'Pro', price: '9,99€', priceXAF: 6550,
    features: ['10 000 tokens/mois', '500 requêtes/jour', 'GPT-4o Mini, Claude Haiku, Gemini', 'Agent + Auto-complétion', 'Support prioritaire'],
  },
  business: {
    name: 'Business', price: '29,99€', priceXAF: 19650,
    features: ['50 000 tokens/mois', '2 000 requêtes/jour', 'GPT-4o, Claude Sonnet', 'Mode équipe', 'Support prioritaire'],
  },
  enterprise: {
    name: 'Enterprise', price: '99,99€', priceXAF: 65500,
    features: ['200 000 tokens/mois', 'Requêtes illimitées', 'Tous les modèles + custom', 'SSO + Support 24/7'],
  },
}

type PaymentMethod = 'card' | 'mobile_money'

// --- Country Selector Component ---
function CountrySelector({ selected, onSelect }: { selected: Country; onSelect: (c: Country) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors w-full"
      >
        <span className="text-xl">{selected.flag}</span>
        <span className="text-sm flex-1 text-left">{selected.name}</span>
        <span className="text-xs text-gray-400">{selected.dialCode}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 mt-1 w-full bg-slate-800 border border-white/20 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-white/10 transition-colors ${
                    c.code === selected.code ? 'bg-purple-500/20' : ''
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-sm text-white flex-1">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.dialCode}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Aucun pays trouvé</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Main Checkout Form ---
function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  const plan = searchParams.get('plan') || 'pro'
  const currentPlan = planDetails[plan] || planDetails.pro

  const [country, setCountry] = useState<Country>(countries[0]) // Cameroun par défaut
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [momoChannel, setMomoChannel] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Quand le pays change, reset la méthode si pas de MoMo
  useEffect(() => {
    if (!country.hasMobileMoney) {
      setPaymentMethod('card')
      setMomoChannel('')
    } else {
      setMomoChannel(country.momoChannels[0]?.id || '')
    }
    setPhone('')
  }, [country])

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, country.phoneLength)
    setPhone(digits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (paymentMethod === 'mobile_money') {
      if (!phone) { setError('Numéro de téléphone requis'); return }
      if (!validatePhone(phone, country)) {
        setError(`Le numéro doit contenir ${country.phoneLength} chiffres pour ${country.name}`)
        return
      }
      if (!momoChannel) { setError('Sélectionnez un opérateur'); return }
    }

    setLoading(true)

    try {
      // 1. Initialiser le paiement
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentPlan.priceXAF,
          currency: 'XAF',
          email: user?.email || 'guest@nexora.ai',
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Client',
          phone: paymentMethod === 'mobile_money' ? `${country.dialCode}${phone}` : undefined,
          plan,
        }),
      })
      const initData = await initRes.json()

      if (!initData.success) {
        setError(initData.error || 'Erreur lors de l\'initialisation du paiement')
        setLoading(false)
        return
      }

      if (paymentMethod === 'card') {
        // Rediriger vers la page de paiement NotchPay (hosted checkout)
        if (initData.authorizationUrl) {
          window.location.href = initData.authorizationUrl
        } else {
          setError('URL de paiement non disponible')
          setLoading(false)
        }
        return
      }

      // 2. Mobile Money — traiter directement
      const processRes = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: initData.reference,
          channel: momoChannel,
          phone: `${country.dialCode}${phone}`,
        }),
      })
      const processData = await processRes.json()

      if (processData.success) {
        showToast('Validez le paiement sur votre téléphone', 'info')
        // Rediriger vers callback pour vérifier le statut
        router.push(`/checkout/callback?reference=${initData.reference}`)
      } else {
        setError(processData.message || 'Erreur lors du traitement')
        setLoading(false)
      }
    } catch {
      setError('Erreur de connexion. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                  <p className="text-gray-400 text-xs">≈ {currentPlan.priceXAF.toLocaleString()} FCFA</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentPlan.features.map(f => (
                  <span key={f} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">{f}</span>
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
                <CardTitle className="text-xl text-white">Paiement sécurisé</CardTitle>
                <CardDescription className="text-gray-300">Choisissez votre pays et méthode de paiement</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Country Selector */}
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Pays
                  </Label>
                  <CountrySelector selected={country} onSelect={setCountry} />
                </div>

                {/* Payment Method Tabs */}
                <div className="space-y-2">
                  <Label className="text-white">Méthode de paiement</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-purple-600/30 border-purple-400/50 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Carte</span>
                    </button>
                    {country.hasMobileMoney && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile_money')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                          paymentMethod === 'mobile_money'
                            ? 'bg-purple-600/30 border-purple-400/50 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="text-sm">Mobile Money</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Payment Info */}
                {paymentMethod === 'card' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <p className="text-blue-300 text-sm">
                        <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                        Vous serez redirigé vers la page de paiement sécurisée NotchPay pour entrer vos informations de carte.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                      <span>Cartes acceptées :</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-white">VISA</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-white">Mastercard</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-white">Prépayée</span>
                    </div>
                  </motion.div>
                )}

                {/* Mobile Money */}
                {paymentMethod === 'mobile_money' && country.hasMobileMoney && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Operator Selection */}
                    <div className="space-y-2">
                      <Label className="text-white">Opérateur</Label>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(country.momoChannels.length, 2)}, 1fr)` }}>
                        {country.momoChannels.map(ch => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setMomoChannel(ch.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                              momoChannel === ch.id
                                ? 'border-purple-400/50 text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                            style={momoChannel === ch.id ? { backgroundColor: `${ch.color}20` } : {}}
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }}></div>
                            <span className="text-sm">{ch.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Numéro de téléphone</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white min-w-fit">
                          <span>{country.flag}</span>
                          <span className="text-sm text-gray-300">{country.dialCode}</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={'0'.repeat(country.phoneLength)}
                          value={phone}
                          onChange={e => handlePhoneChange(e.target.value)}
                          maxLength={country.phoneLength}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-500 focus:border-purple-400 flex-1"
                        />
                      </div>
                      <p className="text-gray-500 text-xs">
                        {phone.length}/{country.phoneLength} chiffres
                        {phone.length === country.phoneLength && (
                          <span className="text-green-400 ml-2">✓ Numéro valide</span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 transition-all duration-300 hover:scale-[1.02] mt-2"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement en cours...</>
                  ) : (
                    <><Lock className="mr-2 h-4 w-4" />Payer {currentPlan.priceXAF.toLocaleString()} FCFA</>
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>Paiement sécurisé via NotchPay — Vos données sont chiffrées</span>
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
