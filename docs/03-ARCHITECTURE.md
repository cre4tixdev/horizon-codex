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

CRM
→ rendez-vous

Projets
→ jalons

Congés
→ absences
```

Le calendrier n’est pas obligatoirement propriétaire de toutes les dates affichées.

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
