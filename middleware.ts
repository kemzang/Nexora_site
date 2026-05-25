import { NextRequest, NextResponse } from 'next/server'

// ── Rate limiting ────────────────────────────────────────────────────────────
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL is configured (production),
// falls back to in-memory sliding window for local dev.
const RATE_WINDOW_MS = 60_000
const RATE_MAX_REQUESTS = 120

// In-memory fallback (single-instance only)
const localWindows = new Map<string, number[]>()

function localRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const hits = (localWindows.get(ip) ?? []).filter(t => t > now - RATE_WINDOW_MS)
  hits.push(now)
  localWindows.set(ip, hits)
  const remaining = Math.max(0, RATE_MAX_REQUESTS - hits.length)
  const resetIn = Math.ceil(((hits[0] ?? now) + RATE_WINDOW_MS - now) / 1000)
  return { allowed: hits.length <= RATE_MAX_REQUESTS, remaining, resetIn }
}

async function upstashRateLimit(
  ip: string,
  url: string,
  token: string,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `rl:${ip}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - 60

  // Use Upstash REST API directly — no SDK needed in Edge runtime
  const pipeline = [
    ['ZREMRANGEBYSCORE', key, '-inf', windowStart],
    ['ZADD', key, now, `${now}-${Math.random()}`],
    ['ZCARD', key],
    ['EXPIRE', key, 60],
  ]

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  })

  if (!res.ok) {
    // Upstash unavailable — fail open with in-memory fallback
    return localRateLimit(ip)
  }

  const results: { result: number }[] = await res.json()
  const count = results[2]?.result ?? 0
  const remaining = Math.max(0, RATE_MAX_REQUESTS - count)
  return { allowed: count <= RATE_MAX_REQUESTS, remaining, resetIn: 60 }
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    return upstashRateLimit(ip, upstashUrl, upstashToken)
  }
  return localRateLimit(ip)
}

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://nexora-mu-henna.vercel.app',
  'vscode-webview://',
  'vscode-file://',
  'http://localhost:3000',
  'http://localhost:5173',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    !origin ||
    ALLOWED_ORIGINS.some(o => origin.startsWith(o)) ||
    /^vscode-/.test(origin)

  return {
    'Access-Control-Allow-Origin': allowed ? (origin ?? '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nexora-Version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  // Model-proxy: auth pre-check + distributed rate limit
  if (pathname.startsWith('/api/proxy/model-proxy/')) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header missing', hint: 'Send: Authorization: Bearer <nexora_token>' },
        { status: 401, headers: corsHeaders },
      )
    }

    const looksValid = token.startsWith('nxr_') || token.startsWith('eyJ')
    if (!looksValid) {
      return NextResponse.json(
        { error: 'Invalid token format', hint: 'Token must start with nxr_ or be a valid JWT' },
        { status: 401, headers: corsHeaders },
      )
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    const { allowed, remaining, resetIn } = await checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retry_after: resetIn },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(resetIn),
            'X-RateLimit-Limit': String(RATE_MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + resetIn),
          },
        },
      )
    }

    const res = NextResponse.next()
    Object.entries({
      ...corsHeaders,
      'X-RateLimit-Limit': String(RATE_MAX_REQUESTS),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + resetIn),
      'X-Accel-Buffering': 'no',
    }).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  if (pathname.startsWith('/api/proxy/') || pathname.startsWith('/api/auth/')) {
    const res = NextResponse.next()
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/proxy/:path*', '/api/auth/:path*'],
}
