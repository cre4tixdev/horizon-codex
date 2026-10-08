# Horizon — Data Model

## Objectif

Ce document est le **contrat de données de Horizon**.

Il décrit la structure logique attendue de PocketBase.

La réalité exécutable est implémentée dans :

```text
pocketbase/pb_migrations/
```

Flux obligatoire :

```text
Besoin validé
↓
05-DATA-MODEL.md
↓
Migration PocketBase
↓
Tests
↓
PREPROD
↓
PROD
```

---

# 1. Principes généraux

## Nommage

Collections :

```text
<module>_<entity>
```

Exemples :

```text
contacts_companies
crm_opportunities
crm_tenders
sales_quotes
inventory_movements
billing_invoices
```

Noms techniques :

```text
anglais
snake_case
```

---

# 2. Identifiants

PocketBase `id` reste l’identifiant technique.

Les numéros métier sont distincts.

Exemples :

```text
quote_number
order_number
delivery_number
invoice_number
```

Ne jamais utiliser un numéro métier comme clé primaire.

---

# 3. Dates

PocketBase :

```text
created
updated
```

Dates métier explicites :

```text
quote_date
submission_deadline
delivery_date
invoice_date
due_date
validated_at
sent_at
archived_at
```

---

# 4. Statuts

Les statuts critiques utilisent des valeurs contrôlées.

Éviter les chaînes libres.

Les transitions importantes sont validées côté serveur.

Les documents opérationnels possèdent une phase `draft` lorsqu’une validation métier est nécessaire.

Principe :

```text
draft
↓
validated / confirmed / posted
```

Un document validé conserve :

```text
validated_at
validated_by
```

Les règles de modification après validation dépendent du type de document.

---

# 5. Montants

Les montants financiers sont déterministes.

Règles retenues :

```text
prix unitaires / taux
→ précision interne supérieure, typiquement jusqu’à 6 décimales

calculs intermédiaires
→ précision conservée

totaux de ligne / HT / TVA / TTC / marge affichée
→ arrondis à 2 décimales
```

Ne jamais tronquer un prix unitaire fournisseur à 2 décimales avant multiplication.

Exemple :

```text
0,0375 € × 10 000
= 375,00 €
```

Chaque objet financier possède une devise explicite.

Pas de calcul critique naïf en flottants JavaScript.

Les règles d’arrondi sont centralisées côté service métier / serveur.

---

# 6. Suppression et archivage

Ne pas utiliser un soft-delete générique partout.

Objets historiques importants :

```text
devis validés
commandes
BL
factures
écritures
documents envoyés
AO archivés
```

→ annulation / archivage plutôt que suppression.

---

# 7. Audit

Collection :

```text
core_audit
```

Champs conceptuels :

```text
user
module
action
entity
entity_id
before
after
metadata
created
```

---

# 8. Core / Auth

## `core_users`

Collection auth.

Champs conceptuels :

```text
name
first_name
last_name
email
public_email
role
active
avatar
mail_from
employee
```

## `core_roles`

```text
name
label
permissions
active
```

### Premier socle d'authentification (local testé, préproduction configurée manuellement)

Migration `pocketbase/pb_migrations/1791072000_core_auth.js`, cible testée : PocketBase 0.40.4.

- `core_roles` : `name` unique, `label`, `permissions` (JSON : tableau de chaînes), `active`, dates automatiques.
- `core_users` : auth email / mot de passe, `name`, `first_name`, `last_name`, `public_email`, relation obligatoire `role`, `active`, `avatar` protégé, `mail_from`, dates automatiques. `employee` est ajouté par la migration Utilisateurs / Employés du 7 octobre ; aucun faux identifiant d’employé n’est stocké. Voir le contrat livré en section 9.
- Inscription publique interdite ; gestion des comptes et rôles réservée au superuser technique dans ce premier socle. Les écrans d'administration Horizon attendent leur service serveur et leur audit.
- Lecture limitée à son propre compte et son propre rôle, avec compte et rôle actifs. Aucun utilisateur ne peut modifier son rôle ni ses permissions par REST.
- Aucun compte, mot de passe ni rôle privilégié n'est créé par la migration. Le premier compte applicatif sera provisionné explicitement après validation du déploiement.
- La collection standard `users` existante est conservée ; sa création publique est verrouillée par une migration dédiée. Ses enregistrements et autres règles restent préservés.

L'utilisateur a créé ces collections via le dashboard de préproduction. Leur schéma a été relu par API ; les écarts et la réconciliation nécessaire des migrations sont suivis dans `06-SECURITY-OPS.md`. La migration a été adaptée pour adopter le schéma existant après vérification, sans réécrire les collections ni leurs enregistrements. Elle accepte la sémantique de sélection unique (`maxSelect` 0 ou 1), conserve les identifiants existants et s'arrête sur un schéma incompatible. Sur base neuve elle crée le socle. Le rollback automatique est refusé, même à vide, pour préserver les collections adoptées. Ce socle ne constitue pas encore la livraison des collections métier ni du lien employés / utilisateurs.

---

## Organisation

### `core_teams`

```text
name
managers → hr_employees (multiple)
active
type (cible)
```

Le champ `type` reste une cible ultérieure. Les identifiants PocketBase sont techniques et masqués dans l’interface. Le champ legacy `code` reste interne et caché pour préserver les références historiques ; sur les nouvelles équipes, il est dérivé de l’identifiant serveur, sans saisie utilisateur. `managers` accepte plusieurs ressources actives désignées Manager ou Direction, sans modifier leur responsable principal ni leurs droits. Types initiaux possibles :

```text
commerce
be
production
purchasing
administration
accounting
management
other
```

### `core_team_members` (cible multi-équipe, non livré)

```text
team
employee
role
start_date
end_date
```

### `core_resource_profiles`

```text
employee
team
weekly_capacity_minutes
daily_capacity_minutes
cost_profile
active
```

### `core_cost_profiles`

```text
code
label
hourly_cost
currency
effective_from
effective_to
```

Les coûts historiques ne sont pas recalculés à partir d’un profil modifié.

---

## Identifiants métier historiques

### `core_business_identifiers`

```text
entity_type
entity_id
identifier
identifier_type
valid_from
valid_to
is_current
source
created_at
```

`identifier_type` :

```text
current
previous
legacy
external
```

Contraintes :

- l’identifiant technique du record reste indépendant ;
- une ancienne référence ne change jamais les relations ;
- les anciennes références sont indexées pour la recherche globale.

---

## Activity Feed

### `core_activity_events`

Fil d’activité métier visible par l’utilisateur.

```text
source_module
source_entity
source_record_id
type
author
body
metadata
created
```

Types conceptuels :

```text
change
status_change
note
message
document
task
system
```

### `core_activity_mentions`

```text
event
user
notified_at
read_at
```

### `core_tasks`

Tâches transverses rattachables à un objet métier.

```text
title
description
source_module
source_entity
source_record_id
created_by
assigned_to
due_date
priority
status
activity_event
completed_at
```

### `core_notifications`

```text
user
type
title
body
source_module
source_entity
source_record_id
read_at
created
```

---


## Imports / migration

### `core_import_jobs`

```text
type
source
filename
status
mode
created_by
started_at
completed_at
summary
error
```

Types initiaux :

```text
odoo_migration
excel_product_catalog
```

Modes :

```text
dry_run
apply
```

### `core_import_rows`

```text
job
row_number
source_key
status
match_type
matched_record_id
normalized_data
error
```

### `core_external_references`

Mapping durable entre systèmes.

```text
provider
entity_type
external_id
horizon_record_id
external_updated_at
last_synced_at
```

Contrainte :

```text
provider + entity_type + external_id UNIQUE
```

Ce mapping rend les imports Odoo relançables sans créer de doublons.
---

# 9. Employés / Ressources

### Livraison Utilisateurs / Employés du 7 octobre 2026

`core_users.erp_profile` : admin / superuser / user / viewer, obligatoire, initialisation user sans promotion implicite. `access_grants` JSON caché : droits par module et périmètre, bornés et validés serveur ; `hr_scope` : none / self / reports / team / all, dérivé des droits ; `employee` relation facultative unique vers hr_employees, source de vérité du rattachement. Aucun champ user persistant dans hr_employees : la projection inverse est calculée. Le rôle effectif core_roles est dédié au compte lors d’une sauvegarde des accès ; permissions calculées serveur, jamais librement saisies dans l’UI. Les rôles historiques restent conservés.

`core_teams` : name, managers → hr_employees (multiple), active, created / updated, code legacy unique caché ; membres dérivés de hr_employees.team dans ce premier lot, sans liste concurrente d’utilisateurs. `hr_employees` : first_name / last_name requis, professional_email / professional_phone, job_title descriptif, employment_type employee / freelance / interim / external, team → core_teams, manager → hr_employees, is_manager, is_direction, external_company → contacts_companies, start_date / end_date, status active / inactive / planned / ended, avatar protégé, created / updated. Responsable principal sans cycle ; responsable doit être une ressource active désignée Manager ou Direction. Responsabilités exclusives : is_manager / is_direction ; faux / faux désigne un collaborateur. Direction peut encadrer managers et collaborateurs, et ne peut être rattachée qu’à une autre Direction. Aucun droit ERP implicite. Ressources sans compte autorisées. Fin d’activité / inactivation désactive le compte lié dans la même transaction, sans effacer l’historique.

Permissions disponibles dans le lot : Contacts / CRM read / write (périmètre global réel), HR read / write / organisation.manage (périmètres self / reports directs / team / all), administration fonctionnelle Admin / Superuser et gestion des comptes Admin seulement. Les accréditations des modules non livrés restent non attribuables. La gestion de hiérarchie requiert le périmètre HR all. REST Users / Roles / Employés / Équipes en écriture verrouillé ; routes serveur avec validation, version et audit. Premier Admin provisionné uniquement par e-mail explicite dans HORIZON_INITIAL_ADMIN_EMAIL à la migration, aucun compte ni mot de passe créé ; mise à niveau de comptes existants refusée sans e-mail explicite. Migration `1791331203_access_employees.js`.

## `hr_employees`

Ressource humaine métier.

```text
employee_number
first_name
last_name
professional_email
professional_phone
avatar
employment_type
job_title
team
manager
is_manager
is_direction
external_company
start_date
end_date
status
work_calendar
resource_profile
notes
```

