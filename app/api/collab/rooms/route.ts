import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createRoom } from '@/lib/collab-db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = await verifyToken(authHeader.split(' ')[1])
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const name: string = (body.name as string)?.trim() || 'Session partagée'

  try {
    const room = await createRoom(name, userId)

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nexora-mu-henna.vercel.app'
    const inviteLink = `vscode://nexora/collab?room=${room.id}&token=${room.invite_token}`
    const webLink = `${base}/collab/${room.id}?token=${room.invite_token}`

    return NextResponse.json({ room, inviteLink, webLink })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
