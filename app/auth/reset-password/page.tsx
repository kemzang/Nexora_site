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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    supabase.auth.getSession().then(({ data }) => { if (data.session) setSessionReady(true) })
    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
      if (updateError) { setError(updateError.message); showToast('Erreur lors de la réinitialisation.', 'error') }
      else { setSuccess(true); showToast('Mot de passe mis à jour !', 'success'); setTimeout(() => router.push('/auth/login'), 3000) }
    } catch { setError('Une erreur est survenue.') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Mot de passe mis à jour !</h1>
          <p className="text-muted-foreground mb-8">Redirection vers la connexion...</p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-foreground/30 border-t-transparent rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-foreground/[0.02] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-foreground/[0.02] blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <Card className="glass">
          <CardHeader className="text-center space-y-5 pt-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }} className="flex justify-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                  <Sparkles className="w-7 h-7 text-primary-foreground" />
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-1 -right-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </motion.div>
              </div>
            </motion.div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight">Nouveau mot de passe</CardTitle>
              <CardDescription className="text-muted-foreground">Choisissez un mot de passe sécurisé</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-8 pt-4">
            {!sessionReady && (
              <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-300 rounded-xl">
                <AlertDescription>Vérification du lien... Si rien ne se produit, le lien a peut-être expiré.</AlertDescription>
              </Alert>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm ml-0.5">Nouveau mot de passe</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')}
                  className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 h-11 rounded-xl transition-all" />
                {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm ml-0.5">Confirmer</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')}
                  className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 h-11 rounded-xl transition-all" />
                {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" disabled={loading || !sessionReady}
                variant="outline"
                className="w-full font-semibold h-11 rounded-xl">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</> : <><Lock className="mr-2 h-4 w-4" />Mettre à jour</>}
              </Button>
            </form>
            <div className="text-center pt-1">
              <Link href="/auth/login" className="text-sm text-foreground/70 hover:text-foreground transition-colors font-medium">
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