`employment_type` :

```text
employee
freelance
interim
external
```

`status` :

```text
active
inactive
planned
ended
```

Relations :

```text
team → core_teams
manager → hr_employees
external_company → contacts_companies
work_calendar → planning_work_calendars
resource_profile → core_resource_profiles
compte inverse calculé depuis core_users.employee
```

Contraintes :

```text
core_users.employee UNIQUE lorsqu’il est renseigné (index filtré sur relation non vide)
```

Un employé peut exister sans utilisateur.

Un utilisateur humain lié à une ressource ne doit être lié qu’à une seule ressource active.

## `hr_employee_skills`

Préparation future pour compétences / affectations.

```text
employee
skill
level
valid_until
```

Optionnel en V1.

## `hr_skills`

```text
code
label
category
active
```

Optionnel en V1.


---

# 10. Contacts

## `contacts_companies`

```text
name
legal_name
vat_number
lei (texte optionnel, 20 caractères alphanumériques majuscules)
rcs_number (historique, masqué)
fiscal_identifier (historique, masqué)
billing_email
einvoice_routing_address
einvoice_platform
einvoice_service_code
einvoice_status
preferred_language
default_currency
siren
siret
enrichment
website
phone
email
logo
images
notes
active
```

Une société n’est pas dupliquée selon son rôle.

## `contacts_company_roles`

```text
company
role
active
```

`role` :

```text
customer
supplier
```

Une société peut posséder plusieurs rôles.

## `contacts_people`

```text
company
first_name
last_name
job_title
email
phone
mobile
avatar
notes
active
```

## `contacts_addresses`

```text
company
type
label
email
line1
line2
postal_code
city
country
state_region
is_primary
```

### Évolution Adresses — 6 octobre 2026

Migration `1791244800_company_addresses.js`, révision Contacts **5** : `label` texte optionnel (120 caractères) et `email` optionnel valide. Une adresse appartient à une société et à un usage `registered` (Siège), `billing` (Facturation), `shipping` (Livraison) ou `other` (Autre). Plusieurs coordonnées sont autorisées par usage. Chaque ligne contient une adresse postale, un e-mail ou les deux ; un simple libellé ne suffit pas.

`line1`, `city` et `country` deviennent optionnels dans le schéma pour autoriser un e-mail seul. Si un champ postal est renseigné, ces trois champs sont exigés ensemble par les validations client et serveur ; `country` reste un code ISO alpha-2 du référentiel Pays. Aucun effacement ni recopie des adresses historiques. L’index unique existant garantit au plus une adresse principale par société / usage ; le remplacement est transactionnel côté serveur.

L’e-mail général (`contacts_companies.email`) et l’e-mail de facturation (`contacts_companies.billing_email`) sont affichés dans l’onglet Adresses comme coordonnées existantes : les éditer modifie leur champ source, sans créer de doublon dans `contacts_addresses`. L’adresse électronique de routage des factures reste dans Comptabilité ; elle n’est pas assimilée à un e-mail.

Les nouvelles adresses et modifications sont des brouillons locaux jusqu’à Enregistrer la fiche. Les adresses complémentaires passent ensemble par la route authentifiée `/api/horizon/contacts/addresses/save`, avec identifiants de création stables pour une reprise sans doublon. Permissions `contacts.read` + `contacts.write`, société active, contrôle d’appartenance, allowlist des champs, audit serveur et opération commune au fil. Aucune suppression d’adresse enregistrée dans ce parcours ; une adresse nouvelle non enregistrée peut être retirée du brouillon. Cette évolution remplace les contraintes postales obligatoires et la sauvegarde indépendante du contrat V1 historique ci-dessous.

Le logo de la société peut être utilisé visuellement comme badge sur l’avatar du contact.

### Contrat cible Contacts — 5 octobre 2026

Contrat implémenté par `1791158400_contact_references.js`, testé localement ; non installé sur NAS à cette étape.

- Ajouter `siren` (texte optionnel, 9 chiffres) et `siret` (texte optionnel, 14 chiffres, établissement principal). Normaliser les espaces ; lorsqu’ils sont tous deux renseignés, le SIRET commence par le SIREN. Validation client et serveur ; ne pas imposer ces identifiants aux entreprises étrangères. Les autres établissements pourront porter leur SIRET sur les adresses, sans dupliquer une société par rôle.
- Conserver `default_currency` comme seule devise société et retirer `preferred_currency` dans la migration d’évolution. Si seul l’ancien champ est rempli, transférer sa valeur ; valeurs identiques : conserver ; valeurs différentes : signaler le conflit et bloquer la suppression jusqu’à résolution explicite. Ne pas modifier la migration V1 déjà installée.
- `preferred_language` accepte jusqu’à 35 caractères pour les codes BCP 47. `preferred_language`, `default_currency` et `contacts_addresses.country` conservent des codes stables référencés respectivement à `settings_languages`, `accounting_currencies` et `settings_countries`. Validation serveur d’un code actif pour un nouveau choix ; une valeur inactive existante peut être conservée lors d’une autre modification. Pas de duplication du catalogue devise sous `settings`.
- Ajouter `is_primary` aux adresses : au plus une adresse principale par société / type, invariant serveur transactionnel. Pour l’existant, sélectionner automatiquement uniquement lorsqu’une seule adresse du type existe ; ambiguïtés à résoudre explicitement. Le siège reste dans `contacts_addresses`, sans recopier les champs d’adresse dans la société.
- Logo : un seul fichier protégé, déjà garanti par V1 ; `images` reste une galerie distincte. Les compteurs et la liste des personnes sont calculés depuis les collections propriétaires, sans colonnes de total dénormalisées dans Contacts.

### Contrat exécutable Contacts V1

Les quatre collections sont de type Base et possèdent `created` / `updated` automatiques. Aucun effacement applicatif : sociétés et personnes utilisent `active`, les rôles sont désactivés et les adresses restent conservées. Les sociétés archivées restent accessibles aux lecteurs autorisés.

- Société : `name` obligatoire (160), `legal_name` (200), `vat_number` / `fiscal_identifier` (80), langues (12), devises optionnelles sur trois lettres majuscules, site HTTP(S), téléphone (40), email optionnel valide, notes texte brut (10000). Logo unique et galerie jusqu'à dix fichiers, JPEG / PNG / WebP, 2 Mio chacun, protégés.
- Rôle : société obligatoire sans cascade, select unique `customer / supplier`, `active`. Index unique `(company, role)` : réactiver un rôle existant plutôt que dupliquer.
- Personne : société optionnelle sans cascade, prénom / nom (80) avec au moins un des deux non vide côté serveur, fonction (120), email, téléphone / mobile (40), notes (10000), avatar unique protégé selon les mêmes formats / taille.
- Adresse : société obligatoire sans cascade ; type `registered / billing / shipping / other`, ligne 1 obligatoire (200), ligne 2 (200), code postal (20), ville obligatoire (100), pays obligatoire sur deux lettres majuscules, région (100). Pas d'unicité sur société / type : plusieurs adresses sont possibles.
- Rattacher une personne, un rôle ou une nouvelle adresse à une société archivée est refusé côté serveur. Les rattachements historiques restent lisibles et ne sont pas supprimés lors d'un archivage.
- Lecture : compte / rôle actifs avec `contacts.read`. Création / modification : mêmes conditions et `contacts.write`. Suppression REST verrouillée. Changements Contacts audités côté serveur dans `core_audit`, au sein de la transaction de sauvegarde ; l'audit n'alimente pas le fil d'activité.
- Chaque fiche et chaque rôle / adresse se sauvegarde explicitement comme un objet distinct. Aucun assemblage multi-records partiellement sauvegardé en arrière-plan lors d'une création de société.

---

# 11. CRM

Le module CRM est propriétaire des opportunités commerciales, y compris les appels d’offres.

## `crm_opportunities`

Objet commercial principal.

Champs :

```text
opportunity_number
analytic_account
title
company
contact
owner
type
stage
estimated_value
estimated_cost
estimated_margin
currency
probability
expected_date
description
status
```

`type` est une valeur contrôlée.

Minimum initial :

```text
direct
tender
```

Relations :

```text
company → contacts_companies
contact → contacts_people
owner → core_users
analytic_account → accounting_analytic_accounts
```

Lors de la création de l’opportunité, le serveur génère son numéro métier et son compte analytique.

Exemple :

```text
opportunity_number = 11450
analytic_account.code = 11450
```

Une opportunité de type `direct` utilise uniquement les fonctions CRM communes.

Une opportunité de type `tender` possède en complément un enregistrement `crm_tenders`.

## `crm_activities`

```text
opportunity
type
date
owner
description
status
```

Types possibles à terme :

```text
call
email
meeting
task
note
```

---

## AO — dossier autonome puis opportunité liée

### `crm_tenders`

Dossier propriétaire CRM, lié à zéro ou une opportunité. `opportunity` est facultatif et unique seulement lorsqu’il est renseigné (index partiel). En **À analyser** (`todo`) et **No go** (`no_go`), un nouveau dossier reste autonome : aucun numéro commercial, compte analytique ou opportunité. En **En préparation** (`preparing`), la décision de répondre crée atomiquement l’opportunité `tender`, son numéro et son compte analytique, puis renseigne le lien. Un passage direct dans une autre étape de réponse (`review`, `ready`, `submitted` ou étape ajoutée) applique la même promotion. La transaction et le lien unique rendent cette promotion idempotente.

Champs AO : `reference`, `consultation_url`, `status` → `crm_tender_statuses`, `order`, `publication_date`, `submission_deadline`, `timezone`, `expected_result_date`, `visit_required`, `tags`, `active`, `archived_at`, timestamps ; clé de création et acteur cachés. Avant promotion, le dossier possède `title`, `company`, `contact`, `owner`, `market_types`, `estimated_value`, `estimated_cost`, `currency`, `probability`, `expected_date`, `description`, `description_content`. Après promotion, les champs commerciaux sont lus et modifiés dans l’opportunité : les valeurs initiales du dossier sont conservées comme snapshot, jamais comme second référentiel mutable.

**No go** signifie ne pas répondre ; **Perdue** reste un résultat commercial après poursuite de l’affaire. Un dossier déjà promu conserve son lien et son affaire historique même s’il revient en À analyser ou No go ; aucune suppression ni annulation commerciale automatique. L’archivage demeure une action explicite. Les anciennes affaires ne sont pas dénumérotées rétroactivement. `archived_at` conserve le sens de conversion AO → directe.

