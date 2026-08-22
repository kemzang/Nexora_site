'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown, Sparkles, ArrowRight, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionLayout } from '@/components/patterns/section-layout'
import { PageHeader } from '@/components/patterns/page-header'
import { PricingCard } from '@/components/patterns/pricing-card'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'
import { PLANS, MODELS, type PlanId } from '@/lib/models'

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'business', 'enterprise']

const CTA_TEXT: Record<PlanId, string> = {
  free: 'Commencer gratuitement',
  test1: 'Choisir',
  test2: 'Choisir',
  starter: 'Choisir Starter',
  pro: 'Choisir Pro',
  business: 'Choisir Business',
  enterprise: 'Contacter l\'équipe',
}

function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`
  if (n >= 1_000) return `${n / 1_000}K`
  return String(n)
}

function formatRequests(n: number): string {
  return n >= 99_999 ? 'Illimitées' : n.toLocaleString('fr-FR')
}

function formatCollaborators(n: number): string {
  return n >= 99_999 ? 'Illimité' : String(n)
}

function modelsForPlan(id: PlanId): string {
  return PLANS[id].models.map(m => MODELS[m].name).join(', ')
}

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Que se passe-t-il si je dépasse mon quota de crédits ?',
    a: "Les requêtes IA sont temporairement bloquées jusqu'au renouvellement mensuel de votre période. Vous pouvez passer à un plan supérieur à tout moment depuis votre tableau de bord pour continuer immédiatement, sans attendre le renouvellement.",
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: "Oui. Rendez-vous dans la section Abonnement de votre tableau de bord pour passer à un plan supérieur quand vous le souhaitez. Pour résilier, contactez notre support par email — voir la page Contact.",
  },
  {
    q: 'Les crédits non utilisés sont-ils reportés au mois suivant ?',
    a: "Non, les crédits se réinitialisent à chaque renouvellement mensuel et ne sont pas cumulables d'un mois à l'autre.",
  },
  {
    q: "Qu'est-ce qu'un crédit, exactement ?",
    a: "Un crédit correspond à un token consommé, pondéré par le coût relatif du modèle utilisé : un modèle plus puissant (comme Claude Opus) consomme plus de crédits par token qu'un modèle plus léger (comme DeepSeek V3). Votre consommation détaillée est visible dans votre tableau de bord.",
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: "La carte bancaire et le Mobile Money (MTN Mobile Money, Orange Money) via notre partenaire de paiement NotchPay, selon votre pays.",
  },
  {
    q: 'Le plan Free expire-t-il ?',
    a: "Non — le plan Free reste disponible aussi longtemps que vous le souhaitez, avec 100 000 crédits chaque mois.",
  },
  {
    q: 'Puis-je collaborer avec mon équipe ?',
    a: "Oui, à partir du plan Starter (2 personnes dans une session). Les plans supérieurs permettent davantage de collaborateurs : 5 sur Pro, 20 sur Business, et un nombre illimité sur Enterprise.",
  },
  {
    q: 'Le plan Enterprise inclut-il un SLA ?',
    a: "Le plan Enterprise inclut le support 24/7, l'authentification SSO et un SLA contractuel — contactez notre équipe pour les modalités précises.",
  },
]

function FaqItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PricingPageClient() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="orb orb-float-1 w-[600px] h-[600px] bg-foreground/[0.03] top-[-10%] left-[-10%]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="primary" className="mb-5">
              <Sparkles className="w-3 h-3" />
              Tarifs
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4 text-balance">
              Des tarifs simples, sans surprise
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Commencez gratuitement, sans carte bancaire. Passez à un plan supérieur quand vous en avez besoin — changez ou annulez à tout moment.
            </p>
          </motion.div>
        </div>
      </section>

      <SectionLayout background="default" className="pt-0 sm:pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto items-start">
          {PLAN_ORDER.map((key, i) => {
            const plan = PLANS[key]
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className={plan.popular ? 'lg:-mt-4' : ''}
              >
                <PricingCard
                  name={plan.name}
                  price={`${plan.price}€`}
                  period={plan.price > 0 ? '/mois' : undefined}
                  features={plan.features}
                  href={`/checkout?plan=${key}`}
                  popular={plan.popular}
                  popularLabel="Populaire"
                  models={modelsForPlan(key)}
                  ctaText={CTA_TEXT[key]}
                />
              </motion.div>
            )
          })}
        </div>
      </SectionLayout>

      {/* Comparison table */}
      <SectionLayout background="muted">
        <PageHeader
          badge="Comparatif"
          title="Comparaison rapide"
          subtitle="Les chiffres clés de chaque plan, en un coup d'œil."
        />
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Plan</th>
                {PLAN_ORDER.map(key => (
                  <th key={key} className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                    {PLANS[key].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Prix', render: (k: PlanId) => PLANS[k].price > 0 ? `${PLANS[k].price}€/mois` : 'Gratuit' },
                { label: 'Crédits / mois', render: (k: PlanId) => formatCredits(PLANS[k].tokensPerMonth) },
                { label: 'Requêtes / jour', render: (k: PlanId) => formatRequests(PLANS[k].maxRequestsPerDay) },
                { label: 'Collaborateurs max', render: (k: PlanId) => formatCollaborators(PLANS[k].maxCollaborators) },
                { label: 'Modèles inclus', render: (k: PlanId) => modelsForPlan(k) },
              ].map((row, ri) => (
                <tr key={row.label} className={ri % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                  <td className="px-4 py-3 text-muted-foreground border-t border-border/50">{row.label}</td>
                  {PLAN_ORDER.map(key => (
                    <td key={key} className="px-4 py-3 border-t border-border/50 max-w-[220px]">{row.render(key)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs text-muted-foreground/70 mt-6 max-w-2xl mx-auto">
          L'autocomplétion nécessite le plan Starter ou supérieur. Le plan Free inclut 100 000 crédits chaque mois.
        </p>
      </SectionLayout>

      {/* FAQ */}
      <SectionLayout background="default">
        <PageHeader badge="FAQ" title="Questions fréquentes" subtitle="Ce que nos utilisateurs nous demandent le plus souvent." />
        <div className="max-w-2xl mx-auto space-y-2.5">
          {FAQ.map((item, i) => (
            <motion.div key={item.q} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.04 }}>
              <FaqItem item={item} />
            </motion.div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          D'autres questions ? <Link href="/contact" className="text-foreground/80 hover:text-foreground underline underline-offset-4">Contactez-nous</Link> ou consultez la <Link href="/docs" className="text-foreground/80 hover:text-foreground underline underline-offset-4">documentation</Link>.
        </p>
      </SectionLayout>

      {/* CTA */}
      <SectionLayout background="default">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto">
          <GlassCard variant="default" className="border-animated overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
            <div className="py-16 px-8 sm:px-16 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
                  <Rocket className="w-7 h-7 text-primary-foreground relative z-10" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">Prêt à essayer Nexora ?</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">Créez un compte gratuit en quelques secondes, aucune carte bancaire requise.</p>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="px-10 h-12 text-base group">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          </GlassCard>
        </motion.div>
      </SectionLayout>

      <SiteFooter />
    </div>
  )
}
