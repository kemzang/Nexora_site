import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Code2, AppWindow, Terminal, MessageSquare, Sparkles as SparklesIcon,
  Bot, PenLine, BookOpen, ArrowRight, ExternalLink, CreditCard, ScrollText,
} from 'lucide-react'
import { MODELS } from '@/lib/models'

export const metadata: Metadata = {
  title: 'Documentation — Nexora',
  description: "Installez Nexora dans VS Code, IntelliJ ou en ligne de commande, et découvrez le chat IA, l'autocomplétion et le mode Agent.",
}

const GITHUB_URL = 'https://github.com/kemzang-Bryan/Nexora'

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-white/[0.04] border border-border/60 rounded-xl p-3.5 overflow-x-auto text-xs font-mono text-foreground/90 my-3">
      <code>{code}</code>
    </pre>
  )
}

function InstallCard({
  icon: Icon, title, desc, steps, code, codeNote,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  steps?: string[]
  code?: string
  codeNote?: string
}) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.03] border border-border/50 flex flex-col h-full">
      <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-foreground/70" />
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
      {steps && (
        <ol className="text-xs text-muted-foreground space-y-1.5 mb-1 list-decimal list-inside">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      {code && (
        <>
          <CodeBlock code={code} />
          {codeNote && <p className="text-[11px] text-muted-foreground/70 -mt-2 mb-1">{codeNote}</p>}
        </>
      )}
      <div className="flex-1" />
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-colors mt-3"
      >
        Code source <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

function FeatureDocCard({
  icon: Icon, title, desc, href, badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  href?: string
  badge?: string
}) {
  const content = (
    <div className="p-5 rounded-xl bg-white/[0.03] border border-border/50 h-full transition-colors hover:bg-white/[0.045] hover:border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center">
          <Icon className="w-4 h-4 text-foreground/70" />
        </div>
        {badge && (
          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/80 px-2 py-0.5 rounded-full border border-border/60">{badge}</span>
        )}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
      {href && (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70 font-medium">
          Démarrage rapide <ArrowRight className="w-3 h-3" />
        </span>
      )}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default function DocsIndexPage() {
  const models = Object.values(MODELS).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <article className="max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-3">Documentation Nexora</h1>
      <p className="text-muted-foreground text-base mb-10 leading-relaxed max-w-2xl">
        Tout ce qu'il faut pour installer Nexora, connecter votre compte et utiliser le chat IA,
        l'autocomplétion et le mode Agent — dans votre IDE ou en ligne de commande.
      </p>

      {/* Getting started */}
      <h2 className="text-xl font-bold mb-1">Démarrage rapide</h2>
      <p className="text-sm text-muted-foreground mb-5">Choisissez votre environnement pour installer Nexora.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InstallCard
          icon={Code2}
          title="VS Code"
          desc="Extension officielle Nexora pour Visual Studio Code."
          steps={[
            'Ouvrez l’onglet Extensions (Ctrl+Shift+X)',
            'Recherchez « Nexora AI »',
            'Cliquez sur Installer, puis relancez VS Code si demandé',
          ]}
        />
        <InstallCard
          icon={AppWindow}
          title="IntelliJ / JetBrains"
          desc="Plugin Nexora pour IntelliJ IDEA, WebStorm, PyCharm et les autres IDE JetBrains."
          steps={[
            'Ouvrez Paramètres → Plugins → Marketplace',
            'Recherchez « Nexora »',
            'Installez puis redémarrez l’IDE',
          ]}
        />
        <InstallCard
          icon={Terminal}
          title="CLI"
          desc="L'agent Nexora en ligne de commande — pratique pour les scripts, le CI/CD ou un usage headless."
          code={`curl -fsSL https://raw.githubusercontent.com/kemzang-Bryan/Nexora/main/extensions/cli/scripts/install.sh | bash`}
          codeNote="macOS / Linux — ou npm i -g @nexora/cli (Node.js 20+)"
        />
      </div>

      <div className="border rounded-xl px-4 py-3 text-sm mb-10 leading-relaxed bg-sky-500/10 border-sky-500/25 text-sky-300">
        <span className="mr-2">ℹ️</span>
        Une fois installé, connectez votre compte : commande <code className="px-1 py-0.5 bg-white/[0.08] rounded text-xs font-mono">Nexora: Login</code> dans
        la palette de commandes VS Code / IntelliJ, ou <code className="px-1 py-0.5 bg-white/[0.08] rounded text-xs font-mono">nexora login</code> pour la CLI.
        Vous serez redirigé vers votre navigateur pour vous authentifier.
      </div>

      <div className="h-px bg-border/50 mb-10" />

      {/* Features */}
      <h2 className="text-xl font-bold mb-1">Fonctionnalités</h2>
      <p className="text-sm text-muted-foreground mb-5">Les quatre modes d'interaction avec l'IA au cœur de Nexora.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <FeatureDocCard
          icon={MessageSquare}
          title="Chat"
          desc="Discutez avec l'IA directement dans votre éditeur pour poser des questions, analyser du code ou explorer des solutions."
          href="/docs/chat/quick-start"
        />
        <FeatureDocCard
          icon={SparklesIcon}
          title="Autocomplétion"
          desc="Recevez des suggestions de code en temps réel pendant que vous tapez, en mode Fill-In-the-Middle."
          href="/docs/autocomplete/quick-start"
          badge="Starter+"
        />
        <FeatureDocCard
          icon={Bot}
          title="Mode Agent"
          desc="Déléguez des tâches de développement complètes à l'IA : création de fichiers, exécution de commandes, modifications multi-fichiers."
        />
        <FeatureDocCard
          icon={PenLine}
          title="Édition inline"
          desc="Modifiez une sélection de code directement dans votre fichier courant à partir d'instructions en langage naturel."
        />
      </div>

      <div className="h-px bg-border/50 mb-10" />

      {/* Guides */}
      <h2 className="text-xl font-bold mb-1">Guides</h2>
      <p className="text-sm text-muted-foreground mb-5">Pour aller plus loin dans la configuration de Nexora.</p>
      <Link
        href="/docs/guides/codebase-documentation-awareness"
        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:bg-white/[0.045] hover:border-border transition-colors mb-10"
      >
        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Documentation du projet</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">Comment Nexora lit votre README, votre configuration et vos fichiers AGENTS.md / CLAUDE.md pour des suggestions adaptées à votre codebase.</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Link>

      <div className="h-px bg-border/50 mb-10" />

      {/* Models */}
      <h2 className="text-xl font-bold mb-1">Modèles IA disponibles</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Nexora route automatiquement vos requêtes vers le modèle le plus adapté selon la complexité de la tâche et votre plan.
        Voir <Link href="/pricing" className="text-foreground/70 hover:underline">les modèles inclus par plan</Link>.
      </p>
      <div className="rounded-xl border border-border/50 overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Modèle</th>
              <th className="px-4 py-2.5 font-medium">Fournisseur</th>
              <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Contexte</th>
              <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Vision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {models.map(m => (
              <tr key={m.id}>
                <td className="px-4 py-2.5 font-medium">{m.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.provider}</td>
                <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{(m.contextWindow / 1000).toFixed(0)}K tokens</td>
                <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{m.supportsVision ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-px bg-border/50 mb-10" />

      {/* Resources */}
      <h2 className="text-xl font-bold mb-5">Ressources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/pricing" className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:bg-white/[0.045] hover:border-border transition-colors">
          <CreditCard className="w-4 h-4 text-foreground/70 shrink-0" />
          <span className="text-sm font-medium">Tarifs & plans</span>
        </Link>
        <Link href="/changelog" className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:bg-white/[0.045] hover:border-border transition-colors">
          <ScrollText className="w-4 h-4 text-foreground/70 shrink-0" />
          <span className="text-sm font-medium">Changelog</span>
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50 hover:bg-white/[0.045] hover:border-border transition-colors">
          <ExternalLink className="w-4 h-4 text-foreground/70 shrink-0" />
          <span className="text-sm font-medium">Code source (GitHub)</span>
        </a>
      </div>
    </article>
  )
}