### `crm_tender_statuses` / `crm_tender_tags`

Référentiels CRM : `code` immuable unique, `label`, `tone`, `color`, `sort_order`, `active`, timestamps. Les étapes de préparation AO sont configurables indépendamment des six étapes commerciales. Une étape / un tag utilisé et désactivé reste lisible historiquement ; aucun déplacement vers une référence inactive. Réglages réservés à Admin / Superuser avec `settings.references`.

### `crm_appointment_kinds`

Deux présentations fixes des rendez-vous AO : `visit` (Visite), `hearing` (Soutenance). Code, libellé, ordre et active=true immuables ; `tone` / `color` modifiables par Admin / Superuser avec `settings.references`. Lecture avec `crm.read` ou droit de paramétrage. Pas de création / suppression REST. Mêmes champs de présentation que les référentiels CRM, validation serveur et audit. Ne change pas les valeurs structurelles `kind` des rendez-vous. Migration additive `1791504001_appointment_kind_colors.js` ; les tags AO historiques sont conservés, leur onglet de paramétrage est remplacé par ces couleurs.

### `crm_tender_appointments`

Rendez-vous multiples liés à `tender` : `kind` = `visit / hearing`, `start`, `end` (instants UTC), `timezone`, `location` (adresse ou lien), `notes`, `participants` → `hr_employees`, `status` = `planned / done / cancelled`, timestamps. Visites et soutenances partagent ce contrat, remplaçant les deux tables prospectives séparées visites / timeline. Les participants sont des ressources métier, pas obligatoirement des comptes Horizon. Leur sélection nécessite les droits Employés sur chaque ressource ; les noms ne sont pas exposés sans ces droits. Pas de suppression physique : annuler pour conserver l’historique.

### `crm_tender_submissions`

Dépôts immuables liés à `tender` : `creation_key` unique cachée, `version` entier serveur unique par dossier, `submitted_at` instant réel UTC, `timezone`, `submitted_by` → `core_users`, `notes`, `documents` JSON snapshot de références `{event_id, filename}`, `created`. Les pièces proviennent de `core_activity_events` du dossier AO ou de son opportunité liée (stockage protégé partagé). Les fichiers référencés par un dépôt ne sont plus supprimables. Les remises ultérieures créent une nouvelle version ; l’échéance de remise reste indépendante. Aucun PATCH / DELETE REST ni route de modification. Le numéro de version est calculé dans la transaction du dépôt, pas dans React.

### Autorisations et cohérence du lot AO

Lecture selon compte / rôle actifs et `crm.read` ; données sources filtrées avant retour. Toute écriture métier passe par les routes CRM avec `crm.write`, validation serveur, contrôle de version et transaction incluant audit + événement dans le fil de l’opportunité. Création AO autonome idempotente ; promotion transactionnelle à la décision de répondre. Le fil AO utilise `source_entity = crm_tenders` avant et après promotion ; le fil historique de l’opportunité reste conservé. Type convertible avec crm.write : AO → direct archive l’extension par archived_at sans supprimer ses relations ; direct → AO crée ou réactive l’unique extension, dans la même transaction. Identifiants, numéro et compte analytique conservés. Pas d’écriture REST directe sur dossiers, rendez-vous ou dépôts. `core_tasks` et `core_activity_events` sont réutilisés pour préparation / documents / échanges.

### Création et décision transactionnelles

```text
À analyser / No go → crm_tenders seul
En préparation → crm_tenders + crm_opportunities + accounting_analytic_accounts
```

Le serveur contrôle les versions et les permissions CRM. Une conversion depuis une opportunité directe déjà existante réutilise cette affaire et ne crée pas de seconde opportunité.

---

# 12. Ventes

## Devis — premier lot livré

Création de brouillons rattachés à une opportunité active, numéros serveur atomiques `opportunity_number-quote_sequence`, idempotence par acteur + creation_key cachés, version updated pour les modifications. Société, contact, devise et compte analytique repris à la création ; rattachement et numéro immuables ensuite. Titre et lignes libres HT (description, quantité, unité, prix unitaire) modifiables en draft ; subtotal et line_total calculés côté Pricing Service serveur en centimes. TVA, validation, PDF et conversion en commande restent pour les lots suivants : aucune action ne simule un document validé. Annulation draft → cancelled avec motif, sans suppression ni réutilisation du numéro. Champs additionnels title, notes, cancelled_at, creation_key, created_by ; révisions initialisées à 1.

`sales_orders` réserve dès ce lot le contrat relationnel quote/opportunity/analytic_account/company/contact/currency/subtotal/tax/total/status/owner/order_date ; aucune écriture publique tant que Commandes n’est pas livré. Le revenu prévisionnel HT de l’opportunité consolide par devise les devis hors cancelled/rejected et les commandes confirmed/in_progress/completed ; la contribution restante d’un devis lié est max(0, subtotal devis − subtotal commandes confirmées liées). Draft commandes exclues ; aucun mélange de devises ni recalcul des historiques. Le revenu prévisionnel n’est pas du chiffre d’affaires comptabilisé. Lecture des montants uniquement avec sales.read, pas par crm.read seul. Migration additive 1791504002_sales_quotes.js.

## `sales_quotes`

```text
quote_number
quote_sequence
revision
parent_revision
opportunity
analytic_account
company
contact
project
status
quote_date
valid_until
currency
exchange_rate
price_list
subtotal
cost_total
discount
tax
total
margin_amount
margin_percent
lost_reason
owner
validated_by
validated_at
sent_at
accepted_at
rejected_at
```

Relations :

```text
opportunity → crm_opportunities
analytic_account → accounting_analytic_accounts
company → contacts_companies
contact → contacts_people
project → projects_projects
owner → core_users
```

Statuts :

```text
draft
validated
sent
accepted
rejected
cancelled
```

Pour une opportunité `11450` :

```text
11450-1
11450-2
11450-3
```

`quote_sequence` est unique dans l’opportunité.

La génération est atomique côté serveur.

Suppression :

interdite après validation.

Plusieurs devis d’une même opportunité peuvent être `validated`, `sent` ou `accepted` simultanément.

L’acceptation d’un devis n’impose aucune unicité sur l’opportunité.

## Édition structurée des devis — lot S02

Migration additive `1791504003_sales_quote_editor.js` : lignes `kind` (item / section / subsection / note), `brand`, `reference`, `unit_cost`, remise en pourcentage `discount` (0–100), `is_option`, `show_total`, totaux de section `section_total` / `section_options_total`, coût total de ligne. Les sections s’étendent jusqu’au prochain titre de même niveau ou supérieur ; une section niveau 1 inclut ses sous-sections. Les options sont exclues de subtotal / revenu prévisionnel et regroupées dans `options_total` ; coûts et marges du devis excluent aussi les options. Toute valorisation est serveur, arrondi au centime par ligne après remise. Les lignes existantes deviennent item sans perte des montants. Numéro # = position ordonnée de toutes les lignes, titres / notes compris. La colonne Commande est réservée au futur objet d’approvisionnement ; aucun statut d’achat mutable ou simulé dans ce lot.

`settings_sales` : singleton key=default, `column_widths` JSON avec clés allowlist et valeurs 40–800 px, `validity_days` entier 1–365 (30 par défaut), created / updated. Lecture sales.read ou settings.references, écriture uniquement Admin / Superuser avec settings.references, contrôle de version serveur et audit. Pas de modèles de devis dans ce lot ; futur modèle réutilisera ces lignes / sections. `core_activity_events` / `core_tasks` acceptent sales_quotes, permissions sales.read / sales.write effectives côté serveur.

Devis S07 : remise de pied `sales_quotes.discount` en pourcentage (0–100), `discount_amount` et `subtotal_before_discount` snapshots serveur. `subtotal` devient le HT net après remise de pied ; `margin_amount = subtotal − cost_total`, `margin_percent = margin_amount / cost_total × 100` (coût nul : 0, UI affiche —). Les options restent hors remise de pied, TVA et marge principales. Chaque article non option reçoit un `tax_base` net après allocation proportionnelle de la remise au centime par arrondi cumulatif dans l’ordre des lignes ; la somme des bases est exactement le HT net. PTV et sous-totaux de sections restent avant remise de pied. Migration additive `1791504007_quote_footer_discount.js` initialise les nouveaux champs depuis les montants existants sans réécrire HT / TVA / TTC historiques. Écriture draft uniquement via service serveur, aucun nouveau droit.

## `sales_quote_lines`

```text
quote
position
product
reference
description
quantity
unit
unit_price
unit_cost
price_source
discount
tax_code
tax_rate
line_total
cost_total
margin_amount
```

## `sales_orders`

```text
order_number
quote
opportunity
analytic_account
company
contact
status
order_date
currency
exchange_rate
subtotal
tax
total
owner
validated_by
validated_at
```

Statuts :

```text
draft
confirmed
in_progress
completed
cancelled
```

## `sales_order_lines`

Structure proche des lignes de devis.

Champs complémentaires conceptuels :

```text
ordered_quantity
delivered_quantity
invoiced_quantity
cancelled_quantity
```

Les lignes conservent la référence au produit catalogue lorsqu’il existe.

## `sales_quote_revisions`

Optionnel si les révisions ne sont pas stockées directement dans `sales_quotes`.

```text
quote
revision
snapshot
created_by
created_at
```

## `sales_price_lists`

```text
code
name
currency
customer
valid_from
valid_to
active
```

`customer` vide = liste générale.

## `sales_price_list_items`

```text
price_list
product
min_quantity
unit_price
discount
valid_from
valid_to
```

## `sales_customer_prices`

Prix spécifique client lorsque nécessaire.

```text
company
product
currency
unit_price
discount
valid_from
valid_to
active
```
---

# 13. Achats

## `purchasing_requests`

Demande d’achat / besoin d’approvisionnement.

```text
request_number
status
source_module
source_record_id
requested_by
needed_date
currency
exchange_rate
exchange_rate_date
exchange_rate_source
exchange_rate_locked_at
notes
validated_by
validated_at
```

Statuts :

```text
draft
validated
partially_ordered
ordered
completed
cancelled
```

## `purchasing_request_lines`

```text
request
position
product
description
quantity
unit
suggested_supplier
source_line_id
needed_date
```

