/**
 * SSE stream pour la collaboration en temps réel.
 *
 * L'extension et le client web se connectent ici avec ?since=<ISO>.
 * On poll Supabase toutes les 2s et on envoie les nouveaux messages + membres.
 * Après 25s on envoie `event: reconnect` et on ferme — le client reconnecte aussitôt.
 * (Vercel functions timeout à 30s en serverless, 60s en Edge — on reste largement dans les clous)
 */
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { getRoom, getMessagesSince, getOnlineMembers } from '@/lib/collab-db'

export const runtime = 'nodejs'

const POLL_INTERVAL_MS = 2_000
const MAX_OPEN_MS = 25_000

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params

  // Auth — Accept aussi un ?token= pour le client web (invite token)
  const auth = req.headers.get('Authorization')
  let userId: string | null = null

  if (auth?.startsWith('Bearer ')) {
    userId = await verifyToken(auth.split(' ')[1])
  }
  // Fallback : token d'invitation dans la query (client web sans compte)
  const inviteToken = req.nextUrl.searchParams.get('inviteToken')
  if (!userId && inviteToken) {
    const room = await getRoom(roomId)
    if (room?.invite_token === inviteToken) {
      userId = `web_${roomId}` // accès lecture seule autorisé
    }
  }

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const since = req.nextUrl.searchParams.get('since') ?? new Date(Date.now() - 5_000).toISOString()
  let cursor = since

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const opened = Date.now()

      // Ping initial pour confirmer la connexion
      controller.enqueue(encoder.encode(': connected\n\n'))

      const poll = setInterval(async () => {
        if (req.signal.aborted) {
          clearInterval(poll)
          controller.close()
          return
        }

        try {
          const [messages, members] = await Promise.all([
            getMessagesSince(roomId, cursor),
            getOnlineMembers(roomId),
          ])

          if (messages.length > 0) {
            cursor = messages[messages.length - 1].created_at
            controller.enqueue(encoder.encode(sseEvent('messages', messages)))
          }

          // Toujours envoyer la liste des membres (présence)
          controller.enqueue(encoder.encode(sseEvent('members', members)))

          // Fermer proprement après MAX_OPEN_MS → le client reconnecte
          if (Date.now() - opened >= MAX_OPEN_MS) {
            clearInterval(poll)
            controller.enqueue(encoder.encode(sseEvent('reconnect', { since: cursor })))
            controller.close()
          }
        } catch {
          // Erreur Supabase transitoire — on continue à poller
        }
      }, POLL_INTERVAL_MS)

      req.signal.addEventListener('abort', () => {
        clearInterval(poll)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
