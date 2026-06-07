import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { createClient } from '@supabase/supabase-js'

// Client service role : nécessaire pour écrire dans user_subscriptions (RLS bypass).
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const PAID_STATUSES = new Set(['complete', 'completed', 'success', 'paid'])

/**
 * Active l'abonnement de l'utilisateur après un paiement vérifié.
 * - Idempotent : si une souscription existe déjà pour cette référence, ne refait rien.
 * - Lit le plan + l'userId depuis la metadata de la transaction (posée à l'init).
 */
async function activateSubscription(
  reference: string,
  transaction: Record<string, unknown> | undefined,
): Promise<{ activated: boolean; reason?: string }> {
  if (!transaction) return { activated: false, reason: 'no transaction' }

  const meta = (transaction.metadata ?? {}) as Record<string, string>
  const planSlug = meta.plan
  const userId = meta.userId
  if (!planSlug || !userId) {
    return { activated: false, reason: 'missing plan/userId in metadata' }
  }

  // Idempotence : déjà activé pour cette référence ?
  const { data: existing } = await admin
    .from('user_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', reference)
    .limit(1)
  if (existing && existing.length > 0) {
    return { activated: false, reason: 'already activated' }
  }

  // Récupère le plan (id + quota mensuel)
  const { data: plan } = await admin
    .from('subscription_plans')
    .select('id, tokens_per_month')
    .eq('slug', planSlug)
    .single()
  if (!plan) return { activated: false, reason: `plan "${planSlug}" introuvable` }

  // Désactive les anciennes souscriptions actives de l'utilisateur
  await admin
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')

  const now = new Date()
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const { error } = await admin.from('user_subscriptions').insert({
    user_id: userId,
    plan_id: plan.id,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    tokens_remaining: plan.tokens_per_month,
    stripe_subscription_id: reference, // sert de clé d'idempotence (réf. de paiement)
  })
  if (error) return { activated: false, reason: error.message }

  return { activated: true }
}

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get('reference')
    if (!reference) {
      return NextResponse.json({ error: 'Référence requise' }, { status: 400 })
    }

    const result = await verifyPayment(reference)
    const status = String(result.transaction?.status ?? '').toLowerCase()

    // Paiement confirmé → on active l'abonnement (sécurisé : le statut vient de
    // la vérification serveur auprès du fournisseur, pas du client).
    let activated = false
    if (PAID_STATUSES.has(status)) {
      const act = await activateSubscription(reference, result.transaction)
      activated = act.activated
      if (!act.activated && act.reason !== 'already activated') {
        console.warn('[payment verify] activation non effectuée:', act.reason)
      }
    }

    return NextResponse.json({
      success: true,
      status: result.transaction?.status,
      activated,
      transaction: result.transaction,
    })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
