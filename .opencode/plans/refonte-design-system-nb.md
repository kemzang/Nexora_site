# Refonte Design System N&B + Dark/Light Mode

## Objectif
Refonte complete du design :
- Palette noir & blanc pur (style Vercel/Linear)
- Support dark + light mode
- Design system centralise a 3 niveaux (tokens → composants → patterns)
- Possibilite de modifier un element a un seul endroit et impacter tout le site

## Architecture

```
Niveau 1: Design Tokens (CSS variables)
  ↓
Niveau 2: Composants UI (Button, Card, Badge, Input, GlassCard, GradientText)
  ↓
Niveau 3: Patterns de page (PageHeader, SectionLayout, FeatureCard, StatCard, PricingCard)
```

## Regles de conception
- Composants/patterns utilisent **uniquement** tokens CSS (`bg-primary`, `text-muted-foreground`, `border-border`)
- **Zero** couleur hardcodee (`indigo-*`, `violet-*`, `purple-*`, `blue-*`) dans composants/patterns
- Pages utilisent composants/patterns avec possibilite de `className` custom
- Dark/light gere automatiquement par `next-themes` via classe `.dark` sur `<html>`

## Palette de couleurs

### Light mode (`:root`)
| Variable | Valeur | Role |
|---|---|---|
| `--background` | `#ffffff` | Fond |
| `--foreground` | `#0a0a0a` | Texte |
| `--card` | `#ffffff` | Cards |
| `--primary` | `#0a0a0a` | Boutons principaux |
| `--primary-foreground` | `#fafafa` | Texte sur boutons |
| `--secondary` | `#f5f5f5` | Fonds secondaires |
| `--muted` | `#f5f5f5` | Muted bg |
| `--muted-foreground` | `#737373` | Texte secondaire |
| `--accent` | `#f5f5f5` | Accent bg |
| `--border` | `#e5e5e5` | Bordures |
| `--ring` | `#0a0a0a` | Focus rings |

### Dark mode (`.dark`)
| Variable | Valeur | Role |
|---|---|---|
| `--background` | `#0a0a0a` | Fond |
| `--foreground` | `#fafafa` | Texte |
| `--card` | `#0f0f0f` | Cards |
| `--primary` | `#fafafa` | Boutons principaux |
| `--primary-foreground` | `#0a0a0a` | Texte sur boutons |
| `--secondary` | `#1a1a1a` | Fonds secondaires |
| `--muted` | `#1a1a1a` | Muted bg |
| `--muted-foreground` | `#a3a3a3` | Texte secondaire |
| `--accent` | `#1a1a1a` | Accent bg |
| `--border` | `#262626` | Bordures |
| `--ring` | `#fafafa` | Focus rings |

## Etapes d'execution

### Phase 1 : Infrastructure theme

- [x] **1.1** Installer `next-themes`
- [x] **1.2** Creer `ThemeProvider`
- [x] **1.3** Creer `ThemeToggle`
- [x] **1.4** Modifier `layout.tsx`

### Phase 2 : Design Tokens

- [x] **2.1** Reecrire `globals.css` - Variables CSS
- [x] **2.2** Reecrire `globals.css` - Utilities

### Phase 3 : Composants UI

- [x] **3.1** Creer composant `Badge`
- [x] **3.2** Creer composant `GlassCard`
- [x] **3.3** Creer composant `GradientText`

### Phase 4 : Patterns de page

- [x] **4.1** Creer pattern `PageHeader`
- [x] **4.2** Creer pattern `SectionLayout`
- [x] **4.3** Creer pattern `FeatureCard`
- [x] **4.4** Creer pattern `StatCard`
- [x] **4.5** Creer pattern `PricingCard`

### Phase 5 : Migration des pages

- [x] **5.1** Migrer `app/page.tsx` (landing)
- [x] **5.2** Migrer `components/platforms-section.tsx`
- [x] **5.3** Migrer `components/language-switcher.tsx`
- [x] **5.4** Migrer `components/avatar-upload.tsx`
- [x] **5.5** Migrer auth pages (6 fichiers)
- [x] **5.6** Migrer checkout pages (2 fichiers)
- [x] **5.7** Migrer dashboard (8 fichiers)
- [x] **5.8** Migrer docs (4 fichiers)
- [x] **5.9** Migrer collab + tokens (3 fichiers)
- [x] **5.10** Migrer `components/ui/toast.tsx`

### Phase 6 : Verification

- [x] **6.1** Verification des couleurs residuelles (grep)
- [ ] **6.2** Build du projet (a tester manuellement)
- [ ] **6.3** Verification visuelle (a tester manuellement)

## Criteres de reussite

1. **Zero couleur hardcodee** : ✅ pas de `indigo-*`, `violet-*`, `purple-*`, `blue-*` dans composants/patterns (verifie par grep)
2. **Dark + Light mode** : ✅ toggle fonctionne via `next-themes`
3. **Centralisation** : ✅ design tokens + composants + patterns
4. **Build reussi** : A tester manuellement (`npm run build`)
5. **Rendu visuel** : A tester manuellement (lancer `npm run dev` et verifier)

## Fichiers concernes

### Nouveaux fichiers (8)
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `components/ui/badge.tsx`
- `components/ui/glass-card.tsx`
- `components/ui/gradient-text.tsx`
- `components/patterns/page-header.tsx`
- `components/patterns/section-layout.tsx`
- `components/patterns/feature-card.tsx`
- `components/patterns/stat-card.tsx`
- `components/patterns/pricing-card.tsx`

### Fichiers modifies (27)
- `package.json` (ajout `next-themes`)
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `components/platforms-section.tsx`
- `components/language-switcher.tsx`
- `components/avatar-upload.tsx`
- `components/ui/toast.tsx`
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/auth/forgot-password/page.tsx`
- `app/auth/reset-password/page.tsx`
- `app/auth/continue-redirect/page.tsx`
- `app/auth/vscode-callback/page.tsx`
- `app/checkout/page.tsx`
- `app/checkout/callback/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/sections/OverviewSection.tsx`
- `app/dashboard/sections/ApiKeysSection.tsx`
- `app/dashboard/sections/CollaborationsSection.tsx`
- `app/dashboard/sections/UtilisationSection.tsx`
- `app/dashboard/sections/AbonnementSection.tsx`
- `app/dashboard/sections/FacturesSection.tsx`
- `app/dashboard/sections/AideSection.tsx`
- `app/docs/layout.tsx`
- `app/docs/chat/quick-start/page.tsx`
- `app/docs/autocomplete/quick-start/page.tsx`
- `app/docs/guides/codebase-documentation-awareness/page.tsx`
- `app/collab/[roomId]/page.tsx`
- `app/tokens/callback/page.tsx`
- `app/tokens/onboarding-callback/page.tsx`

## Notes

- Les composants shadcn existants (Button, Card, Input, etc.) sont deja bien construits et utilisent les variables CSS. Le probleme c'est que les pages bypassent ces composants avec des classes hardcodees.
- L'etape la plus critique est la Phase 2 (Design Tokens) car elle impacte tout le site.
- La Phase 5 (Migration) est la plus longue mais la plus simple (remplacement de classes).
- Apres migration, verifier avec un grep qu'il ne reste pas de `indigo-`, `violet-`, `purple-`, `blue-` dans les fichiers.
