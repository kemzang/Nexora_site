import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

// ── Config ───────────────────────────────────────────────────────────────────
// Backs the `@web` chat context provider (core/context/providers/WebContextProvider.ts)
// in the Nexora client. Replaces Continue Dev Inc.'s third-party trial proxy —
// queries now go straight to our own Tavily account instead of leaking through
// infrastructure we don't control.
const TAVILY_SEARCH_URL = 'https://api.tavily.com/search'
const UPSTREAM_TIMEOUT_MS = 20_000
const MAX_QUERY_LENGTH = 2000
const DEFAULT_N = 6
const MAX_N = 20 // Tavily's own hard cap on max_results

interface TavilySearchResult {
  title?: string
  url?: string
  content?: string
}

interface TavilySearchResponse {
  results?: TavilySearchResult[]
}

// Shape expected by core/index.d.ts ContextItem — content/name/description are
// required there, uri is optional ({ type: "file" | "url", value: string }).
interface WebContextItem {
  name: string
  description: string
  content: string
  uri: { type: 'url'; value: string }
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth — same scheme as every other /api/proxy/* route: Supabase JWT or
    // nxr_ API key via verifyToken. Required so an unauthenticated caller can't
    // burn through the Tavily quota.
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Input validation ────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 })
    }
    const { query, n } = body as { query?: unknown; n?: unknown }

    if (typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'query must be a non-empty string' }, { status: 400 })
    }
    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `query too long (max ${MAX_QUERY_LENGTH} chars)` },
        { status: 400 },
      )
    }

    let maxResults = DEFAULT_N
    if (n !== undefined) {
      if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: 'n must be a positive number' }, { status: 400 })
      }
      // Clamp rather than reject: callers (e.g. the docs-aware @web provider)
      // may legitimately ask for more than Tavily allows — cap instead of
      // failing the whole request.
      maxResults = Math.min(Math.floor(n), MAX_N)
    }

    // ── Provider configured? ────────────────────────────────────────────────
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'web search not configured' }, { status: 503 })
    }

    // ── Upstream call ───────────────────────────────────────────────────────
    let upstreamResp: Response
    try {
      upstreamResp = await fetch(TAVILY_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          search_depth: 'basic',
          include_answer: false,
          include_raw_content: false,
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'TimeoutError'
      console.error('[proxy/web] upstream fetch failed:', err)
      return NextResponse.json(
        { error: timedOut ? 'Web search timed out' : 'Failed to reach web search provider' },
        { status: 502 },
      )
    }

    if (!upstreamResp.ok) {
      // Surface 429 as-is (rate limit), collapse everything else to 502 so we
      // never forward a raw upstream stack trace / provider-internal detail.
      let detail = ''
      try {
        detail = (await upstreamResp.text()).slice(0, 500)
      } catch {
        // ignore — best-effort detail only
      }
      console.error(`[proxy/web] upstream error ${upstreamResp.status}:`, detail)
      return NextResponse.json(
        { error: `Web search provider error (${upstreamResp.status})` },
        { status: upstreamResp.status === 429 ? 429 : 502 },
      )
    }

    let data: TavilySearchResponse
    try {
      data = await upstreamResp.json()
    } catch {
      return NextResponse.json(
        { error: 'Web search provider returned invalid JSON' },
        { status: 502 },
      )
    }

    const results = Array.isArray(data.results) ? data.results : []
    const contextItems: WebContextItem[] = results
      .filter((r): r is TavilySearchResult & { url: string } => typeof r.url === 'string')
      .map((r) => {
        const title = r.title?.trim()
        const content = r.content ?? ''
        return {
          name: title || r.url,
          description: content.slice(0, 200) || title || r.url,
          content,
          uri: { type: 'url', value: r.url },
        }
      })

    return NextResponse.json(contextItems)
  } catch (err) {
    console.error('[proxy/web] error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
