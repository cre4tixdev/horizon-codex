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
