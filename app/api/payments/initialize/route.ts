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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency, email, name, phone, plan, country } = body

    if (!amount || !email || !name) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // ── Business rule: block duplicate payment ────────────────────
    const authHeader = req.headers.get('authorization')
    if (authHeader && plan && plan !== 'free') {
      const token = authHeader.replace('Bearer ', '')
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
    const reference = `nexora_${plan}_${Date.now()}`

    const result = await initializePayment({
      amount,
      currency: currency || 'XAF',
      email,
      name,
      phone,
      description: `Abonnement Nexora ${plan}`,
      reference,
      callbackUrl: `${appUrl}/checkout/callback`,
      metadata: { plan, country: country || 'CM' },
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
