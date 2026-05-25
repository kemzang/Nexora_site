'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from '@/lib/i18n/context'
import {
  Sparkles, Zap, Code, TrendingUp, CheckCircle, ArrowRight,
  Rocket, Shield, Globe, Terminal, Cpu, Brain, Star, ChevronRight,
  Menu, X
} from 'lucide-react'

/* ─── Animated counter hook ─────────────────────────────────────── */
function useCounter(target: number, duration = 1800, active = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, active])
  return value
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const count = useCounter(value, 1600, isInView)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <p className="text-3xl sm:text-4xl font-bold gradient-text-strong mb-1">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  )
}

/* ─── Feature icon map ───────────────────────────────────────────── */
const featureIcons = [Brain, Zap, Code, TrendingUp, Globe, Shield]
const featureColors = [
  { text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { text: 'text-violet-400', bg: 'bg-violet-500/10' },
  { text: 'text-purple-400', bg: 'bg-purple-500/10' },
  { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  { text: 'text-rose-400', bg: 'bg-rose-500/10' },
]

/* ─── Plan config ────────────────────────────────────────────────── */
const plans = [
  { key: 'free',       name: 'Free',       price: '0€',   href: '/checkout?plan=free',       popular: false },
  { key: 'starter',    name: 'Starter',    price: '5€',   href: '/checkout?plan=starter',    popular: false },
  { key: 'pro',        name: 'Pro',        price: '12€',  href: '/checkout?plan=pro',        popular: true  },
  { key: 'business',   name: 'Business',   price: '25€',  href: '/checkout?plan=business',   popular: false },
  { key: 'enterprise', name: 'Enterprise', price: '60€',  href: '/checkout?plan=enterprise', popular: false },
]

/* ─── Code terminal mockup ───────────────────────────────────────── */
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
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-indigo-600/10 rounded-3xl blur-2xl" />
      <div className="relative glass-strong rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs text-muted-foreground font-mono">userService.ts — VS Code</span>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/20">
            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-medium">Nexora</span>
          </div>
        </div>
        {/* Code */}
        <div className="p-5 font-mono text-sm space-y-1">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.12, duration: 0.3 }}
              className={`leading-relaxed ${
                line.type === 'comment' ? 'text-muted-foreground/60' :
                line.type === 'ai' ? 'text-indigo-400/90 bg-indigo-500/8 -mx-5 px-5 py-0.5' :
                'text-foreground/80'
              }`}
            >
              <span className="text-muted-foreground/30 mr-4 select-none text-xs">{i + 1}</span>
              {line.text}
              {i === lines.length - 1 && (
                <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/30 blur-md rounded-xl group-hover:blur-lg transition-all" />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight gradient-text-strong">Nexora</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {([['#features', t.nav.features], ['#pricing', t.nav.pricing], ['#docs', t.nav.docs]] as [string, string][]).map(([href, label]) => (
                <a key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-indigo-400 transition-all group-hover:w-full" />
                </a>
              ))}
              <div className="flex items-center gap-2 pl-4 border-l border-white/[0.08]">
                <LanguageSwitcher />
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">{t.nav.login}</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30">
                    {t.nav.start}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher compact />
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden py-4 border-t border-white/[0.06] space-y-2"
            >
              {([['#features', t.nav.features], ['#pricing', t.nav.pricing], ['#docs', t.nav.docs]] as [string, string][]).map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</a>
              ))}
              <div className="flex gap-2 pt-2">
                <Link href="/auth/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">{t.nav.login}</Button></Link>
                <Link href="/auth/register" className="flex-1"><Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white" size="sm">{t.nav.start}</Button></Link>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-lg pointer-events-none" />

        {/* Animated orbs */}
        <div className="orb orb-float-1 w-[700px] h-[700px] bg-indigo-600/12 top-[5%] left-[-15%]" />
        <div className="orb orb-float-2 w-[500px] h-[500px] bg-violet-600/10 bottom-[10%] right-[-10%]" />
        <div className="orb orb-float-3 w-[400px] h-[400px] bg-purple-600/8 top-[40%] right-[20%]" />
        <div className="orb orb-aurora w-[800px] h-[800px] bg-indigo-500/6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: 'blur(100px)' }} />

        {/* Beam */}
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
            <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-sm text-indigo-300">
              <div className="relative">
                <div className="pulse-ring w-2 h-2" />
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <Brain className="w-3.5 h-3.5" />
              <span>{t.hero.badge}</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 text-balance leading-[1.05]"
          >
            {t.hero.title1}
            <br />
            <span className="gradient-text-strong">{t.hero.title2}</span>
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
              <Button size="lg" className="relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 border border-indigo-500/40 group">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Rocket className="mr-2 h-4 w-4" />
                {t.hero.cta}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/[0.12] hover:bg-white/[0.05] hover:border-white/[0.2] backdrop-blur-sm transition-all">
              <Terminal className="mr-2 h-4 w-4" />
              {t.hero.demo}
            </Button>
          </motion.div>

          {/* Stats pills */}
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
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-white/[0.08] text-sm text-muted-foreground hover:text-foreground hover:border-indigo-500/25 transition-all cursor-default"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Terminal mockup */}
          <TerminalMockup />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="relative py-28 sm:py-36">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        {/* Section orbs */}
        <div className="orb w-[400px] h-[400px] bg-indigo-600/8 top-0 right-0" style={{ filter: 'blur(100px)' }} />
        <div className="orb w-[300px] h-[300px] bg-violet-600/6 bottom-0 left-0" style={{ filter: 'blur(80px)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mb-5">
              <Sparkles className="w-3 h-3" />
              <span>{t.features.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
              {t.features.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.features.subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.items.map((feature, i) => {
              const Icon = featureIcons[i]
              const col = featureColors[i]
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <Card className="glass h-full group hover-card cursor-default border-white/[0.07] hover:border-indigo-500/20 transition-colors">
                    <CardHeader>
                      <div className={`relative w-12 h-12 ${col.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                        <Icon className={`w-5.5 h-5.5 ${col.text} relative z-10`} />
                      </div>
                      <CardTitle className="text-foreground font-semibold text-base">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-muted-foreground leading-relaxed text-sm">
                        {feature.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="relative py-20 border-y border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
        <div className="orb w-[500px] h-[200px] bg-indigo-600/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: 'blur(80px)' }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={10000} suffix="+" label={t.statsSection.developers} />
            <StatCounter value={1000000} suffix="+" label={t.statsSection.requests} />
            <StatCounter value={15} suffix="+" label={t.statsSection.models} />
            <StatCounter value={99} suffix=".9%" label={t.statsSection.uptime} />
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="relative py-28 sm:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="orb orb-float-1 w-[600px] h-[600px] bg-violet-600/8 bottom-0 right-0" style={{ filter: 'blur(120px)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mb-5">
              <Sparkles className="w-3 h-3" />
              <span>{t.pricing.badge}</span>
            </div>
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
                <Card className={`glass h-full relative flex flex-col transition-all duration-300 ${
                  plan.popular
                    ? 'border-animated border-indigo-500/20 glow-lg'
                    : 'border-white/[0.07] hover:border-white/[0.12]'
                } hover-card`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="relative inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold px-3.5 py-1 rounded-full shadow-lg shadow-indigo-600/40">
                        <Star className="w-2.5 h-2.5" />
                        {t.pricing.popular}
                      </span>
                    </div>
                  )}
                  <CardHeader className={`text-center ${plan.popular ? 'pt-8' : 'pt-5'}`}>
                    <CardTitle className="text-foreground text-base font-bold">{plan.name}</CardTitle>
                    <div className="mt-3">
                      <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                      {plan.price !== '0€' && (
                        <span className="text-muted-foreground text-sm ml-1">{t.pricing.period}</span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-400/70 mt-1 leading-relaxed">
                      {t.pricing.models[plan.key]}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col pb-6">
                    <div className="space-y-2.5 flex-1">
                      {(t.pricing.planFeatures[plan.key] || []).map((f: string) => (
                        <div key={f} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={plan.href}>
                      <Button
                        className={`w-full transition-all ${
                          plan.popular
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 border-0'
                            : 'variant-outline border-white/[0.12] hover:bg-white/[0.06]'
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {t.pricing.cta[plan.key]}
                        <ChevronRight className="ml-1 w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="orb orb-aurora w-[700px] h-[700px] bg-indigo-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ filter: 'blur(120px)' }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass border-animated border-indigo-500/10 overflow-hidden">
              {/* Top beam */}
              <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
              <CardContent className="py-16 px-8 sm:px-16">
                <div className="flex justify-center mb-6">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 opacity-0 hover:opacity-100 transition-opacity" />
                    <Rocket className="w-7 h-7 text-white relative z-10" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
                  {t.cta.title}
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">{t.cta.subtitle}</p>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-10 h-12 text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 border-0 group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {t.cta.button}
                    <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                  </Button>
                </Link>
              </CardContent>
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] relative overflow-hidden">
        <div className="orb w-[400px] h-[200px] bg-indigo-600/5 bottom-0 left-0" style={{ filter: 'blur(80px)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold gradient-text-strong">Nexora</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-4">{t.footer.desc}</p>
              <LanguageSwitcher />
            </div>
            {t.footer.cols.map(col => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
                        {link}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-indigo-400/50 transition-all group-hover:w-full" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexora. {t.footer.rights}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <Shield className="w-3 h-3" />
              <span>Secured by TLS 1.3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
