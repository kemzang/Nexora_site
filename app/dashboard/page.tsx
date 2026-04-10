'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, Code, TrendingUp, Users, CreditCard, Settings, LogOut, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/modal'

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-purple-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Confirmer la déconnexion"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-400 mb-8">
            Êtes-vous sûr de vouloir vous déconnecter de votre compte Nexora ?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSignOut}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Se déconnecter
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsSignOutModalOpen(false)}
              className="flex-1 text-gray-400 hover:text-white hover:bg-white/5"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Nexora</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-white text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/5"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-4xl font-bold text-white mb-3">
            Bienvenue,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user?.firstName}</span>!
          </h2>
          <p className="text-gray-400 text-lg">
            Gérez votre abonnement, vos clés API et optimisez votre productivité.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: 'Tokens disponibles', value: '50', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { label: 'API Keys', value: '0', icon: Code, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Utilisations ce mois', value: '0', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Plan actuel', value: 'Free', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#161B22] border-white/5 hover:border-white/10 transition-colors group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-[#161B22] border-white/5 h-full">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold text-white">Actions rapides</CardTitle>
                <CardDescription className="text-gray-500">
                  Démarrez avec Nexora en quelques clics.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-auto p-8 flex flex-col items-center space-y-3 rounded-2xl border-none shadow-xl shadow-indigo-600/10 transition-all hover:-translate-y-1">
                  <Code className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-bold">API Key</p>
                    <p className="text-xs opacity-70">Générer pour VS Code</p>
                  </div>
                </Button>
                
                <Button className="bg-white/5 hover:bg-white/10 border border-white/5 text-white h-auto p-8 flex flex-col items-center space-y-3 rounded-2xl transition-all hover:-translate-y-1">
                  <Zap className="w-8 h-8 text-yellow-400" />
                  <div className="text-center">
                    <p className="font-bold">Upgrade</p>
                    <p className="text-xs text-gray-500">Passer en Pro</p>
                  </div>
                </Button>
                
                <Button className="bg-white/5 hover:bg-white/10 border border-white/5 text-white h-auto p-8 flex flex-col items-center space-y-3 rounded-2xl transition-all hover:-translate-y-1">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div className="text-center">
                    <p className="font-bold">Docs</p>
                    <p className="text-xs text-gray-500">Tutoriels Nexora</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Getting Started */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-[#161B22] border-white/5 h-full">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold text-white">Mise en route</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                {[
                  { step: 1, title: 'Extension', desc: 'Installez Nexora dans VS Code', icon: Code },
                  { step: 2, title: 'API Key', desc: 'Créez votre clé de connexion', icon: Zap },
                  { step: 3, title: 'Coding', desc: 'Boostez votre code avec l\'IA', icon: Sparkles },
                ].map((item, i) => (
                  <div key={item.step} className="flex items-start space-x-4 group cursor-default">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <span className="text-purple-400 group-hover:text-white font-bold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{item.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <Button className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-xl py-6 group">
                  Voir le guide complet
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
