import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from '@/lib/models'
import { captureServerError } from '@/lib/sentry'

// ── Paddle webhook ───────────────────────────────────────────────────────────
// Configure in the Paddle dashboard (Developer Tools > Notifications) pointing
// at this route, subscribed to at least: subscription.created,
// subscription.updated, subscription.canceled. Like the Lemon Squeezy webhook,
// this is the ONLY place that actually grants a paid plan — Paddle.js's
// client-side "success" callback is just UX, never trusted for access.
export const runtime = 'nodejs'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Paddle-Signature header format: "ts=<unix_ts>;h1=<hex_hmac>"
// Signed payload is `${ts}:${rawBody}`, HMAC-SHA256 with the webhook secret.
function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(
    signatureHeader.split(';').map((p) => p.split('=') as [string, string]),
  )
  const ts = parts.ts
  const h1 = parts.h1
  if (!ts || !h1) return false

  const digest = crypto.createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex')
  const a = Buffer.from(digest, 'utf8')
  const b = Buffer.from(h1, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

interface PaddlePayload {
  event_type: string
  data: {
    id: string
    status?: string
    custom_data?: { user_id?: string; plan?: string } | null
    next_billed_at?: string | null
    current_billing_period?: { ends_at?: string } | null
  }
}

async function activateFromCustomData(
  reference: string,
  userId: string | undefined,
  planSlug: string | undefined,
  periodEnd: string | undefined,
): Promise<void> {
  if (!userId || !planSlug) {
    console.warn('[paddle webhook] missing user_id/plan in custom_data, cannot activate')
    return
  }
  const planCfg = PLANS[planSlug as PlanId]
  if (!planCfg) {
    console.warn(`[paddle webhook] unknown plan "${planSlug}"`)
    return
  }

  // Idempotent : déjà traité pour cette référence ?
  const { data: existing } = await admin
    .from('user_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', reference)
    .limit(1)
  if (existing && existing.length > 0) return

  const { data: plan } = await admin
    .from('subscription_plans')
    .select('id, tokens_per_month')
    .eq('slug', planSlug)
    .single()
  if (!plan) {
    console.warn(`[paddle webhook] plan "${planSlug}" absent de subscription_plans`)
    return
  }

  await admin
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')

  const now = new Date()
  const end = periodEnd ? new Date(periodEnd) : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const { error } = await admin.from('user_subscriptions').insert({
    user_id: userId,
    plan_id: plan.id,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    tokens_remaining: plan.tokens_per_month,
    // Réutilise cette colonne comme clé d'idempotence générique (déjà le cas
    // pour NotchPay et Lemon Squeezy).
    stripe_subscription_id: reference,
  })
  if (error) console.error('[paddle webhook] insert user_subscriptions failed:', error.message)
}

async function renewSubscription(reference: string, periodEnd: string | undefined): Promise<void> {
  if (!periodEnd) return
  const { error } = await admin
    .from('user_subscriptions')
    .update({ current_period_end: new Date(periodEnd).toISOString(), status: 'active' })
    .eq('stripe_subscription_id', reference)
  if (error) console.error('[paddle webhook] renew failed:', error.message)
}

async function deactivateSubscription(reference: string): Promise<void> {
  const { error } = await admin
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', reference)
  if (error) console.error('[paddle webhook] deactivate failed:', error.message)
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[paddle webhook] PADDLE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody = await req.text()
  const valid = verifySignature(rawBody, req.headers.get('paddle-signature'), secret)
  if (!valid) {
    console.warn('[paddle webhook] invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: PaddlePayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = payload.event_type
  const customData = payload.data?.custom_data ?? undefined
  const subscriptionId = payload.data?.id
  const reference = subscriptionId ? `paddle_sub_${subscriptionId}` : undefined
  const periodEnd = payload.data?.next_billed_at ?? payload.data?.current_billing_period?.ends_at ?? undefined

  try {
    if (!reference) {
      console.warn('[paddle webhook] missing subscription id, ignoring event', eventType)
    } else {
      switch (eventType) {
        case 'subscription.created':
          await activateFromCustomData(reference, customData?.user_id, customData?.plan, periodEnd)
          break
        case 'subscription.updated':
          if (payload.data.status === 'active') {
            await renewSubscription(reference, periodEnd)
          } else if (payload.data.status === 'canceled' || payload.data.status === 'paused') {
            await deactivateSubscription(reference)
          }
          break
        case 'subscription.canceled':
          await deactivateSubscription(reference)
          break
        default:
          // transaction.completed, subscription.activated, etc. — pas
          // d'action nécessaire, subscription.created/updated couvrent déjà
          // l'activation et le renouvellement.
          break
      }
    }
  } catch (err) {
    console.error('[paddle webhook] handler error:', err)
    captureServerError(err, { eventType, reference })
    // On répond quand même 200 : une erreur de notre côté ne doit pas
    // déclencher un déluge de re-essais Paddle pour un événement qu'on a déjà
    // reçu et logué.
  }

  return NextResponse.json({ received: true })
}
