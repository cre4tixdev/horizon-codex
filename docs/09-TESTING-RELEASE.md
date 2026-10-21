# Horizon — Testing & Release

## Vérifications du socle frontend

Commandes disponibles depuis la racine :

| Commande | Contrôle |
|---|---|
| `pnpm lint` | ESLint, règles React et interdiction d'accès direct à PocketBase dans l'UI |
| `pnpm typecheck` | TypeScript strict, sans génération de fichiers |
| `pnpm test` | Tests Vitest ; actuellement validation de l'URL publique PocketBase |
| `pnpm test:watch` | Vitest en mode interactif |
| `pnpm build` | Typecheck puis bundle de production Vite dans `dist/` |
| `pnpm check` | Lint, typecheck, tests unitaires et build |
| `pnpm test:e2e` | Parcours Playwright sous Chromium, serveur local démarré et arrêté par les tests |
| `pnpm preview` | Consultation locale du bundle après build |

Installer le navigateur avec `pnpm exec playwright install chromium` avant le premier E2E. Les tests utilisent `127.0.0.1:4173`, avec port strict et sans réutiliser un serveur existant. Les rapports, résultats et traces d'échec sont ignorés par Git.

Vérifications initiales du **4 octobre 2026** : lint, typecheck, 10 tests Vitest et build réussis ; 2 tests Chromium réussis (accueil sans erreur ni requête à l'instance PocketBase, adresse inconnue puis retour à l'accueil). Ces tests ne valident pas encore l'authentification ni les permissions métier.

Après livraison du layout F06, les contrôles passent avec **13 tests Vitest et 7 tests Chromium**. Les tests supplémentaires couvrent recherche des espaces (accents / vocabulaire / résultat vide), sidebar réduite, navigation active et breadcrumb, raccourci clavier et focus du champ, fermeture Échap avec restitution du focus, aide et absence de débordement mobile. Lint, typecheck et build restent réussis.

Les captures desktop / mobile ont été générées dans `/private/tmp/horizon-layout-desktop.png` et `/private/tmp/horizon-layout-mobile.png`, puis inspectées visuellement. L'aperçu intégré n'a pas pu être connecté dans cette session ; la vérification navigateur a été effectuée via les tests Playwright et leurs captures. Ces fichiers sont des artefacts temporaires de vérification, pas de nouvelles références canoniques.

Dans l'environnement de l'agent, les restrictions réseau ont nécessité une installation autorisée avec `pnpm install --store-dir /private/tmp/horizon-pnpm-store`. Chromium a été installé dans un dossier temporaire ; la commande E2E effectivement exécutée est :

```bash
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/horizon-playwright pnpm test:e2e
```

Ce chemin temporaire est propre à la session de vérification, sans dépendance imposée au projet. Le lancement du serveur et du navigateur a également nécessité l'autorisation hors sandbox. Aucun test n'a créé ou modifié de donnée PocketBase.

## Tests unitaires

Outil :

```text
Vitest
```

Pour :

- fonctions pures ;
- calculs ;
- validations ;
- transitions simples ;
- services.

---

# E2E

Outil :

```text
Playwright
```

Parcours prioritaires :

## Commercial

```text
login
→ société
→ contact
→ opportunité
→ devis
→ validation
→ PDF
→ e-mail
→ commande
```

## CRM / AO

```text
création opportunité type AO
→ client / contact
→ création fiche AO
→ publication
→ remise
→ visites
→ Kanban
→ planning
→ document
→ archivage / restauration
```

## Chat

```text
A ouvre conversation
→ envoie message
→ B reçoit realtime
→ non-lu
→ lecture
→ contrôle droits
```

## Stock

```text
commande
→ préparation
→ mouvement
→ livraison
```

## Facturation

```text
facture
→ validation
→ PDF
→ envoi
→ export comptable
```

---

## Facturation électronique

```text
facture client validée
→ génération données structurées
→ envoi SUPER PDP
→ réception identifiant externe
→ événement de statut
→ mise à jour Horizon
→ rejeu du même événement
→ aucune duplication
```

Flux entrant :

```text
facture fournisseur SUPER PDP
→ réception
→ idempotence
→ création / rattachement
→ contrôle achat
→ validation
→ préparation comptable
```

## Sage / comptabilité Phase 1

```text
facture validée
→ écriture préparée
→ export Sage
→ succès
→ identifiant externe conservé
→ second export empêché
```

Cas erreur :

```text
export Sage échoue
→ statut failed
→ erreur conservée
→ retry
→ succès
→ aucune écriture doublée
```

## Comptabilité Horizon

À activer avant toute bascule comptable :

- équilibre débit / crédit ;
- verrouillage périodes ;
- numérotation ;
- TVA ;
- lettrage ;
- rapprochement ;
- contre-passation ;
- clôture ;
- balance ;
- FEC ;
- tests de non-régression sur arrondis et montants.

Avant une Phase 3, prévoir une période de fonctionnement en parallèle avec comparaison Horizon / Sage.

---

# CI

Pipeline minimum :

```text
pnpm install
↓
lint
↓
typecheck
↓
unit tests
↓
build
```

E2E critiques sur PREPROD.

---

# Branches

```text
main
feature/*
fix/*
```

`main` doit rester déployable.

---

# Pull Request

Indiquer :

- pourquoi ;
- modules concernés ;
- changements ;
- migration ;
- tests ;
- impact sécurité.

---

# Préproduction

Toute évolution significative passe par PREPROD.

Vérifier :

- migrations ;
- permissions ;
- documents ;
- e-mails ;
- realtime ;
- workflows ;
- logs.

---

# Production

Avant release :

1. vérifier sauvegarde ;
2. déployer ;
3. migrations ;
4. smoke test ;
5. logs.

---

# Rollback

Selon le cas :

```text
rollback container
rollback code
migration corrective
restauration base
```

---

# Checklist

```text
[ ] lint
[ ] typecheck
[ ] tests
[ ] build
[ ] migration testée
[ ] sauvegarde
[ ] permissions
[ ] secrets
[ ] PREPROD
[ ] smoke test
[ ] documentation si nécessaire
```

---

# E2E complémentaires

## Catalogue / import Excel

```text
import Excel
→ dry run
→ produit existant matché
→ prix fournisseur mis à jour
→ historique prix créé
→ aucune duplication produit
```

Cas ambigu :

```text
2 produits possibles
→ conflit
→ aucune création automatique
→ résolution utilisateur
```

## Migration Odoo

```text
import lot Odoo
→ création / matching
→ external references
→ rejouer le même lot
→ aucune duplication
```

## Produit composé / approvisionnement

```text
devis avec kit
→ validation
→ lancer approvisionnement
→ composants calculés
→ stock vérifié
→ fournisseurs proposés
→ demande d’achat draft
```

## Achat multi-analytique

```text
demande achat
→ ligne affectée à 11450 + 11472
→ validation
→ commande fournisseur
→ allocations conservées
→ reporting analytique correct
```

## Documents brouillon

Tester pour chaque document critique :

```text
création draft
→ modification autorisée
→ validation
→ numéro officiel si applicable
→ modification interdite / contrôlée
```

## Activity Feed

```text
modification statut
→ événement activité

note avec @user
→ mention
→ notification

création tâche
→ assignation
→ échéance
→ clôture
```

Vérifier qu’un utilisateur sans accès à l’objet ne voit ni l’activité ni la mention associée.

## Planning / TimeReport

```text
planning semaine
→ affectation utilisateur
→ code analytique
→ BE / Production
→ ATE / IDF / DEP
→ plusieurs jours
→ copie semaine
```

Puis :

```text
planning prévu
→ saisie temps réel
→ validation
→ comparaison prévu / réalisé
→ agrégation sur code analytique
```

Les congés validés doivent apparaître dans le planning sans saisie dupliquée.


# Tests V8 — économique / workflows

## Prix / marge

```text
produit avec prix fournisseur USD
→ taux de change
→ coût EUR
→ prix client
→ remise
→ marge
→ validation devis
```

Vérifier que la marge historique ne change pas après modification du catalogue.

## Validation vente par permissions

```text
devis draft
→ données et pricing validés côté serveur
→ sales.quote.validate requis pour finaliser
→ sales.order.confirm requis pour confirmer le client
```

Tester autorisation et refus sans droit, invariants et snapshots, transition auditée et absence de doublon au rejeu. Aucun état pending approval ni seuil de montant/remise/marge selon H-064.

## Révision devis

```text
devis envoyé rev0
→ modification demandée
→ rev1
→ rev0 toujours accessible
```

## Commande partielle

```text
devis 10 unités
→ commande 6
→ reliquat 4
→ seconde commande 4
```

## Achat / réception partielle

```text
PO 100
→ réception 60
→ restant 40
→ réception 30
→ restant 10
→ clôture explicite ou dernière réception
```

## Réservation stock

```text
physique 10
→ réserver 6 projet A
→ disponible 4
→ tentative réservation 5
→ refus / règle adaptée
```

## Série / lot / RMA

Tester le cycle :

```text
réception
→ stock
→ réservation
→ livraison
→ retour
→ quarantaine
→ remise en stock / réparation / rebut
```

## Capacité planning

```text
capacité 8h
→ planifié 11h
→ surcharge visible
```

Congés validés réduisent la capacité.

## Pilotage affaire

Pour un code analytique, vérifier la cohérence :

```text
prévu
engagé
réalisé
facturé
payé
```

avec les données sources.

## Multi-devise

Tester :

- taux daté ;
- arrondi ;
- document validé ;
- modification ultérieure du taux ;
- total historique inchangé.

## Recherche globale

Vérifier :

- code CRM ;
- produit ;
- client ;
- facture ;
- permissions.

## Archivage

Vérifier :

- objet archivé absent des vues actives ;
- relations toujours fonctionnelles ;
- rapports historiques corrects ;
- purge bloquée si interdite.


# Tests V9 — Projet / SAV

## Plusieurs devis acceptés

```text
opportunité 11450
→ devis 11450-1 accepted
→ devis 11450-3 accepted
→ deux commandes
→ même compte analytique
→ même projet
```

Puis ajouter un troisième devis accepté après passage de l’opportunité en gagnée :

```text
→ nouveau devis autorisé
→ nouvelle commande
→ rattachement projet existant
```

## Plusieurs projets même affaire

```text
opportunité 11450
→ commande A
→ projet P1
→ commande B
→ choix nouveau projet P2
→ P1 + P2 utilisent analytic 11450
```

## Recette / réserves

```text
projet
→ recette SAT
→ accepted_with_reservations
→ 3 réserves
→ 2 resolved
→ 1 open
→ clôture opérationnelle refusée
→ dernière réserve resolved
→ clôture autorisée
```

Tester également une réserve `waived` avec permission spécifique.

## Clôtures séparées

```text
projet techniquement terminé
→ clôture opérationnelle
→ facture fournisseur encore ouverte
→ financial_status reste open
```

Puis clôture financière ultérieure.

## Création parc installé

```text
réception matériel sérialisé
→ réservation projet
→ livraison client
→ installation
→ commissioning
→ création installed asset
→ même inventory_serial
```

Aucune duplication de numéro de série.

## Garantie / Ticket

```text
installed asset sous garantie
→ ticket warranty
→ intervention
→ pièces + temps
→ coûts sur analytic origine
```

## SAV facturable

```text
ticket billable
→ intervention
→ nouveau devis / affaire si nécessaire
→ temps + pièces
→ facture
```

## Maintenance

```text
maintenance plan
→ échéance
→ occurrence
→ intervention planifiée
→ réalisation
→ prochaine échéance
```

## Intervention / Stock

```text
intervention
→ pièce sérialisée utilisée
→ mouvement stock
→ coût analytique
→ historique asset / ticket
```


# Tests V10 — Employés / API / Paramètres

## Employé sans utilisateur

```text
créer freelance
→ planning disponible
→ TimeReport disponible
→ aucun login possible
```

## Employé + utilisateur

```text
créer salarié
→ créer compte Horizon
→ relation unique
→ désactiver utilisateur
→ employé et historiques conservés
```

## Droits coûts

```text
chef de projet
→ voit ressource
→ ne voit pas coût analytique si permission absente
```

## API — champs

Policy :

```text
contacts.people
read_fields = [id, first_name, last_name, email]
```

Tester :

- réponse ne contient aucun autre champ ;
- ajout futur d’un champ DB ne l’expose pas ;
- tentative d’écriture rejetée.

## API — écriture partielle

```text
write_fields = [email]
```

Tester :

- modification e-mail autorisée ;
- modification notes rejetée ;
- règles métier toujours exécutées.

## API — révocation

```text
clé active → 200
révocation → prochain appel 401/403
```

## API — rate limit

Tester dépassement et récupération normale après fenêtre.

## Numérotation

Tester :

```text
FAC-{YYYY}-{SEQ}
padding 5
```

- génération concurrente ;
- unicité ;
- reset annuel ;
- changement futur de pattern ;
- anciens numéros inchangés.

## TVA

Tester :

- TVA France ;
- intracommunautaire ;
- export ;
- code daté ;
- changement de taux ;
- document historique inchangé.

## Paramètres permissions

Un utilisateur sans droit d’administration ne peut pas modifier :

- TVA ;
- numérotation ;
- règles d’approbation ;
- API clients ;
- secrets intégrations.


# Tests V12 — change / auth / numbering

## BCE

```text
sync taux BCE
→ historique créé
→ second sync même date
→ pas de doublon
```

## Snapshot devis

```text
devis USD draft
→ taux BCE courant
→ validation
→ taux verrouillé
→ nouveau taux BCE lendemain
→ devis historique inchangé
```

## Chaîne devis / commande / facture

```text
devis validé jour J
→ taux A

commande confirmée jour J+10
→ taux B

facture validée jour J+30
→ taux C
```

Vérifier que chaque document garde son propre snapshot.

## Taux fiscal

Tester :

```text
exchange_rate = taux A
tax_exchange_rate = taux A
```

puis un cas où la date fiscale impose un snapshot différent.

Les deux restent sourcés `ECB`.

## Prix fournisseur

Tester un prix unitaire à 4+ décimales :

```text
0,0375 × 10 000 = 375,00
```

Aucun arrondi prématuré.

## Auth Horizon

```text
email / password
→ login OK
→ rôles Horizon
```

## Auth Microsoft

```text
Microsoft OAuth2
→ utilisateur Horizon lié
→ mêmes rôles / permissions
```

Compte Horizon désactivé :

```text
password refusé
Microsoft refusé
```

## Numérotation technique vs métier

```text
record id stable
→ business_number format A
→ changement paramètres
→ nouveaux documents format B
→ record historique inchangé
```

## Ancienne référence

```text
ancienne référence = 20260208
nouvelle référence = FAC-2026-00208
```

Tester :

- recherche par `20260208` ;
- ouverture du même record ;
- affichage optionnel ancien numéro ;
- masquage sans perte de recherche.

## Tests de connexion et de migrations

