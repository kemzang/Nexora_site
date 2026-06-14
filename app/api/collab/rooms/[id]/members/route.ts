import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** GET /api/collab/rooms/[id]/members — Membres en ligne (last_seen < 30s) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const userId = await verifyToken(auth.split(' ')[1])
  if (!userId) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const { id: roomId } = await params
  const cutoff = new Date(Date.now() - 30_000).toISOString()

  const { data: members, error } = await supabase
    .from('room_members')
    .select('user_id, display_name, last_seen_at, joined_at')
    .eq('room_id', roomId)
    .gte('last_seen_at', cutoff)
    .order('joined_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ members: members ?? [] })
}
