# Horizon — Architecture

## Principe

Horizon est un **monolithe modulaire**.

Une seule application est déployée, mais le code est organisé en domaines fonctionnels isolés.

---

# Modules

```text
dashboard
messaging
calendar
contacts
crm
sales
purchasing
inventory
projects
service
time-reporting
leave
expenses
billing
accounting
documents
settings
```

---

# Structure générale

```text
src/
│
├── app/
├── core/
├── modules/
│   ├── dashboard/
│   ├── messaging/
│   ├── calendar/
│   ├── contacts/
│   ├── crm/
│   │   ├── opportunities/
│   │   ├── tenders/
│   │   └── activities/
│   ├── sales/
│   ├── purchasing/
│   ├── inventory/
│   ├── projects/
│   ├── service/
│   │   ├── installed-base/
│   │   ├── tickets/
│   │   ├── interventions/
│   │   └── maintenance/
│   ├── time-reporting/
│   ├── leave/
│   ├── expenses/
│   ├── billing/
│   ├── accounting/
│   ├── documents/
│   └── settings/
└── shared/
```

---

# Structure d’un module

## Socle implémenté — 4 octobre 2026

Le point d'entrée `src/main.tsx` monte `app/App.tsx`. `app/router.tsx` compose les routes publiques du module `dashboard` via son `index.ts`. `core/query` fournit le client TanStack Query et `core/config` valide la configuration publique. Les styles communs résident dans `shared/styles.css`.

Le module `dashboard` dispose de la structure de module ci-dessous ; sa page affiche désormais une structure de dashboard avec états vides et accès rapides. Les répertoires sans implémentation sont conservés par `.gitkeep` et ne contiennent aucune logique métier fictive. Les autres modules seront créés au démarrage de leurs lots.

`app/navigation.ts` décrit uniquement les espaces de navigation, sans donnée métier. Le router compose leurs pages temporaires via `app/pages/WorkspacePage.tsx`, signalées « À venir ». Ces pages seront remplacées par les routes publiques des modules lors de leur implémentation. La recherche `app/searchNavigation.ts` filtre ces espaces localement ; elle n'est pas la recherche globale de données métier de X02.

Les composants Horizon communs résident dans `shared/ui`, la composition des classes dans `shared/lib` et le pictogramme officiel dans `shared/branding`. Le layout reste dans `app/components/AppFrame.tsx`. Aucun indicateur chiffré, événement, utilisateur connecté ou permission métier n'est simulé.

ESLint interdit l'import direct du SDK PocketBase dans les couches UI ainsi que les imports directs de repositories depuis ces couches. Le socle natif est désormais préparé dans `src/core/auth/` (schemas, types, repository et services) et `src/core/pocketbase/client.ts` (adapter). Les pages et le guard passent par `SessionService`, jamais par le SDK. Les migrations et le hook serveur sont dans `pocketbase/` ; leur déploiement sur Synology reste à valider. Le realtime des modules métier reste à implémenter avec leurs repositories.

Exemple :

```text
modules/
└── sales/
    ├── components/
    ├── pages/
    ├── hooks/
    ├── schemas/
    ├── services/
    ├── repositories/
    ├── types/
    ├── routes/
    └── index.ts
```

---

# Frontière PocketBase

Règle fondamentale :

```text
UI
↓
Service métier
↓
Repository
↓
Adapter PocketBase
↓
PocketBase
```

Interdit dans un composant :

```ts
pb.collection("sales_quotes").getList()
```

Préférer :

```ts
sales.quotes.list()
sales.quotes.create()
sales.quotes.validate()
```

---

# Propriété des données

Chaque collection possède un module propriétaire.

Exemple :

```text
sales_quotes
→ sales

crm_opportunities
→ crm

crm_tenders
→ crm

messaging_chat_messages
→ messaging
```

Un autre module peut consommer une API exposée.

Il ne doit pas modifier directement les données privées du module.

---

# Relations entre modules

Relations fonctionnelles autorisées.

Exemple :

```text
Contacts
  ↓
CRM
  ├── opportunité directe
  └── opportunité AO
          ↓
        Ventes
  ↓
Projets
  ↓
Facturation
```

La relation ne donne pas le droit d’écrire directement dans la collection de l’autre module.

---

# Modules transverses

## Documents

Utilisé par :

```text
CRM / AO
Ventes
Achats
Stock
Projets
Dépenses
Facturation
Messagerie
```

Documents gère :

- fichiers ;
- templates ;
- versions ;
- génération ;
- PDF ;
- liens entre documents et objets métier.

Le module métier reste propriétaire de la donnée métier.

---

## Messagerie

Deux sous-domaines :

```text
E-mail
Chat interne
```

E-mail :

```text
Module métier
↓
Messaging Service
↓
MailProvider
```

Chat :

```text
UI
↓
Messaging Service
↓
Messaging Repository
↓
PocketBase REST + Realtime
```

---

## Calendrier

Calendrier agrège des événements provenant de plusieurs modules.

Exemples :

```text
CRM / AO
→ visites
→ remise
→ soutenances

CRM
→ rendez-vous

Projets
→ jalons

Congés
→ absences
```

Le calendrier n’est pas obligatoirement propriétaire de toutes les dates affichées.

Pour le volet AO, CRM demeure propriétaire des dates de publication, visites, remise et soutenances. Un fournisseur d’événements CRM les expose au service Calendrier après contrôle des permissions sur les dossiers sources. La vue spécialisée AO et le calendrier général consomment cette même agrégation et les composants partagés ; aucune duplication systématique dans `calendar_events`. Toute édition d’une date CRM revient au service métier CRM. Une référence stable à l’objet / événement source permet de retrouver le dossier et d’éviter les doublons. Le premier fournisseur AO est implémenté ; les fournisseurs Projets / Congés et les événements manuels restent à développer.

---

# AO dans le CRM

AO n’est pas un module racine séparé.

Il s’agit d’un **sous-domaine spécialisé du module CRM**.

Principe :

```text
CRM
├── Opportunités
├── Activités
└── AO
```

Une opportunité possède un type.

Minimum initial :

```text
direct
tender
```

Une opportunité `direct` utilise le workflow CRM classique.

Une opportunité `tender` possède en complément les informations spécifiques d’un appel d’offres :

- publication ;
- date limite de remise ;
- visites multiples ;
- Kanban AO ;
- planning ;
- tags ;
- documents ;
- archivage ;
- résultat.

Le code spécialisé AO est organisé dans :

```text
src/modules/crm/tenders/
```

et reste entièrement propriétaire du module `crm`.

`cvs-aoboard` sert de référence fonctionnelle et UX, pas d’architecture à recopier.

Architecture cible :

```text
CRM UI
↓
CRM / Tender Service
↓
CRM Repository
↓
PocketBase
```
---

# Realtime

Les abonnements PocketBase Realtime sont centralisés dans les repositories/adapters.

Éviter des `subscribe()` dispersés dans les composants.

---

# Logique métier

Frontend :

- saisie ;
- affichage ;
- navigation ;
- interactions.

Serveur :

