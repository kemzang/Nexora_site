import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * POST /api/collab/rooms/[id]/heartbeat
 * Met à jour last_seen_at du membre pour signaler qu'il est toujours actif.
 * Appelé par l'extension toutes les 10s pendant une session de collaboration.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const userId = await verifyToken(authHeader.slice(7))
  if (!userId) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  const { id: roomId } = await params

  const { error } = await supabase
    .from('room_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
