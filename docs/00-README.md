# Horizon — Documentation officielle

## Objet

Ce dossier constitue la documentation de référence du projet **Horizon**, l’ERP interne de CVS Engineering.

Horizon est destiné à un usage interne avec environ **10 utilisateurs simultanés** et un maximum réaliste d’environ **30 utilisateurs simultanés**.

Les priorités sont :

- simplicité ;
- modularité ;
- maintenabilité ;
- sécurité ;
- rapidité de développement ;
- faible complexité d’exploitation ;
- intégration forte entre les modules sans couplage anarchique.

---

# Ordre de lecture

Toute personne ou agent travaillant sur Horizon doit lire dans cet ordre :

1. `00-README.md`
2. `../AGENTS.md`
3. le document thématique concerné par la tâche

---

# Documents canoniques

| Fichier | Source de vérité pour |
|---|---|
| `00-README.md` | carte du projet et ordre de lecture |
| `01-PRODUCT-VISION.md` | vision, objectifs, périmètre, principes produit |
| `02-TECH-STACK.md` | technologies et composants techniques |
| `03-ARCHITECTURE.md` | architecture modulaire, frontières et dépendances |
| `04-FUNCTIONAL-SPECS.md` | spécifications fonctionnelles par module |
| `05-DATA-MODEL.md` | modèle de données PocketBase |
| `06-SECURITY-OPS.md` | sécurité, permissions, audit, exploitation |
| `07-UX-DESIGN-SYSTEM.md` | navigation, composants UI, règles UX |
| `08-INTEGRATIONS.md` | Microsoft, mail, Sage, PDF, API externes |
| `09-TESTING-RELEASE.md` | tests, CI/CD, préproduction, production |
| `10-DECISIONS-ROADMAP.md` | décisions, points ouverts et roadmap |

`AGENTS.md` se trouve à la racine du projet et impose les règles de travail aux agents de développement.

