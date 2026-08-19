import type { Metadata } from 'next'
import Link from 'next/link'
import { Brain, ShieldCheck, Lock, Gauge, ArrowRight, Rocket, Code2, AppWindow, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionLayout } from '@/components/patterns/section-layout'
import { PageHeader } from '@/components/patterns/page-header'
import { FeatureCard } from '@/components/patterns/feature-card'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'

export const metadata: Metadata = {
  title: 'À propos — Nexora',
  description: "La mission de Nexora : donner accès aux meilleurs modèles d'IA, directement dans votre éditeur de code.",
}

const VALUES = [
  {
    icon: Brain,
    title: 'Routage intelligent',
    desc: "Chaque requête est analysée selon sa complexité pour être orientée vers le modèle le plus adapté — pas de sur-consommation d'un modèle coûteux pour une question simple.",
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité par défaut',
    desc: "Un gestionnaire de permissions détecte et bloque les commandes potentiellement dangereuses (suppression de fichiers, exfiltration...) avant leur exécution par le mode Agent.",
  },
  {
    icon: Lock,
    title: 'Confidentialité',
    desc: "Aucun cookie publicitaire, aucun traceur tiers à des fins commerciales. Les échanges sont chiffrés en transit.",
  },
  {
    icon: Gauge,
    title: 'Tarification flexible',
    desc: "Un plan gratuit généreux pour démarrer, et la possibilité de changer de plan à tout moment selon vos besoins.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="orb orb-float-1 w-[600px] h-[600px] bg-foreground/[0.03] top-[-10%] left-[-10%]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="primary" className="mb-5">
            <Brain className="w-3 h-3" />
            À propos
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4 text-balance">
            L'IA, au bon endroit dans votre flux de travail
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nexora est né d'un constat simple : les meilleurs modèles d'IA sont dispersés entre plusieurs
            fournisseurs, avec des abonnements et des interfaces différents. Nexora réunit l'accès à ces modèles
            en un seul outil, directement dans votre éditeur.
          </p>
        </div>
      </section>

      <SectionLayout background="default" className="pt-0 sm:pt-0">
        <div className="max-w-2xl mx-auto text-center mb-4">
          <p className="text-muted-foreground leading-relaxed">
            Concrètement, Nexora est une extension pour VS Code et les IDE JetBrains, doublée d'une interface en
            ligne de commande, qui donne accès à des modèles comme DeepSeek, Gemini et Claude au travers d'un
            chat intégré, d'une autocomplétion en temps réel, d'un mode Agent capable d'exécuter des tâches de
            développement, et d'une édition inline pilotée par des instructions en langage naturel.
          </p>
        </div>
      </SectionLayout>

      <SectionLayout background="muted">
        <PageHeader badge="Nos principes" title="Ce qui guide le produit" subtitle="Quatre principes concrets, visibles dans la façon dont Nexora fonctionne au quotidien." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {VALUES.map(v => (
            <FeatureCard key={v.title} icon={v.icon} title={v.title} description={v.desc} />
          ))}
        </div>
      </SectionLayout>

      <SectionLayout background="default">
        <PageHeader badge="Partout où vous codez" title="Disponible sur votre IDE préféré" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-4">
          {[
            { icon: Code2, label: 'VS Code' },
            { icon: AppWindow, label: 'IntelliJ / JetBrains' },
            { icon: Terminal, label: 'CLI' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50">
              <item.icon className="w-4.5 h-4.5 text-foreground/70 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
          Voir les instructions d'installation détaillées dans la <Link href="/docs" className="text-foreground/80 hover:text-foreground underline underline-offset-4">documentation</Link>.
        </p>
      </SectionLayout>

      <SectionLayout background="default">
        <div className="max-w-3xl mx-auto">
          <GlassCard variant="default" className="border-animated overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
            <div className="py-16 px-8 sm:px-16 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
                  <Rocket className="w-7 h-7 text-primary-foreground relative z-10" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">Une question sur Nexora ?</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                Notre équipe est joignable directement — pas de formulaire à rallonge, pas de standard téléphonique.
              </p>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-10 h-12 text-base group">
                  Nous contacter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          </GlassCard>
        </div>
      </SectionLayout>

      <SiteFooter />
    </div>
  )
}