- permissions ;
- numérotation ;
- transitions critiques ;
- cohérence ;
- audit ;
- opérations multi-records ;
- génération ;
- envoi contrôlé.

---

# Hooks PocketBase

```text
pocketbase/
└── pb_hooks/
    ├── core/
    ├── messaging/
    ├── contacts/
    ├── crm/
    │   └── tenders/
    ├── sales/
    ├── purchasing/
    ├── inventory/
    ├── projects/
    ├── time-reporting/
    ├── leave/
    ├── expenses/
    ├── billing/
    ├── accounting/
    ├── documents/
    └── settings/
```

---

# Migrations

```text
pocketbase/pb_migrations/
```

Toute modification du schéma est versionnée.

---

# Règles fondamentales

1. Chaque fonction appartient à un module.
2. Chaque collection possède un module propriétaire.
3. Pas d’accès PocketBase direct depuis les composants.
4. Pas d’écriture directe dans un autre module.
5. Les composants communs vont dans le Design System.
6. Les migrations sont versionnées.
7. La logique critique est côté serveur.
8. Les modules transverses exposent des API internes claires.
9. Pas de microservices sans besoin réel.
10. Toujours privilégier la solution la plus simple compatible avec le besoin.

---

# Architecture Finance

La Finance est conçue dès le départ pour fonctionner en plusieurs phases sans réécriture du module Facturation.

## Séparation des responsabilités

```text
Ventes / Achats
      │
      ▼
Facturation
      │
      ├───────────────┐
      │               │
      ▼               ▼
E-Invoicing      Comptabilité
      │               │
      ▼               ▼
EInvoiceProvider AccountingProvider
      │               │
      ▼          ┌────┴─────┐
SUPER PDP       Sage      Horizon
                V1         cible
```

`billing` reste propriétaire des factures et avoirs.

`accounting` reste propriétaire :

- des écritures ;
- des journaux ;
- des comptes ;
- des exercices ;
- des périodes ;
- du lettrage ;
- des rapprochements ;
- des exports / synchronisations comptables.

## Phase 1 — Sage

```text
Facture validée
↓
Accounting Service
↓
pré-comptabilité Horizon
↓
SageAccountingProvider
↓
Sage
```

Sage est la source de vérité comptable.

Horizon conserve suffisamment d’informations pour :

- savoir ce qui a été transmis ;
- éviter les doubles exports ;
- suivre les erreurs ;
- réconcilier les données ;
- préparer la future bascule.

## Phase 2 — Shadow accounting

Le moteur comptable Horizon peut être activé en parallèle de Sage :

```text
Facturation
   ↓
Accounting Service
   ├── Sage
   └── Horizon Accounting Engine
```

Sage reste officiel.

Les balances, journaux, TVA et comptes auxiliaires sont comparés.

## Phase 3 — Comptabilité Horizon

Après validation :

```text
AccountingProvider
↓
HorizonAccountingProvider
```

Horizon devient le moteur comptable principal.

Sage peut rester un système d’archive, d’export ou être retiré selon la décision future.

---

# Architecture Facturation électronique

La facturation électronique est indépendante de la comptabilité.

```text
Facturation
↓
EInvoiceService
↓
EInvoiceProvider
↓
SuperPdpProvider
↓
SUPER PDP
```

Cette séparation permet de changer de plateforme agréée sans modifier le module Facturation.

## Flux sortant

```text
Facture client validée
↓
snapshot immuable
↓
format structuré
↓
SUPER PDP
↓
statuts / événements
↓
Horizon
```

## Flux entrant

```text
SUPER PDP
↓
facture fournisseur
↓
Horizon
↓
Achats / contrôle
↓
Comptabilité
↓
Sage en Phase 1
```

Les webhooks et synchronisations de statuts sont traités côté serveur.

Ils doivent être idempotents.

---

# Architecture Analytique

Le compte analytique est transversal mais appartient au domaine `accounting`.

Création :

```text
Opportunité CRM
↓
code CRM
↓
accounting_analytic_accounts
```

Les modules métier référencent ensuite ce compte.

```text
CRM
Sales
Purchasing
Projects
TimeReport
Expenses
Billing
Inventory
        │
        └── analytic_account
```

Le module Comptabilité expose l’API interne de gestion analytique même lorsque Sage reste la comptabilité officielle.

Les modules ne doivent pas recréer leurs propres systèmes de codes affaires.

---

# Cycle de vie documentaire

Les documents opérationnels importants passent par une phase brouillon.

Pattern :

```text
draft
↓
validated / confirmed / posted
↓
sent / executed / completed
```

Exemples :

```text
Brouillon devis
→ Devis validé
→ Envoyé
→ Accepté / Refusé

Brouillon commande fournisseur
→ Commande validée
→ Envoyée

Brouillon facture
→ Facture validée
→ Comptabilisation / e-invoicing
```

La validation est une transition métier côté serveur.

Un document validé peut devenir non modifiable ou partiellement verrouillé selon son type.

Les numéros officiels sont attribués selon les règles propres au document, côté serveur.

---

# Architecture Approvisionnement

Une vente peut créer un besoin d’achat.

```text
Devis / Commande client
↓
Procurement Service
↓
Demande d’achat
↓
suggestion fournisseur
↓
Commande(s) fournisseur
```

Le moteur d’approvisionnement tient compte de :

- produit ;
- composants éventuels ;
- quantité ;
- stock disponible ;
- règle de réapprovisionnement ;
- fournisseurs du produit ;
- fournisseur privilégié ;
- prix ;
- délai ;
- code analytique.

Une demande d’achat peut contenir plusieurs codes analytiques.

La ventilation analytique est conservée lors de la conversion en commande fournisseur.

---

# Architecture Catalogue Produits

Le catalogue est propriétaire du module `inventory`.

```text
Produit
├── catégorie
├── type métier
├── politique de stock
├── politique de réappro
├── images
├── fournisseurs
└── composants
```

Le **type métier** et la **politique logistique** sont séparés.

Exemple :

```text
kind = service
stock_policy = none

kind = equipment
stock_policy = stocked
tracking = serial

kind = consumable
stock_policy = stocked
tracking = none
```

Cette séparation évite de figer des règles trop rigides.

---

# Architecture Imports

Tous les imports passent par un pipeline commun.

```text
Source
├── Odoo
└── Excel
      ↓
Import Service
      ↓
Normalisation
      ↓
Matching
      ↓
Preview / Dry Run
      ↓
Conflits éventuels
      ↓
Validation
      ↓
Écriture Horizon
```

Les imports disposent d’identifiants externes et de hashes permettant de les rejouer sans duplication.

Un import ambigu ne crée pas automatiquement un doublon.

---

# Activity Feed transverse

Les pages métier peuvent afficher un fil d’activité commun.

```text
Objet métier
↓
Activity Service
├── changement
├── note
├── message
├── mention
└── tâche
```

Le fil d’activité utilisateur est distinct de `core_audit`.

```text
core_audit
→ preuve / sécurité / traçabilité technique

core_activity_events
→ historique métier lisible dans l’interface
```

Les mentions génèrent des notifications.

