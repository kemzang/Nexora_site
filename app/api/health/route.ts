import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const startTime = Date.now()

export async function GET(req: NextRequest) {
  const t0 = Date.now()

  const checks: Record<string, 'ok' | 'degraded' | 'down'> = {
    database: 'ok',
  }

  // Ping Supabase with a lightweight query
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.from('subscription_plans').select('id').limit(1)
    checks.database = error ? 'degraded' : 'ok'
  } catch {
    checks.database = 'down'
  }

  // Presence des cles fournisseur. Cet endpoint est public : on n'expose
  // JAMAIS la valeur ni un fragment, seulement si la variable est definie.
  // Cela repond a « la cle est-elle bien posee en production ? » ; savoir si
  // c'est la BONNE cle ne peut se verifier qu'en envoyant une vraie requete.
  const providers: Record<string, boolean> = {
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    cohere_rerank: !!process.env.COHERE_API_KEY,
    tavily_web: !!process.env.TAVILY_API_KEY,
  }

  // Sans DeepSeek ni Gemini, aucun modele du palier gratuit ne repond.
  if (!providers.deepseek && !providers.gemini) {
    checks.models = 'down'
  } else if (!providers.deepseek || !providers.gemini) {
    checks.models = 'degraded'
  } else {
    checks.models = 'ok'
  }

  const allOk = Object.values(checks).every(v => v === 'ok')
  const anyDown = Object.values(checks).some(v => v === 'down')

  const status = allOk ? 'ok' : anyDown ? 'degraded' : 'degraded'
  const httpStatus = anyDown ? 503 : 200

  const body = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    latency_ms: Date.now() - t0,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    services: checks,
    providers,
    proxy: 'nexora-mu-henna.vercel.app',
  }

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': status,
    },
  })
}

// Support HEAD for uptime monitors that use HEAD requests
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
