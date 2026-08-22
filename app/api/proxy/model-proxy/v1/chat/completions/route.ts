import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { selectBestModel, hasImageContent, estimateTokens, getEffectiveTokenLimit, computeCreditsConsumed, type ModelId, type PlanId } from '@/lib/models'
import { cacheGet, cacheSet } from '@/lib/upstash-cache'

export const runtime = 'nodejs'

// Duree max de la fonction. 60 s est le plafond du plan Vercel Hobby, donc
// cette valeur se deploie sur tous les plans. Sur un plan Pro, elle peut etre
// montee jusqu'a 300 pour les generations tres longues.
// Streaming LLM : la generation depasse tres largement le defaut Vercel
// (10-15 s selon le plan), qui coupait les reponses longues en plein milieu.
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Caches ───────────────────────────────────────────────────────────────────
// Deux niveaux : Map locale (rapide, mais isolée à l'instance serverless qui la
// détient) en L1, puis Upstash Redis (partagé entre TOUTES les instances) en
// L2 avant de retomber sur Supabase. Sous charge, Vercel répartit les requêtes
// entre plusieurs instances Node — sans L2, chacune revalidait indépendamment
// le plan/quota (jusqu'à 5 min de dérive entre instances). Si Upstash n'est pas
// configuré (UPSTASH_REDIS_REST_URL absent), cacheGet renvoie toujours null et
// on retombe exactement sur le comportement L1→Supabase d'origine.
//
// Ces Map vivent aussi longtemps que l'instance. Sans borne, une instance
// chaude qui voit passer beaucoup d'utilisateurs distincts les fait grossir
// indefiniment jusqu'a saturer la memoire de la fonction. BoundedTtlMap plafonne
// le nombre d'entrees et evince les plus anciennes : le cache reste un cache,
// pas une fuite.
const CACHE_MAX_ENTRIES = 5_000

class BoundedTtlMap<V extends { expiresAt: number }> {
  private map = new Map<string, V>()

  constructor(private readonly maxEntries = CACHE_MAX_ENTRIES) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key)
      return undefined
    }
    // Re-inserer marque l'entree comme recemment utilisee : Map preserve
    // l'ordre d'insertion, donc la plus ancienne cle est la premiere.
    this.map.delete(key)
    this.map.set(key, entry)
    return entry
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.maxEntries) {
      // Purge d'abord ce qui est expire ; si tout est encore valide, evince
      // l'entree la plus anciennement utilisee.
      const now = Date.now()
      for (const [k, v] of this.map) {
        if (v.expiresAt <= now) this.map.delete(k)
      }
      if (this.map.size >= this.maxEntries) {
        const oldest = this.map.keys().next()
        if (!oldest.done) this.map.delete(oldest.value)
      }
    }
    this.map.set(key, value)
  }
}

const planCache = new BoundedTtlMap<{ plan: PlanId; expiresAt: number }>()
const usageCache = new BoundedTtlMap<{ total: number; expiresAt: number }>()
const createdAtCache = new BoundedTtlMap<{
  createdAt: string
  expiresAt: number
}>()

/*
 * Plafond de tokens de SORTIE par requete.
 *
 * Le palier gratuit etait a 2048, en dessous des 4096 que l'extension demande :
 * chaque reponse etait donc tronquee, et une reponse coupee en plein milieu
 * d'une fonction rend du code syntaxiquement casse. L'utilisateur relance
 * alors sa demande — ce qui coute PLUS cher qu'une reponse complete du premier
 * coup, en plus de donner l'impression que le modele est mauvais.
 *
 * Un plafond bas n'economise donc rien : il transforme une requete utile en
 * deux requetes inutilisables. 4096 est le minimum viable pour de la
 * generation de code.
 */
const MAX_TOKENS_PER_PLAN: Record<PlanId, number> = {
  free: 4096,
  test1: 8192,
  test2: 8192,
  starter: 8192,
  pro: 16384,
  business: 32768,
  enterprise: 64000,
}

