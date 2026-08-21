import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateAuthCode } from '@/lib/api-keys'

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
    // L'identite vient du jeton, JAMAIS du corps de la requete. Cette route
    // acceptait auparavant un userId arbitraire et emettait un code valide pour
    // lui : n'importe qui connaissant un identifiant pouvait obtenir un code,
    // l'echanger contre un jeton et prendre le controle du compte.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const accessToken = authHeader.slice('Bearer '.length)
    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken)
    const userId = authData?.user?.id
    if (authError || !userId) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const { state } = await req.json().catch(() => ({ state: undefined }))

    // Clean up previously expired or unused auth codes for this user
    // This prevents accumulation of stale codes in the api_keys table
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())
      .containedBy('permissions', { auth_code: true, temporary: true })

    const code = generateAuthCode()
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
