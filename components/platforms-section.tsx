'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Check, Copy, ArrowRight, Terminal } from 'lucide-react'
import { GlassCard } from './ui/glass-card'
import { Badge } from './ui/badge'
import { SectionLayout } from './patterns/section-layout'

type Lang = 'fr' | 'en' | 'es' | 'pt'

function VSCodeLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M75.5 11.5 50 35 28 18.5 18 23l18 18-18 18 10 4.5L50 47l25.5 23.5L88 65V18z"
        fill="#0098FF"
      />
      <path d="M75.5 11.5 50 35 28 18.5 18 23l18 18-18 18 10 4.5L50 47l25.5 23.5L88 65V18z" fill="url(#vsc)" />
      <defs>
        <linearGradient id="vsc" x1="53" y1="11" x2="53" y2="71" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0098FF" />
          <stop offset="1" stopColor="#0067C0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function JetBrainsLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="14" fill="url(#jb)" />
      <rect x="18" y="74" width="34" height="6" fill="#fff" />
      <path d="M22 22h14c7 0 11 4 11 10s-4 10-11 10h-7v8h-7V22zm7 14h6c2.5 0 4-1.4 4-4s-1.5-4-4-4h-6v8z" fill="#fff" />
      <defs>
        <linearGradient id="jb" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FE2857" />
          <stop offset="0.5" stopColor="#B24EFF" />
          <stop offset="1" stopColor="#21D789" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function NexoraMark({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-primary flex items-center justify-center ${className}`}>
      <span className="text-primary-foreground font-bold tracking-tight select-none" style={{ fontSize: '1.4em' }}>N</span>
    </div>
  )
}

const DICT: Record<Lang, {
  badge: string
  title: string
  subtitle: string
  vscodeDesc: string
  vscodeCta: string
  jetbrainsDesc: string
  jetbrainsCta: string
  cliDesc: string
  cliHint: string
  copied: string
}> = {
  fr: {
    badge: 'Disponible partout',
    title: 'Une seule IA, dans tous tes outils',
    subtitle: 'Installe Nexora là où tu codes — VS Code, toute la suite JetBrains, ou directement en ligne de commande.',
    vscodeDesc: 'Chat IA, autocomplétion, mode agent et édition multi-fichiers, intégrés à ton éditeur préféré.',
    vscodeCta: 'Installer sur VS Code',
    jetbrainsDesc: 'Un seul plugin pour IntelliJ IDEA, PyCharm, WebStorm, PhpStorm, GoLand, Rider, CLion et plus.',
    jetbrainsCta: 'JetBrains Marketplace',
    cliDesc: 'L\'agent Nexora directement dans ton terminal — idéal pour les scripts, le CI/CD et les serveurs distants.',
    cliHint: 'Installe en une commande',
    copied: 'Copié !',
  },
  en: {
    badge: 'Available everywhere',
    title: 'One AI, across all your tools',
    subtitle: 'Install Nexora wherever you code — VS Code, the entire JetBrains suite, or right in your terminal.',
    vscodeDesc: 'AI chat, autocomplete, agent mode and multi-file editing, built into your favorite editor.',
    vscodeCta: 'Install on VS Code',
    jetbrainsDesc: 'One plugin for IntelliJ IDEA, PyCharm, WebStorm, PhpStorm, GoLand, Rider, CLion and more.',
    jetbrainsCta: 'JetBrains Marketplace',
    cliDesc: 'The Nexora agent right in your terminal — perfect for scripts, CI/CD and remote servers.',
    cliHint: 'Install in one command',
    copied: 'Copied!',
  },
  es: {
    badge: 'Disponible en todas partes',
    title: 'Una sola IA, en todas tus herramientas',
    subtitle: 'Instala Nexora donde programes — VS Code, toda la suite JetBrains, o directamente en tu terminal.',
    vscodeDesc: 'Chat IA, autocompletado, modo agente y edición multiarchivo, integrados en tu editor favorito.',
    vscodeCta: 'Instalar en VS Code',
    jetbrainsDesc: 'Un solo plugin para IntelliJ IDEA, PyCharm, WebStorm, PhpStorm, GoLand, Rider, CLion y más.',
    jetbrainsCta: 'JetBrains Marketplace',
    cliDesc: 'El agente Nexora en tu terminal — ideal para scripts, CI/CD y servidores remotos.',
    cliHint: 'Instala con un comando',
    copied: '¡Copiado!',
  },
  pt: {
    badge: 'Disponível em todo lugar',
    title: 'Uma IA, em todas as suas ferramentas',
    subtitle: 'Instale o Nexora onde você programa — VS Code, toda a suíte JetBrains, ou direto no terminal.',
    vscodeDesc: 'Chat IA, autocompletar, modo agente e edição multiarquivo, integrados ao seu editor favorito.',
    vscodeCta: 'Instalar no VS Code',
    jetbrainsDesc: 'Um único plugin para IntelliJ IDEA, PyCharm, WebStorm, PhpStorm, GoLand, Rider, CLion e mais.',
    jetbrainsCta: 'JetBrains Marketplace',
    cliDesc: 'O agente Nexora no seu terminal — ideal para scripts, CI/CD e servidores remotos.',
    cliHint: 'Instale com um comando',
    copied: 'Copiado!',
  },
}

const JETBRAINS_IDES = [
  'IntelliJ IDEA', 'PyCharm', 'WebStorm', 'PhpStorm',
  'GoLand', 'Rider', 'CLion', 'RubyMine', 'DataGrip', 'Android Studio',
]

const VSCODE_URL = 'https://marketplace.visualstudio.com/items?itemName=Nexora.nexora'
const JETBRAINS_URL = 'https://plugins.jetbrains.com/plugin/nexora'
const CLI_INSTALL = 'npm install -g @nexora/cli'

export function PlatformsSection({ lang }: { lang: Lang }) {
  const t = DICT[lang] ?? DICT.fr
  const [copied, setCopied] = useState(false)

  const copyCli = () => {
    navigator.clipboard.writeText(CLI_INSTALL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SectionLayout id="platforms">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <Badge variant="primary" className="mb-5">
          <NexoraMark className="w-3.5 h-3.5" />
          {t.badge}
        </Badge>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">{t.title}</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.a
          href={VSCODE_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="group relative glass rounded-2xl border-border hover:border-[#0098FF]/40 p-7 flex flex-col transition-colors"
        >
          <div className="flex items-center gap-3 mb-5">
            <VSCodeLogo className="w-11 h-11" />
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">VS Code</h3>
              <p className="text-[11px] text-muted-foreground">Visual Studio Code</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t.vscodeDesc}</p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 group-hover:gap-2.5 transition-all">
            {t.vscodeCta}
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.a>

        <motion.a
          href={JETBRAINS_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="group relative glass rounded-2xl border-border hover:border-[#B24EFF]/40 p-7 flex flex-col transition-colors"
        >
          <div className="flex items-center gap-3 mb-5">
            <JetBrainsLogo className="w-11 h-11" />
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">JetBrains</h3>
              <p className="text-[11px] text-muted-foreground">Toute la suite</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.jetbrainsDesc}</p>
          <div className="flex flex-wrap gap-1.5 mt-4 flex-1 content-start">
            {JETBRAINS_IDES.map((ide) => (
              <span
                key={ide}
                className="px-2 py-0.5 rounded-md bg-muted border border-border text-[10px] text-muted-foreground"
              >
                {ide}
              </span>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 group-hover:gap-2.5 transition-all">
            {t.jetbrainsCta}
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: 0.16, duration: 0.5 }}
          className="group relative glass rounded-2xl border-border hover:border-emerald-500/40 p-7 flex flex-col transition-colors"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center">
              <Terminal className="w-6 h-6 text-foreground/70" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">CLI</h3>
              <p className="text-[11px] text-muted-foreground">Ligne de commande</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t.cliDesc}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-5 mb-1.5">{t.cliHint}</p>
          <button
            onClick={copyCli}
            className="flex items-center justify-between gap-2 w-full rounded-lg bg-muted border border-border px-3 py-2.5 font-mono text-xs text-foreground/70 hover:border-foreground/20 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-foreground/40">$</span>
              <span className="truncate">{CLI_INSTALL}</span>
            </span>
            {copied ? (
              <span className="flex items-center gap-1 text-foreground/70 flex-shrink-0">
                <Check className="w-3.5 h-3.5" /> {t.copied}
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
        </motion.div>
      </div>
    </SectionLayout>
  )
}
