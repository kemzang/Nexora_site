-- ──────────────────────────────────────────────────────────────────────────
-- 005 — Corrige subscription_plans.free.tokens_per_month : la migration 003
-- l'avait seedé à 10 000, mais lib/models.ts (source de vérité) définit
-- 100 000 pour le plan Free. Ce décalage se voyait dans le dashboard
-- (OverviewSection / AbonnementSection lisent tokens_per_month depuis cette
-- table, avec repli sur ce même nombre) : un utilisateur Free voyait "X /
-- 10 000 crédits" alors que le serveur (lib/models.ts, source réelle de
-- l'application des quotas) l'autorisait jusqu'à 100 000.
--
-- À exécuter une fois dans le SQL Editor de Supabase.
-- ──────────────────────────────────────────────────────────────────────────

UPDATE subscription_plans
SET tokens_per_month = 100000,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'free';
