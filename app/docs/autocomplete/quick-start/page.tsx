import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Auto-complétion — Démarrage rapide | Nexora Docs',
  description: 'Configurez l\'auto-complétion intelligente de Nexora dans VS Code',
}

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
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

export default function AutocompleteQuickStartPage() {
  return (
    <article className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        <span>/</span>
        <span>Auto-complétion</span>
        <span>/</span>
        <span className="text-foreground">Démarrage rapide</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-3">Auto-complétion — Démarrage rapide</h1>
      <p className="text-muted-foreground text-base mb-8 leading-relaxed">
        L'auto-complétion Nexora utilise DeepSeek V3 en mode FIM (Fill-In-the-Middle) pour suggérer du code contextuel en temps réel. Elle s'active automatiquement pendant que vous tapez, disponible dès le plan <strong className="text-sky-400">Starter</strong>.
      </p>

      <Callout type="warning">
        L'auto-complétion nécessite le plan <strong>Starter ou supérieur</strong>. Sur le plan Free, seul le mode Chat est disponible.
      </Callout>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-5">Activation</h2>

      <Step n={1} title="Vérifier que vous êtes sur Starter ou supérieur">
        <p>
          Vérifiez votre plan dans le <a href="/dashboard" className="text-foreground/70 hover:underline">tableau de bord</a> → Abonnement. Si vous êtes sur Free, <a href="/checkout?plan=starter" className="text-foreground/70 hover:underline">passez au plan Starter</a>.
        </p>
      </Step>

      <Step n={2} title="Activer dans les paramètres VS Code">
        <p>Ouvrez les paramètres VS Code (<kbd className="px-1.5 py-0.5 bg-white/[0.08] border border-border/60 rounded text-xs font-mono">Ctrl+,</kbd>) et recherchez <code className="px-1 py-0.5 bg-white/[0.06] rounded text-xs font-mono text-foreground/70">nexora</code>. Activez :</p>
        <CodeBlock lang="json" code={`{
  "nexora.autocomplete.enabled": true,
  "nexora.autocomplete.triggerDelay": 300,
  "nexora.autocomplete.maxTokens": 128
}`} />
      </Step>

      <Step n={3} title="Configurer les langages cibles">
        <p>Par défaut, Nexora active l'auto-complétion sur tous les langages. Vous pouvez la restreindre :</p>
        <CodeBlock lang="json" code={`{
  "nexora.autocomplete.languages": [
    "typescript",
    "javascript",
    "python",
    "rust",
    "go"
  ]
}`} />
      </Step>

      <Step n={4} title="Utiliser les suggestions">
        <p>Commencez à taper — une suggestion apparaît en grisé après le curseur. Pour l'accepter :</p>
        <div className="mt-3 space-y-2">
          {[
            ['Accepter toute la suggestion', 'Tab'],
            ['Accepter mot par mot', 'Ctrl+→'],
            ['Ignorer la suggestion', 'Échap'],
            ['Forcer une suggestion', 'Alt+\\'],
          ].map(([action, key]) => (
            <div key={action} className="flex items-center gap-3">
              <kbd className="px-2 py-0.5 bg-white/[0.08] border border-border/60 rounded text-xs font-mono text-foreground min-w-fit">{key}</kbd>
              <span className="text-muted-foreground">{action}</span>
            </div>
          ))}
        </div>
      </Step>

      <div className="h-px bg-border/50 my-8" />

      <h2 className="text-xl font-bold mb-5">Comment ça fonctionne</h2>

      <div className="space-y-4 mb-8">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-border/50">
          <h3 className="text-sm font-semibold mb-1">Mode FIM (Fill-In-the-Middle)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            L'extension envoie le texte <em>avant</em> et <em>après</em> votre curseur à DeepSeek. Le modèle génère le code manquant au milieu, ce qui donne des complétions beaucoup plus précises qu'une simple prédiction de la suite.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-border/50">
          <h3 className="text-sm font-semibold mb-1">Contexte de fichier</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nexora analyse les imports, les types et les fonctions déjà définies dans le fichier courant pour des suggestions cohérentes avec votre codebase.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-border/50">
          <h3 className="text-sm font-semibold mb-1">Consommation de tokens</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chaque suggestion consomme entre 50 et 300 tokens selon la complexité. Le délai de déclenchement (<code className="text-foreground/70 font-mono text-xs">triggerDelay</code>) permet de réduire les requêtes inutiles.
          </p>
        </div>
      </div>

      <Callout type="tip">
        Augmentez <code className="font-mono text-xs">triggerDelay</code> à 500ms ou plus si vous trouvez que les suggestions s'activent trop souvent et consomment vos tokens rapidement.
      </Callout>

      <div className="h-px bg-border/50 my-8" />

      <h2 className="text-xl font-bold mb-4">Désactivation temporaire</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Cliquez sur le bouton Nexora dans la barre de statut VS Code (en bas à droite) pour activer/désactiver rapidement l'auto-complétion sans toucher aux paramètres.
      </p>

      <div className="h-px bg-border/50 my-8" />

      <div className="flex items-center justify-between text-sm">
        <Link href="/docs/chat/quick-start" className="text-foreground/70 hover:text-foreground transition-colors">
          ← Chat
        </Link>
        <Link href="/docs/guides/codebase-documentation-awareness" className="text-foreground/70 hover:text-foreground transition-colors">
          Guide : Documentation projet →
        </Link>
      </div>
    </article>
  )
}
