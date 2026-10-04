# Horizon — Integrations

## Principe

Toutes les intégrations externes sont isolées derrière des services / adapters.

Les modules métier ne dépendentent pas directement des fournisseurs externes.

---

# E-mail

Les boîtes CVS sont hébergées sur **Microsoft 365 / Exchange Online**.

Provider principal :

```text
Microsoft Graph
```

Provider secondaire :

```text
SMTP
```

Architecture :

```text
Horizon
↓
Messaging Service
↓
MailProvider
├── MicrosoftGraphMailProvider
└── SMTPMailProvider
```

Les modules métier ne dépendentent jamais directement de Microsoft Graph ou SMTP.

---

# Microsoft 365 / Graph

Les boîtes CVS sont hébergées sur Microsoft 365 / Exchange Online.

Microsoft Graph est donc le provider e-mail par défaut de Horizon.

Objectifs :

- expéditeur CVS réel ;
- pièces jointes ;
- identifiant provider ;
- gestion propre de la boîte ;
- éviter les mots de passe SMTP utilisateur.

---

# SMTP

SMTP reste disponible uniquement comme **fallback technique**.

Cas possibles :

- relais CVS ;
- boîte générique ;
- continuité de service si Graph est temporairement indisponible.

Configuration côté serveur uniquement.

Aucun mot de passe SMTP utilisateur ne doit être stocké côté frontend.

---

# PDF

```text
Document Service
↓
HTML
↓
Gotenberg
↓
PDF
```

Gotenberg est un service technique.

---

# Sage

## Rôle initial

Au lancement, **Sage reste la comptabilité officielle**.

Horizon produit les données de pré-comptabilité et les transmet via :

```text
Accounting Service
↓
AccountingProvider
↓
SageAccountingProvider
↓
API / export Sage
```

Selon les capacités disponibles de l’environnement Sage CVS, l’adapter pourra utiliser :

- API ;
- export de fichier ;
- ou une combinaison des deux.

Cette différence ne doit pas remonter dans les modules métier.

## Données / opérations envisagées

- clients / fournisseurs si nécessaire ;
- comptes ;
- journaux ;
- factures ;
- avoirs ;
- écritures ;
- règlements ;
- analytique ;
- statuts de synchronisation.

Chaque synchronisation conserve :

```text
objet Horizon
provider
identifiant Sage
statut
hash
date
tentatives
erreur éventuelle
```

Objectif :

- idempotence ;
- retry ;
- audit ;
- réconciliation.

## Évolution

À terme :

```text
AccountingProvider
├── SageAccountingProvider
└── HorizonAccountingProvider
```

Le module Facturation ne doit pas connaître le provider actif.

---

# SUPER PDP / facturation électronique

SUPER PDP est la **plateforme agréée sélectionnée** pour Horizon.

Intégration :

```text
Billing
↓
EInvoiceService
↓
EInvoiceProvider
↓
SuperPdpProvider
↓
SUPER PDP API
```

## Flux sortants

- factures clients ;
- avoirs ;
- données structurées ;
- pièces jointes autorisées ;
- suivi des statuts ;
- événements du cycle de vie ;
- e-reporting lorsque nécessaire.

## Flux entrants

- factures fournisseurs ;
- avoirs fournisseurs ;
- événements ;
- statuts ;
- documents associés.

Les factures fournisseurs reçues sont intégrées dans Horizon puis rapprochées des achats, commandes et projets lorsque possible.

## Formats

Le provider doit pouvoir gérer les formats structurés nécessaires à la facturation électronique, notamment selon les possibilités de SUPER PDP :

```text
Factur-X
UBL
CII
```

Le format interne Horizon ne doit pas dépendre directement du format externe.

## Synchronisation

Prévoir :

- envoi ;
- réception ;
- webhooks ;
- polling / rattrapage ;
- retry ;
- idempotence ;
- mapping des statuts ;
- journal des erreurs ;
- corrélation via identifiants externes.

## Abstraction

SUPER PDP est le provider initial.

L’interface reste générique :

```text
EInvoiceProvider
```

afin de permettre un changement futur de plateforme agréée sans modifier la logique métier de Facturation.

## Veille réglementaire

Les exigences réglementaires et le statut d’agrément du provider doivent être revérifiés lors des releases qui touchent à la facturation électronique.

---

# Stockage S3

PocketBase local au départ.

Évolution possible :

```text
S3 compatible
MinIO
Synology S3
```

sans changer la logique métier.

---

# API externes futures

Toute nouvelle intégration doit avoir :

```text
adapter
configuration
authentification
logs
gestion erreurs
retry si pertinent
statut de synchronisation
```

---

# Règle

Ne jamais faire dépendre un module métier d’un fournisseur spécifique lorsqu’une abstraction simple permet de l’éviter.

---

# Migration Odoo

Odoo est une **source de migration**, pas une dépendance runtime de Horizon.

Architecture :

```text
Odoo
↓
OdooMigrationProvider
↓
Import Service
↓
normalisation
↓
matching
↓
dry run
↓
validation
↓
Horizon
```

