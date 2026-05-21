import { NextRequest, NextResponse } from 'next/server'

// ── In-memory sliding window rate limiter (per-IP, per edge instance) ──────
// Note: For production at scale, replace with Upstash Redis (see RATE_LIMIT_BACKEND below)
const rateLimitWindows = new Map<string, number[]>()
const RATE_WINDOW_MS = 60_000     // 1 minute
const RATE_MAX_REQUESTS = 120     // 120 req/min per IP on model-proxy routes

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const windowStart = now - RATE_WINDOW_MS
  const hits = (rateLimitWindows.get(ip) ?? []).filter(t => t > windowStart)
  hits.push(now)
  rateLimitWindows.set(ip, hits)

  const remaining = Math.max(0, RATE_MAX_REQUESTS - hits.length)
  const oldest = hits[0] ?? now
  const resetIn = Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000)

  return { allowed: hits.length <= RATE_MAX_REQUESTS, remaining, resetIn }
}

// ── CORS origins ─────────────────────────────────────────────────────────────
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
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  // ── Model-proxy routes: auth gate + rate limit ──────────────────────────
  if (pathname.startsWith('/api/proxy/model-proxy/')) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header missing', hint: 'Send: Authorization: Bearer <nexora_token>' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Basic token format validation (full validation happens inside each route)
    const looksValid = token.startsWith('nxr_') || token.length > 100
    if (!looksValid) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Rate limiting by IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    const { allowed, remaining, resetIn } = checkRateLimit(ip)
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
        }
      )
    }

    const res = NextResponse.next()
    Object.entries({
      ...corsHeaders,
      'X-RateLimit-Limit': String(RATE_MAX_REQUESTS),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + resetIn),
      'X-Accel-Buffering': 'no', // critical for SSE through Vercel/nginx
    }).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // ── All other proxy routes: just CORS ─────────────────────────────────────
  if (pathname.startsWith('/api/proxy/') || pathname.startsWith('/api/auth/')) {
    const res = NextResponse.next()
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/proxy/:path*',
    '/api/auth/:path*',
  ],
}
