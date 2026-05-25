/**
 * Returns the assistant config consumed by the Nexora extension's PlatformProfileLoader.
 * The response shape MUST match what ControlPlaneClient.listAssistants() expects:
 *
 *   { configResult: { config: AssistantUnrolled; errors: [] }; ownerSlug; packageSlug; iconUrl; rawYaml }[]
 *
 * Any deviation from this shape causes the extension to silently load no cloud models.
 */
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

// Each model entry becomes a ModelConfig (AssistantUnrolled.models[]).
// provider: 'openai' covers all OpenAI-compatible APIs (DeepSeek, Grok, etc.).
function buildModels(plan: PlanId, token: string) {
  const apiBase = `${BASE_URL}/api/proxy/model-proxy`

  function m(name: string, model: string, provider = 'openai') {
    return { name, model, provider, apiBase, apiKey: token }
  }

  const deepseek    = m('Nexora DeepSeek V3',      'deepseek-chat')
  const geminiFlash = m('Nexora Gemini Flash',      'gemini-flash',    'openai')
  const geminiPro   = m('Nexora Gemini Pro',        'gemini-pro',      'openai')
  const haiku       = m('Nexora Claude Haiku',      'claude-haiku',    'openai')
  const grok        = m('Nexora Grok 2',            'grok-2',          'openai')
  const sonnet      = m('Nexora Claude Sonnet',     'claude-sonnet',   'openai')
  const opus        = m('Nexora Claude Opus',       'claude-opus',     'openai')
  const gpt5        = m('Nexora GPT-5',             'gpt-5',           'openai')

  switch (plan) {
    case 'starter':
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

    const plan = ((subscription?.subscription_plans as { slug?: string } | null)?.slug ?? 'free') as PlanId
    const { models, autocomplete } = buildModels(plan, token)

    // AssistantUnrolled shape expected by PlatformProfileLoader
    const assistantConfig = {
      name: 'Nexora AI',
      version: '1.0.0',
      schema: 'v1',
      models,
      tabAutocompleteModel: autocomplete,
      context: [],
    }

    const rawYaml = [
      `name: Nexora AI`,
      `version: 1.0.0`,
      `schema: v1`,
      `models:`,
      ...models.map(m =>
        `  - name: ${m.name}\n    model: ${m.model}\n    provider: ${m.provider}\n    apiBase: ${m.apiBase}`
      ),
    ].join('\n')

    // Return the shape that ControlPlaneClient.listAssistants() destructures
    return NextResponse.json([
      {
        configResult: {
          config: assistantConfig,
          errors: [],
        },
        ownerSlug: 'nexora',
        packageSlug: 'nexora-assistant',
        iconUrl: null,
        rawYaml,
      },
    ])
  } catch (err) {
    console.error('[list-assistants] error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
