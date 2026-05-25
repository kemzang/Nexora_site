import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

// Embedding providers supported
const EMBEDDING_ROUTES: Record<string, { url: string; keyEnv: string; minPlan?: string }> = {
  'text-embedding-3-small': {
    url: 'https://api.openai.com/v1/embeddings',
    keyEnv: 'OPENAI_API_KEY',
    minPlan: 'pro',
  },
  'text-embedding-3-large': {
    url: 'https://api.openai.com/v1/embeddings',
    keyEnv: 'OPENAI_API_KEY',
    minPlan: 'business',
  },
  'gemini-embedding': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    keyEnv: 'GEMINI_API_KEY',
    minPlan: 'free',
  },
}

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
    const { model = 'gemini-embedding', input } = body

    if (!input) {
      return NextResponse.json({ error: 'input is required' }, { status: 400 })
    }

    const route = EMBEDDING_ROUTES[model]
    if (!route) {
      return NextResponse.json(
        { error: `Embedding model "${model}" not supported. Available: ${Object.keys(EMBEDDING_ROUTES).join(', ')}` },
        { status: 400 }
      )
    }

    const apiKey = process.env[route.keyEnv]
    if (!apiKey) {
      return NextResponse.json({ error: `API key not configured for ${model}` }, { status: 500 })
    }

    // Gemini has a different embedding API format
    if (model === 'gemini-embedding') {
      const texts = Array.isArray(input) ? input : [input]
      const embeddings = await Promise.all(
        texts.map(async (text: string) => {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
            }
          )
          const data = await res.json()
          return { object: 'embedding', embedding: data.embedding?.values ?? [], index: 0 }
        })
      )
      return NextResponse.json({
        object: 'list',
        data: embeddings,
        model: 'text-embedding-004',
        usage: { prompt_tokens: -1, total_tokens: -1 },
      })
    }

    // OpenAI-compatible format
    const upstream = await fetch(route.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      return NextResponse.json({ error: err }, { status: upstream.status })
    }

    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('embeddings proxy error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
