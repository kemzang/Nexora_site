import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paddleApiBaseUrl, paddleSubscriptionIdFromReference } from '@/lib/paddle'
import { captureServerError } from '@/lib/sentry'

// ── Annule une résiliation programmée (cancel-subscription) ─────────────────
// Retire le `scheduled_change` côté Paddle : l'abonnement reprend son
// renouvellement normal au lieu de s'arrêter à current_period_end.
const API_URL = paddleApiBaseUrl()
const UPSTREAM_TIMEOUT_MS = 15_000

function makeClient(userToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    userToken ? { global: { headers: { Authorization: `Bearer ${userToken}` } } } : {},
  )
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PADDLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Paddle non configuré (PADDLE_API_KEY manquant)' }, { status: 503 })
    }

    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const anonClient = makeClient()
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = makeClient()
    const { data: sub } = await admin
      .from('user_subscriptions')
      .select('id, stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!sub || !sub.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement payant actif' }, { status: 404 })
    }
    if (!sub.cancel_at_period_end) {
      return NextResponse.json({ success: true, alreadyActive: true })
    }

    const subscriptionId = paddleSubscriptionIdFromReference(sub.stripe_subscription_id)
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Abonnement non géré par Paddle (legacy)' }, { status: 400 })
    }

    let upstreamResp: Response
    try {
      upstreamResp = await fetch(`${API_URL}/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduled_change: null }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })
    } catch (err) {
      console.error('[paddle resume-subscription] upstream fetch failed:', err)
      return NextResponse.json({ error: 'Impossible de contacter Paddle' }, { status: 502 })
    }

    if (!upstreamResp.ok) {
      const detail = await upstreamResp.text().catch(() => '')
      console.error(`[paddle resume-subscription] upstream error ${upstreamResp.status}:`, detail)
      return NextResponse.json({ error: `Erreur Paddle (${upstreamResp.status})` }, { status: 502 })
    }

    const { error } = await admin
      .from('user_subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('id', sub.id)
    if (error) {
      console.error('[paddle resume-subscription] db update failed:', error.message)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[paddle resume-subscription] error:', err)
    captureServerError(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
