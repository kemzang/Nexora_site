import type { PlanId } from './models'

export type ProviderFormat = 'openai' | 'anthropic' | 'gemini'
export type FimModelId = 'deepseek-chat' | 'gpt-5'

export interface ModelRoute {
  provider: string
  /** Full upstream URL for chat/completions */
  chatUrl: string
  /** Full upstream URL for FIM/completions (beta where needed) */
  fimUrl?: string
  /** Env var name holding the API key */
  keyEnv: string
  /** Wire format to use when calling the provider */
  format: ProviderFormat
  /** Actual model identifier sent to the provider */
  upstreamModel: string
  /** Minimum plan required to use this model */
  minPlan: PlanId
}

const PLAN_ORDER: PlanId[] = ['free', 'neo', 'pro', 'business', 'enterprise']

export function planSatisfies(userPlan: PlanId, required: PlanId): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(required)
}

export const MODEL_ROUTES: Record<string, ModelRoute> = {
  // ── DeepSeek ──────────────────────────────────────────────────
  'deepseek-chat': {
    provider: 'DeepSeek',
    chatUrl: 'https://api.deepseek.com/v1/chat/completions',
    fimUrl: 'https://api.deepseek.com/beta/completions', // beta required for FIM
    keyEnv: 'DEEPSEEK_API_KEY',
    format: 'openai',
    upstreamModel: 'deepseek-chat',
    minPlan: 'free',
  },
  'deepseek-reasoner': {
    provider: 'DeepSeek',
    chatUrl: 'https://api.deepseek.com/v1/chat/completions',
    keyEnv: 'DEEPSEEK_API_KEY',
    format: 'openai',
    upstreamModel: 'deepseek-reasoner',
    minPlan: 'pro',
  },

  // ── Google Gemini ─────────────────────────────────────────────
  'gemini-flash': {
    provider: 'Google',
    chatUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyEnv: 'GEMINI_API_KEY',
    format: 'gemini',
    upstreamModel: 'gemini-2.0-flash',
    minPlan: 'free',
  },
  'gemini-pro': {
    provider: 'Google',
    chatUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyEnv: 'GEMINI_API_KEY',
    format: 'gemini',
    upstreamModel: 'gemini-2.0-pro-exp',
    minPlan: 'neo',
  },

  // ── Anthropic Claude ─────────────────────────────────────────
  'claude-haiku': {
    provider: 'Anthropic',
    chatUrl: 'https://api.anthropic.com/v1/messages',
    keyEnv: 'ANTHROPIC_API_KEY',
    format: 'anthropic',
    upstreamModel: 'claude-3-haiku-20240307',
    minPlan: 'pro',
  },
  'claude-sonnet': {
    provider: 'Anthropic',
    chatUrl: 'https://api.anthropic.com/v1/messages',
    keyEnv: 'ANTHROPIC_API_KEY',
    format: 'anthropic',
    upstreamModel: 'claude-sonnet-4-6',
    minPlan: 'business',
  },
  'claude-opus': {
    provider: 'Anthropic',
    chatUrl: 'https://api.anthropic.com/v1/messages',
    keyEnv: 'ANTHROPIC_API_KEY',
    format: 'anthropic',
    upstreamModel: 'claude-opus-4-5',
    minPlan: 'enterprise',
  },

  // ── xAI Grok ─────────────────────────────────────────────────
  'grok-2': {
    provider: 'xAI',
    chatUrl: 'https://api.x.ai/v1/chat/completions',
    keyEnv: 'XAI_API_KEY',
    format: 'openai',
    upstreamModel: 'grok-2-1212',
    minPlan: 'pro',
  },

  // ── OpenAI ────────────────────────────────────────────────────
  'gpt-5': {
    provider: 'OpenAI',
    chatUrl: 'https://api.openai.com/v1/chat/completions',
    fimUrl: 'https://api.openai.com/v1/completions',
    keyEnv: 'OPENAI_API_KEY',
    format: 'openai',
    upstreamModel: 'gpt-4o', // update when GPT-5 is GA
    minPlan: 'enterprise',
  },
}

export function getModelRoute(modelId: string): ModelRoute | null {
  return MODEL_ROUTES[modelId] ?? null
}

export function buildChatPayload(
  route: ModelRoute,
  body: Record<string, unknown>,
): { url: string; headers: Record<string, string>; payload: Record<string, unknown> } {
  const apiKey = process.env[route.keyEnv] ?? ''

  if (route.format === 'openai') {
    return {
      url: route.chatUrl,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      payload: body,
    }
  }

  if (route.format === 'anthropic') {
    const messages = (body.messages as { role: string; content: string }[]) ?? []
    const sysMsgs = messages.filter(m => m.role === 'system')
    const userMsgs = messages.filter(m => m.role !== 'system')
    return {
      url: route.chatUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      payload: {
        model: route.upstreamModel,
        max_tokens: (body.max_tokens as number) ?? 4096,
        system: sysMsgs.length ? sysMsgs.map(m => ({ type: 'text', text: m.content })) : undefined,
        messages: userMsgs.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        stream: body.stream ?? false,
      },
    }
  }

  // Gemini
  const messages = (body.messages as { role: string; content: string }[]) ?? []
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const streaming = body.stream ? '?alt=sse' : ''
  return {
    url: `${route.chatUrl}/models/${route.upstreamModel}:generateContent${streaming}`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    payload: {
      contents,
      generationConfig: {
        temperature: (body.temperature as number) ?? 0.7,
        maxOutputTokens: (body.max_tokens as number) ?? 4096,
      },
    },
  }
}
