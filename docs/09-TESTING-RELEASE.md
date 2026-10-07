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
