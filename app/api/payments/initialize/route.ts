import { NextRequest, NextResponse } from 'next/server'
import { initializePayment } from '@/lib/notchpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency, email, name, phone, plan, description } = body

    if (!amount || !email || !name) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const reference = `nexora_${plan}_${Date.now()}`

    const result = await initializePayment({
      amount,
      currency: currency || 'XAF',
      email,
      name,
      phone,
      description: description || `Abonnement Nexora ${plan}`,
      reference,
      callbackUrl: `${appUrl}/checkout/callback`,
      metadata: { plan },
    })

    if (result.code === 201 || result.status === 'Accepted') {
      return NextResponse.json({
        success: true,
        reference: result.transaction.reference,
        authorizationUrl: result.authorization_url,
      })
    }

    return NextResponse.json({ error: result.message || 'Erreur initialisation' }, { status: 400 })
  } catch (err) {
    console.error('Payment init error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
