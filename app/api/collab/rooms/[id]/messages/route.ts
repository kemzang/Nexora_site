import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { getRoom, insertMessage, getMessagesSince } from '@/lib/collab-db'

export const runtime = 'nodejs'

/**
 * Résout l'identité de l'appelant.
 * Accepte :
 *  - Bearer nxr_xxx  → API key (extension VS Code)
 *  - Bearer <jwt>    → Supabase JWT
 *  - ?inviteToken=xx → client web (invite token valide)
 * Retourne { userId, isWebGuest } ou null si non autorisé.
 */
async function resolveIdentity(
  req: NextRequest,
  room: { id: string; invite_token: string }
): Promise<{ userId: string; isWebGuest: boolean } | null> {
  const auth = req.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const userId = await verifyToken(auth.split(' ')[1])
    if (userId) return { userId, isWebGuest: false }
  }
  // Invite token (client web sans compte)
  const inviteToken = req.nextUrl.searchParams.get('inviteToken') ?? (await req.clone().json().catch(() => ({}))).inviteToken
  if (inviteToken && inviteToken === room.invite_token) {
    return { userId: `web_${room.id}`, isWebGuest: true }
  }
  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const room = await getRoom(roomId)
  if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  const identity = await resolveIdentity(req, room)
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { content, role = 'user', senderName = 'Utilisateur', modelId, inviteToken: _it } = body as {
    content?: string
    role?: 'user' | 'assistant'
    senderName?: string
    modelId?: string
    inviteToken?: string
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content requis' }, { status: 400 })
  }

  const msg = await insertMessage(roomId, identity.userId, senderName, role, content.trim(), modelId)
  return NextResponse.json({ message: msg })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const room = await getRoom(roomId)
  if (!room) return NextResponse.json({ error: 'Room introuvable' }, { status: 404 })

  const identity = await resolveIdentity(req, room)
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = req.nextUrl.searchParams.get('since') ?? new Date(0).toISOString()
  const messages = await getMessagesSince(roomId, since)
  return NextResponse.json({ messages })
}
