'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'
import { LANGS, translations } from '@/lib/i18n/translations'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/60 hover:bg-accent text-sm text-foreground transition-all backdrop-blur-sm"
        aria-label="Language"
      >
        {compact ? (
          <>
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-base leading-none">{t.flag}</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">{t.flag}</span>
            <span className="hidden sm:inline text-xs font-medium">{t.langName}</span>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-40 bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {LANGS.map(l => {
              const tr = translations[l]
              const isActive = l === lang
              return (
                <button
                  key={l}
                  onClick={() => { setLang(l); setOpen(false) }}
                  className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left transition-colors text-sm ${
                    isActive
                      ? 'bg-indigo-500/15 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <span className="text-base leading-none">{tr.flag}</span>
                  <span>{tr.langName}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
