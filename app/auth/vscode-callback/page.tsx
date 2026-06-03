'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'

// Libellés selon l'IDE source (?ide=vscode|jetbrains|cli)
const IDE_LABELS: Record<string, { name: string; deepLink?: (token: string) => string }> = {
  vscode: {
    name: 'VS Code',
    deepLink: (token) => `vscode://Nexora.nexora/auth?token=${encodeURIComponent(token)}`,
  },
  jetbrains: { name: 'votre IDE JetBrains' },
  cli: { name: 'le CLI Nexora' },
}

function VSCodeCallbackInner() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const ide = (searchParams.get('ide') || 'vscode').toLowerCase()
  const ideInfo = IDE_LABELS[ide] ?? IDE_LABELS.vscode
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const generateApiKey = async () => {
      try {
        const res = await fetch('/api/auth/generate-extension-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        const data = await res.json()
        if (data.success) {
          setApiKey(data.token)
          // Deep link automatique uniquement pour VS Code (les autres IDE collent le token)
          if (ideInfo.deepLink) {
            try {
              window.location.href = ideInfo.deepLink(data.token)
            } catch {}
          }
        }
      } catch (err) {
        console.error('Erreur génération token:', err)
      } finally {
        setLoading(false)
      }
    }

    generateApiKey()
  }, [user, ideInfo])

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      showToast('Token copié !', 'success')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Redirection vers la connexion...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <Card className="glass">
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="flex justify-center">
              {loading ? (
                <div className="relative">
                  <div className="w-14 h-14 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 w-14 h-14 border-2 border-violet-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {loading ? 'Connexion en cours...' : 'Connexion réussie !'}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">
                {loading ? 'Génération de votre token...' : `${ideInfo.name} est connecté`}
              </CardDescription>
            </div>
          </CardHeader>

          {!loading && apiKey && (
            <CardContent className="space-y-5 pb-8">
              <p className="text-sm">
                Bonjour <span className="text-indigo-400 font-semibold">{user.firstName || user.email}</span> !
              </p>
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Votre clé Nexora <span className="font-mono text-indigo-400">nxr_</span> :
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-indigo-300 bg-background px-2.5 py-1.5 rounded-lg font-mono break-all">
                    {apiKey}
                  </code>
                  <Button size="sm" variant="ghost" onClick={copyToClipboard} className="text-muted-foreground hover:text-foreground shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  {ide === 'vscode'
                    ? "Si l'extension ne s'est pas connectée automatiquement, copiez la clé et collez-la dans VS Code."
                    : `Copiez cette clé et collez-la dans ${ideInfo.name} pour vous connecter.`}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => window.close()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
                    Fermer
                  </Button>
                  <Button variant="outline" onClick={() => window.open('/dashboard', '_blank')} className="border-border/50 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

export default function VSCodeCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VSCodeCallbackInner />
    </Suspense>
  )
}