## `purchasing_request_line_allocations`

Ventilation analytique d’une ligne de demande d’achat.

```text
request_line
analytic_account
percentage
quantity
```

Règle :

la ventilation totale doit représenter l’intégralité de la ligne selon le mode retenu.

## `purchasing_orders`

```text
order_number
supplier
request
project
status
order_date
expected_date
currency
exchange_rate
exchange_rate_date
exchange_rate_source
exchange_rate_locked_at
subtotal
tax
total
owner
validated_by
validated_at
sent_at
```

Statuts :

```text
draft
validated
sent
acknowledged
partially_received
received
closed
cancelled
```

## `purchasing_order_lines`

```text
order
position
product
reference
description
quantity
unit_price
tax_rate
line_total
```

## `purchasing_order_line_allocations`

```text
order_line
analytic_account
percentage
quantity
```

Permet à une commande fournisseur de couvrir plusieurs codes CRM sans perdre la ventilation analytique.

## `purchasing_receipts`

```text
receipt_number
order
supplier
status
receipt_date
received_by
notes
```

Statuts :

```text
draft
validated
cancelled
```

## `purchasing_receipt_lines`

```text
receipt
order_line
product
quantity
location
lot
serial_number
analytic_account
```

## `purchasing_supplier_invoices_links`

Lien de contrôle entre facture fournisseur et réception / commande.

```text
supplier_invoice
purchase_order
purchase_receipt
matched_amount
status
```

---

# 14. Stock

## `inventory_units`

```text
code
label
category
ratio_to_base
rounding
active
```

Les conversions d’unité doivent être déterministes.

## `inventory_product_categories`

```text
name
code
parent
description
active
```

Les catégories peuvent être hiérarchiques.

## `inventory_products`

```text
sku
name
description
category
kind
composition_mode
sale_enabled
purchase_enabled
stock_policy
replenishment_policy
tracking
sale_unit
purchase_unit
base_unit
unit_conversion_rule
default_tax_code
default_sale_price
sale_currency
reference_cost
cost_currency
barcode
manufacturer
manufacturer_ref
primary_image
images
min_stock
max_stock
reorder_quantity
active
```

`kind` :

```text
service
equipment
consumable
```

`composition_mode` :

```text
none
kit
assembly
```

`stock_policy` :

```text
none
stocked
on_demand
```

`tracking` :

```text
none
lot
serial
```

## `inventory_product_components`

Composition d’un produit.

```text
parent_product
component_product
quantity
unit
position
required
```

Contraintes :

- un produit ne peut pas être son propre composant ;
- les cycles de composition sont interdits.

## `inventory_product_suppliers`

Relation produit / fournisseur.

```text
product
supplier
supplier_sku
purchase_price
currency
min_quantity
lead_time_days
priority
is_preferred
price_updated_at
last_purchase_at
last_purchase_price
active
```

Relations :

```text
supplier → contacts_companies
```

Une règle serveur garantit la cohérence du fournisseur privilégié.

## `inventory_supplier_price_history`

```text
product_supplier
price
currency
source
effective_at
import_job
purchase_order
```

Permet de conserver l’historique utile des prix.

## `inventory_reorder_rules`

```text
product
location
mode
min_quantity
max_quantity
reorder_quantity
preferred_supplier
active
```

## `inventory_locations`

```text
code
name
type
parent
active
```

## `inventory_movements`

```text
product
from_location
to_location
quantity
type
analytic_account
reference_module
reference_record_id
performed_by
movement_date
```

## `inventory_deliveries`

```text
delivery_number
company
order
status
delivery_date
```

Les services utilisent normalement `stock_policy = none`.

Les équipements et consommables utilisent les politiques configurées produit par produit.

## `inventory_stock_balances`

Vue / matérialisation logique par produit et emplacement.

```text
product
location
physical_quantity
reserved_quantity
available_quantity
incoming_quantity
```

## `inventory_reservations`

```text
product
location
quantity
sales_order
project
analytic_account
status
reserved_at
released_at
```

## `inventory_lots`

```text
product
lot_number
supplier_lot
received_at
expiry_date
status
```

## `inventory_serials`

```text
product
serial_number
lot
location
status
purchase_receipt
sales_delivery
analytic_account
```

## `inventory_returns`

```text
return_number
type
company
source_document_type
source_document_id
status
reason
rma_number
created_at
validated_at
```

`type` :

```text
customer_return
supplier_return
rma
```

## `inventory_return_lines`

```text
return
product
quantity
lot
serial_number
action
location
```

Actions possibles :

```text
restock
quarantine
supplier
repair
scrap
```

## `inventory_inventory_counts`

```text
count_number
location
status
started_at
validated_at
validated_by
```

## `inventory_inventory_count_lines`

```text
count
product
lot
serial_number
expected_quantity
counted_quantity
difference
```

---

# 15. Projets

## `projects_projects`

```text
project_number
name
company
opportunity
analytic_account
status
operational_status
financial_status
owner
start_date
target_end_date
actual_end_date
initial_revenue_budget
current_revenue_budget
initial_purchase_budget
current_purchase_budget
initial_be_minutes
current_be_minutes
initial_production_minutes
current_production_minutes
description
closed_at
closed_by
```

Relations :

```text
opportunity → crm_opportunities
analytic_account → accounting_analytic_accounts
```

Plusieurs projets peuvent référencer la même opportunité / le même compte analytique.

## `projects_sales_orders`

Relation plusieurs-à-plusieurs entre projet et commandes client.

```text
project
sales_order
is_primary
linked_at
linked_by
```

Permet à un projet d’agréger plusieurs commandes issues de plusieurs devis acceptés.

## `projects_phases`

```text
project
code
name
position
status
start_date
target_end_date
completed_at
optional
```

Statuts :

```text
not_started
in_progress
blocked
completed
skipped
cancelled
```

## `projects_milestones`

```text
project
phase
name
due_date
status
completed_at
```

## `projects_tasks`

```text
project
phase
title
description
status
assignee
start_date
due_date
order
```

## `projects_budget_revisions`

```text
project
revision
reason
revenue_budget
purchase_budget
be_minutes
production_minutes
created_by
created_at
approved_by
approved_at
```

La révision 0 représente la baseline initiale.

## `projects_acceptances`

PV / recette.

```text
acceptance_number
project
type
status
acceptance_date
company
contact
location
title
notes
document
signed_document
created_by
validated_by
validated_at
```

`type` :

```text
internal
fat
sat
partial
final
```

`status` :

```text
draft
pending
accepted
accepted_with_reservations
rejected
cancelled
```

## `projects_acceptance_reservations`

```text
acceptance
reference
description
priority
status
owner
created_at
due_date
resolved_at
resolution_notes
waived_by
waived_at
```

Statuts :

```text
open
in_progress
resolved
waived
cancelled
```

## `projects_deliverables`

Suivi des livrables / handover.

```text
project
phase
type
label
status
due_date
document
delivered_at
validated_by
validated_at
```

Exemples :

```text
DOE
plans
synoptics
configuration
backup
manual
acceptance_report
warranty_document
other
```

## `projects_closure_checks`

Checklist configurable de clôture.

```text
project
scope
code
label
required
status
validated_by
validated_at
notes
```

`scope` :

```text
operational
financial
```

La clôture opérationnelle et la clôture financière sont indépendantes.

---

# 16. SAV / Parc installé

## `service_installed_assets`

Équipement installé chez un client.

```text
asset_number
company
site_address
product
inventory_serial
project
sales_order
delivery
analytic_account
parent_asset
status
delivered_at
installed_at
commissioned_at
removed_at
location_label
notes
images
```

Relations principales :

```text
company → contacts_companies
site_address → contacts_addresses
product → inventory_products
inventory_serial → inventory_serials
project → projects_projects
analytic_account → accounting_analytic_accounts
```

`status` :

```text
planned
installed
in_service
out_of_service
removed
replaced
retired
```

Le numéro de série n’est pas recopié comme source de vérité s’il existe déjà dans `inventory_serials`.

## `service_warranties`

```text
installed_asset
type
provider_company
start_date
end_date
status
terms
document
source
```

`type` :

```text
cvs
manufacturer
extension
contract
other
```

## `service_tickets`

```text
ticket_number
company
contact
installed_asset
origin_project
origin_analytic_account
type
priority
status
title
description
owner
billing_mode
warranty
opened_at
resolved_at
closed_at
```

`type` :

```text
incident
support
warranty
maintenance
change_request
other
```

`billing_mode` :

```text
warranty
billable
contract
internal
```

## `service_interventions`

```text
intervention_number
ticket
company
installed_asset
project
analytic_account
status
planned_start
planned_end
actual_start
actual_end
location_type
site_address
diagnosis
work_performed
report_document
customer_contact
customer_validation
validated_at
```

Statuts :

```text
draft
planned
in_progress
completed
validated
cancelled
```

## `service_intervention_technicians`

```text
intervention
employee
planned_minutes
role
```

Les heures réalisées restent enregistrées dans `time_entries`.

## `service_intervention_parts`

```text
intervention
product
quantity
inventory_movement
lot
serial_number
unit_cost_snapshot
currency
```

Une ligne de pièce validée doit être cohérente avec un mouvement de stock.

## `service_maintenance_plans`

```text
company
installed_asset
name
frequency_type
frequency_value
next_due_date
assigned_team
instructions
active
```

## `service_maintenance_occurrences`

```text
maintenance_plan
due_date
status
intervention
generated_at
```

Statuts :

```text
planned
generated
completed
skipped
cancelled
```

## Règle analytique

Par défaut :

```text
garantie
→ origin_analytic_account

facturable
→ analytic_account dédié / affaire commerciale
```

La règle peut être adaptée explicitement par l’utilisateur autorisé.


---

# 17. TimeReport

## `planning_assignments`

Affectation prévisionnelle.

```text
employee
date
period
analytic_account
project
work_type
location_type
planned_minutes
capacity_minutes_snapshot
notes
created_by
```

`period` :

```text
day
night
```

`work_type` :

```text
be
production
service
maintenance
support
other
```

`location_type` :

```text
ATE
IDF
DEP
remote
client
```

Plusieurs affectations peuvent exister pour un même utilisateur / jour.

## `planning_work_calendars`

```text
name
weekly_pattern
timezone
active
```

