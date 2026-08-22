import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from '@/lib/models'

// ── Lemon Squeezy webhook ────────────────────────────────────────────────────
// Configure in the Lemon Squeezy dashboard (Settings > Webhooks) pointing at
// this route, subscribed to at least: order_created, subscription_created,
// subscription_payment_success, subscription_cancelled, subscription_expired.
// This is the ONLY place that actually grants a paid plan — the checkout
// overlay's client-side "success" event is just UX, never trusted for access.
export const runtime = 'nodejs'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const digest = Buffer.from(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8')
  const signature = Buffer.from(signatureHeader, 'utf8')
  if (digest.length !== signature.length) return false
  return crypto.timingSafeEqual(digest, signature)
}

interface LSPayload {
  meta: {
    event_name: string
    custom_data?: { user_id?: string; plan?: string }
  }
  data: {
    type: string
    id: string
    attributes: Record<string, unknown>
  }
}

async function activateFromCustomData(
  reference: string,
  userId: string | undefined,
  planSlug: string | undefined,
  renewsAt: string | undefined,
): Promise<void> {
  if (!userId || !planSlug) {
    console.warn('[lemonsqueezy webhook] missing user_id/plan in custom_data, cannot activate')
    return
  }
  const planCfg = PLANS[planSlug as PlanId]
  if (!planCfg) {
    console.warn(`[lemonsqueezy webhook] unknown plan "${planSlug}"`)
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
    console.warn(`[lemonsqueezy webhook] plan "${planSlug}" absent de subscription_plans`)
    return
  }

  await admin
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')

  const now = new Date()
  const periodEnd = renewsAt ? new Date(renewsAt) : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const { error } = await admin.from('user_subscriptions').insert({
    user_id: userId,
    plan_id: plan.id,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    tokens_remaining: plan.tokens_per_month,
    // Réutilise cette colonne comme clé d'idempotence générique (déjà le cas
    // pour NotchPay) — voir app/api/payments/verify/route.ts.
    stripe_subscription_id: reference,
  })
  if (error) console.error('[lemonsqueezy webhook] insert user_subscriptions failed:', error.message)
}

async function renewSubscription(reference: string, renewsAt: string | undefined): Promise<void> {
  if (!renewsAt) return
  const { error } = await admin
    .from('user_subscriptions')
    .update({ current_period_end: new Date(renewsAt).toISOString(), status: 'active' })
    .eq('stripe_subscription_id', reference)
  if (error) console.error('[lemonsqueezy webhook] renew failed:', error.message)
}

async function deactivateSubscription(reference: string): Promise<void> {
  const { error } = await admin
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', reference)
  if (error) console.error('[lemonsqueezy webhook] deactivate failed:', error.message)
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[lemonsqueezy webhook] LEMONSQUEEZY_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody = await req.text()
  const valid = verifySignature(rawBody, req.headers.get('x-signature'), secret)
  if (!valid) {
    console.warn('[lemonsqueezy webhook] invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: LSPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = payload.meta?.event_name
  const customData = payload.meta?.custom_data
  // Une souscription Lemon Squeezy a son propre id stable — c'est la vraie clé
  // d'idempotence pour tout le cycle de vie (création, renouvellement, ...),
  // pas l'id de la commande qui ne concerne que le premier paiement.
  const attrs = payload.data?.attributes ?? {}
  const subscriptionId =
    payload.data?.type === 'subscriptions'
      ? payload.data.id
      : (attrs['subscription_id'] as string | number | undefined)?.toString()
  const reference = subscriptionId ? `ls_sub_${subscriptionId}` : `ls_order_${payload.data?.id}`

  try {
    switch (eventName) {
      case 'subscription_created':
        await activateFromCustomData(
          reference,
          customData?.user_id,
          customData?.plan,
          attrs['renews_at'] as string | undefined,
        )
        break
      case 'subscription_payment_success':
        await renewSubscription(reference, attrs['renews_at'] as string | undefined)
        break
      case 'subscription_cancelled':
      case 'subscription_expired':
        await deactivateSubscription(reference)
        break
      default:
        // order_created, subscription_updated, etc. — pas d'action nécessaire,
        // subscription_created couvre déjà l'activation initiale.
        break
    }
  } catch (err) {
    console.error('[lemonsqueezy webhook] handler error:', err)
    // On répond quand même 200 : une erreur de notre côté ne doit pas
    // déclencher un déluge de re-essais Lemon Squeezy pour un événement
    // qu'on a déjà reçu et logué. Le log ci-dessus reste la source de vérité
    // en cas d'investigation.
  }

  return NextResponse.json({ received: true })
}
