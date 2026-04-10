'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sparkles, Lock, CheckCircle, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    // Supabase gère automatiquement le token dans l'URL via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    // Aussi vérifier si on a déjà une session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })
      if (updateError) {
        setError(updateError.message)
        showToast('Erreur lors de la réinitialisation.', 'error')
      } else {
        setSuccess(true)
        showToast('Mot de passe mis à jour !', 'success')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Mot de passe mis à jour !</h1>
          <p className="text-gray-300 mb-8">Redirection vers la connexion...</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex justify-center">
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
              <CardTitle className="text-2xl font-bold text-white">Nouveau mot de passe</CardTitle>
              <CardDescription className="text-gray-300">Choisissez un nouveau mot de passe sécurisé</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!sessionReady && (
              <Alert className="bg-yellow-500/20 border-yellow-500/50 text-yellow-300">
                <AlertDescription>Vérification du lien en cours... Si cette page ne se met pas à jour, le lien a peut-être expiré.</AlertDescription>
              </Alert>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Nouveau mot de passe</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400" />
                {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-400" />
                {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" disabled={loading || !sessionReady}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</>
                ) : (
                  <><Lock className="mr-2 h-4 w-4" />Mettre à jour le mot de passe</>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold text-sm">
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
