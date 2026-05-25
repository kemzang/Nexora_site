import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** POST /api/collab/rooms — Créer un room de collaboration */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const userId = await verifyToken(authHeader.split(' ')[1])
    if (!userId) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { name, displayName } = await req.json().catch(() => ({}))

    // Générer un token d'invitation unique
    const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { data: room, error } = await supabase
      .from('collaboration_rooms')
      .insert({
        owner_id: userId,
        name: name?.trim() || 'Session partagée',
        invite_token: inviteToken,
      })
      .select()
      .single()

    if (error || !room) {
      console.error('collab/rooms POST error:', error)
      return NextResponse.json({ error: 'Erreur création room' }, { status: 500 })
    }

    // L'owner rejoint automatiquement son room
    await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: userId,
      display_name: displayName?.trim() || 'Propriétaire',
    })

    // Lien d'invitation utilisable directement dans VSCode
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexora-mu-henna.vercel.app'
    const inviteLink = `vscode://nexora/collab?room=${room.id}&token=${inviteToken}`
    const webLink = `${baseUrl}/collab/join?room=${room.id}&token=${inviteToken}`

    return NextResponse.json({ room, inviteLink, webLink }, { status: 201 })
  } catch (err) {
    console.error('collab/rooms POST:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/** GET /api/collab/rooms — Lister les rooms de l'utilisateur */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const userId = await verifyToken(authHeader.split(' ')[1])
    if (!userId) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Rooms dont l'utilisateur est owner
    const { data: ownedRooms } = await supabase
      .from('collaboration_rooms')
      .select('*, room_members(count)')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    // Rooms où l'utilisateur est membre (mais pas owner)
    const { data: memberships } = await supabase
      .from('room_members')
      .select('room_id, collaboration_rooms(*)')
      .eq('user_id', userId)
      .neq('collaboration_rooms.owner_id', userId)
      .limit(10)

    const joinedRooms = (memberships ?? [])
      .map(m => m.collaboration_rooms)
      .filter(Boolean)

    return NextResponse.json({
      owned: ownedRooms ?? [],
      joined: joinedRooms,
    })
  } catch (err) {
    console.error('collab/rooms GET:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
