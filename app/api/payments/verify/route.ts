import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/notchpay'

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get('reference')
    if (!reference) {
      return NextResponse.json({ error: 'Référence requise' }, { status: 400 })
    }

    const result = await verifyPayment(reference)

    return NextResponse.json({
      success: true,
      status: result.transaction?.status,
      transaction: result.transaction,
    })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
