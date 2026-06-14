import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'
import { PLANS, type PlanId } from '@/lib/models'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Plan actif de l'utilisateur (défaut: free). Détermine la limite de collaborateurs. */
async function getUserPlan(userId: string): Promise<PlanId> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('subscription_plans!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()
  const slug = (data?.subscription_plans as { slug?: string } | null)?.slug as PlanId | undefined
  return slug && PLANS[slug] ? slug : 'free'
}

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

    // Limite de collaborateurs selon le plan du propriétaire.
    const plan = await getUserPlan(userId)
    const maxMembers = PLANS[plan].maxCollaborators

    // La collaboration est une fonctionnalité payante : le plan Free (ou tout
    // plan ne permettant qu'une seule personne) ne peut pas créer de session.
    if (maxMembers < 2) {
      return NextResponse.json(
        {
          error: 'La collaboration nécessite un plan payant. Passe à un plan supérieur pour inviter des collègues.',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      )
    }

    const { data: room, error } = await supabase
      .from('collaboration_rooms')
      .insert({
        owner_id: userId,
        name: name?.trim() || 'Session partagée',
        invite_token: inviteToken,
        max_members: maxMembers,
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
