export type ModelId = 'deepseek-chat' | 'gemini-flash' | 'gemini-pro' | 'claude-haiku' | 'grok-2' | 'claude-sonnet' | 'gpt-5' | 'claude-opus'

export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'enterprise'

export interface AIModel {
  id: ModelId
  name: string
  provider: string
  apiIdentifier: string
  apiBaseUrl: string
  inputCostPer1K: number
  outputCostPer1K: number
  contextWindow: number
  capability: number
  sortOrder: number
  supportsVision: boolean
}

export interface Plan {
  id: PlanId
  name: string
  nameFr: string
  price: number
  priceLabel: string
  tokensPerMonth: number
  firstMonthTokens?: number
  maxRequestsPerDay: number
  models: ModelId[]
  modelsLabel?: string
  features: string[]
  popular?: boolean
}

interface ComplexMessage {
  content?: string
  role?: string
}

const GREETING_PATTERNS = /^(salut|bonjour|bonsoir|coucou|hello|hi|hey|merci|oui|non|ok|okay|d'accord|super|parfait)\b/i
const CODE_PATTERNS = /```|\b(function|class|import\s|export\s|const\s+\w+\s*=\s*\(|=>|interface\s|type\s|async\s|await\s|Promise|new\s+\w+\(|\.map\(|\.filter\(|\.reduce\()/
const TECHNICAL_TERMS = /\b(refactor|architecture|optimis|pattern\s+[a-z]|algorithme|asynchrone|performances?|sécurité|design\s+pattern|scalabilit|déploiement|microservice|api\s+rest|graphql|middleware|middleware|endpoint|thread|mutex|deadlock|race\s+condition|compliquit|big\s*o|time\s*complexity|espace\s*complexit)\b/i
const COMPLEX_TERMS = /\b(architect|refactor|cache|cluster|load\s+balanc|index\s+compos|re-render|bundler|lazy\s+load|stream|webhook|orm|transaction|sharding|replicat|failover|container|docker|kubernetes|ci\/cd)\b/i

export const MODELS: Record<ModelId, AIModel> = {
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    apiIdentifier: 'deepseek-chat',
    apiBaseUrl: 'https://api.deepseek.com/v1/chat/completions',
    inputCostPer1K: 0.0001,
    outputCostPer1K: 0.0002,
    contextWindow: 64000,
    capability: 3,
    sortOrder: 1,
    supportsVision: false,
  },
  'gemini-flash': {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'Google',
    apiIdentifier: 'gemini-2.0-flash',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    inputCostPer1K: 0.00015,
    outputCostPer1K: 0.0005,
    contextWindow: 32000,
    capability: 2,
    sortOrder: 2,
    supportsVision: true,
  },
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    apiIdentifier: 'gemini-2.0-pro',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent',
    inputCostPer1K: 0.001,
    outputCostPer1K: 0.002,
    contextWindow: 32000,
    capability: 3,
    sortOrder: 3,
    supportsVision: true,
  },
  'claude-haiku': {
    id: 'claude-haiku',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    apiIdentifier: 'claude-haiku-4-5-20251001',
    apiBaseUrl: 'https://api.anthropic.com/v1/messages',
    inputCostPer1K: 0.0008,
    outputCostPer1K: 0.004,
    contextWindow: 200000,
    capability: 3,
    sortOrder: 4,
    supportsVision: true,
  },
  'grok-2': {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    apiIdentifier: 'grok-2-1212',
    apiBaseUrl: 'https://api.x.ai/v1/chat/completions',
    inputCostPer1K: 0.002,
    outputCostPer1K: 0.01,
    contextWindow: 32000,
    capability: 3,
    sortOrder: 5,
    supportsVision: true,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    apiIdentifier: 'claude-sonnet-4-6',
    apiBaseUrl: 'https://api.anthropic.com/v1/messages',
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    contextWindow: 200000,
    capability: 4,
    sortOrder: 6,
    supportsVision: true,
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    apiIdentifier: 'gpt-5-preview',
    apiBaseUrl: 'https://api.openai.com/v1/chat/completions',
    inputCostPer1K: 0.01,
    outputCostPer1K: 0.04,
    contextWindow: 128000,
    capability: 5,
    sortOrder: 7,
    supportsVision: true,
  },
  'claude-opus': {
    id: 'claude-opus',
    name: 'Claude Opus 4.7',
    provider: 'Anthropic',
    apiIdentifier: 'claude-opus-4-7',
    apiBaseUrl: 'https://api.anthropic.com/v1/messages',
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    contextWindow: 200000,
    capability: 5,
    sortOrder: 8,
    supportsVision: true,
  },
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    nameFr: 'Découverte',
    price: 0,
    priceLabel: '$0',
    tokensPerMonth: 10000,
    firstMonthTokens: 100000,
    maxRequestsPerDay: 200,
    models: ['deepseek-chat', 'gemini-flash'],
    features: [
      '100K tokens le 1er mois, puis 10K/mois',
      '200 requêtes/jour',
      'DeepSeek V3 & Gemini Flash',
      'Chat IA + Autocomplétion',
      'Mode Agent basique',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    nameFr: 'Starter',
    price: 5,
    priceLabel: '$5',
    tokensPerMonth: 1000000,
    maxRequestsPerDay: 500,
    models: ['deepseek-chat', 'gemini-flash', 'gemini-pro'],
    features: [
      '1M tokens/mois',
      '500 requêtes/jour',
      '+ Gemini 2.5 Pro',
      'Autocomplétion avancée',
      'Mode Agent complet',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameFr: 'Pro',
    price: 12,
    priceLabel: '$12',
    tokensPerMonth: 3000000,
    maxRequestsPerDay: 2000,
    models: ['deepseek-chat', 'gemini-flash', 'gemini-pro', 'claude-haiku', 'grok-2'],
    modelsLabel: 'DeepSeek, Gemini, Claude Haiku, Grok',
    features: [
      '3M tokens/mois',
      '2 000 requêtes/jour',
      '+ Claude Haiku & Grok',
      'Indexing codebase complet',
      'Support prioritaire',
    ],
    popular: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    nameFr: 'Business',
    price: 25,
    priceLabel: '$25',
    tokensPerMonth: 20000000,
    maxRequestsPerDay: 5000,
    models: ['deepseek-chat', 'gemini-flash', 'gemini-pro', 'claude-haiku', 'grok-2', 'claude-sonnet'],
    features: [
      '20M tokens/mois',
      '5 000 requêtes/jour',
      '+ Claude Sonnet 4.6',
      'Accès API direct',
      'Support dédié',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    nameFr: 'Enterprise',
    price: 60,
    priceLabel: '$60',
    tokensPerMonth: 80000000,
    maxRequestsPerDay: 99999,
    models: ['deepseek-chat', 'gemini-flash', 'gemini-pro', 'claude-haiku', 'grok-2', 'claude-sonnet', 'gpt-5', 'claude-opus'],
    features: [
      '80M tokens/mois',
      'Requêtes illimitées',
      '+ Claude Opus & GPT-5',
      'Tous les modèles disponibles',
      'SSO + Support 24/7 + SLA',
    ],
  },
}

export function getModelsForPlan(planId: PlanId): ModelId[] {
  return PLANS[planId].models
}

// Retourne la limite mensuelle effective : 100K le 1er mois pour free, 10K ensuite
export function getEffectiveTokenLimit(planId: PlanId, userCreatedAt?: string): number {
  const plan = PLANS[planId]
  if (planId === 'free' && plan.firstMonthTokens && userCreatedAt) {
    const ageInDays = (Date.now() - new Date(userCreatedAt).getTime()) / 86_400_000
    if (ageInDays <= 30) return plan.firstMonthTokens
  }
  return plan.tokensPerMonth
}

function getLastMessage(messages: ComplexMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i]?.content
    if (content && content.trim().length > 0) return content
  }
  return ''
}

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.test(text.trim())
}

function hasCode(text: string): boolean {
  return CODE_PATTERNS.test(text)
}

function countTechnicalTerms(text: string): number {
  const techMatches = text.match(TECHNICAL_TERMS)
  const complexMatches = text.match(COMPLEX_TERMS)
  return (techMatches?.length || 0) + (complexMatches?.length || 0)
}

function hasCodeBlocks(text: string): boolean {
  return (text.match(/```/g) || []).length >= 2
}

