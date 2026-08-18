// Cache clé/valeur partagé (Upstash Redis REST), utilisé pour que les données
// mises en cache (plan utilisateur, quota mensuel, etc.) soient cohérentes
// entre toutes les instances serverless — pas seulement dans le process qui a
// traité la requête. Suit le même pattern REST-only (sans SDK) que
// `middleware.ts` (upstashRateLimit), pour rester compatible Edge + Node.
//
// Si UPSTASH_REDIS_REST_URL / TOKEN ne sont pas configurées (dev local, ou pas
// encore provisionné), get() renvoie toujours null et set() ne fait rien : les
// appelants doivent garder leur repli existant (cache en mémoire du process
// et/ou lecture Supabase) — voir getUserPlan/getUserCreatedAt/checkMonthlyLimit
// dans app/api/proxy/model-proxy/v1/chat/completions/route.ts pour l'usage.

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function pipeline(commands: (string | number)[][]): Promise<any[] | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    // Upstash indisponible/injoignable — l'appelant doit se rabattre sur sa
    // propre logique (cache mémoire / Supabase), jamais throw ici.
    return null
  }
}

/** Lit une valeur JSON mise en cache. Renvoie null si absente, expirée, ou si Upstash n'est pas configuré. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const results = await pipeline([['GET', key]])
  const raw = results?.[0]?.result
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Écrit une valeur JSON avec expiration (secondes). No-op silencieux si Upstash n'est pas configuré. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await pipeline([['SET', key, JSON.stringify(value), 'EX', Math.max(1, Math.floor(ttlSeconds))]])
}

export const isDistributedCacheConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN)
