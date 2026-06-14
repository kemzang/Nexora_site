import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateApiKey, apiKeyExpiresAt } from '@/lib/api-keys'

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
    const { code, state } = await req.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    }

    const codeHash = await sha256(code)
    const { data: authCodeData, error: codeError } = await supabase
      .from('api_keys')
      .select('user_id, expires_at, is_active')
      .eq('key_hash', codeHash)
      .eq('is_active', true)
      .single()

    if (codeError || !authCodeData) {
      return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 })
    }

    if (new Date(authCodeData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 400 })
    }

    // Désactiver le code (usage unique)
    await supabase.from('api_keys').update({ is_active: false }).eq('key_hash', codeHash)

    // Générer le token d'accès (CSPRNG, 160 bits d'entropie réelle)
    const accessToken = generateApiKey()

    // Évite l'accumulation : chaque login OAuth générait une nouvelle clé
    // "Extension VS Code". On supprime les anciennes de cet utilisateur avant
    // d'en créer une nouvelle → une seule clé d'extension à la fois.
    await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', authCodeData.user_id)
      .eq('name', 'Extension VS Code')

    const { error: tokenError } = await supabase
      .from('api_keys')
      .insert({
        user_id: authCodeData.user_id,
        name: 'Extension VS Code',
        key_prefix: accessToken.slice(0, 10),
        key_hash: await sha256(accessToken),
        permissions: { chat: true, completion: true, generation: true },
        rate_limit_per_minute: 60,
        is_active: true,
        expires_at: apiKeyExpiresAt(),
      })

    if (tokenError) {
      return NextResponse.json({ error: 'Erreur création token' }, { status: 500 })
    }

    const { data: userData } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', authCodeData.user_id)
      .single()

    return NextResponse.json({ 
      success: true, 
      access_token: accessToken,
      token_type: 'Bearer',
      user: { id: authCodeData.user_id, name: userData?.display_name || 'Utilisateur' },
      state 
    })
  } catch (err) {
    console.error('Exchange code error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
