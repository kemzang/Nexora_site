import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Config ───────────────────────────────────────────────────────────────────
// Card payments only, via Lemon Squeezy's overlay checkout (Lemon.js) — the
// user never leaves this page, no popup, no redirect. See app/checkout/page.tsx
// for the client side and app/api/webhooks/lemonsqueezy/route.ts for how a
// successful checkout actually activates the subscription (this route only
// creates the checkout session; it does NOT grant access by itself).
const API_URL = 'https://api.lemonsqueezy.com/v1/checkouts'
const UPSTREAM_TIMEOUT_MS = 15_000

// One product variant per paid plan, created in the Lemon Squeezy dashboard.
const VARIANT_ENV: Record<string, string | undefined> = {
  test1: process.env.LEMONSQUEEZY_VARIANT_TEST1,
  test2: process.env.LEMONSQUEEZY_VARIANT_TEST2,
  starter: process.env.LEMONSQUEEZY_VARIANT_STARTER,
  pro: process.env.LEMONSQUEEZY_VARIANT_PRO,
  business: process.env.LEMONSQUEEZY_VARIANT_BUSINESS,
  enterprise: process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE,
}
const VALID_PLANS = Object.keys(VARIANT_ENV)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function makeClient(userToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    userToken ? { global: { headers: { Authorization: `Bearer ${userToken}` } } } : {},
  )
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    if (!apiKey || !storeId) {
      return NextResponse.json(
        { error: 'Paiement par carte non configuré (LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID manquants)' },
        { status: 503 },
      )
    }

    // ── Auth : on exige une session pour lier le paiement à un compte ────────
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const anonClient = makeClient()
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Input validation ─────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const { plan } = body as { plan?: unknown }
    if (typeof plan !== 'string' || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: `Plan invalide: "${plan}". Valeurs acceptées: ${VALID_PLANS.join(', ')}` },
        { status: 400 },
      )
    }
    const variantId = VARIANT_ENV[plan]
    if (!variantId) {
      return NextResponse.json({ error: `Plan "${plan}" non configuré côté paiement` }, { status: 503 })
    }

    const email = user.email ?? ''
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email de compte invalide' }, { status: 400 })
    }
    const name = String(user.user_metadata?.full_name || user.user_metadata?.name || '').slice(0, 100) || undefined

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // ── Create the checkout upstream ─────────────────────────────────────────
    let upstreamResp: Response
    try {
      upstreamResp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              checkout_options: { embed: true, dark: true },
              checkout_data: {
                email,
                name,
                // Lu par le webhook (meta.custom_data) pour savoir QUI et QUEL
                // plan activer — le paiement lui-même ne prouve rien de plus.
                custom: { user_id: user.id, plan },
              },
              product_options: {
                redirect_url: `${appUrl}/checkout/callback?provider=lemonsqueezy&plan=${encodeURIComponent(plan)}`,
              },
            },
            relationships: {
              store: { data: { type: 'stores', id: storeId } },
              variant: { data: { type: 'variants', id: variantId } },
            },
          },
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'TimeoutError'
      console.error('[lemonsqueezy/create-checkout] upstream fetch failed:', err)
      return NextResponse.json(
        { error: timedOut ? 'Le paiement a mis trop de temps à démarrer' : 'Impossible de contacter le fournisseur de paiement' },
        { status: 502 },
      )
    }

    if (!upstreamResp.ok) {
      let detail = ''
      try { detail = (await upstreamResp.text()).slice(0, 500) } catch { /* best effort */ }
      console.error(`[lemonsqueezy/create-checkout] upstream error ${upstreamResp.status}:`, detail)
      return NextResponse.json({ error: `Erreur du fournisseur de paiement (${upstreamResp.status})` }, { status: 502 })
    }

    const json = await upstreamResp.json()
    const url = json?.data?.attributes?.url
    if (!url) {
      console.error('[lemonsqueezy/create-checkout] no url in response:', json)
      return NextResponse.json({ error: 'Réponse invalide du fournisseur de paiement' }, { status: 502 })
    }

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[lemonsqueezy/create-checkout] error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
