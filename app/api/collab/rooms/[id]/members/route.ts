import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cette route utilise service_role_key, qui contourne la policy RLS "View
// members in same room" (002-collaboration.sql) — sans ce controle explicite,
// n'importe quel utilisateur authentifie connaissant/devinant un room_id
// pouvait lister ses membres (noms affiches, presence), qu'il en fasse
// partie ou non. messages/route.ts fait deja cette verification (assertMember) ;
// members/route.ts ne l'avait pas — incoherence corrigee ici.
async function assertMember(roomId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single()
  return !!data
}

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

  if (!(await assertMember(roomId, userId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

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
