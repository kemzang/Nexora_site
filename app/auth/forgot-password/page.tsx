'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sparkles, Mail, ArrowLeft, CheckCircle, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const schema = z.object({ email: z.string().email('Email invalide') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/email/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      if (!res.ok) throw new Error()
      setSent(true); showToast('Email de réinitialisation envoyé !', 'success')
    } catch { setError('Une erreur est survenue. Réessayez.'); showToast('Erreur lors de l\'envoi.', 'error') }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Email envoyé !</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques instants.
          </p>
          <Link href="/auth/login">
            <Button><ArrowLeft className="mr-2 h-4 w-4" />Retour à la connexion</Button>
          </Link>
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
              <CardTitle className="text-2xl font-bold tracking-tight">Mot de passe oublié</CardTitle>
              <CardDescription className="text-muted-foreground">Entrez votre email pour recevoir un lien de réinitialisation</CardDescription>
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
                <Input id="email" type="email" placeholder="vous@exemple.com" {...register('email')}
                  className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 h-11 rounded-xl transition-all" />
                {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={loading}
                variant="outline"
                className="w-full font-semibold h-11 rounded-xl">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Mail className="mr-2 h-4 w-4" />Envoyer le lien</>}
              </Button>
            </form>
            <div className="text-center pt-1">
              <Link href="/auth/login" className="inline-flex items-center text-sm text-foreground/70 hover:text-foreground transition-colors font-medium">
                <ArrowLeft className="w-3 h-3 mr-1" />Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
