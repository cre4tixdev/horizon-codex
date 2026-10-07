# AGENTS.md — Horizon ERP

## Mission

Tu développes **Horizon**, l’ERP interne de CVS Engineering.

Tu agis comme un développeur senior full-stack avec une attention particulière à :

- architecture modulaire ;
- PocketBase ;
- qualité du code ;
- sécurité ;
- cohérence des données ;
- UX ERP ;
- maintenabilité.

Ton objectif est de produire le **minimum de code propre nécessaire**.

---

# 1. Documentation à lire

Avant toute modification :

1. lire `docs/00-README.md` ;
2. lire ce fichier ;
3. lire le document thématique concerné ;
4. examiner le code existant ;
5. réutiliser les patterns validés.

Ne jamais remplacer une décision existante sans demande explicite.

---

# 2. Documentation canonique

Les seuls documents de référence par défaut sont :

```text
docs/00-README.md
docs/01-PRODUCT-VISION.md
docs/02-TECH-STACK.md
docs/03-ARCHITECTURE.md
docs/04-FUNCTIONAL-SPECS.md
docs/05-DATA-MODEL.md
docs/06-SECURITY-OPS.md
docs/07-UX-DESIGN-SYSTEM.md
docs/08-INTEGRATIONS.md
docs/09-TESTING-RELEASE.md
docs/10-DECISIONS-ROADMAP.md
```

Avant de créer un nouveau document, vérifier si l’information appartient déjà à l’un d’eux.

Ne pas créer un fichier spécifique à une feature si le sujet peut être intégré au document thématique correspondant.

---

# 3. Stack obligatoire

```text
React
TypeScript
Vite
React Router
Tailwind
shadcn/ui
Lucide
TanStack Query
TanStack Table
React Hook Form
Zod

PocketBase
SQLite
PocketBase JS Hooks
PocketBase Migrations
PocketBase Realtime

Tiptap
Gotenberg

Vitest
Playwright

Docker
GitHub Actions
```

Ne pas introduire sans validation :

```text
PostgreSQL
Prisma
NestJS
Express
Next.js
Redis
Kafka
RabbitMQ
GraphQL
Kubernetes
Elasticsearch
Redux
```

---

# 4. Architecture

Horizon est un monolithe modulaire.

Structure :

```text
src/modules/<module>
```

Chaque module possède :

```text
components
pages
hooks
schemas
services
repositories
types
routes
index.ts
```

---

# 5. PocketBase

Règle non négociable :

**aucun composant React ne doit appeler directement `pb.collection(...)`.**

Interdit :

```ts
await pb.collection("sales_quotes").getList()
```

Correct :

```text
UI
↓
Service
↓
Repository
↓
PocketBase
```

---

# 6. Data Model

`docs/05-DATA-MODEL.md` est le contrat de données.

Avant de créer ou modifier une collection :

1. vérifier le Data Model ;
2. mettre à jour le Data Model si le besoin change ;
3. créer une migration PocketBase ;
4. tester la migration ;
5. ne jamais modifier la production manuellement.

---

# 7. Propriété des données

Chaque collection possède un module propriétaire.

Exemples :

```text
contacts_companies → contacts
crm_tenders → crm
sales_quotes → sales
messaging_chat_messages → messaging
```

Un module ne modifie pas directement les données privées d’un autre module.

---

# 8. Logique métier

La logique critique ne doit pas exister uniquement dans React.

À mettre côté serveur lorsque nécessaire :

- permissions ;
- numérotation ;
- transitions ;
- cohérence multi-records ;
- audit ;
- génération document ;
- contrôle e-mail ;
- validation.

---

# 9. Sécurité

Toujours appliquer :

- moindre privilège ;
- API Rules explicites ;
- validation serveur ;
- aucun secret dans Git ;
- aucun superuser côté frontend ;
- Protected Files si nécessaire ;
- audit des actions sensibles.

Ne jamais contourner la sécurité pour “aller plus vite”.

---

# 10. Migrations

Toute modification du schéma :

```text
pocketbase/pb_migrations/
```

Une base neuve doit pouvoir être reconstruite depuis les migrations.

---

# 11. Documents

Architecture :

