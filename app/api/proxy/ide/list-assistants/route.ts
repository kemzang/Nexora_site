import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-mu-henna.vercel.app'

// Modèles disponibles selon le plan
function getModelsForPlan(plan: string, token: string) {
  const apiBase = `${BASE_URL}/api/proxy/model-proxy`

  const miniModel = {
    title: 'Nexora Mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiBase,
    apiKey: token,
  }

  const proModel = {
    title: 'Nexora Pro (GPT-4o)',
    provider: 'openai',
    model: 'gpt-4o',
    apiBase,
    apiKey: token,
  }

  const deepseekModel = {
    title: 'Nexora DeepSeek',
    provider: 'openai', // Continue utilise le format OpenAI
    model: 'deepseek-chat',
    apiBase,
    apiKey: token,
  }

  switch (plan) {
    case 'pro':
      return { models: [proModel, miniModel], autocomplete: miniModel }
    case 'enterprise':
      return { models: [proModel, deepseekModel, miniModel], autocomplete: miniModel }
    default: // free
      return { models: [miniModel], autocomplete: miniModel }
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer le plan actif de l'utilisateur
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_id, status, subscription_plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Déterminer le plan (free par défaut)
    const planName = (subscription?.subscription_plans as { name?: string } | null)?.name?.toLowerCase() || 'free'
    const { models, autocomplete } = getModelsForPlan(planName, token)

    const assistants = [
      {
        id: 'nexora-assistant',
        name: 'Nexora AI',
        description: `Assistant IA Nexora - Plan ${planName}`,
        slug: 'nexora/nexora-assistant',
        iconUrl: null,
        configJson: JSON.stringify({
          name: 'Nexora AI',
          models,
          tabAutocompleteModel: autocomplete,
        }),
        ownerType: 'organization',
        ownerSlug: 'nexora',
      }
    ]

    return NextResponse.json(assistants)
  } catch (err) {
    console.error('list-assistants error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
