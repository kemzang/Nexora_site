'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle2, Loader2,
  AlertTriangle, Clock, Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'

interface ApiKeyRow {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
  rate_limit_per_minute: number
}

async function generateApiKey(): Promise<{ fullKey: string; prefix: string; hash: string }> {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  const hex = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
  const fullKey = `nxr_${hex}`
  const prefix = fullKey.substring(0, 12)
  const encoded = new TextEncoder().encode(fullKey)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return { fullKey, prefix, hash }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Jamais utilisée'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export default function ApiKeysSection() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchKeys = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, created_at, rate_limit_per_minute')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setKeys(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.id) fetchKeys(user.id)
  }, [user?.id, fetchKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim() || !user?.id) return
    setCreating(true)
    try {
      const { fullKey, prefix, hash } = await generateApiKey()
      const { error } = await (supabase.from('api_keys') as any).insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_prefix: prefix,
        key_hash: hash,
        permissions: { read: true, write: true },
        rate_limit_per_minute: 60,
        is_active: true,
      })
      if (error) { showToast('Erreur lors de la création de la clé', 'error'); return }
      setCreatedKey(fullKey)
      setNewKeyName('')
      setShowCreate(false)
      if (user?.id) fetchKeys(user.id)
    } catch {
      showToast('Erreur inattendue', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setKeyCopied(true)
    showToast('Clé copiée dans le presse-papiers', 'success')
    setTimeout(() => setKeyCopied(false), 2000)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    const { error } = await (supabase.from('api_keys') as any).update({ is_active: false }).eq('id', id)
    if (error) { showToast('Erreur lors de la suppression', 'error') } else {
      showToast('Clé révoquée avec succès', 'success')
      setKeys(prev => prev.filter(k => k.id !== id))
    }
    setDeleteConfirm(null)
    setDeleting(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clés API</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos clés d'accès pour l'extension VS Code</p>
        </div>
        <Button
          onClick={() => { setShowCreate(true); setNewKeyName('') }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Nouvelle clé
        </Button>
      </div>

      {/* Security note */}
      <Card className="glass border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex gap-3">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90 leading-relaxed">
            Vos clés API donnent un accès complet à vos tokens Nexora. Ne les partagez jamais et révoquez immédiatement toute clé compromise.
          </p>
        </CardContent>
      </Card>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="glass border-indigo-500/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Créer une nouvelle clé</CardTitle>
                <CardDescription className="text-sm">Donnez un nom descriptif à votre clé pour l'identifier facilement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName" className="text-sm">Nom de la clé</Label>
                  <Input
                    id="keyName"
                    placeholder="ex: VS Code - MacBook Pro"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    className="bg-card border-border/50 focus:border-indigo-500/50"
                    maxLength={50}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newKeyName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création...</> : 'Créer la clé'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-muted-foreground">
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Created key - show once */}
      <AnimatePresence>
        {createdKey && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="glass border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">Clé créée avec succès</span>
                </div>
                <p className="text-xs text-amber-300 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Copiez cette clé maintenant — elle ne sera plus visible après.
                </p>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 font-mono text-xs bg-card border border-border/50 rounded-lg px-3 py-2.5 text-foreground truncate">
                    {createdKey}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(createdKey)}
                    className={`shrink-0 transition-all ${keyCopied ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}
                  >
                    {keyCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  J'ai bien copié ma clé, fermer
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys list */}
      <Card className="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            Clés actives
            {!loading && <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-medium">{keys.length}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/30">
                  <div className="skeleton w-9 h-9 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-32 rounded" />
                    <div className="skeleton h-3 w-48 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-7 h-7 text-indigo-400/60" />
              </div>
              <p className="font-medium text-foreground mb-1">Aucune clé API</p>
              <p className="text-sm text-muted-foreground mb-5">Créez votre première clé pour utiliser Nexora dans VS Code</p>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />Créer une clé
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key, i) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/60 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{key.name}</p>
                      <span className="badge-success">Active</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-xs text-muted-foreground font-mono">{key.key_prefix}••••••••••••••••••••</code>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(key.last_used_at)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Créée le {formatDate(key.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {deleteConfirm === key.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-400">Confirmer ?</span>
                        <button
                          onClick={() => handleDelete(key.id)}
                          disabled={deleting}
                          className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors"
                        >
                          {deleting ? 'Révocation...' : 'Oui, révoquer'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 rounded-lg bg-white/[0.05] text-muted-foreground hover:text-foreground text-xs transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(key.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Révoquer la clé"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
