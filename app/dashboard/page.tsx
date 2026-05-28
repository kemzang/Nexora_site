'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Settings, LogOut, LayoutDashboard, Key, FileText, HelpCircle, ChevronRight,
  Bell, Menu, X, Activity, Wallet
} from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/modal'
import OverviewSection from '@/app/dashboard/sections/OverviewSection'
import ApiKeysSection from '@/app/dashboard/sections/ApiKeysSection'
import UtilisationSection from '@/app/dashboard/sections/UtilisationSection'
import AbonnementSection from '@/app/dashboard/sections/AbonnementSection'
import FacturesSection from '@/app/dashboard/sections/FacturesSection'
import AideSection from '@/app/dashboard/sections/AideSection'

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Vue d\'ensemble', section: 'dashboard' },
  { icon: Key, label: 'Clés API', section: 'api-keys' },
  { icon: Activity, label: 'Utilisation', section: 'utilisation' },
  { icon: Wallet, label: 'Abonnement', section: 'abonnement' },
  { icon: FileText, label: 'Factures', section: 'factures' },
  { icon: HelpCircle, label: 'Aide', section: 'aide' },
]

const sections: Record<string, React.FC<{ user: any; onNavigate: (s: string) => void }>> = {
  dashboard: ({ user, onNavigate }) => <OverviewSection user={user} onNavigate={onNavigate} />,
  'api-keys': ({ user }) => <ApiKeysSection />,
  utilisation: () => <UtilisationSection />,
  abonnement: ({ onNavigate }) => <AbonnementSection onNavigate={onNavigate} />,
  factures: () => <FacturesSection />,
  aide: () => <AideSection />,
}

function NexoraLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'
  return (
    <div className={`${s} rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0`}>
      <span className="text-white font-bold text-sm tracking-tight select-none">N</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    setIsSignOutModalOpen(false)
    router.push('/auth/login')
  }

  const handleNavigate = (section: string) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  const sectionTitle = sidebarLinks.find(l => l.section === activeSection)?.label || 'Vue d\'ensemble'
  const ActiveComponent = sections[activeSection] || sections.dashboard

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-violet-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
      </div>
    )
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-background">
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Confirmer la déconnexion"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <LogOut className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-muted-foreground mb-8 text-sm">
            Êtes-vous sûr de vouloir vous déconnecter de votre compte Nexora ?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSignOut} className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none">
              Se déconnecter
            </Button>
            <Button variant="ghost" onClick={() => setIsSignOutModalOpen(false)} className="flex-1 text-muted-foreground hover:text-foreground hover:bg-accent">
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 border-r border-border/60 bg-sidebar transition-transform duration-300 lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between h-[72px] px-5 border-b border-border/60 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <NexoraLogo />
            <div>
              <span className="font-bold text-sm text-foreground tracking-tight">Nexora</span>
              <span className="block text-[10px] text-muted-foreground/70 leading-none mt-0.5">Dashboard</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em] px-3 mb-2">
            Navigation
          </p>
          {sidebarLinks.map(link => {
            const isActive = activeSection === link.section
            return (
              <button
                key={link.label}
                onClick={() => handleNavigate(link.section)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl text-sm transition-all text-left relative group ${
                  isActive
                    ? 'bg-indigo-500/14 text-indigo-300 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-400 rounded-full" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-indigo-500/20'
                    : 'bg-white/[0.04] group-hover:bg-white/[0.07]'
                }`}>
                  <link.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'}`} />
                </div>
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400/50 shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 pb-5 pt-3 border-t border-border/60 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-indigo-500/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-muted-foreground/60 text-[10px] truncate mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleNavigate('aide')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors border border-transparent hover:border-border/40"
            >
              <Settings className="w-3.5 h-3.5" />
              Paramètres
            </button>
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Dashboard</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-foreground font-medium">{sectionTitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-1 ring-background" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content — sections stay mounted (no re-fetch on tab switch) */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {sidebarLinks.map(link => {
            const Section = sections[link.section]
            return (
              <div
                key={link.section}
                style={{ display: activeSection === link.section ? 'block' : 'none' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {Section && <Section user={user} onNavigate={handleNavigate} />}
                </motion.div>
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}
