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
      return NextResponse.json({ error: 'Erreur création room' }, { status: 500 })
    }

    // L'owner rejoint automatiquement son room
    await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: userId,
      display_name: displayName?.trim() || 'Propriétaire',
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexora-mu-henna.vercel.app'
    const inviteLink = `vscode://nexora/collab?room=${room.id}&token=${inviteToken}`
    const webLink = `${baseUrl}/collab/${room.id}?token=${inviteToken}`

    return NextResponse.json({ room, inviteLink, webLink }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
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

    const { data: ownedRooms } = await supabase
      .from('collaboration_rooms')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ owned: ownedRooms ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