```text
Tiptap JSON
↓
HTML
↓
Gotenberg
↓
PDF
```

Un document envoyé ou finalisé est figé.

---

# 12. E-mail

Aucun module métier ne contacte directement Microsoft Graph ou SMTP.

Toujours :

```text
Messaging Service
↓
MailProvider
```

Le `From` est validé côté serveur.

---

# 13. Chat

Architecture :

```text
Chat UI
↓
Messaging Service
↓
Messaging Repository
↓
PocketBase REST + Realtime
```

Un utilisateur ne peut jamais lire une conversation dont il n’est pas membre.

Contrôle obligatoire via API Rules.

---

# 14. AO dans le CRM

AO est un sous-domaine du module `crm`, pas un module racine séparé.

Une opportunité CRM peut être `direct` ou `tender`.

`cre4tixdev/cvs-aoboard` est une référence fonctionnelle.

Fonctions à préserver / améliorer :

- Kanban ;
- drag & drop ;
- liste ;
- planning ;
- publication ;
- remise ;
- visites multiples ;
- responsable ;
- tags ;
- revenu ;
- documents ;
- archivage ;
- realtime.

Une création AO doit créer l’opportunité CRM et son extension AO de manière cohérente côté serveur.

Ne pas copier son architecture actuelle telle quelle.

Portage :

```text
CRM / Tender UI
↓
CRM Tender Service
↓
CRM Repository
↓
PocketBase
```

---

# 15. UI

Réutiliser le Design System.

Avant de créer ou modifier une page métier, lire les règles applicables de
`docs/07-UX-DESIGN-SYSTEM.md` et examiner une page existante qui les applique
(Contacts / CRM). Les décisions validées sur Contacts servent de base aux autres
modules ; ne pas repartir d'un design indépendant.

Pour toute liste métier principale, y compris Employés et Utilisateurs et accès :

- recherche contextuelle dans la top bar via `WorkspaceSearch` ;
- filtres, regroupement et tri dans le panneau partagé `SearchFilters`, avec ses pastilles ;
- même JSX et CSS partagés que Contacts : les modules déclarent leurs critères
  et leur logique métier, sans copie du panneau ni variantes locales de style ;
- les groupes de résultats utilisent `GroupedResults`, commun à Contacts et aux
  autres listes ; une modification visuelle commune doit se propager à tous ;
- aucun deuxième champ de recherche ou sélecteur de filtre dans la page ;
- critères conservés dans l'URL lors du rechargement, du changement de vue et de
  la fermeture d'une fiche ; réinitialiser les filtres conserve le texte recherché.

Les petites listes intégrées à une fiche peuvent conserver leurs contrôles dans
l'en-tête de section, selon le contrat du Design System. Les champs de saisie
d'un formulaire ne sont pas des filtres de liste.

Avant livraison d'une modification UI, confronter le résultat aux règles lues :
recherche / filtres, composants partagés, titres, typographie, densité, espacements,
couleurs, clair / sombre et responsive. Vérifier le parcours dans le navigateur
lorsque le comportement change ; compléter les tests de régression pertinents.
La documentation seule ne remplace pas cette vérification.

Créer un composant local uniquement s'il est spécifique au module.

Si un pattern est répété dans plusieurs modules, le déplacer vers le Design System ou `shared`.

---

# 16. TypeScript

TypeScript strict.

Éviter :

```text
any
@ts-ignore
casts inutiles
types dupliqués
```

---

# 17. Erreurs

Ne jamais masquer silencieusement une erreur.

Les erreurs doivent être :

- loggées si techniques ;
- compréhensibles côté utilisateur ;
- sans fuite d’information sensible.

---

# 18. Tests

Minimum :

```text
fonction pure → unit test
service métier → test service
parcours critique → Playwright
```

Un bug important corrigé doit idéalement ajouter un test anti-régression.

---

# 19. Dépendances

Avant d’ajouter une dépendance :

1. vérifier si la stack actuelle répond déjà ;
2. vérifier si quelques lignes suffisent ;
3. vérifier maintenance / maturité ;
4. expliquer pourquoi elle est nécessaire.

---

# 20. Git

Éviter de mélanger dans un même changement :

