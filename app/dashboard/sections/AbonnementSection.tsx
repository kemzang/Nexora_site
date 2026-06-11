'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sparkles, Zap, Star, Check, ArrowRight, Crown, Loader2,
  Calendar, RefreshCw, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

interface SubscriptionData {
  planName: string
  planSlug: string
  price: number
  tokensPerMonth: number
  tokensRemaining: number
  renewalDate: string | null
  status: string
  features: string[]
}

const UPGRADE_PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    price: '$5',
    icon: Sparkles,
    color: 'text-sky-400',
    bg: 'from-sky-500/20 to-sky-500/5',
    border: 'hover:border-sky-500/40',
    activeBorder: 'border-sky-500/40',
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    features: ['4M crédits/mois', '500 requêtes/jour', 'DeepSeek, Gemini Flash', 'Gemini 2.5 Pro', 'Autocomplétion illimitée'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: '$12',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-500/5',
    border: 'hover:border-amber-500/40',
    activeBorder: 'border-amber-500/40',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    popular: true,
    features: ['15M crédits/mois', '2 000 requêtes/jour', '+ Grok, Claude Haiku', 'Mode Agent IA', 'Support prioritaire'],
  },
  {
    slug: 'business',
    name: 'Business',
    price: '$30',
    icon: Star,
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-emerald-500/5',
    border: 'hover:border-emerald-500/40',
    activeBorder: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    features: ['40M crédits/mois', '5 000 requêtes/jour', '+ Claude Sonnet 4.6', 'Accès API direct', 'Support dédié'],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: '$80',
    icon: Crown,
    color: 'text-violet-400',
    bg: 'from-violet-500/20 to-violet-500/5',
    border: 'hover:border-violet-500/40',
    activeBorder: 'border-violet-500/40',
    badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    features: ['100M crédits/mois', 'Requêtes illimitées', '+ Claude Opus & GPT-5', 'Tous les modèles', 'Support 24/7 + SSO + SLA'],
  },
]

const PLAN_ORDER = ['free', 'starter', 'pro', 'business', 'enterprise']

