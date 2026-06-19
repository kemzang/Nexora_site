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
  CreditCard, Lock, ArrowLeft, Loader2, Shield,
  ChevronDown, Smartphone, Globe, Search, Wifi, Phone, CheckCircle2
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { countries, validatePhone, type Country } from '@/lib/countries'

/* ─── Plan config ────────────────────────────────────────────────── */
const planDetails: Record<string, { name: string; price: string; priceXAF: number; color: string }> = {
  free:       { name: 'Free',          price: '0€',  priceXAF: 0,     color: '#94a3b8' },
  // Forfaits de test temporaires ($1 / $2)
  test1:      { name: 'Test 1 semaine',  price: '1€',  priceXAF: 660,   color: '#94a3b8' },
  test2:      { name: 'Test 2 semaines', price: '2€',  priceXAF: 1320,  color: '#94a3b8' },
  starter:    { name: 'Starter',       price: '5€',  priceXAF: 3280,  color: '#38bdf8' },
  pro:        { name: 'Pro',           price: '12€', priceXAF: 7870,  color: '#f59e0b' },
  business:   { name: 'Business',      price: '30€', priceXAF: 19670, color: '#10b981' },
  enterprise: { name: 'Enterprise',    price: '80€', priceXAF: 52440, color: '#94a3b8' },
}

type PaymentMethod = 'card' | 'mobile_money'

