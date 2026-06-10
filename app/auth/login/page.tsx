'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sparkles, Zap, Code, ArrowRight, Brain } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [redirectToken, setRedirectToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithGoogle, user, token } = useAuth()
  const { showToast } = useToast()

  const callback = searchParams.get('callback')
  const redirect = searchParams.get('redirect')
  const state = searchParams.get('state')

  useEffect(() => {
    if (user && token) {
      if (callback) {
        if (!success) {
          setSuccess(true)
          setRedirectToken(token)
        }
      } else if (redirect) {
        window.location.href = redirect
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, token, callback, redirect, router, success])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const getRedirectUrl = (tokenValue: string) => {
    if (!callback) return null
    const baseUrl = "vscode://Nexora.nexora"
    const params = new URLSearchParams()
    params.append('token', tokenValue)
    if (state) params.append('state', state)
    return `${baseUrl}?${params.toString()}`
  }

  const onSubmit = async (data: LoginFormData) => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await signIn(data)
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        showToast('Connexion réussie !', 'success')
        if (callback) {
          if (result.token) {
            setRedirectToken(result.token)
            const redirectUrl = getRedirectUrl(result.token)
            if (redirectUrl) window.location.assign(redirectUrl)
          }
          setSuccess(true)
        } else if (redirect) {
          window.location.href = redirect
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('Une erreur inattendue est survenue')
      setLoading(false)
    }
  }

  if (success && callback) {
    const finalToken = redirectToken || token
    const redirectUrl = finalToken ? getRedirectUrl(finalToken) : null
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-md relative z-10"
        >
          <Card className="glass p-10">
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30"
            >
              <Code className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">
              Connexion réussie !
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Votre compte est prêt. Cliquez ci-dessous pour retourner dans VS Code.
            </p>
            <div className="space-y-3">
              {redirectUrl ? (
                <a
                  href={redirectUrl}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm shadow-lg shadow-indigo-600/25 group transition-all flex items-center justify-center no-underline"
                >
                  Ouvrir VS Code
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <Button disabled className="w-full bg-muted text-muted-foreground py-6 rounded-xl text-sm">
                  Lien non disponible
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Aller au Dashboard web
              </Button>
            </div>
          </Card>
          <p className="mt-6 text-xs text-muted-foreground">
            Si rien ne se passe, vérifiez que VS Code est bien installé.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/8 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/8 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass">
          <CardHeader className="text-center space-y-5 pt-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring" }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </motion.div>
              </div>
            </motion.div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight">Nexora</CardTitle>
              <CardDescription className="text-muted-foreground">Connectez-vous pour continuer</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-8 pt-4">
            {error && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm ml-0.5">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  {...register('email')}
                  className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500/50 h-11 rounded-xl transition-all"
                />
                {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-0.5">
                  <Label htmlFor="password" className="text-sm">Mot de passe</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500/50 h-11 rounded-xl transition-all"
                />
                {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
                ) : (
                  <>Se connecter <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            {/* Séparateur + connexion Google */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={async () => {
                const { error } = await signInWithGoogle()
                if (error) setError(error)
              }}
              className="flex w-full items-center justify-center gap-2 h-11 rounded-xl border border-white/15 bg-white/5 font-medium text-foreground transition-colors hover:bg-white/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 1.9 14.7 1 12 1 6.5 1 2 5.5 2 11s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"/>
              </svg>
              Continuer avec Google
            </button>

            <div className="text-center pt-1">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link
                  href={`/auth/register${callback ? `?callback=${encodeURIComponent(callback)}` : ''}`}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex justify-center gap-6"
        >
          {[
            { icon: Zap, label: 'Rapide' },
            { icon: Code, label: 'Intelligent' },
            { icon: Brain, label: 'IA Puissante' }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <item.icon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
