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

    // Retourner l'assistant Nexora au format Continue Hub
    const assistants = [
      {
        id: 'nexora-assistant',
        name: 'Nexora AI',
        description: 'Assistant IA Nexora pour VS Code',
        slug: 'nexora/nexora-assistant',
        iconUrl: null,
        configJson: JSON.stringify({
          name: 'Nexora AI',
          models: [
            {
              title: 'Nexora AI',
              provider: 'openai',
              model: 'gpt-4o',
              apiBase: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-mu-henna.vercel.app'}/api/proxy/model-proxy`,
              apiKey: token, // On passe le token comme apiKey pour l'authentification
            }
          ],
          tabAutocompleteModel: {
            title: 'Nexora Autocomplete',
            provider: 'openai',
            model: 'gpt-4o-mini',
            apiBase: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-mu-henna.vercel.app'}/api/proxy/model-proxy`,
            apiKey: token,
          }
        }),
        ownerType: 'organization',
        ownerSlug: 'nexora',
      }
    ]

    return NextResponse.json(assistants)
  } catch (err) {
    console.error('list-assistants error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
