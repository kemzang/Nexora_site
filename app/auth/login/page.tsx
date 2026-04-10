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
import { Loader2, Sparkles, Zap, Code, ArrowRight } from 'lucide-react'
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
  const { signIn, user, token } = useAuth()
  const { showToast } = useToast()

  const callback = searchParams.get('callback')
  const state = searchParams.get('state')

  // Redirection si déjà connecté
  useEffect(() => {
    if (user && token && callback) {
      if (!success) {
        setSuccess(true)
        setRedirectToken(token)
      }
    } else if (user && token && !callback) {
      router.push('/dashboard')
    }
  }, [user, token, callback, router, success])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const getRedirectUrl = (tokenValue: string) => {
    if (!callback) return null
    // Utiliser le schéma correct : vscode://Nexora.nexora/auth
    const baseUrl = "vscode://Nexora.nexora/auth"
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
        
        if (callback && result.token) {
          setRedirectToken(result.token)
          const redirectUrl = getRedirectUrl(result.token)
          if (redirectUrl) {
            // Tenter la redirection directe
            window.location.assign(redirectUrl)
          }
          setSuccess(true)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Une erreur inattendue est survenue')
      setLoading(false)
    }
  }

  if (success && callback) {
    const finalToken = redirectToken || token
    const redirectUrl = finalToken ? getRedirectUrl(finalToken) : null
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-md relative z-10"
        >
          <Card className="backdrop-blur-2xl bg-white/[0.03] border-white/10 shadow-2xl p-10 rounded-[2rem]">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40"
            >
              <Code className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Connexion réussie !
            </h1>
            <p className="text-gray-400 mb-10 leading-relaxed">
              Votre compte est prêt. Cliquez sur le bouton ci-dessous pour retourner dans VS Code et commencer à coder.
            </p>

            <div className="space-y-4">
              <Button 
                onClick={() => {
                  if (redirectUrl) window.location.href = redirectUrl
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-7 rounded-2xl text-lg shadow-xl shadow-indigo-600/20 group transition-all"
              >
                Ouvrir VS Code
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="w-full text-gray-500 hover:text-white hover:bg-white/5 py-6 rounded-2xl"
              >
                Aller au Dashboard web
              </Button>
            </div>
          </Card>

          <p className="mt-8 text-gray-600 text-sm">
            Si rien ne se passe, vérifiez que VS Code est bien installé sur votre machine.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/[0.03] border-white/10 shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center space-y-6 pt-10">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-white tracking-tight">
                Nexora
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connectez-vous pour continuer
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-10 pt-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  {...register('email')}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-purple-500/50 h-12 rounded-xl transition-all"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-purple-500/50 h-12 rounded-xl transition-all"
                />
                {errors.password && (
                  <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-gray-500 text-sm">
                Pas encore de compte ?{' '}
                <Link 
                  href={`/auth/register${callback ? `?callback=${encodeURIComponent(callback)}` : ''}`} 
                  className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center space-x-6"
        >
          {[
            { icon: Zap, color: 'text-yellow-400', label: 'Rapide' },
            { icon: Code, color: 'text-blue-400', label: 'Intelligent' },
            { icon: Sparkles, color: 'text-purple-400', label: 'Productif' }
          ].map((item, i) => (
            <div key={i} className="flex items-center space-x-2 text-gray-500 text-xs">
              <item.icon className={`w-4 h-4 ${item.color}`} />
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
