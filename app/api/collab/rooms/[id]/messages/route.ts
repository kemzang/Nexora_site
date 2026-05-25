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

/**
 * GET /api/collab/rooms/[id]/messages?since=<ISO8601>
 * Retourne les messages depuis un timestamp donné (polling côté extension)
 */
export async function GET(
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
    if (!(await assertMember(roomId, userId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Mettre à jour last_seen (fire and forget)
    void supabase
      .from('room_members')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    const since = req.nextUrl.searchParams.get('since')
    let query = supabase
      .from('collab_messages')
      .select('id, sender_id, sender_name, role, content, model_id, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: messages, error } = await query
    if (error) {
      console.error('collab/messages GET:', error)
      return NextResponse.json({ error: 'Erreur lecture messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages ?? [] })
  } catch (err) {
    console.error('collab/messages GET:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const userId = await verifyToken(authHeader.split(' ')[1])
    if (!userId) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { id: roomId } = await params
    if (!(await assertMember(roomId, userId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { content, role, senderName, modelId } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    }

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

    if (error || !message) {
      console.error('collab/messages POST:', error)
      return NextResponse.json({ error: 'Erreur envoi message' }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('collab/messages POST:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
