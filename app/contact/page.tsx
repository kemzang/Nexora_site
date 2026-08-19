import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, LifeBuoy, GitBranch, Clock, BookOpen, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionLayout } from '@/components/patterns/section-layout'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'

export const metadata: Metadata = {
  title: 'Contact — Nexora',
  description: "Contactez l'équipe Nexora pour une question générale ou un problème technique.",
}

const GITHUB_ISSUES_URL = 'https://github.com/kemzang-Bryan/Nexora/issues'

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'Support technique',
    desc: "Un bug, un souci de connexion, une question sur votre extension ou votre CLI.",
    action: 'support@nexora.ai',
    href: 'mailto:support@nexora.ai',
  },
  {
    icon: Mail,
    title: 'Contact général',
    desc: "Questions générales, facturation, partenariats, ou toute autre demande.",
    action: 'contact@nexora.ai',
    href: 'mailto:contact@nexora.ai',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="orb orb-float-2 w-[600px] h-[600px] bg-foreground/[0.03] top-[-10%] right-[-10%]" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="primary" className="mb-5">
            <Mail className="w-3 h-3" />
            Contact
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            Parlons-en
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Écrivez-nous directement — nous répondons sous 24h en semaine.
          </p>
        </div>
      </section>

      <SectionLayout background="default" className="pt-0 sm:pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-10">
          {CHANNELS.map(c => (
            <a key={c.title} href={c.href}>
              <GlassCard variant="hover" className="h-full p-6">
                <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                  <c.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{c.desc}</p>
                <span className="text-sm font-medium text-foreground/80">{c.action}</span>
              </GlassCard>
            </a>
          ))}
        </div>

        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-xs text-muted-foreground/70 mb-14">
          <Clock className="w-3.5 h-3.5" />
          Réponse sous 24h, du lundi au vendredi.
        </div>

        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/docs"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:bg-white/[0.045] hover:border-border transition-colors"
          >
            <BookOpen className="w-4 h-4 text-foreground/70 shrink-0" />
            <div>
              <p className="text-sm font-medium">Consulter la documentation</p>
              <p className="text-xs text-muted-foreground">Installation, guides et FAQ produit</p>
            </div>
          </Link>
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:bg-white/[0.045] hover:border-border transition-colors"
          >
            <GitBranch className="w-4 h-4 text-foreground/70 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium flex items-center gap-1.5">Signaler un bug sur GitHub <ExternalLink className="w-3 h-3 opacity-60" /></p>
              <p className="text-xs text-muted-foreground">Pour les rapports de bugs techniques détaillés</p>
            </div>
          </a>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Déjà client Nexora ? Retrouvez aussi l'aide contextuelle depuis votre{' '}
          <Link href="/dashboard" className="text-foreground/80 hover:text-foreground underline underline-offset-4">tableau de bord</Link>.
        </p>
      </SectionLayout>

      <SiteFooter />
    </div>
  )
}
