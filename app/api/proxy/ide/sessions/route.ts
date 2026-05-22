/**
 * Session history sync endpoint.
 *
 * Required Supabase table (run once in SQL editor):
 * ────────────────────────────────────────────────
 * CREATE TABLE chat_sessions (
 *   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   session_id   TEXT NOT NULL,            -- extension-local session UUID
 *   title        TEXT NOT NULL DEFAULT 'New session',
 *   messages     JSONB NOT NULL DEFAULT '[]',
 *   model_id     TEXT,
 *   message_count INTEGER NOT NULL DEFAULT 0,
 *   created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   UNIQUE (user_id, session_id)
 * );
 * CREATE INDEX ON chat_sessions (user_id, updated_at DESC);
 * ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "users own their sessions" ON chat_sessions
 *   FOR ALL USING (auth.uid() = user_id);
 * ────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_SESSIONS = 100  // never return more than this
const MAX_MESSAGES_PER_SESSION = 500
const MAX_BODY_BYTES = 2 * 1024 * 1024  // 2 MB per upsert

// ── GET — list recent sessions ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await verifyToken(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), MAX_SESSIONS)
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('session_id, title, model_id, message_count, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[sessions GET]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ sessions: data ?? [] })
}

// ── POST — upsert a session ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await verifyToken(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Basic size guard before parsing JSON
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, title, messages, model_id } = body
  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
  }

  // Trim to max messages and strip large content to save space
  const trimmedMessages = messages
    .slice(-MAX_MESSAGES_PER_SESSION)
    .map((m: any) => {
      const content = typeof m.content === 'string' ? m.content.slice(0, 10_000) : m.content
      return { role: m.role, content }
    })

  const { error } = await supabase
    .from('chat_sessions')
    .upsert(
      {
        user_id: userId,
        session_id,
        title: String(title ?? 'New session').slice(0, 200),
        messages: trimmedMessages,
        model_id: model_id ? String(model_id).slice(0, 100) : null,
        message_count: trimmedMessages.length,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_id' }
    )

  if (error) {
    console.error('[sessions POST]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ── DELETE — remove a session ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await verifyToken(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id } = await req.json().catch(() => ({}))
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', session_id)

  if (error) {
    console.error('[sessions DELETE]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