const API_ROUTES: Record<string, { baseUrl: string; keyEnv: string; format: 'openai' | 'anthropic' | 'gemini' }> = {
  'deepseek-chat':    { baseUrl: 'https://api.deepseek.com/v1/chat/completions',              keyEnv: 'DEEPSEEK_API_KEY',   format: 'openai'    },
  'deepseek-reasoner':{ baseUrl: 'https://api.deepseek.com/v1/chat/completions',              keyEnv: 'DEEPSEEK_API_KEY',   format: 'openai'    },
  'gemini-flash':     { baseUrl: 'https://generativelanguage.googleapis.com/v1beta',          keyEnv: 'GEMINI_API_KEY',     format: 'gemini'    },
  'gemini-pro':       { baseUrl: 'https://generativelanguage.googleapis.com/v1beta',          keyEnv: 'GEMINI_API_KEY',     format: 'gemini'    },
  'claude-haiku':     { baseUrl: 'https://api.anthropic.com/v1/messages',                     keyEnv: 'ANTHROPIC_API_KEY',  format: 'anthropic' },
  'claude-sonnet':    { baseUrl: 'https://api.anthropic.com/v1/messages',                     keyEnv: 'ANTHROPIC_API_KEY',  format: 'anthropic' },
  'claude-opus':      { baseUrl: 'https://api.anthropic.com/v1/messages',                     keyEnv: 'ANTHROPIC_API_KEY',  format: 'anthropic' },
}

// ── Usage tracking ───────────────────────────────────────────────────────────

interface UsageContext {
  userId: string
  plan: PlanId
  modelId: string
  inputTokens: number
  preferred: string | null
  complexity: number
  downgraded: boolean
}

/** Enregistre la consommation finale (entrée + sortie, pondérée par le crédit du modèle). */
async function recordUsage(ctx: UsageContext, outputTokens: number): Promise<void> {
  const credits = computeCreditsConsumed(ctx.modelId, ctx.inputTokens, outputTokens)
  try {
    await supabase.from('usage_sessions').insert({
      user_id: ctx.userId,
      // started_at explicite : le dashboard ET le quota filtrent par started_at >=
      // début du mois. Sans valeur (si la colonne n'a pas de défaut DB), les lignes
      // seraient exclues → conso affichée à 0 et quota jamais décompté.
      started_at: new Date().toISOString(),
      session_type: 'chat_proxy',
      model_id: ctx.modelId,
      tokens_input: ctx.inputTokens,
      tokens_output: outputTokens,
      tokens_total: credits, // crédits pondérés — c'est ce qui décompte le quota
      metadata: {
        plan: ctx.plan,
        model: ctx.modelId,
        preferred: ctx.preferred,
        complexity: ctx.complexity,
        downgraded: ctx.downgraded,
        creditMultiplier: credits / Math.max(1, ctx.inputTokens + outputTokens),
      },
    })
  } catch {
    // tracking best-effort — ne jamais casser la réponse
  }
}

/**
 * Wrappe un flux SSE OpenAI : laisse passer les chunks tels quels vers le client
 * tout en comptant le texte de sortie (delta.content), puis enregistre la conso.
 */
function trackOutputStream(
  body: ReadableStream<Uint8Array>,
  ctx: UsageContext,
): ReadableStream<Uint8Array> {
  let outputChars = 0
  const decoder = new TextDecoder()
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      try {
        const text = decoder.decode(chunk, { stream: true })
        for (const line of text.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const json = JSON.parse(payload)
            const delta = json?.choices?.[0]?.delta?.content
            if (typeof delta === 'string') outputChars += delta.length
          } catch {
            /* ligne SSE partielle — ignorée */
          }
        }
      } catch {
        /* ignore decode errors */
      }
      controller.enqueue(chunk)
    },
    async flush() {
      // IMPORTANT : on AWAIT l'enregistrement. En fire-and-forget (`void`), sur
      // Vercel la fonction peut être gelée avant la fin de l'insert → conso
      // perdue (compteur bloqué à 0). En awaitant, le flux reste ouvert tant que
      // l'insert n'est pas terminé → conso fiablement enregistrée.
      const outputTokens = Math.ceil(outputChars / 4)
      await recordUsage(ctx, outputTokens)
    },
  })
  return body.pipeThrough(transform)
}