## `planning_user_calendars`

```text
employee
work_calendar
valid_from
valid_to
```

## `planning_external_availability`

```text
employee
date
available_minutes
notes
```

## `planning_settings`

Préférences de vue partagées ou utilisateur.

```text
scope
user
hidden_user_ids
user_order
```

## `time_entries`

Heure réellement effectuée.

```text
employee
analytic_account
project
task
planning_assignment
date
duration_minutes
work_type
location_type
description
status
validated_by
validated_at
```

Le lien `planning_assignment` est optionnel.

Un temps réel n’est jamais automatiquement validé à partir du planning.

Les vues de reporting comparent :

```text
planned_minutes
vs
duration_minutes
```

par utilisateur, équipe, type de travail et compte analytique.
---

# 18. Congés

## `leave_requests`

```text
user
type
start_date
end_date
duration
status
reason
validated_by
validated_at
```

## `leave_balances`

```text
user
type
year
opening
earned
used
remaining
```

---

# 19. Dépenses

## `expenses_reports`

```text
user
project
title
status
total
submitted_at
validated_by
validated_at
```

## `expenses_lines`

```text
report
date
category
description
analytic_account
amount
tax
currency
receipt
```

---

# 20. Facturation

## `billing_invoices`

Objet facture client principal.

```text
invoice_number
company
contact
order
project
status
invoice_date
due_date
currency
exchange_rate
tax_context
subtotal
discount
tax
total
payment_status
validated_at
sent_at
paid_at
```

Relations :

```text
company → contacts_companies
contact → contacts_people
order → sales_orders
project → projects_projects
```

Une facture validée n’est plus supprimable.

## `billing_invoice_lines`

```text
invoice
position
product
reference
description
quantity
unit
unit_price
discount
tax_code
tax_rate
line_total
```

## `billing_credit_notes`

```text
credit_note_number
source_invoice
company
status
credit_note_date
currency
exchange_rate
exchange_rate_date
exchange_rate_source
exchange_rate_locked_at
tax_exchange_rate
tax_exchange_rate_date
tax_exchange_rate_source
subtotal
tax
total
validated_at
```

## `billing_credit_note_lines`

Structure équivalente aux lignes de facture.

## `billing_payment_schedules`

```text
invoice
sequence
due_date
amount
status
paid_amount
```

## `billing_payments`

Suivi métier des règlements connus par Horizon.

```text
invoice
payment_date
amount
currency
method
reference
status
source
```

La Phase 1 peut être alimentée par Sage ou par saisie / synchronisation selon l’intégration disponible.

---

## Facturation électronique

### `billing_einvoice_transmissions`

Une transmission ou réception via une plateforme agréée.

```text
direction
document_type
invoice
credit_note
supplier_invoice
provider
external_id
status
format
submitted_at
received_at
last_synced_at
last_error
payload_hash
```

`direction` :

```text
outbound
inbound
```

Provider initial :

```text
SUPER PDP
```

Valeur technique stockée :

```text
super_pdp
```

### `billing_einvoice_events`

Historique du cycle de vie.

```text
transmission
external_event_id
event_code
status
event_date
label
payload
received_at
```

Contrainte d’idempotence :

```text
provider + external_event_id UNIQUE
```

si l’identifiant fournisseur le permet.

### `billing_supplier_invoices`

Factures fournisseurs reçues électroniquement ou créées dans Horizon.

```text
supplier
supplier_invoice_number
invoice_date
due_date
currency
exchange_rate
exchange_rate_date
exchange_rate_source
exchange_rate_locked_at
tax_exchange_rate
tax_exchange_rate_date
tax_exchange_rate_source
subtotal
tax
total
status
purchase_order
project
einvoice_transmission
validated_at
```

Relations :

```text
supplier → contacts_companies
purchase_order → purchasing_orders
project → projects_projects
```

### `billing_supplier_invoice_lines`

```text
supplier_invoice
position
reference
description
quantity
unit_price
tax_code
tax_rate
line_total
```

---

# 21. Comptabilité

Le modèle comptable est prévu dès le départ, même si Sage reste la source de vérité officielle en Phase 1.

## `accounting_accounts`

Plan comptable général.

```text
code
label
type
parent
allow_reconciliation
active
```

## `accounting_third_party_accounts`

Comptes auxiliaires clients / fournisseurs.

```text
company
type
account_code
general_account
active
```

`type` :

```text
customer
supplier
```

## `accounting_journals`

```text
code
label
type
default_debit_account
default_credit_account
active
```

Exemples de types :

```text
sales
purchases
bank
cash
general
```

## `accounting_fiscal_years`

```text
label
start_date
end_date
status
closed_at
closed_by
```

## `accounting_periods`

```text
fiscal_year
label
start_date
end_date
status
locked_at
```

## `accounting_currencies`

```text
code
label
sort_order
minor_unit_digits
active
```

## `accounting_exchange_rates`

```text
base_currency
quote_currency
rate
rate_date
source
published_at
retrieved_at
created_at
```

Source V1 :

```text
ECB
```

Contrainte conceptuelle :

```text
base_currency + quote_currency + rate_date + source UNIQUE
```

L’historique n’est jamais écrasé.


## `accounting_tax_codes`

```text
code
label
rate
country
zone
operation_type
valid_from
valid_to
tax_account_collected
tax_account_deductible
active
```

## `accounting_entries`

En-tête d’écriture.

```text
entry_number
journal
fiscal_year
period
entry_date
label
source_module
source_record_id
status
accounting_provider
external_id
posted_at
exported_at
```

Statuts conceptuels :

```text
draft
ready
posted
exported
rejected
reversed
```

## `accounting_entry_lines`

```text
entry
position
account
third_party_account
label
debit
credit
currency
tax_code
project
analytic_code
due_date
reconciliation_status
```

Règle :

```text
SUM(debit) = SUM(credit)
```

avant comptabilisation définitive.

## `accounting_payment_methods`

```text
code
label
active
```

## `accounting_bank_accounts`

```text
label
bank_name
iban
bic
currency
ledger_account
active
```

Les données sensibles sont protégées selon les règles de sécurité.

## `accounting_bank_transactions`

```text
bank_account
external_id
transaction_date
value_date
label
amount
currency
status
```

## `accounting_reconciliations`

```text
account
date
status
created_by
validated_by
validated_at
```

## `accounting_reconciliation_lines`

```text
reconciliation
entry_line
amount
```

## `accounting_exports`

Trace d’un export comptable.

```text
provider
export_type
period_start
period_end
status
file
created_by
created_at
exported_at
error
```

Provider initial :

```text
sage
```

## `accounting_sync_records`

Journal technique de synchronisation avec un système comptable externe.

```text
provider
direction
entity_type
entity_id
external_id
status
payload_hash
attempts
last_attempt_at
synced_at
last_error
```

Objectif :

- idempotence ;
- retry ;
- traçabilité ;
- réconciliation.

## `accounting_mappings`

Mapping Horizon ↔ système comptable.

```text
provider
mapping_type
source_value
target_value
active
```

Exemples :

```text
compte
journal
TVA
mode de règlement
analytique
```

## `accounting_analytic_events`

Flux économique normalisé pour reporting analytique.

```text
analytic_account
event_type
source_module
source_entity
source_record_id
event_date
amount
currency
base_amount
base_currency
quantity
unit
metadata
```

`event_type` peut représenter :

```text
sales_forecast
sales_ordered
sales_invoiced
sales_paid
purchase_budget
purchase_committed
purchase_received
purchase_invoiced
purchase_paid
be_planned
be_actual
production_planned
production_actual
expense
stock_consumed
```

Les événements peuvent être recalculés depuis les sources métier, mais les rapports doivent utiliser des règles cohérentes.

## `accounting_margin_snapshots`

```text
analytic_account
snapshot_date
sales_forecast
sales_ordered
sales_invoiced
sales_paid
purchase_budget
purchase_committed
purchase_received
expense_total
labor_cost
stock_cost
forecast_margin
current_margin
currency
```

Utilisé pour historique / dashboard si nécessaire.

## `accounting_analytic_accounts`

Compte analytique transverse de l’affaire.

```text
code
label
company
opportunity
status
active
```

Le compte est généralement créé avec l’opportunité CRM.

Exemple :

```text
11450
```

Il reste stable lorsque plusieurs devis, commandes ou projets sont créés.

Le reporting analytique consolide les revenus, achats, dépenses, mouvements de stock et temps rattachés à ce compte.

## Phase 1

```text
Horizon
→ génère / prépare les écritures
→ SageAccountingProvider
→ Sage
```

Sage reste la source de vérité officielle.

## Phase future

Les mêmes objets permettent :

```text
HorizonAccountingProvider
→ comptabilisation interne
→ journaux
→ balances
→ clôture
→ FEC
```

Le passage de Sage vers Horizon ne doit pas nécessiter une refonte du module Facturation.

---

# 22. Documents

## `documents_templates`

```text
name
type
module
language
status
current_version
```

## `documents_template_versions`

```text
template
version
content_json
styles
published_at
published_by
```

## `documents_generated`

```text
type
source_module
source_record_id
template_version
html_snapshot
pdf_file
status
hash
created_by
created_at
```

## `documents_links`

```text
document
source_module
source_record_id
label
```

Un document finalisé reste figé.

## `documents_signatures`

```text
document
type
signer_name
signer_email
provider
external_id
status
signed_at
metadata
```

`provider` peut rester vide pour une signature visuelle interne.

## `documents_archives`

```text
document
archive_policy
archived_at
retention_until
legal_hold
purge_allowed
```

---

# 23. Messagerie E-mail

## `messaging_email_messages`

```text
from
to
cc
bcc
subject
html
text
status
provider
provider_message_id
source_module
source_record_id
sent_by
sent_at
error
```

## `messaging_outbox`

```text
message
status
attempts
next_attempt_at
last_error
```

Statuts :

```text
draft
pending
sent
failed
```

---

# 23. Messagerie Chat

## `messaging_conversations`

```text
type
title
context_module
context_record_id
created_by
last_message_at
```

Types :

```text
direct
group
contextual
```

## `messaging_conversation_members`

```text
conversation
user
role
joined_at
muted
```

## `messaging_chat_messages`

```text
conversation
author
body
reply_to
attachments
edited_at
```

## `messaging_chat_reads`

```text
conversation
user
last_read_message
last_read_at
```

