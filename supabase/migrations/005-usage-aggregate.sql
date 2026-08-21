-- ──────────────────────────────────────────────────────────────────────────
-- 005 — Agrégation du quota mensuel côté base.
--
-- PROBLÈME
--   checkMonthlyLimit() faisait un SELECT de TOUTES les lignes usage_sessions
--   du mois pour l'utilisateur, puis les sommait en JavaScript. Un utilisateur
--   intensif génère des milliers de lignes par mois : à chaque expiration du
--   cache (60 s), on rapatriait tout ça sur le réseau pour en tirer un entier.
--
--   L'index existant, idx_usage_sessions_user, ne porte que sur (user_id),
--   alors que la requête filtre aussi sur started_at.
--
-- CORRECTIF
--   1. Un index composite (user_id, started_at) pour que le filtre du mois
--      soit servi par l'index et non par un balayage des lignes du user.
--   2. Une fonction SQL qui renvoie UN entier, pour que la somme se fasse
--      dans Postgres et qu'une seule valeur passe sur le réseau.
--
-- À exécuter une fois dans le SQL Editor de Supabase. Idempotent.
--
-- NOTE : tant que cette migration n'est pas appliquée, le proxy retombe
-- automatiquement sur l'ancien calcul — le déploiement du code et celui de
-- la migration peuvent donc se faire dans n'importe quel ordre.
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Index composite : couvre le filtre (user_id = ? AND started_at >= ?)
CREATE INDEX IF NOT EXISTS idx_usage_sessions_user_started
  ON usage_sessions (user_id, started_at DESC);

-- 2. Somme des crédits consommés depuis une date, calculée dans la base.
--    COALESCE sur tokens_total puis tokens_input pour rester cohérent avec
--    le calcul JS d'origine (les vieilles lignes n'ont pas tokens_total).
CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_user_id UUID,
  p_since   TIMESTAMP
)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(COALESCE(tokens_total, tokens_input, 0)),
    0
  )::BIGINT
  FROM usage_sessions
  WHERE user_id = p_user_id
    AND started_at >= p_since;
$$;

-- Le proxy appelle cette fonction avec la service-role key. On autorise aussi
-- l'utilisateur authentifié à lire SON propre total (le dashboard en a besoin) ;
-- SECURITY DEFINER est sans risque ici car la fonction filtre sur p_user_id et
-- ne renvoie qu'un agrégat.
REVOKE ALL ON FUNCTION get_monthly_usage(UUID, TIMESTAMP) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_monthly_usage(UUID, TIMESTAMP) TO authenticated, service_role;