function estimateOutputLength(messages: ComplexMessage[]): number {
  let totalChars = 0
  for (const msg of messages) {
    totalChars += msg.content?.length || 0
  }
  return totalChars
}

export function analyzeComplexity(messages: ComplexMessage[]): number {
  const lastMsg = getLastMessage(messages)
  const totalLen = estimateOutputLength(messages)
  const msgCount = messages.length

  let score = 0

  // Axe 1 : Longueur du dernier message
  if (lastMsg.length < 30) score += 1
  else if (lastMsg.length < 100) score += 2
  else if (lastMsg.length < 350) score += 3
  else if (lastMsg.length < 1000) score += 4
  else score += 5

  // Axe 2 : Volume total de la conversation
  if (totalLen > 5000) score += 1

  // Axe 3 : Présence de code
  if (hasCode(lastMsg)) score += 1
  if (hasCodeBlocks(lastMsg)) score += 1

  // Axe 4 : Termes techniques avancés
  const techTermCount = countTechnicalTerms(lastMsg)
  if (techTermCount >= 3) score += 2
  else if (techTermCount >= 1) score += 1

  // Axe 5 : Profondeur de la conversation
  if (msgCount > 10) score += 2
  else if (msgCount > 5) score += 1

  // Axe 6 : Salutation simple → réduit la complexité
  if (isGreeting(lastMsg) && msgCount <= 2) score -= 1

  return Math.max(1, Math.min(5, score))
}