/* ─── Country Selector ───────────────────────────────────────────── */
function CountrySelector({
  selected, onSelect, placeholder,
}: { selected: Country; onSelect: (c: Country) => void; placeholder: string }) {
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
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-card border border-border/60 text-foreground hover:bg-accent hover:border-border/80 transition-all w-full group"
      >
        <span className="text-xl">{selected.flag}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{selected.dialCode}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-border/50 bg-black/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-accent/50 border border-border/50 rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-accent transition-colors ${c.code === selected.code ? 'bg-muted' : ''}`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{c.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{c.dialCode}</span>
                  {c.code === selected.code && <CheckCircle2 className="w-3.5 h-3.5 text-foreground/70 shrink-0" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">🔍 Aucun résultat</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Phone input with dial code ─────────────────────────────────── */
function PhoneInput({
  country, value, onChange, placeholder, digits, valid,
}: {
  country: Country; value: string; onChange: (v: string) => void
  placeholder: string; digits: string; valid: string
}) {
  const handleChange = (v: string) => {
    const raw = v.replace(/\D/g, '').slice(0, country.phoneLength)
    onChange(raw)
  }
  const isValid = value.length === country.phoneLength

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-card border border-border/60 text-foreground min-w-fit">
          <span className="text-lg">{country.flag}</span>
          <span className="text-sm font-mono text-muted-foreground">{country.dialCode}</span>
        </div>
        <div className="relative flex-1">
          <Input
            type="tel"
            placeholder={placeholder || ('6' + '0'.repeat(Math.max(0, country.phoneLength - 1)))}
            value={value}
            onChange={e => handleChange(e.target.value)}
            maxLength={country.phoneLength}
            className={`bg-card border-border/60 focus:border-foreground/30 h-12 rounded-xl pr-10 transition-colors ${
              isValid ? 'border-emerald-500/40 focus:border-emerald-500/60' : ''
            }`}
          />
          {isValid && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground px-1">
        {value.length}/{country.phoneLength} {digits}
        {isValid && <span className="text-emerald-400 ml-2">{valid}</span>}
      </p>
    </div>
  )
}

/* ─── Virtual card ───────────────────────────────────────────────── */
function VirtualCard({
  number, name, expiry, focused, holder, exp,
}: { number: string; name: string; expiry: string; focused: string | null; holder: string; exp: string }) {
  const displayNumber = number || '•••• •••• •••• ••••'
  const displayName = (name || holder).toUpperCase().slice(0, 22)
  const displayExpiry = expiry || 'MM/AA'

  return (
    <motion.div
      className="relative h-44 rounded-2xl overflow-hidden select-none shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)' }}
      animate={{ rotateY: focused === 'cvv' ? 180 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-14 -left-10 w-52 h-52 rounded-full bg-white/[0.03]" />
      <div className="absolute top-1/3 right-12 w-28 h-28 rounded-full bg-foreground/[0.03]" />
      {/* Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col justify-between" style={{ backfaceVisibility: 'hidden' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-300 dark:to-neutral-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-white/70 text-xs font-semibold tracking-[0.2em]">NEXORA</span>
          </div>
          <Wifi className="w-5 h-5 text-white/30 rotate-90" />
        </div>

        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300/80 to-amber-500/60">
          <div className="w-full h-full rounded-md border border-amber-200/40 grid grid-cols-2 gap-0.5 p-1">
            {[0,1,2,3].map(i => <div key={i} className="bg-amber-100/20 rounded-sm" />)}
          </div>
        </div>

        <div>
          <p className={`font-mono text-base tracking-[0.22em] mb-4 transition-colors ${focused === 'number' ? 'text-white' : 'text-white/75'}`}>
            {number
              ? number.split(' ').map((g, i) => (
                  <span key={i} className="mr-3">{g.padEnd(4, '•')}</span>
                ))
              : <span>•••• •••• •••• ••••</span>
            }
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/35 text-[9px] uppercase tracking-[0.2em] mb-0.5">{holder}</p>
              <p className={`text-sm font-semibold tracking-wide transition-colors ${focused === 'name' ? 'text-white' : 'text-white/75'}`}>
                {displayName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/35 text-[9px] uppercase tracking-[0.2em] mb-0.5">{exp}</p>
              <p className={`text-sm font-mono transition-colors ${focused === 'expiry' ? 'text-white' : 'text-white/75'}`}>
                {displayExpiry}
              </p>
            </div>
            <p className="text-white/50 font-bold text-xl italic ml-4" style={{ fontFamily: 'Georgia, serif' }}>VISA</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Checkout form ──────────────────────────────────────────────── */
function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { user, token } = useAuth()
  const { t } = useTranslation()
  const plan = searchParams.get('plan') || 'starter'
  const currentPlan = planDetails[plan] || planDetails.pro
  const ch = t.checkout

  const [country, setCountry] = useState<Country>(countries[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [momoChannel, setMomoChannel] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // (Les champs carte ont été retirés : la carte est saisie dans la fenêtre
  //  sécurisée NotchPay, jamais sur cette page.)

  // Paiement carte dans une fenêtre sécurisée (popup NotchPay) : l'utilisateur
  // reste sur cette page pendant qu'on attend la confirmation du paiement.
  const [waitingPayment, setWaitingPayment] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopWaiting = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
    popupRef.current = null
    setWaitingPayment(false)
    setLoading(false)
  }

  // Nettoyage si l'utilisateur quitte la page pendant l'attente
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const checkPaymentOnce = async (reference: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`)
      const data = await res.json()
      const status = String(data?.status ?? data?.transaction?.status ?? '').toLowerCase()
      return ['complete', 'completed', 'success', 'paid'].includes(status)
    } catch {
      return false
    }
  }

  const startWaitingForPayment = (reference: string) => {
    setWaitingPayment(true)
    setLoading(false)
    let closedSince: number | null = null
    pollRef.current = setInterval(async () => {
      const paid = await checkPaymentOnce(reference)
      if (paid) {
        stopWaiting()
        router.push(`/checkout/callback?reference=${encodeURIComponent(reference)}`)
        return
      }
      // Popup fermé sans paiement confirmé : on laisse ~10s de grâce (webhook /
      // vérification en retard) puis on arrête d'attendre.
      if (popupRef.current?.closed) {
        if (closedSince === null) closedSince = Date.now()
        else if (Date.now() - closedSince > 10_000) {
          stopWaiting()
          setError(ch.errors.initError)
        }
      }
    }, 4000)
  }

  useEffect(() => {
    if (!country.hasMobileMoney) {
      setPaymentMethod('card')
      setMomoChannel('')
    } else {
      setMomoChannel(country.momoChannels[0]?.id || '')
    }
    setPhone('')
  }, [country])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (paymentMethod !== 'card') {
      if (!phone) { setError(ch.errors.phone); return }
      if (!validatePhone(phone, country)) {
        setError(ch.errors.phoneLength.replace('{length}', String(country.phoneLength))); return
      }
      if (!momoChannel) { setError(ch.errors.operator); return }
    }

    // Pour la carte : on ouvre la fenêtre de paiement TOUT DE SUITE (dans le
    // geste utilisateur) pour éviter le blocage des popups, puis on lui donne
    // l'URL NotchPay une fois l'initialisation faite.
    let popup: Window | null = null
    if (paymentMethod === 'card') {
      popup = window.open('about:blank', 'nexora_payment', 'width=480,height=760')
      popupRef.current = popup
    }

    setLoading(true)
    try {
      const authToken = token
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          amount: currentPlan.priceXAF,
          currency: 'XAF',
          email: user?.email || 'guest@nexora.ai',
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client' : 'Client',
          phone: phone ? `${country.dialCode}${phone}` : undefined,
          plan,
          country: country.code,
        }),
      })
      const initData = await initRes.json()

      if (!initData.success) {
        if (popup && !popup.closed) popup.close()
        if (initData.code === 'DUPLICATE_PAYMENT') {
          setError(ch.errors.duplicate)
        } else {
          setError(initData.error || ch.errors.initError)
        }
        setLoading(false)
        return
      }

      // ── Carte : paiement dans la fenêtre sécurisée NotchPay, sans quitter
      //    Nexora. On surveille le statut et on enchaîne automatiquement. ──
      if (paymentMethod === 'card') {
        if (initData.authorizationUrl && popup && !popup.closed) {
          popup.location.href = initData.authorizationUrl
          startWaitingForPayment(initData.reference)
        } else if (initData.authorizationUrl) {
          // Popup bloquée par le navigateur → repli sur la redirection classique
          window.location.href = initData.authorizationUrl
        } else {
          setError(ch.errors.initError)
          setLoading(false)
        }
        return
      }

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
        showToast(ch.mobilePrompt, 'info')
        router.push(`/checkout/callback?reference=${initData.reference}`)
      } else {
        setError(processData.message || ch.errors.initError)
        setLoading(false)
      }
    } catch {
      if (popup && !popup.closed) popup.close()
      setError(ch.errors.connection)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="orb orb-float-1 w-[600px] h-[600px] bg-foreground/[0.02] top-[-20%] left-[-20%]" />
      <div className="orb orb-float-2 w-[500px] h-[500px] bg-foreground/[0.02] bottom-[-15%] right-[-15%]" />
      <div className="orb w-[400px] h-[400px] bg-foreground/[0.02] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: 'blur(100px)' }} />

      {/* Nav top bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-14 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl flex items-center px-4">
        <Link href="/#pricing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {ch.back}
        </Link>
        <div className="ml-auto">
          <LanguageSwitcher compact />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid items-start gap-5 lg:grid-cols-[0.85fr_1fr]"
        >
          {/* ─── Colonne GAUCHE : résumé + aperçu (occupe la largeur, évite le scroll) ─── */}
          <div className="space-y-4 lg:sticky lg:top-20">
            {/* Plan summary */}
            <Card className="glass border-white/[0.08] overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: `${currentPlan.color}18` }}>
                      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at center, ${currentPlan.color}30, transparent)` }} />
                      <span className="text-base font-bold relative z-10" style={{ color: currentPlan.color }}>{currentPlan.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{ch.planSelected}</p>
                      <p className="font-bold text-foreground">{currentPlan.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{currentPlan.price}</p>
                    {currentPlan.priceXAF > 0 && (
                      <p className="text-xs text-muted-foreground">{currentPlan.priceXAF.toLocaleString('fr-FR')} FCFA</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visuel carte Nexora (décoratif) — la saisie se fait dans la
                fenêtre sécurisée NotchPay au moment du paiement. */}
            {paymentMethod === 'card' && (
              <VirtualCard
                number=""
                name=""
                expiry=""
                focused={null}
                holder={ch.holder}
                exp={ch.exp}
              />
            )}

            {/* Badges de sécurité */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{ch.securePayment}</span>
              </div>
              <div className="w-px h-3 bg-border/60" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{ch.tls}</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground/60">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Secured by NotchPay
              </div>
            </div>
          </div>

          {/* ─── Colonne DROITE : formulaire ─── */}
          <Card className="glass border-white/[0.08] overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            <CardHeader className="text-center space-y-3 pt-7 pb-5">
              <div className="flex justify-center">
                <div className="relative w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
                  <Lock className="w-6 h-6 text-white relative z-10" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{ch.title}</CardTitle>
                <CardDescription className="text-sm">{ch.subtitle}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-7">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Alert className="bg-red-500/10 border-red-500/25 text-red-400 rounded-xl">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Country ── */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Globe className="w-3.5 h-3.5" /> {ch.country}
                  </Label>
                  <CountrySelector
                    selected={country}
                    onSelect={setCountry}
                    placeholder={ch.searchCountry}
                  />
                </div>

                {/* ── Payment method tabs ── */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground font-medium">{ch.method}</Label>
                  <div className={`grid gap-2 ${country.hasMobileMoney ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm overflow-hidden ${
                        paymentMethod === 'card'
                          ? 'bg-muted border-border text-foreground font-semibold'
                          : 'bg-card border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {paymentMethod === 'card' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                      )}
                      <CreditCard className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{ch.card}</span>
                    </button>
                    {country.hasMobileMoney && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile_money')}
                        className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm overflow-hidden ${
                          paymentMethod === 'mobile_money'
                            ? 'bg-muted border-border text-foreground font-semibold'
                            : 'bg-card border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {paymentMethod === 'mobile_money' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                        )}
                        <Smartphone className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">{ch.momo}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Card form ── */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'card' && (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Notice : la carte est saisie dans la fenêtre sécurisée NotchPay */}
                      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                          <Lock className="w-4 h-4 text-foreground/70" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Paiement par carte sécurisé</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Au clic, une fenêtre de paiement sécurisée s'ouvre pour saisir ta carte.
                            Tes informations bancaires ne transitent jamais par Nexora.
                          </p>
                        </div>
                      </div>

                      {/* Cards accepted */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <p className="text-xs text-muted-foreground">{ch.accepted}</p>
                        {(['VISA', 'Mastercard', 'Prépayée'] as const).map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-border/40 text-xs text-muted-foreground font-mono">
                            {c}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Mobile Money form ── */}
                  {paymentMethod === 'mobile_money' && country.hasMobileMoney && (
                    <motion.div
                      key="momo"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Operator */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">{ch.operator}</Label>
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${Math.min(country.momoChannels.length, 2)}, 1fr)` }}
                        >
                          {country.momoChannels.map(chan => (
                            <button
                              key={chan.id}
                              type="button"
                              onClick={() => setMomoChannel(chan.id)}
                              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all relative overflow-hidden ${
                                momoChannel === chan.id
                                  ? 'border-border text-foreground font-medium'
                                  : 'bg-card border-border/50 text-muted-foreground hover:bg-accent'
                              }`}
                              style={momoChannel === chan.id ? { backgroundColor: `${chan.color}14` } : {}}
                            >
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: chan.color, boxShadow: `0 0 8px ${chan.color}60` }} />
                              <span className="text-sm">{chan.name}</span>
                              {momoChannel === chan.id && (
                                <CheckCircle2 className="ml-auto w-4 h-4 text-foreground/70 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {ch.phone}
                        </Label>
                        <PhoneInput
                          country={country}
                          value={phone}
                          onChange={setPhone}
                          placeholder={ch.phonePlaceholder}
                          digits={ch.digits}
                          valid={ch.valid}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Attente du paiement (fenêtre NotchPay ouverte) ── */}
                {waitingPayment && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-foreground/70 shrink-0" />
                    <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
                      Fenêtre de paiement ouverte — termine le paiement, cette page se met à jour automatiquement.
                    </p>
                    <button
                      type="button"
                      onClick={stopWaiting}
                      className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  disabled={loading || waitingPayment}
                  className="w-full h-12 relative overflow-hidden bg-primary text-primary-foreground font-semibold rounded-xl transition-all hover:scale-[1.01] mt-1 group border-0"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" /><span className="relative z-10">{ch.processing}</span></>
                  ) : (
                    <><Lock className="mr-2 h-4 w-4 relative z-10" />
                      <span className="relative z-10">
                        {currentPlan.priceXAF === 0
                          ? ch.submitFree
                          : `${ch.submit} ${currentPlan.priceXAF.toLocaleString('fr-FR')} FCFA`
                        }
                      </span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Export ─────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}
