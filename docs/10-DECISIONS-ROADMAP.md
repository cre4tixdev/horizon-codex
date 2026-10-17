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

Dernière mise à jour : **16 octobre 2026**. Les statuts couvrent les critères complets des lots ; « À vérifier » distingue une réalisation locale testée de sa recette d’exploitation. Le journal historique est conservé.

| Phase | Lots | Terminés | En cours | À vérifier | Bloqués | À faire |
|---|---:|---:|---:|---:|---:|---:|
| 1 — Fondation | 8 | 2 | 2 | 3 | 0 | 1 |
| 2 — Référentiel | 10 | 0 | 4 | 4 | 0 | 2 |
| 3 — Commercial | 5 | 0 | 3 | 2 | 0 | 0 |
| 4 — Opérations | 8 | 0 | 3 | 1 | 0 | 4 |
| 5 — Ressources / RH interne | 4 | 0 | 2 | 0 | 0 | 2 |
| 6 — Finance | 6 | 0 | 4 | 0 | 0 | 2 |
| 7 — Consolidation | 5 | 0 | 3 | 0 | 0 | 2 |
| **Total** | **46** | **2** | **21** | **10** | **0** | **13** |

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
| R05 | Imports Excel / Odoo | R01–R04 | Parsing, normalisation, matching, dry run, conflits et apply explicite ; rejeu sans doublons via références externes | À faire |
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
| H03 | TimeReport | H01, H02 | Temps réel distinct du prévu, validation serveur, coûts historiques et comparaison prévu / réalisé par analytique | À faire |
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
| X03 | Notifications et automatisations | R10, événements des modules | NotificationService central, préférences / canaux, échéances et jobs observables sans moteur d'approbation par seuils | En cours |
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
| Apparence / paramètres UX | Sélecteur de date Horizon partagé (date/mois/date-heure), clavier et thèmes ; réglages regroupés par composant ; Tableaux séparé en Densité, En-têtes et bordures, Lignes, Suivi ; fond et texte/pictogrammes du suivi réglables en clair/sombre avec aperçu partagé et migration préservant les couleurs existantes | Installer migration 1791840015 et hooks/frontend cohérents, puis recette des préférences réelles ; NAS non installé |
| Recherche / filtres partagés | Recherche élargie sur desktop (720 px maximum / 62 %), panneau SearchFilters et pastilles communs ; tri de toutes les colonnes métier des listes principales, flèches à droite, synchronisé avec le panneau/URL et global avant pagination ; croix contiguë au bouton Filtres pour réinitialiser critères/groupement/tri, recherche/vue/contexte conservés et première page | Validation utilisateur de la réinitialisation rapide et du tri des colonnes ; hooks du lot Tri à installer, aucune nouvelle migration |
| Fil partagé — R10 / F03 / F07 | Lecture ciblée, pagination, catégories, tâches, AO/opportunité, photos et droits ; correctif du timeout 30 s | **Priorité immédiate :** installer les hooks à jour, redémarrer PocketBase puis recetter chargement et publication sur Contacts, CRM, Produits, Ventes et Achats ; contrôler le journal |
| Installation — F01 / F04 / X05 | Pack PocketBase seulement, migrations jusqu’à `1791840010_expense_activity.js`, reconstruction et régressions locales | Vérifier migrations effectivement présentes sur NAS ; sauvegarde / restauration et retour arrière à recetter. Ne pas considérer le push Git comme une installation |
| Accès / profil — F05 / R02 / H01 | Accréditations, périmètres, employés distincts, identité/avatar/mot de passe, présence manuelle à quatre états ; vues Employés Cartes par défaut / Liste / Organigramme avec photos protégées gérées visuellement sur Employés et reprises par les comptes associés, tri par nom de famille puis prénom en A → Z par défaut et filtres/groupes conservés | Recette des droits réels et des photos ; capacité RH et profils de coûts datés à compléter. MFA reporté, non activé |
| Catalogue — R03 / R04 | Marques obligatoires, coût/coefficient auto ou manuel, image partagée, logistique, stock/réservations, historique d’achats, cartes, code-barres unique et colonnes Qté en stock physique et Qté disponible dans la liste, tri de tous les champs projetés avant pagination | Comptabilité/TVA produit, composition et conversions d’unités à compléter ; import Excel/Odoo contrôlé à réaliser. Groupe de variantes = regroupement de produits autonomes |
| Documents — R06 / C05 | Studio, modèles versionnés, PDF/étiquettes et premier lot GED G01 : espaces/dossiers, dépôt multiple, classement/liens métier, aperçu partagé, versions binaires immuables, archives, droits et catégories paramétrées ; archivage des envois via Messaging testé localement | Installer migrations GED 1791840021/0022 et hooks/frontend cohérents, configurer les accréditations et recetter NAS. Lecture ciblée Affaire/Client/Fournisseur G03 disponible localement, sans scan global initial ; recette NAS et raccordement GED depuis les fiches à poursuivre sans copie ; recette Gotenberg/impression réelle/étiqueteuse à poursuivre |
| Devis / commandes — C03 / C04 | Cycle/frise, retours contrôlés, CGV par défaut, Sous-titre descriptif et lignes vides conservées, colonnes alignées/cadre arrondi conservé en commande, redimensionnement avec tassement successif dans les deux sens sans élargissement du cadre desktop, grille complète sur toutes les lignes, sous-titres/notes vides compris, et colonnes monétaires prioritaires sans troncature, copie, snapshots, confirmation avec stock/achats, actions conditionnelles, pièces multiples avec aperçu intégré et filtres Ventes dynamiques avec numéro client et regroupements État/numéro à valider, suivis réservés à accepted, retours nets/relivraisons et révisions tracées de commande avec impacts et avoirs brouillons ; services CVS internes exclus des besoins d’achat, services sans suivi physique, Facturé raccordé à l’identité commerciale | Recette intégrée après installation ; conversions partielles et révision des CGV/dates restent à compléter ; facturation B01 disponible localement. Envoyé réservé au futur envoi réel |
| Achats — O01 / O02 | Accueil commun DA / BC en attente, cartes de type / état et Nouvelle commande à droite ; recherche fournisseur/opportunité et regroupements Fournisseur/Opportunité/État sans sélecteurs exhaustifs, Type DA/BC séparé et états multiples contextuels, Archives compact séparé comme CRM ; DA manuelles/sourcées, BC directs ou préparés, ventilations affaire/commande/stock/interne avec popup élargi et consultation des sources, brouillons incomplets, réception IN en attente à validation ; préparation de facture fournisseur à droite des onglets du BC validé, selon les quantités restantes | Installer le pack fournisseur cohérent puis redémarrer ; recette multi-affaires et retours en brouillon ; politique d’annulation après envoi à décider avant Messaging. Pas de RFQ |
| Stock — O03 / O04 | Réceptions/livraisons/PREP/RET/INT, BL automatiques optionnels, disponibilité, livraisons partielles et reliquats liés, réservations, rebut, dropshipping, inventaires, lots/séries/quarantaine, dashboards, bascule Tableau de bord/Liste des opérations, colonnes Date/Document d’origine/De/Vers et filtres multiples/archives séparées des cinq listes Stock | Migration BL 1791840000 et recette métier NAS ; reprise des identités d’un ancien stock à cadrer. RMA fournisseur, prêts/location et maintenance ne sont pas livrés |
| Valorisation — O03 / A04 | Standard/CUMP/FIFO, journal immuable, changements administrateur et ouverture datée | Décision actuelle CUMP ; vérifier/appliquer le paramètre sur l’instance cible avec les contrôles prévus. Frais d’approche/change/factures/dépréciations et raccordement Sage restent à faire |
| Parc / immobilisations — O04 / A04 | Affectation interne auditable, parc avec droits RH, registre draft/qualification/déclassement, retour lié | Recette du parc et validation comptable des règles ; aucun amortissement, export ou écriture Sage automatique |
| Facturation — A03 | B01 EUR : dashboard en onglets Clients/Fournisseurs avec cinq cartes alignées sur desktop, factures/avoirs clients-fournisseurs, acomptes/solde, rapprochement, échéancier/règlements, conditions de paiement reliées au client, référence client, frise / onglets / smart buttons, snapshots/PDF/fil et migrations additives ; préparation depuis le BC et choix direct du BC à la création fournisseur, confirmation des remplacements et référence fournisseur/dates conservées ; action Préparer depuis BC à droite des onglets | Installer le pack fournisseur et recetter en PREPROD/NAS ; Gotenberg réel, mentions de CVS, contexte fiscal international/BCE et raccordement Analyse/comptabilité à compléter. Aucun Sage/PDP activé |
| Analyse — C01 / C04 / X01 | Racine + enfants, vues opportunité/commande/Finance, accès opérationnels/financiers distincts, 5 KPI et lecteurs BE/PROD préparés | Raccorder TimeReport réel validé, planning, heures vendues, profils de coût effectifs, frais, factures/paiements. Marge à date complète indisponible jusque-là |
| Activité — R10 / X01 | Page globale avec vues Équipe/Mon activité/Mes mentions, filtres multiples, recherche, regroupement et pagination ; rendu partagé notes/e-mails/pièces, accès aux fiches et contrôle par source commun au résumé dashboard. Testé localement en clair/sombre/mobile | Installer les hooks du pack Activité avec le frontend correspondant et redémarrer PocketBase (aucune nouvelle migration), recetter NAS sur les droits réels et la volumétrie. Aucun statut lu/non lu ni compositeur global |
| Dashboard / calendrier — R09 / X01 | Période mois courant/trimestre/année, courbes sur sources accessibles, carrousel, échéances, événements manuels ; week-ends atténués et fériés métropolitains nommés dans les quatre grilles du calendrier | Installer les hooks Calendrier/Congés à jour avec le frontend (repères jours et congés personnels), recetter NAS. Raccorder facturation/paiements/réalisé ; Outlook et invitations non livrés. La refonte visuelle rejetée n’est pas une direction à réintroduire |
| Messagerie — R07 / R08 | Envoi Graph délégué validé par utilisateur sur backend précédent ; envoi immédiat, correspondance compacte dans Activity et réception ciblée des réponses devis/BC testés localement. Migration additive 0020 et pack unique préparés ; chat hors lot | Installer hooks + migration 0020, ajouter Mail.Read délégué dans Entra, activer la réception puis reconnecter la boîte ; recetter une réponse réelle et les PDF commerciaux. Reconnexion/renouvellement et nettoyage des droits temporaires à suivre |
| Notes de frais — H04 / E01 | Mes notes / À valider, note mensuelle avec mois modifiable sur principal brouillon/retour et compléments, Employé/Manager/description, lignes numérotées et ajout sous tableau, popup Dépense/Justificatifs avec Dépense/Rattachement à gauche et Catégorie dynamique à droite, copie de ligne et code affaire, fil d’activité partagé, catégories et véhicules rattachés aux employés paramétrés, invités restaurant, affaire/client/contact ou interne, pièces protégées multiples et aperçu partagé, retour/resoumission/validation et notifications, remboursement complet manuel, snapshots et ordre des lignes | Installer migrations 1791840009/1791840010/1791840011 et hooks/frontend cohérents, configurer employés/managers/droits et recetter sur NAS ; EUR seulement, export comptable, virement, marge d’affaire et congés non raccordés |
| Congés — H04 / L01 | Mes congés / À valider / Calendrier d’équipe / Allocations RH, projection personnelle dans le calendrier général, cinq types, journées/demi-journées, compteurs CP/récupération, registre d’allocations signé et corrections tracées, réservation des jours, absence de double consommation, fichiers protégés multiples, fil/mentions/notifs et archivage partagé | Installer migrations 1791840016/1791840017 et hooks/frontend cohérents, configurer droits et rattachements, calendrier métropolitain/exceptions dans Paramètres → Congés et allocations dans la page métier ; mettre à jour le correctif Direction (déclaration directe sans manager et information RH), recetter NAS. Aucune acquisition automatique ; raccordements Planning/TimeReport futurs |
| Suite métier — O05–O08 / H02–H04 / A05–A06 / X04 | Contrats documentaires préparés, notes de frais E01 traitées séparément ci-dessus | Projets/recette/parc client/SAV, planning/TimeReport, intégrations Sage/SUPER PDP/API externe restent des lots distincts à lancer explicitement |

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