```text
feature
+
refactoring massif
+
mise à jour dépendances
+
changement de style global
```

---

# 21. Méthode de travail

Pour chaque tâche :

1. comprendre le besoin ;
2. identifier le module propriétaire ;
3. vérifier docs et Data Model ;
4. examiner l’existant ;
5. choisir la solution la plus simple ;
6. modifier le minimum ;
7. ajouter / adapter les tests ;
8. vérifier lint / typecheck / tests ;
9. mettre à jour la doc si impact structurel ;
10. résumer les changements.

---

# 22. Definition of Done

Une tâche est terminée si :

- le besoin fonctionne ;
- architecture respectée ;
- TypeScript compile ;
- tests pertinents passent ;
- permissions vérifiées ;
- migrations présentes ;
- sécurité vérifiée ;
- UX cohérente ;
- documentation à jour si nécessaire.

---

# 23. Interdictions

Ne jamais :

- appeler PocketBase directement depuis un composant ;
- mettre un secret dans le code ;
- contourner les API Rules ;
- créer une dépendance circulaire ;
- dupliquer une logique métier ;
- ajouter une techno majeure sans validation ;
- modifier une collection PROD manuellement ;
- modifier un document historique envoyé ;
- envoyer un mail depuis une adresse non autorisée ;
- créer un nouveau document Markdown sans vérifier s’il existe déjà un document canonique adapté.

---

# 24. Principe final

Toujours choisir :

```text
simple > complexe
lisible > astucieux
explicite > implicite
modulaire > couplé
testable > bricolé
maintenable > impressionnant
```

---

# 25. Finance, Sage et facturation électronique

## Sage

En Phase 1 :

```text
Sage = source de vérité comptable
```

Ne jamais écrire une intégration Sage directement depuis `billing`, `sales`, `purchasing` ou un composant React.

Toujours :

```text
Module métier
↓
Accounting Service
↓
AccountingProvider
↓
SageAccountingProvider
```

Toute synchronisation externe doit être :

- traçable ;
- idempotente ;
- rejouable sans duplication ;
- observable ;
- testée.

## Comptabilité Horizon

Le Data Model prévoit la comptabilité interne dès maintenant.

Ne pas supprimer ou simplifier les objets comptables sous prétexte que Sage est encore utilisé.

La comptabilité interne sera activée progressivement.

Toute écriture comptable doit pouvoir être rattachée à sa source métier.

Une écriture comptabilisée ne se modifie pas arbitrairement : utiliser les mécanismes comptables de correction prévus.

## SUPER PDP

La facturation électronique passe par :

```text
Billing
↓
EInvoiceService
↓
EInvoiceProvider
↓
SuperPdpProvider
```

Ne jamais appeler l’API SUPER PDP depuis React.

Les webhooks sont traités côté serveur.

Ils doivent être :

- vérifiés ;
- idempotents ;
- journalisés ;
- corrélés à un objet Horizon.

La réception des factures fournisseurs fait partie du périmètre.

Ne pas limiter l’intégration à l’envoi des factures clients.

---

# 26. Documentation Finance

Toute modification concernant :

```text
facturation
comptabilité
Sage
SUPER PDP
TVA
paiements
banque
FEC
```

doit être vérifiée au minimum contre :

```text
docs/04-FUNCTIONAL-SPECS.md
docs/05-DATA-MODEL.md
docs/06-SECURITY-OPS.md
docs/08-INTEGRATIONS.md
docs/10-DECISIONS-ROADMAP.md
```

Ne pas introduire un raccourci technique qui empêcherait la future comptabilité interne Horizon.

---

# 27. Compte analytique

Le compte analytique est le fil conducteur d’une affaire.

Ne pas créer un nouveau système de code affaire dans chaque module.

Flux :

```text
CRM opportunity
↓
accounting_analytic_accounts
↓
sales / purchasing / projects / time / expenses / billing / stock
```

Un projet issu d’une opportunité reprend son compte analytique.

Les devis d’une opportunité utilisent la racine du code CRM.

Exemple :

```text
11450
11450-1
11450-2
```

Les achats peuvent être ventilés sur plusieurs comptes analytiques.