export default function AbonnementSection({ onNavigate }: { onNavigate?: (s: string) => void }) {
  const { user } = useAuth()
  const [sub, setSub] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  // Plans actifs en base qui ne sont pas déjà dans la liste codée en dur
  // (ex. plans de test). Ils s'affichent automatiquement et se masquent dès
  // qu'on passe leur `is_active` à false en base — aucun redéploiement requis.
  const [extraPlans, setExtraPlans] = useState<typeof UPGRADE_PLANS>([])

  useEffect(() => {
    if (user?.id) fetchSubscription(user.id)
  }, [user?.id])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('slug, name, price, features, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      const known = new Set([...UPGRADE_PLANS.map((p) => p.slug), 'free'])
      const extras = ((data as any[]) || [])
        .filter((p) => p?.slug && !known.has(p.slug))
        .map((p) => ({
          slug: p.slug,
          name: p.name ?? p.slug,
          price: `$${Number(p.price ?? 0)}`,
          icon: Sparkles,
          color: 'text-zinc-300',
          bg: 'from-zinc-500/20 to-zinc-500/5',
          border: 'hover:border-zinc-500/40',
          activeBorder: 'border-zinc-500/40',
          badgeColor: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20',
          features: Array.isArray(p.features) ? p.features : [],
        })) as unknown as typeof UPGRADE_PLANS
      setExtraPlans(extras)
    })()
  }, [])

  async function fetchSubscription(userId: string) {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [subResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('status, current_period_end, subscription_plans(name, slug, price, tokens_per_month, features)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle() as any,
        supabase
          .from('usage_sessions')
          .select('tokens_total, tokens_input')
          .eq('user_id', userId)
          .gte('started_at', startOfMonth),
      ])

      const data = subResult.data
      const sessions = (sessionsResult.data ?? []) as { tokens_total: number | null; tokens_input: number | null }[]
      const tokensUsed = sessions.reduce((s, r) => s + (r.tokens_total ?? r.tokens_input ?? 0), 0)

      if (data?.subscription_plans) {
        const plan = data.subscription_plans
        const tokensPerMonth: number = plan.tokens_per_month || 10000
        setSub({
          planName: plan.name || 'Free',
          planSlug: plan.slug || 'free',
          price: plan.price || 0,
          tokensPerMonth,
          tokensRemaining: Math.max(0, tokensPerMonth - tokensUsed),
          renewalDate: data.current_period_end,
          status: data.status,
          features: Array.isArray(plan.features) ? plan.features : [],
        })
      } else {
        setSub({
          planName: 'Free',
          planSlug: 'free',
          price: 0,
          tokensPerMonth: 10000,
          tokensRemaining: Math.max(0, 10000 - tokensUsed),
          renewalDate: null,
          status: 'active',
          features: ['100K tokens le 1er mois, puis 10K/mois', '200 requêtes/jour', 'DeepSeek V3 & Gemini Flash'],
        })
      }
    } catch {
      setSub(null)
    } finally {
      setLoading(false)
    }
  }

  const currentPlanIdx = PLAN_ORDER.indexOf(sub?.planSlug || 'free')
  const usagePercent = sub ? Math.min(100, Math.round(((sub.tokensPerMonth - sub.tokensRemaining) / sub.tokensPerMonth) * 100)) : 0

  const currentSlug = sub?.planSlug || 'free'
  const plansToShow = [
    // Plans standards : uniquement ceux au-dessus du plan actuel (upgrade).
    ...UPGRADE_PLANS.filter((p) => PLAN_ORDER.indexOf(p.slug) > currentPlanIdx),
    // Plans BDD supplémentaires (test/custom) : toujours visibles, sauf l'actuel.
    ...extraPlans.filter((p) => p.slug !== currentSlug),
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez votre plan et découvrez les offres disponibles</p>
      </div>

      {/* Current plan card */}
      {loading ? (
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="skeleton w-14 h-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-6 w-32 rounded" />
              </div>
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          </CardContent>
        </Card>
      ) : sub && (
        <Card className="glass border-indigo-500/25 bg-indigo-500/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Plan actuel</p>
                  <p className="text-2xl font-bold text-foreground">{sub.planName}</p>
                  {sub.planSlug === 'free' ? (
                    <span className="badge-neutral mt-1">Gratuit</span>
                  ) : (
                    <span className="badge-primary mt-1">Actif</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{sub.price === 0 ? 'Gratuit' : `$${sub.price}`}</p>
                {sub.price > 0 && <p className="text-xs text-muted-foreground">/mois</p>}
              </div>
            </div>

            {/* Token usage bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tokens utilisés ce mois</span>
                <span className="text-foreground font-medium">
                  {(sub.tokensPerMonth - sub.tokensRemaining).toLocaleString('fr-FR')} / {sub.tokensPerMonth.toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className={`h-full rounded-full ${usagePercent > 80 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{sub.tokensRemaining.toLocaleString('fr-FR')} tokens restants</span>
                {sub.renewalDate && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Renouvellement le {new Date(sub.renewalDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>

            {usagePercent > 80 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Vous approchez de votre limite mensuelle. Pensez à upgrader.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade section */}
      {!loading && plansToShow.length > 0 && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Passer à la vitesse supérieure</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Choisissez le plan qui correspond à vos besoins</p>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${plansToShow.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : plansToShow.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1 max-w-xs'}`}>
            {plansToShow.map((plan, i) => (
              <motion.div
                key={plan.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-semibold shadow-lg">
                    ⭐ Populaire
                  </div>
                )}
                <Card className={`border-border/50 ${plan.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${plan.popular ? `${plan.activeBorder} shadow-amber-500/10` : ''}`}>
                  <CardContent className="p-5 pt-6">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.bg} flex items-center justify-center mb-4`}>
                      <plan.icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <h3 className="text-base font-bold">{plan.name}</h3>
                    <div className="flex items-baseline gap-0.5 mt-1 mb-4">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mois</span>
                    </div>
                    <ul className="space-y-2 mb-5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/checkout?plan=${plan.slug}`}>
                      <Button className={`w-full text-sm ${
                        plan.popular
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-amber-500/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}>
                        Passer au {plan.name}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Already on highest plan */}
      {!loading && sub && sub.planSlug === 'enterprise' && (
        <Card className="glass border-violet-500/25 bg-violet-500/5">
          <CardContent className="p-6 text-center">
            <Crown className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">Vous êtes sur le plan Enterprise</h3>
            <p className="text-muted-foreground text-sm">Vous bénéficiez de toutes les fonctionnalités Nexora.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
