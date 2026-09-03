// Config Sentry pour le runtime Edge (middleware.ts, routes qui n'imposent
// pas `export const runtime = 'nodejs'`). Voir sentry.server.config.ts pour
// le contexte complet ; même comportement silencieux sans DSN configuré.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXORA_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