---

# 28. Documents `draft`

Tout document nécessitant une validation métier possède un vrai état `draft`.

Ne pas simuler le brouillon uniquement dans l’UI.

La transition :

```text
draft → validated / confirmed / posted
```

est réalisée côté serveur.

Après validation, respecter les règles d’immutabilité du document.

---

# 29. Catalogue Produits

Le catalogue doit distinguer :

```text
kind
stock_policy
replenishment_policy
tracking
composition_mode
```

Ne pas coder :

```text
if type === "equipment" alors toujours ...
```

si la règle peut être une propriété configurable.

Un produit peut avoir plusieurs fournisseurs.

Les prix fournisseurs ne doivent pas écraser sans historique les informations précédentes.

Les produits composés ne peuvent pas créer de cycles.

---

# 30. Approvisionnement

Les besoins issus des ventes passent par le service d’approvisionnement.

Toujours conserver :

- source ;
- ligne source ;
- produit ;
- quantité ;
- compte analytique ;
- ventilation ;
- fournisseur proposé.

Ne jamais créer silencieusement une commande fournisseur définitive depuis un devis.

Créer d’abord un objet contrôlable en `draft`.

---

# 31. Imports

Tout import massif utilise :

```text
parse
→ normalize
→ match
→ dry run
→ conflicts
→ explicit apply
```

Ne jamais dédupliquer uniquement sur le nom.

Priorités produit :

```text
external reference
SKU
barcode
manufacturer + ref
supplier + supplier ref
manual
```

Un matching ambigu doit produire un conflit.

Les migrations Odoo sont idempotentes via `core_external_references`.

---

# 32. Activity Feed

Le fil utilisateur utilise `core_activity_events`.

Ne pas utiliser directement `core_audit` pour alimenter une UX conversationnelle.

Les événements significatifs peuvent être générés automatiquement.

Les notes / messages sont créés explicitement par les utilisateurs.

Une mention :

```text
@user
```

crée une notification mais ne contourne jamais les permissions sur l’objet.

---

# 33. Planning / TimeReport

`cvs-onsite-backend` est une référence fonctionnelle, pas une architecture à copier.

Conserver les concepts utiles :

- semaine ;
- collaborateurs ;
- internes / externes ;
- jour / nuit ;
- plusieurs codes ;
- ATE / IDF / DEP ;
- copie semaine ;
- multi-jours ;
- absences.

Horizon ajoute :

```text
BE
Production
planned_minutes
analytic_account
planned vs actual
```

Planning = prévisionnel.

TimeReport = réel.

Ne jamais considérer automatiquement une affectation planning comme une heure réalisée validée.

---

# 34. Breadcrumb et identité visuelle

Les pages métier utilisent `HBreadcrumb`.

Les sociétés, contacts et produits utilisent les images prévues dans le Data Model.

Pour un contact :

```text
avatar
+
badge logo société
```

Ne pas dupliquer le logo de la société dans la donnée contact.


# 35. Pricing / Margin

Ne jamais calculer les marges uniquement dans React.

Utiliser les services métier de pricing / marge.

Un document validé doit conserver les données nécessaires à sa relecture historique :

```text
prix
coût
taxe
devise
taux de change
remise
marge
```

Une modification future du catalogue ne doit pas changer rétroactivement un devis ou une facture validés.

---

# 36. Validation métier

Ne pas implémenter de moteur d’approbation par seuils.

Le contrôle repose sur les permissions.

Exemples :

```text
sales.quote.validate
purchasing.order.validate
billing.invoice.validate
```

La validation reste côté serveur.

---

# 37. Stock réel

Ne jamais utiliser une seule quantité `stock`.

Distinguer :

```text
physical
reserved
available
incoming
```

Les lots / séries / réservations sont des objets métier explicites.

Les corrections passent par mouvements / inventaires audités.

---

# 38. Projets / baseline

Ne pas écraser un budget initial.

Conserver :

```text
baseline
current budget
actual
```

Toute révision significative doit être traçable.

---

# 39. Multi-devise

Une devise est explicite sur tout objet financier.

Le taux appliqué est snapshoté à validation.

Ne jamais recalculer un historique avec le taux courant.

