import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** POST /api/collab/rooms/[id]/join — Rejoindre un room avec le token d'invitation */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const userId = await verifyToken(authHeader.split(' ')[1])
    if (!userId) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { id: roomId } = await params
    const { inviteToken, displayName } = await req.json().catch(() => ({}))

    if (!inviteToken) {
      return NextResponse.json({ error: "Token d'invitation requis" }, { status: 400 })
    }

    const { data: room, error: roomError } = await supabase
      .from('collaboration_rooms')
      .select('*')
      .eq('id', roomId)
      .eq('invite_token', inviteToken)
      .eq('is_active', true)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room introuvable ou lien invalide' }, { status: 404 })
    }

    const { count } = await supabase
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    if ((count ?? 0) >= room.max_members) {
      return NextResponse.json(
        { error: `Session pleine (max ${room.max_members} personne${room.max_members > 1 ? 's' : ''} pour le plan du propriétaire). Le propriétaire doit passer à un plan supérieur pour inviter plus de monde.`, code: 'ROOM_FULL' },
        { status: 403 }
      )
    }

    await supabase.from('room_members').upsert(
      {
        room_id: roomId,
        user_id: userId,
        display_name: displayName?.trim() || 'Développeur',
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,user_id' }
    )

    const { data: members } = await supabase
      .from('room_members')
      .select('user_id, display_name, joined_at, last_seen_at')
      .eq('room_id', roomId)

    return NextResponse.json({ room, members: members ?? [], joined: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
