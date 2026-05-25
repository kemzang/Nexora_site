import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

// sync-secrets: resolves FQSN (Fully Qualified Secret Names) to their values.
// Nexora does not use cloud secrets — return empty so the extension doesn't crash.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ secrets: {} })
}
