# Horizon — Decisions & Roadmap

Le [suivi global de réalisation](#suivi-global-de-réalisation) centralise l'avancement, les dépendances, les vérifications et les prochains travaux.

## Statuts

```text
PROPOSED
ACCEPTED
IMPLEMENTED
SUPERSEDED
```

---

# Décisions

## H-001 — PocketBase

Status : `ACCEPTED`

PocketBase est le backend principal.

---

## H-002 — SQLite

Status : `ACCEPTED`

SQLite via PocketBase est la base principale.

---

## H-003 — React / TypeScript / Vite

Status : `ACCEPTED`

Frontend SPA.

---

## H-004 — Monolithe modulaire

Status : `ACCEPTED`

Pas de microservices en V1.

---

## H-005 — Repositories

Status : `ACCEPTED`

Pas de `pb.collection(...)` dans les composants React.

---

## H-006 — Tiptap

Status : `ACCEPTED`

Éditeur WYSIWYG des documents et e-mails.

---

## H-007 — Gotenberg

Status : `ACCEPTED`

Génération PDF côté serveur.

---

## H-008 — MailProvider

Status : `ACCEPTED`

Microsoft Graph et SMTP derrière une abstraction.

---

## H-009 — Chat via PocketBase Realtime

Status : `ACCEPTED`

Pas de serveur realtime supplémentaire.

---

## H-010 — AO intégré au CRM

Status : `ACCEPTED`

`cvs-aoboard` sert d’inspiration fonctionnelle.

AO n’est pas un module racine autonome.

Une opportunité CRM peut être de type :

```text
direct
tender
```

Les fonctions AO spécialisées appartiennent au module `crm`, sous-domaine `tenders`.

---

## H-011 — Documentation canonique

Status : `ACCEPTED`

Les documents `00` à `10` constituent les sources de vérité.

Pas de document par feature par défaut.

---

## H-012 — Microsoft Graph comme provider e-mail principal

Status : `ACCEPTED`

Les boîtes CVS sont hébergées sur Microsoft 365 / Exchange Online.

Horizon utilise **Microsoft Graph** comme provider e-mail principal.

SMTP reste disponible uniquement comme fallback technique.

Cette décision ne préjuge pas encore du mode d’authentification Entra ID final :

```text
delegated
ou
application
```

---

## H-013 — Sage reste la comptabilité officielle en Phase 1

Status : `ACCEPTED`

Au lancement de Horizon, Sage reste la source de vérité comptable.

Horizon prépare et transmet les données / écritures comptables via `SageAccountingProvider`.

La synchronisation doit être traçable et idempotente.

---

## H-014 — Comptabilité interne Horizon prévue dès le Data Model

Status : `ACCEPTED`

Même si Sage reste officiel en Phase 1, le modèle de données Horizon prévoit dès maintenant :

- plan comptable ;
- journaux ;
- exercices ;
- périodes ;
- écritures ;
- lignes débit / crédit ;
- auxiliaires ;
- TVA ;
- banque ;
- lettrage ;
- rapprochement ;
- analytique ;
- clôtures ;
- FEC.

Objectif : permettre une montée en puissance progressive sans refondre Facturation.

---

## H-015 — AccountingProvider

Status : `ACCEPTED`

Les modules métier utilisent :

```text
AccountingProvider
```

Implémentations prévues :

```text
SageAccountingProvider
HorizonAccountingProvider
```

---

## H-016 — SUPER PDP pour la facturation électronique

Status : `ACCEPTED`

SUPER PDP est la plateforme agréée sélectionnée pour l’émission et la réception des factures électroniques Horizon.

L’intégration passe par :

```text
EInvoiceProvider
↓
SuperPdpProvider
```

La logique métier ne dépend pas directement de l’API SUPER PDP.

---

## H-017 — Bascule comptable progressive

Status : `ACCEPTED`

Trajectoire :

```text
Phase 1
Sage officiel
Horizon pré-comptabilité

Phase 2
Sage officiel
Horizon comptabilité en shadow

Phase 3
Horizon comptabilité principale
```

Le passage en Phase 3 nécessite validation fonctionnelle, comptable et technique.

---


## H-018 — Compte analytique créé avec l’opportunité CRM

Status : `ACCEPTED`

Chaque opportunité CRM possède un code métier qui devient son compte analytique de référence.

Exemple :

```text
11450
```

Les devis associés utilisent cette racine :

```text
11450-1
11450-2
11450-3
```

Les commandes, projets, temps, achats, dépenses, stock consommé et facturation se rattachent au même compte analytique.

---

## H-019 — Ventilation multi-analytique des achats

Status : `ACCEPTED`

Une demande d’achat ou commande fournisseur peut couvrir plusieurs comptes analytiques.

La ventilation est portée au niveau des lignes et conservée lors des transformations de documents.

---

## H-020 — Cycle `draft` obligatoire pour les documents à valider

Status : `ACCEPTED`

Les documents métier qui nécessitent une validation commencent en brouillon.

Exemples :

```text
devis
commande client
demande d’achat
commande fournisseur
facture
avoir
```

La validation est une transition serveur explicite.

---

## H-021 — Catalogue produits enrichi

Status : `ACCEPTED`

Le catalogue Horizon gère :

- catégories ;
- services ;
- équipements ;
- consommables ;
- stock policies ;
- réapprovisionnement ;
- suivi série / lot ;
- images ;
- plusieurs fournisseurs ;
- fournisseur privilégié ;
- historique prix ;
- produits composés.

---

## H-022 — Approvisionnement depuis Ventes

Status : `ACCEPTED`

Un devis ou une commande client peut générer des besoins d’achat.

Le processus passe par une demande d’achat contrôlée avant commande fournisseur.

Le moteur tient compte du stock, des composants, du réapprovisionnement, des fournisseurs et du compte analytique.

---

## H-023 — Imports Odoo et Excel idempotents

Status : `ACCEPTED`

Les migrations / imports utilisent un pipeline commun :

```text
normalisation
→ matching
→ dry run
→ conflits
→ validation
→ import
```

Les identifiants externes empêchent la recréation des mêmes données.

---

## H-024 — Activity Feed transverse

Status : `ACCEPTED`

Les principales fiches Horizon disposent d’un fil métier commun :

- changements ;
- notes ;
- messages ;
- mentions ;
- tâches.

Ce fil reste distinct de `core_audit`.

---

## H-025 — Planning inspiré de CVS OnSite

Status : `ACCEPTED`

`cre4tixdev/cvs-onsite-backend` sert de référence fonctionnelle pour le planning ressources.

Horizon conserve notamment :

- vue semaine ;
- collaborateurs internes / externes ;
- jour / nuit ;
- codes affaires ;
- Atelier / IDF / Déplacement ;
- multi-affectations ;
- copie semaine.

Horizon ajoute BE / Production, heures prévues et comparaison au TimeReport réel.

---

## H-026 — Fil d’Ariane standardisé

Status : `ACCEPTED`

Les pages métier utilisent `HBreadcrumb`.

Exemple :

```text
CRM > Opportunités > #11450 — TF1
```

Les chemins longs compactent les niveaux intermédiaires.

---


## H-027 — Pilotage économique standardisé

Status : `ACCEPTED`

Horizon utilise les niveaux :

```text
prévu
engagé
réalisé
facturé
payé
```

pour le pilotage des affaires.

La marge est consolidée au niveau du compte analytique.

---

## H-028 — Pricing centralisé

Status : `ACCEPTED`

Les prix, coûts, remises, taxes, devises et listes tarifaires passent par une logique métier centralisée.

Le calcul de marge ne doit pas être recodé dans chaque écran.

---

## H-029 — Validation simple par permissions

Status : `SUPERSEDED`

Le moteur d’approbation par seuils n’est plus retenu.

Décision actuelle :

```text
draft
→ utilisateur possédant le droit de validation
→ validated / confirmed / posted
```

Aucun seuil automatique par montant, marge ou remise.


---

## H-030 — Historique des révisions de devis

Status : `ACCEPTED`

Une modification d’un devis déjà envoyé crée une nouvelle révision.

L’historique des versions finalisées reste accessible.

---

## H-031 — Stock physique / réservé / disponible

Status : `ACCEPTED`

Le stock distingue au minimum :

```text
physique
réservé
disponible
attendu
```

et supporte lots, séries, retours, RMA et inventaires.

---

## H-032 — Baseline projet

Status : `ACCEPTED`

Un projet conserve son budget initial et ses révisions.

Le budget initial ne peut pas être écrasé par une simple modification.

---

## H-033 — Organisation par équipes

Status : `ACCEPTED`

Horizon gère équipes / services et les utilise pour droits, validations, capacité et reporting.

---

## H-034 — Recherche globale

Status : `ACCEPTED`

Horizon possède une recherche globale transverse basée sur les droits utilisateur.

Aucun moteur de recherche externe n’est requis en V1.

---

## H-035 — Notifications centralisées

Status : `ACCEPTED`

Les notifications in-app sont centralisées.

L’e-mail est un canal optionnel selon le type d’événement et les préférences.

---

## H-036 — Multi-devise native

Status : `ACCEPTED`

Les documents peuvent utiliser plusieurs devises.

Le taux appliqué à un document validé est conservé comme snapshot.

---

## H-037 — International / fiscalité extensible

Status : `ACCEPTED`

Le modèle prévoit pays, langues, Incoterms, identifiants fiscaux et règles TVA contextualisées.

Les règles précises sont paramétrables et validées avec la comptabilité CVS.

---

## H-038 — Archivage configurable

Status : `ACCEPTED`

Les politiques d’archivage et de conservation sont configurables par type d’objet.

Les durées exactes restent à valider selon les obligations applicables.

---


## H-039 — Plusieurs devis acceptés par opportunité

Status : `ACCEPTED`

Une opportunité peut contenir plusieurs devis validés et plusieurs devis acceptés.

Chaque devis accepté peut générer une ou plusieurs commandes.

L’acceptation d’un devis ne ferme pas l’opportunité aux devis complémentaires.

---

## H-040 — Plusieurs commandes peuvent alimenter un projet

Status : `ACCEPTED`

Un projet peut agréger plusieurs commandes client issues de la même opportunité.

Une opportunité peut également posséder plusieurs projets lorsque le découpage opérationnel le nécessite.

Le compte analytique reste commun par défaut.

---

## H-041 — Parcours Projet par phases

Status : `ACCEPTED`

Le statut projet reste simple.

Le déroulement opérationnel utilise des phases configurables :

```text
Kick-off
BE
Approvisionnement
Production
Livraison
Installation
Commissioning
Recette
Réserves
Handover
```

---

## H-042 — Recette / réserves dans Projets

Status : `ACCEPTED`

PV, FAT, SAT, recette et levée des réserves appartiennent au module Projets.

Les réserves sont des objets suivis avec responsable, échéance et statut.

---

## H-043 — Clôtures opérationnelle et financière séparées

Status : `ACCEPTED`

Un projet peut être opérationnellement clos tout en restant financièrement ouvert.

Les deux clôtures possèdent des droits et critères distincts.

---

## H-044 — Parc installé client

Status : `ACCEPTED`

Horizon maintient le parc d’équipements installés chez les clients.

Les équipements sérialisés réutilisent les numéros de série du module Stock.

Le parc installé conserve l’origine projet / livraison et les garanties.

---

## H-045 — Module SAV

Status : `ACCEPTED`

Le module SAV couvre :

- tickets ;
- maintenance ;
- interventions ;
- garantie ;
- techniciens ;
- heures ;
- pièces ;
- historique équipement.

Les temps utilisent TimeReport et les pièces utilisent Stock.

---

## H-046 — RFQ fournisseurs hors périmètre

Status : `ACCEPTED`

Aucun workflow de consultation multi-fournisseurs / RFQ n’est prévu actuellement.

Le flux Achat reste :

```text
DA
→ sélection fournisseur
→ commande fournisseur
```

---


## H-047 — Employés distincts des utilisateurs

Status : `ACCEPTED`

Le référentiel des ressources humaines est distinct des comptes Horizon.

```text
hr_employees
→ toutes les ressources

core_users
→ comptes pouvant se connecter
```

Une ressource peut ne pas avoir de compte.

---

## H-048 — Types de ressources

Status : `ACCEPTED`

Types initiaux :

```text
employee
freelance
interim
external
```

Les ressources externes peuvent être planifiées et valorisées sans accès Horizon.

---

## H-049 — Paramètres cadrés comme module fonctionnel

Status : `ACCEPTED`

Le module Paramètres couvre explicitement :

- général ;
- utilisateurs / organisation ;
- numérotation ;
- ventes ;
- achats ;
- produits / stock ;
- projets ;
- planning / temps ;
- finance / TVA ;
- documents ;
- SAV ;
- notifications ;
- imports ;
- intégrations ;
- API externe ;
- archivage ;
- audit / système.

---

## H-050 — Numérotation configurable

Status : `ACCEPTED`

Les préfixes, suffixes, patterns, padding et resets sont configurables.

Les tokens sont contrôlés par Horizon.

Les anciens numéros ne sont jamais recalculés.

---

## H-051 — TVA datée et contextualisée

Status : `ACCEPTED`

Les codes TVA sont datés.

La TVA appliquée dépend du contexte via `TaxService`.

Un taux déjà utilisé n’est pas modifié rétroactivement.

---

## H-052 — API externe Horizon dédiée

Status : `ACCEPTED`

Les systèmes tiers accèdent à Horizon via une API dédiée.

Aucun accès direct générique à PocketBase n’est exposé.

---

## H-053 — Permissions API jusqu’aux champs

Status : `ACCEPTED`

Chaque client API possède des allowlists :

```text
resource
action
read_fields
write_fields
data_scope
```

Un champ non explicitement autorisé n’est jamais exposé.

---

## H-054 — Clients API distincts des utilisateurs

Status : `ACCEPTED`

Un client API est une identité technique.

Il ne doit pas être créé comme faux utilisateur Horizon.

Les clés sont hashées, révocables, expirables et auditables.

---


## H-055 — Génération des clés API par Horizon

Status : `ACCEPTED`

Les clés API sont générées par Horizon côté serveur.

La clé brute :

- utilise un générateur cryptographiquement sûr ;
- est affichée une seule fois ;
- n’est jamais stockée en clair.

Horizon conserve uniquement :

```text
préfixe
hash
derniers caractères
création
expiration
dernière utilisation
statut
```

En cas de perte, une nouvelle clé est générée via rotation.

---


## Readiness développement

Status : `READY TO START`

Le socle fonctionnel et architectural est suffisamment défini pour démarrer l’implémentation.

Les éléments suivants peuvent rester ouverts pendant la Phase 1 mais doivent être figés avant les modules concernés :

```text
avant Ventes / Achats / Facturation
→ représentation monétaire exacte
→ conventions finales de numérotation
→ règles TVA CVS détaillées
→ seuils / approbateurs

avant SSO Microsoft
→ delegated vs application / stratégie Entra ID

avant Comptabilité Horizon
→ règles comptables détaillées
→ clôtures
→ FEC
→ rapprochement / banque

avant mise en production API externe
→ politique de rotation
→ rate limits par défaut
→ éventuelle restriction IP
```

Ces points ne bloquent pas :

```text
Foundation
Contacts
Paramètres
Employés
Catalogue
CRM
Documents
Messagerie
Imports
```



## H-056 — BCE source unique des taux de change

Status : `ACCEPTED`

Horizon utilise la BCE / ECB comme source V1 unique de taux.

Les taux quotidiens sont historisés localement.

---

## H-057 — Snapshot du taux par document

Status : `ACCEPTED`

Chaque document en devise possède son propre snapshot au moment de sa validation / confirmation.

Le taux n’est jamais recalculé rétroactivement.

---

## H-058 — Taux fiscal distinct mais BCE également

Status : `ACCEPTED`

Horizon distingue :

```text
exchange_rate
tax_exchange_rate
```

Les deux utilisent la BCE comme source.

Ils peuvent diverger uniquement si leur date d’application diffère.

---

## H-059 — Arrondi document à 2 décimales

Status : `ACCEPTED`

Les totaux documentaires sont arrondis à 2 décimales.

Les prix unitaires et calculs intermédiaires conservent une précision supérieure afin d’éviter les écarts de calcul.

---

## H-060 — Auth Horizon par défaut + Microsoft optionnel

Status : `ACCEPTED`

L’authentification native Horizon est disponible par défaut.

Microsoft OAuth2 / Entra peut être activé en complément.

Les permissions restent gérées par Horizon.

---

## H-061 — Numéro métier distinct de l’identifiant technique

Status : `ACCEPTED`

Toutes les relations utilisent l’identifiant technique PocketBase.

Les numéros métier sont configurables et ne servent jamais de clé relationnelle.

---

## H-062 — Historique des anciennes références

Status : `ACCEPTED`

Les anciennes références métier sont conservées dans un historique transverse.

Elles restent recherchables.

Leur affichage est configurable et visuellement secondaire.

---

## H-063 — TVA CVS 20 % par défaut

Status : `ACCEPTED`

La TVA par défaut CVS est 20 %.

Le Data Model et `TaxService` restent capables de traiter les autres taux et cas généraux France / UE / export / exonérations.

---

## H-064 — Pas de moteur d’approbation par seuils

Status : `ACCEPTED`

Aucun moteur de seuils / approbateurs automatiques n’est prévu.

La validation repose sur les permissions Horizon.



## H-065 — Identité graphique Horizon

Status : `ACCEPTED`

Palette officielle :

```text
#091C3A
#F52F96
#FF5AAE
#7B3FC7
#A56BEA
#F4F5F7
#7B8794
#FFFFFF
```

Gradient signature :

```text
#F52F96 → #7B3FC7
```

Typographies :

```text
Montserrat SemiBold
Inter Regular / Medium
```

---

## H-066 — UI dense desktop-first

Status : `ACCEPTED`

Horizon privilégie une forte densité d’information maîtrisée.

Les composants doivent permettre de voir davantage d’informations qu’une application SaaS grand public standard.

---

## H-067 — Usage contrôlé de la couleur

Status : `ACCEPTED`

Les couleurs de marque sont présentes mais limitées aux actions, états actifs et visualisations utiles.

Les écrans métier restent majoritairement neutres.

---

## H-068 — Contrôles de formulaire discrets

Status : `ACCEPTED`

Select, combobox et inputs utilisent des bordures légères, sans ombre permanente et sans suraccentuation visuelle.

---

## H-069 — Layout Devis de référence

Status : `ACCEPTED`

La table Devis utilise la largeur maximale disponible.

Les totaux sont placés sous la table.

Les informations secondaires apparaissent ensuite.

Une grande sidebar de totaux réduisant la table n’est pas le pattern de référence.

---

## H-070 — Maquettes UI de référence

Status : `ACCEPTED`

Les fichiers suivants servent de direction visuelle initiale :

```text
docs/assets/horizon-ui-reference-dashboard.png
docs/assets/horizon-ui-reference-crm.png
docs/assets/horizon-ui-reference-quote.png
```

Ils donnent la direction générale sans constituer une spécification pixel-perfect.


# Décisions ouvertes

À figer ultérieurement :

```text
SSO Microsoft ou auth locale
formats métier initiaux de numérotation (configurables dans Paramètres)
règles TVA CVS détaillées
valeurs des coûts analytiques horaires
règles exactes de proposition de création / découpage des projets
provider futur de signature électronique
durées d’archivage / conservation
multi-société éventuel
```

---

# Roadmap

## Phase 1 — Fondation

```text
repository
PocketBase
auth
layout
navigation
Design System
permissions
audit
```

## Phase 2 — Référentiel

```text
Contacts
Catalogue produits
Catégories
Fournisseurs produits
Imports Odoo / Excel
Paramètres
Documents
Messagerie
Calendrier
Activity Feed
```

## Phase 3 — Commercial

```text
CRM
├── Opportunités directes
├── Opportunités AO
└── comptes analytiques

Ventes
├── brouillons / validation
└── génération besoins d’achat

PDF
E-mail
```

## Phase 4 — Opérations

```text
Achats
├── demandes d’achat
├── multi-analytique
└── commandes fournisseurs

Stock
├── produits composés
├── réappro
├── séries / lots
└── mouvements analytiques

Projets
├── phases / jalons
├── planning
├── livraisons
├── recette / PV
├── réserves
└── clôture opérationnelle

Parc installé
SAV
├── tickets
├── interventions
├── garanties
└── maintenance

Planning ressources
```

## Phase 5 — Ressources / RH interne

```text
Employés
├── salariés
├── freelances
├── intérimaires
└── externes

Planning ressources
TimeReport
├── BE
├── Production
└── SAV / Maintenance

Congés
Dépenses
```

## Phase 6 — Finance

```text
Facturation
├── factures / avoirs
└── facturation électronique SUPER PDP

Pré-comptabilité
└── SageAccountingProvider

Comptabilité Horizon
└── activation progressive / shadow mode
```

## Phase 7 — Consolidation

```text
Dashboard
reporting
automatisations
optimisations
```

---

# Méthode de décision

Pour toute décision structurante :

```text
Contexte
Options
Décision
Motif
Conséquences
Date
```

Pas besoin d’un ADR pour chaque détail mineur.

---

# Suivi global de réalisation

## État de référence — 4 octobre 2026

Ce suivi couvre l'ensemble de la roadmap Horizon. Les spécifications détaillées restent dans les documents canoniques ; les lignes ci-dessous représentent des lots de livraison, à découper en tâches lors de leur démarrage.

| Élément | État constaté | Source / limite |
|---|---|---|
| Documentation et charte | Présentes dans le workspace | Documents `00` à `10`, `AGENTS.md` et références dans `docs/assets/` |
| Application Horizon | Socle et layout livrés | React / TypeScript / Vite, routage, Query, sidebar réductible, pictogramme officiel, breadcrumb, recherche des espaces et premiers composants partagés ; login natif et connexion réelle confirmée par l’utilisateur ; URL de préproduction configurée localement ; modules métier restants |
| Instance PocketBase | Accessible ; authentification technique vérifiée | API : `http://172.30.10.10:50190` ; administration : `/_/` ; conteneur `horizon-pocketbase` dans Synology Container Manager |
| Environnement de cette instance | Préproduction | Qualification précisée par l'utilisateur après la préparation locale |
| Collections et API Rules PocketBase | Socle créé manuellement et relu par API | `core_roles` Base et `core_users` Auth, règles de lecture et auth conformes ; écarts ponctuels à corriger dans le dashboard |
| Version, volumes, hooks et migrations PocketBase | Partiellement identifiés | UI 0.40.4 ; montage déclaré `/volume1/docker/horizon/pocketbase:/pb_data:rw` ; image exacte, commande, fichiers serveur et sauvegardes externes à vérifier |
| Tests et build Horizon | Vérifications locales réussies | Lint, typecheck, 26 tests Vitest, build ; 10 tests backend et 10 parcours Chromium ; données de test uniquement dans PocketBase local éphémère ; aucun changement Synology |
| Déploiement Horizon | Non démarré | CI, Docker applicatif, PREPROD et release à réaliser |

L'installation et l'accès PocketBase sont vérifiés. Ils ne valident pas encore le schéma ni les permissions Horizon. L'utilisateur a créé les comptes administrateurs ; l'agent a uniquement effectué des authentifications et lectures API, sans modifier la configuration ni les données métier.

### Inventaire PocketBase en lecture seule

Inspection réalisée le **4 octobre 2026**, avec un compte technique superuser autorisé par l'utilisateur. Aucun mot de passe, jeton de session ou export brut de paramètres n'est conservé dans la documentation.

| Contrôle | Résultat vérifié | Conséquence / suite |
|---|---|---|
| Disponibilité | `GET /api/health` : HTTP 200 | Instance joignable depuis l'environnement de travail autorisé |
| Authentification technique | `POST /api/collections/_superusers/auth-with-password` réussi | Accès à l'inventaire administratif ; compte réservé aux opérations techniques |
| Collections système | `_mfas`, `_otps`, `_externalAuths`, `_authOrigins`, `_superusers` | Collections internes PocketBase ; aucune adaptation effectuée |
| Collection applicative standard | `users`, type auth ; champs standards, `name` et `avatar` | Ne correspond pas encore au contrat Horizon `core_users` ; adaptation à préparer via migrations |
| Règles `users` | LIST / VIEW / UPDATE / DELETE : `id = @request.auth.id` ; CREATE : chaîne vide | Accès limité au propre enregistrement pour les règles citées ; inscription publique actuellement autorisée par CREATE ; politique Horizon à préparer et tester |
| Règles `_superusers` | LIST / VIEW / CREATE / UPDATE / DELETE : `null` | Endpoints administratifs réservés aux superusers ; aucun accès superuser dans le frontend Horizon |
| Paramètres généraux | `appName = Acme`, `appURL = http://localhost:8090`, `senderName = Support` | Valeurs par défaut à adapter ultérieurement, après autorisation |
| Services | SMTP, stockage S3 et limitation de débit désactivés | Configuration future à planifier selon les besoins et les règles d'exploitation |
| Sauvegardes PocketBase | Cron vide ; destination S3 des sauvegardes désactivée ; santé authentifiée : `canBackup = true` | Aucun planning de sauvegarde automatique PocketBase configuré ; sauvegardes externes / Synology et restauration non vérifiées |
| Schéma métier Horizon | Aucune collection métier Horizon dans les 6 collections retournées | Préparer les migrations du socle ; absence de collections ne prouve pas l'absence de fichiers de hooks ou migrations |

Les règles ci-dessus ont été lues dans le schéma ; leurs comportements n'ont pas fait l'objet de tests avec des comptes utilisateurs ou anonymes. Aucun enregistrement utilisateur ni donnée métier n'a été consulté. La version exacte, les volumes persistants, les fichiers serveur, les sauvegardes existantes et la procédure de déploiement restent à examiner avant de clôturer F01.

## Règles de tenue du suivi

Les statuts de réalisation sont distincts des statuts de décision `ACCEPTED` / `SUPERSEDED` : une décision acceptée n'est pas une fonctionnalité terminée.

| Statut | Signification |
|---|---|
| À faire | Travail non commencé |
| En cours | Travail démarré ; indiquer le prochain résultat attendu |
| Bloqué | Dépendance empêchant de poursuivre le lot ; identifier la condition de reprise |
| À vérifier | Implémentation disponible, vérifications ou recette encore nécessaires |
| Terminé | Critères de livraison satisfaits et preuves de vérification référencées |

Après chaque lot ou changement significatif :

1. mettre à jour son statut et la date du suivi ;
2. renseigner les tâches restantes et les éventuels obstacles dans les travaux actifs ;
3. référencer les fichiers, migrations, tests et résultats qui justifient sa clôture ;
4. recalculer les compteurs par phase et le total ;
5. ajouter une entrée au journal et préciser la prochaine action.

Un lot terminé n'est rouvert que si ses critères ne sont plus satisfaits. Une évolution de périmètre crée ou ajuste un lot explicitement, avec une entrée au journal. Le responsable et l'échéance sont renseignés au démarrage ; aucune date de livraison n'est engagée dans l'état initial.

## Tableau de bord global

Dernière mise à jour : **5 octobre 2026**.

| Phase | Lots | Terminés | En cours | À vérifier | Bloqués | À faire |
|---|---:|---:|---:|---:|---:|---:|
| 1 — Fondation | 8 | 2 | 2 | 3 | 0 | 1 |
| 2 — Référentiel | 10 | 0 | 1 | 1 | 0 | 8 |
| 3 — Commercial | 5 | 0 | 0 | 0 | 0 | 5 |
| 4 — Opérations | 8 | 0 | 0 | 0 | 0 | 8 |
| 5 — Ressources / RH interne | 4 | 0 | 0 | 0 | 0 | 4 |
| 6 — Finance | 6 | 0 | 0 | 0 | 0 | 6 |
| 7 — Consolidation | 5 | 0 | 0 | 0 | 0 | 5 |
| **Total** | **46** | **2** | **3** | **4** | **0** | **37** |

**Progression de livraison : 2 / 46 lots terminés (4,3 %).** Calcul : lots terminés / lots du périmètre suivi. Cet indicateur mesure les lots livrés, sans pondérer leur taille ; il ne représente ni une estimation de charge ni le temps restant. La documentation existante est un acquis de cadrage, hors de ce compteur d'implémentation.

La roadmap reste organisée en sept phases. Certains prérequis transverses doivent être livrés plus tôt que leur module complet : ressources RH avant planning, calculs monétaires / TVA / change avant validation de documents financiers. La phase d'un lot indique son rattachement, sans interdire de livrer un prérequis en amont.

## Registre complet des lots

### Phase 1 — Fondation

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| F01 | Inventaire de PocketBase existant | Identification de l'environnement et accès technique approprié | Version, schéma, règles, hooks, migrations et sauvegardes recensés ; stratégie d'intégration définie | En cours |
| F02 | Initialisation frontend et architecture | Stack et architecture canoniques | React / TypeScript strict / Vite / pnpm, modules, scripts lint / typecheck / tests / build fonctionnels | Terminé |
| F03 | Configuration et accès aux données | F01, F02 | Configuration par environnement, adapter PocketBase et pattern service / repository ; erreurs et realtime centralisés | À vérifier |
| F04 | Migrations et socle de données | F01 | Migrations versionnées, reconstruction sur base neuve et compatibilité avec l'existant vérifiées sans modification manuelle de production | À vérifier |
| F05 | Authentification et permissions | F03, F04 | Login natif, comptes désactivés refusés, rôles et API Rules testés avec accès autorisés et refusés | À vérifier |
| F06 | Layout et Design System | F02, charte V13 | Sidebar, logo, navigation, HBreadcrumb et composants denses réutilisables vérifiés visuellement | Terminé |
| F07 | Audit et logs | F04, F05 | Actions sensibles auditées, erreurs compréhensibles et logs techniques sans secrets | En cours |
| F08 | CI et environnement reproductible | F02–F07 | CI lint / typecheck / tests / build, configuration Docker adaptée à l'instance existante et parcours de connexion vérifiés | À faire |

### Phase 2 — Référentiel

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| R01 | Contacts : sociétés et personnes | Fondation | Fiches, rôles, adresses, logo société et avatar contact ; CRUD autorisé et archivage vérifiés | À vérifier |
| R02 | Paramètres et organisation | Fondation | Référentiels, équipes, politiques et administration protégée ; constantes métier paramétrables centralisées | En cours |
| R03 | Catalogue produits | R01, R02 | Catégories, unités, images, kind, stock / replenishment policies, tracking et composition distincts ; cycles interdits | À faire |
| R04 | Fournisseurs et tarifs produits | R03 | Plusieurs fournisseurs, références, devises, conditionnements, validité et historique des prix préservés | À faire |
| R05 | Imports Excel / Odoo | R01–R04 | Parsing, normalisation, matching, dry run, conflits et apply explicite ; rejeu sans doublons via références externes | À faire |
| R06 | Documents et templates | Fondation | Tiptap JSON, versions de modèles, fichiers protégés, liens métier et archivage documentaire | À faire |
| R07 | Messagerie e-mail | Fondation, configuration Microsoft | Messaging Service / MailProvider, Graph principal et SMTP de secours, From serveur, outbox et erreurs suivies | À faire |
| R08 | Chat interne | Fondation | Conversations, membres, messages, pièces jointes, lecture et non-lus via REST / realtime ; non-membres refusés | À faire |
| R09 | Calendrier | Fondation | Vues et agrégation des dates métier avec respect de la propriété et des permissions des objets sources | À faire |
| R10 | Activity Feed, tâches et mentions | Fondation | core_activity_events distinct de l'audit, notes explicites, tâches, mentions et notifications sans élévation de droits | À faire |

### Phase 3 — Commercial

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| C01 | CRM direct et analytique | R01, R02, socle accounting | Opportunité et compte analytique créés de manière cohérente ; activités et code affaire commun | À faire |
| C02 | CRM / Appels d'offres | C01, R06, R09 | Extension AO transactionnelle, Kanban / drag & drop, liste, planning, visites multiples, tags, documents et archivage realtime | À faire |
| C03 | Devis, pricing et marge | C01, R03, R04, A01, A02 | Brouillons, calculs serveur, validation par permissions, snapshots et révisions ; plusieurs devis acceptés par opportunité | À faire |
| C04 | Commandes client | C03 | Conversion totale ou partielle, reliquats et plusieurs commandes sur le même compte analytique | À faire |
| C05 | PDF et envoi commercial | C03, R06, R07 | Tiptap → HTML → Gotenberg → PDF, versions envoyées figées, envoi autorisé et parcours commercial testé | À faire |

### Phase 4 — Opérations

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| O01 | Approvisionnement et demandes d'achat | C03, C04, R03, R04 | Besoins sourcés, lignes, quantités, composants, fournisseur proposé et ventilation ; demande contrôlable en draft | À faire |
| O02 | Commandes et réceptions fournisseurs | O01, A01, A02 | Validation serveur, allocations multi-analytiques, réceptions partielles et reliquats ; pas de RFQ | À faire |
| O03 | Stock réel et livraisons | R03, O02 | Mouvements audités, physique / réservé / disponible / attendu, réservations, livraisons et coûts analytiques cohérents | À faire |
| O04 | Lots, séries, retours et inventaires | O03 | Traçabilité, RMA, quarantaine, inventaires et corrections par mouvements ; historique préservé | À faire |
| O05 | Projets et pilotage | C04, R10 | Agrégation de commandes, phases, jalons, tâches, baseline immuable et révisions de budget | À faire |
| O06 | Recette, réserves et clôtures | O05, R06 | PV / FAT / SAT, réserves suivies, dérogation autorisée et clôtures opérationnelle / financière distinctes | À faire |
| O07 | Parc installé et garanties | O04–O06 | Assets liés aux séries stock, origine projet / commande / livraison / analytique et garanties conservées | À faire |
| O08 | SAV et maintenance | O07, H01, H02, H03, O03, C03, A03 | Tickets, interventions, récurrences, compte-rendu ; temps, pièces et facturation via services existants ; corrections tracées | À faire |

### Phase 5 — Ressources / RH interne

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| H01 | Employés, capacité et coûts | Fondation, R02 | Salariés / freelances / intérimaires / externes sans compte obligatoire ; calendriers, compétences et coûts datés protégés | À faire |
| H02 | Planning ressources | H01, C01, O05 pour liens projet, H04 pour absences | Semaine, internes / externes, jour / nuit, multi-codes, ATE / IDF / DEP, BE / Production, copie et surcharge visible | À faire |
| H03 | TimeReport | H01, H02 | Temps réel distinct du prévu, validation serveur, coûts historiques et comparaison prévu / réalisé par analytique | À faire |
| H04 | Congés et dépenses | H01, R06, C01 pour analytique | Demandes / validations, soldes, absences reliées au planning, justificatifs et dépenses analytiques | À faire |

### Phase 6 — Finance

Le périmètre global conserve la trajectoire comptable entière. A05 est une étape future conditionnée à validation ; sa présence ne signifie pas qu'une bascule depuis Sage est autorisée au lancement. Les identifiants ci-dessous servent au suivi. Le socle de référentiels comptables d'A04 est préparé en amont lorsqu'il est requis par C01 ou A01.

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| A01 | Montants, TVA et devises | R02, contrat de données | Calcul déterministe serveur, précision intermédiaire, arrondis, TaxService, BCE quotidienne et snapshots commerciaux / fiscaux | À faire |
| A02 | Numérotation et anciennes références | Fondation, R02 | Séquences atomiques, tokens contrôlés, patterns futurs, IDs techniques stables et anciennes références recherchables | À faire |
| A03 | Facturation et règlements | C04, O02, A01, A02, R06 | Factures / avoirs clients et fournisseurs, draft / validation, échéanciers, paiements, PDF et historique immuable | À faire |
| A04 | Pré-comptabilité et Sage | A03 pour exports, environnement Sage | Référentiels comptables, Accounting Service / Provider, mappings, écritures préparées, exports suivis, retries et rejeu sans duplication ; Sage officiel | À faire |
| A05 | Comptabilité Horizon progressive | A04, validation comptable dédiée | Modèle complet, shadow accounting comparé à Sage puis bascule explicitement validée ; équilibre, périodes, lettrage, rapprochement, clôtures et FEC testés | À faire |
| A06 | E-invoicing SUPER PDP | A03, configuration provider | Émission et réception, webhooks vérifiés, statuts corrélés, retries et idempotence ; intégration factures clients et fournisseurs testée | À faire |

### Phase 7 — Consolidation

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| X01 | Dashboard et reporting économique | Modules sources, analytique | Prévu / engagé / réalisé / facturé / payé, marges et indicateurs cohérents ; droits sur coûts respectés | À faire |
| X02 | Recherche globale | Modules exposés, F05, A02 | Recherche multi-domaines et anciennes références, filtrage effectif avant réponse, aucun objet interdit révélé | À faire |
| X03 | Notifications et automatisations | R10, événements des modules | NotificationService central, préférences / canaux, échéances et jobs observables sans moteur d'approbation par seuils | À faire |
| X04 | API externe | Services métier concernés, F05, F07 | Routes dédiées, clients techniques, allowlists, clés serveur hashées / affichées une fois, rotation, révocation et limites testées | À faire |
| X05 | Archivage, exploitation et release | Lots concernés et environnement de livraison | Politiques de conservation, purge distincte, sauvegarde externe / restauration testée, HTTPS production, PREPROD, E2E, déploiement et rollback vérifiés | À faire |

## Critères communs de clôture

Chaque lot doit apporter des preuves adaptées à son périmètre avant de passer à `Terminé` :

- comportement métier conforme aux spécifications et architecture modulaire respectée ;
- migrations présentes et testées si le schéma change ;
- permissions vérifiées côté serveur, y compris les tentatives non autorisées ;
- tests unitaires / services / Playwright adaptés, lint, typecheck et build réussis pour les changements applicatifs ;
- UX conforme au Design System, états de chargement / vide / erreur traités ;
- invariants, historique, snapshots et idempotence vérifiés lorsqu'ils s'appliquent ;
- documentation canonique mise à jour et limites restantes explicites.

La recette métier est documentée pour les parcours concernés. Une livraison significative passe par PREPROD conformément à `09-TESTING-RELEASE.md`. Les vérifications sans objet pour un lot sont marquées comme telles, avec motif.

## Points à clarifier et dépendances externes

| ID | Point | Lot concerné / moment requis | État |
|---|---|---|---|
| Q01 | Nature de l'instance PocketBase fournie | Avant toute modification de cette instance | Confirmée : développement, hébergé via Synology Container Manager |
| Q02 | Version, état existant, accès aux hooks / migrations, sauvegardes et procédure de déploiement PocketBase | F01 / F04 ; examiner avant d'écrire | Schéma et paramètres lus ; UI 0.40.4 identifiée, montage de données déclaré ; image exacte, commande, fichiers et restauration restent à vérifier |
| Q03 | Versions des dépendances et compatibilité avec PocketBase | F02 / F03 | SDK 0.28.1 et PocketBase officiel 0.40.4 vérifiés localement ; confirmation de la commande et recette Synology restantes |
| Q04 | Représentation monétaire exacte et conventions d'arrondi | Avant C03 / O02 / A03 | Précision et snapshots décidés ; implémentation déterministe à choisir |
| Q05 | Formats métier initiaux de numérotation et règles TVA CVS détaillées | A01 / A02 | Configurations à préciser ; TVA par défaut 20 % déjà décidée |
| Q06 | Microsoft Graph : permissions, boîtes et mode delegated / application | R07 | À définir ; distinct de l'authentification native Horizon déjà décidée |
| Q07 | Accès Gotenberg et configuration des modèles CVS | R06 / C05 | À préparer |
| Q08 | Édition de Sage, capacités API / export et mappings | A04 | À préciser |
| Q09 | Accès de test SUPER PDP, contrat API / webhooks et exigences réglementaires à jour | A06 | À vérifier avant intégration et releases concernées |
| Q10 | Coûts horaires, règles de découpage projet et durées de conservation | H01 / O05 / X05 | À définir avec les responsables métier |
| Q11 | Rotation des clés API et limites par défaut | Avant mise en production X04 | À préciser |
| Q12 | Critères et autorisation de bascule comptable | Avant achèvement A05 | Validation future dédiée ; Sage reste officiel au lancement |
| Q13 | Cohérence documentaire : mentions anciennes de seuils / ApprovalService / pending approval et choix exclusif SSO ou auth locale | Avant implémentation des domaines concernés | À harmoniser ; appliquer H-060 et H-064 déjà acceptées |

Ces points ne bloquent pas tous les travaux : la préparation du frontend et du Design System peut avancer pendant les vérifications restantes de Q02. Aucun secret ou identifiant d'administration n'est consigné dans ce suivi. Toute nouvelle action doit être confirmée au préalable par l'utilisateur, selon sa demande ; une autorisation d'inventaire ne vaut pas autorisation de modifier PocketBase.

## Options et éléments hors périmètre initial

| Élément | Traitement |
|---|---|
| Microsoft OAuth2 / Entra pour le login | Option décidée par H-060 ; à planifier si activation demandée, sans bloquer le login natif |
| Signature électronique via provider | Décision future ; suivi dans les décisions ouvertes avant création d'un lot |
| Multi-société | Décision future ; aucun ajout implicite au périmètre |
| RFQ / consultation multi-fournisseurs | Hors périmètre selon H-046 |
| Moteur d'approbation par seuils | Exclu selon H-064 ; validation par permissions |

## Travaux actifs et prochaine livraison

**Prochaine recette : valider les fiches Contacts / Référentiels avec l’utilisateur. La recherche d’entreprises utilise désormais l’API publique de l’État directement depuis le navigateur ; aucun raccordement Pappers ou déploiement NAS supplémentaire pour cette fonction.**

| Lot | Responsable | Échéance | Prochaine action | Résultat / obstacle actuel |
|---|---|---|---|---|
| F01 | Agent de développement | Non fixée | Vérifier digest de l’image, historique des migrations et restauration de sauvegarde | Préproduction, projet Synology, chemins / flags et hook auth confirmés ; restauration non vérifiée |
| F02 | Agent de développement | Livré le 2026-10-04 | Lot clôturé ; préparer la suite après confirmation utilisateur | Socle modulaire, scripts et contrôles opérationnels ; preuves dans le journal |
| F06 | Agent de développement | Livré le 2026-10-04 | Lot clôturé ; étendre les composants au besoin des modules | Sidebar, pictogramme officiel, navigation, breadcrumb, recherche des espaces et composants communs vérifiés ; pages métier temporaires À venir |
| F03 | Agent de développement | Non fixée | Poursuivre le realtime avec les repositories métier | Client partagé auth / Contacts, erreurs sans objets SDK, URL raccordée et cache purgé à déconnexion |
| F04 | Agent de développement | Non fixée | Installer la migration d’évolution Contacts / Référentiels selon 06 et vérifier l’historique NAS | Reconstruction, reprise des codes / devises et refus de conflits testés localement ; archive prête |
| F05 | Agent de développement | Non fixée | Recetter les permissions Contacts sur préproduction après installation | Login, déconnexion / reconnexion, rechargement et révocation du compte de test confirmés par l’utilisateur ; comptes créés par lui dans le dashboard |
| R01 | Agent de développement | Non fixée | Installer et recetter les nouvelles fiches, adresses / personnes associées et permissions sur NAS | V1 installée ; évolution frontend / backend locale testée, recherche publique directe validée ; compteurs des futurs modules restant à raccorder |
| R02 | Agent de développement | Non fixée | Installer les référentiels, attribuer la permission administrateur et recetter ; organisation / autres paramètres ensuite | Pays / Langues / Devises et combobox partagée livrés localement ; tests des permissions et codes immuables réussis |
| F07 | Agent de développement | Non fixée | Étendre / recetter le socle audit au-delà des changements Contacts | Writer transactionnel et collection verrouillée préparés comme prérequis Contacts |

Ce tableau expose la file de travail immédiate. F01 reste `En cours` ; F02 et F06 sont `Terminé`. F03 / F04 / F05 sont `À vérifier` après préparation locale autorisée et tests : déploiement / recette Synology et realtime des futurs repositories restent à compléter. R01 est `À vérifier` après livraison locale Contacts et F07 `En cours` pour son prérequis audit ; les autres lots restent `À faire`. Les phases suivantes seront détaillées progressivement avec leurs tâches, responsables et échéances. Les autorisations de F02 / F06 ne valent pas autorisation de modifier PocketBase ou de démarrer un nouveau lot.

## Journal d'avancement et preuves

| Date | Lots | Événement / résultat | Vérifications / référence | Suite |
|---|---|---|---|---|
| 2026-10-04 | Cadrage | Analyse d'AGENTS.md et des références principales ; workspace documentaire constaté | Documents canoniques et assets locaux ; aucune vérification applicative disponible | Préparer le suivi avant implémentation |
| 2026-10-04 | F01 | Installation PocketBase déclarée par l'utilisateur à `http://172.30.10.10:50190` | Déclaration utilisateur ; instance non inspectée | Clarifier Q01 et inventorier Q02 |
| 2026-10-04 | Suivi global | Mise en place du registre de 46 lots sur 7 phases | Suivi intégré à ce document canonique ; aucun lot applicatif clôturé | Commencer la fondation après cette préparation |
| 2026-10-04 | F01 | Environnement de développement confirmé ; compte technique authentifié ; inventaire API réalisé sans modification métier ou de configuration | Santé HTTP 200 ; authentification réussie ; `GET /api/collections` : 6 collections ; `GET /api/settings` : paramètres par défaut, services et planning de sauvegarde décrits ci-dessus | Compléter version, volumes, fichiers serveur et sauvegardes après confirmation utilisateur |
| 2026-10-04 | Suivi global | Inventaire consigné après autorisation ; F01 passe à En cours ; compteurs actualisés : 0 terminé, 1 en cours, 45 à faire | Contrôle documentaire des 46 lots et des totaux ; tests applicatifs non exécutés, changement documentaire uniquement | Faire confirmer la prochaine action avant exécution |
| 2026-10-04 | F02 | Initialisation frontend autorisée et livrée : React / TypeScript strict / Vite / pnpm, structure modulaire, routage, Query, styles de base, configuration publique et fichiers ignorés | `package.json`, `pnpm-lock.yaml`, `src/`, configurations Vite / ESLint / Playwright ; `pnpm check` réussi (10 tests unitaires et build), `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/horizon-playwright pnpm test:e2e` réussi (2 tests) ; aucun SDK, identifiant admin ou appel PocketBase dans le frontend | Confirmer le prochain lot : compléter F01 ou construire F06 |
| 2026-10-04 | Suivi global | F02 clôturé ; 1 terminé, 1 en cours, 44 à faire ; progression des lots 2,2 % | Documentation de démarrage, versions, architecture et commandes intégrée aux documents 00 / 02 / 03 / 09 | Nouvelle action soumise à confirmation utilisateur |
| 2026-10-04 | F06 | Layout autorisé et livré : sidebar réductible, marque officielle issue de la charte, topbar, recherche des espaces, HBreadcrumb, dashboard avec états vides et composants partagés | `pnpm check` réussi : 13 tests unitaires, lint, types, build ; E2E Chromium : 7 tests réussis ; captures desktop / mobile inspectées ; aucun appel ni changement PocketBase | Faire confirmer la suite ; compléter F01 avant migrations et raccordement |
| 2026-10-04 | Suivi global | F06 clôturé ; 2 terminés, 1 en cours, 43 à faire ; progression des lots 4,3 % | Documentation 00 / 02 / 03 / 07 / 09 actualisée ; aucune fonctionnalité métier ou recherche globale de données déclarée terminée | Proposer l'authentification et le socle de permissions après inventaire serveur complet |

Pour les prochaines entrées, préciser le résultat concret et les commandes / résultats de vérification, les chemins de fichiers ou références de PR lorsque disponibles. Un test non exécuté est indiqué comme tel.

### Préparation locale de l'authentification — 4 octobre 2026

Suite autorisée par l'utilisateur : inventaire complémentaire et préparation locale de connexion / permissions ; les écritures sur Synology restent soumises à son accord avant application.

- L'asset public du dashboard indique `v0.40.4` ; l'utilisateur déclare le conteneur `horizon-pocketbase` et le montage `/volume1/docker/horizon/pocketbase:/pb_data:rw`. L'image exacte et la commande serveur ne sont pas encore vérifiées.
- Deux migrations préparées : `1791072000_core_auth.js` (`core_roles`, `core_users`) et `1791072001_lock_default_registration.js` (verrouillage de la création publique `users`, conservation des données). Hook `core-auth.pb.js` : validation serveur des noms de permissions.
- Connexion `/login`, mémoire seule, guard, retour à la page demandée, session révalidée, déconnexion et cache purgé. SDK 0.28.1, Zod 4.6.5, React Hook Form 7.89.0 ajoutés dans la stack prévue. Écrans chargés à la demande pour limiter le bundle initial.
- Tests : lint / TypeScript / build ; 26 tests Vitest ; 10 tests sur un vrai PocketBase 0.40.4 éphémère ; 7 parcours layout et 3 parcours auth Chromium. Captures `/private/tmp/horizon-login-desktop.png` et `horizon-login-mobile.png` inspectées.
- Documentation canonique 00 / 02 / 03 / 05 / 06 / 07 / 09 / 10 actualisée. Procédure Synology, montages et limites dans `06-SECURITY-OPS.md`.
- Suivi : 2 lots terminés, 1 en cours, 3 à vérifier, 40 à faire. Les lots préparés ne sont pas déclarés livrés sur le NAS. Aucun changement de configuration ni de schéma à distance n'a été effectué.

Prochaine action à confirmer : installation assistée du socle sur le Synology après contrôle de sa commande / de ses fichiers et sauvegarde vérifiée, puis création explicite d'un compte Horizon et recette sur l'instance.


### Raccordement à la préproduction — 4 octobre 2026

- L'utilisateur précise que l'instance est une préproduction et choisit explicitement la configuration via le dashboard. Il déclare sauvegarde téléchargée, collections, règles, rôle et compte créés. L'agent n'a effectué aucune modification distante.
- Contrôle API : Auth `core_users` confirmé, règles List / View et authRule conformes, écritures verrouillées, compte et rôle actifs. Permissions du rôle encore `null`, relation rôle non obligatoire / maxSelect 0, avatar maxSelect 0, pattern du nom du rôle vide, création publique `users` encore ouverte, durée de token à 432000 secondes. Corrections guidées à faire selon `06-SECURITY-OPS.md`.
- `.env.local` créé depuis `.env.example` : URL publique uniquement, fichier ignoré par Git ; frontend raccordé. Aucun mot de passe applicatif demandé ou configuré côté frontend.
- La configuration UI ne prouve pas l'application des migrations ni l'installation du hook. Réconciliation non destructive des identifiants / schéma et tests de reconstruction / adoption restent nécessaires pour F04 ; ne pas appliquer la migration de création directement sur les collections présentes.
- F01 reste En cours, F03 / F04 / F05 restent À vérifier ; compteurs inchangés. Prochaine étape : corriger les écarts dans le dashboard, puis laisser l'utilisateur tester sa connexion réelle.


### Revérification du socle de préproduction après corrections

- Lecture API autorisée : permissions du rôle `[]`, rôle obligatoire et actif, pattern conforme, inscription standard verrouillée, token 3600 secondes. Règles de lecture / authentification et verrouillage des écritures confirmés. Les deux collections Horizon retournent zéro enregistrement en lecture anonyme.
- Rectification : les `maxSelect = 0` observés pour rôle / avatar représentent bien une valeur unique dans PocketBase 0.40.4, avec limite effective 1 ; ce n'est pas une correction supplémentaire à demander. Référence technique et état actualisé dans `06-SECURITY-OPS.md`.
- Configuration du socle relue ; login réel par l'utilisateur, tests négatifs avec son compte, hook et réconciliation des migrations encore attendus. Statuts et compteurs inchangés ; aucune écriture distante de l'agent.


### Connexion réelle confirmée — 4 octobre 2026

- L'utilisateur confirme une connexion Horizon réussie avec son compte applicatif, après la revérification des réglages. L'agent n'a pas utilisé le mot de passe de ce compte.
- Le frontend est raccordé et le login natif est validé par cette recette utilisateur. Les contrôles de schéma / lectures anonymes ont été effectués par API ; les autres tests de permissions de préproduction ne sont pas déclarés exécutés.
- F03 / F04 / F05 restent À vérifier : adoption du schéma manuel dans des migrations reproductibles, installation du hook, recette négative avec compte dédié et vérification du renouvellement / de la déconnexion sur cette instance. F01 reste En cours (configuration conteneur / sauvegarde restaurable à examiner). Compteurs inchangés : 2 terminés, 1 en cours, 3 à vérifier, 40 à faire.
- Prochaine étape proposée : terminer la réconciliation locale des migrations et installer le hook avec l'utilisateur, puis développer Contacts. Nouvelle étape à faire confirmer conformément à sa demande.
- Documents 06 / 09 / 10 mis à jour ; aucun changement de code ou de données distantes dans cette mise à jour.


### Adoption des collections manuelles préparée et testée

- Après accord utilisateur, la migration locale du socle a été adaptée : reconstruction sur base neuve ou contrôle / adoption sans réécriture du schéma et des données existants. Identifiants générés par le dashboard conservés, sélections uniques 0 / 1 reconnues, refus sur dérive ou installation partielle, rollback protecteur.
- Fixture du schéma réel sans secrets ajoutée ; 13 tests backend, 26 tests Vitest, lint / typecheck / build et 3 parcours auth Chromium réussis. Aucun changement distant de schéma ou de compte par l'agent.
- Image confirmée par l'utilisateur : `ghcr.io/muchobien/pocketbase:latest`. Commande copiée : `/usr/local/bin/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data --publicDir=/pb_public --hooksDir=/pb_hooks` (le retour à la ligne de terminal sur `/pb_public` est interprété comme affichage).
- Archive de transfert des deux migrations et du hook préparée et vérifiée : `/private/tmp/horizon-pocketbase-socle.zip`. Procédure 06 actualisée ; sauvegarde post-création de compte, inspection / conservation des fichiers existants, montages et flags à installer avec l'utilisateur. Hook non déployé, migrations non déclarées appliquées sur le NAS.
- Statuts / compteurs inchangés : F01 En cours, F03 / F04 / F05 À vérifier. Prochaine étape autorisée : guider le transfert et la configuration du conteneur, vérifier l'application et le hook, puis compléter la recette des permissions sur préproduction.

### Redémarrage Synology et contrôle API

- Fichiers transférés et YAML du projet `horizon` modifié par l'utilisateur ; journal de démarrage fourni à 22:30:13 le 4 octobre 2026. Configuration des montages et flags consignée dans le document 06.
- Contrôle API après redémarrage : santé 200, identifiants conservés, un compte / un rôle actifs, permissions `[]`, règles et token conformes, inscription et écritures applicatives verrouillées, lectures anonymes vides. Aucune écriture distante de l'agent.
- Chargement effectif du hook et historique des migrations encore à confirmer ; aucun lot supplémentaire clôturé. Compteurs inchangés : 2 terminés, 1 en cours, 3 à vérifier, 40 à faire.

### Hook de permissions confirmé sur préproduction

- Sorties terminal fournies par l'utilisateur : trois fichiers attendus présents, chemins et flags effectifs confirmés dans `/proc/1/cmdline`.
- Recette utilisateur : création d'un rôle de test avec `permissions = ["*"]` refusée avec le message de validation du hook. Chargement du hook et rejet serveur des permissions wildcard confirmés ; aucune écriture distante de l'agent.
- Suivi 06 actualisé. Historique des migrations, déconnexion / reconnexion, renouvellement, désactivation d'un compte dédié et restauration de sauvegarde restent à vérifier ; statuts et compteurs inchangés.

### Déconnexion et reconnexion confirmées sur préproduction

- L'utilisateur confirme le retour au login après déconnexion Horizon, puis l'accès au dashboard après reconnexion avec son compte habituel. Preuve de recette utilisateur, sans utilisation de son mot de passe par l'agent.
- Suivi 06 actualisé ; restent notamment le renouvellement / refus après désactivation avec un compte dédié, la vérification de l'historique des migrations et la restauration d'une sauvegarde. Statuts et compteurs inchangés.

### Désactivation d'un compte dédiée à la recette

- L'utilisateur confirme la connexion initiale du compte de test, sa déconnexion automatique après désactivation et le refus de reconnexion. Révocation du compte vérifiée sur préproduction.
- Retour UX : le rechargement manuel déconnecte aussi le compte actif habituel. Le code et le document 06 confirment le stockage uniquement en mémoire. Une persistance limitée à l'onglet avec validation serveur au démarrage est proposée, à valider par l'utilisateur avant implémentation.
- Statuts et compteurs inchangés ; historique des migrations, renouvellement positif et restauration de sauvegarde restent à vérifier.

### Session conservée après actualisation — modification autorisée

- Accord utilisateur explicite : remplacement de la session uniquement en mémoire par un token stocké dans `sessionStorage`, limité à l'onglet. Aucun mot de passe ni profil utilisateur stocké ; `localStorage` et cookies ne sont pas utilisés.
- Le démarrage attend la validation serveur et la validation du compte / rôle avant affichage des pages protégées. Refus ou échec de restauration : retour au login avec erreur compréhensible et suppression du token ; déconnexion : token et cache purgés.
- `pnpm check` réussi : lint, TypeScript, 30 tests Vitest et build. Cinq parcours auth Chromium réussis sur PocketBase local éphémère : rechargement, attente de validation, refus serveur, purge et nouvel onglet indépendant ; sept parcours layout Chromium réussis. Aucun changement sur le schéma ou les comptes du NAS.
- Documents 06 / 09 actualisés ; recette du rechargement avec le compte utilisateur sur préproduction encore à confirmer. Statuts et compteurs inchangés.

### Rechargement confirmé et première publication Git

- L'utilisateur confirme que sa connexion est conservée après actualisation avec la nouvelle gestion de session. Recette utilisateur réussie sur le frontend raccordé à la préproduction.
- Publication du workspace demandée explicitement vers `https://github.com/cre4tixdev/horizon-codex.git`. Dépôt distant sans références lors du contrôle ; initialisation locale sur `main`. Le premier commit `17743ec` publié sur `main` inclut le code, la documentation canonique, les assets de référence, les migrations / hook et les tests.
- `.env.local`, données PocketBase, dépendances, build et traces de tests exclus par `.gitignore`. Les vérifications précédentes restent applicables ; cette étape ne modifie pas le code applicatif ni la préproduction.


### Contacts V1 — livraison locale autorisée

- Accord utilisateur explicite pour démarrer Contacts. Module complet en couches UI / hooks / schemas / service / repository / types / routes ; listes serveur et fiches sociétés / personnes, rôles multiples, adresses, logos / galerie / avatars protégés, archivage / réactivation.
- Migration `1791072002_contacts.js`, hook `contacts.pb.js` et writer partagé `lib/audit.js` prêts. Audit transactionnel constitue le prérequis de F07 ; ce lot global n'est pas déclaré terminé. Client PocketBase partagé par URL avec auth ; aucune élévation de privilège ni appel SDK depuis UI.
- TanStack Table 8.21.3 ajouté dans la stack prévue pour HDataTable. Lint / types / 37 tests Vitest / build, 20 tests backend, 8 parcours auth + Contacts et 7 parcours layout réussis. Captures inspectées ; archive de déploiement préparée. Realtime, Activity Feed, documents et historique intermodules ne sont pas simulés.
- Aucun changement de schéma ou de données sur le NAS par l'agent, aucune publication automatique de ce nouveau lot sur GitHub. Prochaine action : installation guidée / permissions et recette de préproduction selon 06. R01 À vérifier, F07 En cours ; total 2 terminés, 2 en cours, 4 à vérifier, 38 à faire ; progression livrée 4,3 %.


### Contacts installé et reprise planifiée

- L'utilisateur confirme sauvegarde / archive, dépôt des fichiers, redémarrage et présence de `contacts_companies`, `contacts_company_roles`, `contacts_people`, `contacts_addresses`, `core_audit`. Journal à 23:20 sans erreur visible ; rechargement des fichiers de hooks observé.
- Attribution guidée des permissions Contacts au rôle de développement puis reconnexion : onglets Sociétés / Personnes et bouton Nouvelle société confirmés par l'utilisateur. Aucun changement direct des données / règles du NAS par l'agent.
- R01 reste À vérifier : recette sur NAS des créations / modifications, rôles / adresses, fichiers protégés, archive / réactivation, audit et rôles restreints à compléter. F07 reste En cours. Compteurs inchangés : 2 terminés, 2 en cours, 4 à vérifier, 38 à faire.
- L'utilisateur demande commit et push du module vers le dépôt existant puis arrêt du travail pour reprise le lendemain. Point de reprise : recette Contacts sur préproduction, avant ouverture d'un autre module. Les contrôles locaux déjà réussis restent applicables ; aucune nouvelle modification de code depuis leur exécution.

### Reprise sur un autre Mac — 5 octobre 2026

- Dépôt cloné sur `main` au commit `826f750`. Environnement préparé avec Node 24.7.0, pnpm 12.9.1, dépendances du lockfile et Chromium Playwright. `.env.local` créé depuis `.env.example`, ignoré par Git ; endpoint de santé du NAS accessible (HTTP 200).
- PocketBase 0.40.4 installé dans `node_modules/.bin` pour les bases temporaires de test. `pnpm check`, 20 tests backend et 15 parcours Chromium (7 layout, 8 auth / Contacts) réussis sur ce Mac.
- Frontend démarré sur `http://127.0.0.1:5173/`. Recette Contacts sur NAS toujours à compléter ; aucun changement des données ou du schéma du NAS. Statuts des lots inchangés.

### Consolidation des retours Contacts — 5 octobre 2026

- Demande utilisateur consolidée dans 04 (parcours et recette), 05 (contrat cible / migration), 06 (permissions), 07 (fiche visuelle) et 08 (Pappers). Cette étape est documentaire ; aucun changement applicatif, schéma ou NAS.
- Ordre de réalisation : socle R02 pays / langues / devises et combobox partagée ; évolution R01 (devise unique, SIREN / SIRET, adresse principale, logo en haut et aperçu, fiches visuelles et personnes associées) ; enrichissement Pappers ; raccordement progressif des compteurs aux modules CRM / Ventes / Facturation / Livraison.
- Réutiliser `accounting_currencies` pour éviter un deuxième catalogue. Migration de devise sans perte et résolution explicite des conflits ; toute évolution sur NAS suit sauvegarde et installation guidée.
- Pappers dépend de la configuration serveur et du compte API. Les compteurs dépendent des modules propriétaires ; ne pas simuler leurs données. Le logo est déjà limité à un fichier en V1, mais la zone d’aperçu / placement doit évoluer.
- R01 reste À vérifier, R02 À faire ; aucun lot clôturé par ce cadrage. Prochaine réalisation : référentiels transverses nécessaires à Contacts.

### Livraison locale Contacts / Référentiels / Pappers — 5 octobre 2026

- Accord utilisateur pour réaliser le cadrage en tenant PocketBase à jour. Référentiels Pays / Langues / Devises livrés dans Paramètres avec combobox commune, codes stables, activation et administration `settings.references`. Réutilisation de `accounting_currencies` ; catalogue initial extensible.
- Fiches : devise unique, SIREN / SIRET, image unique avec aperçu en haut, adresse principale par type, personnes associées paginées et création pré-rattachée. Bandeau métier présent avec états « À venir », raccordement aux vrais compteurs différé aux modules propriétaires.
- Nouvelle migration `1791158400_contact_references.js` : reprise des valeurs et codes historiques, refus sur conflit de devises sans perte, suppression du doublon de devise, champs Contacts et trois catalogues. Hooks mis à jour : validation des référentiels / identifiants, audit transactionnel partagé et routes Pappers protégées. Limiteur Pappers dédié, sans activation des limites globales PocketBase.
- Pappers : recherche, aperçu et application explicite sur société enregistrée ; clé uniquement serveur, preuve temporaire, audit / provenance, gestion des doublons et restrictions de diffusion. Connexion réelle dépend de la clé API et de la recette NAS.
- Vérifications locales : lint / TypeScript / 37 tests Vitest / build ; 28 tests backend ; 11 parcours auth / Contacts / Paramètres et 7 parcours layout. Captures de fiche société et listes inspectées. Correction avec test de régression d’une requête ancienne qui pouvait masquer un contact nouvellement créé.
- Archive de transfert `/private/tmp/horizon-contacts-references.zip` et procédure d’installation dans 06. Aucun déploiement, changement de schéma / données sur NAS, commit ou push dans cette étape. R01 reste À vérifier ; R02 passe En cours (socle référentiels livré, organisation / autres paramètres restant à réaliser). Compteurs : 2 terminés, 3 en cours, 4 à vérifier, 37 à faire ; progression livrée inchangée (4,3 %).
- Point de reprise : sauvegarde NAS, vérification des conflits de devise, installation de l’archive, permission administrateur des référentiels et recette utilisateur ; configuration Pappers facultative ensuite.

### Installation NAS de l’évolution confirmée — 5 octobre 2026

- L’utilisateur confirme installation et redémarrage du NAS. Contrôles anonymes par l’agent : santé HTTP 200, nouvel endpoint `company-lookup/status` présent et protégé (HTTP 401).
- Chargement de la route confirmé ; schéma complet, permissions d’administration des référentiels et parcours utilisateur à vérifier après reconnexion. Pappers réel toujours conditionné à la configuration de la clé serveur.
- R01 À vérifier, R02 En cours ; compteurs inchangés. Prochaine action : recette frontend des combobox, identifiants / logo et personnes associées.


### Reprise de la présentation Contacts — 5 octobre 2026

- Retour utilisateur : champs sans hiérarchie, adresse peu visible et doublons de galerie. Fiches reprises en cartes par fonction avec en-tête visuel unique, actions en haut, adresse du siège disponible dès création, coordonnées regroupées, préférences séparées, notes / Pappers repliables. Personne : identité et coordonnées côte à côte sur desktop, empilées sur mobile.
- Galerie retirée de la fiche sans supprimer les fichiers historiques. Aucun changement de schéma ou hook PocketBase ; aucune nouvelle installation backend requise. Sauvegarde adresse avec contrôle des erreurs partielles et reprise sans société dupliquée.
- Documentation fonctionnelle, données, exploitation, design et recette mise à jour. R01 reste À vérifier et R02 En cours ; compteurs de roadmap inchangés.
- Vérifications réussies : lint / types / 39 tests Vitest / build et 19 parcours Chromium. Captures desktop / mobile inspectées ; recette de présentation sur le NAS à confirmer par l’utilisateur.


### Finition du répertoire et des en-têtes Contacts — 5 octobre 2026

- Demande utilisateur : ajouter vues Cartes et Liste aux sociétés / personnes, remonter les relations commerciales et les raccourcis métier, réduire la place du logo. Cartes par défaut, sélection portée par l’URL, recherche / état / tri / pagination communs, tableaux mieux espacés.
- En-tête compact avec logo / avatar de 48 px, relations commerciales au même niveau et raccourcis au-dessus des champs. La fiche personne affiche les relations de sa société et indique le périmètre société des raccourcis. Les modules non livrés restent « À venir ».
- Aucun changement de schéma / hooks / données NAS ; aucune réinstallation PocketBase. Documentation et parcours de recette adaptés. R01 reste À vérifier, R02 En cours ; compteurs inchangés.
- Vérifications réussies : lint / TypeScript / 39 tests Vitest / build et 13 parcours auth / Contacts / Paramètres Chromium. Captures desktop et mobile inspectées. Recherche par prénom + nom corrigée ; expansion des rôles société chargée sur les fiches personnes.


### Révision de charte à partir de la référence utilisateur — 5 octobre 2026

- Autorisation explicite de revoir la charte après retour sur logos tronqués et finition insuffisante. Surfaces froides, sidebar bleu profond, magenta renforcé, badges sémantiques, tableaux Contacts compacts, synthèse avec vrais totaux.
- Correction des logos : containment distinct des portraits dans fiches, cartes, listes et badge société. Navigation par vrais onglets dans les fiches ; coordonnées résumées et contenus regroupés. Saisie conservée entre onglets.
- Aucun changement de schéma / hook / NAS ; totaux via les API de lecture existantes. Documentation canonique mise à jour. R01 reste À vérifier et R02 En cours ; compteurs de roadmap inchangés.

Vérifications finales de la révision : lint / TypeScript / build et 41 tests Vitest réussis ; 14 parcours auth / Contacts / Paramètres et 7 parcours layout Chromium réussis. Captures desktop / mobile et logo horizontal inspectés. Recette utilisateur NAS à compléter ; aucune nouvelle installation PocketBase requise.

### Précision utilisateur sur les logos — 5 octobre 2026

Cadre toujours carré, logo entier et proportionnel centré sur blanc, quelle que soit la forme du fichier client. Fiches, cartes et listes harmonisées ; aucun traitement du fichier ni changement PocketBase. Test navigateur existant étendu pour vérifier dimensions carrées et fond blanc dans les trois vues.


### Combobox et organisation Paramètres — 5 octobre 2026

- Demande utilisateur : menus mieux intégrés à la charte, chevrons centrés, suppression du footer global et organisation des Paramètres à l’échelle des modules.
- Combobox partagée harmonisée, footer retiré, espace Paramètres structuré en socle commun / modules métier / connexions. Vue d’ensemble avec recherche, page référentiels dédiée et périmètres des futures rubriques explicitement signalés « Prévu ».
- Aucun changement de schéma / hook / NAS ; permissions des référentiels préservées. R02 reste En cours (structure livrée, administration métier des autres domaines restant à réaliser). Compteurs inchangés.
- Réalisation finale : menus partagés aussi pour filtres, tri, société et type d’adresse. Vérifications : lint / types / 41 tests unitaires / build, 15 parcours auth / Contacts / Paramètres et 7 parcours layout réussis ; captures inspectées.


### Top bar, recherche et compte — 5 octobre 2026

- Top bar persistante ; recherche des Contacts centralisée dans le header et contextualisée sociétés / personnes, filtre conservé via `q` lors des changements de présentation et rechargements.
- Menu utilisateur accessible sur mobile : Mon compte (consultation), Paramètres et déconnexion. Les fonctions d’édition du profil restent à réaliser.
- Aucun changement PocketBase : informations issues de la session existante, recherche via les services et API déjà autorisés. Aucune installation supplémentaire sur le NAS. R01 et R02 conservent leurs statuts, compteurs inchangés.

- Vérifications : lint / types / build et 41 tests unitaires, 8 parcours layout et 17 parcours authentifiés réussis.

- Précision utilisateur : contexte de recherche affiché en permanence dans le champ (Sociétés / Personnes / Espaces Horizon), y compris après saisie. Aucun changement PocketBase.

- Correction visuelle demandée : suppression du double contour de focus dans les recherches composées, marge intérieure du texte et harmonisation du focus des champs simples / combobox. Aucun changement de données ni de backend.

- Recherche locale par défaut avec sélecteur de contexte / recherche globale, retour automatique au contexte lors de la navigation. Vue d’ensemble Paramètres raccordée à la top bar. Le mode global recherche les espaces, pas encore les données de tous les modules métier. Aucun changement PocketBase.

- Contacts : cartes et lignes entièrement cliquables pour ouvrir la fiche, coordonnées et société associée conservant leurs actions dédiées. Liens natifs et clavier préservés. Aucun changement PocketBase.

- Demande utilisateur : retirer la flèche redondante des cartes, condenser les fiches et limiter les relations commerciales à Client / Fournisseur. Flèche retirée et densité / présentation améliorées. Cumul des deux relations et gestion des rôles historiques soumis à clarification utilisateur avant modification métier / PocketBase. Aucun rôle existant supprimé.

### Décision relations sociétés et harmonie de fiche — 5 octobre 2026

L’utilisateur confirme Client et Fournisseur cumulables, exclut les autres rôles et indique une base sans données à reprendre. Interrupteurs refusés : remplacés par deux cases à cocher dans un bloc commun intégré à l’en-tête blanc. Identité / coordonnées regroupées, grilles compactes et panneaux alignés. Schéma frontend, service, hook et migration PocketBase cohérents ; migration refusant les valeurs historiques inattendues sans suppression. Archive NAS dédiée préparée ; installation restant à effectuer par l’utilisateur. Statuts et compteurs globaux inchangés.

- Correction signalée par l’utilisateur : Client / Fournisseur absents de Nouvelle société. Bloc désormais visible dès création, sélection conservée jusqu’à Enregistrer ; sauvegarde des relations et reprise des écritures partielles sans recréer la société ou les rôles déjà enregistrés. API PocketBase existantes réutilisées, aucun nouvel artefact backend requis.

- Retour utilisateur : la fiche reste dispersée et peu intégrée. Composition reprise sur une surface blanche continue, Client / Fournisseur sous le nom, sections sans encadrés imbriqués, largeur contenue et adaptation mobile. Trois parcours ciblés validés et captures création desktop / mobile inspectées. Aucun changement de schéma ou hooks PocketBase ; archive backend précédente inchangée. Compteurs globaux inchangés.

- L’utilisateur refuse la composition en surface unique et redonne la référence visuelle. Gabarit de création repris : titre et actions, logo dans l’identité, blocs compacts, adresse sur deux lignes, notes directement visibles ; gabarit de fiche enregistrée avec résumé / onglets. Ordre de saisie cohérent et adaptation mobile. Archive PocketBase inchangée ; aucun schéma ou hook supplémentaire.

Clarification utilisateur — 5 octobre 2026 : la référence Contacts concerne le style, pas une séparation de compositions création / consultation. Gabarit commun appliqué aux sociétés et personnes ; logo et relation commerciale restent au même endroit après sauvegarde. Fonctions des fiches enregistrées conservées et coordonnées sans bandeau redondant. Aucun changement PocketBase pour cette correction.

Décision utilisateur — 5 octobre 2026 : Enregistrer ne doit être coloré que lorsqu’une sauvegarde est nécessaire. Convention commune `HSaveButton` appliquée à tous les formulaires de sauvegarde actuellement implémentés (Contacts, adresses, référentiels), avec garde contre les soumissions inchangées. Logo société associé agrandi sur les avatars contacts, sans modification des fichiers ou du schéma PocketBase.

Finition Contacts — 5 octobre 2026 : remplacer les paragraphes de statut des relations et contacts associés par des indicateurs discrets, avec place réservée et annonces accessibles. Aucun changement des sauvegardes automatiques ou du backend.

Décision finale utilisateur — 5 octobre 2026 : aucun changement de champ / case / sélection ne sauvegarde automatiquement. Enregistrer est la validation explicite commune à Horizon. Édition des rôles intégrée à la sauvegarde société ; lecture seule depuis une personne ; Pappers prépare le formulaire au lieu d’écrire directement. Formulaires de référentiels et adresses déjà explicites. Anciennes mentions de sauvegarde automatique des rôles remplacées. Backend et schéma inchangés.

Décision utilisateur — 5 octobre 2026 : exiger la saisie ARCHIVER dans une fenêtre avant toute validation d’archivage. Composant partagé livré et utilisé pour les sociétés / contacts ; futurs modules réutilisent cette convention. Aucun changement du schéma ou des hooks PocketBase.


Décision utilisateur — recherche d’entreprises : remplacer Pappers par l’API publique de l’État, appelée directement depuis le navigateur pour remplir le formulaire, puis sauvegarde explicite Contacts. Aucun relais PocketBase ni déploiement NAS pour cette recherche. Consulter l’utilisateur avant d’ajouter une couche serveur ou de modifier ce parcours de sauvegarde ; ne pas élargir spontanément l’architecture.


Recherche société — ajustement UX : libellé « Recherche informations », action secondaire dans la barre supérieure près d’Enregistrer, en création et sur fiche existante. Le report revient aux Informations ; la sauvegarde reste explicite.


Actions de fiches — livraison locale du 5 octobre 2026 : menu engrenage à droite d’Enregistrer avec Dupliquer, Archiver / Réactiver, Supprimer. Confirmation saisie exacte ARCHIVER orange / SUPPRIMER rouge. Duplication comme brouillon puis Enregistrer. Migration 1791158402 et protection PocketBase des références, y compris pièces archivées et invisibles ; nettoyage atomique des adresses / rôles propres à une société inutilisée, audit conservé. Déploiement NAS restant à réaliser avec migration et hooks ensemble. Les modules Devis / Factures / Livraison ne sont pas encore livrés ; protection testée avec une collection de documents temporaire en relations simples / multiples.


Profil société / Comptabilité — livraison locale : TVA réelle proposée par API publique, gestion du choix de plusieurs numéros, EUR / Français par défaut à la création, RCS remplaçant le champ fiscal visible. Onglet Comptabilité après Relations, comptes client / fournisseur simples et préparation facturation électronique. Nouveau socle accounting_third_party_accounts dans son module propriétaire ; migration 1791158403, révision Contacts 3, sauvegarde explicite et reprise des erreurs. Les anciens identifiants fiscaux sont conservés. Aucun envoi électronique, annuaire, plan comptable complet ou compte général / auxiliaire livré. Choix de la saisie simple annoncé faute de réponse à la question métier ; distinction auxiliaire à confirmer ultérieurement. Documentation canonique mise à jour ; installation NAS encore nécessaire.


5 octobre 2026 — LEI à la place du RCS dans l’UI, à la demande de l’utilisateur. Conservation des anciennes données RCS et fiscales. L’utilisateur autorise les petites modifications PocketBase manuelles : fournir la définition exacte et garder une migration compatible pour les autres installations et la reconstruction. Aucun déploiement sur le NAS effectué par Codex.


5 octobre 2026 — cloche de notifications et recherche de logos demandées par l’utilisateur. Implémentation de la boîte de réception privée core_notifications, compteur réel et marquage lu serveur. Les futurs modules devront publier des événements et passer par NotificationService pour produire leurs alertes ; aucun déclencheur métier fictif ajouté. Recherche logos initiale Wikimedia Commons, navigateur direct, sans clé et sans modification BDD avant Enregistrer. Question facultative présentée sur une recherche web plus large avec clé : réponse non reçue à cette livraison, choix initial Wikimedia annoncé pendant le travail. Import local conservé. Lot NAS limité à la collection/hook Notifications ; aucune installation NAS faite par Codex.


5 octobre 2026 — utilisateur demande le fil complet immédiatement et insiste sur le design. Livraison sur les fiches Sociétés/Contacts : historique projeté serveur, regroupement par sauvegarde, reprise des anciens audits, commentaires, pièces jointes protégées, mentions et notifications, tâches directes ou issues d’une note, suivi d’état, filtres et pagination. Composant partagé et socle core réutilisables ; seuls Contacts et ses sous-objets actuellement implémentés sont raccordés, les futurs modules devront fournir leur policy source et leurs événements. Fil métier distinct de core_audit. Aucun HTML riche ni moteur d’approbation introduit ; commentaires en texte avec @ et documents. Titre/description des tâches publiées restent immuables, état suivi dans le fil. Archive = lecture seule, suppression = traces conservées hors accès métier. Lot NAS livré, déploiement restant à faire par l’utilisateur.


Finition du fil — commentaires en bulles et suppression de pièces jointes : retrait autorisé aux rédacteurs Contacts sur fiche active, confirmation explicite SUPPRIMER, préservation du commentaire et trace serveur. L’immutabilité des publications est conservée hors cette route ciblée ; aucun endpoint général de modification de messages ni nouvelle collection.


Décision du 6 octobre 2026 : recherche d’images gratuite Wikimedia + ouverture Google Images préremplie et collage explicite. Pas de moteur payant ou relais serveur. Réutilisation via shared/images et core/images pour logos entreprises puis images produits ; pas de nouveau module Produits fictif. Seul Enregistrer persiste le fichier sélectionné.


Retour UX recherche d’images : remplacer la juxtaposition Wikimedia/Google/collage par deux onglets et un parcours Google guidé en trois étapes. Aperçu intégré à la zone de collage, sans espace de résultats vide.

Décision de réutilisation confirmée : ImageSearch est un composant transversal, Google Images en premier et par défaut, Wikimedia conservé. Tout futur raccordement réutilise shared/images et core/images ; le module propriétaire gère le brouillon, ses permissions, ses contraintes de fichiers et la sauvegarde explicite. Le contrat et l’exemple de raccordement sont centralisés dans le document 03, la règle visuelle finale dans le document 07.

Décision utilisateur du 6 octobre 2026 — Relations devient Contacts (toutes les personnes de la société). Un onglet Adresses distinct regroupe coordonnées postales et e-mails par usage : siège / facturation / livraison / autre. Les champs e-mail société existants sont réutilisés, sans duplication ; édition en brouillon et sauvegarde unique par l’action principale de la fiche. Révision Contacts 5 et migration `1791244800_company_addresses.js` ; lot NAS préparé, installation distante restant à réaliser par l’utilisateur. Suppression d’adresses enregistrées hors périmètre ; seul le retrait d’une adresse nouvelle du brouillon est livré.

Mode clair / sombre — décision utilisateur du 6 octobre 2026 : bouton dans la top bar, thème appliqué à toutes les surfaces communes, préférence locale au navigateur et synchronisation entre onglets. Clair par défaut, marque et logos conservés ; aucune écriture PocketBase. Top bar mobile sur deux lignes pour garder recherche et actions utilisables.