// ── Plan helpers ─────────────────────────────────────────────────────────────
async function getUserPlan(userId: string): Promise<PlanId> {
  const cached = planCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.plan

  const shared = await cacheGet<PlanId>(`plan:${userId}`)
  if (shared) {
    planCache.set(userId, { plan: shared, expiresAt: Date.now() + 300_000 })
    return shared
  }

  const { data } = await supabase
    .from('user_subscriptions')
    .select('subscription_plans!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    // Exclut les abonnements expirés (forfaits test 7/14j, ou tout plan échu).
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()
  const plan = ((data?.subscription_plans as any)?.slug as PlanId) || 'free'
  planCache.set(userId, { plan, expiresAt: Date.now() + 300_000 })
  void cacheSet(`plan:${userId}`, plan, 300)
  return plan
}

async function getUserCreatedAt(userId: string): Promise<string | undefined> {
  const cached = createdAtCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.createdAt

  const shared = await cacheGet<string>(`created-at:${userId}`)
  if (shared) {
    createdAtCache.set(userId, { createdAt: shared, expiresAt: Date.now() + 3_600_000 })
    return shared
  }

  const { data } = await supabase.auth.admin.getUserById(userId)
  const createdAt = data?.user?.created_at
  if (createdAt) {
    createdAtCache.set(userId, { createdAt, expiresAt: Date.now() + 3_600_000 })
    void cacheSet(`created-at:${userId}`, createdAt, 3_600)
  }
  return createdAt
}

/**
 * Somme des crédits du mois. Passe par la fonction SQL get_monthly_usage
 * (migration 005) pour que l'agrégation se fasse dans Postgres : sans elle on
 * rapatriait toutes les lignes du mois pour n'en tirer qu'un entier.
 *
 * Repli sur l'ancien calcul si la fonction n'existe pas encore, pour que le
 * code puisse être déployé avant la migration sans bloquer les utilisateurs.
 */
async function sumMonthlyUsage(userId: string, since: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_monthly_usage', {
    p_user_id: userId,
    p_since: since,
  })

  if (!error && data !== null && data !== undefined) {
    return Number(data) || 0
  }

  const { data: rows } = await supabase
    .from('usage_sessions')
    .select('tokens_input, tokens_total')
    .gte('started_at', since)
    .eq('user_id', userId)
  return (rows ?? []).reduce(
    (sum, r) => sum + (r.tokens_total ?? r.tokens_input ?? 0),
    0,
  )
}

async function checkMonthlyLimit(userId: string, plan: PlanId): Promise<string | null> {
  const createdAt = await getUserCreatedAt(userId)
  const planLimit = getEffectiveTokenLimit(plan, createdAt)
  if (planLimit <= 0) return null

  const cached = usageCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.total >= planLimit ? planLimit.toString() : null
  }

  const sharedTotal = await cacheGet<number>(`usage:${userId}`)
  if (sharedTotal !== null) {
    usageCache.set(userId, { total: sharedTotal, expiresAt: Date.now() + 60_000 })
    return sharedTotal >= planLimit ? planLimit.toString() : null
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const usage = await sumMonthlyUsage(userId, startOfMonth)
  usageCache.set(userId, { total: usage, expiresAt: Date.now() + 60_000 })
  void cacheSet(`usage:${userId}`, usage, 60)
  return usage >= planLimit ? planLimit.toString() : null
}

// ── Anthropic ─────────────────────────────────────────────────────────────────

