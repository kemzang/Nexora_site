import { NextRequest, NextResponse } from 'next/server'
import { initializePayment } from '@/lib/notchpay'
import { createClient } from '@supabase/supabase-js'

function makeClient(userToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    userToken
      ? { global: { headers: { Authorization: `Bearer ${userToken}` } } }
      : {}
  )
}

async function checkDuplicatePayment(userToken: string, userId: string, planSlug: string): Promise<boolean> {
  const db = makeClient(userToken)

  // Get plan_id from slug
  const { data: plan } = await db
    .from('subscription_plans')
    .select('id')
    .eq('slug', planSlug)
    .single()

  if (!plan) return false

  // Start of current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Check active subscription on this plan created this month
  const { data: existing } = await db
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('status', 'active')
    .gte('created_at', startOfMonth)
    .limit(1)

  return !!(existing && existing.length > 0)
}

const VALID_PLANS = ['starter', 'pro', 'business', 'enterprise'] as const
type PaidPlan = typeof VALID_PLANS[number]

const PLAN_AMOUNTS: Record<PaidPlan, number> = { starter: 5, pro: 12, business: 25, enterprise: 60 }
const VALID_CURRENCIES = ['XAF', 'EUR', 'USD', 'GBP'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'XAF', email, name, phone, plan, country = 'CM' } = body

    // ── Input validation ──────────────────────────────────────────
    if (!amount || !email || !name) {
      return NextResponse.json({ error: 'Champs requis manquants: amount, email, name' }, { status: 400 })
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    if (plan && !VALID_PLANS.includes(plan as PaidPlan)) {
      return NextResponse.json(
        { error: `Plan invalide: "${plan}". Valeurs acceptées: ${VALID_PLANS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_CURRENCIES.includes(currency as typeof VALID_CURRENCIES[number])) {
      return NextResponse.json(
        { error: `Devise invalide: "${currency}". Valeurs acceptées: ${VALID_CURRENCIES.join(', ')}` },
        { status: 400 }
      )
    }

    const numAmount = Number(amount)
    if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 1_000_000) {
      return NextResponse.json({ error: 'Montant invalide (doit être entre 1 et 1 000 000)' }, { status: 400 })
    }

    // Sanity check: amount must be consistent with plan price (±20% tolerance for currency conversion)
    if (plan && PLAN_AMOUNTS[plan as PaidPlan]) {
      const expectedBase = PLAN_AMOUNTS[plan as PaidPlan]
      // Allow EUR amounts directly or XAF equivalents (1 EUR ≈ 655 XAF)
      const minAccepted = expectedBase * 0.5
      const maxAccepted = expectedBase * 1000 // generous upper bound for XAF
      if (numAmount < minAccepted && currency === 'EUR') {
        return NextResponse.json(
          { error: `Montant trop faible pour le plan ${plan} (minimum ${expectedBase}€)` },
          { status: 400 }
        )
      }
    }

    // ── Business rule: block duplicate payment ────────────────────
    const authHeader = req.headers.get('authorization')
    if (authHeader && plan && plan !== 'free') {
      const token = authHeader.replace(/^Bearer\s+/i, '')
      const anonClient = makeClient()
      const { data: { user } } = await anonClient.auth.getUser(token)

      if (user) {
        const isDuplicate = await checkDuplicatePayment(token, user.id, plan)
        if (isDuplicate) {
          return NextResponse.json(
            { error: 'Vous êtes déjà abonné à ce plan ce mois-ci', code: 'DUPLICATE_PAYMENT' },
            { status: 409 }
          )
        }
      }
    }

    // ── Initialize payment ────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // reference uses only safe chars to avoid injection in Notchpay metadata
    const safePlan = String(plan || 'unknown').replace(/[^a-z0-9_-]/gi, '')
    const reference = `nexora_${safePlan}_${Date.now()}`

    const result = await initializePayment({
      amount: numAmount,
      currency,
      email: email.trim().toLowerCase(),
      name: String(name).slice(0, 100),
      phone: phone ? String(phone).replace(/[^0-9+\s-]/g, '').slice(0, 20) : undefined,
      description: `Abonnement Nexora ${safePlan}`,
      reference,
      callbackUrl: `${appUrl}/checkout/callback`,
      metadata: { plan: safePlan, country: String(country).slice(0, 2).toUpperCase() },
    })

    if (result.code === 201 || result.status === 'Accepted') {
      return NextResponse.json({
        success: true,
        reference: result.transaction.reference,
        authorizationUrl: result.authorization_url,
      })
    }

    return NextResponse.json({ error: result.message || 'Erreur initialisation' }, { status: 400 })
  } catch (err) {
    console.error('Payment init error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