/** Détecte si une liste de messages contient des images (data URL ou image_url) */
export function hasImageContent(messages: any[]): boolean {
  return messages.some((msg) => {
    if (!msg.content) return false
    if (typeof msg.content === 'string') {
      return msg.content.includes('data:image/')
    }
    if (Array.isArray(msg.content)) {
      return msg.content.some(
        (part: any) =>
          part.type === 'image_url' ||
          part.type === 'image' ||
          (part.type === 'text' && typeof part.text === 'string' && part.text.includes('data:image/'))
      )
    }
    return false
  })
}

export function selectBestModel(
  userPlan: PlanId,
  preferredModel?: ModelId,
  messages: ComplexMessage[] = []
): { model: AIModel; complexity: number; downgraded: boolean } {
  const availableModels = getModelsForPlan(userPlan)
  const available = availableModels.map(id => MODELS[id])
  const complexity = analyzeComplexity(messages)
  const needsVision = hasImageContent(messages as any[])

  // Si le modèle préféré est disponible dans ce plan et supporte la vision si nécessaire
  if (preferredModel && availableModels.includes(preferredModel)) {
    const chosen = MODELS[preferredModel]
    if (chosen.capability >= complexity && (!needsVision || chosen.supportsVision)) {
      return { model: chosen, complexity, downgraded: false }
    }
  }

  const sorted = [...available].sort((a, b) => {
    // Si images : les modèles sans vision passent en dernier
    if (needsVision) {
      if (a.supportsVision !== b.supportsVision) return a.supportsVision ? -1 : 1
    }
    const aEnough = a.capability >= complexity ? 0 : 1
    const bEnough = b.capability >= complexity ? 0 : 1
    if (aEnough !== bEnough) return aEnough - bEnough
    if (aEnough === 0) return a.sortOrder - b.sortOrder
    if (a.capability !== b.capability) return b.capability - a.capability
    return b.sortOrder - a.sortOrder
  })

  return {
    model: sorted[0],
    complexity,
    downgraded: preferredModel ? true : false,
  }
}

export function estimateTokens(messages: { content?: string }[]): number {
  let total = 0
  for (const msg of messages) {
    total += Math.ceil((msg.content?.length || 0) / 4)
  }
  return total
}

export function calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * model.inputCostPer1K
  const outputCost = (outputTokens / 1000) * model.outputCostPer1K
  return inputCost + outputCost
}