Le périmètre migrable peut inclure selon le besoin :

- sociétés ;
- contacts ;
- produits ;
- fournisseurs ;
- références fournisseurs ;
- prix ;
- opportunités ;
- devis ;
- commandes ;
- données historiques utiles.

Les identifiants Odoo sont conservés dans `core_external_references`.

Cela permet :

- reprise incrémentale ;
- relecture ;
- contrôle ;
- absence de doublon lors d’un nouvel import.

Aucune donnée Odoo n’est considérée valide sans passage par les règles de normalisation Horizon.

---

# Imports Excel Catalogues / Prix

Horizon accepte des fichiers Excel de catalogues / tarifs fournisseurs.

Pipeline :

```text
Excel
↓
mapping colonnes
↓
normalisation
↓
matching catalogue existant
↓
preview
↓
validation
↓
mise à jour
```

Le fichier peut contenir notamment :

- référence interne ;
- fabricant ;
- référence fabricant ;
- fournisseur ;
- référence fournisseur ;
- désignation ;
- prix ;
- devise ;
- quantité minimum ;
- délai.

Le matching doit privilégier les identifiants fiables avant le nom du produit.

Une ligne ambiguë est placée en conflit et nécessite une résolution.

Les imports doivent produire un rapport :

```text
créés
mis à jour
ignorés
conflits
erreurs
```

---

# Référence OnSite

`cre4tixdev/cvs-onsite-backend` est une référence fonctionnelle interne pour le planning des ressources.

Horizon reprend les concepts utiles :

- planning hebdomadaire ;
- collaborateurs internes / externes ;
- codes affaires ;
- jour / nuit ;
- plusieurs affectations ;
- Atelier / IDF / Déplacement ;
- absences ;
- copie de semaine ;
- multi-saisie.

Il n’existe pas de dépendance runtime entre Horizon et ce dépôt sauf décision ultérieure explicite.


# Multi-devise / taux de change

Provider V1 :

```text
ExchangeRateProvider
└── EcbExchangeRateProvider
```

Source unique :

```text
Banque centrale européenne / ECB
```

Horizon synchronise l’historique quotidien.

Chaque enregistrement conserve :

```text
base_currency
quote_currency
rate
rate_date
source = ECB
published_at
retrieved_at
```

Chaque document validé conserve son propre snapshot du taux effectivement appliqué.

Pour la fiscalité, Horizon peut conserver un `tax_exchange_rate` distinct, également sourcé BCE, afin de gérer une date fiscale différente sans introduire un deuxième provider.

Aucun fournisseur de taux commercial supplémentaire n’est requis en V1.

---

# Migration Odoo — périmètre et nettoyage

Avant la migration définitive, chaque domaine est classé :

```text
à migrer
à archiver hors Horizon
à ignorer
à nettoyer
```

L’assistant de migration doit permettre :

- sélection de la période historique ;
- détection des doublons ;
- normalisation sociétés / contacts ;
- normalisation références produits ;
- validation des statuts ;
- rapport d’anomalies.

Les données historiques non nécessaires au fonctionnement quotidien peuvent rester accessibles dans une archive séparée plutôt que d’être toutes injectées dans Horizon.

---

# Tarifs fournisseurs

Les imports doivent supporter des fichiers hétérogènes.

Le mapping est mémorisable par fournisseur.

Un profil d’import peut décrire :

- feuille Excel ;
- ligne d’en-tête ;
- colonne référence ;
- colonne description ;
- colonne prix ;
- colonne devise ;
- unité ;
- conditionnement ;
- quantité minimum ;
- date de validité.

Les tarifs datés futurs peuvent être importés avant leur date d’effet.

Les anciens tarifs restent historisés.


# API externe Horizon

Endpoint de base :

```text
/api/external/v1/
```

L’API est destinée aux intégrations validées avec des systèmes tiers.

Elle utilise une authentification par client API.

Exemple :

```http
Authorization: Bearer <api-key>
```

La clé identifie uniquement un **client technique**, pas un utilisateur humain.

## Ressources initiales possibles

L’exposition est désactivée par défaut.

Ressources potentiellement activables :

```text
contacts.companies
contacts.people
inventory.products
crm.opportunities
projects.projects
service.installed_assets
```

Chaque ressource nécessite une policy explicite.

Les ressources financières / comptables ne sont jamais ouvertes par défaut.

## Versioning

```text
/v1
/v2
```

Une rupture de contrat implique une nouvelle version.

## Pagination / erreurs

Prévoir un contrat cohérent :

```text
pagination
sorting
filters contrôlés
error codes
request_id
```

Les filtres disponibles sont définis par ressource et ne donnent jamais accès à une syntaxe PocketBase arbitraire.

## Webhooks futurs

L’architecture peut ultérieurement exposer des webhooks sortants.

Ils ne sont pas obligatoires en V1.

Si ajoutés :

- signature ;
- retry ;
- idempotence ;
- historique ;
- désactivation par endpoint.
