import { NextRequest, NextResponse } from 'next/server'
import { processPayment } from '@/lib/notchpay'

export async function POST(req: NextRequest) {
  try {
    const { reference, channel, phone } = await req.json()

    if (!reference || !channel) {
      return NextResponse.json({ error: 'Référence et channel requis' }, { status: 400 })
    }

    const data: Record<string, string> = {}
    if (phone) data.phone = phone

    const result = await processPayment(reference, channel, data)

    return NextResponse.json({
      success: result.code === 202 || result.status === 'Accepted',
      status: result.transaction?.status,
      message: result.message,
    })
  } catch (err) {
    console.error('Payment process error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
