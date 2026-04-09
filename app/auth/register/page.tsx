'use client'

import { useState, Suspense } from 'react'
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
import { Loader2, Sparkles, Brain, Zap, CheckCircle, Code, Rocket } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()
  const { showToast } = useToast()

  const callback = searchParams.get('callback')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      })
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        // Envoyer l'email de bienvenue
        try {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.email,
              userName: data.firstName,
            }),
          })
        } catch {
          // Email secondaire
        }
        showToast('Inscription réussie ! Vérifiez votre email.', 'success')
        setLoading(false)
        setSuccess(true)
        
        setTimeout(() => {
          if (callback && result.token) {
            const redirectUrl = `${callback}${callback.includes('?') ? '&' : '?'}token=${result.token}`
            window.location.href = redirectUrl
          } else {
            router.push('/auth/login')
          }
        }, 3000)
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Inscription réussie !
          </h1>
          <p className="text-gray-300 mb-8">
            {callback ? "Votre compte a été créé. Vous allez être redirigé vers l'extension..." : "Vérifiez votre email pour activer votre compte. Vous allez être redirigé vers la page de connexion..."}
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-6">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>

              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">
                  Rejoindre <span className="gradient-text">Nexora</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Créez votre compte et transformez votre développement
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">Prénom</Label>
                    <Input
                      id="firstName"
                      placeholder="Jean"
                      {...register('firstName')}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-sm">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="Dupont"
                      {...register('lastName')}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-sm">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    {...register('email')}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 transition-all duration-300 hover:scale-105"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Créer mon compte
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <div className="text-gray-300">
                  Déjà un compte ?{' '}
                  <Link 
                    href={`/auth/login${callback ? `?callback=${encodeURIComponent(callback)}` : ''}`} 
                    className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 text-center">
                Ce que vous obtenez avec Nexora :
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-gray-300 text-sm">50 tokens gratuits avec le plan Free</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Code className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Chat IA intégré dans VS Code</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Auto-complétion intelligente</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
