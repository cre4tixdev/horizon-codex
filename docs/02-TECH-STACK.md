# Horizon — Tech Stack

## Stack principale

| Fonction | Technologie |
|---|---|
| Langage | TypeScript |
| Frontend | React |
| Build | Vite |
| Navigation | React Router |
| CSS | Tailwind CSS |
| UI | shadcn/ui |
| Icônes | Lucide |
| Données serveur | TanStack Query |
| Tableaux | TanStack Table |
| Formulaires | React Hook Form |
| Validation | Zod |
| WYSIWYG | Tiptap |
| Backend | PocketBase |
| Base | SQLite via PocketBase |
| Auth | PocketBase Auth |
| API | PocketBase REST + custom routes |
| Realtime | PocketBase Realtime SSE |
| Fichiers | PocketBase Files |
| Hooks serveur | PocketBase JS Hooks |
| Jobs | PocketBase Cron |
| Migrations | PocketBase Migrations |
| PDF | Gotenberg / Chromium |
| E-mail | Microsoft Graph (principal) + SMTP (fallback) |
| Comptabilité V1 | Sage via API / export |
| Comptabilité cible | Moteur comptable Horizon |
| Facturation électronique | SUPER PDP API |
| Tests | Vitest + Playwright |
| Packages | pnpm |
| Git | GitHub |
| CI/CD | GitHub Actions |
| Déploiement | Docker |

---

# Frontend

```text
React
+
TypeScript
+
Vite
```

Horizon est une SPA interne.

Pas de Next.js au lancement.

## Versions du socle initial — 4 octobre 2026

Les versions directes sont fixées dans `package.json` et les résolutions transitives dans `pnpm-lock.yaml`.

| Outil | Version initiale |
|---|---|
| Node recommandé | 24 LTS ; vérifications locales effectuées avec 25.2.1 |
| pnpm | 12.9.1 |
| React / React DOM | 19.3.0 |
| React Router | 8.4.0 |
| TanStack Query | 5.104.1 |
| Vite / plugin React | 8.3.2 / 6.1.1 |
| TypeScript | 6.0.3 |
| Tailwind / plugin Vite | 4.3.3 |
| ESLint / typescript-eslint | 10.12.0 / 8.71.0 |
| Vitest | 4.1.11 |
| Playwright | 1.63.0 |

TypeScript 6.0 est retenu car la version de `typescript-eslint` utilisée annonce une compatibilité inférieure à 6.1. Vitest 4 est compatible avec les versions Node déclarées par le projet, dont le Node 25 local ; Vitest 5 ne déclare pas ce support. Les contraintes de compatibilité ont été vérifiées dans les métadonnées du registre npm avant installation.

Inter et Montserrat sont distribuées localement via `@fontsource/inter` et `@fontsource/montserrat` 5.3.0. Ces deux packages servent uniquement les polices prescrites par la charte, sans appel à un service de polices externe ; seuls les styles latins et graisses nécessaires sont importés.

Le lot UI F06 ajoute les icônes Lucide et les premiers composants adaptés des patterns shadcn/ui :

| Dépendance | Version | Usage |
|---|---|---|
| `lucide-react` | 1.51.0 | Icônes de navigation, panneaux et actions |
| `radix-ui` | 1.6.7 | Slot pour les boutons/liens et Dialog pour focus, clavier et fermeture |
| `class-variance-authority` | 0.7.1 | Variantes des boutons partagés |
| `clsx` | 2.1.1 | Composition conditionnelle des classes |
| `tailwind-merge` | 3.7.0 | Fusion des classes Tailwind dans les composants partagés |

Ces dépendances constituent le socle des patterns shadcn/ui, sans générateur requis à l'exécution. Les primitives Radix évitent de réimplémenter la gestion accessible des dialogues. Les versions installées sont fixées dans le manifeste et le lockfile.

Le socle de connexion ajoute le SDK officiel PocketBase 0.28.1 (adapter et auth), React Hook Form 7.89.0 (formulaire) et Zod 4.6.5 (validation des entrées et réponses serveur). Ces dépendances appartiennent à la stack prévue et sont fixées dans le lockfile. Les dépendances restantes, notamment TanStack Table et Tiptap, seront ajoutées avec les fonctionnalités qui les utilisent. Aucune nouvelle technologie majeure n'est introduite.

---

# Design System

```text
Tailwind CSS
+
shadcn/ui
```

Composants Horizon à construire progressivement :

```text
HButton
HInput
HSelect
HCombobox
HDatePicker
HDialog
HDrawer
HBadge
HStatus
HDataTable
HPageHeader
HToolbar
HDocumentEditor
HMailComposer
HChatComposer
HActivityTimeline
```

