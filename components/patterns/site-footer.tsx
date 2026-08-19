'use client'

import Link from 'next/link'
import { Sparkles, Shield } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from '@/lib/i18n/context'

/**
 * Pied de page global du site marketing. Extrait de la page d'accueil pour
 * être réutilisé sur toutes les pages "premier niveau" (tarifs, docs,
 * changelog, légal, contact...) — voir `components/patterns/site-header.tsx`.
 */
export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
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
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
                      {link.label}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-foreground/30 transition-all group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
  )
}