---

# 25. Calendrier

## `calendar_events`

Pour les événements manuels et événements réellement possédés par Calendrier.

```text
title
description
start
end
all_day
owner
visibility
source_module
source_record_id
```

Les dates AO, Projets ou Congés peuvent être exposées au calendrier sans duplication systématique.

---

# 26. Recherche / Notifications

## `core_notification_preferences`

```text
user
event_type
in_app
email
```

## `core_search_synonyms`

Optionnel.

```text
term
synonyms
active
```

La recherche globale s’appuie principalement sur les tables métier et leurs index.

---

# 27. Paramètres

## `settings_values`

À utiliser uniquement pour des paramètres globaux clairement typés.

Éviter la collection fourre-tout incontrôlée.

## Référentiels

Créer des collections dédiées lorsque la valeur est métier et administrable :

```text
payment_terms
delivery_terms
expense_categories
project_types
tax_rates
```

---


## `settings_authentication`

```text
password_auth_enabled
microsoft_oauth_enabled
microsoft_tenant_mode
updated_at
updated_by
```

Règles :

```text
password_auth_enabled = true
```

par défaut.

Microsoft OAuth2 peut être activé en complément.

Les rôles et permissions restent stockés dans Horizon.

## `settings_tax_mappings`

Mapping contexte fiscal → code TVA.

```text
name
product_kind
country
zone
operation_type
customer_tax_profile
supplier_tax_profile
tax_code
priority
valid_from
valid_to
active
```

Utilisé par `TaxService`.

## `settings_payment_terms`

```text
code
label
schedule_type
days
installments
active
```

## `settings_work_types`

```text
code
label
category
active
```

## `settings_location_types`

```text
code
label
active
```

## `settings_numbering_sequences`

```text
entity_type
start_value
has_issued
prefix
suffix
pattern
separator
padding
next_value
reset_rule
reset_month
show_previous_identifier
active
```

## `settings_incoterms`

```text
code
label
active
```

## `settings_languages`

```text
code
label
sort_order
active
```

## `settings_countries`

```text
code             ISO 3166-1 alpha-2, unique
label
sort_order
active
```

Référentiel transversal, administré dans Paramètres. `sort_order` est livré dans `settings_languages` et `accounting_currencies` ; codes uniques et stables, langues au format BCP 47, devises au format ISO 4217. Désactivation sans suppression des références historiques. Les paramètres globaux et préférences des sociétés sont des choix dans ces catalogues, pas de nouveaux catalogues.

## `settings_archive_policies`

```text
entity_type
archive_after_days
retention_days
purge_allowed
active
```

Les valeurs sont configurées après validation métier / réglementaire.


# 28. Numérotation

Numéros générés côté serveur.

Exemples :

```text
CRM 11450
DEV 11450-1
DEV 11450-2
CMD-2026-00124
BL-2026-00084
FAC-2026-00208
```

Format configurable dans Paramètres.

La génération doit être atomique.

Convention cible à figer avant mise en production pour :

```text
CRM
DEV
CMD client
DA
CMD fournisseur
REC
BL
FAC
AVOIR
PROJET
```

La configuration ne doit jamais permettre de réutiliser un numéro déjà attribué.

Les documents comptables / factures suivent en plus les contraintes de continuité et d’audit définies avec la comptabilité.

---

# 29. Index

Créer des index pour :

- numéros uniques ;
- relations fréquentes ;
- statuts ;
- dates filtrées ;
- recherches critiques.

Ne pas indexer tous les champs.


Index supplémentaires à prévoir :

```text
projects_sales_orders(project, sales_order)
projects_acceptances(project, acceptance_date)
projects_acceptance_reservations(acceptance, status)

service_installed_assets(company, status)
service_installed_assets(inventory_serial)
service_tickets(ticket_number)
service_tickets(company, status)
service_interventions(ticket, status)
service_maintenance_occurrences(due_date, status)
```


```text
core_business_identifiers(identifier)
```

---

# 30. Fichiers

Les fichiers restent dans PocketBase Files.

Métadonnées utiles en base :

```text
type
label
source_module
source_record_id
created_by
created_at
```

Documents sensibles :

- Protected Files ;
- règles d’accès explicites.

---

---

# API externe

## `api_clients`

```text
name
description
key_prefix
key_hash
key_created_at
key_last_four
active
expires_at
allowed_ips
rate_limit_per_minute
created_by
created_at
last_used_at
revoked_at
```

La clé complète n’est jamais stockée en clair.

`key_prefix` permet d’identifier la clé dans les logs / interfaces.

## Génération des clés API

La clé complète n’est jamais stockée.

À la création :

```text
raw_key = secure_random()
key_prefix = partie publique identifiable
key_hash = hash(raw_key)
key_last_four = derniers caractères pour identification UI
```

La clé brute est retournée une seule fois à l’administrateur.

Format recommandé :

```text
hz_<environment>_<random>
```

Exemples conceptuels :

```text
hz_prod_...
hz_preprod_...
```

Le format exact reste interne à Horizon mais doit permettre d’identifier rapidement l’origine de la clé sans révéler le secret.

Une rotation crée une nouvelle clé et invalide ou planifie l’invalidation de l’ancienne.

---

## `api_access_policies`

```text
api_client
resource
can_list
can_read
can_create
can_update
can_delete
read_fields
write_fields
data_scope_type
data_scope_config
active
```

`read_fields` et `write_fields` sont des allowlists.

`data_scope_type` :

```text
all_authorized
specific_companies
specific_projects
specific_analytic_accounts
own_records
custom_safe_scope
```

`data_scope_config` ne contient jamais de filtre SQL libre.

## `api_request_logs`

```text
api_client
request_id
timestamp
method
resource
action
status_code
duration_ms
ip_address
error_code
```

Ne pas stocker le payload complet par défaut.

## `api_key_rotations`

```text
api_client
old_key_prefix
new_key_prefix
rotated_by
rotated_at
old_valid_until
```

Permet une rotation avec courte période de recouvrement si nécessaire.

---

# 31. Matching Imports

Le matching produit utilisé par les imports suit cet ordre :

```text
1. core_external_references
2. inventory_products.sku
3. inventory_products.barcode
4. manufacturer + manufacturer_ref
5. supplier + supplier_sku
6. conflit / validation manuelle
```

Un import dispose d’un mode `dry_run`.

Le résultat du dry run distingue :

```text
create
update
skip
conflict
error
```

Aucun enregistrement existant n’est modifié tant que l’import n’est pas validé.

Les imports de prix fournisseur mettent à jour `inventory_product_suppliers` et alimentent `inventory_supplier_price_history`.

---

# 32. View Collections

Utilisées pour :

- dashboard ;
- reporting ;
- statistiques ;
- agrégations.

Pas pour stocker un workflow métier.

---

# 33. Migrations

Toutes les modifications du schéma :

```text
pocketbase/pb_migrations/
```

Versionnées dans Git.

Une base neuve doit pouvoir être reconstruite à partir des migrations.

---

# 34. Seeds

Dossier :

```text
pocketbase/seeds/
```

Contient uniquement les données de référence nécessaires au démarrage.

Exemples :

- rôles ;
- statuts par défaut ;
- taux ;
- catégories standards.

Pas de données métier réelles.


---

# Import fournisseur — règles complémentaires

Les imports catalogues / tarifs peuvent mapper des colonnes variables.

Données possibles :

```text
supplier
supplier_sku
manufacturer
manufacturer_ref
description
purchase_price
currency
unit
packaging
min_quantity
lead_time
valid_from
valid_to
```

Un prix importé peut être :

```text
actuel
futur
expiré
```

Les prix obsolètes restent historisés mais ne sont plus proposés comme prix courant.

## `core_company_lookup_limits`

Collection technique verrouillée (aucune API CRUD applicative), mise à jour exclusivement par les routes de recherche société. Identifiant de record = utilisateur Horizon ; champs `count` et `reset_at` (millisecondes UTC). Limite locale de 20 requêtes recherche / aperçu / application par utilisateur sur 60 secondes, stockée transactionnellement. Aucun secret ou résultat fournisseur dans cette collection. Les paramètres globaux de limitation PocketBase restent inchangés.

`contacts_companies.enrichment` contient uniquement fournisseur, date serveur, identifiant recherché, champs appliqués et présence d’une application d’adresse. Champ JSON géré par la route serveur ; modification REST directe interdite. La preuve temporaire d’aperçu est liée à l’utilisateur en mémoire serveur, expire après dix minutes et est invalidée après succès. Un redémarrage impose de relancer l’aperçu.


### Présentation Contacts — reprise du 5 octobre 2026

La refonte de fiche utilise les collections et champs existants. L’adresse du siège se sauvegarde dans `contacts_addresses` avec type `registered` et `is_primary`; elle est disponible dès la création. Le champ historique `contacts_companies.images` et ses fichiers sont conservés malgré le retrait de la galerie de l’interface. Aucun changement de schéma ni migration supplémentaire pour cette refonte.

Les vues Cartes / Liste et le déplacement des relations commerciales dans l’en-tête réutilisent `contacts_company_roles` et l’expansion société existante des personnes. Un contact affiche les relations de sa société, pas une copie de rôles dans sa propre collection. Aucun changement de schéma pour ce lot de finition.

La synthèse du répertoire est calculée sans collection supplémentaire : `totalItems` des personnes / sociétés actives et des relations commerciales actives customer / supplier liées à une société active. L’unicité existante société + rôle rend ces derniers totaux équivalents au nombre de sociétés par catégorie. Aucun pourcentage historique, compteur persistant ou champ de charte ajouté.

Localisation des cartes : expansion de la relation inverse existante `contacts_addresses_via_company`, typée dans les réponses société et imbriquée dans les réponses personne. Aucune adresse dénormalisée sur la société ou la personne, aucune collection ni migration ajoutée. Les lectures restent soumises aux règles Contacts existantes.

Organisation Paramètres par domaine : navigation et catalogue sélectionné gérés dans les routes frontend, sans collection ni migration supplémentaire. Les rubriques « Prévu » ne lisent ni n’écrivent de nouveaux réglages. Les référentiels continuent d’utiliser leurs collections, API Rules, validation et audit existants.

