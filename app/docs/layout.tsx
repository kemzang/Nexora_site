import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation — Nexora',
  description: 'Documentation officielle de l\'extension VS Code Nexora',
}

const docLinks = [
  {
    section: 'Chat',
    links: [
      { href: '/docs/chat/quick-start', label: 'Démarrage rapide' },
    ],
  },
  {
    section: 'Auto-complétion',
    links: [
      { href: '/docs/autocomplete/quick-start', label: 'Démarrage rapide' },
    ],
  },
  {
    section: 'Guides',
    links: [
      { href: '/docs/guides/codebase-documentation-awareness', label: 'Documentation du projet' },
    ],
  },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au site
            </Link>
            <span className="text-border/60">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="font-semibold text-sm">Nexora Docs</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dashboard →
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-10 py-10">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="space-y-6 sticky top-24">
            {docLinks.map(section => (
              <div key={section.section}>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2 px-2">{section.section}</p>
                {section.links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