---

# Données frontend

## TanStack Query

Utilisé pour :

- chargement ;
- cache ;
- mutations ;
- refresh ;
- invalidation ;
- erreurs.

Pas de Redux par défaut.

---

# Tableaux

## TanStack Table

Base des listes métier.

Composant cible :

```text
HDataTable
```

Fonctions :

- tri ;
- filtres ;
- pagination ;
- recherche ;
- sélection ;
- colonnes configurables ;
- colonnes redimensionnables si utile ;
- export ;
- actions multiples ;
- vues enregistrées à terme.

---

# Formulaires

```text
React Hook Form
+
Zod
```

---

# Backend

PocketBase est le backend principal et durable de Horizon.

Il fournit :

- SQLite ;
- API REST ;
- auth ;
- relations ;
- fichiers ;
- realtime ;
- API Rules ;
- migrations ;
- hooks ;
- cron ;
- administration.

---

# Chat

Le chat utilise :

```text
PocketBase REST
+
PocketBase Realtime SSE
```

Pas de serveur WebSocket supplémentaire en V1.

---

# Documents

## Tiptap

Utilisé pour :

- devis ;
- commandes ;
- BL ;
- factures ;
- e-mails ;
- documents libres.

Source principale :

```text
Tiptap JSON
```

Puis :

```text
JSON
→ HTML
→ Gotenberg
→ PDF
```

---

# PDF

## Gotenberg

Service dédié à la conversion HTML → PDF.

Il ne contient aucune logique métier.

---

# E-mail

Architecture :

```text
Horizon
↓
Mail Service
↓
MailProvider
├── MicrosoftGraphMailProvider   ← principal
└── SMTPMailProvider             ← fallback
```

Les modules métier ne parlent jamais directement à Microsoft Graph ou SMTP.

---

# Tests

```text
Vitest
+
Playwright
```

---

# Déploiement

```text
Docker
│
├── Horizon
│   ├── React
│   ├── PocketBase
│   └── SQLite
│
└── Gotenberg
```

---

# Technologies volontairement absentes

Ne pas ajouter sans besoin validé :

```text
PostgreSQL
Prisma
NestJS
Express
Next.js
Redis
Kafka
RabbitMQ
GraphQL
Kubernetes
Elasticsearch
Redux
```

---

# Finance & facturation électronique

Architecture de provider :

```text
AccountingProvider
├── SageAccountingProvider       ← V1 / comptabilité officielle
└── HorizonAccountingProvider    ← cible future
```

Facturation électronique :

```text
EInvoiceProvider
└── SuperPdpProvider
```

Les modules métier ne doivent pas appeler directement l’API Sage ou l’API SUPER PDP.


# Services transverses complémentaires

Sans ajouter de nouvelle infrastructure lourde, Horizon prévoit des services internes :

```text
SearchService
PricingService
MarginService
ApprovalService
NotificationService
ArchiveService
ExchangeRateService
```

Implémentation initiale :

```text
React / services métier
↓
repositories
↓
PocketBase
```

La recherche globale reste basée sur PocketBase et des index adaptés tant que les volumes ne justifient pas un moteur externe.

Aucun Elasticsearch n’est introduit en V1.

Les calculs monétaires utilisent une représentation déterministe et une bibliothèque / logique Decimal contrôlée côté serveur.

Les taux de change sont conservés en base avec leur date et leur source.


# API externe

L’API publique / partenaire est implémentée via des **routes serveur Horizon / PocketBase dédiées**.

Architecture :

```text
Client externe
↓
HTTPS
↓
External API Router
↓
Authentication / API Key
↓
Policy Engine
↓
Service métier
↓
Repository
↓
PocketBase
```

Interdictions :

```text
API externe → accès admin PocketBase
API externe → collections PocketBase sans couche métier
```

Authentification initiale :

```text
API key longue durée, hashée en base
```

Évolutions possibles :

```text
OAuth2 / client credentials
mTLS
```

uniquement si un besoin réel apparaît.

Le contrôle d’accès est granulaire jusqu’aux champs.


# Exchange rates / Auth V12

## Taux de change

Provider initial :

```text
ExchangeRateProvider
└── EcbExchangeRateProvider
```

Aucun second provider n’est nécessaire en V1.

Les taux BCE sont stockés localement avec leur date et leur source.

## Authentification

PocketBase Auth reste la base.

Méthodes prévues :

```text
Password auth
Microsoft OAuth2
```

Les deux peuvent coexister sur Horizon.

Le lien avec Microsoft ne remplace pas le modèle de rôles / permissions Horizon.
