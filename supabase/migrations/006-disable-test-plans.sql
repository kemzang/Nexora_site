-- ──────────────────────────────────────────────────────────────────────────
-- 006 — Désactive les forfaits de test (test1/test2), maintenant que le
-- checkout Paddle réel est validé en sandbox. AbonnementSection.tsx affiche
-- automatiquement tout plan actif non codé en dur (voir son commentaire
-- "extraPlans") — les repasser à is_active=false suffit à les faire
-- disparaître du dashboard, sans redéploiement.
--
-- À exécuter une fois dans le SQL Editor de Supabase.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE subscription_plans
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE slug IN ('test1', 'test2');
