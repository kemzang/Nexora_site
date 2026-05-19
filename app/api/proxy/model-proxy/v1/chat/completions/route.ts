import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { selectBestModel, estimateTokens, PLANS, type ModelId, type PlanId } from '@/lib/models'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const planCache = new Map<string, { plan: PlanId; expiresAt: number }>()

const MAX_TOKENS_PER_PLAN: Record<PlanId, number> = {
  free: 1024,
  neo: 2048,
  pro: 4096,
  business: 8192,
  enterprise: 16384,
}

const usageCache = new Map<string, { total: number; expiresAt: number }>()

async function checkMonthlyLimit(userId: string, plan: PlanId): Promise<string | null> {
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

const API_ROUTES: Record<string, { baseUrl: string; keyEnv: string; format: 'openai' | 'anthropic' | 'gemini' }> = {
  'deepseek-chat': { baseUrl: 'https://api.deepseek.com/chat/completions', keyEnv: 'DEEPSEEK_API_KEY', format: 'openai' },
  'gemini-flash': { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', keyEnv: 'GEMINI_API_KEY', format: 'gemini' },
  'gemini-pro': { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', keyEnv: 'GEMINI_API_KEY', format: 'gemini' },
  'claude-haiku': { baseUrl: 'https://api.anthropic.com/v1/messages', keyEnv: 'ANTHROPIC_API_KEY', format: 'anthropic' },
  'grok-2': { baseUrl: 'https://api.x.ai/v1/chat/completions', keyEnv: 'XAI_API_KEY', format: 'openai' },
  'claude-sonnet': { baseUrl: 'https://api.anthropic.com/v1/messages', keyEnv: 'ANTHROPIC_API_KEY', format: 'anthropic' },
  'gpt-5': { baseUrl: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY', format: 'openai' },
  'claude-opus': { baseUrl: 'https://api.anthropic.com/v1/messages', keyEnv: 'ANTHROPIC_API_KEY', format: 'anthropic' },
}

function callAPI(route: typeof API_ROUTES[string], apiKey: string, body: any, modelId: string): Promise<Response> {
  if (route.format === 'openai') {
    return fetch(route.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })
  }

  if (route.format === 'anthropic') {
    const sys = body.messages.filter((m: any) => m.role === 'system')
    const msgs = body.messages.filter((m: any) => m.role !== 'system')
    return fetch(route.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        system: sys.length > 0 ? sys.map((m: any) => ({ type: 'text', text: m.content })) : undefined,
        messages: msgs.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        stream: body.stream,
      }),
    })
  }

  if (route.format === 'gemini') {
    const contents = body.messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const modelPath = modelId === 'gemini-flash' ? 'gemini-2.0-flash' : 'gemini-2.0-pro'
    return fetch(`${route.baseUrl}/models/${modelPath}:generateContent${body.stream ? '?alt=sse' : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents, generationConfig: { temperature: body.temperature ?? 0.7, maxOutputTokens: body.max_tokens ?? 4096 } }),
    })
  }

  throw new Error('unknown format')
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const [userId, body] = await Promise.all([
      verifyToken(token),
      req.json(),
    ])

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, model: preferredModel, stream = true, ...rest } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    const userPlan = await getUserPlan(userId)

    const limitReached = await checkMonthlyLimit(userId, userPlan)
    if (limitReached) {
      // Seconds until end of current month
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

    const { model: selectedModel, complexity, downgraded } = selectBestModel(userPlan, preferredModel as ModelId, messages)

    const route = API_ROUTES[selectedModel.id]
    if (!route) {
      return NextResponse.json({ error: `Modèle ${selectedModel.id} non configuré` }, { status: 500 })
    }

    const apiKey = process.env[route.keyEnv]
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API serveur non configurée' }, { status: 500 })
    }

    const maxTokens = MAX_TOKENS_PER_PLAN[userPlan] ?? 4096

    const aiResponse = await callAPI(route, apiKey, {
      model: selectedModel.apiIdentifier,
      messages,
      stream,
      ...rest,
      max_tokens: Math.min(rest.max_tokens ?? maxTokens, maxTokens),
    }, selectedModel.apiIdentifier)

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      const responseHeaders: Record<string, string> = {}

      if (aiResponse.status === 429) {
        const upstreamRetryAfter = aiResponse.headers.get('retry-after') || aiResponse.headers.get('x-ratelimit-reset-requests') || '60'
        responseHeaders['Retry-After'] = upstreamRetryAfter
        return NextResponse.json(
          { error: 'Upstream rate limit exceeded', retry_after: parseInt(upstreamRetryAfter), details: errorText },
          { status: 429, headers: responseHeaders }
        )
      }

      return NextResponse.json({ error: errorText }, { status: aiResponse.status })
    }

    void supabase.from('usage_sessions').insert({
      user_id: userId,
      session_type: 'chat_proxy',
      model_id: null,
      tokens_input: estimateTokens(messages),
      metadata: { plan: userPlan, model: selectedModel.id, preferred: preferredModel || null, complexity, downgraded },
    })

    const headers = new Headers({
      'Content-Type': aiResponse.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Model-Used': selectedModel.id,
      'X-Model-Downgraded': String(downgraded),
      'X-Complexity': String(complexity),
    })

    return new NextResponse(aiResponse.body, { headers })
  } catch (err) {
    console.error('model-proxy error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
