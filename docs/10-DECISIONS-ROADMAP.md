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

Précision utilisateur du 7 octobre 2026 : volet AO spécialisé au sein du CRM, avec réutilisation du socle des opportunités ; navigation à définir sans imposer un onglet. Le calendrier doit couvrir visites multiples, remise avec heure, soutenances multiples et autres jalons AO. Vue AO et calendrier général partagent composants et agrégation ; CRM possède les dates métier, sans duplication systématique dans `calendar_events`. Cadrage détaillé dans les sections Calendrier / Appels d’offres des spécifications et Calendrier de l’architecture. Le premier lot AO / projection Calendrier est implémenté localement ; C02 et R09 passent En cours pour la recette et les compléments.

---

## H-011 — Documentation canonique

Status : `ACCEPTED`

Les documents `00` à `10` constituent les sources de vérité.

Pas de document par feature par défaut.

---

## H-012 — Microsoft 365 via Graph et OAuth délégué

Status : `ACCEPTED` — choix final validé le 16 octobre 2026 après comparaison SMTP / maintenance.

Microsoft Graph OAuth délégué derrière Messaging Service / MailProvider, connexion initiale des boîtes administrée, expéditeurs et utilisateurs explicitement autorisés, jetons chiffrés côté serveur et renouvellement. Première version : boîtes personnelles avec identité /me égale à l’adresse ; boîtes partagées/alias ultérieurs. Aucun client_credentials ni rôle Exchange Application Mail.Send ; aucun conteneur/service/binaire supplémentaire, aucun nouveau SDK. SMTP intermédiaire abandonné après preuve d’absence XOAUTH2 native PocketBase 0.40.4.

Migration 0018 installée selon utilisateur conservée immuable ; 0019 ajoute stockage privé OAuth et arrête les anciens jobs sans renvoi. Contrats 04/05/06/08. Lot local à configurer et recetter sur Microsoft/NAS ; autorisation d’implémentation ne vaut pas installation ni envoi réel.

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
→ permissions de validation métier (aucun moteur de seuils)

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

12 octobre 2026 — Double authentification reportée à la demande utilisateur. Garder en tête la piste native PocketBase : mot de passe + OTP envoyé par e-mail, avec MFA et étape de saisie du code dans Horizon. SMTP et parcours de récupération à cadrer lors de la reprise. OTP seul est une connexion par code, pas une double authentification. Aucune activation ni configuration MFA / OTP effectuée ; la solution finale reste à confirmer avant développement.

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


## H-071 — Composants métier et navigation réutilisés

Status : `IMPLEMENTED` (périmètre courant)

Une fiche ouverte en popup réutilise son éditeur canonique via `RecordWorkspace`, avec les mêmes validations, droits et actions. `ProductPicker` est commun aux devis et aux achats. Les smart boutons sont exclusivement des liens vers des listes filtrées ; les créations, réservations et préparations sont des actions de fiche, hors de leur zone. Les règles de densité, de tableaux, d’onglets à pictogrammes et d’apparence sont centrales dans le document 07.

## H-072 — Pricing commercial indépendant de la valorisation du stock

Status : `IMPLEMENTED`

Le coût commercial du produit (manuel ou offre favorite) et son coefficient alimentent les nouvelles lignes de devis. Leurs snapshots ne sont pas recalculés depuis le stock. Standard, CUMP et FIFO concernent la valorisation Inventory ; changer cette méthode ne change ni coût ni PUV des devis. Le démarrage avait été décidé au standard ; la décision utilisateur du 12 octobre retient désormais **CUMP pour le stock**, tout en conservant le coût commercial du catalogue pour les devis. Le paramètre administrateur existe ; son application effective sur le NAS n’est pas confirmée. Procédure datée, motif, ouverture complète et absence de transfert en cours requis ; aucun historique réécrit. Voir le contrat V01 dans les documents 04 / 05 / 06.

## H-073 — Analyse affaire racine et commandes enfants

Status : `IMPLEMENTED` (socle ; raccordements incomplets)

L’opportunité porte le compte racine ; chaque commande dispose d’un enfant stable, ex. `00003-1`, `00003-2`. Consolidation racine + enfants sans doublon, coûts communs conservés à la racine sans répartition implicite. Analyse accessible sur l’opportunité, la commande et Finance → Analyse des affaires. Lecture opérationnelle, montants et coûts individuels sont des droits distincts avec périmètre own / all. Les heures **BE et PROD** réalisées validées doivent entrer dans l’analyse et la marge à date ; le lecteur est préparé, mais la saisie TimeReport, les heures vendues, les coûts effectifs et les frais ne sont pas encore raccordés. Une donnée absente reste indisponible.

## H-074 — Achats stock et internes sans affaire client artificielle

Status : `IMPLEMENTED` (premier périmètre)

Ventilation par ligne Affaire / Stock / Interne. Comptes fixes initiaux Stock `99101`, Interne `99201` à `99205`, catégories structurelles et identifiants relationnels stables ; numéro et libellé administrables. Une commande peut mêler plusieurs destinations. Réception physique et affectation au parc / consommation sont transactionnelles ; qualification des immobilisations séparée en Finance. Aucun amortissement ni écriture Sage automatique. Voir T01 / I01 et analytique fixe dans les documents 04 / 05 / 06.

## H-075 — Lecture du fil ciblée sur la fiche autorisée

Status : `IMPLEMENTED` (code et tests locaux ; installation NAS à confirmer)

Les nouvelles lectures Core utilisent la source réelle autorisée, des paramètres liés et des DTO en allowlist. Elles évitent le COUNT global des règles polymorphes : le journal du 12 octobre prouve des jointures sans ON et une expiration après 30 s. Les sources privées restent fermées en REST ; aucun élargissement de permissions. AO et opportunité liée sont regroupés uniquement si lisibles. Écriture et protection des fichiers conservent leur politique existante. Aucun changement de schéma pour ce correctif.

## H-076 — Livraison locale du portail et pack NAS PocketBase seulement

Status : `ACCEPTED`

Tant que le portail est développé localement, les packs remis pour le NAS contiennent uniquement `pb_hooks`, `pb_migrations` et les informations de version / vérification. Ils ne contiennent ni frontend, ni `pb_data`, ni secrets. Un commit ou un push ne vaut pas déploiement NAS. Migrations et hooks sont installés ensemble lorsqu’une évolution de contrat l’exige ; un correctif de hooks seul nécessite leur remplacement et le redémarrage. Sauvegarde et recette suivent les documents 06 / 09.

# Décisions ouvertes

À figer ultérieurement :

```text
activation éventuelle de Microsoft OAuth2 / Entra en complément du login natif
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

Après chaque intervention, y compris correctif, ajustement UX, investigation ou audit documentaire :

1. mettre à jour son statut et la date du suivi ;
2. renseigner les tâches restantes et les éventuels obstacles dans les travaux actifs ;
3. référencer les fichiers, migrations, tests et résultats qui justifient sa clôture ;
4. recalculer les compteurs par phase et le total ;
5. ajouter une courte entrée datée au journal : périmètre, résultat, vérifications effectivement réalisées / limites et prochaine action ;
6. préciser local / commit-push / pack préparé / installation NAS confirmée ou non ; ne jamais déduire le déploiement d’un push.

Les compteurs sont recalculés lorsqu’un statut change. Les décisions durables sont documentées dans leur fichier canonique, référencé depuis le suivi. Cette règle s’applique à chaque intervention et figure dans AGENTS.md ; aucune note de suivi séparée par fonctionnalité.

Un lot terminé n'est rouvert que si ses critères ne sont plus satisfaits. Une évolution de périmètre crée ou ajuste un lot explicitement, avec une entrée au journal. Le responsable et l'échéance sont renseignés au démarrage ; aucune date de livraison n'est engagée dans l'état initial.

## Tableau de bord global

Dernière mise à jour : **18 octobre 2026**. Les statuts couvrent les critères complets des lots ; « À vérifier » distingue une réalisation locale testée de sa recette d’exploitation. Le journal historique est conservé.

| Phase | Lots | Terminés | En cours | À vérifier | Bloqués | À faire |
|---|---:|---:|---:|---:|---:|---:|
| 1 — Fondation | 8 | 2 | 2 | 3 | 0 | 1 |
| 2 — Référentiel | 10 | 0 | 5 | 4 | 0 | 1 |
| 3 — Commercial | 5 | 0 | 3 | 2 | 0 | 0 |
| 4 — Opérations | 8 | 0 | 3 | 1 | 0 | 4 |
| 5 — Ressources / RH interne | 4 | 0 | 3 | 0 | 0 | 1 |
| 6 — Finance | 6 | 0 | 4 | 0 | 0 | 2 |
| 7 — Consolidation | 5 | 0 | 3 | 0 | 0 | 2 |
| **Total** | **46** | **2** | **23** | **10** | **0** | **11** |

**Clôture complète : 2 / 46 lots.** Ce compteur conservateur porte sur tous les critères de chaque lot, dont les raccordements et la recette NAS ; il ne signifie pas que seuls deux modules fonctionnent. Le tableau des travaux ci-dessous décrit les périmètres déjà livrés et leurs limites. Aucune estimation de temps restant n’en découle.

La roadmap reste organisée en sept phases. Certains prérequis transverses doivent être livrés plus tôt que leur module complet : ressources RH avant planning, calculs monétaires / TVA / change avant validation de documents financiers. La phase d'un lot indique son rattachement, sans interdire de livrer un prérequis en amont.

## Registre complet des lots

Les IDs de ce registre sont stables. Les appellations de livraisons historiques ne sont pas des IDs uniques : « Analytique A01 » se rattache surtout à C01 / C04 / X01, « Analytique fixe A02 » à R02 / O01 / O02 / A04, et « Achats A01 » à O01 / O02. Ne pas les confondre avec A01 (TVA / devises) et A02 (numérotation) du registre. T01 / I01 couvrent O04 et le parc interne / registre préparatoire d’A04 ; le parc installé client O07 reste distinct.

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
| R03 | Catalogue produits | R01, R02 | Catégories, unités, images, kind, stock / replenishment policies, tracking et composition distincts ; cycles interdits | En cours |
| R04 | Fournisseurs et tarifs produits | R03 | Plusieurs fournisseurs, références, devises, conditionnements, validité et historique des prix préservés | À vérifier |
| R05 | Imports Excel / Odoo | R01–R04 | Parsing, normalisation, matching, dry run, conflits et apply explicite ; rejeu sans doublons via références externes ; pilote Sociétés/Personnes en cours de recette UX, autres domaines différés | En cours |
| R06 | Documents et templates | Fondation | Tiptap JSON, versions de modèles, fichiers protégés, liens métier et archivage documentaire | En cours |
| R07 | Messagerie e-mail | Fondation, configuration Microsoft | Messaging Service / MailProvider, Graph OAuth délégué, From serveur, outbox et erreurs suivies | En cours |
| R08 | Chat interne | Fondation | Conversations, membres, messages, pièces jointes, lecture et non-lus via REST / realtime ; non-membres refusés | À faire |
| R09 | Calendrier | Fondation | Vues et agrégation des dates métier avec respect de la propriété et des permissions des objets sources | À vérifier |
| R10 | Activity Feed, tâches et mentions | Fondation | core_activity_events distinct de l'audit, notes explicites, tâches, mentions et notifications sans élévation de droits | À vérifier |

### Phase 3 — Commercial

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| C01 | CRM direct et analytique | R01, R02, socle accounting | Opportunité et compte analytique créés de manière cohérente ; activités et code affaire commun | À vérifier |
| C02 | CRM / Appels d'offres | C01, R06, R09 | Extension AO transactionnelle, Kanban / drag & drop, liste, planning, visites multiples, tags, documents et archivage realtime | À vérifier |
| C03 | Devis, pricing et marge | C01, R03, R04, A01, A02 | Brouillons, calculs serveur, validation par permissions, snapshots et révisions ; plusieurs devis acceptés par opportunité | En cours |
| C04 | Commandes client | C03 | Conversion totale ou partielle, reliquats et plusieurs commandes sur le même compte analytique | En cours |
| C05 | PDF et envoi commercial | C03, R06, R07 | Tiptap → HTML → Gotenberg → PDF, versions envoyées figées, envoi autorisé et parcours commercial testé | En cours |

### Phase 4 — Opérations

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| O01 | Approvisionnement et demandes d'achat | C03, C04, R03, R04 | Besoins sourcés, lignes, quantités, composants, fournisseur proposé et ventilation ; demande contrôlable en draft | En cours |
| O02 | Commandes et réceptions fournisseurs | O01, A01, A02 | Validation serveur, allocations multi-analytiques, réceptions partielles et reliquats ; pas de RFQ | En cours |
| O03 | Stock réel et livraisons | R03, O02 | Mouvements audités, physique / réservé / disponible / attendu, réservations, livraisons et coûts analytiques cohérents | À vérifier |
| O04 | Lots, séries, retours et inventaires | O03 | Traçabilité, RMA, quarantaine, inventaires et corrections par mouvements ; historique préservé | En cours |
| O05 | Projets et pilotage | C04, R10 | Agrégation de commandes, phases, jalons, tâches, baseline immuable et révisions de budget | À faire |
| O06 | Recette, réserves et clôtures | O05, R06 | PV / FAT / SAT, réserves suivies, dérogation autorisée et clôtures opérationnelle / financière distinctes | À faire |
| O07 | Parc installé et garanties | O04–O06 | Assets liés aux séries stock, origine projet / commande / livraison / analytique et garanties conservées | À faire |
| O08 | SAV et maintenance | O07, H01, H02, H03, O03, C03, A03 | Tickets, interventions, récurrences, compte-rendu ; temps, pièces et facturation via services existants ; corrections tracées | À faire |

### Phase 5 — Ressources / RH interne

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| H01 | Employés, capacité et coûts | Fondation, R02 | Salariés / freelances / intérimaires / externes sans compte obligatoire ; calendriers, compétences et coûts datés protégés | En cours |
| H02 | Planning ressources | H01, C01, O05 pour liens projet, H04 pour absences | Semaine, internes / externes, jour / nuit, multi-codes, ATE / IDF / DEP, BE / Production, copie et surcharge visible | À faire |
| H03 | TimeReport | H01, H02 | Temps réel distinct du prévu ; BE T01 local : grille, semaine/mois, validation serveur, coûts historiques et raccordement analytique ; planning et import PROD OnSite différés | En cours |
| H04 | Congés et dépenses | H01, R06, C01 pour analytique | Notes de frais E01 locales : saisie mensuelle, pièces et invités, validation manager/notifs, remboursements distincts ; Congés L01 locaux : demandes, allocations RH, soldes, validation/notifs et calendrier ; raccordements Planning et export comptable restent à livrer | En cours |

### Phase 6 — Finance

Le périmètre global conserve la trajectoire comptable entière. A05 est une étape future conditionnée à validation ; sa présence ne signifie pas qu'une bascule depuis Sage est autorisée au lancement. Les identifiants ci-dessous servent au suivi. Le socle de référentiels comptables d'A04 est préparé en amont lorsqu'il est requis par C01 ou A01.

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| A01 | Montants, TVA et devises | R02, contrat de données | Calcul déterministe serveur, précision intermédiaire, arrondis, TaxService, BCE quotidienne et snapshots commerciaux / fiscaux | En cours |
| A02 | Numérotation et anciennes références | Fondation, R02 | Séquences atomiques, tokens contrôlés, patterns futurs, IDs techniques stables et anciennes références recherchables | En cours |
| A03 | Facturation et règlements | C04, O02, A01, A02, R06 | Factures / avoirs clients et fournisseurs, draft / validation, échéanciers, paiements, PDF et historique immuable | En cours |
| A04 | Pré-comptabilité et Sage | A03 pour exports, environnement Sage | Référentiels comptables, Accounting Service / Provider, mappings, écritures préparées, exports suivis, retries et rejeu sans duplication ; Sage officiel | En cours |
| A05 | Comptabilité Horizon progressive | A04, validation comptable dédiée | Modèle complet, shadow accounting comparé à Sage puis bascule explicitement validée ; équilibre, périodes, lettrage, rapprochement, clôtures et FEC testés | À faire |
| A06 | E-invoicing SUPER PDP | A03, configuration provider | Émission et réception, webhooks vérifiés, statuts corrélés, retries et idempotence ; intégration factures clients et fournisseurs testée | À faire |

### Phase 7 — Consolidation

| ID | Lot | Dépendances | Résultat attendu pour clôture | Statut |
|---|---|---|---|---|
| X01 | Dashboard et reporting économique | Modules sources, analytique | Prévu / engagé / réalisé / facturé / payé, marges et indicateurs cohérents ; droits sur coûts respectés | En cours |
| X02 | Recherche globale | Modules exposés, F05, A02 | Recherche multi-domaines et anciennes références, filtrage effectif avant réponse, aucun objet interdit révélé | À faire |
| X03 | Notifications et automatisations | R10, événements des modules | NotificationService central, préférences personnelles in-app et retrait privé livrés localement ; canaux supplémentaires, échéances et jobs observables à poursuivre sans moteur d'approbation par seuils | En cours |
| X04 | API externe | Services métier concernés, F05, F07 | Routes dédiées, clients techniques, allowlists, clés serveur hashées / affichées une fois, rotation, révocation et limites testées | À faire |
| X05 | Archivage, exploitation et release | Lots concernés et environnement de livraison | Politiques de conservation, purge distincte, sauvegarde externe / restauration testée, HTTPS production, PREPROD, E2E, déploiement et rollback vérifiés | En cours |


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
| Q06 | Microsoft 365 : permissions, boîtes et mode OAuth | R07 | Graph OAuth délégué retenu ; connexion/envoi déclarés fonctionnels par utilisateur. Réception ciblée : ajouter Mail.Read délégué, reconnexion et recette réelle à faire ; distinct du login Horizon |
| Q07 | Accès Gotenberg et configuration des modèles CVS | R06 / C05 | À préparer |
| Q08 | Édition de Sage, capacités API / export et mappings | A04 | À préciser |
| Q09 | Accès de test SUPER PDP, contrat API / webhooks et exigences réglementaires à jour | A06 | À vérifier avant intégration et releases concernées |
| Q10 | Coûts horaires, règles de découpage projet et durées de conservation | H01 / O05 / X05 | À définir avec les responsables métier |
| Q11 | Rotation des clés API et limites par défaut | Avant mise en production X04 | À préciser |
| Q12 | Critères et autorisation de bascule comptable | Avant achèvement A05 | Validation future dédiée ; Sage reste officiel au lancement |
| Q13 | Cohérence documentaire validation / authentification | Audit du 12 octobre 2026 | Harmonisé : validation serveur par permissions (H-064), login natif et Microsoft complémentaire (H-060), MFA reporté |

Ces points ne bloquent pas tous les travaux : la préparation du frontend et du Design System peut avancer pendant les vérifications restantes de Q02. Aucun secret ou identifiant d'administration n'est consigné dans ce suivi. Les autorisations de réalisation locale sont conservées dans le journal ; une lecture d’inventaire ou un audit documentaire ne vaut pas autorisation de modifier l’instance NAS.

## Options et éléments hors périmètre initial

| Élément | Traitement |
|---|---|
| Microsoft OAuth2 / Entra pour le login | Option décidée par H-060 ; à planifier si activation demandée, sans bloquer le login natif |
| Signature électronique via provider | Décision future ; suivi dans les décisions ouvertes avant création d'un lot |
| Multi-société | Décision future ; aucun ajout implicite au périmètre |
| RFQ / consultation multi-fournisseurs | Hors périmètre selon H-046 |
| Moteur d'approbation par seuils | Exclu selon H-064 ; validation par permissions |

## Travaux actifs et prochaine livraison

**État au 12 octobre 2026 : aucun développement applicatif lancé par cet audit documentaire.** Les changements applicatifs précédents sont committés et poussés sur `origin/main` (`8e0de25`, puis correctif fil `f9bf927`). Le portail reste développé localement. L’installation du dernier pack PocketBase et le rétablissement des fils sur le NAS ne sont pas confirmés.

| Périmètre / lots | Réalisation vérifiée localement | Travail restant / prochaine action |
|---|---|---|
| Contacts R01 — fusion des doublons | Extension Sociétés du 19 octobre : deux historiques, alias aplatis, brouillons réaffectés par leurs propriétaires, pièces figées préservées, filtres/raccourcis/GED/fil regroupés et nouvelles pièces sur le tiers canonique ; [contrat](04-FUNCTIONAL-SPECS.md#fusion-sociétés-avec-pièces-métier--extension-locale-du-19-octobre-2026) | Recette utilisateur avec hooks/frontend cohérents ; pack fusion-historiques cumulatif, aucune nouvelle migration de fusion. Aucun accès NAS ni fusion réelle par l’agent ; codes tiers incompatibles, identité légale et dépendances inconnues restent bloquants |
| Assistant de fusion — Contacts / Produits | Assistant central local, sélection manuelle et suggestions justifiées à la demande, pagination/recherche/tri communs, comparateur partagé et adaptateurs Contacts/Inventory, offres/historiques et alias produits conservés ; [périmètre livré](04-FUNCTIONAL-SPECS.md#assistant-transversal-de-fusion--livraison-locale-du-18-octobre-2026) | Installer migration 1791840029 et hooks/frontend cohérents puis recette ; sources Personnes/Produits avec usages métier/stock restent bloquées ; l’extension Sociétés prend en charge les deux historiques connus, autres adaptateurs à prévoir. Aucune fusion réelle effectuée par l’agent |
| Imports R05 — pilote Contacts | Assistant CSV/XLSX et source API Odoo 19+, mapping proposé et mémorisable, simulation, comparaison/correction de lignes et résolution explicite, application par lots avec audit et reprise, historique privé et rapport CSV ; Sociétés et Personnes uniquement | Installer migration 1791840026 et hooks/frontend cohérents, valider l’UX utilisateur puis configurer et recetter la connexion Odoo réelle ; HORIZON_IMPORT_ENCRYPTION_KEY pour Odoo seulement. Produits et autres domaines différés |
| Apparence / paramètres UX | Réglages partagés et aperçus réels ; onglets Cartes et Recherche (annuaires, synthèses, recherche contextuelle/globale), couleurs/arrondi des champs, fond/bordures des zones et espace au-dessus du fil ; dimensions bornées et préférences conservées | Installer les hooks et migrations jusqu’à 1791840036 avec le frontend cohérent, puis recette utilisateur/NAS des préférences clair/sombre/mobile ; installation non confirmée |
| Recherche / filtres partagés | Recherche élargie sur desktop (720 px maximum / 62 %), panneau SearchFilters et pastilles communs ; tri de toutes les colonnes métier des listes principales, flèches à droite, synchronisé avec le panneau/URL et global avant pagination ; croix contiguë au bouton Filtres pour réinitialiser critères/groupement/tri, recherche/vue/contexte conservés et première page ; conservation des résultats pendant les filtres par cartes dans un même périmètre ; colonnes des listes standard affichables et réordonnables, préférences privées par compte sauvegardées dans PocketBase ; colonnes proposées configurables par les administrateurs dans Paramètres, redistribution de largeur, textes complets et poignées communes avec largeurs privées persistées (18 octobre) | Validation utilisateur du chargement stable, du tri et des colonnes ; pack colonnes-redimensionnement incluant les migrations 0037/0038 à installer, redémarrage et recette NAS à confirmer |
| Fil partagé — R10 / F03 / F07 | Lecture ciblée, pagination, catégories, tâches, AO/opportunité, photos et droits ; correctif du timeout 30 s | **Priorité immédiate :** installer les hooks à jour, redémarrer PocketBase puis recetter chargement et publication sur Contacts, CRM, Produits, Ventes et Achats ; contrôler le journal |
| Installation — F01 / F04 / X05 | Pack PocketBase seulement, migrations jusqu’à `1791840010_expense_activity.js`, reconstruction et régressions locales | Vérifier migrations effectivement présentes sur NAS ; sauvegarde / restauration et retour arrière à recetter. Ne pas considérer le push Git comme une installation |
| Accès / profil — F05 / R02 / H01 | Accréditations, périmètres, employés distincts, identité/avatar/mot de passe, présence manuelle à quatre états ; vues Employés Cartes par défaut / Liste / Organigramme avec photos protégées gérées visuellement sur Employés et reprises par les comptes associés, tri par nom de famille puis prénom en A → Z par défaut et filtres/groupes conservés | Recette des droits réels et des photos ; capacités/profils de coûts datés T01 disponibles ; compétences et calendriers du planning à compléter. MFA reporté, non activé |
| Catalogue — R03 / R04 | Marques obligatoires, coût/coefficient auto ou manuel, image partagée, logistique, stock/réservations, historique d’achats, cartes, code-barres unique et colonnes Qté en stock physique et Qté disponible dans la liste, tri de tous les champs projetés avant pagination | Comptabilité/TVA produit, composition et conversions d’unités à compléter ; import Excel/Odoo contrôlé à réaliser. Groupe de variantes = regroupement de produits autonomes |
| Documents — R06 / C05 | Studio, modèles versionnés, PDF/étiquettes et premier lot GED G01 : espaces/dossiers, dépôt multiple, classement/liens métier, aperçu partagé, versions binaires immuables, archives, droits et catégories paramétrées ; archivage des envois via Messaging testé localement | Installer migrations GED 1791840021/0022 et hooks/frontend cohérents, configurer les accréditations et recetter NAS. Lecture ciblée Affaire/Client/Fournisseur G03 disponible localement, sans scan global initial ; recette NAS et raccordement GED depuis les fiches à poursuivre sans copie ; recette Gotenberg/impression réelle/étiqueteuse à poursuivre |
| Devis / commandes — C03 / C04 | Modèles de contenu partagés (paramètres, copie depuis devis, aperçu et tarifs courants à la création) ; actualisation des coûts à la demande par ligne/globale avec comparatif et sélection, prix de vente conservés par défaut, application au formulaire et contrôle de source à la sauvegarde ; Contact de devis repris du CRM et modifiable en brouillon, informations réordonnées et descriptions alignées ; cycle/frise, retours contrôlés, CGV par défaut, Sous-titre descriptif et lignes vides conservées, colonnes alignées/cadre arrondi conservé en commande, redimensionnement avec tassement successif dans les deux sens sans élargissement du cadre desktop, grille complète sur toutes les lignes, sous-titres/notes vides compris, et colonnes monétaires prioritaires sans troncature, copie, snapshots, confirmation avec stock/achats, actions conditionnelles, pièces multiples avec aperçu intégré et filtres Ventes dynamiques avec numéro client et regroupements État/numéro à valider, suivis réservés à accepted, retours nets/relivraisons et révisions tracées de commande avec impacts et avoirs brouillons ; services CVS internes exclus des besoins d’achat, services sans suivi physique, Facturé raccordé à l’identité commerciale | Installer le pack cumulatif modeles-devis-20261021 avec migration 0042 (inclut Contact et Reçus), redémarrer PocketBase et recetter contact et actualisation des coûts ; conversions partielles et révision des CGV/dates restent à compléter ; facturation B01 disponible localement. Envoi via Messaging disponible ; recette intégrée à poursuivre |
| Achats — O01 / O02 | Accueil commun DA / BC en attente, cartes de type / état et Nouvelle commande à droite ; recherche fournisseur/opportunité et regroupements Fournisseur/Opportunité/État sans sélecteurs exhaustifs, Type DA/BC séparé et états multiples contextuels, Archives compact séparé comme CRM ; DA manuelles/sourcées, BC directs ou préparés, ventilations affaire/commande/stock/interne avec popup élargi et consultation des sources, brouillons incomplets, réception IN en attente à validation ; préparation de facture fournisseur à droite des onglets du BC validé, selon les quantités restantes | Installer le pack fournisseur cohérent puis redémarrer ; recette multi-affaires et retours en brouillon ; politique d’annulation après envoi à décider avant Messaging. Pas de RFQ |
| Stock — O03 / O04 | Réceptions/livraisons/PREP/RET/INT, BL automatiques optionnels, disponibilité, livraisons partielles et reliquats liés, réservations, rebut, dropshipping, inventaires, lots/séries/quarantaine, dashboards, bascule Tableau de bord/Liste des opérations, colonnes Date/Document d’origine/De/Vers et filtres multiples/archives séparées des cinq listes Stock | Migration BL 1791840000 et recette métier NAS ; reprise des identités d’un ancien stock à cadrer. RMA fournisseur, prêts/location et maintenance ne sont pas livrés |
| Valorisation — O03 / A04 | Standard/CUMP/FIFO, journal immuable, changements administrateur et ouverture datée | Décision actuelle CUMP ; vérifier/appliquer le paramètre sur l’instance cible avec les contrôles prévus. Frais d’approche/change/factures/dépréciations et raccordement Sage restent à faire |
| Parc / immobilisations — O04 / A04 | Affectation interne auditable, parc avec droits RH, registre draft/qualification/déclassement, retour lié | Recette du parc et validation comptable des règles ; aucun amortissement, export ou écriture Sage automatique |
| Facturation — A03 | B01 EUR : dashboard en onglets Clients/Fournisseurs avec cinq cartes alignées sur desktop, factures/avoirs clients-fournisseurs, acomptes/solde, rapprochement, échéancier/règlements, conditions de paiement reliées au client, référence client, frise / onglets / smart buttons, snapshots/PDF/fil et migrations additives ; préparation depuis le BC et choix direct du BC à la création fournisseur, confirmation des remplacements et référence fournisseur/dates conservées ; action Préparer depuis BC à droite des onglets ; titre d’acompte dans la grille, taux numérique modifiable en brouillon, quantités d’origine et calcul serveur, boutons d’ajout partagés avec Devis/Commande | Installer le pack acomptes-pourcentage (migration additive 0039) et recetter en PREPROD/NAS ; Gotenberg réel, mentions de CVS, contexte fiscal international/BCE et raccordement Analyse/comptabilité à compléter. Aucun Sage/PDP activé |
| Analyse — C01 / C04 / X01 | Racine + enfants, vues opportunité/commande/Finance, accès opérationnels/financiers distincts, 5 KPI, temps BE validés/coûts agrégés T01 raccordés et couverture PROD distincte | Raccorder PROD OnSite, planning, heures vendues, frais et factures/paiements ; recetter les capacités/coûts effectifs configurés. Marge à date complète indisponible jusque-là |
| Activité — R10 / X01 | Page globale avec vues Équipe/Mon activité/Mes mentions, filtres multiples, recherche, regroupement et pagination ; rendu partagé notes/e-mails/pièces, accès aux fiches et contrôle par source commun au résumé dashboard. Testé localement en clair/sombre/mobile | Installer les hooks du pack Activité avec le frontend correspondant et redémarrer PocketBase (aucune nouvelle migration), recetter NAS sur les droits réels et la volumétrie. Aucun statut lu/non lu ni compositeur global |
| Dashboard / calendrier — R09 / X01 | Période mois courant/trimestre/année, courbes sur sources accessibles, carrousel, échéances, événements manuels ; week-ends atténués et fériés métropolitains nommés dans les quatre grilles du calendrier ; dashboards personnels sur grille, instances de widgets configurables, sources et filtres propres, pages de carrousel éditables, destination prévisualisée, widgets Temps/Absences/À valider/Raccourcis, copies et défaut privés par compte | Installer le pack dashboards-widgets-20261020 (migrations existantes jusqu’à 0041) et le frontend, recetter NAS. Modèles métier partagés à cadrer ensuite. Raccorder facturation/paiements/réalisé ; Outlook et invitations non livrés. La refonte visuelle rejetée n’est pas une direction à réintroduire |
| Messagerie — R07 / R08 | Envoi Graph délégué validé par utilisateur sur backend précédent ; envoi immédiat, correspondance dans Activity, réception ciblée et vue personnelle Reçus (lecture, recherche, pièces jointes et lien métier) testés localement. Pack cumulatif du 21 octobre préparé, sans nouvelle migration ; chat hors lot | Installer le pack messagerie-recus-20261021 et redémarrer PocketBase avec frontend cohérent ; recetter sur NAS les réponses historiques et PDF/images. Mail.Read et réception opt-in restent requis si pas encore configurés. Reconnexion/renouvellement et nettoyage des droits temporaires à suivre |
| Notes de frais — H04 / E01 | Mes notes / Équipe / À valider, suivi par collaborateur et mois en Mois/Trimestre/Année avec états, notes/compléments, totaux et regroupement par équipe ; note mensuelle avec mois modifiable sur principal brouillon/retour et compléments, Employé/Manager/description, lignes numérotées et ajout sous tableau, popup Dépense/Justificatifs avec Dépense/Rattachement à gauche et Catégorie dynamique à droite, copie de ligne et code affaire, fil d’activité partagé, catégories et véhicules rattachés aux employés paramétrés, invités restaurant, affaire/client/contact ou interne, pièces protégées multiples et aperçu partagé, retour/resoumission/validation et notifications, remboursement complet manuel, snapshots et ordre des lignes | Installer le pack frais-equipe-20261019 et le frontend cohérent (aucune nouvelle migration pour le suivi ; migrations antérieures si manquantes), configurer employés/managers/droits et recetter sur NAS ; EUR seulement, export comptable, virement, marge d’affaire et congés non raccordés |
| Congés — H04 / L01 | Mes congés / À valider / Calendrier en frise avec photos/couleurs par collaborateur, seuls congés sur la période, périmètres Équipe/Entreprise / Allocations RH, projection personnelle dans le calendrier général, cinq types, journées/demi-journées, compteurs CP/récupération, registre d’allocations signé et corrections tracées, réservation des jours, absence de double consommation, fichiers protégés multiples, fil/mentions/notifs et archivage partagé | Installer migrations 1791840016/1791840017 et hooks/frontend cohérents, configurer droits et rattachements, calendrier métropolitain/exceptions dans Paramètres → Congés et allocations dans la page métier ; mettre à jour le correctif Direction et les hooks de calendrier en frise/photos, frontend et sous-menus RH cohérents, recetter NAS. Aucune acquisition automatique ; indisponibilités consommées par TimeReport BE T01 ; Planning futur |
| TimeReport — H03 / BE T01 | Grille semaine allégée, matrice équipe semaine/mois/année avec cartes de synthèse, agenda personnel avec totaux en bout de semaine et refus des temps futurs, activation RH explicite pour équipes BE/Production, services internes, favoris/reprise sans heures, validation manager/notifs et correction motivée avant validation, capacités datées et coûts figés, heures/coûts validés dans l’analyse | Installer jusqu’à 0032 et hooks/frontend cohérents ; classer les équipes, cocher les employés concernés, installer aussi 0033 pour la classification des familles, configurer habilitations/activités/capacités, installer les hooks du suivi visuel et de correction manager avec le frontend cohérent puis recetter NAS ; PROD OnSite, planning et heures vendues consolidées restent à poursuivre |
| Suite métier — O05–O08 / H02–H04 / A05–A06 / X04 | Contrats documentaires préparés, notes de frais E01 traitées séparément ci-dessus | Projets/recette/parc client/SAV, planning/PROD OnSite, intégrations Sage/SUPER PDP/API externe restent des lots distincts à lancer explicitement |

Responsable technique : agent de développement pour les tâches autorisées. Recette fonctionnelle / exploitation : utilisateur et responsables métier concernés. Aucune échéance nouvelle n’est engagée. L’utilisateur a autorisé les réalisations locales précédentes ; cet audit ne lance ni déploiement NAS ni nouvelle intégration.

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


Recherche société — ajustement UX : libellé « Rechercher sur le web », icône globe, action secondaire dans l’en-tête du bloc Identité (révision du 6 octobre), en création et sur fiche existante. Le report revient aux Informations ; la sauvegarde reste explicite.


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

### 6 octobre 2026 — filtres intégrés à la recherche

Décision utilisateur : uniformiser recherche et filtres au fil des modules Horizon. Panneau de filtres partagé dans la top bar, compteur des critères non standards et pastilles retirables ; tri et choix de présentation près des résultats. Premier raccordement réalisé pour l’état Actifs / Archivés des répertoires Sociétés et Personnes, persisté dans l’URL. Contrat réutilisable documenté pour les futurs modules. Aucun changement PocketBase nécessaire.

6 octobre 2026 — ajout des filtres commerciaux Contacts (Toutes / Clients / Fournisseurs) sur les sociétés et personnes, avec prise en compte des doubles rôles et exclusion des rôles désactivés. État Actifs / Archivés réduit à des radios compacts neutres et une pastille grise. Réutilisation du panneau commun ; aucun lot PocketBase supplémentaire.

6 octobre 2026 — panneau Filtres / Regrouper par / Trier par élargi et système de vues enregistrées. Décision utilisateur : tous les lecteurs du module peuvent enregistrer leurs critères en personnel ou global ; modification/suppression par créateur ou administrateur uniquement. Permission dédiée core.views.manage pour les administrateurs, à ajouter explicitement aux rôles concernés, sans promotion automatique. Core propriétaire des vues, premier raccordement Contacts, groupes/compteurs paginés serveur ; migration et lot NAS nécessaires. Aucun nouveau contexte de module non livré n’est prétendu fonctionnel.

6 octobre 2026 — navigation des fiches demandée à droite du fil d’Ariane : compteur ordinal et chevrons, premier raccordement Sociétés / Personnes. Conservation du contexte de liste dans l’historique de l’onglet, protection des brouillons, lecture serveur du rang et des voisins pour franchir les pages sans charger tout le répertoire. Réutilisation du hook Groupes et slot d’actions partagé ; deux hooks NAS à mettre à jour, sans migration ni permission supplémentaire.

6 octobre 2026 — déplacer les raccourcis métier entre fil d’Ariane et pagination, les compacter et adapter leur contenu à la source (client, fournisseur, produit...). Composant HRecordLinks et slot related partagés, compteurs Contacts / Adresses dans les onglets uniquement, liens profonds de sections conservés. La barre supérieure est réservée aux objets métier intermodules. Définitions Client / Fournisseur actives enregistrées, cumul ; compteurs et filtres intermodules à raccorder aux services propriétaires lors de leur livraison, actuellement absents. Prévoir même périmètre entre compteur et destination, permissions avant rendu et reprise des critères dans la liste. Aucun nouveau module métier ni migration prétendu livré pour cette évolution.

6 octobre 2026 — correction du fil : action unique dans l’en-tête auteur, sans « Fiche mise à jour » répété. Retrait d’un rôle commercial traité comme modification de société, avec correction du hook Activity et présentation compatible avec l’ancien historique. Lot NAS activité/libellés prêt, installation distante restant à faire.

6 octobre 2026 — Recherche Contacts simplifiée : à la demande utilisateur, abandon du panneau de résultats combinés. Recherche Contacts par défaut, résultats dans les onglets existants, bascule automatique lorsque seul l’autre type a des résultats. Choix explicite d’un type respecté ; recherche et filtres conservés. Aucun impact de schéma PocketBase.

6 octobre 2026 — décision utilisateur : Contacts devient la base de design des prochains modules Horizon. Contrat consolidé en tête du document 07, lien de lecture dans le document 00 : composants partagés, typographie et graisses réelles, densité / dimensions, espacements uniformes, couleurs sémantiques, navigation, sauvegarde, confirmations et fil d’activité. Les anciens essais visuels ne doivent pas réintroduire de variantes abandonnées. Toute évolution d’un pattern commun doit être centralisée et vérifiée sur les écrans déjà raccordés. Les spécificités métier de Contacts ne sont pas imposées aux autres modules.

6 octobre 2026 — la barre fil d’Ariane / raccourcis métier / compteur et chevrons reste persistante sous la top bar pendant le défilement. Pattern partagé du shell, desktop et mobile, ajouté au contrat de design commun validé sur Contacts.

CRM classique — premier lot du 6 octobre 2026 : utilisateur valide opportunités d’abord, puis AO. Liste / Kanban, fiche, fil Core, paramètres d’étapes et création atomique numéro / compte analytique réalisés et testés localement. Déplacements Kanban en brouillon jusqu’à Enregistrer ; conflits concurrents refusés, reprise de création idempotente. Raccourci Opportunités des sociétés clientes raccordé au compteur réel. Migration et lot NAS préparés, aucun déploiement distant effectué ni permission automatiquement accordée aux rôles existants. C01 reste En cours pour les activités commerciales spécialisées et les compléments du périmètre cible ; C02 AO non démarré. Limites opérationnelles documentées dans les spécifications.


6 octobre 2026 — révision CRM demandée : étapes Nouveau / Qualifié / Gagné / Terminé / Perdue / Annulé ; état associé cohérent côté serveur, colonnes repliables et totaux globaux par devise, glissement guidé et animé, colonnes ouvertes plus légères. Numéro / titre séparés, effacement explicite des sélecteurs, référentiel Types de marché dans Paramètres, description Tiptap terminée. Migration corrective préservant numéros, comptes et descriptions existantes ; nouveau lot NAS consolidé à installer. C01 reste En cours pour le périmètre cible restant et AO non démarré.


CRM : repli des colonnes désormais conservé après refresh, préférence locale par utilisateur. À la demande utilisateur, le remplacement du drag & drop par une bibliothèque doit être proposé avant réalisation ; dnd-kit React proposé puis validé par l’utilisateur et intégré (voir décision ci-dessous).

6 octobre 2026 — accord utilisateur pour dnd-kit : remplacement du drag HTML5 / FLIP par la bibliothèque React moderne 0.5.0. Les animations de tri, overlay et capteurs sont gérés par la bibliothèque ; service CRM et sauvegarde explicite conservés. Repli de colonnes toujours mémorisé par utilisateur et navigateur. Aucun lot supplémentaire clôturé, aucune migration ou installation NAS requise pour ce changement frontend.

6 octobre 2026 — nouvelle décision utilisateur : dépli automatique d’une colonne survolée par une carte, mémorisation de l’ouverture ; sauvegarde immédiate des déplacements Kanban / menu, retrait d’Enregistrer et Annuler les déplacements du répertoire. La fiche conserve sa sauvegarde explicite. Dépôt sans changement d’étape ou Échap ne crée aucune écriture. Échec / conflit : suppression de la projection locale, relecture serveur et erreur visible. Cadre discret des colonnes, code noir et colonne Code triable en liste. Aucun changement de schéma PocketBase ni de droits, aucun déploiement NAS.

7 octobre 2026 — ajustements CRM demandés : couleurs distinctes par colonne sans liseré, retrait du menu de déplacement et des tags d’état des cartes, identité du responsable (clarification utilisateur : responsable, pas créateur) et logo client dans le Kanban comme en liste. Réutilisation du composant Contacts pour les images protégées et de la projection autorisée des responsables CRM pour leurs noms. Aucun changement de schéma ni élargissement des droits sur core_users.

7 octobre 2026 — décision utilisateur : séparer paramètres métier et référentiels transverses. CRM dispose de sa page et des onglets Présentation / Étapes / Types de marché. Vue initiale globale configurable ; couleur unique par étape et type, palette partagée, raccourci de réglage dans l’en-tête de colonne. Qualification d’une opportunité par plusieurs marchés. Nouvelle migration préparée et vérifiée localement, lot NAS consolidé disponible ; aucune modification distante. C01 reste En cours pour les compléments métier, C02 AO non démarré.

7 octobre 2026 — retour utilisateur sur le Kanban : abandon des grandes boxes et des en-têtes teintés au profit de colonnes ouvertes, titres / compteurs colorés et totaux compacts. Ajustement visuel uniquement ; aucun changement des paramètres ni du schéma PocketBase.

7 octobre 2026 — références utilisateur pour le Kanban : rendre les colonnes identifiables par des surfaces neutres distinctes et des cartes blanches, avec couleurs localisées dans les en-têtes. Conserver le fonctionnement et les réglages CRM. Ajustement frontend uniquement.

7 octobre 2026 — demande explicite : remplacer les ronds de colonne par un bord supérieur coloré et renforcer la délimitation des colonnes CRM. Couleur issue des paramètres existants ; aucune migration supplémentaire.

7 octobre 2026 — finition Kanban CRM : marché(s) en tags dans les cartes, logo client agrandi à droite et état vide centré. Hauteur 112 px, responsable et couleurs configurées conservés. Aucun changement serveur.

7 octobre 2026 — disposition des cartes précisée par l’utilisateur : code et client réunis en haut, titre puis montant dessous ; avatar du responsable et logo client à droite. Tags en bas, probabilité opposée. Frontend uniquement, densité et interactions conservées.

7 octobre 2026 — demandes Paramètres : rubrique Séquences transversale pour départ / prochaine valeur et formats, configuration des tableaux par engrenage centré. Étapes commerciales au nombre fixe de six, titres / couleurs / ordre personnalisables ; ajout / suppression / changement de signification interdits côté serveur. Couleur libre facultative sur étapes et marchés, en complément des tons Horizon. Remplace le caractère extensible du référentiel d’étapes prévu auparavant. Les étapes supplémentaires historiques sont conservées inactives, affaires rattachées à l’étape fixe correspondant à leur état.

7 octobre 2026 — cadrage demandé avant implémentation de Utilisateurs et accès / Employés : quatre profils ERP (Admin, Superuser, User, Viewer), paramétrage réservé aux profils d’administration, poste descriptif sans effet sur les droits, responsabilité de manager distincte du profil et accréditations métier par module / périmètre. Liste et organigramme dans Employés, hiérarchie unique des ressources avec comptes associés facultatifs. Récapitulatif, état réel du dépôt, propositions et arbitrages dans `04-FUNCTIONAL-SPECS.md`, section « 18.2.2 Cadrage utilisateurs, droits, managers et organigramme ». Frontière précise Admin / Superuser, périmètres indirects et modèle d’attribution restent à valider. Aucune implémentation, migration ou modification des droits actuels dans ce lot documentaire.

### 7 octobre 2026 — Utilisateurs, accréditations et Employés

Cadrage validé par l’utilisateur. Quatre profils ERP structurels, Admin seul administrateur des comptes / droits, Superuser administrateur fonctionnel, User / Viewer par accréditation. Paramètres existants soumis à la nouvelle frontière, navigation filtrée et cache purgé au changement de droits / révision du compte. Page `/settings/users` avec configuration explicite, rôles effectifs dédiés et audit sans secrets. Aucun héritage de droits depuis le poste ou la responsabilité Manager.

Employés `/hr` : liste, fiche, photos protégées, équipes, responsable principal, Manager, ressources sans compte et organigramme compact avec repli / zoom. Policies et API Rules HR self / reports directs / team / all réellement appliquées ; hiérarchie globale avec contribution requise, cycles et perte d’un manager actif refusés. Fin d’activité désactive le compte lié ; dernier Admin protégé. `core_users.employee` source unique, inverse calculé. Migration 1791331203 : comptes historiques conservés en User, rôle historique inchangé sauf premier Admin explicitement désigné par variable serveur ; mise à niveau refusée sans désignation. Aucun déploiement NAS.

H01 passe à En cours ; capacité / calendriers / compétences / coûts restent à faire. R02 reste En cours, F05 À vérifier pour la préproduction. Tableau global recalculé : 2 terminés, 5 en cours, 4 à vérifier, 35 à faire sur 46. Les permissions / validations des modules futurs restent indisponibles jusqu’à contrôle réel serveur. Prochaine étape : installer le lot consolidé, désigner le premier Admin et recetter sur préproduction.

### 7 octobre 2026 — responsabilité Direction

Ajout demandé et livré localement dans Employés / accès : niveau Direction au-dessus des managers et collaborateurs, sélection exclusive, responsable principal explicite, badges et organigramme. Aucun droit ERP ou accès aux descendants hérité automatiquement. Migration additive 1791331204 et nouveau lot consolidé décrits dans 06 ; vérifications dans 09. Démarrage du conteneur NAS signalé en échec : diagnostic toujours en attente du journal / compte Admin initial, aucun redémarrage distant effectué.

### 7 octobre 2026 — correction recherche et filtres Employés / Utilisateurs

Suppression des barres de recherche / filtres locaux ajoutées à tort. Raccordement des deux listes à la top bar et au panneau SearchFilters validés sur Contacts / CRM. Critères URL persistants et conservation lors de la fermeture de fiche / changement Liste–Organigramme. Nettoyage du CSS des contrôles retirés. Changement frontend uniquement, aucun nouveau lot PocketBase nécessaire. Contrat et recette précisés dans 04 / 07 / 09.

### 7 octobre 2026 — panneau Filtres / Regrouper / Trier réellement transverse

Correction du raccordement incomplet HR / accès au panneau partagé. Même structure et CSS que Contacts, déclaration des regroupements / tris métier, application aux listes. Correction du tri CRM masqué lorsqu’aucun regroupement n’était déclaré et de Réinitialiser lorsque seul le tri change. Extraction des groupes de Contacts dans GroupedResults commun ; aucun rendu recopié par module. Consigne renforcée dans AGENTS et contrat dans 03 / 04 / 07. Changement frontend, aucune migration.

### 7 octobre 2026 — Équipes dans Employés

Remplacement du dialogue à code par un onglet Équipes, nom / managers multiples / archivage / réactivation. Recherche, filtres, tri et regroupement dans les composants transverses. Managers d’équipe distincts de la hiérarchie et des accès ; protection serveur des équipes actives et archivage sans perte de membres. Migration additive 1791331205 et archive consolidée 49 fichiers dans 06. Frontend / backend livrés localement, recette dans 09 ; aucun déploiement NAS.

### 7 octobre 2026 — popup Équipe finalisé

Mise en page compacte, pied fixe partagé, absence de badge Active en création. Engrenage déplacé dans l’en-tête via actions de HDialog. Correction de son blocage lorsque le formulaire contient des modifications ; archivage confirmé de la version enregistrée, avec information explicite d’abandon des changements. Parcours Chromium complet validé, détails dans 09. Frontend uniquement, archive PocketBase Équipes inchangée.


7 octobre 2026 — couleurs des tags organisation / profils ERP : implémentation locale terminée, dans Utilisateurs et accès → Tags. Admin / Superuser administrent les couleurs ; comptes et accréditations restent réservés Admin. Sept tags fixes et configuration globale persistée, composants de rendu et sélecteur de couleur partagés, aucune nouvelle rubrique Paramètres. Migration additive 1791331206 et audit ; mise à jour du frontend et backend requise ensemble. Tests de sécurité / persistance / affichage croisé validés. Aucun déploiement NAS ni commit / push réalisé pour ce lot.


7 octobre 2026 — premier lot AO / Calendrier : création atomique d’opportunités `tender`, préparation indépendante, visites / soutenances multiples, tags administrables, dépôts immuables versionnés avec pièces protégées, filtres / regroupement transverse, Kanban / liste / calendrier partagé et Realtime. Référence fonctionnelle AOBoard examinée au commit `1437ec8fbad9c43b0e402807b0e3bf09bc1d5ef9` ; architecture React / PocketBase Horizon conservée. Migration additive `1791331207_crm_tenders.js`, contrôle de concurrence et rollback préservant les historiques. C02 et R09 passent En cours : recette NAS, rappels, fournisseurs Calendrier supplémentaires et compléments documentaires restent à faire. Aucun déploiement distant. Tableau global : 2 terminés, 7 en cours, 4 à vérifier, 33 à faire sur 46. Prochaine action : installer le lot AO consolidé et recetter les échéances / dépôts avec les utilisateurs.


8 octobre 2026 — décision et premier raccordement de création / consultation liées : fenêtre commune réutilisant le formulaire canonique, parent maintenu monté, résultat sélectionné après sauvegarde, fermeture dirty / busy protégée, popups imbriqués et lecture seule. Société de fiche personne et société / contact du CRM raccordés ; maintien du lien société-contact après modification. `shared/records` centralise le contrat et le rendu ; adaptation Produits prévue à la livraison de son éditeur, sans seconde version de formulaire. Aucun schéma, migration, dépendance ou backend ajouté. Statuts globaux des lots inchangés ; compléments UI Contacts / CRM. Prochaine recette : usages réels avec brouillons et plusieurs ouvertures successives.

8 octobre 2026 — décision utilisateur : type Directe / AO convertible. AO → direct met en sommeil uniquement l’extension AO, sans supprimer documents, visites ou réponses. Direct → AO crée ou réactive le dossier 1:1, même numéro / compte analytique et fil. Migration additive 1791417600, droits CRM et concurrence serveur conservés ; aucune modification des étapes commerciales, aucun déploiement distant.


8 octobre 2026 — décision utilisateur AO : dossier autonome en `À analyser` / `No go`, affaire seulement à la décision de répondre (`En préparation`). Cette décision remplace la création immédiate du premier lot AO. Implémentation locale : migration additive, promotion atomique idempotente, conservation des liens historiques, fil / fichiers / visites avant promotion, trois vues Kanban / Liste / Planning. Planning par dossier inspiré de la référence AOBoard, données partagées avec Calendrier. No go reste distinct de Perdue ; retour No go après promotion conserve l’affaire et son historique. C02 / R09 restent En cours pour recette NAS, rappels et compléments déjà identifiés. Lot consolidé et procédure dans 06 ; aucune installation distante effectuée.

8 octobre 2026 — Devis S01 : création de brouillons et lignes libres HT, compte analytique / devise hérités de l’opportunité obligatoire, numéros code CRM-rang atomiques, liste générale et filtrée, smart button Devis et revenu prévisionnel. Annulation draft avec motif et historique. Restent validation, TVA, catalogue / pricing avancé, PDF / envoi, révisions validées et commandes partielles. Modèle de commandes réservé et consolidation testée sans double comptage ; aucun parcours commande livré à ce stade.


8 octobre 2026 — Devis S02 : structure des lignes, sections à deux niveaux / sous-totaux facultatifs, notes, remises, coûts, options séparées et revenu CRM hors options ; duplication / déplacement / suppression confirmée. Largeurs communes et validité dans Paramètres Ventes, fil d’activité et popup CRM transversal. Modèles de devis prévus : réutiliser ces mêmes lignes et sections, sans formulaire concurrent. Suivi achat de ligne réservé à l’approvisionnement futur. S01 reste incomplet pour catalogue / TVA effective / validation / PDF / conversion en commandes.

Devis S03 — 8 octobre 2026 : édition pleine largeur, option dédiée, actions directes avec confirmation, ajouts en pied de grille et déplacement via dnd-kit existant. Aucun ajout de dépendance, ordre sauvegardé par le flux brouillon existant ; options et montants restent gouvernés par le pricing serveur.

8 octobre 2026 — Devis S04 : densité et centrage affinés, redimensionnement direct des colonnes, marge sur coût saisissable avec recalcul du PUV serveur, TVA de brouillon explicite et HT / TVA / TTC. Préférences de largeur propres au compte localement, valeurs communes dans Paramètres Ventes. Première brique de calcul fiscal serveur sans livraison des règles contextuelles A01 ni validation / facturation.

Devis S05 — trois niveaux de titres repliables, suppression rapide de ligne, cellules discrètes, largeur globale conservée au redimensionnement, en-têtes persistants et résumé des totaux. TVA configurable exclusivement dans Paramètres → Devis, remplace la saisie par brouillon S04.

Devis S07 : remise de pied sur le HT après remises de ligne et hors options, TVA calculée sur les bases nettes réparties au centime. Total achats estimé et marge globale après remise, en devise et pourcentage sur coût ; la remise réduit le revenu prévisionnel CRM. Aucun workflow achat / facture / validation supplémentaire.

Devis S09 : CGV configurables sélectionnables et snapshotées, unités partagées via inventory_units, remise en montant ou %, détails de grille et duplication affinés. Les unités ne créent pas de moteur de conversion ni de second catalogue. Catalogue produits, conditions de paiement, fiscalité contextuelle et émission restent hors de ce lot.

8 octobre 2026 — Devis S10 : grille compacte, montants avec devise intégrée, remise globale montant / pourcentage simultanés et retrait, titres optionnels avec héritage serveur et exclusions cohérentes des totaux / revenu. Aucun nouveau workflow ni schéma.

8 octobre 2026 — Studio de pièces PDF : cadrage initial R06 / C05 dans `04-FUNCTIONAL-SPECS.md`, section 17.1, après examen des deux devis CVS fournis (une et deux pages). Bibliothèque de blocs, A4 portrait / paysage, champs métier autorisés, tableau dynamique, pagination, aperçu sur vrai devis et téléchargement ; choix confirmés par l’utilisateur : blocs avec pagination automatique, modèles communs dans Paramètres, devis pour le premier lot. Aucun studio, migration Documents ou service Gotenberg livré par ce cadrage.

8 octobre 2026 — précision Studio Documents : positionnement au pixel conservé dans les zones de composition malgré le choix de blocs avec pagination automatique ; valeurs de position / déplacement surlignées pendant le drag. Cadrage complété avant le commit demandé, implémentation du studio non commencée.


8 octobre 2026 — Documents D01 livré localement : première version du studio dans Paramètres, modèles / brouillons / publications immuables, bibliothèque et mesures au pixel, styles de titres, tableau réel de devis, aperçu et téléchargement via Gotenberg. Migration 1791504010 et raccordement serveur HORIZON_GOTENBERG_URL. Recette réelle NAS à faire avant de déclarer la pagination conforme aux exemples CVS. Organisation / snapshots d’adresses, finition de la maquette CVS et émission historique restent les étapes suivantes ; aucun document envoyé ni workflow de validation fictif.

Studio D02 — 8 octobre 2026 : composition de plusieurs blocs statiques par ligne, import du logo plus visible, projection d’adresse client publique avec résolution explicite des ambiguïtés, validité en date / jours, champs par provenance, source / colonnes du tableau, zoom −/+, cinq polices locales et outils typographiques par pictogrammes. JSON v1 compatible avec les publications D01. La génération PDF paginée réelle sur le NAS et les snapshots d’adresse / identité CVS pour les pièces finalisées restent à valider / compléter.

Studio D03 — reprise UX et rendu : bug d’attribut style HTML corrigé, styles Tiptap / titres visibles dans la feuille et l’aperçu, suppression des commandes Gras / Italique redondantes, poignée / croix / repères dans le papier, ancrages bornés, duplication sous la source, ruban compact et zoom adapté à l’écran. Les snapshots de modèle restent immuables, le JSON v1 reste compatible et aucune collection n’est ajoutée. Conversion multipage Gotenberg sur NAS et pièces finalisées / snapshots de données métier restent dans la recette suivante.

Studio D04 — bibliothèque de composition générique : suppression des blocs métier Totaux / CGV de la palette, champs publics liés indépendants, tableau avec source autorisée et sections issues du devis. Conversion compatible des anciens blocs dans la copie de travail uniquement. Sélection / taille plus discrètes, import aux dimensions naturelles bornées et proportions verrouillées, panneau compact et styles de texte H1 / H2 / H3. Aucun schéma de collection ni version publiée réécrits.

Studio D05 : fonds de page et blocs avec opacité, panneaux latéraux redimensionnables et conservation locale, propriétés alignées / regroupées, un niveau de titre édité à la fois et texte à hauteur naturelle bornée. Extensions optionnelles du JSON v1, aucune collection ni version historique modifiée ; recette des fonds en PDF multipage sur Gotenberg NAS à effectuer.

Studio D06 — finition des outils : sections repliables des deux panneaux, état local et brouillons conservés, pastilles / codes couleur compacts et sliders discrets. Modification frontend uniquement, le lot serveur D05 reste valable.

Studio D07 : sections fermées par défaut, propriétés de Bloc réorganisées, styles de sections rattachés au tableau. Pas de nouvel onglet global Titres. Modèle générique conservé ; la seule source dynamique actuellement disponible est Devis, les autres pièces restent prévues.

Studio D08 : réglages de colonnes sur une ligne (case / nom / largeur / ordre), source simplifiée et largeur totale unique ; ruban du modèle allégé. Changement frontend uniquement, aucun changement de données ou de hooks depuis D07.

Studio D09 à D14 : styles indépendants d’en-tête, lignes, notes et sections, sélection et outils harmonisés, repères de marges et dimensions physiques de la feuille ; aperçu HTML paginé avec Paged.js embarqué et aperçu PDF conservé. Les publications existantes restent immuables. Les détails UX sont centralisés dans le document 07 et les instructions NAS dans le document 06.

9 octobre 2026 — Documents D15 : PDF apparemment tronqué reproduit avec fond opaque : les couches répétées en pied de page recouvraient la feuille. Découpage de ces couches aux zones réservées, validé par impression Chromium et rasterisation locale. HTML : remplacement du cadre masqué par un voile de chargement, relance explicite et diagnostic de progression ; scénario avec images et tableau long vérifié. Le délai signalé sur l’instance utilisateur n’est pas reproduit par la fixture locale ; phases de diagnostic ajoutées pour identifier un éventuel blocage restant.

9 octobre 2026 — Documents D16 : aperçu préparé en grand dès l’ouverture, zoom HTML et ajustement à la fenêtre, caractéristiques papier visibles. Noms PDF par type paramétrables dans un onglet commun, numéro de pièce obligatoire, date / société facultatives, validation et génération serveur, en-tête UTF-8 transmis au téléchargement. Devis raccordés ; formats des commandes et bons de livraison préparés pour la suite. Migration 1791504011_document_filenames.js, vérification PocketBase / tests purs / navigateur.

9 octobre 2026 — finition de l’aperçu Documents : zoom et ajustement déplacés dans la zone d’aperçu ; format / dimensions / compteur de pages HTML à gauche. Sélecteurs plus courts, hauteur des boutons harmonisée et téléchargement PDF primaire séparé. Vérification navigateur du compteur, de l’alignement, du zoom et du téléchargement en clair / sombre et fenêtre étroite. Frontend uniquement, aucune migration supplémentaire.

9 octobre 2026 — Documents D17 : noms PDF enrichis et sélecteur de champs avec provenance ; suppression du titre redondant de l’onglet. Noms calculés depuis le contexte métier autorisé, formats historiques conservés et textes longs raccourcis pour respecter le budget UTF-8 sans tronquer le numéro de pièce. Pas de migration supplémentaire.

Documents — suppression : archivage et poubelle avec confirmation dans la liste des modèles, retirés du studio pour les modèles sans version publiée ; route serveur réservée Admin / Superuser habilité, contrôle de concurrence et audit transactionnel. Les modèles déjà publiés restent archivables, sans destruction des versions. Aucun changement de schéma.

Paramètres — harmonisation : tableaux partagés avec `HSettingsTable`, bordures visibles, densité compacte, État / Actions centrés et compteurs communs. Reprise de la présentation validée des modèles de pièces dans tous les tableaux de configuration ; aucun changement serveur ou schéma.


9 octobre 2026 — cadrage Produits : catalogue unique pour vente et usage interne ; destination au niveau du besoin / exemplaire, transfert explicite du stock commercial vers le parc interne et lien distinct vers l’immobilisation, avec Accounting Service et Sage comme vérité comptable initiale. Identité et numéro de série conservés, présence physique traçable. Location rare différée, mais disponibilité, état physique et affectation restent distincts dès la conception. Aucun développement ni migration engagés ; contrats détaillés à établir avant le lot Catalogue / Parc interne.


9 octobre 2026 — Catalogue P01 livré localement : catalogue vide à l’installation, fiche illustrée dense avec Informations / Achats / Logistique / Photos (prix visibles dès Informations), variantes achetables distinctes et groupe facultatif, familles / coefficients configurables, offres fournisseurs et favori, coût par unité de base et historique immuable. Intégration aux brouillons de devis via formulaire partagé / popup, fournisseur choisi explicitement, prix et identité snapshotés sans recalcul depuis les futurs tarifs. Recherche / filtres / regroupements partagés, droits inventory.read / inventory.write, fil d’activité partagé. Migration additive 1791504012_inventory_catalog.js. Stock réel, achats opérationnels, parc interne / immobilisations, location et import Excel restent les lots suivants ; aucune donnée de l’ancienne base importée. Recette locale : migration neuve / base existante avec rôle partagé, prix fractionnaires, photos protégées, permissions, changements de favori, prix historiques et HTML documentaire ; navigateur sur création avec fournisseur en popup, devis, conservation de l’onglet, clair / sombre, écran étroit et lecture seule. Paquet NAS préparé, non déployé.

9 octobre 2026 — Reprise visuelle Catalogue P01 : famille seule dans le formulaire et les filtres, prix au premier onglet, typographie / densité Contacts, tableau achats HDataTable et favori magenta, recherche d’images transversale raccordée à la photo et à la galerie. Fil commun testé en lecture / publication ; vues pleine page et embarquée utilisent toujours ProductPage.

9 octobre 2026 — Catalogue P02 : marques dans une collection, création depuis la combobox et migration des anciens libellés ; coût manuel persistant sans écrasement des offres ; poids / volume / code SH / origine ; photo unique et champs plus compacts ; onglet Comptabilité préparatoire. Migration additive 1791504013_product_brands_logistics.js ; aucun flux comptable ou stock opérationnel ajouté.


9 octobre 2026 — Catalogue P03 : composition de fiche densifiée, photo près des champs, coût × coefficient → PUV, politiques / caractéristiques logistiques côte à côte. Coefficient propre au produit en mode manuel, retour automatique au coefficient de famille, calcul / validation serveur et snapshots devis préservés. Migration additive 1791504014_product_pricing_coefficient.js. Vérifié localement, non déployé sur le NAS.


9 octobre 2026 — Catalogue P04 : référence produit unique, pictogrammes vendu / acheté côte à côte, retour coefficient auto par décochage, marge sur vente explicitement distinguée de la majoration sur coût. Tableau Fournisseurs : colonnes redimensionnables via HDataTable partagé, étoile centrée et suppression confirmée sans purge de l’historique. Groupe de variantes reste un libellé facultatif de regroupement de produits autonomes. Pas de migration de schéma supplémentaire ; hooks et frontend à mettre à jour.

Catalogue — smart boutons produit : Devis opérationnel avec historique par produit / analytique et contrôles serveur de droits. Achats, commandes Ventes, Livraisons et Stock prévus dans la barre commune ; raccordement différé aux workflows correspondants, sans simuler des quantités ni considérer un devis comme une vente.


Cycle commercial Devis : finalisation, confirmation client et preuve protégée, commercial visible et frise des quatre phases. Envoi réel via Messaging, commandes partielles, révisions, exécution / livraisons et facturation restent des lots ultérieurs. La confirmation complète courante respecte le modèle multi-devis / multi-commandes et l’analytique commun.


Devis — annulation, archivage et suppression : `cancelled` est un état métier distinct ; `archived_at` retire une pièce des listes courantes sans modifier son état ni ses engagements. Réactivation disponible. `sent_at` conserve le premier envoi, même après retour en brouillon. Suppression serveur autorisée avec `sales.write` uniquement sans envoi historique et sans aucune commande liée (même annulée) ; les autres pièces restent archivables. Une commande doit revenir en devis avant annulation du devis.


Livraison locale — cycle devis : frise, commercial, finalisation, confirmation avec vraie commande et preuve protégée ; reprises commande → devis → brouillon, annulation, archivage indépendant et suppression limitée. Compteur persistant par opportunité ; historique et analytique conservés. Envoi réel toujours en attente du module Messaging ; aucun faux envoi. Achats / livraisons / réservations ne sont pas déclenchés automatiquement.


10 octobre 2026 — Documents D18 : étiquettes produit dans le studio partagé, formats arbitraires en mm et référentiel Formats d’impression (A4 / Étiquette produit 95 × 28 initiaux), dimensions snapshotées dans le modèle. Bouton code-barres de la fiche produit, aperçu HTML / PDF et impression, champs Produit autorisés et Code 128 contrôlé. Migration additive 1791630000_product_labels.js, versions publiées préservées. Vérifications locales de droits, validation, conflits, pagination, dimensions physiques et parcours navigateur ; déploiement NAS et imprimante réelle restent à effectuer.


10 octobre 2026 — Catalogue : proposition serveur du code-barres Marque (3 caractères sans espaces) + Référence, attribution atomique avec suffixes et unicité persistée, archivés inclus. Code existant conservé lors des modifications d’identité ; idempotence de création préservée. Migration 1791630001_product_barcode_unique.js audite la résolution d’éventuels doublons historiques. Vérifications pure / serveur / concurrence / migration existante et navigateur ; paquet NAS consolidé préparé, non déployé.


10 octobre 2026 — Achats A01 et Stock S01 : premier lot DA manuelles / issues de commandes client, ventilation par compte analytique, préparation explicite de BC brouillons regroupés par fournisseur et devise, validation / annulation / archivage, fil et aperçu HTML / PDF réutilisant Documents. Réservation facultative lors de la confirmation client ou après, balances physique / réservé / disponible / entrant et ajustement audité initial par emplacement. Numéro de devis conservé et libellé Commande après acceptation ; colonnes opérationnelles uniquement dans cet état. Smart boutons strictement de navigation. Dernier achat produit issu d’un BC validé, sans assimilation du tarif préféré à un achat réel.
Suite requise : réception / livraison avec brouillons distincts des états réalisés, lots / séries, inventaires complets et multi-entrepôts, valorisation / écritures comptables et Messaging. Aucune réalisation simulée ni e-mail envoyé. Les choix tarifaires sont explicites, pas de RFQ. Ce lot remplace les mentions antérieures « Achats / Stock indisponibles » pour les fonctions effectivement décrites ici.


BC fournisseur — 11 octobre 2026 : acheteur core_users via owner, destination inventory_warehouses via delivery_warehouse ; validation exige des référentiels actifs. Aucun changement rétroactif des pièces validées. Les smart boutons restent des raccourcis de consultation ; Réceptions et Factures fournisseurs attendent leurs modules. Pas de workflow RFQ ajouté.


11 octobre 2026 — Paramètres UX communs : décision de centraliser les dimensions / espacements et les couleurs d’en-tête en Paramètres avec aperçu en direct, réservés aux administrateurs habilités. Valeurs actuelles conservées à l’amorçage, publication uniquement par Enregistrer et lecture partagée par tous les modules. Les documents PDF gardent leurs modèles et les états métier leur palette.

Livré pour ce lot : `/settings/ux`, singleton settings_ux et migration 1791710002, validation / audit serveur, aperçu des composants Horizon, chargement global et propagation Realtime, protection des éditions concurrentes, restauration des défauts et tests du parcours. Aucun déploiement distant implicite.

11 octobre 2026 — Extension UX : onglets, fonds général et activité, couleurs alternées des tableaux, dimensions / couleurs des boutons et smart boutons, densité sidebar et taille des tuiles du menu. Actions déplacées dans la barre sticky partagée. Migration additive 1791710003 préservant les réglages existants.

11 octobre 2026 — Stock S02 : opérations IN / OUT / RET / PREP / INT, Meudon et Sèvres, séquences continues par entrepôt/type, réceptions / livraisons partielles liées aux pièces sources, transfert en transit, retours, rebut, dropshipping et inventaires annuels / tournants planifiés, verrou facultatif au comptage. Réutilisation des listes et fiches Horizon, activité et Documents. Réservations après réception autorisées sans recréer de besoins d’achat ; une validation réalise le stock, un brouillon ne le réalise jamais.
Périmètre de ce lot : produits non tracés, unités de base identiques aux pièces sources ; conversions et lots/séries sont explicitement bloqués avec explication. Transferts des quantités réservées, traçabilité lots/séries, valorisation comptable / FX, immobilisations et Messaging restent les lots suivants. Les coûts liés à une source sont conservés sans prétendre à un moteur de valorisation comptable. RET fournisseur sort physiquement sans modifier le statut de réception historique ni générer un avoir.

Stock S03 : dashboard comme entrée du module, pages Stock indépendantes et catalogue de types d’opérations. Décision utilisateur du 11 octobre 2026 : coût standard pour tout le stock au démarrage ; prévoir CUMP et FIFO et un changement de méthode réservé aux administrateurs, daté, audité et sans réécriture des mouvements historiques. Le coût standard de valorisation est distinct du coût de calcul du prix de vente ; conserver les coûts d’achat réels par affaire et les écarts au standard. Le lot V01 ci-dessous implémente le calcul, le paramètre et les migrations ; les reprises d’ouverture restent explicitement validées par l’administrateur. Contrat fonctionnel dans 04-FUNCTIONAL-SPECS.md, section Valorisation.


11 octobre 2026 — Stock V01 : moteurs standard / CUMP / FIFO et méthode globale administrateur réalisés. Standard par défaut ; référentiel de coûts de valorisation séparé du pricing commercial, reprises explicites des anciens stocks et révisions auditées. Journal de valorisation immuable, couches restantes, conservation de valeur en transit, corrections et retours, projection dans dashboard / disponibilités / fiche produit. Changement de méthode daté sans réécriture d’historique, régularisation vers standard, reprise moyenne vers CUMP/FIFO. EUR uniquement ; Sage, frais / change / factures et comptabilisation restent les prochains raccordements.

Stock S04 — décision utilisateur : supprimer la distinction code / trigramme, conserver uniquement Code (MEU / SEV). Valorisation dans un onglet distinct des entrepôts et emplacements.

Réceptions fournisseur — validation BC crée désormais une attente IN préremplie, remplaçant l’ancienne action Préparer une réception. Stock uniquement à réception effective ; reliquats et annulations conservés côté serveur. Migration de reprise 1791710009. Envoi e-mail reste distinct et non simulé.

11 octobre — fiche et bon de réception fournisseur repris : expéditeur / BC source, affaires dans les lignes, entrepôt modifiable en attente, destinations et quantités requises, retrait des coûts / destination chantier / reprise de quantités, notes conformes au devis. Snapshot des libellés de bon à réalisation et parcours magasinier sans accès aux prix. Hooks PocketBase à actualiser ; pas de migration supplémentaire.

11 octobre — tags code / client partagés sur les affaires Stock et Achats ; quantités de ventilation dans les réceptions, agrégation multi-affaires dans les listes, Provenance remplace Opération pour les réceptions. Proposition Stock principal au changement d’entrepôt et ouverture de la commande fournisseur dans la fiche partagée en popup. Pack PocketBase seulement ; aucune migration supplémentaire.

11 octobre 2026 — Refonte dashboard Stock et catalogue Opérations : priorités de mouvements, files réceptions / inventaires, disponibilité, entrepôts et ventilation de la valeur HT ; catalogue quotidien séparé des opérations spécifiques. Filtre En cours côté serveur et tri des dates non renseignées en fin. Pas de nouvelle migration.

11 octobre 2026 — Courbes intégrées aux sept tuiles Opérations : réalisé vert / prévu magenta sur J−2 à J+7, détails quotidiens, date d’exécution serveur et alertes sans date / retard. Projection agrégée indépendante de la pagination. Aucune migration supplémentaire.

11 octobre 2026 — Dashboard général : premiers raccordements de lecture aux estimations CRM, commandes clients / marges historiques, achats engagés, tâches assignées, échéances CRM et activité des modules accessibles. La sélection Mois / Trimestre / Année pilote les agrégats serveur ; facturation / paiements / réalisé complet restent à connecter aux modules propriétaires. Aucun nouvel objet comptable, aucune conversion de devise implicite. Hooks à installer, aucune migration nouvelle.

11 octobre 2026 — Calendrier : événements manuels personnels / équipe, propriétaire seul en écriture, ajout / modification / retrait en popup et Mon planning. Collection calendar_events indépendante des projections CRM / Stock, mutation serveur auditée et permissions calendar.read / calendar.write. Sans synchronisation Outlook ni invitations automatiques.

11 octobre 2026 — Courbes financières en arrière-plan des indicateurs du dashboard, même période / données que les montants. Agrégation serveur par jour / semaine / mois, devises et pertes préservées. Facturé sans courbe jusqu’au raccordement Billing ; hooks mis à jour, pas de nouvelle collection ni migration.

12 octobre 2026 — Appels d’offres : À télécharger avant À analyser, dossier autonome, valeur de départ existante conservée. Migration additive et Kanban desktop ajusté à la largeur disponible suivant les colonnes repliées / ouvertes ; composant partagé CRM / AO.

12 octobre 2026 — Apparence / Sidebar : huit réglages sidebar supplémentaires, conservation des paramètres existants et aperçu déplié / replié isolé. Migration additive JSON settings_ux, validation serveur et tokens CSS communs.

Sidebar — complément : réglages de couleurs prioritaires dans Sidebar, fond / textes / icônes / titres / sous-menus / sélection / survol ; charte initiale préservée et aperçu local partagé.

Apparence — classement en six onglets, Sidebar distincte du menu des modules, aperçus contextuels et retrait des sliders numériques selon la demande utilisateur.

12 octobre 2026 — Apparence : couleurs des bordures de tableaux clair / sombre, à côté des couleurs d’en-tête existantes, propagation via le viewport partagé et migration additive 1791710013.

12 octobre 2026 — Analytique A01 : affaire racine + enfants stables de commandes, reprise non destructive des confirmations existantes, ventilations achats et mouvements liés. Analyse commune affaire / commande / Finance ; droits serveur indépendants opérationnel / financier / coûts individuels, périmètre own / all et KPI dashboard filtrés. Temps, frais, facturation et coûts collaborateurs restent à raccorder aux modules propriétaires avant marge réelle complète ; pas de répartition automatique des coûts communs ni de recalcul historique.

12 octobre 2026 — Analyse : bloc heures BE / production et lecteur des sources TimeReport / Planning canoniques préparés. Attente de clarification de la source (module Horizon à créer ou outil externe) ; aucun module de saisie, import ou coût horaire inventé dans ce complément.

Mon compte — 12 octobre 2026 : édition identité / photo protégée et changement de mot de passe natif livrés ; droits et adresse de connexion restent administrés séparément. Réutilisation core_users existant, services / repository Auth, audit et tests serveur / navigateur. Aucun raccordement mutable à la fiche Employé.

12 octobre 2026 — T01 / I01 lancés : lots / séries opérationnels, parc interne et préparation d’immobilisations ; destinations d’achats internes par ligne, sans création artificielle d’affaires client. Qualification financière séparée, Sage inchangé.

12 octobre 2026 — T01 / I01 premier périmètre opérationnel vérifié localement : lots/séries saisis à réalisation, réservations par identité, transferts/transit, retours, comptage (série manquante retrouvée), quarantaine/péremption, historique et mentions documentaires. Destinations d’achats par ligne jusqu’à réception : consommation, parc, immobilisation sans affaire artificielle, OUT d’affectation lié à IN dans une transaction. Parc avec affectation RH protégée, localisation, état et fil ; registre d’immobilisations avec base d’acquisition figée, mise en service, référence comptable et déclassement motivé préalable au retour au stock. Aucun export/écriture/amortissement Sage automatique. Matériel/SAV/RMA, prêts/location et migration d’identités d’un ancien stock restent des compléments distincts. Installation NAS à réaliser via pack PocketBase uniquement et migration 1791710018 ; aucune mutation NAS faite depuis cette session.

Analytique fixe A02 — comptes Stock 99101 et Interne 99201..99205 configurables par numéro/libellé dans Paramètres. Ventilation d’achat centralisée, dérivation serveur de la destination physique, héritage des demandes et protection des lignes client. Identités stables indépendantes des numéros ; audit, contrôle concurrent et transactions, documents validés non réécrits. Migration 1791710019 nécessaire avec hooks Accounting/Purchasing ; aucun nouveau référentiel analytique parallèle ni écriture Sage automatique.

12 octobre 2026 — Confirmation client : préparation des besoins d’achat intégrée sous les boutons, simultanée avec réservation, indicateurs prêts après application ; confirmation atomique commande + réservations + demande draft. Les achats utilisent le service d’approvisionnement existant et la fiche canonique reste disponible en popup depuis la commande.

12 octobre 2026 — CGV par défaut explicites dans les paramètres ; nouveaux devis préremplis (conditions désignées, titre opportunité, ligne initiale), HT prioritaire au TTC, recherche produit sans sélection intermédiaire et fiche produit par flèche de ligne.

12 octobre 2026 — Correctif Core Activity : le log serveur confirme un timeout 30 s du COUNT DISTINCT à jointures polymorphes sans ON. Lecture via routes Core ciblées par fiche, permissions explicites et projection bornée, sans modification de données ou ouverture des collections privées ; avatar autorisé par sa source. Pack PocketBase complet, redémarrage requis, aucune nouvelle migration pour ce correctif.

### Consolidation documentaire et publication Git — 12 octobre 2026

Évolutions applicatives poussées sur main : `8e0de25` et `f9bf927`, workspace propre après push. Dernière vérification `pnpm check` : lint / TypeScript / 205 tests Vitest (46 fichiers) / build réussis. Correctif Activity : 14 tests serveur, scénarios navigateur ciblés devis, AO, avatar et achats ; pas une nouvelle exécution de toute la suite E2E. Installation NAS non effectuée depuis cette session. Audit documentaire : suivi global remis à jour, décisions structurantes H-071 à H-076, limites TimeReport/Messaging/Sage/MFA explicites et contradictions historiques corrigées ; aucun code applicatif modifié.

12 octobre 2026 — Règle demandée par l’utilisateur : documentation de l’avancement après chaque intervention, inscrite dans AGENTS.md et les règles de tenue du suivi. Audit final limité à la documentation ; aucune modification applicative ou installation NAS.

### Prise de connaissance pour reprise du développement — 12 octobre 2026

- Lecture du README et d’AGENTS.md ; repérage des documents canoniques, des contrats transverses, de la base UX Contacts et des travaux actifs. Examen du routage, des couches Contacts (page / hook / service / repository), des composants partagés, des routes Activity et des configurations de vérification.
- Vérifications : inventaire local et `git status --short` ; modifications documentaires préexistantes conservées. Aucun lint, typecheck, test applicatif ou contrôle navigateur exécuté pour cette prise de connaissance ; aucun audit exhaustif du code revendiqué.
- Suite : préciser le prochain besoin métier, puis approfondir ses sections documentaires et son code avant modification. Statuts et compteurs inchangés ; priorité de recette NAS du fil conservée.
- Livraison : note locale uniquement, sans commit/push, nouveau pack ni installation NAS ; installation du correctif Activity toujours non confirmée.

### Ordre des sous-menus Stock — 12 octobre 2026

- Navigation commune réordonnée : Opérations → Produits → Disponibilités → Inventaires → Parc interne, selon la demande utilisateur ; destinations conservées.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 205 tests Vitest et build) ; ordre rendu contrôlé dans Chromium sur le frontend local en mode aperçu. Pas de recette authentifiée NAS ; avertissement de build sur les chunks volumineux.
- Livraison locale uniquement, sans commit/push, pack ni installation NAS. Aucun travail restant pour cet ajustement ; statuts et compteurs des lots inchangés.

### Harmonisation des paginations sur la référence CRM — 12 octobre 2026

- Composant partagé `HListPagination` extrait du rendu CRM : compteur « Page N / M » et chevrons compacts dans le fil d’Ariane, style et accessibilité communs. Raccordement Contacts, CRM/AO, devis/commandes, achats, produits, disponibilités, opérations/inventaires, parc interne, immobilisations et analyses ; pagination Analyse remontée depuis le pied du tableau. Critères et callbacks métier préservés, blocage pendant les requêtes et les opérations CRM conservé. Règle durable dans le document 07.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 205 tests Vitest, build) ; 2 tests Playwright authentifiés locaux réussis, couvrant 14 parcours en clair/sombre/mobile et navigation entre pages avec conservation URL / blocage en chargement. Captures Analyse inspectées dans les trois modes ; `git diff --check` réussi. Suite E2E complète et recette NAS non exécutées ; avertissement de build sur les chunks volumineux toujours présent. Détail dans le document 09.
- Livraison locale, sans commit/push, pack ni installation NAS. Aucun changement de schéma, de permissions ou de données métier. Ajustement terminé localement ; statuts et compteurs des lots inchangés, installation du correctif Activity toujours non confirmée.

### Placement des smart boutons des demandes d’achat — 12 octobre 2026

- Le raccourci Commandes fournisseurs quitte le bloc sous la frise et réutilise HRecordLinks dans le slot related du fil d’Ariane. Compteur et lien filtré par demande conservés ; variante commune intégrée pour les popups, état des préparations disponible au survol. Style local obsolète supprimé ; contrat précisé dans le document 07.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 205 tests Vitest, build), `git diff --check` réussi. Parcours Playwright Achats réussi avec placement du lien, consultation des commandes et contrôles clair/sombre/mobile ; captures inspectées. Dans la même exécution, scénario Commande client échoué sur un retour à la connexion avant Finaliser Devis, puis réussi isolément ; anomalie de session groupée à surveiller (document 09). Dossier utilisateur non recetté sur son instance ; aucune mutation de ses données.
- Livraison : correctif local, sans commit/push, pack ou installation NAS. Aucun changement serveur, de schéma ni de permissions. Statuts et compteurs inchangés ; recette de la fiche utilisateur après rechargement, installation du correctif Activity toujours non confirmée.

### Accueil Achats : DA en attente et Nouvelle commande — 12 octobre 2026

- Clic Achats / route racine → liste des DA non archivées draft / validated / partially_ordered via le filtre serveur pending, sans nouveau statut métier. Cartes partagées En attente / Brouillon / Validée / Partiellement traitée, tri récent et filtres URL conservés, Nouvelle commande principale à droite et Nouvelle demande secondaire. Tableau regroupé borné dans GroupedResults pour éviter un débordement mobile. Contrats docs 04 / 07 et installation doc 06 actualisés.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 205 tests Vitest, build), 19 tests serveur Achats et 3 tests Playwright ciblés réussis (accueil Achats et régression paginations), captures clair/sombre/mobile inspectées, `git diff --check` réussi. Première recette mobile a révélé le débordement corrigé ; attente du rendu responsive ajoutée au test. Suite E2E complète et recette NAS non exécutées ; avertissement de build sur les chunks volumineux inchangé.
- Livraison locale sans commit/push ; pack PocketBase seulement préparé à `/private/tmp/horizon-purchasing-pending-nas.zip` (169 fichiers hooks/assets/migrations + manifeste SHA-256), contenu et empreintes vérifiés, ni frontend, base ni secret. Aucun nouveau schéma / permission. Installer les hooks et redémarrer l’instance cible pour activer pending, aucune migration nouvelle pour cet ajustement. NAS non installé par l’agent ; statuts et compteurs des lots inchangés.

### Accueil Achats commun aux DA et bons de commande — 13 octobre 2026

- Complément demandé et confirmé : `/purchasing` réunit DA et BC dans une liste, type visible et lien vers chaque fiche canonique. Cartes DA en attente / Brouillon / Validée / Bons de commande ; recherche dans le contexte Achats, regroupement, tri et pagination globaux côté serveur. Ouverture puis retour breadcrumb conserve l’accueil et ses critères ; sous-listes dédiées conservées, Nouvelle commande reste à droite. Route de lecture overview réutilisant les filtres et permissions Achats ; aucun nouveau statut, schéma ou formulaire. Contrats actualisés docs 03 / 04 / 05 / 07, installation doc 06.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 207 tests Vitest, build), 21 tests serveur Achats réussis, exécution finale de 3 tests Playwright ciblés réussie (liste DA/BC et régression des paginations), captures clair/sombre/mobile inspectées. Première assertion de type corrigée pour cibler le contenu du badge plutôt que le nom accessible de la cellule incluant le lien de ligne ; pas de défaut de donnée constaté. `git diff --check` réussi. Suite E2E complète et recette NAS non exécutées ; avertissement de build sur les chunks volumineux inchangé.
- Livraison locale, sans commit/push ni déploiement. Pack consolidé PocketBase uniquement préparé à `/private/tmp/horizon-purchasing-overview-nas.zip`, 169 fichiers hooks/assets/migrations + manifeste SHA-256, ZIP et empreintes vérifiés ; ni frontend, données ni secrets. Installer les hooks actualisés et redémarrer PocketBase pour overview, aucune migration nouvelle. NAS non installé par l’agent ; statuts et compteurs des lots inchangés.

### Investigation : préparation des BL à réception et livraisons partielles — 13 octobre 2026

- Besoin utilisateur examiné : paramètre préparant les BL draft après réception affectée à des affaires, préparation préremplie depuis commande même sans stock, indicateur prêt à livrer et création automatique du reliquat après livraison partielle. Lecture des contrats Stock/Ventes/Achats, des paramètres Stock, des sources de mouvements, des validations et du mécanisme existant de reliquats de réceptions. Préremplissage depuis source disponible via action explicite ; création automatique de BL client et indicateur de disponibilité non constatés dans le périmètre examiné.
- Approche proposée : réutiliser les opérations OUT et leur éditeur ; préparation serveur commune, rattachement aux lignes de commandes clients confirmé plutôt qu’à une affaire ambiguë, déduction des livraisons réalisées et des brouillons déjà préparés, indicateur calculé sur stock disponible / réservations de la commande, validation partielle transactionnelle avec reliquat draft lié. Paramètre versionné et contrats à préciser avant implémentation.
- Vérifications : lectures et inventaire Git uniquement ; aucun nouveau test ou contrôle navigateur pour cette investigation, aucune mutation applicative ou NAS. Suite : présenter le fonctionnement proposé à l’utilisateur avant développement ; statuts et compteurs des lots inchangés. Livraison : note locale, sans commit/push ou nouveau pack ; installation NAS non effectuée.

### BL préparés, disponibilité et reliquats — 13 octobre 2026

- Périmètre livré localement : règle Paramètres Stock → Livraisons, préparation OUT draft depuis commande même à stock nul, préparation à réception unique ou multi-affaires, affectation explicite des ambiguïtés, indicateur prêt à livrer fiche/liste et confirmation des quantités réellement livrées avec sélection des séries. Livraison 2/4 → mouvement de 2 et reliquat draft lié de 2 dans une transaction ; brouillons existants et sorties archivées pris en compte sans doublon. Source client protégée et brouillons manuels conservés. Contrats durables docs 03/04/05/06/07.
- Intégrité : migration additive 1791840000, aucune réécriture des mouvements ou snapshots historiques ; index ciblés, agrégations de disponibilité bornées avec ON explicites, aucune modification du fil Activity ni des API Rules privées. Test de reprise réussi sur base antérieure : historique identique, double migration et règle initialement désactivée.
- Vérifications exécutées : pnpm check réussi (lint, TypeScript, 214 tests Vitest, build), Stock 28 tests serveur, traçabilité 37, valorisation 6 et Activity 14 réussis, plus test de reprise de migration réussi. Trois parcours Playwright BL et deux parcours Stock existants réussis ; captures confirmation, affectation, liste clair/sombre/mobile et onglets Paramètres inspectées. L’exécution groupée a rencontré l’assertion responsive immédiate du Dashboard existant ; Stock passe isolément. Détails et limites doc 09. Avertissement de build sur les chunks volumineux conservé ; aucune suite exhaustive ni recette NAS revendiquée.
- Livraison : fichiers locaux sans commit/push. Pack PocketBase uniquement `/private/tmp/horizon-deliveries-nas.zip`, 172 fichiers hooks/assets/migrations + manifeste SHA-256 ; ZIP et empreintes vérifiés, sans frontend, base ou secrets. NAS non installé. Suite : sauvegarde et application de migration avec hooks, livraison frontend, activation volontaire de la règle puis recette cible. O03 reste À vérifier, compteurs inchangés ; périmètre actif actualisé. Installation du correctif Activity toujours non confirmée.

### Référence fournisseur proposée sur la fiche produit — 13 octobre 2026

- À l’ajout d’une ligne fournisseur, reprise de la Référence produit (sku) actuellement saisie, y compris avant sauvegarde. Champ modifiable ; modification du produit ensuite sans écrasement des références des lignes existantes. Préremplissage frontend uniquement via SupplierPrices existant ; aucun changement de schéma, de permissions ou des données enregistrées. Contrat précisé dans le document 04.
- Vérifications : pnpm check réussi (lint, TypeScript, 214 tests Vitest et build), contrôle lint/typecheck final et git diff --check réussis. Parcours Playwright ciblé réussi : valeur proposée, modification manuelle, deuxième ajout après changement du sku, conservation de la première référence puis sauvegarde/rechargement. Scénario Catalogue complet tenté : assertions fournisseur réussies puis timeout sur ancien bouton de sélection produit dans Devis ; suite complète non annoncée comme réussie. Première fixture ciblée corrigée pour utiliser category.label. Avertissement existant sur les chunks volumineux conservé.
- Livraison : locale, sans commit/push, nouveau pack ou installation NAS. Aucun travail restant sur ce préremplissage ; ancien scénario Catalogue/Devis à actualiser séparément. Statuts et compteurs des lots inchangés.

### Publication Git des ajustements Achats / Stock — 13 octobre 2026

- Commits applicatifs créés et poussés sur origin/main : 70310fc (accueil DA/BC, navigation et pagination partagée), 8173eb8 (BL préparés, disponibilité, quantités partielles et reliquats transactionnels), 81bbf9e (référence fournisseur proposée). Documentation canonique et règle de suivi AGENTS.md consolidées dans le commit documentaire associé.
- Vérifications de publication : git fetch origin puis comparaison HEAD/origin/main avant commit (aucune divergence), git diff --check réussi, push applicatif confirmé. Vérifications applicatives conservées dans les entrées précédentes : pnpm check, tests serveur et navigateur ciblés ; pas de nouvelle exécution exhaustive à l’occasion du push. Limite connue du scénario Catalogue/Devis conservée.
- État : code applicatif publié sur Git, documentation préparée pour publication dans la même intervention. Aucun déploiement NAS ni installation de migration effectué ; pack BL préparé inchangé. Prochaine action : livraison cible avec sauvegarde, migration 1791840000, hooks et frontend cohérents puis recette métier. Statuts des lots et compteurs inchangés.

### Popup Ajouter un produit : ellipses et en-tête fixe — 13 octobre 2026

- ProductPicker partagé Ventes / Achats / Stock : marque, référence, nom, description et fournisseur tronqués avec ellipse, texte complet au survol ; montants contenus dans leurs cellules. Le défilement se fait dans un seul viewport de tableau et ses en-têtes restent fixés en haut. Actions et redimensionnement conservés ; largeur minimale de 800 px pour le défilement horizontal interne mobile. Contrat UX actualisé doc 07, aucun schéma ou donnée métier modifié.
- Vérifications : pnpm check réussi (lint, TypeScript, 214 tests Vitest et build), contrôle lint/typecheck complémentaire et git diff --check réussis. Test Playwright ciblé réussi avec 18 produits aux textes longs : limites des cellules, ellipse CSS, texte complet au survol, position d’en-tête après scroll, clair/sombre/mobile, absence de débordement de page et ajout effectif depuis le popup. Captures inspectées dans les trois modes ; largeur mobile ajustée après inspection puis parcours rejoué avec succès. Première assertion corrigée pour le nom accessible incluant le bouton de redimensionnement. Suite exhaustive non rejouée ; avertissement de build existant sur les chunks volumineux.
- Livraison locale uniquement, sans commit/push, pack ou déploiement NAS pour ce correctif. Aucun travail restant pour cet ajustement ; statuts et compteurs inchangés.

### Sous-titre de devis et bordures des titres — 13 octobre 2026

- Bouton Sous-titre entre Titre niveau 3 et Note ; ligne descriptive persistée et reprise dans la commande confirmée, sans quantité/montant ni quatrième niveau hiérarchique. Styles du studio : Sous-titre indépendant et bordures Haut/Bas/Gauche/Droite avec couleur et épaisseur bornée, état de sélection partagé. Rendus React/RichText, HTML paginé et HTML destiné à Gotenberg raccordés ; ancien trait inférieur conservé en absence de réglage explicite. Aucune publication ou donnée historique réécrite. Contrats canoniques docs 04/05/07, installation doc 06.
- Migration additive 1791840001_quote_subtitle sur kind des lignes devis/commandes ; validations JSON frontend/serveur et allowlists étendues, droits existants conservés. Test historique CGV fiabilisé pour viser sa migration et pas la dernière migration disponible ; aucune suppression de schéma réel.
- Vérifications : pnpm check réussi (lint, TypeScript, 218 tests Vitest / 49 fichiers, build), Ventes 22 tests et Documents 23 tests serveur réussis. Deux parcours Playwright ciblés réussis (Sous-titre/bordures/pagination et régression Ligne/Note) ; relecture sauvegardée, couleurs/côtés dans les cellules paginées visibles et captures studio clair/sombre/mobile inspectées. PDF Chromium local généré depuis le HTML d’aperçu ; transmission PDF serveur vérifiée avec convertisseur de test. Pas de recette du vrai Gotenberg NAS ni suite E2E exhaustive. Assertions de fixture corrigées : droits de validation, attente de chargement, libellé Aperçu / PDF et arrondi des pixels ; avertissement build existant conservé.
- Livraison locale, sans commit/push ou installation NAS. Pack PocketBase uniquement `/private/tmp/horizon-subtitles-nas.zip` : 173 fichiers hooks/assets/migrations + manifeste SHA-256, ZIP et empreintes vérifiés, sans frontend, base ni secret. Suite : sauvegarde/migration/hooks + frontend correspondants sur cible, recette Gotenberg puis republication explicite du modèle voulu ; fiche utilisateur citée non modifiée depuis cette intervention. Statuts et compteurs des lots inchangés, travaux actifs actualisés.

### Conservation des lignes vides de devis — 13 octobre 2026

- Retrait du filtrage destructif à la sauvegarde : lignes entièrement vides et notes vides conservées comme kind spacer, avec ordre et duplication, sans produit/quantité/unité/montant. Saisies partielles toujours contrôlées ; espace édité avec du texte devient Note. Ajout de produit/ligne ne réutilise que le placeholder initial isolé, jamais un espace enregistré. HTML/PDF conserve une cellule vide de 24 px pleine largeur sans chiffres ni bordures. Contrats docs 04/05/07 actualisés.
- Migration additive 1791840002 sur types de lignes devis/commandes et description facultative au niveau collection ; description non vide et invariants financiers restent vérifiés serveur pour les autres types. Collections privées et règles inchangées, historiques non réécrits ; confirmation client conserve les espaces.
- Vérifications : pnpm check réussi (lint, TypeScript, 220 tests Vitest / 49 fichiers, build), Ventes 23 tests et Documents 24 tests serveur réussis ; trois parcours Playwright ciblés réussis (espacements, préremplissage/produit et Sous-titre/bordures). Rechargement, duplication, espaces consécutifs et conversion en Note recettés ; capture paginée inspectée. Transport PDF avec convertisseur de test, aucune recette Gotenberg NAS réelle ni suite E2E exhaustive. Ancienne assertion de suppression de ligne initiale adaptée à la demande ; clé de création de fixture Documents allongée. Avertissement de chunks volumineux conservé.
- Livraison locale sans commit/push ni installation NAS. Pack PocketBase uniquement `/private/tmp/horizon-quote-spacers-nas.zip` : 174 fichiers hooks/assets/migrations + manifeste SHA-256 ; ZIP/contenu/empreintes vérifiés, sans frontend/base/secret. Suite : migration/hooks et frontend cohérents sur cible puis recette PDF réelle. Travaux actifs actualisés, statuts et compteurs des lots inchangés.

### Publication Git des correctifs produits et devis — 13 octobre 2026

- Commits applicatifs créés et poussés sur origin/main : 2c864fe (textes tronqués et en-têtes fixes du sélecteur produit partagé), 9c65f74 (Sous-titre, bordures documentaires et conservation des espacements de devis). Documentation canonique et suivi consolidés dans le commit documentaire associé.
- Vérifications de publication : git fetch origin, absence de divergence avant commit, git diff --check réussi et push applicatif confirmé. Vérifications fonctionnelles précédentes conservées : pnpm check avec 220 tests Vitest, Ventes 23 / Documents 24 tests serveur, parcours navigateur ciblés réussis. Aucune nouvelle recette exhaustive pour ce push.
- État : code publié sur Git ; documentation préparée pour publication dans cette même intervention. Workspace à vérifier après le push documentaire. Aucun déploiement NAS ni application distante des migrations 1791840001/1791840002 ; pack consolidé devis-espacements préparé inchangé. Suite : installation cohérente hooks/migrations/frontend et recette PDF Gotenberg cible. Statuts et compteurs des lots inchangés.

### Investigation et proposition de facturation clients / fournisseurs — 13 octobre 2026

- Lecture des contrats Facturation / règlements, factures et avoirs clients, factures fournisseurs, rapprochement Achats, sécurité Finance et adapters Sage/SUPER PDP (docs 04/05/06/08). Examen des modules, migrations et navigation : entrée Facturation prévue, module billing opérationnel non constaté ; A03 et A06 restent À faire.
- Proposition à présenter : module Billing avec listes clients/fournisseurs/avoirs/règlements utilisant le design commun ; brouillons clients depuis commande/BL ou saisie explicite, facturation partielle/acompte/solde et prévention des doubles quantités ; factures fournisseurs avec pièce originale et rapprochement commande/réception multi-affaires, écarts contrôlés. Validation, paiement, synchronisation comptable et transmission électronique suivis séparément. Versions figées et corrections par avoirs, analytique commun, serveur transactionnel et idempotent.
- Avant implémentation : préciser les contrats de sources multiples et lignes facturées, acomptes/déductions, avoirs fournisseurs et allocations de règlements dans le modèle canonique ; choix métier non considérés comme déjà validés. Premier lot proposé : factures/avoirs/échéances et contrôles internes, puis adapters Sage/SUPER PDP selon accès/configuration disponibles ; PDF seul non assimilé à une transmission électronique.
- Vérifications : lectures, recherches de fichiers et état Git uniquement ; aucun nouveau test, contrôle navigateur, migration ou mutation applicative pour cette investigation. Livraison : note locale sans commit/push, pack ou installation NAS. Suite : présenter le fonctionnement au demandeur puis cadrer le premier lot ; statuts et compteurs inchangés.

### Facturation clients / fournisseurs B01 — 13 octobre 2026

- Premier lot approuvé livré localement : entrée Facturation vers dashboard, listes et fiches clients/fournisseurs, factures manuelles ou préparées depuis commandes / BL / réceptions, partiels, acomptes et soldes avec déductions, avoirs, échéances, règlements et remboursements. Pièce et référence originales fournisseurs, écarts justifiés, analytique partagé, lignes triables, modèles et aperçus Documents, fil d’activité et smart buttons sources. Soldes calculés côté serveur, y compris pour pièces archivées ; identité, prix, taxes, sources et base de coût figés à validation. Coût inconnu conservé comme tel. Contrats durables actualisés docs 03/04/05/06/07/08 ; limites et recette dans doc 09.
- Intégrité : migration additive `1791840003_billing.js`, validation/numérotation/allocations transactionnelles, protection des sources et des historiques, clés d’idempotence et index de références fournisseurs. Base neuve, double migration et reprise d’une base antérieure testées sans altération des données conservées. Aucun changement des règles de liste Activity ni nouvelle jointure polymorphe de son fil ; règles natives ciblées pour les pièces Billing et permissions explicites. Corrections de relecture des avoirs et des arrondis couvertes par tests.
- Vérifications réellement exécutées : `pnpm check` final réussi (lint, TypeScript, 221 tests Vitest / 49 fichiers, build), 15 tests serveur Billing et 111 tests de régression affectés réussis ; Activity / Ventes rejoués après ajustements serveur (37 tests). Cinq parcours Playwright ciblés réussis, captures inspectées, paramètres clair/sombre/mobile et toolbar Documents harmonisés ; `git diff --check` réussi. Pas de suite exhaustive ni recette NAS. Conversion PDF testée avec convertisseur local de test, pagination HTML avec Chromium ; Gotenberg réel restant à recetter. Avertissement de chunks volumineux conservé.
- Livraison : locale, sans commit/push ni installation NAS. Pack PocketBase `/private/tmp/horizon-pocketbase-billing-20261013.zip` préparé : 186 fichiers hooks/assets/migrations plus manifeste et instructions, contenu et empreintes vérifiés, sans frontend, base, executable ni secret. SHA-256 : `e91bf1f9646b21e3ac3d2ed9497905fa36da948747a626aae0487c4145d8a9e2`. Suite : sauvegarde cohérente, installation conjointe migration/hooks/frontend, configuration émetteur/droits et recette cible PDF. Sage et SUPER PDP restent en standby conformément à la demande ; comptabilité interne, multi-devise et TVA avancée conservées au contrat futur. A03 passe de À faire à En cours ; Finance : 4 En cours / 2 À faire. Total 46 lots : 2 Terminés, 19 En cours, 10 À vérifier, 0 Bloqué, 15 À faire ; travaux actifs actualisés. Installation du correctif Activity toujours non confirmée.

### Conditions de paiement clients et cases de défaut — 13 octobre 2026

- Livré localement : référentiel de plusieurs conditions de paiement dans Paramètres → Facturation, condition globale unique via case rose en colonne, choix par combobox sur fiche société → Comptabilité, reprise sur facture manuelle/préparée, changement de condition et texte/échéance personnalisables en brouillon. TVA par défaut sélectionnée dans le tableau via la même case rose. Conditions retirées archivées ; factures enregistrées ou validées jamais réécrites par un changement du référentiel/client. Tables lisibles à défilement interne sur mobile ; option vide explicite du combobox partagé dédupliquée. Contrats docs 04/05/07, installation/sécurité doc 06 ; Sage/SUPER PDP inchangés, contrat doc 08 vérifié.
- Migration additive `1791840004_payment_terms.js`, relations facultatives client / facture / défaut, ancien délai et texte conservés. Référentiel natif fermé, lecture autorisée Contacts ou Billing, écritures administrateur transactionnelles et auditées, délai entier et condition active contrôlés serveur. Aucun changement de règle Activity, de donnée réelle ou d’historique existant. Premier périmètre : délai calendaire en jours ; échéanciers avancés restent explicites.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 225 tests Vitest / 50 fichiers, build), 17 tests serveur Billing et 25 Contacts réussis ; deux scénarios conditions/reprise rejoués après contrôle final des dates. Quatre parcours Playwright Billing réussis, parcours conditions rejoué après inspection mobile avec succès ; captures clair/sombre/mobile et client inspectées, `git diff --check` réussi. Reprise depuis Billing précédent et double migration préservent facture validée/snapshot/échéance et défaut historique. Chargement du record de paramétrage après extension de schéma corrigé pendant les tests de migration ; assertions adaptées aux refus effectifs 400/403. Avertissement de chunks volumineux conservé ; suite exhaustive et recette NAS/Gotenberg réel non exécutées.
- Livraison : locale, sans commit/push ni installation NAS. Pack PocketBase consolidé `/private/tmp/horizon-pocketbase-payment-terms-20261013.zip` préparé : 188 fichiers hooks/assets/migrations plus manifeste et instructions, ZIP/contenu/empreintes vérifiés, sans frontend/base/secrets. SHA-256 `0a0aa97ec230aae432a8d19ce901c68d2f207bc657ff6cfb3168c92d32b52640`. Suite : installation cohérente migration/hooks/frontend avec sauvegarde, configuration de l’émetteur et recette cible. A03 reste En cours ; travaux actifs actualisés, statuts et compteurs inchangés. Installation Activity toujours non confirmée.

### Harmonisation facture et référence de commande client — 13 octobre 2026

- Demande confirmée livrée localement : frise HProgressSteps Brouillon / Validée / Soldée, smart buttons Commandes clients / Bons de livraison dans le fil d’Ariane, onglets Informations / Échéancier / Conditions / Pièces jointes avec grilles et panneaux partagés, référence externe de commande sur fiche facture et modèle standard. Commande confirmée : référence modifiable dans Informations avec Enregistrer existant et flèche vers le popup de la preuve protégée ; colonne finale N° commande client dans la liste, vert si renseignée / rouge Attente Commande. Aucun nouveau design de frise, onglet, badge ou popup. Contrats docs 03/04/05/06/07 ; standby Sage/SUPER PDP doc 08 conservé.
- Intégrité : migration additive `1791840005_invoice_customer_order.js`, sans backfill historique ; référence facture snapshotée, changement de commande indépendant. Route de correction Sales transactionnelle/versionnée avec droits de confirmation, audit et événement explicite, prix/lignes/preuve/snapshot commercial inchangés. Relations lues par projections propriétaires Sales/Stock, sans élargissement de règle Activity ; boutons limités aux droits sources. Panneaux montés et onglet URL préservés, changements internes exclus de la confirmation de sortie du brouillon.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 225 tests Vitest / 50 fichiers, build), Billing 18 / Ventes 24 / Documents 24 tests serveur réussis. Reprise de migration et double application préservent la facture historique ; reprise rejouée isolément, réussie. Cinq parcours Playwright Billing réussis en exécution finale groupée ; captures clair/sombre/mobile, onglets, liste, champ et popup inspectées, `git diff --check` réussi. Blocage des changements d’onglet découvert et corrigé pendant la recette, puis parcours rejoués. Pas de suite exhaustive ni de recette multi-pièces dans le navigateur, Gotenberg réel ou NAS ; avertissement de chunks volumineux conservé, limites doc 09.
- Livraison locale, sans commit/push ni installation NAS. Pack PocketBase consolidé `/private/tmp/horizon-pocketbase-invoice-layout-20261013.zip` préparé : 191 fichiers hooks/assets/migrations plus manifeste et instructions, ZIP/contenu/empreintes vérifiés, sans frontend/base/executable/secrets ; SHA-256 `969be18cfc5b484ddaeddaa9629e3c1c613ea6457d4e50c89155f3fd18d1abdf`. Suite : sauvegarde cohérente, migration/hooks/frontend sur cible puis recette PDF réelle. A03 reste En cours ; travaux actifs actualisés, statuts et compteurs inchangés. Installation Activity toujours non confirmée.

### Commande client : actions conditionnelles et pièce ajoutable — 13 octobre 2026

- Livré localement : « Attente Commande » uniformisé dans code, confirmations, listes, factures, affichage de référence et documentation ; anciens marqueurs présentés avec cette casse sans réécrire les snapshots/fichiers. Actions à droite des onglets, ordre Achats / Stock / Livraison / Facture, affichées suivant les besoins et permissions des services propriétaires. Informations : Opportunité / Titre, puis Commercial / Référence client / Date de commande ; date/validité du devis retirées en état commande. Titre et colonnes du tableau fixes via HTableViewport ; flèche toujours présente pour aperçu ou ajout ultérieur de première pièce. HRecordTabs, grilles, contrôles, popup et zone de dépôt partagés, aucune palette propre au module. Contrats docs 04/05/06/07 ; intégrations doc 08 inchangées.
- Intégrité : ajout de document sur commande confirmée non archivée, version fraîche et droits sales.order.confirm, MIME/taille côté serveur, transaction et audit. Nouvel événement document/fichier protégé, preuve initiale conservée ; prix, lignes, date et snapshots inchangés. Commande ancienne sans pointeur de preuve acceptée pour un premier ajout. Lecteur Inventory de reste à livrer, capacité de réservation nette des sélections existantes ; préparations toujours contrôlées serveur. Aucun nouveau schéma ni modification des règles Activity.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 229 tests Vitest / 51 fichiers, build), Ventes 25 / Stock 29 / Billing 18 tests serveur réussis ; ajout de preuve rejoué isolément, réussi. Sept parcours Billing/Livraisons de régression réussis, nouveau parcours commande et deux régressions Ventes rejoués avec succès ; dernière recette visuelle commande réussie en clair/sombre/mobile. Captures inspectées, titre/en-têtes fixes et disparition/réapparition des actions vérifiés, `git diff --check` réussi. Assert de bordure/seuil de fixation et anciens parcours d’action après préparation adaptés ; détails doc 09. Pas de suite exhaustive ni de recette NAS/Gotenberg réel ; avertissement build sur les chunks conservé.
- Livraison locale sans commit/push ni installation NAS. Pack PocketBase `/private/tmp/horizon-pocketbase-order-actions-20261013.zip` préparé : 191 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/contenu/empreintes vérifiés, sans frontend/base/executable/secrets. SHA-256 `fb96f244b806f91735c5a221e89c723733c8e353056d93f04fbe26ba535ca66d`. Aucune migration nouvelle pour cet ajustement ; migrations précédentes jusqu’à 1791840005 nécessaires si non installées. Suite : installation cohérente hooks/frontend et migrations antérieures éventuelles après sauvegarde, puis recette cible. Travaux actifs actualisés, statuts et compteurs inchangés ; installation du correctif Activity toujours non confirmée.

### Message Achats indisponibles sur commande client — 13 octobre 2026

- Cause reproduite : la projection de besoins renvoie légitimement une quantité nette de zéro pour une ligne entièrement couverte, mais le schéma frontend exigeait une quantité strictement positive et déclenchait le message générique. Correction limitée au schéma de lecture ; les saisies d’achat restent strictement positives. Diagnostic technique enrichi avec chemin/code de validation, sans valeurs métier. Contrat doc 05 précisé ; aucun changement de base, hook, permission ou historique.
- Vérifications : test anti-régression échoué avant correction puis réussi ; `pnpm check` réussi (lint, TypeScript, 231 tests / 52 fichiers, build), `git diff --check` réussi. Parcours Playwright commande/facture rejoué avec succès sur fixture locale : réponse besoins à zéro, absence du message et bouton achats masqué. Première assertion du champ d’attente ajustée au placeholder existant ; une exécution a dépassé 30 secondes, puis réussite avec limite de 60 secondes. Tentative preview non concluante car le build courant pointe hors fixture ; recette finale via Vite configuré sur PocketBase temporaire. Avertissement de chunks volumineux conservé ; fiche réelle signalée non consultée avec session authentifiée, suite exhaustive et NAS non testés.
- Livraison locale, sans commit/push ni installation NAS. Pas de migration ni nouveau pack serveur nécessaires. Statuts et compteurs inchangés. Prochaine action : recharger la fiche signalée pour confirmer sur la session utilisateur ; installation Activity toujours non confirmée.

### Libellé du smart button Livraisons — 13 octobre 2026

- Libellé commun des opérations liées à une commande client réduit à « Livraisons », selon la demande ; lien, compteur et périmètre de consultation conservés.
- Vérifications : lint et TypeScript réussis, recherche des usages effectuée, `git diff --check` réussi. Changement de texte uniquement ; pas de nouveau test ni de recette navigateur pour cet ajustement.
- Livraison locale, sans commit/push ni installation NAS ; aucune mise à jour PocketBase nécessaire. Aucun travail restant pour ce libellé ; statuts et compteurs inchangés.

### Pièce de commande : pictogramme et miniature — 13 octobre 2026

- Livré localement : pictogramme FileText au bord du numéro de commande client, rose avec pièce enregistrée ; sélection PDF/image présentée en miniature cliquable dans le popup et la confirmation. Grand aperçu HFilePreview partagé avec ActivityFileLink, retour du focus à la miniature, remplacement/retrait possibles avant enregistrement et URL temporaire libérée. Contrat UX doc 07 actualisé ; aucune modification des fichiers historiques, du serveur ou des permissions.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 231 tests / 52 fichiers, build), `git diff --check` réussi. Parcours Playwright commande/facture réussi puis rejoué avec Chromium complet pour le lecteur PDF natif ; miniature image/PDF, agrandissement, fermeture/focus, retrait et couleur rose contrôlés. Captures image miniature/grand aperçu et PDF natif inspectées ; ajout d’un délai de capture uniquement pour laisser le lecteur PDF peindre. Retour du focus corrigé après premier test. Suite exhaustive et fiche réelle non testées, contrôles mobile/sombre existants du parcours conservés sans recette dédiée de la nouvelle miniature ; avertissement de chunks volumineux conservé.
- Livraison locale, sans commit/push ni installation NAS ; aucune migration, mise à jour PocketBase ou nouveau pack serveur nécessaire. Aucun travail restant pour ce périmètre, statuts et compteurs inchangés.

### Gestion permanente de la pièce de commande client — 13 octobre 2026

- Correction du parcours incomplet : le pictogramme ouvre désormais toujours le popup de gestion, même avec une pièce existante. Miniature protégée cliquable, sélection de remplacement, retrait préparé, Enregistrer explicite, Annuler/Conserver la pièce actuelle sans écriture ; consultation seule sans contrôles de modification. HFileThumbnail mutualise les fichiers locaux et protégés, HFilePreview et retour du focus conservés. Icône rose liée à la pièce réellement enregistrée. Contrats docs 04/05/06/07 actualisés.
- Serveur : command_file_action keep/replace/remove sur la route versionnée existante. Remplacement avec nouveau fichier requis, retrait sans fichier, actions invalides refusées, droits de confirmation et commande active ; validation MIME/taille, transaction et audit. Nouvel événement/pointeur pour remplacement ou retrait, anciens fichiers/événements et snapshots/montants conservés. Anciens appels sans action compatibles ; aucune migration.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 231 tests / 52 fichiers, build), Ventes 25 tests serveur réussis ; contrôle complet des pièces rejoué isolément après validation stricte des actions, réussi. Playwright commande/facture sur Chromium natif réussi : aperçu/protection, focus, annulation, remplacement, rétablissement de sélection, retrait, icône neutre puis nouvel ajout. Capture du gestionnaire inspectée, `git diff --check` réussi. Assertions ajustées au nom normalisé PocketBase et au profil user valide du test ; aucune sécurité assouplie. Pas de suite exhaustive, nouvelle recette mobile/sombre ni accès authentifié à la fiche réelle ; avertissement build de chunks conservé.
- Livraison locale, sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-order-file-manager-20261013.zip` préparé : 191 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/contenu/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 `dcf9da4d16acc064f2141f6a19f473fa94822344eeb027540ea2a3beb0ff2cb4`. Depuis le pack order-actions, seul `pb_hooks/lib/sales-lifecycle.js` change côté serveur : installation du hook et redémarrage requis avec frontend correspondant, aucune nouvelle migration. Prochaine action : installation sur cible et recette utilisateur. Statuts et compteurs inchangés ; installation Activity toujours non confirmée.

### Gestionnaire de pièce : disposition documents / aperçu — 13 octobre 2026

- Ajustement visuel selon la référence utilisateur, avec style Horizon : dépôt compact et ligne du fichier à gauche, grand aperçu PDF/image à droite, nom du fichier sans champ de titre ni recherche superflue. Agrandissement et retour du focus, remplacement/retrait/annulation conservés ; empilement mobile et footer partagé. HAttachmentWorkspace réutilisable, lecture protégée et cycle de vie des URL mutualisés via useActivityAttachment/useFileSource ; confirmation conserve sa miniature existante. Contrats docs 04/07 actualisés.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 231 tests / 52 fichiers, build), parcours Playwright commande/facture sur Chromium natif réussi : fichier local/image/PDF, pièce protégée, agrandissement/focus, annulation, remplacement, retrait, réajout, géométrie deux colonnes et absence de débordement mobile. Captures clair/sombre/mobile inspectées, `git diff --check` réussi. Aucun changement serveur ; tests backend non rejoués pour cet ajustement frontend. Suite exhaustive et fiche réelle non testées ; avertissement de chunks volumineux conservé.
- Livraison locale sans commit/push ni installation NAS. Aucune migration ni mise à jour PocketBase supplémentaire : le pack order-file-manager précédent reste valable ; son hook de remplacement/retrait reste à installer sur cible si cela n’a pas déjà été fait. Aucun travail restant pour cette disposition ; statuts et compteurs inchangés.

### Plusieurs pièces et aperçu intégré — 13 octobre 2026

- Livré localement : sélection/dépôt multiple et ajouts successifs dans le gestionnaire et à la confirmation, liste des noms, sélection mettant uniquement à jour l’aperçu de droite sans popup supplémentaire, retrait individuel et annulation des changements. Pièces sélectionnées/ajoutées conservées après rechargement, icône rose si au moins une pièce active ; style et comportement mobile/sombre conservés. Contrats docs 04/05/06/07 actualisés.
- Intégrité : migration additive `1791840006_customer_order_documents.js`, relation active vers les événements protégés, reprise du seul pointeur historique courant sans toucher aux fichiers/snapshots. Un événement par nouvelle pièce ; ajouts/retraits atomiques, appartenance des retraits contrôlée, permissions/version et MIME/taille vérifiés, plafond structurel de 20 pièces de 10 Mo chacune. Anciennes actions unitaires compatibles, cible nécessaire avec plusieurs pièces ; nouveaux ajouts multiples refusés avant migration. Conservation des preuves actives/retirées renforcée côté API Activity, sans élargir ses règles ni modifier les anciens fichiers.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 231 tests / 52 fichiers, build), Ventes 26 tests serveur réussis incluant reprise/double migration et lecture du fichier d’origine ; trois tests fichiers/migration rejoués après derniers garde-fous, réussis. Activity 14 tests serveur réussis, refus de purge des preuves actives/retirées vérifié. Deux parcours Playwright concernés réussis séparément : gestionnaire/facture (sélection multiple, ajouts successifs, sélection sans popup, retrait ciblé, annulation, persistance, clair/sombre/mobile) et confirmation/cycle Ventes avec deux pièces. Captures inspectées, `git diff --check` réussi. Pas de suite exhaustive ni de recette NAS/session réelle ; avertissement de chunks volumineux conservé.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-order-multiple-documents-20261013.zip` préparé : 193 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/contenu/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 `b03bb79be02ba812295be1299001e52efbe9c98a2d49841c8a1a7acf9dabf674`. Installer migration 1791840006 et hooks/frontend correspondants après sauvegarde puis redémarrer PocketBase ; suite : recette utilisateur sur cible. Travaux actifs actualisés, statuts et compteurs inchangés ; installation Activity toujours non confirmée.

### Titre Lignes de la commande harmonisé avec le devis — 13 octobre 2026

- Ajustement local du conteneur de titre fixe partagé : retrait du cadre/retrait horizontal propres au tableau autour du titre, fond de page commun et espacement de section conservés. Typographie/compteur HSectionHeading identiques à Lignes du devis ; bordure limitée au tableau, fixation du titre et des colonnes conservée. Règle doc 07 précisée.
- Vérifications : lint et TypeScript réussis, parcours Playwright commande/facture rejoué avec succès après ajustement final du fond ; styles calculés devis/commande et alignement comparés, maintien au défilement vérifié. Captures devis/commande et titre fixe inspectées ; clair/sombre/mobile inclus dans le parcours, `git diff --check` réussi. Pas de suite unitaire/build/backend ni de recette sur fiche réelle pour ce changement CSS.
- Livraison locale, sans commit/push ni installation NAS. Aucune modification PocketBase supplémentaire ; statuts et compteurs inchangés, aucun travail restant pour ce titre.

### Préparation du commit Facturation et commandes — 13 octobre 2026

- Demande utilisateur de commit/push : périmètre complet restant depuis la dernière publication, Facturation B01 clients/fournisseurs et conditions de paiement, références/actions/pièces multiples de commande, corrections de besoins d’achat et harmonisation des titres. README de référence actualisé. Aucun changement fonctionnel supplémentaire pendant la préparation Git.
- Vérifications prépublication : `pnpm check` réussi (lint, TypeScript, 231 tests / 52 fichiers, build), `git diff --check` réussi ; 136 fichiers examinés, aucun secret reconnaissable trouvé par contrôle ciblé. Distant récupéré, main et origin/main identiques avant commit. Vérifications métier et limites des interventions précédentes restent applicables ; suite exhaustive non rejouée, avertissement de chunks volumineux conservé.
- Livraison : commit préparé et push demandé, résultat de publication à consigner après exécution. Aucun déploiement NAS ; pack multiple-documents reste préparé, migration 1791840006 et hooks/frontend requis sur cible. Statuts et compteurs inchangés.

### Publication Git Facturation et commandes — 13 octobre 2026

- Commit fonctionnel `39a89cc` créé : Facturation B01 et conditions de paiement, raccordements et gestion des commandes/pièces, composants partagés, tests et documentation ; 136 fichiers, 3338 insertions / 192 suppressions. Push sur origin/main confirmé (6bf4e96 → 39a89cc).
- Vérifications : contrôle prépublication `pnpm check` et contrôle de diff réussis comme consignés ci-dessus ; retour Git push confirmé. Aucun nouveau changement de code après ces vérifications. Cette note consigne la livraison Git ; statuts fonctionnels et compteurs restent inchangés.
- Livraison : commit/push effectués. Aucun déploiement NAS ; pack PocketBase préparé, installation migration 1791840006/hooks/frontend et recette cible restent à réaliser. Sage/SUPER PDP toujours en standby, installation Activity non confirmée.

### Cadrage des filtres dynamiques Ventes — 13 octobre 2026

- Investigation à la demande utilisateur : comparaison SearchFilters CRM/Ventes et règles UX. Ventes mélange actuellement type de pièce, état métier et archivage dans le seul paramètre status ; CRM distingue type, état et archives. Cible discutée : type Devis/Commandes en premier, critères contextuels cumulables et choix multiples, archivage séparé sur la référence CRM, mêmes composants/recherche et conservation URL. Reprise page par page, première étape limitée aux listes Ventes.
- Vérifications : lecture des déclarations de filtres et de QuotesPage, documentation UX ; aucune modification fonctionnelle ni recette navigateur/test pour ce cadrage. Critères propres aux commandes et compatibilité des liens existants à préciser pendant la mise en œuvre.
- Livraison : cadrage local, sans commit/push ni déploiement ; statuts et compteurs inchangés. Prochaine action : appliquer le cadrage retenu aux listes Devis/Commandes et au contrat de filtrage serveur, puis vérifier combinaisons et archives.

### Filtres dynamiques Ventes : première page à valider — 13 octobre 2026

- Livré localement pour revue utilisateur : Ventes principale mixte, sous-menus Devis/Commandes présélectionnés ; Type en premier, états contextuels multiples, Archives indépendant comme CRM. Option multiple du composant SearchFilters partagé activée uniquement dans Ventes, pastille par choix et retrait individuel ; changement de type retire les états incompatibles, reset conserve la recherche et revient en première page. URL/rechargement/retour de fiche préservés, anciens liens normalisés sans perdre le contexte ; titres/libellés de recherche adaptés, colonne Type en vue mixte et état de commande natif en lecture. Synthèse suit le contexte d’archives. Autres configurations de filtres inchangées, poursuite conditionnée à la validation utilisateur. Contrats docs 04/05/06/07 actualisés.
- Serveur : kind/status/order_status/state contrôlés, OU dans une famille/branche, union des branches puis intersection avec critères communs ; paramètres liés, droits Sales existants, aucun filtre arbitraire transmis. Compatibilité des anciennes valeurs quotes/accepted/archived/active, projections de champs existants uniquement ; aucune migration ni transition métier ajoutée.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 235 tests / 53 fichiers, build), 26 régressions serveur Ventes réussies et nouveau scénario de combinaisons/types/archives/paramètres invalides exécuté séparément avec succès. Trois parcours Playwright filtres/Ventes/droits réussis en exécution finale groupée ; parcours de commande/réservations/navigation Devis/Commandes rejoué, réussi. Combinaisons, pastilles, reset, archivage, persistance, non-régression des radios CRM et clair/sombre/mobile vérifiés ; captures inspectées, `git diff --check` réussi. Contrôles testés via leurs libellés visibles et attente de la navigation ; ancienne assertion de suppression de la ligne initiale vierge adaptée au contrat existant. Pas de suite exhaustive ni de recette sur base réelle/NAS ; avertissement de chunks volumineux conservé.
- Livraison locale sans commit/push ni installation NAS. Pack PocketBase consolidé `/private/tmp/horizon-pocketbase-sales-filters-20261013.zip` préparé : 194 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/contenu/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 `7e4b53363074777daf04b11154347da23f32ddb78e5ace18adc15835bdeb65cd`. Depuis le pack pièces multiples, seul lib/sales.js change et lib/sales-list-filters.js est ajouté : mise à jour de ces hooks et redémarrage requis avec frontend correspondant, aucune migration nouvelle pour les filtres. Suite : installation sur cible pour recette et validation utilisateur de Ventes avant toute reprise d’autre page. Travaux actifs actualisés, statuts et compteurs inchangés.


### Apparence des filtres et critères de numéro client — 13 octobre 2026

- Livré localement : onglet Filtres dans Paramètres → Apparence et densité, hauteurs options/boutons et taille du texte, couleurs ordinaires/sélectionnées par thème. Aperçu du composant SearchFilters partagé, interactif et isolé jusqu’à sauvegarde ; correction du débordement interne mobile constaté à la revue visuelle. Tokens communs à tous les panneaux, configurations métier des autres pages conservées. Ventes ajoute filtre Numéro renseigné / Attente Commande, recherche par numéro client et regroupements État / N° commande client, URL et archives cumulables ; filtres Ventes toujours en attente de validation avant poursuite d’autres pages. Contrats docs 04/05/06/07 actualisés.
- Intégrité : migration additive 1791840007 du singleton JSON UX, ne remplace aucun choix existant ; validation serveur bornée et hexadécimale, permissions/version/audit conservés. Filtre de numéro client appliqué uniquement à la branche commandes, anciennes valeurs d’attente prises en compte ; aucune migration ni nouvel état Sales.
- Vérifications : pnpm check final réussi (lint, TypeScript, 236 tests / 53 fichiers, build) ; 7 tests serveur UX réussis, reprise et double migrate up conservant les choix vérifiés ; scénario serveur Ventes de combinaisons/types/archives/numéros/recherche réussi après correction de sa préparation de commande terminée. Six parcours Playwright UX/Ventes réussis en exécution finale : preview/sauvegarde/persistance/concurrence/droits, groupes/numéros et archives, radios CRM, clair/sombre/mobile ; captures finales inspectées, absence de débordement interne mobile vérifiée. git diff --check réussi. Pas de suite backend/E2E exhaustive ni recette sur base réelle/NAS ; avertissement de chunks volumineux et ResourceWarning de fixtures Python conservés.
- Livraison locale sans commit/push ni installation NAS. Pack `/private/tmp/horizon-pocketbase-filter-ux-20261013.zip` préparé : 195 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/empreintes vérifiés, aucun frontend/base/exécutable/secrets ; SHA-256 a7700f64584ba48c14d2d0bbf5bacd806e523d48b1a7a4aa94ab938a55de063b. Migration 1791840007, trois hooks et frontend cohérents requis sur cible ; prochaine action : installation et recette utilisateur de Ventes. Statuts et compteurs inchangés.


### Achats : recherche et regroupements sans listes exhaustives — 13 octobre 2026

- Livré localement : retrait des filtres Fournisseur/Opportunité et du chargement de leurs choix dans la top bar ; trois regroupements Fournisseur / Opportunité / État sur accueil Achats, DA et BC, via GroupedResults et URL conservée. Pièces multi-opportunités groupées selon leur combinaison distincte, une seule apparition ; contextes des liens métier préservés. Recherche complétée pour fournisseurs proposés de DA et noms/numéros des opportunités ventilées. Projection des fournisseurs proposés dans supplier_name des DA ; aucune collection/transition/migration supplémentaire.
- Sécurité/UX : recherche CRM conditionnée côté serveur à crm.read ; paramètres liés, droits Achats inchangés. Correction commune du débordement de top bar mobile observé avec Commandes fournisseurs : libellé contextuel borné et tronqué, texte complet au survol et chevron conservés. Contrats docs 04/05/06/07 et travaux actifs Achats actualisés ; statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 237 tests / 53 fichiers, build) ; 3 tests serveur Achats réussis (recherche fournisseur/opportunité, absence de recherche CRM sans droit, synthèse/contextes, accueil/pagination). Trois parcours Playwright réussis en exécution finale groupée : cycle Achats existant, nouveau scénario de recherche/groupes sur les trois listes et régression filtres Ventes/CRM ; clair/sombre/mobile, persistance et absence de débordement vérifiés, captures inspectées, git diff --check réussi. Fixture dédiée isolée par son opportunité et assertion de redimensionnement mobile passée en attente de recalcul ; tentatives précédentes ont rencontré un échec transitoire de popup et un contrôle mobile trop précoce. Pas de suite exhaustive ni recette base réelle/NAS ; avertissement de chunks et ResourceWarning Python conservés.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-purchase-groups-20261013.zip` préparé : 195 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 5a41bb40139713996a26ce96eb22bdf0194f1d29acfe16895eeab03152987d28. Depuis filter-ux, seuls lib/purchasing.js et lib/purchasing-common.js changent : remplacer et redémarrer avec frontend cohérent, aucune migration nouvelle pour cet ajustement. Migration UX 1791840007 reste requise si absente. Prochaine action : installation/recette utilisateur des filtres, sans poursuite d’autres listes non demandées.


### Achats : archivage séparé sur la référence CRM — 13 octobre 2026

- Correction locale après retour utilisateur : retrait d’Archivées/Non archivées du choix État, critère Archives compact partagé avec Non archivés / Archivés ; état métier, recherche et regroupement conservés à la bascule, URL/rechargement et anciens liens status=archived compatibles. Synthèse et libellé des cartes suivent les archives choisies, accueil en attente par défaut cohérent avec son filtre. Contrats docs 04/05/06/07 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Serveur : state active/archived contrôlé, intersecté avec les critères métier ; archived_at existant, aucune migration ni changement de données/droits.
- Vérifications : pnpm check réussi (lint, TypeScript, 238 tests / 53 fichiers, build), trois tests serveur Achats réussis (archives/états/synthèse/compatibilité/valeur invalide, contexte/synthèse et accueil/pagination). Parcours Playwright dédié réussi sur les trois listes : regroupements/recherche, Archives compact, conservation de Brouillon à la bascule, rechargement et reprise ancien lien ; clair/sombre/mobile inclus, capture du panneau inspectée, git diff --check réussi. Suite exhaustive et cycle complet non rejoués pour cette correction ; pas de recette sur base réelle/NAS, avertissements existants conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-purchase-archives-20261013.zip préparé : 195 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 6772460958f97e61e0f2da594a76cf971781afce0aef042d51a3030fd16ec8b1. Depuis purchase-groups, seul lib/purchasing.js change : mise à jour/redémarrage avec frontend cohérent, aucune migration nouvelle. Suite : recette utilisateur sur cible.


### Règles permanentes de cohérence design — 13 octobre 2026

- À la demande utilisateur, consignes renforcées dans AGENTS.md avec renvoi au contrat canonique UX, accessible aussi depuis docs/00. Règles regroupées au début du doc 07 : références Contacts/CRM/Devis/Paramètres, réutilisation des composants/slots/tokens, archivage compact séparé, recherche pour référentiels volumineux, cumul/URL/regroupements, titres/onglets/frises/actions/pagination, tableaux et gestion des pièces existantes. Comparaison navigateur et régression pertinente obligatoires avant livraison ; correction validée à intégrer au contrat durable sans refonte spontanée d’autres modules.
- Vérifications : relecture des règles existantes et des retours récents, renvois/ancres contrôlés, git diff --check réussi. Intervention documentaire uniquement ; aucun code, backend, migration ou test fonctionnel modifié/rejoué. Statuts et compteurs inchangés.
- Livraison locale sans commit/push ni installation NAS. Aucun pack supplémentaire nécessaire. Prochaine action : appliquer ce contrôle aux interventions UI suivantes, sans attendre de rappel utilisateur.


### Stock : rationalisation des filtres des cinq listes — 13 octobre 2026

- Livré localement sur Opérations, Produits, Disponibilités, Inventaires et Parc interne : critères courts cumulables, multisélections par famille, archivage compact indépendant sur les pièces réellement archivables, regroupements via GroupedResults, recherche contextuelle pour affaires/fournisseurs/emplacements/entrepôts et suppression du chargement des listes exhaustives du panneau. Sortie contextuelle aux types OUT, états/types incompatibles contrôlés, anciens liens status=archived normalisés ; filtres conservés dans l’URL, pastilles retirables, reset conservant q, cartes Produits conservant les autres critères. Groupes Inventaires sans type/fournisseur inutiles. Pastilles multiples défilables à largeur lisible après revue visuelle. Parc conserve retiré/remis en stock comme états métier, disponibilités restent des projections, sans archivage artificiel.
- Serveur : helper commun de validation CSV (allowlist/borne/doublons), OU par famille et intersection des critères communs ; sous-types appliqués à la branche OUT, archives indépendantes et synthèse dans leur contexte. Recherche d’opportunité directe/ventilée sous crm.read, sources Achats/Ventes sous droits correspondants ; projection explicite des vraies opportunités pour les groupes, comptes fixes exclus, pièce unique. Quantités, réservations, mouvements, transitions et permissions conservés ; aucune migration nouvelle. Contrats docs 04/05/06/07 et travaux actifs actualisés, statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 241 tests / 54 fichiers, build). Suite serveur Opérations 30 tests réussis ; groupe Catalogue/Disponibilités/Traçabilité 42 tests réussis, incluant les régressions héritées d’Opérations ; parc multiple ciblé puis deux tests projection/droits/parc rejoués après dernier ajustement, réussis. Playwright cinq listes Stock et régression Ventes/CRM réussis en groupe ; cycle Stock existant réussi sur fixture isolée ; scénario cinq listes rejoué après projection explicite des opportunités, réussi. Clair/sombre/mobile, URL/rechargement, cumul/archives/reset/groupes/recherche vérifiés, captures inspectées ; git diff --check réussi. Tentatives initiales corrigées : conflit de déclaration catalogue, fixture unitaire de tags, assertion de compteur du cycle polluée par les données du scénario précédent ; aucune règle métier contournée. Pas de suite exhaustive ni recette sur base réelle/NAS ; avertissement build de chunks et ResourceWarning de fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-stock-filters-20261013.zip préparé : 196 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 9782aaa8e73b2cc29f1d494f6d1ec0389c83be4907a44d71eefbc91c5c67d4d6. Depuis purchase-archives : quatre hooks Stock/Catalogue/Parc remplacés et helper ajouté, redémarrage avec frontend cohérent ; aucune migration supplémentaire pour cette intervention. Migration UX 1791840007 reste requise si absente. Prochaine action : installation et validation utilisateur des listes Stock.


### Opérations : bascule Tableau de bord / Liste sur la référence CRM — 13 octobre 2026

- Livré localement : bascule commune HViewSwitch extraite du contrôle Kanban/Liste CRM, réutilisée sans variante visuelle. Tableau de bord : tuiles/prévisions globales, aucun tableau ni filtre/tri/pastille de liste ; Liste : résultats, groupes et pagination, sans tuiles. Critères mémorisés à la bascule, première page, view conservé en URL ; anciens liens filtrés ouvrent la liste, liens des tuiles explicites en view=list, recherche depuis dashboard ouvre la liste. Inventaires conserve Liste/Calendrier. Revue mobile : correction commune HDataTable, largeur minimale dérivée des colonnes redimensionnables et défilement contenu, sans changement de largeur desktop. Contrats docs 04/07 et travaux actifs actualisés, statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 243 tests / 55 fichiers, build), lint/typecheck rejoués après extension du scénario mobile. Playwright filtres Stock et régression Ventes/CRM réussis en groupe ; cycle Stock et préférence Kanban/Liste CRM réussis en groupe distinct. Scénario Stock rejoué avec les deux vues sur mobile sombre, puis Stock/CRM rejoués ensemble après correction du tableau mobile, réussis : séparation, compteurs dashboard indépendants des filtres mémorisés, restitution archives/états/groupes/q, reload, recherche vers liste, défilement horizontal contenu du tableau et absence de débordement de page. Captures desktop/mobile inspectées, git diff --check réussi. Scénario corrigé pour attendre le changement de vue effectif avant la saisie suivante ; suite exhaustive/backend non rejoués, aucune recette base réelle/NAS, avertissement build de chunks conservé.
- Livraison locale sans commit/push ni installation NAS. Modification frontend seulement, aucun hook/migration/pack supplémentaire requis pour cette bascule ; dernier pack Stock conserve son périmètre. Prochaine action : validation utilisateur des deux présentations.


### Achats : Type DA/BC distinct en premier — 13 octobre 2026

- Livré localement sur l’accueil Achats : Type de pièce en premier, DA/BC cumulables, états contextuels multiples en dessous, archives compactes en dernier comme Ventes/CRM. Type seul retire les états incompatibles, conserve recherche/archives/groupes/tri et revient en première page ; Tous les états reste explicite, accueil En attente par défaut. Cartes de type raccordées à kind, compteurs d’état dans le type choisi, anciens liens de type/archives compatibles. Listes dédiées gardent états multiples et type fixé par leur route. Même composant partagé, aucun style local ; contrats docs 04/05/06/07 et travaux actifs actualisés, statuts/compteurs inchangés.
- Serveur : kind requests/orders CSV et status CSV contrôlés et liés indépendamment de state ; préservation des anciens scopes virtuels, permissions et données inchangées. Aucune migration nouvelle.
- Vérifications : pnpm check final réussi (lint, TypeScript, 243 tests / 55 fichiers, build), 23 régressions serveur Achats réussies dans la suite de 24 ; nouveau scénario initialement erroné sur le statut de fixture DA corrigé, puis ce scénario et deux régressions types/pagination/archives rejoués avec succès. Deux parcours Playwright cycle Achats et recherche/groupes/type/archives réussis en exécution finale groupée : type en premier, DA/BC cumulés, états multiples, retrait de Traitée en BC seul, Tous les états, conservation des critères, clair/sombre/mobile ; capture inspectée, git diff --check réussi. Pas de suite exhaustive ni recette base réelle/NAS ; avertissement de chunks et ResourceWarning de fixture conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-purchase-types-20261013.zip préparé : 196 fichiers hooks/assets/migrations plus manifeste/instructions, ZIP/empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 a0049399211c1f34501faac2e489e80a958529a3741e8a2d6d41fec556320edb. Depuis stock-filters, seul lib/purchasing.js change : mise à jour/redémarrage avec frontend cohérent, aucune migration supplémentaire. Prochaine action : installation et validation utilisateur du panneau Achats.


### Demandes d’achat : retrait de Nouvelle commande — 13 octobre 2026

- Correction locale de l’action de liste : /purchasing/requests conserve uniquement Nouvelle demande ; Nouvelle commande reste sur Commandes fournisseurs et l’accueil commun Achats selon la décision précédente. Permissions et contexte de navigation inchangés, règle doc 07 précisée. Statuts et compteurs inchangés.
- Vérifications : lint/TypeScript et git diff --check réussis ; parcours Playwright Achats dédié réussi, assertion d’absence sur DA et présence sur accueil/BC ajoutée au scénario existant, recherche/filtres/groupes/archives et clair/sombre/mobile inclus. Pas de tests unitaires/build/backend supplémentaires pour cette condition d’affichage ; aucune recette base réelle/NAS.
- Livraison locale sans commit/push ni installation NAS. Frontend uniquement, aucun hook/migration/pack supplémentaire. Aucun travail restant pour le retrait du bouton.


### Employés : vue Cartes commune à Contacts — 13 octobre 2026

- Livré localement : bascule HViewSwitch Cartes / Liste / Organigramme, liste conservée par défaut, view=cards en URL. Structure HDirectoryCard extraite de Contacts et réutilisée sans copie du layout ; photo protégée/initiales, nom/poste/équipe/coordonnées, responsabilité IdentityTag et type/état. Carte entière ouvrant le popup existant, clavier et téléphone indépendant ; mêmes résultats, tris et groupes GroupedResults que Liste, contexte préservé au rechargement et après fermeture. Message seul pour aucun résultat en Cartes. Contrats docs 04/07 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : lint et TypeScript réussis, git diff --check réussi ; parcours Playwright Employés et régression Cartes/Liste Contacts réussis ensemble, puis Employés rejoué avec contrôle explicite des cartes en lecture seule, périmètre limité et photo protégée à 64 px, réussi. Recherche/filtre/groupes/rechargement/clavier/clair/mobile sombre vérifiés, captures inspectées. Assertion Contacts de largeur mobile devenue asynchrone pour attendre la stabilisation après redimensionnement, après un premier échec de mesure immédiate ; aucune règle métier contournée. Suite exhaustive, build et backend non rejoués pour cette présentation frontend ; aucune recette sur base réelle/NAS.
- Livraison locale sans commit/push ni installation NAS. Aucun hook, migration ou pack PocketBase supplémentaire. Prochaine action : validation utilisateur de la nouvelle présentation Employés.


### Employés : photos dans les trois vues et tri alphabétique — 13 octobre 2026

- Tri par défaut Liste/Cartes aligné sur le nom affiché (prénom puis nom), A → Z avec collation française ; tri explicite du panneau conservé. Photos déjà raccordées via EmployeeAvatar partagé, confirmé pour Liste, Cartes et Organigramme ; texte alternatif nominatif ajouté, initiales conservées en absence de photo. Aucun changement du stockage ni du périmètre de consultation. Contrats docs 04/07 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : lint/TypeScript et git diff --check réussis ; scénario Playwright Employés réussi puis rejoué avec contrôle explicite des trois vues : même ordre par défaut Liste/Cartes, photo protégée effectivement chargée (naturalWidth > 0), organigramme et accès limité en lecture seule. Suite exhaustive/build/backend non rejoués ; aucune recette sur base réelle/NAS. Messages d’annulation de requêtes à la navigation sur fixture conservés.
- Livraison locale sans commit/push ni installation NAS. Aucun hook/migration/pack PocketBase supplémentaire. Prochaine action : validation utilisateur du tri et des photos sur ses fiches.


### Photos : source Employé et projection vers les comptes — 13 octobre 2026

- Livré localement : gestion visuelle de photo dans la fiche Employé, aperçu 88 px, fichier sélectionné, Ajouter/Remplacer/Retirer, erreurs de format/taille, annulation réversible et pied HDialogFooter commun. Consultation sans contrôles d’édition. Utilisateurs, menu, Mon compte et fil récupèrent la photo effective de l’employé associé ; import/retrait supprimé de Mon compte et refusé côté serveur. Lien de fiche conditionné à hr.read, aucun élargissement de droits pour voir son propre avatar. Comptes non associés conservent leur photo historique en lecture, rattachement explicite sans ressource créée implicitement.
- Backend : résolution/serveur binaire commun sous droits existants, source du fil autorisée avant lecture, route avatar propre/Admin sans profil RH exposé et no-store. Reprise additive 1791840008 : photo compte copiée uniquement si employé vide, originaux et conflits conservés ; marqueur caché employee_photo_migrated empêchant la réapparition après retrait/dissociation/réassociation. Access appelle le service propriétaire HR en transaction, audit de reprise. Contrats docs 00/04/05/06/07/09 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 243 tests / 55 fichiers, build) ; régressions serveur photos/Compte/Accès, 19 tests réussis, puis sept ciblés photos/migration/Compte rejoués après déplacement de la reprise vers HR, réussis. Trois parcours Playwright Employés/Compte/fil réussis dans l’exécution finale groupée : aperçu/import/remplacement, annulation du retrait, erreur MIME, trois vues, photo de compte associé, lecteur et photos du fil, identité/présence/mot de passe, clair/sombre/mobile. Captures inspectées, git diff --check et ZIP/empreintes vérifiés. Ajustements de tests : scope HR explicite du compte fixture, publication par route autorisée, sélecteur exact pour distinguer fichier/retrait, attente de confirmation de sauvegarde avant navigation (un rafraîchissement de session était annulé par le scénario). Pas de suite exhaustive ni recette NAS/S3 réel ; avertissement build de chunks, ResourceWarning et logs d’annulations de navigation de fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-employee-photos-20261013.zip préparé : 198 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 f74d56d4ab53c4bfd216457a1a4c27e52e1a7284a33be9ad829a8de8bfb57096. Depuis purchase-types : remplacer cinq fichiers Account/HR/Access/Activité, ajouter identity-photo.js et migration 1791840008, appliquer les migrations puis redémarrer avec le frontend cohérent. Prochaine action : installation du pack et validation utilisateur des photos sur ses fiches.


### Employés : tri alphabétique par nom de famille — 13 octobre 2026

- Clarification utilisateur appliquée : Liste et Cartes triées par défaut sur le nom de famille, puis le prénom en cas d’égalité, avec collation française. Comparaison séparée des deux champs pour respecter aussi les noms composés ; tris explicites e-mail/poste et sens descendant conservés. Remplace la décision précédente de tri sur le nom affiché ; affichage prénom/nom et photos inchangés. Docs 04/07 et travaux actifs actualisés, statuts et compteurs inchangés.
- Vérifications : lint et TypeScript réussis, deux tests unitaires du comparateur (noms composés, accents, égalité de noms, sens et autres tris) réussis ; scénario Playwright Employés réussi puis rejoué après extraction du comparateur, réussi, ordre Direction/Durand/Martin identique en Liste/Cartes. git diff --check réussi. Build et suites exhaustives/backend non rejoués pour cette correction frontend.
- Livraison locale sans commit/push ni installation NAS. Aucun hook/migration/pack supplémentaire ; pack Photos précédent inchangé. Aucun travail restant pour le tri demandé.


### Produits : quantité en stock à la place d’Unité — 13 octobre 2026

- Livré localement : dernière colonne Qté en stock, quantité physique en notation française avec unité de base, alignement numérique partagé ; zéro réel et tiret si stock non géré ou projection absente. Filtres/groupes/navigation inchangés ; disponible des cartes conservé séparément. Projection serveur physical_quantity en lot sur les produits de la page, emplacements/entrepôts actifs, mouvements et réservations distincts ; helper balancesByProduct commun conservant le contrat availableByProduct. Aucun champ persistant, migration ou changement de droits. Contrats docs 04/05/06/07 et travaux actifs actualisés, statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 245 tests / 56 fichiers, build), lint rejoué après extension mobile du scénario. 17 régressions serveur Catalogue réussies ; contrôle Stock/réservations rejoué après correction de la quantité attendue de fixture, réussi (physique 4,123456 / disponible 2,123456). Parcours Playwright Catalogue réussi, rejoué avec liste mobile sombre puis consultation de la dernière colonne par défilement horizontal partagé, réussi ; zéro/sans stock, multi-emplacements, cartes/fiche et contexte conservé, captures inspectées. git diff --check et ZIP/empreintes vérifiés. Pas de suite exhaustive Stock/Purchasing ni recette base réelle/NAS ; avertissement de chunks et ResourceWarning de fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-product-stock-20261013.zip préparé : 198 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 28bd13da2ed189fc0eaa27d0170afb80523ac231f5d339df2d4163f78b844d0f. Depuis employee-photos : remplacer lib/catalog.js et lib/stock.js puis redémarrer avec frontend cohérent, aucune migration supplémentaire. Prochaine action : installation des deux hooks et validation utilisateur de la colonne.


### Recherche : croix de réinitialisation intégrée à Filtres — 13 octobre 2026

- Livré localement dans SearchFilters partagé : petite croix accolée à droite du déclencheur, même hauteur et séparation discrète, affichée uniquement avec critères/groupement/tri actifs. Même callback que Réinitialiser du panneau, sans ouvrir le popup ; recherche/vue/contexte conservés, défauts métier du module restaurés et pagination remise à la première page pour les deux actions. Retour du focus sur Filtres après activation, accessible au clavier. Aucun contrôle local dupliqué, aperçu inline Paramètres conservé. Contrats docs 04/07 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 245 tests / 56 fichiers, build), trois parcours Playwright Contacts/réinitialisation rapide/Ventes réussis : critères multiples, groupes/tri, reset URL avec page=2, conservation q/vue, focus Enter, absence sans critère, clair/sombre, 1440/900/390/320 px dans la régression, largeur et déclencheur contigu. Captures inspectées, git diff --check réussi. Pas de suite navigateur exhaustive ni recette base réelle/NAS ; avertissement de chunks et logs d’annulations de navigation de fixture conservés.
- Livraison locale sans commit/push ni installation NAS. Frontend seulement, aucun hook/migration/pack PocketBase supplémentaire ; pack Produits précédent inchangé. Prochaine action : validation utilisateur de la croix partagée.


### Recherche : largeur desktop augmentée — 13 octobre 2026

- Livré localement dans le CSS partagé : maximum de 600 à 720 px et part desktop de 55 à 62 %, centrage conservé, règles mobile conservées. Menu utilisateur autorisé à rétrécir pour appliquer son ellipse existante et garder les icônes accessibles, après détection d’un débordement lors de la première revue. Contrat doc 07 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : lint et TypeScript réussis, deux parcours Playwright Contacts/filtres/reset réussis après ajustement du menu : desktop, 900/390/320 px, clair/sombre, absence de débordement, saisie/filtres et clavier. Capture desktop inspectée, git diff --check réussi. Build/tests unitaires/backend non rejoués pour ces seules dimensions CSS ; aucune recette sur base réelle/NAS.
- Livraison locale sans commit/push ni installation NAS. Aucun hook/migration/pack PocketBase supplémentaire. Aucun travail restant pour l’élargissement demandé.


### Facturation : accueil en onglets Clients / Fournisseurs — 13 octobre 2026

- Livré localement : un seul côté affiché à la fois dans HRecordTabs partagé, Clients par défaut, Fournisseurs persisté par direction=supplier. Synthèse/échéances/brouillons/sources et création contextuels ; lien Toutes les factures à droite des onglets. Sections vides avec message seul, sans en-tête/table inutiles ; suppression du cumul des marges entre onglets/cartes/sections avec tokens existants. Fil d’Ariane des listes/fiches fournisseurs et règlements Fournisseurs restituant le bon onglet. Revue mobile : largeur naturelle des onglets dans HRecordTabs avec actions, actions passant à la ligne plutôt que tronquer Clients ; correctif partagé avec les autres fiches. Aucun changement métier, données, calculs, permissions ou intégrations. Contrats Finance 04/05/06/08 vérifiés, docs 04/07 et travaux actifs actualisés ; statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 245 tests / 56 fichiers, build). Cinq parcours Playwright Facturation réussis : dashboard/validation/règlement/avoir, fournisseur/fichier/duplication, studio, conditions de paiement, frise/sources/référence client. Après ajustement du composant partagé : cycle Facturation et régression Devis/Commandes réussis ensemble ; cycle Facturation rejoué après harmonisation finale des marges, réussi. Onglets/sélection clavier/URL/rechargement/liens et retours de fiches, une seule synthèse, tableaux vides, clair/sombre/mobile avec les deux onglets visibles, captures inspectées ; git diff --check réussi. Pas de suite exhaustive/backend ni recette sur base réelle/NAS, avertissement de chunks et logs d’annulations de navigation de fixture conservés.
- Livraison locale sans commit/push ni installation NAS. Frontend seulement, aucun hook/migration/pack PocketBase supplémentaire ; Sage/SUPER PDP restent en standby. Prochaine action : validation utilisateur de l’accueil allégé.


### Factures fournisseurs : préparation depuis le BC et rattachement à la création — 13 octobre 2026

- Livré localement : onglet Informations partagé sur la commande fournisseur, action Préparer la facture fournisseur à droite des onglets pour BC actif validé et droits d’écriture Facturation, masquée lorsque toutes les quantités sont couvertes. Ouverture d’une facture préremplie sans sauvegarde automatique. À la création fournisseur, combobox Bon de commande fournisseur raccordée au service de préparation existant : fournisseur, lignes/produits/références, quantités restantes, prix nets/remises, TVA et ventilations analytiques. Confirmation avant remplacement de lignes saisies, conservation de la référence fournisseur, dates, notes et modèle ; conditions recalculées et échéancier réinitialisé. Préparation avancée multi-sources/réceptions conservée. Enregistrement bloqué pendant la préparation, erreurs et nouvelle tentative visibles. Contrats docs 04/05/06/07 actualisés, intégrations doc 08 vérifiées ; travaux actifs actualisés, statuts/compteurs inchangés.
- Correctif serveur découvert par le parcours réel : projection Purchasing/Billing lisant order_number plutôt qu’un champ number inexistant, pour restituer le numéro du BC dans les choix/titres/références. Aucun nouveau champ, migration, permission ou changement des snapshots historiques ; protections serveur contre la double facturation et des pièces immuables conservées.
- Vérifications : pnpm check réussi (lint, TypeScript, 247 tests / 57 fichiers, build), deux régressions serveur Factures fournisseurs réussies, six parcours Playwright Facturation réussis ensemble puis cycle Achats isolé réussi. Nouveau parcours : absence du bouton sur brouillon, emplacement près des onglets, préparation/enregistrement/liens analytiques et sources exactes, bouton masqué et refus serveur quand tout est couvert, annulation libérant les quantités, choix BC avec confirmation/annulation, conservation référence/dates, préremplissage et accès en lecture seule. Clair/mobile sombre vérifiés, captures inspectées, git diff --check et ZIP/empreintes vérifiés. Suites exhaustives backend/navigateur, Gotenberg réel et recette sur base réelle/NAS non exécutés ; avertissement build de chunks conservé.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-supplier-invoice-20261013.zip préparé : 198 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 7423939ebdf4051968b60f31227f2dfc9ebf4255d00a74d7f00fb43b128ec6c7. Depuis product-stock : seul lib/purchasing-billing-source.js change, à remplacer puis redémarrer avec le frontend correspondant ; aucune migration supplémentaire. Sage/SUPER PDP restent en standby. Prochaine action : installation du hook et validation utilisateur des deux parcours.


### Factures : action de préparation au niveau des onglets — 13 octobre 2026

- Livré localement : action sortie du titre Informations et placée dans le slot actions de HRecordTabs, à droite des onglets. Libellé Préparer depuis BC pour les factures fournisseurs ; action client déplacée au même niveau avec son libellé existant. Taille et responsive partagés, visibilité/droits/état modifiable et popup de préparation conservés. Docs 04/07 et travaux actifs actualisés ; contrats Finance 05/06/08 vérifiés sans changement de données, permissions ou intégration, statuts/compteurs inchangés.
- Vérifications : lint et TypeScript réussis ; parcours Playwright fournisseur réussi après stabilisation de la saisie de date dans le scénario (validation par Tab avant l’étape suivante). Contrôle du libellé, présence dans les actions des onglets et alignement desktop, ouverture/fermeture du popup, préremplissage/enregistrement, couverture des quantités et droits lecture seule ; clair/mobile sombre, absence de débordement et captures inspectées. git diff --check réussi. Build, suites exhaustives/unitaires/backend non rejoués pour ce déplacement frontend ; aucune recette base réelle/NAS.
- Livraison locale sans commit/push ni installation NAS. Aucun hook/migration/pack supplémentaire : pack fournisseur précédent inchangé. Aucun travail restant pour le déplacement demandé.


### Facturation : cinq cartes de synthèse sur une ligne — 13 octobre 2026

- Livré localement sur les deux dashboards Clients/Fournisseurs : cinq cartes de même largeur sur une ligne desktop, via l’option columns=5 de HSummaryCards partagé. Détail sous la valeur pour conserver la lisibilité des cartes étroites ; repli partagé en deux colonnes à 1000 px et moins, couleurs et données inchangées. Contrat doc 07 et travaux actifs actualisés, statuts/compteurs inchangés ; aucune modification métier, permissions, données ou intégrations.
- Vérifications : lint et TypeScript réussis ; parcours Playwright dashboard/client/validation/règlement/avoir réussi, assertions des cinq cartes sur la même ligne dans chaque onglet, navigation/URL et mobile sombre sans débordement inclus. Captures des deux dashboards desktop et fournisseur mobile inspectées, git diff --check réussi. Build et suites exhaustives/unitaires/backend non rejoués pour cette présentation ; aucune recette base réelle/NAS.
- Livraison locale sans commit/push ni installation NAS. Aucun hook/migration/pack supplémentaire requis. Aucun travail restant pour l’alignement demandé.


### Employés : Cartes par défaut — 13 octobre 2026

- Livré localement : /hr sans paramètre view ouvre Cartes ; Liste utilise view=list, Organigramme view=org, anciens liens view=cards compatibles. Retour Cartes retire le paramètre, autres critères conservés. Tri par nom de famille, photos, droits et groupes inchangés. Contrats docs 04/07 et travaux actifs actualisés, statuts/compteurs inchangés.
- Vérifications : lint et TypeScript réussis ; parcours Playwright Employés/Accès réussi, ouverture par défaut Cartes, choix Liste explicite et persistance après rechargement, filtres/groupes/recherche, organigramme, photos et accès limité en lecture seule, clair/mobile sombre inclus. Capture Cartes inspectée et git diff --check réussi. Build et suites exhaustives/unitaires/backend non rejoués pour ce choix de présentation ; aucune recette base réelle/NAS.
- Livraison locale sans commit/push ni installation NAS. Frontend seulement, aucun hook/migration/pack supplémentaire. Aucun travail restant pour la vue par défaut demandée.


### Publication Git du lot filtres, Employés, Stock et Facturation — 13 octobre 2026

- Périmètre : changements cumulés depuis la dernière publication, filtres dynamiques Ventes/Achats/Stock et paramètres UX, règles partagées d’archivage/recherche/regroupements, bascule Opérations, cartes Employés par défaut et tri par nom de famille, photos gérées sur Employés et reprises par les comptes, quantité physique dans Produits, croix/largeur de recherche, onglets et cartes Facturation, préparation fournisseur depuis BC. Documentation canonique, migrations additives 1791840007/1791840008 et régressions incluses. Statuts et compteurs inchangés.
- Vérifications préalables à la publication : pnpm check réussi (lint, TypeScript, 247 tests / 57 fichiers, build), git diff --check réussi ; fetch origin et comparaison HEAD/origin/main sans divergence avant commit. Parcours navigateur et tests PocketBase ciblés réalisés pendant les interventions et détaillés dans leurs entrées ; suites exhaustives backend/navigateur non rejouées pour cette publication. Avertissement build de chunks conservé.
- Livraison Git : lot vérifié pour commit et push sur origin/main à la demande utilisateur ; résultat confirmé par les commandes Git de l’intervention. Aucun déploiement ni installation NAS effectué. Dernier pack PocketBase fournisseur préparé séparément ; application des hooks/migrations et recette NAS restent à effectuer, Sage/SUPER PDP en standby.


### Notes de frais : proposition de cadrage mensuel et validation manager — 13 octobre 2026

- Investigation à la demande utilisateur : contrats Expenses existants dans docs 04/05, permissions/hiérarchie HR et notifications existantes examinés. Module non livré ; entrée de navigation présente, droits Expenses encore indisponibles. Proposition à valider : note mensuelle avec lignes catégorisées, justificatifs protégés multiples et aperçu partagé, invités restaurant liés aux contacts, affaire/analytique ou client/contact, parcours Mes notes / À valider, soumission/validation/retour motivé avec notifications internes ; remboursement distinct de la validation.
- Vérifications : lecture de documentation, navigation, schémas Employés, policy d’accès et NotificationService ; aucun changement de code, migration ou test exécuté. Statuts/compteurs inchangés : H04 reste À faire. La proposition ne constitue pas un contrat validé ni une fonctionnalité livrée.
- Livraison : investigation et suivi local seulement, sans commit/push ni installation NAS. Prochaine action : validation du cadrage utilisateur, puis mise à jour des contrats canoniques, migrations et implémentation ; dépenses internes sans client à arbitrer. Sage/SUPER PDP restent en standby.


### Notes de frais E01 : saisie mensuelle, validation manager et justificatifs — 14 octobre 2026

- Livré localement après validation du cadrage : module expenses intégré au routeur/navigation/permissions, onglets Mes notes / À valider, synthèse, recherche/filtres multi-états/archives séparées/groupes/tri/pagination partagés et contexte URL. Une note principale par employé/mois, création idempotente, compléments liés après validation. Fiche avec frise, informations, Dépenses / Historique, totaux sous les lignes ; table réordonnable seulement en édition, déplacement persisté côté serveur. Popup de dépense : formulaire à gauche et aperçu à droite via HAttachmentWorkspace/details, picker partagé extrait des commandes, fichiers multiples/import/retrait, picto rose. Catégories restaurant/invités contacts/participants internes, parking, carburant/véhicule, train/avion/hôtel/trajet, matériel et autres paramétrées via table et popup Paramètres communs. Affaire reprenant son analytique et client/contact, rattachement simple ou frais internes ; paiement personnel/entreprise, TVA justificative et remboursement personnel distinct.
- Workflow serveur transactionnel : brouillon → soumis → validé → remboursé, retour motivé/resoumission, annulation/reprise, compléments/archives, réaffectation globale motivée. Principal habilité par défaut, secours global explicite, absence bloquante ; aucune auto-validation ni seuils. Justificatifs/complétude requis à soumission, brouillons privés, fichiers protégés par scope, notes/pièces figées après validation, snapshots des identités/libellés/relations/montants/devise/taux. Audit core_audit distinct du fil core_activity_events ; notifications internes aux destinataires avec lien/lecture. Aucun virement, Sage/PDP, export comptable ou raccordement de marge d’affaire ; EUR/taux 1 en E01. Contrats 04/05/06/07/09 et README actualisés, architecture 08 conservée. H04 passe à En cours : compteurs 2 terminés / 20 en cours / 10 à vérifier / 0 bloqué / 14 à faire sur 46 ; congés et raccordements H04 restent à traiter.
- Vérifications : pnpm check réussi (lint, TypeScript, 250 tests / 58 fichiers, build), lint/TypeScript rejoués après les derniers messages et titres mensuels, git diff --check réussi. 17 tests serveur Expenses/Access-HR/Notifications réussis puis test de montée depuis 1791840008 réussi : données anciennes conservées, droits Admin additifs, migrate up répété sans doublon ; les cinq tests Expenses rejoués sur la version finale. Trois parcours Playwright Facturation/dashboard et commandes/PJ + Expenses réussis ensemble, puis Expenses rejoué avec captures mobile stabilisées et derniers messages, réussi. Couvre mois unique, catégories/rattachements/analytique/invité, justificatifs multiples/aperçu, refus sans PJ, fonds entreprise exclus, manager en lecture seule, notification/lien/lecture, correction/resoumission/validation/historique/remboursement, clair/mobile sombre et popup mobile. Captures inspectées ; fixtures seules, aucune recette sur base réelle/NAS, suites backend/navigateur exhaustives non rejouées. Avertissement build de chunks et logs d’annulations/ResourceWarning des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-expenses-20261014.zip préparé : 201 hooks/assets/migrations plus manifeste/instructions, ZIP et empreintes vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 8356d32b35d184cb31cb51a902aa56e4bd600ac75458df763f4dcea09072fac5. Depuis supplier-invoice : trois ajouts Expenses (hook/lib/migration), Access policy/management et Tax à remplacer, migrate up puis redémarrage avec frontend cohérent. Prochaine action : installation et recette utilisateur des habilitations/saisie/validation/remboursement sur ses données.


### Notes de frais : popup structuré, mois éditable et vrai fil Horizon — 14 octobre 2026

- Correction locale à la demande utilisateur : popup en zones HSectionHeading/panneaux communs La dépense / Montants et paiement / Rattachement / Participants ou déplacement/véhicule ; justificatifs nommés et aperçu à droite conservés. Densité corrigée en ciblant les sections directes du volet partagé et en réutilisant access-fieldset, sans nouveaux composants de formulaire. Fiche : mois éditable sur principal draft/returned, dates/PJ conservées, conflit mensuel refusé, dépenses hors mois signalées et soumission bloquée ; mois des compléments et pièces validées figés. Titre Lignes de frais et espace de contenu canonique. Suppression de l’onglet/tableau Historique, ActivityPanel partagé sous les lignes : commentaires, mentions, tâches, documents, auteurs/avatars et transitions/motifs lisibles. Cache de destinataires isolé par fiche et filtre du périmètre avant limite de résultats. Contrats 04/05/06/07/09 et README actualisés, travaux actifs à jour ; statuts/compteurs inchangés.
- Serveur : source Expenses raccordée aux services Activity existants, contrôle propriétaire/validateur/global et archivage sur chaque opération, aucun accès via mention. Migration 1791840010 avec une branche corrélée source pour View/File/contribution des événements/tâches ; lecture paginée via routes métier existantes, pas d’expansion globale de ListRule. Backfill metadata.author des seuls anciens événements Expenses ; notes, snapshots et preuves financières conservés. Aucun nouveau champ financier ni intégration externe.
- Vérifications : pnpm check réussi (lint, TypeScript, 250 tests / 58 fichiers, build), lint/typecheck rejoués après derniers ajustements. 22 tests PocketBase Expenses/Activity/Notifications réussis ; deux tests additionnels fichiers du fil/mise à niveau E01 réussis (IDs/corps/dates/notes conservés, migrate up répété), scénario de destinataires/tâches rejoué avec succès après optimisation du filtre. Trois parcours Playwright Facturation et Expenses réussis ensemble puis deux parcours commande/PJ et Expenses rejoués après correction de densité, réussis : zones, changement de mois/retour, dates et PJ intactes, commentaire dans le vrai fil, circuits user/manager/remboursement, clair/mobile sombre et popup mobile. Captures inspectées, git diff --check et ZIP/empreintes vérifiés. Premier test mention attendait 400 au lieu du refus 403 réel, corrigé sans modifier les permissions ; suites exhaustives backend/navigateur non rejouées, aucune recette sur base réelle/NAS. Avertissement build de chunks et logs d’annulations/ResourceWarning de fixture conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-expenses-ux-20261014.zip préparé : 202 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 1deb5ec93df0ccdcb8643dce2b6c79dc7f1e3d09f72130afb78cb266bb05e84e. Depuis E01 : ajouter migration 1791840010, remplacer Expenses + Activity/core/read/request, migrate up et redémarrage avec frontend cohérent. Prochaine action : installation et validation utilisateur de la fiche harmonisée.


### Notes de frais : colonne Actions compacte et centrée — 14 octobre 2026

- Ajustement local du tableau des dépenses : colonne Actions de 88 px, titre centré et boutons regroupés/centrés horizontalement et verticalement, sans retour à la ligne. Largeurs optionnelles dans HDataTable et classe partagée h-table-cell-actions ; tableaux existants inchangés par défaut. Règle durable ajoutée au Design System. Aucun changement PocketBase.
- Vérifications : lint et TypeScript réussis, parcours Playwright Expenses réussi (saisie/PJ, édition, lecture manager, validation/remboursement, mobile sombre), capture desktop inspectée et git diff --check réussi. Pas de suite exhaustive ni de recette NAS.
- Livraison locale sans commit/push ; pack backend précédent inchangé. Statuts/compteurs inchangés. Prochaine action : validation visuelle utilisateur.


### Recherche sociétés : rappel du fournisseur utilisé — 14 octobre 2026

- Investigation : documentation Contacts/Intégrations/Sécurité et CompanyLookupRepository confirment l’API publique recherche-entreprises.api.gouv.fr, appelée depuis le navigateur par nom/SIREN/SIRET. Pappers est une ancienne décision remplacée. Sélection puis sauvegarde explicite.
- Vérifications : lecture du code et des contrats locaux uniquement ; aucun appel externe ni test exécuté. Aucun changement applicatif ou backend, statuts/compteurs inchangés. Documentation locale sans commit/push ; aucune installation NAS. Pas de travail restant pour ce rappel.


### Commande fournisseur : stock disponible dans le sélecteur produit — 14 octobre 2026

- Ajout local de Disponible avant Actions dans Ajouter un produit depuis une commande fournisseur. ProductPicker commun avec option explicite activée sur les BC ; réutilise available_quantity serveur et unité de base, six décimales maximum, zéro réel et tiret si valeur absente/sans stock. Aucun calcul de solde React, nouvelle requête, schéma ou migration ; contrat 04 actualisé.
- Vérifications : lint, TypeScript et git diff --check réussis ; les trois parcours Playwright Purchasing réussis (44,8 s), capture du popup BC inspectée avec 0 u visible avant Actions. Suites exhaustives non rejouées, aucune recette sur base réelle/NAS. Logs des refus attendus et requêtes annulées des fixtures conservés.
- Livraison locale sans commit/push ; aucun changement du pack backend. Statuts/compteurs inchangés. Prochaine action : validation utilisateur.


### Liste Produits : quantité disponible après le stock physique — 14 octobre 2026

- Ajout local de Qté disponible immédiatement après Qté en stock dans la liste /inventory et ses groupes. Projection available_quantity existante, unité de base/format six décimales, alignement à droite, zéro réel et tiret sans stock/projection. Aucun changement serveur, schéma ou migration ; spécification 04 actualisée.
- Vérifications : lint et TypeScript réussis ; parcours Playwright Catalogue cartes/disponibilité/contexte réussi (6,9 s), vérifications des deux en-têtes/ordre et quantités physiques/disponibles adaptées, captures desktop et mobile sombre inspectées ; git diff --check réussi. Tests exhaustifs non rejoués, pas de recette sur base réelle/NAS.
- Livraison locale sans commit/push ; pack backend inchangé. Statuts/compteurs inchangés. Prochaine action : validation utilisateur.


### Publication du lot Notes de frais et quantités disponibles — 14 octobre 2026

- Publication demandée par l’utilisateur : ensemble local E01/UX notes de frais, habilitations/notifications/fil, migrations 1791840009 et 1791840010, composants partagés et corrections Actions/stock disponible dans BC et liste Produits. Aucun secret/base/pack NAS dans Git.
- Vérification finale pnpm check réussie : lint, TypeScript, 250 tests sur 58 fichiers et build ; avertissement connu de taille des chunks. git diff --check réussi. Régressions backend et navigateur précédemment exécutées documentées dans les entrées du lot ; trois parcours Purchasing et parcours Catalogue ciblé réussis sur les dernières colonnes. Pas de nouvelle recette NAS ni de suite backend exhaustive.
- Livraison : commit 704d75a publié sur origin/main, push confirmé (b086b53 → 704d75a). Pack PocketBase Expenses UX inchangé, installation NAS non confirmée. Journal de publication actualisé dans un commit documentaire de suivi ; statuts/compteurs inchangés.


### Tri dans les en-têtes des listes principales — 14 octobre 2026

- À la demande utilisateur, bouton partagé HTableSortButton : double flèche neutre, sens actif rose, alternance croissant/décroissant, bouton clavier natif et aria-sort. Contacts/CRM utilisent leur adaptation existante ; useListTableSorting raccorde Produits, Ventes, Achats, factures/avoirs/règlements, employés/équipes/utilisateurs, notes de frais, disponibilités/opérations/inventaires/parc interne. Critères disponibles déclarés explicitement, pas de faux tri sur Actions/relations multiples ; panneau commun et URL synchronisés, contexte/vues conservés, pagination remise au début. Tableaux de saisie et ordre métier des pièces inchangés. Contrats 04/05/06/07/09 et README actualisés, travaux actifs Recherche/Catalogue à jour, statuts/compteurs inchangés.
- Serveur : helper list-sorting en allowlist, deux directions et départage stable ; tri global avant découpage des listes, prix/famille/quantités Catalogue projetés sur les résultats filtrés, limite 10 000 conservée. Anciens liens amount/payment_date des règlements et amount des frais conservés via alias explicites distincts. Aucune collection/migration, écriture de pièce, changement de permission ou d’intégration externe.
- Vérifications : pnpm check final réussi (lint, TypeScript, 255 tests / 60 fichiers, build avec avertissement connu de chunks), git diff --check réussi. 29 tests Catalogue/tri du premier passage réussis ; deux tests serveur ciblés tri global/routes/permissions et cinq régressions Purchasing/Sales/Billing/Expenses/Stock réussis. Deux parcours Playwright Catalogue et tri principal réussis ensemble (17,4 s), avec jeux Contacts/CRM/Employé/Frais : première page, ordre global de 27 prix, URL/rechargement/panneau, clics des principales listes et mobile sombre ; captures desktop/mobile inspectées. Fixtures initiales vides et sélection incluant les poignées de largeur corrigées ; harness de test serveur exécuté en VM CommonJS sans modification du backend. Suites exhaustives backend/navigateur non rejouées, aucune recette sur données réelles/NAS.
- Livraison locale sans commit/push. Pack /private/tmp/horizon-pocketbase-column-sorting-20261014.zip préparé : 203 hooks/assets/migrations plus manifeste/instructions, ZIP et empreintes conformes au code local, sans frontend/base/exécutable/secrets ; SHA-256 28fbadfc251c2c19fead8794031b52e829224d60632cfe7616218963925001e8. Depuis Expenses UX : ajouter list-sorting.js et remplacer les huit bibliothèques de listes décrites dans 06, redémarrer avec le frontend cohérent ; aucune migration supplémentaire pour le tri. Installation NAS non effectuée. Prochaine action : installer les hooks et valider les critères de tri sur les listes métier réelles.


### Tri complet des colonnes et flèches à droite — 14 octobre 2026

- Reprise à la demande utilisateur : toutes les colonnes métier des listes principales auditées ont un bouton, seule Actions est exclue ; flèche à l’extrémité droite, alignement du titre conservé. Complète relations/sociétés/fournisseurs/affaires/états/références client, HR/comptes/équipes, validation des frais, CRM/AO/étapes/tags/visites/documents/responsables, quantité/emplacement/valorisation et parc. HTableSortButton commun et HSortableTableHeader pour le tableau natif Utilisateurs ; aucun tri d’édition de pièce. Panneau commun, URL/rechargement et vues enregistrées Contacts cohérents ; défauts et anciens formats/liens conservés. Contrats 04/05/06/07/09 et README actualisés, travaux actifs mis à jour, statuts/compteurs inchangés.
- Serveur : projections autorisées triées avant pagination, comparaisons des libellés visibles / relations ordonnées / comptes numériques / proportion prête, départage stable et données absentes en fin. CRM : filtres partagés avec summary, nouvel index de page d’IDs sous crm.read frais et corps relus via API Rules, aucun nom de société utilisé sans contacts.read. Contacts : group=none, nouveaux critères et filtre société/navigation, allowlists des vues élargies sans changer les vues stockées. Disponibilités : 30 lignes produit/emplacement par page et compte de lignes, synthèses toujours par produit distinct ; limite 10 000 lignes, caches et calcul des projections seulement pour le critère ou la page. Aucun schéma/migration, mouvement, pièce historique, droit de lecture ou intégration externe modifié.
- Vérifications : pnpm check final réussi (lint, TypeScript, 258 tests / 60 fichiers et build), git diff --check et ZIP/empreintes conformes au code. 17 tests serveur ciblés et régressions réussis (43,6 s) : tri global 32 lignes sur deux pages, relations Contacts/CRM/droits, allowlists et sauvegarde de vues, AO, synthèses/filtres, paiements et ordre des frais. Deux parcours Playwright tri complet et Expenses réussis ensemble (30,6 s) après extraction finale de l’en-tête natif : chaque en-tête métier vérifié avec bouton et flèche à ≤16 px du bord, Actions sans bouton, clics de critères auparavant absents et mobile sombre ; captures desktop/mobile inspectées. Audit a détecté l’ancienne enum des vues enregistrées incompatible avec les nouveaux tris, corrigée frontend/serveur et couverte par tests. Pas de suite backend/navigateur exhaustive, pas de recette sur données réelles/NAS ni mesure de charge maximale. Avertissement de chunks et logs des refus/annulations de fixtures conservés.
- Livraison locale sans commit/push ; pack précédent de tri remplacé par /private/tmp/horizon-pocketbase-column-sorting-complete-20261014.zip : 205 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 6b0aab3bcd12d8fde8fc446a5e742bf5ff30b709bedc03274e85e19b6c0dc0a7. Installer les hooks consolidés et les deux nouvelles bibliothèques CRM, redémarrer avec le frontend cohérent ; aucune nouvelle migration pour le tri. NAS non installé. Prochaine action : installation des hooks puis validation utilisateur des tris complets.

### Notes de frais : fiche et ajout de dépense harmonisés — 15 octobre 2026

- À la demande utilisateur : bouton Ajouter une dépense sous les lignes sur le pattern DA/devis, # puis Date, Description, Payé par Employé / Société. Informations Employé propriétaire non modifiable / Mois / Manager et description multiligne pleine largeur ; Manager remplace Validateur dans liste, fiche, critères, actions et trois erreurs serveur. Aucun nouveau champ/migration, droits et remboursement inchangés.
- Popup avec onglets partagés Dépense / Justificatifs, zones pleine largeur, participants restaurant près de la catégorie, défilement interne et actions fixes. Gestionnaire de fichiers/aperçu partagé conservé ; trombone ouvrant directement les pièces, saisies et fichiers conservés entre onglets. Contrats 04/05/06/07/09 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (258 tests / 60 fichiers, lint/TypeScript/build), lint/typecheck final réussis. Sept tests serveur Expenses réussis (17,9 s). Playwright Expenses final réussi (16 s), y compris ordre clavier persisté après rechargement, description pleine largeur, propriétaire, payeurs, restaurant mobile, pièces multiples, notifications, retour/validation/remboursement. Régression tri principal réussie avec libellé Manager ; captures desktop clair et mobile/sombre inspectées. Test analytique initial ciblant la première ligne corrigé pour cibler le déjeuner après réordonnancement ; pas de correction métier associée. Suites exhaustives backend/navigateur et recette sur données réelles/NAS non exécutées ; avertissement connu des chunks et logs d’annulation/ResourceWarning des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé /private/tmp/horizon-pocketbase-expenses-ux-20261015.zip préparé, 205 hooks/assets/migrations plus manifeste/instructions vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 8fcb390d44fb0eaf840b5d6fa08e327b99b0e3101dbc4c749da404260eeb0405. Inclut le lot de tri complet antérieur ; aucune nouvelle migration pour cet ajustement UX. Prochaine action : validation utilisateur puis livraison/recette NAS du frontend et des hooks cohérents.

### Notes de frais : titre unique des lignes — 15 octobre 2026

- Suppression de l’onglet isolé Dépenses ; titre partagé Lignes de dépenses (n), compteur réel. Actions de complément et changement de manager conservées dans le slot du titre avec les mêmes droits. CSS d’espacement devenu inutile retiré ; contrat UX actualisé. Aucun changement de données/backend/migration, statuts et compteurs inchangés.
- Vérifications : lint, TypeScript et git diff --check réussis ; parcours Playwright Expenses complet réussi (15,9 s), assertion du titre avec deux lignes et absence de l’ancien onglet, capture desktop inspectée ; mobile sombre également couvert par ce parcours. Suites exhaustives non rejouées, pas de recette NAS.
- Livraison locale sans commit/push ; pack backend inchangé, NAS non installé. Prochaine action : validation utilisateur du titre simplifié.

### Notes de frais : espacement avant le titre des lignes — 15 octobre 2026

- Correction après suppression de l’onglet : séparation Informations / Lignes de dépenses rétablie via h-record-lines, même déclaration CSS et token --hz-record-section-gap que les lignes Devis, également utilisé par le formulaire DA. Aucune valeur locale ; règle canonique UX précisée pour préserver cet espace après suppression d’un onglet. Aucun changement métier/backend/migration, statuts et compteurs inchangés.
- Vérifications : lint, TypeScript et git diff --check réussis. Parcours Playwright Expenses complet réussi (15,9 s), avec nouvelle mesure de la distance réelle entre informations et lignes égale au token commun ; capture desktop inspectée, parcours mobile sombre conservé. Comparaison des patterns Devis/DA dans le code existant ; pas de nouvelle recette navigateur de ces deux modules ni de suite exhaustive.
- Livraison locale sans commit/push, pack backend inchangé, aucune installation NAS. Prochaine action : validation utilisateur de l’espacement harmonisé.

### Notes de frais : colonnes métier du popup, duplication et code affaire — 15 octobre 2026

- Demande utilisateur interprétée comme gauche Dépense puis Rattachement, droite Catégorie et champs conditionnels (la seconde mention gauche était ambiguë, hypothèse annoncée). Montants/TVA/payeur regroupés avec date/description ; catégories et participants/trajet/véhicule dans le panneau droit. Onglets de saisie et justificatifs, contrôles partagés, densité et pied fixe conservés, repli mobile en une colonne. Code affaire en tag dans rattachement et tableau, avec affichage historique snapshoté.
- Icône Dupliquer sur les lignes modifiables : popup prérempli, enregistrement d’une ligne indépendante en fin de note, totaux serveur, aucun justificatif recopié et explication explicite. Aucun nouvel endpoint, schéma/migration ni droit. DTO des lignes enrichi de opportunity_number et choix de number ; JSON de validation existant enrichi pour les nouvelles validations, pièces historiques non modifiées. Contrats 04/05/06/07/09 et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications : pnpm check réussi (lint/TypeScript, 258 tests / 60 fichiers et build), git diff --check réussi. Huit tests serveur Expenses réussis (19,4 s), dont gel du code et titre après validation et changement CRM. Parcours Playwright Expenses final réussi (15,2 s) : disposition des colonnes, alternance Carburant/Train/Restaurant, code visible, copie et original/PJ distincts, totaux, retrait de copie, ordre, notifications, retour/validation/remboursement et copie absente après soumission. Captures desktop clair, formulaire mobile et fiche mobile sombre inspectées. Suites exhaustives backend/navigateur et recette sur données réelles/NAS non exécutées ; avertissement connu de chunks et logs de fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé /private/tmp/horizon-pocketbase-expenses-layout-20261015.zip : 205 hooks/assets/migrations plus manifeste/instructions vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 e12efea981546d53649cc62be15cfdc6cf06657697a2ff1a7595799f06a2fa77. Remplace expenses-ux-20261015, inclut le tri complet antérieur ; remplacer Expenses et déployer le frontend cohérent, aucune nouvelle migration. Prochaine action : validation utilisateur puis installation/recette NAS.

### Notes de frais : référentiel véhicules et combobox Carburant — 15 octobre 2026

- Nouvelle collection propriétaire expenses_vehicles : marque, modèle, immatriculation normalisée unique, relation employé et actif. Onglet Paramètres Notes de frais → Véhicules, CRUD contrôlé/audité avec désactivation, tableau/popup partagés et sauvegarde en haut à droite. Combobox Carburant limitée aux véhicules actifs de l’employé, proposition si un seul choix, réouverture et duplication conservant la relation. Champs conditionnels uniques pleine largeur, case Actif partagée rose, onglets et styles comparés aux paramètres voisins.
- Migration additive 1791840011 : vehicle_record ajouté sans modifier le texte vehicle ni les snapshots/identités des notes existantes. Pas de déduction automatique de véhicule à partir d’une ancienne chaîne. Serveur dérivant le libellé, refus de nouveau véhicule étranger/inactif ou d’un nouveau texte libre, maintien des liaisons et libellés déjà enregistrés après réaffectation/désactivation. REST natif verrouillé, gestion Admin/Superuser via policy.settings ; aucun changement des droits métier de validation/remboursement. Contrats 04/05/06/07/09, README et travaux actifs à jour ; statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (258 tests / 60 fichiers, lint/TypeScript/build), lint/typecheck final et git diff --check réussis. Douze tests serveur Expenses et migrations réussis (30 s), dont unicité/droits/affectation/version/historique et passage depuis 1791840010 répété, ancien vehicle/snapshot/updated conservés. Le premier essai de migration a détecté des champs non ajoutés par le constructeur Collection ; corrigé avec fields.add comme les migrations existantes avant tous les passages réussis. Premier navigateur interrompu pendant cet essai et un timeout transitoire lors d’un passage parallèle ; parcours rejoués seuls réussis. Playwright final couvre création en Paramètres, URL, proposition, sauvegarde/réouverture carburant et cycle complet des frais ; captures desktop clair, popup et mobile sombre inspectées. Suites exhaustives backend/navigateur et recette NAS non exécutées ; avertissement connu de chunks et logs de fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-expenses-vehicles-20261015.zip préparé et vérifié : 206 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 1871c5598519f217bf4397482b3e5abb9a1a1f896bbe88d820ab05c3530581c0. Remplace expenses-layout-20261015, inclut le tri complet antérieur ; migration 1791840011 requise, redémarrage puis frontend cohérent. Prochaine action : installation/recette NAS puis renseignement des véhicules réels.

### Stock : origine et destination des opérations, date et source — 15 octobre 2026

- Tableau identifié comme Stock → Opérations d’après Entrepôt et la demande fournisseur/client, hypothèse annoncée. Ordre Numéro / Date / Document d’origine / De / Vers, puis colonnes métier conservées ; Entrepôt retiré de la liste des opérations, Inventaires conservé. Réceptions fournisseur → stock, livraisons stock → client, dropship fournisseur → client, transferts sites/emplacements, retours inversant la source ; rebut et parc identifiés explicitement. Document source BC / commande client ou devis / bon retourné, avec liens autorisés ; en-têtes, tris, filtres/groupes et contexte partagés.
- Nouvelle projection lib/stock-operation-route, appelée depuis le DTO Inventory, allowlist de tri élargie aux trois projections avant pagination. Identités opérationnelles existantes et snapshots disponibles réutilisés, liens sources filtrés par leurs permissions ; aucun prix ou corps de document ajouté, aucun schéma/migration/mouvement modifié. Contrats 04/05/06/07/09 et travaux actifs actualisés, statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint/TypeScript, 258 tests / 60 fichiers et build), lint/typecheck final et git diff --check réussis. Six tests serveur ciblés réussis (4 en 9,3 s, 2 en 4,5 s) : flux et sources, restrictions des liens, retour fournisseur et chantier/client, transfert et transit, dropship et tris. Trois parcours Playwright réussis ensemble (48,1 s), tri complet, filtres Stock, achat → réception et navigation ; contrôle de l’ordre des colonnes, absence d’Entrepôt, boutons de tri et mobile sombre. Premier test d’en-tête De trop strict corrigé pour cibler le bouton, la poignée de largeur participant au nom accessible ; pas de modification métier associée. Captures réception desktop clair et mobile sombre inspectées. Suites exhaustives et recette sur données réelles/NAS non exécutées ; avertissement connu de chunks et logs d’annulations/refus attendus des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-operation-columns-20261015.zip : 207 hooks/assets/migrations plus manifeste/instructions vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 c9bef27a1fc8ee0407990b65d13a1b3aa7870e544f67d5b9a06144f5506211ce. Remplace le pack véhicules, contient les migrations antérieures jusqu’à 1791840011 si manquantes ; aucun ajout de migration pour les colonnes. Prochaine action : mettre à jour les deux bibliothèques et le frontend cohérent, puis recette utilisateur/NAS.

### Achats : ventilation plus large, quantités centrées et aperçu des sources — 15 octobre 2026

- Popup de ventilation partagé DA/BC élargi de 780 à 1 120 px desktop, colonne Commande de 160 à 340 px (minimum 260), quantité centrée dans le champ et la cellule. Flèches d’aperçu Affaire et Commande dans les composants existants, via RecordWorkspace et fiches canoniques, sans navigation ni perte de ventilation. Modes fixes/stock, densité, permissions et calculs inchangés. Projection commands.quote ajoutée sous les mêmes droits CRM/Ventes, allocation gardant son identifiant sales_orders ; aucun schéma/migration. Contrats 04/05/06/07/09 et travaux actifs à jour, statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (258 tests / 60 fichiers, lint/TypeScript/build), lint/typecheck final et git diff --check réussis. Premier lot serveur 29/30 passages réussis ; ancienne assertion Stock prenant la première ligne au lieu de l’emplacement de la fixture corrigée uniquement dans le test, puis six cas ciblés tous réussis (13,7 s) : cas repris, choix commande/quote et retrait du droit Ventes, quatre scénarios de ventilation fixe. Deux parcours Playwright finaux réussis ensemble (37,1 s), largeur mesurée, colonne Commande >300 px, quantité centrée, commande/affaire en popup avec URL inchangée et saisie temporaire 0,5 conservée, sauvegarde des ventilations/rechargement et mobile ; captures clair/sombre/mobile inspectées. Assertion initiale de titre corrigée pour la fiche canonique « Commande numéro », sans changement du produit pour le test. Pas de suite exhaustive ni de recette sur données réelles/NAS ; avertissement connu des chunks et logs des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-allocation-popup-20261015.zip préparé et vérifié : 207 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 61a28ea7e84bed0c57048d3b9dadef36dffba5ffe8c0feddf45002aad12556e6. Remplace operation-columns-20261015 et inclut les migrations antérieures jusqu’à 1791840011 ; aucune nouvelle migration pour cette correction. Prochaine action : remplacer lib/purchasing.js, redémarrer et charger le frontend cohérent, puis recette utilisateur/NAS.

### Devis / commandes : séparateurs alignés et cadre arrondi — 15 octobre 2026

- Reproduction du décalage : trait vertical porté par les poignées en en-tête mais par les cellules du corps. Bordure identique sur th/td, retrait du trait propre aux poignées. En commande, le titre sticky avait déplacé le cadre sur une table à bordures fusionnées sans rayon ; cadre désormais à bordures séparées, espacement nul et rayon partagé 6 px, titre toujours hors cadre. Colonnes proportionnelles aux largeurs calculées pour éviter le dépassement de bordure au passage en commande. Préférences, redimensionnement, sticky et lignes métier conservés ; aucun changement de données/backend/migration. Contrat UX et tests canoniques actualisés, travaux actifs à jour, statuts/compteurs inchangés.
- Vérifications : nouveau Playwright reproduisant le défaut avant correction, puis pnpm check réussi (lint/TypeScript, 258 tests / 60 fichiers et build), git diff --check réussi. Quatre parcours navigateur réussis ensemble (44,3 s) : nouvelle géométrie, sections/options/actions/drag, lignes d’espacement, facture/commande et titres/colonnes sticky. Limites de toutes les colonnes mesurées avant/après confirmation et redimensionnement, pas de débordement desktop, arrondis et mobile/sombre vérifiés ; captures inspectées. Affectation inutilisée du résultat API dans le test retirée au premier lint, aucune limite fonctionnelle restante identifiée sur ces parcours. Suites exhaustive/backend et recette sur données réelles/NAS non exécutées ; avertissement connu des chunks et logs d’annulations des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS ; packs PocketBase inchangés. Prochaine action : validation utilisateur de l’affichage, puis livraison du frontend selon le processus habituel.

### Devis / commandes : flèche produit accordée au texte grisé — 15 octobre 2026

- La flèche de consultation accolée à la description reprend le token du texte atténué lorsque le champ est désactivé, en clair et sombre. Lien produit conservé, sans changement des droits ni des données. Règle ajoutée au contrat UX canonique ; aucun backend/migration. Statuts et compteurs inchangés.
- Vérifications : lint, TypeScript et git diff --check réussis. Parcours Playwright préremplissage/produit étendu réussi (10,2 s), égalité des couleurs texte/flèche en clair, sombre et mobile, ouverture au clavier et au clic. Captures desktop clair/sombre inspectées ; mobile contrôlé par assertions sans capture dédiée. Premier essai bloqué par le contrôle Playwright des descendants de fieldset désactivé : test adapté au lien natif, sans modifier son fonctionnement. Suites exhaustives et recette NAS non exécutées ; logs d’annulations des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS ; packs PocketBase inchangés. Prochaine action : validation utilisateur puis livraison du frontend.

### Investigation : blocage du retour commande vers devis — 15 octobre 2026

- Contrôle du popup QuotePage, de sales-lifecycle.reopen, purchasing.assertReturn et des transitions Stock face au contrat fonctionnel. Le retour annule les anciennes commandes en préservant leurs documents ; assertReturn bloque actuellement toute opération liée au devis non annulée, y compris un BL brouillon sans exécution. Le message laisse donc croire à une exécution alors que seule la présence peut suffire. Un brouillon peut être annulé ; une réalisation ou un transit ne doit pas être effacé.
- Vérification par lecture du code/documentation uniquement : pas de consultation de la commande utilisateur ni de sa base, aucun test exécuté pour cette investigation. Aucun comportement modifié. Statuts/compteurs inchangés.
- Livraison : note locale, sans commit/push ni installation NAS. Prochaine action possible : distinguer les préparations brouillon des exécutions dans le contrôle et le message, avec régression serveur avant modification de cette règle métier.

### Audit : modifications des commandes et visibilité des retours client — 15 octobre 2026

- Périmètre audité : lignes de commande, suivi Achats/Réceptions/Livraisons, préparation des BL/reliquats, retours physiques et séries, liens de consultation, sources de facturation et retour en devis. Investigation uniquement ; aucun comportement ni schéma modifié, statuts/compteurs inchangés.
- Reproduction sur base PocketBase jetable : commande 4, stock 4, livraison réalisée 4, retour client réalisé 1. Stock physique = 1, sales_line conservé sur le retour, mais delivered = 4 avant/après, delivery-needed = false, préparation BL refusée 409 (« déjà entièrement livrée ou préparée »). La liste filtrée sales_quote/status=done ne contient pas le retour, dont sales_quote reste vide par contrat RET ; la relation passe par origin et les identifiants des lignes. Script de reproduction temporaire /private/tmp/horizon_audit_returns.py, résultat /private/tmp/horizon-audit-returns.log (1 test réussi, 2,168 s : les assertions caractérisent les écarts actuels, pas le comportement cible).
- Sources des écarts : stock-operations.consumed additionne OUT/PREP réalisés sans RET ; purchasing.lineTracking fournit ce brut au tableau QuoteLines, sans quantité retournée distincte. stock-deliveries.coverage/needed et la capacité de réservation réutilisent un cumul brut. Le filtre opérations et le smart bouton Livraisons suivent sales_quote directement sans remonter origin ; le clic de la cellule ne filtre pas la ligne. Le suivi Livraison dépend aussi actuellement du droit purchasing.read côté UI/service alors que le besoin est Stock/Ventes : vérifier et découpler lors du correctif, sans ouvrir les données Achats.
- Existant préservé : RET doit partir d’une IN/OUT/PREP réalisée, limite cumulative par origin_line ; mouvements d’entrée client et identités lots/séries historisés, original inchangé. Livraison directe (dropship) explicitement exclue des retours actuels : scénario à traiter séparément. Reliquat de livraison partielle déjà préparé ; cela ne couvre pas une nouvelle expédition après retour.
- Commande modifiable : aujourd’hui save n’accepte que draft et QuotePage n’édite pas les lignes accepted ; seule la référence client et ses pièces ont un parcours dédié. La proposition précédente d’édition des informations/commercial reste une cible, pas un acquis. Le retour en devis annule les commandes historiques et bloque dès toute opération non annulée, même brouillon. Prévoir une révision serveur distincte, identifiants de lignes stables, historique et contrôles des engagements cumulés (ne pas utiliser le seul livré net comme plancher : des livraisons et factures historiques existent toujours).
- Facturation : sources BL fondées sur OUT réalisés, RET non proposé comme source d’avoir ; avoirs existants rattachés aux factures, sans automatisme constaté depuis le retour Stock. Ne pas déduire un retour d’une facture validée ni générer automatiquement un avoir. Choix métier nécessaire entre remplacement/relivraison et retour définitif avec réduction de commande/avoir éventuel ; ne pas créer silencieusement un nouveau besoin d’achat ou BL pour tout retour.
- Recommandation à implémenter ensuite : projection serveur commune brut livré / retours réalisés / net chez client / besoin restant tenant compte de la décision commerciale ; affichage net/commandé accompagné du retour visible et détail des bons d’origine/retour. Préserver les droits, unités et identifiants ; exclure RET brouillon/annulé du réalisé, compter les retours réalisés archivés, tester plusieurs lignes du même produit, retours multiples, séries, remplacement et concurrence avant extension aux révisions de commande. Aucun nouveau schéma décidé à ce stade ; vérifier le contrat de données avant implémentation.
- Vérifications : reproduction API ci-dessus ; deux régressions Stock existantes réussies (limites des retours par ligne et livraison partielle/reliquat), puis test série/retour réussi (2,349 s). Première invocation de la classe série mal nommée corrigée puis rejouée ; logs /private/tmp/horizon-audit-return-regressions.log et /private/tmp/horizon-audit-return-serial.log. Lecture des contrats 04/05/06/08/09 et du code ; pas de navigateur, de suite exhaustive, de lint/build (aucun code produit modifié), ni d’accès aux données utilisateur/NAS. ResourceWarning et refus attendus des fixtures conservés.
- Livraison : audit et journal locaux, sans commit/push ni installation NAS ; packs inchangés. Prochaine action : corriger ensemble projection/consultation des retours et besoins de relivraison, puis implémenter la révision de commande après cadrage du traitement commercial des retours.

### Commandes : suivi net et compteur compact des retours client — 15 octobre 2026

- Affichage validé 3/4 avec petite icône Undo2 et compteur 1 ; pas de texte supplémentaire dans la colonne ni d’élargissement. Détail brut/retours/net au survol et nom accessible, compteur absent sans retour. Projection serveur Inventory séparant brut/retourné/net, transmise au suivi avec les droits existants ; le retour validé ramène bien 4/4 à 3/4. Opérations liées et smart bouton Livraisons incluent maintenant les RET via origin, filtres d’état/archives conservés. Aucun changement de collection, mouvement historique, calcul financier ou permission. Contrats 04/05/07/09 actualisés, statuts/compteurs inchangés.
- Périmètre volontairement limité au suivi physique et aux liens validés dans l’échange : pas de révision des commandes ni de préparation automatique de remplacement/avoir ; calculs d’engagement et de préparation restant fondés sur les sorties historiques. Ces suites nécessitent de distinguer retour définitif et remplacement comme relevé par l’audit. L’accès au suivi reste dépendant de Purchasing comme auparavant ; découplage non réalisé dans ce correctif.
- Vérifications : pnpm check réussi (lint/TypeScript, 258 tests / 60 fichiers, build) ; lint/typecheck rejoués après finitions. Cinq tests serveur ciblés réussis (4 en 9,329 s, 1 en 2,317 s), dont retours multiples, brouillon/annulation/archives, isolation entre commandes et deux lignes du même produit, droits sans inventory.read, reliquat et séries. Deux Playwright finaux réussis ensemble (8,5 s) : compteur zéro masqué puis net/retour et liens, géométrie devis/commande. Captures desktop clair/sombre et mobile inspectées, défilement contenu. Fixture produit initiale sans marque obligatoire corrigée avant les passages réussis ; avertissement connu des chunks et ResourceWarning/refus attendus des fixtures conservés. git diff --check réussi. Pas de suites exhaustives ni de recette sur données utilisateur/NAS.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-sales-returns-20261015.zip préparé et vérifié : 207 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 2048ac4a1d7d9120f0e7eba8ed974840dd1d518c0464cefc0e04713c55b0a760. Remplace allocation-popup-20261015 ; depuis ce pack, mettre à jour lib/stock-operations.js et lib/purchasing.js, redémarrer PocketBase et charger le frontend cohérent. Aucune migration nouvelle pour les retours ; anciennes migrations incluses jusqu’à 1791840011 si manquantes. Prochaine action : installation/recette utilisateur, puis cadrage de la révision de commande et du traitement commercial des retours.

### Commandes : reste à livrer réouvert après retour et relivraison — 15 octobre 2026

- Suite au retour utilisateur, correction du périmètre incomplet précédent : un retour client réalisé réduit maintenant la couverture des sorties pour les besoins, sources, préparations et réservations. Bouton existant Préparer la livraison de nouveau disponible, BL proposé sur le net restant et validation serveur possible sans dépasser la quantité nette commandée. Exemple vérifié 4 sorties / 1 retour → BL 1 → 5 sorties historiques / 1 retour / 4 nets. Aucun effacement de réalisation, changement financier, automatisme d’avoir, achat ou BL déclenché par la validation du retour ; création du BL reste une action explicite. Révision commerciale pour retour définitif toujours non implémentée.
- Projection de retours centralisée dans lib/stock-delivery-returns.js, réutilisée par deliveryTracking et couverture des BL sans dépendance circulaire supplémentaire. Brouillons/annulations exclus, retours réalisés archivés inclus, identifiants stables par ligne et séries préservés. Brouillon automatique existant ajusté (2 livrés sur 4 puis retour 1 → même BL porté de 2 à 3), autres préparations déduites sans doublon. Sources de validation et capacités de réservation utilisent le net ; besoins Achats/factures non modifiés. Contrats 04/05/07/09 mis à jour ; aucun changement de collection ou migration, statuts/compteurs inchangés.
- Vérifications : régression serveur reproduisant needed=false après retour avant correction ; huit tests serveur finaux réussis (18,148 s), dont retour–réservation–relivraison, brouillon déjà préparé/reliquat partiel, lignes du même produit, retours multiples/archives/droits, séries et concurrence. pnpm check réussi (258 tests / 60 fichiers, lint/TypeScript/build), lint/typecheck final et git diff --check réussis. Deux Playwright réussis ensemble (9,8 s) : compteur/retour/commande → bouton → BL 1 prêt → réalisation → 4/4 et action masquée, plus géométrie devis/commande. Captures clair/sombre/mobile et BL de relivraison inspectées. Suites exhaustives backend/navigateur et recette sur données réelles/NAS non exécutées ; avertissement connu des chunks et logs d’annulations/refus attendus des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-redelivery-20261015.zip préparé et vérifié : 208 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 e3d0288d2cfdeed3106aad6cc5e20f98ff3f196209259783da2e3cc171b6e56d. Remplace sales-returns-20261015. Depuis ce pack précédent : remplacer lib/stock-operations.js, lib/stock-deliveries.js et lib/stock.js, ajouter lib/stock-delivery-returns.js, redémarrer PocketBase et charger le frontend cohérent. Aucune migration nouvelle ; migrations antérieures incluses jusqu’à 1791840011 si manquantes. Prochaine action : installation/recette utilisateur puis cadrage de la révision commerciale des commandes.

### Commandes clients : édition tracée, impacts et avoirs brouillons — 15 octobre 2026

- Première version livrée localement : Modifier la commande dans le workflow existant, même fiche/tableau que Devis, édition titre/commercial/notes/référence, quantités/prix/coûts/remises, ajouts/duplications/déplacements et suppression sans engagement. Annuler rétablit l’état et quitte l’édition ; Enregistrer affiche le récapitulatif serveur Avant/Après, impacts et documents bloquants, Reprendre l’édition conserve les saisies. Révisions (n) affiche auteur/date/changements et liens. Identifiants et numéro conservés ; devis accepté, snapshot initial et factures validées intacts. Dates, affaire/client/devise et CGV acceptées conservés dans cette première version.
- Collection privée sales_order_revisions et migration additive 1791840012, version initiale zéro sans réécriture des historiques. Validation/numérotation et garde des écritures order/lines par snapshot côté serveur ; révisions append-only, REST natif verrouillé, transaction et empreinte recalculée des engagements avec rejet 409 si l’aperçu est obsolète. Droits Sales écriture/confirmation + CRM lecture, droits Stock/Billing pour leurs actions. Plans et écritures dans leurs modules propriétaires ; validation catalogue extraite et partagée avec les devis, aucune nouvelle dépendance. Quantité zéro autorisée pour conserver une ligne historique retirée, devis et nouvelles lignes restant strictement positifs. Recherche/tri, réservations, BL, sources de facturation, documents et projections courantes raccordés aux lignes révisées ; contribution du devis original ne réapparaissant pas après réduction.
- Stock : réduction sous le net livré bloquée jusqu’au retour physique, réservations excédentaires réduites/libérées et BL/PREP brouillons ajustés/annulés après présentation des impacts, sans toucher aux réalisations. Achats encore attendus incompatibles à traiter sur la DA/BC avant réduction ; achats validés conservés. Facturation : précision utilisateur intégrée, retrait d’une quantité facturée proposant puis créant un ou plusieurs avoirs brouillons par facture d’origine, avec ses prix/TVA/affectations, sans validation ni retour physique automatique. Quantités déjà couvertes par des avoirs brouillons réutilisées et rejeu sans doublon. Solde financier des lignes partiellement facturées réparti sur les unités restantes ; les cas entièrement facturés dont le montant ne se réconcilie pas après avoir demandent une régularisation explicite. Historique des impacts filtré selon les droits Stock/Billing et réponse limitée aux changements utiles, sans renvoyer tous les snapshots.
- Contrats 04/05/06/07/09 et travaux actifs mis à jour ; Sage/SUPER PDP restent en attente. Statuts et compteurs inchangés. Le retour commercial en devis reste un workflow distinct ; conversions partielles, modification des CGV/dates, intégrations comptables et installation/recette NAS hors livraison locale.
- Vérifications : pnpm check réussi (259 tests / 60 fichiers, lint/TypeScript/build), lint/typecheck final et git diff --check réussis. 48 tests serveur réussis ensemble (117,697 s), dont migration sur commande existante puis rejeu, huit cas révisions/avoirs et suites Ventes/Billing ; cinq contrôles supplémentaires réussis (11,471 s) sur consolidation CRM/analytique/dashboard et avoir/retour, puis deux cas finaux sur sauvegarde/historique/avoir (4,655 s). Quatre Playwright finaux réussis ensemble (32,2 s) : édition/récapitulatif/historique/avoir, alignement/cadre, retours/relivraison et sections/options/drag. Captures clair/sombre/mobile et récapitulatif d’avoir inspectées. Premiers essais ont détecté la nécessité de safeExtend Zod pour l’identité optionnelle, une comparaison structurelle des JSON PocketBase, un aria-disabled conservé par le fournisseur DnD au passage en édition (corrigé dans HSortableRows partagé), ainsi qu’une assertion d’échéance figée désormais calculée sur la date Europe/Paris ; tous corrigés avant les passages finaux. Limites : suites exhaustives de tous les modules et recette sur données utilisateur/NAS non exécutées ; avertissement connu des chunks, ResourceWarning et logs d’annulations/refus des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-order-revisions-20261015.zip préparé, manifeste et correspondance au code final vérifiés : 216 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 35c59b0cdc700793647b944c506af1adb7559c6524f58a17c93f339a9ba3d63f. Remplace redelivery-20261015, inclut les migrations antérieures jusqu’à 1791840012. Installation : sauvegarde cohérente, arrêt/service selon procédure, migrate up avec la migration 1791840012 avant les hooks/frontend correspondants, redémarrage et recette ; ne pas remplacer pb_data. Prochaine action : installation et validation utilisateur de l’édition avec engagements réels.


### Commandes : BL brouillons ajustables et consultation des pièces en popup — 15 octobre 2026

- Correction du blocage utilisateur : un OUT/PREP encore brouillon ne constitue plus un historique réalisé empêchant la suppression/le remplacement d’une ligne de commande. Retrait de la préparation correspondante ; autres lignes conservées, bon vide annulé avec ses lignes historiques consultables. Remplacement produit actualisant unité/référence/marque/suivi et effaçant les traces incompatibles ; allocations et identifiants sources conservés. Aucun mouvement créé. Réalisations et historiques de réservation/achat/facturation restent protégés ; pour une ligne portant un historique de réservation, retrait via quantité zéro sans suppression des relations. Contrôles des droits Stock et de concurrence conservés. Correction complémentaire : la date technique captured_at d’un nouveau snapshot catalogue ne rend plus systématiquement obsolète l’empreinte entre aperçu et enregistrement ; données commerciales et états des engagements toujours comparés.
- Précision utilisateur intégrée : boutons de consultation des DA/BC/BL/factures/avoirs dans impacts, blocages et historique via RecordWorkspace, sans navigation ni nouvel onglet. Adaptateurs Stock/Facturation raccordés aux fiches existantes, mêmes droits et actions, signalement des saisies/modifications en cours, onglets facture locaux au popup et smart boutons associés visibles. Retour du focus et recalcul des impacts à la fermeture/enregistrement d’une pièce. Confirmation de suppression d’une ligne adaptée au contexte Commande. Contrats 04/05/06/07/09 actualisés ; aucun schéma/migration supplémentaire, statuts et compteurs inchangés.
- Vérifications : huit tests serveur ciblés réussis (18,615 s), couvrant suppression et annulation du BL vide, BL à plusieurs lignes, changement de produit/prestation, absence de mouvements, réalisations/retours, droits, concurrence, réservations, historique et avoirs. pnpm check final réussi (lint/TypeScript, 259 tests / 60 fichiers, build), git diff --check réussi. Quatre Playwright finaux réussis ensemble (19,3 s) : édition/révisions/avoir avec fermeture protégée de saisie, retrait d’une ligne et édition du BL en popup puis recalcul/enregistrement, géométrie et retours/relivraison. URL et nombre d’onglets inchangés vérifiés ; captures du BL clair/sombre/mobile inspectées. Premiers essais corrigés : fixture catalogue incomplète, horodatage du snapshot dans l’empreinte, sélecteurs alertdialog et texte contenant le nouveau bouton ; captures sombre déplacées après fermeture des modales, sans simuler une interaction avec la barre extérieure masquée. Limites : suites exhaustives tous modules et recette sur données utilisateur/NAS non exécutées ; avertissement connu des chunks, ResourceWarning et annulations/refus attendus conservés.
- Livraison locale sans commit/push ni installation NAS. Pack /private/tmp/horizon-pocketbase-order-draft-delivery-20261015.zip préparé et vérifié (216 hooks/assets/migrations + manifeste/instructions), SHA-256 7045dcdd161ea26789dce90442354d2ee8b77755b8970be17fddc24990c79ac9. Remplace order-revisions-20261015 ; depuis celui-ci remplacer lib/stock-order-revision.js et lib/sales-order-revisions.js, redémarrer PocketBase et charger le frontend correspondant. Pas de nouvelle migration pour ce correctif ; 1791840012 reste nécessaire si les révisions n’étaient pas installées. Ne pas remplacer pb_data. Prochaine action : installation/recette utilisateur avec ses documents réels, notamment ceux comportant aussi des réservations/achats/factures.


### Remise du pack PocketBase — 15 octobre 2026

- Pack order-draft-delivery-20261015 remis à la demande utilisateur ; 216 fichiers du manifeste vérifiés contre le contenu ZIP et le code local, aucun écart. SHA-256 inchangé : 7045dcdd161ea26789dce90442354d2ee8b77755b8970be17fddc24990c79ac9. Instructions INSTALL.txt vérifiées : conservation de pb_data, migration 1791840012 si absente, hooks puis redémarrage et frontend correspondant. Aucun code modifié ni tests rejoués pour cette remise. Installation NAS non effectuée/non confirmée ; livraison locale, sans commit/push. Statuts et compteurs inchangés ; prochaine action : installation et recette utilisateur.


### Audit du moment de numérotation des brouillons — 15 octobre 2026

- Vérification à la demande utilisateur : réceptions IN et livraisons OUT/PREP reçoivent actuellement leur numéro définitif dès création/préparation du brouillon (stock-operations.save, stock-purchase-receipts.sync et stock-deliveries.sync). Un changement d’entrepôt autorisé peut également renuméroter le brouillon. Billing.store conserve number vide en draft ; Billing.transition attribue le numéro interne uniquement à validation pour clients/fournisseurs/avoirs. La référence externe supplier_invoice_number reste distincte et saisissable dès le brouillon, obligatoire avec l’original à validation.
- Proposition de cohérence, non implémentée : différer également la numérotation Stock à réalisation/validation, avec identité technique stable et affichage Brouillon avant cette étape ; conserver les numéros déjà attribués aux historiques. Aucun changement de code, schéma, pack ni décision canonique ; lecture des contrats Finance et inspection des chemins serveur/tests existants uniquement, sans exécution de tests ni navigateur. Statuts/compteurs inchangés. Livraison : investigation/journal locaux sans commit/push, aucune installation NAS. Prochaine action : implémentation Stock après choix utilisateur.


### Stock : numérotation à réalisation et archivage des BL devenus inutiles — 15 octobre 2026

- Choix utilisateur implémenté : nouveaux IN/OUT/PREP sans numéro en brouillon ; attribution atomique à réalisation dans execute, avant mouvements et snapshot, conservation du numéro déjà attribué. Préparations manuelles et automatiques réception/BL/reliquat raccordées ; changements d’entrepôt du brouillon sans consommation de séquence. Affichage Brouillon dans titre/fil d’Ariane, tableaux, dashboard, liens Billing/révisions et aperçu document. RET/INT/INV et factures/avoirs inchangés. Migration 1791840013 rendant le numéro facultatif et l’index unique partiel, sans réécriture des documents/counters/snapshots existants ; rollback par restauration cohérente. Contrats 04/05/06/07/09 actualisés.
- Révision de commande : si le BL/PREP brouillon devient vide, annulation et archivage automatiques dans la même transaction après affichage explicite au récapitulatif ; lignes et liens historiques conservés. Bon partiel ajusté et actif ; réalisations inchangées. Réservations excédentaires gérées par le plan existant. Archives consultables, restauration laissant le statut Annulé ; aucune réactivation ni suppression automatique. Statuts des lots et compteurs de suivi inchangés.
- Vérifications : 38 tests serveur réussis ensemble (85,323 s), dont suite StockOperations, révisions ciblées, numérotation Billing et migration depuis pièces brouillon/réalisée numérotées avec compteurs inchangés et rejeu ; trois contrôles finaux PREP/entrepôt/réservations réussis (7,847 s). Numérotation concurrente sur quatre réalisations, aucune consommation des brouillons/annulations/échecs, snapshot portant le numéro final, archives et restauration contrôlés. pnpm check final réussi (lint/TypeScript, 259 tests / 60 fichiers, build) ; git diff --check réussi. Cinq Playwright finaux réussis (29,7 s) : révisions/avoirs, suppression + BL en popup + archivage, retours/relivraison, entrée/inventaire/navigation et valorisation. Captures récapitulatif/BL clair/sombre/mobile inspectées. Première assertion navigateur Stock adaptée du numéro à la création vers le numéro après réalisation ; nom erroné d’un test supplémentaire corrigé et trois cas rejoués. Limites : pas de suites exhaustives de tous les modules, ni recette données utilisateur/NAS ; avertissement connu des chunks et logs ResourceWarning/annulations de requêtes des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé /private/tmp/horizon-pocketbase-stock-draft-numbering-20261015.zip préparé, manifeste et contenu vérifiés : 217 hooks/assets/migrations + manifeste/instructions, SHA-256 1175f07a66ace13cfbfdd03803de525da3bc32568345882986f02578d68b01b8. Remplace order-draft-delivery-20261015. Nouvelle migration 1791840013 obligatoire avant les hooks/frontend correspondants, avec sauvegarde cohérente et redémarrage ; migrations antérieures incluses, ne pas remplacer pb_data. Depuis le pack précédent : six bibliothèques Stock et migration listées dans INSTALL.txt. Prochaine action : installation et recette utilisateur des réceptions/livraisons/archives réelles.


### Stock : repères provisoires entrepôt/type/----- — 15 octobre 2026

- Ajustement utilisateur implémenté : affichage MEU/OUT/-----, MEU/IN/-----, SEV/IN/-----, etc. pour les pièces sans numéro final. Fonction propriétaire Inventory unique stock-operation-number, DTO display_number non stocké, réutilisée dans fiches/listes/dashboard, contextes document, récapitulatif de révision et liens Billing. Number reste vide et les compteurs inchangés avant réalisation ; vrai numéro prioritaire après validation ou pour les historiques existants. Préfixe issu de l’entrepôt enregistré et du type, aucune génération de numéro métier React. Contrats 04/05/07/09 actualisés ; pas de nouvelle migration, statuts/compteurs de suivi inchangés.
- Vérifications : quatre tests serveur ciblés réussis (9,453 s), couvrant repères MEU/IN et SEV/IN après changement d’entrepôt, aperçu HTML, absence de consommation, numéro définitif et snapshot, concurrence et révision avec archives. Quatre Playwright réussis (25,2 s) : révisions/avoirs, consultation du BL provisoire et annulation/archives, entrée/inventaire/navigation, valorisation. Captures récapitulatif et popup clair/sombre/mobile inspectées. pnpm check réussi (lint/TypeScript, 259 tests / 60 fichiers, build) et git diff --check réussi. Limites : pas de suite serveur exhaustive ni recette sur données utilisateur/NAS ; avertissement connu des chunks, ResourceWarning et requêtes annulées des fixtures conservés.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé /private/tmp/horizon-pocketbase-stock-draft-reference-20261015.zip préparé et vérifié : 218 hooks/assets/migrations + manifeste/instructions, SHA-256 a540369b8005e272b719e6d9c7d0d17406cc1c15724731f20687ab29dced67b5. Remplace stock-draft-numbering-20261015 ; nouveau helper et quatre bibliothèques à remplacer listés dans INSTALL.txt, puis redémarrage et frontend correspondant. Aucune migration supplémentaire ; 1791840013 reste nécessaire si absente. Prochaine action : installation et recette utilisateur.


### Stock : distinction harmonisée Brouillon / En attente — 15 octobre 2026

- Correction visuelle demandée : Brouillon violet, cohérent avec les badges Devis/Achats ; réception fournisseur En attente ambre, ton partagé des attentes/étapes à traiter. Présentation déclarée une fois dans operationPresentation et réutilisée dans les deux tableaux Opérations/Inventaires ainsi que la première étape de frise Stock via HTag/HProgressSteps et h-tone existants. Aucun CSS/palette locale, nouveau statut, champ, calcul ou permission. Autres états et archives conservés. Contrats UX 07 et tests 09 actualisés ; statuts et compteurs de lots inchangés.
- Vérifications : pnpm check final réussi (lint/TypeScript, 261 tests / 61 fichiers, build), dont deux régressions des états Brouillon/En attente/réalisé/archive ; git diff --check réussi. Deux Playwright finaux réussis ensemble (34,9 s) : parcours Achats/réception et Stock/entrée/inventaire, assertions du badge En attente ambre et des frises ambre/violet. Captures réception clair/sombre/mobile inspectées, sans débordement horizontal. Première compilation corrigée en préservant les exports existants de operationPresentation et en omettant tone quand absent avec exactOptionalPropertyTypes ; premiers parcours lancés avant ces corrections rejoués avec succès. Limites : pas de suite navigateur exhaustive ni recette sur données utilisateur/NAS ; avertissement connu des chunks et logs de validations refusées/requêtes annulées des fixtures conservés.
- Livraison locale frontend uniquement, sans commit/push ni installation NAS ; aucun changement PocketBase/migration, pack stock-draft-reference-20261015 inchangé. Prochaine action : recharger le frontend correspondant et recette utilisateur de la distinction des états.


### Préparation de publication Git du lot courant — 15 octobre 2026

- Commit/push demandés par l’utilisateur sur main/origin (horizon-codex). Lot courant comprenant tri des listes principales, améliorations des frais/véhicules, édition tracée des commandes et avoirs brouillons, retours/relivraison, ajustements des pièces brouillons, numérotation Stock à réalisation avec repères provisoires et couleurs d’état harmonisées. Documentation et régressions incluses ; aucun exécutable, base, secret ou ZIP temporaire ajouté au dépôt.
- Contrôles prépublication : état Git et diff --check vérifiés ; dernier pnpm check réussi (261 tests / 61 fichiers, lint/TypeScript/build). Résultats serveur et navigateur ciblés détaillés dans les interventions précédentes, sans nouvelle exécution exhaustive pour cette publication. Migrations 1791840011 à 1791840013 incluses ; packs locaux disponibles séparément, installation NAS non confirmée. Statuts/compteurs inchangés. Livraison à cet instant : locale, commit/push en cours ; confirmation et identifiant à consigner après publication.


### Commit créé ; push refusé par le contrôle automatique — 15 octobre 2026

- Commit local fb8bf9b créé sur main : feat: améliorer les listes, frais et révisions de commandes (137 fichiers, migrations et régressions incluses). Contrôle de l’index réussi après suppression d’une ligne vide finale superflue dans tableSorting.ts ; aucune modification fonctionnelle supplémentaire.
- Push origin/main refusé par la revue automatique avant exécution : publication de code considéré sensible vers un dépôt externe sans autorisation explicite jugée suffisante pour cette destination. Vérifications complémentaires : origin=https://github.com/cre4tixdev/horizon-codex.git, main suit origin/main, trois push précédents confirmés par reflog, autorisation historique vers cette URL consignée dans le présent journal. Nouvelle tentative directe avec ces éléments également refusée : la revue exige une confirmation utilisateur explicite pour cette destination précise. Aucun contournement ni autre canal de publication employé ; distant non modifié par ces tentatives.
- Livraison : commit local seulement, push bloqué par la revue automatique, aucune installation NAS. Statuts/compteurs inchangés. Prochaine action : obtenir l’autorisation explicite de publier les commits locaux vers https://github.com/cre4tixdev/horizon-codex.git sur main, puis pousser et vérifier le résultat distant.


### Publication Git confirmée après autorisation explicite — 15 octobre 2026

- L’utilisateur a confirmé explicitement la publication des commits locaux vers https://github.com/cre4tixdev/horizon-codex sur main. Push réussi : origin/main avancé de 804e65a à 79a6abc, incluant le lot fonctionnel fb8bf9b et le journal du refus préalable. Blocage de publication levé ; aucun contournement du contrôle automatique.
- Vérifications : commande git push terminée avec code 0 et confirmation main → main ; contrôles fonctionnels du lot consignés précédemment, pas de tests rejoués pour le push. Présente confirmation ajoutée dans un commit documentaire de suivi. Livraison : commit/push Git effectués, installation/recette NAS non confirmée ; statuts et compteurs métier inchangés. Prochaine action : installation des migrations/hooks et frontend cohérents selon la procédure documentée, puis recette utilisateur.


### Contacts : harmonisation des tableaux Sociétés et Personnes — 15 octobre 2026

- Écart identifié : HDataTable déjà utilisé mais option columnBorders absente, contrairement aux listes CRM/Ventes. Activation des séparateurs de colonnes partagés pour Sociétés et Personnes, y compris leurs regroupements ; colonne Statut centrée via columnAlignments commun. Cadre, en-têtes, hauteur, alternance, tri et défilement restent ceux de HDataTable/HTableViewport, sans CSS local ni changement des identités, cartes, rôles ou liens. Contrat UX 07 complété ; statuts et compteurs inchangés.
- Vérifications : lint/TypeScript réussis, typecheck final et git diff --check réussis. Parcours Playwright existant list-sorting réussi (18,6 s), couvrant les deux listes Contacts, tri/URL et autres listes principales ; captures Sociétés/Personnes clair/sombre/mobile inspectées avec séparateurs et Statut alignés. Premier parcours Contacts complet interrompu sur sélection de société détachée du DOM avant d’atteindre les tableaux (contacts.spec.ts:99), non corrigé dans ce périmètre ; ajouts temporaires de captures à ce scénario retirés de manière ciblée, vérification effectuée via le parcours de listes existant. Pas de nouvelle fonction métier ou suite unitaire ajoutée pour cet ajustement de présentation. Limites : pas de recette exhaustive du formulaire Contacts, ni nouvelle comparaison navigateur directe CRM, référence HDataTable CRM/Ventes examinée dans le code ; tests serveur non rejoués car aucun changement backend.
- Livraison locale frontend uniquement, sans commit/push ni installation NAS. Aucune migration/mise à jour PocketBase ; packs précédents inchangés. Prochaine action : recette utilisateur des deux répertoires.


### Contacts : coins du tableau et contour des logos société — 15 octobre 2026

- Capture utilisateur analysée : deux écarts distincts non traités par la précédente activation des séparateurs. Le badge société héritait de --theme-border, redéfini par le viewport de tableau, produisant un cadre gris épais autour du logo. Cadre blanc explicite rétabli dans l’identité partagée, avec dimensions/fond blanc et logos originaux conservés. HDataTable passe en border-collapse: separate / border-spacing: 0 pour aligner ses cellules arrondies sur le cadre du viewport sans artefact de bordures fusionnées ; correction dans le style partagé, pas de variante Contacts. Sticky/scroll et autres composants de tableau conservés. Contrats UX 07 et tests 09 complétés ; statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint/TypeScript, 261 tests / 61 fichiers, build) ; git diff --check réussi. Deux Playwright réussis ensemble (22,1 s) : tri/listes principales avec société munie d’un logo protégé, bordure blanche du badge vérifiée en clair/sombre, bordures séparées et captures des deux répertoires, plus alignement/cadre Devis/Commande. Captures Contacts clair/sombre/mobile inspectées. Aucun accès aux données réelles ni test serveur supplémentaire, aucun changement métier/PocketBase. Limites : toutes les variantes de contenu multi-lignes ne sont pas couvertes ; avertissement connu des chunks et annulations de requêtes des fixtures conservés.
- Livraison locale frontend uniquement, sans commit/push ni installation NAS. Aucune migration et packs PocketBase inchangés. Prochaine action : recette utilisateur des coins et des logos avec ses sociétés réelles.


### Contacts : correction du raccord d’angle par cadre unique — 15 octobre 2026

- Retour utilisateur confirmé : la correction précédente de border-collapse ne suffisait pas. Le viewport dessinait encore le contour pendant que l’en-tête dessinait son propre arrondi. HDataTable adopte maintenant le cadre déjà utilisé par les devis : bordure 1 px et rayon 6 px sur la table ; aucun cadre/fond/rayon concurrent sur le viewport direct. Rayon intérieur des cellules conservé à 5 px. Scroll/sticky et correction du cadre blanc des logos conservés. Contrat UX 07 et régression 09 précisés ; statuts/compteurs inchangés.
- Reproduction : nouvelle assertion de géométrie échouant avant correction, puis réussie après (table 1 px, viewport 0 px, première cellule à +1 px en X/Y). Deux Playwright réussis ensemble (22,4 s), listes/tri et cadre/alignement devis/commande ; contrôle supplémentaire des listes réussi (19,7 s) avec capture réelle Chromium du coin à scale=4, inspectée visuellement. Premier essai de capture par deviceScaleFactor restait à la résolution CSS via Playwright ; remplacé par Page.captureScreenshot clip scale=4, sans retouche d’image. pnpm check réussi (lint/TypeScript, 261 tests / 61 fichiers, build), puis lint/typecheck finaux et git diff --check réussis. Limites : pas de recette dans la session navigateur de l’utilisateur ni de tests serveur (CSS uniquement) ; avertissement connu des chunks et requêtes annulées des fixtures conservés.
- Livraison locale frontend, sans commit/push ni installation NAS ; aucune migration ou mise à jour PocketBase. Prochaine action : vérifier le coin dans le navigateur utilisateur avec ses paramètres d’apparence.


### Audit élargi des cadres de tableaux — 15 octobre 2026

- À la demande de couverture « partout », revue des usages HDataTable/HRegisterTable et des tables HTML de modules. Complément nécessaire trouvé sur reference-table des paramètres : extension de la règle de cadre unique aux tables directement dans HTableViewport, comme les listes/devis (table 1 px / rayon 6 px / bordures séparées, viewport sans second cadre). Aucune refonte de page, modification de donnée, permission ou migration. Contrat UX 07 et tests 09 actualisés ; statuts/compteurs inchangés.
- Régression de géométrie étendue à toutes les tables du parcours des 18 listes principales, en plus de Produits : contrôle du cadre, rayon et décalage de première colonne. Contacts, CRM/AO, Ventes, DA/BC, factures clients/fournisseurs/règlements, frais, employés/équipes, accès, opérations/réceptions, disponibilités et parc. Ajout du contrôle reference-table TVA et capture Paramètres inspectée. Parcours métier complémentaires sur lignes de factures/achats/frais, tableaux intégrés et popups (ventilation, sélection produits, séries/lots), UX/Apparence et devis/commande.
- Première passe de 15 scénarios : 11 réussis, 4 échecs identifiés (responsive RH vérifié avant stabilisation, échéance de test figée au 27 novembre, compteur Réceptions et liste d’achats pollués par les données des autres scénarios dans la base partagée). Ajustements des tests uniquement : attendre la stabilisation responsive via expect.poll ; calculer l’échéance attendue depuis la date de facture saisie pour 45/10 jours. Pas de changement métier pour ces cas. Rejeu avec base neuve pour chaque invocation ciblée : RH 18,1 s, paiement 10,8 s, réservation/achats 15,7 s, Stock 13,7 s, listes+paramètres 19,4 s, aperçu UX 9,6 s, deux cas lots/séries 11,7 s — tous réussis (8 passages supplémentaires, 18 scénarios distincts validés en cumulant les 11 premiers et en excluant le doublon du parcours listes). Suites invoquées séparément pour éviter les faux échecs de compteurs/données partagées ; aucun contournement d’assertion métier.
- pnpm check réussi (lint/TypeScript, 261 tests / 61 fichiers, build), lint/typecheck après finitions de tests et git diff --check réussis. Captures paramètres, Contacts clair/sombre/mobile et coin agrandi inspectées lors de ces interventions ; tests des parcours UI élargis réussis sans inspection manuelle de chaque écran capturé. Limites explicites : pas de validation exhaustive de chaque configuration/popup ou de tous les paramètres, pas de recette sur session/données utilisateur, ni tests backend supplémentaires pour ce changement CSS. Le parcours Contacts complet bloqué antérieurement sur un sélecteur n’est pas présenté comme validé ici. Les avertissements de chunks et logs de validations/requêtes annulées des fixtures sont conservés.
- Livraison locale frontend et tests, sans commit/push ni installation NAS ; packs PocketBase inchangés. Prochaine action : recette utilisateur des cadres partagés ; conserver l’isolation des tests de compteurs pour une future passe globale.

### 15 octobre 2026 — Trait gris parasite sous les tableaux de lignes

- Cause reproduite en navigateur avant correction : DragOverlay conserve un div vide au repos, auquel le style partagé appliquait encore bordure et ombre. Le test échouait sur une bordure de 1 px alors que le contenu était vide. Le style h-table-drag-preview est désormais réservé aux aperçus non vides ; correction commune aux tableaux utilisant HSortableRows, sans toucher aux cadres, coins ni défilements. Contrat ajouté au Design System.
- Régressions navigateur réussies : géométrie Devis / Commande (repos, clair/sombre, desktop/mobile), déplacement souris avec aperçu encadré, disparition après dépôt et annulation clavier. Deux scénarios passés, puis parcours géométrie rejoué pour les nouvelles captures ; captures de commande clair/sombre/mobile inspectées. pnpm check réussi : lint, TypeScript, 261 tests / 61 fichiers et build ; avertissement habituel de taille des chunks. Pas de recette exhaustive des autres modules ni de session utilisateur.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucun changement PocketBase ou migration. Prochaine action : recette utilisateur du trait signalé.

### 15 octobre 2026 — Publication des corrections de tableaux

- À la demande utilisateur, regroupement des corrections locales : cadres et coins partagés, tableaux Contacts et paramètres, badge société et suppression du trait de l’aperçu de déplacement vide ; régressions associées et fiabilisation des assertions de date et de redimensionnement.
- Contrôles déjà exécutés sur ce lot : pnpm check (261 tests / 61 fichiers, lint, TypeScript, build), parcours navigateur décrits ci-dessus et git diff --check. Aucune nouvelle modification fonctionnelle depuis ces contrôles.
- Livraison Git : commit sur main et publication vers origin/main (cre4tixdev/horizon-codex), avec vérification de synchronisation après envoi. Aucune installation NAS et aucun changement PocketBase ; recette utilisateur restante.

### 15 octobre 2026 — Pictogrammes de suivi dans les lignes de commande client

- En-têtes Achats, Réceptions, Livraisons et Facturé remplacés par les pictogrammes Lucide neutres de la fiche (panier, colis ouvert, colis validé, document). Libellés conservés au survol des icônes et comme noms accessibles des colonnes ; valeurs, largeur et redimensionnement conservés. Contrat UX actualisé.
- Parcours Playwright Devis / Commande réussi après ajout de Réceptions : présence des quatre icônes sans texte, titres au survol, noms accessibles, géométrie, clair/sombre et mobile. Captures desktop clair/sombre inspectées. Lint et TypeScript vérifiés ; pas de nouveau test backend pour cette présentation.
- Livraison locale, sans commit/push, migration PocketBase ni installation NAS. Recette utilisateur restante.

### 15 octobre 2026 — Repli des quatre colonnes de suivi de commande

- Bouton Suivi dans les actions des onglets de commande : masque ou réaffiche ensemble Achats, Réceptions, Livraisons et Facturé, cellules et en-têtes synchronisés. Largeur redistribuée par le calcul partagé existant. Colonnes ouvertes par défaut, état de présentation local à la fiche, aucune modification des données ni sauvegarde requise. Bouton hors du fieldset métier désactivé pour rester utilisable en consultation ; titre sticky des lignes conservé. Contrat UX actualisé.
- Régression unitaire de sélection / redistribution des colonnes en consultation et édition. Parcours navigateur final réussi : repli, dépliage au clavier, aria-expanded, alignement des cellules, gain de largeur, clair/sombre et mobile. Captures du repli clair et tableau sombre inspectées. Premier essai a identifié le bouton désactivé par le fieldset ; placement corrigé. Une compilation intermédiaire invalide corrigée, puis parcours rejoué sans erreur. pnpm check final réussi (lint, TypeScript, 262 tests / 61 fichiers, build) et git diff --check réussi ; avertissement habituel de taille des chunks. Pas de recette exhaustive des autres pages.
- Livraison locale uniquement, sans commit/push, migration PocketBase ou installation NAS. Prochaine action : recette utilisateur du bouton Suivi.

### 15 octobre 2026 — Chevron de suivi intégré au tableau de commande

- Remplace le bouton Suivi des onglets par un chevron neutre au début du bloc Achats / Réceptions / Livraisons / Facturé, dans une colonne utilitaire de 28 px conservée après repli. Le titre sticky reste en place ; aucune action ajoutée au bandeau. Focus clavier rétabli après bascule, aria-expanded et libellés au survol conservés. Contrat UX actualisé.
- Les champs métier sont explicitement désactivés en lecture seule et pendant les mutations, au lieu de désactiver le tableau entier par fieldset ; le chevron, le redimensionnement et le repli des sections restent utilisables en consultation. Réservation de largeur pour le chevron et exclusion de sa cellule du calcul de redimensionnement. Régression identifiée lors du passage consultation → édition : ResizeObserver observait le viewport démonté par le fournisseur de drag ; il est maintenant réattaché au nouveau viewport.
- pnpm check réussi : lint, TypeScript, 262 tests / 61 fichiers, build (avertissement habituel de taille des chunks). Parcours final Devis / Commande réussi : champs protégés, chevron dans le tableau, repli/dépliage au clavier avec focus conservé, redimensionnement souris après le chevron, géométrie, clair/sombre/mobile, passage en édition et saisie conservée. Parcours Devis sections/options/duplication/drag réussi séparément (17,7 s), après un échec d’ouverture du popup opportunité pendant le passage groupé. Lint/typecheck rejoués après finition du focus ; git diff --check réussi. Captures du tableau ouvert clair et replié sombre, et capture mobile inspectées ; pas de recette de tous les cas de pièces historiques ni de la session utilisateur.
- Livraison locale, sans commit/push, migration PocketBase ni installation NAS. Prochaine action : recette utilisateur du chevron intégré.

### 15 octobre 2026 — Abandon du repli des colonnes de suivi

- À la demande utilisateur, suppression complète du chevron, de sa colonne utilitaire et de la fonction de repli (état, filtrage, largeur réservée, styles et tests dédiés). Les quatre colonnes Achats / Réceptions / Livraisons / Facturé restent affichées avec leurs pictogrammes et libellés au survol. Rétablissement du fieldset métier initial ; seul le correctif de réattachement du ResizeObserver au changement de viewport est conservé. Contrat UX actualisé : les deux propositions de repli précédentes sont abandonnées.
- Parcours navigateur réussi : absence du bouton et de la colonne utilitaire, présence des quatre pictogrammes, alignement clair/sombre/mobile et passage en édition. Capture du tableau clair inspectée. pnpm check réussi (lint, TypeScript, 261 tests / 61 fichiers, build), git diff --check réussi ; avertissement habituel de taille des chunks. Pas de nouvelle recette backend pour ce retrait de présentation.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucune migration PocketBase. Prochaine action : recette utilisateur des colonnes toujours affichées.

### 15 octobre 2026 — En-têtes de suivi rose Horizon, camion et ratios compacts

- Livraisons utilise Truck. Achats, Réceptions, Livraisons et Facturé conservent les pictogrammes et libellés au survol, sans repli. Seuls leurs en-têtes reçoivent un fond rose très léger (#FFF0F7 clair / #352638 sombre), jamais les cellules de données. Ratios achats et facturés harmonisés en 0/4 sans espaces.
- Apparence et densité → Tableaux : Fond des en-têtes du suivi des commandes, couleurs clair/sombre, aperçu avec HDataTable et HTableTrackingCaption partagés. Extension columnClasses du tableau partagé pour marquer les colonnes, règle CSS limitée aux th ; espacement de l’aperçu via h-record-lines. Schéma frontend et allowlist serveur étendus ; migration additive 1791840014_order_tracking_appearance.js préservant les réglages. Data Model, contrat UX et procédure de déploiement actualisés.
- Vérifications : pnpm check réussi (lint, TypeScript, 262 tests / 61 fichiers, build) ; huit tests PocketBase UX réussis incluant base neuve, reprise/rejeu de migration, conservation des choix existants, validation hexadécimale, permissions, version et audit. Deux parcours navigateur Commande/Paramètres et UX réussis (14,3 s), préparation Achats/réservation réussie séparément (12,2 s). Parcours Commande rejoué pour captures clair/sombre des nouveaux paramètres, puis après finitions d’espacement de l’aperçu ; vérification du camion, ratios 0/1 et 0/6 / 0/10, persistance du réglage, fond limité aux en-têtes, édition et mobile. Captures des tableaux et nouveaux paramètres clair/sombre inspectées. Lint/typecheck après finitions et git diff --check ; avertissement habituel de taille des chunks et notifications annulées des fixtures. Pas de recette NAS ni sur la session utilisateur.
- Pack consolidé préparé : /private/tmp/horizon-pocketbase-tracking-header-20261015.zip, 219 hooks/assets/migrations + MANIFEST.json et INSTALL.txt, SHA256 b2ebccb882c7125674bd0dcf8a037a40452c64b3071100fbe787f70da6e9651b. Manifeste vérifié ; depuis stock-draft-reference, seul lib/ux-settings.js est remplacé et la migration 0014 ajoutée. Aucun pb_data ni secret. Installer hooks + migration puis frontend correspondant pour enregistrer les nouveaux réglages.
- Livraison locale et pack préparé, sans commit/push ni installation NAS confirmée. Prochaine action : installation cohérente du pack et recette utilisateur du fond d’en-tête.

### 15 octobre 2026 — Contour inférieur des tableaux filtrés vides

- Signalement utilisateur sur la liste Commandes fournisseurs filtrée par ligne source ; précision : défaut sous le tableau. Reproduction sur base jetable avec le même type de filtre, sans accès à la session/donnée locale de l’utilisateur. Aucune ombre CSS trouvée sur le tableau reproduit. Défaut constaté sur l’état vide : bordure basse des cellules de titre de 1 px ajoutée à celle du tableau, coins inférieurs du titre à 0 px dans un cadre de 6 px.
- Correction CSS partagée HTableViewport : sans ligne de corps/pied, dernière rangée de titres sans bordure basse interne, coins inférieurs de 5 px. Aucun retrait du défilement horizontal ni modification des données ou des filtres. Contrat UX actualisé. La correspondance avec tout effet supplémentaire sur les données réelles reste à confirmer par recette utilisateur.
- Parcours navigateur dédié réussi (2,3 s) : état vide filtré, cadre sans ombre et sans bordure double, clair/sombre/mobile, état rempli et défilement horizontal réel sur mobile sans débordement de page. Captures du tableau vide clair et du tableau rempli mobile inspectées. pnpm check réussi : lint, TypeScript, 262 tests / 61 fichiers et build, git diff --check réussi ; avertissement habituel de taille des chunks. Pas de recette exhaustive des listes ni de vérification de la session 5173 utilisateur.
- Livraison locale uniquement, sans commit/push ni installation NAS. Aucun nouveau changement PocketBase ; pack tracking-header existant inchangé. Prochaine action : confirmer sur la liste utilisateur si le trait signalé a disparu ; capture du cas réel nécessaire si un autre effet subsiste.

### 15 octobre 2026 — Contrôle élargi des autres tableaux

- À la demande utilisateur, contrôle navigateur des listes Contacts sociétés/personnes, CRM/AO, Ventes mixtes/devis/commandes, Achats DA/BC, factures clients/fournisseurs/paiements, frais, employés/équipes, utilisateurs, produits/opérations/stock/parc et de plusieurs tableaux de paramètres (TVA, catalogue, entrepôts/emplacements/livraisons, Ventes/conditions, frais/véhicules, référentiels, séquences, étapes CRM, modèles). 33 vues, 102 tableaux/thèmes/tailles contrôlés, dont 42 états vides et 60 remplis ; rapport /private/tmp/horizon-table-frame-audit.json.
- Deux défauts confirmés dans le premier passage : bordure basse des cellules de paramètres superposée au cadre (Utilisateurs/TVA) et débordement mobile du tableau TVA dans une grille. Correction partagée limitée à la dernière ligne de reference-table pour préserver les séparateurs métier des devis ; viewport min-width:0/max-width:100% pour contenir les tableaux larges et conserver leur défilement horizontal. Aucun masquage de barre nécessaire, aucun effet d’ombre ajouté. Contrat UX et stratégie de test actualisés.
- Audit final réussi en 27,7 s (33 vues clair/sombre/mobile sombre), après correction des défauts et ciblage du bon onglet Étapes pour les paramètres CRM (Présentation ne contient pas de tableau). Deux régressions complémentaires réussies en 10,3 s : Achats filtré vide/rempli avec scroll mobile et Devis/Commande avec réglage d’en-têtes, consultation/édition et géométrie. pnpm check final réussi : lint, TypeScript, 262 tests / 61 fichiers et build ; git diff --check réussi. Captures TVA desktop clair, TVA et Stock mobile sombre inspectées. Avertissements habituels de chunks et notifications annulées des fixtures conservés. Limites : pas de contrôle de chaque popup, de tous les onglets secondaires, des PDF ni de la session/donnée réelle utilisateur ; aucune recette exhaustive de tout Horizon annoncée.
- Livraison locale uniquement, sans commit/push ni installation NAS. Aucune nouvelle modification PocketBase ; pack tracking-header préparé précédemment inchangé. Prochaine action : recette utilisateur des contours, puis traitement ciblé de tout rendu restant avec capture et contexte de défilement.

### 15 octobre 2026 — Actions de révision de commande dans le menu engrenage

- À la demande utilisateur, Modifier la commande et Révisions (n) retirés des boutons de workflow et placés dans HRecordActions, à droite d’Enregistrer. Réutilisation du menu partagé, sans nouveau composant/style. Conditions de modification conservées (commande acceptée active, permissions Sales/CRM, hors édition) ; historique présent après la première révision. Le menu reste accessible aux lecteurs disposant de l’historique, sans exposer Modifier, Archiver ou Supprimer. Contrat UX actualisé.
- Trois parcours Playwright réussis (19,0 s) : tableau Devis/Commande, édition/annulation/enregistrement et historique des révisions avec avoir brouillon, correction du BL brouillon depuis l’historique. Tests adaptés aux menuitems ; absence de boutons isolés, menu clair/sombre/mobile et accès d’un compte Viewer Sales/CRM en lecture seule vérifiés. Captures menu clair et mobile sombre inspectées. pnpm check réussi : lint, TypeScript, 262 tests / 61 fichiers et build ; git diff --check réussi. Logs de requêtes annulées lors du changement de session de test et avertissement de taille des chunks conservés. Pas de recette sur la session utilisateur.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucun changement PocketBase supplémentaire, pack tracking-header inchangé. Prochaine action : recette utilisateur du menu de la commande.

### 15 octobre 2026 — Harmonisation visuelle du comparatif et de l’historique de révision

- Correction du dialogue trop étroit et du padding appliqué au conteneur entier : HDialog à 1 000 px maximum, en-tête et footer partagés fixes, corps dialog-form défilant. Titres de révision en HSectionHeading, auteur/date dans la description commune et date via displayInstant. HDataTable commun aux deux fenêtres, colonnes Modification/Avant/Après proportionnées, retours à la ligne pour les libellés longs, montants monétaires à droite et chiffres tabulaires, valeurs vides en tiret.
- Impacts/blocages et liens vers les pièces dans un même rendu réutilisé : messages à gauche, liens à droite, empilement mobile, textes et espacements sur les tokens Horizon. État sans révision via HEmptyState. Ouverture dans RecordWorkspace, retour de focus, recalcul des impacts, règles de validation et historique métier conservés. Contrat UX canonique actualisé.
- Deux parcours navigateur réussis (14,9 s), incluant description longue, alignement/marges/polices 13/12/11 px, largeur du comparatif, historique clair/sombre/mobile, footer visible, défilement interne sans débordement de page, modification/abandon/enregistrement, avoir brouillon, BL brouillon consultable, et lecture seule des révisions. Captures du comparatif clair et historique clair/sombre/mobile inspectées. pnpm check réussi : lint, TypeScript, 262 tests / 61 fichiers et build ; git diff --check réussi. Logs de requêtes annulées lors du changement de session des fixtures et avertissement habituel de taille des chunks conservés. Pas de recette de chaque document historique réel ou de la session utilisateur.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucun changement PocketBase supplémentaire, pack tracking-header inchangé. Prochaine action : recette utilisateur des fenêtres de révision harmonisées.

### 15 octobre 2026 — Discussion sur le suivi des services en commande

- Investigation demandée avant décision : distinction service interne / service sous-traité / matériel et pertinence des colonnes Achats, Réceptions, Livraisons, Facturé. Contrat existant consulté : kind distinct de la famille et de stock_policy/purchase_enabled ; services normalement sans stock. Code Stock vérifié : préparation des BL excluant déjà les produits stock_policy=none. Compteurs UI actuels susceptibles de présenter un suivi non pertinent pour ces lignes.
- Proposition à discuter : cellules non applicables en tiret ; facturation conservée pour tous ; achats possibles pour la sous-traitance, aucune réception/livraison physique pour un service sans stock. Ne pas déduire le besoin d’approvisionnement de la seule famille ni confondre autorisation d’achat et besoin à préparer. Modalités internes/sous-traitance et traitement des lignes libres restant à préciser avant toute implémentation.
- Lecture documentaire et inspection du code uniquement ; aucun test exécuté ni modification fonctionnelle, aucun commit/push, pack ou installation NAS. Prochaine action : décision utilisateur sur les cas de prestations à couvrir.


### 15 octobre 2026 — Services internes CVS et suivi de commande

- Règle validée appliquée via projection Inventory serveur : nature service + marque CVS exacte (casse/espaces extérieurs neutralisés) = interne, exclu des préparations d’achat. Services externes achetables selon purchase_enabled, sans suivi physique ; matériel CVS inchangé. Nature capturée dans le JSON catalogue existant des nouvelles associations ; anciennes lignes sans nature relues avec celle du produit courant, marque historique prioritaire, aucun historique réécrit. DA sourcée interne nouvelle/augmentée refusée, ancienne DA conservable/réductible et liens d’achats historiques maintenus.
- Tableau existant conservé : tirets sans lien en cellules non applicables, quatre colonnes/en-têtes inchangés, Facturé pour tous. Défaut existant découvert et corrigé : clés de suivi Billing client basées sur l’identité commerciale stable attendue par le formulaire, sans changer les références financières réelles. Préparation BL déjà limitée aux produits stockables, conservée ; aucune nouvelle collection/migration. Contrats 04/05/06/07/09 et travaux actifs actualisés ; compteurs et statuts des lots inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 262 tests / 61 fichiers, build ; avertissement de chunks habituel) ; git diff --check réussi. Test serveur services/achats historiques et test Billing de concurrence/validation/règlements réussis sur PocketBase 0.40.4 jetable. Premier passage Achats/Stock : 25/26 réussis, réservation concurrente ponctuellement à 0 au lieu de 4 ; relance ciblée passée. Confirmation complète finale réussie : 26/26 tests en 59,1 s. Premier passage navigateur élargi : 2/3 réussis, chargement ponctuel du popup BL sans titre ; relance finale 3/3 réussie en 17,6 s (services/facture validée 4/4, BL matériel seul, commande interne sans actions inutiles, révisions/avoir/BL brouillon). Captures clair/sombre/mobile inspectées. Logs de requêtes annulées lors des changements de session des fixtures conservés. Pas de recette de la session 5173, de PDF réel, des intégrations Sage/SUPER PDP ni du NAS.
- Livraison locale, sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-service-tracking-20261015.zip` préparé, 220 fichiers vérifiés contre le manifeste et le code local, SHA-256 `611ddc48ab2ff9a4daffb440092ae7ccd6f3cc11fb231a35b15b2f2a45ea0286`. Remplace tracking-header ; aucune nouvelle migration services, migrations précédentes toujours nécessaires si absentes. Prochaine action : installer hooks/frontend cohérents après sauvegarde puis recetter commande mixte et achats historiques ; surveiller les deux contrôles intermittents relevés.


### 16 octobre 2026 — Débordement des montants et redimensionnement des colonnes Devis/Commande

- Correction ciblée du tableau commercial existant : PTV et sous-totaux de section/option restent dans leur cellule, ellipses et valeur complète au survol ; contrôle Sigma conservé. Élargir une colonne prélève uniquement l’espace à droite jusqu’aux minimums, puis élargit le tableau avec défilement interne. Suppression du prélèvement imprévisible sur les colonnes de gauche et du recalcul global qui annulait le déplacement. Réduire restitue l’espace à la voisine de droite. Préférences personnelles respectées sur petit écran/rechargement/passage en commande, colonnes temporairement masquées conservées et sauvegarde de la dernière position effective du pointeur. Aucun changement des données ni du backend.
- Réutilisation QuoteLines/useQuoteColumns/HTableViewport, sans nouveau composant ni contrôle local. Contrat UX et stratégie de test actualisés, travaux actifs mis à jour, statuts/compteurs des lots inchangés.
- Vérifications réussies : 7 tests unitaires ciblés ; pnpm check final (lint, TypeScript, 264 tests / 61 fichiers et build) ; deux parcours Playwright en 10,5 s, clair/sombre/mobile, montants longs/options, déplacement souris/clavier, persistance, alignement Devis/Commande et bascule consultation/édition. Captures du montant tronqué clair, tableau élargi sombre et mobile inspectées. Le premier passage a révélé deux anciennes assertions imposant toujours une largeur fixe ; adaptation au nouveau comportement, sans modification du contrat d’alignement. Avertissement habituel de chunks conservé. Pas de recette de la session utilisateur 5173, des autres tableaux ni des PDF ; rendu commercial et PDF non modifiés.
- Livraison locale uniquement, sans commit/push ni installation NAS. Aucun nouveau changement PocketBase, pack service-tracking existant inchangé. Prochaine action : recette utilisateur du comportement de redimensionnement dans les devis/commandes.


### 16 octobre 2026 — Redimensionnement borné à la largeur du tableau

- Retour utilisateur pris en compte : l’élargissement automatique au-delà du cadre est abandonné. Une colonne grandit seulement de l’espace libérable à droite, puis le geste s’arrête ; le bord extérieur reste fixe. Le geste inverse rend la largeur à la voisine, sans changer la taille totale. Les anciennes préférences trop grandes sont recalées au chargement, au changement de viewport et au passage en commande ; sauvegarde de la dernière position et préférences des colonnes masquées conservées. Le défilement sur écran inférieur aux minimums lisibles reste celui du contrat mobile, jamais provoqué par un geste d’élargissement.
- Même tableau/hook et règles d’ellipse, aucun nouveau composant, donnée ou changement PocketBase. Contrat UX 07 corrigé explicitement, stratégie 09 et travaux actifs actualisés ; statuts/compteurs des lots inchangés.
- Vérifications réussies : 7 tests unitaires ciblés ; pnpm check (lint, TypeScript, 264 tests / 61 fichiers, build) et git diff --check ; deux parcours Playwright en 11,0 s, cadre desktop sans dépassement après tentative +180 px, anciennes préférences excessives, déplacement inverse au clavier, rechargement, devis/commande, alignement, clair/sombre/mobile. Capture du tableau sombre borné inspectée. Avertissement habituel de chunks conservé ; pas de recette de la session 5173 ni d’autres tableaux.
- Livraison locale uniquement, sans commit/push ni installation NAS ; pack PocketBase précédent inchangé. Prochaine action : recette utilisateur des poignées désormais bornées.


### 16 octobre 2026 — Tassement successif des colonnes vers la gauche

- À la demande utilisateur, déplacement vers la gauche étendu : la colonne manipulée se comprime jusqu’à son minimum puis les précédentes cèdent leur espace successivement, de la plus proche à la plus éloignée. La voisine immédiate à droite récupère le total libéré ; les suivantes ne bougent pas, la largeur totale reste fixe. Arrêt quand les minimums sont atteints. Le geste vers la droite et le bord extérieur fixe sont conservés. Bornage de l’espace disponible à zéro pour éviter les effets inverses dus aux arrondis de géométrie sous les minimums.
- Même service/hook/tableau, aide au survol précisant les deux sens. Contrat 07, tests 09 et travaux actifs actualisés ; aucun changement de données, backend, statuts ou compteurs de lots.
- Vérifications réussies : 8 tests unitaires ciblés couverts par pnpm check (lint, TypeScript, 265 tests / 61 fichiers, build), lint du dernier ajustement de test et git diff --check. Deux parcours Playwright finaux réussis en 13,1 s : +180 px borné à droite puis -220 px réel à gauche, minimum PTV, tassement des précédentes, seule voisine de droite agrandie, cadre desktop fixe, rechargement, devis/commande, clavier, clair/sombre/mobile. Capture sombre après tassement inspectée. Tests synchronisés sur le rechargement et le recalcul asynchrone du viewport après deux premières exécutions trop précoces. Log de notification annulée et avertissement habituel de chunks conservés. Pas de recette sur la session utilisateur 5173 ni d’autres tableaux.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucun nouveau pack PocketBase nécessaire. Prochaine action : recette utilisateur du tassement dans les deux sens.


### 16 octobre 2026 — Séparateurs des colonnes sur les lignes vides

- Cause confirmée : QuoteLines fusionnait les huit cellules intermédiaires des lignes spacer. Remplacement par les cellules distinctes déjà utilisées sur les titres, avec les bordures partagées et sans style local. Grille continue sur toute la ligne vide en devis/commande, lecture/édition ; conservation de la hauteur, de l’ordre et du rôle d’espacement. Notes/sous-titres et rendu HTML/PDF inchangés ; aucune modification de données ou PocketBase.
- Contrat UX 07, régression 09 et travaux actifs mis à jour ; statuts/compteurs des lots inchangés. Deux parcours Playwright réussis en 13,5 s : spacer sauvegardé entre deux articles, même nombre de cellules que les en-têtes, colSpan=1, géométrie alignée et bordures 1 px, devis/commande, consultation/édition, redimensionnement, clair/sombre/mobile. Capture de commande sombre inspectée. pnpm check réussi : lint, TypeScript, 265 tests / 61 fichiers et build ; git diff --check réussi, avertissement habituel de chunks. Pas de recette de la session utilisateur 5173 ni de PDF réel.
- Livraison locale uniquement, sans commit/push ni installation NAS ; pack PocketBase existant inchangé. Prochaine action : recette utilisateur des bordures sur les lignes d’espacement.


### 16 octobre 2026 — Vérification des bordures dans les autres tableaux

- Inspection transversale des fusions de cellules : les spacers Devis/Commande étaient le seul cas métier concerné ; les autres éditeurs utilisent HDataTable, une cellule par colonne. Les fusions restantes de QuoteLines pour notes/sous-titres, du placeholder Studio et du message des conditions de vente vides sont intentionnelles, sans modification demandée. Aucun autre correctif UI ou backend nécessaire.
- Audit navigateur étendu : 40 vues, 129 contrôles tableau/thème/taille (87 remplis et 42 vides), 438 contrôles de lignes ordinaires avec nombre de cellules, alignement des limites et bordures verticales comparés aux en-têtes. Listes Contacts/CRM/Ventes/Achats/Billing/Frais/HR/accès/Stock, paramètres et lignes initiales vides des formulaires DA/BC, factures clients/fournisseurs, IN/OUT/INT. Trois contrôles de ligne fusionnée = même message intentionnel des conditions de vente vides dans les trois variantes. Aucun défaut trouvé. Rapport `/private/tmp/horizon-table-frame-audit.json`, capture mobile sombre du BC inspectée.
- Parcours Playwright réussi en 35,9 s (32,5 s de test), clair/sombre/mobile sombre ; pnpm check réussi (lint, TypeScript, 265 tests / 61 fichiers, build) et git diff --check. Avertissement habituel de chunks et logs de notifications annulées conservés. Limites : pas de vérification de chaque popup, fiche enregistrée, PDF ou session 5173 ; les tables Notes de frais sont couvertes par leur composant partagé et la liste, sans nouvelle création de dépense dans cet audit.
- Régression de grille intégrée à l’audit partagé et stratégie 09 actualisée ; statuts, compteurs et travaux fonctionnels inchangés. Livraison locale, sans commit/push, nouveau pack ou installation NAS ; pas de changement PocketBase. Prochaine action : recette utilisateur des lignes vides, correction ciblée si un autre contexte est signalé.


### 16 octobre 2026 — Priorité aux colonnes monétaires des devis et commandes

- Coût/PUV/PTV : minimums calculés depuis les textes affichés et leur police, padding, chiffres tabulaires, symbole, six décimales éventuelles et sous-totaux gras/options avec parenthèses/Sigma. HAmountInput expose son format d’affichage calculé existant pour réserver sa place même pendant la saisie brute ; aucune règle de calcul/précision/formatage métier changée. Le hook mesure aussi après chargement des polices. Les minimums mesurés ne réduisent jamais les minimums structurels.
- Ajustement automatique et tassement dans les deux sens donnent priorité aux colonnes non monétaires pour céder leur espace ; les colonnes monétaires ne descendent jamais sous le contenu mesuré. Retrait des ellipses sur les totaux ; cadre fixe quand les minimums tiennent, défilement contenu conservé sur écran inférieur à leur somme. Aucun changement de données, hooks PocketBase, historique ou PDF. Contrats 07/09 et travaux actifs actualisés, statuts/compteurs inchangés.
- Vérifications réussies : 9 tests unitaires ciblés couverts par pnpm check (lint, TypeScript, 266 tests / 61 fichiers, build) ; deux parcours Playwright en 14,0 s, prix/subtotaux/options importants, six décimales après saisie/blur, absence de dépassement scrollWidth/clientWidth sur tous les montants et inputs, redimensionnement souris/clavier droite/gauche, persistance, devis/commande, bordures de lignes vides, clair/sombre/mobile. Captures de la saisie précise claire et du tassement sombre inspectées ; git diff --check réussi. Logs de notifications annulées et avertissement habituel de chunks conservés. Pas de recette sur la session utilisateur 5173, de PDF réel ni de modification du redimensionnement des autres éditeurs HDataTable.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucun nouveau pack PocketBase nécessaire. Prochaine action : recette utilisateur des montants intégraux dans les colonnes de devis/commande.


### 16 octobre 2026 — Réduction légère des marges intérieures des colonnes

- À la demande utilisateur, cellules Devis/Commande et inputs compacts : padding horizontal 5 → 3 px ; Description 8 → 6 px, retrait Marque/Référence 9 → 7 px. Hauteurs, typographie, retraits hiérarchiques des titres, poignées et bordures conservés. Les minimums monétaires continuent de mesurer le padding réel : montant complet maintenu, sans changer le calcul ou le formatage.
- Contrat UX 07 actualisé ; aucune nouvelle logique, donnée, migration ou modification PocketBase. Deux parcours Playwright réussis en 14,0 s : montants et six décimales sans coupure, redimensionnement droite/gauche, cadre, espaces, devis/commande et clair/sombre/mobile. Capture claire de la saisie précise inspectée. pnpm check réussi (lint, TypeScript, 266 tests / 61 fichiers et build) et git diff --check ; avertissement de chunks et notification annulée conservés. Pas de recette de la session utilisateur ni d’autres tableaux.
- Livraison locale uniquement, sans commit/push ni installation NAS ; pack précédent inchangé. Statuts et compteurs des lots inchangés. Prochaine action : recette utilisateur de la densité légèrement optimisée.


### 16 octobre 2026 — Séparateurs des sous-titres et notes, vides ou renseignés

- Complément au correctif des espacements : les sous-titres et notes gardaient huit cellules fusionnées. Suppression de cette fusion dans QuoteLines, toutes les lignes non chiffrées reprennent les mêmes cellules distinctes que les titres/espacements. Grille complète y compris pendant la saisie lorsque la description est vide, en devis et commande. Aucun changement des types de lignes, de leur sauvegarde ou de leur rendu documentaire.
- Contrat UX 07 élargi explicitement à tous les types de lignes, régression 09 et travaux actifs mis à jour ; compteurs/statuts inchangés. Test de géométrie enrichi avec sous-titre/note sauvegardés puis descriptions vidées : mêmes cellules, colSpan=1, séparateurs 1 px et limites alignées pour chaque ligne ; vérification répétée après confirmation/rechargement, en consultation/édition et clair/sombre/mobile.
- Deux parcours de tableau réussis (5,0 s et 5,8 s) ; parcours Sous-titre/modèle/aperçu paginé réussi isolément en 8,2 s après un premier échec ponctuel de contexte de navigation détruit. Capture claire des deux lignes vides inspectée. pnpm check réussi : lint, TypeScript, 266 tests / 61 fichiers et build ; git diff --check réussi. Avertissement habituel de chunks conservé. Pas de recette de la session utilisateur ni de PDF Gotenberg réel.
- Livraison locale uniquement, sans commit/push ni installation NAS ; aucun changement PocketBase ni nouveau pack. Prochaine action : recette utilisateur des sous-titres et notes vides.


### 16 octobre 2026 — Couleur des pictogrammes du suivi et rangement des paramètres UX

- Ajout order_tracking_text_light/dark à settings_ux.config, schéma TS/tokens CSS et allowlist serveur ; couleur commune texte/pictogrammes des quatre en-têtes de suivi, séparée du fond et du corps. Migration additive 1791840015 héritant des couleurs d’en-tête personnalisées et conservant les clés déjà présentes, idempotence vérifiée. Aperçu via HDataTable/HTableTrackingCaption existants, sans imitation locale.
- Rangement par composant : Tableaux = Densité / En-têtes et bordures / Lignes / Suivi des commandes ; dimensions/couleurs des boutons classiques et smart réunies par composant ; filtres ordinaires/sélection séparés, champs distincts des libellés/titres, fonds de page/fil regroupés. Suppression du grand groupe de couleurs mélangées. Choix Clair/Sombre déplacé dans la barre des contrôles avec Tout déplier/replier ; aperçu affichant le même thème. Libellés raccourcis dans le groupe Suivi. Onglets, groupes repliables, saisie conservée, annulation/défauts et Enregistrer communs maintenus.
- Vérifications finales : pnpm check (lint, TypeScript, 267 tests / 61 fichiers et build), 9 tests PocketBase UX sur bases temporaires 0.40.4 (migration, sauvegarde, validation, droits, concurrence et audit), 7 parcours Playwright en 33,2 s (onglets/rangement, aperçu partagé, couleurs SVG clair/sombre enregistrées et appliquées sur commande, absence de teinte sur les cellules, modification concurrente, realtime multi-utilisateur, défauts, sidebar/filtres et mobile). Deux anciennes assertions du premier passage adaptées : attendre l’abonnement realtime du viewer avant mutation, vérifier la bordure de la vraie table et non le viewport (deux tables dans l’aperçu). Captures Tableaux clair, Boutons et mobile inspectées. git diff --check réussi ; avertissement habituel de chunks, conflit 409 attendu et logs de notifications annulées conservés. Pas de recette de la session 5173 ni du NAS.
- Contrats 05/06/07/09 et travaux actifs à jour ; statuts et compteurs de lots inchangés. Livraison locale, sans commit/push ni installation NAS. Pack `/private/tmp/horizon-pocketbase-ux-tracking-colors-20261016.zip` préparé, 221 fichiers et manifeste vérifiés, SHA-256 `c51b5bf10bd6b07bec21bdfcb1a931e0b818db32b04d2ba2b4925d9879cce306`. Prochaine action : installer ce pack après sauvegarde avec le frontend correspondant, puis recette utilisateur du rangement et des couleurs.


### 16 octobre 2026 — Explication du blocage Revenir en devis

- Inspection du workflow existant demandée par l’utilisateur : Sales.reopen vérifie Billing puis Purchasing.assertReturn avant toute annulation/libération. assertReturn refuse toute inventory_operation liée au devis et non annulée, y compris draft ; le message « son exécution doit être conservée » ne distingue donc pas une préparation d’un mouvement réalisé. Le texte du dialogue annonce l’effet prévu en cas de succès, mais l’erreur signifie que la transaction est refusée et la commande conservée.
- Lecture du code uniquement, aucune consultation de la base utilisateur ni modification métier. Aucun test exécuté : état exact de l’opération réelle non établi. Livraison documentaire locale, sans commit/push, pack ou installation NAS. Prochaine action : utiliser la révision de commande pour une modification ; si un retour commercial doit être permis avec une préparation draft, cadrer une annulation/archivage explicite distincte des opérations réalisées et améliorer le message.


### 16 octobre 2026 — Pièces bloquantes détaillées dans Revenir en devis

- Le dialogue liste désormais toutes les pièces bloquantes renvoyées par leurs modules propriétaires : référence, état, raison et action adaptée. Une préparation Brouillon demande son annulation ; un mouvement Réalisé impose de conserver l’historique et oriente vers Modifier la commande. DA et factures sont également détaillées. Bouton de pièce ouvrant le RecordWorkspace existant, sans changement de page, composant réutilisé depuis les révisions. À la fermeture, diagnostic périmé effacé et focus sur Confirmer ; Vérifier à nouveau relance le contrôle serveur.
- Invariants de retour inchangés : contrôles avant toute écriture, aucune annulation/archivage automatique, commande conservée en cas de refus. Références/états/liens masqués sans droit de lecture du module concerné ; réponse générique sans identifiants. Projection HTTP 400 explicite pour éviter la normalisation de data.documents par ApiError. Aucun changement de collection ni migration. Contrats 04/05/06/07/09 actualisés ; statuts et compteurs inchangés.
- Vérifications serveur : 4 tests réussis sur bases temporaires PocketBase 0.40.4, couvrant BL brouillon/réalisé, DA, facture brouillon/validée, absence d’écriture au refus, masquage sans droits, retour autorisé et régression du rapprochement fournisseur. Le cas réalisé est une fixture SQL de test, sans exécution réelle d’un mouvement. Deux parcours Playwright réussis en 16,9 s : révision et retour bloqué, pièce en popup, fermeture et focus, nouvelle vérification, URL conservée, clair/sombre/mobile. Captures inspectées ; pnpm check réussi (lint, TypeScript, 267 tests / 61 fichiers et build), git diff --check réussi. Avertissement habituel de chunks et réponses 400 attendues conservés. Pas de recette sur la base utilisateur 5173 ni de PDF.
- Livraison locale uniquement, sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-return-document-links-20261016.zip` préparé : 222 fichiers plus manifeste/instructions, empreintes vérifiées, SHA-256 `54e529f3fa24f0614ea8055cc935c06ca5d008c74a1214a74a380466201ed57e`. Prochaine action : installation cohérente backend/frontend après sauvegarde et recette utilisateur du diagnostic.


### 16 octobre 2026 — Préparation de la publication du lot validé

- Commit/push demandés pour les changements locaux accumulés : suivi des commandes et services internes/sous-traités, cadres et colonnes des tableaux Devis/Commande, révisions, paramètres UX et diagnostic détaillé Revenir en devis. Documentation et régressions incluses ; aucun pack temporaire ni donnée de test dans Git.
- Vérifications réutilisées du dernier passage sur le même code : pnpm check réussi (lint, TypeScript, 267 tests et build), tests PocketBase et parcours navigateur consignés ci-dessus. git diff --check relancé et réussi avant commit. Pas de nouveau test métier pour cette opération Git.
- État : livraison locale prête au commit et à la publication sur origin/main ; résultat du push à confirmer. Aucun déploiement NAS. Compteurs/statuts fonctionnels inchangés.


### 16 octobre 2026 — Publication Git confirmée

- Lot enregistré dans le commit 98dee89 (45 fichiers), puis poussé avec succès sur origin/main : 5078c20 → 98dee89. Un premier refus automatique demandait de vérifier la destination ; le connecteur GitHub a confirmé que le dépôt cre4tixdev/horizon-codex appartient au compte authentifié cre4tixdev, avec droits admin/push. Push ensuite autorisé et réussi.
- git diff --check réussi ; vérifications fonctionnelles inchangées depuis l’entrée précédente. Cette note complète uniquement la traçabilité de livraison. Aucun déploiement NAS ni installation PocketBase effectués ; pack disponible dans l’entrée Retour en devis. Prochaine action : recette et installation cohérente frontend/PocketBase après sauvegarde.


### 16 octobre 2026 — Cadrage du module Congés avant développement

- Lecture des contrats 04/05/07, de la navigation et des patterns Employés/Notes de frais : Congés reste à livrer ; l’entrée /leave et les objets cibles leave_requests/leave_balances ne constituent pas un parcours implémenté. Proposition : Mes congés / À valider / calendrier d’équipe, demandes journée/demi-journée, manager habilité sans auto-validation, notifications et fil partagés, compteurs traçables et types/règles paramétrables. Employé = ressource métier ; utilisateur = auteur/acteur, à préciser dans le contrat avant migration.
- Aucun code métier ni schéma modifié. Inspection du dépôt uniquement, aucun test exécuté. Les raccordements Planning/TimeReport restent futurs ; ne pas annoncer leur disponibilité. Statuts/compteurs inchangés, H04 reste En cours. Livraison : proposition locale soumise à validation utilisateur avant développement, sans commit/push ni installation NAS. Prochaine action : valider le périmètre et le mode de décompte/acquisition avant implémentation et tests de migration/permissions/concurrence.


### 16 octobre 2026 — Congés L01 : employés, managers et allocations RH

- Module `/leave` livré localement : Mes congés / À valider / Calendrier d’équipe / Allocations RH selon accréditations, cinq types demandés, CP et récupération à compteur, autres absences sans provision préalable. Allocations par employé/année civile avec jours signés et motif, registre append-only ; attribution possible sans compte utilisateur. Paramètres de décompte lundi–vendredi initialement, exclusions datées explicites et justificatifs requis par type ; aucune acquisition automatique ni jour férié présumé.
- Demande en journées/demi-journées, aperçu du décompte et solde pendant la saisie, garde des modifications non enregistrées, pièces multiples et aperçu partagé, frise/fiches, fil/mentions/tâches Core et notifications. Manager principal habilité, recours global explicite, réaffectation RH motivée, aucune auto-validation ; réservation à soumission, validation/refus, retrait/reprise, demande d’annulation, décision et restitution. Historique et snapshot du décompte conservés ; contrôles d’intégrité serveur, chevauchements, versions et clés idempotentes canoniques, transactions contre la double consommation. Archives via confirmation ARCHIVER et critère compact ; recherche top bar, filtres cumulés, tri d’en-tête, regroupements et pagination partagés, critères URL. Calendrier des collègues limité aux indisponibilités sans motif/type/justificatif/identifiant consultable.
- [Contrat fonctionnel](04-FUNCTIONAL-SPECS.md#congés-l01--contrat-du-16-octobre-2026), modèle 05, sécurité/installation 06, UX 07, stratégie 09 et README actualisés. Migration additive 1791840016 ; aucune donnée réelle modifiée. H04 reste En cours pour les raccordements et export, compteurs inchangés (46 lots : 2 terminés / 20 en cours / 10 à vérifier / 0 bloqué / 14 à faire). Travaux actifs Congés distincts, Planning/TimeReport futurs explicitement conservés.
- Vérifications réussies : pnpm check (lint, TypeScript, 272 tests / 62 fichiers, build), 7 tests serveur Congés en 17,9 s et 38 régressions Access/HR, Expenses et Activity en 91,8 s, bases temporaires PocketBase 0.40.4. Migration d’une base antérieure et migrate up rejoué : sociétés/employés conservés intégralement, droits existants préservés, nouveaux droits Admin uniquement, aucun congé/allocation inventé. Tests de concurrence, fichiers protégés, confidentialité calendrier, mentions et révocation de droits inclus. Parcours Playwright complet réussi en 15,5 s : RH/employé/manager, paramètres, deux fichiers, saisie protégée, notification/lien, fil actualisé, filtres URL, annulation/restitution et archivage. Comparaison des en-têtes avec le vrai tableau Contacts ; captures clair/sombre/mobile et calendrier inspectées. Le contrôle visuel a corrigé le dialogue mobile et le test attend la fin de transition de thème ; fil invalidé immédiatement après transition. git diff --check réussi. Avertissement habituel de chunks, erreurs 400 transitoires lors de la saisie de dates et logs de requêtes annulées au logout conservés ; pas de recette de la session utilisateur 5173, du NAS ou du Planning/TimeReport.
- Livraison locale, sans commit/push ni installation NAS. Pack `/private/tmp/horizon-pocketbase-leave-20261016.zip` préparé : 226 fichiers plus manifeste/instructions vérifiés face aux sources, SHA-256 `6035b7637dbc5ead41e2d37f39b07e45366b9f89439b2b05308e36fe684dfaf9`. Prochaine action : installer le pack après sauvegarde avec le frontend cohérent, configurer les droits Congés et les rattachements employé/manager, adapter le calendrier de décompte et attribuer les droits individuels avant recette utilisateur.


### 16 octobre 2026 — Calendrier Horizon commun à tous les champs de date

- Remplacement du popup navigateur par HDatePicker partagé, automatiquement utilisé par HInput date/month/datetime-local : calendrier français lundi–dimanche, navigation mois/année, grille mensuelle, Aujourd’hui/Effacer, heure/Appliquer pour les dates-heures. Champ natif conservé pour saisie/ref/validation/ISO et compatibilité des formulaires contrôlés/RHF ; HZonedDateInput conserve ses conversions métier. Aucune dépendance, donnée ou logique serveur ajoutée.
- Ancrage au champ complet, bordure fine sans ombre, couleurs/tokens d’accent Horizon, clair/sombre et ajustement du popup au viewport. Clavier et focus vérifiés, dont navigation rapide et passage de mois, Échap sans changement, champs désactivés/lecture seule, min/max/pas. Source centralisée : les pages Ventes/Achats/Stock/CRM/Calendrier/Congés/Frais/Billing/Immobilisations et le fil utilisent HInput/HZonedDateInput ; aucun calendrier de date propre à un module introduit. [Contrat UX](07-UX-DESIGN-SYSTEM.md#sélecteur-de-date-partagé--16-octobre-2026) et régressions 09 actualisés ; travaux actifs complétés, statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 277 tests / 63 fichiers et build), git diff --check réussi. Cinq parcours Playwright réussis en 28,0 s : champs contrôlés Employés, date/mois RHF et sauvegarde/rechargement, date-heure et timezone, sept formulaires métiers (devis, DA, BC, factures client/fournisseur, IN et OUT), puis parcours complet Congés. Captures clair/sombre/mobile inspectées ; contrôle des limites du popup, des thèmes et de l’absence d’ombre. Une course de focus clavier a été corrigée ; assertions de persistance adaptées aux formats PocketBase existants et attente de navigation avant rechargement. Avertissement habituel de chunks et logs de requêtes annulées conservés. Pas de recette exhaustive de chaque popup/fiche ni de la session 5173/NAS, aucun test backend supplémentaire puisque le serveur est inchangé.
- Livraison locale uniquement, sans commit/push ni déploiement NAS. Aucun nouveau pack ou migration PocketBase nécessaire pour ce sélecteur ; le pack Congés L01 reste inchangé et requis pour ce module s’il n’a pas encore été installé. Prochaine action : recette utilisateur du calendrier partagé, puis publication du frontend avec le lot validé.


### 16 octobre 2026 — Congés : jours fériés et mois de fin

- Correction du décompte : calendrier France métropolitaine automatique côté serveur, fériés mobiles inclus, sans requête réseau et sans double déduction des week-ends. Paramètres RH : calendrier manuel possible, dates supplémentaires exclues et jours fériés travaillés ; dates invalides/contradictoires refusées. Contrat initial « exclusions manuelles uniquement » remplacé dans 04/05 ; snapshots des demandes soumises/approuvées et allocations historiques conservés. Référence DINUM et fixtures officielles 2026–2028 documentées dans 08. Migration additive 1791840017 conservant les exclusions existantes.
- Date de fin initialement vide ; calendrier partagé ancré au mois du début, minimum début, sans préremplissage et sans écraser une fin valide déjà choisie. Contrat UX 07 actualisé ; paramètres via composants partagés, sauvegarde en haut. README, contrats, installation et stratégie de tests actualisés. H04 reste En cours, compteurs inchangés.
- Vérifications réussies : pnpm check (lint, TypeScript, 280 tests / 63 fichiers, build), 9 tests PocketBase en 22,2 s (dont migrations base neuve et upgrade/rejeu depuis 0016, anciennes demandes inchangées), 5 parcours Playwright en 27,7 s puis parcours Congés avec contrôles/captures paramètres clair/mobile en 15,6 s. Semaine du 9 au 13 novembre = 4 jours, exceptions travaillées, changement de politique après soumission et multi-année couverts. Captures paramètres desktop/mobile inspectées ; parcours partagé clair/sombre/mobile préservé. git diff --check réussi ; avertissement habituel de chunks, ResourceWarnings des erreurs HTTP attendues et logs de requêtes annulées conservés. Bases temporaires uniquement, ni session utilisateur 5173 ni NAS modifiés/recettés.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé préparé et hashes comparés aux sources : `/private/tmp/horizon-pocketbase-leave-holidays-20261016.zip`, 228 fichiers plus manifeste/instructions, SHA-256 `f95e4952487c9289fe4b6ef94c5d30eaacb8db137cc8c9a651219ffebf034cbe`. Remplace le pack leave initial. Prochaine action : sauvegarde, installation hooks/migrations jusqu’à 0017 et frontend cohérent, vérification des jours fériés travaillés par RH puis recette utilisateur ; Planning/TimeReport toujours futurs.


### 16 octobre 2026 — Remise du pack Congés / jours fériés

- Ancienne archive temporaire absente ; pack régénéré depuis les sources locales : `/private/tmp/horizon-pocketbase-leave-holidays-20261016.zip`, 228 fichiers plus manifeste et instructions, SHA-256 `1cf5068e20e97420c7745a1153e1bee1f03898a16212821b577f1f2cc0317905`. Contrôle CRC de l’archive et comparaison de chaque hash aux sources réussis. Aucun changement métier, aucun nouveau test applicatif exécuté ; les validations précédentes restent consignées ci-dessus.
- Livraison locale uniquement, sans commit/push ni installation NAS. Instructions incluses pour sauvegarde et migration jusqu’à 1791840017 ; prochaine action : installation et recette en préproduction. Statuts et compteurs inchangés.


### 16 octobre 2026 — Congés : dirigeant sans manager, clarification du circuit

- Investigation du blocage de soumission : le serveur impose un manager hiérarchique habilité ou un valideur global explicitement choisi ; l’absence de choix bloque, y compris pour un dirigeant. Le marqueur employé is_direction n’introduit aucune exception actuellement. Contrat 04 et sécurité 06 interdisent l’auto-validation implicite.
- Choix demandé à l’utilisateur entre déclaration directe des dirigeants avec information RH et validation par un autre dirigeant/RH habilité. Aucun changement métier ni BDD effectué avant cette décision ; aucun test exécuté (inspection seule). Prochaine action : adapter le circuit choisi, ses droits serveur, les libellés et l’annulation, puis tests de régression. Statuts/compteurs inchangés ; investigation locale, sans commit/push, nouveau pack ni installation NAS.


### 16 octobre 2026 — Congés : déclaration directe Direction sans manager

- Décision utilisateur explicite : déclaration sans validation manager avec information RH. Mise en œuvre sur la responsabilité employé Direction existante, active, sans responsable rattaché ; leave.submit requis, organisation protégée par hr.organisation.manage. Aucun privilège automatique pour Admin ou simple manager. Actions serveur declare/cancel_declaration, contrôles solde/chevauchement/justificatifs conservés, transition et activité/audit/notifications transactionnels. Gestionnaires RH notifiés = comptes actifs leave.read + leave.allocate et périmètre all ; absence de destinataire explicitement bloquante. Aucun e-mail externe.
- Déclaration immédiatement approved, mode figé dans policy_snapshot.approval_mode ; date/auteur tracés. Annulation propriétaire avec motif et leave.write, restitution et nouvelles notifications ; le circuit enregistré subsiste si l’organisation change. Demandes manager historiques inchangées, aucune migration supplémentaire ni réécriture BDD. Bouton Déclarer mon congé, confirmation adaptée, champ sans manager fictif et frise partagée ; annulation dans la roue, édition/consultation avec libellés Déclaration/RH. Contrats 04/05/06/07/09 et README actualisés, H04/statuts/compteurs inchangés.
- Vérifications réussies : pnpm check (lint, TypeScript, 280 tests / 63 fichiers et build), 11 tests PocketBase en 28,7 s sur bases temporaires incluant migrations, permissions, refus du contournement client, direction rattachée à un manager, solde insuffisant, chevauchement, justificatif obligatoire, absence de RH, notifications et restitution. Deux parcours Playwright en 19,9 s : circuit salarié/manager et Direction self avec RH global, enregistrement/rechargement, annulation, deux notifications et solde restitué. Captures clair/sombre/mobile inspectées, attente de stabilisation du thème sombre ajoutée ; composants/styles partagés conservés. git diff --check réussi. Avertissement habituel de chunks, ResourceWarnings des erreurs HTTP attendues et logs de requêtes annulées aux changements de session conservés. Aucune recette de la session 5173 ni NAS effectuée.
- Livraison locale, sans commit/push ni installation NAS. Nouveau pack consolidé `/private/tmp/horizon-pocketbase-leave-direction-20261016.zip`, 228 fichiers plus manifeste/instructions, CRC et hashes comparés aux sources ; SHA-256 `cbbb41a79af7f3d5c7c3f19751f97adce349e6de1669f90dc477165475ca55bd`. Remplace leave-holidays ; hooks et frontend doivent être mis à jour ensemble, migrations précédentes jusqu’à 0017 incluses. Prochaine action : installer après sauvegarde en préproduction, vérifier responsabilité Direction sans responsable et droits RH, puis recette utilisateur.


### 16 octobre 2026 — Paramètres Congés centralisés

- Réglages déplacés dans Paramètres → Congés (`/settings/leave`), avec entrée dans la navigation et carte de la vue d’ensemble. Roue et popup retirés de la page métier ; allocations individuelles maintenues dans Congés → Allocations RH. Formulaire propriétaire leave réutilisé en page, panneaux/HSectionHeading/HSaveButton communs, sauvegarde en haut à droite et tableau settings-reference-table/reference-table pour les types/justificatifs ; aucune logique métier dupliquée.
- Accès RH existant préservé : leave.read/leave.settings, non Viewer, can_settings serveur avec périmètre all. Un compte RH sans accès général aux Paramètres voit uniquement Congés et est redirigé depuis /settings ; autres routes toujours refusées. Aucun nouveau droit serveur, schéma ou migration, ni pack PocketBase nécessaire. Contrats 04/06/07/09, README et travaux actifs actualisés ; statuts et compteurs inchangés.
- Vérifications réussies : pnpm check (lint, TypeScript, 280 tests / 63 fichiers, build) et trois parcours Playwright en 25,6 s sur base temporaire : manager/salarié, déclaration Direction, accès RH limité aux paramètres Congés. Sauvegarde/rechargement des justificatifs/exclusions, absence de roue, carte et navigation, refus salarié et des réglages Utilisateurs pour RH contrôlés. Captures clair/sombre/mobile inspectées et comparaison avec Paramètres Achats ; libellés accessibles des zones de dates corrigés et disposition des cases Jours travaillés ajustée après inspection. git diff --check réussi. Avertissement habituel de chunks et logs de requêtes annulées lors des changements de session conservés ; aucun test backend supplémentaire puisque API et schéma inchangés, aucune recette de la session utilisateur 5173 ni NAS.
- Livraison locale sans commit/push ni déploiement. Dernier pack PocketBase Direction inchangé ; seule la publication du frontend est nécessaire pour ce déplacement. Prochaine action : recette utilisateur de Paramètres → Congés avec les habilitations RH prévues.


### 16 octobre 2026 — Calendrier général : week-ends et jours fériés

- Grille BusinessCalendar commune au calendrier général et AO : week-ends/en-têtes Sam/Dim sur surface atténuée, fériés de France métropolitaine sur léger fond rose avec nom, légende explicite et repère aujourd’hui conservé. Quatre périodes semaine/mois/trimestre/année ; nom tronqué avec points de suspension sur les petites cellules, survol complet, création d’événements toujours possible. Vue chronologique AO inchangée. Composants/styles/tokens Horizon réutilisés, aucune nouvelle dépendance.
- API Calendrier enrichie de holidays (date civile → nom), calcul hors ligne dans le helper commun aux Congés ; dates/noms fixes et mobiles issus de la même fonction, événements privés et périodes conservant leurs droits. Métadonnées nationales disponibles sans droits CRM/Congés, indépendantes des recherches/archives et des exceptions RH de fériés travaillés. Aucun événement artificiel, aucune collection ou migration. Contrats 04/05/06/07/09 et travaux actifs actualisés ; R09/statuts/compteurs inchangés.
- Vérifications réussies : pnpm check (lint, TypeScript, 280 tests / 63 fichiers, build), 3 tests PocketBase Calendrier en 6,5 s et 11 régressions Congés en 28,5 s sur bases temporaires ; noms/dates comparés aux fixtures officielles DINUM 2026–2028. Quatre parcours Playwright Calendrier réussis en 13,1 s : événements manuels/permissions/périodes, styles distincts jours ordinaires/week-ends/fériés sur les quatre grilles, ajout d’événement un férié et limites mobile. Captures clair/sombre/mobile inspectées ; attente de stabilisation du thème et ellipses des noms ajoutées après revue visuelle. Tests naviguent sans modifier l’horloge d’authentification ; libellés de dialogue de test corrigés. git diff --check réussi. Avertissement habituel de chunks, ResourceWarnings HTTP attendus et requêtes annulées aux changements de session conservés ; pas de recette de la session utilisateur 5173 ni du NAS.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-calendar-days-20261016.zip`, 228 fichiers plus manifeste/instructions ; CRC et hashes comparés aux sources, SHA-256 `058bef8cc102080d12ab22a5f5a38e615172da633c633eeaaef97460cd4c75b5`. Remplace leave-direction ; hooks/frontend à actualiser ensemble, aucune nouvelle migration après 0017 (précédentes incluses). Prochaine action : installation après sauvegarde en préproduction et recette utilisateur des repères calendaires.


### 16 octobre 2026 — Calendrier : jours fériés sans rose

- Correction visuelle demandée : fond des fériés et de leur légende passé au gris neutre via les tokens texte/surface ; nom en texte standard. Week-ends et fériés restent distincts, aucune modification du calcul ou des événements. Contrats fonctionnel 04 et UX 07 corrigés ; statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 280 tests / 63 fichiers, build), parcours Playwright ciblé des quatre périodes réussi en 6,0 s ; captures clair/sombre/mobile inspectées et git diff --check réussi. Avertissement habituel de chunks conservé ; pas de recette de la session utilisateur 5173/NAS. Aucun test backend supplémentaire puisque seuls les styles changent.
- Livraison locale, sans commit/push ni déploiement NAS. Pack PocketBase Calendrier inchangé, aucune mise à jour serveur supplémentaire nécessaire pour cette couleur. Prochaine action : recette utilisateur du rendu neutre.


### 16 octobre 2026 — Mes congés dans le calendrier général

- Cause identifiée : calendrier général agrégeant CRM/Stock/événements manuels sans projection Congés. Ajout d’une projection propriétaire leave, aucune copie dans calendar_events : demandes du compte connecté submitted/approved/cancel_requested, une entrée par date de la période d’absence et demi-journées aux bornes. Statut lisible, bleu validé/ambre en attente, lien vers la fiche canonique. Brouillons/refus/annulations acceptées exclus ; annulation demandée conserve l’absence jusqu’à décision. Transitions invalidant le cache Calendrier. Composants/styles existants réutilisés, repères week-ends/fériés neutres préservés.
- Permissions côté serveur avant projection : leave.read et scope actif, requête user=acteur ; aucun accès implicite aux demandes des collègues même RH global, aucun motif/type médical/justificatif exporté. Calendrier d’équipe dédié inchangé. Filtres/archives/contexte AO respectés, dates appartenant au module leave, aucun nouveau schéma/droit/migration. DTO Calendar accepte kind/source leave et liens /leave/{id}. Contrats 04/05/06/07/09, travaux actifs actualisés ; statuts/compteurs inchangés.
- Vérifications réussies : pnpm check (lint, TypeScript, 280 tests / 63 fichiers, build), 12 tests serveur Congés en 30,4 s et 3 régressions Calendrier en 6,7 s sur bases temporaires. Cycle complet des statuts, demi-journées, propriété/confidentialité, filtres et retrait des droits couverts. Sept parcours Playwright Calendrier/Congés réussis en 34,7 s ; parcours Direction enrichi de captures calendrier clair/sombre/mobile rejoué en 8,4 s : apparition sur chaque date, ouverture de fiche, annulation puis disparition et droits restitués. Captures inspectées ; aucun débordement mobile, rendu identique aux événements partagés. git diff --check réussi. Avertissement habituel de chunks, ResourceWarnings HTTP attendus et requêtes annulées aux changements de session conservés ; aucune recette de la session utilisateur 5173 ni NAS.
- Livraison locale sans commit/push ni installation NAS. Pack consolidé `/private/tmp/horizon-pocketbase-calendar-leave-20261016.zip`, 228 fichiers plus manifeste/instructions, CRC et hashes comparés aux sources ; SHA-256 `09ec5423d139ff3a84bc1d590e0985eb1f8bee500bd43a3b5283249c2de84b49`. Remplace calendar-days, hooks/frontend cohérents requis ; aucune migration supplémentaire après 0017. Prochaine action : installer après sauvegarde en préproduction et recetter les propres congés dans /calendar.


### 16 octobre 2026 — Calendrier : nom du férié à côté du numéro

- Numéro du jour et nom du férié regroupés sur une seule ligne dans la grille BusinessCalendar partagée ; numéro non réductible, nom tronqué avec points de suspension et libellé complet au survol. Fonds et texte neutres conservés. Contrat UX 07 actualisé, statuts/compteurs inchangés.
- Vérifications réussies : pnpm check (lint, TypeScript, 280 tests / 63 fichiers, build) et parcours Playwright ciblé en 6,5 s ; alignement et absence de chevauchement contrôlés dans les quatre périodes, captures clair/sombre/mobile inspectées. git diff --check réussi. Avertissement habituel de chunks conservé ; aucune recette de la session 5173/NAS ni test backend supplémentaire, styles/structure frontend uniquement.
- Livraison locale sans commit/push ni déploiement ; pack PocketBase inchangé, aucune nouvelle migration. Prochaine action : recette utilisateur du libellé sur la même ligne.


### 16 octobre 2026 — Calendrier : nom du férié aligné à droite

- Nom du jour férié aligné à droite dans la ligne d’en-tête de cellule, numéro maintenu à gauche. Ellipses et nom complet au survol conservés. Contrat UX 07 et régression d’alignement actualisés ; statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, 280 tests / 63 fichiers, build), parcours Playwright ciblé des quatre périodes réussi en 6,1 s ; captures clair/sombre/mobile inspectées et git diff --check réussi. Avertissement habituel de chunks conservé ; aucun changement serveur ni nouveau test backend, pas de recette de la session utilisateur/NAS.
- Livraison locale sans commit/push ni déploiement ; pack PocketBase inchangé, aucune migration nécessaire. Prochaine action : recette utilisateur de l’alignement.


### 16 octobre 2026 — Préparation publication Git Congés / calendriers

- Publication demandée par l’utilisateur du lot accumulé : Congés L01, allocations/validation/déclaration Direction, jours fériés, paramètres centralisés, dates partagées et congés personnels dans le calendrier, derniers ajustements visuels compris. Sources, fichiers nouveaux et diff inspectés ; aucun fichier de configuration local, base, secret ou pack temporaire inclus.
- Vérifications récentes inchangées depuis la dernière correction : pnpm check réussi (lint, TypeScript, 280 tests / 63 fichiers, build), régressions backend et navigateur détaillées dans les entrées précédentes. git diff --check rejoué et réussi. Aucun nouveau test métier nécessaire pour la publication seule. Statuts/compteurs inchangés.
- État confirmé : commit `7236c42` (65 fichiers) poussé sur origin/main, retour Git e493a86..7236c42 réussi. Aucun déploiement frontend/NAS ; dernier pack PocketBase calendar-leave inchangé et requis selon l’état de l’instance. Prochaine action : publication Git puis recette/déploiement séparés.

Confirmation de publication : `7236c42` — feat: gérer les congés et harmoniser les calendriers Horizon. Publication Git effectuée le 16 octobre 2026 ; cette confirmation documentaire est publiée à sa suite. Aucune installation NAS ni publication frontend effectuée.


### 16 octobre 2026 — Reprise propre avant réimplémentation SMTP/OAuth

- Demande utilisateur appliquée : repartir du dernier commit précédant la messagerie. Vérification Git : HEAD **64bbe9a00e7562d5dc424feb306e5eefb29760bc**, précédé du lot Congés 7236c42 ; tout le prototype e-mail et son accompagnement étaient non committés. Aucune branche réécrite ni commit annulé. Sauvegarde hors dépôt de **49 fichiers** (25 suivis modifiés / 24 nouveaux), patch binaire et manifeste : `/private/tmp/horizon-messaging-before-clean-restart-20261016.zip`, SHA-256 `4115b7fbc968ecf7b25c70071f52ca8f96964470bea99eb100c1816bc3e152fe` ; CRC et empreintes de chaque fichier vérifiés avant restauration.
- Code applicatif/frontend/hooks/tests/configuration restaurés exactement à 64bbe9a, fichiers du prototype retirés explicitement depuis le manifeste vérifié, sans git clean général. L’accès Git a nécessité une exécution autorisée hors sandbox après refus de création index.lock ; restauration exécutée avec sauvegarde préalable, sans changement de HEAD ni de l’index. La copie externe conserve modèles/compositeur/outbox/tests et le journal détaillé de la tentative pour réutilisation sélective ultérieure.
- Information utilisateur reçue pendant la reprise : **pack PocketBase Messaging déjà installé sur le NAS**. Exception indispensable au retour de code : **1791840018_messaging_email.js conservée octet pour octet**, même empreinte que dans le pack fourni (`3288190d3ecafbda9c2fd962b13be55753085bebe118ce21d1762ae50af743b1`). Aucune suppression de collection, de données, de fichier ou d’entrée _migrations. Aucun accès/retour arrière NAS effectué par l’agent ; présence effective de la migration et contenu de la base non inspectés. Toute adaptation devra utiliser une migration suivante, après inventaire des états existants ; ne jamais réutiliser 1791840018. L’ancien pack est obsolète pour nouvelle installation ; ne pas installer un pack antérieur en guise de retour arrière.
- Décision durable actualisée (H-012, 02/04/08) : **SMTP Microsoft 365 avec OAuth délégué**, comme le parcours Odoo constaté (permissions déléguées, callback /microsoft_outlook/confirm), configuration des boîtes administrée, droits From serveur et Microsoft, jetons chiffrés/renouvelables, reconnexion explicite. La reprise n’est pas implémentée dans le code restauré : valider d’abord XOAUTH2 dans le runtime PocketBase, puis reconstruire connexion/callback, paramètres/modèles/compositeur, file d’envoi et historique sans importer aveuglément le prototype. Aucun nouveau service, dépendance ou binaire personnalisé approuvé. La consultation du serveur sortant Odoo actif reste utile pour vérifier l’usage réel.
- Bilan Microsoft conservé : application/secret et principal Horizon créés par l’utilisateur, personnalisation Exchange activée, portée pilote créée, appartenance directe temporaire du compte administrateur à Organization Management et délégation effective DelegatingOrgWide constatées. Attribution Application Mail.Send refusée à chaque tentative ; cause exacte non établie. L’ajout suggéré du rôle Entra Administrateur Exchange n’a pas été confirmé exécuté et n’était pas une correction démontrée. Aucune nouvelle manipulation Microsoft pendant la reprise ; prévoir nettoyage contrôlé des ajouts temporaires à la reprise de configuration, sans toucher à Odoo ni aux droits préexistants. Aucun envoi réel confirmé ; aucune commande d’envoi effectuée par l’agent.
- Vérifications exécutées : `pnpm check` réussi sur la base restaurée (**280 tests / 63 fichiers**, lint, TypeScript, build ; avertissement habituel taille de bundle), puis **3 tests Calendrier PocketBase réel 0.40.4** réussis après réintroduction de la migration immuable, avec reconstructions/rejeux sur bases jetables ; lint rejoué après conservation de cette migration, réussi. Vérification des fichiers : aucune différence applicative avec HEAD ; seule migration supplémentaire correspond exactement au pack installé, autres changements limités à la documentation. `git diff --check` réussi. Pas de recette navigateur supplémentaire (code d’interface restauré), aucun test SMTP/Microsoft réel ni inspection de base NAS.
- Livraison **locale, sans commit/push ni pack de remplacement**. Seules documentation et migration déployée conservée diffèrent du commit de départ. R07 **En cours** car schéma/pack déjà installés mais nouveau parcours à reconstruire ; R08 inchangé, compteurs recalculés : **46 lots, 2 terminés / 21 en cours / 10 à vérifier / 0 bloqué / 13 à faire**. Prochaine action : vérifier l’existant NAS et la faisabilité SMTP XOAUTH2 dans la stack, cadrer les évolutions de données puis implémenter proprement la nouvelle connexion, sans réactiver le parcours applicatif abandonné.


### 16 octobre 2026 — Faisabilité SMTP OAuth dans PocketBase

- Reprise autorisée par l’utilisateur ; examen de la documentation et du transport natif PocketBase 0.40.4. Source officielle et test sur binaire réel concordent : seules LOGIN/PLAIN sont prises en charge, une valeur XOAUTH2 retombe sur PLAIN. Aucun contournement par mot de passe/jeton ni remplacement par Graph. Contrats 08/09 complétés avec preuve et limite.
- Vérification exécutée : `check_smtp_capability.py`, **1 test réussi en 2,302 s**, base et hooks jetables, faux SMTP loopback qui refuse toute authentification. La méthode seule est capturée ; aucun message accepté, aucun secret ou compte Microsoft réel utilisé. La migration 0018 déjà installée reste inchangée. Aucune interface modifiée ; aucune recette navigateur nécessaire à ce diagnostic, aucun contrôle NAS ou Microsoft réel exécuté.
- Proposition concrète : extension Go limitée au transport, intégrée au binaire PocketBase et exposée aux hooks via JSVM, image Docker Horizon épinglée et construite pour la cible NAS. Cela évite un service supplémentaire mais implique de maintenir la construction du binaire ; autre possibilité : relais dédié. La décision 08 exige validation avant ce nouveau binaire/service : choix demandé avant implémentation dépendante. R07 et compteurs inchangés.
- Livraison locale, **sans commit/push, nouveau pack ni installation NAS**. Prochaine action : valider le mode d’extension, puis construire et tester XOAUTH2/TLS sur serveur fictif avant connexion Microsoft et reprise du compositeur.


### 16 octobre 2026 — Comparaison de robustesse SMTP / Graph délégué

- Après accord de principe sur l’adaptation du conteneur PocketBase existant (aucun conteneur additionnel), demande utilisateur de comparer les solutions robustes. Relecture des sources Microsoft Graph v1.0, envoi délégué partagé, SMTP AUTH et extension officielle Go PocketBase ; déploiement Compose existant examiné. Extension Go viable/officielle, mais coût de construction et de maintenance propre ; recommandation désormais Graph OAuth **délégué**, distinct du prototype applicatif abandonné, pour réduire ce coût. Comparaison et invariants de fiabilité consignés dans 08.
- Décision SMTP précédemment acceptée non remplacée sans accord ; aucune extension Go, dépendance ou transport nouveau implémenté. Les autorisations déléguées ne garantissent pas une émission arbitraire depuis toute boîte ; renouvellement/révocation et droits d’expéditeur à contrôler dans les deux options.
- Vérifications : consultation de documentation primaire et lecture des sources/configuration locales ; `git diff --check` réussi. Aucun test applicatif rejoué pour cette analyse documentaire, aucun envoi réel, aucune manipulation Microsoft/NAS. Statuts/compteurs inchangés. Livraison locale sans commit/push ni pack ; prochaine action : arrêter le choix du transport après comparaison, puis implémenter et tester le fournisseur et sa file.


### 16 octobre 2026 — Messagerie Graph OAuth délégué, reprise et double vérification

- Choix final explicitement validé par l’utilisateur : **Graph avec OAuth délégué**, sans extension Go ni conteneur supplémentaire. Reprise sélective des modèles/signatures/compositeur/outbox/PDF et intégrations Devis/BC du prototype sauvegardé ; fournisseur client_credentials entièrement remplacé. Nouvelle connexion administrée des boîtes dans Paramètres → E-mails, authorization_code + PKCE S256, état serveur hashé à usage unique et lié à session/onglet, échange serveur et identité /me exacte. Première version boîtes personnelles ; boîtes partagées/alias non activés implicitement. Jetons AES-256-GCM privés, renouvellement/rotation et claims persistants, déconnexion locale/reconnexion explicites. Corps Cci/PJ privés au propriétaire, HTML allowlisté et From contrôlé côté serveur. Aucune nouvelle dépendance.
- Outbox durable : claim atomique hors appels réseau, génération de connexion figée, reprises limitées sur 429/erreurs transitoires avant soumission, aucune relance après perte de réponse/408/5xx. Correction d’une comparaison ISO/SQLite révélée par le test de Retry-After : dates normalisées au filtrage, délai désormais réellement respecté. Un traitement abandonné devient À vérifier, clôture motivée sans renvoi. Documents fournit le même convertisseur PDF aux aperçus et fichiers officiels figés ; modules propriétaires appliquent leurs transitions après acceptation.
- Compatibilité BDD : **0018 conservée octet pour octet**, nouvelle migration **1791840019** uniquement. Deux collections OAuth privées, outbox enrichie ; anciens pending arrêtés failed et processing uncertain, aucune remise en file automatique. Upgrade depuis schéma installé, replay et pièce jointe protégée testés avec conservation des données et du fichier exact. Aucun accès/retour arrière/modification NAS, aucune collection supprimée. Le schéma réellement installé reste connu par déclaration utilisateur, pas inspection distante.
- Configuration : variables uniquement serveur transmises dans le Compose existant ; exemple sans secrets fourni. ID de locataire reçu de l’utilisateur, application connue et boîte pilote reportés dans 06 ; secret/clé AES jamais collectés. Recette locale proposée depuis **http://localhost:5173**, callback Web /messaging/oauth/callback ; origine contrôlée avant départ pour préserver la session, retour URL nettoyé. L’URI/les permissions Entra et les variables NAS restent à configurer par l’utilisateur ; pas de nouvelle commande Exchange ni de modification Odoo. Nettoyage des droits temporaires de la tentative applicative encore à inventorier.
- Vérifications : **pnpm check réussi : lint, TypeScript, 283 tests / 64 fichiers, build** ; avertissement de taille de bundle existant. **17 tests serveur Messaging**, **27 Ventes**, **27 Achats**, **24 Documents** réussis sur PocketBase 0.40.4 jetable, faux Microsoft/Gotenberg uniquement. Upgrade avec vrai fichier protégé rejoué isolément, réussi (1 test / 2,212 s). Deux assertions Achats défaillantes lisaient le premier entrepôt plutôt que l’emplacement réservé : reproduit sans nouveaux hooks Messaging, stock réel de la fixture correct, assertions précisées puis suite complète réussie. Aucun changement métier Stock. **2 parcours Playwright réussis en 12,8 s** : parcours brouillons/PJ/modèles/archives et OAuth simulé/origine/état/nettoyage/déconnexion ; captures clair/sombre/mobile inspectées, comparaison Paramètres Achats, boutons icône ajustés au composant partagé. git diff --check réussi. Logs de requêtes annulées aux changements de page et ResourceWarnings attendus des fixtures conservés ; pas de recette Microsoft réelle, NAS, Gotenberg cible ou session utilisateur 5173.
- Livraison **locale, sans commit/push ni installation NAS**, R07 En cours et compteurs inchangés (46 lots : 2 terminés / 21 en cours / 10 à vérifier / 0 bloqué / 13 à faire). Contrats 00/02/04/05/06/07/08/09 et travaux actifs actualisés. Packs consolidés préparés et CRC/empreintes de chaque fichier vérifiés :
  - `/private/tmp/horizon-pocketbase-messaging-delegated-20261016.zip` : 242 fichiers source ; SHA-256 `93b3b1df885df954d5ec587248431718f3fe2d3580a6f2bb6e5fdcfd2d15cd6e`.
  - `/private/tmp/horizon-portal-messaging-delegated-20261016.zip` : 228 fichiers source ; SHA-256 `2a3e1faab419a3617dc802d8d1db91cdde56380ff2a01f6c2261820a514b3c40`.

Prochaine action : sauvegarde et mise à niveau backend avec 0019, configuration privée des variables, permissions Graph déléguées et URI Web dans Entra Horizon, connexion de la boîte pilote, puis envoi réel choisi avec l’utilisateur. Utiliser Vite actuel ou publier le pack portail cohérent ; aucun envoi réel automatique et aucun nouveau service à installer.


### 16 octobre 2026 — Correction des instructions de migration au redémarrage

- Question utilisateur vérifiée contre la documentation et le code officiel PocketBase : **serve applique les migrations présentes non encore exécutées, même avec automigrate=false**. Ce flag concerne la génération automatique des fichiers. L’explication précédente imposant migrate up à cause de ce flag était erronée ; correction annoncée à l’utilisateur, procédures 06 et instructions du pack corrigées, régression ajoutée à test:backend. Aucun code métier ni schéma modifié.
- Vérification réelle : test de démarrage sur PocketBase 0.40.4 jetable sans migrate up préalable, collection/entrée _migrations présentes puis deuxième démarrage sans réexécution ; **1 test réussi en 0,146 s**. git diff --check réussi. Aucun test applicatif ou navigateur rejoué, aucun accès/contrôle du NAS ni confirmation d’application de 0019 à distance.
- Pack PocketBase réémis au même chemin avec **instructions seules corrigées**, CRC vérifié ; SHA-256 désormais `1ef857577f41eefe16b11a770f6bc6fe3ebd2466dbdc77d63e03b2b89070c38a` (remplace `93b3b1df885df954d5ec587248431718f3fe2d3580a6f2bb6e5fdcfd2d15cd6e`). Sources/hooks/migrations inchangés ; pack portail inchangé. Livraison locale sans commit/push ni installation NAS, statuts/compteurs inchangés. Prochaine action : redémarrer le conteneur avec les dossiers montés puis vérifier le succès et la migration 0019 ; poursuivre les variables serveur et Entra pour activer les e-mails.


### 16 octobre 2026 — Installation PocketBase déclarée par l’utilisateur

- L’utilisateur indique avoir installé PocketBase après les instructions du pack Messaging délégué. Installation déclarée, pas d’accès distant ni de contrôle des logs/_migrations par l’agent ; version, application effective de 0019 et configuration des variables non vérifiées. Ne pas assimiler cette déclaration à une recette des e-mails.
- Accompagnement poursuivi sur l’inscription Entra Horizon : permissions Graph déléguées User.Read/Mail.Send et URI Web localhost de recette, puis variables privées du conteneur et connexion de la boîte. Aucun secret demandé, aucune commande Exchange ni modification externe exécutée. Aucun changement de code ou test applicatif nécessaire pour ce suivi ; git diff --check réussi.
- Livraison : installation backend déclarée par utilisateur, frontend local et connexion Microsoft réelle non recettés ; aucun commit/push. R07/compteurs inchangés. Prochaine action : confirmer la configuration Entra, renseigner les cinq variables serveur en privé puis recetter la connexion et un envoi pilote choisi.


### 16 octobre 2026 — Accompagnement des variables serveur Microsoft

- L’utilisateur pense avoir terminé la configuration Entra ; non vérifiée à distance. Prochaine étape détaillée : cinq variables du conteneur PocketBase, identifiants publics déjà fournis, valeur du secret Entra et clé aléatoire ASCII 32 caractères générée en privé. Aucun secret demandé ni généré par l’agent. Si configuration via Compose, appliquer par mise à jour/recréation du conteneur avec volumes conservés, car restart seul ne recharge pas un environnement Compose modifié.
- Vérifications : noms et validations relus dans messaging-oauth.js et deploy/horizon.compose.yaml ; git diff --check réussi. Aucun changement applicatif, test rejoué, accès NAS ou consentement Microsoft effectué. Installation backend déclarée précédemment, variables/connexion/envoi pilote encore non confirmés ; local sans commit/push, statuts/compteurs inchangés. Prochaine action : configuration privée puis connexion de l’expéditeur depuis localhost:5173.


### 16 octobre 2026 — Repérage de l’action Connecter un expéditeur

- L’utilisateur ne trouve pas Connecter. Code inspecté : action actuellement représentée par l’icône Link2 (maillons) dans Actions de chaque ligne de Paramètres E-mails → Expéditeurs, avec titre/nom accessible Connecter suivi de l’adresse, sans libellé texte visible. Aucune action tant que la liste ne contient pas d’expéditeur enregistré ; bouton désactivé si expéditeur inactif ou configuration serveur invalide. Ce constat de code n’établit pas l’état de l’écran utilisateur.
- Guidage vers l’onglet et la ligne enregistrée ; aucun changement de code, de configuration ou d’API. git diff --check réussi, aucun test supplémentaire ni observation navigateur/NAS. Local sans commit/push ; connexion Microsoft encore non confirmée, statuts/compteurs inchangés. Prochaine action : identifier et lancer l’action de connexion depuis un expéditeur autorisé.


### 16 octobre 2026 — Connexion Microsoft et envoi pilote confirmés par l’utilisateur

- Après installation du backend, configuration des variables/Entra et connexion d’un expéditeur, l’utilisateur confirme que l’envoi fonctionne bien. Connexion et essai réel validés **par déclaration utilisateur**, sans accès de l’agent aux logs NAS, à la boîte Outlook ou au détail du message. Aucun secret collecté. Ne pas extrapoler cette confirmation à la réception côté destinataire/Éléments envoyés séparément ni aux PDF commerciaux, non détaillés dans le retour.
- Aucun changement de code, migration, configuration distante ou envoi par l’agent ; aucun nouveau test exécuté pour cette confirmation. git diff --check réussi. Travail actif R07 actualisé ; statut En cours et compteurs inchangés, la recette commerciale/PDF et les cas d’exploitation restent à confirmer. Pas de commit/push ni nouveau pack.
- Prochaine action : vérifier un envoi de devis/BC avec PDF réel, puis suivi du renouvellement/reconnexion et nettoyage contrôlé des droits temporaires de la tentative initiale après inventaire.


### 16 octobre 2026 — Explication du délai d’envoi des e-mails

- L’utilisateur constate un envoi fonctionnel mais lent. Code relu : worker outbox déclenché chaque minute (cron * * * * *), cinq candidats par passage ; un message sans file préalable peut attendre jusqu’à environ une minute avant soumission à Graph. Délai réseau/traitement Microsoft supplémentaire, non mesuré sur le NAS ; ne pas attribuer tout le délai observé au cron sans logs. La file durable n’impose pas cette fréquence : un déclenchement immédiat après commit, conservant le cron de secours et le claim atomique, serait une amélioration possible.
- Investigation uniquement, aucune modification de fréquence ou de code, aucun test supplémentaire ni accès NAS/mesure réelle. git diff --check réussi ; local sans commit/push, statuts/compteurs inchangés. Prochaine action éventuelle : optimiser le déclenchement à la demande utilisateur, avec régressions concurrence/reprise.


### 16 octobre 2026 — Déclenchement immédiat des e-mails après mise en file

- Optimisation demandée et autorisée : la transition enqueue déclenche le **même worker pour le seul message nouvellement ajouté**, après commit de la transaction durable. La requête attend le premier résultat fournisseur et renvoie l’état actualisé ; aucune promesse de livraison immédiate au destinataire. Aucun appel réseau en transaction, timer JS, tâche volatile ou service additionnel. Interruption du déclenchement journalisée, tâche conservée pour le cron. Double clic sur pending/processing/sent ne redéclenche pas cette soumission.
- Worker avec ciblage facultatif ; cron de secours toutes les minutes inchangé, récupération des processing abandonnés conservée dans son passage général. État et échéance relus dans le claim atomique, délais Microsoft et reprises bornées préservés ; incertitude sans renvoi automatique. Pas de droit settings ajouté aux utilisateurs send. Sources/PDF/From/jetons et schéma inchangés, aucune nouvelle migration après 0019 ni nouveau frontend nécessaire. Contrats 04/06/08/09 et travaux actifs actualisés ; compteurs/statuts inchangés.
- Vérifications réussies : **pnpm check** (lint, TypeScript, **283 tests / 64 fichiers**, build ; avertissement habituel de chunks), **21 tests serveur Messaging en 55,204 s** sur PocketBase 0.40.4 jetable avec faux Microsoft/Gotenberg. Quatre nouvelles régressions couvrent traitement immédiat, réseau hors verrou SQLite (lecture/sauvegarde concurrentes), droits send sans settings, concurrence du worker, ciblage/arrière-file, Retry-After non court-circuité, interruption avant claim et secours, perte de réponse sans renvoi. Tests antérieurs des flux différés conservent une échéance future via hooks de fixture temporaires seulement, aucun flag de test dans la production. **3 parcours Playwright réussis en 15,0 s**, dont affichage Envoyé direct du compositeur via transition simulée ; parcours nouveau isolé après ajout de son propre expéditeur. Lint final et git diff --check réussis. Pas de recette utilisateur 5173, d’envoi réel, d’accès NAS ni de nouveaux contrôles visuels (aucune modification UI).
- Livraison **locale sans commit/push ni installation NAS** : pack **unique PocketBase** `/private/tmp/horizon-pocketbase-messaging-immediate-20261016.zip`, 242 fichiers source + manifeste/instructions/exemple ; SHA-256 `bf29caf78e470c28d16dcaa8b1aba1c49e17d140640c89de50b00a52b5b8edbd`. CRC et toutes les empreintes comparés aux sources ; comparaison au pack délégué : seuls pb_hooks/lib/messaging.js et pb_hooks/lib/messaging-worker.js changent, migrations et configuration identiques. Remplace le pack précédent pour cette optimisation ; pas de second pack frontend.
- Prochaine action : utilisateur copie pb_hooks et redémarre PocketBase, puis confirme la réduction du délai ; connexion Microsoft et variables existantes à conserver, aucune reconfiguration Entra nécessaire.


### 16 octobre 2026 — Fil d’activité : destinataires et miniatures des pièces envoyées

- Les événements d’envoi des devis et BC affichent les destinataires À effectifs, avec l’auteur séparé. Les pièces originales envoyées apparaissent en miniatures nommées avec loupe ; aperçu image/PDF dans le dialogue partagé, clavier/Escape et retour du focus sans navigation. Les notes ordinaires image/PDF utilisent également les miniatures ; texte conserve son lien et suppression habituelle. Documents inclut les envois liés. Les événements existants sont enrichis à la lecture sans modification des historiques ni copie des fichiers. Contrats durables actualisés dans 04/05/06/07/08/09.
- Route binaire Activity authentifiée : contrôle de la fiche source puis contrat Messaging vérifiant message sent, contexte/source/auteur exacts et nom de fichier appartenant à l’envoi. Le lecteur autorisé à la fiche peut consulter les pièces sans accéder au message privé ; corps, Cc/Cci, jetons exclus. Règles natives Messaging inchangées, aucune suppression des pièces envoyées dans le fil, aucune nouvelle migration. MIME du blob conservé pour le PDF.
- Vérifications réussies : pnpm check (lint, TypeScript, **284 tests / 64 fichiers**, build ; avertissement habituel de taille des chunks), **21 tests Messaging / 54,803 s**, **14 tests Activity / 30,800 s** sur PocketBase 0.40.4 jetable ; les deux parcours serveur devis/BC rejoués après ajout de l’assertion MIME (**2 / 6,304 s**, OK). Régression Playwright e-mail réussie avec vrais source/auth locaux et événements/binaires simulés ; captures examinées en clair/sombre/mobile et aperçu PDF avec Chromium complet. Le headless shell initial n’affichait pas le PDF natif ; Chromium complet rend bien miniature et aperçu, sélectionné dans ce test. Parcours devis/frise/preuve commande réussi (**5,1 s**). Parcours Contacts initialement arrêté sur un sélecteur date ambigu préexistant ; exact:true ajouté au seul sélecteur, puis Contacts et nouveau fil e-mail **2 réussis / 15,3 s**. Lint/typecheck finaux et git diff --check contrôlés. Pas d’envoi réel ni de recette NAS/5173 par l’agent.
- Livraison **locale sans commit/push**, pack PocketBase unique `/private/tmp/horizon-pocketbase-messaging-feed-20261016.zip` : **243 fichiers source**, manifeste/instructions/exemple, SHA-256 `51d9810e6ca355fa78fae067a2bca2da1b5b62bc6043bd55e9524e38af02bc76`. CRC et toutes les empreintes comparés aux sources ; migrations 0018/0019 identiques au pack précédent. Inclut le déclenchement immédiat déjà livré, aucun second pack frontend. NAS non installé/non confirmé ; prochaine action utilisateur : copier pb_hooks, redémarrer puis vérifier un événement d’envoi existant. Variables et connexion Microsoft à conserver. R07 reste En cours, compteurs inchangés.


### 16 octobre 2026 — Réponses e-mail liées et contenu compact des mails dans le fil

- Demande de réception acceptée, puis précision utilisateur : afficher aussi le **contenu du mail envoyé**, en présentation simplifiée. Activity utilise un bloc commun envoyé/reçu avec objet, De/À, texte échappé limité visuellement à trois lignes, Voir le message/Réduire, miniatures et aperçu partagé. Auteur externe et date réelle pour les réponses ; Cc/Cci, jetons et HTML actif exclus. L’accès à la fiche autorise désormais aussi la lecture du texte commercial envoyé/reçu, décision explicitement demandée par l’utilisateur ; les messages libres restent privés. Projection à la lecture des événements d’envoi existants, sans réécriture de l’historique.
- Réception opt-in par boîte dans Paramètres → E-mails → Expéditeurs, colonne Réponses et action de relève dans le tableau partagé. Mail.Read délégué requis, à ajouter dans Entra puis consentir par reconnexion après activation ; aucun droit Application/Exchange ni Mail.ReadWrite. Les envois précédents restent utilisables sans ce consentement. Scopes accordés stockés ; null/absence sur les connexions antérieures traités comme send-only, sans casser les choix/envois. Aucun nouveau conteneur ou secret.
- Migration additive **1791840020** : option de réception, scopes/snapshot OAuth, threads de relève privés et réponses/fichiers protégés immuables ; reprise des anciens envois commerciaux sent, sans duplication ni modification des pièces/ciphertexts. 0018/0019 inchangées. Découverte de l’envoi Outlook via X-Horizon-Message dans sentitems puis filtrage des conversations ; In-Reply-To/References connus requis avant corps/pièces. Parent explicite inconnu : rester dans Outlook, pas de rattachement à un ancien document par objet. Aucun changement automatique d’état métier, aucune réponse automatique, pas de boîte de réception générale ou de chat.
- Relève toutes les minutes, maximum 20 conversations/pages dues, un claim persistant par conversation, pagination et reprise après arrêt, délai de deux minutes après tour complet, erreurs visibles et Retry-After respecté. Boîtes sans consentement exclues avant sélection. URLs Graph allowlistées, curseur invalide réinitialisé, aucun bearer vers un autre hôte. Aucun appel réseau en transaction ; déduplication par boîte/Message-ID et événement/notification atomiques, autorisation relue avant commit. Limites 10 fichiers PDF/images/2 Mio cumulés et 30 000 caractères ; avertissements explicites pour le contenu restant dans Outlook. Notification de l’expéditeur encore autorisé via NotificationService. Contrats 04/05/06/07/08/09 et travaux actifs actualisés ; R07 En cours, R08 inchangé, compteurs inchangés.
- Vérifications : **pnpm check** réussi (lint, TypeScript, **284 tests / 64 fichiers**, build ; avertissement de chunks connu). **27 tests Messaging / 75,980 s** sur PocketBase 0.40.4 et faux Microsoft/Gotenberg ; après deux scénarios complémentaires, huit tests de réception rejoués sur le rattachement final : **8 / 24,652 s**, OK. Régression supplémentaire connexion historique à scopes null : **1 / 3,070 s**, service de choix et envoi fonctionnels. **14 tests Activity / 32,194 s**, OK. Upgrade enrichi : 0018 → base réellement 0019 avec connexion historique → 0020 appliquée deux fois, pièces/fichiers et champs chiffrés conservés, backfill unique ; **1 / 2,329 s**, OK. Premier test d’upgrade nécessitait d’adapter son attente au nouveau champ receive_enabled=false ; première assertion de mutation de réponse corrigée de 400 à 403, la protection refuse avant l’écriture.
- Navigateur : **4 parcours Playwright / 23,5 s**, puis paramétrage réception revérifié clair/sombre/mobile **1 / 9,1 s**. Captures des blocs envoyé/reçu et paramètres examinées ; comparaison avec Paramètres Achats, contrôles partagés conservés. Tests de corps externe échappé, dépliage, focus/aperçus, absence de navigation et débordement de page. Chromium complet rend le PDF natif ; le headless shell ne permet pas sa validation visuelle. Lint final et git diff --check contrôlés. Aucun accès à la boîte réelle, envoi réel, consentement Microsoft ou installation NAS par l’agent.
- Livraison **locale sans commit/push** : pack unique `/private/tmp/horizon-pocketbase-messaging-replies-20261016.zip`, **246 fichiers source** + manifeste/instructions/exemple ; SHA-256 `f89c130bbbf403c67fcaeb379c2794c91f06ac4f96ee7b34167eb98bdda3181c`. CRC et tous les fichiers comparés aux sources ; 0018/0019 comparées au pack précédent et inchangées. Remplace les packs Messaging antérieurs, inclut l’envoi immédiat et les miniatures ; aucun deuxième pack frontend. Installation NAS/recette réception réelle non effectuées. Prochaine action utilisateur : sauvegarde, copier **pb_hooks + pb_migrations**, redémarrer et vérifier 0020, ajouter Mail.Read délégué dans Entra, activer réception/enregistrer/reconnecter la boîte ; tester une réponse choisie sur un devis/BC envoyé et confirmer le fil/notification.


### 16 octobre 2026 — Relève : message générique après reconfiguration Microsoft

- L’utilisateur signale « Réception interrompue. Vérifiez la connexion Microsoft et relancez la relève. », puis indique venir de reconfigurer. Aucun log NAS ni phase exacte fourni ; **cause réelle non confirmée**. Analyse du code : ce libellé masquait plusieurs exceptions distinctes ; reconnexion n’efface pas last_error et conserve l’échéance après échec, ce qui peut expliquer la persistance de l’ancien message sans prouver un nouvel échec. Explication donnée ; aucune nouvelle autorisation ou reconfiguration conseillée sans diagnostic.
- Correctif ciblé MailProvider reader + worker réception : erreurs contrôlées à code/libellé précis (copie envoyée, corps, fichiers, curseur, HTTP, réseau), erreurs internes indiquant seulement l’étape, 401 distingué, journalisation technique sûre (thread/stage/code/statut/request_id validé/type d’exception), sans erreur brute, URL, jeton ni contenu. Étape réinitialisée pour chaque élément de conversation. Nouveau message de pagination refusée sans modifier l’allowlist ; aucun contournement de droits, curseur, Retry-After, fichier ou transition métier. null des scopes toléré défensivement par le lecteur, en cohérence avec la compatibilité des anciennes connexions.
- Vérifications : **10 tests réception / 30,629 s**, OK, faux Microsoft et PocketBase 0.40.4 jetables ; deux nouvelles régressions d’erreurs contrôlées/internes et reprise avec effacement de l’erreur. Lint final et git diff --check réussis. Pas de frontend/schéma changé, build/typecheck et navigateur non rejoués pour ce correctif. Pas d’accès NAS, d’e-mail réel ou de validation de la nouvelle configuration utilisateur. Contrats 06/08/09 actualisés ; R07 et compteurs inchangés, diagnostic NAS encore à recueillir si erreur persistante.
- Livraison **locale sans commit/push**, pack PocketBase unique `/private/tmp/horizon-pocketbase-messaging-diagnostic-20261016.zip`, **246 fichiers source**, SHA-256 `803235dfd45ea985004a08b72f2780145068901bfc33c4fab9d0278e0affa641`. CRC et empreintes comparés aux sources ; comparaison au pack replies : seuls lib/mail-reader.js et lib/messaging-inbound.js changent, migrations/configuration inchangées. Installation NAS non effectuée. Prochaine action : laisser la relève respecter son échéance après reconfiguration ; si persistance, mettre à jour les hooks/redémarrer et relever le diagnostic précis. Ce pack améliore la visibilité sans prétendre corriger une cause NAS non identifiée.


### 16 octobre 2026 — Pagination Microsoft refusée : destinations canoniques

- Nouveau retour utilisateur après le pack de diagnostic : « Pagination Microsoft refusée… ». Cela établit le rejet par le contrôle de destination, sans identifier le nextLink exact (non fourni, aucun accès NAS). Audit : ancien contrôle limité à /me et à l’alias sentitems, excluant les IDs réels des dossiers, /users de la boîte connectée, formes OData, casse et slash final. Défaut reproduit sur les formes légitimes ; ne pas attribuer l’erreur à un défaut de consentement Microsoft ni demander une reconnexion pour ce correctif.
- Extraction minimale de lib/mail-pagination.js : validation de destination avant bearer, origine Graph fixe, principal égal au compte/adresse OAuth vérifiés, seules ressources messages/pièces et dossiers de mail autorisées. Accepte les formes canoniques, refuse autre compte/hôte/ressource, traversées, fragments, contrôles et encodages invalides ; conserve la query/skip token intégralement et ne journalise pas l’URL. MailProvider reader réutilise ce contrôle. Aucune modification du schéma, des droits source, de la corrélation, de l’envoi ou des échéances de reprise. Contrats 06/08/09 actualisés ; R07 et compteurs inchangés.
- Vérifications : pnpm check réussi (**286 tests / 65 fichiers**, lint, TypeScript, build ; avertissement connu de chunks). **12 tests réception / 36,846 s** réussis ; deux nouvelles régressions serveur reproduisent première page vide puis découverte via IDs OData et reprise, variantes de lien de conversation sans doublon, refus d’une autre boîte sans requête. Après durcissement des contrôles encodés, unitaires rejoués et **2 tests canoniques / 5,957 s**, OK. Lint final et git diff --check réussis. Aucun changement UI, navigateur non rejoué, aucun accès à une boîte réelle, installation NAS ou validation de son nextLink exact.
- Livraison **locale sans commit/push** : pack unique `/private/tmp/horizon-pocketbase-messaging-pagination-20261016.zip`, **247 fichiers source** + manifeste/instructions/exemple, SHA-256 `b12399518da24ad186dad7f9f0a203a296096c65b0db7e160042f7a751a43ae1`. CRC et empreintes comparés aux sources ; par rapport au pack diagnostic, seul lib/mail-reader.js change et lib/mail-pagination.js est ajouté ; migrations/configuration inchangées. Remplace le pack diagnostic, inclut ses correctifs ; pas de second frontend. Prochaine action utilisateur : copier pb_hooks complet (nouveau helper inclus), redémarrer puis vérifier la relève après son échéance. Installation/recette NAS non effectuées par l’agent.


### 16 octobre 2026 — Rejet de pagination persistant : motif sûr et version P2

- L’utilisateur répète le même libellé après le pack pagination ; installation/redémarrage du dernier pack et moment de la nouvelle relève non confirmés. Question courte envoyée pour distinguer ces cas. Le retour seul ne prouve ni le code chargé ni la forme d’URL rejetée. Le correctif précédent avait été annoncé trop vite comme solution du cas NAS : les formats locaux étaient testés, mais l’URL réelle n’avait pas été vue. Cause persistante **non identifiée**, aucun accès distant.
- Modification limitée au diagnostic : mail-pagination.inspect renvoie url ou motif stable ; API callable précédente conservée pour les appels/tests. MailProvider affiche [P2:motif] lors d’un nouveau refus, sans compte, URL/query, jeton ni contenu privé. Permet de distinguer origine, boîte, ressource et encodage refusés ainsi qu’un ancien last_error persisté. Destinations acceptées et protections inchangées, aucune extension de droit ou modification des reprises sur hypothèse. Contrats 06/09 actualisés ; R07 En cours et compteurs inchangés, prochaine étape dépend du code observé sur le NAS.
- Vérifications : pnpm check réussi (lint, TypeScript, **287 tests / 65 fichiers**, build avec avertissement habituel de chunks). **3 tests serveur pagination / 9,460 s**, OK ; nouveau test unitaire du motif et absence de réflexion d’éléments privés, assertion serveur P2:mailbox sans requête vers autre compte. git diff --check réussi. Pas de modification UI/schéma, pas de navigateur ou recette réelle. L’envoi Microsoft et les données historiques ne sont pas modifiés.
- Livraison **locale sans commit/push** : pack PocketBase unique `/private/tmp/horizon-pocketbase-messaging-pagination-p2-20261016.zip`, **247 fichiers source** + manifeste/instructions/exemple ; SHA-256 `f6cf199d2c321ca0ed9cae58fa81138d3bda37d26103ea6085ec2992c2b50d30`. CRC et empreintes comparés aux sources ; seuls lib/mail-pagination.js et lib/mail-reader.js changent par rapport au pack précédent, migrations/configuration inchangées. Installation NAS non effectuée. Prochaine action : copie de pb_hooks complet/redémarrage, relève après échéance, communiquer seulement le nouveau code P2 si refus ; ne pas prétendre que la cause NAS est corrigée avant ce retour.


### 16 octobre 2026 — Largeur des mails dans le fil et retour utilisateur sur la pagination

- L’utilisateur indique « ok c’est bon » après le diagnostic P2 : déblocage déclaré, sans détails sur l’installation, le code de rejet ou les messages réellement reçus. Aucun accès NAS/boîte par l’agent ; ne pas assimiler ce retour à une recette complète de réception ni déduire une cause de rejet non fournie.
- Ajustement demandé : blocs communs e-mail envoyés/reçus ajustés au contenu et limités à **50 % du fil sur desktop**, largeur disponible complète à 700 px et moins. CSS partagé uniquement, miniatures et dépliage conservés. Contrat UX 07 actualisé ; aucune modification des notes ordinaires, du backend, des données ou des permissions.
- Vérifications : lint réussi ; parcours Playwright du fil e-mail **1 / 11,6 s**, OK, avec assertions de largeur réelle ≤50 % pour envoyé/reçu desktop et 100 % mobile, dépliage, aperçu image/PDF, focus et absence de débordement. Captures examinées en clair, sombre et mobile. Services locaux jetables et correspondance simulée ; pas de nouveau test serveur/build/typecheck, CSS et assertions navigateur seuls modifiés. git diff --check réussi.
- Livraison **locale sans commit/push**, aucun nouveau pack PocketBase nécessaire, frontend Vite à jour. R07/compteurs inchangés ; réception réelle complète/renouvellement et nettoyage des anciens droits restent à confirmer selon les travaux actifs. Prochaine action : validation visuelle utilisateur de la largeur dans son fil.


### 16 octobre 2026 — Largeur des e-mails augmentée à 65 %

- Ajustement utilisateur du plafond de 50 % jugé trop étroit : **65 % maximum sur desktop** pour les blocs communs envoyés/reçus, toujours adaptés au contenu ; mobile à 100 % inchangé. Règle canonique 07 et assertions du parcours existant mises à jour.
- Vérification : parcours Playwright e-mail **1 / 10,8 s**, réussi (largeurs desktop/mobile, clair/sombre, aperçus et dépliage), capture desktop examinée, git diff --check réussi. Pas de nouveau lint/typecheck/build ou test backend pour ce changement de valeur CSS et d’assertions ; aucun serveur distant ni e-mail réel utilisé.
- Livraison locale sans commit/push ; aucun nouveau pack PocketBase. Statuts/compteurs inchangés, validation visuelle utilisateur restante.


### 16 octobre 2026 — Préparation de la publication Git du lot e-mail

- Commit/push explicitement demandés par l’utilisateur : périmètre complet depuis le dernier commit Congés, soit Messaging Graph OAuth délégué, modèles/signatures, envoi commercial/PDF/outbox immédiate, réponses liées, fil commun avec pièces/texte et plafond desktop 65 %, migrations 0018/0019/0020 et documentation. Entrée README mise en cohérence avec la réception livrée localement. Aucun secret, donnée PocketBase, pack ZIP ou build ajouté à Git ; contrôle heuristique des 79 fichiers préparés sans emplacement suspect. Suppression d’une ligne vide finale dans le helper de pagination, sans changement fonctionnel ni nouveau pack.
- Vérifications finales réellement rejouées : pnpm check réussi (lint, TypeScript, **287 tests / 65 fichiers**, build ; avertissement de chunks habituel), **33 tests serveur Messaging / 91,876 s**, OK, incluant consentement, chiffrement, envoi, reprises/concurrence, réponses, pagination, permissions/fichiers et upgrade de base installée. Démarrage des migrations **1 / 0,142 s**, OK. Parcours navigateur du fil au plafond 65 % réussi pendant l’intervention précédente (1 / 10,8 s), non répété sans changement UI nouveau. git diff --cached --check réussi ; origin/main et HEAD alignés avant commit. Pas de nouvel accès NAS ou envoi réel.
- État : changements validés et préparés localement, commit/push à exécuter maintenant ; résultat effectif consigné dans l’entrée de publication suivante. R07/compteurs inchangés ; les limites de recette réelle et les tâches restantes des travaux actifs demeurent.


### 16 octobre 2026 — Publication du lot e-mail confirmée

- Commit applicatif **7d7e7c4** (« feat: intégrer les e-mails Microsoft et les réponses dans Horizon »), 79 fichiers, créé puis **push origin/main réussi** de 64bbe9a à 7d7e7c4. Résultat Git observé, distinct de toute installation NAS. Vérifications détaillées dans l’entrée précédente ; aucun changement applicatif supplémentaire pour ce suivi.
- Publication du suivi documentaire dans un second commit, selon le journal habituel du projet ; état des tâches et compteurs inchangé. Aucun nouveau pack ni déploiement, aucun secret ajouté. Prochaine action : poursuite de la recette réelle Messaging et des tâches restantes documentées.


### 16 octobre 2026 — Proposition d’une page Activité complète

- Demande exploratoire utilisateur : prolonger l’activité récente du dashboard par une page complète. Existant examiné : widget DashboardFeeds, service/repository Dashboard et endpoint dashboard.activity, fil partagé Activity et contrats 04/07. Le widget est limité à six événements et ne constitue pas une liste globale paginée avec recherche/critères.
- Proposition à valider : entrée Activité dans Espace de travail et lien Voir toute l’activité depuis le widget ; fil chronologique commun aux modules, recherche/filtres de top bar partagés (type/module/période), accès à la fiche liée, texte/pièces e-mail selon le rendu existant. La page doit réutiliser une politique serveur d’accès par source/fiche avant résultats et compteurs ; ne pas transformer simplement le flux dashboard limité en accès général, ni dupliquer notifications ou données d’activité. Paramétrer les vues personnelles/mentions/tâches selon leur sens, sans inventer un statut lu/non lu sur tous les événements.
- Investigation/proposition seulement, aucune page, API, migration ou règle modifiée ; aucun test applicatif/navigateur exécuté, git diff --check contrôlé. État local documentaire sans commit/push ni nouveau pack ; statuts/compteurs inchangés. Prochaine action : validation du périmètre de la page avant implémentation.


### 16 octobre 2026 — Page Activité globale et résumé dashboard autorisé

- Périmètre validé puis développé : entrée Activité dans Espace de travail, lien Voir toute l’activité depuis le widget, trois vues Équipe / Mon activité / Mes mentions. Réutilisation de WorkspaceSearch/SearchFilters (modules/types multiples, période, recherche, groupes/tri), HRecordTabs, HListPagination et GroupedResults ; critères conservés dans l’URL, 20 événements/page, reset gardant le texte, rafraîchissement 30 s. Réutilisation d’ActivityItem pour notes, diff, tâches et correspondance ; source avec lien vers le gestionnaire partagé des fiches, miniatures/loupe et règles de largeur e-mail conservées. Retour à la ligne du résumé corrigé sur mobile, action Actualiser discrète ; création/mise à jour de tâche distinguées même avec projection de la tâche courante.
- Lecture transverse dans core/activity, via Service → Repository → endpoint contrôlé ; contrôle du module et de chaque fiche avant recherche, projection, totaux, groupes et pagination. Congés et Notes de frais conservent leurs périmètres ; mentions non habilitantes ; orphelins/références historiques malformées ignorés et erreurs techniques non absorbées. Dashboard réutilise le même lecteur et ses six résultats. Pas de nouvelle collection, permission, migration, dépendance ou écriture des événements historiques. Contrats durables actualisés dans 04/05/06/07 et README ; tests/pack dans 09.
- Vérifications : pnpm check complet réussi (lint, TypeScript, **287 tests/65 fichiers**, build ; avertissement de chunks habituel), **16 tests Activity / 35,521 s**, **4 Dashboard / 9,976 s**, **1 Congés / 2,806 s**, **1 Notes de frais / 2,511 s**, **3 Messaging ciblés / 9,288 s**. Parcours navigateur Activité final **1 réussi / 4,6 s**, comprenant filtres/rechargement/groupes/popup/vues/reset/tâches ; parcours e-mail partagé **1 réussi / 7 s**. Captures clair/sombre/mobile 390 px inspectées, comparaison Contacts effectuée, débordement corrigé ; aucun accès NAS, mail réel ou benchmark de production. Limite explicite de 10 000 candidats/période, avec demande de réduction et sans total tronqué.
- Livraison **locale sans commit/push**. Pack unique PocketBase `/private/tmp/horizon-pocketbase-activity-20261016.zip` : 247 sources hooks/migrations + instructions/manifeste, ZIP/empreintes vérifiés, migrations historiques strictement inchangées ; SHA-256 `6f272aed9c3d2d0c1123a81a243c078c501af1fbf8669bc9155558172c1a6f79`. Aucun frontend/base/Compose/secret. Installation NAS non effectuée ni confirmée pour ce lot. Prochaine action : hooks à jour + redémarrage avec le frontend correspondant, puis recette utilisateur sur données/droits réels. Travaux actifs actualisés ; R10 reste À vérifier et X01 En cours, statuts/compteurs globaux inchangés.


### 16 octobre 2026 — Proposition de GED Documents

- Investigation à la demande de l’utilisateur sur la future GED. README/AGENTS et contrats Documents 03/04/05/06/07 examinés, ainsi que les routes, service/repository Documents, accès et gestionnaire de pièces partagé. Existant : studio/modèles/aperçus et fichiers détenus par les modules métier ; aucune bibliothèque GED globale livrée. `documents_generated` et `documents_links` sont prévus au contrat, sans confondre ce cadrage avec une collection déjà déployée.
- Proposition en discussion : bibliothèque Documents avec espaces/dossiers, liste/cartes et aperçu partagé à droite, dépôt multiple, catégories/tags, recherche contextuelle et critères URL partagés, classement affaire via compte analytique existant et liens clients/fournisseurs/pièces. Référencement progressif des pièces existantes sans copie/migration physique silencieuse ; chaque lien conserve la policy du propriétaire et ne donne pas accès à une source privée. Dépôts GED autonomes avec droits explicites, nouvelles versions avec historique, documents finalisés/envoyés immuables, archivage distinct de la suppression. Modèles et catégories administrés dans Paramètres. Premier lot proposé : bibliothèque/dépôt/aperçu/classement/versions/droits puis raccordement progressif des sources existantes.
- Cadrage seulement : aucun code, collection, migration ou contrat validé modifié ; aucun test applicatif/navigateur nécessaire/exécuté, contrôle `git diff --check` effectué. Changements de la page Activité précédente conservés. État local documentaire sans nouveau commit/push/pack ni installation NAS ; statuts/compteurs inchangés. Prochaine action : validation du périmètre GED avant spécification détaillée du modèle, des permissions et implémentation.


### 16 octobre 2026 — Publication Activité et démarrage GED G01

- Commit/push demandé puis effectué : **10e3368** (« feat: ajouter la page Activité transverse »), 31 fichiers, push origin/main observé de 68a0be9 à 10e3368. Pas d’installation NAS ni d’envoi réel ; vérifications de la livraison Activité consignées dans son entrée précédente.
- GED autorisée ensuite : premier lot bibliothèque/dépôt multiple/classement/aperçu/versions/droits ; espaces et dossiers, catégories paramétrées, liens métier, fil/historique. Contrats G01 précisés dans 04/05/06/07 avant création des collections ; indexation des pièces existantes prévue progressivement sans copie/relocalisation silencieuse. Développement démarré, aucun résultat de test ou déploiement encore annoncé pour G01.


### 16 octobre 2026 — GED G01 livrée localement

- Premier lot autorisé implémenté dans Documents : quatre espaces, dossiers imbriqués et chemins complets, bibliothèque liste/cartes avec miniatures d’images à chargement différé, aperçu commun à droite, dépôt multiple, catégories/tags/description et liens autorisés vers les fiches. Recherche et filtres multiples/archives compactes dans WorkspaceSearch/SearchFilters, groupes par affaire/société/dossier/catégorie/format/auteur avec clés stables (homonymes distincts), tris d’en-tête et pagination 20, URL conservée, affichage clair/sombre/mobile. Métadonnées, versions/commentaires et fil en consultation ; archivage/réactivation sans suppression. Catégories dans Paramètres → GED et classement, accréditations disponibles dans Utilisateurs et accès.
- Cinq collections privées par migration additive **1791840021**, fichiers protégés et route de téléchargement autorisée, versions immuables, numérotation de version/concurrence/lot atomiques côté serveur, contrôle auteur/gestionnaire et ACL document + tous parents + toutes sources. Gestion implique contribution, sans élargir les restrictions ; entrée de droits initiale limitée aux admins dont le rôle n’est pas partagé avec un autre profil. Les versions, anciennes pièces métier et snapshots historiques ne sont pas réécrits. Audit incluant anciens/nouveaux liens ; événements GED raccordés au fil global et au résumé dashboard via le contrat Core. HAttachmentPreview extrait du gestionnaire partagé, picker PDF/images inchangé par défaut, extensions GED explicites ; aucune dépendance ou conteneur ajouté.
- Vérifications : **pnpm check réussi, 292 tests / 67 fichiers**, lint/types/build (avertissement de chunks habituel), **5 tests GED / 12,886 s**, **12 Access/HR / 28,579 s**, **16 Activity / 37,856 s**, **24 Documents/studio / 74,732 s**, tous réussis. Migration sur base antérieure remplie et répétition testées avec conservation d’un fichier protégé réel de fixture et des rôles partagés. Navigateur : 3 parcours Activité/GED/mail réussis (22,5 s), GED final rejoué après ajustements (5,6 s, invocation 9,8 s). Captures clair/sombre/mobile et référence Paramètres inspectées, contrôle d’absence de débordement et régression du cache TXT en cartes. Pas de NAS, de Microsoft réel, de conversion Office/OCR ni de mesure de production ; limites détaillées en 09.
- Livraison GED **locale, sans nouveau commit/push** après le commit Activité **10e3368 déjà poussé** au début de cette intervention. Pack unique PocketBase `/private/tmp/horizon-pocketbase-ged-20261016.zip` : 252 sources hooks/assets/migrations + instructions/manifeste, ZIP/empreintes vérifiés et migrations historiques inchangées ; SHA-256 `a83c29cbc4f9d53f80cbfcbf5b0a2b7081e5c3fe6288da3aaa80477abd26fd41`. Aucun frontend/base/Compose/secret, installation NAS non effectuée. Prochaine action : installer hooks + migration 0021, redémarrer/reconnecter Horizon, configurer droits puis recetter ; raccordement des pièces existantes et accès depuis fiches en lot suivant, sans déplacement silencieux. Contrats 00/03/04/05/06/07/09 actualisés et travaux actifs mis à jour ; R06 reste En cours, compteurs globaux inchangés.

### 16 octobre 2026 — Simplification de la lecture Documents

- Retour utilisateur : la première bibliothèque GED était trop complexe. La liste occupe désormais toute la largeur à côté des dossiers, sans fiche ni fichier présélectionné. Le titre indique le dossier et l’espace ; le tableau montre nom, classement/rattachement, catégorie, auteur, version et modification. Création de dossier dans la navigation des dossiers, ajout de documents comme action principale. Le dépôt revient à la liste ; le clic ouvre une consultation dédiée avec aperçu et onglets Informations/Versions/Activité, puis fermeture conservant les critères URL. Édition/version remplacent temporairement la consultation sans empiler les fenêtres. Dimensions des fenêtres alignées sur l’espace de travail ; aperçu défilable sur mobile. Contrat UX 07 actualisé.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 292 tests/67 fichiers, build ; avertissement habituel de taille de chunk). ESLint ciblé après adaptation du parcours, `git diff --check`. Playwright GED final réussi, 1 parcours/6,7 s (invocation 10,5 s) : dépôt multiple, classement, ouverture/fermeture sans perte de contexte, versions, archives, recherche/groupes/cartes, paramètres, mobile avec bornes de fenêtre et défilement des métadonnées. Captures clair/sombre/mobile et référence Contacts inspectées ; débordement mobile observé puis corrigé et retesté. Backend/schéma inchangés par cette correction ; tests serveur précédents non rejoués. Pas de recette NAS ni de données réelles.
- Livraison locale, sans nouveau commit/push. Aucun nouveau pack PocketBase nécessaire pour cet ajustement frontend ; pack GED précédent inchangé, installation NAS non confirmée. Prochaine action : retour utilisateur sur cette présentation et recette avec les droits/documents réels ; raccordements GED des pièces existantes restent à réaliser. Statuts/compteurs globaux inchangés.

### 16 octobre 2026 — Limites visuelles des zones Documents

- Suite au second retour utilisateur, reprise ciblée du découpage : panneaux Contacts bordés et surfaces distinctes pour Dossiers et Documents, en-têtes teintés avec le token partagé des en-têtes, chemin espace/dossier explicite. Compteur, Liste/Cartes et actualisation placés dans l’en-tête du panneau Documents ; contours conservés à vide et panneaux empilés sur mobile. Contrat UX 07 actualisé. Aucun changement backend ni de schéma.
- Vérifications : TypeScript, ESLint ciblé et `git diff --check` réussis. Parcours Playwright GED final réussi (1 test, 6,8 s ; invocation 10,6 s), incluant les deux titres de zones, le rattachement des contrôles, dépôt/versions/archives/recherche/groupes/cartes, paramètres et mobile. Captures clair/sombre/mobile inspectées et référence Contacts réexaminée. Un premier passage a relevé le sélecteur de titre devenu ambigu ; un second a détecté une interception du clic par l’en-tête collant causée par un `overflow: hidden` sur son nouveau parent. Retrait de ce débordement puis parcours complet réussi ; pas de forçage du clic. Suite unitaire/build non rejoués pour cette correction de présentation ; serveur inchangé, aucune recette NAS.
- Livraison locale sans commit/push ; aucun nouveau pack PocketBase requis. Prochaine action : retour utilisateur sur les zones maintenant délimitées. Installation du lot GED sur NAS non confirmée ; statuts/compteurs globaux inchangés.


### 17 octobre 2026 — GED G02 : pièces métier, recherche et expérience de consultation

- Retour utilisateur pris en compte sur les cartes, emplacement de Nouveau dossier, bandeaux gris, recherche et absence des documents métier. Cartes compactes via HDirectoryCard (baseline Contacts, portrait 64 px, hauteur 112 px), aperçu au clic, action + dossier dans l’en-tête « Mes dossiers » avec choix de l’espace dans le formulaire ; panneaux délimités mais en-têtes sans fond gris. Vue Tous les documents et regroupement par Thème par défaut ; critères URL conservés, formats/archives et filtres/groupes partagés. Recherche par mots, sans accents/casse/séparateurs, incluant nom de pièce, catégorie, dossier et références autorisées.
- Catalogue fédéré serveur en lecture seule : pièces du fil des fiches, PDF/pièces envoyés et réponses corrélées de Messaging, originaux de facturation, justificatifs de dépenses/congés selon leurs périmètres. Rattachements affaire/client/commandes et ventilations d’achats projetés sans nouveau code affaire ni élargissement de droits. Le PDF envoyé historique est consulté à son emplacement d’origine, sans copie, régénération, mutation des modules ou migration supplémentaire. Provenance, fiche et règle d’accès visibles ; aucune action de mutation depuis GED pour ces pièces. Les binaires non enregistrés (simple aperçu) ne sont pas inventés. Contrats 03/04/05/06/07/08 actualisés, référence README et recette 09.
- Vérifications : `pnpm check` réussi (lint/types, **292 tests / 67 fichiers**, build ; avertissement de taille de chunk habituel), ESLint ciblé et `git diff --check`. **10 tests serveur GED / 27,732 s**, incluant recherches, permissions effectives, sources RH avant/après soumission, original facture, non-copie, versions et upgrade additive. **1 test Messaging/GED / 3,200 s** : PDF envoyé + réponse, permissions affaire et retrait source, octets inchangés, rejet d’un lien vers un message privé, absence de Cc/Bcc. Transport Microsoft/Gotenberg simulé localement, aucun envoi réel. Navigateur Activité+GED : **3 parcours réussis / 18,2 s** ; GED final **2 réussis / 13,2 s**, avec images réellement chargées et captures stabilisées. Clair/sombre, desktop/mobile et comparaison Contacts inspectés ; absence de débordement et consultation seule testées. Premiers échecs limités aux fixtures/sélecteurs corrigés (multipart sans ligne vide, fixture mail volontairement falsifiée à restaurer après assertion de non-divulgation, pictogramme verrou également exposé comme image). Pas de recette NAS ni de benchmark de volumétrie réelle ; limites explicites du lecteur dans 05.
- Livraison **locale sans nouveau commit/push**. Pack unique `/private/tmp/horizon-pocketbase-ged-20261017.zip` : 253 sources hooks/assets/migrations + instructions/manifeste, ZIP et empreintes vérifiés, migrations strictement identiques au pack G01. SHA-256 **f1b1330bea0140c3a9b4eac085bb2bde5f1ca71d831f9d9ca8ed0439db1bb8d3**. Aucun frontend, base ou secret. Si G01 est installé : remplacer les hooks complets et redémarrer, aucune migration additionnelle ; sinon 0021 est toujours nécessaire. Installation NAS non effectuée/non confirmée. Prochaine action : déployer le pack avec le frontend correspondant, recetter sur les pièces/droits réels puis poursuivre les entrées GED depuis les fiches. Travaux actifs actualisés, R06 reste En cours et compteurs globaux inchangés.

### 17 octobre 2026 — Investigation du 404 GED sur l’instance utilisateur

- Signalement navigateur : GET `172.30.10.10:50190/api/horizon/ged/files?space=all` répond 404. Vérification read-only du serveur indiqué, sans compte, jeton ni lecture de fichiers métier : health 200 ; files/choices GED et feed Activity répondent 401 ; route volontairement inexistante répond 404. Les routes GED sont donc enregistrées au moment du contrôle. Les cinq collections GED répondent 403 « Only superusers… » sur leur liste native, ce qui confirme leur existence et leur fermeture, sans valider leur contenu ni la version exacte des hooks chargés. Ne pas conclure à des hooks ou une migration absents sur la seule trace console.
- Contrôle local : route présente dans ged.pb.js et pack G02, ZIP intègre ; examen du service/repository et des lectures de références susceptibles de retourner 404. Aucun code ni schéma modifié sans le message réel ; un objet lié manquant pendant la projection reste une hypothèse. Demande du seul JSON de réponse dans Réseau (sans en-têtes Authorization). Pas de test applicatif rejoué pour cette investigation ; `git diff --check` exécuté.
- Livraison documentaire locale, pas de commit/push, nouveau pack ou mutation NAS. La présence des routes et collections est observée, l’installation précise du pack G02 et la recette authentifiée ne sont pas confirmées. Prochaine action : analyser le JSON du 404 utilisateur pour reproduire/corriger la cause ; ne pas réparer ou purger les données manuellement. Statuts/compteurs inchangés.

### 17 octobre 2026 — Correctif GED : ancien rattachement absent bloquant le catalogue

- JSON utilisateur reçu : 404 « The requested resource wasn't found. ». Reproduction locale exacte avant correction via une facture avec pièce protégée et ancienne commande source absente dans son JSON source_orders ; le GET de catalogue échouait en entier sur findRecordById, malgré une fiche et un fichier valides. Ceci établit un cas de code reproduisant le signalement, pas l’identité de la ligne en cause sur le NAS (aucun accès authentifié aux données utilisateur).
- Correction ciblée des lectures optionnelles de contexte dans ged-business : recherche d’ancienne commande ou de compte analytique retournant zéro ligne distincte d’une requête échouée. Maintien du document et des autres résultats, omission du seul contexte absent, avertissement origin.warning dans la consultation et log technique sûr. Aucune réparation, recréation ou suppression de relation/binaire/historique. Les refus d’accès et la policy du propriétaire sont conservés ; les autres erreurs techniques continuent de remonter. Contrats 05/06/07/09 actualisés.
- Vérifications : régression rouge avant correctif (404 et texte exact) puis verte ; **10 tests GED / 26,096 s** réussis, incluant téléchargement intact, référence source non réécrite et coexistence d’un document sain. `pnpm check` complet réussi : lint, TypeScript, **292 tests / 67 fichiers**, build (avertissement de chunk habituel) ; `git diff --check`. **2 parcours navigateur GED / 13,6 s** réussis ; accès aux fichiers et consultation seule conservés. Tests sur bases jetables, aucun envoi réel, aucune mutation ou recette authentifiée du NAS ; le nouvel avertissement est couvert par la projection serveur, pas par une fixture navigateur dédiée avec données orphelines.
- Livraison locale sans commit/push. Pack unique `/private/tmp/horizon-pocketbase-ged-fix404-20261017.zip`, 253 sources + instructions/manifeste (255 entrées), intégrité et migrations inchangées vérifiées, SHA-256 `d81ad0e19335bda9450a5f8865a3c582ea4d30c8888960d85c5fd82a6569cbd9`. Remplacer les hooks complets et redémarrer PocketBase puis recharger Horizon ; aucune nouvelle migration. Installation utilisateur non confirmée. Prochaine action : installer ce pack et confirmer le résultat sur la base signalée ; ne pas conclure à une résolution NAS sans cette recette. Statuts/compteurs globaux inchangés.


### 17 octobre 2026 — GED G03 : sélection métier puis chargement ciblé

- L’utilisateur confirme que le correctif 404 fonctionne, puis signale les lenteurs et demande de sélectionner d’abord une affaire/un client avant de lire ses pièces. Diagnostic : catalogue complet hydraté avant filtres ; clé de liste contenant document/view provoquant des relectures pour aperçu et Liste/Cartes, polling 30 s. La décision G03 remplace le chargement Tous les documents initial de G02, sans réécrire son historique documentaire.
- Réalisation : entrée Affaires vide avec combobox distante (2 caractères minimum), même parcours Clients/Fournisseurs, contexte/label/critères conservés dans l’URL. Sélection SQL des racines et dépôts avant hydratation, limitée aux modules consultables et à leurs relations/ventilations ; droits du contexte et de chaque source/binaire toujours contrôlés. Factures retrouvées par le compte canonique CRM et les comptes de devis, sans imposer une commande source ; pièces des devis/commandes/opérations/e-mails conservées. Cache de contexte en requête, recherche frontend temporisée/annulable, clé de liste indépendante du document/vue, suppression du polling global, cache par compte/révision d’accès. Dépôt pré-rattaché au contexte choisi ; dossiers ciblés et Interne gardent les dépôts non rattachés et justificatifs autorisés. API context descriptive privée, aucune copie de média ou régénération PDF. Migration additive **1791840022**, 22 index SQL de lecture uniquement ; contrats 00/03/04/05/06/07/09 et travaux actifs actualisés.
- Vérifications : `pnpm check` complet réussi (lint/types, **293 tests/67 fichiers**, build avec avertissement de chunk habituel) ; ESLint ciblé après derniers changements et `git diff --check`. **11 tests serveur GED / 29,144 s**, incluant les scopes, 404 corrigé, facture client/affaire par analytique, pièces RH, upgrade/fichier réel conservé. **1 Messaging/GED / 3,235 s** avec envoi/réponse simulés et droits réduits. Fixture de 1 100 références hors client choisi : aucun dépassement du garde-fou ni hydratation globale, seule sa pièce retournée ; EXPLAIN QUERY PLAN confirme le nouvel index inverse. Lecture locale mesurée **4,0 ms** sur ce cas synthétique (pas un benchmark NAS ni 1 100 binaires réels). **2 parcours navigateur / 17,1 s** réussis : zéro requête de liste au démarrage, frappe E/EX/EXE groupée en une requête, aperçu/changement de vue sans relecture, choix Client puis Affaire, dépôt pré-rattaché et restauration après reload. Clair/sombre/mobile et référence Contacts inspectés, pas de débordement. Un échec intermédiaire a révélé une navigation contexte écrasable par une saisie immédiate : commit de navigation synchrone et attente du nouvel URL vérifiés ; fixture de facture explicitement affectée au compte de l’affaire pour la régression analytique. Aucun envoi réel ni accès authentifié/benchmark de la nouvelle version sur NAS.
- Livraison locale sans commit/push. Pack unique `/private/tmp/horizon-pocketbase-ged-contextes-20261017.zip` : 255 sources + instructions/manifeste, ZIP/empreintes validés, migrations antérieures inchangées, SHA-256 **260ec82cdc294e08d4875f0f850d9622357fce9cac4f3b4ed2390427a20c5faf**. Copier hooks complets **et migrations dont 0022**, redémarrer PocketBase puis recharger Horizon. Installation G03 NAS non effectuée/non confirmée ; confirmation utilisateur précédente concerne seulement le correctif 404. Prochaine action : installer ce pack, mesurer/recetter les sélections réelles puis poursuivre les entrées GED depuis fiches ; racines et métadonnées d’un contexte restent bornées explicitement. R06 reste En cours, statuts/compteurs globaux inchangés.

### 17 octobre 2026 — GED : sélecteurs Affaire/Client vides à l’ouverture

- Cause reproduite dans le code : aucune recherche de références avant deux caractères, avec une option vide « Rechercher… » présentée comme un choix. Correction frontend : jusqu’à 20 suggestions accessibles dès l’ouverture, recherche distante temporisée dès la saisie, suppression de la fausse option vide ; conserver aussi le résultat choisi tant que sa description se charge. Les suggestions ne chargent aucun document ; la lecture de fichiers reste conditionnée au contexte choisi. Contrats fonctionnel 04 et UX 07 actualisés.
- Vérifications : lint, TypeScript, 293 tests unitaires (67 fichiers), build réussis (avertissement de taille de chunk habituel). Deux parcours Playwright GED réussis (16,3 s), avec nouvelles assertions de propositions Client et Affaire avant toute frappe, puis recherche/sélection et affichage des pièces. Captures clair/sombre/mobile inspectées ; aucun débordement relevé. Un log dashboard « Data unavailable » est apparu dans la fixture navigateur sans échec du parcours GED ; aucun test sur NAS ou envoi réel.
- Livraison locale, sans commit/push. Aucun changement de hook/schéma et aucun nouveau pack PocketBase pour cette correction ; le pack G03 précédent reste requis pour son backend. Installation G03 et recette utilisateur sur NAS toujours non confirmées. Prochaine action : recharger Horizon et vérifier les sélections sur les données réelles ; R06 et compteurs inchangés.

### 17 octobre 2026 — GED par pièce d’origine et correction activité dashboard

- Retour utilisateur : rejet du thème « Affaires et technique » et fil dashboard indisponible avec logs status 0. Cause confirmée : réponse serveur avec href GED/RH/facturation autorisé, rejetée par l’ancienne expression du schéma Zod frontend ; le log assimilait cette erreur de format à une erreur réseau. Le schéma utilise désormais une allowlist typée exhaustive des destinations Activity (chemins internes + id strict), tests d’URL invalides, sans relâcher l’autorisation serveur. Diagnostic format distinct et annulations PocketBase non journalisées comme panne.
- GED : classement dérivé de la source métier réelle, groupes Pièce d’origine avec type/référence par défaut, filtre/regroupement Type de pièce et colonne triable correspondante. Devis/commandes clients/DA/BC fournisseurs/BL/BR/factures/avoirs distincts ; e-mails historiques de devis restent Devis après conversion. Catégories personnalisées facultatives, sans incidence sur la provenance. Dépôts directs affaire/société et anciens sans pièce restent explicitement identifiables ; aucun rattachement inventé, fichier copié ou historique modifié. Recherche/rattachement aux quatre types de factures/avoirs ajoutés dans le dépôt, sous les droits billing existants. Contrats 04/05/06/07/09 actualisés ; aucune modification de schéma.
- Vérifications : pnpm check réussi (lint/types, **332 tests / 69 fichiers**, build avec avertissement de chunk habituel). Après dernier ajout des choix facturation : lint/types et **test serveur facture ciblé / 2,649 s**. **11 tests backend GED / 31,090 s**, **1 Messaging/GED / 3,319 s**, **2 parcours Playwright / 16,7 s** : suggestions, choix et groupes métier, dépôt/versions/archives, restauration contexte, résumé dashboard contenant un dépôt GED puis consultation depuis son lien. Rendus GED clair/sombre/mobile et dashboard inspectés ; ajustement des libellés pour conserver les colonnes visibles sur desktop. Permissions, absence de recopie des PDF envoyés et immutabilité des pièces vérifiées dans les tests serveur. Aucun envoi réel ou accès authentifié NAS ; latence réelle non mesurée.
- Livraison locale, sans commit/push. Pack `/private/tmp/horizon-pocketbase-ged-pieces-20261017.zip` : **256 sources + instructions/manifeste = 258 entrées**, intégrité/empreintes vérifiées, toutes migrations identiques au pack G03, SHA-256 **df92a88a18411e3c7b8d991fe06f15eb1f9689984baab84d1ed113c01585dbe0**. Remplace le précédent pack contextes, toujours PocketBase uniquement ; recharger aussi le frontend corrigé pour le dashboard. Installation NAS non confirmée. Prochaine action : installer hooks/migrations du pack puis recetter classement et activité sur les données réelles. R06 reste En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — Sidebar : repli individuel et global des sections

- Sections Espace de travail / Activité / Ressources humaines / Finance / Administration : titres cliquables à chevron, repli indépendant et commande compacte Tout replier/Tout déplier. Réutilisation de SidebarItem, sans démontage des sous-menus masqués ni modification des liens/droits. Préférence locale isolée par utilisateur (`horizon.sidebar.sections:<id>`), conservée après rechargement ; stockage indisponible signalé en console sans bloquer la navigation. En mode pictogrammes/mobile, tous les modules autorisés restent accessibles ; retour desktop rétablit les sections mémorisées. Contrats 04 et 07 actualisés.
- Vérifications : pnpm check réussi (lint, types, **332 tests / 69 fichiers**, build avec avertissement de chunk habituel) ; lint/types et build revérifiés après correction du mode compact. **Deux parcours Playwright / 2,6 s** : clavier, repli individuel/global depuis état mixte, conservation après reload, sélection Contacts, modes compact/mobile et absence de débordement. Captures Contacts clair/sombre, toutes sections repliées et mobile inspectées. Première recette a détecté une exclusion d’accessibilité des liens compact malgré leur réaffichage CSS : masquage désormais conditionné au vrai mode desktop via matchMedia ; régression réussie. Recette en aperçu local, sans nouveau test authentifié multi-comptes ni NAS ; isolation de préférence par clé de compte explicite dans le composant.
- Livraison locale sans commit/push. Aucune migration, aucun hook ou nouveau pack PocketBase nécessaire. Prochaine action : validation utilisateur du placement et du comportement ; statuts/compteurs de modules inchangés.

### 17 octobre 2026 — Sidebar : indicateurs de section discrets

- Proposition validée après constat de trop nombreux chevrons : sur les titres de section, chevron masqué au repos, visible au survol et au focus clavier visible, sans déplacement du contenu. Les chevrons des modules restent visibles. Une section repliée affiche « · N », nombre de modules autorisés de premier niveau ; aucun compteur de sous-pages ni de module interdit. Commande globale, mémorisation, permissions et fonctionnement compact/mobile conservés. Contrat UX 07 actualisé.
- Vérifications : lint et TypeScript réussis, git diff --check sans erreur ; deux parcours Playwright réussis en 2,6 s incluant survol, véritable navigation Tab/Shift+Tab, compteur 7 puis disparition au dépliage, rechargement, action globale et modes compact/mobile. Première assertion utilisait un focus programmatique après souris (sans focus-visible) : test corrigé pour reproduire le clavier. Captures Contacts clair/sombre, toutes sections repliées et mobile inspectées. Recette locale en aperçu ; pas de test NAS ou de nouveau build complet pour cet ajustement visuel ciblé.
- Livraison locale sans commit/push, aucun hook, aucune migration ni pack PocketBase supplémentaire. Prochaine action : validation utilisateur du rendu ; statuts/compteurs de réalisation inchangés.

### 17 octobre 2026 — Sidebar : action globale en icône à droite du logo

- Placement demandé explicitement : suppression de la ligne Tout replier/Tout déplier au-dessus des sections ; bouton HButton ghost/icône de 30 px à droite du logo dans l’en-tête existant de 64 px. Icône d’action adaptée à l’état, libellé accessible et tooltip conservés, sans texte visible. Lanceur de modules sur le logo et commande globale restent deux boutons distincts. Mémorisation, plis individuels, compteurs, droits et accès compact/mobile conservés ; contrat UX 07 actualisé.
- Vérifications : lint et TypeScript réussis, deux parcours Playwright / 3,2 s réussis, dont position à droite du logo et centrage vertical, absence de texte dans le bouton, tooltip, action globale, rechargement, clavier et compact/mobile. Captures Contacts clair/sombre et mobile inspectées : logo intact, aucune ligne d’action supplémentaire. Recette locale en aperçu, pas de déploiement NAS ni nouveau build complet pour ce déplacement ciblé.
- Livraison locale sans commit/push. Aucun changement PocketBase ni nouveau pack. Prochaine action : validation utilisateur du placement ; statuts/compteurs inchangés.

### 17 octobre 2026 — Popup modules : présentation des catégories existantes et cadre de focus

- Demande : retirer le cadre persistant après clic sur le logo et améliorer uniquement l’agencement du menu des modules. Précision utilisateur intégrée : conserver exactement les catégories de la sidebar, sans reclassement Commercial/Opérations. Le popup réutilise directement les groupes autorisés existants : Espace de travail, Activité, Ressources humaines, Finance, Administration. Titres au-dessus des tuiles avec séparateur fin, deux colonnes desktop / une sous 1 050 px et grilles internes alignées sans étalement des groupes à deux modules. Style des tuiles, pictogrammes, paramètres de dimensions et sidebar conservés ; contrats 04/07 actualisés.
- Correctif du cadre : distinguer l’interaction clavier/pointeur lors de la restitution de focus du HDialog. Pas d’outline résiduel après souris, repère clavier maintenu après Échap/Tab, focus toujours rendu au logo ; aucun blur forcé ni changement global des autres popups.
- Vérifications finales : pnpm check réussi (lint/types, **332 tests / 69 fichiers**, build avec avertissement de chunk habituel), git diff --check sans erreur. **Trois parcours Playwright authentifiés / 12,4 s** réussis : mêmes destinations sidebar/popup et compte restreint, catégories conservées, alignement des groupes/tuiles, fermeture souris sans cadre, retour Échap/clavier avec repère, mobile sans débordement et dernière catégorie accessible au défilement ; paramètres UX tailles tuiles 120 px et icônes 44 px toujours appliqués. Captures popup sur fond clair/sombre et mobile haut/bas inspectées. Recette locale jetable, aucun envoi ni accès NAS.
- Livraison locale sans commit/push ; aucun hook/migration et aucun nouveau pack PocketBase nécessaire. Prochaine action : validation utilisateur de l’agencement final. Statuts/compteurs de réalisation inchangés.

### 17 octobre 2026 — Menu modules : équilibrage des colonnes

- Retour utilisateur : menu peu harmonieux malgré les catégories conservées. Cause visuelle : rangées de groupes partageant la hauteur d’Activité (deux lignes de tuiles), d’où un grand vide sous Espace de travail et une dernière rangée déséquilibrée. Deux piles indépendantes remplacent ces rangées : Espace de travail / Activité à gauche, RH / Finance / Administration à droite ; intervalle constant 24 px entre catégories. Titres, tuiles, catégories et destinations conservés. Sous 1 050 px, restitution d’une seule colonne dans l’ordre canonique ; au plus deux catégories autorisées, une seule pile. Contrat UX 07 actualisé.
- Vérifications : lint et TypeScript réussis ; deux parcours Playwright authentifiés réussis / 7,8 s, incluant des assertions géométriques sur les espaces entre groupes (24 px dans chaque colonne), mêmes destinations et permissions, retours de focus, rendu mobile et accès à la dernière catégorie. Captures grand écran clair/sombre et mobile inspectées : grands vides intermédiaires supprimés. Pas de nouvelle suite complète/build pour cet ajustement de structure ciblé ; recette locale, sans NAS.
- Livraison locale sans commit/push. Aucun hook, migration ou nouveau pack PocketBase. Prochaine action : validation utilisateur de la composition finale ; statuts/compteurs inchangés.

### 17 octobre 2026 — Menu modules : Activité sur une ligne

- Ajustement demandé : Activité utilise la largeur complète du popup pour afficher ses sept modules sur une seule ligne desktop. Rangée supérieure Espace de travail / RH, rangée inférieure Finance / Administration ; catégories, tuiles, permissions et ordre DOM/clavier canoniques conservés. Retours à la ligne adaptatifs en largeur étroite, sans débordement. Contrat UX 07 actualisé, disposition en piles indépendantes remplacée par cette composition.
- Vérifications : lint et TypeScript réussis ; deux parcours Playwright authentifiés / 7,8 s réussis, avec assertion des sept tuiles sur une même coordonnée verticale et de la largeur complète d’Activité, droits réduits, focus après souris/clavier et mobile. Captures clair/sombre grand écran et mobile inspectées. Pas de nouvelle suite complète/build pour ce changement ciblé, ni recette NAS.
- Livraison locale sans commit/push. Aucun changement PocketBase ni pack nécessaire. Prochaine action : validation utilisateur de la composition ; statuts/compteurs inchangés.

### 17 octobre 2026 — Menu modules : ordre visuel identique à la sidebar

- Correction après retour utilisateur : la grille dense plaçait RH avant Activité pour remplir un vide, malgré un ordre DOM canonique. Suppression du placement dense ; Espace de travail puis Activité occupent chacune une rangée entière ; RH, Finance et Administration viennent ensuite de gauche à droite. Activité conserve ses sept modules sur une ligne desktop. Ordre de catégories et de modules repris directement de la sidebar, aucun changement de droits ni tuiles. Contrat UX 07 mis à jour et interdiction explicite du réordonnancement visuel par remplissage dense.
- Vérifications : lint et TypeScript réussis, deux parcours Playwright authentifiés / 7,6 s réussis. Nouvelle régression comparant l’ordre géométrique réel (haut/bas puis gauche/droite) des catégories au texte de la sidebar, relevé avant ouverture du dialogue ; assertion des sept modules Activité sur une ligne conservée. Retours focus, droits réduits et responsive vérifiés ; captures clair/sombre/mobile inspectées. Première exécution de la régression lisait la sidebar après masquage modal, donnant une référence vide : relevé déplacé avant ouverture. Pas de suite/build complet répété pour cet ajustement ciblé, pas de NAS.
- Livraison locale sans commit/push ; aucun nouveau pack PocketBase, hook ou migration. Prochaine action : validation utilisateur de la composition ; statuts/compteurs inchangés.

### 17 octobre 2026 — Menu modules : retour à la disposition initiale avec séparateurs

- Demande explicite utilisateur : remettre le menu comme au début avec traits de séparation. Disposition CSS initiale restaurée depuis la référence Git pour les catégories empilées, titres à gauche et modules à droite (titres au-dessus en largeur étroite). Ajout d’un trait horizontal fin entre sections ; toutes compositions récentes en colonnes de catégories retirées. Catégories, ordre et tuiles identiques au menu initial. Correctif du cadre résiduel souris conservé avec focus clavier accessible. Contrats 04/07 actualisés pour remplacer les propositions successives.
- Vérifications : lint et TypeScript réussis ; deux parcours Playwright authentifiés / 8,5 s réussis : titre à gauche de la grille, séparateur 1 px, ordre visuel identique à la sidebar, Activité sur une ligne avec dimensions par défaut, droits réduits, fermeture et clavier, responsive/défilement. Captures desktop clair et mobile inspectées ; pas de suite/build complet répété pour cette restitution ciblée. Aucune recette NAS.
- Livraison locale sans commit/push. Aucun hook/migration ni nouveau pack PocketBase. Prochaine action : validation utilisateur de la présentation initiale restaurée ; statuts/compteurs inchangés.

### 17 octobre 2026 — Préparation du commit GED et navigation

- Publication demandée par l’utilisateur de l’ensemble des changements en attente depuis 10e3368 : GED G01/G02/G03 avec migrations 1791840021/0022 et permissions, lecture ciblée par affaire/client, provenance métier, correctif activité dashboard ; sections de navigation repliables et bouton global à droite du logo, popup restauré à sa disposition initiale avec séparateurs et correctif focus souris. Tous les fichiers en attente relèvent de ces interventions ; aucun pack, base, secret ou artefact de test ajouté à Git.
- Validation avant commit : pnpm check réussi (**332 tests / 69 fichiers**, lint/typecheck/build, avertissement habituel de taille de chunk), **11 tests serveur GED / 32,825 s**, **13 tests auth / 25,521 s**, **1 test Messaging/GED / 3,481 s** ; **5 parcours navigateur authentifiés / 26,5 s** (GED, dashboard/document, menu/permissions, UX), **2 parcours sidebar / 2,7 s**. git diff --check sans erreur ; fetch origin effectué, main local et origin/main identiques avant publication. Les contrôles sont locaux sur bases jetables ; aucune installation NAS ni envoi réel.
- État à cette étape : modifications locales validées, commit puis push en cours ; vérification du hash distant et confirmation documentaire à suivre. Packs GED déjà remis inchangés, installation NAS de la dernière version toujours non confirmée. Statuts/compteurs fonctionnels inchangés.

### 17 octobre 2026 — Publication GED et navigation confirmée

- Commit fonctionnel **5aed92f** (`feat: ajouter la GED et harmoniser la navigation`) créé et poussé sur **origin/main** ; hash complet vérifié par git ls-remote : 5aed92f423284a2a997cfec1b3e0dcbb9363913f. Arbre de travail propre après ce push ; présente note publiée séparément pour consigner le résultat réel.
- Les validations prépublication sont détaillées dans l’entrée précédente. Aucune nouvelle modification de code après validation, aucun déploiement du NAS : le push publie les sources, pas l’installation PocketBase. Packs GED déjà remis et statut d’installation non confirmé inchangés. R06 reste En cours ; prochaine étape : recette utilisateur/NAS de la version publiée, statuts/compteurs fonctionnels inchangés.

### 17 octobre 2026 — Recherche réglable et notifications personnelles

- Recherche top bar : largeur maximale paramétrable de 400 à 1 200 px dans Apparence et densité, défaut porté à 840 px ; largeur limitée par l’espace disponible, composant HTopbar commun au cadre et à l’aperçu des paramètres. Cloche : retrait individuel par croix, retrait des notifications lues, accès direct aux préférences. Retrait horodaté sans effacer l’historique métier ; conservation des règles privées et des accès à la pièce source.
- Mon compte / Notifications : préférences personnelles pour mentions, tâches, réponses e-mail, demandes et décisions de congés/frais et autres activités ; choix appliqués aux alertes futures. Les événements métier et validations restent exécutés. Aucun nouveau canal d’envoi e-mail ni changement Microsoft. Contrats 04/05/06/07/08/09 actualisés ; migrations 1791840023 et 1791840024, sans réécriture des migrations précédentes.
- Vérifications réellement exécutées : pnpm check réussi (lint, TypeScript, **334 tests / 70 fichiers**, build avec avertissement habituel de taille de chunk) ; serveur PocketBase jetable : **6 tests notifications**, **9 tests UX**, **1 test ciblé de réception e-mail** réussis. Migration depuis la version précédente, préservation des notifications et réglages personnalisés, accès privés, concurrence et workflows congés/frais sans alertes couverts. Parenthèses du contrat de mise à jour conservées pour empêcher le contournement via les branches OR ; régression dédiée réussie.
- Navigateur : **1 parcours notifications** réussi après corrections, **2 parcours Account** réussis lors de leur exécution, **3 parcours ciblés layout/sidebar** réussis ; retrait, préférences persistantes, conservation du brouillon profil et largeur réelle 840 → 600 px vérifiés. Captures clair/sombre/mobile et paramètres inspectées, sans débordement constaté. Tests locaux uniquement, aucun envoi Microsoft réel ni recette NAS. git diff --check sans erreur avant livraison.
- Livraison : changements locaux, sans commit/push. Pack unique `/private/tmp/horizon-pocketbase-notifications-recherche-20261017.zip` préparé et contrôlé : **260 fichiers sources / 262 entrées**, manifeste SHA-256 vérifié et migrations antérieures identiques au pack GED. SHA-256 du ZIP : `da923e55b87c129b9e715d762a699d897c29a629b517ed7387b32f25a5058261`. Installation NAS non confirmée ; prochaine action : sauvegarder, installer hooks et migrations ensemble, redémarrer PocketBase, recharger Horizon et effectuer la recette utilisateur. X03/R02 restent En cours ; compteurs inchangés.

### 17 octobre 2026 — Notifications des réponses devis/BC masquées par la policy

- Signalement utilisateur : réponse présente dans le fil du devis mais aucune notification, dernier pack notifications/recherche installé et PocketBase redémarré (installation de 0023/0024 confirmée par l’utilisateur). Audit : alerte créée au bon destinataire, branches Ventes/Achats absentes des règles natives de lecture des notifications ; la régression précédente ne vérifiait que la création via compte technique.
- Correction minimale : nouvelle migration 1791840025 ajoutant l’accès privé aux sources sales_quotes / purchasing_requests / purchasing_orders avec droit de lecture et source existante. Marquage lu/retrait rétablis, métadonnées immuables, création/suppression natives fermées. Alertes déjà créées retrouvées sans reprise des réponses ; préférences respectées et non réinitialisées. Contrats 05/06/08/09 actualisés.
- Vérifications : nouveau contrôle destinataire réel échoué avant correctif (0 notification), puis deux scénarios Messaging réussis après correction (**devis 3,268 s**, **BC fournisseur 3,220 s**) : lecture privée, autre utilisateur exclu, perte des droits, marquage lu, retrait et refus de modification des métadonnées. **6 tests notifications / 21,742 s** réussis sur base jetable incluant upgrade et workflows sans alertes. git diff --check réussi. Aucun code frontend modifié dans ce correctif, aucune nouvelle recette navigateur ou émission Microsoft réelle ; incident NAS non consulté directement.
- Livraison locale sans commit/push : pack unique `/private/tmp/horizon-pocketbase-notifications-reponses-20261017.zip`, **261 fichiers sources / 263 entrées**, manifeste/hachages vérifiés, anciennes migrations identiques au pack précédent. SHA-256 : `f105f9f38773fc0b746e5698f13b0528c303908d1888a3e4534c278cbb6ebbfd`. Nouvelle migration 0025 à installer sur NAS ; cette installation reste non confirmée. Prochaine action : copie hooks/migrations, redémarrage puis contrôle de la cloche sur le devis concerné. Statuts/compteurs inchangés.

### 17 octobre 2026 — Cloche bloquée sur Consultation des notifications

- Retour utilisateur après le correctif précédent : chargement qui reste en cours. Analyse du code : la cloche lit encore la collection via sa règle polymorphe globale ; les branches @collection joignent plusieurs tables métier et le raccord Ventes/Achats augmente ce coût. Les tests précédents sur petit jeu ne couvraient pas le volume ; pas de mesure directe ni consultation de la base NAS dans cette investigation.
- Correction : route Core privée GET notifications/inbox, présélection indexée des seules alertes actives du compte, contrôle de la source réelle avec Activity Read avant projection et compteur, cache par source. Limite de 30 éléments affichés, compteur exact des autorisées dans la borne explicite de 5 000 actives ; dépassement signalé. Marquage lu et retrait utilisent le même contrôle ciblé ; aucune ouverture des règles natives. Timeout frontend de lecture 15 s, erreur avec Réessayer. Aucun changement de schéma ni nouvelle migration ; 0025 conservée intacte. Contrats 05/06/08/09 actualisés.
- Vérifications : pnpm check réussi (lint, TypeScript, **334 tests / 70 fichiers**, build avec avertissement habituel de chunk). **6 tests notifications / 21,498 s** réussis sur nouveaux hooks ; nouveau test ciblé de lecture privée/compteur/marquage/retrait avec **3 000 sources supplémentaires** réussi séparément / **2,445 s** (requête sous 2 s). Premier essai du jeu volumétrique utilisait un nom de colonne incorrect, fixture corrigée avant succès. **Deux tests Messaging ciblés** réussis : devis / 3,338 s et BC / 3,506 s, incluant inbox autorisée et perte des droits. **3 parcours Chromium / 25,1 s** réussis : parcours complet, panne HTTP/réessai et requête bloquée expirant réellement après 15 s. Capture cloche inspectée, parcours clair/sombre/mobile existant réussi ; aucune refonte UI. git diff --check réussi. Pas d’envoi Microsoft réel ni recette NAS.
- Livraison locale sans commit/push : pack unique `/private/tmp/horizon-pocketbase-notifications-chargement-20261017.zip`, **261 fichiers sources / 263 entrées**, manifeste vérifié, toutes les migrations identiques au pack précédent. SHA-256 : `931a7d959b782401868b587d48370b9e429c3b5ee5a24e31456e922ec040d773`. Prochaine action : sauvegarde, remplacement complet des hooks, redémarrage PocketBase pour interrompre les anciennes requêtes et rechargement du frontend à jour utilisant la route ciblée. Installation de ce pack et de 0025 non confirmée explicitement ; statuts/compteurs inchangés.

### 17 octobre 2026 — Réorganisation de l’accueil et de la navigation Paramètres

- Demande utilisateur : clarifier le mélange des rubriques et leur priorité. Accueil recentré sur les réglages disponibles, en six familles dans un ordre identique à la navigation locale : Administration, Ventes et achats, Finance, Ressources humaines, Documents et e-mails, Personnalisation. Panneaux sobres bordés, titres HSectionHeading, liens compacts avec description ; badges Disponible et actions Configurer répétitives retirés. Rubriques non livrées regroupées en À venir replié en bas et retirées de la navigation courante, leurs pages de périmètre restent accessibles.
- Recherche top bar conservée et étendue aux familles, résultats prévus révélés lors d’une recherche, accents/casse ignorés et URL conservée. Accès Mes notifications vers Mon compte existant, sans duplication de formulaire. Pages de réglages, sauvegardes et permissions métier conservées ; accès RH Congés limité toujours respecté. Contrats 04/07/09 actualisés ; aucune évolution de données/backend dans cette intervention.
- Vérifications : pnpm check réussi (lint, TypeScript, **334 tests / 70 fichiers**, build avec avertissement de taille de chunk habituel), puis build/typecheck final réussi après ajustement des valeurs de repli des couleurs en clair. Nouveau parcours Paramètres réussi / **7,0 s** puis de nouveau avec contrôle des contours clairs ; **4 parcours voisins / 31,7 s** réussis (référentiels/combobox, congés complet et direction nécessaires à la préparation, droits RH des paramètres). Captures accueil clair/sombre/mobile inspectées ; cadre blanc et bordure vérifiés automatiquement, pas de débordement. Premier test attendait insuffisamment la connexion ; attente corrigée. Deux premières régressions voisines nécessitaient l’attente du recalcul responsive et les utilisateurs préparés par le parcours Congés ; relance réussie après adaptation du test et inclusion de sa préparation. Des erreurs status 0 apparaissent sur les requêtes interrompues aux changements de compte dans cette recette ; parcours fonctionnels réussis. git diff --check sans erreur.
- Livraison locale sans commit/push. Aucun nouveau pack PocketBase ni redémarrage NAS requis pour cette présentation ; frontend à recharger. Aucune recette utilisateur/NAS annoncée. Prochaine action : validation utilisateur de l’organisation ; statuts/compteurs fonctionnels inchangés.

### 17 octobre 2026 — Paramètres : retour aux tuiles avec pictogrammes

- Retour utilisateur : conserver les icônes/boutons appréciés de la présentation précédente. Les liens en liste de l’accueil sont remplacés par les tuiles blanches bordées, pictogramme dans son carré violet léger, description et accès Configurer/flèche ; trois colonnes desktop, deux en largeur intermédiaire, une sur mobile. Les six familles et leur ordre identique à la navigation sont conservés, ainsi que la recherche top bar, Mes notifications et À venir replié. Aucun changement des pages de configuration ou permissions. Décision durable inscrite dans le contrat UX 07 ; 04/09 actualisés.
- Vérifications : lint et TypeScript réussis, parcours Playwright Paramètres réussi (**1 test / 7,1 s**) : 17 tuiles/pictogrammes et accès Configurer, liens identiques à la navigation, recherche/URL, À venir et accès clavier aux préférences personnelles. Captures clair/sombre/mobile inspectées ; contours, couleurs et absence de débordement vérifiés. git diff --check sans erreur. Pas de nouveau build ni suite complète répétés pour ce changement de présentation ciblé ; aucune recette NAS.
- Livraison locale sans commit/push. Aucun changement PocketBase ni nouveau pack nécessaire. Prochaine action : validation utilisateur des tuiles avec le classement conservé ; statuts/compteurs inchangés.

### 17 octobre 2026 — Préparation de publication Notifications et Paramètres

- Commit/push demandé : changements depuis 371cbcc — préférences personnelles et retrait des notifications, lecture ciblée de la cloche et correctif des réponses devis/BC, migrations 0023/0024/0025, recherche top bar paramétrable et accueil/navigation Paramètres avec tuiles à pictogrammes rétablies. Tous les fichiers en attente relèvent de ces interventions ; aucun pack ZIP, secret, base ni artefact de recette ajouté à Git.
- Validations de chaque lot détaillées ci-dessus : pnpm check (334 tests / 70 fichiers), tests serveur notifications/UX/Messaging et parcours navigateur pertinents réussis ; lint/typecheck et recette Paramètres relancés sur les tuiles finales. Build/typecheck final réussi avant publication avec seul avertissement habituel de taille de chunk. git diff --check sans erreur ; fetch origin effectué, main et origin/main alignés avant commit. Pas de nouvelle suite serveur répétée pour la seule demande de publication.
- Publication en cours ; résultat et hash distant seront consignés après vérification. Installation du dernier pack Notifications/chargement et migration 0025 toujours non confirmée, aucune installation NAS effectuée par l’agent. Statuts/compteurs fonctionnels inchangés.

### 17 octobre 2026 — Publication Notifications et Paramètres confirmée

- Commit **aef2438** (`feat: personnaliser les notifications et organiser les paramètres`) créé et poussé sur **origin/main**. Hash distant vérifié par git ls-remote : `aef2438443a03b84c4cf84e5ea3f812ed024daac`, identique à HEAD ; arbre propre après ce push. Cette confirmation documentaire est publiée séparément.
- Vérifications et périmètre dans l’entrée précédente ; aucun changement de code après validation. Le push publie les sources sans déployer le NAS ; installation du dernier pack Notifications/chargement et migration 0025 toujours non confirmée. Prochaine action : recette utilisateur de la version publiée ; statuts/compteurs fonctionnels inchangés.

### 17 octobre 2026 — Cadrage d’un assistant commun d’import Excel/CSV

- Demande de réflexion, sans autorisation de développement : proposition d’un assistant commun aux modules, choix du type/source, lecture et mapping avec échantillons, profils réutilisables, simulation créations/mises à jour/ignorés/conflits/erreurs, résolution explicite puis application et historique. Périmètre initial conseillé : catalogue produits et tarifs fournisseurs, conforme au premier type d’import métier déjà prévu ; extension Sociétés/Contacts après validation du socle. Organisation exacte et périmètre à confirmer, aucune nouvelle décision d’architecture imposée.
- Vérifications réalisées : lecture des contrats Imports de 03/04/05, examen des dépendances et recherche dans src/hooks/migrations. Le pipeline, core_import_jobs/core_import_rows/core_external_references et le matching produits sont documentés ; aucun assistant ou ces collections implémentés trouvés dans le code/migrations actuels. Aucune dépendance de lecture Excel/CSV présente dans package.json, aucun choix de bibliothèque effectué. Aucun test exécuté pour ce cadrage documentaire, aucune donnée ou schéma modifié.
- Points à cadrer avant réalisation : champs importables par module, types de fichiers et limites, correspondances métier, formats/relations, champs vides et mises à jour, version du mapping et validité de la simulation, reprise transactionnelle par lots et idempotence. Les services propriétaires restent seuls responsables des écritures ; stocks réels, pièces historiques et transitions métier ne se modifient pas par mapping générique. Prévoir le contrat des profils d’import dans 05 et migrations avant implémentation.
- Livraison : note et proposition locales sans commit/push, aucun pack ni installation NAS. Prochaine action : validation utilisateur du parcours et du premier domaine à couvrir ; statuts/compteurs inchangés.

### 17 octobre 2026 — Cadrage complémentaire : source API Odoo dans les imports

- Utilisateur favorable au parcours Excel/CSV et propose une source API Odoo (`https://cvs-sas.odoo.com/doc`). Proposition : même assistant et pipeline de simulation/application, sélection initiale Fichier ou Connexion Odoo, lecture paginée filtrée et échantillon, mapping mémorisé, résolution des relations et références externes stables par instance/modèle/identifiant. Connecteur serveur OdooMigrationProvider en lecture seule, sans synchronisation bidirectionnelle ou dépendance runtime ajoutée ; conforme au contrat 08 existant.
- Vérifications : contrat Migration Odoo et périmètre/nettoyage de 08 relus. Ouverture de /doc de l’instance impossible avec l’outil web ; aucune version, liste de champs ou autorisation réelle de cette instance confirmée. Documentation officielle Odoo trouvée : JSON-2 introduit en 19, documentation dynamique par instance et authentification par clé API ; protocole à choisir après vérification de la version et des accès réels. Aucun appel API authentifié, aucun secret demandé/collecté, aucun test exécuté pour ce cadrage.
- Livraison : complément de proposition et note locale sans implémentation, sans commit/push ni pack NAS. Prochaine action : confirmer la version/API et le premier périmètre (référentiels produits/partenaires/tarifs avant pièces historiques), puis cadrer les profils et migrations avant développement. Statuts/compteurs inchangés.

### 17 octobre 2026 — Pilote R05 Imports Sociétés / Personnes livré localement

- Périmètre validé par l’utilisateur : sociétés et personnes d’abord, autres domaines différés jusqu’à validation UX ; version Odoo 19+ confirmée. Assistant `/contacts/import` depuis Contacts → Importer et Paramètres → Imports, onglets Assistant/Mes imports, frise partagée Source/Correspondance/Vérification/Résultat. CSV avec séparateur/encodage et XLSX avec feuille/en-tête, zéros initiaux conservés dans les cellules texte ; lecture Excel dans worker séparé avec délai de 20 s. Mapping proposé, exemples, profils privés, modes créer/mettre à jour/les deux, cellules vides conservées. Simulation persistée sans mutation Contacts, détail avant/après et corrections, résolution explicite des homonymes/doublons, rapport CSV protégé et confirmation.
- Serveur : module Imports orchestrateur et adaptateur propriétaire Contacts, validations/audit/Activity natifs, application transactionnelle de 25 lignes avec progression durable et reprise idempotente, blocage si données modifiées depuis simulation. Rattachement à une société existante, rôles client/fournisseur et adresse principale. IDs de fichiers isolés par opérateur/source, résolution parent entre fichiers du même opérateur seulement ; IDs Odoo séparés par instance/base/entité. Aucun archivage, photo, écriture de stock/pièce financière ou autre domaine livré.
- Odoo : connexion administrée, clé chiffrée (HORIZON_IMPORT_ENCRYPTION_KEY serveur), sondage de métadonnées avant sauvegarde atomique avec audit et contrôle de concurrence. Lecture JSON-2 de partenaires et codes pays, pagination de 200, filtres nom/date et chargement explicite, aucune méthode d’écriture ; clés jamais exposées/loggées. Le runtime PocketBase n’a pas de paramètre maxRedirects dans $http.send : l’option initialement envisagée a été retirée après vérification du code officiel. Test natif : redirection inter-hôte sans retransmission de clé et réponse hors contrat refusée ; pas de garantie fictive de blocage de toute redirection. Aucun appel authentifié à CVS effectué.
- Contrats 00/02/03/04/05/06/07/08/09 actualisés avant/pendant réalisation ; migration additive **1791840026_contact_imports.js**, collections privées et index, refus de collision de schéma, droit contacts.import accordé aux seuls admins existants. Habilitation exposée dans Utilisateurs et accès, sans accès implicite aux contributeurs/Viewer. Dépendance dédiée `read-excel-file` 9.3.12 (lecture XLSX absente de la stack ; aucun parseur ZIP/XML maison), chargée dans le worker navigateur. R05 passe À faire → En cours ; phase Référentiel 5 En cours / 1 À faire, total **22 En cours / 12 À faire**, clôture complète inchangée **2/46**.
- Vérifications : pnpm check réussi (**338 tests / 72 fichiers**, lint, TypeScript, build) ; façade de service et garde de retour au mapping ensuite vérifiées par lint/typecheck/build, aucun composant n’appelle le repository. **9 tests serveur Imports / 22,121 s** réussis (dont fresh/upgrade/rejeu et isolation des IDs entre opérateurs), **25 tests Contacts / 58,405 s**, **12 tests Access/RH / 30,162 s** réussis. Configuration Odoo atomique rejouée séparément (**1 test / 3,233 s**) et index final d’upgrade (**1 test / 2,485 s**), puis inclus dans les 9 tests finaux. **4 parcours navigateur / 15,3 s** réussis (CSV/correction/historique/rapport, permissions, XLSX/société/personne, Paramètres), puis les **3 parcours Imports / 11,9 s** réussis après façade de service. Captures source/mapping clair, vérification sombre et résultat mobile inspectées ; contraste attendu après stabilisation des tokens UX et absence de débordement vérifiés. Fichiers entièrement fictifs, pas d’import de données réelles ni recette NAS.
- Ajustements de recette : homonyme testé dans une autre source pour distinguer collision de nom et rejeu idempotent ; noms de rôle de fixture et longueur de clé fictive corrigés, bouton Fermer précisé au footer ; scénario de mise à jour remis dans le même namespace que sa personne source, rattachement parent testé dans un autre fichier ; relecture du classeur dans worker confirmée sur code stabilisé après HMR. Avertissement de taille de chunk habituel, sous-dépendances dépréciées annoncées par pnpm et ResourceWarning de fixtures conservés. Les logs status 0 de requêtes interrompues aux changements de page de recette n’ont pas empêché les parcours. git diff --check réussi.
- Livraison : locale sans commit/push. Pack unique `/private/tmp/horizon-pocketbase-imports-contacts-20261017.zip` préparé et vérifié : **266 sources / 268 entrées**, manifeste SHA-256 et intégrité ZIP contrôlés, anciennes migrations identiques au pack Notifications/chargement. SHA-256 ZIP : `3bcefd71acdc2b36c804994d0ff5e8998f48761e4b3a06b6ed74a24f887a9758`. Aucun fichier utilisateur, secret, base ou frontend dans le pack. Installation NAS non effectuée/non confirmée. Prochaine action : sauvegarde, installation hooks/migrations puis redémarrage/rechargement, essai UX utilisateur sur petit CSV/XLSX ; activation et recette réelle Odoo ensuite avec configuration privée de la clé serveur/API.

### 17 octobre 2026 — Retour UX Odoo : exhaustivité et rattachement des contacts

- Investigation demandée après essai utilisateur : chargement manuel de 200 sans total jugé trompeur ; demande d’explication des modes et des liens société/contact. Conseil : compter le périmètre autorisé, charger automatiquement la sélection complète par lots techniques avec progression et empêcher une simulation partielle ; traiter aussi la limite actuelle de 1 000 avant d’annoncer un import exhaustif. Modes à expliciter par leurs effets sur fiches nouvelles/existantes et champs renseignés, sans suppression par cellule vide.
- Vérifications : lecture des contrats README/AGENTS/08, code ImportSource, adaptateur Contacts et connecteur Odoo. Les références externes par instance/base/entité existent déjà dans core_external_references ; parent_id est lu et résolu vers une société déjà importée. Vérification du modèle officiel Odoo 19 res.partner : parent_id est la société liée. Aucun champ id_odoo local supplémentaire nécessaire. Société absente/archivée/ambiguë bloque actuellement la ligne ; pas de réparation automatique après import préalable d’un contact sans rattachement. Conseil : sociétés d’abord, contacts ensuite, et possibilité de relancer une mise à jour ; signaler les parents manquants avant application. Préproduction et production restent des sources distinctes.
- Livraison : investigation et journal locaux, sans modification fonctionnelle, tests non exécutés pour cet échange, aucun nouveau pack/commit/push. L’essai utilisateur implique un connecteur utilisé mais ne confirme pas à lui seul l’installation exhaustive du pack NAS ; recette globale non annoncée. Prochaine action : corriger le chargement complet, rendre les modes explicites et exposer la traçabilité/résolution des rattachements. Statuts et compteurs inchangés.

### 17 octobre 2026 — R05 : chargement Odoo complet et rattachements explicites

- Après validation utilisateur, remplacement du chargement manuel de 200 par une action « Charger toute la sélection » : search_count côté serveur sur le domaine autorisé complet, lecture automatique par curseur, compteur chargées/total et aperçu publié uniquement au succès complet. Erreur intermédiaire, total/source/colonnes changeants, doublons, curseur incohérent ou décompte final incomplet refusent la source, sans poursuite partielle. Limite de 1 000 supprimée pour Odoo et pour la lecture des lignes de staging/DTO ; fichiers CSV/XLSX toujours bornés à 1 000. Capacité JSON 8 Mo conservée, garde client 7,5 Mo des lignes encodées avec demande explicite de réduire la sélection. Pas de snapshot transactionnel distant prétendu.
- Modes expliqués sous le sélecteur et identité Horizon inchangée rappelée. Contacts : nom du parent Odoo conservé avec sa référence, colonne Société de rattachement dans la vérification et erreur de parent manquant identifiée. Références existantes par instance/base/entité réutilisées sans nouvelle colonne id_odoo, sans changement des identifiants natifs ni nouvelle migration. Contact avant société bloqué, puis nouvel import après société rattaché automatiquement. Navigation entre onglets de l’assistant verrouillée pendant lecture/application pour éviter l’abandon d’un état occupé.
- Vérifications : pnpm check réussi (lint, TypeScript, **341 tests / 73 fichiers**, build). **9 tests serveur Imports / 24,218 s** réussis dont comptage JSON numérique, lecture et simulation/DTO exhaustifs de **1 201 lignes**, parent manquant puis société/contact, migrations/permissions/rejeu existants. Premier essai a révélé que response.json ne fournit pas le scalaire numérique attendu dans ce runtime : lecture bornée du body JSON pour search_count corrigée et vérifiée. Fonction de collecte couverte contre interruption, changement de total, page finale incomplète et doublon. **5 parcours Chromium / 15,8 s** réussis, puis **2 parcours Odoo / 8,3 s** rejoués pour captures stabilisées ; clair/sombre inspectés, mobile sans débordement vérifié. Captures comparées à la structure partagée Contacts/Imports conservée, pas de changement global de style. git diff --check réussi. Avertissement de chunk et ResourceWarning de fixtures inchangés ; réponse 503 volontaire du test visible dans les logs.
- Contrats 04/05/06/07/08/09 actualisés. Livraison locale sans commit/push ; pack unique `/private/tmp/horizon-pocketbase-imports-odoo-complet-20261017.zip`, **266 sources / 268 entrées**, SHA-256 `a0e598e29cd3524b6028af538e439515fe692e2d59902872e3ddaac348307f73`. Intégrité ZIP et hashes de chaque source contrôlés ; toutes les migrations identiques au pack pilote, dernière 1791840026. Aucun secret, frontend ou fichier utilisateur dans le pack. Installation NAS de cette correction non effectuée/non confirmée ; pas de connexion authentifiée réelle à Odoo par l’agent. Prochaine action : installer hooks/migrations cohérents, redémarrer/recharger puis recette sur la préproduction utilisateur. Statuts/compteurs inchangés, R05 En cours.

### 17 octobre 2026 — R05 : décisions en colonne Actions, pagination visible et accès Paramètres

- Demande utilisateur : décider sans ouvrir chaque détail, naviguer sur de gros imports et centraliser l’accès dans Paramètres. Colonne Actions : cases Ignorer et Créer (fiche distincte pour conflit), combobox des fiches proposées, loupe de comparaison/correction. Colonne de statut renommée Résultat, décisions retirées du popup ; elles utilisent la résolution serveur existante, restent exclusives et verrouillées après démarrage de l’application. Coche affichée immédiatement pendant la sauvegarde avec blocage des actions concurrentes ; échec affiché et état confirmé restauré. Aucune mutation métier avant confirmation.
- Pagination HListPagination réutilisée en nouveau placement inline dans le titre et en bas de tableau : 25 lignes/page, **600 lignes = 24 pages**, chevrons < >, bornes désactivées et page recalée après filtre/résolution. Placement breadcrumb partagé par défaut inchangé sur les autres listes. Le placement initial par portail expliquait l’absence de pagination visible sur cet écran sans cible active. Résolution sans renavigation inutile pour conserver catégorie/page ; état de case stabilisé pendant appel serveur, correction issue du parcours de recette.
- Accès uniquement **Paramètres → Imports**, route canonique `/settings/imports`, fil d’Ariane Paramètres. Bouton Importer retiré des listes Sociétés/Personnes. Ancienne URL `/contacts/import` redirigée en conservant les paramètres dont job ; service/droits inchangés. Contrats 04/07/09 mis à jour. Pas de modification de schéma ni de hooks serveur dans cette intervention.
- Vérifications : pnpm check réussi (**341 tests / 73 fichiers**, lint, TypeScript, build), puis lint et typecheck/build réexécutés après stabilisation des décisions. **7 parcours Chromium / 24,6 s** réussis sur version finale (CSV, XLSX, permissions, Odoo complet/interruption, Paramètres et nouveau parcours réel de 600 lignes). Test ciblé 600 lignes également réussi **1 parcours / 9,6 s** après correction des cases. Cases réversibles, choix manuel sans popup, pagination haut/bas jusqu’aux lignes 576–600, catégorie vidée, absence d’import dans Contacts et redirection avec job vérifiés. Captures clair/sombre inspectées, densité rapprochée des tableaux Horizon partagés, absence de débordement mobile vérifiée. git diff --check réussi. Premières recettes ont exposé le retour temporaire de coche et une renavigation inutile, corrigés avant les parcours finaux. Warning de taille de chunk et logs status 0 aux changements de page de test inchangés ; 503 volontaire du test Odoo interrompu.
- Livraison locale sans commit/push. **Aucun nouveau pack PocketBase nécessaire pour cet ajustement frontend** ; le pack Odoo complet précédent reste la référence serveur et son installation n’est pas confirmée ici. Pas d’accès NAS ni import de données utilisateur par l’agent. Prochaine action : recharger Horizon et recette utilisateur des actions en ligne ; R05 reste En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — R05 : colonne Actions compacte et hauteur uniforme

- Retour utilisateur sur l’empilement loupe/cases/combobox : remplacement par un seul HCombobox d’action à côté de la loupe, sur une seule rangée sans retour à la ligne. Menu : règle automatique, Ignorer, Créer une fiche distincte si conflit, Utiliser une fiche proposée ; action courante visible. Colonne resserrée, mêmes composants/tokens Horizon, erreurs et état de sauvegarde conservés. Aucun changement de résolution serveur ni de permissions. Contrats 04/07/09 actualisés : la règle de cases distinctes est remplacée par ce sélecteur unique.
- Vérifications : lint, TypeScript et build réussis ; avertissement de taille de chunk habituel. Parcours réel de 600 lignes réussi **1 test Chromium / 10,5 s**, puis **1 test / 10,0 s** après stabilisation des captures et attente de confirmation serveur. Création distincte/règle automatique/ignorance/fiche proposée, absence de popup pour décider, pagination 24 pages et filtre conservés ; hauteur de chacune des 25 lignes affichées contrôlée à **40 px maximum**, absence de cases et de débordement mobile vérifiées. Captures clair/sombre inspectées ; dernières captures sans animations de transition pour éviter les couleurs intermédiaires. git diff --check réussi. Tests serveur non rejoués : serveur inchangé, seul le sélecteur utilise les mêmes valeurs de résolution.
- Livraison : locale sans commit/push ; aucun nouveau pack ni migration PocketBase requis. NAS non modifié. Prochaine action : recharger Horizon et validation visuelle utilisateur ; R05 reste En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — R05 : détail agrandi, navigation des fiches et croix de champ

- Demande utilisateur : tous les champs accessibles, popup plus grand, navigation < > et vidage rapide. Extraction du détail en composant spécifique Imports, HDialog centré jusqu’à 1 200 px dans l’espace hors sidebar, hauteur viewport moins 32 px, corps défilant et en-tête/pied fixes. Tous les champs du contrat affichés, y compris vides et en consultation finale ; valeurs actuelles en texte repliable sans ellipsis. Navigation dans la sélection filtrée, compteur et bornes ; sauvegarde des corrections avant passage à la fiche suivante/précédente, synchronisation avec la page du tableau. Échec conservé sur la fiche avec message dans le pied toujours visible. Fermeture avec corrections protégée : enregistrer ou annuler explicitement via le formulaire, sans perte silencieuse.
- HInput partagé enrichi d’un callback onClear et d’un libellé accessible optionnels ; croix intégrée uniquement sur les champs qui le demandent. ID externe immuable sans croix. Vider la valeur à importer reste une correction de simulation et conserve les données existantes selon le contrat des cellules vides ; aucun effacement métier, aucune nouvelle migration ni modification serveur. Contrats 04/07/09 actualisés.
- Vérifications : lint, TypeScript et build réussis, warning de chunk habituel. Parcours CSV/correction/historique, permissions, XLSX/rattachement et Odoo complet/interruption réussis lors de la suite navigateur (5 parcours), puis parcours 600 lignes/détail ciblé réussi **1 test / 11,0 s** et version finale **1 test / 11,2 s**. Vérifie 17 champs Sociétés, largeur desktop, champ Pays atteint par scroll, croix e-mail et réouverture de la valeur vidée après navigation, ID protégé, fermeture avec erreur visible, passage 25 → 26 → 25 entre pages, bornes à 600, clair/sombre et dernier champ sur mobile. Captures inspectées, git diff --check réussi. Une assertion de recette initiale attendait 20 champs au lieu des 17 prévus au contrat, corrigée ; une compilation concurrente a rechargé Vite en plein test (confirmé par trace), le parcours final a été rejoué après compilation, sans faux correctif métier. Les compilations et recettes Vite doivent désormais rester séquentielles.
- Livraison locale sans commit/push, aucun nouveau pack PocketBase requis. NAS non modifié, aucune donnée utilisateur importée par l’agent. Prochaine action : recharger Horizon et recette utilisateur du détail ; R05 reste En cours, statuts/compteurs inchangés.
- Complément de vérification après arrêt de la recette navigateur : **pnpm test, 341 tests / 73 fichiers réussis**.

### 17 octobre 2026 — R05 : problèmes en fiche, images, actions groupées et suppression des préparations

- Périmètre utilisateur entièrement repris : bloc Problème à résoudre dans la fiche, motif complet et correspondances proposées ; ImportDecision extrait et partagé entre fiche et tableau, résolution possible dans la fiche en sauvegardant aussi les corrections éventuelles. Loupe déplacée dans une colonne Voir finale centrée. Actions Tout ignorer/Tout en automatique avec compteur dans chaque catégorie, sur toutes les pages, réévaluation serveur unique en transaction ; la règle auto conserve les conflits/erreurs réels, aucune validation forcée ni 600 requêtes individuelles.
- Entretien : corbeille en action de préparation et dans Mes imports, confirmation et erreur visibles. Route discard privée au propriétaire habilité ; supprime job/lignes de staging uniquement en preview/blocked sans début d’application ni ligne appliquée. Imports appliqués/partiels, Contacts et références externes conservés. Audit minimal de la suppression sans contenu importé. Aucun changement de schéma, nouvelles routes resolve-bulk/discard, migrations historiques inchangées.
- Images : image_base64 mappable dans les sources CSV/XLSX et la lecture Odoo ; image_256 si exposée (image_128 en repli), contrat officiel Odoo vérifié dans image_mixin.py. Miniature/loupe HFileThumbnail commune dans source/mapping/fiche, pas d’affichage du bloc base64 comme champ texte. Adaptateur Contacts valide base64 et signatures raster PNG/JPEG/WebP (200 000 caractères/image), convertit vers logo/avatar natifs protégés uniquement à confirmation. Empreinte de l’image existante dans le snapshot et comparaison des octets : réimport identique ignoré sans nouveau fichier. Garde globale JSON 8 Mo maintenue ; dépassements/refus de format explicites. Les anciennes préparations sans image nécessitent une relecture source ; anciennes simulations de mises à jour pouvant être bloquées par l’évolution du snapshot doivent être revérifiées, aucun contournement des empreintes.
- Contrats 04/05/06/07/08/09 actualisés. Vérifications : pnpm check réussi (**342 tests / 74 fichiers**, lint, TypeScript et build) puis lint/typecheck finaux réussis. **11 tests serveur Imports / 28,250 s** réussis : bulk par catégorie/toutes pages/retour auto, accès privé et retrait de droits, suppression sans écriture métier, refus des imports complétés/partiels et préservation des références ; images PNG/data URL vers logo/photo protégés, idempotence, format invalide, image Odoo simulée ; tests existants d’import/upgrade maintenus. **8 parcours Chromium / 28,8 s** réussis : anciens parcours, 600 lignes/navigation/détail, résolution dans la fiche avec problème et image décodée (naturalWidth vérifié), groupement sur 60 lignes/3 pages et suppression depuis Mes imports. Captures clair/sombre et problème/image inspectées ; mobile sans débordement couvert par le parcours 600 lignes. git diff --check réussi. Avertissement de taille de chunk habituel et ResourceWarnings de fixtures inchangés ; 503 volontaire et 404 après suppression du scénario visibles dans les logs.
- Livraison locale sans commit/push. Pack unique `/private/tmp/horizon-pocketbase-imports-controles-images-20261017.zip` : **267 sources / 269 entrées**, SHA-256 `1c0743d181e274a447819e35dc07ed0f88b20f482d51f4d73f4679f016c688c7`, intégrité ZIP/manifeste et chaque hash contrôlés ; toutes les migrations identiques au pack Odoo complet, dernière **1791840026**. Aucun frontend, secret, base ni fichier utilisateur dans le pack. Installation NAS de ce lot non effectuée/non confirmée ; aucun appel Odoo authentifié réel par l’agent. Prochaine action : sauvegarde, installation des hooks/migrations cohérents, redémarrage/rechargement, puis relecture Odoo et nouvelle simulation pour les images. R05 reste En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — R05 : audit des images manquantes et diagnostic de lecture Odoo

- Retour utilisateur : quasi toutes les sociétés ont un logo dans Odoo mais la préparation Horizon indique Aucune image à importer. Reconnaissance de la limite de recette précédente : un pixel fictif et un simulateur ne prouvaient ni la lecture des images CVS ni leur visibilité réelle. L’agent ne dispose pas de la session authentifiée Odoo/PocketBase du navigateur utilisateur ; aucune cause réelle sur cette connexion annoncée comme confirmée. Analyse du code officiel res.partner/avatar.mixin : distinction photos image_* enregistrées et avatars générés (SVG possible), pas d’assimilation d’un avatar automatique à une photo.
- Lacunes corrigées : demande explicite context bin_size=false pour recevoir le contenu binaire ; choix parmi image_256/image_128/image_512/image_1024/image_1920 exposés par métadonnées, relecture limitée aux IDs dont le champ principal est vide, essais des tailles alternatives. Base64 avec retours de ligne normalisé. Contrôles de taille/type, données privées et méthodes en allowlist conservés ; aucun accès ir.attachment arbitraire ni secret exposé.
- Diagnostic : champs d’image vérifiés renvoyés dans le DTO source, compteurs reçues/reconnues sur toute la sélection, message distinct pour serveur ancien sans diagnostic, aucun champ accessible, zéro photo reçue ou format non reconnu. mapped_fields dérivé du mapping existant dans le DTO job ; fiche distingue une préparation sans association Image d’une image réellement vide. Aucun nouveau champ/migration ; métadonnées frontend de diagnostic exclues explicitement du payload preview. Fixture raster colorée 64×64 remplace le pixel blanc pour la recette de visibilité ; aucune donnée CVS utilisée.
- Vérifications : pnpm check réussi (lint, TypeScript, **342 tests / 74 fichiers**, build), puis lint/tests unitaires rejoués après ajout du cas de base64 avec retours et lint/typecheck finaux. **11 tests serveur / 29,493 s** réussis, dont image principale vide/original renseigné, repli ciblé, contexte binaire, images protégées/idempotence et ancien périmètre. Le premier simulateur large interprétait le domaine id in de la relecture comme un curseur ; fixture ajustée aux deux types de requête. **7 parcours navigateur réussis** dans la suite Imports, puis **2 parcours ciblés / 13,1 s** réussis (600 lignes et diagnostic image). L’attente de chaque page a été explicitée dans la boucle de recette après une rafale de clics ne laissant pas l’affichage se stabiliser ; pas de modification métier de pagination. Logo coloré décodé (largeur naturelle 64), compteur 1/2 et champs vérifiés visibles ; captures inspectées, parcours clair/sombre/mobile existant maintenu. git diff --check réussi ; chunk warning habituel conservé. Aucun test authentifié de l’instance utilisateur.
- Contrats 04/05/06/07/08/09 mis à jour. Livraison locale sans commit/push. Pack `/private/tmp/horizon-pocketbase-imports-diagnostic-images-20261017.zip`, **267 sources / 269 entrées**, SHA-256 `ae9b1428137b7bbb8dde0cd679ac6178b11ee953e1a17314cc17752d9907d3be` ; intégrité ZIP, manifeste et hashes vérifiés, toutes migrations identiques au pack Contrôles/images (dernière 1791840026). Aucun secret, base, fichier utilisateur ou frontend inclus. NAS non installé/non confirmé. Prochaine action nécessaire pour confirmer le cas utilisateur : installer ce pack cohérent, relire Odoo et consulter le nombre d’images reçues/champs détectés ; ne pas annoncer les photos réelles réparées avant cette vérification. R05 En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — R05 : image en troisième colonne et miniature compacte

- Demande utilisateur : image trop haute, troisième colonne et augmentation minime de la hauteur des lignes. Mode compact local d’ImportImage utilisant toujours HFileThumbnail/aperçu partagé : bouton 28×28 px, image 24×24 object-fit contain, nom et pictogramme superposé masqués dans les tableaux. Colonne Image troisième et centrée, largeur 52 px, dans aperçu source et vérification ; exemples du mapping également compacts. Aperçu plus grand du détail conservé. Ordre des colonnes source uniquement visuel, indices et correspondances du fichier inchangés ; aucun traitement d’image ni changement serveur.
- Vérifications : lint, TypeScript et build réussis ; warning de taille de chunk habituel. **2 parcours Chromium / 8,2 s** réussis (problème/image/bulk/suppression et source Odoo), puis source complétée et rejouée **1 parcours / 5,8 s** : troisième colonne, lignes ≤40 px, différence de hauteur avec/sans image ≤4 px, aperçu au clic, indice de mapping original préservé, thème sombre/mobile sans débordement et image de 24 px. Captures source claire et sombre/mobile inspectées ; tests sur fixtures, aucun nouvel accès Odoo réel. git diff --check réussi. Contrats 04/07/09 actualisés.
- Livraison locale sans commit/push ; aucun pack/migration PocketBase supplémentaire nécessaire. Pack Diagnostic images précédent inchangé, installation NAS non confirmée. Prochaine action : recharger Horizon pour recette de densité ; R05 reste En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — R05 : résolution individuelle sans recalcul complet

- Retour utilisateur : Ignorer un problème prend environ 10 secondes. Cause confirmée dans le code : chaque résolution rechargeait toutes les lignes et images, recalculait tous les matchs/snapshots Contacts (dont lecture/empreinte des fichiers), sauvegardait chaque ligne et renvoyait le job complet. Extraction du contrôle unitaire commun ; résolution ciblée sur la ligne et les doublons affectés. Parcours des seules identités compactes en SQL pour conserver l’ordre et les chaînes de doublons ; réévaluation métier des doublons libérés uniquement, compatible avec les préparations existantes. Compteurs agrégés SQL, lignes indépendantes inchangées. Le précontrôle complet à confirmation et les contrôles par lot/ligne restent obligatoires.
- Réponse partielle demandée par le frontend via `X-Horizon-Import-Response: changes`, fusion par identifiant dans le cache : ordre, lignes, images, pagination et filtres conservés. Réponse complète maintenue pour les anciens clients ; nouveau client également compatible avec ancien serveur. Les décisions groupées restent une réévaluation complète unique. Aucun changement de schéma, permission, mise en page ou donnée Contacts. Contrats 04/05/09 actualisés.
- Vérifications : pnpm check réussi (lint, TypeScript, **344 tests / 75 fichiers**, build), puis lint/typecheck/build finaux après ajout de la négociation compatible ; lint final après assertion navigateur réussi. **13 tests serveur / 37,753 s** réussis, dont 600 lignes, chaînes de doublons ignorées/réactivées/corrigées, ambiguïté réelle restaurée, enregistrement indépendant strictement identique, réponses anciennes/nouvelles et précondition concurrente toujours bloquante. Mesure locale finale : **13 ms, 914 octets, deux lignes affectées sur 600** ; fixture sans représentativité de la latence NAS ni de toutes les photos CVS. **8 parcours Chromium / 29,2 s** réussis avant ajout de la négociation, puis **2 parcours ciblés / 14,0 s** finaux avec assertion réelle de l’en-tête/réponse partielle, pagination 24 pages, détail, images, actions groupées, suppression ; parcours existant clair/sombre/mobile conservé. Aucun nouveau style ni comparaison visuelle manuelle interpages dans ce correctif. git diff --check réussi. Avertissement de chunk habituel, ResourceWarnings des fixtures et 404 attendu après suppression conservés.
- Livraison locale sans commit/push. Pack unique `/private/tmp/horizon-pocketbase-imports-decisions-rapides-20261017.zip` : **267 sources / 269 entrées**, SHA-256 `d0dfd84f38eac8d4e3611331f6e61480ec33a12eaa711dd05f050b6a6897b0a9`. Intégrité ZIP/manifeste et chaque hash contrôlés ; seul `pb_hooks/lib/imports.js` diffère du pack Diagnostic images, toutes migrations identiques (dernière 1791840026). Installation NAS non effectuée/non confirmée. Prochaine action : sauvegarder, remplacer les hooks cohérents, redémarrer PocketBase et recharger Horizon, puis confirmer la latence sur le NAS ; préparations existantes réutilisables sans relecture Odoo. R05 reste En cours, statuts et compteurs inchangés.

### 17 octobre 2026 — R05 : refus natif d’e-mail à l’application et erreur exploitable

- Retour utilisateur : POST apply 400 avec message anglais générique. JSON communiqué confirme `data.email.code = validation_is_email` ; aucun accès à l’e-mail source réel ou au NAS par l’agent. Reproduction exacte locale avec e-mail fictif `foo@bar..fr` et URL contenant des espaces : ancien contrôle regex trop permissif, simulation acceptée puis refus natif à la sauvegarde. Normalisation désormais alignée sur les validateurs des champs Email/URL des collections Contacts réelles, sans écriture ni hooks de sauvegarde pendant la simulation. Aucune suppression, découpe ou correction automatique de valeur.
- Application : attribution des refus à la ligne ; message français contenant numéro et noms de champs en allowlist. Après rollback du lot, préparation preview : erreur persistée sur la ligne et compteurs recalculés, correction/ignorance possible puis application. Import déjà applying : blocage avec consigne de nouvelle simulation, lots déjà appliqués/références externes conservés. Contrôles concurrents et atomicité maintenus ; refus techniques non déclassés en erreurs de données. Logs job/ligne/statut sans contenu d’e-mail ni secret. Frontend reconnaît également data.email/data.website d’un ancien serveur, sans afficher son message générique anglais. Contrats 04/05/06/09 actualisés ; aucun schéma/migration ni style modifié.
- Vérifications : pnpm check réussi (lint, TypeScript, **345 tests / 76 fichiers**, build), puis lint/typecheck après mise à jour de la recette CSV. **15 tests serveur / 42,990 s réussis** : email et URL refusés en simulation, sociétés/personnes, correction, ancien staging ligne 2 récupérable, atomicité fiches/références, partiel 25/30 bloqué ligne 27 puis réimport à 30/30 sans doublon, anciens contrôles d’accès/idempotence/images et lecture Odoo 1 201 lignes. Contrôle partiel également ciblé réussi 1 test / 3,209 s. Mesure de non-régression Ignorer : 13 ms sur 600 lignes localement. Première tentative de validation native du record entier a dépassé les 5 s de la fixture large ; remplacement par les seuls validateurs Email/URL concernés, suite complète repassée sans relever le délai de test. **8 parcours Chromium / 29,2 s réussis** avec e-mail ambigu détecté en fiche puis corrigé et importé, pagination/patchs 600 lignes, images, permissions, Odoo, clair/sombre/mobile existants. Aucune nouvelle comparaison manuelle interpages, aucun style changé. git diff --check réussi ; avertissement de chunk habituel, ResourceWarnings et réponses de test volontaires (503/404), status 0 aux navigations conservés.
- Livraison locale sans commit/push. Pack `/private/tmp/horizon-pocketbase-imports-validation-email-20261017.zip` : **267 sources / 269 entrées**, SHA-256 `375de71f4f3c9f97d1af726a6237e3a6b77c22fae78e2193318ab10b2014c862`. Intégrité ZIP/manifeste et hashes vérifiés ; seuls `pb_hooks/lib/contacts-import.js` et `pb_hooks/lib/imports.js` diffèrent du pack Décisions rapides, migrations strictement inchangées (dernière 1791840026). Aucun secret, base ni frontend dans le pack. NAS non installé/non confirmé. Prochaine action : installer/redémarrer/recharger, relancer la préparation actuelle pour identifier sa première ligne refusée (ou nouvelle simulation si déjà partielle) ; recette sur données utilisateur non effectuée. R05 reste En cours, statuts/compteurs inchangés.

### 17 octobre 2026 — R05 : diagnostic 409 et reprise des lignes restantes

- Retour utilisateur : préparation déjà enregistrée, refus 409 après début d’import. Audit local : message ne distinguait pas action/cible/snapshot et bloquait sans parcours de récupération. Test de mise à jour de 30 sociétés avec photos/rôles/adresses réussi sur deux lots, sans faux conflit reproduit dans ce cas. Reproduction pertinente : les 25 premières créations rendent un homonyme trouvable pour la ligne 26, dont l’action passe de create à conflict au précontrôle suivant. Ce mécanisme est confirmé localement mais la cause exacte du job NAS utilisateur n’est pas inspectée ; aucun contournement d’empreinte ni conclusion sur une modification externe réelle.
- Diagnostic : helper de comparaison action/cible/snapshot, ligne et noms de champs autorisés (pas de valeurs), distinction d’une empreinte ancienne sans inventer des changements de données. Motif conservé dans le job bloqué ; logs job/ligne/raison/champs sans e-mail. Contrôles de concurrence et transactions maintenus.
- Récupération : bouton HButton partagé Revérifier la préparation dans la barre existante. Route recheck privée au propriétaire habilité, source preview/blocked seulement, garde des corps en allowlist et aucune écriture Contacts/Odoo. Avant tout début : même préparation revérifiée. Après import partiel : nouvelle préparation Reprise des seules lignes non appliquées, numéros d’origine, source_key, namespace/mode/mapping, corrections/résolutions conservés ; original/appliqués/références inchangés. Clé serveur déterministe recheck-<source_job_id> et unicité privée pour idempotence, audit de filiation minimal. Nouvelle confirmation obligatoire après résolution des ambiguïtés. Aucun schéma/migration ajouté ; contrats 04/05/06/07/09 actualisés. R05 reste En cours, compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, **347 tests / 77 fichiers**, build), puis lint/typecheck après ajout du parcours navigateur. **17 tests serveur / 48,462 s** réussis : anciennes garanties, revérification avec choix conservés, contrôle concurrent, import partiel 25+5, ambiguïté ligne 26, corrections/ignorance conservées, source et données métier strictement inchangées pendant recheck, idempotence, permissions/propriété/révocation, refus applying/completed, confirmation explicite et total 29 fiches pour 30 lignes dont une ignorée. Deux nouveaux tests ciblés également réussis / 5,584 s. Ignorer sur 600 lignes : 14 ms localement, mesure non représentative du NAS. **9 parcours Chromium / 31,1 s** réussis ; nouveau parcours ciblé d’abord réussi / 7,2 s. Reprise sans relecture du fichier, cinq lignes restantes, choix conservés, confirmation puis contrôle de l’ancien historique à 25 appliquées, clair/sombre et mobile couverts. Captures nouvelle barre/message clair et reprise sombre inspectées, réutilisation des boutons/composants Horizon vérifiée ; aucune modification CSS. git diff --check réussi. Avertissement de chunk et réponses volontaires 503/404 des scénarios conservés.
- Livraison locale sans commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-imports-reprise-409-20261017.zip` : **268 sources / 270 entrées**, SHA-256 `134c4c829f6017e55e301e4ff9c476e785ad19675bbd3e406e3f8181ab56c605`. Intégrité ZIP/manifeste/hashes vérifiés ; seuls imports.pb.js/imports.js et nouveau import-comparison.js diffèrent du pack Validation e-mail, toutes migrations identiques (dernière 1791840026). Aucun secret, base, fichier utilisateur ou frontend inclus. NAS non installé/non confirmé. Prochaine action : sauvegarder, installer les hooks/migrations cohérents, redémarrer/recharger puis Revérifier la préparation sur le job bloqué existant ; contrôler et confirmer uniquement les lignes restantes. Motif exact et recette sur données utilisateur à confirmer sur NAS.

### 17 octobre 2026 — R05 : prévenir les correspondances modifiées par le lot lui-même, cas ligne 614

- Retour utilisateur : Ligne 614, correspondances changées pendant l’application après import partiel. Cause possible confirmée par reproduction exacte locale : créations homonymes à e-mails distincts non détectées dans le scan initial ; le premier enregistrement rend son nom trouvable et le suivant passe de create à conflict dans le même lot. Le correctif précédent ajoutait une reprise mais ne prévenait pas ce cas dans la préparation. Aucun accès au contenu réel de la ligne NAS 614 ; ne pas présenter ce contenu comme inspecté.
- Prévention : contrôle des futurs noms dans l’ordre du fichier, y compris noms issus des mises à jour précédentes. Homonymes de sociétés ou personnes de mêmes prénom/nom dans la même société signalés avant application même avec des e-mails distincts ; décision explicite Créer une fiche distincte ou Ignorer. Doublons forts prioritaires et non contournables ; aucune fusion sur le nom ni relaxation des empreintes. Société conservée dans before prise en compte pour l’identité e-mail d’une personne mise à jour sans société fournie.
- Résolutions rapides : normalized_data.base conserve seulement action/motif/candidats avant surcouche de doublon, sans copie des images/snapshots. Restauration locale du plan des lignes libérées ; mise à jour du scan compact (identités/noms) uniquement, pas de nouvelle lecture Contacts pour les lignes indépendantes. Compatibilité des anciens doublons sans base par recontrôle ciblé. Aucune nouvelle collection ni migration, aucune modification de style/frontend de production ; contrats 04/05/06/09 actualisés. R05 reste En cours, statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, **348 tests / 78 fichiers**, build). **21 tests serveur / 62,713 s réussis** : fixture de 640 sociétés, avertissement à 614 avant écriture, ignore/correction de 613 libérant 614 et retour auto rétablissant le conflit, simulation d’ancien staging appliquant 600 lignes puis refus intra-lot à 614 avec rollback du lot 601–625, reprise de 40 et résolution explicite jusqu’à 640 fiches/références sans doublon ; personnes contextualisées par société, société conservée pour e-mail, refus de contourner les doublons forts, anciennes garanties. Deux cas ciblés 614/personnes également réussis / 11,962 s ; anciens doublons incrémentaux ciblés réussis / 5,488 s. Une première suite a échoué sur la fixture « ancien scan » car le nouveau contrôle réparait déjà son avertissement lors des corrections ; ancienne préparation désormais simulée après les corrections, sans modifier le contrôle métier pour satisfaire le test. Mesure Ignorer sur 600 lignes : **18 ms, 914 octets / deux lignes changées** localement. **10 parcours Chromium / 33,0 s réussis**, dont nouvel homonyme intra-lot détecté avant confirmation puis 30 créations sans arrêt et protection d’un vrai changement concurrent après 25 lignes ; pagination 600, photos, permissions et autres parcours maintenus. Clair/sombre/mobile des scénarios existants couverts, aucun nouveau style ni comparaison manuelle interpages dans ce correctif. git diff --check réussi. Chunk warning habituel, ResourceWarnings et erreurs de scénarios volontaires 503/404/status 0 aux navigations inchangés.
- Livraison locale sans commit/push. Pack `/private/tmp/horizon-pocketbase-imports-homonymes-20261017.zip` : **268 sources / 270 entrées**, SHA-256 `b596f4a19899ca670faf17b7c2c09d0fb9642f8d0798ce606081cbf081968a2d`. Intégrité ZIP/manifeste/hashes contrôlés ; seul pb_hooks/lib/imports.js diffère du pack Reprise 409, toutes migrations strictement identiques (dernière 1791840026). Aucun secret, base, fichier utilisateur ou frontend inclus. Installation NAS non effectuée/non confirmée. Prochaine action : installer/redémarrer/recharger, Revérifier sur la préparation actuellement bloquée, résoudre les homonymes signalés puis confirmer les lignes restantes. Recette et cause exacte des données utilisateur à confirmer sur NAS.

### 18 octobre 2026 — R05 : retirer les imports non terminés, y compris partiels

- Retour utilisateur et capture Mes imports : colonne Actions vide sur les anciens imports À vérifier/À poursuivre ayant déjà des lignes appliquées. Cause : corbeille et route discard limitées aux préparations sans début d’application. Corbeille partagée désormais disponible sur preview/blocked/applying dans l’historique et sur la fiche, sans changement de tableau/CSS ; confirmation HDialog précise le retrait de la liste, l’arrêt des lignes restantes et la conservation des fiches/historique déjà importés. Imports terminés protégés.
- Serveur : avant tout début, suppression du seul staging inutilisé comme auparavant. Après started_at ou toute ligne applied, transition cancelled et archivage par archived_at, sans suppression du job, des lignes, fiches Contacts, fichiers ou références externes ; historique courant filtré côté serveur. Retrait privé, transactionnel, audité et idempotent. Application/reprise/correction refusées après retrait ; le catch de conflit ne réactive plus les jobs archivés. Une continuation depuis un autre onglet ne peut pas exécuter le lot suivant après annulation ; aucun retrait en cascade des préparations de reprise distinctes.
- Contrat de données mis à jour avant schéma, migration additive `1791840027_import_job_archive.js` : archived_at et index propriétaire/archive/date, API Rules inchangées, anciens imports conservés non archivés. Contrats 04/05/06/07/09 actualisés. R05 reste En cours, statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint, TypeScript, **348 tests / 78 fichiers**, build), puis lint/typecheck après ajout du scénario navigateur. **23 tests serveur / 114,305 s réussis**, dont applying et blocked à 25/30, retrait répété sans nouvel audit ni date modifiée, égalité des lignes/fiches/références avant/après, disparition de l’historique, refus de continuation/recheck/correction sans réactivation, droits/propriété et completed toujours visible/protégé. Migration 0026→0027 et relecture répétée testées avec job partiel et ligne applied conservés ; reconstruction neuve couverte par chaque fixture. Deux nouveaux tests ciblés réussis / 9,690 s. Mesure locale Ignorer 600 lignes : 30 ms, deux lignes/914 octets, sans engagement NAS. **11 parcours Chromium / 53,6 s réussis**, dont corbeilles des trois états non terminés, absence sur Terminé, confirmation/annulation/retrait, arrêt des continuations, reload, 52 sociétés inchangées, clair/sombre/mobile sans débordement. Captures historique clair/sombre inspectées : mêmes boutons/tableau Horizon et pictogrammes centrés. git diff --check réussi. Warning de chunk habituel, ResourceWarnings et réponses volontaires 503/404/status 0 lors des navigations conservés.
- Livraison locale sans commit/push. Pack `/private/tmp/horizon-pocketbase-imports-retrait-20261018.zip` : **269 sources / 271 entrées**, SHA-256 `60cb66da521d8cb2ecbe3fcdfeba73e7e007ea3efc5f5eac8e99788f2cc01267`. Intégrité ZIP/manifeste/hashes vérifiés ; seuls imports.js et nouvelle migration 1791840027 diffèrent du pack Homonymes, toutes migrations antérieures strictement identiques. Aucun secret, base, fichier utilisateur ou frontend inclus. NAS non installé/non confirmé. Prochaine action : sauvegarde, installation hooks/migrations cohérents, redémarrage avec migration additive puis rechargement Horizon et retrait utilisateur des anciennes lignes devenues inutiles ; aucune fiche utilisateur retirée par l’agent.

### 18 octobre 2026 — R05 : investigation des rattachements de contacts à Métropole Télévision

- Retour utilisateur : contacts présents mais non visibles comme associés à Métropole Télévision, alors que Pilote Films fonctionne. Confirmation utilisateur puis capture : six contacts marqués Créée avec société affichée et référence Odoo 2313, deux pour Pilote Films référence 2339 ; huit créations et aucun update. Hypothèses société absente de la préparation et simple ligne ignorée non retenues pour les lignes montrées. Audit du flux Odoo parent_id → company_external_id → core_external_references → data.company → sauvegarde native : un ID de société fourni et introuvable provoque une erreur, aucun rattachement vide silencieux prévu dans ce chemin. Code officiel Odoo 19 consulté pour distinguer parent_id et commercial_partner_id ; aucune évolution du connecteur décidée sur cette seule hypothèse.
- Ajout d’un test d’intégration ciblé fictif : deux sociétés sources IDs 2313/2339, six et deux contacts, plus une société homonyme supplémentaire. Référence externe prioritaire respectée ; les huit contacts sont réellement enregistrés avec leur société, requêtes d’annuaire par ID retournent 6/2/0. Le cas d’une fiche de société homonyme consultée produit bien une liste vide sans perte du lien vers l’autre fiche. Ce résultat local ne prouve pas que c’est la cause NAS ; association réelle des contacts utilisateur et éventuels homonymes non inspectés. Pas d’accès à la session authentifiée ou aux données NAS de l’utilisateur.
- Vérifications : test serveur ciblé **1 test / 2,546 s réussi**, git diff --check réussi. Aucune modification de code de production, schéma, permission, style ou donnée utilisateur ; pas de nouvelle compilation globale ni recette navigateur pour cette investigation. Le scénario d’import déjà passé reste distinct d’un contrôle des enregistrements réels de l’utilisateur.
- Livraison : test/journal locaux sans commit/push, aucun nouveau pack ni migration, aucun changement NAS. Informations demandées : URL de la société consultée et d’un contact concerné pour identifier les fiches ; besoin de vérifier le champ Société réellement enregistré sur le contact pour distinguer lien vide, lien vers une autre fiche/homonyme et défaut d’affichage. Prochaine action : confronter ces identifiants/données au rattachement attendu puis corriger la cause confirmée, sans rapprochement arbitraire sur le nom ou le domaine e-mail. R05 reste En cours, statuts/compteurs inchangés.

### 18 octobre 2026 — Contacts R01 : cadrage de la fusion des doublons

- L’utilisateur identifie deux sociétés distinctes dans Horizon : M6 avec METROPOLE TELEVISION en raison sociale, et MÉTROPOLE TÉLÉVISION en nom. Il demande de prévoir une option de fusion. Parcours consigné dans le contrat fonctionnel Contacts : action de fiche, sélection de la fiche conservée, comparaison des champs, aperçu des dépendances et confirmation ; sociétés et personnes séparées. Aucune conclusion automatique sur l’identité juridique à partir du seul nom.
- Inspection : service/répertoire Contacts, hooks de validation et de suppression, recherche des contrats existants. La suppression refuse déjà les relations entrantes ; une fusion ne peut donc pas se limiter à supprimer le doublon. Le cadrage impose des références Odoo résolues vers la cible, une source archivée traçable, des documents historiques immuables et des adaptations par module propriétaire. Comptes tiers et identifiants juridiques incompatibles nécessitent un traitement explicite. Aucun enregistrement réel utilisateur inspecté ou modifié.
- Vérifications : relecture du contrat et git diff --check ; aucun code applicatif, schéma ou permission modifié, donc aucun test applicatif ou parcours navigateur exécuté pour ce cadrage. Implémentation, modèle de données, migrations et recette restent à faire ; le bouton Fusionner n’est pas livré.
- Livraison documentaire locale sans commit/push ni nouveau pack ; aucune installation NAS. Travaux actifs complétés, R01 reste À vérifier et R05 En cours, compteurs inchangés. Prochaine action : implémenter le service de fusion et ses adaptateurs, puis le parcours de comparaison/confirmation, sans fusionner automatiquement M6 et Métropole Télévision.

### 18 octobre 2026 — Contacts R01 : livraison locale de Fusionner avec…

- Demande d’implémentation après le cadrage : action dans la roue des fiches sociétés/personnes actives sans modifications locales, habilitation dédiée, sélection recherchable de la seconde fiche, sens inversable, comparaison avec radios par champ et aperçu du logo/avatar protégé, complétion des champs vides et valeurs de la cible prioritaires. Confirmation explicite, erreurs et rechargement de l’aperçu ; dialogue/tableau/boutons/sections Horizon partagés. Source consultable depuis la cible et lien inverse, roue masquée sur source fusionnée ; fil historique conservé sur sa fiche.
- Serveur Contacts : aperçu sans écriture ; empreinte canonique des deux fiches, personnes/adresses/rôles et références, recontrôle transactionnel, choix en allowlist, union des rôles, déplacement des personnes/adresses sans changer leurs IDs, principales de la cible prioritaires par usage. Copie de l’image choisie par le filesystem protégé ; anciennes valeurs/fichiers source conservés. Source archivée avec merged_into/merged_at, verrouillée en modification/réactivation/suppression ; nouvelles relations ou liens polymorphiques métier refusés. Identifiants juridiques incompatibles, y compris SIREN déduit d’un SIRET, et chaînes de fusions refusés. Audit et événements du fil, rejeu sans effet supplémentaire. L’empreinte initiale dépendait de l’ordre des clés des exports PocketBase ; sérialisation canonique ajoutée après détection par les tests avant livraison.
- Frontière du premier lot explicitée dans le contrat 04 : le doublon source ne doit porter aucune dépendance métier intermodule, ni directement ni via une personne/adresse déplacée ; garder comme destination la fiche déjà utilisée. Comptes tiers, documents, tâches et mails ne sont jamais réécrits. La fusion de deux historiques métier reste bloquée et nécessite des adaptateurs propriétaires ultérieurs ; aucun compteur ne prétend les agréger. Détection des dépendances sans exposition de leur contenu. Adaptateur propriétaire Imports pour rediriger les références externes tout en conservant les rapports historiques ; aliases exclus du matching actif. Aucun accès/écriture Odoo ou donnée utilisateur réelle.
- Contrat de données mis à jour avant schéma. Migration additive 1791840028_contact_merge.js : relations sans cascade et dates de fusion, indexes merged_into et référence Horizon, attribution contacts.merge aux rôles des administrateurs existants. Droit délégable dans Utilisateurs et accès, avec read/write obligatoires et viewer interdit côté serveur. Contrats 04/05/06/07/08/09 et travaux actifs mis à jour ; R01 reste À vérifier, R05 En cours, statuts/compteurs inchangés.
- Vérifications finales : pnpm check réussi (lint, TypeScript, **350 tests / 78 fichiers**, build). **8 tests serveur fusion / 20,508 s réussis**, incluant upgrade réel 0027→0028 avec sociétés/personnes et rôle admin préexistants conservés, deuxième passage migration sans effet ; transfert, rôles/adresses, source verrouillée, choix/image protégée et prochain import mettant à jour la cible, droits/révocation/viewer, concurrence/nouveau contact, rollback de valeurs incompatibles, dépendances métier et chaînes. Suites existantes : **24 tests Imports / 72,765 s**, **25 tests Contacts / 61,932 s**, **12 tests accès/RH / 31,858 s**, tous réussis. Ignorer 600 lignes reste à 19 ms localement, sans engagement NAS. **3 parcours Chromium / 10 s réussis** : sociétés, personnes avec inversion, absence sans habilitation ; captures clair/sombre/mobile inspectées avec la fiche Contacts de référence, tableau horizontal contenu sur mobile, aucun débordement du document. Un premier parcours Personnes attendait le nom complet sans séparateur entre prénom/nom ; libellé harmonisé et trois parcours repassés. git diff --check réussi ; avertissement de chunk habituel et ResourceWarnings HTTP de fixtures conservés. Aucune recette NAS ni fusion des fiches M6/Métropole utilisateur effectuée.
- Livraison **locale sans commit/push**. Pack cumulatif unique `/private/tmp/horizon-pocketbase-fusion-contacts-20261018.zip` : **273 sources / 275 entrées**, SHA-256 `d53771ca293ea2105d8980044ee862411569aa58d24854035d2a68ff398dd813`. ZIP/manifeste/hashes vérifiés et anciennes migrations strictement inchangées depuis le pack Retrait imports. Six fichiers ajoutés/modifiés : contact-merge.pb.js, lib/contact-merge.js, lib/import-reference-merge.js, lib/access-policy.js, lib/contacts-import.js, nouvelle migration 0028. Aucun frontend, base, secret ou fichier utilisateur dans le pack. Prochaine action : sauvegarder pb_data, installer hooks/migrations cohérents, redémarrer puis recharger/reconnecter Horizon et choisir explicitement les fiches à fusionner ; installation NAS non confirmée.

### 18 octobre 2026 — Fusion : besoin d’un assistant transversal après import

- Précision utilisateur : assistant pour fusionner des fiches déjà importées, réutilisable pour les produits. Vérification du service contact-merge : aucune condition de provenance, les sociétés/personnes importées sont déjà éligibles ; les restrictions portent sur les dépendances métier. Catalogue examiné : SKU unique, propriétés de stock/suivi/unité et référencements fournisseurs avec historique empêchent de transposer une simple fusion de champs Contacts.
- Proposition intégrée au contrat 04 et aux travaux actifs : point d’entrée Paramètres / Qualité des données, domaines Sociétés/Personnes/Produits, sélection manuelle ou suggestions justifiées et paginées, fiche conservée, comparaison, conflits, récapitulatif et confirmation. Même assistant partagé depuis une fiche ; services propriétaires pour les règles et références externes, sans réécriture générique des historiques ni addition naïve du stock. Aucun réimport requis pour des fiches déjà présentes.
- Vérifications : lecture documentation/code Contacts, Catalogue et navigation Paramètres ; git diff --check. Cadrage documentaire uniquement, aucun test applicatif ou navigateur relancé, aucun schéma/code/donnée métier modifié dans cette intervention. Fusion Produits, détection/groupes et assistant central non livrés ; accès NAS/Odoo et état des données utilisateur non inspectés.
- Livraison documentaire locale sans commit/push ni nouveau pack. Le pack fusion Contacts existant n’est pas modifié par ce cadrage, installation NAS toujours non confirmée. Prochaine action : développer l’assistant commun avec adaptateurs métiers et tests dédiés après ce cadrage ; R01 À vérifier et R05 En cours, statuts/compteurs inchangés.

### 18 octobre 2026 — R01 / R03 : assistant de fusion des fiches existantes, Contacts et Produits

- Demande validée : assistant commun indépendant des imports, pour sociétés/personnes/produits déjà présents. Livré localement dans Paramètres → Qualité des données, sans scan initial ; sélection manuelle ou suggestions à motifs explicites, pagination serveur de 25, recherche contextuelle WorkspaceSearch, parcours/tri dans SearchFilters et critères/page en URL. Deux fiches sélectionnables sur plusieurs pages/recherches, retrait individuel et sens inversable ; groupes importants traités paire par paire avec une nouvelle comparaison, aucune fusion automatique ou action Tout fusionner. Identités minimales seulement, domaines autorisés, limite explicite 50 000 actifs et pas de troncature silencieuse ; ancres de groupes parmi les fiches les plus anciennes, nombre de propositions linéaire. Noms/raisons sociales normalisés, noms internationaux conservés et ponctuation des e-mails significative.
- Comparateur extrait dans shared/merge/MergeDialog avec callbacks propriétaires Contacts/Inventory ; mêmes étapes et composants depuis l’assistant et la roue des fiches. Différences visibles d’abord, option pour les valeurs identiques, photos protégées toujours comparables même avec un nom de fichier commun, récapitulatif et confirmation obligatoire. Les modules ne copient pas le JSX ni la logique de mutation. ProtectedRecordImage partagé avec chargeur de service ; correction du hover secondary HButton pour utiliser les tokens du thème sombre au lieu d’un fond blanc de secours. Régression et contrat UX canonique ajoutés. Aucun nouveau design de panneau recherche/filtre, tableau ou dialogue.
- Produits : comparaison des unités/type/marque/politiques/suivi/composition/devise et références/variantes ; anciennes références SKU/code-barres conservées sur la source et recherchables comme alias vers la cible dans Catalog. Métadonnées descriptives/famille/photo choisies puis revalidées par Catalog. Offres transférées avec IDs et historique tarifaire immuable, préféré cible prioritaire, images copiées via filesystem protégé et fichiers source conservés. Références externes via le propriétaire Imports, sans modifier les rapports passés ; imports Produits toujours hors du pilote actuel. Source archivée/figée, liens historiques et événements des deux fils, rejeu sans effets supplémentaires ; aucune suppression des anciennes identités.
- Frontière de sécurité maintenue : une source ou offre déplacée avec usages métier non pris en charge est bloquée ; garder comme destination le produit déjà utilisé. Aucun mouvement, réservation, lot/série, valorisation, composition ou document historique réécrit ; fusion de deux historiques reste à développer par propriétaires. Détection des relations et invariants communs dans merge-common, mutations dans les adaptateurs propriétaires, empreinte canonique/allowlists/confirmation et droits recontrôlés dans la transaction. Un premier parcours navigateur a détecté une lecture native de liste Produits refusée 403 : remplacée par la route propriétaire merged-sources en allowlist, sans ouvrir la listRule. Les traductions de types/politiques ne s’appliquent jamais aux valeurs littérales d’un nom ou d’une référence, cas ciblé vérifié.
- Modèle 05 actualisé avant schéma. Migration additive 1791840029_product_merge.js : merged_into/merged_at/index sur inventory_products, droit inventory.merge pour les administrateurs ; rôle isolé s’il est partagé avec un non-administrateur afin de ne pas étendre les droits métier. Accréditation fusion délégable avec read/write, viewer refusé. Contrats 00/03/04/05/06/07/08/09 et travaux actifs actualisés. Aucun schéma de stock ou de facturation changé, aucun nouvel environnement/conteneur ni dépendance ajoutée. R01 reste À vérifier, R03/R05 En cours, statuts/compteurs globaux inchangés.
- Vérifications : pnpm check réussi (**357 tests / 79 fichiers**, lint/TypeScript/build), puis lint + build après le dernier ajustement d’affichage des photos, et lint/typecheck après la fixture finale. **8 tests serveur Assistant / 23,298 s**, **8 Fusion Contacts / 20,417 s**, **17 Catalogue / 46,293 s**, **12 Accès/RH / 30,671 s**, tous réussis (45 tests distincts). Cas ciblés supplémentaires : recherche/normalisation internationale 1 test / 3,086 s ; upgrade avec rôle partagé 1 test / 2,760 s ; valeurs littérales du comparateur 1 test / 2,729 s. Upgrade 0028→0029 avec produit/offre/prix existants et double passage sans perte ; non-administrateur conservant son rôle/droits ; copie de photo et lecture protégée octet pour octet de la source archivée et de la cible ; cas réel de réception de **4 unités** avec mouvements et quantités strictement inchangés après absorption du doublon inutilisé, et refus dans l’autre sens. Tests purs : nom/raison sociale, indices répétés, contexte société, e-mails distincts avec ponctuation, marque/référence et 600 homonymes → 599 rapprochements. Aucun accès aux données réelles NAS/Odoo.
- Recette Chromium : **7 parcours / 18,8 s réussis**, anciens Contacts inclus, puis produit/photo/code-barres ciblé **1 parcours / 6,2 s réussi**. Scan initial absent, choix/différences/valeurs identiques/confirmation, sélection sur deux pages, rechargement URL, historique cible/source, autorisations, images réellement chargées ; clair/sombre/mobile et absence de débordement du document, hover sombre réel. Captures inspectées contre la fiche Contacts et les composants communs ; tableau/commandes/frise cohérents. git diff --check réussi. Warning de chunk habituel et ResourceWarnings de fixtures HTTP conservés ; aucune recette NAS ni fusion réelle de M6/Métropole ou d’un produit utilisateur effectuée.
- Livraison **locale sans commit/push**. Pack cumulatif unique `/private/tmp/horizon-pocketbase-assistant-fusion-20261018.zip` : **280 sources / 282 entrées**, SHA-256 `9b92614cc8c615f838aa9ec434eac225ec2e301be096b9b8523cb37252199a7b`. ZIP/manifeste/hashes vérifiés, anciennes migrations strictement identiques au pack Fusion Contacts (jusqu’à 0028). Sept nouveaux fichiers serveur/migration, quatre hooks/helpers antérieurs modifiés ; aucun frontend, base, secret ou fichier utilisateur inclus. Prochaine action : sauvegarder pb_data, installer ce pack complet hooks/migrations, redémarrer PocketBase puis recharger/reconnecter Horizon ; recette utilisateur et installation NAS non confirmées. Extensions aux deux fiches déjà porteuses d’historiques métier restent explicitement différées.


### 18 octobre 2026 — H03 : proposition TimeReport BE et préparation PROD / OnSite

- Besoin exprimé : saisie directe BE dans Horizon, vues semaine/mois, activités prédéfinies correspondant à des produits de services internes ; imputation affaire, avant-vente/AO ou interne. PROD conserve son application OnSite ; récupération future de ses données PocketBase, dépôt à communiquer pour analyse. Les captures fournies servent uniquement d’inspiration fonctionnelle.
- Investigation : contrats 03/04/05/06/07/08, navigation TimeReport, politique catalogue des services CVS et lecteur propriétaire time-analysis examinés. Le lecteur analytique distingue BE/production et réalisé validé/temps en attente ; la saisie et les profils de coûts effectifs restent à construire. Aucun dépôt OnSite, schéma distant ou donnée réelle inspecté.
- Proposition à valider : grille hebdomadaire éditable affaire/activité par jour, mois en synthèse avec détail, catalogue de services éligibles paramétré, lien facultatif à une ligne commerciale pour comparer vendu/réalisé sans empêcher l’avant-vente ; feuilles hebdomadaires brouillon/soumission/validation, contrôle des capacités/absences sans inventer les horaires contractuels, valorisation serveur datée et droits séparés. Pour OnSite : adaptateur ultérieur en lecture, correspondances employés/activités/analytiques et références externes stables, synchronisation idempotente avec anomalies explicites et source de validation à cadrer. Aucune heure planifiée ou importée automatiquement réputée validée.
- Vérifications : lecture documentaire/code et git diff --check uniquement ; aucun test applicatif/navigateur nécessaire pour ce cadrage, aucune modification du code, schéma ou données. H03 reste À faire, compteurs inchangés. Livraison documentaire locale sans commit/push, migration ou nouveau pack ; prochaine action : validation du parcours proposé et réception du dépôt OnSite avant son analyse. Le retour utilisateur « c’est op » sur l’assistant de fusion est enregistré comme retour positif, sans déduire une installation NAS ni des fusions réelles.


### 18 octobre 2026 — Publication Imports et assistant de fusion avant TimeReport

- Publication demandée par l’utilisateur avant lancement de H03 : pilote Imports Contacts, correctifs de reprise/validation/images, assistant de fusion Contacts/Produits et documentation associée. Retour utilisateur positif sur la fusion enregistré ; aucune installation NAS déduite.
- Vérification préalable : pnpm check réussi, lint/TypeScript/build et 357 tests Vitest (79 fichiers). Tests serveur/navigateur du lot décrits dans les entrées précédentes, non rejoués pour cette publication sans nouvelle modification métier. Warning habituel de taille de chunks. Git diff --check réussi.
- Livraison : commit/push demandés vers origin/main ; résultat Git vérifié dans la session. Pack cumulatif fusion du 18 octobre inchangé. H03 reste À faire au moment de cette publication, développement BE à suivre séparément ; OnSite non inspecté.


### 18 octobre 2026 — H03 : TimeReport BE T01 et reconnaissance OnSite

- Point de départ demandé : changements Imports/Fusion committés et poussés sur origin/main, `2098fc8`, push confirmé depuis `732e828`. Travail TimeReport séparé ensuite, local non committé. H03 passe de À faire à En cours ; compteurs recalculés sur les 46 lots : **2 terminés / 23 en cours / 10 à vérifier / 0 bloqué / 11 à faire**. RH : 3 En cours / 1 À faire. H02 Planning reste À faire, autres statuts inchangés.
- BE T01 : saisie native `/time-reporting`, grille hebdomadaire dense, synthèse mois avec dates réellement dans le mois distinctes des totaux de semaine, navigation/période en URL, lignes sans heures conservées, commentaires par jour, durée h:mm ou décimale sans arrondi silencieux, clavier et réordonnancement partagé, favoris privés ajoutables/retirables et reprise des seules lignes précédentes. Sauvegarde explicite, état visible et protection de navigation/rechargement. Manager : feuilles soumises/décidées, recherche top bar, filtres multiples/tri/groupement partagés et pagination 30 ; semaines manquantes uniquement pour les ressources BE explicitement configurées avec capacité disponible, aucune semaine future ou absence complète assimilée à un oubli. Choix des activités filtré par période dans l’éditeur et contrôlé côté serveur.
- Imputations : comptes analytiques existants, racine avant-vente/AO, racine/commande affaire ou comptes fixes internes. Activités issues des produits de services internes CVS selon la politique catalogue existante, sans référentiel libre parallèle ; activation BE/PROD et période/saison dans Paramètres → Planning et temps. Lien facultatif à une ligne commerciale du même service et compte enfant de commande, validé par le propriétaire Sales. Aucun devis ou prix vendu modifié. La consolidation des heures vendues reste différée (unités autres qu’heures non converties arbitrairement).
- Workflow atomique draft/submitted/validated/rejected, retrait et reprise, réouverture validée motivée. Révision entière refuse l’écrasement concurrent ; compte/rôle/périmètre rechargés dans la transaction. Employé actif associé et auteur cohérent, pas d’auto-validation ; responsable habilité prioritaire, secours global explicitement choisi. Un manager rouvrant une feuille validée revient à sa liste lorsque le brouillon redevient privé ; réponse de transition snapshotée dans la transaction pour ne pas lire un brouillon modifié après coup. Historique complet des lignes/entrées/coûts conservé dans Core Audit, événements simplifiés dans Core Activity et nouvelles préférences de notifications time_requests/time_updates. Fil en lecture, notes/mentions/tâches non ouvertes pour T01.
- Capacités et coûts : référentiel Core/RH daté, périodes par employé sans chevauchement, aucun 35/39/40 h ou taux inventé. Calendrier Congés via son propriétaire : fériés nommés, week-ends et fraction d’absence seulement, sans motif/type/pièce sensible. Alertes de surcharge/absence sans interdire le travail exceptionnel, limite serveur 24 h/jour toutes lignes/sources connues. Coût standard EUR snapshoté à validation par date de travail, absence de taux conservée comme indisponible. Analyse affiche les minutes validées et coûts agrégés sans taux/personnes ; coût incomplet ou devise différente = null, aucune marge réelle complète inventée. Couverture BE/PROD distincte : table Time existante ne suffit pas à annoncer OnSite raccordé ou afficher 0 h PROD sans source.
- Migration additive `1791840030_time_report.js`, modèle 05 écrit avant schéma : cinq collections Time et deux profils Core, time_scope et nouveaux types d’alerte. Native REST fermé sur temps/profils ; services privés en allowlist. Administrateurs existants habilités, rôle isolé s’il est partagé avec un collègue ; autres droits/données conservés. Aucune heure, activité, capacité ou coût créé par défaut. Aucun nouveau conteneur, secret ou dépendance. Contrats 00/03/04/05/06/07/08/09 actualisés. Les anciennes migrations jusqu’à 0029 sont strictement inchangées.
- OnSite : dépôt fourni `cre4tixdev/cvs-onsite-backend`, commit `05a44be98d3630039e9c73375e1629cbd0e3b65f`, examiné en lecture seule. users/clients/project_codes/time_logs/planning, timestamps et durées, modifications manuelles, projectType et état completed repérés. completed signifie relevé complet dans l’export, aucune validation manager démontrée. Correspondances stables et provider idempotent cadrés dans le document 08 ; schéma distant/fuseau/pauses/nuit/validation à confirmer plus tard. Aucun accès à sa base, import PROD ou connexion externe effectué.
- Vérifications frontend : pnpm check réussi, **382 tests Vitest / 82 fichiers**, lint/TypeScript/build ; lint/build repassés après les derniers réglages UI et la protection des conflits, puis lint final après le dernier garde serveur. Warning habituel de chunks conservé. Les tests purs serveur utilisent le même chargement VM CommonJS que les autres helpers PocketBase du projet (premier essai require incompatible avec type=module corrigé). git diff --check réussi.
- Serveur : **79 tests distincts réussis** — TimeReport **8 / 26,191 s**, Analysis **7 / 22,792 s**, Accès/RH **12 / 34,056 s**, Notifications **7 / 28,689 s**, Congés **12 / 36,513 s**, Catalogue **17 / 50,877 s**, Activity **16 / 45,940 s**. Puis TimeReport **8 / 23,546 s** repassés après le garde final : un manager reports sans employé associé ne doit jamais obtenir les ressources dont manager est vide ; lecture de feuille gardée avant accès à son identifiant. Aucun droit de périmètre n’est déduit d’une relation vide. Upgrade 0029→0030 et double passage vérifiés, société existante conservée intégralement, rôle partagé isolé et aucun temps/taux inventé ; historique de taux figé, références analytiques commerciales cohérentes, confidentialité et version concurrente inclus.
- Régressions adaptées : l’ancien test d’analyse créait une table Time factice, remplacée par une fixture SQLite temporaire pour le lecteur réel (unicité ligne/date respectée), sans ouvrir les mutations natives. Les coûts absents/null historiques sont correctement indisponibles au lieu d’interrompre le rapport ; somme des coûts validés et refus de consolidation de devise différente vérifiés. Le test d’upgrade Congés vérifie chaque valeur historique et les nouveaux champs additifs de fusion vides au lieu d’exiger un schéma identique ; les préférences comptent désormais dix types avec TimeReport, mêmes contrôles de doublons/tiers/concurrence. Aucun assouplissement des règles applicatives ou modification manuelle d’une base réelle.
- Navigateur : **2 parcours Chromium / 17,1 s réussis** au dernier contrôle complet UI : paramètres et service interne, capacités/coût, grille, commentaires, favoris ajout/retrait, clavier et déplacement persistant, lignes à zéro, semaine/mois, soumission/validation/fil et notification effectivement présente dans l’inbox du manager, recherche/tri URL conservés. Comparaison réelle avec Contacts en vue Liste, mêmes fond et famille de police des en-têtes ; captures clair/sombre/mobile et paramètres inspectées, pas de débordement du document. Défilement horizontal mobile vérifié par pointage réel : l’en-tête Imputation reste au-dessus des jours. Un premier contrôle comparatif attendait la liste alors que Contacts s’ouvrait en cartes : interrompu puis vue Liste explicitée, parcours repassés. Attente de fermeture du dialogue Rester ajoutée avant reprise de saisie ; erreur de durée conserve le champ invalide et bloque Enregistrer.
- Dernier complément UX testé : les grilles ne se rechargent pas silencieusement au focus/reconnexion. Un deuxième enregistrement simulé depuis un autre onglet provoque 409 à la sauvegarde, garde les heures locales et propose un rechargement confirmé ; aucun abandon automatique. Le 409 de ce test et les logs status 0 des requêtes annulées lors des changements de compte restent visibles ; pas d’erreur JavaScript dans le parcours. Les ResourceWarnings HTTP de fixtures et NO_COLOR ne bloquent pas les tests. Le dernier garde reports sans employé a ensuite été vérifié par la suite serveur, sans modification UI supplémentaire. Pas de recette de la session utilisateur 5173, du NAS ou d’une source OnSite réelle.
- Livraison **locale, TimeReport non committé/poussé**, après le commit préalable Imports/Fusion `2098fc8` effectivement poussé. Pack cumulatif unique `/private/tmp/horizon-pocketbase-timereport-be-20261018.zip` : **290 sources / 292 entrées**, 1050925 octets, SHA-256 `d7880947c53dc994c5f3beee347e2d8777871dfc03ef05cf81d1649243526a7a`. ZIP/manifeste/hashes vérifiés, anciennes migrations identiques au pack Assistant Fusion jusqu’à 0029 ; dix nouvelles sources serveur/migration, aucun frontend/base/secret. Installation NAS non effectuée. Prochaine action : sauvegarde, copie des hooks complets et migrations, redémarrage, frontend à jour/reconnexion, habilitations TimeReport/employés/managers et configuration des activités/capacités/coûts connus dans Paramètres → Planning et temps, puis recette utilisateur. Planning et récupération PROD OnSite restent des lots ultérieurs, avec état de validation distant à confirmer ; consolidation des heures vendues et comptabilisation/paie non livrées.


### 18 octobre 2026 — H03 : correction de l’imputation des temps internes

- Retrait du sélecteur « Compte interne » : une saisie Interne demande seulement le service autorisé ; aide discrète et champ activité pleine largeur. Affaire/Avant-vente conservent la recherche du compte d’affaire. Le serveur impose le compte central `time_internal`, même si un client transmet une ancienne catégorie d’achat. Les favoris suivent cette attribution. Contrats 04/05/07 actualisés.
- Migration additive `1791840031_internal_time_account.js` : compte Temps internes, code libre à partir de 99301, historique intégral conservé. Codes/libellés ajustables dans les paramètres analytiques fixes, usage distinct des achats ; schémas de paramètres et d’Achats séparés pour ne pas accepter le compte des temps dans une ventilation d’achat. Anciennes feuilles corrigées uniquement par sauvegarde explicite en brouillon, avec retrait/réouverture motivée si nécessaire. Contrat et exploitation dans 05/06.
- Vérifications réussies : lint, TypeScript/build, 382 Vitest ; 10 tests serveur TimeReport, dont migration depuis 0030, conflit de code, historique validé inchangé et déduction du compte ; 31 tests analytiques fixes/Achats ; deux Playwright (17,8 s), paramètres et popup corrigé inspecté en clair/sombre/mobile, parcours complet de validation et conflit concurrent. Un premier sélecteur de test ambigu dans les paramètres a été précisé puis la recette intégrale a réussi. Avertissement habituel Vite sur les chunks ; annulations réseau de déconnexion et 409 volontaire sans échec.
- Livraison locale, non committée/poussée. Pack cumulatif `/private/tmp/horizon-pocketbase-temps-internes-20261018.zip` : 291 sources / 293 entrées, 1051985 octets, SHA-256 `d8104ec5f783bfe915ded2f6543d7ed59749f639acdc00050a5c3b962ef13a74`. ZIP, manifeste et concordance des sources vérifiés ; migrations déjà livrées jusqu’à 0030 inchangées. Remplace le pack initial TimeReport. Installation NAS non effectuée par l’agent ; prochaine action : sauvegarde, copie des hooks complets/migrations et redémarrage, frontend à jour puis recette utilisateur. H03 reste En cours, compteurs inchangés ; Planning, consolidation des heures vendues et import PROD OnSite restent différés.


### 18 octobre 2026 — H03 : page allégée et activation des temps par employé

- Page TimeReport recentrée sur la grille : description/titre de lignes, total et badge d’état redondants retirés ; identité compacte, frise partagée conservée, actions de reprise/favoris/aide regroupées à droite des onglets. Capacité affichée seulement lorsqu’elle est configurée ; absence de ligne précédente devient une information neutre. Barre d’actions responsive avec retour à la ligne, reprise libellée plus court et nom accessible conservé.
- Éligibilité propriété RH : classification explicite none/BE/Production dans la fiche équipe et case « Saisit ses heures » dans Organisation de l’employé. Activation soumise aux permissions/périmètres RH d’organisation ; classement réservé au gestionnaire des équipes. Saisie/soumission BE contrôlées dans la transaction serveur, indépendamment des droits ERP et profils de capacité. Retrait d’éligibilité sans effacer les historiques ; managers non saisissants toujours habilités à décider selon leurs permissions. Manquants BE limités à la population éligible avec capacité. T01 reste saisie BE ; PROD préparée pour OnSite, import non livré. Contrats 04/05/06/07 et aide 00 actualisés.
- Migration additive 1791840032 : booléen employé faux et classification d’équipe none, aucun classement par nom ni activation implicite, aucune heure modifiée. API RH reste compatible avec les clients omettant les nouveaux champs, valeurs conservées à la mise à jour.
- Vérifications finales : pnpm check réussi (lint, TypeScript, 382 Vitest/82 fichiers, build) ; 13 tests serveur TimeReport/upgrade et 12 tests Access/RH réussis ; trois parcours Playwright combinés Access/RH + TimeReport réussis (34,7 s), avec vraie classification d’équipe, activation employé, grille, validation, notifications, conflits, accès, clair/sombre/mobile et comparaison au tableau Contacts. Captures inspectées ; correction d’un alignement de case, d’un sélecteur de prénom ambigu dans les fixtures partagées et du débordement mobile avec favoris avant recette finale. Avertissement Vite chunks volumineux, annulations réseau de déconnexion et 409 volontaire sans échec. git diff --check réussi. Pas de recette de la session NAS ni d’OnSite réel.
- Livraison locale, non committée/poussée. Pack cumulatif unique `/private/tmp/horizon-pocketbase-temps-employes-20261018.zip` : 293 sources / 295 entrées, 1054172 octets ; SHA-256 `f0608ee96ead83a68cb8e3f436e0b21faadf6669b33c22135678b794516efce2`. ZIP/manifeste/concordance des sources vérifiés, migrations déjà livrées jusqu’à 0031 inchangées. Installation NAS non effectuée par l’agent. Prochaine action : sauvegarder, remplacer les hooks complets, copier les migrations, redémarrer avec frontend à jour ; classer les équipes puis cocher les employés concernés, conserver/configurer leurs habilitations et recetter. H03 reste En cours, compteurs et autres statuts inchangés.


### 18 octobre 2026 — H03 : faux succès de sauvegarde d’une équipe sans migration

- Retour utilisateur : le périmètre BE sélectionné revient vide après sauvegarde ; installation du pack/migration 0032 en cours de revérification par l’utilisateur, état NAS non confirmé. Reproduction locale exacte avec hooks récents sur schéma 0031 : HTTP 200 mais time_work_type absent/non persisté. Ce cas est confirmé localement, pas attribué définitivement à la base utilisateur sans vérification.
- Correctif : routes RH refusent explicitement le paramétrage des temps si le champ requis manque (503 indiquant 1791840032), avant écriture. Le repository vérifie aussi que la réponse contient le périmètre demandé ; un ancien backend retournant un faux succès ne ferme plus le popup. Message d’installation actionnable, saisie conservée. Aucune nouvelle migration ; contrats 06/07 et tests 09 actualisés.
- Vérifications : 13 tests serveur TimeReport réussis, dont refus sans migration/fiche inchangée puis sauvegarde et relecture BE après mise à niveau ; pnpm check réussi (385 Vitest/83 fichiers, lint/TypeScript/build), lint/typecheck repris après ajustement du format d’erreur PocketBase. Deux parcours Playwright finaux réussis (20,7 s) : 503 simulé garde le popup/choix, reprise, rechargement complet, réouverture BE ; saisie/validation/notifs/concurrence et refus d’accès. Stabilisation des attentes du test sur redimensionnement/authentification après une intermittence de fixture ; aucun changement d’authentification métier. git diff --check réussi. Aucune recette NAS.
- Livraison locale non committée/poussée : `/private/tmp/horizon-pocketbase-temps-persistance-20261018.zip`, 293 sources / 295 entrées, 1054419 octets, SHA-256 `53acf7d0023cc9144d867ffbccf65a7ec858f68331cf354af18c003f442e526f`. Sources/manifeste/ZIP vérifiés, toutes les migrations déjà livrées jusqu’à 0032 identiques. Pack remplace le précédent ; migration 0032 à appliquer uniquement si absente, hooks/frontend corrigés à actualiser. Prochaine action : l’utilisateur vérifie l’application de 0032 et le redémarrage ; si déjà appliquée et échec persistant, examiner la réponse réelle de sauvegarde/répertoire. H03 reste En cours, compteurs inchangés.


18 octobre — retour utilisateur après revérification : le classement d’équipe fonctionne désormais ; l’utilisateur suppose un chargement de base encore en cours. Retour fonctionnel positif enregistré, sans confirmer cette cause ni une absence de 0032 sur son instance. Aucun besoin de réparation des données constaté. Le garde de compatibilité préparé reste local et testé ; installation du dernier pack de persistance non confirmée.


### 18 octobre 2026 — H03 : investigation du sélecteur d’activités vide

- Lecture du sélecteur Paramètres/Planning et temps et de l’adaptateur Catalogue : seules les fiches actives de type Service et marque CVS sont proposées, conformément au contrat. L’utilisateur confirme que ces produits/services n’ont pas encore été créés ; la liste vide est donc attendue, aucune absence de données attribuée à une erreur de recherche sur son instance. Aucun service inventé ou créé automatiquement.
- Vérifications : inspection du code et des contrats uniquement ; aucun code, schéma ni donnée modifié et aucun test applicatif exécuté pour cette investigation. Prochaine action : définir/créer les activités de la saison en produits de service internes, puis les autoriser dans les paramètres. Livraison documentaire locale, aucun nouveau pack/commit/push, installation NAS non concernée.


### 18 octobre 2026 — Catalogue / H03 : sélecteur unique Famille et services de temps

- Produit utilisateur signalé `n8n5wpdrhlzfn1p`, capture BE - Mise en Service/MES, actif, marque CVS et famille Services. Lecture anonyme du lien local redirigée vers Connexion : aucune inspection authentifiée ni modification de cette fiche réelle. Le code montrait un défaut de parcours : famille Services sélectionnable, mais kind resté masqué avec valeur initiale Équipement possible. Ce cas a été reproduit sur fixture ; nature réelle du produit utilisateur non lue.
- Correction demandée par l’utilisateur : suppression du sélecteur Nature ajouté en cours de travail, conservation d’un seul choix Famille en fiche produit. Usage Équipement/Fourniture/Service configuré une fois par famille dans Paramètres → Catalogue. À création, changement ou réapplication explicite de famille, le propriétaire Catalogue déduit kind côté serveur et prépare les services sans stock/suivi ; unité et usages achat/vente conservés. Aucune déduction depuis un simple libellé.
- Migration additive `1791840033_product_family_kind.js` : product_kind requis sur les familles, initialisation des familles standard et reprise d’une nature homogène pour les personnalisées, sinon Equipment à vérifier dans les paramètres. Produits, stocks et pièces historiques inchangés. Une sauvegarde ordinaire dans une même famille conserve le kind historique ; la réapplication est explicite et soumise au verrou après mouvement/réservation/série. Prix et snapshots jamais réécrits. Invalidation des choix de temps après sauvegarde produit ; aide et message d’absence d’activités clarifiés. Contrats 00/04/05/06/07/09 actualisés.
- Vérifications : pnpm check réussi, 385 Vitest/83 fichiers ; lint/typecheck repris après finalisation UI. 19 tests Catalogue avec migration 0032→0033 et conservation stricte d’un produit existant, 13 TimeReport, un test Stock sur verrou de nature après mouvement et un test Achats sur services internes/externes et historique. Trois parcours Playwright combinés TimeReport + commande mixte réussis (26,8 s) ; paramètres de famille réellement édités, ancien produit conservé puis famille réappliquée en fiche, save/reload et apparition dans les activités BE ; aucune combobox Nature, vues clair/sombre/mobile et absence de débordement. Les fixtures historiques ont été complétées pour respecter tous les champs et le format des rôles, puis le test de migration et la suite Catalogue ont réussi. Un essai ultérieur de capture Chromium a bloqué malgré les polices chargées ; attente bornée/captures sans animation ajoutées dans les tests. Captures finales inspectées. Pas de recette NAS.
- Livraison locale non committée/poussée. Pack cumulatif `/private/tmp/horizon-pocketbase-familles-services-20261018.zip` : 294 sources / 296 entrées, 1055576 octets, SHA-256 `e5bd035dd7d8b5bf34b17ce66ae8feb462588caf226db0d079e4388361946219`. Sources/manifeste/ZIP vérifiés, anciennes migrations jusqu’à 0032 inchangées, nouvelle 0033 seulement. NAS non installé par l’agent. Prochaine action : sauvegarder, remplacer hooks, copier migrations/redémarrer, frontend à jour ; vérifier la famille Services puis la réappliquer explicitement à MES si nécessaire et autorisé par son historique, autoriser l’activité BE. H03 reste En cours ; statuts/compteurs inchangés, import PROD OnSite toujours différé.


Complément de recette : les deux parcours TimeReport finaux passent en 23,0 s après bornage des captures et désactivation de leurs animations ; alignement horizontal de la case de famille et parcours complet sauvegarde/validation/conflit confirmés. Build final réussi ; avertissement habituel sur les chunks volumineux.

### 18 octobre 2026 — H03 : synthèses TimeReport collaborateur et manager

- Résultat local : entrée TimeReport en synthèse mensuelle Mes temps, cinq cartes `HSummaryCards` (heures, non saisies, à compléter, soumises, validées), accès direct aux semaines et grille hebdomadaire conservée. Équipe : heures reçues, non reçues, à valider, à corriger, validées. Top bar partagée disponible dès l’entrée par défaut ; cartes filtrantes, regroupement/tri/pagination/URL conservés. Aucun ajout de cartes sur la grille de saisie. Comparaison visuelle avec la référence Contacts du parcours existant, captures finales clair/sombre/mobile examinées, défilement contenu sans débordement de page.
- Serveur : attentes et indicateurs calculés avant recherche/état/pagination sur le mois et périmètre autorisé. Les durées sont limitées aux jours du mois ; aucune attente future, capacité inconnue ou hors éligibilité BE inventée. Les attentes de la semaine en cours sont possibles dès un jour de capacité atteint. Côté manager, un éventuel brouillon est représenté seulement par une attente sans ID/contenu/durée ; aucune consultation du brouillon. Les feuilles soumises à un autre manager ne sont pas signalées manquantes. Historique conservé après désactivation de la saisie.
- Vérifications exécutées : 14 tests PocketBase TimeReport réussis (43,476 s), dont synthèses/filtres/attentes, confidentialité puis soumission, absence future et désactivation RH ; lint, TypeScript et 385 tests Vitest/83 fichiers réussis. Parcours Chromium final : 2 tests réussis (23,8 s), filtres par carte/indicateurs stables, entrée par défaut/recherche et captures des deux synthèses. Une relance intermédiaire a échoué sur le changement de thème hors d’un dialogue modal ; fixture corrigée, parcours final passé. Lint ciblé et `git diff --check` réussis. Aucun test sur le NAS ni connexion PROD OnSite ; aucun temps utilisateur modifié par l’agent.
- Contrats : docs 04/05/06/07/09 actualisés, notamment confidentialité des attentes, agrégats mensuels et présentation ; ancienne phrase contradictoire du catalogue corrigée pour conserver le sélecteur Famille unique déjà validé. H03 reste En cours ; compteurs globaux inchangés. Restent recette NAS, planning et raccordement futur PROD OnSite.
- Livraison : local, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-syntheses-temps-20261018.zip`, 294 fichiers source / 296 entrées, 1 056 140 octets, SHA-256 `c3c223c6d51e372a6f4607df7663b43aa3d556e9ea6b6e6f1bdc23a28afbd98f`. ZIP/manifeste/hachages vérifiés, migrations identiques au précédent pack familles-services jusqu’à 0033 : aucune migration supplémentaire. Remplacement des hooks complets, redémarrage PocketBase et frontend à jour nécessaires. Installation NAS non effectuée ni confirmée.
- Vérification finale complémentaire : `pnpm build` réussi (TypeScript + Vite), avertissement de taille de chunk existant conservé ; aucune erreur de compilation.

### 18 octobre 2026 — H03 : reprise proposée du suivi visuel des temps

- Investigation à la demande utilisateur : la synthèse personnelle de TimePage est affichée pour toute personne ayant time.read, sans condition de saisie RH sur son rendu mensuel. Cela explique une synthèse Mes temps pour un manager non concerné ; aucun accès à sa session NAS ni vérification de ses valeurs réelles. Le contrôle d’éligibilité serveur de saisie reste distinct et inchangé.
- Proposition à valider : entrée Équipe pour un manager non saisissant, synthèse personnelle réservée aux collaborateurs concernés et historique conservé séparément. Matrice équipe personnes × périodes, vues semaine (jours), mois (semaines), année (mois), états et heures lisibles/cellules ouvrables selon droits. Synthèse personnelle sous forme de progression du mois et semaines visuelles, sans répéter cinq cartes. Capacités inconnues, congés/fériés et PROD OnSite non raccordée distingués d’un défaut de saisie ; aucun contenu de brouillon personnel exposé au manager.
- Vérifications : lecture des contrats 04/05/07 et du rendu TimePage/éligibilité ; aucune modification applicative ni exécution de tests pour cette proposition. H03 reste En cours, compteurs inchangés. Prochaine action : accord sur la présentation puis implémentation/tests de la navigation, des agrégats et des permissions. Livraison : investigation/proposition locale, non commit/push, aucun nouveau pack et aucune installation NAS.

### 18 octobre 2026 — H03 : matrice des temps et navigation selon l’éligibilité RH

- Résultat local après validation de la proposition : matrice Équipe avec personnes/photo RH en lignes, jours en semaine, semaines en mois et douze mois en année. Heures reçues, états et nombre de semaines validées/suivies en annuel ; une période partiellement validée reste Partielle. Clic année → mois → feuille autorisée. Noms maintenus pendant le défilement, recherche/filtres/tri/groupement/pagination partagés et URL conservés. Tri des identités par nom de famille puis prénom.
- Mes temps : bandeau compact heures/capacité connue et progression, semaines ou mois cliquables pour saisir/continuer/consulter. Les cinq cartes de compteurs précédentes sont remplacées. Grille hebdomadaire conservée avec protection des modifications/conflits et validation manager. Manager non concerné par la saisie : entrée directement sur Équipe, aucun compteur personnel ; un Historique séparé reste disponible si anciennes feuilles, sans objectif de capacité personnel.
- Données et sécurité : lecture bornée à une semaine/un mois/un an ; capacités datées et calendrier RH chargés par ressource, sans requête de profil pour chaque jour. Jours non travaillés, futur, capacité inconnue et PROD OnSite non raccordée distingués d’une attente. Heures découpées aux jours de période, aucun contenu/ID/heure de brouillon manager ni coût exposé. Lecture de photo RH contrôlée dans le périmètre TimeReport, sans droit RH supplémentaire, flux commun identity-photo et URL blob locale libérée. Pas de nouvelle collection ni migration ; historique et documents conservés.
- Vérifications : lint/TypeScript, 385 tests Vitest (83 fichiers) et build Vite réussis ; avertissement de taille de chunk existant conservé. Suite TimeReport complète : 15 tests réussis (48,402 s), complétée par régressions ciblées photos réelles/ACL et synthèses (2 tests, 6,594 s), découpage entre mois (1 test, 3,435 s) et tri/pagination des personnes. Photos RH/comptes existants : 3 tests réussis (8,689 s). Chromium final : 2 tests réussis (25,1 s), dont manager sans Mes temps, trois échelles, transitions et conservation de saisie, photo effectivement téléchargée sans droit RH, navigation/recherche/tri URL ; captures clair/sombre/mobile examinées et comparaison avec Contacts du parcours conservée. Relances intermédiaires corrigées : jour non travaillé portant un brouillon hebdomadaire et ancien sens attendu du tri. `git diff --check` réussi.
- Contrats 04/05/06/07/09 actualisés et travaux actifs H03 ajustés ; H03 reste En cours, compteurs globaux inchangés. Restent recette NAS et raccordements futurs Planning/PROD OnSite. Aucun test ni modification des données réelles de l’utilisateur sur le NAS.
- Livraison : locale, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-suivi-visuel-temps-20261018.zip`, 295 fichiers source / 297 entrées, 1 059 316 octets, SHA-256 `eee798ef8a524574730c310575d93d652f2c8c1a25fe56ffa13411e7fcb2f6b8`. ZIP/manifeste/hachages et migrations historiques inchangées jusqu’à 0033 vérifiés. Aucune migration supplémentaire depuis le précédent pack ; remplacer les hooks complets puis redémarrer PocketBase et utiliser le frontend à jour. Installation NAS non effectuée ni confirmée.

### 18 octobre 2026 — H03 : agenda personnel et retrait des mentions de capacité

- Résultat local : les cartes personnelles et le bandeau heures/capacité sont remplacés par un agenda mensuel lundi–dimanche, heures/état dans les journées et liens directs vers la feuille de semaine. Synthèse des semaines sous l’agenda ; total saisi discret près du titre. Année : douze mini-calendriers avec heures, état, semaines validées et repères des jours saisis. Mobile : les sept jours restent visibles, états compacts accessibles par leur libellé/titre ; pas de débordement de page. Mention Capacité inconnue/non renseignée et filtre associé retirés. Les capacités datées restent internes : aucune obligation ou heure contractuelle inventée. Vue équipe et grille de saisie conservées.
- Réutilisation : extraction du cadre de calendrier existant vers `HCalendarGrid`, utilisé par Calendrier général et TimeReport ; mêmes colonnes, jours hors mois, week-ends, fériés nommés alignés à droite et jour courant. Slots métier pour événements ou heures, aucune seconde palette ni copie du JSX de grille. Aucun changement des droits de création/modification du calendrier.
- Serveur : projection `days` uniquement pour la vue personnelle, au plus 366 dates, sans coût ni motif d’absence ; vue équipe renvoie une liste quotidienne vide. Agrégats des durées calculés une fois par jour en mémoire pour l’année, sans requête supplémentaire par journée. Aucun nouveau schéma/migration ; hooks et frontend cohérents nécessaires.
- Vérifications réellement exécutées : lint/TypeScript, 385 tests Vitest (83 fichiers), build Vite réussis (avertissement de taille de chunk préexistant). 15 tests PocketBase TimeReport réussis (48,116 s), complétés après optimisation par 2 tests ciblés des synthèses/confidentialité/durées quotidiennes (6,494 s). Chromium Calendrier + TimeReport : 6 tests réussis (35,8 s), dont création/édition/retrait des événements, permissions, week-ends/fériés et dates réelles des heures. Recette finale TimeReport après adaptation mobile : 2 tests réussis (25,3 s). Captures mois clair/sombre, année et mobile examinées ; les premiers essais ont détecté un débordement mobile corrigé via le conteneur partagé puis une grille compacte sur sept jours. `git diff --check` réussi. Aucune recette NAS effectuée.
- Contrats 04/05/07/09 et travaux actifs actualisés. H03 reste En cours, compteurs globaux inchangés ; restent recette NAS, Planning et raccordement PROD OnSite. Livraison locale, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-agenda-temps-20261018.zip`, 295 fichiers source / 297 entrées, 1 059 626 octets, SHA-256 `5973226b92c859a26eb536feefdd46fff77e6fe5881f20c645d36ccffdaf47a8`. ZIP, manifeste/hachages et migrations historiques identiques au pack précédent jusqu’à 0033 vérifiés. Aucune migration supplémentaire : remplacer les hooks complets, redémarrer PocketBase et utiliser le frontend à jour. Installation NAS non effectuée ni confirmée.

### 18 octobre 2026 — H03 : réel sans anticipation, totaux en bout de semaine et synthèse Équipe

- Résultat local : saisie des heures et commentaires interdite après aujourd’hui côté UI et serveur, référence civile Europe/Paris renvoyée dans les DTOs. Les jours futurs sont verrouillés ; semaines entièrement futures consultables sans ajout/copie/enregistrement. Soumission et validation refusent les éventuelles anciennes entrées futures, sans suppression ni réécriture de l’historique. Une saisie anticipée d’un brouillon ouvert peut être retirée explicitement. Renommage visible/accessibilité « Copier semaine précédente » ; copie des activités/imputations seulement, sans heures ni commentaires.
- Agenda : les totaux et états hebdomadaires occupent une huitième colonne à droite des sept jours, alignée sur chaque rangée ; retrait du bandeau sous le calendrier. Réutilisation du slot `renderWeekSummary` de HCalendarGrid, sans variante de grille copiée. Calendrier général inchangé dans ses sept colonnes. Totaux limités aux jours affichés de la période, y compris aux frontières du mois. Mobile : sept jours et total visibles, états compacts avec libellé/titre accessible.
- Équipe : cinq HSummaryCards partagés (heures reçues, à valider, validées, à corriger, semaines non reçues), filtre par clic, agrégats de toute la période/périmètre autorisé avant recherche/états/pagination. Attentes dédupliquées par employé/semaine, y compris en annuel à cheval sur deux mois. Aucun contenu, temps ni compteur de brouillon privé exposé ; les cartes personnelles ne sont pas réintroduites.
- Vérifications : 16 tests PocketBase TimeReport réussis (49,131 s), puis régression future/historique après actions serveur (1 test, 3,060 s) et compléments aujourd’hui autorisé + déduplication annuelle (2 tests ciblés, 3,218 s et 3,176 s). Scénarios de temps réalisés replacés sur des dates passées. Lint/TypeScript, 385 tests Vitest/83 fichiers et build Vite réussis ; avertissement de taille de chunk existant conservé. Chromium Calendrier + TimeReport final : 6 tests réussis (35,6 s), dont copie vide, refus du futur, total à droite du dimanche, cartes Équipe filtrantes/stables et parcours existants ; un essai intermédiaire a nécessité d’enlever le filtre submitted avant de tester une autre semaine sans soumission. Captures mois/équipe clair-sombre-mobile examinées et comparaison Contacts du parcours conservée. `git diff --check` réussi. Aucun test ni modification des données réelles du NAS.
- Contrats 04/05/06/07/09 et travaux actifs actualisés ; H03 reste En cours, compteurs globaux inchangés. Restent recette NAS, Planning et raccordement PROD OnSite. Livraison locale, non commit/push.
- Pack cumulatif `/private/tmp/horizon-pocketbase-temps-reels-synthese-20261018.zip` préparé : 295 fichiers source / 297 entrées, 1 060 319 octets, SHA-256 `a85c9bea9500a9ddd9a9132f5fe33413bb71e12a1553873f2f106aedd5af5f27`. ZIP/manifeste/hachages et migrations historiques identiques au précédent pack jusqu’à 0033 vérifiés. Aucune nouvelle migration : remplacer les hooks complets, redémarrer PocketBase et utiliser le frontend cohérent. Installation NAS non effectuée ni confirmée.

### 18 octobre 2026 — H03 : filtres sans clignotement et totaux visuellement détachés

- Correctif local : la nouvelle clé de requête au clic sur une carte vidait brièvement les données, remplaçait les compteurs par « — » et démontait la matrice. Conservation des données précédentes pendant les filtres/tri/pagination pour une même zone/vue/date ; aucun recyclage hors contexte, aria-busy pendant l’actualisation et erreurs conservées. Les résultats se remplacent à réception sans écran de chargement intermédiaire.
- Agenda : colonne Total avec contour propre et espace de 14 px desktop / 8 px mobile, tout en conservant les hauteurs communes de semaine via le slot partagé. Retrait du cadre de défilement extérieur qui reliait les deux zones. Le calendrier général reste inchangé ; aucun second calendrier ni calcul de hauteur ajouté.
- Vérifications : lint/TypeScript et 385 tests Vitest/83 fichiers réussis ; build complet puis compilation Vite finale après la retouche du cadre réussis (avertissement de taille de chunk existant). Chromium Calendrier + TimeReport : 6 tests réussis (36,0 s), dont réponse réseau volontairement retenue, compteurs surveillés par MutationObserver, tableau toujours monté et espacement/alignement des totaux. Recette finale TimeReport après retrait du cadre extérieur : 2 tests réussis (26,0 s). Captures clair/sombre/mobile examinées ; le parcours conserve la référence Contacts. `git diff --check` réussi. Aucun test serveur dédié rejoué pour ces seuls changements frontend, aucune recette de session réelle NAS effectuée.
- Contrats 04/07/09 actualisés. H03 reste En cours, compteurs globaux inchangés ; restent recette utilisateur/NAS frontend, Planning et raccordement PROD OnSite. Livraison locale, non commit/push. Aucun hook, schéma ou migration modifié par cette intervention ; aucun nouveau pack ni redémarrage PocketBase nécessaire. Frontend à jour requis, installation/déploiement NAS non effectué.

### 18 octobre 2026 — H03 : proposition de raccordement des heures OnSite

- Investigation : relecture du contrat d’intégration et du snapshot OnSite `05a44be98d3630039e9c73375e1629cbd0e3b65f`, notamment projection, modification et suppression des time_logs. Les codes affaire et noms client peuvent être des chaînes, pas des relations Horizon. Le statut completed ne prouve pas une validation manager. Aucun accès à la base distante ni vérification de son schéma réel.
- Proposition à discuter, non implémentée : OnSite conserve la saisie PROD ; adaptateur serveur en lecture, rapprochements explicites employés/analytique/services et identifiants externes Core. Synchronisation incrémentale idempotente, rapprochement périodique des corrections/suppressions, anomalies visibles et première reprise simulée. Agrégation quotidienne avec provenance des pointages ; validation manager dans Horizon recommandée, à confirmer. Correction après validation traitée explicitement, sans réécriture silencieuse du réel valorisé. Planning distinct des heures réalisées.
- Vérifications : lecture des sources et documentation seulement ; aucun test applicatif exécuté pour cette proposition. Restent à confirmer pauses, fuseau, nuits et circuit de validation, puis accès de lecture dédié et échantillon réel. H03 reste En cours, compteurs inchangés. Livraison : proposition/documentation locale, non commit/push ; aucun code applicatif, pack, migration ou déploiement NAS dans cette intervention.

### 18 octobre 2026 — H03 : fil d’activité sous la feuille de temps

- Harmonisation demandée : retrait de l’onglet Fil d’activité ; ActivityPanel partagé directement sous la grille, les totaux et messages de saisie d’une feuille enregistrée, comme Contacts et Notes de frais. Grille et historique visibles simultanément. Aucun changement des droits, du contenu des événements ni du comportement de saisie ; une semaine non enregistrée reste sans fil. Règle durable ajoutée au contrat UX 07.
- Vérifications : lint et TypeScript réussis ; parcours Chromium TimeReport, 2 tests réussis (25,9 s), incluant absence d’onglet, présence simultanée grille/fil, ordre du DOM et événement de validation accessible directement. Captures clair/sombre/mobile examinées, absence de débordement global mobile vérifiée ; composant comparé aux intégrations Contacts/Notes de frais existantes. Première tentative des serveurs locaux refusée par le bac à sable ; relance autorisée réussie. Aucun test serveur dédié nécessaire pour ce déplacement frontend ; aucune recette NAS réelle effectuée.
- Livraison : locale, non commit/push ; aucun hook, schéma ou migration modifié, aucun nouveau pack PocketBase nécessaire. H03 reste En cours, compteurs inchangés ; restent recette utilisateur et raccordements Planning/OnSite déjà identifiés.

### 18 octobre 2026 — UX : recherche du réglage d’espacement du fil d’activité

- Investigation : Paramètres → Apparence et densité contient les couleurs du fil, mais aucun réglage dédié à ses marges. ActivityPanel utilise actuellement une marge haute fixe de 32 px desktop / 24 px mobile et un padding bas de 12 px / 8 px ; le réglage général Entre les sections ne pilote pas ces valeurs.
- Vérifications : lecture des paramètres UX, de leur schéma et des styles partagés uniquement ; aucun changement applicatif ni test exécuté. Reste à préciser l’espacement attendu puis exposer un réglage partagé si demandé. Livraison : constat documenté localement, non commit/push ; aucun pack, migration ou déploiement. Statuts et compteurs inchangés.

### 18 octobre 2026 — UX : paramètre commun d’espace au-dessus des fils

- Résultat local : Paramètres → Apparence et densité → Général → Espacements et cadres, « Espace au-dessus du fil d’activité », entier 0–128 px (défaut 32). Token commun sur tous les ActivityPanel de fiche, même valeur desktop/mobile et clair/sombre, sans surcharge mobile fixe. Aperçu de réglages réutilisant le cadre ActivityPanelFrame extrait du vrai composant ; contenu métier, permissions et requêtes du fil inchangés.
- Données : extension additive settings_ux.config.activity_gap via 1791840034_ux_activity_gap.js, valeur existante et autres préférences conservées. Schéma frontend compatible avec anciennes réponses par défaut 32 ; validation serveur, audit et verrou de concurrence existants maintenus. Contrats 05/07 et installation 06 actualisés.
- Vérifications : lint/TypeScript/build réussis, 10 tests Vitest UX, 10 tests PocketBase UX (29,841 s), 8 tests Chromium UX/TimeReport (52,6 s). Bornes dont zéro, persistance/rechargement, migration rejouée sans perte, aperçu à 0/48 px et fiche Contacts en sombre/mobile, parcours TimeReport et droits existants vérifiés. Captures examinées ; avertissement de taille de chunk préexistant, aucune recette NAS. `git diff --check` réussi. Pas de nouvelle connexion ni donnée utilisateur réelle modifiée.
- Livraison : locale, non commit/push ; pack cumulatif `/private/tmp/horizon-pocketbase-espace-fil-20261018.zip`, 296 fichiers source / 298 entrées, 1 058 482 octets, SHA-256 `9ef2d11989ae921c8d2fad2a9da69f596d257cbbfa0658d968e571c5f5f51f1d`. ZIP, manifeste/hachages et migrations précédentes inchangées vérifiés. Hooks complets + migration 0034, redémarrage PocketBase et frontend à jour requis ; installation NAS non effectuée ni confirmée. Statuts et compteurs globaux inchangés ; reste recette utilisateur/NAS.

### 18 octobre 2026 — UX : couleur des bordures des zones

- Résultat local : Paramètres → Apparence et densité → Général → Espacements et cadres, « Bordures des zones · clair / sombre ». Deux couleurs avec HColorField, aperçu sur les vrais cadres partagés contact-panel, application aux fiches utilisatrices et au cadre de relations Contacts. Token sémantique dédié distinct des champs/tableaux/filtres ; aucune modification d’épaisseur, arrondi ou droits métier.
- Données : migration additive 1791840035_ux_panel_borders.js, deux clés settings_ux.config.panel_border_light/dark #RRGGBB (défauts #DCE5EF/#364860). Anciennes préférences et valeurs déjà présentes préservées ; validation serveur en allowlist, audit et verrou updated existants. Contrats 05/07, installation 06 et vérifications 09 actualisés.
- Vérifications : lint, TypeScript, build et 11 tests Vitest UX réussis ; 11 tests PocketBase UX (33,439 s), bornes/couleurs, persistance, compatibilité et migration rejouée sans perte. Chromium UX : 7 tests réussis (34,7 s), aperçu isolé clair/sombre, rechargement/sauvegarde/restauration, cadres de fiche Contacts et mobile, distinction avec bordures de champs/tableaux. Captures examinées ; `git diff --check` réussi. Avertissement de taille de chunk existant. Aucune recette ni modification des données réelles NAS.
- Livraison locale, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-bordures-zones-20261018.zip`, 297 fichiers source / 299 entrées, 1 059 068 octets, SHA-256 `a1e0bb161d74e81b36a22477cf3b95ce2121eb41a64aefd568999ab4a6ee11b7`. ZIP/manifeste/hachages vérifiés, anciennes migrations identiques au pack espace-fil. Ce pack inclut 0034 et 0035 : une seule installation pour espacement du fil et couleurs des zones. Hooks complets + migrations, redémarrage PocketBase et frontend à jour requis ; installation NAS non effectuée ni confirmée. Statuts/compteurs inchangés ; reste recette utilisateur/NAS.

### 18 octobre 2026 — UX : passe de complétude Cartes, Recherche, Champs et Zones

- Résultat local : 48 réglages ajoutés aux composants partagés. Onglet Cartes pour annuaires (largeur/hauteur minimales, padding, espacement, arrondi, titre), synthèses (padding, espacement, arrondi, valeurs) et aspect clair/sombre/survol. Onglet Recherche regroupant largeur existante et hauteur/texte/arrondi/marges, fond/texte/bordure/indication/focus, contexte et densité des résultats. Champs et textes : arrondi et couleurs de fond/bordure/texte ; Général : fond des zones. Regroupements conservés par composant, nouvelles rubriques de recherche signalées dans la navigation Paramètres. Accents sémantiques des icônes/états préservés ; aucune configuration métier propre aux modules ajoutée.
- Réutilisation : aperçu avec HDirectoryCard/HSummaryCards et cadres HWorkspaceSearchField/HSearchResult extraits de la recherche réelle, sans logique métier copiée. Réglages applicables aux composants communs des pages ; suppression de deux anciennes surcharges de couleur/arrondi de champs sur les fiches qui écrasaient le réglage. Cartes adaptatives, hauteur tenant compte du padding, recherche mobile contenue ; modifications locales non appliquées globalement avant sauvegarde et conservées entre onglets.
- Données/sécurité : 1791840036_ux_cards_search_fields.js complète uniquement les clés absentes de settings_ux.config ; anciennes préférences, droits, audit et verrou updated conservés. Dimensions entières bornées, couleurs #RRGGBB en allowlist ; aucun CSS/secret libre, nouvelle collection ou dépendance. Contrats 05/07 et installation 06 actualisés. Ligne des travaux actifs Apparence actualisée ; statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript/build et 388 tests Vitest/83 fichiers réussis. 12 tests PocketBase UX (36,490 s), dont bornes, couleurs, persistance, migration rejouée sans perte et limite JSON 10 Ko. Chromium final : 11 tests UX + Employés/accès + TimeReport réussis (1,3 min), dont modification concurrente, aperçu/draft entre onglets, rechargement, application sur Contacts et synthèses Achats, recherche contextuelle/globale réelle, droits/photos RH et parcours TimeReport. Captures clair/sombre/mobile examinées ; contrôle des dimensions raccordées et `git diff --check` réussis. Essais intermédiaires : attente de changement d’onglet précisée dans le test et surcharges CSS de champs corrigées ; relance finale sans édition des sources pendant les tests réussie. Avertissement de taille de chunk existant ; aucune recette ni donnée réelle NAS modifiée.
- Livraison locale, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-ux-cartes-recherche-20261018.zip`, 298 fichiers source / 300 entrées, 1 060 207 octets, SHA-256 `1b9377aba34d575fa9d6b95f9357acaafe49f8385ef710c602b46f58dded5505`. ZIP/manifeste/hachages et anciennes migrations inchangées vérifiés. Inclut les réglages précédents d’espace du fil et de bordures de zones : une seule installation. Hooks complets + migrations jusqu’à 0036, redémarrage PocketBase et frontend à jour requis ; installation NAS non effectuée ni confirmée. Reste recette utilisateur/NAS.

### 18 octobre 2026 — Dashboard : signification du badge Équipe de l’activité

- Investigation à la demande utilisateur : le badge Équipe est un libellé fixe dans DashboardFeeds. La route dashboard/activity réutilise activity-feed.overview, vue team par défaut, qui renvoie six événements récents de sources autorisées. Ce libellé distingue l’activité collective de Mon activité ; il ne représente pas un filtre sur l’équipe RH de l’utilisateur. Permissions des sources vérifiées côté serveur.
- Constat : libellé ambigu sur le dashboard ; recommandation de garder Activité récente sans badge Équipe. Aucune modification applicative décidée ou réalisée pour cette question. Vérifications : lecture du composant, repository/service et projection serveur ; aucun test exécuté, aucune donnée réelle consultée. Livraison : investigation documentée localement, non commit/push ; aucun pack, migration ou déploiement. Statuts et compteurs inchangés.

### 18 octobre 2026 — Dashboard : activité liée au compte connecté

- Résultat local : widget Mon activité récente, sans badge Équipe, limité côté serveur aux six derniers événements dont le compte est auteur, mentionné ou attributaire actuel de la tâche. La simple permission de lire une fiche ne suffit plus à inclure ses événements. Lien Voir toute mon activité vers `/activity?view=own`, même définition personnelle sur la page Activité ; vue Équipe collective conservée séparément. Dépôts GED personnels toujours présents. Aucun changement des permissions des sources ni de leur historique.
- Sécurité : périmètre du résumé imposé par le serveur, y compris si une query view=team est fournie ; source encore accessible/existante obligatoire. Lecture défensive des mentions historiques ; aucune nouvelle collection, migration ou permission. Contrats 04/07 et installation 06 actualisés.
- Vérifications : lint/TypeScript/build réussis ; 17 tests PocketBase Activity (48,323 s) + 4 Dashboard (11,750 s), complétés par régression personnelle finale (1 test, 3,094 s). Auteur/mention/tâche, exclusion d’événements non liés plus récents, absence de doublon, vue collective, retrait des droits, modules et source supprimée couverts. Chromium Dashboard/Activité/GED final : 4 tests réussis (31,0 s), captures clair/sombre/mobile examinées. Un premier essai du carrousel utilisait encore le libellé Afficher Commandes ; test adapté au libellé actuel Afficher Commandes clients, parcours final réussi. `git diff --check` réussi ; avertissement de taille de chunk préexistant. Aucune recette ou donnée réelle NAS modifiée.
- Livraison locale, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-activite-personnelle-20261018.zip`, 298 fichiers source / 300 entrées, 1 060 322 octets, SHA-256 `3a0425bd2a194097789cdd79597649c7500f15f533557ba86a1bc57136bf4a6d`. ZIP/manifeste/hachages et anciennes migrations identiques au pack UX vérifiés. Hooks complets + redémarrage PocketBase et frontend à jour requis ; aucune migration supplémentaire après 0036. Installation NAS non effectuée ni confirmée. Statuts et compteurs inchangés ; reste recette utilisateur/NAS.

### 18 octobre 2026 — H03 : harmonisation du tableau des lignes de temps

- Résultat local : typo/couleurs et densité du tableau partagé, codes d’imputation en graisse modérée, libellés/références sur deux lignes compactes, heures tabulaires centrées avec padding symétrique et couleur de cellule. Largeurs Imputation/Activité/Total/Actions rééquilibrées ; # et Actions centrés, Total aligné à droite. Le jour courant utilise sheet.today (référence serveur Europe/Paris).
- Consultation : durées en texte plutôt qu’inputs désactivés, colonne Actions et commentaires vides retirés ; les commentaires existants restent consultables. Colonne Actions conservée pendant la sauvegarde d’un brouillon, boutons contenus dans leur cellule. Pied des totaux homogène, trait fin de séparation et coins inférieurs fermés sans double bordure ; aucune fixation verticale du pied, libellé ancré horizontalement sur les deux colonnes d’identification en scroll mobile. Édition, contraintes serveur, ordonnancement et données métier inchangés. Contrat UX 07 actualisé.
- Vérifications : lint/TypeScript/build réussis, puis lint ciblé et compilation Vite finale ; Chromium TimeReport final, 2 tests réussis (26,0 s). Comparaison des en-têtes avec Contacts, ligne ≤38 px par défaut, couleurs/centrage des durées, actions contenues, alignement du total, pied/colonnes fixes en scroll, consultation sans inputs ni Actions, parcours de saisie/clavier/commentaires/DnD/enregistrement/validation/conflits/droits couverts. Captures clair/sombre/mobile examinées. Essai initial adapté : l’ancienne assertion input disabled après soumission devient une valeur textuelle non éditable. `git diff --check` réussi. Aucune suite serveur rejouée pour ces changements frontend ; aucune recette ni donnée réelle NAS modifiée, avertissement de taille de chunk préexistant.
- Livraison locale, non commit/push ; aucun hook, schéma ou migration modifié, aucun nouveau pack ni redémarrage PocketBase nécessaire pour cet ajustement. Frontend à jour requis. H03 reste En cours, compteurs inchangés ; reste recette utilisateur.

### 18 octobre 2026 — H03 : titre de section des lignes, sans faux onglet

- Correction demandée : remplacement du HRecordTabs isolé Lignes de temps par HSectionHeading dans h-record-lines, comme les lignes de dépenses. Titre standard, compteur entre parenthèses, actions à droite et repli mobile ; retrait du rôle tabpanel et du soulignement de sélection. Navigation Mes temps/Équipe et fil sous les lignes conservés. Règle précédente du contrat UX 07 corrigée pour ne plus prescrire cet onglet.
- Vérifications : ESLint ciblé et TypeScript réussis ; Chromium TimeReport, 2 tests réussis (26,3 s), dont absence d’onglet Lignes de temps, titre unique avec compteur et parcours de saisie/validation/DnD/conflit/droits. Captures clair/sombre/mobile examinées ; `git diff --check` réussi. Aucun test serveur ou build complet rejoué pour ce changement de présentation ; aucune recette NAS réelle.
- Livraison locale, non commit/push ; aucun hook, schéma ou migration changé, aucun pack/redémarrage PocketBase nécessaire. Frontend à jour requis. H03 et compteurs inchangés ; reste recette utilisateur.

### 18 octobre 2026 — H03 : en-têtes communs et retrait de l’aide

- Correction locale : pictogramme d’aide retiré des actions Lignes de temps. Jour et date sur une seule ligne dans les en-têtes ; retrait du padding local des th et du fond week-end/férié des en-têtes pour reprendre le style HDataTable. Distinction neutre des jours non ouvrés dans le corps et repère du jour courant conservés. Contrat UX 07 actualisé.
- Vérifications : ESLint ciblé et TypeScript réussis ; Chromium TimeReport, 2 tests réussis (26,3 s). Régression comparant chaque en-tête avec Contacts : fond, taille, graisse et padding, ainsi que jour/date et absence d’aide. Captures clair/sombre/mobile examinées ; parcours de saisie/validation conservé. Aucun test serveur ou build complet rejoué pour ce changement frontend ; aucune recette NAS.
- Livraison locale, non commit/push ; aucun hook, migration ni nouveau pack PocketBase nécessaire. Frontend à jour requis. Statuts et compteurs inchangés ; reste recette utilisateur.

### 18 octobre 2026 — H03 : contraste week-end et alternance des lignes

- Ajustement local : fond des cellules non ouvrées légèrement renforcé et mélangé au fond pair/impair de la ligne. Le week-end se distingue des jours ouvrés tout en conservant le zébrage entre deux lignes ; neutres des thèmes Horizon et en-têtes partagés conservés. Contrat UX 07 actualisé.
- Vérifications : ESLint ciblé, TypeScript et Chromium TimeReport réussis (2 tests, 26,4 s), régression sur les quatre fonds distincts en clair et sombre ; captures des deux lignes examinées dans les deux thèmes, parcours mobile existant conservé. Aucun build complet ou test serveur rejoué pour ce CSS ; aucune recette NAS.
- Livraison locale, non commit/push ; aucun hook, schéma ni pack PocketBase supplémentaire. Reste recette utilisateur avec frontend à jour. Statuts et compteurs inchangés.


### 18 octobre 2026 — UX : contrôle transversal du clignotement des cartes

- Cause identifiée : les nouvelles clés de requête vidaient provisoirement listes et synthèses lors des filtres par cartes. Correction mutualisée keepPreviousListData, reprise par TimeReport et appliquée à Notes de frais, Congés, factures clients/fournisseurs, achats DA/BC/vue générale, produits, stock, ventes et annuaires Contacts ; résumé Ventes conservé pendant ses propres critères. Résultats maintenus pendant filtre/tri/page, aria-busy et pagination occupée ; aucun remplacement par un chargement initial. Contacts n’ajoute plus son paragraphe de chargement à chaque actualisation, et sa bascule automatique attend les données réelles.
- Limites de conservation explicites : type de document, personnel/manager et période structurante restent séparés. Aucune conservation globale sur les fiches métier, aucune modification des droits ou requêtes serveur. Audit des autres cartes : synthèses Contacts et dashboards à clés fixes conservent déjà les données en actualisation ; cartes de navigation vers un autre espace et soldes de congés gardent leur fonctionnement normal. Contrat UX 07 et ligne des travaux actifs Recherche/filtres actualisés ; statuts/compteurs inchangés.
- Vérifications : lint complet, TypeScript et build réussis (avertissement de chunk préexistant) ; 2 tests unitaires de conservation/changement de périmètre. Chromium : contrôle transversal final sur dix listes avec réponse réseau retenue, cartes toujours montées, compteurs stables, tableau conservé lorsqu’il existe, absence d’indicateur initial ; passage Mes notes/À valider sans réutiliser le périmètre précédent (1 test, 13,2 s). Parcours complet Notes de frais réussi (15,5 s), 2 TimeReport réussis (20,1 + 1,3 s), 2 régressions Contacts recherche automatique/cartes réussies (9,8 s). Premier test transversal corrigé : il attendait un tableau absent sur une liste vide ; relance réussie. Capture Notes de frais pendant le filtre examinée ; parcours existants TimeReport/Notes de frais incluent sombre et mobile, pas de nouvelle comparaison visuelle de chaque liste dans ces formats. Aucun test serveur supplémentaire ni donnée réelle NAS modifiée. git diff --check réussi.
- Livraison locale, non commit/push ; frontend à jour requis, aucun hook, schéma, migration ou pack PocketBase supplémentaire pour cette correction. Reste recette utilisateur sur les données réelles.

### 18 octobre 2026 — Publication Git : TimeReport BE et ajustements UX

- Périmètre publié : TimeReport BE et migrations 0030–0033, éligibilité équipes/employés, classification des services, calendrier et analytique, paramètres UX partagés 0034–0036, activité personnelle du dashboard et correctifs de présentation/chargement des cartes. Intégration PROD OnSite toujours différée. Les limites et recettes restantes des interventions précédentes restent applicables ; statuts et compteurs inchangés.
- Vérifications finales : pnpm check réussi (lint, TypeScript, 390 tests Vitest / 84 fichiers, build). git diff --check réussi ; branche main sans divergence avec origin/main avant publication. Parcours Chromium et tests PocketBase ciblés consignés dans les entrées précédentes ; aucune suite backend complète rejouée pour cette publication. Avertissement de taille de chunk préexistant.
- Livraison Git : commit du lot et push sur origin/main dans cette intervention ; aucun déploiement NAS ni nouveau pack généré par le push. Le pack PocketBase cumulatif Activité personnelle remis précédemment et le frontend doivent rester cohérents ; installation NAS de ce pack non confirmée. Reste recette utilisateur/NAS et poursuite des lots ouverts.

### 18 octobre 2026 — UX : affichage et ordre des colonnes de consultation

- Résultat local : HDataTable expose un bouton SlidersHorizontal dans le dernier en-tête, panneau partagé de visibilité, déplacement souris/clavier et restauration. Première colonne d’identification et colonnes déclarées requises conservées visibles/fixes ; tri, liens de lignes, alignements, largeurs et critères existants conservés. Le panneau reste ouvert si la dernière colonne disparaît et reste contenu sur mobile. Activation sur Contacts Sociétés/Personnes, CRM/AO, Ventes, DA/BC/vue Achats, factures/avoirs, produits, stock disponible, opérations/inventaires en liste, employés/équipes, notes de frais et congés.
- Persistance : préférence locale versionnée par compte et tableau, synchronisation des groupes et onglets du navigateur, ajout sûr des nouvelles colonnes et retrait des identifiants obsolètes. Un lecteur peut personnaliser son affichage ; aucun droit de données modifié. Stockage corrompu ou indisponible signalé sans bloquer la consultation. Pas de synchronisation entre appareils. Composants partagés Radix et HSortableRows réutilisés, aucune dépendance ni API/collection ajoutée. Les tableaux natifs de Paramètres, matrices calendaires et listes embarquées restent hors de cette première passe ; tableaux de saisie et documents non modifiés. Contrats 07/09 et travaux actifs Recherche/filtres actualisés, statuts et compteurs inchangés.
- Vérifications : pnpm check réussi, lint/TypeScript/build et 394 tests Vitest / 85 fichiers. Chromium final : 5 tests réussis (31,7 s), dont souris/clavier, masquage/restauration, ordre après rechargement, tri URL, deux groupes synchronisés, isolation entre comptes et lecture seule, stockage invalide/refusé, cadre BC vide/rempli, filtres Stock et synthèses par cartes. Captures clair/sombre/mobile examinées ; assertion du panneau entièrement contenu à 390 px. Itérations : poignée commune et activation souris explicite dans le test, séquence clavier/souris vérifiée avec un ordre personnalisé persistant, placement mobile corrigé via sticky always. git diff --check réussi. Avertissement de chunk préexistant ; aucun test backend supplémentaire ni recette sur données NAS réelles.
- Livraison locale, non commit/push ; frontend à jour requis, aucun pack ou redémarrage PocketBase nécessaire. Reste recette utilisateur de cette première passe ; extensions aux tableaux spécifiques à décider ensuite.

### 18 octobre 2026 — UX : colonnes sauvegardées sur le compte, entre navigateurs

- Correction demandée : les préférences de colonnes sont désormais privées et persistées dans PocketBase par utilisateur/tableau, avec relecture au montage/retour dans l’application. Le cache partagé conserve les groupes cohérents ; affichage optimiste immédiat sans remontage du panneau pendant la sauvegarde, puis retour à la version précédente et action Recharger en cas d’échec. La préférence locale v1 est reprise seulement si le serveur n’a aucun enregistrement, et supprimée après sauvegarde ; une restauration explicite reste persistée et prioritaire sur toute ancienne préférence locale.
- Données et sécurité : migration additive 1791840037_table_preferences.js, core_table_preferences, index unique user/table_key, règles REST verrouillées, routes GET/POST privées avec compte/rôle actifs et permission de lecture du module. Propriétaire imposé depuis la session, contexte et champs autorisés, JSON/identifiants bornés, transaction/révision et audit. Un conflit 409 n’écrase pas le choix distant. Accès possible aux lecteurs pour leur seul affichage, sans droit d’écriture métier. UI → Service → Repository → PocketBase ; aucun secret, dépendance ou conteneur ajouté. Contrats 04/05/06/07/09 et travaux actifs Recherche/filtres actualisés ; statuts/compteurs inchangés.
- Vérifications : pnpm check réussi (lint/TypeScript/build, 396 tests Vitest / 86 fichiers). 4 tests PocketBase réussis (12,264 s) : reconstruction depuis migrations, propriétaire, refus REST direct, compte désactivé/droit absent, validation, audit, deux écritures concurrentes 200/409, défauts/restauration et persistance après redémarrage. Chromium final : 6 tests réussis (36,8 s), dont contexte navigateur vierge sans stockage local retrouvant le même compte, comptes distincts/lecteur, reprise locale unique, serveur prioritaire, conflit réel sans écrasement, restauration non annulée par un ancien cache, panne 503/retour/rechargement, clavier/souris, groupes, clair/sombre/mobile, cadres BC et filtres Stock/cartes. Captures examinées, git diff --check réussi. Itérations : assertion du REST verrouillé ajustée à 403, état optimiste local immédiat et maintien du fournisseur de drag pour éviter le remontage pendant une requête, tests attendant la fin de sauvegarde avant une nouvelle opération ; scénarios d’erreur vérifient le retour arrière. Avertissement de chunk préexistant et ResourceWarning Python de fixture sur les réponses HTTP attendues. Aucune recette NAS réelle ni suite backend complète exécutée.
- Livraison locale, non commit/push. Pack cumulatif `/private/tmp/horizon-pocketbase-colonnes-compte-20261018.zip`, 301 fichiers source / 303 entrées, 1 063 001 octets, SHA-256 `b0c51e87916400073f196a435cf3a9811597584ff28604a643d45d935f85e029`. ZIP/manifeste/hachages et anciennes migrations identiques au pack Activité personnelle vérifiés. Hooks complets + migrations jusqu’à 0037, redémarrage PocketBase et frontend cohérent requis ; installation NAS non effectuée ni confirmée. Reste installation/recette utilisateur sur deux navigateurs réels.


### 18 octobre 2026 — UX : colonnes obligatoires déplaçables et champs complémentaires

- Résultat : visibilité obligatoire dissociée de l’ordre sur HDataTable/HTableColumns ; libellé « Obligatoire », poignées actives pour toutes les colonnes. Style de l’identité attaché à son identifiant. Colonnes métier supplémentaires dans toutes les listes de consultation déjà équipées, masquées par défaut, choix explicites conservés et restauration cohérente. Contrat dans [le Design System](07-UX-DESIGN-SYSTEM.md#colonnes-des-tableaux-de-consultation--18-octobre-2026).
- Vérifications : pnpm check réussi (lint, TypeScript, 397 tests Vitest/86 fichiers, build ; avertissement de taille de chunk préexistant). Chromium : régressions Achats/Stock/filtres par cartes réussies ; trois parcours de préférences réussis (identité déplacée, ajout de TVA, groupes, sauvegarde entre navigateurs, erreurs/conflits/reprise locale), puis parcours complémentaire réussi sur quinze vues de consultation. Captures clair/sombre/mobile du panneau Contacts examinées. Les premiers essais ont demandé de rétablir l’ordre par l’action dédiée avant de poursuivre le scénario, puis de créer une personne de test pour la liste vide. Aucun changement serveur, suite serveur non rejouée ; Congés/Notes de frais non parcourus avec données réelles pour cette extension.
- Livraison : modifications locales, sans commit/push ni nouveau pack. Le pack PocketBase 0037 déjà remis reste nécessaire à la sauvegarde sur le compte, installation NAS non confirmée. Pas de nouvelle migration ni de modification des API métier. Prochaine action : recette utilisateur des choix de colonnes ; tableaux de saisie et matrices restent hors périmètre.


### 18 octobre 2026 — Paramètres : colonnes proposées réservées aux administrateurs

- Résultat : nouvelle page Personnalisation → Colonnes des tableaux pour choisir les colonnes disponibles par liste. Écriture réservée aux profils Admin/Superuser avec settings.references, contrôlée côté serveur ; droits des utilisateurs limités à leur préférence personnelle. Politique commune appliquée aux affichages existants sans effacer leurs choix. Colonnes obligatoires protégées, révision/audit, cache partagé et lecture sans clignotement des colonnes retirées. Migration additive 0038, catalogue de colonnes client/serveur commun. Contrats mis à jour dans les documents 04/05/06/07.
- Vérifications : pnpm check réussi (400 tests/87 fichiers, lint/TypeScript/build), lint/TypeScript ciblés et build final ; 3 tests PocketBase réussis (8,602 s), migration rejouée et redémarrage réel du serveur jetable, refus non-admin même avec grant et REST verrouillé, validation/concurrence/audit. Chromium final 8 tests réussis (54,3 s), puis recette administrateur isolée réussie (11,3 s) avec comparaison des tableaux Séquences. Captures clair/sombre/mobile examinées. Premiers essais de fixtures ajustés au format de code de rôle, au JSON vide autorisé pour Tout proposer et au rôle accessible combobox du test. Avertissement de chunk préexistant ; aucune recette NAS.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-colonnes-parametres-20261018.zip](/private/tmp/horizon-pocketbase-colonnes-parametres-20261018.zip) préparé et vérifié (305 sources/307 entrées ; anciennes migrations et manifeste contrôlés), remplace le pack colonnes-compte pour cette livraison. Installation NAS non confirmée. Prochaine action : installer les hooks complets et migrations puis redémarrer PocketBase, recette utilisateur du choix des colonnes. Aucun statut de lot clôturé ni compteur modifié.


### 18 octobre 2026 — UX : espacement des réglages et largeur des colonnes ajoutées

- Résultat : séparation du sélecteur et du titre de tableau par le token partagé de section. HDataTable configurable répartit la largeur disponible en mise en page automatique, replie les textes complets, garde les montants insécables et conserve des minimums lisibles pour en-têtes/identité. Défilement interne quand l’écran est trop étroit ; aucune compression du nom caractère par caractère sur mobile. Alignements monétaires Produits/Disponibilités et numéros/dates des opérations harmonisés. Grilles de saisie et matrices inchangées. Contrat actualisé dans le document 07.
- Vérifications : pnpm check réussi (400 tests/87 fichiers, lint/TypeScript/build), puis lint ciblé et build final ; neuf tests Chromium réussis (1,0 min), dont treize colonnes Contacts, rectangles de texte contenus, valeur monétaire élevée entière, opérations redimensionnables enrichies, écart ≥12 px dans les paramètres, ainsi que les régressions de préférences/administration/Achats/Stock/cartes. Captures clair/sombre/mobile examinées ; les essais visuels ont conduit à conserver des minimums de 64/140 px pour éviter les colonnes trop étroites. Fixtures Stock/Opérations simulées, aucune donnée métier réelle modifiée. Aucun test backend rejoué, aucune modification serveur ; avertissement de chunk existant.
- Livraison : locale, sans commit/push, sans nouvelle migration ni nouveau pack PocketBase. Le pack colonnes-parametres 0038 déjà remis reste celui du lot précédent ; installation NAS non confirmée. Prochaine action : recette utilisateur sur les tableaux usuels et les colonnes choisies. Statuts/compteurs de lots inchangés.


### 18 octobre 2026 — UX : rétablir le redimensionnement des listes de consultation

- Résultat : poignées par défaut sur les listes configurables, au lieu d’un opt-in local oublié sur plusieurs pages. Répartition automatique initiale puis largeurs manuelles en colgroup, budget constant et tassement dans les deux sens. Calcul commun extrait des devis vers shared, API et comportement des devis conservés. Protection du contenu monétaire par mesure réelle, minimums, focus clavier sans remonter le bouton, double-clic sans sauvegarde d’un clic immobile. Largeurs par compte avec contrôle serveur, erreur visible hors popup et rollback. Préférences de colonnes masquées/réordonnées conservées. Contrats 04/05/06/07 actualisés ; aucune nouvelle migration.
- Vérifications : pnpm check réussi (404 tests/88 fichiers, lint/TypeScript/build) ; 5 tests PocketBase réussis (15,801 s), compatibilité/validation/relecture après redémarrage et sécurité/concurrence. Chromium : 12 parcours réussis ; audit tri/cadres rejoué avec succès (41,4 s) après précision des sélecteurs de boutons, puis 2 parcours ciblés finaux réussis (16,8 s), notamment montant élevé protégé, tassement, souris/clavier, focus, double-clic, erreur 503 récupérable, navigateur vierge et disponibilité des poignées dans les autres listes. Captures clair/sombre/mobile examinées. Premier essai a révélé qu’un clic immobile déclenchait une sauvegarde avant le double-clic, corrigé ; aucune erreur finale connue. Avertissement de chunk préexistant, aucune recette NAS.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-colonnes-redimensionnement-20261018.zip](/private/tmp/horizon-pocketbase-colonnes-redimensionnement-20261018.zip) préparé (305 sources/307 entrées, manifeste/ZIP et anciennes migrations jusqu’à 0038 vérifiés). Installation NAS non confirmée. Prochaine action : mise à jour des hooks, redémarrage puis recette utilisateur des gestes sur les listes usuelles. Aucun lot clôturé ni compteur changé.


### 18 octobre 2026 — Git : préparation de publication des colonnes personnalisables

- Périmètre : préférences privées de colonnes, choix des colonnes proposées dans Paramètres, ajustement du rendu et redimensionnement partagé avec sauvegarde des largeurs ; migrations 0037/0038 et documentation/tests associés. Publication demandée par l’utilisateur sur main.
- Vérifications : état Git et diff contrôlés, git diff --check sans erreur. Reprise des vérifications déjà exécutées sur ce lot : pnpm check (404 tests/88 fichiers, lint/TypeScript/build), tests PocketBase des politiques/préférences et parcours Chromium, dont redimensionnement, devis, tri, panne récupérable et navigateur vierge. Aucun code fonctionnel changé pour cette opération Git, tests non relancés sans nouveau motif.
- Livraison : commit e288936 publié sur origin/main (cre4tixdev/horizon-codex). Après un premier refus automatique pour destination non vérifiée, le connecteur GitHub a confirmé que le compte connecté possède le dépôt avec les droits administrateur ; le push Git a ensuite réussi. Pack PocketBase colonnes-redimensionnement déjà préparé, installation NAS non confirmée. Les tests et le push Git ne valent pas déploiement NAS ; prochaine action : installation/recette du pack. Statuts et compteurs de lots inchangés.


### 18 octobre 2026 — Factures : mention d’acompte au-dessus des lignes

- Résultat : objet « Acompte N % · commande(s) » affiché par HSectionHeading au-dessus du tableau, désignations originales dans les lignes. Réutilisation du champ title, sans nouvelle collection/migration ; anciens brouillons à préfixe commun présentés sans répétition et normalisés à sauvegarde/validation. Nouveaux snapshots avec mention globale dans le contexte documentaire ; anciens snapshots validés non réécrits. Quantités proportionnelles, calculs et déductions conservés. Contrats 04/05/06/07/08 actualisés.
- Vérifications : pnpm check réussi (lint, TypeScript, 407 tests Vitest/89 fichiers, build ; avertissement de chunk préexistant). Suite PocketBase Billing : 20 tests réussis (60,799 s), dont préparation sans préfixe, ancien brouillon, validation, snapshot inchangé après consultation/aperçu, acompte/solde/avoirs et permissions existantes. Premier lancement bloqué par les ports locaux du sandbox, rejoué avec autorisation. Chromium : parcours dédié réussi (8,5 s), titre au-dessus du tableau, deux désignations intactes, aperçu, clair/sombre/mobile sans débordement de page ; captures examinées. PDF/Gotenberg réel et modèles personnalisés non recettés.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-acompte-entete-20261018.zip](/private/tmp/horizon-pocketbase-acompte-entete-20261018.zip) préparé et ZIP/manifeste vérifiés ; anciennes migrations jusqu’à 0038 inchangées. Installation NAS non confirmée. Prochaine action : remplacer les hooks complets, redémarrer PocketBase et recetter la facture d’acompte dans Horizon. Aucun lot clôturé ni compteur changé.


### 18 octobre 2026 — Factures : ligne de titre d’acompte et pourcentage modifiable

- Résultat : remplace la présentation précédente basée sur l’objet. Première ligne de grille en gras « Acompte de [N] % », taux numérique distinct et éditable en brouillon ; quantités de base originales visibles/verrouillées et montants recalculés par le normaliseur serveur. Route de calcul sans écriture, retour différé à la dernière saisie, sauvegarde/validation recontrôlées. Migration additive 0039 sur les quatre en-têtes Billing ; avoirs au taux source, proratas historiques conservés. Ancien brouillon converti uniquement si ratio commun, historiques validés inchangés. Ligne de titre dans les nouveaux documents, styles partagés et HLineAdditions mutualisé avec Devis/Commande. Avoir d’acompte en attente exclu des unités créditées normales pour les révisions. Contrats 04/05/06/07/08 et vérifications 09 actualisés.
- Vérifications : pnpm check final réussi (lint, TypeScript, 407 tests/89 fichiers, build ; avertissement de taille de chunk préexistant). Suite PocketBase Billing : 22 tests réussis (73,928 s), puis 2 régressions de révision réussies (6,616 s) et 3 contrôles finaux réussis (10,315 s) après protection des quantités/permissions : taux 0/101 refusés, recalcul sans écriture, relecture, sources, ancien brouillon et son aperçu, client/fournisseur, déductions/solde/avoirs et immutabilité. Chromium : 9 parcours Facturation/Devis/Commande réussis (1,2 min), puis parcours acompte final réussi (9,7 s) avec taux 30→40, rechargement, quantités verrouillées, note, aperçu, clair/sombre/mobile ; captures examinées. Premiers essais ont conduit à attendre le calcul du taux courant et à aligner le contrôle de graisse du PDF sur le 600 du renderer partagé. Aucun Gotenberg réel ni recette NAS pour ce lot.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-acomptes-pourcentage-20261018.zip](/private/tmp/horizon-pocketbase-acomptes-pourcentage-20261018.zip) préparé (307 sources/309 entrées), ZIP/manifeste vérifiés, anciennes migrations jusqu’à 0038 inchangées ; remplace le pack acompte-entete. Installation NAS non confirmée. Prochaine action : installer hooks complets et migration 0039, redémarrer et recetter un acompte. Aucun lot clôturé ni compteur modifié.


### 18 octobre 2026 — Factures : simplifier les titres et les ajouts

- Résultat : retrait du titre « Lignes de facturation » au-dessus de la grille ; seule la ligne structurelle d’acompte reste affichée. Barre partagée configurée avec Produit / Ligne / Note sur facture ordinaire et Note uniquement sur acompte ; aucun bouton Titre 1/2/3 ni Sous-titre. Devis/Commande conservent leurs actions existantes. Les lignes déjà enregistrées restent conservées. Contrats 04/07 actualisés.
- Vérifications : pnpm check réussi (lint, TypeScript, 407 tests/89 fichiers, build ; avertissement de chunk préexistant). Chromium : 3 parcours réussis (23,3 s), facture classique, acompte avec taux/relecture/aperçu et comparaison Devis/Commande ; assertions sur les actions exactes, absence de titre supplémentaire, ligne d’acompte unique. Captures clair/sombre/mobile examinées, défilement interne du tableau conservé sur mobile. Aucun changement serveur pour cette simplification, tests backend non rejoués.
- Livraison : locale, sans commit/push ; aucun nouveau pack ni migration. Le pack acomptes-pourcentage 0039 déjà préparé reste requis pour le lot précédent, installation NAS non confirmée. Prochaine action : recette utilisateur du visuel simplifié. Statuts et compteurs de lots inchangés.


### 18 octobre 2026 — Acompte : titre sobre dans la grille

- Résultat : suppression du trait rose de 2 px et de la couleur atténuée du libellé ; texte principal du thème, simple gras et bordure standard de cellule. Pourcentage modifiable conservé. Contrat UX 07 corrigé.
- Vérifications : lint réussi ; parcours Chromium acompte réussi (9,8 s), contrôle de la bordure identique aux autres lignes, taux/relecture/aperçu et clair/sombre/mobile. Captures clair/sombre examinées. Aucun calcul, schéma ou hook changé ; pas de nouvelle exécution backend ni de build pour cette correction CSS seule.
- Livraison : locale, sans commit/push ni nouveau pack. Pack 0039 précédent inchangé, installation NAS non confirmée. Prochaine action : recette utilisateur de cette présentation sobre. Statuts et compteurs inchangés.


### 19 octobre 2026 — Listes : nombre de résultats adapté à l’écran

- Résultat : pagination partagée Auto et 25/50/100 dans le breadcrumb. Mesure de la hauteur disponible et des lignes/rangées, largeur des cartes, taille bornée à 100, URL pour le choix manuel et critères conservés. Contacts sociétés/personnes, CRM/AO liste, Ventes, Achats, Factures/avoirs/règlements, Produits, Stock/opérations/inventaires liste, Notes de frais et demandes Congés raccordés. Hydratation des regroupements Contacts corrigée pour toute la page demandée. Tableaux maintenus pendant les requêtes ; mise en page mobile sans chevauchement. Contrats 04/06/07/09 actualisés.
- Vérifications : pnpm check final réussi (lint, TypeScript, 410 tests/90 fichiers, build ; avertissement de chunk préexistant). Suite PocketBase tri/pagination : 7 tests réussis (23,602 s), dont pages 50+11 disjointes et validation des tailles sur les routes métier. Chromium final : 2 parcours réussis (49,6 s), 90 sociétés, écran haut/bas, manuel/URL/rechargement, groupes, cartes, sombre/mobile et audit des listes principales ; captures examinées. Premiers essais : allowlist Stock complétée et scope Congés explicite dans la fixture ; hook de mesure ajusté pour la règle lint refs et tableau CRM conservé pendant l’ajustement après une mesure de test interrompue par son démontage. Annulations de requêtes de navigation journalisées côté client pendant les tests ; parcours finaux réussis. Pas de recette NAS ni de mesure de performance sur gros volumes réels.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-pagination-adaptative-20261019.zip](/private/tmp/horizon-pocketbase-pagination-adaptative-20261019.zip) préparé (308 sources/310 entrées), ZIP/manifeste vérifiés, anciennes migrations jusqu’à 0039 inchangées. Aucune nouvelle migration pour la pagination, installation NAS non confirmée. Prochaine action : mise à jour des hooks complets, redémarrage et recette sur les écrans usuels. Calendriers, Kanban, fils, grilles de saisie et listes intégrées hors périmètre ; statuts/compteurs de lots inchangés.


### 19 octobre 2026 — Publication des acomptes et de la pagination adaptative

- Résultat : changements des acomptes, actions de lignes partagées et pagination adaptative enregistrés dans `d570994` et poussés sur `origin/main` à la demande utilisateur.
- Vérifications : `git diff --check` réussi ; résultats existants revérifiés (lint, TypeScript, 410 tests unitaires et build, 7 tests PocketBase, 2 parcours Chromium). Aucune modification fonctionnelle après ces contrôles. Push confirmé par Git.
- Livraison : commit/push effectués ; pack pagination-adaptative cumulatif déjà préparé, installation NAS non confirmée. Prochaine action : installation du pack et recette utilisateur. Statuts et compteurs inchangés.


### 19 octobre 2026 — Dashboard : grille de widgets et dispositions personnelles

- Résultat : modèle Horizon restaurable et immuable, copies personnelles nommées, sélecteur et étoile par défaut, suppression confirmée ; grille 12 colonnes avec huit widgets existants, déplacement souris/clavier, redimensionnement pointeur/clavier et popup, catalogue d’ajout/retrait, sauvegarde/annulation explicites et protection des brouillons lors de la navigation. Préférences privées persistées sur PocketBase, révision anti-écrasement et audit, API REST verrouillée. Contenus, périodes et droits métier conservés, états non raccordés explicites. Contrats 04/05/06/07/09 actualisés ; ligne des travaux actifs mise à jour, statuts et compteurs de lots inchangés.
- Vérifications : pnpm check final réussi (lint, TypeScript, 414 tests/91 fichiers et build ; avertissement de chunk préexistant), 4 tests serveur layouts réussis (12,195 s), 4 tests serveur Dashboard réussis (13,812 s), 3 parcours Chromium réussis (21,1 s). Captures édition/clair/sombre/mobile inspectées et comparées au dashboard existant et à Contacts. Premiers essais : attributs désactivés hérités de DnD et abonnement aux indicateurs retardé par la grille corrigés puis parcours rejoués ; 409 injecté attendu et annulations de navigation journalisés dans les tests finaux. Pas de recette tactile matérielle, Safari, NAS ou gros volume réel.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-dashboards-widgets-20261019.zip](/private/tmp/horizon-pocketbase-dashboards-widgets-20261019.zip) préparé (310 sources/312 entrées), ZIP/manifeste/SHA256 vérifiés et migrations précédentes byte-identiques. Migration additive 0040 incluse ; installation NAS non confirmée. Prochaine action : installer les hooks et migrations, redémarrer, puis recette utilisateur ; modèles partagés par métier et nouveaux widgets à traiter ensuite.


### 19 octobre 2026 — Notes de frais : suivi des collaborateurs par équipe et période

- Résultat : onglet Équipe, Mois/Trimestre/Année à colonnes mensuelles, collaborateurs sans note reçue et historiques autorisés, regroupement Équipe par défaut, états et compléments, accès aux fiches avec retour aux critères, totaux TTC hors annulations et cinq synthèses. Recherche/tri/filtres/pagination adaptative partagés. Projection serveur minimale en reports/all, brouillons privés en reports, périmètre de validation inchangé et aucune obligation/retard déduit de Non reçue. Matrice extraite en HPeriodMatrix/HPeriodCell et réutilisée par TimeReport, sans dépendance supplémentaire ni changement de sa saisie. Contrats 04/05/06/07/08/09 et travaux actifs actualisés ; statuts/compteurs de lots inchangés.
- Vérifications : pnpm check final réussi (lint, TypeScript, 417 tests/92 fichiers, build avec avertissement de chunk préexistant), 14 tests serveur Expenses réussis (47 s), quatre parcours Chromium Frais/TimeReport réussis (48 s), puis suivi ciblé final réussi après finitions annuelles/détails et de la saisie libre d’année (9,2 s). Captures clair/sombre/mobile examinées et comparées à TimeReport/Contacts. Premiers essais : code d’équipe ajouté à la fixture, sélecteur searchbox corrigé, wrapper de date contenu et assertion TimeReport limitée à la densité verticale pour tenir compte du padding compact déjà propre aux consultations configurables. Pas de modification de CSS de la grille de saisie TimeReport. Logs de refus/injections et services à déconnexion conservés ; aucune recette NAS, Safari/tactile matériel ni charge réelle.
- Livraison : locale, sans commit/push. Pack cumulatif [horizon-pocketbase-frais-equipe-20261019.zip](/private/tmp/horizon-pocketbase-frais-equipe-20261019.zip) préparé et ZIP/manifeste/SHA256 vérifiés (312 sources/314 entrées), migrations jusqu’à 0040 inchangées. Aucune nouvelle migration pour ce suivi ; installation NAS non confirmée. Prochaine action : installer les hooks complets avec le frontend correspondant, redémarrer et recetter le périmètre manager/global sur les employés réels.

### 19 octobre 2026 — Vérification du périmètre réel de fusion Clients

- Investigation : contact-merge.js et merge-common.js relus contre les contrats 04/05/06. La fusion actuelle réunit champs/rôles et déplace contacts/adresses, redirige les références d’import ; la source est archivée et reliée à la cible, jamais supprimée. Les pièces métier ne sont pas réaffectées : une dépendance sur la source ou un enfant déplacé bloque l’opération ; la fiche déjà utilisée doit rester destination. Fil/audit historiques conservés sur la source, sans regroupement trompeur des compteurs. Deux historiques métier utilisés simultanément restent hors périmètre livré.
- Vérifications : deux tests PocketBase ciblés réussis (5,761 s), transfert des enfants/références, archivage/rejeu et dépendance métier bloquante sur source/autorisée sur destination. Pas de lecture de la base NAS, pas de contrôle d’un doublon réel ni de nouvelle recette navigateur.
- Livraison : clarification et journal locaux, aucune modification fonctionnelle, migration ou nouveau pack, sans commit/push. Statuts et compteurs inchangés. Prochaine action éventuelle : cadrer les adaptateurs propriétaires pour réunir deux historiques métier sans modifier les documents finalisés.

### 19 octobre 2026 — Fusion de deux sociétés avec historiques métier

- Accord utilisateur après l’explication du périmètre : extension de la fusion Sociétés avec adaptateurs Accounting / Billing / Sales / Purchasing / Inventory. Personnes déplacées avec leurs IDs, adresses originales conservées et copies, rôles et références Odoo réunis ; seules les pièces brouillon compatibles et référentiels modifiables sont réaffectés. Pièces finalisées, commandes, paiements, prix, stock, snapshots et PDF inchangés. Tiers canonique pour les nouvelles pièces, avoirs, acomptes, règlements et contrôles d’unicité fournisseur. Identité juridique/comptes incompatibles, doublons fournisseur et dépendances inconnues restent bloquants.
- Filtres et raccourcis de fiche couvrant les deux historiques sous leurs permissions, fenêtre de pièces partagée avec Billing, pagination, GED et fil société réunissant les anciennes identités lisibles. Anciennes URL redirigées ; anciennes valeurs disponibles via historique explicite. Alias aplatis lors des fusions successives, sources verrouillées, empreinte des deux familles et dépendances, transaction/rejeu/audit. [Contrat fonctionnel](04-FUNCTIONAL-SPECS.md#fusion-sociétés-avec-pièces-métier--extension-locale-du-19-octobre-2026), contrats 05/06/07/08 actualisés et lignes des travaux actifs revues. Statuts globaux inchangés, aucun lot déclaré clos par cette livraison locale.
- Vérifications : `pnpm check` **418 tests / 92 fichiers**, lint/types/build réussis ; fusion **18 tests / 54,097 s**, rollback complet sur panne volontaire compris ; **178 cas backend distincts** avec les modules concernés, quatre fixtures anciennes adaptées à leurs contrats actuels puis cas concernés rejoués. Chromium **4 parcours / 20,1 s**, comparateur/permissions/historiques/redirection/liens et facture/validation/règlement/avoir ; clair/sombre/mobile, captures inspectées et recouvrement de l’en-tête dans une popup corrigé par le contexte dialog-form. Détail et limites dans [Testing & Release](09-TESTING-RELEASE.md#fusion-sociétés-avec-historiques--recette-locale-du-19-octobre-2026). Aucun test Microsoft/Sage/SUPER PDP réel ni recette NAS. Annulation Contacts status 0 observée lors d’une redirection, parcours fonctionnel ; avertissement de chunk Vite préexistant.
- Livraison **locale, non committée/non poussée** ; changements Dashboard et suivi Équipe des notes de frais précédents conservés. Pack unique cumulatif `/private/tmp/horizon-pocketbase-fusion-historiques-20261019.zip` : **321 sources / 323 entrées**, **1084791 octets**, SHA-256 `5dc6d4de89c2a66cec6df68dbb26021512ff61cd7a267c2073d4857a132398f6`. ZIP/manifeste/hashes vérifiés, anciennes migrations identiques au pack frais-equipe, aucune nouvelle migration pour la fusion ; migration cumulative maximale 1791840040. Aucun fichier de base, secret ou frontend dans le pack.
- Prochaine action : sauvegarde/arrêt, copie des hooks complets et migrations absentes, redémarrage PocketBase et frontend cohérent, puis recette utilisateur. **Aucune installation NAS ni fusion des données réelles effectuée par l’agent.** Les Personnes/Produits avec historiques non pris en charge et les futures relations inconnues restent hors extension ; aucune annulation automatique de fusion.

### 19 octobre 2026 — Notes de frais : retrait de l’onglet À valider

- Demande utilisateur appliquée : navigation limitée à Mes notes / Équipe selon les droits ; carte À valider conservée pour filtrer les résultats. Anciens liens area=review redirigés vers Équipe avec filtre submitted, autres critères conservés ; retour depuis une fiche hors espace personnel conservant le mois de la note. Contrats 04/07 actualisés, aucun changement serveur, de données ou de permissions.
- Vérifications : lint et TypeScript réussis, `git diff --check` sans erreur ; deux parcours Chromium réussis / 25,5 s (suivi mois/trimestre/année, carte, ancien lien, ouverture de note, validation/retour/remboursement). Comparaison des captures clair/sombre/mobile du suivi, capture claire inspectée ; onglet absent et filtre accessible confirmés. Refus 400 volontaire et annulations de requêtes status 0 pendant le parcours observés, sans échec de navigation. Pas de nouvelle batterie backend : aucun hook modifié.
- Livraison locale, non committée/non poussée. Aucun nouveau pack PocketBase nécessaire ; pack fusion-historiques précédent inchangé. Pas d’installation NAS. Prochaine action : recette utilisateur du frontend à jour ; statuts globaux inchangés.

### 19 octobre 2026 — Référence de commande client uniquement numérique

- Bug signalé et reproduit avant correctif : confirmation multipart avec `123456` refusée par « Numéro de commande client invalide (120 caractères maximum) ». La lecture RequestInfo interprète les champs multipart ressemblant à du JSON ; le contrôle attendait ensuite une chaîne. Aucune lettre obligatoire dans la règle métier.
- Correction minimale dans Sales : lecteur commun de la référence utilisant postFormValue pour le formulaire multipart, à la confirmation et à la modification après confirmation. Chiffres, zéros initiaux et précision conservés, espaces de bord supprimés, limite 120 maintenue. API JSON toujours typée texte ; aucun changement de schéma, de permission, de montants ou d’historique. Contrats 04/05 précisés.
- Vérifications : test rouge avant correction ; deux tests backend / 6,102 s réussis après (confirmation `123456`, corrections `0`, `000123`, 30 chiffres, `1e3`, `true`, `null`, 120 caractères, refus à 121 et type JSON numérique, pièces jointes protégées/versions). Lint et TypeScript réussis, diff --check sans erreur. Chromium cycle commercial complet / 9,3 s réussi : confirmation par la vraie UI avec 30 chiffres et deux pièces jointes, valeur exacte réaffichée. Pas de changement de design ; captures du parcours produites, aucune nouvelle comparaison de style nécessaire. Refus de projections métier non disponibles (400) et annulations de requêtes (0) observés sans échec du parcours. Pas de recette NAS.
- Livraison locale non committée/non poussée. Pack cumulatif `/private/tmp/horizon-pocketbase-reference-commande-20261019.zip` : 321 sources / 323 entrées, 1085010 octets, SHA-256 `ae89c90a6b2e41a33dc1f0fcba1fddaf0a6b40273f1f2ef8e5705931b5ff1bd5`. ZIP/manifeste/hashes vérifiés ; seul hook changé depuis le pack fusion-historiques : sales-lifecycle.js. Aucune nouvelle migration (maximum cumulatif 1791840040), variable ou dépendance. NAS non installé ; prochaine action : sauvegarde/arrêt, hooks complets cohérents et migrations absentes, redémarrage PocketBase, recette de la confirmation numérique. Statuts globaux inchangés.

### 19 octobre 2026 — TimeReport : correction manager avant validation

- Demande utilisateur appliquée : « Modifier les temps » sur une feuille BE Horizon soumise, grille/éditeur de lignes partagés, ajout/retrait/ordre/commentaires/imputations et durées. Enregistrer avec motif conserve À valider ; validation séparée, désactivée si modifications non enregistrées. Annuler restaure la feuille et quitte le mode, favoris/copie personnels absents du mode manager. Auteur verrouillé pendant soumission.
- Route correct utilisant le même saver métier, droits time.read/validate et périmètre du valideur recontrôlés en transaction, sans time.write ni éligibilité personnelle de saisie. Auto-review protégée par auteur et employé, identités de feuille conservées, révision/concurrence et contrôles de saisie maintenus ; sources externes/PROD et feuilles validées hors édition directe. Motif/acteur au fil, audit avant/après complet, notification propriétaire transactionnelle selon préférences. Contrats 04/05/06/07 et suivi actif H03 actualisés ; statuts globaux et compteurs inchangés.
- Vérifications : pnpm check réussi, lint/types/**419 tests / 92 fichiers**/build, avertissement Vite de chunk préexistant. Suite TimeReport finale **19 tests / 57,563 s**, dont trois nouveaux tests manager, droits/périmètres, conflits, identité, audit, notification et rollback volontaire. Fixture préexistante de dates futures corrigée pour éviter une collision de semaines selon le jour d’exécution ; cas rejoué puis suite complète réussie. Chromium **2 parcours / 28,5 s**, correction puis validation séparée, annulation et rechargement, clair/sombre/mobile, captures inspectées et absence de débordement ; 503/409 volontaires journalisés, pas d’erreur JS non interceptée. Détail et limites dans Testing & Release. Aucun test NAS/Safari/tactile matériel.
- Livraison locale, non committée/non poussée ; travaux précédents conservés. Pack cumulatif `/private/tmp/horizon-pocketbase-temps-correction-manager-20261019.zip` : **321 sources / 323 entrées**, **1084997 octets**, SHA-256 `cd6c28b7ea06c9ad2ae8266bd29e28e994b0fa081306c52fbfe64eb3708bbbe8`. ZIP/manifeste/hashes vérifiés, migrations identiques au pack référence-commande et maximum cumulatif 1791840040 ; seuls hooks Time common/report/route modifiés depuis ce pack. Aucun nouveau schéma, secret, dépendance ou service.
- Prochaine action : sauvegarde/arrêt, remplacement des hooks complets avec les migrations absentes puis redémarrage PocketBase et frontend cohérent ; recette utilisateur des corrections manager. **Aucune installation NAS ni modification de données réelles effectuée par l’agent.**

### 19 octobre 2026 — TimeReport : alignement des popups commentaire et motif

- Correction UX demandée : les libellés Manager/Motif et Commentaire utilisent h-form-field partagé ; zones multiligne alignées avec l’en-tête et le libellé, espacement 5 px, hauteur automatique selon rows et padding 8/10 px via règle commune dialog-form. Le commentaire possède un libellé visible. Pas de CSS spécifique TimeReport, de changement métier ou de permissions. Contrat UX 07 actualisé, statuts/compteurs inchangés.
- Vérifications : lint et TypeScript réussis, diff --check sans erreur ; deux parcours Chromium réussis / 27,1 s, alignements géométriques, hauteur et espacement, sauvegarde des commentaires/corrections puis validation, clair/sombre/mobile et captures inspectées. Premier essai arrêté sur ouverture de fiche RH avant les popups ; reprise complète réussie sans modification RH. 503/409 volontaires du scénario journalisés. Aucun test backend supplémentaire, serveur inchangé ; Safari/tactile matériel/NAS non vérifiés.
- Livraison locale non committée/non poussée, changements précédents conservés. Aucun nouveau pack PocketBase nécessaire ; pack temps-correction-manager précédent inchangé. Prochaine action : recharger le frontend à jour et recetter les popups. Aucun déploiement NAS réalisé.

### 19 octobre 2026 — Congés : frise des collaborateurs, photos et sous-menus RH

- Demande utilisateur réalisée : calendrier remplacé par une frise semaine/mois à lignes collaborateur, absences en barres sur demi-journées, total quotidien graphique discret, fériés/week-ends, navigation/recherche/périmètre en URL. Mon équipe / Entreprise (global seulement), ressources sans absence visibles, pagination 50 et total sur toutes les pages. Aucune donnée de type/motif médical ou justificatif ; liens de demandes toujours soumis aux permissions. Ajout demandé en cours de travail : photo RH 24 px puis nom fixes au défilement, initiales sinon, route photo protégée/no-store et composant HEmployeeAvatar partagé avec TimeReport.
- Sidebar Congés : Mes congés / À valider / Calendrier / Allocations RH ; Notes de frais : Mes notes / Équipe. Scopes déjà présents dans la session authentifiée conservés dans sa projection pour filtrer les enfants ; droits serveur inchangés. Préservation des sous-menus préexistants et actif sur area=own / area absent. HResourceTimeline partagé, HTableViewport/HViewSwitch/WorkspaceSearch/HListPagination et tokens existants. Contrats 04/05/06/07 et suivi actif H04 actualisés ; aucun statut global ni compteur changé.
- Vérifications : pnpm check réussi, lint/types/**423 tests / 94 fichiers**/build, avertissement Vite préexistant ; lint/types finaux réussis, diff --check sans erreur. Suite Congés **14 tests / 46,369 s**, scopes/révocation/confidentialité, totaux demi-journées/fériés, roster/pagination et photos, workflows/migrations antérieurs. **7 parcours Chromium distincts réussis** avec Frais/TimeReport ; quatre Congés finaux / **35,4 s**, frise finale rejouée / **8,4 s**. Superposition de l’en-tête fixe mobile corrigée lors de la recette ; scénario de retour attendant désormais la fiche avant le breadcrumb. Captures clair/sombre/mobile inspectées, recherche/période et retour URL, photos/initiales et sous-menus vérifiés. Détail et limites dans Testing & Release ; aucun test Safari/tactile matériel, charge réelle ou NAS.
- Livraison locale, non committée/non poussée, travaux précédents conservés. Pack cumulatif `/private/tmp/horizon-pocketbase-conges-frise-20261019.zip` : **321 sources / 323 entrées**, **1086019 octets**, SHA-256 `208c1af8ff81db7987fc6caeccc5c76c2fd020626e5c7b86c00791bef2f914b9`. ZIP/manifeste/hashes vérifiés ; seuls hooks leave.js et leave.pb.js changés depuis temps-correction-manager, migrations identiques et maximum cumulatif 1791840040. Aucune nouvelle collection/migration, dépendance, variable ou conteneur.
- Prochaine action : sauvegarde/arrêt, remplacement des hooks complets et ajout des migrations absentes, redémarrage PocketBase et frontend cohérent, puis recette des vrais collaborateurs/photos. **Aucune installation NAS ou modification des données réelles par l’agent.**

### 19 octobre 2026 — Congés : contraste et opacité des barres de la frise

- Retour utilisateur sur une frise illisible traité. Cause reproduite dans Chromium : couleur de fond invalide en clair faute de fallback pour --theme-surface, rendant les barres transparentes. Valeurs de repli ajoutées dans le composant partagé, fond plein teinté 35 %, texte 12 px semi-gras, contour renforcé et repère gauche 3 px ; grille quotidienne atténuée. Jours non travaillés et graphique de pied retrouvent également leur surface en clair. Aucun changement des droits, données ou autres tableaux. Contrat UX 07 actualisé, statuts et compteurs inchangés.
- Vérifications : lint et TypeScript réussis, diff --check sans erreur. Reproduction de l’alpha nul avant correction, puis parcours Chromium frise/photos/périmètres/menus réussi / 8,6 s ; toutes les barres opaques et contraste texte/fond ≥ 4,5:1 dans les deux thèmes, graisse et bord gauche contrôlés. Captures clair/sombre/mobile inspectées. Pas de nouvelle suite backend, serveur inchangé ; NAS/Safari/tactile matériel non vérifiés.
- Livraison locale non committée/non poussée, travaux précédents conservés ; aucun nouveau pack PocketBase nécessaire, pack conges-frise inchangé. Prochaine action : recharger le frontend à jour et recetter la frise. Aucun déploiement NAS effectué.

### 19 octobre 2026 — Congés : nom/type/durée et aperçu au clic sur une barre

- Demande utilisateur appliquée : libellé Nom · Type de congé · Durée, bouton natif ouvrant HDialog sur place. Popup de consultation : état, collaborateur, durée, dates/demi-journées ; lecture privée existante pour type, manager et commentaire, lien Ouvrir la demande facultatif conservant les critères. Échap/Fermer restituent le focus à la barre et laissent l’URL inchangée. Pied partagé hors défilement pour rester accessible sur mobile.
- Sécurité préservée : type_label ajouté dans la projection serveur uniquement pour les lecteurs autorisés à la demande, snapshot historique prioritaire. Pour un collègue : type absent du JSON, barre Absence, popup limitée aux disponibilités, aucune requête record/aucun lien interdit. Aucun nouveau schéma, droit ou endpoint ; champs calendaires existants et photos conservés. Contrats 04/05/06/07 actualisés ; statuts et compteurs globaux inchangés.
- Vérifications : pnpm check réussi, lint/types/**423 tests / 94 fichiers**/build (avertissement Vite préexistant), lint/types finaux et diff --check. Backend ciblé **2 tests / 6,426 s**, projection autorisée/expurgée et scopes/totaux. Trois parcours Congés historiques réussis lors de la première passe ; nouveau parcours après correction du libellé explicite de textarea et ajout du retour de focus réussi / **10 s**, puis final mobile / **9,8 s**. Captures clair/sombre/mobile et collègue inspectées, détails autorisés et absence de requête privée pour collègues vérifiés. Détail/limites dans Testing & Release ; NAS/Safari/tactile matériel non vérifiés.
- Livraison locale non committée/non poussée ; travaux précédents conservés. Pack cumulatif `/private/tmp/horizon-pocketbase-conges-detail-20261019.zip` : **321 sources / 323 entrées**, **1086196 octets**, SHA-256 `e91112c6d965718d4d4f4278b9ed1e66d2ca788ba25c17642fdbcdcd79425921`. ZIP/manifeste/hashes vérifiés, seule modification serveur depuis conges-frise : lib/leave.js. Migrations identiques, maximum cumulatif 1791840040 ; aucune variable/dépendance nouvelle.
- Prochaine action : sauvegarde/arrêt, copie des hooks complets et migrations absentes, redémarrage PocketBase avec frontend cohérent, recette des barres et détails sous comptes réels. **Aucune installation NAS ni modification de données réelles effectuée par l’agent.**

### 19 octobre 2026 — Congés : libellé sans gras et nature explicite

- Demande utilisateur appliquée : barres à graisse normale 400, couleurs/contraste conservés ; format Nom · Nature du congé · Durée vérifié. Popup précisée avec le libellé Nature du congé. Le serveur fournissait déjà type_label pour les demandes consultables ; aucune nouvelle exposition pour les collègues. Nécessite le pack conges-detail précédent si ce hook n’est pas encore installé. Contrat UX 07 actualisé, statuts/compteurs inchangés.
- Vérifications : lint/TypeScript réussis, diff --check sans erreur ; Chromium **1 parcours / 10,1 s**, graisse 400 mesurée sur les barres clair/sombre, nature Sans solde/durée exacte, popup et accès limité collègue, retour clavier et mobile. Capture claire inspectée ; sombre/mobile produits dans le parcours. Pas de nouveau test backend : aucun changement serveur. NAS/Safari/tactile matériel non vérifiés.
- Livraison locale non committée/non poussée, changements précédents conservés. Aucun nouveau pack PocketBase : conges-detail reste le prérequis pour les natures fournies par le calendrier. Prochaine action : recharger le frontend à jour et, si nécessaire, installer les hooks précédents puis redémarrer ; aucune installation NAS confirmée ou réalisée par l’agent.

### 19 octobre 2026 — Congés : couleurs par ligne, congés de la période et alignement Total

- Demandes utilisateur appliquées : couleur automatique par collaborateur dans la palette partagée, stable entre rechargements/tri/filtrage/périodes et identique sur toutes ses barres. Statut indépendant de la couleur : contour pointillé en attente/annulation demandée, plein si validé, légende des contours et état textuel au survol/popup. Aucun changement du texte normal, des photos ni de la confidentialité.
- Employés limités côté serveur aux demandes submitted/approved/cancel_requested chevauchant la période, avant pagination ; brouillons/refus/annulations acceptées exclus. Période vide explicite. Pied renommé Total et aligné : chiffres centrés sous les jours et verticalement avec le libellé, hauteur 38 px et graphique discret conservé. Compteurs de personnes désormais limités aux personnes en congé. Contrats 04/05/07 et travaux actifs H04 actualisés, statuts/compteurs globaux inchangés.
- Vérifications : pnpm check réussi, lint/types/**424 tests / 94 fichiers**/build (avertissement Vite préexistant), diff --check. Suite Congés finale **14 tests / 44,596 s**, filtrage/période vide, refus des brouillons privés, pagination 53 personnes avec congés et agrégats toutes pages, droits/photos/workflows conservés. Fixture SQL complétée par les creation_key uniques requises, sans assouplissement serveur. Chromium **4 parcours / 37,6 s**, deux périmètres, couleurs stables, attente pointillée, contraste et graisse normale, popup, navigation/périodes vides, Total aligné par mesures <1 px horizontal / <2 px vertical. Captures clair/sombre/mobile inspectées ; détails/limites dans Testing & Release. Pas de recette NAS/Safari/tactile matériel ou charge.
- Livraison locale non committée/non poussée ; travaux précédents conservés. Pack cumulatif `/private/tmp/horizon-pocketbase-conges-couleurs-periode-20261019.zip` : **321 sources / 323 entrées**, **1086300 octets**, SHA-256 `1d359f52e0182df03a50c51f1286f0efd969693e75c3e02aa6b56fc2a135b3d7`. ZIP/manifeste/hashes vérifiés ; seul lib/leave.js changé depuis conges-detail, migrations identiques (maximum 1791840040). Aucune nouvelle collection/migration, dépendance ou variable.
- Prochaine action : sauvegarde/arrêt, copie des hooks complets et migrations absentes, redémarrage PocketBase puis frontend cohérent et recette utilisateur. **Aucune installation NAS ni modification des données réelles réalisée ou confirmée par l’agent.**

### 19 octobre 2026 — Congés : simplification de la ligne Total

- Retour utilisateur traité : retrait des blocs histogrammes et des tirets des jours à zéro. Fond uniforme sur toute la ligne, libellé fixe et chiffres centrés sous les jours ; comptage et détail au survol inchangés. Correction limitée au pied de frise partagé et à sa projection Congés ; contrats 04/07 actualisés, statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript réussis, Chromium ciblé 1 parcours / 10,3 s, valeurs entières/demi-journées, fond uniforme clair/sombre, absence de graphique et centrage contrôlés. Captures clair/sombre/mobile inspectées. Aucun changement serveur, pas de nouvelle suite backend ; NAS/Safari/tactile matériel non vérifiés.
- Livraison locale non committée/non poussée, travaux précédents conservés. Aucun nouveau pack PocketBase nécessaire. Prochaine action : recharger le frontend à jour pour recette ; aucun déploiement NAS effectué.

### 19 octobre 2026 — Congés : bordures homogènes entre frise et Total

- Écarts de rendu corrigés : grille du calendrier auparavant atténuée alors que les colonnes du Total utilisaient la couleur pleine ; couleur et largeur 1 px désormais communes. Suppression des doubles séparations sous le libellé de la dernière ligne et au bas du pied contre le cadre extérieur. CSS limité à HResourceTimeline, contrat UX actualisé ; aucun changement de données ni des autres tableaux. Statuts et compteurs inchangés.
- Vérifications : lint/TypeScript réussis, Chromium ciblé 1 parcours / 10,2 s ; couleurs/largeurs et absence de doublons contrôlées en clair/sombre. Captures clair/sombre/mobile inspectées. Serveur inchangé, pas de nouvelle suite backend ; NAS/Safari/tactile matériel et zooms système non vérifiés.
- Livraison locale non committée/non poussée, travaux précédents conservés ; aucun nouveau pack PocketBase requis, aucun déploiement NAS. Prochaine action : recharger le frontend à jour pour recette.

### 19 octobre 2026 — Congés : finition des coins inférieurs

- Fond des deux cellules extrêmes du pied Total arrondi à 5 px, accordé au cadre extérieur de 6 px. Suppression du recouvrement carré des coins sans clipping du tableau, défilement et cellules fixes préservés. Contrat UX actualisé ; statuts/compteurs inchangés.
- Vérifications : lint/TypeScript et diff --check réussis, Chromium ciblé 1 parcours / 10,1 s, rayons contrôlés en clair/sombre, navigation et mobile inclus. Captures desktop clair/sombre inspectées ; NAS/Safari/tactile matériel non vérifiés, aucun changement serveur ni nouvelle suite backend.
- Livraison locale non committée/non poussée, travaux précédents conservés ; aucun nouveau pack PocketBase ni déploiement. Prochaine action : recharger le frontend à jour pour recette.

### 19 octobre 2026 — Publication des travaux validés

- À la demande utilisateur, regroupement des travaux locaux validés depuis le précédent commit : dashboard personnalisable, vue équipe des notes de frais, fusion des sociétés avec reprise des liens, référence numérique de commande client, correction manager des temps, frise Congés/photos/détail/périmètres et finitions du pied Total. Périmètres et contrats détaillés dans les entrées précédentes ; statuts et compteurs inchangés.
- Vérifications avant commit : pnpm check réussi (lint, TypeScript, 424 tests / 94 fichiers, build), avertissement Vite sur la taille des chunks conservé. Dernier parcours Chromium frise réussi / 10,1 s ; tests backend et parcours métier exécutés lors des interventions précédentes, sans nouvelle exécution intégrale backend. Aucun déploiement NAS ni recette des données réelles.
- Livraison : commit fonctionnel 3129ead sur main poussé sur origin/main ; identité HEAD/origin/main et espace de travail propre vérifiés après ce push. Pack PocketBase cumulatif conges-couleurs-periode précédent inchangé ; aucune nouvelle migration pour les finitions visuelles. Prochaine action : recette utilisateur sur le frontend à jour ; installation NAS non effectuée par l’agent.

### 19 octobre 2026 — Explication du blocage des identifiants à la fusion

- Investigation en lecture du message Identifiants juridiques incompatibles : contrôle serveur des SIREN (ou des neuf premiers caractères SIRET si SIREN absent), puis des valeurs SIREN/LEI/TVA présentes sur les deux fiches. Une différence bloque ; le message actuel ne désigne pas le champ concerné. Explication fournie sans déduire la cause propre aux deux fiches réelles, non consultées.
- Vérifications : lecture du contrat fonctionnel et de contact-merge.js ; aucun changement fonctionnel, aucun test exécuté pour cette explication. Données NAS non consultées.
- Livraison : note documentaire locale non committée/non poussée, code inchangé après publication précédente. Prochaine action : comparer les champs des deux fiches pour identifier la divergence ; aucune fusion ni correction de donnée effectuée.

### 19 octobre 2026 — Fusion : champs et valeurs des conflits juridiques

- Message générique remplacé par un motif pour chaque champ divergent (SIREN, TVA, LEI), avec valeur et nom des deux sociétés et rôle source/cible. Origine SIRET explicitée si le SIREN est déduit. Suppression du message SIREN redondant ; critères et blocage transactionnel conservés, aucun forçage ni changement de schéma/droits. Le dialogue partagé affiche déjà ces motifs comme texte, sans HTML injecté. Contrat fonctionnel actualisé ; statuts/compteurs inchangés.
- Vérifications : lint/TypeScript réussis, diff --check, 19 tests PocketBase / 59,710 s ; Chromium 1 parcours final / 6,4 s, affichage exact et refus de fusion, desktop/mobile inspectés. Premier essai de test ajusté au chargement et au libellé existant de sélection. Sombre/Safari/NAS non revérifiés.
- Livraison locale non committée/non poussée ; pack `/private/tmp/horizon-pocketbase-fusion-identifiants-20261019.zip` : 321 sources / 323 entrées, 1086556 octets, SHA-256 `2b846d9c67a7a74e8f0c8a479f549a489f9cc331a4c3629ddec012bf6fd60523`. ZIP/manifeste/hashes vérifiés, seul lib/contact-merge.js changé depuis conges-couleurs-periode, migrations identiques jusqu’à 1791840040. Prochaine action : sauvegarde, remplacement des hooks complets et redémarrage PocketBase puis recette des deux fiches réelles. Aucune installation NAS ou modification de données réelles effectuée.

### 19 octobre 2026 — Publication du correctif des conflits juridiques

- Commit/push demandés pour les messages de fusion détaillés, tests et documentation associés. Vérification du périmètre : six fichiers attendus, diff --check réussi ; résultats lint/TypeScript, 19 tests serveur et parcours Chromium de l’intervention précédente conservés, aucun changement fonctionnel supplémentaire ni nouvelle exécution des suites. Statuts et compteurs inchangés.
- Livraison : correctif e86c62f committé sur main et poussé sur origin/main ; espace de travail propre et aucune divergence distante vérifiés. Pack fusion-identifiants inchangé, aucune installation NAS réalisée. Prochaine action : vérifier la synchronisation distante puis recette utilisateur après installation des hooks.

### 20 octobre 2026 — Compteurs des smart boutons et cartes : préférences utilisateur

- Périmètre validé livré : Mon compte → Affichage, deux options personnelles activées par défaut pour afficher les compteurs et accentuer les valeurs non nulles. HCounter partagé par les raccourcis/menu de débordement, synthèses cliquables et aperçu administrateur ; zéro/inconnu neutres, négatifs compris dans l’accent. Libellés/navigation/filtres et indicateurs principaux/valeurs formatées préservés. HSectionHeading/HSettingsTable/HSaveButton réutilisés, sauvegarde explicite et erreurs visibles. Contrats 04/05/06/07 actualisés ; statuts/compteurs globaux inchangés.
- Persistence serveur par compte dans core_display_preferences avec migration additive 1791840041, API natives verrouillées, propriétaire implicite, allowlist booléenne, transaction/version et audit. Service/repository Account existants réutilisés, aucune dépendance ou variable nouvelle. Lecture partagée par utilisateur dans le shell, sans PocketBase dans les composants, aucune confusion entre sessions.
- Vérifications : pnpm check réussi (432 tests / 95 fichiers, lint/types/build, avertissement Vite préexistant), lint/types finaux et diff --check. Backend ciblé 3 tests / 7,664 s, probe générique migration 1 test / 0,139 s ; Chromium 3 parcours / 24,1 s puis compteur final / 16,5 s. Persistance nouveau navigateur, isolation autre utilisateur, refus serveur, navigation sans chiffres, couleurs mesurées clair/sombre et captures desktop/mobile inspectées. Conflit de noms de fichiers et attente des données de test corrigés avant validation ; détails/limites dans 09. Pas de suite backend globale, Safari/tactile matériel ou NAS vérifié.
- Livraison locale non committée/non poussée ; pack cumulatif /private/tmp/horizon-pocketbase-affichage-compteurs-20261020.zip : 323 sources / 325 entrées, 1087892 octets, SHA-256 33583ff1419890da020377ec89429f88b84e14b0f370a048b119e0d9dae3830a. ZIP/manifeste/hashes vérifiés, anciennes migrations inchangées jusqu’à 0040 et ajout 0041. Prochaine action : sauvegarde, installation hooks complets/migration et redémarrage PocketBase puis frontend cohérent et recette utilisateur. Aucune installation NAS ou modification de données réelles effectuée par l’agent.

### 20 octobre 2026 — Préférences : nom, cases roses et inventaire avant regroupement

- Onglet Affichage renommé Préférences, URL canonique tab=preferences avec compatibilité de l’ancien tab=display ; cases partagent le style rose 15 px des Notifications. Contrats 04/07 et README actualisés ; statuts et compteurs globaux inchangés.
- Audit demandé avant déplacement : entrée Paramètres → Mes notifications déjà redirigée vers Mon compte/Notifications ; signatures e-mail individuelles mélangées aux signatures société dans E-mails ; vue de départ CRM globale avec mémorisation locale par utilisateur si Dernier état ; largeur recherche/menu et densité actuellement communes à tous. Ces derniers nécessiteraient des surcharges personnelles, pas un déplacement supprimant les valeurs administrateur. Colonnes disponibles restent un catalogue administrateur, distinct des choix personnels enregistrés par tableau.
- Autres choix déjà personnels hors Paramètres : thème clair/sombre local au navigateur, sections de sidebar repliées locales par compte, affichage CRM et colonnes Kanban locales, dashboards favoris/dispositions serveur et carrousel automatique/manuel local par compte. Nombre de résultats choisi dans l’URL, adaptation automatique à l’écran. Proposition de centralisation à présenter à l’utilisateur ; aucun de ces réglages déplacé dans cette intervention et aucune nouvelle permission accordée pour la signature.
- Vérifications : lint/TypeScript et diff --check réussis, Chromium 1 parcours / 15,9 s ; titre actif et couleur rose exacte des deux cases contrôlés. Captures clair/sombre/mobile produites, clair/mobile inspectées ; persistance multi-navigateurs et navigation sans compteurs conservées. Pas de modification serveur ni nouvelle suite backend ; NAS/Safari/tactile matériel non vérifiés.
- Livraison locale non committée/non poussée, travaux de préférences précédents conservés ; pack affichage-compteurs-20261020 inchangé et toujours requis pour le serveur, aucun nouveau pack nécessaire pour le renommage/couleur. Prochaine action : validation par l’utilisateur de la liste des réglages à regrouper, puis définir les surcharges personnelles en préservant les réglages communs. Aucune installation NAS effectuée.

### 20 octobre 2026 — Préférences : notifications, signatures, thème et confort regroupés

- Premier périmètre validé réalisé : deux onglets Profil et sécurité / Préférences, trois blocs Affichage et confort / Mes signatures e-mail / Mes notifications, sauvegardes indépendantes. Anciennes URL notifications/display conservées, entrée personnelle supprimée des Paramètres ; configurations partagées et signatures société restent administrées. Compteurs/cases roses précédents conservés. Contrats 04/05/06/07/08 et README actualisés ; statuts et compteurs globaux inchangés. Les suggestions CRM/tableaux/dashboards/navigation ne sont pas ajoutées à ce lot.
- Préférences serveur étendues sans nouvelle migration : thème explicite synchronisé, choix appareil en héritage, bouton supérieur utilisant le même réglage et retour au thème appareil hors compte. Largeurs recherche/menu bornées, null pour hériter, densité compacte/confortable ou entreprise, overrides appliqués au shell sans modifier les paramètres globaux ni l’aperçu administrateur. Ancien client deux booléens compatible ; brouillon conservé en cas de changement concurrent, cache de thème lié au propriétaire initial et erreurs visibles. Grille responsive corrigée sans masquer les débordements de page.
- Messaging possède les nouvelles routes de signature personnelle : read/write propres, user imposé, Viewer sans écriture, refus de signature d’autrui/société. Éditeur partagé MailSignatureDialog avec l’administration, choix Société explicite, aperçu d’exemple conservé. Composeur et snapshots existants réutilisés, aucune réécriture d’e-mail ni nouveau service/Microsoft scope.
- Vérifications : pnpm check réussi, 441 tests / 95 fichiers, lint/types/build (avertissement Vite préexistant) ; lint/types/build finaux et diff --check. Backend Préférences/Tableaux 9 tests / 25,466 s, Signatures 3 / 9,369 s. Chromium 8 scénarios réussis dans la dernière passe d’ensemble, puis 2 parcours finaux / 13,4 s incluant le scénario administrateur corrigé. Contrôles de valeurs héritées/globales, navigateur/compte, droits, brouillons, notifications, signature et captures clair/sombre/mobile inspectées. Corrections de fixtures/sélecteurs et limites détaillées dans 09 ; pas de recette NAS/Safari/tactile matériel ni suite backend globale.
- Livraison locale non committée/non poussée, travaux précédents conservés. Pack cumulatif /private/tmp/horizon-pocketbase-preferences-personnelles-20261020.zip : 324 sources / 326 entrées, 1089450 octets, SHA-256 691e73483e3eb51d754922d1a189a6b4bdfd80054d6fb048fb655380fc11d0f9. Archive/manifeste/hashes/sources vérifiés ; migrations inchangées jusqu’à 0041. Prochaine action : sauvegarde/arrêt, remplacement des hooks complets et ajout des migrations absentes, redémarrage PocketBase puis frontend cohérent et recette utilisateur. Aucune installation NAS ou modification de données réelles réalisée par l’agent.

### 20 octobre 2026 — Correction du périmètre de coloration des compteurs

- À la demande utilisateur, accent des valeurs non nulles limité aux smart boutons, menus de débordement et aperçu compris. Activation explicite dans HCounter ; cartes sans surcharge, leurs couleurs habituelles de thème/état sont restaurées. Libellé et aide Préférences précisent ce périmètre. Masquage des compteurs inchangé. Contrats 04/07 actualisés ; statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript réussis, Chromium 1 parcours / 19,4 s ; couleurs des cartes identiques avant/après bascule en clair et sombre, smart boutons toujours pilotés par le réglage. Captures clair/sombre inspectées, responsive contrôlé à 390 px, aucune erreur JavaScript. Limites et logs de navigation documentés dans 09 ; pas de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée. Aucun changement PocketBase, aucune nouvelle migration ni nouveau pack ; pack préférences-personnelles-20261020 précédent inchangé, installation NAS non confirmée. Prochaine action : recette utilisateur de la correction frontend.

### 20 octobre 2026 — Proposition dashboard orienté widgets et données

- Investigation demandée avant développement : dispositions, catalogue et carrousel existants examinés. Limites constatées : huit types uniques sans instance configurable, largeurs discrètes 3/4/6/8/12, minimums de six colonnes pour les blocs, placement recalculé depuis l’ordre ; quatre pages commerciales fixes et rotation locale de dix secondes. Aucun code fonctionnel modifié.
- Proposition à valider : grille en unités horizontales/verticales avec position et dimensions par instance, plusieurs instances d’un même type, sources métier autorisées/présentations/filtres indépendants, période héritée ou propre, carrousels à pages nommées configurables. Préserver les dashboards existants et leurs préférences lors d’une future évolution versionnée ; droits contrôlés par les modules propriétaires et chargement limité au contenu visible.
- Vérifications : lecture des contrats 04/07 et du code DashboardWorkspace/DashboardGrid/layouts/BusinessCarousel ; aucune recette navigateur ni test exécuté pour cette proposition sans changement fonctionnel. Statuts et compteurs globaux inchangés.
- Livraison : cadrage documentaire local non committé/non poussé ; aucun pack préparé, aucune intervention NAS. Prochaine action : validation utilisateur de la proposition avant évolution des contrats, schéma et interface.

### 20 octobre 2026 — Dashboard : widgets configurables, grille et aperçu de destination

- Périmètre validé réalisé : instances indépendantes et duplicables, positions mémorisées, tailles horizontales/verticales par unité (dès 2H × 1V pour indicateurs/raccourcis), destination pointillée teintée pendant déplacement/redimensionnement, voisins animés sans chevauchement, Échap et clavier. Anciennes dispositions acceptées et modèle Horizon préservé ; réglage numérique sur petits écrans, geste desktop désactivé avec la grille adaptative. Contrats 04/05/06/07/08 et README actualisés ; travaux actifs R09/X01 actualisés, X01 reste En cours, statuts et compteurs globaux inchangés.
- Données métier configurables par instance : source opportunités/devis/commandes/factures clients, périmètre, état, société recherchée à la demande, texte, période et présentation liste/tableau/compteur, pagination serveur. Critère de période unique retirable dans SearchFilters à l’ouverture des listes, filtres de dates/owner exécutés dans les modules propriétaires. Carrousel 1–12 pages nommées/réordonnables/duplicables, sources et filtres propres, délai et mode automatique sauvegardés, pause au survol/focus/édition/hors écran ; seule la page active monte son contenu. Pause temporaire par compte/dashboard/instance. Widgets Temps/Absences/À valider/Raccourcis ajoutés en réutilisant les composants et services partagés ; pas d’heure attendue inventée pour un employé non concerné.
- API layouts : 32 instances maximum par dashboard, allowlists et bornes serveur, révisions/audit/isolation conservés. JSON compact pour ne pas répéter les réglages par défaut et conserver douze dashboards ordinaires sous la limite 64 Kio ; rejeu de la configuration compacte accepté, dépassement explicite sans écriture partielle. Aucune nouvelle collection, migration structurelle, dépendance, variable ou conteneur. Aucune écriture de document historique, intégration OnSite ou intégration comptable externe.
- Vérifications : `pnpm check` réussi, 450 tests / 97 fichiers ; lint/types/build finaux et diff --check réussis, avertissement Vite préexistant. Backend consolidé 13 tests / 39,244 s. Chromium six parcours / 43,6 s, puis quatre / 19,1 s, configurateur deux / 12,6 s et grille deux / 12,8 s après ajustements visuels. Couleurs/compteurs précédents, pointeur/clavier/Échap, persistance, scope/dates, pagination, nouvelles instances et carrousels, clair/sombre/mobile vérifiés ; captures inspectées. Limites dans 09 : pas de recette NAS/Safari/tactile matériel ni benchmark de volume, fenêtres Absences bornées et indicateurs non raccordés toujours indisponibles.
- Livraison locale non committée/non poussée, travaux précédents Préférences conservés. Pack cumulatif unique `/private/tmp/horizon-pocketbase-dashboards-widgets-20261020.zip` : 326 sources / 328 entrées, 1092529 octets, SHA-256 `d27fbf4e16a840c000f8a2ab3da71bb48981ab5a536196005020c4f635ea32f6`. ZIP/manifeste/empreintes/sources vérifiés ; migrations inchangées jusqu’à 0041. Prochaine action : sauvegarde/arrêt, remplacement des hooks complets et ajout des migrations absentes, redémarrage PocketBase avec frontend cohérent puis recette utilisateur sur ses données/droits. Installation NAS non effectuée ni confirmée.


### 20 octobre 2026 — Dashboard : tableaux Horizon, courbes et aperçu des widgets

- Correction demandée réalisée : courbes transparentes restaurées dans les indicateurs compacts, y compris 2H × 1V ; tableaux du modèle Horizon et des nouveaux widgets rétablis avec `HDataTable`, bordures de colonnes, états `HTag` et montants à droite. Vues de présentation mutualisées avec le catalogue ; erreurs de rechargement toujours visibles. Les présentations personnelles v2 déjà enregistrées restent conservées, sans interpréter à tort leur format compact comme une absence de choix. Contrats 04/07 actualisés, détails de recette dans 09 ; statuts et compteurs globaux inchangés.
- Ajout de widget : catalogue groupé et aperçu du type sélectionné, treize types illustrés par les composants réellement utilisés et des exemples locaux identifiés. Sélection sans ajout, liens d’exemple inertes, aucune requête métier pour ces exemples ; confirmation avant configuration. Aperçus carrousel/tableaux/frise/temps et courbes testés. Inspection mobile suivie d’une correction de la hauteur de la zone de sélection ; clair/sombre et 980/390 px inspectés.
- Vérifications : `pnpm check` final réussi, lint/TypeScript, 451 tests Vitest / 97 fichiers et build ; avertissement Vite préexistant sur les chunks volumineux. Chromium six parcours / 32,6 s, puis cinq parcours finaux / 24,5 s après sécurisation de la compatibilité des présentations sauvegardées. Première expiration du test sur une option État détachée documentée dans 09, parcours stabilisé et rejoué avec succès. `git diff --check` réussi. Aucune nouvelle suite serveur nécessaire pour ce correctif frontend ; pas de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée, travaux précédents conservés. Aucune nouvelle migration, aucun nouveau pack PocketBase : archive dashboards-widgets-20261020 précédente inchangée et toujours requise pour les fonctionnalités serveur du lot antérieur. Installation NAS non effectuée ni confirmée. Prochaine action : recette utilisateur de la présentation et du catalogue ; les indicateurs non raccordés restent explicitement indisponibles.


### 20 octobre 2026 — Publication des préférences et du dashboard configurable

- Commit `b00e999` créé puis poussé avec succès sur `origin/main` : préférences personnelles, signatures individuelles, compteurs des smart boutons, widgets configurables, aperçu de destination et catalogue avec prévisualisation ; correctifs de présentation Horizon inclus. Les entrées « local non committé/non poussé » précédentes décrivent leur état historique, désormais remplacé par cette publication. Statuts fonctionnels et compteurs globaux inchangés.
- Vérifications avant publication : index Git sans erreur de whitespace, résultats finaux existants confirmés (`pnpm check` : 451 tests / 97 fichiers, lint/types/build ; Chromium cinq parcours finaux / 24,5 s et six parcours / 32,6 s précédents). Aucune modification fonctionnelle supplémentaire ni répétition des suites après ce simple enregistrement Git.
- Livraison : code publié sur GitHub ; pack PocketBase dashboards-widgets-20261020 inchangé. Aucun déploiement NAS ni installation du pack effectué ou confirmé. Prochaine action : recette utilisateur sur l’environnement installé.


### 21 octobre 2026 — Dashboard : retrait des tableaux dans les cartes

- Retrait intérieur de 12 px autour des tableaux des widgets, y compris le carrousel, Temps et les aperçus ; contexte et pagination des données métier alignés sur ce retrait. Correction CSS ciblée, sans modification des cellules, de la grille ou des données. Contrat UX 07 actualisé ; statuts et compteurs globaux inchangés.
- Vérifications : lint et `git diff --check` réussis ; Chromium quatre parcours existants / 24,6 s réussis (grille, aperçu, carrousel connecté). Captures tableau clair, dashboard connecté sombre et aperçu mobile inspectées ; défilement et liens préservés. Premier lancement interrompu avant tests car l’ancien binaire PocketBase temporaire avait disparu ; binaire officiel 0.40.4 récupéré dans /private/tmp/horizon-spacing-tools puis recette sur base locale jetable réussie. Pas de tests unitaires supplémentaires pour ce seul ajustement CSS ; pas de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée. Aucun changement PocketBase ni nouveau pack requis. Prochaine action : recette utilisateur de l’espacement ; aucune installation NAS effectuée.


### 21 octobre 2026 — Dashboard : suppression du rappel de filtres

- À la demande utilisateur, suppression sans remplacement de la ligne périmètre/période/état des widgets de données métier, du carrousel et des aperçus (« Données accessibles · Toutes périodes »). Titre suivi directement du contenu ; retrait de 12 px précédent conservé. Prop de présentation devenue inutile retirée, filtres et droits inchangés. Contrat UX 07 actualisé ; statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript et `git diff --check` réussis ; Chromium un parcours existant / 6,5 s réussi, aperçu clair/sombre et écrans étroits, capture tableau à 980 px inspectée. Pas de nouveau test unitaire pour cette suppression de texte ; pas de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée, espacement précédent conservé. Aucun changement PocketBase ni nouveau pack. Prochaine action : recette utilisateur du dashboard simplifié ; aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : date centrée et gestion dans une popup

- Périmètre utilisateur réalisé : HPageHeader en une ligne desktop avec titre à gauche, date et période groupées au centre, roue à droite. Sélecteur et actions permanentes supprimés du contenu de consultation ; popup Mes dashboards pour choisir la disposition, définir le favori, dupliquer, supprimer et modifier. Période détaillée déplacée dans cette popup. Édition conservant son nom et ses actions de travail, roue désactivée pendant le brouillon ; retours de focus et fermeture au clavier traités. Sur mobile, dates repliées sous le titre sans débordement.
- Contrats 04/07 et recette 09 actualisés ; corrections locales précédentes de retrait des tableaux et suppression du rappel de filtres conservées. Statuts et compteurs globaux inchangés.
- Vérifications : `pnpm check` réussi, 451 tests / 97 fichiers, lint/types/build ; Chromium sept parcours / 36,5 s réussis et `git diff --check` réussi. Captures en-tête/popup clair/sombre/mobile inspectées, centrage/alignement/focus, choix/default/copies/suppression, sauvegarde multi-navigateurs, conflits et widgets vérifiés. Première passe et corrections de tests/focus détaillées dans 09. Pas de nouvelle suite serveur nécessaire, ni recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; aucun changement PocketBase, nouvelle migration ou pack. Prochaine action : recette utilisateur de l’en-tête et de la popup ; aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : organisation de la popup Mes dashboards

- Popup réorganisée sans changement métier : bloc Dashboard affiché avec sélecteur pleine largeur et favori libellé, bloc Disposition avec Modifier primaire et Dupliquer secondaire, rappel de dates discret sans répétition du texte Indicateurs et pilotage. Suppression isolée à gauche du footer, Fermer à droite ; confirmation conservée. Barre d’édition conservée dans la page, plus reproduite dans cette popup. Composants HDialog/HSectionHeading/HCombobox/HButton/HDialogFooter réutilisés ; contrat UX 07 actualisé, statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript et `git diff --check` réussis ; Chromium quatre parcours existants / 18,1 s, puis parcours final de présentation / 5,9 s réussis après simplification du rappel de période. Choix, favori, édition, duplication/suppression, confirmation, sauvegarde multi-navigateurs et focus conservés. Captures clair/sombre/mobile inspectées. Pas de nouvelle suite serveur, aucune recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; ajustements précédents conservés. Aucun changement PocketBase ni nouveau pack. Prochaine action : recette utilisateur de la popup réorganisée ; aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : retrait de la période dans Mes dashboards

- Rappel de période supprimé de la popup à la demande utilisateur, sans remplacement. Prop et styles devenus inutiles retirés ; dates et navigation conservées uniquement dans l’en-tête. Contrats 04/07 corrigés ; autres ajustements locaux conservés, statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript et `git diff --check` réussis ; Chromium un parcours existant / 6,1 s réussi, absence du rappel, en-tête, popup, focus et écrans étroits vérifiés ; capture clair inspectée. Pas de nouvelle suite serveur ni recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée. Aucun changement PocketBase ni nouveau pack ; prochaine action : recette utilisateur de la popup simplifiée, aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : commandes d’édition superposées aux widgets

- Déplacer/configurer/dupliquer/retirer dans une barre compacte flottante sur le widget, avec fond neutre à 82 % et léger flou. Affichage au survol/focus, permanent sur appareil sans survol ; libellés accessibles conservés. Redimensionnement également superposé. Bandeau, titre dupliqué et espaces réservés supprimés ; outline d’édition sans consommation de place, contenu/bordures/typographie et titre des petits raccourcis identiques à la consultation. Contrat UX 07 et recette 09 actualisés ; statuts et compteurs globaux inchangés.
- Vérifications : lint/TypeScript et `git diff --check` réussis ; Chromium six parcours / 28,6 s puis contrôle enrichi tactile / 14,7 s réussis. Hauteur utile inchangée, 80 px conservés en 2H × 1V, pointeur/clavier/Échap, duplication/retrait/configuration et persistance vérifiés ; contexte tactile émulé vérifiant accès permanent et configuration au tap. Captures clair/petit format/sombre/tactile inspectées. Pas de recette NAS/Safari/tactile matériel, pas de changement serveur nécessitant une nouvelle suite backend.
- Livraison locale non committée/non poussée ; autres ajustements locaux conservés. Aucun nouveau pack PocketBase ni migration. Prochaine action : recette utilisateur de l’édition en surimpression ; aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : retrait du bandeau global d’édition

- Correction utilisateur réalisée : plus de ligne supplémentaire nom/actions ni de phrase d’aide au passage en édition. Nom éditable dans l’emplacement du titre HPageHeader, dates inchangées au centre, boutons compacts Ajouter/Restaurer/Annuler/Enregistrer à la place de la roue. Hauteur d’en-tête stable dans les deux modes, y compris mobile ; aides conservées dans les titres des commandes. Surimpressions des widgets et toutes les actions existantes préservées. HPageHeader accepte un contenu React pour son titre sans modifier les autres pages. Contrats 04/07 et recette 09 actualisés ; statuts et compteurs globaux inchangés.
- Vérifications : `pnpm check` réussi, lint/types, 451 tests / 97 fichiers et build ; Chromium sept parcours / 38,9 s et `git diff --check` réussis. Régression sur la position verticale de la grille/contenu avant/après édition desktop et mobile tactile émulé, sauvegarde/annulation/conflit, données/widgets et multi-navigateurs. Captures clair et tactile sombre inspectées. Aucun changement serveur nécessitant une suite backend ; pas de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée, autres ajustements locaux conservés. Aucun pack PocketBase ni migration ajouté. Prochaine action : recette utilisateur de l’édition sans décalage ; aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : roue avec menu déroulant Horizon

- Popup de gestion remplacée par un menu déroulant ancré sous la roue, conformément aux fiches Horizon : choix direct de la disposition avec coche et repère par défaut, Modifier/Dupliquer/Utiliser par défaut puis Supprimer séparé avec confirmation conservée. Pas de popup centrale ni fond assombri ; dates et édition sans décalage inchangées. HActionMenu extrait du menu existant et réutilisé par HRecordActions et Dashboard, styles partagés et clavier/focus conservés. Contrats 04/07 et recette 09 actualisés, anciennes mentions de popup remplacées dans le contrat courant ; statuts et compteurs globaux inchangés.
- Vérifications : `pnpm check` réussi, 451 tests / 97 fichiers, lint/types/build et `git diff --check` ; Chromium ciblé huit parcours / 40,0 s réussis, dont archivage réel d’une société de fixture via la roue partagée. Clair/sombre/mobile inspectés, pas de régression de la grille ou des actions. Premier parcours Contacts large interrompu avant la roue sur l’attente du champ Société d’une personne : limite documentée dans 09, pas de validation globale Contacts annoncée ; attente à investiguer séparément. Aucun changement serveur ni nouvelle suite backend requise, pas de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; tous les ajustements précédents conservés. Aucun nouveau pack PocketBase ni migration. Prochaine action : recette utilisateur du menu ; investigation distincte de l’ancien parcours Contacts si nécessaire. Aucune installation NAS réalisée.


### 21 octobre 2026 — Pagination : libellé Auto simplifié

- HListPagination partagé affiche uniquement Auto au lieu de Auto · N/page, dans les cartes comme les tableaux. Calcul adaptatif, choix manuels 25/50/100 et critères de liste inchangés ; contrat UX 07 actualisé, statuts et compteurs globaux inchangés. Le test existant contrôle désormais la taille demandée à l’API plutôt que de lire le nombre retiré du libellé.
- Vérifications : lint ciblé et `git diff --check` réussis ; Chromium un parcours / 10,2 s réussi, libellé exact Auto, adaptation à l’écran/cartes/mobile, choix manuel, groupes et navigation conservés. Capture cartes inspectée (thème clair effectivement rendu, malgré le nom du fichier). Pas de nouvelle suite backend ni recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; autres ajustements conservés. Aucun changement PocketBase ou nouveau pack. Prochaine action : recette utilisateur du libellé ; aucune installation NAS réalisée.


### 21 octobre 2026 — Pagination : sélecteur plus étroit

- Largeur du sélecteur partagé réduite de 126 à 76 px en Auto ; 104 px pour les valeurs manuelles afin de conserver leur libellé lisible. Hauteur et comportement adaptatif inchangés. Contrat UX 07 actualisé, statuts et compteurs globaux inchangés.
- Vérifications : lint ciblé et `git diff --check` réussis ; Chromium un parcours existant / 10,2 s réussi (Auto, adaptation des vues/tableaux/cartes/mobile, tailles manuelles, groupes et navigation). Capture desktop inspectée. Pas de nouveau test pour ce retrait CSS, de suite backend ou de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; autres ajustements conservés. Aucun changement PocketBase ou pack. Prochaine action : recette utilisateur du format compact ; aucune installation NAS réalisée.


### 21 octobre 2026 — Dashboard : gestion compacte et création explicite

- Roue restructurée : nom courant et favori, Changer de dashboard, Ajouter un dashboard, puis actions sur la disposition. Le choix ouvre une recherche et une liste défilante dans le même panneau, avec retour ; dix dispositions n’allongent plus le menu principal. Création vide ou depuis le modèle Horizon, nom éditable et sauvegarde explicite. Limite existante de 12 dispositions maintenue et expliquée. En-tête, grille, données, droits et persistance inchangés ; contrats 04/07 actualisés. Statuts et compteurs globaux inchangés.
- Vérifications : `pnpm check` final réussi (lint, TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite préexistant) et `git diff --check` réussi ; sept parcours Chromium / 31,8 s réussis, dont scénario à dix dashboards et création, recherche sans accents/clavier, annulation et persistance. Captures clair/sombre/mobile inspectées, aucune sortie du panneau à 390 px. Le passage entre sous-menus latéraux essayé initialement a montré un défaut au pointeur ; remplacement par une navigation interne, puis régressions réussies. Pas de recette NAS/Safari/tactile matériel ni nouvelle suite serveur.
- Livraison locale non committée/non poussée. Aucun changement PocketBase ni nouveau pack nécessaire ; installation NAS non réalisée. Prochaine action : recette utilisateur de la gestion des dashboards ; autres modifications locales conservées.


### 21 octobre 2026 — Dashboard : entrée en édition identifiable

- Action renommée Modifier ce dashboard, remontée en premier sous le nom courant, crayon et accent rose discret permanent, précision Widgets et disposition. Autres actions inchangées ; contrat UX 07 actualisé, statuts et compteurs inchangés.
- Vérifications : lint ciblé, TypeScript et `git diff --check` réussis ; sept parcours Chromium / 32,4 s réussis. Test de menu vérifiant le premier emplacement, le nom accessible et la précision ; nouvelle passe visuelle ciblée réussie après ajout du défaut de couleur en thème clair. Captures clair/sombre/mobile inspectées. Pas de nouvelle suite unitaire/build (changement de présentation), de recette NAS/Safari ou tactile matériel.
- Livraison locale non committée/non poussée ; aucune modification PocketBase ni nouveau pack. Prochaine action : recette utilisateur de la visibilité de Modifier ; autres modifications locales conservées.


### 21 octobre 2026 — Dashboard : accent sur le texte uniquement

- Modifier ce dashboard conserve sa première position ; suppression du sous-texte Widgets et disposition, du fond rose et du gras spécifique. Seul le texte est rose, crayon neutre et survol partagé conservés ; contrat UX 07 actualisé, statuts et compteurs inchangés.
- Vérifications : lint ciblé, TypeScript et `git diff --check` réussis ; parcours Chromium du menu / 5,9 s réussi, libellé exact vérifié, captures clair/sombre/mobile produites et mobile sombre inspectée. Pas de suite complète, build ou recette NAS/Safari/tactile matériel pour cet ajustement de présentation.
- Livraison locale non committée/non poussée ; aucune modification PocketBase ni pack. Prochaine action : recette utilisateur du libellé simplifié ; autres changements locaux conservés.


### 21 octobre 2026 — Dashboard : crayon rose

- Crayon de Modifier ce dashboard aligné sur la couleur rose du texte ; absence de fond et de sous-texte conservée. Contrat UX 07 actualisé, statuts et compteurs inchangés.
- Vérifications : `git diff --check` réussi ; parcours Chromium du menu / 5,7 s réussi, captures clair/sombre/mobile produites, mobile sombre inspectée. Pas de nouvelle suite complète, build ou recette NAS/Safari/tactile matériel pour cette règle CSS.
- Livraison locale non committée/non poussée ; aucun changement PocketBase ni pack. Prochaine action : recette utilisateur ; autres modifications locales conservées.


### 21 octobre 2026 — Dashboard : copie regroupée dans Ajouter

- Suppression de Dupliquer dans la roue principale. Ajouter conserve Vide et Modèle Horizon, et propose À partir de ce dashboard sur une disposition personnelle pour créer une copie indépendante. Contrats 04/07 et parcours adaptés ; statuts et compteurs inchangés.
- Vérifications : lint ciblé, TypeScript et `git diff --check` réussis ; trois parcours Chromium ciblés / 10,8 s réussis sur fixture neuve : copie indépendante et suppression, menu clair/sombre/mobile, dix dispositions/création/recherche. Capture mobile sombre inspectée. Première suite élargie interrompue après le blocage du long parcours existant sur une poignée Déplacer Commandé recouverte par la topbar à 980 px ; le défaut a laissé une préparation et perturbé le comptage du scénario suivant. Le ciblage neuf valide les parcours modifiés ; la suite complète n’est pas annoncée réussie. Investigation de la visibilité de cette poignée à poursuivre séparément. Pas de build, recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; aucun changement PocketBase ni pack. Prochaine action : recette utilisateur du menu simplifié ; autres changements locaux conservés.


### 21 octobre 2026 — Messagerie : diagnostic des e-mails entrants absents

- Investigation seule : MessagingPage et GET /messaging/messages consultent exclusivement messaging_email_messages (envois privés du propriétaire). Les réponses importées sont dans messaging_email_replies, projetées dans les fils métier via Messaging/Activity ; aucun onglet ou endpoint de consultation des réponses dans la page Messagerie. Réception générale Microsoft explicitement hors périmètre du lot actuel dans 04/08. Absence d’affichage confirmée dans le code, sans conclure sur l’état réel de la relève Microsoft/NAS.
- Vérifications : lecture des contrats 04/05/08, page, repository, API de liste et projection Activity. Aucun changement applicatif, aucune requête sur la boîte Microsoft ou base NAS, aucun test fonctionnel exécuté. Statuts et compteurs inchangés.
- Prochaine action : préciser avec l’utilisateur si la demande porte sur les réponses aux envois Horizon ou sur tous les e-mails Microsoft, puis cadrer la vue Reçus et les droits nécessaires. Diagnostic local, aucun commit/push, pack ni installation ; autres modifications locales conservées.


### 21 octobre 2026 — Messagerie : consultation personnelle des réponses reçues

- Périmètre confirmé : réponses aux envois Horizon uniquement. Ajout du dossier Reçus dans Messagerie, tableau partagé avec date réelle, recherche/filtres/groupes/tri et pagination serveur ; lecture texte sûre, avertissements, pièces jointes dans le gestionnaire partagé et accès au devis/BC. Liste non rechargée à l’ouverture du détail. Routes privées list/detail/attachment, propriétaire de l’envoi sent et droit métier contrôlés avant comptage/pagination/lecture/fichier ; DTO en allowlist. Réponses existantes réutilisées, relève/Graph/notifications/immutabilité et API Rules natives inchangées. Contrats 04/05/06/07/08 et travaux actifs actualisés ; R07 reste En cours, compteurs globaux inchangés.
- Vérifications : `pnpm check` réussi (lint, TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite préexistant) ; cinq scénarios serveur ciblés réussis avec PocketBase 0.40.4 éphémère et faux Microsoft : pagination de 32 réponses, recherche, contexte Devis/BC, compte tiers refusé, retrait de droits, fichiers protégés et authentification, déduplication, consentement et refus de rattachement incertain. Chromium quatre parcours / 20,5 s réussis (configuration, OAuth simulé, envoi immédiat, Reçus) puis contrôle visuel ciblé / 8,5 s réussi ; recherche top bar, URL/rechargement, pagination, texte non exécuté, aperçu image, erreurs/Réessayer et mobile. Captures message clair, liste sombre, aperçu et mobile sombre inspectées. Les premiers échecs de sélecteur nom+adresse et d’état de thème de fixture ont été corrigés dans le test. `git diff --check` et ZIP/manifeste/empreintes réussis. Pas de boîte Microsoft réelle interrogée, de suite serveur complète, de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; autres modifications conservées. Pack `/private/tmp/horizon-pocketbase-messagerie-recus-20261021.zip` préparé (327 sources/329 entrées, 1 094 360 octets, SHA-256 b8e67d20c710dac89f32938c3da7402304399f8e2081a60e87d84ddea5c2ae97), hooks complets et migrations inchangées jusqu’à 0041 ; aucune nouvelle migration/variable/portée OAuth. Installation NAS non effectuée/non confirmée. Prochaine action : installer le pack, redémarrer PocketBase et recetter Messagerie → Reçus avec les réponses déjà importées.


### 21 octobre 2026 — Devis : contact modifiable et texte aligné

- Contact existant rendu visible en lieu de l’ancienne date, Commercial à droite, deux dates en dessous. Reprise de l’opportunité en création, recherche des contacts de sa société et modification/effacement dans le brouillon sans modifier le CRM ; conservation en relecture et pour les clients anciens omettant le champ. Validation serveur : contacts.read, personne active et société canonique identique ; audit/fil enrichis. Contact accepté conservé en révision de commande. Aucun changement de schéma ni d’historique finalisé. Descriptions : hauteur automatique fondée sur les bordures calculées, interligne 18 px et retrait cohérent, ligne simple 26 px et multilignes sans rognage. Contrats 04/05/06/07/08 et travaux actifs actualisés ; C03/C04 restent En cours, compteurs inchangés.
- Vérifications : `pnpm check` réussi (lint/types, 451 tests / 97 fichiers, build ; avertissement Vite préexistant), lint ciblé et `git diff --check` réussis. Quatre tests serveur ciblés réussis : reprise/changement/effacement/compatibilité/droits/contact étranger ou inactif/finalisation, cycle et snapshots, révision de commande exécutée via unittest. Chromium Contact seul / 7,9 s puis deux parcours cycle/contact / 21,1 s réussis ; révision de commande / 8,6 s réussie dans la première passe. Assertion obsolète du cadre viewport adaptée à la table réelle selon le contrat partagé, puis cycle réussi. Captures clair/sombre/mobile inspectées ; valeur sauvegardée vérifiée via API autorisée et CRM inchangé. Pas de suite serveur/E2E complète, recette Gotenberg/Microsoft réelle/NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée ; autres modifications préservées. Pack `/private/tmp/horizon-pocketbase-contact-devis-20261021.zip` préparé, inclut Reçus : 327 sources/329 entrées, 1 094 625 octets, SHA-256 97f9e73e0c0ad2dbaca1eb90c05da88302cfe65e0d65d43061c42b021c484e47, ZIP/manifeste/empreintes vérifiés. Migrations inchangées jusqu’à 0041, aucune nouvelle variable. Installation NAS non effectuée/non confirmée. Prochaine action : installer les hooks, redémarrer PocketBase et recetter le formulaire de devis.


### 21 octobre 2026 — Devis : proposition d’actualisation des coûts produit à la demande

- Investigation sans changement applicatif : coûts et snapshot catalogue sont conservés par le devis, associations produit/offre existantes non rafraîchies par sales-line-catalog ; coût courant disponible par Catalog.productPrice/quoteLine. Une ligne en mode marge recalcule actuellement son prix de vente lorsque le coût change (pricing serveur), point à rendre explicite pour éviter une hausse commerciale involontaire.
- Proposition soumise : action Actualiser le coût à la ligne et Actualiser les coûts produits au niveau du tableau ; comparatif avant/après sélectionnable avec effet sur marge/prix, conservation des prix de vente par défaut et option explicite de maintien du taux de marge. Respect de la source tarif/fournisseur choisie, protection des coûts retouchés et diagnostic des lignes non actualisables ; brouillons uniquement, calcul/contrôle serveur et sauvegarde explicite. Aucun effet sur les pièces finalisées. L’origine des coûts manuels et la mise à jour ciblée du snapshot devront être conçues avant implémentation pour ne pas déduire arbitrairement cette origine des anciens montants.
- Vérifications : lecture des contrats 04/05, logique Catalog/pricing/snapshot et grille du devis ; aucune nouvelle exécution de tests ni accès NAS/Microsoft. Statuts et compteurs inchangés. Proposition locale uniquement, aucun code/pack/commit/push ni installation pour cette demande. Prochaine action : recueillir le retour utilisateur sur ce fonctionnement avant réalisation ; autres modifications locales préservées.


### 21 octobre 2026 — Préparation de la publication des ajustements Dashboard/Messagerie/Devis

- Publication demandée par l’utilisateur de l’ensemble du travail local depuis 5bb90d5 : en-tête/gestion/édition de dashboards et pagination compacte, consultation Reçus avec routes privées et pack, contact modifiable des devis et descriptions alignées. L’actualisation volontaire des coûts produit reste une proposition UX documentée, sans implémentation annoncée.
- Vérifications antérieures réutilisées sans relance inutile : derniers pnpm check réussis (lint/TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite connu), parcours navigateur et tests serveur ciblés consignés dans les entrées précédentes. Contrôle final git diff --check réussi ; aucun changement de migration, nouveaux fichiers limités aux composants/hooks/tests annoncés. Fetch origin exécuté ; publication sans force sur main. Pas de déploiement ou recette NAS/Microsoft supplémentaire.
- État avant publication : local vérifié, commits et push à exécuter ; packs locaux préparés et installation NAS non confirmée. Prochaine action : publier puis consigner l’empreinte Git réellement poussée.


### 21 octobre 2026 — Publication Git des ajustements Dashboard, Reçus et Contact devis

- Commit fonctionnel `d0fd351` poussé avec succès sur `origin/main` depuis `5bb90d5` : améliorations du dashboard/pagination, consultation privée des réponses reçues et contact de devis modifiable avec descriptions alignées, composants partagés et régressions associées. Aucun développement d’actualisation des coûts produit dans ce commit ; proposition UX seulement.
- Vérifications : fetch avant publication, branche distante sans divergence, git diff --cached --check réussi, push main confirmé par Git sans force. Les contrôles applicatifs/browser/serveur précédemment réussis et leurs limites restent ceux consignés avant publication ; aucune nouvelle recette applicative ou NAS. Suivi documentaire de publication ajouté séparément ; statuts et compteurs globaux inchangés.
- Livraison : code committé/poussé, packs PocketBase locaux préparés (dernier cumulatif contact-devis-20261021 inclut Reçus), installation NAS non effectuée/non confirmée. Le push ne déploie pas PocketBase. Prochaine action : installer le pack et recetter ; actualisation des coûts à réaliser seulement après reprise de ce chantier.


### 21 octobre 2026 — Devis : actualisation des coûts produit implémentée

- Proposition approuvée réalisée : action globale près de Lignes du devis et actualisation unitaire au coût, comparaison partagée avec sélection, ancien/nouveau/écart/source. Inchangées masquées, coûts personnalisés ou historiques non présélectionnés ; fournisseur et unité conservés. Prix de vente effectifs conservés par défaut, option taux de marge sur coût conservés, impacts calculés côté serveur.
- Application au formulaire seulement, Enregistrer persiste et Annuler les modifications rétablit le devis. Contrôles de brouillon/droits et concurrence source à l’application puis à la sauvegarde. Provenance de coût dans le JSON existant sans remplacement du snapshot d’identité ; aucune nouvelle migration. Contrats 04/05/06/07/08 mis à jour, résultats détaillés dans 09. Statuts C03/C04 et compteurs inchangés, recette intégrée restant à poursuivre.
- Vérifications réellement exécutées : pnpm check (lint/TS, 451 tests, build), trois tests PocketBase catalogue/coûts/snapshots (9,680 s), régression révision de commande unittest (2,839 s), deux parcours Chromium coûts/contact (10,6 s). Captures clair/sombre/mobile inspectées ; popup borné au viewport, tableau défilable sur mobile. Conflit 409 attendu et logs status 0 de navigation de fixture ; avertissement bundle préexistant. Pas de suite serveur/E2E complète ni de recette NAS/Safari/tactile matériel.
- Livraison locale non committée/non poussée. Pack cumulatif `/private/tmp/horizon-pocketbase-actualisation-couts-devis-20261021.zip` : 329 sources / 331 entrées, 1 097 813 octets, SHA-256 `501f4f3a638ec30f99943f5f96d5dee636a34f16572e1ad7d09505eb2dd4f53a`, ZIP/manifeste/empreintes vérifiés. Inclut Contact devis et Reçus, aucune nouvelle migration ni variable. Installation NAS non effectuée/non confirmée. Prochaine action : installer les hooks, redémarrer PocketBase et recetter un devis brouillon avec le frontend correspondant.


### 21 octobre 2026 — Devis : rendre l’actualisation des coûts identifiable

- Signalement du bouton invisible et du nouveau coût non trouvé. ↻ était volontairement masqué jusqu’au survol : désormais visible en permanence, renforcé au survol/focus. En absence d’écart disponible, afficher les coûts et leur source avec une explication au lieu d’un tableau vide. Contrat UX 07 actualisé.
- L’utilisateur précise avoir changé un prix dans Achats puis confirme que la mise à jour fonctionne. Aucun changement de source/calcul serveur pendant cette investigation ; cause initiale du blocage non établie, ne pas l’attribuer à un correctif. Test PocketBase fournisseur/historique/indisponibilité réussi (2,791 s). Lint ciblé/TypeScript réussis et scénario Chromium réel enrichi réussi (7,2 s), contrôle sans survol et sans écart, changement catalogue/relecture et parcours existant, clair/sombre/mobile. Résultats et limite dans 09 ; git diff --check réussi.
- Livraison locale non committée/non poussée. Ajustements frontend uniquement : pas de nouveau pack PocketBase, pack actualisation-couts-devis-20261021 précédent toujours applicable ; installation NAS non confirmée. Statuts/compteurs inchangés. Prochaine action : poursuivre la recette utilisateur, recueillir produit/source et réponse API si le coût non relu réapparaît.


### 21 octobre 2026 — Devis : correction de la source du coût actualisé

- L’utilisateur confirme finalement que le coût de la fiche produit n’est pas repris. Écart de logique trouvé : projection forçant le fournisseur de la ligne ou la référence historique, contrairement au coût effectif affiché sur la fiche. Correction : même règle que la fiche (manuel activé, sinon favori actif, sinon référence). Nouveau coût et sa source comparés explicitement ; fournisseur/identité historiques de la ligne inchangés, provenance cost_reference distincte et concurrence contrôlée sur la source courante. Contrats 04/05/06/08 actualisés. Statuts/compteurs inchangés.
- Vérifications : trois tests PocketBase (8,451 s) et nouvelle régression référence→favori/provenance sauvegardée (2,858 s), Chromium réel coûts complet (7,1 s), ZIP/manifeste/empreintes et git diff --check réussis. Pas de suite complète ni recette NAS, détail et limites dans 09.
- Livraison locale non committée/non poussée. Nouveau pack cumulatif `/private/tmp/horizon-pocketbase-cout-fiche-produit-20261021.zip` : 329 sources / 331 entrées, 1 097 929 octets, SHA-256 `f6a73b1c226fabb8c8c4cda1ebbb88c06206eb709fa3ff2294fa0f4d09dfee5c`. Remplace le précédent, aucune migration/variable nouvelle. Installation NAS non effectuée/non confirmée ; prochaine action : installer les hooks, redémarrer PocketBase et retester le coût du produit concerné.


### 21 octobre 2026 — Devis : action globale alignée sur les coûts

- À la demande utilisateur, déplacement d’Actualiser les coûts du titre de section à l’en-tête Coût sous forme de ↻, aligné sur ceux des cellules ; nom accessible et infobulle conservés. Contrats 04/07 actualisés, aucun changement de calcul ou de permission.
- Lint ciblé, TypeScript et parcours Chromium réel coûts réussis (7,5 s) ; régression vérifiant la présence dans l’en-tête et l’alignement à 1 px près, capture desktop inspectée. Parcours comparatif clair/sombre/mobile existant conservé, pas de suite complète ni de recette NAS. git diff --check réussi.
- Livraison locale non committée/non poussée, frontend uniquement ; aucun nouveau pack, correctif serveur cout-fiche-produit-20261021 précédent toujours requis, installation NAS non confirmée. Statuts/compteurs inchangés. Prochaine action : recette utilisateur du placement.


### 21 octobre 2026 — Devis : comparatif compact, ancien fournisseur

- Texte « Coût personnalisé ou historique : sélection manuelle. » retiré sans changer les choix par défaut. Ancienne source/fournisseur sous le coût du devis, source actuelle sous le nouveau coût ; nom produit seul, motif d’indisponibilité conservé. Sous-textes compacts ; DTO old_source serveur fondé sur la provenance du dernier coût puis le snapshot/offre, aucune migration. Contrats 05/07 et exploitation 06 actualisés.
- Lint ciblé/TypeScript, deux tests PocketBase provenance/fournisseur (6,038 s), scénario Chromium réel coûts (7,6 s), ZIP/manifeste/empreintes et git diff --check réussis. Hauteur nominale ≤42 px contrôlée, captures clair/mobile inspectées, parcours sombre existant conservé ; pas de suite complète ni recette NAS.
- Livraison locale non committée/non poussée. Pack cumulatif `/private/tmp/horizon-pocketbase-comparatif-couts-20261021.zip` : 329 sources / 331 entrées, 1 098 243 octets, SHA-256 `6749b1a15add10f9965fc1cab1a4dccc348e282fe377511c18cd20a477f225e0`, remplace le précédent, aucune nouvelle migration/variable. Installation NAS non effectuée/non confirmée. Statuts/compteurs inchangés ; prochaine action : installer hooks/redémarrer et recetter l’ancien fournisseur dans le comparatif.


### 21 octobre 2026 — Devis : récapitulatif d’impact plus visuel

- Panneau neutre unique avec titre partagé, compteur sélectionné et mention Hors options ; trois indicateurs côte à côte, avant discret/après accentué si changé, flèche et écart signé explicite. Aucun titre « Impact des 0 lignes » : état Aucune ligne sélectionnée. Empilement mobile et formulaire défilable pour ne pas comprimer la comparaison ; contrat UX 07 actualisé. Aucun calcul serveur ou droit modifié.
- Lint ciblé/TypeScript et scénario Chromium réel coûts réussis (7,3 s), captures clair/sombre/mobile inspectées, états zéro/une sélection et hauteur du tableau mobile couverts ; git diff --check réussi. Pas de suite complète ni recette NAS.
- Livraison locale non committée/non poussée, frontend uniquement, aucun nouveau pack. Pack comparatif-couts-20261021 précédent reste applicable ; installation NAS non confirmée. Statuts/compteurs inchangés ; prochaine action : recette visuelle utilisateur.


### 21 octobre 2026 — Préparation de publication : actualisation des coûts de devis

- Publication demandée par l’utilisateur : actualisation unitaire/globale, coût effectif de la fiche produit, comparaison avec ancien fournisseur, provenance/concurrence serveur, action globale alignée dans Coût et récapitulatif visuel. Ensemble du travail local depuis feedf63 ; pas de changement de dépendance ni migration.
- pnpm check relancé et réussi : lint, TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite préexistant de taille de bundle. git diff --check réussi. Tests PocketBase et Chromium ciblés exécutés durant les interventions ci-dessus, non relancés inutilement pour cette publication.
- État à rédaction : local, commit/push main en cours. Dernier pack cumulatif comparatif-couts-20261021 préparé et vérifié, installation NAS non effectuée/non confirmée ; le push ne déploie pas PocketBase. Statuts/compteurs inchangés. Prochaine action : confirmer la publication Git puis recette NAS avec les hooks et le frontend correspondants.


### 21 octobre 2026 — Publication confirmée : coûts de devis

- Commit fonctionnel `11ce098` poussé avec succès sur origin/main depuis feedf63 : actualisation volontaire des coûts et comparatif, ancien fournisseur/provenance, contrôles de concurrence et présentation compacte. Vérifications de la préparation ci-dessus réussies ; aucun changement applicatif après celles-ci.
- Livraison : code committé/poussé, pack cumulatif comparatif-couts-20261021 disponible localement, installation NAS non effectuée/non confirmée. Le push ne déploie pas PocketBase ; prochaine action : installer le pack, redémarrer et recetter avec le frontend correspondant. Statuts/compteurs inchangés.


### 21 octobre 2026 — Modèles de contenu des devis implémentés

- Périmètre approuvé réalisé : Paramètres → Devis → Modèles de devis, création vierge ou depuis un devis enregistré, éditeur de lignes partagé, aperçu, duplication et archives réversibles. Choix facultatif avec aperçu à la création d’un devis après l’opportunité ; structures, notes, prix fixes/règles de marge, remises/options, CGV et validité relative. Client/contact/commercial/affaire non copiés ; application au formulaire puis enregistrement ordinaire d’un brouillon indépendant. Catalogue courant relu, incompatibilités signalées, contrôle de modèle/source concurrente et tokens de coûts à la sauvegarde. Modèles de contenu distincts des mises en page PDF.
- Collection propriétaire sales_quote_templates privée et migration additive 1791840042 ; gestion Admin/Superuser avec settings.references et sales.read, utilisation sales.write/crm.read/inventory.read, pagination serveur et audit. Contrats 04/05/06/07/08 actualisés. Statuts C03/C04 et compteurs inchangés ; recette intégrée à poursuivre.
- Vérifications réellement exécutées : pnpm check final (lint/TS, 453 tests / 98 fichiers, build), deux scénarios PocketBase dédiés (5,922 s), deux parcours Chromium modèles/coûts (12,9 s), puis revue des paramètres voisins (9,8 s). Captures clair/sombre/mobile inspectées, largeurs/hauteurs et validité testées, git diff --check et pack final vérifiés. Avertissement bundle préexistant et logs de navigation de fixture observés ; limites et premières corrections de test documentées dans 09. Pas de suite serveur/E2E complète ni de recette NAS/Safari/PDF réelle.
- Livraison locale non committée/non poussée. Pack cumulatif `/private/tmp/horizon-pocketbase-modeles-devis-20261021.zip` : 331 sources / 333 entrées, 1 102 363 octets, SHA-256 `223cfccabb04750ea02fd58fb951b1cf01f92dd29311ea4d5a3a67de3a7df212`, ZIP/manifeste/empreintes vérifiés, inclut les correctifs précédents des coûts. Nouvelle migration 0042 requise, aucune variable nouvelle. Installation NAS non effectuée/non confirmée. Prochaine action : installer le pack, redémarrer PocketBase et recetter un modèle/devis avec le frontend correspondant.


### 21 octobre 2026 — Proposition : packs commerciaux au catalogue

- Investigation demandée : composition kit/assembly et inventory_product_components déjà prévues aux contrats 04/05 ; catalogue livré force composition_mode none, composition non implémentée. Proposition à valider : pack commercial avec produits/services et quantités, copie indépendante éditable dans le devis, choix d’impression pack seul ou pack avec composants, coûts issus des composants, prix commercial du parent compté une fois, stock/achats/livraisons sur composants, snapshots figés et resynchronisation explicite en brouillon. Aucun kit imbriqué proposé pour le premier lot ; cycles interdits.
- Vérifications : lecture des contrats et recherches catalogue/merge/migration uniquement ; aucun test ni contrôle navigateur pour cette investigation sans changement applicatif. Modèles de devis précédemment livrés préservés, statuts/compteurs inchangés.
- Livraison : note locale non committée/non poussée ; aucun nouveau pack ou déploiement NAS. Prochaine action : valider le fonctionnement UX et le périmètre, puis définir les adaptations de données Sales/Inventory/Documents et des flux de commande avant implémentation.


### 21 octobre 2026 — Kits : vocabulaire/préfixe et préparation de publication

- Cadrage utilisateur complété : appellation Kit retenue, Pack commercial écarté ; préfixe de référence modifiable dans Paramètres → Catalogue → Kits (KIT- proposé), sans renommage des références existantes. Aperçu à la sélection, ligne dépliable éditable localement au devis et deux choix d’impression proposés. Cadrage consigné dans 04 ; aucune implémentation/migration Kit annoncée.
- Publication demandée : modèles de contenu des devis (code, migration 0042, tests, docs) et cadrage Kit depuis 69ae98d. pnpm check de publication réussi (lint/TypeScript, 453 tests / 98 fichiers, build ; avertissement Vite de taille préexistant) et git diff --check réussi ; tests PocketBase/Chromium et pack vérifié documentés dans la livraison Modèles, non relancés pour le seul Git. Statuts/compteurs inchangés.
- État à rédaction : local, commit/push main en préparation. Pack modeles-devis-20261021 déjà préparé ; installation NAS non effectuée/non confirmée, le push ne déploie pas PocketBase. Prochaine action : confirmer contrôles/publication puis recette des modèles et reprise du développement Kits sur décision explicite.