Les tâches peuvent être rattachées à n’importe quel objet Horizon.

---

# Planning ressources

Le planning prévisionnel et les temps réels sont distincts.

```text
Planning
→ ce qui est prévu

TimeReport
→ ce qui a réellement été réalisé
```

Ils partagent :

- utilisateur ;
- code analytique ;
- projet éventuel ;
- type de travail ;
- date.

Le planning Horizon s’inspire fonctionnellement de `cvs-onsite-backend`, sans reprendre son architecture.

Il doit notamment permettre :

- vue semaine ;
- ligne par collaborateur ;
- internes / externes ;
- journée / nuit ;
- plusieurs codes par jour ;
- Atelier / IDF / Déplacement ;
- BE / Production ;
- copie de semaine ;
- multi-saisie sur plusieurs jours.

Les congés / absences proviennent autant que possible du module `leave` plutôt que d’être dupliqués dans le planning.


# Architecture Pricing / Margin

Les calculs de prix et marge ne doivent pas être dispersés dans les composants.

```text
Sales / Purchasing / Projects
        ↓
PricingService
MarginService
        ↓
catalogue / suppliers / tax / exchange rates / analytic
```

`PricingService` gère :

- prix catalogue ;
- listes tarifaires ;
- prix spécifiques clients ;
- remises ;
- unités ;
- devises ;
- taxes par défaut ;
- conversion de devise.

`MarginService` consolide :

```text
revenus
coûts produits
achats
stock consommé
heures
dépenses
```

Le coût horaire est obtenu via une règle centralisée :

```text
utilisateur
ou
profil de coût
ou
équipe / service
```

Le coût réellement applicable à une heure doit être historisé ou snapshoté afin qu’un changement futur de coût n’altère pas une affaire ancienne.

---

# Architecture Validation

Horizon ne met pas en place de moteur de seuils ou d’approbateurs automatiques.

Le workflow reste simple :

```text
draft
↓
validated / confirmed / posted
```

La capacité à valider dépend des permissions Horizon.

Exemples :

```text
sales.quote.validate
purchasing.order.validate
billing.invoice.validate
```

Aucune règle du type `montant > X`, `marge < Y` ou `approbateur automatique` n’est prévue dans le scope actuel.

---

# Architecture Révisions commerciales

Une révision de devis ne réécrit pas silencieusement l’historique d’un devis déjà envoyé.

Principe :

```text
opportunité #11450
├── devis 11450-1
│   ├── révision 0
│   └── révision 1
├── devis 11450-2
└── devis 11450-3
```

Les versions finalisées restent consultables.

Une commande peut être créée pour tout ou partie d’un devis accepté.

---

# Architecture Stock réel

Le stock distingue :

```text
physical_quantity
reserved_quantity
available_quantity
```

Avec :

```text
available = physical - reserved
```

Les mouvements sont la source de vérité opérationnelle.

Les numéros de série / lots sont gérés par unités de suivi distinctes.

Un stock peut être :

- général ;
- réservé à une commande ;
- réservé à un projet / compte analytique ;
- en transit ;
- en retour / quarantaine.

---

# Architecture Project Control

Le projet est un objet d’exécution distinct de l’opportunité, mais lié au même compte analytique.

## Cardinalités commerciales

```text
1 Opportunité
→ N Devis
→ N Devis acceptés possibles
→ N Commandes client
→ 0..N Projets
```

Cas courant :

```text
Opportunité #11450
├── Commande A ─┐
├── Commande B ─┼→ Projet principal #11450
└── Commande C ─┘
```

Une commande client peut être rattachée à un projet existant de l’opportunité.

La création d’un nouveau projet n’est proposée que lorsqu’un découpage opérationnel distinct est réellement nécessaire.

Les projets issus d’une même opportunité reprennent par défaut le même compte analytique.

## Statut global du projet

Le statut global reste volontairement simple :

```text
draft
active
on_hold
closing
closed
cancelled
```

Les étapes métier détaillées sont représentées par des **phases**, pas par une multiplication des statuts projet.

## Phases

Modèle de référence :

```text
Kick-off
BE / Engineering
Approvisionnement
Production / Préparation
Livraison
Installation
Commissioning
Recette
Levée des réserves
Handover / Documentation
```

Chaque phase peut être :

- activée ;
- ignorée ;
- adaptée ;
- ordonnée selon le type de projet.

## Jalons

Exemples :

```text
kick-off
design freeze
FAT
livraison site
début installation
SAT
recette
levée des réserves
handover
```

## Recette

La recette appartient au module `projects`.

```text
Projet
↓
Acceptance Service
├── PV
├── réserves
├── signatures
└── documents
```

Une recette peut être :

```text
interne
FAT
SAT
partielle
finale
```

Les réserves possèdent leur propre cycle de vie.

## Clôture

La clôture est séparée en deux dimensions.

```text
operational_status
financial_status
```

Clôture opérationnelle :

- phases nécessaires terminées ;
- recette effectuée ;
- réserves résolues ou dérogées ;
- documentation remise ;
- parc installé constitué lorsque pertinent.

Clôture financière :

- coûts consolidés ;
- achats traités ;
- temps validés ;
- facturation traitée ;
- autres critères Finance selon configuration.

La fermeture opérationnelle ne doit pas être bloquée uniquement parce qu’un règlement financier reste ouvert.

## Passage vers le SAV

À la mise en service / recette :

```text
livraisons sérialisées
↓
Installed Base Service
↓
équipements installés client
↓
garanties
↓
SAV / maintenance
```

Le Projet reste consultable après clôture et sert d’origine historique au parc installé.

---

# Architecture Recherche globale

```text
GlobalSearch
↓
SearchService
├── CRM
├── Contacts
├── Catalogue
├── Sales
├── Purchasing
├── Projects
├── Billing
└── Documents
```

Le résultat retourne des objets autorisés uniquement.

La recherche s’appuie d’abord sur les champs et index PocketBase.

---

# Architecture Notifications

```text
Event métier
↓
NotificationService
├── in-app
└── email optionnel
```

Exemples :

- échéance AO ;
- devis à relancer ;
- approbation requise ;
- achat en retard ;
- tâche assignée ;
- facture échue ;
- mention.

Les préférences utilisateur déterminent les canaux activés.

---

# Architecture Multi-devise / Fiscalité

Un document possède une devise immuable après validation.

Le taux de change appliqué est snapshoté sur le document ou l’opération concernée.

La fiscalité est résolue via un service métier :

```text
TaxService
```

à partir notamment :

- du produit ;
- du client / fournisseur ;
- du pays ;
- de la nature de l’opération ;
- de la date.

---

# Architecture Archivage

`ArchiveService` applique des politiques par type d’objet.

L’archivage :

- ne supprime pas les relations ;
- n’efface pas l’audit ;
- retire les objets des vues actives par défaut ;
- conserve leur accessibilité pour historique / contrôle.

Les durées exactes restent paramétrables et doivent être validées selon les obligations applicables.

---

# Architecture SAV / Parc installé

Le module `service` possède les objets de continuité après projet.

