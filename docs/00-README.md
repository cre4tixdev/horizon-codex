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

Pour tout nouvel écran ou changement UI, appliquer la [base de design validée sur Contacts](07-UX-DESIGN-SYSTEM.md#base-validée-sur-contacts-pour-tous-les-modules). Elle centralise les décisions utilisateur à reprendre dans les autres modules Horizon et prime sur les anciennes propositions de présentation.

Le [suivi global de réalisation](10-DECISIONS-ROADMAP.md#suivi-global-de-réalisation) centralise les lots de la roadmap, leurs statuts, dépendances, critères de clôture et le journal d'avancement. Il est mis à jour après chaque livraison ou changement significatif.

Le [cadrage Utilisateurs, droits, managers et organigramme](04-FUNCTIONAL-SPECS.md#1822-cadrage-utilisateurs-droits-managers-et-organigramme) récapitule la cible demandée avant développement de la gestion des accès et d’Employés : profils ERP, responsabilités hiérarchiques, accréditations par module et périmètre, cible validée et périmètre livré (section 18.2.3).

Le volet **CRM / Appels d’offres** est accessible depuis `/crm` : opportunités directes ou AO après décision de répondre, dossiers AO autonomes en analyse / No go, préparation, visites / soutenances, dépôts et calendrier partagé. Voir le périmètre livré dans `04-FUNCTIONAL-SPECS.md`, le contrat dans `05-DATA-MODEL.md` et l’installation du lot AO dans `06-SECURITY-OPS.md`.

## Démarrage local du frontend

Préférer Node 24 LTS (`.node-version`) et pnpm 12.9.1 (`packageManager` dans `package.json`). Les contraintes exactes sont déclarées dans `engines`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite écoute uniquement sur `127.0.0.1` ; utiliser l'adresse affichée dans le terminal. Le frontend affiche le layout Horizon, un dashboard avec états vides, la navigation réductible, le fil d'Ariane et une recherche des espaces (⌘ K / Ctrl K). Les espaces non implémentés sont signalés « À venir ». Le module Contacts propose les listes et fiches sociétés / personnes, les rôles, adresses, images et archivage ; son utilisation nécessite l’installation de la migration et des hooks Contacts et les permissions appropriées, selon le document 06. Le CRM propose les opportunités classiques en liste / Kanban, leurs fiches et le fil partagé après installation du lot CRM décrit dans le document 06. Employés fournit l’annuaire et l’organigramme ; Paramètres → Utilisateurs et accès gère les comptes et les accréditations après installation du lot décrit dans le document 06. Ventes propose désormais les brouillons de devis, leurs lignes HT libres, l’annulation et les liens depuis le CRM après installation du lot décrit dans le document 06. Stock propose le catalogue Produits, les familles tarifaires, les photos et les offres fournisseurs avec fournisseur favori ; les produits peuvent être ajoutés aux devis après installation du lot Catalogue P01 décrit dans le document 06. Les autres modules métier restent à venir. Sans URL PocketBase, le serveur de développement reste en aperçu du layout ; `/login` permet d'examiner l'écran de connexion.

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
Dépenses
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
- workflows d’approbation ;
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
