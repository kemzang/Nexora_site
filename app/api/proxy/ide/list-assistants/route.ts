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

  // vision = true → la capacité uploadImage est déclarée explicitement, ce que
  // l'extension lit en priorité pour autoriser l'envoi d'images (sinon bloqué).
  function m(name: string, model: string, vision = false, provider = 'openai') {
    const base = { name, model, provider, apiBase, apiKey: token }
    return vision ? { ...base, capabilities: { uploadImage: true } } : base
  }

  const deepseek    = m('Nexora DeepSeek V3',      'deepseek-chat')           // pas de vision
  const geminiFlash = m('Nexora Gemini Flash',      'gemini-flash',    true)
  const geminiPro   = m('Nexora Gemini Pro',        'gemini-pro',      true)
  const haiku       = m('Nexora Claude Haiku',      'claude-haiku',    true)
  const grok        = m('Nexora Grok 2',            'grok-2')                  // grok-2 texte : pas de vision
  const sonnet      = m('Nexora Claude Sonnet',     'claude-sonnet',   true)
  const opus        = m('Nexora Claude Opus',       'claude-opus',     true)
  const gpt5        = m('Nexora GPT-5',             'gpt-5',           true)

  // L'extension prend le 1er modèle de la liste comme défaut → on met le MEILLEUR
  // modèle (rapport qualité/coût) accessible au plan en tête. DeepSeek reste
  // disponible (en fin de liste) pour qui veut économiser ses crédits, et sert
  // toujours d'autocomplétion (FIM rapide et peu coûteux).
  switch (plan) {
    case 'starter':
      // Gemini Flash par défaut (capable, multimodal, peu cher)
      return { models: [geminiFlash, geminiPro, deepseek], autocomplete: deepseek }
    case 'pro':
      // Gemini Pro par défaut (très capable, bon rapport ×10)
      return { models: [geminiPro, haiku, geminiFlash, grok, deepseek], autocomplete: deepseek }
    case 'business':
      // Claude Sonnet par défaut (excellent pour l'agent / le code)
      return { models: [sonnet, geminiPro, haiku, geminiFlash, grok, deepseek], autocomplete: deepseek }
    case 'enterprise':
      // Claude Sonnet par défaut ; Opus / GPT-5 disponibles pour le maximum
      return { models: [sonnet, opus, gpt5, geminiPro, haiku, geminiFlash, grok, deepseek], autocomplete: deepseek }
    default: // free
      // Gemini Flash par défaut au lieu de DeepSeek → bien meilleure 1re impression
      return { models: [geminiFlash, deepseek], autocomplete: deepseek }
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
      // Exclut les abonnements expirés (forfaits test 7/14j, ou tout plan échu).
      .gt('current_period_end', new Date().toISOString())
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
        `  - name: ${m.name}\n    model: ${m.model}\n    provider: ${m.provider}\n    apiBase: ${m.apiBase}` +
        ((m as { capabilities?: { uploadImage?: boolean } }).capabilities?.uploadImage
          ? `\n    capabilities:\n      uploadImage: true`
          : '')
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
