import { createClient } from '@supabase/supabase-js'
import { cacheGet, cacheSet } from './upstash-cache'
import type { PlanId } from './models'

// ── Plan + monthly call-count quota ─────────────────────────────────────────
// Same L1 (Map, per-instance) → L2 (Upstash, shared) → L3 (Supabase) pattern
// as getUserPlan/checkMonthlyLimit in
// app/api/proxy/model-proxy/v1/chat/completions/route.ts, generalized to
// count *calls* (not tokens) per user per session_type per month. Backs
// /api/proxy/web and /api/proxy/crawl, which spend real Tavily credits per
// call regardless of token volume.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const planCache = new Map<string, { plan: PlanId; expiresAt: number }>()
const countCache = new Map<string, { count: number; expiresAt: number }>()

export async function getUserPlan(userId: string): Promise<PlanId> {
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
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()
  const plan = ((data?.subscription_plans as any)?.slug as PlanId) || 'free'
  planCache.set(userId, { plan, expiresAt: Date.now() + 300_000 })
  void cacheSet(`plan:${userId}`, plan, 300)
  return plan
}

async function getMonthlyCallCount(userId: string, sessionType: string): Promise<number> {
  const cacheKey = `${sessionType}:${userId}`
  const cached = countCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.count

  const shared = await cacheGet<number>(`callcount:${cacheKey}`)
  if (shared !== null) {
    countCache.set(cacheKey, { count: shared, expiresAt: Date.now() + 60_000 })
    return shared
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { data } = await supabase
    .from('usage_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('session_type', sessionType)
    .gte('started_at', startOfMonth)
  const count = data?.length ?? 0
  countCache.set(cacheKey, { count, expiresAt: Date.now() + 60_000 })
  void cacheSet(`callcount:${cacheKey}`, count, 60)
  return count
}

/** True once the user has reached their plan's monthly limit for this call type. `limit <= 0` means unlimited. */
export async function isMonthlyCallLimitReached(
  userId: string,
  sessionType: string,
  limit: number,
): Promise<boolean> {
  if (limit <= 0) return false
  const count = await getMonthlyCallCount(userId, sessionType)
  return count >= limit
}

/**
 * Best-effort call record — mirrors recordUsage in model-proxy. Never throws;
 * intentionally omits model_id (usage_sessions.model_id is a UUID FK into
 * ai_models, not a slug — Tavily calls have no corresponding ai_models row).
 */
export async function recordCall(
  userId: string,
  sessionType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from('usage_sessions').insert({
      user_id: userId,
      started_at: new Date().toISOString(),
      session_type: sessionType,
      tokens_total: 1,
      metadata: metadata ?? null,
    })
  } catch {
    // tracking best-effort — never break the response
  }
}
