# Nexora - Extension VS Code IA Personnalisée

Nexora est une extension VS Code qui fournit des services d'IA assistée par abonnement, similaire à Continue ou Cursor, mais avec notre propre infrastructure et modèle économique.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Un compte Supabase

### Installation

1. Clonez le repository :
```bash
git clone <repository-url>
cd nexora
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
```bash
cp .env.example .env.local
```

4. Lancez le serveur de développement :
```bash
npm run dev
```

5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🏗️ Architecture du Projet

### Structure des Dossiers

```
nexora/
├── app/                    # Pages Next.js App Router
│   ├── auth/              # Pages d'authentification
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Tableau de bord utilisateur
│   └── page.tsx          # Page d'accueil
├── components/            # Composants React réutilisables
│   └── ui/               # Composants UI shadcn/ui
├── hooks/                 # Hooks React personnalisés
├── lib/                   # Bibliothèques et utilitaires
│   └── supabase/         # Services Supabase
├── types/                 # Définitions TypeScript
└── supabase/             # Migrations et schéma SQL
```

### Technologies Utilisées

- **Frontend** : Next.js 16, React 19, TypeScript
- **Styling** : Tailwind CSS, shadcn/ui
- **Animations** : Framer Motion
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Formulaires** : React Hook Form, Zod
- **ICônes** : Lucide React

## 📊 Base de Données

Le schéma complet de la base de données est disponible dans `supabase/migrations/001_initial_schema.sql`.

### Tables Principales

- `users` : Informations des utilisateurs
- `subscription_plans` : Plans d'abonnement disponibles
- `user_subscriptions` : Abonnements actifs des utilisateurs
- `token_transactions` : Historique des transactions de tokens
- `api_keys` : Clés API des utilisateurs
- `usage_sessions` : Sessions d'utilisation de l'IA
- `ai_models` : Modèles IA disponibles
- `invoices` : Factures et paiements

## 🔐 Authentification

Le système d'authentification utilise Supabase Auth avec :

- Inscription et connexion par email/mot de passe
- Vérification par email
- Réinitialisation de mot de passe
- Gestion des sessions

## 💡 Fonctionnalités

### 🤖 Services IA
- **Chat IA** intégré dans VS Code
- **Auto-complétion** de code intelligente
- **Génération** de code contextuelle
- **Refactoring** et optimisation
- **Explication** de code

### 💰 Système d'Abonnement
- **Plans tarifaires** multiples (Free, Pro, Enterprise)
- **Gestion des tokens** d'utilisation
- **Paiement** par carte virtuelle (Stripe)
- **Facturation** mensuelle/annuelle

### 👥 Gestion des Utilisateurs
- **Authentification** via notre plateforme
- **Tableau de bord** personnel
- **Historique** d'utilisation
- **Gestion** du profil

## 🎨 Design System

Le projet utilise un design system moderne avec :

- **Palette de couleurs** : Dark theme avec accents purple/blue
- **Animations** : Framer Motion pour des transitions fluides
- **Composants** : shadcn/ui pour une cohérence visuelle
- **Responsive** : Mobile-first design

## 🚀 Déploiement

### Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key
```

### Build de Production

```bash
npm run build
npm start
```

## 📝 Scripts Disponibles

- `npm run dev` : Serveur de développement
- `npm run build` : Build de production
- `npm run start` : Serveur de production
- `npm run lint` : Linting du code

## 🤝 Contribuer

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add amazing feature'`)
4. Pushez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Contact

- **Website** : https://nexora.ai
- **Documentation** : https://docs.nexora.ai
- **Support** : support@nexora.ai
- **Twitter** : @nexora_ai

---

*Ce document est évolutif et sera mis à jour au fur et à mesure du développement du projet Nexora.*