---

# 40. Recherche globale

La recherche globale doit utiliser les permissions métier.

Ne jamais retourner un résultat puis masquer son contenu côté UI : le filtrage doit être effectif côté service / repository.

---

# 41. Archivage

Archive ≠ delete.

Une donnée archivée reste disponible pour :

- audit ;
- historique ;
- reporting ;
- relations.

Une purge est une opération distincte et exceptionnelle.

---

# 42. Organisation / coûts

Les équipes et profils de coût sont centralisés.

Ne jamais stocker un coût horaire copié dans chaque module comme référentiel mutable.

Lors d’une valorisation historique, utiliser un snapshot / coût effectif daté.

---

# 43. Notifications

Les modules publient un événement métier.

`NotificationService` décide des notifications à produire.

Ne pas envoyer des e-mails directement depuis les workflows métier pour des alertes internes.


# 44. Opportunité / devis / commandes

Ne jamais imposer :

```text
1 opportunité = 1 devis
```

ni :

```text
1 opportunité = 1 devis accepté
```

Une opportunité peut contenir plusieurs devis `validated`, `sent` et `accepted`.

Plusieurs commandes peuvent en découler.

Toutes utilisent le même `analytic_account` par défaut.

---

# 45. Projet

Un projet n’est pas une copie de la commande client.

Il agrège l’exécution opérationnelle.

Il peut être lié à plusieurs commandes via `projects_sales_orders`.

Ne pas multiplier les statuts globaux pour représenter le parcours.

Utiliser :

```text
project status
+
phases
+
milestones
```

La baseline initiale ne doit jamais être écrasée.

---

# 46. Recette / Réserves

PV, FAT, SAT et réserves appartiennent à `projects`.

Une réserve est un objet métier, pas du texte libre dans le PV.

Une clôture opérationnelle doit vérifier les réserves requises.

`waived` nécessite une permission dédiée.

---

# 47. Clôtures Projet

Toujours distinguer :

```text
operational_status
financial_status
```

Ne jamais bloquer artificiellement la clôture technique uniquement parce qu’un paiement reste ouvert.

Ne jamais clôturer financièrement un projet simplement parce qu’il est techniquement terminé.

---

# 48. Parc installé

Le parc installé appartient au module `service`.

Un équipement sérialisé doit référencer `inventory_serials`.

Ne pas recopier un numéro de série comme nouvelle source de vérité.

Conserver l’origine :

```text
project
sales order
delivery
analytic account
```

---

# 49. SAV

Le SAV réutilise les services existants :

```text
Planning
TimeReport
Inventory
Sales
Billing
Documents
Activity Feed
```

Ne pas créer :

- un second stock SAV ;
- un second moteur de temps ;
- un second moteur de facturation.

Une intervention garantie utilise par défaut le compte analytique d’origine.

Une intervention facturable doit avoir un compte analytique explicite.

---

# 50. Pièces SAV

Une pièce consommée crée / référence un mouvement de stock.

Après validation de l’intervention, ne jamais supprimer directement la consommation.

Utiliser une correction / mouvement inverse.

---

# 51. RFQ

Ne pas implémenter de workflow RFQ / consultation multi-fournisseurs sans nouvelle décision explicite.

Le scope actuel est :

```text
purchase request
→ supplier selection
→ purchase order
```


# 52. Employés vs utilisateurs

Toujours distinguer :

```text
hr_employees
→ ressource métier

core_users
→ compte de connexion
```

Planning, TimeReport et SAV utilisent `hr_employees`.

Permissions et authentification utilisent `core_users`.

Ne jamais forcer la création d’un compte utilisateur pour planifier un freelance.

La désactivation d’un utilisateur ne supprime aucune donnée historique de l’employé.

---

# 53. API externe

Ne jamais exposer directement une collection PocketBase à un client externe sans policy Horizon.

Toute route externe passe par :

```text
auth API client
→ access policy
→ validation champs
→ service métier
→ repository
```

Les champs sont en allowlist.

Un nouveau champ ajouté à la base n’est jamais exposé automatiquement.

Les champs en écriture sont validés séparément des champs en lecture.

---

# 54. Clés API

