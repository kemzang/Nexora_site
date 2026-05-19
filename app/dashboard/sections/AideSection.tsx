'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
  Book, MessageCircle, Mail, Sparkles, ChevronDown, Terminal,
  Code, Zap, Key, ExternalLink, GitBranch, MessagesSquare
} from 'lucide-react'

const FAQ = [
  {
    q: 'Comment installer l\'extension Nexora dans VS Code ?',
    a: 'Ouvrez VS Code, allez dans l\'onglet Extensions (Ctrl+Shift+X), recherchez "Nexora AI" et cliquez sur Installer. Relancez VS Code si demandé.',
  },
  {
    q: 'Comment connecter mon compte à l\'extension ?',
    a: 'Dans VS Code, ouvrez la palette de commandes (Ctrl+Shift+P), tapez "Nexora: Login" et suivez les instructions. Vous serez redirigé vers votre navigateur pour vous authentifier.',
  },
  {
    q: 'Qu\'est-ce qu\'un token et comment sont-ils comptés ?',
    a: 'Un token correspond approximativement à 4 caractères de texte. Chaque requête IA consomme des tokens en entrée (votre message + contexte) et en sortie (la réponse générée). Le décompte est visible dans votre tableau de bord.',
  },
  {
    q: 'Mes tokens non utilisés sont-ils reportés au mois suivant ?',
    a: 'Non, les tokens se réinitialisent à chaque renouvellement mensuel. Ils ne sont pas cumulables d\'un mois à l\'autre.',
  },
  {
    q: 'Comment changer de plan ou annuler mon abonnement ?',
    a: 'Rendez-vous dans la section Abonnement de votre tableau de bord. Vous pouvez upgrader votre plan à tout moment. Pour annuler, contactez notre support par email.',
  },
]

function FaqItem({ item }: { item: typeof FAQ[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AideSection() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aide & Support</h1>
        <p className="text-muted-foreground text-sm mt-1">Documentation, guides et ressources pour démarrer</p>
      </div>

      {/* Quick start */}
      <Card className="glass border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold">Guide de démarrage rapide</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                icon: Code,
                title: 'Installer l\'extension',
                desc: 'Recherchez "Nexora AI" dans le marketplace VS Code',
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10',
              },
              {
                step: '02',
                icon: Key,
                title: 'Créer une clé API',
                desc: 'Générez votre clé dans l\'onglet "Clés API" du dashboard',
                color: 'text-violet-400',
                bg: 'bg-violet-500/10',
              },
              {
                step: '03',
                icon: Zap,
                title: 'Commencer à coder',
                desc: 'Utilisez Ctrl+Shift+P → Nexora dans VS Code',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
            ].map((step) => (
              <div key={step.step} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-border/40">
                <div className={`w-10 h-10 ${step.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <step.icon className={`w-4.5 h-4.5 ${step.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-0.5">ÉTAPE {step.step}</p>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <div>
        <h2 className="text-base font-semibold mb-4">Ressources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Book,
              title: 'Documentation',
              desc: 'Guides complets, référence API et tutoriels',
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10',
              hover: 'hover:border-indigo-500/30 hover:bg-indigo-500/5',
              action: 'Consulter →',
            },
            {
              icon: GitBranch,
              title: 'GitHub',
              desc: 'Code source de l\'extension et issues',
              color: 'text-foreground',
              bg: 'bg-white/[0.06]',
              hover: 'hover:border-white/[0.12] hover:bg-white/[0.04]',
              action: 'Voir le repo →',
            },
            {
              icon: MessagesSquare,
              title: 'Communauté',
              desc: 'Discord et forum avec la communauté Nexora',
              color: 'text-violet-400',
              bg: 'bg-violet-500/10',
              hover: 'hover:border-violet-500/30 hover:bg-violet-500/5',
              action: 'Rejoindre →',
            },
          ].map(item => (
            <Card key={item.title} className={`glass border-border/50 ${item.hover} transition-all cursor-pointer group hover:-translate-y-0.5`}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 mb-4 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                <span className="text-xs text-indigo-400 font-medium">{item.action}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-base font-semibold mb-4">Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <FaqItem item={item} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Card className="glass bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border-indigo-500/20">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-9 h-9 mx-auto mb-3 text-indigo-400" />
          <h2 className="text-lg font-bold mb-1">Vous avez d'autres questions ?</h2>
          <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
            Notre équipe est disponible pour vous aider. Réponse sous 24h en semaine.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:contact@nexora.ai"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-md shadow-indigo-600/20"
            >
              <Mail className="w-3.5 h-3.5" />
              Envoyer un email
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-border/50 hover:bg-white/[0.08] text-foreground text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat en direct
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
