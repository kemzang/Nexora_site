import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { userId, state } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 })
    }

    // Clean up previously expired or unused auth codes for this user
    // This prevents accumulation of stale codes in the api_keys table
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())
      .containedBy('permissions', { auth_code: true, temporary: true })

    const raw = `${userId}_${Date.now()}_${Math.random()}`
    const hash = await sha256(raw)
    const code = `nxr_auth_${Date.now()}_${hash.slice(0, 16)}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: 'VS Code Auth Code (temporaire)',
        key_prefix: code.slice(0, 10),
        key_hash: await sha256(code),
        permissions: { auth_code: true, temporary: true },
        rate_limit_per_minute: 1,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {
      console.error('Erreur création auth code:', error)
      return NextResponse.json({ error: 'Erreur création code' }, { status: 500 })
    }

    return NextResponse.json({ success: true, code, expiresAt: expiresAt.toISOString(), state })
  } catch (err) {
    console.error('Generate auth code error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
