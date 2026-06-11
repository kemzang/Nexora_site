import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { generateApiKey, apiKeyExpiresAt } from '@/lib/api-keys'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// Service-role client : l'insertion se fait côté serveur (contourne le RLS et
// les soucis de session/env du navigateur). La clé est générée ici, jamais par
// le client — le navigateur ne fait que demander et recevoir la clé une fois.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Authentifie l'appelant via sa session Supabase (jeton Bearer).
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const sessionToken = authHeader.split(' ')[1]
    const userId = await verifyToken(sessionToken)
    if (!userId) {
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const rawName = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!rawName) {
      return NextResponse.json({ error: 'Le nom de la clé est requis' }, { status: 400 })
    }
    const name = rawName.slice(0, 100)

    // Génération sécurisée (CSPRNG) + expiration, côté serveur.
    const token = generateApiKey()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_prefix: token.slice(0, 10), // colonne VARCHAR(10)
        key_hash: createHash('sha256').update(token).digest('hex'),
        permissions: { chat: true, completion: true, generation: true },
        rate_limit_per_minute: 60,
        is_active: true,
        expires_at: apiKeyExpiresAt(),
      })
      .select(
        'id, name, key_prefix, is_active, last_used_at, created_at, rate_limit_per_minute, expires_at, permissions'
      )
      .single()

    if (error) {
      console.error('Erreur création clé:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la clé' },
        { status: 500 }
      )
    }

    // La clé complète (`token`) n'est renvoyée qu'ici, une seule fois.
    return NextResponse.json({ success: true, token, key: data })
  } catch (err) {
    console.error('Create key error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
