'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, MessageSquare, ShieldCheck, LayoutPanelLeft, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionLayout } from '@/components/patterns/section-layout'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'

const CURRENT_ENTRIES = [
  {
    icon: LayoutPanelLeft,
    title: 'Nouvelles pages sur le site',
    desc: "Ajout des pages Tarifs, Documentation, Changelog, À propos, Contact et des pages légales (CGU, confidentialité), pour une meilleure visibilité sur l'offre et le fonctionnement du produit.",
  },
  {
    icon: MessageSquare,
    title: "Améliorations du chat et de l'interface",
    desc: "Ajustements continus de l'expérience de chat et de l'ergonomie générale du site et du tableau de bord.",
  },
  {
    icon: ShieldCheck,
    title: 'Corrections de stabilité',
    desc: "Corrections côté API et gestion des quotas pour une expérience plus fiable au quotidien.",
  },
]

export default function ChangelogPageClient() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="orb orb-float-2 w-[600px] h-[600px] bg-foreground/[0.03] top-[-10%] right-[-10%]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="primary" className="mb-5">
              <Sparkles className="w-3 h-3" />
              Changelog
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
              Journal des mises à jour
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Nexora évolue en continu. Ce journal met en avant les améliorations les plus notables —
              sans prétendre à un historique exhaustif de chaque changement.
            </p>
          </motion.div>
        </div>
      </section>

      <SectionLayout background="default" className="pt-0 sm:pt-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dernières mises à jour</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="space-y-4">
            {CURRENT_ENTRIES.map((entry, i) => (
              <motion.div
                key={entry.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <GlassCard variant="hover" className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <entry.icon className="w-4.5 h-4.5 text-foreground/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Ce journal est volontairement synthétique et sera enrichi au fil des prochaines mises à jour.
            </p>
            <p className="text-sm text-muted-foreground">
              Une idée, un bug à signaler ?{' '}
              <Link href="/contact" className="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground underline underline-offset-4">
                <Mail className="w-3.5 h-3.5" />
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </SectionLayout>

      <SiteFooter />
    </div>
  )
}
