import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { getRoom, upsertMember } from '@/lib/collab-db'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const body = await req.json().catch(() => ({}))
  const { inviteToken, displayName } = body as { inviteToken?: string; displayName?: string }

  if (!inviteToken) {
    return NextResponse.json({ error: 'inviteToken requis' }, { status: 400 })
  }

  // Vérifier la room + le token d'invitation
  const room = await getRoom(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room introuvable ou inactive' }, { status: 404 })
  }
  if (room.invite_token !== inviteToken) {
    return NextResponse.json({ error: 'Token d\'invitation invalide' }, { status: 403 })
  }

  // Déterminer l'userId : si Bearer token fourni on l'utilise, sinon ID temporaire
  const authHeader = req.headers.get('Authorization')
  let userId: string
  if (authHeader?.startsWith('Bearer ')) {
    userId = (await verifyToken(authHeader.split(' ')[1])) ?? `anon_${randomUUID()}`
  } else {
    userId = `anon_${randomUUID()}`
  }

  const name = (displayName as string)?.trim() || 'Développeur'
  await upsertMember(roomId, userId, name)

  return NextResponse.json({ room, joined: true, userId })
}