Relations sociétés — décision utilisateur du 5 octobre 2026 : seuls `customer` (Client) et `supplier` (Fournisseur) sont admis, cumul possible via deux enregistrements distincts. Migration `1791158401_company_roles.js` restreignant le select, hooks et schéma frontend concordants. Aucun effacement / conversion implicite : la migration refuse de démarrer si un rôle ancien existe, ce qui doit être résolu explicitement. L’utilisateur indique que sa base ne contient aucun rôle à reprendre.


Recherche publique d’entreprises : aucun changement de schéma. Les champs existants reçoivent les données sélectionnées seulement lors de la sauvegarde explicite de la fiche. Les champs historiques de provenance et la collection technique de limites du fournisseur précédent sont conservés pour compatibilité des migrations ; ce parcours direct ne les utilise pas.


Suppression des fiches Contacts — évolution autorisée du 5 octobre 2026 : migration `1791158402_contact_deletion.js` reprend les règles update comme deleteRule pour contacts_companies / contacts_people (`contacts.read` et `contacts.write`, compte et rôle actifs). Les deleteRule des rôles et adresses restent verrouillées.

La suppression contrôlée inspecte les champs relation de toutes les collections de données : une référence réelle au record interdit sa suppression, sans filtre active ni permissions de lecture du module lié. Le filtre sur `<relation>.id ?= id` couvre relations simples et multiples. Les modèles des futurs devis, factures, commandes et livraisons doivent référencer la société par une relation PocketBase réelle ; des identifiants libres dans du texte / JSON ne sont pas contrôlés par ce mécanisme. Les vues ne sont pas parcourues car leurs tables sources sont contrôlées.

Exception de propriété : contacts_company_roles.company et contacts_addresses.company sont supprimés avec leur société seulement après absence de toute autre relation. Société, lignes propres et audits de suppression sont transactionnels ; un échec rétablit tous les enregistrements. Les personnes associées sont conservées et bloquent la suppression. core_audit garde before et after=null pour delete ; aucun historique d’audit n’est purgé.


Migration `1791158403_company_accounting.js` — champs sociétés ajoutés : rcs_number (texte 120), billing_email (e-mail), einvoice_routing_address (texte 120), einvoice_platform (texte 120), einvoice_service_code (texte 100), einvoice_status (select unknown / to_configure / ready / not_applicable). fiscal_identifier reste un champ historique masqué dans l’UI ; ne pas convertir ses valeurs en RCS. Les valeurs vides historiques du statut sont présentées comme unknown. Les valeurs par défaut fr / EUR / unknown s’appliquent à la création sur le schéma installé, sans modifier rétroactivement les fiches existantes.

accounting_third_party_accounts est livré comme première partie du modèle prévu : company (relation obligatoire), type customer / supplier, account_code (32, lettres / chiffres / point / tiret / underscore), active, dates. Unicité (company, type). Un code vide désactive le profil ; actif exige un code. general_account et le référentiel accounting_accounts restent à réaliser avec le plan comptable, sans deuxième source de vérité créée dans Contacts. Le propriétaire des profils est accounting ; Contacts orchestre le service comptable.

Lecture avec contacts.read ; création / modification avec contacts.read + contacts.write pour ce profil préparatoire, compte et rôle actifs. Suppression REST verrouillée. Audit dans le module accounting. Les profils tiers sont des données propres à une société : nettoyés avec une société inutilisée, mais une référence à un de ses comptes ou adresses (même indirecte, archivée ou invisible) bloque la suppression de la société. Aucun mouvement ou historique comptable ne peut être supprimé par cette opération.


Migration `1791158404_company_lei.js` : ajout de `contacts_companies.lei`, texte facultatif, max 20, pattern `^[A-Z0-9]{20}$`. Le RCS reste conservé et masqué, sans renommage ni conversion. Un champ créé manuellement avec exactement cette définition est accepté sans doublon ni perte de valeurs ; une définition différente fait échouer la migration pour permettre une correction explicite. Le rollback est refusé pour préserver les identifiants. La duplication efface le LEI du nouveau brouillon.


Notifications livrées par `1791158405_notifications.js` : `core_notifications`, propriété core, champs conformes au contrat user / type / title / body / source_module / source_entity / source_record_id / read_at / created. user obligatoire, relation unique core_users sans cascade ; title obligatoire (160), body texte (4000), type et module/entity (80), record_id (15), read_at date facultative, created autodate serveur. Index (user, read_at, created). Aucun second compteur stocké : le nombre non lu est calculé côté serveur par les API Rules. Aucun changement de données société pour rechercher les logos : fichier logo existant, unique, protégé, 2 Mio maximum.


### Schéma Activity Feed livré par 1791158406_activity.js

core_activity_events conserve le contrat source_module/source_entity/source_record_id/type/author/body/metadata/created et ajoute operation_id (texte 64, regroupement sans valeur d’autorisation), mentions (relation core_users, max 10), attachments (fichiers protégés, max 5, 10 Mio chacun ; PDF, PNG, JPEG, WebP, texte). body max 10000 ; metadata JSON max 100000, auteur affiché snapshot, changes sous forme label/before/after, mentions nom/id et origine de conversion. Indices source+created et operation+author+source. Les sources sont polymorphes textuelles pour préserver l’historique sans créer de blocage automatique à la suppression de société/personne ; les API Rules contrôlent l’existence de la source autorisée.

core_activity_mentions : event obligatoire (relation événement), user obligatoire (core_users), notified_at/read_at ; unique event+user. Lecture et écriture REST verrouillées ; seul le serveur les manipule. Le fil expose les mentions à travers les métadonnées contrôlées.

core_tasks : contrat title/description/source/created_by/assigned_to/due_date/priority/status/activity_event/completed_at, plus assigned_name (snapshot contrôlé serveur), created/updated. Title 160 obligatoire, description 10000, responsable et auteur obligatoires. États todo/in_progress/blocked/done/cancelled ; priorité low/normal/high. Une tâche par événement de création (index unique activity_event). Source polymorphe textuelle, mêmes droits de lecture que le fil ; création REST verrouillée, création par publication serveur, mise à jour restreinte.

core_notifications reçoit activity_event (relation facultative, sans cascade). Le lien permet de synchroniser read_at d’une mention avec la notification. Les notifications de type activity sont visibles uniquement au destinataire encore autorisé à lire Contacts et dont la fiche source existe ; les autres notifications gardent leur policy privée de destinataire.

Le backfill de migration projette les audits existants par groupes de 100, liste fermée de champs métier, skip des sources supprimées et valeurs techniques. Pas de modification des audits ni des fiches, pas de doublon au second migrate up. Date created d’origine conservée par requête SQL liée dans la migration car le champ autodate protège son horodatage pendant un save ordinaire.


Pièces jointes du fil — exception contrôlée à l’immutabilité : attachments peut être réduit uniquement via la route serveur dédiée de suppression. Aucun champ de schéma supplémentaire. L’événement original garde body/author/created/mentions/metadata ; un nouvel événement document porte metadata.action = attachment_delete et origin_event, tandis que core_audit conserve les listes de fichiers avant/après, le fichier retiré et l’acteur. Le fichier est supprimé du stockage protégé par PocketBase ; son ancien lien ne fonctionne plus.

### Vues enregistrées — 1791244801_saved_views.js

`core_saved_views`, propriétaire core : name (texte obligatoire 80), context (contacts.companies / contacts.people), owner (relation core_users obligatoire sans cascade), visibility (personal / shared), params (JSON obligatoire 4 Ko), created / updated automatiques. Index context + owner + visibility. Les params sont exclusivement q (200 caractères), state, role, group, sort et view, avec valeurs validées pour le contexte. Aucun SQL, permission, token ou critère libre. Owner est fixé depuis l’utilisateur authentifié à la création ; owner et context sont immuables. Pas de copie de données Contacts dans cette collection. Une vue personnelle est visible au créateur et aux administrateurs de vues ; une globale est visible aux utilisateurs autorisés du module. Tous peuvent créer une vue personnelle/globale ; modification/suppression seulement par créateur ou rôle disposant de core.views.manage. Compte/rôle actifs et contacts.read nécessaires. Audit serveur transactionnel de création/modification/suppression, sans événement métier dans le fil d’une société. Rollback destructif refusé.

Regroupements Contacts : aucune colonne de pays dénormalisée ni collection de groupes. Les groupes et leurs totaux sont calculés à la demande sur le résultat autorisé, par pays du siège déterminé comme dans les cartes, ou société associée pour les personnes. Pagination stable de 25 fiches, au maximum 25 IDs et métadonnées des groupes de la page ; les fiches et expansions restent lues par l’API standard soumise aux API Rules. Un groupe partagé entre pages affiche son total et le nombre présent sur la page courante.

Navigation des fiches : aucun nouvel identifiant métier ni collection. GET /api/horizon/contacts/navigation retourne `{position, total, previous, next}` ; position est un ordinal calculé, pas un numéro stocké. Critères allowlist identiques aux groupes, avec group=none accepté ; id est un identifiant PocketBase de 15 caractères. Hors résultat : position=0, total du filtre, voisins vides. Aucun attribut de fiche exposé par cette route ; policy contacts.read active identique au répertoire et aux groupes. Toute future restriction par fiche doit également s’appliquer au rang, total et voisins.

Compteurs des onglets Contacts / Adresses et futurs raccourcis métier : aucune collection ni champ de compteur dénormalisé. Contacts = total de contacts_people où company correspond à la société et active=true, calculé par PocketBase avec ses API Rules. Adresses = lignes contacts_addresses lisibles pour la société + e-mail général / billing_email présents, conformément aux cartes virtuelles du répertoire. Les identifiants des sources seront transmis aux filtres de listes des futurs modules ; un rôle commercial actif sélectionne les raccourcis applicables, sans créer de pièces ou de rôles personnels.

## Contrat initial CRM classique — migration `1791244802_crm.js`

Ce lot implémente `crm_opportunities` pour `type=direct` uniquement ; `tender` et ses tables sont réservés au lot AO suivant. Numéro unique, compte analytique requis, société / responsable / étape requis ; contact facultatif contrôlé contre la société. Montant et coût positifs ou nuls, probabilité entière 0–100, marge serveur = montant − coût. `currency` est un code du référentiel actif `accounting_currencies`, `expected_date` une date valide ou vide. `status` = open / won / lost / cancelled, `active` booléen indépendant. Champs created / updated ; création_key technique (`creation_key`, UUID unique non vide) et `creation_actor` cachés des exports REST, exclusivement serveur.

