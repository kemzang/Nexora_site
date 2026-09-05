import type { PlanId } from './models'

/**
 * Paddle price IDs — un produit/prix par plan payant, créés dans le
 * dashboard Paddle (Catalogue > Produits). Contrairement à Lemon Squeezy, le
 * checkout Paddle s'ouvre directement côté client (Paddle.Checkout.open)
 * avec l'ID du prix, donc ces IDs doivent être publics (NEXT_PUBLIC_) — ce
 * ne sont pas des secrets, juste des identifiants de catalogue.
 */
export const PADDLE_PRICE_IDS: Partial<Record<PlanId, string>> = {
  starter: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER,
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO,
  business: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS,
  enterprise: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE,
}

/** Un jeton client Paddle "test_..." pointe vers le sandbox, "live_..." vers la prod. */
export function isPaddleSandbox(clientToken: string | undefined): boolean {
  return !clientToken || clientToken.startsWith('test_')
}

/** Base URL de l'API Paddle server-side, selon PADDLE_ENV (voir .env.local). */
export function paddleApiBaseUrl(): string {
  return process.env.PADDLE_ENV === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com'
}

/** Extrait l'id de souscription Paddle depuis la référence stockée en base ("paddle_sub_<id>"). */
export function paddleSubscriptionIdFromReference(reference: string): string | null {
  const m = reference.match(/^paddle_sub_(.+)$/)
  return m ? m[1] : null
}