```text
service
├── installed-base
├── warranties
├── tickets
├── interventions
└── maintenance
```

## Parc installé

```text
Client / Site
↓
Installed Asset
├── produit
├── numéro de série
├── projet origine
├── livraison origine
├── date installation
├── date mise en service
└── garantie
```

L’équipement installé référence le numéro de série du Stock lorsqu’il existe.

Il ne duplique pas inutilement la donnée série.

## Tickets

```text
Client
↓
Ticket
├── équipement installé
├── priorité
├── garantie ?
├── diagnostic
└── historique
```

## Interventions

```text
Ticket
↓
Intervention
├── techniciens
├── planning
├── temps réalisé
├── pièces
├── compte analytique
└── compte-rendu
```

Une pièce consommée lors d’une intervention génère un mouvement de stock.

Le temps d’intervention alimente TimeReport.

## Analytique SAV

Règle par défaut :

```text
intervention garantie
→ compte analytique affaire d’origine

intervention facturable
→ compte analytique SAV / nouvelle opportunité
```

Cette règle reste modifiable selon le cas métier.

## Maintenance

Un plan de maintenance peut générer des occurrences / interventions planifiées.

Le SAV réutilise le planning ressources plutôt que de créer un second moteur de planning.

## RFQ fournisseurs

Aucun workflow de consultation multi-fournisseurs / RFQ n’est prévu dans le périmètre actuel.

Le flux Achat reste :

```text
Demande d’achat
→ fournisseur sélectionné
→ commande fournisseur
```


# Architecture Employés / Utilisateurs

Le domaine RH minimal est distinct du domaine Auth.

```text
HR
└── hr_employees
        │
        └── optional user
              ↓
          core_users
```

## Ownership

`hr` possède :

- identité professionnelle ;
- type de ressource ;
- équipe ;
- fonction ;
- calendrier ;
- capacité ;
- profil de coût ;
- rattachement société externe éventuel ;
- dates d’activité.

`core` possède :

- authentification ;
- sessions ;
- rôle ;
- permissions ;
- préférences applicatives.

Un module métier qui veut planifier une personne utilise `hr_employees`, pas `core_users`.

Un module qui doit vérifier une permission utilise `core_users`.

## Ressources sans compte

Les freelances, intérimaires et externes peuvent être planifiés sans compte Horizon.

Ils restent donc visibles dans :

```text
planning
TimeReport
projets
SAV
```

sans apparaître comme utilisateurs connectables.

---

# Architecture API externe

L’API externe est une façade applicative.

```text
/api/external/v1/...
```

Principe :

```text
API Client
↓
ApiClientService
↓
ApiAccessPolicy
↓
Domain Service
↓
Repository
```

## Permissions

Une policy combine :

```text
resource
action
read_fields
write_fields
data_scope
```

Exemple :

```text
resource     = contacts.people
action       = read
read_fields  = [id, first_name, last_name, email, company]
data_scope   = all_authorized
```

## Actions

Actions initiales :

```text
list
read
create
update
```

`delete` est désactivé par défaut et ne doit être exposé qu’exceptionnellement.

## Field allowlist

L’API fonctionne en **allowlist**.

Si un champ n’est pas explicitement autorisé, il n’est pas exposé.

Cette règle s’applique indépendamment aux champs en lecture et en écriture.

## Data scope

Le périmètre peut être :

```text
all_authorized
specific_companies
specific_projects
specific_analytic_accounts
own_records
custom_safe_scope
```

Les scopes personnalisés utilisent des règles contrôlées par Horizon, pas une expression SQL / PocketBase arbitraire fournie par l’utilisateur.

## Audit

Chaque appel externe conserve au minimum :

```text
api_client
timestamp
resource
action
status
request_id
latency
```

Les payloads sensibles ne sont pas loggés intégralement par défaut.

## Rate limiting

Chaque client peut avoir une limite configurable.

Le dépassement retourne une erreur contrôlée sans saturer l’application.


---

# Architecture Taux de change V12

Source unique :

```text
BCE / ECB
```

Architecture :

```text
Scheduled sync
↓
EcbExchangeRateProvider
↓
accounting_exchange_rates
↓
Pricing / Purchasing / Billing / Accounting
```

## Règle de snapshot

En brouillon :

```text
dernier taux BCE disponible
```

Le taux peut être actualisé.

À validation :

```text
exchange_rate
exchange_rate_date
exchange_rate_source
exchange_rate_locked_at
```

sont figés sur le document.

Une modification ultérieure des taux BCE n’altère jamais le document historique.

## Taux fiscal

Le modèle distingue :

```text
exchange_rate
tax_exchange_rate
```

Les deux utilisent la BCE comme source.

Ils peuvent être identiques, mais ne sont pas forcés à l’être car la date fiscale applicable peut différer de la date de valorisation commerciale.

## Chaque document possède son snapshot

```text
Devis validé
→ taux devis

Commande confirmée
→ taux commande

Facture validée
→ taux facture
```

Un taux n’est pas propagé comme vérité immuable d’un document au suivant.

---

# Architecture Numérotation V12

Toutes les relations utilisent l’identifiant technique PocketBase.

Exemple :

```text
id = 8k2mdv92kw7x3ap
business_number = FAC-2026-00208
```

Le `business_number` est une référence métier, jamais une clé relationnelle.

## Historique des identifiants métier

Lorsqu’une référence métier change ou qu’une migration importe une ancienne référence :

```text
core_business_identifiers
```

conserve l’historique.

Une ancienne référence reste :

- recherchable ;
- consultable ;
- affichable en option.

Aucune réécriture des anciennes pièces n’est imposée lors d’un changement de pattern.

## Affichage

Paramètre global / par type :

```text
show_previous_business_identifier = true / false
```

Exemple :

```text
FAC-2026-00208
(20260208)
```

La référence historique est présentée comme information secondaire.


---

# Architecture Authentification V12

Mode par défaut :

```text
Horizon email / password
```

Mode complémentaire :

```text
Microsoft OAuth2 / Entra
```

Les deux peuvent être activés simultanément.

Principe :

```text
Identity provider
↓
core_users
↓
roles / permissions Horizon
```

Microsoft fournit l’identité d’authentification.

Microsoft ne décide jamais des permissions métier Horizon.

Un compte Microsoft ne crée pas automatiquement un utilisateur Horizon autorisé sans règle explicite d’administration.


## Contacts V1 — implémentation

`src/modules/contacts` possède composants, pages, hooks Query, schémas Zod, service, repository, types et routes publiques via `index.ts`. UI → ContactsService → ContactsRepository → PocketBase. Les formulaires sauvegardent une fiche, un rôle ou une adresse explicitement ; il n'existe pas de création implicite multi-records.

Le client PocketBase est partagé par URL entre authentification et repositories, pour utiliser le même authStore après renouvellement / déconnexion. Tri, recherche et pagination des fiches sont serveur, valeurs filtrées par allowlist et paramètres échappés par le SDK. Les erreurs ne propagent pas l'objet SDK. HDataTable repose sur TanStack Table v8 sans React Compiler (règle de compatibilité désactivée uniquement sur l'appel du hook).

