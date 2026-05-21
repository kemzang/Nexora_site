import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

/**
 * Reranking endpoint — used by Continue IDE for codebase search context.
 * Routes to Cohere or falls back to a simple BM25-style score if no key is configured.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { query, documents, model = 'rerank-english-v3.0', top_n } = body

    if (!query || !documents?.length) {
      return NextResponse.json({ error: 'query and documents are required' }, { status: 400 })
    }

    const cohereKey = process.env.COHERE_API_KEY

    // ── Cohere reranking ────────────────────────────────────────────────
    if (cohereKey) {
      const upstream = await fetch('https://api.cohere.com/v1/rerank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cohereKey}`,
          'X-Client-Name': 'nexora',
        },
        body: JSON.stringify({ query, documents, model, top_n: top_n ?? documents.length }),
      })

      if (!upstream.ok) {
        const err = await upstream.text()
        console.error('Cohere rerank error:', err)
        // Fall through to local scoring
      } else {
        const data = await upstream.json()
        // Normalize to OpenAI-like format
        return NextResponse.json({
          object: 'list',
          data: (data.results ?? []).map((r: { index: number; relevance_score: number }) => ({
            index: r.index,
            relevance_score: r.relevance_score,
            document: documents[r.index],
          })),
          model,
          usage: data.meta?.billed_units ?? {},
        })
      }
    }

    // ── Fallback: simple keyword-overlap scoring ────────────────────────
    const queryTokens = new Set(query.toLowerCase().split(/\s+/))
    const scored = documents.map((doc: string, index: number) => {
      const docTokens = doc.toLowerCase().split(/\s+/)
      const overlap = docTokens.filter((t: string) => queryTokens.has(t)).length
      const score = overlap / Math.max(queryTokens.size, 1)
      return { index, relevance_score: score, document: doc }
    })

    scored.sort((a: { relevance_score: number }, b: { relevance_score: number }) => b.relevance_score - a.relevance_score)

    return NextResponse.json({
      object: 'list',
      data: (top_n ? scored.slice(0, top_n) : scored),
      model: 'nexora-keyword-fallback',
      usage: {},
    })
  } catch (err) {
    console.error('rerank proxy error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
