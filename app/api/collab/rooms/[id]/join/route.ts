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
      return NextResponse.json({ error: 'Token d\'invitation requis' }, { status: 400 })
    }

    // Vérifier que le room existe et que le token est valide
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

    // Vérifier la capacité du room
    const { count } = await supabase
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    if ((count ?? 0) >= room.max_members) {
      return NextResponse.json({ error: 'Room plein (max 5 membres)' }, { status: 403 })
    }

    // Ajouter le membre (ou mettre à jour last_seen si déjà présent)
    const { error: memberError } = await supabase
      .from('room_members')
      .upsert(
        {
          room_id: roomId,
          user_id: userId,
          display_name: displayName?.trim() || 'Développeur',
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'room_id,user_id' }
      )

    if (memberError) {
      console.error('collab/join upsert error:', memberError)
      return NextResponse.json({ error: 'Erreur lors de l\'ajout au room' }, { status: 500 })
    }

    // Récupérer les membres actuels
    const { data: members } = await supabase
      .from('room_members')
      .select('user_id, display_name, joined_at, last_seen_at')
      .eq('room_id', roomId)

    return NextResponse.json({ room, members: members ?? [], joined: true })
  } catch (err) {
    console.error('collab/join POST:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
