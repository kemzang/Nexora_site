import * as Sentry from "@sentry/nextjs";

/**
 * Capture une erreur serveur vers Sentry, en plus du console.error existant.
 * Best-effort : ne lève jamais, et ne fait rien si Sentry n'est pas
 * configuré (voir sentry.server.config.ts / sentry.edge.config.ts) — donc
 * safe à appeler partout sans condition.
 */
export function captureServerError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // best-effort — ne jamais casser la réponse pour ça
  }
}
