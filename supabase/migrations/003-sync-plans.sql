-- ──────────────────────────────────────────────────────────────────────────
-- 003 — Synchronise subscription_plans avec lib/models.ts (source de vérité).
-- Le seed initial (nexora-complete.sql) avait des prix/quotas périmés et il
-- MANQUAIT le plan Starter. Le dashboard lit price + tokens_per_month depuis
-- cette table, et l'activation d'abonnement y prend tokens_per_month → tout doit
-- être à jour.
--
-- À EXÉCUTER une fois dans le SQL Editor de Supabase (idempotent : UPSERT).
-- Valeurs : free $0/10K · starter $5/4M · pro $12/15M · business $30/40M ·
--           enterprise $80/100M.
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO subscription_plans
  (name, slug, description, price, currency, billing_cycle, tokens_per_month, max_requests_per_day, features, sort_order, is_active)
VALUES
  ('Free',       'free',       'Pour débuter avec Nexora',          0,  'USD', 'monthly',     10000,  200,
   '{"chat":true,"completion":true,"agent":true,"support":"community"}', 1, true),
  ('Starter',    'starter',    'Pour bien démarrer',                 5,  'USD', 'monthly',   4000000,  500,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"support":"standard"}', 2, true),
  ('Pro',        'pro',        'Pour développeurs actifs',          12,  'USD', 'monthly',  15000000, 2000,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"support":"priority"}', 3, true),
  ('Business',   'business',   'Pour équipes',                      30,  'USD', 'monthly',  40000000, 5000,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"background":true,"team":true,"support":"priority"}', 4, true),
  ('Enterprise', 'enterprise', 'Pour grandes entreprises',          80,  'USD', 'monthly', 100000000, NULL,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"background":true,"team":true,"sso":true,"support":"24/7"}', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  price            = EXCLUDED.price,
  currency         = EXCLUDED.currency,
  tokens_per_month = EXCLUDED.tokens_per_month,
  max_requests_per_day = EXCLUDED.max_requests_per_day,
  features         = EXCLUDED.features,
  sort_order       = EXCLUDED.sort_order,
  is_active        = true,
  updated_at       = CURRENT_TIMESTAMP;
