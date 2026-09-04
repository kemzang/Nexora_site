'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlatformsSection } from '@/components/platforms-section'
import { useTranslation } from '@/lib/i18n/context'
import { GradientText } from '@/components/ui/gradient-text'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { SectionLayout } from '@/components/patterns/section-layout'
import { FeatureCard } from '@/components/patterns/feature-card'
import { StatCard } from '@/components/patterns/stat-card'
import { PricingCard } from '@/components/patterns/pricing-card'
import { SiteHeader } from '@/components/patterns/site-header'
import { SiteFooter } from '@/components/patterns/site-footer'
import { PLANS } from '@/lib/models'
import {
  Sparkles, Zap, Code, TrendingUp, CheckCircle, ArrowRight,
  Rocket, Shield, Globe, Terminal, Cpu, Brain, Star,
} from 'lucide-react'

const featureIcons = [Brain, Zap, Code, TrendingUp, Globe, Shield]

const plans = [
  { key: 'free',       name: PLANS.free.name,       price: PLANS.free.priceLabel,       href: '/checkout?plan=free',       popular: false },
  { key: 'starter',    name: PLANS.starter.name,    price: PLANS.starter.priceLabel,    href: '/checkout?plan=starter',    popular: false },
  { key: 'pro',        name: PLANS.pro.name,        price: PLANS.pro.priceLabel,        href: '/checkout?plan=pro',        popular: true  },
  { key: 'business',   name: PLANS.business.name,   price: PLANS.business.priceLabel,   href: '/checkout?plan=business',   popular: false },
  { key: 'enterprise', name: PLANS.enterprise.name, price: PLANS.enterprise.priceLabel, href: '/checkout?plan=enterprise', popular: false },
]

function TerminalMockup() {
  const lines = [
    { type: 'comment', text: '// Nexora AI — auto-completing your code...' },
    { type: 'code', text: 'async function fetchUserData(userId: string) {' },
    { type: 'code', text: '  const response = await fetch(`/api/users/${userId}`)' },
    { type: 'ai', text: '  // ✨ AI suggestion: add error handling' },
    { type: 'ai', text: '  if (!response.ok) throw new Error(response.statusText)' },
    { type: 'code', text: '  return response.json()' },
    { type: 'code', text: '}' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
      className="relative max-w-lg mx-auto mt-16"
    >
      <div className="absolute -inset-4 bg-foreground/5 rounded-3xl blur-2xl" />
      <div className="relative glass-strong rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs text-muted-foreground font-mono">userService.ts — VS Code</span>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md badge-primary">
            <Sparkles className="w-2.5 h-2.5" />
            <span className="text-xs font-medium">Nexora</span>
          </div>
        </div>
        <div className="p-5 font-mono text-sm space-y-1">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.12, duration: 0.3 }}
              className={`leading-relaxed ${
                line.type === 'comment' ? 'text-muted-foreground/60' :
                line.type === 'ai' ? 'text-foreground/70 bg-muted/50 -mx-5 px-5 py-0.5' :
                'text-foreground/80'
              }`}
            >
              <span className="text-muted-foreground/30 mr-4 select-none text-xs">{i + 1}</span>
              {line.text}
              {i === lines.length - 1 && (
                <span className="inline-block w-0.5 h-4 bg-foreground/60 ml-1 animate-pulse align-middle" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const { t, lang } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      <SiteHeader />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="orb orb-float-1 w-[700px] h-[700px] bg-foreground/[0.03] top-[5%] left-[-15%]" />
        <div className="orb orb-float-2 w-[500px] h-[500px] bg-foreground/[0.02] bottom-[10%] right-[-10%]" />

        <div className="absolute top-[30%] left-0 right-0 h-px overflow-hidden pointer-events-none">
          <div className="beam" style={{ '--beam-delay': '0s' } as React.CSSProperties} />
        </div>
        <div className="absolute top-[60%] left-0 right-0 h-px overflow-hidden pointer-events-none">
          <div className="beam" style={{ '--beam-delay': '3s' } as React.CSSProperties} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <Badge variant="primary" className="gap-2">
              <div className="relative">
                <div className="pulse-ring w-2 h-2" />
                <div className="w-2 h-2 rounded-full bg-foreground/60" />
              </div>
              <Brain className="w-3.5 h-3.5" />
              {t.hero.badge}
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 text-balance leading-[1.05]"
          >
            {t.hero.title1}
            <br />
            <GradientText variant="strong">{t.hero.title2}</GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t.hero.desc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base group">
                <Rocket className="mr-2 h-4 w-4" />
                {t.hero.cta}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              <Terminal className="mr-2 h-4 w-4" />
              {t.hero.demo}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {([
              [Star, t.hero.stats[0]],
              [Cpu, t.hero.stats[1]],
              [Zap, t.hero.stats[2]],
              [Shield, t.hero.stats[3]],
            ] as [React.FC<{ className?: string }>, string][]).map(([Icon, label], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border-border text-sm text-muted-foreground hover:text-foreground transition-all cursor-default"
              >
                <Icon className="w-3.5 h-3.5 text-foreground/60" />
                <span>{label}</span>
              </motion.div>
            ))}
          </motion.div>

          <TerminalMockup />
        </div>
      </section>

      <SectionLayout id="features" background="default">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-5">
            <Sparkles className="w-3 h-3" />
            {t.features.badge}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
            {t.features.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.features.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.features.items.map((feature, i) => {
            const Icon = featureIcons[i]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <FeatureCard icon={Icon} title={feature.title} description={feature.desc} />
              </motion.div>
            )
          })}
        </div>
      </SectionLayout>

      <PlatformsSection lang={lang} />

      <section className="relative py-20 border-y border-border overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value={10000} suffix="+" label={t.statsSection.developers} />
            <StatCard value={1000000} suffix="+" label={t.statsSection.requests} />
            <StatCard value={15} suffix="+" label={t.statsSection.models} />
            <StatCard value={99} suffix=".9%" label={t.statsSection.uptime} />
          </div>
        </div>
      </section>

      <SectionLayout id="pricing" background="default">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-5">
            <Sparkles className="w-3 h-3" />
            {t.pricing.badge}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">{t.pricing.title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.pricing.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={plan.popular ? 'lg:-mt-4' : ''}
            >
              <PricingCard
                name={plan.name}
                price={plan.price}
                period={plan.key !== 'free' ? t.pricing.period : undefined}
                features={t.pricing.planFeatures[plan.key] || []}
                href={plan.href}
                popular={plan.popular}
                popularLabel={t.pricing.popular}
                models={t.pricing.models[plan.key]}
                ctaText={t.pricing.cta[plan.key]}
              />
            </motion.div>
          ))}
        </div>
      </SectionLayout>

      <SectionLayout background="default">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <GlassCard variant="default" className="border-animated overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
            <div className="py-16 px-8 sm:px-16 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
                  <Rocket className="w-7 h-7 text-primary-foreground relative z-10" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
                {t.cta.title}
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">{t.cta.subtitle}</p>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="px-10 h-12 text-base group">
                  {t.cta.button}
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
