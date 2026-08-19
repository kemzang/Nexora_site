'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTranslation } from '@/lib/i18n/context'
import { useAuth } from '@/hooks/use-auth'
import { Sparkles, Menu, X, LayoutDashboard } from 'lucide-react'

/**
 * Barre de navigation globale du site marketing (accueil, tarifs, docs,
 * changelog, légal, contact...). Extraite de la nav historique de la page
 * d'accueil pour être réutilisée sur toutes les pages "premier niveau" afin
 * qu'elles restent accessibles et cohérentes visuellement entre elles.
 *
 * `/docs/*` garde son propre header (sidebar de documentation dédiée) —
 * il n'utilise pas ce composant.
 */
export function SiteHeader() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks: [string, string][] = [
    ['/#features', t.nav.features],
    ['/pricing', t.nav.pricing],
    ['/docs', t.nav.docs],
  ]

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text-strong">Nexora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(([href, label]) => (
              <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-foreground transition-all group-hover:w-full" />
              </Link>
            ))}
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <LanguageSwitcher />
              <ThemeToggle />
              {!authLoading && (
                user ? (
                  <Link href="/dashboard">
                    <Button size="sm" variant="outline" className="gap-2">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">{t.nav.login}</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" variant="outline">
                        {t.nav.start}
                      </Button>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-border space-y-2"
          >
            {navLinks.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full" variant="outline" size="sm">
                    <LayoutDashboard className="w-3.5 h-3.5" />Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">{t.nav.login}</Button></Link>
                  <Link href="/auth/register" className="flex-1"><Button className="w-full" variant="outline" size="sm">{t.nav.start}</Button></Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