`crm_stages` : code unique immuable, label, sort_order entier positif ou nul, tone (blue / violet / pink), active, created / updated. Référence `stage` de l’opportunité ; configurable avec settings.references. Trois valeurs initiales Qualification / Proposition / Négociation, sans sémantique de validation critique codée par leur nom.

`accounting_analytic_accounts` : code unique égal au numéro CRM, label, company → contacts_companies, opportunity → crm_opportunities, status open / closed, active, created / updated. La relation opportunity est facultative au niveau du schéma pour permettre l’amorçage de la relation circulaire dans une transaction ; le parcours métier CRM la renseigne avant le commit et ne publie aucun compte orphelin. Le compte ne change jamais de code ou d’identifiant ; son libellé et sa société suivent la fiche via AnalyticService. Aucun CRUD utilisateur direct.

`settings_numbering_sequences` appartient à Paramètres : entity_type unique, start_value entier positif (départ historique), has_issued (au moins une allocation validée), prefix / suffix, pattern, separator, padding 1–12, next_value entier positif, reset_rule=never, active, created / updated. Enregistrement initial CRM : pattern={sequence}, padding=5, start_value=1, next_value=1. Seul ce token et l’absence de remise à zéro sont pris en charge actuellement ; les autres patterns du modèle cible ne sont pas encore activés. Lecture settings.references ; écritures CRUD API interdites, modification via route serveur authentifiée settings.references avec contrôle de version et audit transactionnel. Départ immuable après allocation ; prochain compteur ne recule jamais après utilisation. Allocation incrémentale et has_issued transactionnels, contraintes uniques en base ; une transaction refusée ne consomme pas le numéro. Migration `1791331201_numbering_settings.js` conserve les compteurs et initialise has_issued depuis l’historique CRM / compteur existant.

Étapes CRM fixes — 7 octobre 2026 : seuls new, qualified, won, completed, lost et cancelled restent actifs, avec significations open / open / won / completed / lost / cancelled immuables. Création et suppression API interdites ; titre, ordre, tone et color modifiables avec settings.references, désactivation interdite. Les anciennes étapes restent conservées mais inactives ; leurs opportunités sont rattachées à une des six étapes selon l’état métier (open → qualified). `crm_stages.color` et `crm_market_types.color` : texte facultatif #RRGGBB (7 caractères), prioritaire sur tone pour le rendu ; vide signifie palette Horizon. Migration `1791331202_fixed_crm_stages_colors.js` conserve titres / tons / numéros et objets historiques.

Core conserve ses collections de fil, mentions, tâches et notifications. Leurs sources autorisées s’étendent à source_module=crm / source_entity=crm_opportunities ; aucun mélange des droits CRM et Contacts. Les tables AO et crm_activities ne sont pas créées par ce lot.


CRM — révision pipeline : six étapes initiales `new` Nouveau, `qualified` Qualifié, `won` Gagné, `completed` Terminé, `lost` Perdue, `cancelled` Annulé. `crm_stages.status` (open/won/completed/lost/cancelled) définit l’état appliqué côté serveur lors d’un changement d’étape ; état commercial distinct de l’archivage et de toute clôture comptable. Les anciennes étapes standard sont désactivées et leurs affaires transférées en conservant leur état commercial ; les étapes personnalisées et les comptes analytiques sont conservés.

`crm_market_types` appartient à CRM et utilise le référentiel partagé : code unique immuable, label, active, sort_order, created, updated. Valeurs initiales Broadcast, Corporate, Institutionnel, Événementiel, Consulting, Export. Lecture crm.read ou settings.references, écriture settings.references, suppression interdite. `crm_opportunities.market_type` est une relation facultative vers ce référentiel. `description_content` est un JSON Tiptap facultatif (100 Ko maximum, profondeur/nœuds bornés, types et attributs en allowlist) ; description conserve la projection texte pour historique et compatibilité. Aucune description HTML brute enregistrée. Migration corrective `1791244803_crm_pipeline.js`, sans suppression de données ni renumérotation.

CRM — paramètres et qualification multiple, 7 octobre 2026 : `crm_stages.tone` et `crm_market_types.tone` utilisent la palette partagée blue / violet / pink / green / amber / navy. La couleur configurée est la source unique des colonnes et tags ; elle ne se déduit plus du code métier. `crm_opportunities.market_types` remplace la relation unique `market_type` par une relation multiple facultative (maximum 50), sans doublon ; la migration copie chaque ancien rattachement avant de retirer le champ unique. Une référence inactive reste conservable sur une fiche déjà liée mais ne peut être ajoutée. Le fil trace les libellés des marchés ajoutés / retirés.

`settings_crm` appartient à Paramètres : singleton `code = crm` immuable et unique, `default_view` (kanban / list / last, obligatoire), created / updated. Lecture CRM ou administration des référentiels, mise à jour avec settings.references ; création et suppression par API utilisateur interdites. Vue initiale globale, URL explicite prioritaire. Avec `last` (Dernier état), la préférence locale Kanban / Liste par utilisateur et navigateur (`horizon.crm.view.[userId]`) est reprise ; sans préférence, Kanban est utilisé. Avec `kanban` / `list`, le réglage fixe est appliqué à chaque ouverture sans vue explicite dans l’URL. La dernière bascule reste mémorisée dans tous les cas ; Calendrier AO ne la remplace pas. Migration additive `1791504009_crm_last_view.js` : ajout du choix `last`, valeurs existantes conservées, rollback vers Kanban pour les réglages `last`. Paramètres CRM possède ses onglets Présentation / Étapes / Types de marché ; Référentiels ne présente que les données transversales. Migration additive `1791331200_crm_settings.js`, sans modification des opportunités ni des numéros hors migration des rattachements de marché.


Tags utilisateurs — 7 octobre 2026 : `settings_identity_tags` appartient à Paramètres. Sept enregistrements fixes : admin, superuser, user, viewer (profils ERP), direction, manager, collaborator (responsabilités). Champs : code unique immuable, label immuable, sort_order immuable, active=true immuable, tone (palette partagée), color (vide ou #RRGGBB), created / updated. Aucun ajout, suppression ni archivage par API. Lecture pour les comptes core_users actifs avec rôle actif ; écriture réservée aux profils admin / superuser possédant settings.references, validation serveur et audit transactionnel. Les couleurs ne modifient ni les permissions ni la hiérarchie. Valeurs initiales : admin/direction navy, superuser/manager violet, user/viewer/collaborator blue. Migration additive `1791331206_identity_tag_colors.js`.


Devis S03 : migration `1791504004_quote_column_actions.js` ajoutant la largeur `is_option` (52 px) au JSON settings_sales, conservant les largeurs existantes et relevant uniquement les colonnes # / Actions trop étroites (52 / 64 px minimum). Pas de modification de valorisation ou du modèle de lignes : le drag and drop change leur position ordonnée ; la colonne Option édite is_option existant.

Devis S04 : `sales_quote_lines.margin_percent` (taux sur coût avant remise), `price_source` manual / margin. En mode margin, PUV = coût × (1 + taux / 100), arrondi au centime côté Pricing ; en mode manual, taux dérivé du PUV / coût (coût nul : taux 0, saisie de marge indisponible). TVA de brouillon : `sales_quotes.tax_rate`, `sales_quote_lines.tax_rate` / `tax_amount`, taux explicite 0–100, nouveau devis initialisé via `settings_sales.default_tax_rate` (20 % CVS). TaxService serveur valorise chaque article après remise, exclut les options du total fiscal, conserve les valeurs historiques à la migration ; anciens devis à tax_rate 0 jusqu’à édition explicite. Aucun nouveau workflow de validation ou de facturation. Migration `1791504005_quote_margin_tax.js`.

Devis S05 : kind ajoute subsection3 pour titre niveau 3, via migration `1791504006_quote_heading_level3.js`. Sous-totaux jusqu’au titre de niveau égal / supérieur. TVA des brouillons exclusivement déterminée par settings_sales.default_tax_rate ; taux et montants snapshotés à chaque sauvegarde, sans modification automatique des documents historiques. Pas de taux éditable dans la fiche. Le repli des titres et les largeurs ajustées sont des préférences de présentation, sans suppression de données.

Devis longs : core_audit.metadata accepte 2 Mio pour conserver les lignes avant / après (maximum 200 lignes de 2000 caractères plus données de pricing). Avant / après de la fiche restent séparés ; aucune ouverture des API Rules. Cette borne remplace 10 Ko, insuffisante pour un devis long. Migration S05.

Devis S09 : `sales_quotes.discount_mode` percent / amount (percent pour les anciens devis), `discount` valeur saisie (0–100 si percent, montant HT en devise du devis si amount, au plus le HT avant remise). Remise nette allouée au centime comme S07. `terms_id`, `terms_label`, `terms_content` snapshots des CGV choisies ; seule la clé est fournie par le client, libellé / contenu fournis par Paramètres côté serveur et conservés si le choix reste identique. `settings_sales.terms` JSON (max. 30 entrées `{id, label, content, active}`, identifiant technique stable, label 120 / contenu texte 20 000 caractères, aucun HTML), réservé aux administrateurs de paramètres. Aucune CGV juridique inventée à l’amorçage.
`inventory_units` devient le référentiel central des unités : code unique immuable, label, active, sort_order et champs réservés category / ratio_to_base / rounding. Valeurs de base u / h / j / m ; unités historiques de devis conservées au démarrage. Administration dans Paramètres / Référentiels, lecture Sales et Paramètres ; aucun second catalogue d’unités spécifique aux devis. `sales_quote_lines.unit` conserve le code snapshot, validation contre unité active (ancienne valeur inchangée conservable). Aucune conversion implicite introduite. Migration additive `1791504008_quote_terms_units.js` sans réécriture des totaux historiques.

Devis S10 : is_option existant est aussi conservé sur les titres. Pricing applique une section optionnelle à ses descendants jusqu’au titre de niveau égal ou supérieur, y compris les titres imbriqués. Les articles concernés sont hors HT / TVA / coûts / marge et revenu CRM principaux ; total Options HT distinct. Aucun champ ni migration supplémentaires ; aucune modification rétroactive des devis sauvegardés. Remise globale : les champs montant / pourcentage sont deux représentations liées, le dernier champ saisi détermine discount_mode existant.
