# Système de parrainage Nexora — Spécification

> **Statut : à implémenter plus tard** (après stabilisation du produit).
> Ce document est la source de vérité : il suffit de le repasser pour implémenter.

---

## 1. Principe fondamental — à ne JAMAIS confondre

**La récompense de parrainage est un CRÉDIT = de l'argent sur un porte-monnaie,
appliqué en réduction sur l'ABONNEMENT du parrain. Ce ne sont PAS des tokens.**

Conséquences directes :
- ❌ Aucune logique de tokens / modèles / quotas à toucher.
- ❌ **Aucun changement côté extension** (VS Code / JetBrains / CLI).
- ✅ C'est **uniquement de la facturation côté site** (appliqué au checkout).

Exemple : un parrain a **$3** de crédit parrainage → son prochain Starter ($5)
lui coûte **$2**. S'il a **$5+**, son Starter est **gratuit** ce mois-là.

---

## 2. Montants de récompense (décidés)

Le parrain reçoit un crédit **quand son filleul effectue son 1er paiement d'un
vrai plan**, selon le plan souscrit :

| Plan souscrit par le filleul | Crédit donné au parrain |
|------------------------------|-------------------------|
| Starter ($5)                 | **$0.50**               |
| Pro ($12)                    | **$1.00**               |
| Business ($30)               | **$1.00**               |
| Enterprise ($80)             | **$1.00**               |
| Free                         | **$0** (exclu)          |
| test1 / test2 ($1 / $2)      | **$0** (exclus — sinon perte) |

> Mapping à coder (slug → montant) :
> `{ starter: 0.50, pro: 1, business: 1, enterprise: 1, free: 0, test1: 0, test2: 0 }`

---

## 3. Flux complet

1. **Chaque utilisateur a un code de parrainage** unique (ex: `BRYAN42`) et un
   lien : `https://nexora-mu-henna.vercel.app/?ref=BRYAN42`.
2. Un visiteur arrive via ce lien → on stocke le code (cookie/localStorage)
   jusqu'à l'inscription.
3. À l'**inscription**, on enregistre `referred_by = <id du parrain>` sur le
   nouveau compte (le filleul).
4. Quand le filleul effectue son **1er paiement d'un plan payant ≥ Starter**
   (détecté dans l'activation d'abonnement, cf. `app/api/payments/verify`) :
   - on crédite le parrain du montant correspondant (table 2),
   - on marque le filleul comme « récompense versée » → **plus jamais** de
     nouvelle récompense pour ce filleul, même s'il change/re-souscrit.
5. Le parrain **utilise son solde automatiquement** à son prochain paiement :
   le montant à payer = `prix_plan - min(solde, prix_plan)`, et le solde est
   décrémenté d'autant.

**Récompense versée UNE SEULE FOIS par filleul, à vie.**

---

## 4. Règles anti-abus / garde-fous (indispensables)

1. **Une seule récompense par filleul** (flag `reward_granted` sur le filleul).
2. **Exclure free + forfaits test** du déclenchement (sinon perte sèche).
3. **Anti auto-parrainage** : le filleul doit être un compte **différent** du
   parrain — vérifier que `referred_by != self`, et idéalement bloquer si même
   email/domaine jetable, même méthode de paiement, ou même IP à l'inscription.
4. **Plafond mensuel** de crédits parrainage par compte (anti-farming), ex.
   $20/mois max — configurable.
5. Le crédit n'est **jamais retirable en cash** : il ne sert qu'à réduire un
   paiement d'abonnement (reste dans l'écosystème).
6. Récompense versée **après confirmation réelle du paiement** du filleul
   (jamais sur une intention de paiement non confirmée).

---

## 5. Modèle de données (Supabase)

### a) `user_profiles` (ou table équivalente) — ajouts
```sql
ALTER TABLE user_profiles ADD COLUMN referral_code VARCHAR(16) UNIQUE;     -- code du user
ALTER TABLE user_profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id); -- qui l'a parrainé
ALTER TABLE user_profiles ADD COLUMN referral_balance NUMERIC(10,2) NOT NULL DEFAULT 0; -- solde $ utilisable
ALTER TABLE user_profiles ADD COLUMN referral_reward_granted BOOLEAN NOT NULL DEFAULT false; -- récompense déjà versée pour CE filleul ?
```
> Générer `referral_code` à la création du compte (ex: 8 caractères alphanum).

### b) `referrals` — journal des récompenses (audit + idempotence)
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),  -- le parrain (reçoit le crédit)
  referred_id UUID NOT NULL REFERENCES auth.users(id),  -- le filleul
  plan_slug VARCHAR(50) NOT NULL,                        -- plan déclencheur
  reward_amount NUMERIC(10,2) NOT NULL,                  -- $ crédité
  payment_reference VARCHAR(255),                        -- réf. paiement du filleul (idempotence)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referred_id)  -- garantit 1 récompense max par filleul
);
```

---

## 6. Intégration au checkout (déduction du solde)

Dans `app/api/payments/initialize` (ou au moment de fixer le montant) :
- récupérer `referral_balance` du payeur,
- `montant_final = max(0, prix_plan - referral_balance)`,
- si `montant_final == 0` : activer l'abonnement directement sans passer par
  NotchPay (paiement entièrement couvert par le crédit),
- décrémenter `referral_balance` du montant appliqué (de façon atomique).

> ⚠️ Le crédit s'applique au **paiement d'abonnement**, jamais à autre chose.

---

## 7. Déclenchement de la récompense

Dans `app/api/payments/verify` → `activateSubscription()` (là où on active déjà
l'abonnement après paiement confirmé), AJOUTER après l'activation :

```
si (le filleul a un referred_by)
   ET (reward_granted == false pour ce filleul)
   ET (plan_slug ∈ {starter, pro, business, enterprise}) :
     reward = REWARD_MAP[plan_slug]
     -> insert referrals(referrer_id=referred_by, referred_id=filleul, plan_slug, reward, payment_reference)
     -> user_profiles[referred_by].referral_balance += reward
     -> user_profiles[filleul].referral_reward_granted = true
```
Idempotent grâce à `referrals.UNIQUE(referred_id)`.

---

## 8. Pages / UI à prévoir (site uniquement)

- **Dashboard → section « Parrainage »** : afficher le code/lien, le solde, le
  nombre de filleuls, l'historique des récompenses, un bouton « Copier le lien ».
- **Page d'inscription** : lire `?ref=CODE` (cookie) et l'enregistrer en
  `referred_by` à la création du compte.
- **Checkout** : afficher « Crédit parrainage appliqué : -$X » sur le récap.

---

## 9. Périmètre & estimation

- ✅ **100% côté site** (`Nexora_site`). Extension : **rien**.
- Tables + colonnes (SQL), génération du code, lecture `?ref=`, déduction
  checkout, déclenchement dans `verify`, section dashboard.
- Estimation : **≈ une demi-journée**.

---

## 10. Décisions actées (ne pas re-discuter)

- ✅ Récompense = **crédit (réduction d'abonnement)**, **pas** de cash, **pas**
  de tokens.
- ✅ Montants : **Starter $0.50**, **Pro/Business/Enterprise $1**, **free + test
  exclus**.
- ✅ **Une seule fois par filleul**, à son 1er paiement d'un plan payant réel.
- ✅ Garde-fous : anti auto-parrainage, plafond mensuel, jamais de cash-out.
- ⏳ **Timing** : à implémenter **après** stabilisation du produit (impact viral
  seulement quand il y a de la traction).
