import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-verify'

export const runtime = 'nodejs'

// policy: returns workspace policies (tool use, model restrictions, etc.)
// Return permissive defaults so the extension operates without restriction.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    tools: { allow: true },
    models: { allow: true },
    context: { allow: true },
  })
}
