import { NextResponse } from 'next/server'

/**
 * GET /api/config
 * Retourne les valeurs de configuration publiques pour les clients (extension VSCode, etc.)
 * Les NEXT_PUBLIC_* sont déjà publiques par design dans Next.js
 */
export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    backendVersion: '1.0.0',
  })
}
