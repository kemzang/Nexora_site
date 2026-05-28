import { createClient } from '@supabase/supabase-js'
import type { CollabRoom, CollabMember, CollabMessage } from '@/types/database'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Rooms ──────────────────────────────────────────────────────────────────────

export async function createRoom(name: string, ownerId: string): Promise<CollabRoom> {
  const { data, error } = await supabaseAdmin
    .from('collab_rooms')
    .insert({ name, owner_id: ownerId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CollabRoom
}

export async function getRoom(roomId: string): Promise<CollabRoom | null> {
  const { data } = await supabaseAdmin
    .from('collab_rooms')
    .select()
    .eq('id', roomId)
    .eq('is_active', true)
    .single()
  return (data as CollabRoom) ?? null
}

// ── Members ────────────────────────────────────────────────────────────────────

export async function upsertMember(roomId: string, userId: string, displayName: string): Promise<void> {
  await supabaseAdmin.from('collab_members').upsert(
    { room_id: roomId, user_id: userId, display_name: displayName, last_seen_at: new Date().toISOString() },
    { onConflict: 'room_id,user_id' }
  )
}

export async function touchMember(roomId: string, userId: string): Promise<void> {
  await supabaseAdmin
    .from('collab_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId)
}

/** Members seen in the last 30 seconds */
export async function getOnlineMembers(roomId: string): Promise<CollabMember[]> {
  const since = new Date(Date.now() - 30_000).toISOString()
  const { data } = await supabaseAdmin
    .from('collab_members')
    .select()
    .eq('room_id', roomId)
    .gte('last_seen_at', since)
    .order('joined_at')
  return (data as CollabMember[]) ?? []
}

// ── Messages ───────────────────────────────────────────────────────────────────

export async function insertMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  role: 'user' | 'assistant',
  content: string,
  modelId?: string
): Promise<CollabMessage> {
  const { data, error } = await supabaseAdmin
    .from('collab_messages')
    .insert({ room_id: roomId, sender_id: senderId, sender_name: senderName, role, content, model_id: modelId ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CollabMessage
}

export async function getMessagesSince(roomId: string, since: string): Promise<CollabMessage[]> {
  const { data } = await supabaseAdmin
    .from('collab_messages')
    .select()
    .eq('room_id', roomId)
    .gt('created_at', since)
    .order('created_at')
    .limit(50)
  return (data as CollabMessage[]) ?? []
}
