import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, state } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 })
    }

    // Générer un code d'autorisation temporaire (expire dans 10 minutes)
    const code = `nxr_auth_${Date.now()}_${createHash('sha256').update(`${userId}_${Date.now()}_${Math.random()}`).digest('hex').slice(0, 16)}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Stocker le code temporairement (tu peux utiliser une table séparée ou Redis en production)
    // Pour l'instant, on utilise la table api_keys avec un flag spécial
    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: 'VS Code Auth Code (temporaire)',
        key_prefix: code.slice(0, 10), // Limité à 10 caractères selon le schéma
        key_hash: createHash('sha256').update(code).digest('hex'),
        permissions: { auth_code: true, temporary: true },
        rate_limit_per_minute: 1,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {
      console.error('Erreur création auth code:', error)
      return NextResponse.json({ error: 'Erreur création code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      code,
      expiresAt: expiresAt.toISOString(),
      state 
    })
  } catch (err) {
    console.error('Generate auth code error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}