'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Lock, ArrowLeft, Loader2, Shield, Wifi } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'

declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (opts: { eventHandler: (event: { event: string; data?: unknown }) => void }) => void
      Url: { Open: (url: string) => void }
    }
  }
}

/* ─── Plan config ────────────────────────────────────────────────── */
const planDetails: Record<string, { name: string; price: string; color: string }> = {
  free:       { name: 'Free',          price: '0€',  color: '#94a3b8' },
  // Forfaits de test temporaires ($1 / $2)
  test1:      { name: 'Test 1 semaine',  price: '1€',  color: '#94a3b8' },
  test2:      { name: 'Test 2 semaines', price: '2€',  color: '#94a3b8' },
  starter:    { name: 'Starter',       price: '5€',  color: '#38bdf8' },
  pro:        { name: 'Pro',           price: '12€', color: '#f59e0b' },
  business:   { name: 'Business',      price: '30€', color: '#10b981' },
  enterprise: { name: 'Enterprise',    price: '80€', color: '#94a3b8' },
}

/* ─── Virtual card (decorative) ──────────────────────────────────── */
function VirtualCard({ holder, exp }: { holder: string; exp: string }) {
  return (
    <motion.div
      className="relative h-44 rounded-2xl overflow-hidden select-none shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)' }}
    >
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-14 -left-10 w-52 h-52 rounded-full bg-white/[0.03]" />
      <div className="absolute top-1/3 right-12 w-28 h-28 rounded-full bg-foreground/[0.03]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
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
          <p className="font-mono text-base tracking-[0.22em] mb-4 text-white/75">•••• •••• •••• ••••</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/35 text-xs uppercase tracking-[0.2em] mb-0.5">{holder}</p>
              <p className="text-sm font-semibold tracking-wide text-white/75">{holder.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/35 text-xs uppercase tracking-[0.2em] mb-0.5">{exp}</p>
              <p className="text-sm font-mono text-white/75">MM/AA</p>
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
  const { token } = useAuth()
  const { t } = useTranslation()
  const plan = searchParams.get('plan') || 'starter'
  const currentPlan = planDetails[plan] || planDetails.pro
  const ch = t.checkout

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  // Enregistre le handler de succès dès que Lemon.js est chargé — c'est lui
  // qui nous dit que le paiement (dans l'overlay, jamais hors de cette page)
  // a abouti côté client. La vraie activation de l'abonnement se fait par
  // webhook côté serveur (voir app/api/webhooks/lemonsqueezy) ; cet event
  // sert seulement à faire avancer l'UI immédiatement.
  useEffect(() => {
    if (!scriptReady || !window.LemonSqueezy) return
    window.LemonSqueezy.Setup({
      eventHandler: (event) => {
        if (event.event === 'Checkout.Success') {
          router.push(`/checkout/callback?provider=lemonsqueezy&plan=${encodeURIComponent(plan)}`)
        }
      },
    })
  }, [scriptReady, router, plan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!scriptReady || !window.LemonSqueezy) {
      setError(ch.errors.initError)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/payments/lemonsqueezy/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (!data.success || !data.url) {
        setError(data.error || ch.errors.initError)
        setLoading(false)
        return
      }

      window.LemonSqueezy.Url.Open(data.url)
      setLoading(false)
    } catch {
      setError(ch.errors.connection)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

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
          {/* ─── Colonne GAUCHE : résumé + aperçu ─── */}
          <div className="space-y-4 lg:sticky lg:top-20">
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
                    <p className="text-xs text-muted-foreground">/mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <VirtualCard holder={ch.holder} exp={ch.exp} />

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
                Secured by Lemon Squeezy
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
                {/* Notice : la carte est saisie dans l'overlay Lemon Squeezy,
                    affiché par-dessus cette page — jamais de redirection. */}
                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
                    <Lock className="w-4 h-4 text-foreground/70" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Paiement par carte sécurisé</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Au clic, le formulaire de paiement s'affiche directement sur cette page — tu ne la quittes jamais.
                      Tes informations bancaires ne transitent jamais par Nexora.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <p className="text-xs text-muted-foreground">{ch.accepted}</p>
                  {(['VISA', 'Mastercard', 'Prépayée'] as const).map(c => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-border/40 text-xs text-muted-foreground font-mono">
                      {c}
                    </span>
                  ))}
                </div>

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  disabled={loading || !scriptReady}
                  className="w-full h-12 relative overflow-hidden bg-primary text-primary-foreground font-semibold rounded-xl transition-all hover:scale-[1.01] mt-1 group border-0"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {loading || !scriptReady ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" /><span className="relative z-10">{ch.processing}</span></>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4 relative z-10" />
                      <span className="relative z-10">{ch.submit} {currentPlan.price}</span>
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
