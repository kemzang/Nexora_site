import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chat — Démarrage rapide | Nexora Docs',
  description: 'Apprenez à utiliser le mode Chat IA de Nexora dans VS Code',
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <pre className="bg-white/[0.04] border border-border/60 rounded-xl p-4 overflow-x-auto text-sm font-mono text-foreground/90 my-4">
      <code>{code}</code>
    </pre>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-foreground/70 text-sm font-bold">{n}</span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-base mb-2">{title}</h3>
        <div className="text-muted-foreground text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info:    'bg-sky-500/10 border-sky-500/25 text-sky-300',
    warning: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    tip:     'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
  }
  const icons = { info: 'ℹ️', warning: '⚠️', tip: '💡' }
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm mb-4 leading-relaxed ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>{children}
    </div>
  )
}

export default function ChatQuickStartPage() {
  return (
    <article className="prose-custom max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        <span>/</span>
        <span>Chat</span>
        <span>/</span>
        <span className="text-foreground">Démarrage rapide</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-3">Chat IA — Démarrage rapide</h1>
      <p className="text-muted-foreground text-base mb-8 leading-relaxed">
        Le mode Chat de Nexora vous permet de converser avec les meilleurs modèles IA (DeepSeek, Gemini, Claude) directement depuis VS Code, sans quitter votre éditeur.
      </p>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-5">Prérequis</h2>
      <ul className="space-y-2 text-sm text-muted-foreground mb-8">
        <li className="flex items-start gap-2"><span className="text-foreground/70 mt-0.5">•</span>Extension Nexora installée dans VS Code</li>
        <li className="flex items-start gap-2"><span className="text-foreground/70 mt-0.5">•</span>Compte Nexora créé et vérifié sur <a href="https://nexora.ai" className="text-foreground/70 hover:underline">nexora.ai</a></li>
        <li className="flex items-start gap-2"><span className="text-foreground/70 mt-0.5">•</span>Extension connectée à votre compte (token configuré)</li>
      </ul>

      <h2 className="text-xl font-bold mb-5">Utilisation</h2>

      <Step n={1} title="Ouvrir le Chat Nexora">
        <p>Ouvrez la palette de commandes avec <kbd className="px-1.5 py-0.5 bg-white/[0.08] border border-border/60 rounded text-xs text-foreground font-mono">Ctrl+Shift+P</kbd> (ou <kbd className="px-1.5 py-0.5 bg-white/[0.08] border border-border/60 rounded text-xs text-foreground font-mono">Cmd+Shift+P</kbd> sur Mac), puis tapez :</p>
        <CodeBlock code="Nexora: Open Chat" />
        <p>Vous pouvez aussi utiliser le raccourci direct : <kbd className="px-1.5 py-0.5 bg-white/[0.08] border border-border/60 rounded text-xs text-foreground font-mono">Ctrl+Shift+N</kbd></p>
      </Step>

      <Step n={2} title="Sélectionner un modèle">
        <p>
          En haut du panneau Chat, cliquez sur le sélecteur de modèle. Les modèles disponibles dépendent de votre plan :
        </p>
        <div className="mt-3 space-y-1.5">
          {[
            { plan: 'Free',       models: 'DeepSeek V3, Gemini Flash', color: 'text-muted-foreground' },
            { plan: 'Neo',        models: '+ Gemini Pro', color: 'text-sky-400' },
            { plan: 'Pro',        models: '+ Claude Haiku, Claude Sonnet', color: 'text-amber-400' },
            { plan: 'Business',   models: '+ Claude Opus', color: 'text-emerald-400' },
            { plan: 'Enterprise', models: 'Tous les modèles', color: 'text-foreground/70' },
          ].map(row => (
            <div key={row.plan} className="flex items-center gap-3 text-sm">
              <span className={`w-20 font-medium ${row.color}`}>{row.plan}</span>
              <span className="text-muted-foreground">{row.models}</span>
            </div>
          ))}
        </div>
      </Step>

      <Step n={3} title="Envoyer votre première requête">
        <p>Tapez votre message dans la zone de saisie et appuyez sur <kbd className="px-1.5 py-0.5 bg-white/[0.08] border border-border/60 rounded text-xs text-foreground font-mono">Entrée</kbd>.</p>
        <Callout type="tip">
          Sélectionnez du code dans l'éditeur avant d'ouvrir le Chat : Nexora inclut automatiquement ce contexte dans votre message.
        </Callout>
      </Step>

      <Step n={4} title="Utiliser le contexte du fichier courant">
        <p>Nexora peut analyser votre fichier ouvert. Dans le Chat, tapez <code className="px-1 py-0.5 bg-white/[0.06] rounded text-xs font-mono text-foreground/70">@file</code> pour référencer le fichier actif, ou <code className="px-1 py-0.5 bg-white/[0.06] rounded text-xs font-mono text-foreground/70">@selection</code> pour la sélection courante.</p>
      </Step>

      <div className="h-px bg-border/50 my-8" />

      <h2 className="text-xl font-bold mb-5">Commandes clavier</h2>
      <div className="rounded-xl border border-border/60 overflow-hidden text-sm">
        <div className="bg-white/[0.03] px-4 py-2.5 grid grid-cols-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          <span>Action</span>
          <span>Raccourci</span>
        </div>
        {[
          ['Ouvrir le Chat', 'Ctrl+Shift+N'],
          ['Envoyer le message', 'Entrée'],
          ['Nouvelle ligne', 'Shift+Entrée'],
          ['Vider la conversation', 'Ctrl+L'],
          ['Arrêter la génération', 'Échap'],
        ].map(([action, key]) => (
          <div key={action} className="px-4 py-3 grid grid-cols-2 border-t border-border/40">
            <span className="text-muted-foreground">{action}</span>
            <kbd className="text-xs font-mono text-foreground/80">{key}</kbd>
          </div>
        ))}
      </div>

      <div className="h-px bg-border/50 my-8" />

      <h2 className="text-xl font-bold mb-4">Sélection automatique du modèle</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Nexora analyse automatiquement la complexité de votre question et sélectionne le modèle le plus adapté parmi ceux disponibles sur votre plan. Pour forcer un modèle précis, utilisez le sélecteur manuel en haut du Chat.
      </p>

      <Callout type="info">
        La consommation de tokens est visible dans votre <a href="/dashboard" className="underline underline-offset-2">tableau de bord</a>, onglet Utilisation.
      </Callout>

      <div className="h-px bg-border/50 my-8" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Page suivante</span>
        <Link href="/docs/autocomplete/quick-start" className="text-foreground/70 hover:text-foreground transition-colors">
          Auto-complétion →
        </Link>
      </div>
    </article>
  )
}
