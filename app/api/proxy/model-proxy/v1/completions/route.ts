import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from '@/lib/models'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FIM_MODEL = 'deepseek-chat'
const FIM_API_URL = 'https://api.deepseek.com/completions'

const planCache = new Map<string, { plan: PlanId; expiresAt: number }>()
const usageCache = new Map<string, { total: number; expiresAt: number }>()

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

async function checkFimLimit(userId: string, plan: PlanId): Promise<string | null> {
  const planLimit = PLANS[plan]?.tokensPerMonth ?? 1000
  if (planLimit <= 0) return null

  const cached = usageCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.total >= planLimit) return planLimit.toString()
    return null
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data } = await supabase
    .from('usage_sessions')
    .select('tokens_input, tokens_total')
    .gte('started_at', startOfMonth)
    .eq('user_id', userId)

  const usage = (data ?? []).reduce((sum, row) => sum + (row.tokens_total ?? row.tokens_input ?? 0), 0)
  usageCache.set(userId, { total: usage, expiresAt: Date.now() + 60_000 })

  if (usage >= planLimit) return planLimit.toString()
  return null
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
    const { model, prompt, suffix, max_tokens = 256, temperature = 0, stop = ['\n\n'], stream = false } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })
    }

    if (model !== FIM_MODEL) {
      return NextResponse.json({ error: `FIM non supporté pour le modèle ${model}` }, { status: 400 })
    }

    const userPlan = await getUserPlan(userId)
    const limitReached = await checkFimLimit(userId, userPlan)
    if (limitReached) {
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const retryAfter = Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000)

      return NextResponse.json({
        error: `Limite de tokens mensuelle atteinte (${limitReached} tokens). Passez au plan supérieur pour continuer à utiliser Nexora.`,
        code: 'MONTHLY_LIMIT_REACHED',
        plan: userPlan,
        limit: Number(limitReached),
        retry_after: retryAfter,
      }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API DeepSeek non configurée' }, { status: 500 })
    }

    const fimBody: Record<string, any> = {
      model: 'deepseek-chat',
      prompt,
      max_tokens,
      temperature,
      stop,
      stream,
    }
    if (suffix) fimBody.suffix = suffix

    const aiResponse = await fetch(FIM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(fimBody),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      if (aiResponse.status === 429) {
        const retryAfter = aiResponse.headers.get('retry-after') || '60'
        return NextResponse.json(
          { error: 'Upstream rate limit exceeded', retry_after: parseInt(retryAfter) },
          { status: 429, headers: { 'Retry-After': retryAfter } }
        )
      }
      return NextResponse.json({ error: errorText }, { status: aiResponse.status })
    }

    void supabase.from('usage_sessions').insert({
      user_id: userId,
      session_type: 'fim',
      model_id: FIM_MODEL,
      metadata: { tokens: max_tokens },
    })

    if (stream) {
      const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      })
      return new NextResponse(aiResponse.body, { headers })
    }

    const data = await aiResponse.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('fim proxy error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
