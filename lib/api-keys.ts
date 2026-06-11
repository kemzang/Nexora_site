// Génération et durée de vie des clés d'API Nexora (`nxr_`).
//
// Sécurité :
// - le secret est tiré d'un CSPRNG (Web Crypto `getRandomValues`), jamais de
//   `Math.random()` (non cryptographique). 160 bits d'entropie réelle.
// - les clés expirent (par défaut 90 jours, configurable via NXR_KEY_TTL_DAYS).
//   La validation (lib/auth-verify.ts) refuse déjà les clés dont `expires_at`
//   est dépassé — il suffit donc de le renseigner à l'émission.

const DEFAULT_TTL_DAYS = 90;

/** Nombre de jours de validité d'une clé `nxr_`. */
export function apiKeyTtlDays(): number {
  const raw = Number(process.env.NXR_KEY_TTL_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_DAYS;
}

/** Hex cryptographiquement aléatoire (CSPRNG). `bytes` octets → 2*bytes chars. */
export function secureRandomHex(bytes = 20): string {
  const arr = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Génère une clé d'accès `nxr_` cryptographiquement aléatoire (160 bits). */
export function generateApiKey(): string {
  return `nxr_${secureRandomHex(20)}`;
}

/** Génère un code d'autorisation OAuth temporaire `nxr_auth_` (128 bits). */
export function generateAuthCode(): string {
  return `nxr_auth_${secureRandomHex(16)}`;
}

/** Date d'expiration ISO à appliquer à une nouvelle clé. */
export function apiKeyExpiresAt(): string {
  return new Date(
    Date.now() + apiKeyTtlDays() * 24 * 60 * 60 * 1000,
  ).toISOString();
}