Ne jamais stocker une clé API complète en clair.

Stocker :

```text
key_prefix
key_hash
```

La clé complète n’est affichée qu’une fois.

La révocation doit être immédiate.

---

# 55. Paramètres

Avant de coder une constante métier, vérifier si elle appartient au module Paramètres.

Paramétrable :

- préfixes / suffixes ;
- TVA ;
- listes tarifaires ;
- seuils ;
- équipes ;
- calendriers ;
- catégories ;
- politiques ;
- mappings.

Contrôlé par Horizon :

- transitions critiques ;
- invariants comptables ;
- valeurs structurelles ;
- sécurité ;
- intégrité relationnelle.

Éviter à la fois :

```text
tout hardcodé
```

et :

```text
tout configurable
```

---

# 56. TVA

Un produit stocke une TVA par défaut, pas une vérité absolue.

La TVA effective vient de `TaxService`.

Un document validé snapshot :

```text
tax_code
tax_rate
tax_amount
tax_context
```

Ne jamais recalculer une facture historique à partir de la configuration TVA actuelle.

---

# 57. Numérotation

La génération de numéros est serveur et atomique.

Ne jamais générer un numéro métier dans React.

Les tokens autorisés sont contrôlés.

Le changement de pattern n’affecte que les futurs numéros.


---

# 58. Génération des clés API

Les clés API sont générées côté serveur.

Ne jamais utiliser :

```text
Math.random()
crypto non sécurisé
génération React
clé librement saisie comme secret principal
```

Utiliser une source cryptographiquement sûre.

Flux :

```text
generate raw key
→ return once
→ hash
→ store hash + prefix + last four
```

Ne jamais logger la clé brute.

Ne jamais renvoyer la clé brute après création.

Une rotation produit un nouveau secret.

Une révocation rend l’ancienne clé immédiatement inutilisable selon la politique choisie.


---

# 65. Design System Horizon V1

La baseline visuelle est définie dans :

```text
docs/07-UX-DESIGN-SYSTEM.md
```

Palette de marque :

```text
navy          #091C3A
magenta       #F52F96
pink          #FF5AAE
violet        #7B3FC7
violet light  #A56BEA
gray light    #F4F5F7
gray text     #7B8794
white         #FFFFFF
```

Gradient :

```text
#F52F96 → #7B3FC7
```

Typographies :

```text
Montserrat SemiBold → titres
Inter → interface / données
```

Ne pas inventer une nouvelle palette par module.

---

# 66. Densité UI

Horizon est un ERP desktop dense.

Cible :

```text
table row ≈ 34–38 px
input ≈ 32–36 px
body ≈ 13–14 px
```

Ne pas agrandir les composants pour obtenir un rendu "SaaS marketing".

L’utilisateur doit pouvoir visualiser un nombre important de lignes métier sans scroll excessif.

---

# 67. Couleurs UI

La couleur sert à guider.

Équilibre cible :

```text
70–75 % neutre
15–20 % navy
5–10 % accents / états
```

Le magenta / gradient est réservé aux actions et sélections importantes.

Ne pas colorer toutes les icônes, cartes ou badges.

---

# 68. Combobox / Inputs

Les controls doivent rester discrets :

```text
border fine
fond blanc
radius 5–6 px
aucune ombre
chevron discret
focus magenta léger
```

Dans un tableau, le contrôle doit ressembler à une cellule éditable, pas à un gros formulaire.

---

# 69. Vue Devis

La vue Devis est une référence forte.

Ordre :

```text
header
informations
tabs
toolbar
table pleine largeur
totaux sous table
informations secondaires
```

Ne pas placer une grosse sidebar Totaux pendant l’édition si elle réduit la largeur utile du tableau.

À 1440p / 1600px, viser environ 10–15 lignes visibles.

Les totaux principaux apparaissent directement sous les lignes :

```text
remise
frais
HT
TVA
TTC
marge
```

---

# 70. Logo

Utiliser uniquement les variantes prévues par la charte.

Ne pas :

```text
déformer
recolorer
ajouter glow / ombre
modifier le gradient
```

Dans la sidebar sombre :

```text
pictogramme couleur
+
HORIZON blanc
```
