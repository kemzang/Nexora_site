// Config Sentry pour le runtime Node.js (la plupart des routes API).
//
// Le backend Nexora_site n'avait aucun monitoring d'erreurs — seulement des
// console.error() qui finissent dans les logs Vercel, sans alerting ni
// agrégation. Contraste net avec l'extension (core/util/sentry/), qui a son
// propre client Sentry dedie.
//
// Silencieux par defaut : sans NEXORA_SENTRY_DSN configure, Sentry.init()
// avec un dsn undefined ne fait rien (pas d'erreur, pas d'envoi) — donc ça
// ne casse jamais un build/déploiement qui n'a pas encore de projet Sentry.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXORA_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // Taux bas : suffisant pour du error tracking basique sans exploser le
  // volume/coût sur un projet qui vient de démarrer.
  tracesSampleRate: 0.1,

  // Pas de PII par défaut (adresses IP, cookies, etc.).
  sendDefaultPii: false,
});
