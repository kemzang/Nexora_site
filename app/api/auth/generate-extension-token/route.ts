import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Require a valid session — the token is issued for the authenticated caller only.
    // We deliberately ignore any userId sent in the body to prevent privilege escalation.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionToken = authHeader.split(' ')[1]
    const userId = await verifyToken(sessionToken)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revoke any existing active extension tokens for this user so only one exists at a time
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('name', 'Extension VS Code')
      .eq('is_active', true)

    // Generate a new signed token
    const rawSecret = `${userId}_${Date.now()}_${Math.random()}`
    const token = `nxr_${createHash('sha256').update(rawSecret).digest('hex').slice(0, 40)}`

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: 'Extension VS Code',
        key_prefix: token.slice(0, 10),
        key_hash: createHash('sha256').update(token).digest('hex'),
        permissions: { chat: true, completion: true, generation: true },
        rate_limit_per_minute: 60,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erreur création API key:', error)
      return NextResponse.json({ error: 'Erreur création token' }, { status: 500 })
    }

    return NextResponse.json({ success: true, token, keyId: data.id })
  } catch (err) {
    console.error('Generate token error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
