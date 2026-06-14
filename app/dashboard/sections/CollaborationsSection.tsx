'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users, Copy, CheckCircle2, Trash2, ExternalLink, Loader2, Link2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'

interface Room {
  id: string
  name: string
  invite_token: string
  is_active: boolean
  created_at: string
  memberCount: number
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://nexora-mu-henna.vercel.app'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function CollaborationsSection() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchRooms = useCallback(async (userId: string) => {
    setLoading(true)
    const { data } = await (supabase.from('collaboration_rooms') as any)
      .select('id, name, invite_token, is_active, created_at')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const list = (data as Omit<Room, 'memberCount'>[]) || []

    // Count online members (last_seen < 30s) per room
    const withCounts = await Promise.all(
      list.map(async (room) => {
        const cutoff = new Date(Date.now() - 30_000).toISOString()
        const { count } = await (supabase.from('room_members') as any)
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .gte('last_seen_at', cutoff)
        return { ...room, memberCount: count ?? 0 }
      }),
    )
    setRooms(withCounts)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.id) fetchRooms(user.id)
    // refresh presence every 15s
    const t = setInterval(() => {
      if (user?.id) fetchRooms(user.id)
    }, 15_000)
    return () => clearInterval(t)
  }, [user?.id, fetchRooms])

  const webLink = (room: Room) =>
    `${SITE_URL}/collab/${room.id}?token=${room.invite_token}`

  const handleCopy = async (room: Room) => {
    await navigator.clipboard.writeText(webLink(room))
    setCopiedId(room.id)
    showToast('Lien d\'invitation copié', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleStop = async (room: Room) => {
    setDeleting(room.id)
    const { error } = await (supabase.from('collaboration_rooms') as any)
      .update({ is_active: false })
      .eq('id', room.id)
    if (error) {
      showToast('Erreur lors de la fermeture', 'error')
    } else {
      showToast('Session fermée', 'success')
      setRooms((prev) => prev.filter((r) => r.id !== room.id))
    }
    setDeleting(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collaborations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vos sessions de collaboration en temps réel partagées depuis VS Code
        </p>
      </div>

      {/* Info note */}
      <Card className="glass border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-4 flex gap-3">
          <Link2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-300/90 leading-relaxed">
            Les sessions se créent depuis l'extension VS Code (bouton « Collab »).
            Elles apparaissent ici — partagez le lien web pour qu'un collègue rejoigne
            depuis son navigateur, sans VS Code.
          </p>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Sessions actives
            {!loading && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-medium">
                {rooms.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-indigo-400/60" />
              </div>
              <p className="font-medium text-foreground mb-1">Aucune session active</p>
              <p className="text-sm text-muted-foreground">
                Créez une session depuis l'extension VS Code pour la voir ici
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/60 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{room.name}</p>
                      {room.memberCount > 0 && (
                        <span className="badge-success flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {room.memberCount} en ligne
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      Créée le {formatDate(room.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(room)}
                      title="Copier le lien d'invitation"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === room.id
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <Copy className="w-4 h-4" />}
                    </Button>
                    <a
                      href={webLink(room)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ouvrir la session web"
                      className="p-2 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleStop(room)}
                      disabled={deleting === room.id}
                      title="Fermer la session"
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      {deleting === room.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
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
