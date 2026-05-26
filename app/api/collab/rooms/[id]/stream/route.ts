import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Edge runtime : pas de timeout Node.js, compatible streaming long
export const runtime = 'edge'

// Vercel Hobby → 25s max ; Pro → 90s. On ferme à 20s et le client reconnecte.
const SSE_MAX_MS = 20_000
const POLL_INTERVAL_MS = 800
const PRESENCE_INTERVAL_MS = 5_000
const PRESENCE_TIMEOUT_S = 30

// ── Auth légère (edge-compatible, pas d'import depuis auth-verify) ────────────

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyTokenEdge(
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<string | null> {
  if (token.startsWith('nxr_')) {
    const hash = await sha256hex(token)
    const { data } = await supabase
      .from('api_keys')
      .select('user_id, expires_at, is_active')
      .eq('key_hash', hash)
      .eq('is_active', true)
      .single()
    const row = data as { user_id: string; expires_at: string | null; is_active: boolean } | null
    if (!row) return null
    if (row.expires_at && new Date(row.expires_at) < new Date()) return null
    return row.user_id
  }
  // JWT Supabase natif
  const {
    data: { user },
  } = await supabase.auth.getUser(token)
  return (user as { id: string } | null)?.id ?? null
}

// ── SSE helper ────────────────────────────────────────────────────────────────

function sseChunk(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  )
}

function sseComment(text: string): Uint8Array {
  return new TextEncoder().encode(`: ${text}\n\n`)
}

// ── Route principale ──────────────────────────────────────────────────────────

/**
 * GET /api/collab/rooms/[id]/stream?since=<ISO8601>
 *
 * Flux SSE qui pousse les nouveaux messages en temps quasi-réel.
 * La connexion se ferme après SSE_MAX_MS et envoie `event: reconnect`
 * avec le curseur `since` mis à jour pour que le client reconnecte
 * sans perdre de messages.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Non autorisé', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const userId = await verifyTokenEdge(authHeader.slice(7), supabase)
  if (!userId) return new Response('Token invalide', { status: 401 })

  const { id: roomId } = await params

  // ── Vérifier que l'user est membre du room ────────────────────────────────
  const { data: member } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single()

  if (!member) return new Response('Accès refusé', { status: 403 })

  // Curseur de temps initial (depuis quand on écoute les messages)
  let since =
    req.nextUrl.searchParams.get('since') ??
    new Date(Date.now() - 5_000).toISOString()

  // ── Flux SSE ──────────────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      const enqueue = (chunk: Uint8Array) => {
        if (!closed) controller.enqueue(chunk)
      }

      // Ping initial + délai de reconnexion conseillé au client
      enqueue(sseComment('stream connected'))
      enqueue(new TextEncoder().encode('retry: 3000\n\n'))

      // Polling Supabase côté serveur
      const poll = async () => {
        if (closed) return
        try {
          const { data: messages } = await supabase
            .from('collab_messages')
            .select(
              'id, sender_id, sender_name, role, content, model_id, created_at',
            )
            .eq('room_id', roomId)
            .gt('created_at', since)
            .order('created_at', { ascending: true })
            .limit(20)

          if (messages?.length) {
            since = messages[messages.length - 1].created_at
            enqueue(sseChunk('messages', messages))
          }
        } catch {
          // Erreur Supabase transitoire — on continue
        }
      }

      const interval = setInterval(() => void poll(), POLL_INTERVAL_MS)

      // Présence : qui est en ligne (last_seen_at dans les 30 dernières secondes)
      const presencePoll = async () => {
        if (closed) return
        try {
          const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_S * 1000).toISOString()
          const { data: members } = await supabase
            .from('room_members')
            .select('user_id, display_name, last_seen_at')
            .eq('room_id', roomId)
            .gte('last_seen_at', cutoff)
          enqueue(sseChunk('presence', members ?? []))
        } catch {
          // Erreur transitoire — on ignore
        }
      }
      const presenceInterval = setInterval(() => void presencePoll(), PRESENCE_INTERVAL_MS)

      // Fermeture propre après SSE_MAX_MS → le client reconnecte avec `since`
      const maxTimer = setTimeout(() => {
        closed = true
        clearInterval(interval)
        clearInterval(presenceInterval)
        enqueue(sseChunk('reconnect', { since }))
        controller.close()
      }, SSE_MAX_MS)

      // Déconnexion côté client (onglet fermé, extension arrêtée…)
      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        clearInterval(presenceInterval)
        clearTimeout(maxTimer)
        try { controller.close() } catch { /* déjà fermé */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // désactive le buffering nginx/Vercel
    },
  })
}