function buildAnthropicMessages(messages: any[]): any[] {
  const result: any[] = []
  let i = 0
  while (i < messages.length) {
    const msg = messages[i]
    if (msg.role === 'system') { i++; continue }

    // Consecutive tool results → single user message with tool_result parts
    if (msg.role === 'tool') {
      const parts: any[] = []
      while (i < messages.length && messages[i].role === 'tool') {
        parts.push({
          type: 'tool_result',
          tool_use_id: messages[i].tool_call_id,
          content: typeof messages[i].content === 'string'
            ? messages[i].content
            : JSON.stringify(messages[i].content ?? ''),
        })
        i++
      }
      result.push({ role: 'user', content: parts })
      continue
    }

    // Assistant message with tool calls
    if (msg.role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      const content: any[] = []
      if (msg.content) content.push({ type: 'text', text: msg.content })
      for (const tc of msg.tool_calls) {
        let input: any = {}
        try { input = JSON.parse(tc.function.arguments) } catch { /* use {} */ }
        content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input })
      }
      result.push({ role: 'assistant', content })
      i++
      continue
    }

    result.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content ?? '',
    })
    i++
  }
  return result
}

function buildAnthropicBody(body: any, modelApiId: string): any {
  const system = body.messages
    .filter((m: any) => m.role === 'system')
    .map((m: any) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
    .join('\n')

  const req: any = {
    model: modelApiId,
    max_tokens: body.max_tokens ?? 4096,
    messages: buildAnthropicMessages(body.messages),
    stream: body.stream ?? true,
  }
  if (system) req.system = system
  if (body.temperature != null) req.temperature = body.temperature
  if (body.top_p != null) req.top_p = body.top_p

  if (Array.isArray(body.tools) && body.tools.length > 0) {
    req.tools = body.tools.map((t: any) => ({
      name: t.function?.name ?? t.name,
      description: t.function?.description ?? t.description ?? '',
      input_schema: t.function?.parameters ?? t.input_schema ?? { type: 'object', properties: {} },
    }))
  }

  if (body.tool_choice) {
    const tc = body.tool_choice
    if (tc === 'auto' || tc?.type === 'auto') req.tool_choice = { type: 'auto' }
    else if (tc === 'required' || tc?.type === 'required') req.tool_choice = { type: 'any' }
    else if (tc === 'none' || tc?.type === 'none') req.tool_choice = { type: 'none' }
    else if (tc?.function?.name) req.tool_choice = { type: 'tool', name: tc.function.name }
  }

  return req
}

function anthropicNonStreamingToOpenAI(json: any, modelId: string): any {
  const content: any[] = json.content ?? []
  const texts = content.filter((c: any) => c.type === 'text').map((c: any) => c.text)
  const toolUses = content.filter((c: any) => c.type === 'tool_use')
  const message: any = { role: 'assistant', content: texts.join('') || null }
  if (toolUses.length > 0) {
    message.tool_calls = toolUses.map((tc: any) => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: JSON.stringify(tc.input ?? {}) },
    }))
    if (!message.content) message.content = null
  }
  return {
    id: json.id ?? `msg_${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{
      index: 0,
      message,
      finish_reason: json.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
      logprobs: null,
    }],
    usage: {
      prompt_tokens: json.usage?.input_tokens ?? 0,
      completion_tokens: json.usage?.output_tokens ?? 0,
      total_tokens: (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0),
    },
  }
}

// Transforms Anthropic SSE → OpenAI SSE
function anthropicStreamToOpenAI(stream: ReadableStream<Uint8Array>, modelId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ''
  const msgId = `chatcmpl-${Date.now()}`
  // Map: Anthropic content block index → OpenAI tool_call index
  const blockToToolIndex = new Map<number, number>()
  let nextToolIndex = 0

  return stream.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const dataStr = line.slice(6).trim()
        if (!dataStr) continue

        let event: any
        try { event = JSON.parse(dataStr) } catch { continue }

        const emit = (delta: any, finishReason: string | null = null) => {
          const c: any = { id: msgId, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: modelId, choices: [{ index: 0, delta, finish_reason: finishReason, logprobs: null }] }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`))
        }

        if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
          const toolIdx = nextToolIndex++
          blockToToolIndex.set(event.index, toolIdx)
          emit({ tool_calls: [{ index: toolIdx, id: event.content_block.id, type: 'function', function: { name: event.content_block.name, arguments: '' } }] })
        } else if (event.type === 'content_block_delta') {
          const d = event.delta
          if (d?.type === 'text_delta') {
            emit({ content: d.text })
          } else if (d?.type === 'input_json_delta') {
            const toolIdx = blockToToolIndex.get(event.index)
            if (toolIdx !== undefined) {
              emit({ tool_calls: [{ index: toolIdx, function: { arguments: d.partial_json } }] })
            }
          }
        } else if (event.type === 'message_delta' && event.delta?.stop_reason) {
          emit({}, event.delta.stop_reason === 'tool_use' ? 'tool_calls' : 'stop')
        } else if (event.type === 'message_stop') {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        }
      }
    },
    flush(controller) {
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    },
  }))
}

