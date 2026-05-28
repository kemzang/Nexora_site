import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { touchMember } from '@/lib/collab-db'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = await verifyToken(auth.split(' ')[1])
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await touchMember(roomId, userId)
  return NextResponse.json({ ok: true })
}
