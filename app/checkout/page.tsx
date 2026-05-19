'use client'

import { useState, Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard, Lock, CheckCircle, ArrowLeft, Loader2, Shield,
  ChevronDown, Smartphone, Globe, Search, Wifi
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { countries, validatePhone, type Country } from '@/lib/countries'

const planDetails: Record<string, { name: string; price: string; priceXAF: number; features: string[]; color: string }> = {
  free:       { name: 'Free',       price: '0€',    priceXAF: 0,     color: '#6366f1', features: ['1K tokens/mois', '20 requêtes/jour', 'DeepSeek, Gemini Flash'] },
  neo:        { name: 'Neo',        price: '4€',    priceXAF: 2620,  color: '#38bdf8', features: ['15K tokens/mois', '150 requêtes/jour', 'Gemini Pro', 'Auto-complétion'] },
  pro:        { name: 'Pro',        price: '9€',    priceXAF: 5900,  color: '#f59e0b', features: ['50K tokens/mois', '500 requêtes/jour', '+ Grok, Claude Haiku', 'Mode Agent', 'Support prioritaire'] },
  business:   { name: 'Business',   price: '17€',   priceXAF: 11150, color: '#10b981', features: ['200K tokens/mois', '2K requêtes/jour', '+ Claude Sonnet', 'Mode équipe'] },
  enterprise: { name: 'Enterprise', price: '100€',  priceXAF: 65550, color: '#8b5cf6', features: ['1M tokens/mois', 'Requêtes illimitées', '+ Claude Opus, GPT-4', 'SSO + Support 24/7'] },
}

type PaymentMethod = 'card' | 'mobile_money'

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
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-card border border-border/60 text-foreground hover:bg-accent transition-colors w-full"
      >
        <span className="text-lg">{selected.flag}</span>
        <span className="text-sm flex-1 text-left">{selected.name}</span>
        <span className="text-xs text-muted-foreground">{selected.dialCode}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 mt-1.5 w-full bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-accent border border-border/50 rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors ${c.code === selected.code ? 'bg-indigo-500/10' : ''}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-sm text-foreground flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.dialCode}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Aucun pays trouvé</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

