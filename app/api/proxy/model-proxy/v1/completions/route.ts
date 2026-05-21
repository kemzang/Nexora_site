import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from '@/lib/models'
import type { FimModelId } from '@/lib/modelRouter'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const planCache = new Map<string, { plan: PlanId; expiresAt: number }>()
const usageCache = new Map<string, { total: number; expiresAt: number }>()

// DeepSeek supports /completions (FIM) only via beta endpoint
// Other models (Gemini, GPT) also support FIM in various forms
const FIM_ROUTES: Partial<Record<FimModelId, { url: string; keyEnv: string }>> = {
  'deepseek-chat': {
    url: 'https://api.deepseek.com/beta/completions', // MUST use /beta for FIM
    keyEnv: 'DEEPSEEK_API_KEY',
  },
  'gpt-5': {
    url: 'https://api.openai.com/v1/completions',
    keyEnv: 'OPENAI_API_KEY',
  },
}

const FIM_PLAN_MIN: Record<FimModelId, PlanId> = {
  'deepseek-chat': 'free',
  'gpt-5': 'enterprise',
}

const PLAN_ORDER: PlanId[] = ['free', 'neo', 'pro', 'business', 'enterprise']

function planGte(a: PlanId, b: PlanId): boolean {
  return PLAN_ORDER.indexOf(a) >= PLAN_ORDER.indexOf(b)
}

async function getUserPlan(userId: string): Promise<PlanId> {
  const cached = planCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.plan
  const { data } = await supabase
    .from('user_subscriptions')
    .select('subscription_plans!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  const plan = (data?.subscription_plans as any)?.slug as PlanId || 'free'
  planCache.set(userId, { plan, expiresAt: Date.now() + 300_000 })
  return plan
}

async function checkMonthlyLimit(userId: string, plan: PlanId): Promise<string | null> {
  const planLimit = PLANS[plan]?.tokensPerMonth ?? 1000
  if (planLimit <= 0) return null
  const cached = usageCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.total >= planLimit ? planLimit.toString() : null
  }
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data } = await supabase
    .from('usage_sessions')
    .select('tokens_input, tokens_total')
    .gte('started_at', startOfMonth)
    .eq('user_id', userId)
  const usage = (data ?? []).reduce((s, r) => s + (r.tokens_total ?? r.tokens_input ?? 0), 0)
  usageCache.set(userId, { total: usage, expiresAt: Date.now() + 60_000 })
  return usage >= planLimit ? planLimit.toString() : null
}

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const {
      model = 'deepseek-chat',
      prompt,
      suffix,
      max_tokens = 256,
      temperature = 0,
      stop = ['\n\n'],
      stream = false,
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const fimRoute = FIM_ROUTES[model as FimModelId]
    if (!fimRoute) {
      return NextResponse.json(
        { error: `FIM not supported for model "${model}". Supported: ${Object.keys(FIM_ROUTES).join(', ')}` },
        { status: 400 }
      )
    }

    const userPlan = await getUserPlan(userId)
    const minPlan = FIM_PLAN_MIN[model as FimModelId] || 'free'
    if (!planGte(userPlan, minPlan)) {
      return NextResponse.json(
        { error: `Model "${model}" requires ${minPlan} plan or higher. Current plan: ${userPlan}` },
        { status: 403 }
      )
    }

    const limitReached = await checkMonthlyLimit(userId, userPlan)
    if (limitReached) {
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      const retryAfter = Math.ceil((endOfMonth.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        { error: `Monthly token limit reached (${limitReached}). Upgrade your plan.`, code: 'MONTHLY_LIMIT_REACHED', plan: userPlan, retry_after: retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const apiKey = process.env[fimRoute.keyEnv]
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const fimBody: Record<string, unknown> = {
      model,
      prompt,
      max_tokens,
      temperature,
      stop,
      stream,
    }
    if (suffix !== undefined) fimBody.suffix = suffix

    const upstream = await fetch(fimRoute.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(fimBody),
    })

    if (!upstream.ok) {
      const errorText = await upstream.text()
      if (upstream.status === 429) {
        const retryAfter = upstream.headers.get('retry-after') || '60'
        return NextResponse.json(
          { error: 'Upstream rate limit exceeded', retry_after: parseInt(retryAfter) },
          { status: 429, headers: { 'Retry-After': retryAfter } }
        )
      }
      console.error(`FIM upstream error [${upstream.status}]:`, errorText)
      return NextResponse.json({ error: errorText }, { status: upstream.status })
    }

    void supabase.from('usage_sessions').insert({
      user_id: userId,
      session_type: 'fim',
      model_id: model,
      tokens_input: Math.ceil(prompt.length / 4),
      metadata: { model, max_tokens },
    })

    if (stream) {
      return new NextResponse(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('completions proxy error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
