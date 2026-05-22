/**
 * Legacy chat proxy — kept for backward compatibility with older extension versions.
 * New clients should use /api/proxy/model-proxy/v1/chat/completions which has richer
 * plan-based routing, model selection, and usage tracking.
 *
 * This route mirrors the same auth + plan logic as the main proxy to stay consistent.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from '@/lib/models'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const planCache = new Map<string, { plan: PlanId; expiresAt: number }>()

async function getUserPlan(userId: string): Promise<PlanId> {
  const cached = planCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.plan

  const { data } = await supabase
    .from('user_subscriptions')
    .select('subscription_plans!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const plan = ((data?.subscription_plans as { slug?: string } | null)?.slug ?? 'free') as PlanId
  planCache.set(userId, { plan, expiresAt: Date.now() + 300_000 })
  return plan
}

const PROVIDER_ROUTES: Record<string, { url: string; keyEnv: string }> = {
  openai:   { url: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY' },
  deepseek: { url: 'https://api.deepseek.com/v1/chat/completions', keyEnv: 'DEEPSEEK_API_KEY' },
}

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  openai:   'gpt-4o',
  deepseek: 'deepseek-chat',
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Input validation ────────────────────────────────────────────────────
    const body = await req.json()
    const { messages, model, provider = 'openai' } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages requis et doit être un tableau non vide' }, { status: 400 })
    }

    if (!PROVIDER_ROUTES[provider]) {
      return NextResponse.json(
        { error: `Provider inconnu: "${provider}". Valeurs acceptées: ${Object.keys(PROVIDER_ROUTES).join(', ')}` },
        { status: 400 }
      )
    }

    // ── Plan check (free users are allowed — they have a monthly token quota) ──
    const userPlan = await getUserPlan(userId)
    const planConfig = PLANS[userPlan]

    // Block only if the plan has 0 token allowance (edge case)
    if (planConfig && planConfig.tokensPerMonth === 0) {
      return NextResponse.json(
        { error: 'Votre plan ne permet pas d\'utiliser le chat IA. Passez au plan Free ou supérieur.' },
        { status: 403 }
      )
    }

    // ── Call upstream ───────────────────────────────────────────────────────
    const route = PROVIDER_ROUTES[provider]
    const apiKey = process.env[route.keyEnv]
    if (!apiKey) {
      return NextResponse.json({ error: `Clé API ${provider} non configurée sur le serveur` }, { status: 500 })
    }

    const selectedModel = model || PROVIDER_DEFAULT_MODELS[provider]

    const aiResponse = await fetch(route.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: selectedModel, messages, stream: true }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({ error: 'Erreur fournisseur IA' }))
      return NextResponse.json(errorData, { status: aiResponse.status })
    }

    // Fire-and-forget usage tracking
    void supabase.from('usage_sessions').insert({
      user_id: userId,
      session_type: 'chat_proxy_legacy',
      model_id: null,
      metadata: { model: selectedModel, provider, messages_count: messages.length, plan: userPlan },
    })

    return new NextResponse(aiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[legacy chat proxy] error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
