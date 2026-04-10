'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Zap, Code, TrendingUp, Users, CreditCard, Settings, LogOut, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/modal'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsSignOutModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Confirmer la déconnexion"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-300 mb-8">
            Êtes-vous sûr de vouloir vous déconnecter de votre compte Nexora ?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSignOut}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Se déconnecter
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsSignOutModalOpen(false)}
              className="flex-1 text-gray-400 hover:text-white hover:bg-white/10"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Nexora</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Bienvenue sur votre dashboard,{' '}
            <span className="gradient-text">{user?.firstName}</span>!
          </h2>
          <p className="text-gray-300">
            Gérez votre abonnement, vos API keys et suivez votre utilisation de l'IA.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Tokens disponibles</p>
                    <p className="text-2xl font-bold text-white">50</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">API Keys</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Code className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Utilisations ce mois</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Plan actuel</p>
                    <p className="text-2xl font-bold text-white">Free</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Actions rapides</CardTitle>
              <CardDescription className="text-gray-300">
                Commencez à utiliser Nexora avec ces actions rapides
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-auto p-6 flex flex-col items-center space-y-2 border-none shadow-lg shadow-purple-500/20">
                <Code className="w-8 h-8" />
                <span className="font-semibold">Créer une API Key</span>
                <span className="text-sm opacity-80">Générez votre clé pour VS Code</span>
              </Button>
              
              <Button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-auto p-6 flex flex-col items-center space-y-2 transition-all duration-300">
                <CreditCard className="w-8 h-8 text-purple-400" />
                <span className="font-semibold">Mettre à niveau</span>
                <span className="text-sm opacity-80">Passez au plan Pro</span>
              </Button>
              
              <Button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-auto p-6 flex flex-col items-center space-y-2 transition-all duration-300">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="font-semibold">Documentation</span>
                <span className="text-sm opacity-80">Apprenez à utiliser Nexora</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Commencer avec Nexora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 font-bold">1</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Installez l'extension VS Code</h4>
                  <p className="text-gray-300 text-sm">Téléchargez Nexora depuis le marketplace VS Code</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 font-bold">2</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Créez une API Key</h4>
                  <p className="text-gray-300 text-sm">Générez une clé sécurisée pour connecter l'extension</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 font-bold">3</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Commencez à coder</h4>
                  <p className="text-gray-300 text-sm">Profitez de l'IA pour améliorer votre productivité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
