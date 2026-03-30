# Nexora - Base de données (Supabase)

## Fichier unique

**`migrations/nexora-complete.sql`** — Tout est dedans. Copie-colle dans le SQL Editor de Supabase et exécute.

---

## Pourquoi chaque table existe

### `user_profiles`

Supabase fournit `auth.users` mais cette table ne stocke que email/password/metadata basique. On a besoin d'un profil étendu pour :
- Afficher le nom de l'utilisateur dans l'extension
- Stocker ses préférences (langue, modèle favori)
- Sauvegarder les settings de l'extension côté serveur (pour synchro entre machines)
- Savoir si l'onboarding est terminé

Un trigger `handle_new_user()` crée automatiquement le profil quand quelqu'un s'inscrit.

### `subscription_plans`

Les plans d'abonnement (Free, Pro, Business, Enterprise). Chaque plan définit :
- `tokens_per_month` — combien de tokens l'utilisateur peut consommer
- `max_requests_per_day` — limite journalière pour éviter les abus
- `allowed_models` — quels modèles IA sont accessibles avec ce plan (le plan Free n'a accès qu'à DeepSeek, le Pro débloque GPT-4o Mini et Claude Haiku, etc.)
- `features` — JSON qui dit quels modes sont activés (chat, agent, edit, background)

Pourquoi un JSON pour `allowed_models` et `features` ? Parce que ça évolue souvent et on ne veut pas modifier le schema à chaque nouveau modèle ou feature.

### `user_subscriptions`

Lie un utilisateur à un plan. Stocke :
- La période en cours (pour savoir quand renouveler)
- Les tokens restants (décrémentés à chaque utilisation)
- `stripe_subscription_id` — pour synchroniser avec Stripe quand un paiement arrive
- `cancel_at_period_end` — l'utilisateur a annulé mais garde l'accès jusqu'à la fin de la période

### `token_transactions`

Historique de chaque mouvement de tokens. Pourquoi c'est nécessaire :
- L'utilisateur veut voir "pourquoi mes tokens ont baissé"
- Pour le support client : tracer exactement ce qui s'est passé
- Pour les remboursements : on sait combien rendre
- `model_id` — quel modèle a consommé les tokens (GPT-4o coûte plus que DeepSeek)

### `api_keys`

Permet aux utilisateurs de générer des clés API pour utiliser Nexora en dehors de VS Code (scripts, CI/CD, autres éditeurs).
- `key_prefix` (ex: "nxr_ab12") — pour que l'utilisateur puisse identifier sa clé sans voir le hash complet
- `key_hash` — on ne stocke JAMAIS la clé en clair, seulement son hash
- `rate_limit_per_minute` — protection contre les abus par clé

### `ai_models`

Catalogue des modèles IA disponibles. Points importants :
- `context_window` — important pour l'extension qui doit savoir combien de contexte envoyer
- `cost_per_input_token` / `cost_per_output_token` — séparés car les providers facturent différemment l'input et l'output (ex: GPT-4o coûte 4x plus en output qu'en input)
- `requires_plan` — quel plan minimum pour accéder à ce modèle

Les modèles inclus : DeepSeek (modèle intégré gratuit), GPT-4o / GPT-4o Mini, Claude 3.5 Sonnet / Haiku, Gemini 2.0 Flash, Llama 3.3 70B.

### `user_model_configs`

Quand un utilisateur configure sa propre clé API OpenAI/Anthropic dans l'extension, il faut stocker ça côté serveur pour :
- Synchro entre machines (l'utilisateur change de PC, sa config suit)
- `api_key_encrypted` — la clé API est chiffrée, jamais en clair

### `chat_sessions` + `chat_messages`

Stockage des conversations. Sans ça :
- L'historique est perdu quand l'utilisateur change de machine
- Pas de possibilité de reprendre une conversation sur un autre appareil
- Pas de stats sur les conversations (durée moyenne, tokens par session)

`chat_sessions` stocke les métadonnées (titre, mode, modèle utilisé), `chat_messages` stocke chaque message avec son rôle (user/assistant/system/tool).

### `usage_sessions`

Suivi détaillé de chaque utilisation :
- `tokens_input` / `tokens_output` séparés — pour calculer les coûts précisément
- `duration_ms` — pour mesurer la performance
- `model_id` — quel modèle a été utilisé

### `assistants`

Assistants personnalisés (system prompt + modèle + config YAML). Permet de :
- Sauvegarder des assistants custom
- Les partager publiquement (`is_public`)
- Compter les téléchargements (`downloads`)

### `response_templates`

Templates de prompts réutilisables. Utile pour les équipes qui veulent standardiser leurs prompts.

### `invoices`

Facturation complète :
- `stripe_invoice_id` / `stripe_payment_intent_id` — pour la réconciliation avec Stripe
- `tax_amount` — obligatoire pour la facturation en Europe (TVA)
- `pdf_url` — lien vers le PDF de la facture généré par Stripe

### `webhook_events`

Quand Stripe envoie un webhook (paiement réussi, abonnement annulé, etc.), on le stocke ici :
- Idempotence : si Stripe renvoie le même webhook, on vérifie `event_id` UNIQUE pour ne pas le traiter deux fois
- Debug : si un paiement ne passe pas, on peut voir le payload exact reçu
- `status` (pending/processed/failed) — pour retraiter les webhooks échoués

### `system_logs`

Logs d'audit. Qui a fait quoi, quand, depuis quelle IP. Obligatoire pour :
- Sécurité (détecter les accès suspects)
- Conformité RGPD (traçabilité des actions)
- Debug support client

### `daily_usage`

Cache rapide pour les quotas journaliers. Sans cette table, pour vérifier "est-ce que l'utilisateur a dépassé sa limite aujourd'hui", il faudrait scanner toute la table `usage_sessions` avec un WHERE sur la date — lent et coûteux. Cette table est un compteur incrémenté à chaque requête, vérifiable en O(1).

---

## Sécurité (RLS)

Chaque table a du Row Level Security activé. Le principe :
- Un utilisateur ne voit QUE ses propres données (`auth.uid() = user_id`)
- Les plans et modèles sont en lecture publique (tout le monde peut voir les prix)
- Les assistants publics sont visibles par tous, les privés seulement par leur créateur
- Les messages de chat sont protégés via la session (on vérifie que la session appartient à l'utilisateur)

---

## Triggers

- `update_updated_at_column()` — Met à jour automatiquement `updated_at` quand une ligne est modifiée. Appliqué sur toutes les tables qui ont ce champ.
- `handle_new_user()` — Crée automatiquement un `user_profiles` quand un utilisateur s'inscrit via Supabase Auth. Utilise `SECURITY DEFINER` pour avoir les droits d'écriture même si l'utilisateur vient de se créer.

---

## Données initiales (seed)

### Plans

| Plan | Prix | Tokens/mois | Requêtes/jour | Modèles |
|------|------|-------------|---------------|---------|
| Free | 0€ | 500 | 50 | DeepSeek uniquement |
| Pro | 9.99€ | 10 000 | 500 | + GPT-4o Mini, Claude Haiku, Gemini, Llama |
| Business | 29.99€ | 50 000 | 2 000 | + GPT-4o, Claude Sonnet |
| Enterprise | 99.99€ | 200 000 | Illimité | Tous + modèles custom + SSO |

### Modèles IA

DeepSeek est le modèle intégré gratuit (c'est celui configuré dans l'extension). Les autres sont débloqués selon le plan. Les coûts par token sont basés sur les prix réels des providers en 2025.