Les fichiers Contacts sont protégés. Le repository produit les URLs avec token de fichier court ; les composants demandent ces URLs par service / Query, renouvelées chaque minute, et n'appellent jamais le SDK. L'avatar et le logo société restent deux sources distinctes. Les données se réactualisent au focus ou via le bouton Actualiser ; aucun abonnement realtime Contacts n'est déclaré livré.

Les hooks Contacts utilisent un writer d'audit serveur partagé dans `pocketbase/pb_hooks/lib/audit.js`. Sauvegarde et audit sont atomiques ; actor `core_users` issu de la requête, acteur vide pour superuser / traitement interne. `core_audit` est verrouillé et n'est pas utilisé comme Activity Feed.


### Activity Feed livré — Contacts (5 octobre 2026)

Le composant partagé `shared/activity/ActivityPanel` passe par `core/activity/services/ActivityService` et son repository. Les modules transmettent uniquement la source (collection autorisée + identifiant) et leur capacité d’édition. Les sources initiales autorisées sont contacts_companies / contacts_people ; les futurs modules devront déclarer leur policy serveur avant raccordement. Aucun composant ne lit core_audit.

Les hooks métiers continuent à écrire core_audit. Le writer d’audit appelle ensuite le projecteur core ActivityService (`pb_hooks/lib/activity.js`) dans la même transaction : diff limité aux champs métier connus et libellés français, auteur issu de la requête, données de présentation sans secrets. Les sous-enregistrements d’adresse/rôle/compte alimentent la société. Une sauvegarde explicite de société partage un UUID d’opération entre ses requêtes ; un événement de même source/auteur/opération peut être enrichi pendant une minute, sans altérer les audits individuels. L’UUID ne vaut ni preuve ni autorisation. Une reprise après erreur constitue une nouvelle opération et ne journalise que les écritures effectivement réussies ; pas de prétendue transaction atomique entre toutes les requêtes du formulaire.

Commentaires/tâches : publication explicite par l’API standard des événements, avec hook serveur qui impose provenance, auteur, date et metadata. Publication, audit, mentions, notification et éventuelle tâche sont transactionnels. Les notifications internes sont créées par le writer core NotificationService, sans e-mail. Les changements de tâche produisent à leur tour un événement et un audit. Les événements automatiques et publications sont immuables pour les utilisateurs.


### Sélecteur d’images transversal — contrat de réutilisation

Le sélecteur est commun à l’ERP, sans dépendance à Contacts ni à une collection PocketBase :

- UI : `src/shared/images/ImageSearch.tsx`.
- Service : `src/core/images/services/ImageSearchService.ts`.
- Repository Wikimedia : `src/core/images/repositories/ImageSearchRepository.ts`.
- Types : `src/core/images/types/imageSearch.ts`.
- Adaptateur actuellement raccordé : `src/modules/contacts/components/LogoSearch.tsx`.

Wikimedia suit UI → Service → Repository ; la recherche Google construit uniquement une URL d’ouverture, et le collage fournit un fichier local validé par le service. Aucun composant ne contacte directement PocketBase. La recherche et la sélection ne modifient aucune donnée métier.

| Prop | Contrat |
|---|---|
| `initialQuery: string` | Mots-clés initiaux, par exemple nom de société ou fabricant + référence produit. |
| `purpose?: 'logo' \| 'image'` | `image` par défaut ; `logo` adapte les textes et ajoute le suffixe « logo » à la recherche initiale. |
| `disabled?: boolean` | Bloquer l’accès selon les permissions et l’état du formulaire ; défaut `false`. |
| `inputId: string` | Identifiant d’un input fichier existant dans l’écran propriétaire, pour l’alternative Importer un fichier. |
| `onChoose: (file: File) => void` | Réception du fichier choisi dans le brouillon du formulaire ; ne pas sauvegarder automatiquement depuis ce callback. |

Exemple de raccordement d’un futur formulaire produit, dans un écran qui dispose déjà de `imageInputId`, `imageDraft`, `setImageDraft`, `canEdit` et `productName` :

```tsx
<ImageSearch
  initialQuery={productName}
  purpose="image"
  inputId={imageInputId}
  disabled={!canEdit}
  onChoose={(file) => setImageDraft(file)}
/>
```

Le propriétaire fournit également son input d’import local, son aperçu dans la fiche et son suivi de modifications. Enregistrer doit appeler son service/repository métier habituel, avec sa propre validation serveur et ses permissions. Le composant commun ne décide ni de la collection/champ cible, ni du nombre d’images autorisé, ni de l’archivage/suppression des médias déjà enregistrés.