Pour tout nouvel écran ou changement UI, appliquer la [base de design validée sur Contacts](07-UX-DESIGN-SYSTEM.md#base-validée-sur-contacts-pour-tous-les-modules). Elle centralise les décisions utilisateur à reprendre dans les autres modules Horizon et prime sur les anciennes propositions de présentation. Lire aussi les [règles obligatoires de cohérence UI avant livraison](07-UX-DESIGN-SYSTEM.md#règles-obligatoires-de-cohérence-ui-avant-livraison), qui consolident les corrections utilisateur à ne pas répéter.

Le [suivi global de réalisation](10-DECISIONS-ROADMAP.md#suivi-global-de-réalisation) centralise les lots de la roadmap, leurs statuts, dépendances, critères de clôture et le journal d'avancement. Il est mis à jour après chaque livraison ou changement significatif.

Le [cadrage Utilisateurs, droits, managers et organigramme](04-FUNCTIONAL-SPECS.md#1822-cadrage-utilisateurs-droits-managers-et-organigramme) récapitule la cible demandée avant développement de la gestion des accès et d’Employés : profils ERP, responsabilités hiérarchiques, accréditations par module et périmètre, cible validée et périmètre livré (section 18.2.3).

Le volet **CRM / Appels d’offres** est accessible depuis `/crm` : opportunités directes ou AO après décision de répondre, dossiers AO autonomes en analyse / No go, préparation, visites / soutenances, dépôts et calendrier partagé. Voir le périmètre livré dans `04-FUNCTIONAL-SPECS.md`, le contrat dans `05-DATA-MODEL.md` et l’installation du lot AO dans `06-SECURITY-OPS.md`.

Paramètres → Apparence et densité centralise les réglages UX communs avec aperçu en direct (Admin / Superuser). Le lot nécessite les migrations `1791710002_ux_settings.js` et `1791710003_ux_appearance.js` et les hooks UX décrits dans `06-SECURITY-OPS.md` ; les règles visuelles sont documentées dans `07-UX-DESIGN-SYSTEM.md`.

**Assistant de fusion — 18 octobre 2026, local :** Paramètres → Qualité des données permet de rapprocher des sociétés, personnes et produits déjà enregistrés, avec sélection manuelle ou suggestions à la demande, comparaison et confirmation. Le même comparateur est accessible depuis les fiches. Nécessite les hooks et la migration additive `1791840029_product_merge.js`, puis reconnexion pour les droits ; installation NAS non confirmée. Extension Sociétés du 19 octobre : fusion de deux historiques avec adaptateurs propriétaires, anciens alias, pièces et fil regroupés sous leurs permissions ; aucun document finalisé ou stock n’est réécrit. Les restrictions Personnes / Produits restent appliquées. Voir [le périmètre livré](04-FUNCTIONAL-SPECS.md#assistant-transversal-de-fusion--livraison-locale-du-18-octobre-2026).

**Compteurs personnels — 20 octobre 2026, local :** Mon compte → Préférences regroupe compteurs, thème, confort personnel (recherche/menu/densité), signatures e-mail individuelles et notifications ; les valeurs administrateur restent les défauts partagés. Préférences par compte, communes aux navigateurs ; hooks complets et migration additive `1791840041_display_preferences.js` requis. Installation NAS non confirmée.

**Dashboard configurable — 20 octobre 2026, local :** instances indépendantes de widgets, grille en unités horizontales/verticales avec destination prévisualisée, sources et filtres propres, pages de carrousel configurables, nouveaux widgets Temps/Absences/À valider/Raccourcis. Anciennes dispositions conservées ; pack cumulatif dashboards-widgets-20261020 et frontend cohérent requis, sans nouvelle migration après 0041. Installation NAS non confirmée. Voir le contrat fonctionnel dans 04 et le pack dans 06.

## Démarrage local du frontend

Préférer Node 24 LTS (`.node-version`) et pnpm 12.9.1 (`packageManager` dans `package.json`). Les contraintes exactes sont déclarées dans `engines`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite écoute uniquement sur `127.0.0.1` ; utiliser l’adresse affichée dans le terminal. Sans URL PocketBase, le développement permet un aperçu du layout et de `/login` ; la production exige une connexion configurée. Les espaces non implémentés sont indiqués À venir.

**État de référence au 16 octobre 2026 :** les parcours Contacts, CRM/AO, Employés/accès, Documents/studio/étiquettes, catalogue Produits, devis/commandes clients, achats, opérations/inventaires/valorisation de stock, lots/séries, parc interne, registre préparatoire d’immobilisations, compte personnel, calendrier, premières analyses, facturation interne B01 et notes de frais mensuelles E01 et Congés L01 sont disponibles dans leur périmètre local testé. Cette liste ne vaut pas clôture de tous leurs raccordements. Voir [les travaux actifs et tâches restantes](10-DECISIONS-ROADMAP.md#travaux-actifs-et-prochaine-livraison), les contrats du document 04 et l’installation du document 06.

Le portail est développé localement ; les packs NAS remis actuellement sont **PocketBase seulement** (hooks, migrations, manifeste), sans frontend, base ni secrets. Les publications Git sont consignées dans le journal du document 10. L’installation du dernier correctif des fils d’activité sur le NAS reste à confirmer : hooks à jour et redémarrage, aucune nouvelle migration pour ce correctif ; les évolutions courantes nécessitent leurs migrations jusqu’à `1791840011_expense_vehicles.js`. Un push ne déploie pas le NAS.

Messaging chat, saisie Planning et intégration PROD OnSite, projets/SAV et intégrations Sage/SUPER PDP ne sont pas livrés par ces derniers lots. Facturation B01 est disponible dans son périmètre interne testé localement ; cela ne vaut pas recette NAS ni intégration comptable externe. Les chiffres financiers indisponibles ne sont pas remplacés par zéro. Le MFA est reporté ; la présence manuelle est préparée pour la future messagerie.

`.env.example` fournit l'URL publique de l'instance PocketBase de développement. Pour préparer cette configuration, copier le fichier vers `.env.local` ; ce fichier est ignoré par Git. Les valeurs `VITE_*` sont publiques et ne doivent contenir aucun secret. Avec cette URL, le login natif utilise `core_users` : appliquer d'abord les migrations et provisionner un compte Horizon, selon la procédure de `06-SECURITY-OPS.md`. Aucun compte superuser ne doit être utilisé dans le frontend. Sans variable, l'aperçu est limité au développement ; la production exige une connexion configurée.

```bash
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

Les commandes détaillées et la portée des tests sont décrites dans [Testing & Release](09-TESTING-RELEASE.md#vérifications-du-socle-frontend).

---

# Modules Horizon

```text
Dashboard
Messagerie
Calendrier
Contacts
CRM
Ventes
Achats
Stock
Projets
TimeReport
Congés
Notes de frais
Facturation
Comptabilité
Documents
Paramètres
```

---

# Architecture résumée

```text
React / TypeScript / Vite
          │
          ▼
Modules Horizon
          │
          ▼
Services / Repositories
          │
          ▼
PocketBase
          │
          ▼
SQLite
```

Services complémentaires :

```text
Documents
→ Tiptap
→ HTML
→ Gotenberg
→ PDF

Messagerie E-mail
→ MailProvider
→ Microsoft Graph ou SMTP

Messagerie Chat
→ PocketBase REST + Realtime
```

---

# Règle documentaire

Chaque information doit avoir un seul emplacement principal.

Après chaque intervention, documenter le résultat, les vérifications, les tâches restantes et l’état local / Git / NAS dans le journal et les travaux actifs du document 10, selon la règle obligatoire d’AGENTS.md.

Avant de créer un nouveau document, vérifier si le sujet appartient déjà à l’un des documents canoniques.

Exemples :

```text
nouveau champ AO dans CRM
→ 04-FUNCTIONAL-SPECS.md
→ 05-DATA-MODEL.md si impact BDD

nouvelle règle de permission
→ 06-SECURITY-OPS.md

nouvelle intégration externe
→ 08-INTEGRATIONS.md

nouvelle décision d’architecture
→ 10-DECISIONS-ROADMAP.md
```

Un document spécifique supplémentaire n’est créé que si le sujet devient réellement autonome et trop important pour rester dans le document thématique.

---

# Piliers transverses

Au-delà des modules, Horizon repose sur plusieurs mécanismes communs :

```text
Compte analytique / code CRM
→ fil conducteur commercial, projet, achats, heures, dépenses et facturation

Cycle documentaire
→ draft
→ validation
→ document officiel / opérationnel

Activity Feed
→ changements
→ notes
→ messages
→ mentions
→ tâches

Import
→ migration Odoo
→ catalogues Excel
→ matching
→ contrôle des doublons
```

Ces mécanismes doivent être réutilisés par les modules concernés au lieu d’être réimplémentés localement.

---


## Axes fonctionnels désormais structurants

Horizon doit être cohérent sur les axes suivants :

```text
Pilotage économique
→ prévu
→ engagé
→ réalisé
→ facturé
→ payé

Référentiel commercial
→ produits
→ prix
→ fournisseurs
→ TVA
→ devises

Workflows
→ draft
→ validation
→ exécution
→ archivage

Analytique
→ code CRM unique
→ ventes
→ achats
→ stock
→ heures
→ dépenses
→ facturation

Projet → recette → parc installé → SAV
→ continuité après livraison

Collaboration
→ Activity Feed
→ tâches
→ notifications
→ recherche globale
```

Les modules doivent réutiliser ces concepts communs.


# Règle principale

Horizon doit rester simple.

Une nouvelle technologie, couche, dépendance ou abstraction n’est ajoutée que si un besoin métier ou technique réel la justifie.


# Version V8

La V8 ajoute notamment :

- pricing / coûts / marges ;
- pilotage économique par compte analytique ;
- validation métier par permissions ;
- révisions devis ;
- commandes et réceptions partielles ;
- stock réservé / disponible ;
- séries / lots / RMA / inventaires ;
- organisation CVS / capacité ;
- baseline projet ;
- modèles documentaires enrichis ;
- recherche globale ;
- notifications ;
- multi-devise ;
- international ;
- archivage.


---

# Version V9

La V9 précise la continuité complète d’une affaire :

```text
Opportunité
→ plusieurs devis validés / acceptés possibles
→ plusieurs commandes possibles
→ projet
→ exécution
→ recette / réserves
→ clôture opérationnelle
→ parc installé
→ garantie
→ SAV / maintenance / interventions
```

La consultation fournisseurs / RFQ n’est pas incluse dans le périmètre actuel.


---

# Version V10

La V10 cadre trois domaines structurants :

```text
Employés / Ressources
→ tous les salariés, freelances, intérimaires et externes

Utilisateurs Horizon
→ uniquement les personnes disposant d’un accès applicatif

API externe Horizon
→ accès contrôlé par client, ressource, action et champs
```

Elle formalise également le contenu du module Paramètres, la numérotation configurable et la gestion TVA.


---

# Version V11

Pack consolidé de démarrage.

Il intègre l’ensemble des décisions V1 à V10 ainsi que la génération sécurisée des clés API.

Le projet est considéré comme suffisamment cadré pour démarrer l’implémentation.


---

# Version V12

La V12 fige les décisions suivantes :

```text
Taux de change
→ source unique BCE / ECB
→ historique quotidien
→ snapshot à validation
→ exchange_rate et tax_exchange_rate distincts mais même source BCE

Authentification
→ login Horizon natif par défaut
→ Microsoft OAuth2 / Entra en option
→ les deux peuvent coexister

Numérotation
→ identifiant technique PocketBase immuable
→ numéro métier configurable
→ historique des anciennes références
→ anciennes références recherchables
→ affichage ancien numéro configurable

Approbations
→ pas de moteur de seuils / approbateurs
→ permissions simples de validation

TVA
→ 20 % par défaut CVS
→ moteur général pour cas France / UE / export / exonérations
```


---

# Version V13

La V13 scelle le socle visuel initial de Horizon.

Elle ajoute :

- la charte Horizon officielle ;
- palette et gradient ;
- typographies Montserrat / Inter ;
- règles de densité ;
- usage contrôlé des couleurs ;
- composants de formulaire plus discrets ;
- layout de référence pour le Devis ;
- maquettes Dashboard / CRM / Devis comme références de direction.

Références :

```text
docs/07-UX-DESIGN-SYSTEM.md
docs/assets/horizon-brand-charter.png
docs/assets/horizon-ui-reference-dashboard.png
docs/assets/horizon-ui-reference-crm.png
docs/assets/horizon-ui-reference-quote.png
```

CRM — premier lot du 6 octobre 2026 : liste / Kanban des opportunités classiques, fiche, fil d’activité partagé, compte analytique et numéro serveur. Installation PocketBase et permissions spécifiques décrites dans `06-SECURITY-OPS.md` ; périmètre et limites dans `04-FUNCTIONAL-SPECS.md`. Les appels d’offres constituent le lot suivant.

CRM — paramètres du 7 octobre 2026 : page dédiée Présentation / Étapes / Types de marché, couleurs partagées entre colonnes et tags, qualification multiple. Installer le lot PocketBase décrit dans le document 06 avant d’utiliser ce frontend.

Paramètres — séquences et étapes fixes : rubrique Séquences pour les compteurs des modules activés, configuration par engrenage et couleurs personnalisées. Le CRM conserve les six étapes demandées, sans ajout / suppression ni changement de signification. Installer le lot consolidé Séquences décrit dans le document 06 ; numérotation et historique conservés.

Stock S02 : les opérations physiques et les inventaires planifiés sont disponibles dans Stock → Opérations / Inventaires ; entrepôts et verrou de comptage dans Paramètres → Stock. Contrats et limites : docs/04 et docs/05 ; tests / déploiement : docs/09 et docs/06.

Livraisons — 13 octobre 2026 : BL préremplis depuis commande, préparation optionnelle à réception, disponibilité et reliquats partiels vérifiés localement. Migration additive `1791840000_stock_deliveries.js` nécessaire ; contrats docs 04/05, installation doc 06, vérifications doc 09. NAS non installé.

Devis / Documents — 13 octobre 2026 : Sous-titre descriptif et bordures de styles configurables vérifiés localement ; migration `1791840001_quote_subtitle.js` et hooks synchronisés nécessaires. Contrats docs 04/05, installation doc 06 et tests/limites doc 09 ; NAS non installé.

Devis — 13 octobre 2026 : lignes vides conservées comme espacements jusque dans la commande et les documents ; migration `1791840002_quote_spacers.js` nécessaire. Contrats docs 04/05/07, installation doc 06 et tests doc 09 ; résultat local, NAS non installé.

Facturation B01 — 13 octobre 2026 : premier périmètre interne disponible localement (dashboard, clients/fournisseurs, avoirs, acomptes, règlements, modèles et conditions de paiement reliées aux clients). Nécessite les migrations 1791840003/1791840004/1791840005 et hooks/frontend cohérents. Les pièces multiples de commande nécessitent en plus 1791840006. Sage/SUPER PDP restent en standby ; recette et installation NAS non effectuées. Contrats docs 04/05, installation doc 06, suivi doc 10.

Notes de frais E01 — 14 octobre 2026 : saisie mensuelle, justificatifs multiples, invités restaurant, affaire/client/contact ou frais internes, validation manager et notifications, remboursements manuels distincts. Migration 1791840009 et hooks/frontend cohérents nécessaires ; habilitations explicites dans Utilisateurs et accès, employé actif associé et validateur habilité. EUR uniquement, exports comptables et raccordement de la marge d’affaire non livrés. Contrats docs 04/05/06/07, tests doc 09 et suivi doc 10 ; NAS non installé.

Notes de frais / UX — 14 octobre 2026 : popup par zones, mois modifiable sur principal brouillon/retour et fil d’activité partagé. Migration 1791840010 et hooks Activity/Expenses cohérents nécessaires, sans changement des montants/justificatifs historiques. Dernier pack UX décrit en docs 06 ; NAS non installé.


Ajustement du 14 octobre — les listes principales proposent le tri dans les en-têtes de colonnes sur leurs critères disponibles, synchronisé avec le panneau partagé et conservé dans l’URL. Le lot inclut des hooks de tri serveur à mettre à jour, sans nouvelle migration ; installation et pack consolidé dans `06-SECURITY-OPS.md`, vérifications et état de livraison dans le journal du document 10.

Correction du tri — 14 octobre : toutes les colonnes métier des listes principales sont raccordées, flèches à droite. Le pack PocketBase consolidé **column-sorting-complete** remplace le premier pack de tri ; voir 06 pour l’installation sans nouvelle migration et 10 pour les vérifications.

Congés L01 — 16 octobre 2026 : `/leave` propose demandes, validation manager, calendrier d’équipe et allocations RH individuelles. Installer les migrations 1791840016/1791840017 et les hooks/frontend cohérents ; configurer les accréditations Congés, le rattachement employé/manager, les jours travaillés et le calendrier métropolitain dans Paramètres → Congés, puis les allocations CP/récupération dans Congés → Allocations RH. Aucune acquisition automatique ni raccordement Planning/TimeReport. Contrats 04/05/06/07/09 et livraison dans 10 ; recette NAS non effectuée.

Congés — Direction sans responsable : déclaration directe avec décompte et information RH, annulation motivée avec restitution, selon le contrat 04. Hooks et frontend cohérents requis, aucune migration après 1791840017 ; installation et pack Direction dans 06.


Messagerie — 16 octobre 2026 : lot local **Microsoft Graph + OAuth délégué**, modèles/signatures dans Paramètres → E-mails, connexion de chaque expéditeur, compositeur partagé messages libres/devis/BC, PDF conservé et file persistante. PocketBase standard, aucun conteneur supplémentaire. Migration 1791840018 déjà installée selon utilisateur conservée à l’identique ; migration 1791840019 de compatibilité sans renvoi des anciens jobs, puis 1791840020 pour la réception ciblée des réponses devis/BC (activation par boîte et Mail.Read délégué). Envois et réponses affichent leur texte et leurs pièces dans le fil commun ; blocs plafonnés à 65 % sur desktop. L’ancien pack applicatif est obsolète ; configurer les variables serveur/URI Web et déployer le nouveau lot cohérent selon 06/08. Aucun envoi réel ni installation NAS effectué par l’agent ; vérifications/livraison dans 10.


Activité — 16 octobre 2026 : page `/activity` accessible depuis Espace de travail et le résumé du dashboard, vues Équipe / Mon activité / Mes mentions, recherche/filtres multiples, groupes, pagination et rendu commun notes/e-mails/pièces. Contrôle serveur de chaque source avant résultats et compteurs. Hooks et frontend cohérents requis, sans nouvelle migration ; pack unique PocketBase et état de recette dans 06/09/10. Installation NAS non effectuée par l’agent.


Documents / GED G01 — 16 octobre 2026 : bibliothèque `/documents`, espaces/dossiers, dépôt multiple, classement, rattachements, aperçu partagé, versions immuables et archives, droits explicites et catégories dans Paramètres → GED et classement. Migration additive 1791840021 et hooks/frontend cohérents requis ; premier lot limité aux nouveaux dépôts GED, sans déplacement des fichiers existants. Pack unique PocketBase et recette dans 06/09/10, installation NAS non effectuée.

Documents / GED G02 (17 octobre 2026) : bibliothèque des dépôts et projection en lecture seule des pièces métier existantes, dont PDF de devis envoyés et réponses jointes ; vue tous espaces, recherche par nom et thèmes. Contrats dans 04/05/06/07 et état réel dans 10 ; nécessite les hooks GED G02, sans migration supplémentaire à 0021.

GED G03 (17 octobre 2026) remplace le chargement global initial par une sélection Affaire/Client/Fournisseur puis lecture de ses seules pièces. Recherche et aperçu réutilisent le contexte chargé ; migration 1791840022 (index de lecture uniquement) à installer avec les hooks et le frontend. Les documents et fichiers historiques sont conservés. Voir 04/05/06/07 et recette/livraison dans 09/10.

Imports Contacts R05 — 17 octobre 2026 : pilote sociétés/personnes dans Contacts → Importer et Paramètres → Imports, fichiers CSV/XLSX et source API Odoo 19+, mapping, simulation/corrections et application confirmée par lots, historique privé et rapport. Migration 1791840026 et hooks/frontend cohérents requis ; clé serveur supplémentaire uniquement pour la connexion Odoo. Les autres domaines sont différés jusqu’à validation UX. Contrats 03/04/05/06/07/08, tests 09 et état réel 10 ; aucune installation NAS ni connexion Odoo réelle effectuée par l’agent.


TimeReport BE T01 — 18 octobre 2026 : saisie hebdomadaire et synthèse mois, activités de services internes et capacités/coûts datés dans Paramètres → Planning et temps, validation manager, notifications et analyse des heures/coûts validés. Migration additive 1791840030 et hooks/frontend cohérents ; droits TimeReport et employé associé à configurer après reconnexion. Planning et import PROD OnSite différés. Contrats docs 04/05, sécurité/installation 06, reconnaissance OnSite 08 et suivi 10 ; réalisation locale, installation NAS non effectuée.


TimeReport — éligibilité du 18 octobre 2026 : installer la migration additive 1791840032 avec hooks/frontend cohérents, classer les équipes BE/Production depuis leur fiche puis cocher « Saisit ses heures » sur chaque employé concerné. Aucun employé activé automatiquement ; droits ERP indépendants. Saisie native BE, récupération PROD OnSite ultérieure ; historiques conservés. Contrats 04/05, installation 06 et suivi 10.


Catalogue / TimeReport — 18 octobre : un seul choix Famille en fiche produit ; usage Service/Équipement/Fourniture configuré par famille dans Paramètres → Catalogue, migration additive 0033. Les anciens produits ne sont pas reclassés automatiquement : réapplication explicite de famille puis sauvegarde, dans les limites de traçabilité. Un service actif CVS peut ensuite être autorisé pour les temps. Voir contrats 04/05/07 et exploitation 06.
