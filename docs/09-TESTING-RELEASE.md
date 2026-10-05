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

## Approbation vente

```text
devis draft
→ remise dépasse seuil
→ pending approval
→ approbateur valide
→ validation devis possible
```

Test refus + commentaire.

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
