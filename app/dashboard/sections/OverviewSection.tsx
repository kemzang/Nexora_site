'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, Key, BarChart3, Star, ArrowRight, Bot, TrendingUp, Clock, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

interface OverviewSectionProps {
  user: { firstName?: string; lastName?: string }
  onNavigate: (section: string) => void
}

interface DashboardStats {
  tokensRemaining: number
  tokensTotal: number
  apiKeysCount: number
  monthlyTokens: number
  monthlyRequests: number
  planName: string
  planSlug: string
  renewalDate: string | null
}

function StatSkeleton() {
  return (
    <Card className="glass">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton w-9 h-9 rounded-xl" />
        </div>
        <div className="skeleton h-7 w-16 rounded mb-2" />
        <div className="skeleton h-3 w-28 rounded" />
      </CardContent>
    </Card>
  )
}

export default function OverviewSection({ user, onNavigate }: OverviewSectionProps) {
  const { user: authUser } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    tokensRemaining: 0,
    tokensTotal: 1000,
    apiKeysCount: 0,
    monthlyTokens: 0,
    monthlyRequests: 0,
    planName: 'Free',
    planSlug: 'free',
    renewalDate: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authUser?.id) fetchStats(authUser.id)
  }, [authUser?.id])

  async function fetchStats(userId: string) {
    try {

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const [subResult, keysResult, sessionsResult] = await Promise.all([
        supabase.from('user_subscriptions').select('current_period_end, subscription_plans(name, slug, tokens_per_month)').eq('user_id', userId).eq('status', 'active').maybeSingle(),
        supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
        supabase.from('usage_sessions').select('tokens_total, tokens_input, started_at').eq('user_id', userId).gte('started_at', startOfMonth),
      ])

      const sub = subResult.data as any
      const plan = sub?.subscription_plans as any
      const sessions = (sessionsResult.data ?? []) as { tokens_total: number | null; tokens_input: number | null; started_at: string }[]
      const tokensUsed = sessions.reduce((s, r) => s + (r.tokens_total ?? r.tokens_input ?? 0), 0)
      const monthlyTokens = tokensUsed
      const monthlyRequests = sessions.length

      const planName = plan?.name || 'Free'
      const planSlug = plan?.slug || 'free'
      const tokensPerMonth = plan?.tokens_per_month || 10000

      setStats({
        tokensRemaining: Math.max(0, tokensPerMonth - tokensUsed),
        tokensTotal: tokensPerMonth,
        apiKeysCount: keysResult.count ?? 0,
        monthlyTokens,
        monthlyRequests,
        planName,
        planSlug,
        renewalDate: sub?.current_period_end ?? null,
      })
    } catch {
      // leave defaults
    } finally {
      setLoading(false)
    }
  }

  const usagePercent = stats.tokensTotal > 0 ? Math.min(100, Math.round((stats.monthlyTokens / stats.tokensTotal) * 100)) : 0

  const statCards = [
    {
      label: 'Tokens restants',
      value: stats.tokensRemaining.toLocaleString('fr-FR'),
      sub: `Sur ${stats.tokensTotal.toLocaleString('fr-FR')} ce mois`,
      icon: Zap,
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-amber-500/5',
      ring: 'ring-amber-500/20',
    },
    {
      label: 'Clés API actives',
      value: stats.apiKeysCount.toString(),
      sub: stats.apiKeysCount === 0 ? 'Aucune clé créée' : `${stats.apiKeysCount} clé${stats.apiKeysCount > 1 ? 's' : ''} active${stats.apiKeysCount > 1 ? 's' : ''}`,
      icon: Key,
      color: 'text-sky-400',
      bg: 'from-sky-500/20 to-sky-500/5',
      ring: 'ring-sky-500/20',
    },
    {
      label: 'Utilisation du mois',
      value: stats.monthlyTokens.toLocaleString('fr-FR'),
      sub: `${stats.monthlyRequests} requête${stats.monthlyRequests > 1 ? 's' : ''} · ${usagePercent}% du quota`,
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/20 to-emerald-500/5',
      ring: 'ring-emerald-500/20',
    },
    {
      label: 'Plan actuel',
      value: stats.planName,
      sub: stats.renewalDate
        ? `Renouvellement le ${new Date(stats.renewalDate).toLocaleDateString('fr-FR')}`
        : 'Plan gratuit',
      icon: Star,
      color: 'text-foreground/70',
      bg: 'from-muted to-muted/50',
      ring: 'ring-border',
    },
  ]

  return (
    <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="w-3 h-3" />
          <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1.5">
          Bonjour,{' '}
          <span className="gradient-text-strong">{user.firstName || 'Utilisateur'}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Voici un résumé de votre activité sur Nexora.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="glass group hover:glass-hover transition-all duration-300 cursor-default overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{stat.label}</p>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ${stat.ring}`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        }
      </div>

      {/* Usage bar */}
      {!loading && stats.monthlyTokens > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mb-8">
          <Card className="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Quota mensuel</span>
                </div>
                <span className="text-xs text-muted-foreground">{stats.monthlyTokens.toLocaleString('fr-FR')} / {stats.tokensTotal.toLocaleString('fr-FR')} tokens</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className={`h-full rounded-full ${usagePercent > 80 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-primary'}`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{usagePercent}% utilisé ce mois</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick actions + Getting started */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="glass h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: Key,
                    label: 'Créer une clé API',
                    desc: 'Connecter VS Code',
                    color: 'text-foreground/70',
                    bg: 'bg-muted',
                    hover: 'hover:bg-muted hover:border-border',
                    section: 'api-keys',
                  },
                  {
                    icon: CreditCard,
                    label: stats.planSlug === 'free' ? 'Passer au Pro' : 'Gérer l\'abonnement',
                    desc: stats.planSlug === 'free' ? 'Débloquer plus de tokens' : 'Voir votre plan',
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10',
                    hover: 'hover:bg-amber-500/15 hover:border-amber-500/30',
                    section: 'abonnement',
                  },
                  {
                    icon: Bot,
                    label: 'Documentation',
                    desc: 'Guides & tutoriels',
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10',
                    hover: 'hover:bg-emerald-500/15 hover:border-emerald-500/30',
                    section: 'aide',
                  },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => onNavigate(action.section)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border border-border/50 bg-card/30 ${action.hover} transition-all group text-center cursor-pointer`}
                  >
                    <div className={`w-11 h-11 ${action.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <Card className="glass h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Démarrage rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { step: 1, title: 'Installer l\'extension', desc: 'Ajoutez Nexora dans VS Code', done: false },
                { step: 2, title: 'Créer une clé API', desc: 'Générez votre clé d\'accès', done: stats.apiKeysCount > 0 },
                { step: 3, title: 'Commencer à coder', desc: 'Utilisez l\'IA dans votre éditeur', done: stats.monthlyRequests > 0 },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    item.done
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'bg-muted border-border'
                  }`}>
                    {item.done
                      ? <span className="text-emerald-400 text-xs">✓</span>
                      : <span className="text-foreground/70 text-xs font-bold">{item.step}</span>
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => onNavigate('aide')} className="w-full mt-2">
                <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all text-sm group">
                  Voir le guide complet
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
