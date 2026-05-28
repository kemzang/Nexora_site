import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function assertMember(roomId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single()
  return !!data
}

async function resolveUser(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return verifyToken(auth.split(' ')[1])
  return null
}

/**
 * GET /api/collab/rooms/[id]/messages?since=<ISO8601>
 * Retourne les messages depuis un timestamp donné (polling côté extension)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await resolveUser(req)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id: roomId } = await params
    if (!(await assertMember(roomId, userId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const since = req.nextUrl.searchParams.get('since')
    let query = supabase
      .from('collab_messages')
      .select('id, sender_id, sender_name, role, content, model_id, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (since) query = query.gt('created_at', since)

    const { data: messages, error } = await query
    if (error) return NextResponse.json({ error: 'Erreur lecture messages' }, { status: 500 })

    return NextResponse.json({ messages: messages ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * POST /api/collab/rooms/[id]/messages
 * Envoyer un message dans le room
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await resolveUser(req)
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id: roomId } = await params
    if (!(await assertMember(roomId, userId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { content, role, senderName, modelId } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })

    const { data: message, error } = await supabase
      .from('collab_messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        sender_name: senderName?.trim() || 'Développeur',
        role: role || 'user',
        content: content.trim(),
        model_id: modelId || null,
      })
      .select()
      .single()

    if (error || !message) return NextResponse.json({ error: 'Erreur envoi message' }, { status: 500 })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