La version actuelle sélectionne un seul fichier PNG/JPEG/WebP de 2 Mio maximum par ouverture. Plusieurs images produit nécessiteront plusieurs sélections ou une évolution explicite du contrat ; aucune galerie multi-sélection n’est prétendue livrée. Le module Produits n’est pas encore implémenté : ce raccordement est une recette de réutilisation, pas un écran produit existant. Le choix des sources, les interactions et leurs limites sont détaillés dans [UX & Design System](07-UX-DESIGN-SYSTEM.md#sélecteur-dimages-commun) et [Integrations](08-INTEGRATIONS.md#recherche-dimages--wikimedia-commons).

### Contacts et coordonnées par usage — 6 octobre 2026

`CompanyPeople` porte le répertoire Contacts de la société. `CompanyAddresses` reçoit les brouillons contrôlés par `ContactEditor` : aucune écriture autonome dans ses boutons Ajouter / Modifier. Le formulaire principal et le répertoire partagent le même brouillon de siège ; l’e-mail de facturation reste lié au champ société ; l’e-mail général reste dans Informations uniquement. UI → `ContactsService.saveCompanyDetails` → repository → PocketBase. Les validations de toutes les adresses précèdent toute écriture. Le batch des adresses supplémentaires et du siège modifié est transactionnel côté PocketBase, dans `lib/addresses.js`, avec audit / activité existants ; la fiche entière (société, rôles, adresses, comptes) reste une séquence de sauvegardes avec reprise explicite des erreurs partielles. Identifiants de création stables conservés jusqu’au succès, pour éviter les doublons lors d’une reprise réseau.

### Thème d’interface clair / sombre

`core/theme/theme.ts` porte la préférence locale et la synchronisation des onglets via `useSyncExternalStore` ; `ThemeToggle` dans la top bar est le point d’entrée. Valeur `light` ou `dark`, clé navigateur `horizon.theme`, mode clair par défaut. Le bootstrap minimal dans `index.html` applique la préférence avant le premier affichage, y compris à la connexion. Stockage indisponible : bascule utilisable pour la session courante. Aucune requête métier ni persistance PocketBase.

`shared/theme.css` centralise les couleurs sémantiques du mode sombre. Les règles partagées de `styles.css` utilisent ces tokens avec les couleurs claires existantes en fallback : surfaces, bordures, texte et états colorés. Le token de texte des formulaires passe du noir au blanc clair. La sidebar et la marque gardent leur charte ; les logos et aperçus d’images conservent le fond blanc. Les portals Radix héritent du thème depuis l’élément `html`. Changer de thème ne remonte pas les formulaires et ne modifie pas leurs brouillons.

### Filtres contextuels partagés

`shared/search/SearchFilters` fournit le panneau contrôlé et `SearchFilterChips` les critères retirables. `shared/search/filters.ts` définit le contrat `SearchFilter` (clé URL, libellé, défaut, choix) et les fonctions pures de lecture validée, changement et réinitialisation ; aucune dépendance à PocketBase ou à un module. Le shell `WorkspaceSearch` raccorde les critères du contexte à React Router ; recherche et filtres partagent la même URL. Les changements de critères ajoutent une entrée d’historique, la saisie de recherche conserve son remplacement existant.

Contacts déclare ses critères dans `modules/contacts/searchFilters.ts`, exposés publiquement via `index.ts`. La liste lit le même contrat pour convertir l’état en option `archived` du service existant ; aucune modification de repository, de permission ou de schéma PocketBase. Un futur module doit fournir ses propres critères, les raccorder au contexte du shell et les traduire dans son service/repository avec validation serveur habituelle. Ne pas stocker une seconde copie locale des filtres ni déplacer les requêtes métier dans le shell. Les filtres du répertoire ne filtrent pas les cartes de synthèse globales.

Contacts : `ListOptions.role` accepte uniquement customer / supplier. Le repository ajoute un filtre serveur sur la relation inverse `contacts_company_roles_via_company` : rôle demandé et rôle actif doivent correspondre au même enregistrement, afin d’exclure un ancien rôle Client alors que Fournisseur reste actif. Le parcours sur base réelle vérifie ce cas. Pour les personnes, le chemin est `company.contacts_company_roles_via_company`. Recherche, état, tri et pagination restent serveur, avec les API Rules existantes. Aucune migration ni modification de hook. Syntaxe des relations et opérateurs « any » : [documentation PocketBase](https://pocketbase.io/docs/api-rules-and-filters/).

### Regroupement et vues enregistrées transverses

Le panneau commun affiche Filtres à gauche et Regrouper par / Trier par à droite, puis Vues enregistrées. Le contexte Contacts fournit les groupes autorisés (pays, société pour Personnes) et les tris. Recherche, filtres, groupement, tri et présentation sont dans l’URL ; les vues n’enregistrent ni pagination ni résultats métier. `core/views` porte les schémas, ViewsService et ViewsRepository ; `shared/search/SavedViews` ne contacte pas PocketBase directement. Les futurs modules doivent déclarer leur contexte, critères, permissions de lecture et policy serveur avant d’être proposés.

Les groupes Contacts se calculent par une route authentifiée GET /api/horizon/contacts/groups, avec compte/rôle actifs et contacts.read. Le serveur valide une allowlist de kind/group/state/role/sort/direction, q ≤ 200, pagination 25. SQL lié pour les valeurs et colonnes choisies exclusivement dans une allowlist ; aucun filtre SQL libre reçu. Une lecture transactionnelle calcule totaux par groupe et IDs de la page, sans charger toutes les fiches côté navigateur. Le repository récupère ensuite les 25 fiches au maximum et leurs expansions via l’API standard et ses API Rules, en conservant l’ordre des IDs. Un groupe coupé par la pagination affiche son total et le nombre courant. La policy Contacts actuelle autorise tout le répertoire aux lecteurs Contacts ; toute future restriction par record devra aussi s’appliquer au calcul des groupes et compteurs.

core_saved_views utilise des règles REST owner/visibility et le hook serveur de validation, audit et provenance. Un lecteur peut créer une vue personnelle ou globale ; les autres lecteurs utilisent les vues globales sans les modifier. Créateur ou permission explicite core.views.manage pour modifier/supprimer ; le droit admin donne aussi accès aux vues privées pour leur administration. Les views stockent des critères simples validés par contexte et ne confèrent aucun accès aux données métier. Aucune recherche globale inter-modules n’est ajoutée.

### Navigation entre fiches Contacts

`HBreadcrumbActions` projette les actions de la page dans l’emplacement partagé à droite du fil d’Ariane du shell, via un contexte de cible DOM et un portal React. Le shell ne lance aucune requête métier. `ContactRecordNavigator`, monté uniquement pour une fiche enregistrée, utilise UI → ContactsService.navigation → repository → GET /api/horizon/contacts/navigation. Le service exige contacts.read. La route réutilise la policy et les critères de `lib/contact-groups.js` ; fonctions SQL de fenêtre ROW_NUMBER / COUNT / LAG / LEAD pour renvoyer position, total et deux voisins seulement. Aucun téléchargement de toutes les fiches côté navigateur. L’ordre simple correspond au tri collection, l’ordre regroupé à celui du répertoire, départagé par id. Compteur et voisins viennent d’une seule transaction de lecture.

Le contexte `{kind, query, page}` est porté par l’état d’historique React Router des liens carte / titre / tableau puis des flèches, validé avant usage. Il conserve recherche, rôles, archives, regroupement, tri et présentation ; le retour Répertoire conserve aussi la page. Le rechargement conserve cet état dans l’onglet courant. Un lien ouvert dans un nouvel onglet ou une URL directe sans contexte utilise le répertoire actif ou archivé correspondant à la fiche, tri par nom. La sauvegarde préserve le contexte ; aucun état de brouillon n’y est stocké.

Transition des fiches sans flash : le navigateur attend en parallèle la fiche cible, ses adresses / comptes pour une société et son compteur dans le cache TanStack Query avant de changer la route. Même queryKey et fenêtre de fraîcheur de 10 secondes que ContactPage / Navigator ; les sauvegardes invalident toujours le cache Contacts. L’ancienne fiche reste montée et visible, mais inert pendant l’attente pour empêcher une modification ou publication tardive. Les flèches sont désactivées, aucun effacement du formulaire ni remplacement par un texte de chargement. Réponses en erreur : route et brouillon actuels conservés, dialogue de reprise ; un jeton invalidé au démontage empêche une réponse tardive de rouvrir une fiche après un départ ailleurs. Les ouvertures natives dans un autre onglet gardent leur comportement. Aucun changement de repository, hook ou schéma pour cette finition.

### Raccourcis contextuels partagés

`HBreadcrumbActions` propose deux cibles publiques : `related` au centre et `navigation` à droite. `HRecordLinks` affiche les items fournis par la page : id stable, libellé, icône, description du périmètre, compteur réel et destination filtrée ; callback local optionnel pour ouvrir une section sans perdre le brouillon. Le shell ne connaît ni compteurs ni collections. Un futur module (produits, devis, etc.) réutilise ce composant et le slot : ses services / repositories calculent les données autorisées, son UI compose les items. Les API publiques des modules concernés fourniront les résumés et destinations ; Contacts ne lira pas directement leurs collections.

Pour un raccourci intermodule, compter et construire le lien à partir du même périmètre : source par identifiant, état(s) métier et permissions. Exemple de recette future : le service Ventes fournit le nombre de devis en cours de la société et le constructeur de lien de la liste Devis avec exactement la même société et les mêmes états ; la liste expose les critères actifs et permet de les retirer. Les statuts « en cours » seront définis par le module propriétaire, pas par le shell. Un module absent ne reçoit ni nombre simulé ni destination vers une page temporaire. Un raccourci non autorisé est omis avant rendu.

Premier raccordement : `CompanyBusinessLinks` utilise les rôles actifs enregistrés de la société (également depuis sa fiche contact) et les définitions `companyShortcuts`. Client : devis, commandes clients, factures clients, livraisons, opportunités. Fournisseur : commandes fournisseurs, réceptions, factures fournisseurs. Double rôle : union sans doublon. Les modules concernés restent non livrés : items désactivés, tiret, explication au survol. Contacts / Adresses restent uniquement dans les onglets de la société, avec leurs compteurs : ContactsService.companyPeopleCount → repository → getList(1,1,fields=id) avec company et active=true ; adresses calculées à partir des adresses enregistrées et de l’e-mail de facturation effectivement présent, comme le répertoire d’adresses. Ces compteurs suivent l’invalidation Contacts et sont rafraîchis après sauvegarde. Le compte de contacts est préchargé lors du défilement des fiches, sans rendre une erreur de compteur bloquante pour la fiche.

Fil : lors du suivi des objets liés, Activity.track normalise leur action en update pour la fiche société racine. L’archivage d’un rôle ne devient plus un status_change de société. Les transitions du cycle de vie ne s’appliquent au fil racine que si l’enregistrement modifié est la fiche elle-même ; core_audit conserve son action et son entité techniques.

Fil d’Ariane contextualisé : HPageBreadcrumb utilise le slot trail du shell pour remplacer le HBreadcrumb par défaut pendant le montage d’une fiche. La page fournit ses niveaux, destinations et état de navigation ; le shell ne lit aucune donnée métier. Les liens HBreadcrumb acceptent l’état React Router pour restituer le contexte du répertoire. Le fallback redevient visible au démontage sans dupliquer la navigation accessible.

Recherche Contacts avec bascule de répertoire — 6 octobre 2026 : `ContactsPage` réutilise `useContactList` → ContactsService → ContactsRepository pour lire le type courant et, uniquement avec recherche non vide en contexte Contacts et permission contacts.read, vérifier le nombre de résultats de l’autre type. Navigation après succès des deux lectures, sans bascule sur erreur. Aucun appel PocketBase direct dans le shell, aucun nouveau endpoint ni migration. Le choix explicite est dans `scope=companies|people` ; texte, filtres et présentation restent dans l’URL. La bascule remplace l’entrée d’historique et restitue le focus de recherche.

En-têtes de section — 6 octobre 2026 : `shared/ui/HSectionHeading` centralise titre, compteur, description, icône et actions, sans accès métier. Les fiches Contacts et leurs répertoires intégrés réutilisent ce composant. La typographie et le responsive sont définis une seule fois dans le Design System ; ne pas ajouter de variations locales pour un même niveau de section.

## CRM classique — premier raccordement du 6 octobre 2026

`modules/crm` possède routes, pages, composants, hooks, schémas, services et repository. UI → CrmService → CrmRepository → PocketBase ; la sélection de sociétés / personnes réutilise ContactsService, les devises ReferencesService. Les opportunités ne recopient pas leurs interlocuteurs.

Les écritures passent par les routes métier `/api/horizon/crm/save`, `/stages`, `/archive`, `/delete` ; le CRUD REST direct des opportunités et comptes analytiques est fermé aux utilisateurs. `lib/crm.js` orchestre, dans une transaction, NumberingService (séquence Paramètres) et AnalyticService (propriété Comptabilité), puis l’opportunité, l’audit et le fil. Le même compte et le même numéro restent attachés à la fiche pendant son édition. `updated` protège les éditions concurrentes ; clé de création UUID cachée et acteur serveur rendent la reprise idempotente sans dupliquer l’affaire.

ActivitySource accepte désormais `crm_opportunities` en plus des deux entités Contacts. Le fil, les fichiers protégés, tâches, mentions et notifications restent dans Core ; les API Rules filtrent par module et source effective. Les notifications CRM ciblent leur fiche. Les destinataires doivent avoir les droits de lecture du module concerné. Les droits Contacts ne donnent aucun accès CRM.

HRecordTabs extrait les onglets déjà validés sur Contacts, sans changement des dimensions ou de leur navigation clavier. Contacts et CRM utilisent le même composant. Les raccourcis sociétés raccordent Opportunités à un compteur réel et à `/crm?company=<id>&status=open` seulement avec `crm.read`.


CRM — révision pipeline : `CrmService.summary → CrmRepository → GET /api/horizon/crm/summary`, agrégation SQL liée avec filtres en allowlist et permission CRM avant lecture, nombres / sommes par étape et devise sur tout le résultat filtré. `stageTotals` ajuste ces agrégats pendant la sauvegarde du déplacement ; dnd-kit anime le glissement et le dépôt, sans ancien hook FLIP. La signification commerciale d’une étape est validée côté serveur et ne peut être changée sur une étape utilisée.

`shared/ui/HRichTextEditor` réutilisable utilise Tiptap 3 avec StarterKit, données JSON en allowlist définies dans `shared/schemas/richText`. Le CRM stocke le JSON et sa projection texte calculée côté serveur ; aucun HTML arbitraire ni URL embarquée. Validation serveur de profondeur, nombre de nœuds, taille, types, attributs et marques dans `lib/rich-text.js`. La vue conserve le brouillon via React Hook Form, sauvegarde au bouton principal seulement. Les trois dépendances Tiptap sont celles de la stack obligatoire et remplacent le textarea provisoire ; aucune nouvelle technologie d’éditeur.

CRM Kanban — 6 octobre 2026 : UI optimiste au dépôt → CrmService.move → CrmRepository → route serveur transactionnelle existante. Un changement d’étape par requête avec updated attendu ; déplacements successifs bloqués pendant la requête. Invalidation des opportunités / totaux / fil après réponse, projection locale supprimée sur succès ou échec, erreur visible sur refus. Le formulaire de fiche conserve sa sauvegarde explicite. Le survol de colonne ne modifie que la préférence de présentation dans le navigateur.

Paramètres CRM — 7 octobre 2026 : page dédiée du module Settings, service / repository typés pour settings_crm. CRM consomme sa projection de lecture et les réglages publics d’étapes ; le dialogue de colonne réutilise ReferenceEditor exporté par Settings. HTag, HTonePicker et HTagPicker partagent les tokens et le schéma TagTone pour éviter une couleur différente selon la vue. Aucun appel PocketBase dans les composants.

### Accès et Employés — frontière livrée le 7 octobre 2026

Core/Auth possède les profils ERP, les comptes et leurs droits. HR possède les ressources et la hiérarchie ; équipes restent le référentiel Core partagé. `AccessService → AccessRepository → /api/horizon/access/*` et `HrService → HrRepository → /api/horizon/hr/*`, contrôlés par `pb_hooks/lib/access-policy.js`. La matrice attribuable est bornée aux modules / périmètres réellement contrôlés ; les modules à venir n’ont aucune accréditation fictive. Rôle effectif dédié au compte lors de la sauvegarde, sans mutation d’un rôle partagé historique. `core_users.employee` est le lien unique ; inverse calculé, membres d’équipe dérivés des ressources HR. Audit Core dans la transaction ; aucun secret exporté. Organigramme sans dépendance supplémentaire, arbre issu des seules ressources autorisées.

### Recherche / présentation des listes transverses — 7 octobre 2026

`shared/search/SearchFilters` possède le rendu Filtres / Regrouper par / Trier par, ses pastilles et le comportement du panneau, avec CSS partagé. `WorkspaceSearch` fournit les déclarations du contexte courant ; les fichiers `searchFilters.ts` des modules contiennent uniquement les critères / valeurs / icônes métier. Aucun composant de panneau recopié par module. Le tri peut exister sans regroupement, comme dans CRM. Les valeurs non standard du tri sont incluses dans le compteur et permettent Réinitialiser.

`shared/search/GroupedResults` possède les en-têtes et surfaces de groupes, utilisé par Contacts, Employés et Utilisateurs. `listPresentation` fournit tri naturel français sans mutation et regroupement par identité ; les listes HR / accès l’appliquent aux seules données autorisées reçues du serveur. Contacts conserve son regroupement / pagination métier via son service, et adapte les groupes reçus au même rendu. Les colonnes et cellules de table restent propres aux données du module. Les vues enregistrées restent limitées aux contextes réellement supportés côté serveur (Contacts) ; leur composant existant est injecté dans le panneau commun.


## CRM / AO et projection Calendrier — premier lot du 7 octobre 2026

`TenderService → TenderRepository` lit les dossiers / rendez-vous / dépôts et appelle les routes métier CRM. Le dossier AO se crée seul ; sa promotion réutilise NumberingService et AnalyticService à la décision de répondre. `CrmService.save` conserve le parcours des opportunités directes et des affaires déjà liées. `lib/tenders.js` vérifie les références, les dates, les droits et les jetons de concurrence avant audit / activité. Les six étapes commerciales restent indépendantes des étapes de préparation AO.

`CalendarService → CalendarRepository → GET /api/horizon/calendar/events` expose des projections, sans nouvelle collection de dates. Le fournisseur serveur `lib/calendar.js` lit uniquement les sources CRM autorisées et rend des identifiants stables. `BusinessCalendar` est utilisé dans le volet AO et la page Calendrier, avec navigation semaine / mois / trimestre / année. Ajouter ultérieurement les fournisseurs des autres modules dans l’agrégation serveur, avec leur policy, sans modifier les données privées depuis Calendrier.

Les fichiers restent possédés par Core Activity. Un dépôt AO référence `{event_id, filename}` sur le dossier AO ou son opportunité liée ; il fige cette sélection et interdit la suppression ultérieure des pièces. Il ne recopie pas le binaire. La version est allouée transactionnellement, et la clé de création rend la reprise idempotente.

Les changements CRM / AO sont reçus par PocketBase Realtime via le repository, puis invalident listes, totaux, références AO et projections Calendrier. Aucun composant ne contacte directement PocketBase. Les brouillons ouverts ne sont pas réinitialisés par ces événements ; leur `updated` est contrôlé à la sauvegarde. Le calendrier conserve aussi un rafraîchissement de secours à 30 secondes.


## Création / consultation liées — 8 octobre 2026

`shared/records/RecordWorkspace` conserve le contenu d’origine monté et ouvre une pile de fiches dans `HDialog`, sans changement d’URL, second routeur ni copie de brouillon. `recordContext` expose le contrat `RecordRequest / RecordSession / RecordResult` : ressource, identifiant facultatif, valeurs initiales autorisées, état dirty / busy, résultat sauvegardé et fermeture. L’enregistrement de la fiche liée passe par son service métier habituel ; seul le résultat `{id, label}` revient au sélecteur. Une fermeture sans sauvegarde retourne sans changer la sélection ; les changements préparés nécessitent confirmation, une mutation en cours interdit la fermeture.

Le shell compose les adaptateurs dans `app/components/RecordEditors` (chemin de fiche, titres, rendu lazy). Contacts fournit **le même `ContactPage / ContactEditor`** que ses routes classiques ; la session modale remplace seulement l’identifiant de route, les valeurs initiales, le callback de sauvegarde et la navigation de page. Formulaire, services, validation, images, adresses, comptabilité, onglets et fil restent communs. Identifiants de formulaires / champs uniques pour les ouvertures imbriquées, et contexte breadcrumb isolé : aucun popup ne remplace le fil d’Ariane d’origine.

`HRecordPicker` étend `HCombobox` avec création et consultation. Le module fournit droits, état de chargement / erreur, défauts contextuels et relecture / invalidation des données. `ContactRecordPicker` applique la policy Contacts et invalide les choix Contacts / CRM. Le CRM vérifie le contact relu et reprend sa société si celle-ci change, afin de maintenir la cohérence des deux champs. Les liens vers les fiches enregistrées des adaptateurs sont capturés dans le popup et ouverts dans la même pile, sans quitter la page d’origine. Le focus revient au déclencheur.

Premier raccordement : société dans une fiche personne, société / interlocuteur dans une opportunité (directe ou AO). Produits n’étant pas livré, son adaptateur sera ajouté avec son formulaire canonique lors de l’implémentation du module ; aucun formulaire produit fictif. Pour les autres modules, enregistrer leur éditeur existant et utiliser le même picker, sans dupliquer formulaire, fenêtre ou CSS. Les listes de valeurs structurelles ne deviennent pas des fiches créables par défaut.

Conversion du type CRM — 8 octobre 2026 : `CRM save` conserve l’opportunité et son compte analytique, et archive / crée / réactive l’extension AO dans la même transaction que l’audit et le fil. `crm_tenders.archived_at` est fixé ou vidé exclusivement côté serveur. AO → direct contrôle aussi `tender_updated` ; direct → AO reprend l’unique extension avec son contrôle de version. Le formulaire canonique reste unique et conserve son brouillon jusqu’à Enregistrer. Le calendrier exclut les dossiers archivés et les opportunités directes avant projection ; rendez-vous, dépôts et fichiers restent conservés et protégés.

Navigation secondaire CRM — 8 octobre 2026 : `NavigationItem.children` et `SidebarItem` portent le pattern commun de sous-pages dépliables, sans nouvelles routes métier. Liens Pipeline et AO sans paramètre view. `usePreferredView` mémorise uniquement kanban / list sous horizon.crm.view.[userId] dans ce navigateur ; URL > préférence locale > settings_crm.default_view. Les permissions métier et le singleton global restent inchangés.

AO autonome — 8 octobre 2026 : `crm_tenders` est la racine du volet AO avant décision. Les routes CRM projettent un modèle de lecture commun au formulaire et aux cartes, sans créer de fausse opportunité. La promotion réutilise la validation, numérotation et création analytique CRM dans une transaction. Après liaison, les valeurs commerciales proviennent exclusivement de l’affaire. Le fil AO et le calendrier restent utilisables avant promotion.
