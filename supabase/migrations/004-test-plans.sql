-- ──────────────────────────────────────────────────────────────────────────
-- 004 — Forfaits de TEST temporaires (à désactiver après les tests).
--   • test1 : $1, dure 1 semaine, 30K crédits (petit budget de test)
--   • test2 : $2, dure 2 semaines, 50K crédits (petit budget de test)
-- La limite de collaborateurs n'est PAS stockée ici : elle vient de lib/models.ts
-- (appliquée à la création d'une session via collaboration_rooms.max_members).
--
-- À exécuter une fois dans le SQL Editor de Supabase (UPSERT idempotent).
-- POUR LES DÉSACTIVER PLUS TARD :
--   UPDATE subscription_plans SET is_active = false WHERE slug IN ('test1','test2');
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO subscription_plans
  (name, slug, description, price, currency, billing_cycle, tokens_per_month, max_requests_per_day, features, sort_order, is_active)
VALUES
  ('Test 1 semaine',  'test1', 'Forfait de test — 1 semaine',  1, 'USD', 'weekly',   30000, 200,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"test":true}', 10, true),
  ('Test 2 semaines', 'test2', 'Forfait de test — 2 semaines', 2, 'USD', 'biweekly', 50000, 200,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"test":true}', 11, true)
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  price            = EXCLUDED.price,
  currency         = EXCLUDED.currency,
  billing_cycle    = EXCLUDED.billing_cycle,
  tokens_per_month = EXCLUDED.tokens_per_month,
  max_requests_per_day = EXCLUDED.max_requests_per_day,
  features         = EXCLUDED.features,
  sort_order       = EXCLUDED.sort_order,
  is_active        = true,
  updated_at       = CURRENT_TIMESTAMP;
