import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation projet — Guide | Nexora Docs',
  description: 'Apprenez à configurer la conscience documentaire de Nexora pour obtenir des suggestions adaptées à votre codebase',
}

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  return (
    <pre className="bg-white/[0.04] border border-border/60 rounded-xl p-4 overflow-x-auto text-sm font-mono text-foreground/90 my-4">
      <code>{code}</code>
    </pre>
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

function FileTree({ items }: { items: string[] }) {
  return (
    <div className="bg-white/[0.04] border border-border/60 rounded-xl p-4 my-4 font-mono text-xs text-foreground/80 space-y-1">
      {items.map((item, i) => <div key={i}>{item}</div>)}
    </div>
  )
}

export default function CodebaseDocumentationAwarenessPage() {
  return (
    <article className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        <span>/</span>
        <span>Guides</span>
        <span>/</span>
        <span className="text-foreground">Documentation du projet</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-3">Guide : Documentation du projet</h1>
      <p className="text-muted-foreground text-base mb-8 leading-relaxed">
        Nexora peut exploiter la documentation de votre projet — README, commentaires, fichiers de configuration — pour fournir des suggestions contextuellement cohérentes avec votre architecture et vos conventions.
      </p>

      <Callout type="info">
        Cette fonctionnalité est disponible sur tous les plans. Plus votre documentation est structurée, plus les suggestions seront précises.
      </Callout>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-4">Comment Nexora analyse votre projet</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        À l'ouverture d'un workspace, Nexora indexe les fichiers de documentation détectés automatiquement. Cet index est transmis comme contexte système aux modèles IA, ce qui leur permet de comprendre votre projet avant même que vous posiez une question.
      </p>

      <div className="space-y-3 mb-8">
        {[
          { icon: '📄', title: 'README.md', desc: 'Description du projet, instructions d\'installation, architecture générale.' },
          { icon: '⚙️', title: 'Fichiers de config', desc: 'package.json, tsconfig.json, pyproject.toml — pour comprendre les dépendances et les conventions.' },
          { icon: '💬', title: 'Commentaires JSDoc / docstrings', desc: 'Nexora lit les annotations de types et descriptions de fonctions pour enrichir le contexte.' },
          { icon: '📁', title: 'AGENTS.md / CLAUDE.md', desc: 'Si présents, ces fichiers sont prioritaires et guidé l\'IA sur vos instructions spécifiques.' },
        ].map(item => (
          <div key={item.title} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/50">
            <span className="text-lg shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold mb-0.5">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-4">Configurer la documentation dans VS Code</h2>

      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Vous pouvez spécifier quels fichiers Nexora doit analyser via les paramètres de l'extension :
      </p>

      <CodeBlock lang="json" code={`{
  "nexora.context.includeReadme": true,
  "nexora.context.includePackageJson": true,
  "nexora.context.extraFiles": [
    "ARCHITECTURE.md",
    "docs/conventions.md",
    "docs/api-reference.md"
  ],
  "nexora.context.maxFileSize": 50000
}`} />

      <Callout type="tip">
        Gardez <code className="font-mono text-xs">maxFileSize</code> sous 50 000 caractères par fichier. Les fichiers plus volumineux sont tronqués automatiquement, ce qui peut exclure des informations importantes.
      </Callout>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-4">Structure de projet recommandée</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Pour maximiser la pertinence des suggestions, adoptez cette structure documentaire :
      </p>

      <FileTree items={[
        'mon-projet/',
        '├── README.md              ← Vue d\'ensemble, stack, démarrage rapide',
        '├── ARCHITECTURE.md        ← Décisions d\'architecture, patterns utilisés',
        '├── docs/',
        '│   ├── conventions.md     ← Conventions de nommage, style de code',
        '│   ├── api-reference.md   ← Endpoints, types de données',
        '│   └── glossaire.md       ← Termes métier spécifiques',
        '├── src/',
        '│   └── ...',
        '└── package.json',
      ]} />

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-4">Utiliser @doc dans le Chat</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Dans le panneau Chat, vous pouvez référencer explicitement un fichier de documentation pour l'inclure dans votre question :
      </p>

      <div className="space-y-3 mb-6">
        {[
          { cmd: '@doc README.md', desc: 'Inclut votre README comme contexte de la question' },
          { cmd: '@doc ARCHITECTURE.md', desc: 'Inclut votre fichier d\'architecture' },
          { cmd: '@doc docs/conventions.md', desc: 'Inclut un fichier de documentation personnalisé' },
        ].map(item => (
          <div key={item.cmd} className="flex items-start gap-3 text-sm">
            <code className="px-2 py-0.5 bg-white/[0.06] rounded text-xs font-mono text-foreground/70 shrink-0 mt-0.5">{item.cmd}</code>
            <span className="text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>

      <Callout type="tip">
        Combinez <code className="font-mono text-xs">@doc</code> et <code className="font-mono text-xs">@file</code> pour des questions très ciblées : <em>"@doc conventions.md @file src/utils/parser.ts — est-ce que ce fichier respecte nos conventions ?"</em>
      </Callout>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-4">Exemple concret</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Avec un README contenant votre stack et vos conventions, Nexora adapte ses suggestions :
      </p>

      <div className="grid gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-border/50">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Sans documentation projet</p>
          <p className="text-xs text-foreground/70 italic">"Génère une fonction pour parser un CSV"</p>
          <p className="text-xs text-muted-foreground mt-2">→ Suggestion générique en JavaScript natif</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25">
          <p className="text-xs text-emerald-400 mb-2 uppercase tracking-wider font-semibold">Avec README indexé (stack : TypeScript + zod)</p>
          <p className="text-xs text-foreground/70 italic">"Génère une fonction pour parser un CSV"</p>
          <p className="text-xs text-muted-foreground mt-2">→ Suggestion TypeScript avec validation zod, types stricts, gestion d'erreur cohérente avec votre codebase</p>
        </div>
      </div>

      <div className="h-px bg-border/50 mb-8" />

      <h2 className="text-xl font-bold mb-4">Fichier .nexoraignore</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Pour exclure des fichiers de l'indexation (secrets, fichiers volumineux, dossiers générés) :
      </p>

      <CodeBlock lang="text" code={`# .nexoraignore
node_modules/
dist/
.env*
*.min.js
coverage/
docs/internal/    # Documentation interne confidentielle`} />

      <Callout type="warning">
        Nexora ne lit jamais les fichiers <code className="font-mono text-xs">.env</code> et <code className="font-mono text-xs">.env.*</code> par défaut, même sans <code className="font-mono text-xs">.nexoraignore</code>.
      </Callout>

      <div className="h-px bg-border/50 my-8" />

      <div className="flex items-center justify-between text-sm">
        <Link href="/docs/autocomplete/quick-start" className="text-foreground/70 hover:text-foreground transition-colors">
          ← Auto-complétion
        </Link>
        <Link href="/docs" className="text-foreground/70 hover:text-foreground transition-colors">
          Accueil Docs →
        </Link>
      </div>
    </article>
  )
}
