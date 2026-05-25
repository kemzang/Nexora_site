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
  free:       { name: 'Free',       price: '0€',  priceXAF: 0,     color: '#6366f1' },
  starter:    { name: 'Starter',    price: '5€',  priceXAF: 3280,  color: '#38bdf8' },
  pro:        { name: 'Pro',        price: '12€', priceXAF: 7870,  color: '#f59e0b' },
  business:   { name: 'Business',   price: '25€', priceXAF: 16390, color: '#10b981' },
  enterprise: { name: 'Enterprise', price: '60€', priceXAF: 39330, color: '#8b5cf6' },
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
                  className="w-full pl-9 pr-3 py-2 bg-accent/50 border border-border/50 rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors"
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
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-accent transition-colors ${c.code === selected.code ? 'bg-indigo-500/10' : ''}`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{c.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{c.dialCode}</span>
                  {c.code === selected.code && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
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
            className={`bg-card border-border/60 focus:border-indigo-500/50 h-12 rounded-xl pr-10 transition-colors ${
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

/* ─── Card formatters ────────────────────────────────────────────── */
function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
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
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #2d1b69 100%)' }}
      animate={{ rotateY: focused === 'cvv' ? 180 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-14 -left-10 w-52 h-52 rounded-full bg-white/[0.03]" />
      <div className="absolute top-1/3 right-12 w-28 h-28 rounded-full bg-indigo-400/5" />
      {/* Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col justify-between" style={{ backfaceVisibility: 'hidden' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg">
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
  const { user } = useAuth()
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

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    if (!country.hasMobileMoney) {
      setPaymentMethod('card')
      setMomoChannel('')
    } else {
      setMomoChannel(country.momoChannels[0]?.id || '')
    }
    setPhone('')
  }, [country])

  const validateCard = (): string | null => {
    if (!cardName.trim()) return ch.errors.cardName
    if (cardNumber.replace(/\s/g, '').length < 16) return ch.errors.cardNumber
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) return ch.errors.expiry
    const [mm, yy] = cardExpiry.split('/').map(Number)
    const now = new Date()
    if (mm < 1 || mm > 12) return ch.errors.expiryMonth
    if (2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1))
      return ch.errors.expired
    if (cardCvv.length < 3) return ch.errors.cvv
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (paymentMethod === 'card') {
      const err = validateCard()
      if (err) { setError(err); return }
      if (phone && !validatePhone(phone, country)) {
        setError(ch.errors.phoneLength.replace('{length}', String(country.phoneLength))); return
      }
    } else {
      if (!phone) { setError(ch.errors.phone); return }
      if (!validatePhone(phone, country)) {
        setError(ch.errors.phoneLength.replace('{length}', String(country.phoneLength))); return
      }
      if (!momoChannel) { setError(ch.errors.operator); return }
    }

    setLoading(true)
    try {
      const authToken = user ? await getAuthToken() : null
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
        if (initData.code === 'DUPLICATE_PAYMENT') {
          setError(ch.errors.duplicate)
        } else {
          setError(initData.error || ch.errors.initError)
        }
        setLoading(false)
        return
      }

      if (paymentMethod === 'card') {
        if (initData.authorizationUrl) {
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
      setError(ch.errors.connection)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="orb orb-float-1 w-[600px] h-[600px] bg-indigo-600/8 top-[-20%] left-[-20%]" />
      <div className="orb orb-float-2 w-[500px] h-[500px] bg-violet-600/6 bottom-[-15%] right-[-15%]" />
      <div className="orb w-[400px] h-[400px] bg-purple-600/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: 'blur(100px)' }} />

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

      <div className="relative z-10 w-full max-w-md mt-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* Plan summary */}
          <Card className="glass mb-4 border-white/[0.08] overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
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

          {/* Payment form */}
          <Card className="glass border-white/[0.08] overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <CardHeader className="text-center space-y-3 pt-7 pb-5">
              <div className="flex justify-center">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
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
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-foreground font-semibold'
                          : 'bg-card border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {paymentMethod === 'card' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5" />
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
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-foreground font-semibold'
                            : 'bg-card border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {paymentMethod === 'mobile_money' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5" />
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
                      <VirtualCard
                        number={cardNumber}
                        name={cardName}
                        expiry={cardExpiry}
                        focused={focusedField}
                        holder={ch.holder}
                        exp={ch.exp}
                      />

                      {/* Cardholder name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cardName" className="text-sm text-muted-foreground font-medium">{ch.cardName}</Label>
                        <Input
                          id="cardName"
                          placeholder="Jean Dupont"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          className="bg-card border-border/60 focus:border-indigo-500/50 uppercase h-12 rounded-xl"
                          maxLength={30}
                          autoComplete="cc-name"
                        />
                      </div>

                      {/* Card number */}
                      <div className="space-y-1.5">
                        <Label htmlFor="cardNumber" className="text-sm text-muted-foreground font-medium">{ch.cardNumber}</Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                            onFocus={() => setFocusedField('number')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-card border-border/60 focus:border-indigo-500/50 pr-10 font-mono tracking-widest h-12 rounded-xl"
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
                          <Label htmlFor="expiry" className="text-sm text-muted-foreground font-medium">{ch.expiry}</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                            onFocus={() => setFocusedField('expiry')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-card border-border/60 focus:border-indigo-500/50 font-mono text-center h-12 rounded-xl"
                            maxLength={5}
                            inputMode="numeric"
                            autoComplete="cc-exp"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cvv" className="text-sm text-muted-foreground font-medium">{ch.cvv}</Label>
                          <Input
                            id="cvv"
                            placeholder="•••"
                            type={focusedField === 'cvv' ? 'text' : 'password'}
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            onFocus={() => setFocusedField('cvv')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-card border-border/60 focus:border-indigo-500/50 font-mono text-center h-12 rounded-xl"
                            maxLength={4}
                            inputMode="numeric"
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>

                      {/* Phone for card (optional) */}
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {ch.phone}
                          <span className="text-xs text-muted-foreground/50 ml-1">(optional)</span>
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
                                  ? 'border-indigo-500/40 text-foreground font-medium'
                                  : 'bg-card border-border/50 text-muted-foreground hover:bg-accent'
                              }`}
                              style={momoChannel === chan.id ? { backgroundColor: `${chan.color}14` } : {}}
                            >
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: chan.color, boxShadow: `0 0 8px ${chan.color}60` }} />
                              <span className="text-sm">{chan.name}</span>
                              {momoChannel === chan.id && (
                                <CheckCircle2 className="ml-auto w-4 h-4 text-indigo-400 shrink-0" />
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

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] hover:shadow-indigo-600/40 mt-1 group border-0"
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

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 pt-1">
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

              {/* NotchPay badge */}
              <div className="flex justify-center pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Secured by NotchPay
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────── */
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase/client')
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

/* ─── Export ─────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/60 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}
