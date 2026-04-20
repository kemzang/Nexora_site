import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { messages, model, stream = true, ...rest } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    // DeepSeek par défaut si aucun modèle passé
    let selectedModel = model || 'deepseek-chat'
    let apiUrl: string
    let apiKey: string

    if (!model || model.startsWith('deepseek')) {
      apiUrl = 'https://api.deepseek.com/chat/completions'
      apiKey = process.env.DEEPSEEK_API_KEY!
    } else {
      apiUrl = 'https://api.openai.com/v1/chat/completions'
      apiKey = process.env.OPENAI_API_KEY!
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 })
    }

    // Appel vers l'IA
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: selectedModel, messages, stream, ...rest }),
    })

    if (!aiResponse.ok) {
      const err = await aiResponse.text()
      return NextResponse.json({ error: err }, { status: aiResponse.status })
    }

    // Logger l'usage en arrière-plan (sans bloquer la réponse)
    void supabase.from('usage_sessions').insert({
      user_id: user.id,
      session_type: 'chat_proxy',
      metadata: { model: selectedModel, messages_count: messages.length }
    })

    // Retourner le stream directement
    return new NextResponse(aiResponse.body, {
      headers: {
        'Content-Type': aiResponse.headers.get('Content-Type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (err) {
    console.error('model-proxy error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
