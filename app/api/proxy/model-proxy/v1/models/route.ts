import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'
import { createClient } from '@supabase/supabase-js'
import { MODELS, PLANS, type PlanId } from '@/lib/models'

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
  const plan = (data?.subscription_plans as any)?.slug as PlanId || 'free'
  planCache.set(userId, { plan, expiresAt: Date.now() + 300_000 })
  return plan
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

    const userPlan = await getUserPlan(userId)
    const availableModelIds = PLANS[userPlan]?.models ?? []

    const now = Math.floor(Date.now() / 1000)

    const models = availableModelIds.map(id => {
      const m = MODELS[id]
      return {
        id: m.id,
        object: 'model',
        created: now,
        owned_by: `nexora-${m.provider.toLowerCase()}`,
        // OpenAI-compatible fields
        permission: [],
        root: m.id,
        parent: null,
        // Nexora extra info
        nexora: {
          name: m.name,
          provider: m.provider,
          context_window: m.contextWindow,
          capability: m.capability,
          available_on_plan: userPlan,
        },
      }
    })

    return NextResponse.json({
      object: 'list',
      data: models,
    })
  } catch (err) {
    console.error('models list error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
