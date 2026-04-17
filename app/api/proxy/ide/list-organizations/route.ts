import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Retourner l'organisation au format Continue Hub
    const organizations = [
      {
        id: user.id,
        name: profile?.display_name || user.email?.split('@')[0] || 'Utilisateur',
        slug: 'nexora',
        iconUrl: profile?.avatar_url || null,
        role: 'member',
      }
    ]

    return NextResponse.json(organizations)
  } catch (err) {
    console.error('list-organizations error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