function VirtualCard({ number, name, expiry, focused }: {
  number: string; name: string; expiry: string; focused: 'number' | 'expiry' | 'cvv' | 'name' | null
}) {
  const displayNumber = number
    ? number.replace(/\d/g, (d, i) => (number.replace(/\s/g, '').length > 12 || i < number.length - 4 ? '•' : d))
    : '•••• •••• •••• ••••'
  const displayName = name || 'VOTRE NOM'
  const displayExpiry = expiry || 'MM/AA'

  return (
    <div className="relative h-44 rounded-2xl overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #1e1b4b 100%)' }}>
      {/* Texture circles */}
      <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full bg-white/[0.03]" />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-white/80 text-xs font-medium tracking-wider">NEXORA</span>
          </div>
          <Wifi className="w-5 h-5 text-white/40 rotate-90" />
        </div>

        {/* Chip */}
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-500/60 flex items-center justify-center">
          <div className="w-6 h-4 rounded-sm border border-yellow-200/50 grid grid-cols-2 gap-0.5 p-0.5">
            <div className="bg-yellow-200/30 rounded-sm" />
            <div className="bg-yellow-200/30 rounded-sm" />
            <div className="bg-yellow-200/30 rounded-sm" />
            <div className="bg-yellow-200/30 rounded-sm" />
          </div>
        </div>

        {/* Card number */}
        <p className={`font-mono text-base tracking-[0.2em] transition-all ${focused === 'number' ? 'text-white' : 'text-white/80'}`}>
          {number ? number.padEnd(19, ' ').replace(/ {1,4}/g, (m, i) => {
            const pos = Math.floor(i / 5)
            return ' ' + (number.replace(/\s/g, '').length > 12 ? '••••' : '').slice(0, 4)
          }) : '•••• •••• •••• ••••'}
        </p>

        {/* Name & expiry */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Titulaire</p>
            <p className={`text-sm font-medium tracking-wide uppercase transition-all ${focused === 'name' ? 'text-white' : 'text-white/80'}`}>
              {displayName.toUpperCase().slice(0, 22)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Exp.</p>
            <p className={`text-sm font-mono transition-all ${focused === 'expiry' ? 'text-white' : 'text-white/80'}`}>
              {displayExpiry}
            </p>
          </div>
          {/* Visa-like logo placeholder */}
          <div className="text-right ml-4">
            <p className="text-white/60 font-bold text-lg italic" style={{ fontFamily: 'Georgia, serif' }}>VISA</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  const plan = searchParams.get('plan') || 'neo'
  const currentPlan = planDetails[plan] || planDetails.pro

  const [country, setCountry] = useState<Country>(countries[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [momoChannel, setMomoChannel] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [focusedField, setFocusedField] = useState<'number' | 'expiry' | 'cvv' | 'name' | null>(null)
  const [showCvvBack, setShowCvvBack] = useState(false)

  useEffect(() => {
    if (!country.hasMobileMoney) {
      setPaymentMethod('card'); setMomoChannel('')
    } else {
      setMomoChannel(country.momoChannels[0]?.id || '')
    }
    setPhone('')
  }, [country])

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, country.phoneLength)
    setPhone(digits)
  }

  const validateCard = (): string | null => {
    if (!cardName.trim()) return 'Veuillez saisir le nom du titulaire'
    const rawNumber = cardNumber.replace(/\s/g, '')
    if (rawNumber.length < 16) return 'Numéro de carte incomplet (16 chiffres requis)'
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) return 'Date d\'expiration invalide (MM/AA)'
    const [mm, yy] = cardExpiry.split('/').map(Number)
    const now = new Date()
    const cardYear = 2000 + yy
    const cardMonth = mm
    if (mm < 1 || mm > 12) return 'Mois d\'expiration invalide'
    if (cardYear < now.getFullYear() || (cardYear === now.getFullYear() && cardMonth < now.getMonth() + 1)) return 'Carte expirée'
    if (cardCvv.length < 3) return 'CVV incomplet (3 chiffres requis)'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (paymentMethod === 'card') {
      const cardError = validateCard()
      if (cardError) { setError(cardError); return }
    } else {
      if (!phone) { setError('Numéro de téléphone requis'); return }
      if (!validatePhone(phone, country)) { setError(`Le numéro doit contenir ${country.phoneLength} chiffres`); return }
      if (!momoChannel) { setError('Sélectionnez un opérateur'); return }
    }

    setLoading(true)
    try {
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
      if (!initData.success) { setError(initData.error || 'Erreur d\'initialisation'); setLoading(false); return }

      if (paymentMethod === 'card') {
        // TODO: Integrate direct card processing (Stripe/NotchPay direct card API)
        if (initData.authorizationUrl) {
          window.location.href = initData.authorizationUrl
        } else {
          setError('URL de paiement non disponible')
          setLoading(false)
        }
        return
      }

      const processRes = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: initData.reference, channel: momoChannel, phone: `${country.dialCode}${phone}` }),
      })
      const processData = await processRes.json()
      if (processData.success) {
        showToast('Validez le paiement sur votre téléphone', 'info')
        router.push(`/checkout/callback?reference=${initData.reference}`)
      } else {
        setError(processData.message || 'Erreur de traitement')
        setLoading(false)
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-indigo-600/8 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-violet-600/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/#pricing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Retour aux tarifs
          </Link>

          {/* Plan summary */}
          <Card className="glass mb-4 border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${currentPlan.color}22` }}>
                    <span className="text-sm font-bold" style={{ color: currentPlan.color }}>{currentPlan.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan sélectionné</p>
                    <p className="font-bold text-foreground">{currentPlan.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{currentPlan.price}</p>
                  <p className="text-xs text-muted-foreground">{currentPlan.priceXAF.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {currentPlan.features.slice(0, 3).map(f => (
                  <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${currentPlan.color}18`, color: currentPlan.color }}>
                    {f}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment form */}
          <Card className="glass border-border/60">
            <CardHeader className="text-center space-y-3 pt-7 pb-5">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Lock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Paiement sécurisé</CardTitle>
                <CardDescription className="text-sm">Vos données sont protégées par chiffrement TLS</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-7">
              {error && (
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                  <Alert className="bg-red-500/10 border-red-500/25 text-red-400 rounded-xl">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Country */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" /> Pays
                  </Label>
                  <CountrySelector selected={country} onSelect={setCountry} />
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Méthode de paiement</Label>
                  <div className={`grid gap-2 ${country.hasMobileMoney ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm ${
                        paymentMethod === 'card'
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-foreground font-medium'
                          : 'bg-card border-border/50 text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Carte bancaire
                    </button>
                    {country.hasMobileMoney && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile_money')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm ${
                          paymentMethod === 'mobile_money'
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-foreground font-medium'
                            : 'bg-card border-border/50 text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Mobile Money
                      </button>
                    )}
                  </div>
                </div>

                {/* CARD FORM */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'card' && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Card preview */}
                      <VirtualCard
                        number={cardNumber}
                        name={cardName}
                        expiry={cardExpiry}
                        focused={focusedField}
                      />

                      {/* Cardholder name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cardName" className="text-sm text-muted-foreground">Nom du titulaire</Label>
                        <Input
                          id="cardName"
                          placeholder="Jean Dupont"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          className="bg-card border-border/60 focus:border-indigo-500/50 uppercase"
                          maxLength={30}
                          autoComplete="cc-name"
                        />
                      </div>

                      {/* Card number */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cardNumber" className="text-sm text-muted-foreground">Numéro de carte</Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                            onFocus={() => setFocusedField('number')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-card border-border/60 focus:border-indigo-500/50 pr-10 font-mono tracking-widest"
                            maxLength={19}
                            inputMode="numeric"
                            autoComplete="cc-number"
                          />
                          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        </div>
                      </div>

                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="cardExpiry" className="text-sm text-muted-foreground">Date d'expiration</Label>
                          <Input
                            id="cardExpiry"
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                            onFocus={() => setFocusedField('expiry')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-card border-border/60 focus:border-indigo-500/50 font-mono text-center"
                            maxLength={5}
                            inputMode="numeric"
                            autoComplete="cc-exp"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cardCvv" className="text-sm text-muted-foreground">CVV / CVC</Label>
                          <div className="relative">
                            <Input
                              id="cardCvv"
                              placeholder="•••"
                              type={showCvvBack ? 'text' : 'password'}
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              onFocus={() => { setFocusedField('cvv'); setShowCvvBack(true) }}
                              onBlur={() => { setFocusedField(null); setShowCvvBack(false) }}
                              className="bg-card border-border/60 focus:border-indigo-500/50 font-mono text-center"
                              maxLength={4}
                              inputMode="numeric"
                              autoComplete="cc-csc"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cards accepted */}
                      <div className="flex items-center gap-2 pt-1">
                        <p className="text-xs text-muted-foreground">Cartes acceptées :</p>
                        {['VISA', 'MC', 'PREPAY'].map(c => (
                          <span key={c} className="px-2 py-0.5 rounded bg-white/[0.06] border border-border/40 text-xs text-muted-foreground font-mono">
                            {c === 'MC' ? 'Mastercard' : c === 'PREPAY' ? 'Prépayée' : c}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* MOBILE MONEY FORM */}
                  {paymentMethod === 'mobile_money' && country.hasMobileMoney && (
                    <motion.div
                      key="momo"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* Operator */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Opérateur</Label>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(country.momoChannels.length, 2)}, 1fr)` }}>
                          {country.momoChannels.map(ch => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => setMomoChannel(ch.id)}
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                                momoChannel === ch.id
                                  ? 'border-indigo-500/40 text-foreground'
                                  : 'bg-card border-border/50 text-muted-foreground hover:bg-accent'
                              }`}
                              style={momoChannel === ch.id ? { backgroundColor: `${ch.color}18` } : {}}
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                              <span className="text-sm">{ch.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Phone number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm text-muted-foreground">Numéro de téléphone</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-card border border-border/60 text-foreground min-w-fit">
                            <span>{country.flag}</span>
                            <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={'6' + '0'.repeat(country.phoneLength - 1)}
                            value={phone}
                            onChange={e => handlePhoneChange(e.target.value)}
                            maxLength={country.phoneLength}
                            className="bg-card border-border/60 focus:border-indigo-500/50 flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {phone.length}/{country.phoneLength} chiffres
                          {phone.length === country.phoneLength && <span className="text-emerald-400 ml-2">✓ Valide</span>}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] mt-1"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement en cours...</>
                  ) : (
                    <><Lock className="mr-2 h-4 w-4" />
                      {currentPlan.priceXAF === 0
                        ? 'Activer gratuitement'
                        : `Payer ${currentPlan.priceXAF.toLocaleString('fr-FR')} FCFA`
                      }
                    </>
                  )}
                </Button>
              </form>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Paiement sécurisé</span>
                </div>
                <div className="w-px h-3 bg-border/60" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chiffrement TLS</span>
                </div>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}
