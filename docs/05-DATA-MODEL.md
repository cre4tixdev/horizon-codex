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
- `core_users` : auth email / mot de passe, `name`, `first_name`, `last_name`, `public_email`, relation obligatoire `role`, `active`, `avatar` protégé, `mail_from`, dates automatiques. `employee` sera ajouté par migration lorsque `hr_employees` sera disponible ; aucun faux identifiant d'employé n'est stocké.
- Inscription publique interdite ; gestion des comptes et rôles réservée au superuser technique dans ce premier socle. Les écrans d'administration Horizon attendent leur service serveur et leur audit.
- Lecture limitée à son propre compte et son propre rôle, avec compte et rôle actifs. Aucun utilisateur ne peut modifier son rôle ni ses permissions par REST.
- Aucun compte, mot de passe ni rôle privilégié n'est créé par la migration. Le premier compte applicatif sera provisionné explicitement après validation du déploiement.
- La collection standard `users` existante est conservée ; sa création publique est verrouillée par une migration dédiée. Ses enregistrements et autres règles restent préservés.

L'utilisateur a créé ces collections via le dashboard de préproduction. Leur schéma a été relu par API ; les écarts et la réconciliation nécessaire des migrations sont suivis dans `06-SECURITY-OPS.md`. La migration a été adaptée pour adopter le schéma existant après vérification, sans réécrire les collections ni leurs enregistrements. Elle accepte la sémantique de sélection unique (`maxSelect` 0 ou 1), conserve les identifiants existants et s'arrête sur un schéma incompatible. Sur base neuve elle crée le socle. Le rollback automatique est refusé, même à vide, pour préserver les collections adoptées. Ce socle ne constitue pas encore la livraison des collections métier ni du lien employés / utilisateurs.

---

## Organisation

### `core_teams`

```text
code
name
type
manager
active
```

Types initiaux possibles :

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

### `core_team_members`

```text
team
user
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
external_company
start_date
end_date
status
work_calendar
resource_profile
user
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
user → core_users
```

Contraintes :

```text
user UNIQUE lorsqu’il est renseigné
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
fiscal_identifier
preferred_language
preferred_currency
default_currency
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
prospect
supplier
partner
other
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
line1
line2
postal_code
city
country
state_region
```

Le logo de la société peut être utilisé visuellement comme badge sur l’avatar du contact.

### Contrat exécutable Contacts V1

Les quatre collections sont de type Base et possèdent `created` / `updated` automatiques. Aucun effacement applicatif : sociétés et personnes utilisent `active`, les rôles sont désactivés et les adresses restent conservées. Les sociétés archivées restent accessibles aux lecteurs autorisés.

- Société : `name` obligatoire (160), `legal_name` (200), `vat_number` / `fiscal_identifier` (80), langues (12), devises optionnelles sur trois lettres majuscules, site HTTP(S), téléphone (40), email optionnel valide, notes texte brut (10000). Logo unique et galerie jusqu'à dix fichiers, JPEG / PNG / WebP, 2 Mio chacun, protégés.
- Rôle : société obligatoire sans cascade, select unique `customer / prospect / supplier / partner / other`, `active`. Index unique `(company, role)` : réactiver un rôle existant plutôt que dupliquer.
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

## AO — extension d’une opportunité CRM

### `crm_tenders`

Extension 1:1 d’une opportunité de type `tender`.

Module propriétaire :

```text
crm
```

Champs :

```text
opportunity
reference
status
order
publication_date
submission_deadline
visit_required
is_archived
archived_at
```

Relations :

```text
opportunity → crm_opportunities
status → crm_tender_statuses
tags → crm_tender_tags
```

Contrainte :

```text
opportunity UNIQUE
```

Les informations déjà portées par `crm_opportunities` ne sont pas dupliquées :

```text
client / société
contact
responsable
description
valeur estimée
```

Elles sont lues depuis l’opportunité liée.

Suppression :

- possible uniquement selon les règles CRM ;
- archivage préféré pour les dossiers historiques.

Audit :

- création AO ;
- changement statut AO ;
- modification échéance ;
- archivage ;
- restauration ;
- résultat.

### `crm_tender_statuses`

```text
label
color
order
is_closed
outcome
active
```

`outcome` :

```text
none
won
lost
cancelled
```

### `crm_tender_visits`

```text
tender
date
location
notes
status
```

Une collection dédiée permet plusieurs visites sans stocker un tableau JSON de dates.

### `crm_tender_tags`

```text
label
color
active
```

### `crm_tender_timeline_events`

```text
tender
type
date
label
description
created_by
```

Timeline métier lisible.

Distincte de `core_audit`.

### Création transactionnelle

La création d’un AO depuis Horizon doit créer :

```text
crm_opportunities
+
crm_tenders
```

dans une même opération métier côté serveur.

L’utilisateur manipule un seul objet fonctionnel : **l’opportunité AO**.

---

# 12. Ventes

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
active
```

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
