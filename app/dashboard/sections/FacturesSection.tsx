'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, X, Printer, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  tax_amount: number
  currency: string
  status: string
  billing_period_start: string
  billing_period_end: string
  pdf_url: string | null
  created_at: string
}

interface UserInfo {
  email: string
  firstName: string
  lastName: string
}

function formatCurrency(amount: number, currency: string) {
  if (currency === 'XAF') return `${amount.toLocaleString('fr-FR')} FCFA`
  return `${(amount / 100).toFixed(2)} ${currency === 'EUR' ? '€' : currency}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="badge-success"><CheckCircle2 className="w-3 h-3" />Payée</span>
  if (status === 'pending') return <span className="badge-warning"><Clock className="w-3 h-3" />En attente</span>
  if (status === 'failed') return <span className="badge-error"><XCircle className="w-3 h-3" />Échouée</span>
  return <span className="badge-neutral">{status}</span>
}

function InvoiceModal({ invoice, user, onClose }: { invoice: Invoice; user: UserInfo; onClose: () => void }) {
  const subtotal = invoice.amount - invoice.tax_amount
  const issueDate = new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const periodStart = new Date(invoice.billing_period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const periodEnd = new Date(invoice.billing_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="font-bold text-base">Facture {invoice.invoice_number}</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.print()}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="font-bold text-lg">Nexora</span>
              </div>
              <p className="text-xs text-muted-foreground">nexora.ai</p>
              <p className="text-xs text-muted-foreground">contact@nexora.ai</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground uppercase tracking-tight">Facture</p>
              <p className="text-sm text-muted-foreground mt-1">N° {invoice.invoice_number}</p>
              <p className="text-xs text-muted-foreground">Émise le {issueDate}</p>
              <div className="mt-2">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60" />

          {/* Billing info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">De</p>
              <p className="text-sm font-semibold">Nexora SAS</p>
              <p className="text-xs text-muted-foreground">Plateforme IA pour développeurs</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Facturé à</p>
              <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="bg-white/[0.03] px-4 py-2.5 grid grid-cols-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <span className="col-span-2">Description</span>
              <span className="text-right">Montant</span>
            </div>
            <div className="px-4 py-3.5 grid grid-cols-3 border-t border-border/40">
              <div className="col-span-2">
                <p className="text-sm font-medium">Abonnement Nexora</p>
                <p className="text-xs text-muted-foreground mt-0.5">Période : {periodStart} – {periodEnd}</p>
              </div>
              <p className="text-sm font-medium text-right">{formatCurrency(subtotal, invoice.currency)}</p>
            </div>
            {invoice.tax_amount > 0 && (
              <div className="px-4 py-3 grid grid-cols-3 border-t border-border/40 text-muted-foreground">
                <div className="col-span-2 text-xs">TVA</div>
                <p className="text-xs text-right">{formatCurrency(invoice.tax_amount, invoice.currency)}</p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-5 py-4">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(invoice.amount, invoice.currency)}</span>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Merci d'avoir choisi Nexora. Pour toute question : contact@nexora.ai
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FacturesSection() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo>({ email: '', firstName: '', lastName: '' })

  useEffect(() => {
    if (user?.id) fetchInvoices(user.id, user.email || '')
  }, [user?.id])

  async function fetchInvoices(userId: string, email: string) {
    try {
      const [invResult, profileResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle(),
      ])

      setInvoices((invResult.data || []) as any[])
      const profileData = profileResult.data as any
      const displayName = profileData?.display_name || ''
      const parts = displayName.split(' ')
      setUserInfo({
        email,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      })
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
        <p className="text-muted-foreground text-sm mt-1">Historique de facturation et téléchargement</p>
      </div>

      <Card className="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Historique des factures
            {!loading && invoices.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-medium">{invoices.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/30">
                  <div className="skeleton w-9 h-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-36 rounded" />
                    <div className="skeleton h-3 w-52 rounded" />
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                  <div className="skeleton h-8 w-28 rounded-lg" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-indigo-400/50" />
              </div>
              <p className="font-medium text-foreground mb-1">Aucune facture</p>
              <p className="text-sm text-muted-foreground">Vos factures apparaîtront ici après votre premier paiement</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_120px_140px_100px_auto] gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <span>Facture</span>
                <span>Montant</span>
                <span>Période</span>
                <span>Statut</span>
                <span />
              </div>

              {invoices.map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_100px_auto] gap-3 sm:gap-4 items-center p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/60 transition-all"
                >
                  {/* Invoice ID */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold text-foreground">{formatCurrency(inv.amount, inv.currency)}</p>

                  {/* Period */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.billing_period_start).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    {' – '}
                    {new Date(inv.billing_period_end).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </p>

                  {/* Status */}
                  <div><StatusBadge status={inv.status} /></div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir
                    </Button>
                    {inv.pdf_url ? (
                      <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 gap-1.5 text-xs">
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </Button>
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-muted-foreground hover:text-indigo-400 gap-1.5 text-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            user={userInfo}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
