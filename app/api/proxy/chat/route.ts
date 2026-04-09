import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Ces variables doivent être configurées sur le tableau de bord Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new NextResponse(JSON.stringify({ error: 'Server configuration error: Supabase keys missing' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialiser Supabase avec la clé service pour vérifier l'utilisateur et son solde
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Vérifier l'utilisateur via le token fourni par l'extension
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: Invalid user' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Vérifier le solde de tokens dans token_transactions
    const { data: transactions, error: balanceError } = await supabase
      .from('token_transactions')
      .select('balance_after')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (balanceError) {
       return new NextResponse(JSON.stringify({ error: 'Error checking balance' }), { 
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
    }

    // Si l'utilisateur n'a pas de transactions, il a peut-être un solde par défaut via le plan free
    // Pour l'instant on considère qu'une balance_after de 0 ou pas de transaction = pas de tokens
    const currentBalance = transactions && transactions.length > 0 ? transactions[0].balance_after : 0;
    
    if (currentBalance <= 0) {
      return new NextResponse(JSON.stringify({ error: 'Insufficient tokens. Please top up your account.' }), { 
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { messages, model, provider } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse(JSON.stringify({ error: 'Messages are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Configurer l'appel API vers le fournisseur
    let apiUrl = '';
    let apiKey = '';
    let selectedModel = model;
    
    if (provider === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = process.env.OPENAI_API_KEY!;
      selectedModel = model || 'gpt-4o';
    } else if (provider === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/chat/completions';
      apiKey = process.env.DEEPSEEK_API_KEY!;
      selectedModel = model || 'deepseek-chat';
    } else {
      // Par défaut OpenAI
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = process.env.OPENAI_API_KEY!;
      selectedModel = model || 'gpt-4o';
    }

    if (!apiKey) {
      return new NextResponse(JSON.stringify({ error: `API Key for ${provider || 'openai'} not configured on server` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({ error: 'AI Provider error' }));
      return new NextResponse(JSON.stringify(errorData), { 
        status: aiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transférer le flux de réponse directement
    return new NextResponse(aiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
