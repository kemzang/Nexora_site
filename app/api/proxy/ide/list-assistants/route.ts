import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-verify'
import { type PlanId } from '@/lib/models'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-mu-henna.vercel.app'

// Maps a plan to the models that will appear in the Continue IDE config.
// Model IDs MUST match the keys in API_ROUTES inside chat/completions/route.ts.
function getAssistantConfig(plan: PlanId, token: string) {
  const apiBase = `${BASE_URL}/api/proxy/model-proxy`

  function model(id: string, title: string) {
    return { title, provider: 'openai', model: id, apiBase, apiKey: token }
  }

  const deepseek   = model('deepseek-chat',    'Nexora DeepSeek V3')
  const geminiFlash = model('gemini-flash',    'Nexora Gemini Flash')
  const geminiPro  = model('gemini-pro',       'Nexora Gemini Pro')
  const haiku      = model('claude-haiku',     'Nexora Claude Haiku')
  const grok       = model('grok-2',           'Nexora Grok 2')
  const sonnet     = model('claude-sonnet',    'Nexora Claude Sonnet')
  const opus       = model('claude-opus',      'Nexora Claude Opus')
  const gpt5       = model('gpt-5',            'Nexora GPT-5')

  switch (plan) {
    case 'neo':
      return { models: [deepseek, geminiFlash, geminiPro], autocomplete: deepseek }
    case 'pro':
      return { models: [deepseek, geminiFlash, geminiPro, haiku, grok], autocomplete: deepseek }
    case 'business':
      return { models: [deepseek, geminiFlash, geminiPro, haiku, grok, sonnet], autocomplete: deepseek }
    case 'enterprise':
      return { models: [deepseek, geminiFlash, geminiPro, haiku, grok, sonnet, opus, gpt5], autocomplete: deepseek }
    default: // free
      return { models: [deepseek, geminiFlash], autocomplete: deepseek }
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_plans!inner(slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    const planSlug = ((subscription?.subscription_plans as { slug?: string } | null)?.slug ?? 'free') as PlanId
    const { models, autocomplete } = getAssistantConfig(planSlug, token)

    return NextResponse.json([
      {
        id: 'nexora-assistant',
        name: 'Nexora AI',
        description: `Assistant IA Nexora — Plan ${planSlug}`,
        slug: 'nexora/nexora-assistant',
        iconUrl: null,
        configJson: JSON.stringify({
          name: 'Nexora AI',
          models,
          tabAutocompleteModel: autocomplete,
        }),
        ownerType: 'organization',
        ownerSlug: 'nexora',
      },
    ])
  } catch (err) {
    console.error('[list-assistants] error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
