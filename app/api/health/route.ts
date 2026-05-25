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