PocketBase **0.40.4** doit être fourni via `POCKETBASE_BINARY` (exécutable officiel compatible avec l'OS local). Le SDK npm `pocketbase` porte une version distincte : 0.28.1. Aucun de ces tests ne contacte l'instance Synology.

```bash
POCKETBASE_BINARY=/chemin/pocketbase pnpm test:backend
POCKETBASE_BINARY=/chemin/pocketbase pnpm test:e2e:auth
```

Le premier crée des bases temporaires, applique les migrations deux fois, démarre PocketBase uniquement sur loopback, provisionne des comptes fictifs, puis supprime les fixtures. Les contrôles couvrent login / expansion du rôle / renouvellement, inscription et lectures anonymes refusées, isolation utilisateurs / rôles, escalade et écritures interdites, désactivation de compte ou rôle avec ancien token, validation serveur du tableau de permissions, isolation de la collection standard `users`, préservation d'un compte préexistant et rollback sur base vide.

Playwright auth utilise une autre configuration, une base éphémère sur `127.0.0.1:18090` et Vite sur `127.0.0.1:4174`. Les 5 parcours actuels vérifient une vraie connexion / retour à la route demandée / déconnexion, les erreurs de formulaire et d'identifiants, l'absence de token dans localStorage / cookies, la purge de sessionStorage à la déconnexion, la conservation de session au rechargement, la densité mobile, le refus de restauration serveur, l'attente de validation avant affichage et l'isolation d'un nouvel onglet sans opener. Les traces éventuelles restent dans `test-results/auth/` (ignoré par Git). La base n'est pas un environnement de démonstration partagé.

La suite layout `pnpm test:e2e` reste exécutée sans URL PocketBase, en aperçu de développement. Elle vérifie 7 parcours indépendants de la connexion ; la configuration de test impose une URL vide afin d'ignorer la connexion d'une éventuelle `.env.local`.

Après autorisation de la persistance dans l'onglet : `pnpm check` réussi avec 30 tests Vitest, cinq tests auth Chromium réussis sur base temporaire locale et sept tests layout Chromium réussis. Le test de raccourci clavier attend désormais le montage du bouton de recherche avant l'envoi des touches. Les tests de service vérifient également que la restauration attend le serveur, refuse un échec réseau ou une session interdite, et ne reconnecte pas après une déconnexion pendant la requête. Recette du rechargement sur préproduction à confirmer par l'utilisateur ; aucun test automatisé n'utilise son compte réel.

Résultats du 4 octobre 2026 après préparation : `pnpm check` réussi avec 26 tests Vitest ; 10 tests PocketBase réels réussis ; 7 tests layout et 3 tests auth Chromium réussis. Les captures de connexion desktop / mobile ont été inspectées. Déploiement et recette Synology non effectués.

Limite de build observée : le chunk initial reste d'environ 506 kB minifiés (156 kB gzip), avec avertissement Vite de taille ; les écrans Login / AppFrame / Dashboard sont chargés à la demande. Cet avertissement ne fait pas échouer le build. Le fichier de charte complet reste utilisé pour afficher le pictogramme officiel en attendant un asset officiel séparé.


Recette de préproduction du 4 octobre 2026 : l'utilisateur confirme une connexion Horizon réussie avec le compte `core_users` créé via le dashboard. Les contrôles API relus par l'agent confirment les règles et zéro enregistrement retourné pour les lectures anonymes de `core_users` / `core_roles`. Les tests de refus après désactivation et les parcours de déconnexion / renouvellement sur cette instance restent à effectuer ; les tests locaux correspondants ne remplacent pas cette recette. Aucun nouveau test automatisé n'a été exécuté pour cette mise à jour documentaire.


## Vérifications de l'adoption du schéma créé dans le dashboard

La suite backend compte désormais 13 tests. Une fixture de schéma relue par API, sans compte ni secret, reproduit les identifiants et les options de la préproduction. Les tests créent leurs propres comptes locaux, appliquent la migration et vérifient la conservation intégrale du schéma, des identifiants des comptes / rôles et de la connexion avec le mot de passe initial. Ils vérifient aussi les refus sans modification après règle de lecture ouverte, rôle facultatif, avatar non protégé, token trop long, installation partielle et tentative de rollback. Sur base neuve, la reconstruction et les tests de sécurité restent opérationnels.

Après adaptation : `pnpm check` réussi (26 tests Vitest, lint, typecheck, build), `POCKETBASE_BINARY=/private/tmp/horizon-pb-bin/pocketbase pnpm test:backend` réussi (13 tests), `pnpm test:e2e:auth` réussi (3 parcours Chromium avec backend temporaire). La suite layout n'a pas été relancée : aucune modification de son code dans ce lot. La recette sur le NAS et la restauration de sa sauvegarde restent distinctes de ces preuves locales.

Le test historique de rollback à vide est remplacé par un test de refus du rollback d'une collection adoptée : même une collection vide peut appartenir à l'installation préexistante et ne doit pas être supprimée automatiquement.


## Vérifications Contacts V1

`pnpm check` : 37 tests Vitest, lint, TypeScript strict et build. Le service est testé sur refus de lecture / écriture avant requête, lecture obligatoire pour écrire, normalisation, taille d'image, archivage et validation des noms / URLs.

`POCKETBASE_BINARY=/chemin/pocketbase pnpm test:backend` exécute les 13 tests auth / migrations puis les 7 tests Contacts de `tests/pocketbase/check_contacts.py`. Couverture : refus anonymes et sans permission, lecteur seul, noms exacts de permissions et rôle désactivé, rôles uniques / adresses / noms, relations archivées conservées, suppression interdite, acteur et snapshots d'audit, rollback de sauvegarde sur échec d'audit, logo protégé pour lecteur / anonyme / compte sans permission. Migration et réapplication sur base neuve incluses dans chaque fixture. Aucun contact du NAS.

La suite auth Chromium comporte désormais 8 tests : 5 auth et 3 Contacts (parcours complet société + logo + deux rôles + adresse + personne / avatar / modification / archive / réactivation ; accès lecteur / refus ; validation / recherche / mobile). Suite layout : 7 tests. Captures `/private/tmp/horizon-company.png`, `horizon-people.png`, `horizon-contacts-mobile.png` inspectées. Les parcours locaux ne constituent pas la recette sur préproduction.


Installation Contacts sur préproduction confirmée par l'utilisateur : cinq collections présentes et accès aux onglets / bouton de création après permissions et reconnexion. Recette métier complète NAS (CRUD, images, audit, archive et accès restreints) à effectuer lors de la reprise ; ne pas assimiler l'accès à la page à cette recette complète.

## Recette locale Contacts / Référentiels — 5 octobre 2026

Vérifications : `pnpm check` (lint, TypeScript, 37 tests Vitest, build), `pnpm test:backend` (13 tests auth / compatibilité et 15 tests Contacts / migrations / Pappers), `pnpm test:e2e:auth` (11 parcours) et `pnpm test:e2e` (7 parcours layout).

Les nouveaux tests couvrent l’adoption des anciennes devises / langues / pays et adresses, le refus sans perte sur conflit de devises, les identifiants société, les valeurs de référentiel inactives et inconnues, l’administration protégée / codes immuables, l’unicité de l’adresse principale, la configuration absente de Pappers, les preuves falsifiées et l’intégration avec un fournisseur simulé. L’application Pappers est vérifiée avec sélection partielle, provenance, refus de doublon, diffusion restreinte, rejeu et annulation société / adresse si l’audit échoue.

Chromium couvre sélection / recherche clavier dans les combobox, édition des référentiels, contact pré-rattaché et liste associée, blocage des écritures vers un backend ancien et une réponse de liste retardée pendant la création d’une personne. Les requêtes Contacts en cours sont annulées avant invalidation après sauvegarde pour empêcher une réponse ancienne de masquer le nouveau contact.

PocketBase 0.40.4 est requis pour les fixtures (`node_modules/.bin/pocketbase` sur ce Mac, ou `POCKETBASE_BINARY` ailleurs). Les tests utilisent des bases jetables et des identités fictives. Le fournisseur Pappers est simulé en remplaçant l’URL dans une copie temporaire des hooks ; la clé réelle est exclue de l’environnement des fixtures. Aucune modification du NAS ni appel réel à Pappers. Les avertissements de ressources Python 3.14 ne constituent pas des échecs de recette.


### Reprise visuelle Contacts — 5 octobre 2026

Recette : création avec adresse du siège dès le formulaire initial, logo unique sans zone galerie, fiches société / personne sur desktop et mobile sans débordement. Test navigateur de refus de création d’adresse : message visible, saisie conservée, nouvelle tentative réussie et une seule création de société. Tests service : adresse invalide refusée avant écriture et identifiant société conservé en cas de sauvegarde partielle. Captures desktop / mobile dans `/private/tmp/horizon-company-modern.png`, `horizon-company-modern-mobile.png`, `horizon-person-modern.png`, `horizon-person-modern-mobile.png`. Les contrôles locaux ne remplacent pas la recette NAS.

Résultats de cette reprise : `pnpm check` réussi (lint, TypeScript, 39 tests Vitest et build), 12 parcours auth / Contacts / Paramètres et 7 parcours layout Chromium réussis. Captures desktop / mobile inspectées. Les 28 tests backend de la livraison précédente restent la preuve du backend inchangé ; ils ne sont pas relancés dans ce lot visuel.


### Finition Cartes / Liste et en-tête compact — 5 octobre 2026

`pnpm check` réussi (lint, TypeScript, 39 tests Vitest, build) et 13 parcours auth / Contacts / Paramètres Chromium réussis. Le nouveau parcours crée société et personne puis vérifie les relations commerciales réellement chargées sur la personne, les raccourcis placés avant les champs, les deux vues, la recherche par nom complet, sa conservation lors de la bascule, la préférence d’affichage au rechargement et l’absence de débordement desktop / mobile. Les termes de recherche sont combinés côté repository avec paramètres échappés pour rechercher prénom et nom ensemble.

Captures inspectées : `/private/tmp/horizon-companies-cards.png`, `horizon-companies-list.png`, `horizon-company-compact.png` et `horizon-people-cards-mobile.png`. Le parcours ajouté a été relancé après correction du typage de la fixture et de l’attente de rendu avant capture mobile. Aucun changement backend ni test utilisant les données NAS.


### Révision de charte et logos non tronqués — 5 octobre 2026

La recette ajoute un logo PNG horizontal de ratio 4:1, généré uniquement dans le test, avec repères sur ses deux bords. Vérifications du logo enregistré et de son aperçu en fiche, cartes et tableau : image visible et cadrage `contain`. Vérifications des vrais totaux Clients, de la navigation clavier entre onglets, de l’absence des informations dans Relations, de la sauvegarde et relecture des notes, et du layout mobile sans débordement. Les tests de service refusent les statistiques sans lecture autorisée et conservent les totaux serveur au lieu d’utiliser la page affichée.

Captures de recette : `/private/tmp/horizon-redesign-record.png`, `horizon-redesign-record-mobile.png`, `horizon-redesign-list.png`, `horizon-redesign-cards-mobile.png`. La fixture logo est une image synthétique de test ; aucun logo ou compte NAS n’est utilisé. La suite layout a été relancée pour les changements de charte communs.

Vérifications finales de la révision : lint / TypeScript / build et 41 tests Vitest réussis ; 14 parcours auth / Contacts / Paramètres et 7 parcours layout Chromium réussis. Captures desktop / mobile et logo horizontal inspectés. Recette utilisateur NAS à compléter ; aucune nouvelle installation PocketBase requise.

Précision cadre carré : le test du logo horizontal vérifie aussi l’égalité largeur / hauteur et le fond blanc du cadre en fiche, carte et tableau. Parcours ciblé réussi ; lint / TypeScript / 41 tests unitaires / build réussis. Les fichiers images et le schéma PocketBase restent inchangés.

Dimensions demandées par l’utilisateur : 128 × 128 px en fiche, 64 × 64 px en carte, 36 × 36 px en liste. Le parcours logo vérifie maintenant ces dimensions exactes, le fond blanc et le cadrage proportionnel ; parcours ciblé et `pnpm check` réussis.

Cartes horizontales : parcours Contacts / Paramètres / Auth (14) et `pnpm check` réussis (41 tests unitaires, lint, types, build). Le parcours logo vérifie aussi que les coordonnées se trouvent à droite du logo et que la ville / le libellé pays proviennent de l’adresse enregistrée. Captures desktop et mobile inspectées. Expansion d’adresses sur les API existantes, sans migration PocketBase.

Centrage de la recherche dans la top bar : `pnpm check` et les 7 parcours layout réussis. Parcours de centrage enrichi relancé avec mesures à 1440, 900 et 390 px (écart inférieur à 1 px entre les centres) et contrôle du débordement. Parcours connexion responsive / déconnexion également réussi.


### Combobox / footer / Paramètres par domaine — 5 octobre 2026

`pnpm check` réussi (lint, TypeScript, 41 tests unitaires, build), 15 parcours auth / Contacts / Paramètres et 7 parcours layout Chromium réussis. Nouveaux contrôles : vue d’ensemble et recherche de rubrique, navigation vers un module prévu, accès aux référentiels sans écriture, catalogue conservé au rechargement, absence de footer, centrage vertical du chevron à moins de 1 px, sélection pays et retour du focus, absence de débordement mobile. Les parcours de société / archivage utilisent maintenant le menu partagé pour Société et État des fiches.

Captures inspectées : `/private/tmp/horizon-settings-overview.png`, `horizon-settings-mobile.png`, `horizon-combobox-menu-mobile.png`. Aucun changement PocketBase pour ce lot ; les rubriques prévues ne présentent pas de formulaires de sauvegarde.


### Validation top bar et compte — 5 octobre 2026

`pnpm check` réussi : lint, TypeScript, 41 tests Vitest et build. `pnpm test:e2e` : 8 parcours Chromium réussis, dont maintien du header au défilement desktop / mobile et centrage sans débordement. `pnpm test:e2e:auth` : 17 parcours réussis contre une instance PocketBase temporaire, dont recherche Contacts unique, filtre URL après rechargement et changement de vue, raccourci clavier, compte personnel mobile, fermeture du menu au clavier, déconnexion et purge du token. Captures du layout desktop / mobile inspectées. Aucun changement de backend pour ce lot ; recette utilisateur sur le NAS à compléter.

Sélecteur local / global : lint, types, 41 tests unitaires et build réussis ; 9 parcours layout validés, puis scénario de contexte revalidé après ajustement final de navigation. 16 parcours authentifiés réussis dans la suite ; le parcours charte, interrompu au login pendant un rechargement Vite, réussit à la relance isolée. Le mode global reste une recherche des espaces Horizon.

Surfaces Contacts cliquables : `pnpm check` réussi (41 tests unitaires et build). Parcours cartes / liste et charte validés ; scénario dédié validant clic dans l’angle vide d’une carte, clic sur la zone statut d’une ligne, ouverture au clavier et action e-mail conservée. Le clic de test sur une cellule recouverte par le lien de ligne a été ajusté pour viser la position réelle dans la ligne. Aucun changement backend.

Densité des fiches / cartes sans flèche : lint et TypeScript réussis ; trois parcours ciblés (présentation cartes / liste, charte, surface cliquable) validés, puis présentation revalidée après ajustements des interrupteurs, colonnes et panneau légal. Captures desktop / mobile générées ; capture société inspectée. Modification des rôles métier en attente de clarification utilisateur.

Harmonisation des fiches / Client et Fournisseur : `pnpm check` réussi (lint, types, 42 tests unitaires, build), 30 tests backend (13 auth + 17 Contacts / migrations / Pappers) et 18 parcours authentifiés Chromium réussis. Vérification API des deux valeurs, cumul, refus des trois anciens rôles et migration non destructive face à un rôle inattendu. Test navigateur étendu : uniquement deux cases et cumul conservé au rechargement. Captures desktop / mobile inspectées. Dernier ajustement Pays / Région revalidé sur les parcours présentation et charte. Archive NAS complémentaire préparée, recette après installation restant à effectuer.

Correction relations à la création : `pnpm check` réussi (44 tests unitaires, lint, types et build). Trois parcours Chromium ciblés réussis : création / édition / archivage, reprise après refus d’adresse, Client et Fournisseur visibles avant création et reprise d’un refus du deuxième rôle sans doublon. Les deux choix et l’adresse sont conservés après rechargement. Aucun changement backend supplémentaire.

Fiche intégrée : `pnpm check` réussi (44 tests unitaires, lint, types, build), trois parcours Contacts ciblés réussis (présentation cartes / liste, charte / onglets, création avec relations et reprise sans doublon). Captures Nouvelle société desktop 1440 px et mobile 390 px inspectées, pas de débordement horizontal et choix Client / Fournisseur visibles à la création. Révision visuelle uniquement, sans migration ou archive PocketBase supplémentaire.

### Formulaires inspirés de la référence utilisateur — 5 octobre 2026

`pnpm check` réussi : lint, TypeScript, 44 tests unitaires et build. `pnpm test:e2e:auth` : 19 parcours Chromium réussis contre un PocketBase temporaire. Contrôles ajoutés : largeur des champs et du panneau Identité du nouveau contact, recherche et sélection directement dans le menu Société, absence du champ de recherche redondant, choix Client / Fournisseur visibles avant sauvegarde, logo de création dans un cadre blanc 128 × 128 px et absence de débordement mobile. Les parcours existants couvrent sauvegarde, associations, permissions, archivage, reprise après erreur sans doublon, onglets et navigation clavier.

Captures desktop société et contact ainsi que société mobile inspectées : `/private/tmp/horizon-new-company-integrated.png`, `/private/tmp/horizon-new-person-reference.png`, `/private/tmp/horizon-new-company-integrated-mobile.png`. Un problème de cascade CSS réduisait les panneaux de création de contact ; il a été corrigé et couvert par les contrôles de largeur. Aucun changement de schéma ou de hook PocketBase dans cette révision ; aucune archive NAS supplémentaire nécessaire. Le build conserve son avertissement de chunk principal supérieur à 500 kB.

Gabarit commun création / fiche enregistrée : `pnpm check` réussi (44 tests unitaires, lint, TypeScript et build), suite authentifiée de 19 parcours réussie après harmonisation ; trois parcours ciblés revalidés après suppression du bandeau de coordonnées redondant (lecture seule, charte / clavier / mobile, relations et reprise). Contrôle de cohérence ajouté : mêmes classes et ordre de blocs, mêmes largeur et hauteur du panneau Identité avant et après sauvegarde, logo 128 px blanc conservé. Captures `/private/tmp/horizon-company-unified.png` et `/private/tmp/horizon-redesign-record-mobile.png` inspectées. Backend inchangé.

### Enregistrer selon les modifications / logo société associé — 5 octobre 2026

`pnpm check` réussi : lint, TypeScript, 44 tests unitaires et build. La suite authentifiée finale réussit ses 19 parcours sur PocketBase temporaire. Les contrôles vérifient le bouton neutre / désactivé au départ, primaire après saisie, désactivé après sauvegarde, rétablissement de l’adresse initiale, retrait puis conservation d’un logo, édition des référentiels et retour au libellé initial. Les tests de reprise après refus d’adresse ou de rôle restent réussis. Tailles du logo associé contrôlées : carte 26 px, liste 16 px, image entière avec `object-fit: contain`.

Les parcours anciens ont été adaptés pour ne plus cliquer Enregistrer sur une création vide et pour utiliser le nom accessible actuel du lien vers la société associée. Aucun changement de schéma, hook ou fichier NAS pour ce lot.

États de chargement Contacts : `pnpm check` réussi (44 tests unitaires, lint, TypeScript, build). Trois parcours authentifiés ciblés réussis. Une sauvegarde de rôle retenue volontairement vérifie l’indicateur accessible, l’absence de paragraphe de statut et la hauteur inchangée du panneau Identité. Une réponse Contacts retardée vérifie l’emplacement de chargement et conserve le parcours anti-régression de contact nouvellement associé. Les erreurs restent visibles ; aucun changement PocketBase.

### Sauvegarde explicite des formulaires — clarification du 5 octobre 2026

`pnpm check` réussi (44 tests unitaires, lint, TypeScript, build). Les 19 parcours authentifiés existants réussissent après suppression de la sauvegarde automatique des relations ; parcours société revalidé après ajout de la désactivation puis restauration d’un rôle existant. Contrôles : aucune requête de mutation de rôle avant Enregistrer, bouton actif sur un changement et neutre après retour au choix initial, rechargement sans sauvegarde qui abandonne les choix, cumul conservé après sauvegarde, reprises après refus d’un rôle ou d’une adresse.

Nouveau parcours Pappers réussi séparément : réponses fournisseur simulées, aucune écriture API pendant Reporter dans la fiche, formulaire rempli et bouton Enregistrer actif, champs et adresse persistés sur le vrai PocketBase temporaire seulement après Enregistrer. Les simulations incluent la révision Contacts exigée par le frontend. Lecture seule des relations de société depuis la fiche personne. Aucun changement de collection, hook ou archive NAS nécessaire.

Changement de société d’un contact : parcours dédié réussi sur PocketBase temporaire. Sélection d’une autre société sans écriture, rechargement qui conserve le rattachement enregistré, puis une unique mise à jour du contact après Enregistrer. Vérification du rattachement après rechargement et des listes de contacts associés des deux sociétés. Lint et TypeScript réussis. Aucun changement de comportement ou de backend nécessaire : le sélecteur Société était déjà modifiable.

Confirmation ARCHIVER : `pnpm check` réussi (44 tests unitaires, lint, TypeScript, build). Deux parcours authentifiés ciblés réussis sur PocketBase temporaire : archivage / réactivation et permissions de lecture. Contrôles : champ focalisé, blocage d’Entrée vide et de trois saisies incorrectes, zéro requête avant validation, Annuler / Échap, retour du focus et réinitialisation du mot à la réouverture, absence de débordement mobile, erreur serveur conservant la fenêtre ouverte et reprise réussie. Capture `/private/tmp/horizon-archive-confirmation-mobile.png` inspectée. Aucun changement PocketBase.

Finition colorée du popup d’archivage : lint et TypeScript réussis ; parcours authentifié d’archivage / erreur / reprise revalidé. Couleur magenta active vérifiée après saisie ARCHIVER, capture mobile inspectée et absence de débordement confirmée. Changement visuel uniquement.

Sobriété du popup après retour utilisateur : changements CSS uniquement, parcours archivage / annulation / erreur / reprise revalidé et capture mobile inspectée. Fond blanc, icône cuivre discrète et bouton magenta, sans bandeau rose ou flou. `git diff --check` réussi.


Recherche publique directe — validation du 5 octobre 2026 :

- `pnpm check` : lint, TypeScript, 52 tests unitaires et build réussis. Avertissement existant sur un chunk supérieur à 500 kB.
- `pnpm test:e2e:auth --grep 'recherche entreprises'` : parcours Chromium réussi, API publique simulée au format officiel ; deux appels directs anonymes, aucun relais de recherche PocketBase, aucune écriture avant Enregistrer, téléphone / TVA conservés, société et adresse persistées après sauvegarde, création et fiche existante, fenêtre mobile sans débordement.
- `pnpm test:backend` : 13 tests Auth et 14 tests Contacts / migrations réussis sur des instances temporaires locales. Le statut de révision reste protégé ; les routes recherche / aperçu / application ne sont plus exposées par les hooks locaux.
- Recette réelle en Chromium depuis une page HTTP locale : appel direct anonyme à l’API Recherche d’entreprises pour le SIRET public `55208131766522`, HTTP 200 et identifiants attendus. CORS navigateur validé sans relais serveur.
- Aucun appel d’écriture ni déploiement sur le NAS pendant les tests. Les tests fournisseur unitaires vérifient le SIRET exact, restrictions de diffusion, adresses absentes / étrangères, quotas et erreurs réseau / contrat.


Menu Actions / suppression Contacts — validation du 5 octobre 2026 : lint, TypeScript, 52 tests unitaires et build réussis ; suite Chromium Auth / Contacts complète : 22 tests réussis. Après finalisation des hooks, le scénario menu / duplication / suppression a été rejoué avec succès. Backend : 13 tests Auth réussis et 18 tests Contacts / migrations réussis. Un démarrage intermittent d’instance de test a échoué (connexion refusée), puis la relance a réussi ; aucune instance NAS utilisée.

Les tests vérifient : engrenage après Enregistrer, absence du bouton Archiver isolé, confirmations orange / rouge, mot exact et annulation sans écriture, reset et focus, archivage refusé puis reprise, duplication sans écriture avant Enregistrer, identifiants légaux vidés et adresse source préservée, suppression d’une société inutilisée avec rôles / adresses et audit, refus d’un lecteur, blocage des contacts associés et documents cachés / archivés en relation multiple, blocage même via API superuser, suppression d’une personne inutilisée, refus d’une personne référencée, rollback de société / enfants si l’audit échoue. Les futures pièces ont été simulées dans des collections temporaires locales ; aucun module Devis / Factures fictif ajouté à l’application.


Profil comptable / TVA — validation du 5 octobre 2026 : `pnpm check` réussi (lint, TypeScript, 53 tests unitaires, build). Backend : 13 tests Auth et 20 tests Contacts / migrations réussis, puis un test supplémentaire de référence indirecte au compte tiers réussi. La migration préserve langue, devise et ancien identifiant fiscal lors du passage V1 ; RCS n’est pas inventé depuis la valeur fiscale. Préférences fr / EUR à la création, champs RCS / routage / préparation persistés et validés, profils tiers soumis aux permissions et audités.

Chromium : 22 scénarios de la suite complète réussis, puis le scénario initial affecté par un rechargement des hooks pendant les tests rejoué avec succès ; les 23 scénarios ont ainsi été validés. Le nouveau test comptable couvre les défauts, RCS visible, saisie des deux comptes, informations électroniques, absence d’écriture avant Enregistrer, rejet simulé d’un compte puis reprise avec une seule société, rechargement et conservation des valeurs, abandon d’une modification non enregistrée et vue mobile sans débordement. Le test recherche API fournit une vraie propriété tva du contrat simulé et vérifie son report explicite. L’unité supplémentaire couvre une TVA unique et plusieurs TVA nécessitant un choix. Réponse publique réelle EDF vérifiée en lecture seule (FR03552081317). Aucun test connecté en écriture au NAS.


5 octobre 2026 — LEI : `pnpm check` réussi (lint, TypeScript, 53 tests unitaires, build ; avertissement de taille du bundle déjà connu). `pnpm test:backend` réussi : 13 tests Auth + 23 tests Contacts/migrations. Contrôles LEI : rejet des valeurs courtes, minuscules ou avec ponctuation côté serveur ; conservation RCS/fiscal historiques ; acceptation d’un champ manuel exact sans doublon ; refus d’un schéma manuel divergent sans perte de données. Trois tests navigateur ciblés réussis (`comptabilité|recherche entreprises|menu engrenage`) : saisie LEI minuscule normalisée, sauvegarde explicite et reprise sans doublon, import TVA, actions protégées. Tous exécutés sur PocketBase local jetable, sans écriture NAS.


Notifications et recherche logos — 5 octobre 2026 : `pnpm check` réussi, 57 tests unitaires, lint/TypeScript/build OK (avertissement de taille du bundle déjà existant). Backend local jetable : 13 Auth + 23 Contacts/migrations + 1 scénario Notifications réussi (lecture isolée entre comptes, création/suppression verrouillées, contenu et destinataire immuables, horodatage de lecture serveur préservé). Trois parcours Chromium ciblés réussis : parcours Contacts existant avec import local, recherche/sélection/annulation/sauvegarde protégée de logo avec API simulée et PNG valide, cloche avec vraie notification en base et persistance de lecture. Capture mobile inspectée, pas de débordement horizontal. Quatre tests unitaires fournisseur images : rendu PNG des SVG, tri et filtres, résultats vides/429, domaines autorisés, refus fichiers trop gros/non-images. Vérification réseau réelle séparée : recherche TF1 via API publique et téléchargement PNG sous Chromium, deux réponses 200, décodage 500×183 réussi ; CORS public opérationnel. Ces vérifications ne garantissent pas un résultat pour toute société ni la disponibilité permanente du fournisseur. Aucun accès en écriture au NAS.


Fil d’activité complet — 5 octobre 2026 : `pnpm check` réussi (lint, TypeScript, 61 tests unitaires, build ; avertissement de taille du bundle préexistant). Suite backend complète réussie avec 13 Auth + 23 Contacts + 1 Notifications + 7 Activity, puis suite Activity élargie à 8 tests réussie : permissions, auteur/date contrôlés serveur, immuabilité, diff groupé et absence de bruit, mentions dédupliquées et notifications, lecture synchronisée, droits retirés, tâche/conversion/clôture/archive, fichiers protégés, suppression de source sans perte de traces, rollback sur notification échouée, migration historique avec dates exactes et application répétée, pagination 20+6.

Parcours navigateur : 26 scénarios authentifiés vérifiés. Première exécution complète : 25 réussis, un ancien test ambigu car le mot Archivé figure désormais aussi dans le fil. Sélecteur de badge précisé dans le test, puis scénario concerné réussi sans changement fonctionnel. Nouveau parcours complet réussi sur un vrai PocketBase : création groupée (fiche+adresse+rôle), modification explicite, commentaire avec document et mention, conversion en tâche, assignation, clôture, filtre Documents, notification et lien #activity, lecture seule d’un autre compte. Aperçus desktop et mobile inspectés, absence de débordement horizontal vérifiée. Capture mobile reprise sans animation de défilement pour contrôler le rendu complet. Tests service supplémentaires : refus d’accès avant requête, message vide, nombre/type/taille des fichiers, payload tâche obligatoire et publication explicite. Bases locales jetables exclusivement ; aucune modification NAS.


Bulles et suppression de PJ : lint/TypeScript et 61 tests unitaires réussis ; 10 scénarios backend Activité réussis, dont retrait d’un fichier parmi deux, permissions/entrée invalide/source archivée ou disparue, conservation du commentaire/auteur/date/mentions, ancien lien inaccessible, trace et audit avant/après, rollback avec fichier encore téléchargeable si audit indisponible. Parcours Playwright du fil complet réussi : bulle, corbeille absente pour lecteur, annulation sans suppression, confirmation SUPPRIMER, commentaire conservé et absence du fichier après rechargement ; captures desktop/mobile.


Recherche d’images partagée — 6 octobre 2026 : Google Images en premier, Wikimedia en second ; contrat et exemple d’intégration documentés dans Architecture. Tests de sélection Google, collage d’une image, annulation et aucune écriture avant Enregistrer ; tests Wikimedia et filtres conservés. Les repositories / services sont déplacés vers core/images et le composant vers shared/images. Informations légales : bloc toujours visible, aucun chevron de fermeture.

### Recette Contacts / Adresses — 6 octobre 2026

Vérifier Contacts (personnes uniquement), puis Adresses (siège, e-mails existants, coordonnées complémentaires). Ajouter un e-mail de facturation seul et une adresse de livraison complète avec e-mail ; changer d’onglet sans perte ; aucune requête d’écriture avant Enregistrer ; validation d’un brouillon vide ; sauvegarde et rechargement conservant les cartes et l’onglet. Modifier un e-mail existant et l’e-mail général : mise à jour des champs sources sans doublon. Vérifier lecture seule et absence de débordement sur mobile. Captures `/private/tmp/horizon-company-addresses-desktop.png` et `horizon-company-addresses-mobile.png`.

Tests serveur : base neuve avec toutes les migrations ; e-mail seul ; pays / adresse postale incomplets refusés ; batch atomique si un élément est invalide ; remplacement d’une adresse principale sans suppression ; auteur audité ; identifiants de création rejoués sans doublon ; utilisateur sans écriture refusé ; adresse d’une autre société interdite ; société archivée non modifiable. Les parcours existants de siège et de navigation ont été vérifiés. Les nouvelles capacités exigent le lot NAS Adresses et la révision Contacts 5.

Vérifications finales : lint, TypeScript, build et 67 tests Vitest réussis ; 25 tests backend Contacts et 10 Activity réussis. Suite Chromium authentifiée : 26 scénarios réussis au premier passage, deux assertions adaptées (liste des nouveaux onglets et comptage des écritures métier excluant le renouvellement de session), puis ces deux scénarios et le nouveau parcours Adresses réussis. Captures PC / mobile inspectées ; aucun débordement horizontal. Migration et hooks regroupés dans le lot NAS documenté en Security & Ops, sans déploiement distant.

Contacts associés / archives : parcours Chromium dédié validé sur PocketBase temporaire. Aucun filtre avec zéro archive, apparition d’Actifs / Archivés et du compteur après archivage, consultation des archives puis retour aux actifs, disparition après réactivation du dernier contact archivé. Police Inter, sélection unique, rendu PC / mobile et absence de débordement vérifiés. Lint, TypeScript et build réussis. Aucun changement de schéma PocketBase pour cette finition.

Cartes des contacts associés unifiées — 6 octobre 2026 : lint et TypeScript réussis ; parcours Chromium ci-dessus enrichi et réussi sur PocketBase jetable. Vérification de l’avatar 64 × 64 px, fonction, liens e-mail / société, badge Archivé puis disparition après réactivation, clic dans le coin libre de la carte ouvrant la fiche, et absence de débordement mobile. Capture mobile inspectée. Le composant du répertoire est réutilisé sans modifier le contrat PocketBase.

Densité des cartes — 6 octobre 2026 : lint et TypeScript réussis ; deux parcours Chromium réussis (charte / logos et contacts associés). La grille intégrée affiche au moins quatre colonnes à 1440 px et cinq à 1600 px ; hauteur initiale de 224 px vérifiée avec et sans badge d’archive, puis sur mobile (remplacée par 112 px après retour utilisateur). Avatar 64 px, liens natifs, clic sur la surface libre et absence de débordement conservés. Captures desktop et mobile inspectées.

Lisibilité des formulaires : libellés et valeurs en noir via le token partagé, placeholders et champs désactivés secondaires. Lint, TypeScript et build validés ; deux parcours Chromium Contacts / référentiels réussis. Capture de fiche PC inspectée.

Lien Société dans la fiche contact : ouverture depuis l’action attenante à la combobox et cible mise à jour selon la sélection courante. Parcours de changement de société et de requête retardée validés, sans écriture avant Enregistrer. Test de requête retardée précisé pour retenir la liste active, et non la vérification du nombre d’archives. TypeScript, build et lint réussis.

### Thème clair / sombre — 6 octobre 2026

Lint, TypeScript, build et 67 tests Vitest réussis. 12 parcours layout Chromium et 30 parcours authentifiés réussis, puis parcours sombre rejoué après les finitions. Vérifications : bouton lune/soleil accessible, mode mémorisé au rechargement et appliqué dès le démarrage, synchronisation entre onglets, fonctionnement sans stockage navigateur, recherche centrée et top bar fixe PC/mobile, absence de débordement, menus et portals sombres, valeurs de formulaires lisibles, logo 128×128 blanc, champs et brouillons conservés sans écriture lors de la bascule, retour au texte noir en clair. Confirmation ARCHIVER conserve son bouton orange. Aucun changement PocketBase pour le thème.

Captures inspectées : `/private/tmp/horizon-dark-settings.png`, `horizon-dark-mobile.png`, `horizon-dark-company.png`, `horizon-dark-company-mobile.png`, `horizon-dark-confirmation.png`. Le test de défilement attend maintenant le rendu Paramètres avant de faire défiler la page pour éviter une course au chargement.

Filtres contextuels : tests unitaires du contrat URL (valeurs inconnues, défaut omis, conservation de recherche/vue/autres clés, réinitialisation limitée au contexte). Parcours authentifié lecteur : Actifs / Archivés, pastille retirée, rechargement et changement cartes/liste, précédent/suivant, bascule globale puis locale, réinitialisation sans perte de recherche, fermeture clavier/focus, société/personne et absence de filtres sur Paramètres. Vérifications du panneau sombre et de la largeur de saisie sans débordement à 1440, 900, 390 et 320 px. Parcours d’archivage existant adapté au nouveau panneau ; aucune écriture Contacts lors des opérations de filtrage.

Filtre commercial Contacts : parcours sur PocketBase réel avec sociétés Client seul, Fournisseur seul, double rôle et ancien Client désactivé dont le rôle Fournisseur reste actif. Vérifier les résultats serveur, l’absence de faux positif sur le rôle désactivé, cartes / liste, recherche conservée au rechargement et à la réinitialisation, cumul relation + archives (compteur 2), puis les personnes rattachées à une société aux deux rôles.

Vues et regroupements : `tests/pocketbase/check_views.py` ajouté à test:backend. Quatre tests sur base jetable : création privée/globale par un lecteur, isolation des collègues, propriétaire fixé et immutable, rôle administrateur core.views.manage, modification/suppression contrôlées, audit ; allowlist des critères et context ; groupes pays du siège, rôles actifs, archives, compteurs et pagination 25 + 2 sans doublons ; personnes par société/pays et valeurs absentes. Service Views testé sans accès, création globale autorisée et critères/context invalides refusés. Playwright : deux colonnes desktop, regroupements France/Allemagne, personnes par société, tri URL conservé, cartes/liste, sombre/mobile ; vues privées/globales, rechargement, application sans modification métier, renommage par auteur, usage sans écriture par collègue, suppression par administrateur, bouton Enregistrer désactivé lorsque la vue ne change pas.

Validation finale : lint, TypeScript, build et 73 tests unitaires réussis ; les quatre tests backend Vues / Groupes réussis ; 12 parcours layout réussis. Les 34 parcours authentifiés ont été validés : 33 dans la suite complète, puis le parcours initial rejoué avec succès après une collision de fichiers de traces entre les suites lancées simultanément. Les sorties Playwright sont désormais séparées (`test-results/layout` et `test-results/auth`) pour éviter cette collision. Captures du panneau desktop et sombre mobile inspectées. Toutes les écritures de test utilisent une base PocketBase jetable ; aucun déploiement sur le NAS.

Réduction de hauteur des cartes — 6 octobre 2026 : hauteur fixe ramenée à 112 px, métadonnées et coordonnées réparties sur des lignes compactes, badges sur une ligne de pied commune. Lint et TypeScript réussis, trois parcours Chromium réussis (charte / logos, liens et surface cliquable, contacts associés / archives). Hauteur de 112 px sur PC et mobile, quatre / cinq colonnes, liens e-mail / téléphone / société et avatar 64 px conservés. Captures PC et mobile inspectées. Aucun changement PocketBase.

Présentation des cartes personnes — 6 octobre 2026 : nom, fonction et société sur des lignes distinctes ; une ligne de coordonnées principale avec actions complémentaires discrètes. Lint et TypeScript réussis ; trois parcours Chromium réussis (charte, surface cliquable, contacts associés). Le test vérifie aussi l’ordre vertical fonction → société → coordonnées, les liens, la hauteur 112 px et les quatre / cinq colonnes. Capture mobile inspectée.

Navigation des fiches — 6 octobre 2026 : lint, TypeScript, build et 76 tests unitaires réussis. Cinq tests backend Vues / Groupes / Navigation réussis sur base jetable, dont rang 25/28 et voisin sur la page suivante, limites, tri descendant, ordre regroupé, filtre sans résultat, rôle, identifiant / sort invalides et utilisateur non autorisé. Deux tests de contexte et protection du service avant requête ajoutés. Parcours Chromium navigation réussi : ouverture depuis tableau / cartes, 2/3 → 1/3 → 3/3, critères conservés au rechargement, retour Répertoire, flèches aux limites, annulation / abandon de brouillon sans écriture, nouvel accès direct et mobile. L’assertion d’accès direct passe d’abord par une autre page : recharger la même URL conserve intentionnellement l’historique de contexte. Parcours des surfaces cliquables réussi et 12 tests du layout partagé réussis. Captures desktop/mobile inspectées ; deux hooks préparés pour NAS, aucun déploiement distant.

Transition sans flash — 6 octobre 2026 : parcours Chromium navigation réussi avec la réponse de la fiche suivante volontairement retenue. Pendant l’attente : ancienne fiche et compteur visibles, URL inchangée, fiche inert ; après réponse : bascule directe sur la cible. Échantillonnage requestAnimationFrame sans absence de formulaire ni texte de chargement, puis retour / brouillon / rechargement conservés. Erreur 503 simulée : dialogue, ancienne fiche et compteur conservés, interactions restaurées et aucune écriture. Lint, TypeScript, 76 tests unitaires et build validés. Aucun changement PocketBase.

Raccourcis contextuels — 6 octobre 2026 : lint, TypeScript, build et 79 tests unitaires réussis. Parcours Chromium dédié validé : barre entre fil d’Ariane et navigation, rôles Client / Fournisseur / cumul après sauvegarde, vrais compteurs Contacts et Adresses, zéro cliquable, destinations de section conservées au rechargement, brouillon préservé lors des changements d’onglet et absence d’écriture avant Enregistrer. Menu « … » testé pour les raccourcis supplémentaires sur PC et mobile ; aucun débordement horizontal. Les modules métier absents restent désactivés avec « — », sans compteur inventé. Parcours de navigation sans flash et de cartes / liste validés, ainsi que les 12 tests du layout partagé. Captures PC / mobile inspectées. Le compteur des contacts utilise les règles de lecture PocketBase existantes ; aucun nouveau schéma, hook ou lot NAS nécessaire pour ces raccourcis.

Correction du placement des compteurs — 6 octobre 2026 : Contacts et Adresses retirés de la barre métier et compteurs déplacés dans les onglets. Lint et TypeScript réussis ; parcours Chromium dédié réussi : valeurs 0 / 1, actualisation après création d’un contact, absence de doublons dans la barre, rôles client / fournisseur / cumul, saisies conservées sans écriture, menu supplémentaire et rendu mobile sans débordement. Aucun changement PocketBase.

Séparation fiche / fil — 6 octobre 2026 : espacement augmenté, ligne fine avec extrémités estompées et petit repère central violet / rose. Le fil conserve son fond ouvert, sans nouvelle box. Deux parcours Chromium réussis : fiche et compteurs sur PC / mobile, puis thème sombre avec fil, formulaire et pièces jointes. Captures inspectées, aucune modification de logique métier ou de PocketBase.

Mentions dans les bulles — 6 octobre 2026 : suppression de la pastille répétant le destinataire sous le commentaire ; mise en évidence du nom directement dans le texte, sans modifier le contenu enregistré ni les notifications. Deux tests unitaires réussis (texte conservé, noms similaires, caractères spéciaux et retours à la ligne), lint et TypeScript réussis. Parcours Chromium Fil complet réussi : mention Alice dans la bulle, aucune pastille dupliquée, pièce jointe, tâche et notification conservées. Aucun changement PocketBase.

Liens des tuiles Contacts — 6 octobre 2026 : lint et TypeScript réussis ; parcours Chromium lecteur dédié réussi. Vérification des quatre liens natifs, destinations Clients / Fournisseurs avec rôle dans l’URL, Sociétés / Personnes actives, retrait des critères précédents et maintien du mode liste. Aucun changement PocketBase.

Validation avant publication — 6 octobre 2026 : pnpm check réussi (lint, TypeScript, 81 tests unitaires et build) ; cinq tests PocketBase Vues / Groupes / Navigation et 12 tests du layout réussis. Les 37 parcours authentifiés sont validés : 34 au passage complet, puis trois rejoués avec succès après adaptation de deux assertions (tuile Clients devenue lien, compteurs ajoutés aux onglets) et reprise d’un clic de combobox interrompu. Aucun déploiement NAS dans ce lot ; procédure et archives PocketBase décrites en Security & Ops.

Densification du fil — 6 octobre 2026 : lint et TypeScript réussis ; deux parcours Chromium réussis (fil complet et thème sombre). Espacements d’en-tête, filtres, rédacteur et événements resserrés ; saisie sur deux lignes, commentaires plus compacts, texte et avatars conservés. Captures PC / mobile générées, rendu PC inspecté. Aucun changement PocketBase.

Changements directement visibles — 6 octobre 2026 : volets repliables supprimés du fil. Liste compacte libellé / ancienne valeur / flèche / nouvelle valeur, à côté du résumé sur PC, repli naturel sur mobile. Lint et TypeScript réussis ; parcours Fil complet adapté pour vérifier l’affichage immédiat sans details, et parcours sombre réussis. Captures PC / mobile inspectées ; notifications, tâches et pièces jointes conservées, aucun changement PocketBase.

Lisibilité des changements — 6 octobre 2026 : un champ modifié par ligne sous le résumé, espacement compact de 3 px entre lignes et de 6 px entre valeurs. Parcours Chromium Fil complet réussi, avec assertion de séparation verticale des deux premières modifications. Captures PC / mobile générées et rendu PC inspecté. Aucun changement de données ou PocketBase.

Libellés du fil et cycles de vie — 6 octobre 2026 : lint et TypeScript, deux tests unitaires, 11 tests PocketBase Activity et parcours Chromium Fil complet réussis. Suppression du résumé répété lorsque les modifications sont visibles, action unique à côté de l’auteur. Test serveur : retrait Fournisseur → change/update, archivage réel de la société → status_change/archive. Test frontend : ancien événement de rôle mal libellé affiché comme modification, transitions réelles conservées. Lot NAS à un fichier préparé et contenu vérifié ; aucune migration ni réécriture des événements historiques, aucun déploiement distant.

Fil d’Ariane de fiche — 6 octobre 2026 : lint et TypeScript réussis ; deux parcours Chromium fiches réussis (navigation sans flash / contexte et raccourcis compacts) et 12 tests du layout réussis. Nom courant avec aria-current, absence du bouton Répertoire, lien Contacts restituant les filtres de liste et le tri, compteurs et navigation conservés. Rendu mobile inspecté, nom long tronqué sans débordement. Aucun changement PocketBase.

Bulles sans destinataire affiché — 6 octobre 2026 : texte publié affiché sans les @Nom correspondant aux métadonnées de mentions ; contenu source, destinataires et notifications conservés. Mention seule → « Mention envoyée. », texte sans destinataire inchangé. Lint, TypeScript, trois tests unitaires et parcours Chromium Fil complet réussis, avec vérification du commentaire simple et des notifications. Aucun changement PocketBase.

Clarification des mentions — 6 octobre 2026 : après clarification utilisateur, @Nom reste visible dans la bulle. Le libellé auteur devient « a mentionné un collègue » (ou « des collègues ») lorsqu’un destinataire est enregistré ; aucun badge supplémentaire sous le commentaire. Cette décision remplace le masquage des mentions décrit dans l’entrée précédente. Lint, TypeScript et parcours Chromium Fil complet réussis, avec assertion de mention visible et d’action explicite. Notifications inchangées, aucun changement PocketBase.

Validation avant publication des finitions du fil — 6 octobre 2026 : pnpm check réussi (lint, TypeScript, 83 tests unitaires et build). Parcours Fil complet validé dans sa version finale avec mentions visibles et action explicite ; navigation / raccourcis et 12 tests du layout validés après le fil d’Ariane contextualisé. Les 11 tests backend Activity valident la correction du faux archivage lors d’un retrait de rôle. Lot NAS activité/libellés prêt, sans déploiement distant.

Couleurs Contacts harmonisées — 6 octobre 2026 : mêmes règles CSS pour tag Client / icône tuile Clients (violet), tag Fournisseur / icône tuile Fournisseurs (ambre). Sociétés bleu, Personnes rose, tokens sombres existants. Lint et TypeScript réussis ; parcours Chromium charte et thème sombre réussis, captures générées. Aucun changement de données ni PocketBase.

Pictogrammes de type sur les cartes — 6 octobre 2026 : bâtiment bleu / personnes rose en bas à droite, survol descriptif et lien natif vers la fiche. Lint, TypeScript et deux parcours Chromium (charte / densité mobile et surfaces cliquables) réussis. Capture mobile inspectée ; pied 18 px et hauteur 112 px conservés. Aucun changement PocketBase.

Recherche Contacts avec bascule automatique — 6 octobre 2026 : lint, TypeScript et 83 tests unitaires réussis ; 12 tests Chromium du layout et trois parcours authentifiés (bascule des deux types, recherche persistante, filtres / URL / historique / responsive) réussis. Vérification des résultats dans la liste normale, conservation du focus après bascule, choix manuel de Personnes respecté, absence de popup supplémentaire et absence de débordement mobile. Aucun changement PocketBase.

Sidebar — module actif dans ses sous-pages, 6 octobre 2026 : NavLink conserve l’état actif sur les routes descendantes ; seul Dashboard utilise une correspondance exacte. Lint, TypeScript et deux parcours Chromium réussis : onglets / créations, puis fiches enregistrées sociétés / personnes et bascule automatique. Un seul module sélectionné ; retour Dashboard vérifié. Aucun changement PocketBase.

Cartes Adresses compactes — 6 octobre 2026 : grille commune Contacts, hauteur fixe 112 px, contenu condensé et texte complet au survol. Lint, TypeScript et parcours Chromium Contacts / Adresses réussis : brouillons, sauvegarde principale, édition et lecture seule conservés. Captures desktop et mobile inspectées, quatre cartes sur 1440 px et aucun débordement mobile. Aucun changement PocketBase.

Retrait de l’e-mail général dans Adresses — 6 octobre 2026 : lint et TypeScript réussis. Parcours Contacts / Adresses réussi : aucune carte virtuelle générale, trois cartes au lieu de quatre, e-mail société conservé dans Informations après sauvegarde, lecture seule inchangée. Compteur Adresses zéro pour une société possédant uniquement son e-mail général. Parcours raccourcis réussi en exécution isolée après un premier timeout lors de l’ouverture d’un nouveau contact. Aucun changement PocketBase.

En-têtes de section harmonisés — 6 octobre 2026 : lint et TypeScript réussis. Test Chromium dédié vérifiant Inter / 13 px / graisse 600 / ligne 18 px sur Contacts associés, Adresses de la société et Comptes tiers, ainsi que taille mobile et absence de débordement. Trois parcours de régression réussis : charte / onglets, comptabilité / sauvegardes, adresses / brouillons et lecture seule. Captures Adresses desktop/mobile générées, rendu desktop inspecté. Réutilisation du composant partagé figée dans le document UX. Aucun changement PocketBase.

Espacement des cinq onglets — 6 octobre 2026 : lint, TypeScript et deux parcours Chromium réussis. Test comparatif Informations / Contacts / Adresses / Comptabilité / Notes : sommet du premier titre à 21 px sous la fin des onglets (8 px d’écart + bordure 1 px + padding 12 px), tolérance inférieure à 1 px. Édition des adresses, sauvegarde et absence de débordement mobile conservées. Aucun changement PocketBase.

Graisses réelles Inter — 6 octobre 2026 : ajout des fichiers Latin 600 / 700, auparavant simulés depuis les seules graisses 400 / 500. Lint, TypeScript et build réussis, fichiers WOFF / WOFF2 présents dans le bundle. Test Chromium des titres réussi avec vérification du FontFace Inter 600 effectivement chargé, en plus de la typographie et des espacements des cinq onglets. Le rendu final reste dépendant du zoom et de la densité de l’écran ; aucune attribution certaine de tout flou au seul chargement de police.

Barre de contexte persistante — 6 octobre 2026 : lint et TypeScript réussis, un parcours layout et deux parcours Contacts réussis. Défilement réel : top bar à y=0, barre de contexte à y=52 px desktop / 88 px mobile, raccourcis et navigation des fiches toujours visibles ; positions des titres de section inchangées. Captures desktop/mobile inspectées : fond opaque, aucune superposition entre les deux barres ni débordement horizontal. Aucun changement PocketBase.

Fond du fil d’activité — 6 octobre 2026 : teinte légèrement plus sombre en clair et sombre, couvrant les marges latérales du contenu sans déplacer les champs ni le texte. Zone sans bordure extérieure, arrondi ni ombre ; ligne colorée conservée. Lint et TypeScript réussis ; deux parcours Chromium (Adresses et mode sombre) réussis après extension du fond, rendu desktop inspecté, absence de débordement mobile vérifiée. Aucun changement PocketBase.

Retrait du contenu des événements — 6 octobre 2026 : détails, commentaires, PJ et tâches alignés sous le nom de l’auteur, retrait 38 px. Lint, TypeScript et parcours Fil complet réussis (publication, mention, document, tâche, notifications et suppression de PJ). Capture mobile inspectée, commentaires et détails restent lisibles sans débordement. Aucun changement PocketBase.

Création de tâche depuis une note — 6 octobre 2026 : action texte remplacée par icône adjacente à la bulle, texte au survol et nom accessible conservés. Lint, TypeScript et parcours Fil complet réussis : le même bouton accessible crée la tâche et conserve les références / notifications ; suppression de PJ inchangée. Capture mobile inspectée : icône visible à côté du commentaire, aucune ligne d’action textuelle sous la bulle. Aucun changement PocketBase.

Recherche web société — 6 octobre 2026 : bouton globe « Rechercher sur le web » déplacé dans l’en-tête Identité, style secondaire discret. Lint, TypeScript et trois parcours Chromium réussis (API État, titres uniformes, mode sombre). Le test vérifie son placement dans Identité et son absence de la barre Enregistrer ; recherche et report sans écriture avant sauvegarde conservés. Captures desktop et mobile inspectées. Aucun changement PocketBase.

Largeur minimale des cartes — 6 octobre 2026 : lint et TypeScript réussis ; deux parcours Chromium Contacts associés / Adresses réussis. Largeur de carte ≥ 280 px et nombre de colonnes adapté au conteneur vérifiés à 1440, 1600 et 3440 px, hauteur 112 px conservée. Absence de débordement à 390 px vérifiée ; capture desktop inspectée. Minimum et grille communs aux répertoires et aux emplacements de chargement. Aucun changement PocketBase.

E-mail des cartes ouvrant la fiche — 6 octobre 2026 : lint et TypeScript réussis ; deux parcours Chromium réussis. Clic réel sur l’e-mail d’une carte société puis retour par Fil d’Ariane conservant recherche / présentation ; clic sur l’e-mail d’un contact associé ouvrant sa fiche personne sur mobile. Téléphone indépendant et clic sur la surface / ligne conservés. Aucun changement PocketBase.


CRM C01, premier lot — 6 octobre 2026 : `pnpm check` réussi (lint, TypeScript, 86 tests unitaires et build). Suite backend complète sur PocketBase 0.40.4 et bases temporaires : 61 tests réussis, dont six CRM. Vérifications CRM : création atomique numéro / compte analytique, reprise idempotente, huit créations concurrentes, rollback sans trou de séquence ni compte orphelin, validations et permissions, conflit de version, déplacement batch atomique, archivage, suppression refusée, isolation du fil / mentions / tâches / notifications et configuration des étapes.

Sept parcours Chromium ciblés réussis : trois CRM et quatre régressions Contacts / fil / titres / raccourcis. Les trois CRM ont été rejoués après les finitions de formulaire : création sans écriture avant Enregistrer, PJ et suppression confirmée, déplacement par menu et drag & drop en brouillon, annulation, sauvegarde persistante, recherche / liste / navigation, lecture seule / refus d’accès et étapes dans Paramètres. Captures desktop / mobile / sombre produites ; absence de débordement de page à 390 px vérifiée, défilement horizontal limité au tableau Kanban. Une assertion attend la fin de transition du bouton Kanban en sombre avant capture. Lint, TypeScript et build revérifiés après les dernières modifications. Lot NAS consolidé vérifié (34 fichiers JavaScript, archive intègre) ; installation et permissions dans `06-SECURITY-OPS.md`. Aucun déploiement distant.


Révision CRM pipeline / marchés / description — 6 octobre 2026 : lint, TypeScript, build et 90 tests unitaires réussis. Les 65 tests backend du dépôt sont validés par les passages et reprises ciblés (13 Auth, 25 Contacts, 1 Notifications, 11 Activity, 5 Views, 10 CRM). Une exécution complète a été interrompue par un refus de connexion au serveur temporaire ; Activity a été rejoué avec succès, puis Views / CRM. Les premiers contrôles de mise à niveau ont révélé le hook empêchant l’initialisation de l’état sur une étape déjà utilisée ; correction vérifiée par le test réel de migration d’une ancienne base.

Dix tests CRM couvrent notamment les six états, réouverture par déplacement, marchés / permissions, JSON formaté et projection texte serveur, idempotence avec JSON, types de contenu interdits, sommes EUR / USD séparées et filtres, migration préservant identifiant / numéro / compte / description et inactivation des étapes historiques. Tests unitaires ajoutés sur texte littéral, projection des listes et interdiction des nœuds / attributs étrangers, ainsi que correction locale des totaux globaux sans mélange de devises ni mutation du résultat serveur.

Six parcours Chromium distincts validés : trois CRM et trois Contacts / Paramètres (création / rôles / archivage, référentiels clavier et consultation, navigation des paramètres / combobox). CRM vérifie marché sélectionné / effacé, champ obligatoire effacé refusé avant tout POST, description gras / liste numérotée conservée après sauvegarde, totaux de colonne, repli / dépli, déplacements et annulation en brouillon, recherche / liste, PJ, lecture seule, mobile sans débordement de page et sombre. L’ancien test Paramètres pointait encore vers le placeholder Pipelines ; adapté au référentiel CRM réellement livré et à un compte disposant des droits nécessaires. Captures Description et colonne repliée inspectées, Kanban final ouvert et fiche dense inspectés. Nouveau lot NAS consolidé de 37 fichiers intègre et documenté dans le document 06 ; aucun déploiement distant.


Persistance des colonnes repliées CRM : lint et TypeScript réussis ; parcours Chromium CRM complet réussi avec repli de Nouveau, rechargement, contrôle du bouton Déplier et réouverture. Préférence par utilisateur dans ce navigateur, aucune écriture métier ni migration. Drag & drop inchangé dans ce lot ; choix de bibliothèque proposé à l’utilisateur avant intégration.

Kanban dnd-kit — 6 octobre 2026 : lint, TypeScript, 90 tests unitaires et build réussis. Trois parcours CRM Chromium réussis : création / édition / description / fil, droits de lecture / refus sans permission, référentiel des étapes. Parcours de glissement avec souris réelle : overlay visible, déplacement dans une colonne déjà remplie, voisins déplacés, Échap annulant sans brouillon, dépôt dans une colonne repliée, annulation des déplacements après dépôt, aucun POST avant Enregistrer. La fin de l’animation est attendue avant les actions de sauvegarde, annulation ou repli. Préférence de colonne repliée encore relue après refresh ; captures desktop, mobile, sombre et glissement produites, aperçu flottant inspecté. Aucun test ni déploiement sur la base NAS.

CRM — autosauvegarde et dépli au survol, 6 octobre 2026 : trois parcours Chromium réussis (création / fil / Kanban / liste, permissions, paramètres). Tests : déplacement par menu et dépôt automatiquement enregistrés, maintien après refresh, Échap sans POST, conflit 409 simulé avec message visible et retour à la position serveur, nouvel essai réussi, colonne repliée dépliée avant relâchement de la souris puis ouverture persistante, colonne Code séparée et triée dans les deux sens. Vérifications mobile et sombre conservées. Régression formulaire : initialisation de l’étape incorporée aux valeurs par défaut et initialisation de Tiptap sans émission de changement utilisateur ; une fiche neuve laisse Enregistrer désactivé. Lint / TypeScript / 90 tests unitaires / build réussis ; capture des colonnes inspectée. Aucune migration ni manipulation de données NAS.

7 octobre 2026 — validation des ajustements visuels CRM : lint, TypeScript, 90 tests unitaires (17 fichiers), build et 3 parcours Playwright CRM réussis. Contrôles : avatar du responsable et logo client dans cartes / liste, absence de boutons et badges d’état dans les cartes, déplacement vers colonne remplie puis retour vers colonne vide, Échap sans écriture, conflit 409 avec restauration, ouverture au survol d’une colonne repliée et persistance au refresh, lecture seule et paramètres. Le serveur de test PocketBase désactive hooksWatch et Playwright attend la fin de la préparation des comptes avant de démarrer ; aucune modification de la configuration de production.

7 octobre 2026 — paramètres CRM et marchés multiples : lint, typecheck, build, 91 tests unitaires (18 fichiers), 12 tests serveur CRM et 4 parcours navigateur CRM réussis. Migration testée depuis le pipeline précédent : marché unique conservé en relation multiple, numéro / compte analytique inchangés, couleur personnalisée conservée ; réapplication sans effet. Tests de refus des doublons, mauvaise référence / couleur / vue, écritures de paramètres sans droit et suppression du singleton. Parcours navigateur : sélection / retrait / persistance de deux marchés, tags dans la liste, couleurs de colonne / aperçu cohérentes, réglage via dialogue de colonne et vue initiale Liste partagée. Les parcours drag & drop, conflit 409, repli et permissions restent vérifiés.

7 octobre 2026 — simplification visuelle des colonnes CRM : rendu navigateur contrôlé, lint / TypeScript / build et quatre parcours CRM réussis. Déplacement, annulation, conflits, ouverture au survol et réglages de couleur restent fonctionnels après suppression des fonds et cadres de colonne. Aucun changement serveur.

7 octobre 2026 — colonnes CRM selon les références visuelles utilisateur : contrôle du rendu navigateur (surfaces neutres distinctes, cartes blanches, en-têtes compacts), lint / TypeScript / build et quatre parcours CRM réussis. Repli, déplacement, conflit et configuration de couleur conservés.

7 octobre 2026 — bord supérieur coloré et contraste renforcé des colonnes : rendu vérifié dans le navigateur, lint / TypeScript / build et quatre parcours CRM réussis. Suppression effective des pastilles ; réglages de couleur, repli et glisser-déposer conservés.

7 octobre 2026 — finitions des cartes CRM : lint / TypeScript / build et quatre parcours CRM réussis. Capture navigateur inspectée : message de colonne vide centré, tags de marchés avec couleurs configurées, logo client de 38 px à droite, responsable et hauteur de carte de 112 px conservés. Glisser-déposer, permissions et paramètres restent validés. Aucun changement serveur.

7 octobre 2026 — disposition finale des cartes CRM : lint / TypeScript / build et quatre parcours CRM réussis. Parcours Kanban rejoué après la correction du style des tags en pied de carte ; capture inspectée avec code / client réunis, titre puis montant, avatar et logo à droite, tags face à la probabilité. Hauteur 112 px et clic de fiche conservés.

7 octobre 2026 — Séquences, étapes fixes et couleurs libres : lint / TypeScript / 93 tests unitaires (19 fichiers) / build réussis. 15 tests serveur CRM validés (suite de 14 puis test de mise à niveau historique supplémentaire et reprise permissions) : refus d’ajout / suppression / désactivation / changement de signification, couleur #RRGGBB, refus de CSS libre, permission des séquences, prochain numéro réellement utilisé par la création CRM, audit, contrôle concurrent / recul / départ figé. Migration depuis une ancienne base avec étape personnalisée et compteur à 5 : six étapes actives, historique / numéro / compte conservés, compteur conservé, réapplication sans effet.

Six parcours Chromium réussis : cinq CRM et référentiels partagés. Contrôles de six lignes / absence d’ajout d’étape, engrenages accessibles, couleur libre commune au tag et au bord Kanban, retour à palette, aperçu de séquence, Enregistrer inactif sans modification, départ verrouillé et nouvelle valeur persistante au reload. Régressions glissement / conflit / repli / lecture seule conservées ; capture Séquences inspectée. Archive NAS de 42 fichiers intègre et documentée dans le document 06 ; aucun déploiement distant.

### Recette Utilisateurs / Employés — 7 octobre 2026

`pnpm test:backend` inclut `tests/pocketbase/check_access_hr.py`. Tests sur PocketBase 0.40.4 temporaire : profils, création / modification Admin seulement, rôles dédiés, dernier Admin, audit sans secrets, Viewer refusé dans les routes CRM / Séquences et REST Contacts / référentiels, scopes HR self / reports / team cohérents avec les API Rules, révocation effective avec ancien token, cycles / manager, conflit de version, code équipe immuable, compte unique lié et inactivation. Test d’upgrade depuis les migrations précédentes : refus sans e-mail de bootstrap, désignation explicite d’un seul Admin, conservation des comptes / rôles historiques et idempotence.

Vitest : arbre d’organisation avec ressources sans compte / responsable hors périmètre et ancien cycle ; profils et frontière paramètres ; purge du cache au changement de droits / révision. Playwright `tests/auth/access-hr.spec.ts` : équipe, manager, collaborateur, photo protégée, organigramme / repli, Dark et mobile, compte Viewer limité à sa fiche, consultation seule et paramètres interdits. Les tests historiques de paramètres utilisent maintenant un Superuser explicite ; aucune élévation implicite à partir du titre de poste ou du libellé du rôle.

Recette NAS encore nécessaire : installation du lot de 06 avec e-mail Admin explicite, reconnexion, accès des quatre profils, sauvegarde d’employé, hiérarchie, changement / retrait de droits, photos protégées et comptes désactivés. Aucun résultat de test local ne vaut déclaration de déploiement en préproduction.

Validation locale finale de ce lot : `pnpm check` réussi (lint, TypeScript, 97 tests Vitest, build), 77 tests serveur répartis sur les sept suites backend. Les quatre parcours Chromium touchés par ce lot passent ensemble ; les 41 autres parcours de la suite avaient passé la recette complète avant ces ajustements de fixtures / responsive. Captures annuaire / organigramme / accès desktop, mobile et Dark inspectées. Archive NAS vérifiée à l’identique des 47 fichiers source.

### Vérification Direction — 7 octobre 2026

`pnpm check` : lint, TypeScript strict, 97 tests Vitest et build passent. PocketBase local 0.40.4, bases jetables : 9 tests Accès / HR passent, dont hiérarchie Direction → Manager → Collaborateur, responsabilité exclusive, cycle / rattachement invalide refusé, absence d’élévation de profil ou de droits, collaborateurs directs uniquement, modifications organisation interdites au contributeur simple, migration 1791331204 sur une base Employés existante sans nouveau bootstrap et préservation des liens. Parcours Chromium Accès / Employés passe avec création Direction, rattachement du manager, badges, repli / dépli de ses branches, photo protégée et Viewer restreint. Aucune recette ni modification sur le NAS.

### Recherche top bar Employés / accès — 7 octobre 2026

`pnpm check` passe (lint, TypeScript, 97 tests unitaires, build). Chromium : quatre parcours ciblés passent — Accès / Employés, recherche Contacts persistante, filtres Contacts URL / historique / responsive, CRM création / Kanban / recherche. Le parcours Employés / accès contrôle l’unicité du champ dans la top bar, équipes et profil ERP, persistance au rechargement / changement de présentation / fermeture de fiche, réinitialisation sans effacement du texte, et retrait d’une pastille. Le parcours existant conserve les vérifications Direction / managers, photo protégée et refus du Viewer hors périmètre. Captures desktop / sombre / mobile inspectées. Changement frontend uniquement ; aucune migration supplémentaire.

### Panneau et groupes transverses — 7 octobre 2026

`pnpm check` passe : lint, TypeScript, 99 tests unitaires et build. Les deux nouveaux tests du helper partagé contrôlent tri naturel français ascendant / descendant sans mutation, identités de groupes distinctes même avec libellé identique, totaux et ordre intra-groupe. Cinq parcours Chromium ciblés passent : Accès / HR, filtres Contacts, groupes Contacts, vues enregistrées Contacts et CRM. Accès / HR étendu vérifie les deux colonnes communes, regroupements Responsabilité / Équipe / Profil ERP, ordre réellement affiché, persistance au rechargement et Réinitialiser. Parcours supplémentaire CRM : tri visible sans regroupement, tri seul compté, bouton Réinitialiser actif et retour au défaut. Captures des panneaux HR / Utilisateurs et groupes inspectées ; responsive Contacts conservé. Aucun changement backend.

### Équipes — 7 octobre 2026

`pnpm check` passe : lint, TypeScript strict, 99 tests unitaires et build. PocketBase 0.40.4 local, bases jetables : 11 tests Accès / HR passent, incluant managers multiples, absence de code dans les réponses métier, refus de contributeur non Admin / Superuser, responsable non éligible / duplicata refusés, protection de la responsabilité d’un manager d’équipe active, archivage conservant ses membres, refus de nouvelle affectation, réactivation refusée si manager devenu inéligible, réactivation après correction. Mise à niveau d’une base Équipes existante : noms, identifiants et liens membres préservés, code historique conservé et champ caché, managers initialement vide.

Parcours Chromium Accès / HR : onglet Équipes, création sans Code, deux managers, archivage avec ARCHIVER, filtre Archivées, réactivation via Enregistrer, retour Employés et parcours Direction / photos / scopes Viewer. Captures liste / éditeur inspectées ; les vérifications Contacts d’archivage / engrenage couvrent le composant d’actions partagé. Aucun test ni changement de base sur le NAS.

Popup Équipe / actions d’en-tête — 7 octobre 2026 : lint, TypeScript et build passent. Parcours Chromium Accès / HR passe (11,7 s avec démarrage des fixtures) : aucune mention Active ni engrenage dans Nouvelle équipe, Enregistrer grisé initialement, création via pied de dialogue associé au formulaire, captures desktop / mobile / sombre, édition avec engrenage dans l’en-tête et archivage possible malgré un nom modifié non enregistré, conservation du nom enregistré, réactivation et parcours Direction / permissions existant. Captures de création et d’édition inspectées. Le test de la retouche précédente avait expiré sur une combobox Employés ; ce parcours complet est désormais passé. Aucune modification backend ni déploiement NAS.


Tags profils / responsabilités — 7 octobre 2026 : test PocketBase sur base jetable vérifie les sept tags initialisés, lecture des seules couleurs pour comptes actifs, refus des écritures User / Viewer, autorisation Admin / Superuser, couleurs personnalisées valides et invalides, libellés / codes / état / ordre immuables, création / suppression interdites et audit transactionnel. La liste API anonyme retourne zéro résultat (sémantique PocketBase), les updates interdits par règle retournent 404. Parcours Chromium Access / HR étendu : onglet Tags avec sept lignes, recherche top bar sans filtres de comptes, sauvegarde Direction verte / Admin orange, persistance après reload, reprise dans liste utilisateurs / employés et organigramme. Test complet passé en 12,1 s ; capture `/private/tmp/horizon-identity-tags.png`. Les premières assertions utilisaient des statuts HTTP et sélecteurs trop larges ; corrigées selon le comportement réel, sans modification des règles de sécurité. Vitest : 99 tests passent. Lint, TypeScript et build vérifiés.


Palette 24 couleurs — 7 octobre 2026 : lint et TypeScript passent. Parcours Chromium Access / HR passé en 12,9 s : vérifie 24 radios et une entrée personnalisée, sélection / persistance d’une couleur supplémentaire Framboise, indicateur du rond + après couleur personnalisée #127a8b et persistance au rechargement, couleurs reprises dans listes / organigramme. Capture `/private/tmp/horizon-tag-color-picker.png`. Aucun changement backend ni nouveau lot NAS nécessaire.


Formulaire Séquences — 7 octobre 2026 : lint, TypeScript et build passent. Parcours Chromium ciblé passé en 4,2 s : titres Compteur / Format du numéro, rendu desktop / mobile sans débordement, pied de sauvegarde visible sur mobile, aperçu recalculé, sauvegarde via formulaire associé au pied puis persistance après reload. Captures `/private/tmp/horizon-sequence-editor-desktop.png` et `/private/tmp/horizon-sequence-editor-mobile.png` inspectées. L’ancienne assertion supposait une séquence déjà utilisée créée par un test précédent : elle tient désormais compte de l’état affiché pour permettre l’exécution isolée. Règles backend inchangées.


Retrait des refresh — 7 octobre 2026 : inspection de tous les usages UI de RefreshCw / Actualiser ; retrait des boutons permanents Employés, Utilisateurs, Séquences et fil partagé. Seul RefreshCw de récupération après erreur de navigation Contacts conservé ; boutons Réessayer des erreurs préservés / ajoutés dans les pages concernées. Aucun changement des requêtes, invalidations ou du polling du fil. Lint, TypeScript et build passent.


Alignement Employés / Équipes — 7 octobre 2026 : lint, TypeScript et build passent. Chromium Access / HR passé en 12,9 s : bouton Nouvelle équipe dans `.page-header__actions`, absence de titre Équipes répété sous les onglets, création / modification des managers / archivage / réactivation et filtres toujours fonctionnels. Barre de résultats commune avec hauteur minimale 40 px ; capture `/private/tmp/horizon-teams.png`. Déplacement du pilotage de l’éditeur vers la page, permissions conservées et backend inchangé.


Tableaux partagés Contacts / Employés / Équipes — 7 octobre 2026 : migration des deux tableaux HR vers `HDataTable`, ajout de `getRowAction` pour ouvrir un popup avec un bouton natif couvrant la ligne (navigation Contacts conserve le lien natif). Styles alternés / en-tête / cellules / focus centralisés. Lint, TypeScript et build passent. Parcours Contacts cartes / liste passé ; parcours Access / HR passé en 12,5 s après adaptation du sélecteur de ligne, dont le nom accessible contient désormais le bouton d’ouverture. Vérifie clic sur une ligne d’équipe sans engrenage, modification / archivage / réactivation, fonds alternés, filtre / tri / regroupement, ouverture clavier d’une équipe en lecture seule sans actions d’écriture, consultation employé Viewer. Capture `/private/tmp/horizon-teams.png` inspectée.


Vérification champs obligatoires — 7 octobre 2026 : lint et build (TypeScript inclus) validés ; quatre parcours Playwright réels passants : Employés / accès / équipes, création société / adresse / personne, création CRM / Kanban / commentaire et séquences. Le parcours Employés vérifie le repère unique, la couleur exacte des actions primaires et le contrôle obligatoire sur Nom de l’équipe. Les sélecteurs de formulaire utilisent le libellé sans astérisque décoratif.


## AO / calendrier partagé — vérifications du 7 octobre 2026

`pnpm check` passe : lint strict, TypeScript, **24 fichiers / 105 tests unitaires**, build Vite. Couverture ajoutée : conversions UTC / fuseaux (dont heure inexistante à l’heure d’été), bornes semaine / mois / trimestre / année et service AO lecture seule / validations. Build sans nouvelle dépendance.

`POCKETBASE_BINARY=/private/tmp/horizon-crm-tools/pocketbase pnpm test:backend` passe : **88 tests** sur huit suites, dont **6 AO** (`tests/pocketbase/check_tenders.py`). Base temporaire neuve reconstruite depuis toutes les migrations PocketBase 0.40.4. Création / analytique transactionnelle, reprise idempotente, type immuable, conflit d’édition, préparation indépendante, multiples dates et calendrier filtré par permissions / archives / annulation / tags, borne initiale minuit incluse sans autre échéance, dépôts concurrents versions uniques, documents étrangers refusés, CRUD direct fermé, pièce déposée conservée, paramètres réservés au profil autorisé et acteur audité. Après ajout de la recherche par référence, les six tests AO repassent.

Playwright `tests/auth/tenders.spec.ts` : deux parcours passants, création du dossier, visites multiples / soutenance, fichier protégé / dépôt versionné, même calendrier dans les deux vues, lecteur sans mutation, paramètres / tags / couleurs, filtre et regroupement société, Kanban et propagation Realtime vers un second onglet lecteur sans refresh. Recherche par référence AO vérifiée. Le parcours Contacts « filtres dans la recherche » repasse en 3,0 s (URL, archives, historique et responsive). Les six parcours CRM existants passent également ; le parcours de création / glissement a rencontré un dépassement de délai navigateur puis repasse isolément en 13,2 s ; le test Séquences a rencontré une fermeture de dialogue lors du redimensionnement puis repasse en 1,6 s dans la suite suivante. Aucun échec fonctionnel persistant.

Captures `/private/tmp/horizon-ao-record.png`, `/private/tmp/horizon-ao-calendar.png`, `/private/tmp/horizon-ao-kanban.png` inspectées. Lot consolidé contrôlé byte pour byte contre les hooks / migrations. Aucun déploiement distant, aucune migration manuelle de production. Recette NAS et restauration de sauvegarde restent à effectuer selon la procédure de release.

## Fiches depuis les comboboxes — vérifications du 8 octobre 2026

`pnpm check` passe : lint, TypeScript strict, 24 fichiers / 105 tests unitaires et build. Aucun changement de schéma, de règle serveur ni de dépendance pour ce mécanisme frontend.

Trois nouveaux parcours Chromium dans `tests/auth/record-workspace.spec.ts` vérifient la création préremplie et la sélection automatique, la modification d'une fiche existante, la conservation du titre / montant du brouillon CRM, la confirmation d'abandon, les formulaires imbriqués et le retour du focus. Ils couvrent aussi le changement de société d'un contact avec reprise cohérente dans le CRM, la création sur mobile, le mode sombre et la consultation seule sans bouton Enregistrer ni champ modifiable.

Deux exécutions ciblées passent : sept parcours Contacts / popups, puis neuf parcours CRM / popups comprenant les six tests CRM existants et les trois nouveaux parcours avec leur dernière extension. Les tests Contacts adaptés conservent les vérifications d'enregistrement, d'archivage, de chargement différé et de navigation contextuelle sur la fiche pleine page.

Captures `/private/tmp/horizon-record-popup-mobile.png`, `/private/tmp/horizon-record-popup-dark.png` et `/private/tmp/horizon-record-popup-readonly.png` inspectées. `git diff --check` passe. Aucun déploiement distant effectué.

Ajustement largeur / fermeture : lint et TypeScript passent ; les trois parcours popups passent en 15,7 s après retrait du bouton Fermer du formulaire. Assertion d'une seule action de fermeture et largeur de 1 248 px dans un viewport de 1 280 px ; confirmation d'abandon par la croix, créations imbriquées, mobile et consultation seule toujours vérifiés. Capture sombre élargie inspectée. Largeur maximale 1 440 px, sans changement du formulaire partagé.

Alignement HCombobox — 8 octobre 2026 : lint et TypeScript passent ; les trois parcours popups passent en 15,4 s. Assertions géométriques vérifient les centres verticaux communs du chevron / Effacer / ouverture de fiche, l’ordre des icônes sans chevauchement et la continuité entre le champ et son action de consultation. Capture `/private/tmp/horizon-record-picker-alignment.png` inspectée ; parcours mobile, sombre et lecture seule conservés. Aucun changement backend.

Action Créer du sélecteur — 8 octobre 2026 : lint et TypeScript passent, trois parcours popups passants en 15,9 s, dont préremplissage et sélection après création, mobile, sombre et lecture seule. Capture `/private/tmp/horizon-record-picker-create.png` inspectée : pied de création compact et recherche préparée visible. Aucun changement métier ni backend.

Badge d’étape CRM — 8 octobre 2026 : mappings des six étapes et dérivation serveur vérifiés (Nouveau / Qualifié → open ; autres étapes → état correspondant). Correction uniquement de l’en-tête, affichant désormais l’étape enregistrée et sa couleur. Lint / TypeScript passent ; six parcours CRM passants en 25,5 s. Assertions ajoutées : Nouveau sans Ouverte après création et Gagné vert après déplacement / réouverture de fiche. Capture mobile inspectée. Aucune migration ni changement de transition serveur.

Harmonisation de la fiche Opportunité — 8 octobre 2026 : lint et TypeScript passent. Huit parcours CRM / AO passent en 36,3 s, puis le parcours Contacts société / personne / adresses / archivage passe en 10,7 s. Assertions ajoutées pour libellé Types de marché à 11 px, alignement vertical de son contrôle avec Titre et trois titres de section à 13 px. Captures fiche CRM desktop / mobile et dossier AO inspectées. Sous-titre Description partagé, groupes de champs au style Contacts et espacement des panneaux AO vérifiés. Aucun changement de données ni backend.

Fond neutre du fil — 8 octobre 2026 : token commun révisé en gris #eeeeef (clair) / #151619 (sombre), sans modifier les bulles ni les bordures. Parcours Chromium CRM création / commentaire / Kanban / responsive passant en 15,2 s ; capture desktop du fil inspectée. `git diff --check` passe. Retouche CSS uniquement.

Séparateur du fil — 8 octobre 2026 : remplacement du gradient et du repère central par une ligne gris bleuté continue de 1 px, combinée au fond Horizon #e5ebf3. Parcours CRM commentaire / Kanban / responsive passant en 15,2 s ; capture desktop inspectée. Contrat UX actualisé et diff sans erreur d’espacement.

Double contour du sélecteur — 8 octobre 2026 : focus commun limité à `:focus-visible`, outline propre aux actions retiré. Lint et TypeScript passent ; trois parcours popups passent en 16,0 s. Régression ajoutée : fermeture en lecture seule restitue le focus, Tab / Shift+Tab conserve un indicateur sur le groupe sans outline sur l’icône. Capture `/private/tmp/horizon-record-picker-focus.png` inspectée.

Audit des contours de focus — 8 octobre 2026 : recherche dans tous les styles et contrôles du frontend. Correction des cadres parents de la top bar, du rédacteur du fil et de l’éditeur riche, ainsi que du double outline du lien CRM et du label Joindre. Lint / TypeScript passent ; quatre parcours Contacts fil complet / sombre / filtres et CRM passent en 25,7 s. Assertions vérifient le retour du focus au bouton Filtres sans halo de top bar, absence de focus éditorial depuis le bouton Gras, et outline uniquement sur la surface de carte au clavier. Capture top bar desktop inspectée. Les couleurs de sélection et les repères de déplacement restent conservés.

## Conversion Directe / AO — 8 octobre 2026

`pnpm check` passe : lint, TypeScript, 105 tests unitaires et build. Suite backend complète : 91 tests sur huit suites passent sur PocketBase 0.40.4 et bases jetables, dont neuf AO. Régressions ajoutées : conversion directe → AO atomique avec numéro / analytique conservés, archivage et réactivation du même dossier, visites et dépôts conservés, suppression de pièces déposées toujours refusée, disparition / retour au calendrier et aux totaux AO, refus lecteur et conflit de version sans conversion partielle. Migration sur une base AO précédente testée : identifiants, référence, échéance et liens conservés, archived_at vide par défaut ; deuxième application sans changement.

Chromium : les huit parcours CRM / AO existants passent ensemble ; le nouveau parcours conversion passe ensuite en 7,1 s. Il vérifie création directe, conversion AO, visite, archivage du dossier avec opportunité toujours active, absence de l’onglet et des événements, retour AO avec référence / visite et numéro inchangés. Le premier essai supposait le maintien de l’onglet après sauvegarde ; adapté au retour habituel sur Informations sans changement de comportement produit. Une construction initiale de champ Date sous forme d’objet brut a été refusée par PocketBase ; corrigée via DateField natif, global déclaré dans ESLint, puis suites neuve / upgrade / backend / navigateur passantes.

Archive consolidée de 57 fichiers vérifiée à l’identique des sources. `git diff --check` passe. Aucune base de production modifiée, aucun déploiement distant effectué. Installation coordonnée frontend / backend et recette NAS décrites dans 06.

## Fond de connexion Horizon — 8 octobre 2026

Lint, TypeScript et build passent. Six parcours Chromium de connexion passent en 8,8 s : authentification réelle, retour à la page demandée, erreurs, restauration, isolation des onglets et déconnexion. Parcours responsive étendu puis repassé en 4,3 s avec captures desktop 1 280 × 720, tablette 820 × 900, mobile 390 × 844 et thème sombre inspectées. Absence de débordement horizontal vérifiée sur tablette et mobile. Fond SVG décoratif local, sans animation ni dépendance ajoutée ; composants et mécanisme de connexion conservés.

Chargement discret des fiches — 8 octobre 2026 : lint, TypeScript et build passent. Trois parcours popups passent en 16,2 s. Une requête adresses volontairement suspendue vérifie le statut accessible sans texte visible, le délai de 200 ms de l’anneau puis sa disparition au chargement des données. Création, édition, imbrication, confirmation, lecture seule et retour du focus conservés. Capture du popup ralenti inspectée. Aucun changement backend.

Centrage des dialogues dans le workspace — 8 octobre 2026 : lint, TypeScript et build passent. Parcours Employés / accès passant ; les trois parcours popups passent sur une base locale neuve. Assertions géométriques : popup entièrement à droite de la sidebar et centre identique à celui du workspace, en déployé, replié et mobile ; largeur 1 032 px à 1 280 px avec sidebar 216 px. Captures des trois états inspectées. Le premier lancement combiné a rencontré un timeout sur un bouton Créer détaché avant ouverture du popup ; suite popup relancée et passante. Token CSS commun à la grille et aux dialogues, aucune mesure JS ni changement métier.

Marges, discussion et contours des popups — 8 octobre 2026 : lint, TypeScript et build passent ; trois parcours popups passent en 16,5 s. Largeur 1 000 px à 1 280 px avec sidebar déployée, centrage conservé en replié / mobile. Assertions ajoutées : fond gris du fil jusqu’aux deux bords du conteneur défilant et contour clavier du sélecteur bleu, sans outline propre à l’action d’ouverture. Captures discussion, mobile et focus inspectées. Ajustements CSS partagés uniquement, permissions et sauvegardes inchangées.

Liste CRM sans doublon d’état — 8 octobre 2026 : colonne État retirée des listes communes CRM / AO, Étape et ses tags conservés. Lint, TypeScript et build passent. Parcours CRM création / Kanban / liste passant en 15,7 s, parcours dossier AO / calendrier / liste passant en 10,2 s. Régressions : en-tête Étape présent, aucun en-tête État dans les deux listes ; tags d’étape et couleurs vérifiés par le parcours CRM. État serveur et filtres métier conservés, aucune migration.

Sous-pages CRM et vue personnelle — 8 octobre 2026 : pnpm check passe, dont 105 tests unitaires. Trois parcours Chromium navigation / permissions / paramètres passent en 12,2 s ; navigation repassée en 6,6 s après attente des en-têtes et de la fin du chargement pour les captures. Déplier / replier au clavier, liens Pipeline / AO sans vue imposée, sélection neutre de la sous-page, sidebar compacte et mobile vérifiés. Préférence Liste conservée après reload et entre les deux volets ; utilisateur lecteur distinct sans préférence retrouve Kanban global ; URL explicite prioritaire. Captures sidebar déployée / repliée inspectées. Préférence locale à ce navigateur, aucun schéma ou droit modifié.


AO autonomes et décision de réponse — 8 octobre 2026 : `pnpm check` passe (lint, TypeScript, 107 tests unitaires dans 25 fichiers et build). Les huit suites PocketBase du socle ont passé 95 tests avant le dernier ajout ; CRM / AO ont été revérifiés après les ajustements d’archivage. La suite AO finale passe 14 tests, dont le nouveau contrôle de tri dates / références / titres et de reprise avec description riche à clés JSON réordonnées.

Couverture serveur : plusieurs dossiers autonomes sans opportunité ni compte ; analyse → No go sans consommation de numéro ; promotion concurrente ne créant qu’une affaire / analytique ; rollback intégral si collision ; versions et permissions ; historique préservé après retour No go ; visites, notes, pièces et calendrier avant promotion ; données communes après liaison ; filtres / résumé ; dépôts immuables ; conversion et migration neuve / mise à niveau.

Chromium : les 11 parcours CRM / AO passent, et les trois parcours popups ont passé lors de la vérification précédente. Régressions AO : création en analyse absente du Pipeline, No go sans affaire, décision en préparation liée, recharge et lecture seule, calendrier général et Planning partagé semaine / mois / trimestre / année, modifications Realtime. Captures Planning desktop / mobile inspectées, défilement contenu dans la timeline et légende adaptée. Le test CRM sombre utilise désormais une URL Kanban explicite, la préférence Liste étant correctement conservée. Bases locales temporaires exclusivement, aucun test ni migration sur le NAS.

Conservation des onglets — 8 octobre 2026 : lint / TypeScript passent. Deux parcours Chromium passent : Notes Contacts et Description CRM restent sélectionnés après création puis nouvelle sauvegarde ; Dossier AO reste sélectionné après création. Les valeurs sauvegardées sont relues, pas seulement l’état visuel des tabs. Régression Contacts existante renforcée pour vérifier Notes sans second clic sur l’onglet. Aucune migration backend.

Repères de remise AO — 8 octobre 2026 : lint / TypeScript et test unitaire de classification des dates (vide, passée, borne de 72 heures, future) passent. Parcours Chromium AO autonome passant après ajout d’assertions sur les badges carte / fiche, dates sans heure et absence de débordement sur mobile. Captures carte, formulaire clair / sombre et mobile inspectées. Composant partagé `HDeadline`, données métier et permissions inchangées, aucune migration NAS.

Remise en pied de carte — 8 octobre 2026 : badge déplacé en bas à droite, pourcentages retirés du composant partagé des cartes CRM / AO. Parcours Chromium passant : badge dans le footer, date seule, rouge et aucun %. Capture inspectée. Seuils finaux validés par test unitaire aux bornes : vert au-delà de 7 jours, orange jusqu’à 7 jours, rouge à 48 heures et après dépassement. Lint et TypeScript passent après ajustement des seuils.

Format monétaire — 8 octobre 2026 : format commun avec symbole et deux décimales (`shared/formatters/money`), champs CRM / AO via `HAmountInput`. Test unitaire EUR / USD / GBP / JPY, zéro, montant négatif et arrondi d’affichage passant ; lint et TypeScript passent. Trois parcours Chromium passent : création / modification CRM, saisie / brouillon conservé lors des popups et conservation d’onglet. Assertions sur résumé `12 000,00`, valeur de champ `12000.00`, symbole € et brouillon `12345.00`. Capture fiche inspectée. Aucun calcul métier, valeur stockée ou schéma modifié.

Couleurs rendez-vous AO — 8 octobre 2026 : test PocketBase ciblé `TenderTests.test_appointment_kind_colors_are_fixed_and_admin_only` validé (migration neuve, lecture CRM, modification Admin, refus de mutation structurelle / création / suppression / accès hors CRM). Parcours Chromium du dossier AO validé : modifier Visite dans Paramètres CRM puis vérifier le tag dans le tableau des rendez-vous. Lint et TypeScript validés.

Régression synthèse CRM — 8 octobre 2026 : test PocketBase avec total EUR 20 000,25, USD distinct, étapes distinctes et requête exacte à paramètres vides du NAS. Échec 400 reproduit avant correction de DynamicModel, puis test réussi après typage décimal. Aucun arrondi supplémentaire ni changement des données.


## Devis S01 — premier lot du 8 octobre 2026

`pnpm check` passe : lint strict, TypeScript, 28 fichiers / 112 tests unitaires et build Vite. Après ajustement de la pagination aux chevrons communs Contacts, lint / TypeScript repassent. Deux tests unitaires exécutent le module serveur Pricing : quantités fractionnaires, arrondis au centime, brouillon vide et refus des montants invalides.

`tests/pocketbase/check_sales.py` : quatre tests passent sur PocketBase 0.40.4, base temporaire reconstruite depuis les migrations. Numéros dérivés de chaque opportunité, quatre créations concurrentes sans collision, même clé de reprise sans duplication, lignes / héritage analytique / devise, annulation sans réutilisation du numéro, commande confirmée sans double comptage, droits CRM / Sales séparés, refus Viewer, REST en écriture fermé et conflit de version. Les commandes du test sont des fixtures serveur ; aucune conversion en commande n’est livrée dans ce lot.

Chromium : deux parcours Devis passent en 8,4 s : création préremplie depuis CRM, choix obligatoire depuis la liste générale, numéros successifs, lignes HT, compteur incluant les annulés, revenu corrigé après annulation, menu d’actions partagé, recherche top bar, mobile sans débordement et mode sombre. Le parcours CRM création / commentaire / Kanban repasse en 13,4 s. Les assertions de numéro utilisent le code de l’opportunité créée pour rester indépendantes des autres parcours. Captures `/private/tmp/horizon-sales-quote.png`, `/private/tmp/horizon-opportunity-sales-links.png`, `/private/tmp/horizon-sales-quote-mobile.png` et `/private/tmp/horizon-sales-list-dark.png` inspectées ; pagination sans chevauchement contrôlée géométriquement.

Archive PocketBase consolidée `/private/tmp/horizon-devis.zip` : 64 fichiers, contenus vérifiés à l’identique des hooks / migrations du dépôt. Aucune base NAS modifiée. Recette NAS après sauvegarde / installation coordonnée du frontend et du backend encore nécessaire. Le lot couvre les brouillons HT et leur annulation ; validation métier, TVA effective, PDF, envoi et conversion en commande restent les lots suivants.


## Devis S02 — grille structurée, 8 octobre 2026

`pnpm check` passe : lint strict, TypeScript, 28 fichiers / 114 tests unitaires et build Vite. Pricing serveur exécuté dans Vitest : remise, quantités fractionnaires, section / sous-section, séparation des options, cohérence de l’aperçu et validité de 30 jours aux frontières de mois / année / année bissextile.

PocketBase : sept tests Devis passent, dont migration depuis le schéma précédent avec devis / ligne existants et application répétée sans changement, conservation des identifiants / numéro / montant, options exclues du revenu, coût / marge et sous-totaux, activité créée et publications, lecteur CRM sans accès Sales exclu du fil, réglages administrateur avec version / bornes / allowlist et REST fermé. Onze tests du fil partagé passent également. L’audit de sauvegarde contient les lignes avant / après, en plus du journal utilisateur.

Chromium : 14 parcours CRM / popups / Devis passent ensemble en 56,7 s. Nouveau parcours : validité par défaut, modification de l’opportunité dans la véritable fiche embarquée, brouillon conservé, sections / sous-sections, marques / références / coûts / remises, duplication, déplacement, options, annulation de suppression puis confirmation et absence d’enregistrement implicite, rechargement, commentaire, paramètres de largeur puis retour au devis, description enveloppée, mobile et mode sombre. Régression du formulaire de confirmation : arrêt de propagation du submit pour ne pas enregistrer son formulaire parent. Ajout de ligne : lecture des valeurs actuelles lors de la mise à jour du field array, pour éviter un aperçu temporairement plus court que la liste. ResizeObserver reporte les mutations au prochain frame.

Captures `/private/tmp/horizon-quote-structured.png`, `/private/tmp/horizon-quote-structured-mobile.png` et `/private/tmp/horizon-quote-structured-dark.png` inspectées. Défilement horizontal limité à la grille. Archive `/private/tmp/horizon-devis-structure.zip`, 66 hooks / migrations, contenus vérifiés à l’identique du dépôt ; `git diff --check` passe. Aucun déploiement NAS effectué. Colonne Commande réservée ; modèles, catalogue / taxes, validation / PDF / commandes non livrés dans ce lot.

Devis S03 — 8 octobre 2026 : `pnpm check` passe (lint, TypeScript strict, 114 tests unitaires, build), 7 tests PocketBase passent sur les calculs / droits / migrations / configuration. 3 parcours Playwright Devis passent : déplacement réel à la souris, annulation clavier par Escape, ordre conservé après sauvegarde / rechargement, option dédiée, actions directes et confirmation, ajouts sous le tableau, grille pleine largeur à 1920 px, centrage vertical et absence de débordement de page sur mobile. Captures clair / sombre / mobile inspectées. Le test de géométrie attend le réajustement des descriptions lors d’un changement de viewport ; pas de temporisation fixe. Archive NAS contrôlée octet par octet : 67 hooks / migrations.

Devis S04 — 8 octobre 2026 : `pnpm check` passe (lint / typecheck / 116 tests unitaires / build). 8 tests PocketBase passent : calculs de marge et TVA au centime, options hors TVA principale, variation du coût, taux nul / invalide, droits / numérotation / sauvegarde et migrations historiques. 3 parcours Playwright passent, dont redimensionnement réel de Marque avec persistance après reload, marge 25 % sur coût 100 puis 120, PUV 125 puis 150, HT / TVA / TTC contrôlés, sauvegarde / recharge, drag and drop, suppression confirmée, popup CRM et fil. Captures à 1920 px, sombre et mobile inspectées ; scroll horizontal contenu à la grille. Lot NAS 69 fichiers vérifiés octet par octet.

Devis S05 : pnpm check passe (lint / TypeScript / 119 tests unitaires / build), 10 tests PocketBase passent dont titre 3 et deux sauvegardes avec audit complet de 200 longues lignes ; 3 parcours Playwright passent dont repli sans changement de totaux, suppression sans saisie, redimensionnement conservant la largeur, titre 3 sauvegardé, en-têtes sticky sur devis de 24 lignes, paramètres enregistrés avec réponse 200, mode sombre / mobile. Régression détectée et corrigée : limite JSON audit de 10 Ko insuffisante, montée à 2 Mio. Captures inspectées ; archive contrôlée octet par octet.

Devis S06 — pnpm check passe (lint / TypeScript strict / 119 tests unitaires / build). Les 3 parcours Playwright Devis passent en 17,5 s : ordre Coût / Marge / PUV, alignement monétaire à droite avec en-têtes centrés, Sigma adjacent au sous-total, titres sur le même axe, montants de résumé de même taille, fond blanc du niveau 3 et notes fermées initialement avec saisie conservée après repli / sauvegarde / rechargement. Captures desktop clair, sombre et mobile inspectées ; git diff --check passe. Modification frontend uniquement, sans migration ni nouveau lot NAS.

Devis S07 — pnpm check passe : lint, TypeScript strict, 121 tests unitaires et build. 11 tests PocketBase passent, dont remise globale après remise de ligne / options exclues, bases nettes et TVA, marge et coût, revenu CRM, valeurs invalides / champs calculés injectés refusés et remise 100 %. Migration historique contrôlée séparément : nouveaux champs initialisés sans modifier les anciens montants. Trois parcours Playwright passent en 18,2 s ; remise 10 % conservée après sauvegarde / reload, HT 270 / TVA 54 / TTC 324 / achats 240 / marge 30 et 12,50 %, options 230 inchangées. Capture de remise, clair / sombre / mobile produites ; rendu du résumé inspecté.

Devis S08 — pnpm check passe : lint / TypeScript / 122 tests unitaires / build. Trois parcours Playwright passent en 18,9 s : remise absente puis ajoutée, conservation après recharge, repli global sans changement de total, duplication titre seul / contenu et annulation du dialogue, restauration du formulaire et des cellules monétaires sans sauvegarde, poids normal des montants de marge et centrage Notes. Test unitaire des limites de section sur trois niveaux. Capture desktop inspectée, captures sombre / mobile produites. Attente du numéro CRM corrigée dans le test avant lecture (course de rendu). Aucun changement serveur ni migration ; lot NAS S07 inchangé.

Devis S09 — pnpm check passe : lint, TypeScript strict, 123 tests unitaires, build. Suite PocketBase : 12 tests passent, plus le nouveau test de deux sauvegardes de six textes CGV longs avec audit complet ; scénarios de remise montant / limites, unités actives et conservation historique, droits administrateur, snapshot de CGV inchangé après modification / archivage, migration historique sans changement des totaux. Trois parcours Playwright passent en 20,5 s : paramétrage CGV puis sélection / rechargement, unité en combobox, conversion % ↔ devise, focus de duplication conservé, popup et Sigma adjacent au PTV. Captures desktop, popup, sombre et mobile inspectées. Archive NAS contrôlée octet par octet.

Correction Sigma S09 : déplacé de Remise dans PTV à gauche du sous-total, alignement vertical commun. Lint / TypeScript et 3 parcours Playwright passent (20,6 s), assertion de cellule PTV et capture desktop vérifiées. Frontend uniquement, archive NAS inchangée.

Séparateurs des titres Devis : lint / TypeScript et 3 parcours Playwright passent (20,3 s), 14 cellules et bordure verticale contrôlées sur chacun des trois niveaux ; capture desktop inspectée. Modification frontend uniquement.

Popup CGV des paramètres — lint / TypeScript et 3 parcours Playwright passent (20,9 s). Alignement et largeur des deux champs, séparation du pied, fenêtre contenue à 390 px, application / sauvegarde puis réouverture du texte contrôlés. Captures desktop clair, sombre et mobile inspectées. Libellé accessible du contenu indépendant du compteur. Frontend uniquement, sans migration.

Paramètres Devis — tableaux CGV / Colonnes harmonisés via le même conteneur et les styles partagés. Lint / TypeScript et 3 parcours Playwright passent (20,8 s) : Enregistrer dans les actions supérieures sur les trois onglets, placement au-dessus et à droite des tableaux, mêmes bordures et en-têtes calculés, application / sauvegarde CGV et conservation de l’onglet. Captures clair / sombre / mobile inspectées, aucun débordement à 390 px. Règle ajoutée dans AGENTS.md et dans le contrat UX consolidé.

Valeurs par défaut Devis — règle de titres Paramètres restreinte aux rubriques anciennes pour laisser HSectionHeading à 13 px / 18 px / 600. Champs dans la grille partagée Contacts. Lint / TypeScript et 3 parcours Playwright passent (21,5 s) : typographie calculée sur les trois onglets, champs alignés en deux colonnes puis empilés à 390 px, valeurs 30 jours / TVA 20 % inchangées, sauvegarde supérieure. Captures clair, sombre et mobile inspectées ; git diff --check passe.

Devis S10 — pnpm check passe (lint, TypeScript, 125 tests unitaires, build) ; 14 tests PocketBase passent, dont option de section imposée aux trois niveaux / sauvegarde / relecture / TVA et revenu CRM, limites de remise de ligne indépendantes du mode global. Trois parcours Playwright passent (22,6 s) : montants en texte avec devise, sélection d’unité, option du titre et descendants après rechargement, retrait de l’option, remise simultanée € / % et retrait, alignement des deux contrôles. Captures clair / sombre / mobile produites ; rendu de grille et remise inspecté. Lot NAS de 72 fichiers vérifié octet par octet.

Titres optionnels Devis : montant seul entre parenthèses, aucune seconde ligne Options ni zéro ajouté ; hauteur du titre contrôlée à 34 px maximum. Niveau 3 gris comme son bouton. Parcours Playwright sections / sauvegarde / recharge passe (16,7 s) ; lint / TypeScript passent.

CRM — Dernier état : parcours Playwright « vue de départ partagée » vérifie sauvegarde et rechargement du troisième choix, reprise Kanban / Liste, priorité de la vue URL et application du choix fixe malgré un historique local différent. `check_crm.py` couvre l’acceptation du Select `last` et le refus sans permission après application des migrations.

Vérification avant publication du 8 octobre 2026 : `pnpm check` valide lint, TypeScript, 125 tests unitaires et build. Les neuf suites PocketBase (111 tests au total) passent ; le test des accréditations a été actualisé pour accepter Ventes livré et garder le refus des modules non disponibles et des écritures Viewer. Le cadrage du studio PDF reste documentaire, sans studio implémenté.

Parcours navigateur avant commit : 58 parcours contrôlés. Exécution globale : 55 réussites, puis trois parcours relancés avec succès (préférence sidebar configurée en Dernier état, conversion Directe / AO, décision AO avec remise future). Deux tests adaptés aux décisions récentes ; un échec ponctuel de connexion n’a pas reproduit lors de la relance ciblée.


Documents D01 — vérification locale du 8 octobre 2026 : `pnpm check` passe (lint, TypeScript, 129 tests unitaires, build). Six tests PocketBase Documents passent sur base jetable avec reconstruction depuis les migrations : permissions et profils, refus du CRUD direct, version publiée immuable, conflit optimiste, conservation du publié malgré édition du brouillon, allowlists et échappement, projection d’un vrai devis et transport multipart / réponse PDF binaire. Les quatorze tests Ventes ont également passé lors de l’exécution initiale du lot. Convertisseur simulé : ces tests n’attestent pas du rendu Chromium Gotenberg réel.

Six parcours Playwright Documents / Ventes passent : studio, déplacement au pixel à zoom 75 %, glisser depuis la bibliothèque, publication / rechargement, aperçu d’un vrai devis, téléchargement binaire, accès refusé métier et régressions principales Devis. Recette visuelle capturée dans `/private/tmp/horizon-document-studio.png` et `/private/tmp/horizon-document-preview.png`. Le PDF multipage, les marges et les en-têtes / pieds répétés doivent encore être validés sur le NAS Gotenberg 8.37.0 avant émission officielle.

Lot NAS D01 : `/private/tmp/horizon-documents-studio-D01.zip`, 86 entrées, vérifiées octet par octet avec les sources ; SHA-256 `3f8d5745d87d7040e8723a5ddaea881524407cbf4fc85ab28a375cc50a64c2cb`. Contient hooks, migrations, polices / licences, complément Compose et documentation d’installation. Aucun `pb_data`, secret ou déploiement distant. La correction du pas numérique des largeurs et la conservation du panneau après sauvegarde sont couvertes par le parcours Studio ; la fiche devis source est consultable / modifiable sans quitter l’aperçu.

Studio D02 : lint / TypeScript / build et 131 tests unitaires validés ; huit tests PocketBase (projection client, adresses ambiguës, ligne composée, source de tableau autorisée, publication immuable, permissions, transport PDF), sept parcours Chromium Documents / Ventes, puis quatre parcours Documents après compactage des contrôles. Inspection visuelle à 1600 × 900. Le convertisseur du test HTTP reste un double local : cela ne prouve pas la pagination Gotenberg sur le NAS.

Studio D03 : 133 tests unitaires, lint / TypeScript / build, dix tests PocketBase et huit parcours Chromium Documents / Ventes validés. Anti-régression : parser réellement les attributs HTML (font-family et coordonnées d’en-tête), vérifier dans Chromium position / taille / couleur des blocs et des titres, Tiptap gras visible sans commandes redondantes, duplication sous la source, réordonnancement depuis la poignée, ancrage droit / haut et échelle adaptée. Inspection du studio compact à 1600 × 900. Transport PDF testé avec convertisseur local factice ; la recette Gotenberg réelle sur NAS reste distincte.

Studio D04 : lint / TypeScript / build et 135 tests unitaires passent ; onze tests PocketBase (dont champs génériques et validation / conservation du ratio d’image), six parcours Chromium Documents et trois parcours Ventes validés. Vérification supplémentaire de la conversion / sauvegarde des anciens blocs Totaux / CGV. Anti-régressions : gras hérité retiré puis sauvegardé, H1 / H2 / H3, import 300 × 150 px puis taille proportionnelle au clavier et par poignée, métadonnées invalides refusées, totaux liés dans le vrai aperçu. Inspection visuelle Studio / aperçu. Aucun test de pagination sur le Gotenberg réel du NAS dans ce lot.

Lot NAS D04 vérifié octet par octet : 93 entrées, 725109 octets ; SHA-256 `9ec8781b37c1b342c14b57b38f3eef9be915ea49f2e42b978d62d27a777e1b35`. Hooks / assets / migrations consolidés, complément Gotenberg et manifeste ; aucune donnée de production ni secret.

Studio D05 : lint / TypeScript / build, 136 tests unitaires et douze tests PocketBase validés. Sept parcours Chromium Documents et trois Ventes passent ; vérification supplémentaire du thème sombre et d’un écran de 900 px sans débordement de page. Fonds couleur / image, modes contain / cover, opacité indépendante du contenu, métadonnées invalides / URLs refusées, déplacement des séparateurs et conservation des largeurs, éditeur court puis multiligne, styles et fond dans l’aperçu HTML réel. Captures Studio clair / sombre / responsive inspectées. Convertisseur factice en test HTTP ; couverture et répétition des fonds sur le PDF Gotenberg NAS restent à recetter.

Lot NAS D05 vérifié octet par octet : 93 entrées, 725794 octets ; SHA-256 `eb713f2005d477e30adda64b2c272dbd681c9c2ca5a7aa517575be58ee770eda`. Hooks / assets / migrations consolidés, complément Gotenberg et manifeste ; aucune donnée de production ni secret.

Studio D06 : lint / TypeScript / build et 136 tests unitaires passent ; huit parcours Chromium Documents validés, puis parcours supplémentaire vérifiant repli / dépli, conservation locale après rechargement et bascule d’onglet, conservation du Tiptap non sauvegardé, saisie hexadécimale et invalidité transitoire, réglage d’opacité au clavier. Captures clair / sombre inspectées. Modification frontend seule ; aucune nouvelle recette serveur ni archive NAS nécessaires, lot D05 conservé.

Studio D07 : `pnpm check` valide lint, TypeScript, 137 tests unitaires et build. 13 contrôles PocketBase Documents valident notamment les styles de titres propres aux tableaux, leur rendu HTML et le refus de styles sur un autre bloc / nombre de niveaux invalide. 9 parcours Chromium Documents passent : repli initial et persistance, titres contextuels, publication / archive, ancien contenu, permissions, aperçu HTML et transport PDF simulé. Inspection visuelle à 1600 px et 1000 px. Lot NAS `/private/tmp/horizon-documents-studio-D07.zip`, 93 entrées, 725975 octets, SHA256 `61a9b4b1fa106acc9435f7a022471d90b485fc21f86ed9ec6ef206145f8a3183`. Pas de migration supplémentaire après D01 ; synchroniser hooks et frontend. Pagination PDF réelle sur Gotenberg NAS reste à vérifier.

Studio D08 : lint / TypeScript / build et 137 tests unitaires passent. Parcours Chromium Documents : 9/10 sur la passe finale, le seul échec concerne la connexion locale (status 0), avant ouverture du studio ; relance isolée réussie. Le nouveau parcours contrôle les axes case / nom / largeur / ordre, hauteur <39 px, renommage, répartition à 100 %, changement d’ordre, ajout de colonne et sauvegarde. Inspection visuelle clair / sombre, largeur du workspace après réduction à 1200 px. Correction du placeholder de tableau (`display:table-cell`) pour respecter le colspan après déplacement des colonnes. Frontend uniquement, lot NAS D07 inchangé.

Studio D09 : lint, TypeScript, build et 138 tests unitaires passent ; 14 tests PocketBase Documents valident le style facultatif de l’en-tête, son rendu HTML et les refus de couleur / opacité invalides ou de propriété sur un autre bloc. 11 parcours Chromium passent, dont édition de couleur du texte / fond, taille, alignement, indépendance des sections et persistance après recharge ; inspection visuelle du canevas. Lot NAS `/private/tmp/horizon-documents-studio-D09.zip`, 93 entrées, 726087 octets, SHA256 `e0a735122c22878737ecdedcc796770b78d3bb56fee26c921fd71f5d00ac69ff`. HTML et PDF partagent le même renderer, pagination réelle Gotenberg NAS restant à vérifier.

Studio D10 : lint / TypeScript / build et 139 tests unitaires passent. 15 tests serveur Documents valident Ligne / Note, indépendance des sections, alignement numérique, sauvegarde et validation des styles. 12 parcours Chromium passent, dont couleurs / taille des lignes, italique initial des notes, styles indépendants et reprise après recharge ; inspection visuelle du panneau à six choix. Lot NAS cumulatif `/private/tmp/horizon-documents-studio-D10.zip`, 93 entrées, 726229 octets, SHA256 `c195858a060a63c0afba1ae9c6b202dcd839bb7ee98f8b51b761257e363e801b`. Génération HTML / PDF par le même renderer ; pagination réelle NAS restant à vérifier.

Studio D11 : lint / TypeScript / build et 139 tests unitaires passent. Deux parcours Chromium ciblés valident les groupes repliables et les pictogrammes / poignée à droite ; le parcours de déplacement est également relancé après ajout de `type=button` aux contrôles natifs de liste pour éviter une soumission de formulaire. Vérification de l’ordre après drag, maintien de la page new sans sauvegarde, inspection visuelle. Frontend uniquement, lot NAS D10 inchangé.

Studio D12 : lint / TypeScript / build et 139 tests unitaires passent. Trois parcours Chromium ciblés valident repli, déplacement par poignée et sélection commune ; contrôle de la couleur calculée du contour, de la liste et du titre à droite, du fond commun des panneaux et des pictogrammes, en clair et sombre. Vérification du titre final relancée seule après ajustement CSS, réussie. Inspection visuelle des deux thèmes. Frontend uniquement ; hooks / lot NAS D10 inchangés.

Studio D13 : lint / TypeScript / build et 139 tests unitaires passent. Deux parcours Chromium ciblés passent : création de blocs et couleurs communes en clair / sombre, absence de liseré (box-shadow none), bibliothèque synchronisée au type sélectionné. Inspection visuelle ; frontend uniquement, lot NAS D10 inchangé.

Correction D13 : bibliothèque indépendante du bloc sélectionné ; couleur commune limitée au survol / focus / déplacement. Le parcours existant vérifie maintenant zéro outil sélectionné à la sélection d’un bloc et les couleurs au survol dans les deux thèmes. Deux parcours ciblés passent ; lint / TypeScript / build et 139 tests unitaires passent.

Studio — repères de marge : parcours Chromium vérifiant les quatre coins, l’absence d’interception des clics, les distances aux bords après modification des marges, changement de zoom et passage en paysage avec échelle adaptée. Capture inspectée ; `pnpm check` passe (139 tests unitaires) et le parcours ciblé passe. Aucun changement du rendu HTML / PDF.

Aperçu devis agrandi : parcours existant de devis réel / modèle publié / téléchargement PDF vérifié à 1600 × 1000, fenêtre de plus de 1300 px de large et 936 px de haut, centrée hors sidebar ; cadre documentaire de plus de 750 px de haut. Capture inspectée, parcours Chromium et `pnpm check` passent.

Studio — chevauchement à l’ouverture des sections : régression reproduite à 1600 × 800 avant correction (hauteur de l’en-tête comprimée). Test vérifiant la hauteur conservée, le contenu contenu dans chaque section, le défilement jusqu’à Apparence et la bascule Page. Après correction, deux parcours Chromium passent, dont sélection clair / sombre ; capture inspectée et `pnpm check` passent (139 tests unitaires).

Documents — pagination : rendu serveur validé puis imprimé dans Chromium via Playwright, mêmes options A4 / marges / zones répétées que le provider ; saut explicite vérifié sur deux pages et tableau de 140 articles réparti sur plus de deux pages, MediaBox A4 contrôlée. Ce test complète le transport Gotenberg simulé, sans remplacer la recette NAS. Parcours UI : aperçu HTML automatique, bascule PDF (transport simulé) / téléchargement, dimensions 210 / 297 mm inversées en paysage ; trois parcours passent.

Aperçus HTML / PDF : parcours Chromium vérifie l’HTML automatique sans requête PDF, l’erreur explicite en cas de service PDF non configuré (503 simulé), le retour à l’HTML, la génération PDF après configuration et le téléchargement. Aucun changement de droits ou de renderer ; `pnpm check` passe. Compose local corrigé pour fournir l’URL PDF au service PocketBase ; environnement NAS à appliquer par redéploiement.

Studio D14 — parcours de pagination HTML : 140 articles avec descriptions multilignes, nombre de lignes inchangé, tableau et en-têtes répétés, aucune ligne hors zone imprimable, saut imposé sur page suivante, header / footer et compteurs répétés, dimensions A4 portrait / paysage, deux blocs côte à côte et isolation de la fenêtre parent. Modes HTML / PDF, erreur PDF non configuré et téléchargement conservés. Tests exécutés sur Vite et sur le build minifié ; captures inspectées. Pour le build local de test : `VITE_POCKETBASE_URL=http://127.0.0.1:18090 pnpm build`, puis `HORIZON_E2E_PREVIEW=1 POCKETBASE_BINARY=<binary> pnpm test:e2e:auth tests/auth/documents.spec.ts --grep "HTML paginé|aperçu réel"`. Le PDF serveur et la recette Gotenberg NAS restent indépendants.

Documents D15 : régression navigateur avec logo PNG en en-tête et dans le corps, fond image, tableau de 140 lignes, pages répétées, portrait / paysage et relance HTML. Le test Chromium imprime aussi un PDF A4 avec fond opaque : les fonds des templates doivent être contenus dans des zones avec overflow hidden. Les PDF de contrôle sont conservés dans les artefacts Playwright ; inspection raster locale du logo entier et du texte. La pagination HTML dispose de phases de diagnostic (préparation, polices, pagination, pages) sans contenu métier dans les logs.

Documents D16 : tests purs des tokens / numéro requis / sécurité des chemins / bornes et types ; tests PocketBase de migration, droits, conflits de sauvegarde, HTML enrichi et en-tête PDF UTF-8. Playwright : fenêtre en grand avant sélection, zoom / ajustement HTML sans repagination, caractéristiques A4, téléchargement nommé et persistance des formats après rechargement de Paramètres.

Documents D17 : tests du contexte Ventes autorisé et des noms contenant client / opportunité / responsable / interlocuteur ; compatibilité company, bornage UTF-8 de noms longs sans couper le numéro placé en fin de nom. Playwright : absence de titre répété, insertion de champs via combobox, retour de focus, exemple immédiat et persistance après sauvegarde / rechargement.


Suppression des modèles : test serveur du droit, conflit de concurrence, suppression d’un modèle jamais publié et refus d’un brouillon possédant une version publiée (route et hook de collection). Parcours navigateur dans la liste : confirmation, fermeture sans suppression, puis suppression et actualisation ; archivage d’un modèle publié, version conservée et actions absentes du studio. Les icônes ne déclenchent pas l’ouverture de fiche, y compris au clavier.


Tableaux Paramètres : parcours sur référentiels, séquences, CRM, utilisateurs / tags, devis / CGV et noms PDF, avec vérification des séparateurs, centrage, densité et compteurs partagés. Contrôle supplémentaire sombre à 900 px et ouverture de la configuration depuis une ligne compacte.


Catalogue P01 — recette : `tests/pocketbase/check_catalog.py` couvre la migration sur base existante (droits d’un rôle partagé préservés), tarifs par conditionnement, coefficients, favoris / historique, archivage, prix fractionnaires dans les devis, snapshots et accès aux photos protégées. `tests/auth/catalog.spec.ts` couvre le parcours complet de création, création d’un fournisseur en popup, sélection produit / devis, maintien de l’onglet, clair / sombre / écran étroit et consultation de tous les onglets en profil Viewer. Les fixtures démarrent une base locale jetable ; aucune donnée NAS n’est modifiée. Le renderer HTML est aussi vérifié avec un prix unitaire inférieur au centime ; le convertisseur de test ne remplace pas une recette Gotenberg sur le NAS.

Catalogue — reprise visuelle P01 : recette navigateur étendue à la présence des prix dès Informations, classement unique Famille, choix d’une photo depuis ImageSearch (collage Google Images → validation → sauvegarde), saisie continue dans le tableau partagé sans perte de focus, publication d’une note et relecture du fil dans la fiche embarquée depuis le devis. Contrôle des captures en clair / sombre et de la lecture seule.

Catalogue P02 : tests serveur création / dédoublonnage / permissions marques, coût manuel face au favori et sélection explicite d’offre, validation poids / volume / SH / origine, migration d’une base P01 avec marques texte et prix fournisseur conservé. Parcours navigateur création inline de marque, coût manuel après refresh, caractéristiques logistiques persistées, onglet Comptabilité et lecture seule.


Catalogue P03 : recette serveur du coefficient manuel, retour automatique, validation des bornes et conservation du snapshot devis ; migrations neuves et upgrade P01/P02. Parcours navigateur coefficient manuel enregistré puis rechargé, retour auto, contrôle PUV et rendu clair / sombre / écran étroit. Vérification locale : 152 tests unitaires, 23 tests serveur catalogue / devis et 2 parcours Playwright ; lint, TypeScript et build passent.


Catalogue P04 : test unitaire marge sur vente (coef 1,20 → 16,67 %, vente nulle sans taux et marge négative), test serveur référence sku proposée au devis et taux pricing. Parcours Playwright référence unique, marge sur vente, retour auto par décochage, déplacement réel d’une séparation de colonne, confirmation fournisseur annulée puis suppression d’une ligne. Contrôles : lint, TypeScript, 153 tests unitaires, 23 tests serveur et 2 parcours navigateur.


Produit → devis : recette navigateur sans sélecteur de tarif, rappel coût / PUV et reprise immédiate des prix favori puis coût / coefficient manuels (1,40 € × 1,60 = 2,24 €). Sauvegarde et rechargement vérifiés, anciennes lignes au prix précédent conservées.


Remise globale devis : régression navigateur sur montant saisi donnant un pourcentage calculé à quatre décimales (14,33 € sur 300 € = 4,7767 % affiché). Validité native, enregistrement, rechargement et remise exacte en euros vérifiés. Le champ pourcentage accepte step=any ; aucune modification du calcul serveur ou des arrondis comptables.


Bouton PDF devis : recette navigateur du devis courant sans sélecteur de devis, choix automatique du modèle publié unique et génération HTML immédiate ; téléchargement PDF et erreur Gotenberg conservés. Avec plusieurs modèles, changement de modèle et HTML multipage portrait / paysage vérifiés. Resélectionner le modèle actif ne vide pas l’aperçu.


Smart boutons produit : test serveur du regroupement des lignes par devis, quantités / options / montant HT et analytique, refus sans droits Ventes et masquage serveur CRM / Contacts. Parcours navigateur : compteur Devis, historique en tableau commun, ouverture de la fiche devis et état indisponible des achats non implémentés.

Compatibilité catalogue : fiche et liste restent lisibles lorsque les anciens hooks ne renvoient pas encore last_purchase ; absence normalisée en null, sans fabriquer un achat. Tests unitaires de lecture ancienne / nouvelle réponse et refus de montant invalide. Les erreurs de contrat loggent uniquement chemin / code, sans données métier.


Cycle devis / commande — 17 tests serveur Ventes couvrent les permissions dédiées, la concurrence, confirmation idempotente, lignes hors options, snapshots coût / taxe, analytique et revenu sans double compte, retours avec conservation des commandes, blocage dès exécution, annulation, archivage / réactivation, suppression sans envoi ni commande et non-réutilisation des numéros. Pièce cliente : contrôle MIME réel, fichier protégé, preuve conservée après retour. Les 4 parcours Playwright Ventes couvrent aussi la frise, le commercial, les dialogues de retour et l’aperçu de pièce depuis la fiche et le fil. Lint / TypeScript / 155 tests unitaires / build vérifiés.


Recherche produit devis : régression serveur sur mots combinés marque + description et filtrage des produits non vendables avant pagination. Parcours Catalogue adapté au champ dynamique sans combobox, sélection par ligne, aperçu de la fiche existante et reprise des prix coût / PUV.

Recherche produit — ajout direct par bouton + de ligne vérifié dans le parcours Catalogue : coût / PUV manuels repris, devis enregistré et relu sans modification des lignes précédentes. Action Ajouter après sélection également testée ; séparateurs et actions centrées contrôlés sur capture navigateur.

Copie de contenu de devis : test unitaire des champs repris / identité conservée et suppression des identifiants de lignes ; Playwright vérifie recherche, blocage sans COPIER, reprise des coûts / prix, annulation locale, enregistrement puis rechargement sans changement de numéro.


Achats / Stock : `tests/pocketbase/check_purchasing.py` est inclus dans `pnpm test:backend`. Base locale jetable reconstruite depuis les migrations : DA manuelle / issue de commande, prix / taxes / snapshots fournisseur, ventilations analytiques, filtres précis, regroupement en BC brouillon, validations / annulations, idempotence, permissions REST, ajustements audités, concurrence de réservation et de préparation d’achats. `tests/auth/purchasing.spec.ts` couvre le parcours DA → BC → aperçu et la confirmation client avec réservation partielle / besoin net / masquage des colonnes au retour en devis. Régressions Catalogue, Ventes, Documents, Activity et accès à exécuter avec le lot. Le PDF Gotenberg réel reste à recetter sur le NAS configuré ; les tests locaux vérifient le rendu HTML et le contrat de génération.

Achats — régression du 11 octobre 2026 : `check_purchasing.py` couvre validation et préparation atomiques, fournisseur obligatoire et rollback, anti-doublon / concurrence, retour DA / BC en brouillon, conservation des snapshots retirés, maintien des lignes d’une autre demande dans un BC partagé, annulation groupée avant envoi, blocage après envoi réel et migration des états historiques. Playwright `purchasing.spec.ts` vérifie la frise, le numéro de devis source, les notes et colonnes, le retour confirmé en brouillon suivi d’une révision / nouvelle validation et le renvoi vers la liste des BC filtrée sur la demande.


BC fournisseur — régression du 11 octobre 2026 : tests serveur pour acheteur et entrepôt proposés, rejet d’une destination inactive, filtre des demandes par BC, protection des champs validés, conservation TVA / acheteur / destination malgré modification des référentiels, retour en brouillon avec données actuelles. Parcours navigateur : largeur fournisseur / titre, alignement des dates, ordre Qté / Affaires, confirmation de retrait et validation / aperçu.


Paramètres UX : `POCKETBASE_BINARY=<binary> python3 tests/pocketbase/check_ux.py` vérifie la reconstruction / idempotence des migrations, les droits de lecture et écriture, les bornes / allowlists / couleurs, l’audit et les conflits. `tests/auth/ux.spec.ts` couvre l’aperçu local, les valeurs par défaut, Annuler, sauvegarde / rechargement, propagation aux tableaux et permissions. `schemas/ux.test.ts` vérifie les bornes et la dérivation des tokens.

Validation du lot UX (11 octobre 2026) : pnpm check (lint, TypeScript, 169 tests unitaires et build), trois tests serveur UX sur base reconstruite, tests navigateur UX (aperçu / propagation / droits / responsive / conflit), ainsi que régressions Devis / Achats / tableaux communs, réussis. Vérification visuelle desktop et mobile.

Le parcours UX vérifie aussi la conservation du brouillon entre onglets, les couleurs clair / sombre, les boutons et smart boutons, les espacements de navigation, les tuiles du menu et les actions toujours visibles après défilement. La migration additive préserve les anciens réglages.

Stock S02 — `POCKETBASE_BINARY=<binary> python3 tests/pocketbase/check_stock_operations.py` : reconstruction, permissions, séquences concurrentes, idempotence, immutabilité, réceptions partielles, PREP et affaire, retours client/fournisseur, rebut, transit, réservations, livraison directe, comptage / verrou / conflits, calendrier autorisé et aperçu historique. `pnpm test:e2e:auth tests/auth/stock.spec.ts tests/auth/purchasing.spec.ts` vérifie entrée / inventaire / calendrier / aperçu HTML / paramètres / clair-sombre / responsive, ainsi que la régression des achats. Le PDF utilise le service Gotenberg existant et requiert sa configuration serveur ; la présence de l’aperçu HTML ne prouve pas celle du moteur distant.

Validation Stock S02 (11 octobre 2026) : pnpm check réussi (lint, TypeScript, 170 tests unitaires et build), 13 tests serveur Stock, 17 Achats et 22 Documents réussis ; trois parcours navigateur Stock / Achats réussis après adaptation des sélecteurs aux nouveaux entrepôts et liens opérationnels. Stock couvre aussi le retour fournisseur par reprise de lignes. Vérification visuelle desktop clair / sombre et contrôle d’absence de débordement à 390 px. Pack PocketBase uniquement vérifié par ZIP / SHA256, 131 fichiers hooks et migrations, dernière migration 1791710006. Déploiement NAS non effectué par ces tests.

Validation Stock S03 (11 octobre 2026) : pnpm check réussi (170 tests unitaires), 14 tests serveur Stock réussis, dont le filtrage et les compteurs séparés des livraisons / rebuts. Le parcours navigateur Stock vérifie l’ouverture du dashboard depuis la sidebar, les sept tuiles d’opérations, la création directe d’une livraison directe, les opérations / inventaires et le responsive. Captures desktop examinées. Pack PocketBase uniquement actualisé et vérifié ; aucune migration supplémentaire pour S03. Les moteurs CUMP / FIFO restent une proposition, sans valorisation comptable implémentée dans ce lot.

Stock V01 — `tests/pocketbase/check_stock_valuation.py` intégré à `pnpm test:backend` : coût standard indépendant des prix commerciaux, permission administrateur, contrôle de concurrence, immutabilité, écarts achat / standard, inventaires / ajustements, transfert et révision en transit, ouverture explicite des stocks antérieurs (y compris transit), changements CUMP/FIFO avec relecture historique, retours FIFO restaurant les couches réellement consommées. Six tests purs du moteur vérifient coût fixe, moyenne pondérée commune, FIFO par emplacement, conservation du transfert, changement de méthode et fractions de centime / limites de précision. Le parcours Playwright Stock vérifie régularisation du coût dans Paramètres, historique, changement confirmé vers CUMP, valeur conservée et rappel sur la fiche produit. Les stocks EUR d’ouverture sont des décisions administrateur, pas des montants devinés par la migration. Sage / frais / conversion de devise / factures ne sont pas attestés par ce lot.

Validation Stock V01 (11 octobre 2026) : `pnpm check` réussi (lint, TypeScript, 176 tests unitaires et build), six tests serveur Valorisation, 14 Stock, 17 Achats et 15 Catalogue réussis. Deux parcours navigateur Stock / Valorisation réussis ; capture Paramètres examinée, contrôle responsive après stabilisation du layout. La régression de migration sur les comptes historiques sans JSON d’accréditations a été corrigée puis retestée. Pack PocketBase uniquement ZIP / SHA256 vérifié, dernière migration 1791710007 ; déploiement NAS non effectué.

Stock S04 : `WarehouseCodeMigrationTests` vérifie la reprise CVS → MEU / SEV sans changer les identifiants, les emplacements ni les compteurs, et la suppression du champ trigram. Le parcours navigateur Stock vérifie les codes et le changement d’onglet Valorisation conservé après rechargement.

Réceptions automatiques : tests Stock couvrent création sans mouvement, réception partielle / reliquat, validation répétée, retour BC en brouillon / revalidation / annulation et migration d’une attente vide sans changement de numéro. Parcours Achats navigateur : smart bouton Réceptions, attente préremplie, emplacement proposé et validation à l’arrivée.

Réception fournisseur : régression serveur expéditeur / affaire, source BC non effaçable, changement d’entrepôt et numéro, destination / quantité requises, validation par magasinier sans accès aux prix, bon sans montants et stabilité du libellé après renommage d’emplacement. Parcours navigateur Achats vérifie ces colonnes, l’expéditeur, le lien source, l’entrepôt éditable et les notes repliables.

Tags d’affaires : régression réception multi-affaires avec code, client, quantité ventilée, déduplication et snapshot du nom client. Parcours navigateur : liste Réceptions avec Provenance / Affaires, popup BC utilisant la fiche commune et conservant l’URL réception, proposition Stock principal au changement d’entrepôt.

Dashboard Stock / catalogue Opérations : régression serveur du filtre En cours (exclusion des réalisations / annulations, inclusion du transit) et du tri des dates avec non-planifiées en fin. Parcours navigateur : compteurs ouvrant les listes filtrées, file de réception brouillon ouvrant la fiche, disponibilité / valeur, catalogue sept types, création depuis le type, clair / sombre et absence de débordement mobile.

Validation dashboard Stock / Opérations (11 octobre 2026) : pnpm check réussi (lint, TypeScript, 176 tests unitaires, build), 20 tests serveur Stock et deux parcours navigateur réussis. Captures desktop clair / sombre, dashboard avec réception en attente et contrôle sans débordement à 390 px examinés. Pack PocketBase uniquement actualisé et vérifié ; aucune nouvelle migration, déploiement NAS non effectué.

Courbes Stock : quatre tests purs du calcul des dix dates / séries, archives réalisées, annulations, retard, dates absentes, variants OUT et transit. Régression PocketBase sur 31 pièces planifiées (compte complet malgré une page de 30), vrai jour de validation Europe/Paris et filtre En cours conservé. Parcours navigateur avec réception réalisée et quatre attentes datées, accès au détail journalier au clavier et courbes clair / sombre / mobile.

Validation Courbes Stock (11 octobre 2026) : pnpm check réussi (180 tests unitaires), 21 tests serveur Stock réussis, parcours navigateur Stock réussi après compaction des cartes. Captures courbes colorées avec réalisé / prévu et détail quotidien examinées ; clair / sombre / mobile vérifiés. Pack PocketBase uniquement actualisé et ZIP / SHA256 vérifiés ; pas de nouvelle migration ni déploiement NAS effectué.

Carrousel du dashboard : parcours Playwright `tests/auth/dashboard.spec.ts` avec horloge contrôlée pour rotation à 10 s, pause mémorisée au rechargement, navigation par points / flèches / glissement, changement de mode via HDialog, création réelle d’une opportunité et d’un devis, actualisation et distinction Devis / Commandes. Contrôle du rendu avec données en desktop / mobile et parcours Stock clair / sombre conservé. Aucun changement de schéma ou de hooks PocketBase pour ce lot.

Dashboard connecté — tests purs des agrégats en centimes, monnaies distinctes, taux de marge pondéré et coût inconnu. tests/pocketbase/check_dashboard.py vérifie frontières Europe/Paris, périodes, snapshots historiques, annulations / brouillons, achats engagés, accès par module, sources supprimées et tâches personnelles datées / terminées. Parcours Playwright : création réelle d’une affaire datée, filtre par période, devis confirmé et montant / marge mis à jour, activité réelle, planning sans erreur, captures desktop / mobile.

Validation Dashboard connecté (11 octobre 2026) : pnpm check réussi (189 tests unitaires, lint, TypeScript et build), quatre tests serveur Dashboard réussis et parcours navigateur avec commande confirmée / tâche personnelle / filtres temporels réussi. Captures avec données examinées en clair / sombre / mobile ; listes défilantes dans les cartes conservant le ratio 50/50. Pack PocketBase uniquement généré et ZIP / manifest / SHA256 vérifiés, aucune nouvelle migration ni déploiement NAS effectué.

Calendrier manuel : `tests/pocketbase/check_calendar.py` vérifie migration neuve, dates, couleurs, fins, allowlists, visibilité privée / équipe (projection et API Rules), propriété en écriture, viewer / rôle inactif, contrôle de version, idempotence, archivage et REST brut verrouillé. `tests/auth/calendar.spec.ts` couvre ajout réel, journées entières, couleur, réouverture, modification / partage et retrait avec confirmation, en plus des vues et du scroll. Pack NAS limité à PocketBase avec migration 1791710010.

Validation Calendrier manuel (11 octobre 2026) : pnpm check réussi (189 tests unitaires, lint, TypeScript, build), deux tests PocketBase Calendrier et douze tests Accès / RH réussis. Trois parcours navigateur Calendrier / Dashboard réussis, puis parcours manuel rejoué après harmonisation de la popup et du cache. Pack PocketBase seul vérifié ; migration à appliquer sur NAS, aucun déploiement effectué.

Calendrier — ajout depuis une case : parcours Playwright vérifie la date préremplie, sa conservation au changement journée entière / horaire, clic sur événement existant sans création parasite ; bouton toujours visible mais désactivé sans habilitation, aucune case activable en lecture seule. Lint / TypeScript et parcours de création, modification, retrait réussis.

Courbes Dashboard — validation du 11 octobre 2026 : pnpm check réussi, 194 tests unitaires dont géométrie / zéro / marge négative et séries serveur jour / semaine / mois, centimes, devise et année bissextile. Quatre tests PocketBase Dashboard réussis avec somme des séries, frontière Europe/Paris et permissions ; parcours navigateur réussi avec changement Mois / Trimestre / Année, commande réelle, Facturé sans tracé et captures clair / sombre / mobile examinées. Pack NAS PocketBase uniquement actualisé ; aucune nouvelle migration pour les courbes.

12 octobre 2026 — AO À télécharger / Kanban fluide : seize tests PocketBase AO réussis, dont ordre avant À analyser et dossier autonome sans numéro / affaire ; parcours Playwright AO et CRM réussis avec largeur desktop sans scroll horizontal, repli augmentant la largeur restante, dépli et glisser-déposer conservés. Lint / TypeScript réussis ; captures examinées. Pack PocketBase seul vérifié, migration 1791710011 à appliquer avant usage NAS.

12 octobre 2026 — Apparence / Sidebar : pnpm check réussi (195 tests, lint, TypeScript, build), six tests PocketBase UX et quatre parcours navigateur UX réussis. Régression migration additive avec conservation des réglages, validation des couleurs et demi-pixels, aperçu local isolé, sauvegarde / conflit / realtime, classement par thème et absence de sliders. Captures desktop / mobile examinées ; pack PocketBase seul actualisé et vérifié, migration 1791710012 à appliquer sur NAS.

12 octobre 2026 — Couleurs des bordures de tableaux : pnpm check réussi (195 tests), six tests PocketBase UX et quatre parcours navigateur UX réussis. Contrôles des bordures du cadre / cellules, en-tête en aperçu, thèmes indépendants, sauvegarde et migration préservant les couleurs existantes. Pack NAS PocketBase seul actualisé, migration 1791710013.

12 octobre 2026 — Analytique A01 : pnpm check réussi (198 tests unitaires, lint, TypeScript et build). 78 tests serveur sur Analyse (6), Ventes (18), Achats (17), Stock (21), Accès / RH (12) et Dashboard (4) réussis. Reprise de commandes sans changement de snapshot / updated, enfant réutilisé à reconfirmation, CUMP réel distinct du coût prévu, achats communs / commandes sans double comptage, arrondis en centimes, own / all et absence de champs financiers en projection opérationnelle. Neuf parcours navigateur pertinents validés avec fixtures isolées (Analyse, Achats, Ventes, Accès et Dashboard) ; captures clair / sombre / mobile examinées. Pack PocketBase uniquement vérifié, migration 1791710014 à appliquer ; aucun déploiement NAS effectué.

12 octobre 2026 — Complément heures Analyse : pnpm check réussi (198 tests), sept tests serveur Analyse et parcours navigateur Analyse réussis. Contrat TimeReport / Planning vérifié sur collections temporaires : BE / Production, racine / enfants, consolidation sans doublon, validation explicite, brouillons séparés, annulations exclues et absence de données individuelles dans la réponse opérationnelle. Source réelle encore à préciser ; aucun module TimeReport déployé. Pack PocketBase seul actualisé (hooks, sans migration supplémentaire).

Dashboard général : restauration du style antérieur, contenu et comportements préservés, parcours navigateur de régression vérifié.

Fiche produit / détail des réservations : pnpm check réussi (200 tests), 17 tests serveur Achats / Stock et trois parcours Catalogue réussis. Vérifications de hauteur commune, consolidation de deux entrepôts, consultation Viewer, acteur réel de réservation, refus 403 / 401 et projection sans e-mail. Route dans les hooks Stock, pack PocketBase seul actualisé ; aucune migration ajoutée pour ce complément.

UX / texte des en-têtes : pnpm check réussi (200 tests), six tests PocketBase UX dont reprise additive des réglages, quatre parcours navigateur UX réussis. Couleur du texte vérifiée en aperçu clair / sombre, sauvegarde et token partagé ; valeurs invalides refusées côté serveur. Pack NAS PocketBase inclut 1791710015_table_header_text_appearance.js.

UX / suivi des commandes — 15 octobre 2026 : migration
`1791840014_order_tracking_appearance.js` testée sur base neuve et reprise d’une
configuration existante, puis rejouée sans écrasement de préférences ; couleurs
invalides refusées. Huit tests PocketBase UX réussis. Parcours navigateur du
réglage et de la commande : aperçu partagé, persistance après rechargement,
fond limité aux quatre en-têtes en clair/sombre, camion Livraisons et ratios
compacts ; parcours UX et réservation/préparation des achats également réussis.
`pnpm check` : 262 tests / 61 fichiers, lint, TypeScript et build réussis.

Contrôle des tableaux — 15 octobre 2026 : le parcours `list-sorting.spec.ts`
vérifie aussi le cadre, l’absence d’ombre, la bordure basse unique et les coins
inférieurs sur les listes principales et les tableaux de paramètres : 33 vues,
102 contrôles de tableaux en clair, sombre et mobile sombre, avec états vides
et remplis. Rapport local `/private/tmp/horizon-table-frame-audit.json`.
`purchase-table-frame.spec.ts` couvre séparément le cas Achats filtré vide et
le défilement horizontal réel d’un tableau rempli sur mobile. Les assertions
conservent les barres nécessaires et refusent un débordement de page.

Mon compte : tests/pocketbase/check_account.py couvre identité propre, allowlist anti-escalade, conflit de version, Viewer, rôle désactivé, legacy privé, refus de l’ancien import/retrait de photo et mauvais MIME, ancien mot de passe et révocation des tokens, absence de secrets dans audit. tests/auth/account.spec.ts vérifie identité / avatar dans le menu, persistance, annulation, clair / sombre / mobile et changement de mot de passe ; les identifiants fictifs du fixture sont restaurés.

Avatars / présence : check_account couvre accès photo via événement autorisé, refus sans droit sur le fil et présence personnelle avec enum contrôlé. account.spec vérifie ronde de disponibilité dans compte / menu, absence de contour, photo d’un autre auteur dans le fil et absence de présence dans la saisie / publications ; retrait de photo depuis Employés répercuté au rechargement.


T01 / I01 — vérifications du 12 octobre 2026 : `check_stock_traceability.py` (29 tests, dont régressions S02) couvre identités uniques, réception/sortie/retour, transfert en transit, réservation par série et libération, livraison directe sans stock local, comptage et récupération d’une série manquante, quarantaine/version, destinations mixtes héritées des demandes, rollback d’une réception invalide pour le parc, parc et registre financier, base figée/déclassement/retour, scopes RH et masquage financier. Catalogue 16, Achats 17, Accès/RH 12 et Documents 22 tests passent ; génération PDF vérifiée avec convertisseur de test, pas une recette physique d’impression. Frontend : lint, TypeScript, 200 tests Vitest et build passent. Playwright : parcours Stock (2), Achats (2), Traçabilité/Parc (2), avec frappe continue de série, historique, publication de note, qualification/déclassement/retour, quarantaine et prélèvement de lot. Relecture visuelle claire/sombre et mobile sur le parc. Installer la migration 1791710018 et les hooks ensemble avant utilisation du frontend local ; pack NAS limité à PocketBase.

A02 : check_fixed_analytic.py couvre les six destinations, accès sans CRM, refus d’un compte d’affaire passé comme compte fixe, héritage de demande, renumérotation, versions concurrentes, codes en doublon/collision et permutation atomique ; snapshots documentaires conservés. Recette navigateur fixed-analytic.spec.ts : ventilation interne/stock, logiciel sans réception physique, paramétrage et lien inchangé. Régressions Achats, Traçabilité/Parc et build frontend vérifiées. Les anciennes pièces restent inchangées ; pour affecter un code fixe à un ancien brouillon, ouvrir sa ventilation et appliquer le choix.

Confirmation intégrée Stock/Achats : check_purchasing vérifie aperçu des lignes hors options, déduction réservations, sources devis→commande, demande draft, rollback complet sur dépassement et retry sans doublon. sales.spec vérifie panels simultanés, checks après application, dépôt fichier et maintien sur la commande ; purchasing.spec couvre la réservation existante et la fiche canonique de besoins en popup.

CGV et création de devis : migration 1791710020_quote_default_terms (base neuve, rollback/remontée sur liste ancienne, devis historique conservé), tests serveur d’unicité et disponibilité, unitaires de préremplissage et conservation du titre manuel, navigateur des paramètres et du nouveau devis avec première ligne, produit, popup canonique et HT prioritaire.

Régression lecture du fil : check_activity teste pagination/filtres/documents/tâches, utilisateur non habilité, source supprimée, AO + opportunité, collections privées Produits/Stock/Achats, et lecture en présence de 20 lignes dans chacune des 10 collections sources sans jointure transversale. Navigateur : commentaires/tâches des devis, historique AO et photos des auteurs ; conservation des API Rules et contrôle de source serveur.

### État des vérifications avant push — 12 octobre 2026

`pnpm check` réussi avant les commits `8e0de25` / `f9bf927` : lint, TypeScript strict, **205 tests Vitest dans 46 fichiers**, build. Le build conserve l’avertissement connu de taille de certains chunks ; aucune dépendance ajoutée pour le correctif du fil. `git diff --check` réussi ; dépôt propre après push sur origin/main.

Correctif Activity : suite serveur de 14 tests passée ; test de volume/sources privées rejoué après l’ajustement final. Playwright ciblé : avatar d’un autre auteur (Account), historique AO/opportunité (Tenders), devis/commentaires/tâches (Sales), suite Achats (2 parcours). Cette preuve ne vaut pas rejeu complet de toutes les suites E2E ni recette NAS. Les preuves des lots précédents restent dans leurs entrées ci-dessus.

À recetter sur l’instance cible : migration/hook compatibles, chargement/publication du fil après redémarrage, droits et fichiers protégés, confirmation avec réservation/DA, BC→réception, traçabilité/parc et configuration CUMP. Conversion Gotenberg réelle / imprimante et restauration de sauvegarde restent des vérifications d’exploitation séparées. L’audit documentaire qui suit n’exécute aucun déploiement et ne modifie aucun code applicatif ; contrôle limité aux liens, cohérence du suivi et diff documentaire.

## Pagination commune des listes — 12 octobre 2026

`tests/auth/pagination.spec.ts` compare 14 parcours paginés au CRM : compteur, dimensions des boutons, chevrons, couleurs et position dans le fil d’Ariane, en clair / sombre / mobile, sans débordement horizontal. Une seconde vérification couvre passage entre deux pages, bornes, blocage pendant une requête et conservation des critères URL. Les listes vides utilisent la fixture PocketBase locale ; la réponse du scénario à deux pages est interceptée côté navigateur, sans création de données métier. Exécution réussie : `POCKETBASE_BINARY=/private/tmp/horizon-crm-tools/pocketbase pnpm exec playwright test --config=playwright.auth.config.ts tests/auth/pagination.spec.ts` (2 tests). Captures Analyse clair / sombre / mobile inspectées ; aucune recette NAS ni nouvelle exécution de toute la suite E2E.

### Smart bouton de demande d’achat — 12 octobre 2026

Le scénario Achats de `tests/auth/purchasing.spec.ts` vérifie désormais le lien Commandes fournisseurs dans la zone related du fil d’Ariane, son compteur et sa destination filtrée par demande ; captures clair/sombre/mobile inspectées et absence de débordement mobile contrôlée. Exécution du fichier sur PocketBase éphémère : parcours Achats réussi ; scénario Commande client interrompu après retour à la connexion (session invalide), puis réussi en exécution isolée avec `--grep "Commande client"`. Cet échec de session en exécution groupée reste à surveiller ; aucune validation de toute la suite E2E ou du dossier réel sur NAS revendiquée.

### Accueil Achats — 12 octobre 2026

`tests/auth/purchasing-home.spec.ts` vérifie clic Achats → DA en attente, quatre cartes communes, compteur, filtre URL / conservation recherche et regroupement, remise à la première page, rechargement et Nouvelle commande à droite. Captures clair/sombre/mobile inspectées. Régression du tableau groupé sur mobile corrigée dans la grille partagée ; le test attend le rendu après changement de viewport. Exécution finale combinée avec pagination.spec.ts : 3 tests réussis sur PocketBase jetable (14 parcours de pagination conservés). Suite serveur Achats : 19 tests réussis, dont filtre pending, archives, autres états, compteurs contextuels et permissions. `pnpm check` réussi : lint, TypeScript, 205 tests Vitest et build ; lint/typecheck revérifiés après ajustement final du test. Aucun test contre NAS ; suite E2E complète non exécutée.

### Accueil commun DA / BC — 13 octobre 2026

Le parcours purchasing-home.spec.ts couvre désormais une même liste contenant DA et BC : types visibles, cartes DA en attente / Bons de commande, liens de fiches distincts, retour à l’accueil par breadcrumb avec critères conservés, recherche/regroupement URL, création de commande, clair/sombre/mobile. Le scénario est réussi sur fixture PocketBase jetable ; contrôles de pagination des listes dédiées conservés. Backend Achats : 21 tests réussis, dont 34 pièces mixtes sur deux pages, tri global, compteurs indépendants du type sélectionné, exclusion des pièces terminées en vue pending et refus de lecture sans droit. Deux tests Vitest supplémentaires vérifient les filtres de la liste commune, dont le choix explicite de toutes les pièces non archivées. Aucun appel aux données NAS dans ces tests.

### BL préparés et partiels — 13 octobre 2026

`pnpm check` réussi : lint, TypeScript, 214 tests Vitest (48 fichiers) et build ; avertissement existant sur les chunks volumineux. Tests PocketBase locaux jetables : Stock 28 tests, traçabilité 37 tests, valorisation 6 tests, Activity 14 tests réussis. Stock inclut absence de stock, réservation propre/étrangère, non-duplication des brouillons, réalisation archivée, réception unique/ambiguë/multi-affaires, concurrence, permissions et source client protégée. Traçabilité couvre livraison partielle sérialisée et lot en quarantaine avec rollback. Sept tests unitaires de disponibilité couvrent stock partagé entre lignes, unités mixtes et historique prévu/réalisé. Test de reprise de migration supplémentaire réussi : ledger et snapshot historiques identiques, double migrate up et paramètre false.

Playwright ciblé : trois parcours BL (stock nul → 2/4 → reliquat, réception ambiguë et sélection explicite, séries partielles) et deux parcours Stock existants ; captures liste clair/sombre/mobile, confirmation et paramètres comparées. Une exécution groupée a échoué sur l’assertion responsive immédiate du Dashboard existant ; les deux parcours Stock réussissent isolément, sans modification du Dashboard. Une assertion de comparaison des onglets a été adaptée au bouton Changer de méthode de Valorisation existant. Pas de suite E2E/backend exhaustive ni de recette NAS ; résultats exclusivement locaux.

### Sous-titre et bordures — 13 octobre 2026

`pnpm check` réussi : lint, TypeScript, 218 tests Vitest (49 fichiers), build ; avertissement des chunks volumineux conservé. Tests PocketBase sur bases jetables : Ventes 22 tests et Documents 23 tests réussis. Nouveau scénario Ventes : Sous-titre sans montant, total de section conservé et kind repris dans les lignes de commande confirmée. Nouveau scénario Documents : style Sous-titre/bordures persisté, HTML et transport PDF vers convertisseur de test, rejet des couleurs/champs/côtés/épaisseurs invalides. Ancien test de backfill CGV ajusté pour omettre sa migration précisément plutôt que retirer la dernière migration arbitrairement ; reprise et double migrate up réussis. Quatre tests Vitest supplémentaires couvrent héritage du trait, côtés indépendants, validation du modèle et absence d’impact du Sous-titre sur les totaux.

Playwright : parcours Sous-titre / studio / relecture / aperçu paginé réussi et régression styles Ligne/Note réussie. Contrôles des bordures sur cellules paginées visibles, captures studio clair/sombre/mobile et aperçu HTML inspectées. PDF local Chromium généré depuis le HTML d’aperçu : `/private/tmp/horizon-subtitle-chromium.pdf`. Le transport Gotenberg est testé avec un convertisseur local de test, pas une recette du vrai Gotenberg NAS ; différence entre aperçu et PDF cible restant à recetter. Premières assertions de recette corrigées (attente de chargement, libellé Aperçu / PDF du studio et arrondi des pixels par Chromium). Aucune suite E2E exhaustive ni ouverture/mutation de la fiche utilisateur sur le NAS.

### Lignes vides de devis — 13 octobre 2026

`pnpm check` réussi (lint, TypeScript, 220 tests Vitest / 49 fichiers, build). PocketBase jetable : Ventes 23 tests et Documents 24 tests réussis ; conservation/ordre des espaces dans devis puis commande, quantité et montants nuls, refus de données incohérentes, rendu HTML et transport PDF vérifiés. Convertisseur PDF de test, pas Gotenberg NAS réel. Deux nouveaux tests unitaires couvrent conversion des lignes vides sans suppression des saisies partielles et invariants de pricing.

Playwright ciblé : conservation de vides consécutifs, note vide, rechargement, duplication, cellules d’espacement de 24 px dans l’aperçu paginé et transformation en Note réussis. Régressions préremplissage/ajout produit et Sous-titre/bordures réussies. Ancienne assertion attendant la disparition de la ligne initiale adaptée à la nouvelle demande ; clé trop courte de fixture Documents corrigée. Capture de l’aperçu inspectée. Suite E2E exhaustive et recette NAS non exécutées ; avertissement de chunks volumineux inchangé.

### Facturation interne B01 — 13 octobre 2026

Contrôle global final `pnpm check` réussi : lint, TypeScript, 221 tests Vitest dans 49 fichiers et build. Avertissement existant sur les chunks supérieurs à 500 kB conservé ; `git diff --check` réussi.

Tests PocketBase sur bases jetables : 15 tests Billing réussis. Ils couvrent reconstruction neuve, double migration, reprise d’une base antérieure sans altération des données existantes, permissions, fichiers protégés, validation et numérotation atomiques, immutabilité, préparation partielle multi-sources, acomptes/déductions, arrondis des avoirs, règlements/remboursements, concurrence et idempotence. Factures fournisseurs : référence originale unique, pièce obligatoire, écarts de prix/quantité justifiés et rattachement exact aux réceptions partielles. Relecture d’un avoir après archivage du client : identité et référence d’origine figées. Activity : publication, lecture et tâche autorisées avec profil Billing uniquement, puis refus après retrait du droit ; règles de liste existantes conservées.

Régressions serveur affectées réussies : Activity 14, Documents 24, Ventes 23, Achats 21 et opérations Stock 29 tests (111 au total). Activity et Ventes rejoués après les derniers ajustements serveur : 37 tests réussis. Cinq parcours Playwright ciblés réussis : dashboard / facture client / règlement / avoir / fil / critères URL / paramètres, facture fournisseur et doublon, modèle de facture dans le studio, aperçu documentaire Devis existant et commande client avec réservation facultative. Captures dashboard, facture, liste, paramètres et aperçu inspectées en clair, sombre et mobile selon le parcours ; toolbar d’aperçu alignée sur les hauteurs partagées. La suite E2E exhaustive n’a pas été exécutée.

Pagination HTML vérifiée dans Chromium. Transport PDF vérifié avec convertisseur local de test et erreurs de conversion contrôlées ; aucune recette du vrai Gotenberg NAS revendiquée. Sage, SUPER PDP, écritures comptables, multi-devise et contextes TVA avancés restent hors du lot interne B01. Installation cible, configuration de l’émetteur et recette PDF réelle restent à effectuer avec une sauvegarde cohérente. Pack PocketBase préparé et empreintes vérifiées ; aucune donnée NAS modifiée.

### Conditions de paiement / défaut TVA — 13 octobre 2026

`pnpm check` final réussi : lint, TypeScript, 225 tests Vitest dans 50 fichiers et build ; avertissement de chunks volumineux inchangé. Quatre nouveaux tests unitaires : condition client, défaut global, condition archivée et date momentanément vide. Suite Billing PocketBase : 17 tests réussis, dont condition client reprise depuis commande, texte/échéance personnalisés figés dans la facture et l’aperçu, archivage sans suppression, refus d’une nouvelle affectation inactive, délai fractionnaire refusé et lecture native fermée. Migration testée depuis le schéma Billing précédent avec facture validée et condition historique à 17 jours : facture/snapshot/texte/échéance inchangés, défaut préservé, double migrate up réussi. Les deux scénarios conditions/reprise rejoués après contrôle final des dates passent. Suite Contacts : 25 tests réussis.

Quatre parcours Playwright Billing réussis ; scénario supplémentaire conditions/client/brouillon/validation/aperçu rejoué après ajustement mobile, réussi. Création d’une condition et sélection immédiate comme défaut, rechargement de fiche client, remplacement de condition dans la facture, saisie libre et relecture après sauvegarde contrôlés. Cases roses TVA/conditions et unicité vérifiées ; captures paramètres clair/sombre/mobile et fiche client inspectées. Tableaux à défilement interne sur mobile, sans débordement de page ; modèle Documents et fournisseurs existants restent couverts. Aucune suite E2E exhaustive ni recette sur NAS/Gotenberg réel. Quelques requêtes annulées à la navigation sont loggées ; refus fournisseur 409 attendu dans la régression. `git diff --check` réussi. Pack serveur consolidé préparé seulement.

### Frise / onglets / référence client sur facture — 13 octobre 2026

`pnpm check` final réussi (lint, TypeScript, 225 tests Vitest / 50 fichiers, build) et `git diff --check` réussi ; avertissement existant sur les chunks volumineux conservé. Tests serveur sur PocketBase jetable : Billing 18, Ventes 24 et Documents 24 réussis. Ventes couvre correction de référence sur commande confirmée, passage Attente Commande, version périmée, champs interdits et refus Viewer ; numéro Horizon, preuve et snapshot commercial restent identiques. Billing couvre référence préremplie puis personnalisée, référence figée après correction de la commande, aperçu HTML, reprise dans l’avoir et relations non exposées sans droit source. Migration depuis le schéma antérieur et double migrate up préservent facture/snapshot/échéance/texte et la nouvelle référence reste vide ; reprise rejouée isolément avec succès.

Cinq parcours Playwright Billing réussis en exécution finale groupée. Nouveau parcours : champ de commande éditable alors que les lignes restent verrouillées, flèche de fichier protégé ouvrant le popup, sauvegarde/rechargement, tags vert/rouge dans la liste, facture préparée, référence propre, smart buttons vers commande et BL, panneaux d’onglets, brouillon conservé entre onglets/sauvegarde/rechargement, référence dans l’aperçu, verrouillage après validation et frise Soldée après règlement complet. Captures commande, liste, popup, facture Informations/Échéancier/Conditions, clair/sombre/mobile inspectées ; absence de débordement mobile contrôlée. Première recette a relevé que useBlocker interceptait aussi le changement d’onglet dans l’URL : correction réelle, puis deux parcours ciblés et les cinq parcours groupés passent. Les logs de requêtes annulées lors de navigation et de réponses Activity interrompues restent observables ; aucun contournement de permissions ajouté.

Pas de suite E2E exhaustive, de recette de sélection multi-pièces ni d’installation NAS ; sélection multi-pièces utilise HDialog/HDataTable partagé, permissions serveur couvertes. Pipeline PDF avec convertisseur de test conservé dans les tests serveur, HTML réel vérifié dans Chromium ; Gotenberg NAS réel restant à recetter. Pack serveur préparé seulement.

### Commande : actions utiles, champs et preuve ultérieure — 13 octobre 2026

`pnpm check` final réussi : lint, TypeScript, 229 tests Vitest dans 51 fichiers et build. Quatre tests unitaires de visibilité de réservation couvrent absence de résultat, capacité entièrement réservée, réservation partielle, absence de disponibilité / capacité. Tests PocketBase jetables réussis : Ventes 25, opérations Stock 29, Billing 18 ; ajout postérieur de pièce rejoué isolément après le dernier contrôle de preuve facultative, réussi. PDF/image protégée, MIME invalide, double ajout, version périmée, conservation de l’événement initial, de la date et du snapshot commercial couverts ; reste de livraison positif puis nul contrôlé après livraison complète.

Playwright : sept parcours de régression Billing/Livraisons passent dans l’exécution groupée initiale ; le nouveau parcours commande a ensuite été corrigé et rejoué avec deux parcours existants Ventes, trois réussis. Dernière recette visuelle du parcours commande réussie en clair/sombre/mobile, animations de thème désactivées pour les captures. Ordre des quatre boutons et alignement avec les onglets, trois champs sur une ligne, absence de date/validité de devis, ajout de preuve après confirmation et aperçu, titre/colonnes fixes sur 36 lignes, marqueur Attente Commande, masquage après réservation complète/DA préparée/livraison/facturation, réapparition après libération du stock et absence de débordement mobile contrôlés. Captures inspectées, notamment en mode page et paramètres de défilement partagé ; le scénario prend en compte le seuil de fixation et les bordures de 1 px des contrôles.

Corrections de recette : variante trois colonnes exclue de la règle générique d’étirement du dernier champ sans changer la spécificité des autres grilles ; ancien scénario qui ouvrait les achats alors que tous étaient déjà préparés adapté à la nouvelle demande. Format de fixture fournisseur corrigé vers supplier. Requêtes annulées à la navigation restent loggées, aucun contournement des API Rules. `git diff --check` réussi ; avertissement de chunks volumineux inchangé. Pas de suite exhaustive, recette NAS ou nouveau test du vrai Gotenberg. Aucun schéma supplémentaire ; pack serveur préparé seulement.


Photos Employés / comptes — 13 octobre 2026 : `tests/pocketbase/check_employee_photos.py` couvre la reprise migrée non destructive et rejouable, les conflits, l’association initiale, la suppression sans résurrection après réassociation, l’affichage propre / Admin et les refus sans droits, le fil et le remplacement. `check_account.py` conserve la régression des profils/préférences/mots de passe et contrôle le refus de l’ancienne écriture photo. `tests/auth/access-hr.spec.ts` vérifie aperçu d’import / photo Liste-Cartes-Organigramme, utilisateur associé et lecteur ; `account.spec.ts` prépare les photos via HR et vérifie les comptes/fils sans contrôle d’import local. Fixtures jetables uniquement ; cette vérification ne vaut pas recette NAS ou S3 réel.

### Notes de frais E01 — 14 octobre 2026

pnpm check : lint/TypeScript, 250 tests / 58 fichiers, build réussis. Trois unitaires : mois civil sans décalage de fuseau, TVA/TTC et montants négatifs, extraction des seuls champs éditables. Suite PocketBase Expenses/Accès-HR/Notifications : 17 tests réussis, dont quatre Expenses couvrant mois unique/clés idempotentes, montants et catégories, justificatifs requis, champs conditionnels, ordre des lignes, couverture personnelle/entreprise, périmètres, confidentialité des brouillons, fichiers protégés, notifications, retour/resoumission, validation sans auto-approbation, réaffectation, snapshots et remboursement daté. Mise à niveau depuis 1791840008 : un test supplémentaire réussi, employés/sociétés/comptes existants conservés, permissions Admin additives, migrate up répété sans doublons. Base neuve reconstruite par les fixtures.

Trois parcours Playwright réussis ensemble : Expenses complet (restaurant/invité/opportunité/analytique, deux justificatifs, aperçu à droite, parking interne payé par entreprise, refus sans PJ, manager, notification/lien/lecture, retour, nouvelle soumission, validation/historique, remboursement) ; régressions Facturation dashboard/règlement/avoir et commande/PJ multiples partageant le picker et le résumé. Desktop clair, fiche mobile sombre et popup mobile sans débordement ; captures inspectées. Sélecteur de test Billing adapté au résumé partagé HDocumentSummary ; fixture Admin dotée explicitement des nouveaux droits, sans contournement métier. Suites exhaustives backend/navigateur et recette NAS non exécutées ; avertissement build de chunks et logs d’annulation de navigation/ResourceWarning de fixture conservés. Sage/PDP, virement réel, export comptable et marge d’affaire non testés car non raccordés en E01.

Notes de frais / UX et fil partagé — 14 octobre 2026 : pnpm check réussi (250 tests / 58 fichiers, lint/TypeScript/build), lint/typecheck rejoués après densité et recherche de destinataires finales. 22 tests serveur Expenses/Activity/Notifications réussis ; deux tests supplémentaires réussis pour montée E01 → fil (metadata.author ajoutée, identifiants/corps/dates/notes conservés, migrate up répété) et fichiers de commentaire par scope, puis recherche de destinataires/tâches rejouée avec succès. Tests métier du mois : changement principal sans réécriture de dates/PJ, titre actualisé, conflit mensuel refusé, soumission hors mois bloquée. Contributions/mentions/tâches et lectures du fil source testées propriétaire/manager/non autorisé, y compris après validation financière sans modification des lignes.

Trois parcours Playwright Facturation/dashboard/règlement/avoir, commande/PJ et Expenses réussis ensemble ; après harmonisation de densité du popup partagé, commande/PJ et Expenses rejoués ensemble, réussis. Expenses vérifie zones, aperçu/PJ, changement de mois/restauration, dates conservées, commentaire publié dans ActivityPanel, absence d’onglet Historique, fil visible en validation et champs financiers non modifiables côté manager ; clair/mobile sombre et popup mobile, captures inspectées. Suite exhaustive non rejouée, aucune recette NAS ; avertissement chunks et logs d’annulation/ResourceWarning conservés.


Tri des en-têtes — 14 octobre 2026 : HTableSortButton.test.ts couvre premier clic, alternance, colonne active, absence de tri Actions et format HR/options partagées ; check_list_sorting.py est ajouté à test:backend et couvre les deux directions des routes, tri prix avant pagination sur 27 produits et refus sans droit. list-sorting.spec.ts couvre les listes principales, page réinitialisée, résultat global, URL/rechargement/panneau commun et mobile sombre, avec fixtures Contacts/CRM/Employé/Notes de frais. Aucun test sur une base métier réelle/NAS. Résultats réellement exécutés dans le journal 10.


Complément tri complet — 14 octobre 2026 : audit Playwright de chaque en-tête métier (bouton présent, Actions exclue, flèche à droite ≤16 px du bord) dans les listes principales y compris personnes, AO, équipes, disponibilités et parc ; clics de critères auparavant absents, URL/panneau et mobile sombre. Tests serveur enrichis : tableaux peuplés Sales/Purchasing/Contacts/CRM/AO/Frais, sauvegarde de vues aux nouveaux critères, contrôle des droits et 32 lignes de stock réparties sur deux emplacements triées globalement sur deux pages. Régressions des filtres/synthèses, vues/navigation, AO, paiements et ordre des frais ; résultats et limites dans le journal 10. Tests unitaires supplémentaires des critères de vues et valeurs de tri RH.

Notes de frais / saisie — 15 octobre 2026 : pnpm check réussi (258 tests / 60 fichiers, lint/TypeScript/build), puis lint/typecheck final réussis. Sept tests serveur Expenses réussis (17,9 s). Playwright Expenses réussi (16 s) : Employé/Manager, description persistée et pleine largeur, bouton sous tableau, # puis Date, payeur Employé/Société, restaurant visible desktop et accessible mobile, deux justificatifs et aperçu, ordre clavier conservé après rechargement, soumission/notification/retour/validation/remboursement. Le parcours de tri principal passe aussi avec Manager. Captures desktop clair, formulaire mobile et fiche mobile sombre inspectées. Assertion analytique adaptée pour cibler le déjeuner après déplacement du parking en première ligne. Pas de suite exhaustive backend/navigateur ni de recette sur données réelles/NAS.

Notes de frais / formulaire, copie et affaire — 15 octobre 2026 : pnpm check réussi (258 tests / 60 fichiers, lint, TypeScript et build). Huit tests serveur Expenses réussis (19,4 s), dont nouveau contrôle choices.number / ligne.opportunity_number / analytique et snapshot stable après changement du code et titre CRM. Playwright Expenses final réussi (15,2 s) : géométrie Dépense/Rattachement à gauche et Catégorie à droite, champs Carburant → Train → Restaurant, code affaire dans formulaire/table, duplication préremplie sans justificatifs (original conservé, nouvelle identité et totaux recalculés), retrait de la copie, workflow complet et absence de duplication après soumission. Captures desktop clair et mobile/sombre inspectées. Suite exhaustive backend/navigateur et recette NAS non exécutées ; avertissement connu de chunks, ResourceWarning et annulations des fixtures conservés.

Véhicules des frais — 15 octobre 2026 : pnpm check réussi (258 tests / 60 fichiers, lint, TypeScript, build), puis lint/typecheck sur les derniers ajustements visuels. Douze tests PocketBase Expenses et mises à niveau réussis (30 s) : neuf scénarios métier dont véhicules, trois migrations incluant nouvelle montée depuis 1791840010 avec anciens textes/snapshots/updated et identifiants conservés, migrate up répété sans création de liens supposés. Contrôles véhicules : immatriculation normalisée unique, gestion réservée aux paramètres, REST natif verrouillé, choix de l’employé uniquement, référence étrangère/inactive et texte falsifié contrôlés, conflit de version, réaffectation/désactivation sans réécriture historique, suppression refusée. Playwright Expenses : création véhicule dans Paramètres, onglet conservé au rechargement, proposition automatique, enregistrement/réouverture d’une dépense carburant, parcours complet de frais/manager/remboursement ; captures tableau/popup/carburant desktop clair et paramètres mobile sombre inspectées. Suite exhaustive backend/navigateur et recette NAS non exécutées ; avertissement connu des chunks et logs des fixtures conservés.

Opérations / colonnes De-Vers et document d’origine — 15 octobre 2026 : pnpm check réussi (258 tests / 60 fichiers, lint/TypeScript/build), puis lint/typecheck final. Six tests serveur ciblés réussis : quatre en 9,3 s (projection réception/livraison directe/retour fournisseur/transfert, liens selon permissions, absence de prix sans Achats, tris autorisés, dropship et retour/numérotation) et deux en 4,5 s (chantier/client → stock sur retour et transfert en transit). Trois parcours Playwright réussis ensemble (48,1 s) : tris des listes, achat/commande/réception/navigation, filtres Stock et vues desktop/mobile sombre ; assertions Numéro/Date/Document d’origine/De/Vers et absence Entrepôt. Captures réception desktop clair et liste mobile sombre inspectées. Assertion de test adaptée aux en-têtes accessibles contenant aussi une poignée de redimensionnement. Pas de suite exhaustive backend/navigateur ni de recette NAS.

Ventilation Achats / popup et aperçus — 15 octobre 2026 : pnpm check réussi (258 tests / 60 fichiers, lint, TypeScript, build), puis lint/typecheck final. Suite serveur déclenchée avec FixedAnalyticTests (incluant les tests Purchasing hérités) : 29/30 passages réussis, l’ancien contrôle du premier résultat Stock visait parfois un emplacement vide. Assertion corrigée en filtrant l’emplacement de la fixture, puis six scénarios ciblés réussis (13,7 s), comprenant le cas repris, les quatre ventilations fixes et les choix commande/quote avec retrait de sales.read. Deux parcours Playwright Achats et commande client réussis ensemble (37,1 s) : popup 1 120 px, colonne Commande >300 px, quantité centrée, ouvertures des vraies fiches commande et affaire sans changement d’URL et quantité temporaire 0,5 conservée, sauvegarde/rechargement des allocations, mobile sans débordement. Captures clair/sombre/mobile inspectées. Assertion initiale de titre adaptée à « Commande numéro » de la fiche canonique. Pas de suite exhaustive backend/navigateur ni de recette NAS.

Devis / commande — géométrie du tableau (15 octobre 2026) : quote-table-layout.spec.ts reproduit d’abord l’absence de bordure d’en-tête face à celle des cellules, puis couvre l’alignement de chaque limite de colonne, bordures identiques et poignée sans trait propre, redimensionnement clavier, confirmation en commande, cadre arrondi, absence de dépassement desktop, largeurs 1600/1440/mobile et thème sombre. pnpm check réussi (258 tests / 60 fichiers, lint, TypeScript, build) ; quatre parcours Playwright réussis ensemble (44,3 s) : géométrie, sections/options/drag/actions de devis, espaces persistés et référence commande/facture avec titre et colonnes fixes. Captures inspectées en clair/sombre/mobile ; aucune suite backend ni recette NAS pour cette correction purement frontend.

Retours client / colonne Livraisons — 15 octobre 2026 : check_stock_operations.StockOperationsTests.test_customer_returns_update_delivery_tracking_and_linked_operations couvre livraison 4 puis retours multiples, net/brut/retours, absence d’effet du brouillon/annulation, conservation des retours réalisés archivés, liens filtrés par commande, absence de mélange entre commandes et quantités nulles sans inventory.read. Régressions existantes par ligne/reliquats et série rejouées. tests/auth/sales-returns.spec.ts crée une vraie livraison 4 puis retour 1, vérifie 3/4 + compteur 1, détail accessible/survol et couverture incomplète, lien vers le retour ; captures desktop clair/sombre et mobile. Les remplacements automatiques et la révision des commandes ne sont pas implémentés ni validés par ce périmètre.

Relivraison après retour — 15 octobre 2026 : test_customer_return_reopens_delivery_remainder reproduit le blocage avant correctif puis valide besoin net, source de sortie, BL réutilisé, réservation et réalisation de l’unité retournée sans dépassement. test_customer_return_updates_existing_partial_delivery_backorder couvre 2 livrés / 4 puis 1 retourné, même brouillon porté à 3 et reliquat après relivraison partielle. test_returned_serial_can_be_redelivered_on_same_order conserve le même numéro de série sans nouvelle identité. sales-returns.spec.ts prolonge le parcours au bouton Préparer la livraison, contrôle le BL de 1 unité, sa réalisation et le retour à 4/4 ↩ 1 avec action masquée.


Révisions de commande — 15 octobre 2026 : `check_sales_order_revisions.py` vérifie migration sur commande existante/rejeu, devis/snapshot initiaux intacts, identités/numéro stables, création/reclassement/suppression autorisée des lignes, quantités livrées et retours, ajustements réservations/BL, conflits d’engagement après aperçu, droits et refus d’écritures natives hors snapshot. Achats : réduction bloquée si reste attendu incompatible, hausse rouvrant le besoin sans changer le BC. Billing : factures validées inchangées, solde futur équilibré, retrait préparant un avoir brouillon avec origine/prix/TVA, rejeu et réutilisation des avoirs existants, quantité nulle pour retrait complet et validation séparée. `sales-order-revision.spec.ts` couvre entrée/sortie d’édition, annulation, duplication, récapitulatif sans perte de saisie, confirmation/persistance, recherche sur titre révisé, historique, clair/sombre/mobile et préparation d’avoir depuis une vraie facture validée. Régressions Ventes/Billing, tableaux/sections/drag et retours rejouées. Test des échéances de paiement calculé sur la date courante Europe/Paris comme le service, sans date de recette figée. Nouvelle régression Vitest des actions de lignes en édition de commande.

Régression révisions / BL brouillons et consultation — 15 octobre 2026 : check_sales_order_revisions couvre retrait avec annulation du bon vide et absence de mouvements, retrait dans un bon à plusieurs lignes, remplacement produit puis prestation libre, conservation identités/allocations et protection après réalisation, permissions Stock et aperçu périmé. Playwright sales-order-revision vérifie consultation BL et avoir dans RecordWorkspace sans changement d’URL/nouvel onglet, retour à la saisie/récapitulatif puis validation ; comparaison du popup clair/sombre/mobile. Résultats réellement exécutés et limites dans le journal 10.

Stock / numérotation différée et archivage — 15 octobre 2026 : tests serveur des brouillons manuels/automatiques IN/OUT/PREP, plusieurs numéros vides, aucune consommation à annulation/refus, numérotation concurrente à réalisation et snapshot final. Migration sur pièces numérotées existantes et compteurs inchangés puis migrate up rejoué. Régression révision : BL vide annulé/archivé, consultation par filtre Archives, restauration restant annulée, bon partiel conservé actif. Tests navigateur du popup de BL sans numéro, de son archivage et des parcours Stock/réceptions/relivraison ; résultats et limites consignés au journal 10.

Repères provisoires Stock — 15 octobre 2026 : tests ciblés vérifiant display_number MEU/IN/----- et SEV/IN/----- après changement d’entrepôt, conservation de number vide et des compteurs, aperçu HTML et numéro réel après validation ; parcours Playwright Stock/révisions adaptés aux titres et liens provisoires. Résultats réels et limites au journal 10.

Stock / couleurs d’état — 15 octobre 2026 : régression operationPresentation.test vérifiant Brouillon violet, réception fournisseur En attente ambre, exclusion des autres types et conservation Réalisée/Archivée. Parcours Stock/Achats contrôlant le ton des badges et frises, et captures de réception en clair/sombre/mobile ; résultats réels au journal 10.

Régression visuelle tableaux / logos — 15 octobre 2026 : list-sorting fournit un logo protégé sur la société liée au contact, contrôle le cadre blanc du badge dans les deux thèmes et les bordures séparées du tableau, avec captures Sociétés/Personnes desktop/mobile. quote-table-layout contrôle en complément l’alignement et les arrondis Devis/Commande après évolution du style partagé. Résultats réels et limites au journal 10.

Coins HDataTable / raccord du cadre — 15 octobre 2026 : régression géométrique dans list-sorting : cadre table 1 px, cadre viewport 0 px, première cellule à +1 px en X/Y ; échec reproduit avant correction. Capture Chromium du coin via Page.captureScreenshot avec scale=4 pour inspecter réellement l’angle, sans modifier la page ; tri/listes et géométrie devis/commande rejoués.

Audit élargi des cadres — 15 octobre 2026 : list-sorting contrôle le cadre et l’alignement de première colonne sur chaque liste principale visitée, plus les reference-table des paramètres TVA. Les parcours métier Achats/Facturation/Frais/Stock/RH et l’aperçu UX complètent les tableaux intégrés/popups. Le suivi 10 distingue les passages réussis, limites et éventuels échecs hors cadre ; ne pas présenter les tests de tri comme une validation exhaustive de toutes les variantes visuelles.


Services en commande — régressions du 15 octobre 2026 : `check_purchasing.py` couvre devis/commande mixtes, service CVS/externe/CVS Partner, matériel CVS, produit non achetable, marque historique après modification catalogue, refus de préparation forcée et DA sourcée interne, héritage de snapshot et conservation sans augmentation des achats historiques. `sales-service-tracking.spec.ts` vérifie les tirets/liens du vrai tableau, facturation des trois natures jusqu’à validation et compteurs 4/4, BL limité au matériel, absence d’actions achats/stock/livraison sur commande purement interne, rendu clair/sombre/mobile. Aucun appel comptable externe ni PDF réel dans cette recette. Les résultats et limites des passages sont consignés dans le journal du document 10.


Devis / redimensionnement — 16 octobre 2026 : `quoteColumns.test.ts` couvre l’ajustement initial, la réduction successive des colonnes de droite jusqu’au minimum, l’arrêt du geste sans élargissement, la stabilité des colonnes de gauche et du bord extérieur, le rétrécissement et la restitution d’espace, ainsi que le recalage de largeurs enregistrées excessives. `quote-table-layout.spec.ts` vérifie les montants et sous-totaux/options longs intégralement visibles (sans scrollWidth excédant clientWidth), y compris dans les inputs monétaires et après saisie à six décimales puis formatage, une tentative d’agrandissement de PTV de 180 px à la souris limitée à l’espace disponible à droite, le geste inverse au clavier puis un déplacement souris de 220 px vers la gauche comprimant les colonnes précédentes après le minimum de PTV, la stabilité du cadre desktop, la persistance après rechargement et le passage en commande. Le défilement minimal mobile reste contenu. Contrat UX canonique du document 07 ; résultat réel consigné dans le journal 10.

Lignes d’espacement / bordures — 16 octobre 2026 : le parcours `quote-table-layout.spec.ts` conserve un spacer entre deux articles, un sous-titre et une note, vide leurs descriptions dans l’éditeur puis compare les cellules de toutes les lignes aux en-têtes (colSpan=1, même nombre de cellules, mêmes limites horizontales et séparateur droit de 1 px hors dernière cellule). Contrôle en devis puis commande, consultation/édition, redimensionnement, clair/sombre/mobile. Le rendu HTML/PDF d’espacement reste distinct et inchangé.


Audit transversal des grilles — 16 octobre 2026 : `list-sorting.spec.ts` compare le nombre et les limites des cellules de toutes les lignes ordinaires aux en-têtes et vérifie la même bordure verticale, y compris pour les cellules vides. L’audit couvre les listes principales et paramètres, puis les formulaires DA/BC, factures client/fournisseur, réceptions/livraisons/transferts sur leur ligne initiale vide, en clair/sombre/mobile sombre. Les messages pleine largeur intentionnels (conditions de vente sans données) sont comptés séparément ; ils ne sont pas des lignes métier d’espacement. Rapport local `/private/tmp/horizon-table-frame-audit.json` avec lignes vérifiées et lignes fusionnées. Cet audit ne prétend pas parcourir chaque popup ou chaque document enregistré.


Priorité monétaire Devis/Commande — 16 octobre 2026 : `quoteColumns.test.ts` protège les minimums issus du contenu et vérifie le tassement des colonnes non monétaires avant les colonnes monétaires, le blocage au minimum et le cas d’un écran inférieur aux largeurs nécessaires. `quote-table-layout.spec.ts` vérifie Coût/PUV/PTV, sous-totaux Sigma et options entre parenthèses, prix à six décimales, devis/commande, redimensionnement souris/clavier dans les deux sens, rechargement et clair/sombre/mobile. Les contrôles d’ellipse des montants ont été remplacés par les contrôles d’intégrité d’affichage demandés. Aucun calcul financier serveur, arrondi métier ni PDF modifié.


Couleur des pictogrammes de suivi et rangement UX — 16 octobre 2026 : tests unitaires des nouvelles clés/couleurs CSS et validation hexadécimale ; `check_ux.py` reconstruit une base neuve, vérifie droits/concurrence/audit, sauvegarde des deux couleurs et migration idempotente héritant du texte d’en-tête sans écraser les personnalisations. Parcours `ux.spec.ts` et `quote-table-layout.spec.ts` : ordre des quatre groupes Tableaux, aperçu commun, couleur du SVG en clair/sombre, sauvegarde/rechargement et application réelle sur la commande, couleur des cellules inchangée, thèmes, onglets, défauts, concurrence et mobile. Attendre la souscription realtime du second utilisateur avant d’émettre la modification ; vérifier la bordure sur la table qui porte le cadre, pas sur son viewport.


Retour en devis / détails des pièces — 16 octobre 2026 : régressions PocketBase `check_purchasing.py` pour BL draft + DA, opérations historiques réalisées, références exactes/états, absence de transition et non-divulgation sans inventory.read/purchasing.read ; `check_billing.py` pour facture draft/validée, absence de transition et non-divulgation sans billing.read ; retour sans bloqueur via test de cycle Sales existant. `sales-order-revision.spec.ts` vérifie message, numéro provisoire, popup sans navigation ni nouvelle page, fermeture/effacement du diagnostic/focus, nouveau contrôle, clair/sombre/mobile et conservation du parcours de révision/BL historique. Les références d’opération réalisée sont simulées uniquement dans la base jetable du test de projection ; aucune modification de données réelles.


Congés L01 — régressions du 16 octobre 2026 : `check_leave.py` intégré à test:backend, bases temporaires PocketBase 0.40.4 uniquement. Allocations idempotentes/corrections, provision et réservations concurrentes, chevauchement de demi-journées, weekend et dates invalides, ventilation annuelle, snapshot après changement du calendrier, refus/reprise/retrait, annulation refusée/acceptée et restitution, archives, managers absents/compte désactivé, accréditations RH/auto-validation, historique immuable, justificatifs protégés avant/après soumission, calendrier des collègues sans motif/type/identifiant, fil/mentions corrélés. Migration depuis version antérieure avec société/employé existants conservés, migrate up rejoué, cinq types sans allocation initiale ni demande inventée.
Vitest exécute le vrai helper serveur pur leave-dates (demi-journées, DST, exclusions, années, invalidités) ; Playwright `leave.spec.ts` parcourt allocations RH, paramètres, demande avec deux fichiers et aperçu, garde de saisie non enregistrée, fiche/frise/fil, réservation, filtres cumulés conservés en URL, notification avec lien, validation manager, calendrier, annulation/restitution et archive avec ARCHIVER. Comparaison avec le vrai tableau Contacts (police/taille/bordure/fond d’en-tête), captures clair/sombre/mobile, limites du dialogue et absence de débordement de page. Régressions Access/HR, Expenses et Activity nécessaires au raccordement transversal ; recette NAS et Planning/TimeReport hors de ce parcours.


Sélecteur de date partagé — 16 octobre 2026 : `datePicker.test.ts` couvre dates civiles/bissextiles, semaines lundi–dimanche, navigation jour/semaine/mois/année, changement de mois sans dépassement, min/max/pas et dates-heures avec secondes sans changement de fuseau. `date-picker.spec.ts` exerce la sélection dans un formulaire contrôlé Employés, clavier rapide et passage de mois, retour de focus, année bissextile, effacement et bornes du popup mobile ; Congés et Notes de frais vérifient React Hook Form/ref et persistance des valeurs ISO date/mois ; Calendrier vérifie l’heure locale et son instant UTC via HZonedDateInput, ainsi qu’Échap sans application. Contrôle du composant sur les formulaires devis, DA, BC, facture client/fournisseur, réception et livraison. Parcours Congés complet maintenu, avec champs désactivés côté manager. Captures clair/sombre/mobile ; aucune migration ni règle métier serveur modifiée par ce lot UI.

Congés / jours fériés — 16 octobre 2026 : helper national confronté aux fixtures DINUM 2026–2028 ; dates mobiles, week-ends, exceptions travaillées, exclusions supplémentaires et multi-année couverts en tests purs. Tests PocketBase des compteurs réservés/consommés, snapshot figé après changement de calendrier, exceptions invalides/contradictoires et upgrade depuis 0016 avec exclusions/snapshot historiques inchangés. Playwright : fin initialement vide, calendrier ouvert sur le mois de début, semaine du 11 novembre à 4 jours, fin choisie conservée, puis persistance RHF. Paramètres contrôlés en clair/mobile, parcours complet Congés et calendrier partagé en clair/sombre/mobile. Résultats détaillés et limites dans le journal 10.

Congés / déclaration Direction : régression PocketBase de l’éligibilité relue (salarié ordinaire et direction avec responsable refusés), des droits, du solde obligatoire, des notifications RH à déclaration/annulation, de l’audit snapshot et de la restitution après changement d’organisation ; champs de contournement refusés. Playwright du circuit complet avec compte Direction self, RH global, sauvegarde/rechargement, absence de bouton manager, frise et annulation motivée. Résultats et limites réels dans le journal 10.

Paramètres Congés — régression Playwright du déplacement vers /settings/leave : absence de roue dans Congés, accès par carte Paramètres, sauvegarde/rechargement des justificatifs et exclusions, compte RH de profil user avec seul droit de paramétrage Congés, navigation limitée et refus des réglages Utilisateurs, salarié ordinaire refusé. Vérifications visuelles clair/sombre/mobile et comparaison au tableau partagé des réglages voisins ; résultats réels dans 10.

Calendrier / repères jours — tests du helper commun comparant dates et noms aux fixtures DINUM 2026–2028 ; régression serveur Congés après enrichissement du helper. API Calendrier testée avec compte sans droit Congés/CRM, passage d’année, filtres/recherche et accès anonyme refusé. Playwright des vues semaine/mois/trimestre/année : attributs et fonds distincts pour jours ordinaires/week-ends/fériés, nom du 11 novembre, création possible et absence de débordement ; captures clair/sombre/mobile. Résultats effectifs et installation dans le journal 10.

Congés dans le calendrier général : régression PocketBase sur le cycle draft → submitted → approved → cancel_requested → cancelled, refus et droits révoqués ; projection uniquement au propriétaire, sans motifs/pièces/catégorie, demi-journées aux bornes, filtres/archives/contexte AO. Parcours Chromium déclaration Direction → calendrier personnel → fiche → annulation → calendrier vide. Les tests Calendrier/Leave existants sont rejoués ; résultats et limites dans le journal 10.


Transport SMTP OAuth — diagnostic du 16 octobre 2026 : `POCKETBASE_BINARY=/private/tmp/horizon-crm-tools/pocketbase python3 tests/pocketbase/check_smtp_capability.py` réussi (1 test, 2,302 s). Instance PocketBase 0.40.4 et base temporaires, route superuser ajoutée uniquement à une copie temporaire des hooks, SMTP fictif sur loopback. Le serveur annonce XOAUTH2/PLAIN puis refuse toute authentification ; le client natif configuré authMethod=XOAUTH2 tente PLAIN. Aucun envoi ni jeton réel, aucun accès NAS. Ce diagnostic documente une limite du transport actuel, pas une validation du futur fournisseur OAuth. Nouvelle version PocketBase : relire le transport et réévaluer cette assertion avant mise à niveau.


Messagerie Graph OAuth délégué — 16 octobre 2026 : `pnpm check` réussi (lint, TypeScript, **283 tests / 64 fichiers**, build ; avertissement habituel des chunks). **17 tests Messaging** sur vrai PocketBase 0.40.4 jetable : authorization_code/PKCE, états uniques/propriétaire/expiration, scope Mail.Send obligatoire, /me exact, chiffrement et règles privées, renouvellement/rotation/revocation, génération de connexion et déconnexion invalidante, 429/Retry-After/reprises bornées, concurrence de prise en charge, perte de réponse sans retry, interrupted processing/refresh, PDF devis/BC, fichiers protégés, historique propriétaire et immutabilité. Migration 0018 → 0019 et double migrate up ; société/boîte/modèles/historiques conservés, ancienne file arrêtée. Test d’upgrade enrichi puis rejoué isolément : pièce jointe PDF protégée conservée **octet pour octet**.

Régressions PocketBase : **27 Ventes, 27 Achats et 24 Documents** réussies. Deux assertions Achats lisaient le premier entrepôt au lieu de celui utilisé par la réservation : échec reproduit sans hooks Messaging, données inspectées sur base jetable puis assertions ciblées sur l’emplacement exact ; aucune modification de logique Stock. Régression de délai outbox : comparaison avec dates SQLite normalisées, respect du prochain passage confirmé.

Deux parcours Playwright Chromium réussis (**12,8 s** au dernier passage) : expéditeur/modèle/aperçu, brouillon/rechargement/PJ/archivage, callback invalide sans requête serveur, origine incorrecte bloquée avant départ, connexion avec état d’onglet puis URL nettoyée, déconnexion confirmée. Microsoft entièrement simulé côté navigateur ; protocole backend testé avec faux fournisseur local et faux convertisseur PDF. Captures composer/liste/paramètres en clair/sombre/mobile inspectées, comparaison avec Paramètres Achats et boutons icône corrigés via taille partagée. Pas de recette réelle Entra/Microsoft/NAS/Gotenberg cible, pas de test sur la session utilisateur 5173. Logs attendus de requêtes annulées aux navigations et ResourceWarnings HTTP des fixtures conservés.


Migrations au démarrage — 16 octobre 2026 : `check_migration_startup.py` réussi sur PocketBase 0.40.4 (1 test / 0,146 s). Instance neuve temporaire démarrée avec serve et automigrate=false, aucune commande migrate préalable ; collection créée et entrée _migrations unique vérifiées via SQLite, deuxième démarrage sans réexécution. Corrige la confusion entre génération des migrations et leur exécution. Aucun accès NAS ni nouveau test frontend nécessaire.


Déclenchement immédiat Messaging — 16 octobre 2026 : pnpm check réussi (lint/TypeScript, 283 tests / 64 fichiers, build ; avertissement de chunks existant). **21 tests serveur Messaging réussis en 55,204 s** sur PocketBase 0.40.4 jetable/faux Microsoft, dont quatre nouveaux : soumission avant réponse sans attente cron, permissions send sans settings, transaction SQLite libérée pendant réseau, concurrence même worker, ciblage du seul nouveau message malgré arriéré, Retry-After préservé, interruption avant claim reprise par file, résultat incertain sans nouveau renvoi. Les scénarios de worker différé planifient le job en 2099 via un hook de fixture uniquement dans la copie temporaire des hooks ; aucune option de test ajoutée au code livré. Migration 0018 → 0019 et fichier protégé restent couverts.

Playwright : **3 parcours réussis en 15,0 s**, dont retour direct Envoyé/lecture seule du compositeur après transition simulée ; nouveau parcours enrichi pour créer son propre expéditeur puis rejoué isolément. Microsoft entièrement fictif dans ces tests ; aucun envoi réel ni accès NAS, pas de changement visuel ou nouvelle capture nécessaire pour cette optimisation serveur. Lint rejoué après dernier ajustement de fixture et git diff --check réussis.


### Régression du fil e-mail — 16 octobre 2026

`check_messaging.py` couvre la projection To/pièces des devis et BC, la reprise de l’affichage des anciens événements sans réécriture, Documents, le binaire PDF et son MIME, le lecteur autorisé à la fiche sans droit au message privé, le refus après retrait de permission, sans authentification, pour un nom absent ou une référence à un autre message. Les fichiers Messaging natifs restent interdits à ce lecteur.

`tests/auth/messaging-activity.spec.ts` utilise une vraie fiche locale et des événements/binaires simulés : destinataire, miniatures/loupe, ouverture image/PDF dans le dialogue existant, clavier/Escape/focus, absence de navigation et d’action supprimer, filtre Documents, notes ordinaires, clair/sombre et mobile. Chromium complet est sélectionné pour rendre le lecteur PDF natif ; une simple assertion iframe avec headless shell ne prouve pas le rendu. Aucun e-mail réel ni accès au NAS dans ces tests. Les résultats exécutés et les limites sont consignés dans le journal 10.


### Réponses liées et contenu du mail dans Activity — 16 octobre 2026

Vérifications locales : pnpm check (lint, TypeScript, 284 tests / 64 fichiers, build ; avertissement de chunks connu). Suite Messaging complète : 27 tests / 75,980 s ; après deux scénarios complémentaires et ajustement prudent du parent inconnu, les huit tests de réception rejoués passent en 24,652 s. Ils couvrent devis/BC, réception et notification idempotentes, concurrence/claim abandonné, droits de fiche/fichiers privés, refus de mutation des réponses, activation/scopes et reconnexion refusée sans écraser une connexion existante, exclusion du courrier sans lien/parent inconnu, pagination et descendants connus, reprise du curseur, 429 sans court-circuit de délai, rejet d’un nextLink externe, pièces refusées signalées sans perdre le texte. Quatorze tests Activity passent en 32,194 s.

Migration : test d’upgrade enrichi, **1 / 2,329 s**, passe par une base 0018 puis réellement 0019 avec connexion existante, avant 0020 appliquée deux fois ; anciennes pièces/historiques/fichiers et champs de connexion conservés (y compris access_cipher/refresh_cipher vérifiés directement en lecture SQLite), réception false par défaut, ancien envoi métier suivi une seule fois. Pas d’accès NAS/production.

Playwright : quatre parcours Messaging/Activity passent en 23,5 s : blocs texte envoyé/reçu, dépliage, contenu externe échappé, miniatures/aperçus image-PDF, droits/actions, configuration réception, OAuth simulé et envoi immédiat simulé. Nouveau paramètre également revérifié en clair/sombre/mobile (1 test / 9,1 s), tableau partagé comparé à l’écran Paramètres Achats et captures examinées. Source/auth locales réelles, événements/Microsoft simulés ; aucun e-mail réel, consentement Entra ou contrôle de boîte utilisateur effectué. Les réponses dont le parent reste inconnu ne sont pas automatiquement affectées, comme documenté en 04/08.

Compatibilité supplémentaire : absence/null des nouveaux scopes sur une connexion antérieure traitée comme send-only ; service de choix et envoi réel sur faux Microsoft passent après mise à null (**1 test / 3,070 s**), sans demande de reconnexion pour l’envoi. Le consentement Mail.Read manquant au callback ne remplace pas les jetons existants.


Diagnostic réception — 16 octobre 2026 : dix régressions de réception réussies en 30,629 s sur PocketBase 0.40.4 et faux Microsoft. Deux nouvelles vérifications : réponse non textuelle donne un libellé précis sans contenu privé, exception interne donne l’étape sans renvoi trompeur vers une reconnexion ; les deux reprennent ensuite l’import et effacent last_error. Pagination hostile demeure refusée, avec libellé propre ; droits, pièces, consentement, concurrence et déduplication rejoués. Lint réussi, diff propre. Aucune modification frontend ni schéma, donc pas de nouveau build/typecheck/parcours navigateur pour ce correctif backend. Pas de log/boîte réelle/NAS observés : cause utilisateur non identifiée.


Pagination Graph — 16 octobre : deux tests unitaires du module pur de destination (formes /me, /users et OData, ID de dossier, slash final/casse, query intacte ; refus autre utilisateur/hôte/ressource, traversées et encodages/contrôles). pnpm check réussi : lint, TypeScript, **286 tests / 65 fichiers**, build avec avertissement de chunks habituel. **12 tests réception / 36,846 s**, puis les deux nouveaux scénarios canoniques rejoués après durcissement des caractères encodés : **2 / 5,957 s**, OK. Découverte avec première page vide, copie envoyée trouvée sur un dossier/boîte par IDs, lecture de réponse ultérieure et absence de doublons ; chemin vers autre boîte rejeté sans appel HTTP. Tests unitaires rejoués et lint final/diff contrôlés. Pas de changement UI ni de nouveau parcours navigateur ; pas d’accès NAS ou d’URL réelle vérifiée.


Diagnostic de pagination P2 : pnpm check réussi (lint, TypeScript, **287 tests / 65 fichiers**, build avec avertissement de chunks habituel). Troisième test du contrôle pur : code de motif sans réflexion du compte, URL ou token. Trois scénarios de pagination serveur passent en **9,460 s**, dont code P2:mailbox et absence d’appel vers l’autre utilisateur ; reprise canonique et rejet d’un hôte tiers conservés. Aucune UI ou migration modifiée, pas de navigateur/recette NAS ; cas utilisateur exact encore non reproduit faute de motif de rejet effectif côté NAS.


### Page Activité globale — 16 octobre 2026

`check_activity.py` inclut le fil global : filtres combinés CSV, période, pagination stable 20 lignes, recherche, groupes exacts, vues auteur/tâches assignées/mentions, paramètres invalides et authentification. Sources supprimées ou malformées exclues ; vérification d’une règle de consultation source plus restrictive que module.read avant résultats et compteurs. Les suites Congés/Notes de frais vérifient également que le fil global et le dashboard n’exposent pas leurs publications privées. Dashboard reprend sa suite existante avec ce lecteur commun. Tests Messaging devis/BC et réponses vérifient recherche dans le contenu projeté, destinataires/pièces identiques au fil de fiche et absence de Cci.

Résultats locaux : pnpm check (lint, TypeScript, 287 tests/65 fichiers, build) réussi ; 16 tests Activity, 4 Dashboard, 1 Congés, 1 Notes de frais et 3 Messaging ciblés réussis. Avertissement habituel de taille des chunks au build, sans erreur. Aucune simulation de service Microsoft externe réel : transport local de test uniquement.

`tests/auth/activity.spec.ts` : parcours réel sur PocketBase jetable, entrée depuis dashboard, multisélection et recherche, page 1/2 puis 2/2 conservée au rechargement, regroupement, fiche source en popup avec URL conservée, mentions, vue personnelle, reset conservant la recherche, distinction création/mise à jour d’une tâche, clair/sombre et largeur 390 px sans débordement. Parcours réussi (4,6 s ; invocation 8,5 s) ; captures inspectées et comparaison avec Contacts. Le parcours partagé `messaging-activity.spec.ts` reste réussi (7 s) pour miniatures/loupe/PDF, texte échappé, destinataires, réponses et largeur 65 % / 100 %. Pas de recette NAS, d’envoi réel ou de mesure sur une volumétrie de production ; la limite serveur de 10 000 candidats demande de réduire la période au lieu d’un total tronqué.

Pack PocketBase unique `/private/tmp/horizon-pocketbase-activity-20261016.zip` : 247 sources hooks/migrations, instructions et manifeste ; ZIP et toutes les empreintes vérifiés, migrations historiques comparées octet par octet au dernier pack Messaging. Pas de nouvelle migration, frontend, base, Compose ou secrets. Installer les hooks puis redémarrer avec la configuration existante et le frontend correspondant ; détails 06. SHA-256 : `6f272aed9c3d2d0c1123a81a243c078c501af1fbf8669bc9155558172c1a6f79`.


### GED G01 — bibliothèque, fichiers et migrations (16 octobre 2026)

Vérifications réellement exécutées sur PocketBase 0.40.4 jetable :

- `check_ged.py` : **5 tests / 12,886 s**, réussis. Dépôt multiple PDF/TXT et transport DOCX, filtres combinés/groupes/tri/pagination 20+1, sociétés homonymes non fusionnées, concurrence de version, fichiers protégés et anciens octets conservés, impossibilité d’update/delete d’une version même superuser, archives et verrou officiel, ACL document/parent/source en intersection et compteurs/fil sans source privée, paramètres invalides et champs interdits. Rollback d’un dépôt dont le second fichier est du HTML déguisé ; audit ancien/nouveau rattachement. Upgrade depuis toutes les migrations jusqu’à 1791840020, deux migrate up successifs, conservation des données et des octets d’un logo protégé existant ; aucun élargissement d’un rôle partagé entre admin et utilisateur.
- Régressions exécutées : **12 tests Access/HR / 28,579 s**, **16 Activity / 37,856 s**, **24 Documents/studio / 74,732 s**, tous réussis. Le studio et ses versions/aperçus restent dans leur contrat ; le test PDF utilise le convertisseur local de fixture.
- `pnpm check` : lint, TypeScript, **292 tests / 67 fichiers** et build réussis ; avertissement habituel sur les chunks volumineux. Tests unitaires du service GED : refus avant repository, formats/lot/commentaire, conflit et logs sans contenu ; tests de projection PDF/image et chemins de dossiers homonymes. Lint rejoué après le dernier ajustement serveur d’audit.
- Navigateur : ensemble Activité/GED/fil e-mail **3 réussis / 22,5 s**, puis parcours GED final repris après les ajustements : **1 réussi / 5,6 s** (invocation 9,8 s). Dépôt multiple, catégorie/tags, rattachement société, aperçu image et fichier non visualisable, renommage, version 2/consultation v1, fil, archive/réactivation, recherche URL conservée, regroupement société, cartes et cache TXT ne devenant pas une fausse image, catégories en Paramètres. Captures clair/sombre/mobile 390 px inspectées ; comparaison aux paramètres Modèles de pièces, largeur mobile sans débordement. Quelques requêtes de fixtures interrompues pendant les rechargements/navigations ont produit des logs status 0 sans échec des assertions.

Limites : pas de NAS, d’envoi réel, d’OCR, de conversion Office ou de benchmark de production ; pas de recette de chaque format Office ancien. La GED G01 affiche les nouveaux dépôts ; indexation des anciennes pièces métier et raccordement depuis les fiches restent à réaliser via contrats propriétaires, sans copie silencieuse. Limites bornées décrites en 05 ; le parcours des accréditations réutilise le catalogue existant, migration administrative testée sur base peuplée.

Pack unique PocketBase `/private/tmp/horizon-pocketbase-ged-20261016.zip`, 252 sources + instructions/manifeste, ZIP et empreintes vérifiés, migrations historiques inchangées. SHA-256 `a83c29cbc4f9d53f80cbfcbf5b0a2b7081e5c3fe6288da3aaa80477abd26fd41`. Pas de frontend/base/Compose/secret ; installer la migration 1791840021 avec les hooks/frontend cohérents, voir 06. Installation NAS non effectuée.

GED G02 — 17 octobre 2026 : `check_ged.py` couvre désormais aussi les fichiers existants sans copie, la recherche multi-espaces insensible aux accents et séparateurs/catégories/dossiers, les scopes des justificatifs RH avant/après soumission, les originaux de facture et le retrait des droits source. `check_messaging.py -k test_ged_sent_quote` vérifie le PDF envoyé et le fichier reçu, rattachements affaire/client, absence de Cc/Bcc et de message privé, rejet d’un lien e-mail falsifié, maintien exact des octets historiques et révocation immédiate. Transport Microsoft/Gotenberg strictement local simulé ; aucun envoi réel. Le parcours Playwright GED ajoute la recherche d’une pièce existante avec conservation URL, la consultation seule, les cartes HDirectoryCard et captures clair/sombre/mobile ; le parcours Activité commun reste passant. Le PDF non stocké n’est pas testé comme document de bibliothèque puisqu’il n’est pas projeté. Pack G02 et consignes de mise à jour dans 06 ; aucune migration en plus de 0021.

Régression GED 404 — 17 octobre 2026 : une facture avec original protégé et `source_orders` JSON contenant une ancienne commande absente reproduisait avant correction le JSON PocketBase exact « The requested resource wasn't found. », status 404, sur GET files?space=all. Le test vérifie désormais liste et fiche 200, présence de origin.warning, octets téléchargés conservés, maintien de la référence historique en base et coexistence avec une pièce saine. La distinction absence de contexte / erreur technique se fait par une requête retournant zéro ligne, sans capture générale des exceptions ni suppression d’éléments autorisés. Pack et installation du correctif dans 06 ; cause précise de l’incident NAS non confirmée sans accès authentifié à ses données.

GED G03 — 17 octobre 2026 : tests réels de sélection Affaire/Client, facture reliée par le compte canonique, droits du contexte et des enfants, absence de consultation globale sur entrée vide, maintien du 404 historique corrigé, justificatifs RH, upgrade additive/fichiers conservés. Test de volumétrie déterministe avec 1 100 références de fichiers hors du client choisi : seule sa pièce est retournée, sans atteindre le garde-fou de 1 000 candidats ; EXPLAIN QUERY PLAN confirme l’index inverse documents_links. Mesure locale d’environ 4–5 ms sur ce cas, sans promesse de latence NAS ou de toutes les requêtes. Playwright compte les requêtes : zéro liste au démarrage, une frappe groupée E/EX/EXE déclenche une requête, aucun rechargement pour aperçu ou changement de vue. Sélecteur Client puis Affaire, dépôt pré-rattaché et restauration URL/label après reload, captures clair/sombre/mobile. Les index 0022 sont rejoués avec l’upgrade sur base antérieure ; le pack conserve toutes les migrations précédentes.

### 17 octobre 2026 — GED par pièce d’origine et régression activité dashboard

Tests unitaires : contrats de liens internes pour toutes les sources Activity (dont GED, facturation, congés/frais/parc), refus d’URL externe/inconnue/chemin ou query ajoutés ; classement serveur par type réel, IN/OUT, factures/avoirs clients/fournisseurs, conservation du devis envoyé historique, cohérence des libellés serveur/UI. Le parcours authentifié `tests/auth/ged.spec.ts` dépose une pièce GED, vérifie le groupe de provenance puis ouvre le dashboard avec cet événement récent et consulte son document depuis le résumé. La réponse ne doit plus être rejetée par le schéma frontend. Tests backend GED : référence de facture et groupe de pièce d’origine, historiques immuables et permissions inchangées. Les contrôles NAS restent distincts de ces recettes locales.

### 17 octobre 2026 — Préférences/retrait des notifications et recherche paramétrable

`check_notifications.py` couvre les accès privés et immutabilité, retrait unitaire idempotent sans suppression, retrait des seules lues, horodatage/synchronisation, préférences privées et conflit de version, mention conservée sans alerte et tâche restant notifiable si seule la mention est désactivée. Soumission/validation Congés et Frais testées avec leurs alertes désactivées ; migration d’une base précédente avec notification lue et paramètres personnalisés préservés, application répétée sans modification supplémentaire. `check_ux.py` étend ses contrôles à search_width (bornes/injection, valeur initiale, conservation des autres réglages).

`tests/auth/notifications.spec.ts` : retirer une mention, marquer une autre lue/nettoyer les lues, lien depuis la cloche vers préférences, choix persistant après reload, nouvelle mention enregistrée sans alerte, brouillon de profil conservé entre onglets, largeur réelle top bar modifiée de 840 à 600 px après sauvegarde des paramètres. Recette claire/sombre/mobile et tableau des paramètres via composants communs. Les tests Account, Messaging replies et layout/sidebar existants restent les régressions adjacentes pertinentes ; aucune relève ou émission Microsoft réelle dans ces tests.

Régression notifications de réponses (17 octobre 2026) : tests Messaging sur devis et BC fournisseur vérifiant la liste native de la cloche avec le jeton de l’expéditeur, pas seulement la présence d’une ligne via superuser. Contrôles : alerte email_replies visible, autre lecteur métier exclu, marquage lu et retrait permis, métadonnées/retrait natif immuables, perte du droit source masquant l’alerte et interdisant le retrait. Le scénario devis échoue avant migration 1791840025 (zéro résultat) puis réussit après correction.

Régression cloche bloquée (17 octobre 2026) : nouvelle route inbox testée avec 3 000 fiches sources supplémentaires sur base jetable ; alerte privée, source disparue exclue avant compteur, utilisateur étranger refusé, marquage lu idempotent et retrait. Réponse vérifiée sous 2 s localement, sans engagement de latence NAS. Messaging devis/BC contrôle aussi la projection inbox au destinataire et la disparition après perte des droits. Playwright : parcours complet existant, erreur HTTP 503 suivie de Réessayer réussi, requête maintenue bloquée expirant réellement après 15 s et sortant du chargement. Les erreurs techniques provoquées sont attendues dans ces deux tests.

Paramètres / organisation — 17 octobre 2026 : `tests/auth/settings.spec.ts` compare les six familles et leurs destinations à celles de la navigation locale, vérifie l’absence des rubriques non livrées dans cette navigation et leur repli par défaut, la recherche sans accents/rechargement, l’ouverture des résultats prévus, l’état vide, l’accès clavier aux préférences personnelles. Contrôle des 17 tuiles avec pictogrammes et accès Configurer après retour utilisateur ; capture et contrôle du cadre blanc/bordé en clair, captures sombre/mobile et absence de débordement. Le test Contacts des référentiels conserve son parcours vers CRM, Langues et combobox Contact ; attendre le recalcul du tableau après changement de viewport. Le parcours Paramètres Congés vérifie la redirection RH et l’interdiction des autres paramètres ; il dépend des utilisateurs créés par le parcours Congés précédent et doit être exécuté avec sa préparation.

### Imports Contacts R05 — pilote du 17 octobre 2026

Unitaires : CSV BOM/séparateurs/guillemets/retours internes et lignes d’en-tête, limites, zéros initiaux et mapping sans accents ; rapport CSV protégé contre l’injection de formule. Serveur `check_imports.py` : simulation sans mutation métier, application/rôles/adresse/audit, rejeu idempotent, rattachement parent entre fichiers, conservation des cellules vides, blocage de concurrence, conflits de nom sans fusion, correction/ignorance/manuelle, jobs/profils privés et CRUD natif fermé, retrait d’habilitation, lots de 25 sur 51 lignes, modes et doublons. Connecteur JSON-2 simulé : champs autorisés, clé chiffrée et non exposée, pays ISO, rattachement société/personne, domaines/méthodes refusés, redirection inter-hôte sans transmission de clé et réponse hors contrat refusée. Upgrade depuis 0025 avec société conservée, droit ajouté aux seuls admins existants et seconde application no-op. Pas de connexion Odoo réelle dans ces tests.

Playwright `imports.spec.ts` : CSV avec e-mail invalide, mapping mémorisé, absence de société avant confirmation, correction ligne, import confirmé, rapport téléchargé, résultat après reload et historique ; refus du contributeur non habilité ; classeur XLSX à deux feuilles, en-tête ligne 2, SIREN avec zéros puis personne rattachée. Captures source/mapping clair, vérification sombre après stabilisation des tokens UX, résultat mobile sans débordement. Fixture `tests/fixtures/contact-import.xlsx` entièrement fictive. Le parcours Paramètres vérifie la tuile Imports et les destinations cohérentes ; tests Contacts/Access existants couvrent les régressions des validations et accréditations.

R05 — correction Odoo du 17 octobre : unitaires de collecte 1 201 résultats et 7 pages, erreur intermédiaire, total modifié, décompte final incomplet et doublon. Simulateur serveur search_count JSON numérique, lecture 1 201 lignes et staging/DTO exhaustifs, contact avant société bloqué avec nom/référence puis rattachement après import société. Playwright : autochargement complet, compteur, modes et identité Horizon explicités, aucune poursuite lors d’une erreur de page, clair/sombre et mobile ; parcours CSV/XLSX et permissions conservés. Aucune lecture authentifiée de l’instance utilisateur par ces tests.

R05 — décisions dans Actions : parcours Chromium sur simulation réelle de 600 lignes (24 pages), sélecteur unique avec Créer distinct/Ignorer/règle automatique réversibles, choix de fiche proposée sans popup et hauteur de toutes les lignes inférieure ou égale à 40 px, pagination haut/bas et bornes, filtre vidé après résolution, absence de bouton Importer sur Sociétés/Personnes, entrée depuis Paramètres et redirection historique avec job conservé. Vérification clair/sombre et absence de débordement mobile. Les droits et services serveur restent ceux du lot R05, aucune nouvelle migration.

R05 — détail : le parcours 600 lignes vérifie aussi les 18 champs Sociétés (image comprise), largeur desktop supérieure à 950 px, accès au dernier champ par scroll, croix e-mail et absence de croix sur ID externe, navigation suivante/précédente conservant la correction vidée, borne de la fiche 600, passage de la fiche 25 à 26 entre pages puis retour, fermeture avec modifications protégée par un message visible dans le pied fixe, captures clair/sombre et accès aux champs du bas sur mobile. Les cellules vides continuent de préserver l’existant selon les tests serveur du pilote ; aucun effacement métier ajouté.

R05 — contrôles/images : tests serveur pour bulk limité à une catégorie et couvrant toutes ses pages, retour auto restaurant erreurs/conflits, permissions/propriétaire, suppression du staging seulement, refus des imports complétés/partiellement appliqués, références et fiches conservées. Images : PNG base64 vers logo et avatar protégés, rejouer inchangé sans nouveau fichier, data URL, refus SVG/contenu invalide, image_256 Odoo simulée. Unitaires de source d’image sûre/bornée ; navigateur : image décodée et problème dans la fiche, choix Ignorer dans la fiche, actions de catégorie sur 60 lignes/3 pages, retour en automatique et suppression depuis Mes imports.

R05 — diagnostic d’images : scénario Odoo simulé avec image_256 vide et image_1920 renseignée, requêtes de repli ciblées et context bin_size=false ; source avec deux fiches et une image, compteur/champs visibles et logo raster coloré de 64×64 décodé. Fixture tests/fixtures/import-logo.png, pas de donnée CVS. Cas de base64 à retours de ligne testé. Aucun accès authentifié réel Odoo CVS dans cette recette.

R05 — images compactes : vérification navigateur de la troisième colonne dans source/vérification, lignes ≤40 px et écart avec/sans image ≤4 px, miniature 24 px de contenu, aperçu au clic et mapping conservant ses indices d’origine malgré l’ordre visuel. Source contrôlée en clair et sombre/mobile.

R05 — résolutions incrémentales : tests serveur sur 600 lignes, réponse partielle de deux lignes, enregistrement indépendant strictement inchangé, chaîne de doublons libérée/rétablie après ignorance et correction, ambiguïté métier rétablie après suppression du doublon de fichier, précondition concurrente toujours bloquante avant application. Tests unitaires de fusion : conservation des 600 lignes, ordre, images, compteurs, compatibilité des réponses complètes et refus d’une préparation absente/incohérente. Mesure locale indicative, sans engagement sur la latence NAS.

R05 — validation Email/URL native : cas foo@bar..fr accepté par l’ancien contrôle mais refusé par PocketBase, couvert en sociétés et personnes ; URL avec espaces également refusée en simulation. Ancien staging testé : refus ligne 2, rollback complet sans nouvelle fiche/référence, persistance du problème et correction via resolve puis application. Import partiel de 30 lignes : 25 appliquées, erreur ligne 27 au lot suivant, conservation des 25 fiches/références, blocage et nouvelle simulation complétée sans doublons (30 au total). Unit test frontend des erreurs PocketBase avec data.email et message anglais générique, noms de champs en allowlist sans contenu interne. Parcours CSV navigateur utilise désormais cet e-mail ambigu pour vérifier le problème puis sa correction.

R05 — reprise après 409 : tests de comparaison sans fuite de valeurs (action/cible/snapshot/ancienne empreinte), revérification avant application avec conservation des choix et re-confirmation, et reproduction d’un homonyme trouvé après le premier lot de 25. Reprise privée/idempotente vers cinq lignes restantes, correction/ignorance conservées, anciens job/fiches/références strictement inchangés, nouvelle ambiguïté bloquante et résolution explicite. Refus des jobs applying/completed et des autres opérateurs ou permissions retirées. Parcours navigateur consacré au conflit après 25 lignes, message ligne 26, recheck sans fichier, cinq lignes restantes, choix maintenus, confirmation et 29 fiches au total pour 30 lignes dont une ignorée, ancien historique à 25 appliquées conservé.

R05 — refus intra-lot ligne 614 : fixture de 640 sociétés, homonymes lignes 613/614 à e-mails distincts. Nouvelle simulation : conflit 614 avant toute écriture ; ignore/correction de 613 libère 614, retour auto rétablit l’avertissement. Simulation d’ancien staging sans détection : 600 lignes appliquées, refus ligne 614 dans le lot 601–625 et rollback de ce lot, reprise de 40 lignes signalant le conflit avant confirmation puis résolution explicite et total final 640 fiches/références. Personnes : nom complet contextualisé par société, e-mail comparé avec société conservée si non fournie ; refus de contourner les doublons forts par Créer distincte. Parcours Chromium homonyme ligne 14 dans un lot : bouton Confirmer désactivé, choix explicite puis 30 créations terminées sans arrêt interne. Le scénario de reprise après 25 lignes conserve désormais un vrai changement concurrent créé après le premier lot (nouvelle société homonyme), afin de vérifier que le nouveau contrôle ne désactive pas la protection concurrente.

R05 — retrait des imports inachevés, 18 octobre : tests applying/blocked à 25/30, retrait privé et idempotent, archived_at renseigné et statut cancelled, job/lignes/fiches/références conservés, absence de l’historique et refus de toute continuation/recheck/correction sans réactivation. Import completed toujours visible et protégé. Migration 0026→0027 appliquée puis rejouée, conservation des jobs/lignes déjà appliquées et archived_at vide sur les imports existants. Parcours navigateur : corbeilles applying/blocked/preview, aucune sur completed, confirmation puis annulation/suppression, ligne disparue après reload, comptes de fiches inchangés, sombre et largeur mobile.

### Régression fusion Contacts — 18 octobre 2026

`POCKETBASE_BINARY=/chemin/pocketbase python3 tests/pocketbase/check_contact_merge.py` (PocketBase 0.40.4 jetable) : sociétés/personnes, transfert des personnes/adresses, priorité des adresses principales, union des rôles, champs et logo protégé, source archivée/verrouillée, nouvelles relations refusées, références externes réutilisées par l’import suivant, historique/audit/rejeu, droits/viewer/révocation, concurrence et rollback des valeurs incompatibles, refus de dépendances métier/chaînes. Upgrade depuis les migrations jusqu’à 0027 avec fiches et rôle admin préexistants, valeurs conservées et migration rejouée sans effet.

`pnpm exec playwright test --config=playwright.auth.config.ts tests/auth/contact-merge.spec.ts` : roue de fiche, recherche/comparaison, choix, confirmation, historique source/cible, sens inversé sur personnes et absence d’action sans droit ; captures clair/sombre/mobile et absence de débordement du document, défilement horizontal contenu du tableau comparatif sur petit écran. Tests service : droits requis et transmission des choix/confirmation. Relancer aussi les suites Contacts, Imports et accès/RH après modification des protections globales ; aucune donnée NAS/Odoo réelle utilisée.

### Assistant de fusion et Produits — 18 octobre 2026

`check_data_quality.py` sur PocketBase jetable : métadonnées minimales et pagination, noms/raisons sociales avec accents et e-mails, droits par domaine/viewer, choix interdits, concurrence, compatibilité structurelle, fusion d’offres avec historique immuable et préféré cible, alias SKU/code-barres, références externes, source verrouillée et rejeu. Cas réel de réception de quatre unités : refus d’absorber le produit utilisé, absorption du doublon inutilisé vers celui-ci sans changer mouvements ou stock. Photo protégée copiée octet pour octet, original archivé encore accessible sous droits Inventory. Upgrade depuis 0028 avec produit/offre/prix préexistants, valeurs conservées et migration rejouée sans effet. Ajouter cette suite au script backend et recetter avec check_contact_merge/check_catalog/check_access_hr.

Tests purs de merge-identities : casse/accents et noms internationaux conservés, nom usuel croisé à la raison sociale, dédoublonnage des indices, e-mail avec ponctuation significative, contexte société, marque/référence et groupe de 600 identités avec seulement 599 paires proposées. `tests/auth/data-quality.spec.ts` : aucun scan initial, suggestion justifiée, comparaison/confirmation, sélection sur deux pages/rechargement URL, accès aux produits fusionnés via service propriétaire, photo protégée, contrôle des valeurs identiques, refus sans habilitation et captures clair/sombre/mobile ; conservation des parcours contact-merge.spec.ts et contrôle du hover secondaire en sombre.


## TimeReport BE T01 — vérification

Suite dédiée : `tests/pocketbase/check_time_report.py` sur bases temporaires, native REST fermé, scopes/auteur/manager, révocation, révision concurrente, zéro/limites/periodicité, favoris privés, jours fériés, périodes de capacité et taux confidentiels, coûts figés après changement de tarif, reprise motivée, notifications, mois à cheval et rattachement réel avant-vente/commande/analytique. Migration antérieure jusqu’à 0029 puis 0030 et répétition : données Contacts conservées, aucune heure/taux/activité créée, rôle partagé isolé pour l’administrateur sans extension de droits du collègue. Tests purs des durées/civil dates et tests TimeService des droits/erreurs ; Playwright `tests/auth/time.spec.ts` couvre paramètres, saisie directe, commentaire, favori, sauvegarde/rechargement, synthèse mois, soumission/validation/fil, protection des modifications, durées invalides, clavier et déplacement persistant. Captures clair/sombre/mobile et limites réelles consignées dans le journal 10.

Régressions Analysis/Access/Notifications/Leave pertinentes ; fixture historique de projection analytique adaptée à la nouvelle table réelle (insertion uniquement dans la SQLite temporaire du test, jamais en production). Les tests vérifient l’indisponibilité d’un coût incomplet ou en devise différente ; aucune marge réelle complète inventée. Installation et recette NAS, PROD OnSite, import de ses données, planning, paie et export comptable restent non vérifiés/non livrés.


18 octobre — correction Temps internes : 10 tests serveur TimeReport (attribution même sans compte ou avec une catégorie d’achat transmise, favoris, exclusion des choix d’affaires, migration 0030→0031 avec collision de code et conservation des snapshots validés) et 31 tests analytiques fixes/Achats réussis. Deux parcours Playwright réussis avec paramètres des codes fixes, absence de combobox analytique interne, popup clair/sombre/mobile, enregistrement/validation/concurrence ; captures inspectées. Lint, TypeScript, build et 382 tests Vitest réussis. Vérifications sur fixtures temporaires, aucune recette NAS.


TimeReport — éligibilité RH et allègement du 18 octobre : 13 tests serveur TimeReport réussis (BE actif + case, refus hors équipe/non coché/Production non raccordée, managers non saisissants, conservation historique, autorisations RH, migration 0031→0032 opt-in) ; 12 tests serveur Access/RH réussis. Trois parcours Playwright Access/RH + TimeReport réussis ensemble (34,7 s), avec classement d’équipe via combobox, activation/désactivation employé, alignement horizontal de la case, grille sans titres/totaux redondants, copie/favoris, validation et refus d’accès. Captures clair/sombre/mobile inspectées. La barre d’actions avec favoris se replie sur mobile, sans débordement du document. Une ambiguïté de prénom en fixture partagée et ce débordement ont été corrigés avant la recette finale. Pas de recette NAS ni de connexion OnSite.


18 octobre — persistance du périmètre d’équipe : reproduction avant correction sur base 0031 avec hooks récents : POST équipes HTTP 200, champ time_work_type absent de la réponse et non persisté. Régression serveur : sans 0032, HTTP 503 explicite sans modifier la fiche ; après migration, sauvegarde BE et relecture du répertoire conservent BE. Le repository refuse aussi une réponse ancienne omettant le champ ou retournant une valeur différente (trois cas Vitest). Recette navigateur étendue : erreur 503 simulée conservant le popup/choix, nouvelle sauvegarde réussie, rechargement complet et réouverture avec BE sélectionné.


Catalogue / sélecteur de famille unique — 18 octobre : parcours TimeReport étendu avec produit initialement classé Équipement, changement de l’usage de sa famille dans les paramètres (produit inchangé), réapplication explicite de la famille en fiche, sauvegarde/rechargement et apparition dans le sélecteur BE. Aucun champ Nature concurrent. Captures produit clair/sombre/mobile et paramètres inspectées, alignement horizontal de la case de famille. Tests serveur : usage de famille arbitraire indépendant du nom, nouveaux produits normalisés Service sans stock/suivi, modification de paramètres sans réécriture des produits, garde de stock, migration 0032→0033 sans modification d’un produit historique.

TimeReport / synthèses — régression backend `test_overview_counts_missing_weeks_and_keeps_drafts_private` : sommes mensuelles, stabilité des indicateurs sous filtres, attentes personnelles/managers, confidentialité du brouillon puis soumission, absence d’attentes futures, désactivation RH et compte sans employé. Parcours Chromium TimeReport : cartes collaborateur/manager, clic de filtre, accès par défaut au mois/recherche partagée, captures clair/sombre/mobile et absence de débordement de page.

TimeReport matrice — `test_visual_overview_periods_privacy_capacities_and_eligibility` vérifie 7 jours/semaines du mois/12 mois, capacité et jours non travaillés, brouillons masqués et soumission/validation, cumul partiel annuel, recherche/périmètre refusé, historique après désactivation, PROD non raccordée, requêtes invalides et droits des photos. Chromium TimeReport couvre arrivée manager sans Mes temps, les trois échelles, clic année→mois→feuille, cartes personnelles et progression, recherche/tri persistants et recette de la grille existante ; captures clair/sombre/mobile et overflow de page.

TimeReport agenda — régression Chromium : 31 jours au mois, durées exactes par journée, absence des mentions de capacité, 12 calendriers annuels, lien mois et consultation de semaine, clair/sombre/mobile et défilement contenu. Le calendrier général partage HCalendarGrid : rejouer aussi `tests/auth/calendar.spec.ts` (événements, permissions, périodes, week-ends et noms de fériés). Test PocketBase TimeReport : `days` personnel et aucune journée renvoyée au manager.

TimeReport — réel et totaux hebdomadaires : test PocketBase `test_future_entry_is_refused_without_mutating_history` (heures/commentaires futurs refusés, semaine future non éditable, ancienne donnée anticipée consultable et validation refusée sans mutation). Tests overview : confidentialité/compteurs Équipe stables sous filtres. Parcours Chromium déplacé sur des dates passées pour les heures réelles ; vérifie le libellé Copier semaine précédente, copie sans heures/commentaires, refus d’ajout/enregistrement futur, absence de liens de saisie dans le futur, colonne Total alignée à droite du dimanche et cinq cartes Équipe filtrantes. Rejouer Calendrier pour le slot hebdomadaire partagé.

TimeReport — régression contre le clignotement des filtres : intercepter la réponse overview au clic Validées, vérifier avant libération que le compteur conserve 3:30, que le tableau existant est encore connecté au DOM et qu’aucun compteur n’est passé à « — » via MutationObserver ; la nouvelle liste n’apparaît qu’après réponse. Vérifier aussi l’espace entre dimanche et Total (au moins 8 px) et leur alignement vertical.

Espacement des fils — 18 octobre 2026 : lint, TypeScript, build et 10 tests Vitest UX réussis. Suite PocketBase UX : 10 tests réussis (29,841 s), bornes 0–128, refus fractions/CSS, persistance, droits/concurrence/audit existants, migration additive rejouée sans écraser les préférences. Chromium UX + TimeReport : 8 tests réussis (52,6 s), aperçu partagé à 0/48 px, sauvegarde/rechargement, application sur fiche Contacts en clair/sombre/mobile et TimeReport avec fil sous les lignes. Captures examinées ; aucune recette NAS réelle. Avertissement de taille de chunk existant au build.

Couleurs des cadres de zones — 18 octobre 2026 : lint, TypeScript, build et 11 tests Vitest UX réussis ; 11 tests PocketBase UX (33,439 s), dont deux couleurs, refus CSS/hex abrégé, persistance et migration rejouée conservant les valeurs personnalisées. Chromium UX : 7 tests réussis (34,7 s), aperçu clair/sombre isolé, application aux cadres Contacts, séparation des bordures de champs/tableaux, persistance, restauration et mobile sans débordement. Captures examinées. Aucune recette NAS ; avertissement de taille de chunk préexistant au build.

Complétude des paramètres UX — 18 octobre 2026 : lint, TypeScript, build et 388 tests Vitest/83 fichiers réussis ; 12 tests PocketBase UX (36,490 s), dont dimensions/cartes/recherche/champs, refus des valeurs hors limites et CSS libre, sauvegarde/migration additive rejouée conservant les préférences et taille JSON inférieure à 10 Ko. Chromium final UX + Employés/accès + TimeReport : 11 tests réussis (1,3 min), couvrant aperçus réels, brouillon conservé entre onglets, conflit concurrent, sauvegarde/rechargement, application des cartes/synthèses/recherche/champs, recherche fonctionnelle contextuelle et globale, photo RH/droits et TimeReport. Captures clair/sombre/mobile examinées. Les essais ont révélé une ancienne surcharge CSS des champs corrigée et une attente de rendu d’onglet à préciser dans le test ; recette finale sans modification des sources pendant le parcours réussie. Aucune recette NAS réelle ; avertissement de taille de chunk préexistant.

Activité personnelle du dashboard — 18 octobre 2026 : lint/TypeScript et build réussis ; 17 tests PocketBase Activity (48,323 s), 4 Dashboard (11,750 s), puis régression personnelle finale (1 test, 3,094 s). Vérifications : auteur/mention/tâche, exclusion d’un collègue sans lien malgré fiche accessible, query team sans effet sur le résumé, vue collective distincte, retrait de permissions et source supprimée. Chromium Dashboard/Activité/GED final : 4 tests réussis (31,0 s), lien personnel et navigation collective, dépôt GED visible, parcours existants. Captures clair/sombre/mobile examinées ; ancien libellé de test Afficher Commandes adapté à Commandes clients après premier essai. Aucun test NAS réel ; avertissement de taille de chunk préexistant au build.

Finition du tableau TimeReport — 18 octobre 2026 : lint/TypeScript/build réussis, puis lint ciblé et compilation Vite finale après ajustement des actions/pied. Chromium TimeReport final : 2 tests réussis (26,0 s). Comparaison des en-têtes avec Contacts, densité de ligne ≤38 px par défaut, durées centrées/couleur héritée, actions contenues, total aligné à droite, pied sans double bordure et libellé aligné aux colonnes fixes après scroll horizontal, consultation sans inputs ni colonne Actions. Saisie/clavier/commentaires, sauvegarde, déplacement, états/validation, conflits et droits toujours couverts. Captures clair/sombre/mobile examinées. Un premier essai attendait un input disabled après soumission ; attente adaptée à la nouvelle consultation textuelle. Aucun test serveur spécifique rejoué pour ce changement frontend, aucune recette NAS ; avertissement de taille de chunk préexistant.

Colonnes de consultation — régression du 18 octobre : `pnpm exec vitest run src/shared/ui/tableColumns.test.ts` couvre colonnes requises, ordre, visibilité et évolution des définitions. `POCKETBASE_BINARY=... pnpm exec playwright test --config=playwright.auth.config.ts tests/auth/table-columns.spec.ts` vérifie souris/clavier, maintien du panneau quand son dernier en-tête est masqué, persistance et restauration, tri URL, deux groupes synchronisés, comptes distincts dont lecteur, erreurs de stockage et rendu clair/sombre/mobile. Contrôler aussi les listes Achats/Stock et les filtres par cartes après une modification de HDataTable. La sauvegarde inter-navigateurs nécessite la migration 1791840037_table_preferences.js et les routes privées du pack. `python3 tests/pocketbase/check_table_preferences.py` vérifie règles verrouillées, compte/rôle/module, bornes, audit, concurrence et persistance après redémarrage. Les tests Chromium ouvrent un contexte vierge pour le même compte, reprennent un ancien réglage local et vérifient le conflit sans écrasement.


Extension des colonnes — 18 octobre 2026 : régression du résolveur couvrant visibilité obligatoire indépendante de l’ordre, nettoyage des anciens identifiants et colonnes complémentaires masquées à leur arrivée puis respect du choix explicite. Chromium couvre le déplacement clavier d’une identité obligatoire, son lien de fiche, le rétablissement par défaut et l’ajout/retrait de colonnes métier sur quinze vues (Sociétés, Personnes, CRM, AO, devis, commandes, BC, DA, factures, produits, stock, entrées, inventaires, employés, équipes). Les listes Congés et Notes de frais reçoivent leurs définitions supplémentaires mais n’ont pas été parcourues avec des demandes/notes réelles dans cette vérification.


Colonnes proposées — 18 octobre 2026 : pnpm check réussi (lint, TypeScript, 400 tests Vitest / 87 fichiers, build), puis lint/TypeScript ciblés et build final réussis ; avertissement de taille de chunk préexistant. Trois tests PocketBase `check_table_column_policies.py` réussis (8,602 s) : base reconstruite/migration rejouée, valeurs par défaut, audit, restauration sans exclusions, préférences personnelles intactes, reprise après redémarrage, refus lecteur/utilisateur avec simple grant settings.references, règles REST fermées, compte inactif, validation/concurrence et variantes opérationnelles. Trois tests Vitest spécifiques : catalogue unique/identité, politique commune des flux et validation/service. Chromium final : huit tests réussis (54,3 s), dont quinze vues de consultation, filtres/cartes/Stock/Achats et réglage administrateur appliqué à un autre compte avec réactivation retrouvant les préférences. Recette administrateur isolée rejouée (1 test, 11,3 s) avec brouillon entre tableaux et comparaison Séquences. Captures clair/sombre/mobile examinées. Premier essai du nouveau parcours corrigé pour utiliser le rôle accessible combobox ; aucun échec final. Aucun test NAS ni modification d’une base réelle.


Largeur des colonnes / espacement — 18 octobre 2026 : pnpm check réussi (lint, TypeScript, 400 tests Vitest / 87 fichiers, build), puis lint ciblé et build final après les minimums de lisibilité. Chromium final : neuf tests réussis (1,0 min) sur préférences, quinze vues, politiques administrateur, cadres Achats, Stock et cartes. Nouvelle régression : treize colonnes Contacts avec longues coordonnées, contrôle des rectangles de texte dans les cellules et largeur complète sur desktop ; mobile sans débordement de page et ligne de moins de 220 px ; montant de stock 1 234 567 890,12 € insécable et entier, opérations redimensionnables avec colonnes Motif/Modifiée le ajoutées, écart sélecteur/titre AO ≥12 px. Réponses Stock/Opérations simulées et validées par les schémas frontend ; aucun stock réel modifié. Captures clair/sombre/mobile examinées. Aucun test serveur spécifique, schéma/API inchangés ; avertissement de chunk préexistant au build.


Redimensionnement partagé — 18 octobre 2026 : pnpm check réussi (lint/TypeScript, 404 tests Vitest / 88 fichiers, build ; chunk préexistant). Calcul fit/resize mutualisé, tests historiques devis inchangés et réussis ; régression de largeurs conservées au masquage/réordre. Cinq tests PocketBase de préférences réussis (15,801 s), incluant largeurs optionnelles, ancien format, refus type/bornes, relecture après redémarrage, révision/concurrence/audit/isolation et REST verrouillé. Chromium final : 12 parcours colonnes/cadres/filtres/stock/devis réussis ; audit tri et cadres multi-pages rejoué avec succès (1 test, 41,4 s) après adaptation des sélecteurs pour distinguer tri et redimensionnement. Deux parcours ciblés finaux réussis (16,8 s) : fort déplacement protégeant 1 234 567 890,12 €, bord fixe, souris/clavier/focus, restauration double-clic, panne 503 avec rollback et erreur hors popup, persistance/rechargement/navigateur vierge et poignées sur CRM/Ventes/Achats/Produits/Stock/Employés. Captures clair/sombre/mobile examinées. Les références d’en-tête du test de tri contrôlent l’icône à droite du bouton de tri, indépendamment du bouton Colonnes. Aucun NAS réel testé.


Acomptes / taux — 18 octobre 2026 : migration additive 0039 exécutée sur bases jetables via check_billing.py ; préparation, recalcul sans écriture, taux 0/101 refusés, quantités d’origine protégées, persistance, ancien brouillon, acompte/solde et avoir partiel, fournisseur et immutabilité. Régression spécifique check_sales_order_revisions.BillingOrderRevisionTests.test_pending_deposit_credit_does_not_cover_invoiced_units. Chromium billing.spec.ts et quote-table-layout.spec.ts : ligne de titre, taux 30→40, relecture, quantités, notes, boutons partagés, aperçu et clair/sombre/mobile. Limites : aucun envoi réel, Gotenberg réel ni recette NAS pour cette évolution. Résultats chiffrés dans le journal 10.


Pagination adaptative — 19 octobre 2026 : listPageSize.test.ts couvre hauteurs/densités, colonnes de cartes, minimums/plafond et valeurs manuelles. check_list_sorting.py vérifie perPage=50, pages disjointes et totaux de 61 sociétés avec/sans regroupement, refus 0/101/non-entier et accès sur les routes de listes. list-page-size.spec.ts recouvre 90 sociétés, écran haut/bas, manuel 50, rechargement, groupes, cartes, sombre/mobile et absence de recouvrement du bouton de création. Audit list-sorting.spec.ts rejoué sur les principales listes. Résultats et limites réels consignés au journal 10 ; aucune recette NAS.

### Dashboards modulables — 19 octobre 2026

Vitest layouts : placement sans chevauchement sur 12 colonnes, ordre stable, minima/maxima et tailles aimantées, déplacement sans mutation, validation stricte et cohérence du défaut. `check_dashboard_layouts.py` : défaut, persistance après redémarrage, isolation de deux comptes, REST verrouillé, allowlists/bornes/doublons/défaut, comptes et rôles inactifs refusés, audit et concurrence 200/409. Ajouté à test:backend.

Playwright `dashboard-layouts.spec.ts` : ajout/retrait, configuration, taille au clavier et au pointeur, vrai drag à la souris et au clavier, rectangles sans chevauchement, sauvegarde, conflit injecté avec brouillon conservé, défaut, nouveau contexte navigateur sans préférence locale, rechargement, annulation, copies multiples et suppression indépendante. Régression `dashboard.spec.ts` conservée pour carrousel, navigation, création réelle d’affaire/devis/commande, montants/marges/courbes, activité et échéances. Captures du mode édition, clair/sombre/mobile et comparaison de densité avec la référence Contacts examinées.

Validation finale : pnpm check réussi (lint, TypeScript, 414 tests / 91 fichiers, build ; avertissement de chunk préexistant), 4 tests layouts et 4 tests Dashboard PocketBase réussis, 3 parcours Chromium réussis (21,1 s). Premiers essais ont permis de corriger les attributs d’accessibilité DnD restés sur les cartes et l’abonnement tardif aux indicateurs lors du chargement des préférences. 409 attendu injecté et annulations de navigation status 0 journalisés dans les parcours réussis. Aucune recette tactile matérielle, Safari ou NAS ; pas de campagne de charge réelle.

### Notes de frais — matrice Équipe, 19 octobre 2026

Fonctions pures : trimestres civils/années/navigation décembre, mois futurs et hors emploi, distinction Non reçue, plusieurs états/compléments, somme en centimes sans double comptage et exclusion des annulations. Check final lint/TypeScript/417 tests Vitest (92 fichiers)/build réussi ; avertissement Vite de chunk préexistant.

Suite PocketBase expenses complète : 14 tests réussis (47 s), dont deux nouveaux scénarios de suivi (roster/absence de note, brouillon privé sans ID/total en reports, scope self refusé, réaffectation, all, pagination/recherche équipe insensible aux accents, trimestre/année, états mixtes, compléments, archives, inactivation, bornes et allowlists), et workflows/justificatifs/snapshots/migrations précédents conservés. Première fixture d’équipe corrigée pour fournir son code requis, sans modification du modèle.

Chromium : quatre parcours Frais Équipe/Frais complet/TimeReport complet/refus sans habilitation réussis (48 s). Suivi final rejoué après finitions de la saisie d’année et du retour à la ligne des détails : un parcours réussi (9,2 s). Test Équipe sur vraies notes soumises/validées/retournées/remboursées et brouillon privé, vérification des compléments, du TTC, de la recherche, des cartes, du retour de fiche, des 12 colonnes, clair/sombre/mobile et absence de débordement. Captures inspectées et comparées au suivi TimeReport et à la référence Contacts. Sélecteur de test corrigé vers searchbox ; assertion de densité verticale TimeReport adaptée à la différence préexistante de padding horizontal entre consultation configurable compacte et grille éditable, aucun changement de style de la grille de saisie. Requêtes invalides/503/409 injectées et messages de services lors des déconnexions sont journalisés par les parcours existants ; pas d’erreur JavaScript non interceptée. Pas de campagne de charge réelle, recette NAS ou Safari/tactile matériel.

### Fusion Sociétés avec historiques — recette locale du 19 octobre 2026

- `pnpm check` réussi : lint sans avertissement, TypeScript, **418 tests / 92 fichiers** et build. Avertissement Vite préexistant de taille de chunk conservé ; aucun ajout de dépendance.
- `check_contact_merge.py` : **18 tests / 54,097 s**, bases PocketBase jetables. Deux historiques clients/fournisseurs, devis et commandes, champs/snapshots/HTML de factures et commandes strictement identiques, adresses originales conservées/copies, brouillons réaffectés et versions invalidées, prix/offres/historiques inchangés, alias successifs et références externes, filtres CRM/Ventes/Achats/Billing, création de devis/commande/acompte après fusion, avoir et règlement entre anciens IDs, unicité de facture fournisseur dans toute la famille, tâches modifiables, GED et ACL d’origine, relations inconnues bloquantes, recontrôle/rejeu et permissions. Défaillance SQLite volontaire d’un propriétaire : rollback du client, contacts, factures et audit de fusion vérifié.
- Régressions sur bases jetables : Sales **27**, Purchasing **27**, Billing **22**, GED **11**, CRM **15**, AO **16**, Activity **17**, Calendar **3**, Qualité des données **8**, Expenses **14** ; **178 cas backend distincts**, dont les 18 fusions, vérifiés. Trois suites et l’upgrade Produits ont initialement rencontré des fixtures anciennes : sélection du compteur CRM par entity_type au lieu de la première séquence, jours fériés publics distingués des événements CRM privés, contrôle des seuls droits GED dans un rôle partagé déjà affecté par les migrations Contacts, construction des données Produits sous leur ancien schéma avant 0033. Ces fixtures ont été corrigées sans assouplir les services ; les cas concernés ont été rejoués et réussis. Le filtre AO réutilisé par Calendar reçoit désormais son app explicitement ; Calendar et AO ciblé réussis.
- Chromium authentifié : **4 parcours / 20,1 s**, comparateur sociétés/personnes, absence d’action sans droit, société avec opportunité antérieure, fenêtre des pièces réellement visibles et en-têtes sans recouvrement, historique volontaire et redirection automatique de l’ancienne URL ; parcours facture/validation/règlement/avoir. Clair desktop, sombre et mobile 390 px du comparateur, capture de la fenêtre de liens mobile sombre inspectée. Popup partagée avec Billing, pas de nouvelle variante de tableau. Annulation d’une requête Contacts pendant une redirection observée (status 0), sans échec de parcours. Pas de recette exhaustive de chaque popup, de Sage/SUPER PDP/Microsoft réels ou du NAS.
- Pack cumulatif `horizon-pocketbase-fusion-historiques-20261019.zip` : ZIP, manifeste, SHA-256 de chaque entrée et identité des migrations avec le pack précédent vérifiés. Aucune migration supplémentaire de fusion, migration cumulative maximale 1791840040. Installation distante non effectuée.

### TimeReport — correction manager avant validation, 19 octobre 2026

`pnpm check` réussi : lint, TypeScript, 419 tests Vitest / 92 fichiers et build ; avertissement Vite de taille de chunk préexistant. Service : correction avec time.validate sans time.write, refus des writers sans validation et des viewers.

Suite PocketBase finale : **19 tests réussis / 57,563 s** sur bases jetables ; correction refusée en draft/validated, auteur/autre utilisateur, scope self, droit révoqué, source OnSite/PROD ; manager sans saisie personnelle et valideur global autorisés. Motif obligatoire, zéro durée/plus de 24 h refusés, identités conservées, révision incrémentée, conflit correction/validation, propriétaire verrouillé, audit avant/après et notification vérifiés. Test complémentaire : auto-review après changement de compte/employé refusée, panne volontaire de notification provoquant rollback de la feuille/lignes/entrées/audit/activity/notifications, ajout/ordre/retrait d’activités conservés et entrées submitted au nom du collaborateur. Une fixture préexistante de dates futures créait deux feuilles sur la même semaine quand demain et aujourd’hui partagent leur semaine ; réutilisation de la feuille courante sans assouplir les contrôles métier.

Chromium authentifié : deux parcours réussis / 28,5 s, dont saisie propriétaire, suivi équipe, correction manager 1:30 → 2:00, motif, absence des favoris/copie personnels, validation désactivée avant sauvegarde, maintien À valider, rechargement, annulation du mode puis validation, fil et notifications. Captures clair/sombre/mobile inspectées, absence de débordement de page ; même grille et contrôles partagés. Refus 503/409 injectés volontairement et journalisés, aucune erreur JavaScript non interceptée. Aucun accès à la base utilisateur, test Safari/tactile matériel ou recette NAS. Pack cumulatif ZIP/manifeste/hashes vérifiés ; seules modifications serveur depuis reference-commande : time-common.js, time-report.js, time-report.pb.js. Aucune migration supplémentaire.

TimeReport — alignement des zones multiligne (19 octobre 2026) : lint et TypeScript réussis ; deux parcours Chromium réussis / 27,1 s après un premier échec transitoire à l’ouverture d’une fiche RH, avant les champs concernés. Contrôles géométriques des popups commentaire et motif : libellé/champ/en-tête alignés, espacement et padding, hauteur rows respectée, absence de débordement mobile ; captures clair/sombre/mobile inspectées. Parcours correction et validation toujours fonctionnel. Aucun changement serveur ni nouvelle campagne backend pour cet ajustement de présentation.

### Congés — calendrier en frise, photos et navigation RH, 19 octobre 2026

- `pnpm check` réussi : lint, TypeScript, **423 tests / 94 fichiers**, build (avertissement Vite de chunk préexistant). Lint/types rejoués après la dernière précision du placeholder de recherche. Fonctions pures : semaine traversant année/mois, année bissextile, DST, bornes hors période et demi-journées ; navigation : visibilité des sous-menus personnels/manager/RH et conservation des enfants Contacts/Ventes pour les non-administrateurs.
- Suite PocketBase Congés finale : **14 tests réussis / 46,369 s**. Deux tests supplémentaires sur périmètres team/company et révocation, roster sans absence, recherche, pagination 50/6 sur 56 ressources, projection minimale et ID/lien de demande expurgés pour demandes non consultables, demi-journées, férié et totaux distincts pending/approved, photo PNG exacte/no-store, 204 sans photo, 401 anonyme, 403 hors périmètre et après réaffectation du responsable. Workflows, allocations, snapshots, justificatifs et upgrades précédents réussis. Aucune lecture/mutation de la base NAS.
- **Sept parcours Chromium distincts réussis** sur bases temporaires : quatre Congés (workflows, déclaration direction, accès paramètres dédiés et nouvelle frise), deux TimeReport dont avatar partagé, un suivi Frais Équipe. Après premiers essais, correction du z-index de l’identité d’en-tête fixe sur mobile et attente du chargement de la fiche avant clic du breadcrumb dans le scénario. Quatre parcours Congés finaux : **35,4 s** ; nouvelle frise rejouée seule après précision du placeholder et stabilisation des couleurs du thème : **8,4 s**. Deux équipes/six personnes, trois demandes, photo visible/décodée et initiales, sélection Équipe/Entreprise, confidentialité, recherche URL, navigation semaine/mois, retour de fiche, jours fériés, absence de débordement, nom/en-tête fixes après défilement horizontal, sous-menus restreints et notes de frais accessibles. Captures clair/sombre/mobile inspectées. Certaines premières captures immédiatement après bascule de thème montraient encore les couleurs de boutons du thème précédent ; captures finales après stabilisation vérifiées, aucune refonte du moteur de thème engagée.
- Annulations de requêtes status 0 lors de changements de page/déconnexion et 503/409 volontaires du parcours TimeReport journalisés, aucune erreur JavaScript non interceptée. Aucun test Safari/tactile matériel, campagne de charge ou recette NAS. Pack cumulatif ZIP/manifeste/hashes vérifiés ; migrations inchangées, seuls leave.js et leave.pb.js modifiés depuis le pack temps-correction-manager.

Congés — contraste de frise, 19 octobre 2026 : reproduction navigateur avant correction, backgroundColor des barres = rgba(0,0,0,0) en clair, token --theme-surface absent sans fallback. Après correction CSS partagée, parcours Chromium frise/avatars/périmètres réussi / 8,6 s ; assertions sur toutes les barres en clair et sombre : alpha 255, contraste texte/fond ≥ 4,5:1, graisse ≥ 600 et repère gauche 3 px. Captures clair/sombre/mobile inspectées, fond désormais plein et grille moins présente. Lint/TypeScript et diff --check réussis ; aucun changement serveur, nouveau pack ou test backend supplémentaire.

Congés — libellé complet et popup de barre, 19 octobre 2026 : pnpm check réussi (lint, TypeScript, 423 tests / 94 fichiers, build avec avertissement de chunk préexistant). Deux tests PocketBase ciblés / 6,426 s : type_label fourni au manager autorisé, absent pour les collègues, pas de motif/type médical via la projection publique, contrôles de périmètre/totaux conservés. Trois parcours Congés historiques réussis lors de la première passe (workflow et lien depuis popup, direction, paramètres dédiés) ; nouveau parcours corrigé puis réussi / 10 s, et rejoué après placement du pied hors défilement / 9,8 s. Contrôles : texte Nom/Type/Durée exact, popup sans navigation, dates/durée/manager/commentaire autorisés, fermeture/Échap et retour du focus, maintien de l’URL, collègue voyant Absence sans détail privé ni requête record, couleurs/contraste antérieurs conservés et pied accessible sur mobile. Un label explicite de textarea et le retour de focus manuel ont été ajoutés pendant la recette. Captures clair/sombre/mobile et aperçu limité inspectés. Lint/types finaux rejoués après la dernière finition. Pas de recette NAS/Safari/tactile matériel, ni nouvelle batterie complète backend (mapping de projection seul modifié, route record existante). Pack cumulatif ZIP/manifeste/hashes vérifiés, migration maximale 0040 inchangée et seul leave.js changé depuis conges-frise.

Congés — texte normal et nature, 19 octobre 2026 : parcours Chromium frise/popup réussi / 10,1 s ; graisse 400 exacte sur toutes les barres en clair/sombre, contraste/opacité conservés, libellé complet avec Sans solde et durée, champ Nature du congé dans la popup et confidentialité des collègues vérifiés. Capture claire inspectée, captures sombre/mobile produites par le même parcours. Lint/TypeScript et diff --check réussis. Serveur inchangé, pas de nouveau pack ; les données de nature requièrent les hooks conges-detail déjà livrés. Aucun contrôle de leur installation sur le NAS.

Congés — couleurs par collaborateur, filtrage par période et Total, 19 octobre 2026 : pnpm check réussi (lint/TypeScript/424 tests dans 94 fichiers/build, avertissement de chunk Vite préexistant). Test pur : attribution dans la palette partagée stable indépendamment de l’ordre des lignes. Suite PocketBase finale **14 tests / 44,596 s** : seuls les employés ayant une demande visible active sur l’intervalle sont projetés, brouillon privé et période sans congé exclus ; pagination sur 53 personnes avec congés, total quotidien sur toutes les pages, photos/scopes/confidentialité et workflows conservés. Fixture SQL de pagination corrigée pour fournir les clés idempotentes uniques requises par les demandes.

Chromium **4 parcours / 37,6 s**, fil et popup conservés, équipes/entreprise et absence de personnes sans congé, période vide et navigation semaine/mois, couleurs inchangées après rechargement, attente en contour pointillé et contraste/texte normal préservés. Total exact, centre horizontal de chaque chiffre aligné avec le jour (<1 px) et centre vertical avec le libellé (<2 px), captures clair/sombre/mobile inspectées. Requêtes annulées 0 et erreurs volontaires des scénarios existants journalisées sans erreur JS non interceptée. Pas de recette NAS/Safari/tactile matériel/charge. Pack cumulatif vérifié : ZIP/manifeste/hashes et migrations identiques, seul lib/leave.js modifié depuis conges-detail.

### 19 octobre 2026 — Congés, ligne Total simplifiée

Lint et TypeScript réussis. Chromium ciblé `leave-timeline.spec.ts` : 1 parcours réussi (10,3 s au total), valeurs 1 / 1,5 conservées, jours vides sans tiret ni zéro, fond identique sur toutes les cellules du pied en clair/sombre et suppression du pseudo-élément graphique. Mesures de centrage horizontal/vertical existantes réussies ; captures clair/sombre/mobile inspectées. Pas de modification serveur ni nouvelle exécution backend ; NAS/Safari/tactile matériel non vérifiés.

### 19 octobre 2026 — Congés, cohérence des bordures du Total

Lint et TypeScript réussis. Chromium ciblé `leave-timeline.spec.ts` : 1 parcours réussi / 10,2 s. Régression ajoutée : grille et colonnes du pied de même couleur et largeur 1 px, bord haut du pied unique, aucun bord bas doublé sous la dernière ligne ou sur le cadre extérieur. Contrôles exécutés dans les deux thèmes ; captures clair/sombre/mobile inspectées. Pas de modification serveur, aucune nouvelle suite backend ; NAS/Safari/tactile matériel et zooms système non vérifiés.

### 19 octobre 2026 — Fusion, conflits juridiques détaillés

Lint/TypeScript réussis ; suite PocketBase Contacts Merge : 19 tests / 59,710 s. Assertions des trois champs, deux valeurs/noms/rôles, SIREN issu du SIRET, refus apply 409 sans fusion. Chromium ciblé : 1 parcours / 6,4 s, texte exact, bouton désactivé, message visible après défilement et sans débordement mobile ; captures clair/desktop et mobile inspectées. Premier essai corrigé pour attendre la fiche chargée et inclure le SIREN dans le libellé du sélecteur ; aucun changement produit pour cela. Pas de nouvelle recette sombre/Safari/NAS. Pack fusion-identifiants cumulatif contrôlé par ZIP/manifeste/hashes et comparaison des migrations, seul contact-merge.js différent du pack précédent.

### 20 octobre 2026 — Préférences personnelles des compteurs

pnpm check réussi : lint, TypeScript, 432 tests / 95 fichiers, build (avertissement de taille des chunks préexistant). Lint/types finaux et diff --check réussis. displayPreferences.test.ts couvre zéro, valeur indisponible/non finie, négatifs/fractions et validation stricte. Suite locale check_display_preferences.py : 3 tests / 7,664 s, migrations complètes sur bases neuves, défauts, persistance après nouvelle authentification, isolation, API natives fermées, injection user/valeurs/champs refusée, compte/rôle inactifs, conflits sans écriture et audit. Son exécution est ajoutée à test:backend. Probe générique de démarrage des migrations : 1 test / 0,139 s, appliquée une fois avec automigrate=false ; ce probe ne constitue pas une migration de données NAS.

Chromium : trois parcours Mon compte / photos / préférences réussis en 24,1 s, puis parcours compteurs final 16,5 s incluant deux navigateurs pour le même compte et un autre utilisateur, annulation/sauvegarde/rechargement, masquage conservant les raccourcis, option de couleur désactivée/réactivée, KPI du dashboard visibles. Couleurs neutre/non nulle réellement distinctes mesurées en clair/sombre, captures cartes et Mon compte inspectées, responsive 390 px sans débordement. Conflit de noms de fichiers corrigé avant validation ; test attend les valeurs chargées plutôt que le tiret transitoire. Logs de requêtes Contacts interrompues lors des navigations et erreur 400 volontaire du test Mon compte conservés, aucune erreur page JavaScript. Pas de suite backend globale relancée, ni de recette Safari/tactile matériel/NAS.

Pack cumulatif /private/tmp/horizon-pocketbase-affichage-compteurs-20261020.zip : 323 sources / 325 entrées, 1087892 octets, SHA-256 33583ff1419890da020377ec89429f88b84e14b0f370a048b119e0d9dae3830a. ZIP, manifeste et hashes vérifiés ; migrations antérieures inchangées ; seuls account.pb.js et nouveau lib/display-preferences.js changent dans les hooks depuis fusion-identifiants, nouvelle migration additive 0041. Aucune installation NAS effectuée.

### 20 octobre 2026 — Renommage Préférences et cases roses

Lint/TypeScript et diff --check réussis. Chromium compteurs : 1 parcours / 15,9 s ; onglet Préférences sélectionné et accent-color rgb(245,47,150) mesuré sur les deux cases, sauvegarde/navigation/isolation toujours vérifiées. Captures clair/sombre/mobile produites, clair/mobile inspectées. Modification frontend seule, aucun nouveau test serveur ni pack requis. Audit en lecture des paramètres et préférences locales : aucune migration ni déplacement de réglage effectué. Pas de recette NAS/Safari/tactile matériel.

### 20 octobre 2026 — Préférences regroupées, confort et signatures personnelles

pnpm check réussi après regroupement : lint, TypeScript, 441 tests / 95 fichiers, build (avertissement Vite de taille des chunks préexistant). Lint/types et build finaux après libellé explicite Société réussis ; diff --check sans erreur. Fonctions pures testées : héritage sans override, lecture des anciens JSON, densités, limites de largeur et valeurs de thème. Suites locales par découverte check_*preferences.py : 9 tests / 25,466 s (4 affichage/confort + 5 tableaux), signatures personnelles : 3 tests / 9,369 s. Ancien client deux booléens conserve les overrides ; révisions et champs invalides refusés, comptes/rôles inactifs, propriété des signatures, absence de modification de la société, Tiptap/variables fermés et signature de brouillon inchangée vérifiés.

Chromium : passe d’ensemble 9 scénarios, 8 réussis / 1 échec de signature administrateur ; derniers deux parcours Préférences et signature société ensuite réussis / 13,4 s après correction du libellé Société et du sélecteur de bouton Fermer dans le test. Les huit autres couvrent Mon compte, photos, compteurs, notifications, timeouts/erreurs, héritage des réglages, identité des paramètres globaux avant/après, synchronisation entre navigateurs, isolation d’un autre compte, brouillon conservé lors d’un changement de thème puis conflit/rechargement, création de signature par User sans droit admin et paramètres administrateur sans entrée personnelle. Éditeur partagé société/personnel, défaut société non modifié et aperçu réel validés dans la dernière passe. Captures des panneaux en clair/sombre/mobile 390 px et du dialogue signature inspectées. Débordement initial de grille corrigé par minmax(0,1fr) ; tests adaptés aux thèmes désormais persistants et à l’onglet Recherche UX existant. Logs 400/409/503 volontaires et requêtes abandonnées par navigation dans les fixtures conservés ; aucune erreur JavaScript de page dans le parcours personnel final. Pas de suite backend globale ou de recette NAS/Safari/tactile matériel.

Pack cumulatif /private/tmp/horizon-pocketbase-preferences-personnelles-20261020.zip : 324 sources / 326 entrées, 1089450 octets, SHA-256 691e73483e3eb51d754922d1a189a6b4bdfd80054d6fb048fb655380fc11d0f9. ZIP/manifeste/hashes et identité avec les sources contrôlés ; toutes les migrations antérieures inchangées, maximum 0041. Depuis affichage-compteurs, seuls lib/display-preferences.js, nouveau lib/messaging-personal-signatures.js et messaging.pb.js changent côté serveur. Aucune nouvelle migration pour l’extension JSON ; 0041 reste requise si absente. Installation NAS non réalisée.

### 20 octobre 2026 — Couleur des compteurs réservée aux smart boutons

Lint et TypeScript réussis. Régression Chromium display-preferences : 1 parcours réussi / 19,4 s, compteurs smart colorés ou neutres suivant le réglage, couleurs calculées des cartes inchangées après bascule du réglage en clair et sombre, persistance, masquage et isolation des comptes conservés. Captures Contacts clair/sombre inspectées ; contrôle responsive 390 px inclus. Logs status 0 sur requêtes Contacts interrompues par navigation, aucune erreur JavaScript de page. Correction frontend uniquement : pas de nouvelle migration ni de test backend requis ; NAS/Safari/tactile matériel non vérifiés.

### 20 octobre 2026 — Dashboard : instances, données et destination de déplacement

- `pnpm check` réussi : lint, TypeScript strict, 450 tests Vitest / 97 fichiers, build. Derniers lint/build (incluant typecheck) réussis après les ajustements visuels ; avertissement Vite habituel sur les chunks > 500 Kio conservé. `git diff --check` réussi.
- PocketBase local jetable : suite consolidée Dashboard + layouts + filtre Billing + overview TimeReport, 13 tests / 39,244 s réussis. Anciennes dispositions, isolation/collection privée/comptes et rôles inactifs, conflits concurrents, filtres source/dates/owner, dates invalides, propriétaire de commande distinct du devis, configurations compactes et rejeu GET→POST, douze dashboards dans le budget JSON, trimestre Temps et brouillons confidentiels vérifiés. Les références créées par les fixtures ne sont pas des modifications de données NAS.
- Chromium : six parcours / 43,6 s réussis (grille, carrousel connecté, deux instances/filtres/pages, widgets RH, compteurs personnels) ; dernières passes ciblées : grille/configuration quatre parcours / 19,1 s, configurateur deux / 12,6 s et grille deux / 12,8 s. Déplacement réel au pointeur, aperçu avant dépôt, absence de chevauchement, redimensionnement par unité, Échap, clavier, sauvegarde/rechargement/autre navigateur, défaut et suppression, pagination des résultats, période transmise à CRM en critère retirable, copies indépendantes, rôle RH et taille 2H × 1V contrôlés. Geste desktop désactivé sur la grille adaptative à 980 px ; absence de débordement à 390 px. Les configurations des carrousels sont sauvegardées côté serveur ; pause temporaire isolée par compte/dashboard/widget dans le navigateur.
- Captures destination, configurateur, données et widgets RH inspectées en clair/sombre, mobile inspecté ; onglets sortis de la zone défilante pour éviter la superposition, petits raccourcis adaptés pour conserver une action visible. Test de thème attend maintenant le thème effectivement appliqué avant capture. Ancien test de déplacement attend la stabilité des poignées après animation ; fixture du responsable de commande créée directement dans son état final, sans tenter de modifier un historique verrouillé. Avertissement HTML d’un provider à l’intérieur de tbody corrigé par réutilisation du wrapper partagé autour du tableau. Aucune erreur JavaScript de page dans les parcours finaux. Logs status 0 de requêtes abandonnées lors des navigations et 409 volontaire de la régression de conflit ; ResourceWarning Python de fixtures existantes.
- Limites : pas de recette NAS, Safari ou tactile matériel, ni benchmark avec grand volume réel. Les widgets RH ont été vérifiés visuellement avec états vides et permissions réelles de la fixture ; trimestre, minutes et confidentialité vérifiés côté serveur. Le calendrier partagé Absences reste limité à trois mois ; en période annuelle le widget nomme explicitement le premier mois affiché. Aucun rapprochement OnSite, partage de dashboards ou agrégat financier non raccordé annoncé comme livré.
- Pack cumulatif unique `/private/tmp/horizon-pocketbase-dashboards-widgets-20261020.zip`, 326 sources / 328 entrées, 1092529 octets, SHA-256 `d27fbf4e16a840c000f8a2ab3da71bb48981ab5a536196005020c4f635ea32f6`. ZIP/manifeste/empreintes et comparaison aux sources courantes vérifiés ; toutes les migrations antérieures strictement identiques au pack Préférences personnelles, aucune nouvelle migration après 0041. Instructions d’installation dans 06 et l’archive. Livraison locale non committée/non poussée ; installation NAS non effectuée.


### 20 octobre 2026 — Dashboard : présentation Horizon et catalogue avec aperçu

- Régression des courbes : règle CSS compacte qui masquait `MetricTrend` retirée, vérification navigateur des tailles initiales et 2H × 1V, opacité .32. Les métriques non raccordées restent sans courbe ; les exemples sont réservés au catalogue.
- Tableaux : rendu commun `WidgetRecordsView` / `WidgetRecordTable` reposant sur `HDataTable`, colonnes séparées, montants à droite, états `HTag`. Modèle Horizon, nouvelles instances et dispositions v1 en tableau ; préférences v2 sauvegardées conservées (format compact compris). Test unitaire de compatibilité et de stabilité de lecture ajouté.
- Catalogue : les treize types se prévisualisent avant ajout à partir des mêmes vues que les widgets réels ; données locales explicitement signalées, liens d’exemple inertes, requêtes d’exemple interdites dans la régression. Sélection sans ajout, confirmation puis configurateur. Captures clair, sombre, tableau, 980 px et 390 px inspectées. Inspection mobile ayant révélé la compression du catalogue, hauteur minimale de sa zone de sélection corrigée puis vérifiée.
- Première passe Chromium : cinq parcours / 30,6 s réussis. Passe suivante : expiration ponctuelle sur le clic d’une option État dans le configurateur, détachée pendant la stabilisation du menu ; le test attend désormais la source sélectionnée, met le champ à l’écran puis recherche son option. Rejeu complet six parcours / 32,6 s réussi, sans erreur JavaScript de page. Logs 409 volontaire du test de conflit et status 0 des navigations conservés. `pnpm check` final réussi : lint/types, 451 tests / 97 fichiers et build (avertissement Vite préexistant). Rejeu final de cinq parcours / 24,5 s après sécurisation des présentations sauvegardées ; `git diff --check` réussi.
- Frontend seulement : aucune modification de schéma/API ni nouvelle archive serveur. Pack dashboards-widgets-20261020 précédent inchangé ; pas de recette NAS, Safari ou tactile matériel. Les aperçus sont illustratifs, la recette métier utilise les services/droits réels de la fixture locale.


### 21 octobre 2026 — Dashboard : en-tête compact et gestion par la roue

- `pnpm check` réussi : lint, TypeScript, 451 tests Vitest / 97 fichiers et build ; avertissement Vite préexistant sur les chunks volumineux. `git diff --check` réussi.
- Chromium : sept parcours / 36,5 s réussis, incluant accès exclusif au choix et aux actions par Mes dashboards, changement de disposition, favori, duplication/suppression, copies indépendantes, persistance et autre navigateur, brouillon/conflit/annulation, ajout/configuration de widgets et filtres. Nouveau parcours : groupe temporel centré dans la largeur utile desktop, roue alignée au titre, absence de barre/sous-titre hors popup, Échap et focus restitué à la roue, clair/sombre/mobile sans débordement. Captures d’en-tête et de popup inspectées en clair/sombre et à 390 px.
- Première passe : sélecteur de test Fermer ambigu entre croix et footer, retour de focus incomplet et parcours de widget différé resté hors écran dans une fixture laissée par un test interrompu. Correction du sélecteur par le footer partagé, restitution explicite du focus à la roue ou au nom en édition, mise à l’écran du conteneur avant d’attendre son contenu différé. Rejeu complet réussi. Les traces temporaires et fixtures restent hors Git ; logs 409 volontaire et status 0 de navigations conservés, aucune erreur JavaScript de page signalée par les parcours qui les collectent.
- Frontend uniquement, pas de nouvelle migration ni de pack serveur. Aucune recette NAS/Safari/tactile matériel et aucune modification de droits ou de stockage des dispositions.


### 21 octobre 2026 — Dashboard : commandes flottantes sur les widgets

Lint et TypeScript réussis, `git diff --check` réussi. Chromium six parcours existants / 28,6 s réussis, puis parcours enrichi de contrôle tactile / 14,7 s réussi. Régression : hauteur du contenu identique avant/après passage en édition, origine du contenu alignée avec le haut du widget, outils positionnés à l’intérieur du cadre, widget 2H × 1V conservant ses 80 px utiles et sa courbe. Déplacement/redimensionnement au pointeur, clavier et Échap, configuration, duplication/retrait et sauvegarde conservés. Contrôle supplémentaire en contexte Chromium mobile avec hasTouch/isMobile : media hover:none, commandes toujours visibles, configuration ouverte par tap puis annulation du brouillon. Captures surimpression claire, petit format, sombre et tactile inspectées ; pas de validation sur matériel tactile réel/Safari/NAS. Aucune modification serveur ni nouvelle migration.


### 21 octobre 2026 — Dashboard : entrée en édition sans décalage de la grille

`pnpm check` réussi : lint, TypeScript, 451 tests / 97 fichiers, build (avertissement Vite préexistant). Chromium sept parcours / 38,9 s réussis : le test d’édition vérifie maintenant l’origine verticale du contenu avant/après entrée en édition, en plus de sa hauteur, et celle de la grille en contexte tactile mobile. Suppression du bandeau et de l’aide vérifiée. Renommage, ajout/restauration/configuration de widgets, duplication/retrait, pointeur/clavier/Échap, annulation/conflit/sauvegarde, défaut et autre navigateur conservés. Captures d’édition claire et tactile sombre inspectées ; en-tête unique, champs/actions et périodes accessibles sans débordement. `git diff --check` réussi. Pas de changement serveur, recette NAS/Safari ou tactile matériel.


### 21 octobre 2026 — Dashboard : menu déroulant partagé sous la roue

- `pnpm check` réussi : lint/types, 451 tests / 97 fichiers et build ; avertissement Vite préexistant et `git diff --check` réussi. Option open omise lorsque le menu partagé est non contrôlé, conformément à exactOptionalPropertyTypes.
- Chromium ciblé : huit parcours / 40,0 s réussis (sept Dashboard, un menu Contacts). Menu ancré, absence de popup/overlay, choix directs avec coche, défaut, duplication, suppression confirmée, clavier/Échap/focus, édition sans décalage, widgets et persistance multi-navigateurs conservés. Captures clair/sombre/mobile inspectées. Le parcours Contacts ciblé crée une société de fixture, vérifie Dupliquer et Archiver dans la roue partagée, annule avec retour du focus, puis confirme l’archivage et contrôle active=false par API autorisée.
- Première passe élargie : le long parcours Contacts « société, rôles, adresse, personne et archivage » a échoué avant l’utilisation de la roue, sur l’attente d’une combobox Société dans le parcours personne ; ce parcours général n’est donc pas annoncé validé. Pas de refonte hors périmètre de ce scénario ; contrôle du composant modifié isolé et réussi ci-dessus. L’investigation de cette attente reste distincte. Logs status 0 de navigations, 409 volontaire du conflit et message Contacts Invalid response or operation sur navigation conservés ; aucune erreur JavaScript de page dans les parcours Dashboard qui les collectent. Pas de recette NAS/Safari/tactile matériel, aucune modification serveur ni migration.


### 21 octobre 2026 — Dashboard : choix recherchable et création explicite

- Chromium : sept parcours réussis / 31,8 s, PocketBase éphémère. Nouveau scénario avec dix dispositions personnelles : menu principal sans énumération, recherche insensible aux accents, sélection au clavier, création vide enregistrée et relue par API autorisée, création depuis Horizon annulable, état sans résultat et panneau contenu dans un viewport mobile de 390 px. Préférences de fixture restaurées après le test.
- Régressions conservées : édition sans décalage de grille, déplacement/redimensionnement, configurations indépendantes, conflit et reprise, défaut et persistance multi-navigateurs, suppression confirmée, catalogue, données et widgets RH. Captures du menu principal clair/sombre/mobile et de la recherche desktop/mobile sombre inspectées. Navigation interne dans le même panneau ; les essais initiaux en sous-menus latéraux ont révélé un problème de passage au pointeur, éliminé par cette navigation interne.
- `pnpm check` final réussi : lint, TypeScript, 451 tests / 97 fichiers et build ; avertissement Vite de taille de bundle préexistant. `git diff --check` réussi. Aucun changement serveur, de schéma ou de permissions. Pas de recette NAS, Safari ou tactile matériel.


21 octobre 2026 — entrée Modifier ce dashboard : lint ciblé et TypeScript réussis ; sept parcours Chromium / 32,4 s réussis, puis parcours visuel ciblé réussi après correction du défaut de couleur claire. Première action, nom accessible et précision Widgets et disposition vérifiés ; captures clair/sombre/mobile inspectées. `git diff --check` réussi. Aucun changement serveur ni nouvelle recette NAS/Safari/tactile matériel.


21 octobre 2026 — copie de dashboard depuis Ajouter : trois parcours ciblés / 10,8 s réussis sur fixture neuve (copie indépendante, menu responsive, dix dispositions). Lint ciblé, TypeScript et `git diff --check` réussis. Première suite élargie interrompue après timeout du parcours existant sur Déplacer Commandé recouvert par la topbar à 980 px, puis comptage affecté par sa disposition non nettoyée ; suite complète non validée, défaut de visibilité à investiguer séparément. Aucun changement serveur.


### 21 octobre 2026 — Messagerie : réponses reçues

- `pnpm check` réussi : lint, TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite préexistant de taille de bundle. `git diff --check` réussi.
- PocketBase 0.40.4 éphémère + faux Microsoft : deux scénarios / 7,666 s puis trois régressions / 11,742 s réussis. Routes liste/détail/fichier : données privées du propriétaire, droit métier requis, anonymes et autre compte refusés, retrait de droit effectif, tri allowlist, recherche nom et caractère %, 32 réponses sur deux pages sans doublon. BC et devis couverts ; réponses idempotentes, permissions du fil/fichiers, opt-in et Mail.Read, parent inconnu non importé conservés.
- Chromium : quatre scénarios Messaging / 20,5 s réussis, puis Reçus / 8,5 s pour les captures. Réception simulée côté HTTP uniquement pour la présentation ; backend réel couvert séparément. Recherche de top bar et URL, rechargement, deuxième page, lecture/coordonnées/lien source, texte script affiché mais non exécuté, aperçu PNG, vide, 503/Réessayer, clair/sombre/mobile. Nom/adresse dans la même cellule et thème persistant de la fixture pris en compte dans le test après les premières passes. Captures inspectées ; aucune erreur JavaScript de page dans le nouveau parcours. Logs 503 volontaire et status 0 sur navigations de fixture observés. Pack ZIP/manifeste/SHA vérifiés, migrations inchangées. Pas de recette Microsoft réelle/NAS/Safari/tactile matériel ni de nouvelle suite serveur complète.


### 21 octobre 2026 — Devis : contact et alignement des champs

- `pnpm check` réussi : lint, TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite préexistant. Lint du scénario adapté et `git diff --check` réussis.
- PocketBase 0.40.4 éphémère : nouveau scénario Contact (3,135 s), deux régressions de cycle/snapshots (6,180 s), puis révision de commande via unittest (3,112 s) réussis. Défaut de l’opportunité, substitution/effacement, conservation pour anciens clients, opportunité intacte, contact d’une autre société/inactif et changement sans contacts.read refusés, devis finalisé protégé ; état et identité des pièces conservés.
- Chromium : nouveau parcours Contact/alignement (7,9 s avec démarrage) réussi, révision de commande (8,6 s), puis deux parcours cycle devis et contact / 21,1 s réussis. Position Contact/Commercial et dates, valeur initiale/changée, enregistrement/rechargement/API, texte simple 26 px/interligne 18 px, croissance multiligne sans rognage, clair/sombre/mobile vérifiés ; captures inspectées. Première régression stoppée sur une ancienne assertion du cadre portée par le viewport : assertion adaptée à la table partagée, conformément au contrat UX existant, puis parcours réussi. Le test de révision sans main a d’abord été invoqué directement sans exécuter de test ; seul le résultat unittest effectif est compté.
- Pack cumulatif ZIP/manifeste/empreintes vérifiés, aucune migration modifiée. Pas de suite serveur/E2E complète, de nouvelle conversion Gotenberg réelle, de recette NAS/Safari/tactile matériel. Le backend Contact des devis et les variables existantes PDF/e-mail sont relus ; aucun envoi réel effectué.


### 21 octobre 2026 — Devis : actualisation des coûts à la demande

- `pnpm check` réussi : lint, TypeScript, 451 tests / 97 fichiers, build ; avertissement Vite préexistant de taille de bundle.
- PocketBase 0.40.4 éphémère : trois tests catalogue / coûts / snapshots réussis (9,680 s). Coûts personnalisés et historiques non présélectionnés, doublons produit, fournisseur conservé, offre expirée sans repli zéro, prix/marges et sources concurrentes, absence d’écriture avant sauvegarde, provenance et identité historique conservées, permissions et brouillon vérifiés. Régression révision de commande : un test unittest réussi (2,839 s). Lecture explicite du JSON PocketBase pour la provenance testée.
- Chromium avec backend réel : parcours Actualisation et Contact/alignement, deux scénarios réussis (10,6 s). Comparaison, sélection/modes, annulation, actualisation unitaire, application sans écriture, sauvegarde, conflit 409 puis nouvelle vérification, annulation des modifications ordinaires ; clair/sombre/mobile et largeur du popup vérifiés, captures inspectées. Ajustement de largeur mobile et résumé empilé pour conserver les actions visibles ; tableau défilable horizontalement. Logs 409 attendus et status 0 à la navigation de fixture observés.
- Pack cumulatif ZIP/manifeste/empreintes vérifiés ; aucune nouvelle migration. Pas de recette NAS/Safari/tactile matériel, ni de suite serveur/E2E complète.


### 21 octobre 2026 — Visibilité de l’actualisation des coûts

Lint ciblé et TypeScript réussis. Chromium/backend réel : scénario coûts enrichi réussi (7,2 s), opacité positive du bouton sans survol, comparaison sans écart affichée, fermeture puis changement catalogue et réouverture relisant le nouveau coût ; parcours sélection/application/sauvegarde/conflit et captures clair/sombre/mobile conservés. Premier essai du test sans écart utilisait le devis entier avec une autre ligne personnalisée différente ; périmètre corrigé à la ligne testée. Test PocketBase fournisseur/historique/indisponibilité réussi (2,791 s), relecture du prix d’achat confirmé. Aucun changement serveur ni nouvelle recette NAS.


### 21 octobre 2026 — Reprendre le coût effectif de la fiche produit

- Trois tests PocketBase catalogue/coûts/historique réussis (8,451 s), dont ajout du passage d’un tarif fournisseur au coût manuel produit. Nouvelle régression référence → favori actuel puis sauvegarde réussie (2,858 s) : coût courant repris, fournisseur de ligne et identité historique conservés, offre source enregistrée dans la provenance du coût. Première invocation de ce dernier test utilisait le helper de création pour une mise à jour : payload corrigé sans assouplissement serveur.
- Chromium réel : scénario coûts complet réussi (7,1 s), captures clair/sombre/mobile et parcours comparaison/sélection/application/enregistrement/conflit conservés. Aucune modification visuelle supplémentaire pour ce correctif serveur.
- ZIP/manifeste/empreintes et git diff --check vérifiés. Pas de nouvelle suite complète lint/TS/unit/build (correctif JS serveur et tests Python uniquement), ni de recette NAS.


### 21 octobre 2026 — Comparatif compact avec ancien fournisseur

Lint ciblé et TypeScript réussis ; deux tests PocketBase provenance/fournisseur réussis (6,038 s), incluant ancienne source puis provenance du dernier coût actualisé distincte de l’identité initiale. Chromium réel : scénario coûts complet réussi (7,6 s), message supprimé, source sous la colonne ancien coût, hauteur ≤42 px pour la ligne nominale. Captures clair/sombre/mobile générées ; clair/mobile inspectés, tableau horizontalement défilable sur mobile. ZIP/manifeste/empreintes et git diff --check vérifiés. Pas de suite complète ni recette NAS.


### 21 octobre 2026 — Présentation du récapitulatif d’impact

Lint ciblé/TypeScript réussis ; scénario Chromium réel coûts réussi (7,3 s), état sans sélection et compteur vérifiés, parcours sélection/modes/application/sauvegarde/conflit conservé. Captures clair/sombre/mobile inspectées. Correction de compression du tableau mobile avec régression sur sa hauteur (>70 px), formulaire défilable et actions accessibles. Pas de suite complète ni recette NAS ; aucune modification serveur/calcul métier. git diff --check réussi.


### 21 octobre 2026 — Modèles de contenu de devis

- `pnpm check` final réussi : lint, TypeScript, 453 tests / 98 fichiers, build ; avertissement Vite préexistant de taille de bundle. Deux nouveaux tests purs : copie en modèle sans id/snapshot/identité du devis et validité relative bornée. `git diff --check` réussi.
- PocketBase 0.40.4 éphémère : deux scénarios dédiés réussis (5,922 s). Reconstruction avec migration 0042, API natives fermées, anonymes refusés, droits admin/settings/sales et retrait de droits, allowlists strictes (identités et snapshots refusés), idempotence/version/audit, 27 modèles paginés sans doublon, recherche accentuée, archivage/restauration, prix fixes/marge/options/remise, coûts courants rechargés, devis brouillon standard et identité analytique, modèle/tarif changé après aperçu, sauvegarde avec coût périmé refusée, CGV indisponibles, produit archivé, devise et date invalides. Première passe interrompue après découverte des tests Catalogue importés ; import changé en module pour exécuter les seuls scénarios dédiés. Recherche accentuée encodée dans la fixture, comptage PocketBase corrigé vers expression dbx avant succès ; aucun assouplissement des permissions.
- Chromium réel : modèles + régression actualisation des coûts, deux scénarios réussis (12,9 s) ; puis modèles avec comparaison des onglets voisins (9,8 s). Création depuis un devis et depuis zéro, duplication/archives/restauration, aperçu, source tarifaire modifiée et nouveau contrôle, application sans sauvegarde, validité de 45 jours conservée après changement de date, sauvegarde d’un nouveau brouillon et source inchangée. En-têtes Paramètres comparés, ligne d’actions compacte ≤42 px ; clair/sombre/mobile et largeur du popup vérifiés, captures inspectées. Première assertion monétaire adaptée au suffixe du contrôle partagé et fermeture au bouton du footer ; thème basculé avant ouverture de la popup modale. Conflit 409 volontaire ; status 0/validations de réponses Activity/Contacts lors de navigations rapides de fixture observés, aucune erreur JavaScript de page.
- Pack ZIP/manifeste/empreintes revérifiés contre les sources finales ; aucune base/secret dans l’archive. Pas de migration NAS, de recette Safari/tactile matériel, de suite complète serveur/E2E ni de conversion PDF/Gotenberg réelle. Les modèles ne modifient pas le rendu des documents finalisés.