// ── Gemini ────────────────────────────────────────────────────────────────────

function buildGeminiContents(messages: any[]): any[] {
  const result: any[] = []
  let i = 0
  while (i < messages.length) {
    const msg = messages[i]
    if (msg.role === 'system') { i++; continue }

    if (msg.role === 'tool') {
      const parts: any[] = []
      while (i < messages.length && messages[i].role === 'tool') {
        parts.push({
          functionResponse: {
            name: messages[i].name ?? 'tool_result',
            response: { content: messages[i].content ?? '' },
          },
        })
        i++
      }
      result.push({ role: 'user', parts })
      continue
    }

    if (msg.role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      const parts: any[] = []
      if (msg.content) parts.push({ text: msg.content })
      for (const tc of msg.tool_calls) {
        let args: any = {}
        try { args = JSON.parse(tc.function.arguments) } catch { /* use {} */ }
        parts.push({ functionCall: { name: tc.function.name, args } })
      }
      result.push({ role: 'model', parts })
      i++
      continue
    }

    const role = msg.role === 'assistant' ? 'model' : 'user'
    const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? '')
    result.push({ role, parts: [{ text }] })
    i++
  }
  return result
}

function buildGeminiBody(body: any): any {
  const system = body.messages
    .filter((m: any) => m.role === 'system')
    .map((m: any) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
    .join('\n')

  const req: any = {
    contents: buildGeminiContents(body.messages),
    generationConfig: {
      temperature: body.temperature ?? 0.7,
      maxOutputTokens: body.max_tokens ?? 4096,
    },
  }
  if (system) req.systemInstruction = { parts: [{ text: system }] }
  if (Array.isArray(body.tools) && body.tools.length > 0) {
    req.tools = [{
      functionDeclarations: body.tools.map((t: any) => ({
        name: t.function?.name ?? t.name,
        description: t.function?.description ?? t.description ?? '',
        parameters: t.function?.parameters ?? { type: 'OBJECT', properties: {} },
      })),
    }]
  }
  return req
}

function geminiNonStreamingToOpenAI(json: any, modelId: string): any {
  const candidate = json.candidates?.[0]
  const parts: any[] = candidate?.content?.parts ?? []
  const texts = parts.filter((p: any) => p.text != null).map((p: any) => p.text)
  const toolCalls = parts.filter((p: any) => p.functionCall).map((p: any, idx: number) => ({
    id: `call_g${Date.now()}_${idx}`,
    type: 'function',
    function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args ?? {}) },
  }))
  const message: any = { role: 'assistant', content: texts.join('') || null }
  if (toolCalls.length > 0) { message.tool_calls = toolCalls; message.content ??= null }
  return {
    id: `chatcmpl-g${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{ index: 0, message, finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop', logprobs: null }],
    usage: {
      prompt_tokens: json.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: json.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: json.usageMetadata?.totalTokenCount ?? 0,
    },
  }
}

// Transforms Gemini SSE → OpenAI SSE
function geminiStreamToOpenAI(stream: ReadableStream<Uint8Array>, modelId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ''
  const msgId = `chatcmpl-g${Date.now()}`
  let toolCallIndex = 0

  return stream.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const dataStr = line.slice(6).trim()
        if (!dataStr || dataStr === '[DONE]') continue

        let event: any
        try { event = JSON.parse(dataStr) } catch { continue }

        const candidate = event.candidates?.[0]
        if (!candidate) continue

        const parts: any[] = candidate.content?.parts ?? []
        for (const part of parts) {
          let delta: any = null
          if (part.text != null) {
            delta = { content: part.text }
          } else if (part.functionCall) {
            const idx = toolCallIndex++
            delta = {
              tool_calls: [{ index: idx, id: `call_g${Date.now()}_${idx}`, type: 'function', function: { name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args ?? {}) } }],
            }
          }
          if (delta) {
            const c = { id: msgId, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: modelId, choices: [{ index: 0, delta, finish_reason: null, logprobs: null }] }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`))
          }
        }

        if (candidate.finishReason) {
          const fr = candidate.finishReason === 'STOP' ? 'stop' : 'tool_calls'
          const c = { id: msgId, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: modelId, choices: [{ index: 0, delta: {}, finish_reason: fr, logprobs: null }] }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        }
      }
    },
    flush(controller) {
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    },
  }))
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const [userId, body] = await Promise.all([verifyToken(token), req.json()])
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate messages
    const { messages, model: preferredModel, stream = true, ...rest } = body
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 })
    }
    if (messages.length > 200) {
      return NextResponse.json({ error: 'Too many messages (max 200)' }, { status: 400 })
    }
    let totalChars = 0
    for (const msg of messages) {
      if (typeof msg !== 'object' || msg === null) {
        return NextResponse.json({ error: 'Each message must be an object' }, { status: 400 })
      }
      if (!['user', 'assistant', 'system', 'tool'].includes(msg.role)) {
        return NextResponse.json({ error: `Invalid role: "${msg.role}"` }, { status: 400 })
      }
      totalChars += typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content ?? '').length
    }
    if (totalChars > 200_000) {
      return NextResponse.json({ error: 'Content too large (max 200k chars)' }, { status: 400 })
    }

    // Plan check
    const userPlan = await getUserPlan(userId)
    const limitReached = await checkMonthlyLimit(userId, userPlan)
    if (limitReached) {
      const now = new Date()
      const retryAfter = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - now.getTime()) / 1000)
      return NextResponse.json(
        { error: `Monthly token limit reached (${limitReached}). Upgrade your plan to continue.`, code: 'MONTHLY_LIMIT_REACHED', plan: userPlan, limit: Number(limitReached), retry_after: retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { model: selectedModel, complexity, downgraded } = selectBestModel(userPlan, preferredModel as ModelId, messages)
    const route = API_ROUTES[selectedModel.id]
    if (!route) return NextResponse.json({ error: `Model ${selectedModel.id} not configured` }, { status: 500 })

    // Si le modèle retenu ne supporte pas la vision mais que les messages contiennent des images,
    // on strip les parties image pour éviter une erreur 400 côté provider.
    // Si le modèle retenu ne supporte pas la vision, stripper les images pour éviter une erreur 400.
    const effectiveMessages = (hasImageContent(messages) && !selectedModel.supportsVision)
      ? (messages as any[]).map((msg: any) => {
          if (!Array.isArray(msg.content)) return msg
          const textParts = msg.content.filter((p: any) => p.type !== 'image_url' && p.type !== 'image')
          const text = textParts.map((p: any) => p.text ?? '').join(' ').trim()
          return { ...msg, content: text || '[Image non supportée par ce modèle]' }
        })
      : messages

    const apiKey = process.env[route.keyEnv]
    if (!apiKey) return NextResponse.json({ error: 'Server API key not configured' }, { status: 500 })

    const maxTokens = Math.min(rest.max_tokens ?? MAX_TOKENS_PER_PLAN[userPlan] ?? 4096, MAX_TOKENS_PER_PLAN[userPlan] ?? 4096)

    // Build and send upstream request
    let upstreamResp: Response

    if (route.format === 'openai') {
      upstreamResp = await fetch(route.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ ...rest, model: selectedModel.apiIdentifier, messages: effectiveMessages, stream, max_tokens: maxTokens }),
      })
    } else if (route.format === 'anthropic') {
      const anthropicBody = buildAnthropicBody({ ...rest, messages: effectiveMessages, stream, max_tokens: maxTokens }, selectedModel.apiIdentifier)
      upstreamResp = await fetch(route.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(anthropicBody),
      })
    } else {
      // Gemini
      const geminiBody = buildGeminiBody({ ...rest, messages: effectiveMessages, max_tokens: maxTokens })
      const modelPath = selectedModel.apiIdentifier
      const endpoint = stream
        ? `${route.baseUrl}/models/${modelPath}:streamGenerateContent?alt=sse`
        : `${route.baseUrl}/models/${modelPath}:generateContent`
      upstreamResp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(geminiBody),
      })
    }

    if (!upstreamResp.ok) {
      const errorText = await upstreamResp.text()
      if (upstreamResp.status === 429) {
        const retryAfter = upstreamResp.headers.get('retry-after') ?? '60'
        return NextResponse.json(
          { error: 'Upstream rate limit exceeded', retry_after: parseInt(retryAfter), details: errorText },
          { status: 429, headers: { 'Retry-After': retryAfter } }
        )
      }
      return NextResponse.json({ error: errorText }, { status: upstreamResp.status })
    }

    // Usage tracking context — credits are weighted by the model's cost multiplier
    const inputTokens = estimateTokens(messages)
    const usageCtx: UsageContext = {
      userId,
      plan: userPlan,
      modelId: selectedModel.id,
      inputTokens,
      preferred: (preferredModel as string) || null,
      complexity,
      downgraded,
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Nexora-Model': selectedModel.id,
      'X-Nexora-Downgraded': String(downgraded),
      'X-Nexora-Complexity': String(complexity),
    }

    // Helper: estimate output tokens from a non-streamed OpenAI-format completion
    const recordFromJson = async (json: any) => {
      const content = json?.choices?.[0]?.message?.content
      const outTokens =
        typeof json?.usage?.completion_tokens === 'number'
          ? json.usage.completion_tokens
          : Math.ceil((typeof content === 'string' ? content.length : 0) / 4)
      await recordUsage(usageCtx, outTokens)
    }

    // For OpenAI format: pass through, counting output
    if (route.format === 'openai') {
      if (stream && upstreamResp.body) {
        return new NextResponse(trackOutputStream(upstreamResp.body, usageCtx), { status: 200, headers: responseHeaders })
      }
      const json = await upstreamResp.json()
      await recordFromJson(json)
      return NextResponse.json(json, { headers: { 'X-Nexora-Model': selectedModel.id } })
    }

    // For Anthropic: convert SSE or JSON to OpenAI format
    if (route.format === 'anthropic') {
      if (stream) {
        const converted = anthropicStreamToOpenAI(upstreamResp.body!, selectedModel.id)
        return new NextResponse(trackOutputStream(converted, usageCtx), { status: 200, headers: responseHeaders })
      } else {
        const json = await upstreamResp.json()
        const converted = anthropicNonStreamingToOpenAI(json, selectedModel.id)
        await recordFromJson(converted)
        return NextResponse.json(converted, { headers: { 'X-Nexora-Model': selectedModel.id } })
      }
    }

    // For Gemini: convert SSE or JSON to OpenAI format
    if (stream) {
      const converted = geminiStreamToOpenAI(upstreamResp.body!, selectedModel.id)
      return new NextResponse(trackOutputStream(converted, usageCtx), { status: 200, headers: responseHeaders })
    } else {
      const json = await upstreamResp.json()
      const converted = geminiNonStreamingToOpenAI(json, selectedModel.id)
      await recordFromJson(converted)
      return NextResponse.json(converted, { headers: { 'X-Nexora-Model': selectedModel.id } })
    }
  } catch (err) {
    console.error('[model-proxy] error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
