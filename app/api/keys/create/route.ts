import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { generateApiKey, apiKeyExpiresAt } from '@/lib/api-keys'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { z } from 'zod'
import { captureServerError } from '@/lib/sentry'

// Service-role client : l'insertion se fait côté serveur (contourne le RLS et
// les soucis de session/env du navigateur). La clé est générée ici, jamais par
// le client — le navigateur ne fait que demander et recevoir la clé une fois.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const createKeySchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la clé est requis').max(100),
})

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
    const parsed = createKeySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.name?.[0] ?? 'Requête invalide' },
        { status: 400 },
      )
    }
    const { name } = parsed.data

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
      captureServerError(error, { route: 'keys/create', userId })
      return NextResponse.json(
        { error: 'Erreur lors de la création de la clé' },
        { status: 500 }
      )
    }

    // La clé complète (`token`) n'est renvoyée qu'ici, une seule fois.
    return NextResponse.json({ success: true, token, key: data })
  } catch (err) {
    console.error('Create key error:', err)
    captureServerError(err, { route: 'keys/create' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
