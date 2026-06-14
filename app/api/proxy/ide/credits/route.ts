import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from '@/lib/models'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const usageCache = new Map<string, { used: number; plan: PlanId; periodEnd: string | null; expiresAt: number }>()

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await verifyToken(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cached to avoid hammering Supabase on every call
  const cached = usageCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return buildResponse(cached.plan, cached.used, cached.periodEnd)
  }

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('current_period_end, subscription_plans!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    // Exclut un abonnement expiré → l'utilisateur repasse en Free.
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()

  const plan = ((subscription?.subscription_plans as { slug?: string } | null)?.slug ?? 'free') as PlanId
  const periodEnd = (subscription?.current_period_end as string | undefined) ?? null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: sessions } = await supabase
    .from('usage_sessions')
    .select('tokens_input, tokens_total')
    .eq('user_id', userId)
    .gte('started_at', startOfMonth)

  const used = (sessions ?? []).reduce((s, r) => s + (r.tokens_total ?? r.tokens_input ?? 0), 0)

  usageCache.set(userId, { used, plan, periodEnd, expiresAt: Date.now() + 60_000 })

  return buildResponse(plan, used, periodEnd)
}

function buildResponse(plan: PlanId, used: number, periodEnd: string | null) {
  const planConfig = PLANS[plan]
  const limit = planConfig?.tokensPerMonth ?? 1000
  const remaining = Math.max(0, limit - used)
  const now = new Date()
  const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const daysUntilReset = Math.ceil((new Date(resetAt).getTime() - now.getTime()) / 86_400_000)

  // Fin d'abonnement (utile surtout pour les forfaits test à durée limitée).
  const daysUntilExpiry = periodEnd
    ? Math.ceil((new Date(periodEnd).getTime() - now.getTime()) / 86_400_000)
    : null

  return NextResponse.json({
    // CreditStatus fields — required by the extension's getCreditStatus() call
    optedInToFreeTrial: plan === 'free',
    hasCredits: remaining > 0,
    creditBalance: remaining,
    hasPurchasedCredits: plan !== 'free',
    // Nexora-specific extras consumed by UsageSection
    plan,
    planLabel: planConfig?.name ?? 'Free',
    isTestPlan: planConfig?.isTest ?? false,
    tokensUsed: used,
    tokensLimit: limit,
    tokensRemaining: remaining,
    resetAt,
    daysUntilReset,
    // Expiration de l'abonnement (null si plan sans durée / Free)
    subscriptionEndsAt: periodEnd,
    daysUntilExpiry,
    pctUsed: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  })
}
