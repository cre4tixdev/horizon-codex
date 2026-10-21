# Horizon — Security & Operations

## Principe

La sécurité, la sauvegarde et la traçabilité font partie du produit.

---

# Authentification

PocketBase Auth.

Options :

```text
email + mot de passe
Microsoft 365 / Entra ID
```

Selon H-060, le login natif Horizon est le mode par défaut ; Microsoft OAuth2 / Entra reste une option complémentaire.

---

# Permissions

RBAC + permissions métier.

Exemples :

```text
contacts.read
contacts.write

crm.read
crm.write
crm.tender.read
crm.tender.create
crm.tender.update
crm.tender.archive
crm.tender.manage_settings

sales.quote.read
sales.quote.create
sales.quote.validate
sales.quote.send

inventory.read
inventory.product.create
inventory.product.update
inventory.product.import
inventory.supplier_price.manage
inventory.move
inventory.adjust

purchasing.request.create
purchasing.request.validate
purchasing.order.create
purchasing.order.validate
purchasing.order.send

billing.invoice.create
billing.invoice.validate
billing.einvoice.send
billing.einvoice.receive
billing.einvoice.retry

accounting.read
accounting.analytics.read
accounting.analytics.manage
accounting.entry.create
accounting.entry.post
accounting.period.close
accounting.reconcile
accounting.export
accounting.sync.manage

documents.template.manage

messaging.email.send
messaging.chat.read
messaging.chat.send
messaging.chat.manage

projects.read
projects.write
projects.acceptance.create
projects.acceptance.validate
projects.reservation.resolve
projects.close_operational
projects.close_financial

service.asset.read
service.asset.write
service.ticket.read
service.ticket.create
service.ticket.update
service.intervention.plan
service.intervention.complete
service.intervention.validate
service.maintenance.manage

planning.read
planning.write
time.read
time.write
time.validate

activity.note.create
activity.task.create
activity.task.assign

imports.odoo
imports.catalog
imports.apply

settings.users
settings.roles
```

---

# API Rules

Toutes les collections métier ont des règles explicites :

```text
LIST
VIEW
CREATE
UPDATE
DELETE
```

Aucune collection sensible ouverte sans justification.

---

# Chat

Une conversation ne peut être lue que par ses membres autorisés.

Contrôles :

- lecture conversation ;
- lecture messages ;
- création message ;
- gestion membres ;
- pièces jointes.

Connaître l’ID d’une conversation ne donne jamais accès au contenu.

---

# E-mail

Les boîtes CVS sont hébergées sur **Microsoft 365 / Exchange Online**.

Microsoft Graph est le provider e-mail principal de Horizon.

Les e-mails ne sont jamais envoyés depuis le navigateur directement.

```text
Utilisateur
↓
Horizon
↓
Messaging Service
↓
MailProvider
├── MicrosoftGraphMailProvider
└── SMTPMailProvider
```

L’intégration Microsoft Graph s’appuie sur **Microsoft Entra ID**.

Aucun mot de passe Microsoft 365 utilisateur n’est stocké dans Horizon.

Les permissions Graph sont accordées selon le mode d’authentification retenu :

```text
delegated
ou
application
```

Le mode exact sera défini au moment de l’intégration Entra ID.

SMTP reste disponible uniquement comme fallback technique.

Le `From` est contrôlé côté serveur.

Alias possibles :

```text
commercial@cvs.fr
achats@cvs.fr
facturation@cvs.fr
```

uniquement si explicitement autorisés.

---

# Documents finalisés

Lorsqu’un document est validé / envoyé :

```text
version template
HTML rendu
PDF final
date
auteur
```

sont figés.

---

# Audit

`core_audit`

Actions sensibles :

- validation devis ;
- statut opportunité / AO ;
- mouvement stock ;
- validation facture ;
- export comptable ;
- permissions ;
- génération document ;
- envoi e-mail.

---

# Logs

Séparés de l’audit métier.

Pour :

- API ;
- hooks ;
- erreurs ;
- intégrations ;
- e-mails ;
- PDF ;
- auth.

---

# Secrets

Aucun secret dans Git.

Exemples :

```text
SMTP_PASSWORD
MICROSOFT_CLIENT_SECRET
POCKETBASE_ENCRYPTION_KEY
```

Les secrets sont injectés par l’environnement.

---

# Environnements

```text
LOCAL
PREPROD
PROD
```

Chaque environnement possède :

- PocketBase ;
- base ;
- fichiers ;
- secrets ;
- sauvegardes.

---

# Sauvegardes

Répertoire critique :

```text
pb_data/
```

Stratégie :

```text
PROD
├── backup local
└── backup externe
    ├── NAS secondaire
    └── ou S3
```

Sauvegarde externe obligatoire.

---

# Restauration

Définir et tester :

- fréquence ;
- rétention ;
- versions ;
- stockage ;
- procédure ;
- test complet.

---

# Docker

```text
Docker
├── Horizon
└── Gotenberg
```

`pb_data` dans un volume persistant.

---

# HTTPS

Production uniquement en HTTPS.

---

# Administration PocketBase

`/_/` réservé aux administrateurs techniques.

Jamais utilisé comme interface métier quotidienne.

---

# cvs-aoboard

Le dépôt actuel contient un `.env` suivi par Git.

Lors du portage :

- ne pas recopier le fichier ;
- utiliser `.env.example` sans secret ;
- secrets uniquement via environnement ;
- rotation si un secret réel a été exposé.

---

# Sécurité Finance

## Sage

Les identifiants / clés / tokens Sage :

- sont stockés côté serveur ;
- ne sont jamais exposés au navigateur ;
- utilisent le moindre privilège ;
- sont séparés par environnement.

Les exports et synchronisations sont idempotents.

Une écriture déjà transmise avec succès ne doit pas être retransmise sans procédure explicite.

## Comptabilité Horizon

Les fonctions suivantes exigent des permissions distinctes :

```text
consultation
création écriture
comptabilisation
lettrage
rapprochement
clôture période
clôture exercice
export FEC
administration comptable
```

Une période clôturée / verrouillée ne peut pas être modifiée par un utilisateur standard.

Les corrections se font par écritures correctives ou contre-passation selon les règles comptables retenues.

## SUPER PDP

Les credentials SUPER PDP sont conservés côté serveur.

Les webhooks :

- sont authentifiés / vérifiés selon les mécanismes disponibles ;
- sont journalisés ;
- sont idempotents ;
- ne font pas confiance aveuglément au payload reçu.

Chaque événement externe doit être corrélé à une transmission Horizon.

Les payloads contenant des données sensibles ne doivent pas être loggés inutilement en clair.

---

# Sécurité Imports

Les imports sont des opérations privilégiées.

Règles :

- dry run obligatoire avant un import massif ;
- affichage du nombre de créations / mises à jour / conflits ;
- confirmation explicite avant `apply` ;
- journalisation de l’utilisateur ;
- conservation du fichier ou de son hash selon politique ;
- aucune fusion automatique sur un matching ambigu ;
- mapping externe idempotent ;
- possibilité de rejouer un import sans duplication.

Les imports Odoo et catalogues fournisseurs ne doivent jamais contourner les validations serveur.

---

# Sécurité Activity Feed

`core_activity_events` est visible uniquement si l’utilisateur a accès à l’objet source.

Les notes privées ou restreintes peuvent avoir des règles supplémentaires.

Une mention ne donne jamais automatiquement accès à un objet auquel l’utilisateur n’a pas droit.

`core_audit` reste non éditable par les utilisateurs.

Page Activité globale (16 octobre 2026) : endpoint authentifié `core_users`, rôle/utilisateur actifs, permission de lecture du module puis autorisation de chaque fiche par le contrat `activity-read.authorizeRecord`, y compris les périmètres personnels/managers Congés et Notes de frais et les règles de consultation natives applicables. Ce contrôle précède recherche, projections, totaux, groupes et pagination ; les mentions n’accordent aucun droit. Le dashboard réutilise la même politique. Une source supprimée/refusée ou une référence historique malformée ne produit aucun résultat ; les erreurs techniques autres que refus/absence ne sont pas absorbées. Les projections/fichiers e-mail conservent le contrat Messaging et ses téléchargements protégés. Aucun nouveau rôle, permission ou schéma. Pour installer la page : remplacer les hooks à jour et redémarrer PocketBase avec le frontend correspondant ; aucune nouvelle migration après 1791840020. Pack unique PocketBase `horizon-pocketbase-activity-20261016.zip`, sans frontend, base ou secrets ; ne pas modifier les variables Microsoft ni relancer de connexion pour cette évolution.

---

# Sécurité Documents Brouillon / Validé

La permission de modifier un brouillon est distincte de la permission de valider.

Exemple :

```text
create/update draft
≠
validate
```

Les transitions critiques sont côté serveur.

Une facture ou écriture validée ne peut pas revenir en brouillon par une simple modification frontend.

---

# Sécurité Analytique

Les ventilations analytiques font partie de la donnée métier.

Une modification après validation d’un document financier ou achat doit être :

- interdite ;
- ou réalisée via une procédure corrective explicitement autorisée.

Les montants agrégés des rapports analytiques nécessitent le droit explicite analysis.financial et le périmètre autorisé. Ce droit ne donne pas accès aux documents sources ni aux coûts individuels : leur consultation conserve les permissions du module propriétaire et les droits sensibles dédiés. Les champs financiers non autorisés sont exclus côté serveur.


# Sécurité validation / marges

Les permissions distinguent création, modification de brouillon et validation.

Exemples :

```text
sales.quote.create
sales.quote.update_draft
sales.quote.validate

purchasing.order.create
purchasing.order.update_draft
purchasing.order.validate

billing.invoice.create
billing.invoice.update_draft
billing.invoice.validate
```

Aucun moteur de seuils / approbateurs automatiques n’est prévu.

Les marges, coûts horaires et prix d’achat peuvent nécessiter des droits de lecture spécifiques.

---

# Sécurité stock

Les corrections d’inventaire, changements de lots / séries et mouvements vers rebut sont audités.

Les réservations ne peuvent pas dépasser le disponible selon les règles métier définies.

Les annulations après livraison / réception utilisent des opérations inverses plutôt qu’une suppression d’historique.

---

# Sécurité recherche globale

La recherche globale ne contourne jamais les règles d’accès.

Un objet non accessible ne doit :

- ni apparaître dans les résultats ;
- ni révéler son titre ;
- ni révéler son existence par autocomplete.

---

# Sécurité coûts / salaires

Les profils de coût sont des données sensibles.

Séparer :

```text
coût analytique
≠
donnée RH détaillée
```

Horizon peut fonctionner avec des coûts standards par profil / équipe sans exposer les éléments de rémunération.

---

# Sécurité archivage

Une purge éventuelle est une opération distincte de l’archivage.

Les objets soumis à conservation ou `legal_hold` ne sont pas purgeables.

Toute purge autorisée est journalisée.


# Sécurité Employés / Utilisateurs

Les droits sur les Employés sont distincts des droits d’administration des comptes utilisateurs.

Exemples :

```text
HR / manager
→ modifier employé

Admin Horizon
→ créer / désactiver utilisateur

Chef de projet
→ consulter ressources autorisées
→ pas modifier identité / coût
```

Les profils de coût peuvent avoir des droits plus restrictifs que la fiche employé.

Un utilisateur désactivé conserve :

- auteur des anciens événements ;
- TimeReports ;
- validations ;
- audit.

---

# Sécurité API externe

## Secrets

Les clés API :

- sont générées avec une forte entropie ;
- ne sont affichées en clair qu’à la création / rotation ;
- sont stockées hashées ;
- peuvent expirer ;
- sont révocables immédiatement.

## Génération

La génération est effectuée côté serveur avec un générateur cryptographiquement sûr.

Interdictions :

```text
Math.random()
clé générée dans React
clé choisie librement par l’utilisateur
stockage de la clé complète en base
```

Une seule réponse contient la clé brute : celle de sa création ou de sa rotation.

Après cela, Horizon ne peut afficher que :

```text
préfixe
derniers caractères
date de création
expiration
dernière utilisation
statut
```


## Least privilege

Une clé sans policy ne possède aucun accès.

Les champs sont en allowlist.

Exemple :

```text
read_fields = [id, name]
```

n’autorise jamais implicitement un futur champ ajouté à la collection.

## Séparation lecture / écriture

```text
read_fields
≠
write_fields
```

Un champ lisible peut rester non modifiable.

## Validation

Les écritures API passent par les mêmes :

- schémas ;
- services ;
- validations ;
- transitions ;
- règles d’approbation ;

que l’application.

## Réseau

Optionnellement :

- allowlist IP ;
- reverse proxy ;
- limite de débit.

## Audit

Toute action externe significative génère :

```text
api_client
request_id
resource
action
timestamp
result
```

Les données sensibles ne sont pas inscrites dans les logs bruts.

## Révocation

La révocation doit être effective immédiatement.

La rotation peut permettre une courte période où ancienne et nouvelle clés coexistent.


---

# Sécurité Numérotation V12

Les identifiants techniques PocketBase ne sont jamais modifiables par l’utilisateur.

Les numéros métier :

- sont générés côté serveur ;
- utilisent des séquences atomiques ;
- restent uniques selon leur domaine ;
- peuvent changer de format pour les nouveaux documents uniquement.

Une ancienne référence conservée dans `core_business_identifiers` ne doit jamais devenir un moyen de modifier la relation technique du record.

## Socle natif préparé le 4 octobre 2026

Le choix déjà décidé en H-060 est appliqué : connexion native par défaut, Microsoft optionnel. Le frontend s'authentifie uniquement dans `core_users` ; le superuser technique reste hors de l'application.

- `core_users.authRule` exige `active = true && role.active = true` à la connexion et au renouvellement.
- Les règles de lecture exigent également une identité `core_users`, un compte actif et un rôle actif. Le compte ne lit que lui-même et son rôle ; les écritures REST applicatives sont verrouillées dans ce socle. La future gestion par `settings.users` / `settings.roles` exige un service serveur audité.
- Les permissions sont des noms explicites, sans wildcard ; `pocketbase/pb_hooks/core-auth.pb.js` valide leur tableau JSON, leur syntaxe et leur unicité côté serveur. Chaque future collection devra ajouter sa permission métier aux API Rules ; le filtrage visuel ne suffira jamais.
- Session conservée dans l’onglet via `sessionStorage`, après accord utilisateur sur le remplacement du stockage uniquement en mémoire. Seul le token est conservé ; aucun mot de passe ni profil utilisateur n’est stocké. Au démarrage, Horizon attend un `authRefresh` et valide le compte / rôle retournés avant de monter les pages protégées. Un token expiré ou un refus serveur est supprimé ; une panne lors de la restauration affiche une erreur et demande une reconnexion. Aucun token dans `localStorage`, cookie ou `VITE_*`. Déconnexion : annulation des requêtes auth, suppression du token en mémoire / `sessionStorage` et purge du cache TanStack Query. Le token dans `sessionStorage` reste accessible au JavaScript de l’origine ; ce choix ne fournit pas la protection d’un cookie HttpOnly.
- Renouvellement lorsque l'application reprend le focus et toutes les 30 secondes visibles. Un refus serveur déconnecte et purge le cache ; une panne réseau est affichée. Les API Rules bloquent immédiatement les lectures avec un ancien token si le compte ou le rôle est désactivé.
- Connexion publique sans inscription, OAuth2 et OTP désactivés à ce stade. Pas de récupération par e-mail tant que le transport SMTP / mail n'est pas configuré.
- Le mode aperçu sans URL est réservé au serveur Vite de développement et annoncé dans le layout. En production, l'absence d'URL conduit à une page de connexion indisponible, jamais à un accès anonyme au layout.
- Les erreurs techniques auth ne journalisent que leur statut ou une erreur de structure ; jamais l'objet d'erreur SDK susceptible de contenir une requête sensible.

L'utilisateur a choisi la configuration des collections et comptes via le dashboard de préproduction. Le schéma a été relu par API ; les écarts recensés ci-dessous restent à corriger avant recette. Le hook serveur et la réconciliation des migrations restent à effectuer. Les comptes d'intégration et leurs identifiants fictifs appartiennent uniquement à des bases temporaires locales.

## Déploiement du socle sur Synology — fichiers prêts, application guidée restante

Informations déclarées : conteneur `horizon-pocketbase`, image `ghcr.io/muchobien/pocketbase:latest`, UI PocketBase 0.40.4 ; montage `/volume1/docker/horizon/pocketbase:/pb_data:rw`. La commande du processus principal, copiée par l'utilisateur depuis le terminal, confirme `serve --http=0.0.0.0:8090 --dir=/pb_data --publicDir=/pb_public --hooksDir=/pb_hooks`. Le digest de l'image et les éventuels autres montages restent à relever.

Avant application : inspecter les migrations / hooks déjà présents et la commande de lancement ; renouveler la sauvegarde de préproduction après création du compte et vérifier une restauration sur base isolée. Le cron PocketBase actuellement vide ne prouve rien sur les sauvegardes Synology externes.

Après accord utilisateur, installation assistée dans Container Manager :

1. Refaire une sauvegarde incluant le compte / rôle créés depuis la sauvegarde initiale et conserver la configuration actuelle du conteneur. Ne pas mettre à jour l’image pendant cette opération.
2. Copier les deux fichiers de `pocketbase/pb_migrations/` dans `/volume1/docker/horizon/pb_migrations/`, et le hook `pocketbase/pb_hooks/core-auth.pb.js` dans `/volume1/docker/horizon/pb_hooks/`.
3. Ajouter les montages `/volume1/docker/horizon/pb_migrations:/pb_migrations:ro` et `/volume1/docker/horizon/pb_hooks:/pb_hooks:ro`, en conservant le montage existant des données.
4. Sur la commande PocketBase actuelle, fixer `--dir=/pb_data --migrationsDir=/pb_migrations --hooksDir=/pb_hooks --automigrate=false`. Conserver le port d'écoute actuel et son mapping ; ne pas remplacer aveuglément l'entrypoint de l'image. La commande exacte dépend de sa configuration à relever.
5. Redémarrer : les migrations non appliquées s'exécutent automatiquement et transactionnellement. Vérifier les logs, puis les collections, règles et hooks. La migration de verrouillage s'arrête si la règle de création `users` diffère de la règle publique inventoriée ou d'une règle déjà verrouillée.
6. Vérifier la connexion avec le compte Horizon existant et les refus attendus sur un compte de recette dédié. Aucun compte n'est créé automatiquement par les migrations.
7. Configurer localement uniquement l'URL publique via `.env.local`, puis relancer Vite pour activer la connexion au lieu de l'aperçu.

Les migrations créent le socle sur base neuve ou adoptent les collections compatibles existantes sans les sauvegarder / réécrire, puis verrouillent uniquement l'inscription publique standard `users`. Les données de `users`, les comptes superusers et les autres paramètres restent préservés. Aucun changement n'est appliqué au Synology dans cette préparation locale. Le rollback automatique du socle est toujours refusé pour préserver les collections adoptées ; celui du verrouillage refuse de rouvrir silencieusement l'inscription publique. Une restauration ou une migration corrective revue est nécessaire après provisionnement.

Références techniques : [migrations PocketBase](https://pocketbase.io/docs/js-migrations/), [authentification](https://pocketbase.io/docs/authentication/), [API Rules](https://pocketbase.io/docs/api-rules-and-filters/).


## Configuration manuelle de préproduction — contrôle du 4 octobre 2026

À la demande explicite de l'utilisateur, les collections ont été créées par lui depuis le dashboard PocketBase. Il indique avoir créé et téléchargé une sauvegarde préalable ; sa restauration n'a pas été testée. L'agent a uniquement relu le schéma et les champs minimaux nécessaires au contrôle des rôles / comptes, sans lire mots de passe, tokens ou coordonnées personnelles.

Vérifié : `core_users` est bien Auth, `core_roles` est Base, les règles List / View correspondent au socle, les écritures applicatives sont verrouillées, l'authRule exige compte et rôle actifs, password/email est activé, OAuth2 et OTP sont désactivés. Un compte actif est lié à un rôle actif `development`.

Écarts à corriger par l'utilisateur dans le dashboard :

| Emplacement | État lu | Valeur attendue |
|---|---|---|
| Rôle `development.permissions` | `null` | `[]` (tableau vide explicite) |
| `core_users.role` | Non obligatoire, maxSelect 0 | Obligatoire, maxSelect 1 |
| `core_users.avatar` | maxSelect 0 | maxSelect 1 |
| `core_roles.name` | Pattern vide | `^[a-z][a-z0-9_]*$` |
| `users.createRule` | Chaîne vide, inscription publique | Verrouillée (`null`) |
| `core_users.authToken.duration` | 432000 secondes | 3600 secondes, conformément au socle testé |

Le frontend est raccordé via `.env.local` (URL publique uniquement, fichier ignoré par Git). La connexion réelle avec le compte Horizon reste à effectuer par l'utilisateur après correction ; le superuser n'est jamais utilisé par le frontend.

**Note historique du premier contrôle : la migration initiale devait être adaptée avant application. Cette adaptation est maintenant testée localement (voir ci-dessous).** Les collections distantes ont des identifiants techniques générés différents (`core_roles`: `pbc_504315831`, `core_users`: `pbc_190970246`). Préparer une réconciliation non destructive, tester l'adoption du schéma et conserver l'historique des migrations avant tout déploiement de fichiers. Le hook serveur de validation des permissions n'a pas été installé par cette configuration UI et n'a pas été vérifié sur le NAS.


### Revérification après corrections utilisateur

Contrôle API en lecture seule : `development.permissions = []`, relation rôle obligatoire, pattern du nom conforme, inscription publique `users` verrouillée et durée authToken 3600 secondes. Compte / rôle actifs, règles de lecture et authRule conformes, écritures applicatives verrouillées, avatar protégé. Les lectures REST anonymes de `core_users` et `core_roles` retournent chacune une liste vide.

Correction de l'analyse précédente : `maxSelect = 0` n'est pas un écart fonctionnel pour ces champs. PocketBase 0.40.4 traite les relations et fichiers avec `maxSelect <= 1` comme des valeurs uniques, avec une limite effective de 1. Le rôle et l'avatar de préproduction sont donc bien configurés en valeur unique. Une réconciliation de migration doit comparer cette sémantique, sans imposer une modification UI inutile. Sources : [RelationField 0.40.4](https://github.com/pocketbase/pocketbase/blob/v0.40.4/core/field_relation.go), [FileField 0.40.4](https://github.com/pocketbase/pocketbase/blob/v0.40.4/core/field_file.go).

La connexion réelle avec le mot de passe du compte Horizon reste à tester par l'utilisateur ; l'installation du hook et la réconciliation des migrations restent à faire. Aucun changement distant n'a été effectué par l'agent pendant ce contrôle.


### Connexion Horizon confirmée par l'utilisateur

Après correction du schéma et raccordement du frontend, l'utilisateur confirme que la connexion avec son compte `core_users` fonctionne sur l'instance de préproduction. Cette preuve est une recette utilisateur déclarée, distincte des tests automatisés locaux et des contrôles API de schéma / lectures anonymes. L'agent n'a pas demandé ni utilisé le mot de passe applicatif.

Restent à vérifier sur la préproduction : déconnexion, renouvellement et refus après désactivation avec un compte de test dédié ; installation du hook de validation des permissions ; réconciliation non destructive et adoption du schéma par les migrations. Aucune collection métier n'est encore livrée.


### Adoption des collections existantes — préparation testée

L'autorisation utilisateur couvre la réconciliation locale et l'installation guidée du hook. La migration `1791072000_core_auth.js` n'avait pas été déployée par l'agent sur la préproduction ; sa version locale a donc été adaptée avant son premier déploiement.

- Base neuve : création de `core_roles` / `core_users`, email obligatoire, mêmes règles et options que le socle validé.
- Deux collections existantes : contrôle de leur type, champs structurants visibles, règles, index unique du nom du rôle, options auth et tableaux de permissions existants ; absence de sauvegarde des collections / enregistrements. Identifiants, champs, auth secrets et données restent inchangés.
- Installation partielle ou dérive incompatible : arrêt avec le nom du réglage concerné, sans correction automatique ni modification des enregistrements. Les sélections simples `maxSelect` 0 et 1 sont équivalentes.
- Rollback automatique du socle refusé systématiquement : utiliser une migration corrective revue ou une restauration vérifiée.
- Fixture de schéma relue sur préproduction et conservée dans `tests/pocketbase/fixtures/manual_auth.json`, sans comptes, mots de passe ni secrets auth.

Résultats : 13 tests backend PocketBase 0.40.4 réussis (incluant adoption / conservation du schéma et du login, installation partielle, quatre dérives et rollback protecteur), 26 tests Vitest, lint / typecheck / build réussis, 3 parcours auth Chromium réussis. Le hook reste à installer et à vérifier sur le NAS.

Archive temporaire de transfert : `/private/tmp/horizon-pocketbase-socle.zip`, contenant uniquement `pb_migrations/1791072000_core_auth.js`, `pb_migrations/1791072001_lock_default_registration.js` et `pb_hooks/core-auth.pb.js`. Copier ces dossiers dans `/volume1/docker/horizon/` sans écraser un hook ou une migration déjà présents sans examen préalable.

La commande actuelle pointe déjà vers `/pb_hooks`. Après dépôt des fichiers et inspection de la configuration, ajouter les montages `pb_hooks` et `pb_migrations` décrits ci-dessus. Le publisher de l'image documente une commande personnalisée sous forme de flags ; les flags prévus sont `--migrationsDir=/pb_migrations --automigrate=false`, tout en conservant l'entrypoint et les chemins / ports actuels. Voir [l'entrypoint muchobien](https://github.com/muchobien/pocketbase-docker/blob/main/entrypoint.sh). La valeur exacte à saisir dans Container Manager dépend du champ de commande déjà configuré ; contrôler avant redémarrage. Ne pas exécuter `migrate history-sync` pour masquer un historique manquant.

### Redémarrage du projet Synology — contrôle de préproduction

Le conteneur appartient au projet Container Manager `horizon` : les montages et les flags se configurent dans son YAML. L'utilisateur déclare avoir transféré les fichiers et redéployé le projet après ajout des montages `/volume1/docker/horizon/pb_hooks:/pb_hooks:ro` et `/volume1/docker/horizon/pb_migrations:/pb_migrations:ro`, avec les flags ci-dessus. Le montage des données `/volume1/docker/horizon/pocketbase:/pb_data` et le port `50190:8090` sont conservés.

Journal fourni : démarrage le 4 octobre 2026 à 22:30:13 heure locale. Contrôle API après redémarrage : santé HTTP 200, identifiants des collections conservés, un compte et un rôle actifs, permissions `[]`, authRule conforme, token 3600 secondes, écritures applicatives et inscription standard verrouillées ; lectures anonymes des deux collections vides. Aucune modification distante de configuration ou de données par l'agent.

Ces preuves ne confirment pas à elles seules le chargement du hook ni l'enregistrement des migrations. Vérifier les fichiers / arguments effectifs et le rejet d'une permission invalide avec un rôle de test distinct, sans modifier le rôle du compte utilisé. La restauration d'une sauvegarde sur le NAS reste à vérifier.

Contrôle complémentaire fourni par l'utilisateur : les trois fichiers attendus sont visibles dans `/pb_hooks` et `/pb_migrations` ; `/proc/1/cmdline` confirme `--hooksDir=/pb_hooks --migrationsDir=/pb_migrations --automigrate=false`. La création d'un rôle de test avec `permissions = ["*"]` est refusée avec le message exact du hook : `Permissions must be a unique array of explicit permission names.` Le chargement et le rejet serveur des permissions wildcard sont donc confirmés sur la préproduction. Ce test ne vérifie pas à lui seul l'historique des migrations ni l'ensemble des permissions métier.

L'utilisateur confirme ensuite la déconnexion Horizon (retour au login) et la reconnexion avec son compte habituel (accès au dashboard). Renouvellement et désactivation avec un compte dédié restent à vérifier sur cette instance.

Recette complémentaire : connexion réussie avec un compte dédié actif, puis désactivation par l'utilisateur dans le dashboard. L'utilisateur confirme la fermeture automatique de la session et le refus de reconnexion. Le contrôle de révocation de ce compte est validé sur préproduction ; le renouvellement positif reste à vérifier séparément. Un rechargement manuel déconnecte également le compte habituel actif : comportement expliqué par le `BaseAuthStore` en mémoire prévu au socle. L'amélioration de la persistance au rechargement est à faire valider avant modification de ce choix.

Après accord explicite, le stockage de session dans l'onglet a été implémenté selon le socle décrit ci-dessus. L'utilisateur confirme ensuite que son compte habituel reste connecté après actualisation. La restauration par renouvellement serveur est également couverte par les tests locaux ; les autres points d'exploitation (historique des migrations sur NAS, restauration de sauvegarde) restent distincts.


## Contacts V1 — installation et sécurité

Implémentation locale puis installation guidée effectuée par l’utilisateur : aucune collection, règle ou donnée du NAS modifiée directement par l’agent pour ce module. Migration `1791072002_contacts.js` : quatre collections Contacts et, s'il n'existe pas, le socle verrouillé `core_audit`. Refus sur collection Contacts préexistante, sans réécriture ; un audit préexistant doit être une collection Base verrouillée avec les champs compatibles. Rollback destructeur refusé.

Les règles List / View exigent un compte `core_users` et un rôle actifs, avec `contacts.read`. Create / Update exigent en plus `contacts.write`. La comparaison sur le champ JSON recherche le nom complet entre guillemets (`permissions ~ '"contacts.read"'`), testé contre une permission ressemblante. Delete verrouillé. Fichiers logo / galerie / avatar protégés : un token fichier et la View Rule sont nécessaires, y compris pour le badge société. [Règles PocketBase](https://pocketbase.io/docs/api-rules-and-filters/), [fichiers protégés](https://pocketbase.io/docs/files-handling/).

Hooks : `contacts.pb.js` valide noms / site web et rattachements ; `lib/audit.js` sauvegarde la fiche et son audit dans une transaction. Acteur tiré du compte de requête `core_users`, jamais d'un champ client ; le superuser technique ne devient pas un utilisateur Horizon. L'échec de l'audit annule la sauvegarde, vérifié par un trigger SQLite de test. `core_audit` reste réservé au superuser à ce stade ; la consultation / administration d'audit globale relève de F07.

Procédure guidée autorisée par l’utilisateur :

1. Télécharger une sauvegarde PocketBase récente et conserver les hooks / migrations actuellement installés.
2. Déposer uniquement `pb_migrations/1791072002_contacts.js`, `pb_hooks/contacts.pb.js` et `pb_hooks/lib/audit.js` sous `/volume1/docker/horizon/`, en conservant le socle existant. Les montages actuels couvrent ces chemins.
3. Redémarrer `horizon-pocketbase` via le projet Synology ; contrôler le journal, les quatre collections et `core_audit`. La migration en attente est exécutée au démarrage ; ne pas créer les collections manuellement avant cette migration.
4. Dans le rôle de développement, accorder explicitement `["contacts.read", "contacts.write"]` si l'utilisateur confirme ce besoin. Ne jamais ajouter `*`. Reconnecter Horizon pour charger les nouvelles permissions.
5. Recette sur préproduction avec fiches de test : création, rôles multiples, adresse, personne, images, archivage et réactivation ; vérifier aussi un rôle lecteur et un compte sans permission. L’installation et l’accès à l’interface sont confirmés ci-dessous ; la recette métier complète sur NAS reste à effectuer.

Archive temporaire préparée : `/private/tmp/horizon-pocketbase-contacts.zip` ; aucun compte, secret ou fichier de données inclus. Les tests backend / navigateur utilisent exclusivement des bases temporaires locales.


### Installation Contacts confirmée — 4 octobre 2026

L'utilisateur confirme la sauvegarde / récupération de l'archive, le dépôt des trois fichiers puis le redémarrage. Le journal fourni à 23:20 montre le rechargement des hooks Contacts / audit et le démarrage du serveur, sans erreur visible. Les quatre collections Contacts et `core_audit` sont présentes selon son contrôle du dashboard.

Après attribution guidée de `contacts.read` et `contacts.write` au rôle de développement et reconnexion, l'utilisateur confirme l'accès aux onglets Sociétés / Personnes et au bouton Nouvelle société. Ces preuves sont une recette utilisateur déclarée ; elles ne remplacent pas les tests CRUD / images / audit avec ses données sur NAS. Reprise prévue : créer une société de test avec rôles et adresse, puis une personne avec avatar ; vérifier modification, archive / réactivation et audit, puis lecteur / compte sans permission. Les tests automatisés de ces comportements passent localement.

## Évolutions Contacts et référentiels — sécurité cible, 5 octobre 2026

Livré localement avec la migration d’évolution : lecture des catalogues pays / langues / devises pour utilisateurs Horizon actifs ; administration avec `settings.references`, validations serveur, audit et absence de suppression d’un code utilisé. Permission explicite à provisionner, sans élévation automatique des rôles existants.

Les totaux liés à une société appliquent les mêmes permissions et filtres métier que les listes destination. Ne pas utiliser un superuser pour agréger les compteurs ; ne pas révéler l’existence d’objets interdits. Les routes destination valident les filtres reçus. Pappers exige `contacts.read` pour rechercher et `contacts.write` pour appliquer ; secret et appels fournisseur exclusivement côté serveur. Logo / avatar et galerie conservent la protection des fichiers V1.

### Installation NAS de l’évolution Contacts / Référentiels

Livraison locale, non déployée par l’agent. Avant installation, conserver une sauvegarde restaurable de `/pb_data` et une copie des hooks / migrations actuels. Ne pas modifier la migration Contacts V1 déjà appliquée.

1. Vérifier les sociétés ayant `preferred_currency` et `default_currency` différents : résoudre le choix métier explicitement avant installation. La migration refuse tout conflit et conserve les données V1. Toute collection référentiel préexistante avec le même nom provoque aussi un refus pour revue préalable.
2. Archive préparée : `/private/tmp/horizon-contacts-references.zip`. Elle contient la nouvelle migration `1791158400_contact_references.js` et les hooks : `contacts.pb.js`, `references.pb.js`, `company-lookup.pb.js`, `lib/audit.js`, `lib/company-lookup.js`. Inspecter son contenu, déposer ces fichiers dans les montages existants `/volume1/docker/horizon/pb_migrations` et `/volume1/docker/horizon/pb_hooks`, préserver tous les autres fichiers.
3. Redémarrer selon la procédure existante et vérifier le journal de migration. Si le démarrage refuse un conflit, arrêter et résoudre à partir de la sauvegarde / des anciens fichiers ; ne pas forcer la suppression d’un champ ou d’une collection. Le rollback destructeur est interdit par la migration.
4. Vérifier les collections `settings_countries`, `settings_languages`, `accounting_currencies`, `core_company_lookup_limits` ; les champs société `siren`, `siret`, `default_currency`, `enrichment` (absence de `preferred_currency`) ; le champ adresse `is_primary`. Les codes historiques sont préservés ; compléter les libellés si nécessaire. Les valeurs inconnues ne sont pas acceptées par le hook.
5. Attribuer `settings.references` uniquement au rôle autorisé à administrer ces référentiels, puis reconnecter ce compte. Aucun rôle n’est modifié automatiquement par la migration ; les lecteurs Contacts peuvent utiliser les choix sans cette permission.
6. Facultatif : configurer `PAPPERS_API_KEY` comme secret d’environnement du conteneur, puis redémarrer. Ne pas fournir cette clé au frontend, à Git ou au chat. Sans clé, Contacts fonctionne manuellement et affiche l’état non configuré.
7. Recetter combobox, valeur inactive historique, SIRET, image protégée / remplacement, adresse principale, personne pré-rattachée et permissions. Pour Pappers, tester comparaison / sélection explicite et audit sur une société de recette. Les boutons des modules non livrés restent « À venir ».

La version serveur est contrôlée avant les écritures société / adresse et avant l’édition des fiches : sans nouveaux hooks / schéma, le frontend indique la mise à jour requise. Aucune modification directe du NAS n’a été effectuée à cette étape.

### Installation / redémarrage confirmés — 5 octobre 2026

L’utilisateur confirme avoir installé l’archive et redémarré PocketBase sur le NAS. Vérifications anonymes en lecture seule : `/api/health` répond HTTP 200 ; `/api/horizon/company-lookup/status` répond HTTP 401 avec exigence de token, ce qui confirme la présence de la nouvelle route protégée. Cette réponse ne prouve pas encore l’application complète du schéma ni la configuration de Pappers.

Recette restante : actualiser / reconnecter Horizon, vérifier les choix Pays / Langues / Devises, la sauvegarde SIREN / SIRET et les personnes associées. Administration des référentiels après attribution explicite de `settings.references` au rôle concerné. Aucun secret ni token demandé à l’utilisateur.


### Reprise visuelle Contacts — 5 octobre 2026

Aucune nouvelle installation PocketBase sur le NAS pour cette refonte frontend. Les sauvegardes société et adresse réutilisent les API protégées et auditées existantes ; ce sont deux écritures successives, pas une transaction commune. La validation du formulaire précède les écritures. Une erreur d’adresse après création est signalée, conserve la saisie et permet de réessayer avec le même identifiant société. Les fichiers historiques de galerie restent conservés.

La révision de charte et les onglets Contacts ne nécessitent aucune nouvelle migration ou installation NAS. Les compteurs utilisent des requêtes de lecture limitées à une ligne et au champ id via service / repository, sous les API Rules Contacts existantes. Aucun superuser, modification des images originales ni nouvelle route backend.

La navigation Paramètres par module, le menu partagé des combobox et le retrait du pied de page sont des changements frontend. Aucune nouvelle installation PocketBase pour ce lot. L’accès aux référentiels reste une lecture utilisateur actif ; les écritures restent limitées à `settings.references` et contrôlées par les hooks existants. Les pages de périmètre des futurs modules n’exposent pas de secrets ni de contrôles d’administration non raccordés.


### Installation NAS des deux relations sociétés — 5 octobre 2026

La décision métier admet uniquement Client (`customer`) et Fournisseur (`supplier`), cumulables. Migration `1791158401_company_roles.js` et validation dans `contacts.pb.js`, permissions / audit inchangés. L’utilisateur indique une base sans relations historiques ; la migration refuse néanmoins les anciens rôles inattendus et ne supprime aucun enregistrement.

Archive complémentaire : `/private/tmp/horizon-company-roles.zip`, SHA-256 `b94a35740559734f7650e35dd8b905f3330e3073d0fa064653496745ed04740c`. Elle contient uniquement `pb_migrations/1791158401_company_roles.js` et `pb_hooks/contacts.pb.js`. Après sauvegarde et arrêt selon la procédure NAS existante, copier la migration dans `/volume1/docker/horizon/pb_migrations` et remplacer le hook correspondant dans `/volume1/docker/horizon/pb_hooks`, préserver les autres fichiers, puis redémarrer PocketBase. Vérifier le journal et les deux valeurs du champ `contacts_company_roles.role`, puis recetter le cumul Client / Fournisseur. En cas de rôle historique inattendu, la migration s’arrête pour résolution explicite ; ne pas forcer la suppression. Cette archive complète l’installation des référentiels déjà effectuée ; aucun déploiement distant n’a été réalisé par l’agent.

Création avec relations commerciales : orchestration par le service Contacts via les API existantes et leurs permissions / audit. Écritures successives société, relations puis adresse, sans transaction commune. En cas d’échec des relations ou de l’adresse, reprise avec le même identifiant société ; relecture des relations et mise à jour différentielle pour éviter les doublons. Aucun nouveau schéma ou hook pour l’affichage des choix à la création ; l’archive des deux rôles décrite ci-dessus reste la version backend requise.


Recherche d’entreprises — décision finale : appel anonyme direct du navigateur à l’API publique de l’État, sans cookies ni token Horizon (`credentials: omit`), délai dix secondes et validation Zod. Aucun relais, secret ou mise à jour NAS nécessaire pour ce parcours. La sauvegarde ordinaire conserve les permissions et validations PocketBase. Le statut historique ne sert plus qu’à vérifier la révision du schéma Contacts ; les anciennes routes fournisseur ne sont plus utilisées et sont retirées du code local. Cette décision remplace les contraintes Pappers ci-dessus.


Suppression Contacts — le contrôle de relations est effectué côté PocketBase avant les cascades natives dans onRecordDeleteRequest et dans une transaction. Il concerne aussi les suppressions HTTP administrateur. Les comptes et rôles actifs doivent avoir contacts.read + contacts.write avant le contrôle, sans révéler de détail d’une pièce inaccessible. Les hooks modèle contrôlent également les suppressions internes ordinaires ; tout futur code serveur supprimant des contacts doit réutiliser le contrôle avant un app.delete susceptible de déclencher des cascades. Ne pas supprimer un contact référencé par un document via une cascade métier.

Installer ensemble `pb_migrations/1791158402_contact_deletion.js`, `pb_hooks/contacts.pb.js`, `pb_hooks/lib/contact-deletion.js` et `pb_hooks/lib/audit.js`. Sauvegarder, arrêter le service NAS, copier ces fichiers aux chemins correspondants sous /volume1/docker/horizon, préserver tous les autres hooks / migrations et pb_data, puis redémarrer et vérifier les journaux. Ne pas installer la migration seule, car elle ouvre les deleteRule et exige les contrôles du hook. L’ancienne instance sans migration refuse la suppression ; la recherche publique directe reste indépendante de cette évolution. Aucun déploiement NAS n’a été effectué par l’agent.


Archive NAS préparée : `/private/tmp/horizon-contact-actions.zip`, SHA-256 `31947dcd1e3d7fe726de8d8d3f115f0f52cf30341a6356aa4f859ed953d051e6`. Contient exactement les quatre fichiers de suppression indiqués ci-dessus, avec les chemins pb_hooks / pb_migrations. À installer ensemble sur l’instance Contacts / Référentiels existante, après sauvegarde et arrêt du service. L’archive ne contient ni base, secret, configuration ni fichier de recherche publique.


Comptabilité société — installation de la migration 1791158403 et des hooks associés requise avant édition. La route historique de révision retourne désormais contacts_revision=3 lorsque RCS et profils tiers sont installés ; le frontend refuse l’écriture sur un ancien schéma pour éviter la perte silencieuse des nouveaux champs. La recherche TVA reste un appel public direct, sans clé ni nouveau relais PocketBase.

L’audit des comptes tiers et les validations sont serveur ; les comptes n’autorisent aucun accès aux écritures d’un futur module Comptabilité. L’état de préparation de facturation électronique et l’adresse sont des données saisies, pas une certification fiscale ni une vérification d’annuaire. Aucun secret ou token de plateforme n’est stocké dans ces champs. La suppression contrôlée vérifie aussi les références aux comptes / adresses propres avant leur nettoyage transactionnel.


Archive NAS de ce lot : `/private/tmp/horizon-company-accounting.zip`, SHA-256 `9b264ace2400bd9cc330b047c2e6485369e05530d2991364d1a399f6abca4593`. Elle regroupe migrations 1791158401 (rôles), 1791158402 (suppression) et 1791158403 (profil comptable), hook Contacts, bibliothèques audit / suppression / statut de révision. Elle remplace l’archive complémentaire des seules actions de fiche pour une instance ayant déjà les référentiels Contacts 1791158400. Installer les sept fichiers ensemble après sauvegarde et arrêt du service, en conservant pb_data et tous les autres hooks / migrations ; redémarrer, vérifier le journal des migrations et la révision 3, puis recetter. Les migrations déjà appliquées ne se rejouent pas. Aucun déploiement NAS effectué par l’agent.


### LEI — ajout automatique ou manuel autorisé (5 octobre 2026)

Prérequis : lot Comptabilité société `1791158403` installé. Le frontend exige maintenant `contacts_revision=4` ; le statut 4 requiert le champ LEI et la collection des comptes tiers.

Option manuelle pour ce petit ajout, explicitement autorisée par l’utilisateur :
1. Dans l’administration PocketBase, collection `contacts_companies`, ajouter un nouveau champ **Text** nommé `lei` (ne pas renommer `rcs_number`).
2. Facultatif, longueur maximale **20**, expression régulière **`^[A-Z0-9]{20}$`**. Laisser les autres réglages par défaut. Enregistrer la collection.
3. Mettre à jour `pb_hooks/lib/company-lookup.js` depuis le lot LEI et redémarrer PocketBase : cette petite bibliothèque permet au contrôle de compatibilité de reconnaître la nouvelle révision. Ce n’est pas un relais de recherche entreprises.
4. Conserver également `pb_migrations/1791158404_company_lei.js` dans les migrations : elle reconnaît un champ ajouté manuellement avec cette définition exacte sans doublon et sans effacer de données. Une définition différente bloque la migration, à corriger explicitement.

Option automatique : arrêter PocketBase, copier les deux fichiers du lot LEI dans leurs dossiers respectifs, puis redémarrer selon la procédure NAS habituelle. Préserver `pb_data` et les autres hooks. Ne pas supprimer les anciennes colonnes RCS/fiscales.

Archive delta `/private/tmp/horizon-company-lei.zip` (2 fichiers), SHA-256 `2de074f2253e87bf07a02386ba88be1204b3f58182431961a338c74bbacb520d`.
Si le lot Comptabilité précédent n’est pas installé, utiliser le lot combiné `/private/tmp/horizon-company-accounting-lei.zip` (8 fichiers), SHA-256 `06c816681507f249ae01feaadc45c4f9a0d747ad1c76f1c9744299c323f1a06b`, avec les prérequis contacts/référentiels déjà documentés. Il contient les migrations rôles, suppression, comptabilité et LEI et leurs bibliothèques mises à jour. La collection comptable complète relève d’une migration, pas de ce simple ajout manuel.

Aucun fichier ni donnée du NAS n’a été modifié pendant les vérifications : bases de tests locales jetables uniquement.


### Installation Notifications et recherche de logos — 5 octobre 2026

Lot NAS `/private/tmp/horizon-notifications.zip` : `pb_migrations/1791158405_notifications.js` et `pb_hooks/notifications.pb.js`. Arrêter PocketBase, copier ces fichiers dans les dossiers correspondants sans remplacer les autres fichiers ni pb_data, redémarrer : la migration crée automatiquement la collection. Aucun ajout manuel nécessaire. Prérequis : core_users/core_roles déjà installés. Une collection homonyme préexistante entraîne un refus explicite, sans écrasement.

Notifications : List/View uniquement au destinataire core_users actif avec rôle actif ; Create/Delete verrouillés pour les utilisateurs. Update réservé au destinataire et interdit toute modification du destinataire, du contenu, de l’origine ou de created. Le hook impose read_at côté serveur et conserve la première lecture. Une mise à jour ne peut donc ni antidater la lecture ni rendre une notification non lue. Production des messages réservée aux futurs workflows serveur via NotificationService ; aucun endpoint public de création ajouté.

Recherche logos : appels directs du navigateur à commons.wikimedia.org (recherche) et upload.wikimedia.org / thumb.wikimedia.org (images), sans cookies ni token PocketBase. Pas de relais serveur ni URL arbitraire de téléchargement, ni secret ni nouvelle permission métier. Le droit de sauvegarder le logo reste contacts.write via les règles existantes. Filtrage JPEG / PNG / WebP, maximum 2 Mio, contrôle de décodage avant ajout au brouillon ; SVG jamais envoyé en base, rendu PNG Wikimedia utilisé. Une image bloquée ou un service indisponible donne un message explicite et conserve l’import local. Les fichiers protégés existants restent protégés après sauvegarde.

SHA-256 du lot Notifications (2 fichiers) : `c0da2928734a5c45cd3b423c5b2cfa15554ae433ea6b52aca3303f3448d9dc2d`.


### Lot Activité — installation NAS

Installer le lot complet `/private/tmp/horizon-activity.zip` (9 fichiers) : migrations 1791158405 Notifications et 1791158406 Activity ; hooks activity.pb.js, contacts.pb.js, notifications.pb.js ; bibliothèques audit.js, activity.js, activity-request.js, notification-service.js. Prérequis : dernier lot Contacts/Comptabilité/LEI déjà installé. Arrêter PocketBase, copier les fichiers dans leurs dossiers respectifs en préservant tous les autres hooks/migrations et pb_data, puis redémarrer. Les collections et le champ de liaison de notification sont créés automatiquement ; rien à ajouter à la main. Notifications déjà installées : sa migration est ignorée normalement. La migration refuse des collections Activity homonymes au lieu d’écraser un schéma existant. Le backfill conserve les dates/auteurs des anciens audits et ne modifie aucune fiche.

Activity Rules : compte core_users actif et rôle actif avec contacts.read ; source contacts autorisée réellement existante. Écriture de publications et changements de tâches : contacts.write en plus et source active vérifiée serveur. Messages et événements ne peuvent être modifiés ni supprimés via REST ; changements automatiques non publiables par un utilisateur. Le hook écrase auteur/date/metadata : aucun faux diff, auteur arbitraire ou horodatage historique accepté. Pièces jointes protégées via token fichier et View Rule ; refus des fichiers HTML/SVG/exécutables. L’UI ne rend pas du HTML des commentaires. Téléchargement limité aux fichiers protégés Horizon, jamais à une URL utilisateur arbitraire.

Annuaire de mentions : route authentifiée dédiée, contacts.write, projection id/nom/initiales de 15 collègues actifs autorisés à lire Contacts, aucun e-mail/password/token/rôle privé exposé. Validation serveur des destinataires à la publication. Transactions garantissent rollback de publication/audit/mentions si une notification ou tâche échoue. Le regroupement accepte un identifiant d’opération fourni par le client mais lie toujours source et auteur côté serveur ; core_audit conserve chaque écriture et ne dépend pas de ce regroupement. Fenêtre de regroupement d’une minute.

La disparition d’une source rend ses événements, tâches et fichiers inaccessibles aux utilisateurs ; les traces sont conservées pour l’administration. Les champs source polymorphes ne sont pas des pièces métier qui bloquent une suppression. La garde de suppression existante continue à protéger les vraies pièces liées. Aucun déploiement ni écriture sur NAS effectué durant les tests.

Lot Activité : 9 fichiers, SHA-256 `9111e7556947cdd1ecbc8db1d6dffdc79485fd04f540ed8a4beda42e3da6608d`.


Suppression de fichier publié : POST /api/horizon/activity/attachments/delete, authentification core_users, compte/rôle actifs et contacts.read + contacts.write. Entrée event_id/filename uniquement ; contrôle de la publication Contacts, de sa source active réellement existante et de l’appartenance exacte du fichier à attachments. Aucune URL ou chemin arbitraire accepté. Le PATCH/DELETE REST de publication reste verrouillé ; seule cette route peut retirer un fichier. Transaction : mise à jour de la liste, audit technique avant/après avec acteur serveur et événement document de suppression. En cas d’échec de l’audit, aucune suppression ni trace partielle ; testé jusqu’au téléchargement du fichier après rollback. Aucun changement de schéma : mettre à jour les deux hooks activity.pb.js et lib/activity-request.js sur le NAS, puis redémarrer PocketBase. Le lot complet Activité ci-dessus est actualisé pour inclure cette modification.

Lot de mise à jour pour une installation Activité existante : `/private/tmp/horizon-activity-attachments.zip` (2 hooks), SHA-256 `20215536993a420ae8c912e7154e40d7bba51eb20e30f78529c2e43e62d071d7`. Arrêter PocketBase, remplacer les deux fichiers aux chemins inclus dans l’archive, redémarrer ; aucune migration ou modification manuelle de collection.


Google Images + collage (6 octobre 2026) : frontend uniquement, aucun hook/migration NAS, clé API ou relais ajouté. Ouverture HTTPS Google avec query encodée, fenêtre sans opener/referrer ; seuls les mots-clés/format sont transmis. Aucun scraping ni import automatique d’une URL de presse-papiers. Réception d’un File via événement paste explicite, validation PNG/JPEG/WebP et limite 2 Mio puis décodage. SVG/HTML et fichiers invalides refusés. Aperçu data URL local, lecteur annulé à la fermeture ; sauvegarde et permissions suivent le module propriétaire existant.


### Installation NAS — Adresses société, 6 octobre 2026

Lot `/private/tmp/horizon-company-addresses.zip` (6 fichiers), SHA-256 `1dce97bf6a05673581cd0e067ccf5226c9b0ec813ed669f82c2b3a29367d65e6`. Prérequis : lots Contacts / Comptabilité / LEI et Fil d’activité déjà installés. Contient la migration `1791244800_company_addresses.js`, le nouveau hook `addresses.pb.js` et sa bibliothèque `lib/addresses.js`, ainsi que les mises à jour de `contacts.pb.js`, `lib/activity.js` et `lib/company-lookup.js`.

Sauvegarder, arrêter PocketBase, copier les six fichiers sous `/volume1/docker/horizon` dans leurs dossiers respectifs en conservant tous les autres hooks / migrations et `pb_data`, puis redémarrer. La migration ajoute automatiquement email / libellé aux adresses et adapte les contraintes postales ; aucun ajout manuel. Elle refuse des champs homonymes ajoutés hors migration au lieu de les écraser. Vérifier les journaux et `contacts_revision=5` sur `/api/horizon/company-lookup/status` avec un compte Contacts autorisé. Le frontend bloque l’écriture si la révision 5 n’est pas installée. Aucun déploiement NAS effectué par l’agent.

La route `/api/horizon/contacts/addresses/save` exige un compte `core_users` et un rôle actifs, `contacts.read` et `contacts.write`, une société active et des adresses appartenant à celle-ci. Identifiants et champs en allowlist, limite de 100 éléments par batch. Chaque remplacement d’adresse principale et la sauvegarde du batch sont transactionnels, audités et groupés dans le fil. Un identifiant de création fourni par le client sert uniquement à la reprise sans doublon, jamais à l’autorisation. Adresses d’une autre société et modifications d’une société archivée refusées. La sauvegarde globale de la fiche reste une séquence avec reprise explicite des erreurs partielles.


Thème d’interface : préférence non sensible stockée uniquement dans `localStorage` sous `horizon.theme` (valeurs `light` / `dark` contrôlées). Aucun appel API, secret, compte ou droit métier stocké par ce mécanisme. Lecture avant affichage et gestion des erreurs de stockage ; suppression / valeur inconnue revient au clair. Pas de migration ni lot PocketBase supplémentaire pour le thème.

### Lot NAS — Vues enregistrées et regroupements Contacts

Prérequis : installation Contacts actuelle avec référentiels / adresses, authentification et audit/activité déjà en place (révision Contacts 5). Archive `/private/tmp/horizon-views-groups.zip`, quatre fichiers à copier dans le dossier PocketBase en conservant leurs chemins : `pb_migrations/1791244801_saved_views.js`, `pb_hooks/saved-views.pb.js`, `pb_hooks/contact-groups.pb.js`, `pb_hooks/lib/contact-groups.js`. Sauvegarder base et fichiers, arrêter le service, copier les quatre fichiers ensemble sans effacer les autres hooks/migrations/pb_data, puis redémarrer et vérifier le journal de migration. Aucune intervention manuelle sur les champs de collection n’est nécessaire ; aucune modification du NAS effectuée par l’agent.

Après installation, ajouter explicitement `core.views.manage` dans la liste JSON de permissions des rôles administrateurs concernés, en conservant leurs autres permissions ; aucune attribution automatique dans la migration. `contacts.read` reste nécessaire. Les utilisateurs ordinaires n’ont pas besoin de ce nouveau droit pour créer leurs vues personnelles ou globales. Owner est dérivé côté serveur de l’acteur, ne peut pas être transféré, context immuable. Admins des vues peuvent consulter les privées pour les gérer ; collègues ne lisent que leurs personnelles et les globales. La migration conserve toutes les données métier et refuse le rollback destructif. La révision de sauvegarde Contacts reste 5 : ce lot est indépendant de l’écriture des fiches.

Recette NAS : un lecteur crée une vue privée et une globale ; un autre lecteur ne voit pas la privée, utilise la globale sans modifier/supprimer ; créateur et administrateur peuvent renommer, changer les critères/visibilité et supprimer avec confirmation. Vérifier le refus des tentatives REST de transfert d’owner, critères non autorisés et context incompatible. Regrouper sociétés par pays et personnes par société, vérifier totaux, seconde page d’un groupe et données sans siège/société. La route ne reçoit aucun SQL libre, lie toutes les valeurs, utilise une allowlist de colonnes et protège l’accès par compte/rôle actif + contacts.read ; les fiches sont ensuite lues par l’API standard et ses API Rules.

Empreinte de l’archive Vues/regroupements : SHA-256 `d78f26c28d2aceb296d5d94e879565c415909f6579159c99695b6a9df41bb61f`.

### Lot NAS — navigation des fiches Contacts

Archive locale `/private/tmp/horizon-navigation-fiches.zip` : deux fichiers `pb_hooks/contact-groups.pb.js` et `pb_hooks/lib/contact-groups.js`. SHA-256 : `773ffa629a76173fe81b1da18cca514c875bd6805aea6adfe5ab1277a2694b7d`. Sur le NAS déjà à jour avec Contacts / adresses / référentiels et le socle Auth / Activity : sauvegarder, arrêter PocketBase, remplacer uniquement ces deux fichiers aux mêmes chemins, conserver les autres hooks/migrations et pb_data, puis redémarrer. Aucune migration ni nouvelle permission ; route auth core_users, rôle et utilisateur actifs, contacts.read requis. Le lot Vues / Groupes a aussi été régénéré avec ces hooks pour éviter un retour à une version antérieure. Aucun déploiement NAS réalisé par l’agent. Vérifier un compteur, un changement de fiche et un filtre après installation ; si la route manque, la fiche reste accessible et la navigation propose de réessayer.

### Correction des libellés du fil — 6 octobre 2026

Lot `/private/tmp/horizon-activity-labels.zip` : un fichier `pb_hooks/lib/activity.js`, SHA-256 `dfbff23fef29eeb65758263b18eeca2d343eaaa99b38595835033cd5c1d6becc`. À appliquer après les lots Activité / Adresses existants : sauvegarder, arrêter PocketBase, remplacer uniquement cette bibliothèque puis redémarrer. Aucune migration ni champ à ajouter. Les modifications de rôles, adresses et comptes sont des changements de la société ; seuls création / archivage / réactivation de la fiche racine produisent ces actions dans son fil. Les audits techniques restent attachés à leur objet propre. Les anciens événements ne sont pas réécrits : le frontend déduit les transitions réelles du champ Statut, ce qui corrige également les anciens retraits de rôle mal libellés. Aucun déploiement NAS effectué.


### Installation NAS — CRM C01, premier lot du 6 octobre 2026

Archive locale `/private/tmp/horizon-crm-c01.zip` : 34 fichiers, tous les hooks et migrations du dépôt à cette livraison, chemins `pb_hooks/…` et `pb_migrations/…`. SHA-256 `b2b8370eb9d7655fe90202dc121796fe53b9d5e7e456eb174ea06a4c46712af0`. Elle contient notamment `1791244802_crm.js`, les routes CRM et les services serveur de numérotation / analytique, ainsi que le fil partagé adapté aux permissions de chaque module. Aucun secret, binaire, fichier de données ou compte de test dans l’archive. Ce lot consolidé remplace les versions de hooks des anciens lots ; ne pas réinstaller ensuite une ancienne bibliothèque Activité.

Prérequis : PocketBase 0.40.4 et installation Horizon actuelle. Les collections `crm_stages`, `crm_opportunities`, `accounting_analytic_accounts` et `settings_numbering_sequences` doivent être absentes avant la première application de la migration : elle refuse des collections homonymes créées manuellement plutôt que de les écraser. Aucun champ à ajouter à la main. Les migrations déjà appliquées ne sont pas rejouées.

Installation sur le NAS :

1. Faire une sauvegarde PocketBase, puis arrêter `horizon-pocketbase` et conserver une copie de `pb_data`, des hooks et migrations actuels.
2. Décompresser le lot et copier son contenu dans `/volume1/docker/horizon`, en conservant les chemins `pb_hooks` et `pb_migrations`. Conserver `pb_data` et les autres fichiers de l’installation.
3. Redémarrer le conteneur avec son image, ses ports et ses montages existants (`/pb_data`, `/pb_hooks`, `/pb_migrations`). Vérifier les journaux : migration CRM appliquée sans erreur.
4. Ajouter explicitement `crm.read` aux rôles lecteurs du CRM ; ajouter aussi `crm.write` aux rôles qui créent / modifient les opportunités. Conserver leurs permissions existantes. `contacts.read` permet les sélecteurs société / interlocuteur et l’ouverture de leurs fiches ; `settings.references` autorise la configuration des étapes. Aucun droit n’est attribué automatiquement.
5. Utiliser le frontend de cette livraison. Créer une opportunité de test, vérifier son numéro et son compte analytique identiques, déplacer sa carte sans écriture avant Enregistrer, puis publier une note. Vérifier aussi un lecteur seul et un compte sans `crm.read`.

La séquence démarre à `00001`. Avant la première utilisation, un administrateur peut régler le prochain numéro dans `settings_numbering_sequences` (exemple `11450`), le préfixe, suffixe et padding selon le besoin. Pour ce premier lot, le pattern pris en charge est `{sequence}` et la remise à zéro est `never` ; aucun numéro n’est calculé dans le navigateur. Les numéros déjà attribués restent immuables. La création du numéro, de l’opportunité, du compte analytique, de leur lien et de l’audit est transactionnelle ; une reprise de création utilise une clé d’idempotence liée à l’acteur.

Les lectures sont soumises aux API Rules CRM ; les écritures directes REST des opportunités, comptes et séquences sont fermées. Les routes métier vérifient compte / rôle actifs, droits, champs autorisés, liens vers société / contact, étape, responsable et devise. La sauvegarde et les déplacements refusent une version obsolète (`409`). Le fil, les tâches, les fichiers protégés et les notifications vérifient les droits sur leur source effective : `contacts.read` ne donne aucun accès au fil CRM. Les mentions ne donnent aucun accès supplémentaire.

L’archivage préserve l’affaire et son compte analytique. La suppression d’une opportunité possédant ce compte est refusée ; la purge et la clôture comptable ne font pas partie de ce lot. Le rollback destructif est refusé : en cas de retour à une version précédente, restaurer la sauvegarde cohérente plutôt que supprimer les collections manuellement. Tests réalisés uniquement sur des bases temporaires locales ; aucun déploiement ni modification du NAS effectué par l’agent.


### Lot NAS — révision CRM : étapes, marchés et description

Archive `/private/tmp/horizon-crm-pipeline.zip`, 37 fichiers (hooks et migrations consolidés), SHA-256 `5dd2676a43c18da7a29235e36be2c26fd417b11ea07fc4cf3226c0be6c0f2026`. Utiliser ce lot à la place du premier lot C01 pour une installation neuve, ou pour mettre à niveau un C01 déjà installé. Même procédure sauvegarde / arrêt / copie dans `/volume1/docker/horizon` / redémarrage que ci-dessus, conserver pb_data et vérifier les journaux. Nouvelle migration `1791244803_crm_pipeline.js` ; aucune collection ni champ à créer manuellement. Aucun nouveau droit : crm.read / crm.write et settings.references pour administrer étapes et marchés, puis reconnexion Horizon si le rôle vient de changer.

La migration garde numéros, comptes analytiques, personnes / sociétés et descriptions texte. Les trois anciennes étapes standard passent inactives ; leurs affaires passent dans les nouvelles étapes selon leur état commercial. Une affaire déjà gagnée reste gagnée. Les étapes personnalisées sont conservées ; un ancien état fermé indépendant d’une étape est transféré à l’étape correspondante pour rétablir la cohérence. Un changement de signification d’une étape utilisée est refusé par le hook serveur, codes immuables et suppression des référentiels verrouillée.

La description accepte uniquement le JSON de l’éditeur partagé : types de nœuds, attributs et marques en allowlist, aucun HTML, lien ou image embarqué ; maximum 100 Ko, profondeur 20, 3 000 nœuds et projection texte 10 000 caractères. La projection texte est calculée côté serveur, jamais prise comme vérité distincte du JSON. Les anciennes descriptions s’ouvrent comme texte littéral. Agrégats Kanban via route CRM authentifiée, droits CRM contrôlés avant SQL, paramètres liés et champs de filtre en allowlist ; aucune somme entre devises. Fichiers / mentions et permissions du fil inchangés.

Recette après installation : six étapes actives dans l’ordre demandé, marchés disponibles dans Paramètres / formulaire, ancien numéro et compte inchangés, replier/déplier une colonne conserve son total, déplacement automatiquement enregistré au dépôt met aussi l’état commercial à jour, description formatée conservée au rechargement. Une liste obligatoire peut être effacée dans le brouillon mais la sauvegarde est refusée tant qu’elle est vide. Lot vérifié localement ; aucun déploiement NAS effectué.


Préférence de repli du Kanban : localStorage par identifiant utilisateur, uniquement une liste bornée d’identifiants d’étape validés. Aucun secret ni contenu d’opportunité, aucune nouvelle permission ou migration. La préférence n’est pas synchronisée entre appareils.

### Lot NAS — paramètres CRM et marchés multiples, 7 octobre 2026

Archive `/private/tmp/horizon-crm-settings.zip`, 38 fichiers de hooks / migrations consolidés, SHA-256 `2d2f295aaaaabf6a304c32a6a1925a47d8c446e663153c590e31b678ddd4d6a3`. Remplace le lot CRM pipeline : sauvegarder PocketBase, arrêter horizon-pocketbase, copier pb_hooks et pb_migrations dans /volume1/docker/horizon en conservant pb_data, puis redémarrer et vérifier les journaux. Nouvelle migration `1791331200_crm_settings.js` ; aucun champ à créer manuellement. Installer aussi le frontend de cette livraison : le contrat market_type devient market_types. La migration conserve les marchés existants, numéros et comptes analytiques ; rollback destructif refusé. Aucun déploiement NAS effectué par l’agent.

settings_crm : lecture avec crm.read ou settings.references, mise à jour uniquement settings.references, création / suppression API interdites. Réglages globaux audités ; les codes des étapes / marchés restent immuables. Palette et default_view validés par champs Select serveur. Marchés multiples bornés à 50, références actives requises pour tout nouvel ajout, suppression des doublons côté serveur. Les droits d’édition du CRM ne donnent pas les droits d’administration des réglages. Recette après installation : réglage de couleur depuis colonne, tag de même couleur dans la liste, choix de vue initiale, sauvegarde d’une fiche avec deux marchés.

### Lot NAS — séquences et étapes CRM fixes, 7 octobre 2026

Archive consolidée `/private/tmp/horizon-settings-sequences.zip`, 42 fichiers hooks / migrations, SHA-256 `52e517b281efe39997a48a3b6faa486fe423f2bbe99a0367b40db0bdadff7b32`. Remplace les archives CRM précédentes. Sauvegarder PocketBase, arrêter horizon-pocketbase, copier pb_hooks et pb_migrations dans /volume1/docker/horizon en conservant pb_data, redémarrer et vérifier les journaux ; installer aussi le frontend correspondant. Migrations `1791331201_numbering_settings.js` et `1791331202_fixed_crm_stages_colors.js`, aucune modification manuelle de champ. Aucun déploiement distant effectué par l’agent.

Séquences : lecture seulement avec settings.references, création / mise à jour / suppression REST verrouillées. Route POST /api/horizon/settings/sequences/save authentifiée core_users, utilisateur et rôle actifs, permission vérifiée avant accès, champs en allowlist, entiers bornés, préfixes / suffixes sans tokens ni caractères de contrôle. Rerelecture transactionnelle du compteur, contrôle updated + valeur attendue pour éviter une sauvegarde périmée pendant une allocation, audit dans la même transaction. Départ figé après émission, interdiction de recul ; allocation et has_issued sauvegardés ensemble. Pas de remise à zéro automatique ni de format date dans cette livraison.

Étapes : six états fixes, ajout / suppression / désactivation et changement de signification interdits côté serveur, titre / ordre / couleur configurables. Couleur facultative strictement #RRGGBB, jamais de CSS libre. Les anciennes étapes supplémentaires restent conservées inactives ; leurs affaires sont rattachées à l’étape fixe de même état commercial (open → qualified). Numéros, comptes analytiques, titres et documents conservés. Recette : six colonnes, aucun Ajouter une étape, couleur libre commune colonne / tag, compteur futur modifiable dans Séquences, historique inchangé, édition concurrente refusée.

### Lot NAS — Utilisateurs, droits et Employés, 7 octobre 2026

Archive consolidée `/private/tmp/horizon-access-employees.zip`, **47 fichiers** JavaScript (tous les hooks et migrations, sans base, secret ni configuration). SHA-256 `c9eeb97ec0856ec5368e132e8cc25470819343e916185e0c232ea9495e8ee281`. Remplace les lots CRM / Séquences précédents. Nouvelle migration `1791331203_access_employees.js`, hook `access.pb.js`, bibliothèques `access-policy.js`, `access-management.js`, `employees.js` ; mise à jour des garde-fous Activité / Séquences et des API Rules des collections existantes. Installer backend et frontend de cette livraison ensemble. Aucun déploiement distant effectué par l’agent.

**Désignation du premier Admin obligatoire avant la mise à niveau d’une base possédant des comptes Horizon.** L’e-mail doit correspondre à un compte `core_users` existant et actif. Dans la configuration serveur / environnement du conteneur PocketBase, ajouter `HORIZON_INITIAL_ADMIN_EMAIL` avec cet e-mail exact, jamais une variable `VITE_*`. Il s’agit d’un profil Admin applicatif Horizon ; aucun compte technique `_superusers` n’est fourni au navigateur. Aucune promotion fondée sur un libellé de rôle ou une permission historique. Variable absente sur une base possédant des comptes, e-mail inconnu ou compte inactif : migration refusée sans promotion arbitraire. Une base neuve vide peut reconstruire le schéma sans créer de compte privilégié.

Installation :

1. Confirmer explicitement le compte initial ; effectuer une sauvegarde cohérente de `pb_data` et de la configuration.
2. Arrêter `horizon-pocketbase` selon la procédure NAS existante. Ajouter la variable serveur ci-dessus au projet Container Manager / environnement réellement utilisé au démarrage.
3. Extraire l’archive et copier `pb_hooks` / `pb_migrations` sous `/volume1/docker/horizon`, conserver `pb_data` et les autres fichiers ; ne créer aucun champ manuellement.
4. Redémarrer / recréer le conteneur avec cette variable, selon le mode du projet. Vérifier les journaux et l’application de 1791331203. Les migrations déjà appliquées restent des no-op.
5. Reconnecter le compte choisi : Paramètres → Utilisateurs et accès est disponible. Configurer explicitement les profils / accréditations des autres comptes ; leurs rôles historiques restent intacts jusqu’à sauvegarde de leurs accès. En particulier, un ancien droit `settings.references` ne suffit plus sans Admin / Superuser.
6. Retirer la variable de bootstrap après migration réussie. Elle n’est utilisée que lors de cette migration. Recetter Admin, Superuser, User et Viewer, Employés / organigramme et les scopes HR autorisés / refusés. La protection du dernier Admin est obligatoire.

Contrat de sécurité : droits réévalués côté serveur à chaque requête, comptes / rôles actifs, matrice allowlist des seuls modules livrés. REST Users / Roles / HR / Teams non modifiable par compte applicatif. Création / édition des accès atomique avec rôle effectif dédié, version `updated` et audit sans mot de passe. Admin seul gère les accréditations ; `settings.references` et profil Admin / Superuser nécessaires pour les paramètres fonctionnels. Viewer ne peut écrire dans Contacts / CRM / HR / Activité même si un rôle historique contient une permission d’écriture. Règles REST false : refus PocketBase `400` à la création, `404` à la lecture hors périmètre ; routes métier : `403` sur action interdite.

HR : scopes self / reports (collaborateurs directs) / team / all sur annuaire, détails, API Rules et photos protégées. Ressource liée requise pour tout scope restreint ; Manager requis pour reports, équipe pour team. `hr.organisation.manage` nécessite contribution et scope all. Photos PNG / JPEG / WebP, 2 Mio maximum. Identités professionnelles uniquement dans ce lot, aucun salaire ou coût exposé. Hiérarchie sans cycle, manager actif, réaffectation requise avant son inactivation si collaborateurs actifs. Inactivation / fin d’activité désactive le compte lié atomiquement, sans effacer la ressource ni ses audits ; impossibilité de désactiver le dernier Admin actif. Les mentions / fichiers des autres modules restent contrôlés par leur source.

Le navigateur rafraîchit la session au rythme du socle et purge les caches lors d’un changement de droits ou de révision du compte. Ce rafraîchissement UX n’est jamais la source de l’autorisation ; un ancien token ne conserve aucun accès révoqué. À la désactivation, la connexion / le refresh est refusé. Le rollback destructif est refusé ; restaurer une sauvegarde cohérente en cas de retour arrière.

### Complément NAS — responsabilité Direction, 7 octobre 2026

Lot consolidé `/private/tmp/horizon-access-employees-direction.zip` : **48 fichiers** hooks / migrations, SHA-256 `b3081deafa3c8274d4bffb42439a4b4c5d9c0cb10357e8ad062168a25556b6eb`. Remplace le lot Utilisateurs / Employés ci-dessus, sans base ni configuration. Nouvelle migration additive `1791331204_hr_direction.js` : booléen `hr_employees.is_direction`, faux sur les ressources existantes ; relations, comptes et profils conservés. Pas de saisie manuelle de champ. Déployer backend et frontend ensemble selon la procédure ci-dessus. La nouvelle migration ne demande pas de variable de bootstrap ; si 1791331203 n’a pas encore été appliquée, sa désignation explicite du premier Admin reste nécessaire. Ce lot ne prétend pas résoudre un échec de démarrage du NAS dont le journal n’a pas été communiqué.

Direction et Manager sont des responsabilités organisationnelles exclusives. Serveur : responsable actif Manager / Direction, Direction sous Direction seulement, cycles interdits, contrôle organisation pour changement de responsabilité, réaffectation avant retrait. Aucun accès hérité, aucun Admin implicite, aucun élargissement de scope ; collaborateurs directs uniquement avec accréditation explicite. Rollback de 1791331204 refusé tant que des responsabilités Direction existent. Aucun déploiement NAS effectué par l’agent.

### Lot NAS — onglet Équipes / managers multiples, 7 octobre 2026

Archive consolidée `/private/tmp/horizon-access-employees-teams.zip` : **49 fichiers** hooks / migrations, SHA-256 `3749c6af729e4e913b91cef087fed6ccc3f6779c7c5fd55f9934dca00f6d857b`. Remplace le lot Direction précédent. Nouvelle migration additive `1791331205_team_managers.js` : relation multiple managers → hr_employees, code legacy caché sans suppression ni modification de ses valeurs ; équipes, identifiants et membres existants conservés. Identifiant technique des nouvelles équipes généré côté serveur. Aucun champ manuel ni nouvelle variable pour cette migration. Si 1791331203 n’est pas appliquée, sa désignation explicite du premier Admin reste obligatoire.

Installer backend et frontend ensemble selon la procédure NAS déjà documentée, après sauvegarde cohérente et arrêt du conteneur ; remplacer uniquement hooks / migrations, conserver le volume réel `/pb_data`. Gestion des équipes réservée Admin / Superuser, allowlist nom / managers / active, version updated et audit création / mise à jour / archivage / réactivation. Responsables nouvellement ajoutés accessibles dans le périmètre HR et désignés Manager ou Direction actifs. Une équipe active ne conserve pas un manager inactif ou sans responsabilité ; changement de statut / responsabilité bloqué tant que référencé par une équipe active. Réactivation contrôlée. Archivage conserve membres et responsables ; pas de suppression, pas d’affectation nouvelle à une équipe archivée. Code legacy absent des réponses métier ; le compte technique PocketBase conserve son accès aux données techniques. Aucun profil, scope ni droit hérité automatiquement.

Tests migration neuve et mise à niveau locale décrits dans 09. Aucun déploiement NAS effectué. Le signalement antérieur du conteneur qui ne démarre pas reste à diagnostiquer à partir de son journal ; ce lot ne remplace pas ce diagnostic.


### Lot NAS — couleurs des tags profils et responsabilités, 7 octobre 2026

Archive consolidée `/private/tmp/horizon-access-tags.zip` : **51 fichiers** hooks / migrations, SHA-256 `ab8434969bbea1ddc172ca652c10056c319e33d2a208da976f2c2fd970e6ca78`, contenu vérifié contre les sources. Remplace le lot Équipes précédent ; aucun fichier de base, secret ou configuration. Installer avec le frontend selon la procédure NAS existante, après sauvegarde et arrêt du conteneur, en conservant `/pb_data`. Nouvelle migration additive `1791331206_identity_tag_colors.js` et hook `identity-tags.pb.js`, sans modification des comptes, équipes ou employés. Aucune saisie manuelle ni variable supplémentaire pour ce lot ; la désignation du premier Admin reste requise si 1791331203 n’a pas encore été appliquée. Aucun déploiement distant effectué.

Lecture des seules sept couleurs par comptes core_users actifs et rôle actif ; création / suppression interdites via API. Écriture limitée aux profils Admin / Superuser avec settings.references ; invariants de code, label, ordre et état vérifiés côté serveur. Hexadécimal #RRGGBB ou vide et palette contrôlée. Modification auditée en transaction ; aucun effet sur les droits ni sur la hiérarchie. Superuser voit Utilisateurs et accès mais uniquement l’onglet Tags ; les endpoints de comptes restent réservés Admin.


## Lot AO / Calendrier partagé — 7 octobre 2026

Archive consolidée `/private/tmp/horizon-crm-ao.zip` : **56 fichiers** hooks / migrations, SHA-256 `78e834af7c678b62e69bc3aaefaaf6714cb3deec7e4d796830f90a7186cab17f` ; contenu vérifié contre les sources. Remplace le lot Tags et tous les lots précédents, sans base, secret ni configuration. Installer backend et frontend ensemble selon la procédure NAS existante : sauvegarder, arrêter le conteneur, copier `pb_hooks` et `pb_migrations` dans `/volume1/docker/horizon` en conservant `pb_data`, redémarrer, vérifier les journaux. Migration additive `1791331207_crm_tenders.js`, aucune saisie manuelle de champ. La désignation du premier Admin reste nécessaire si la migration Access / Employés n’a pas encore été appliquée. Aucun déploiement distant effectué.

Droits actuels : `crm.read` pour lecture / calendrier / Realtime, `crm.write` pour mutations AO, profils actifs et rôle actif vérifiés par les policies existantes. Les permissions fines `crm.tender.*` du périmètre cible ne sont pas encore actives. Paramètres AO : `settings.references` **et** profil Admin / Superuser côté serveur ; un User disposant seulement de la permission reste refusé. Les collections métier ont le CRUD REST en écriture fermé, les références n’autorisent pas la suppression. Les lectures suivent le périmètre CRM actuellement livré (module entier). Les noms d’employés ne sont pas renvoyés depuis le calendrier ; participants détaillés par le service RH selon ses droits.

Routes protégées : création / mise à jour via CRM save, rendez-vous via `/api/horizon/crm/tenders/appointments`, préparation via `/stage`, dépôt via `/submit`, projection via `/api/horizon/calendar/events`. Transactions, clés de reprise, numérotation atomique, versions de dépôt concurrentes, tokens `updated`, allowlists et audit acteur serveur. Pièces provenant uniquement du fil de l’opportunité ; les pièces déposées ne peuvent plus être supprimées, même par leur auteur. La garde de suppression et le dépôt travaillent dans des transactions pour éviter une référence à une pièce supprimée entre deux requêtes. Pas de suppression physique de rendez-vous ; annulation explicite, données historiques conservées.

Calendrier : sources filtrées **avant** retour, lecteur sans droit CRM reçoit zéro événement, utilisateur non connecté refusé. Période maximum 370 jours, recherche 200 caractères, filtres contrôlés, limite de 2 000 dossiers ou rendez-vous avec erreur explicite plutôt qu’un résultat tronqué. Dates / fuseaux validés et instants UTC ; paramètres de requête normalisés au format PocketBase pour inclure exactement la borne initiale. Realtime autorisé par les API Rules des collections source, sans accès superuser frontend.

Recette locale réussie sur une base neuve reconstruite par les migrations. La recette / sauvegarde / restauration sur le NAS reste requise avant exploitation. Le rollback AO refuse la destruction d’un dossier, rendez-vous ou dépôt historique.

## Conversion Directe / AO — 8 octobre 2026

Nouvelle migration additive `1791417600_tender_conversion.js` : date serveur `crm_tenders.archived_at`, dossiers existants actifs par défaut, aucune suppression ni renumérotation. Installer les hooks et migrations avec le frontend après sauvegarde / arrêt du conteneur selon la procédure existante. Ne pas modifier la base manuellement. Rollback refusé si un dossier archivé existe.

Conversion réservée à `crm.write` sur opportunité active, version de la fiche et du dossier contrôlée, audit + événement + changement d’état atomiques. Archive AO distincte de l’archive de l’opportunité : l’affaire directe reste active. Mutations du dossier mis en sommeil interdites ; ses relations et pièces déposées restent protégées. Calendrier filtre type et archivage avant retour. React ne fixe jamais archived_at.

Lot consolidé `/private/tmp/horizon-crm-conversion.zip` : 57 fichiers hooks / migrations, SHA-256 `7001115419d381a254d454fdf55d7b6ea4b8a91d82e2990c797a5c0ca6a13d61`, contenu contrôlé byte pour byte contre les sources. Remplace le lot AO précédent ; aucun fichier de base, configuration ou secret. Aucun déploiement distant effectué.


## Dossiers AO avant décision de répondre — 8 octobre 2026

Le lot courant remplace la création anticipée de l’affaire du premier lot AO. Migration additive `1791504000_standalone_tenders.js` : lien opportunité facultatif, index unique limité aux liens renseignés, données initiales propres au dossier, archivage et clés de reprise. Les opportunités historiques déjà liées restent conservées ; aucun nettoyage rétroactif ni renumérotation.

`À analyser` et `No go` ne créent aucune opportunité, aucun numéro et aucun compte analytique. La première transition vers une étape de réponse (`En préparation` et suivantes) crée et lie ces objets dans une transaction serveur. Concurrence et reprise contrôlées ; retour ultérieur en analyse / No go conserve l’affaire existante. `Perdue` reste une étape commerciale différente. Archivage explicite réversible, historique conservé. Les données communes après promotion sont lues et modifiées sur l’opportunité ; les champs initiaux du dossier restent un snapshot.

Routes `/api/horizon/crm/tenders` : liste / résumé / fiche, sauvegarde et archivage avec `crm.read` / `crm.write`, profil actif, contrôle de version et audit. Le DTO partagé avec les opportunités est une projection de lecture, sans faux numéro ni compte analytique. Les écritures directes REST restent fermées. Les listes et résumés refusent explicitement un résultat supérieur à 10 000 dossiers ; calendrier et rendez-vous restent bornés à 2 000. Filtres appliqués avant projection.

Le fil accepte `crm_tenders` dès l’analyse et reprend les anciens événements de l’opportunité liée sans copie. Permissions, mentions, tâches et fichiers protégés suivent leur source. Les pièces peuvent être préparées avant la décision ; dépôt versionné seulement après création de l’affaire. Le planning AO et le calendrier général utilisent la même projection serveur des publications, visites, soutenances, remises et périodes, sans duplication des dates.

Archive consolidée `/private/tmp/horizon-ao-decision.zip` : **59 fichiers** hooks / migrations, SHA-256 `097107511fe39950e13bef2785c7534276f9955c8bb99e4b16d2c809c021261a` ; contenu vérifié contre les sources. Remplace le lot Conversion précédent. Installer backend et frontend ensemble, après sauvegarde cohérente et arrêt du conteneur selon la procédure NAS existante ; conserver `pb_data`, ne pas modifier la base manuellement. Aucune donnée, configuration ou secret dans l’archive. Aucun déploiement NAS effectué. Rollback destructif refusé.

Couleurs des rendez-vous AO — 8 octobre 2026 : installer la migration additive `1791504001_appointment_kind_colors.js` et le hook `identity-tags.pb.js` mis à jour. La collection `crm_appointment_kinds` expose seulement les deux présentations fixes ; lecture avec crm.read / settings.references, modification de couleur réservée à Admin / Superuser avec settings.references, champs structurels immuables et audit. Aucun changement de kind des rendez-vous historiques.

Lot NAS — couleurs rendez-vous AO, 8 octobre 2026 : archive consolidée `/private/tmp/horizon-ao-rendezvous.zip`, **60 fichiers** de hooks / migrations, SHA-256 `4201585fbfd14771e9235e1af0acce6d14d4e98a0480c4cbc1e4e329a7fe9287`. Contenu vérifié byte pour byte, sans données, configuration ni secrets ; remplace le lot AO Décision. Nouvelle migration `1791504001_appointment_kind_colors.js`, hook `identity-tags.pb.js` mis à jour. Sauvegarder / arrêter horizon-pocketbase, copier pb_hooks et pb_migrations dans `/volume1/docker/horizon` en conservant pb_data, redémarrer / contrôler les journaux et installer le frontend correspondant. Aucun déploiement NAS effectué par l’agent.

Correctif NAS synthèse CRM — 8 octobre 2026 : erreur 400 reproduite sur les sommes décimales (DynamicModel inférait un entier pour amount), corrigée par typage float64. Patch `/private/tmp/horizon-crm-summary-fix.zip` : seulement `pb_hooks/lib/crm-summary.js`, aucun changement de base ni migration. Arrêter le conteneur, remplacer ce hook dans `/volume1/docker/horizon/pb_hooks/lib`, redémarrer. Lot consolidé corrigé `/private/tmp/horizon-ao-rendezvous-corrige.zip` : 60 fichiers, SHA-256 `890d3691325b3d1beff83e6ed8de806ccc360cf40c0346820850c8791328b629` ; remplace le paquet Rendez-vous précédent pour les futures installations. Contenus contrôlés, aucun déploiement distant effectué.

Devis — 8 octobre 2026 : migration 1791504002_sales_quotes.js et sales.pb.js / lib/sales.js / lib/pricing.js. Accréditations sales.read et sales.write dans Ventes, explicitement attribuées aux métiers ; les Admins existants reçoivent les deux droits à la migration. Création / modification nécessitent aussi crm.read pour le rattachement. REST en écriture fermé pour quotes, lines et orders ; serveur atomique pour numéro / idempotence / lignes / audit. Contrôle de version, brouillon uniquement modifiable, Viewer interdit en écriture. Quotes annulés et numéros conservés. Les totaux financiers CRM ne sont visibles qu’avec sales.read. Commandes : collection réservée, aucun endpoint de création ni simulation de confirmation. Aucune intégration comptable externe exécutée ; aucune donnée NAS modifiée par l’agent.


Archive consolidée Devis S01 : `/private/tmp/horizon-devis.zip`, 64 fichiers sous `pb_hooks/` et `pb_migrations/`, SHA-256 `08ddce3bc92789020ad4fd816156bc3d51d04b37a1e1065c40f0e5cf394fd15a`. Installer le frontend et le backend du même lot. Après sauvegarde cohérente de `pb_data`, arrêter le container, copier ces deux dossiers dans `/volume1/docker/horizon` en conservant `pb_data`, puis redémarrer et vérifier l’application de `1791504002_sales_quotes.js` dans les journaux. Reconnexion requise pour récupérer les accréditations ajoutées. Recette : ouvrir une opportunité, créer deux devis, vérifier les suffixes -1 / -2, annuler le second, contrôler la liste exhaustive et le revenu prévisionnel. Le NAS n’a pas été modifié par l’agent.


Devis S02 — migration `1791504003_sales_quote_editor.js` : conversion des lignes existantes en articles, champs de structure / coûts / remises / options et singleton `settings_sales`. Aucune renumérotation ni suppression de ligne historique à la migration. API Rules Activité / Tâches étendues exclusivement aux devis existants, avec sales.read / sales.write ; hooks contrôlant la source réelle, l’auteur et les destinataires. Devis annulé en lecture seule dans le fil. Largeurs / validité via `/api/horizon/sales/settings`, configuration réservée Admin / Superuser avec settings.references, allowlist / bornes et contrôle de version. L’audit de sauvegarde conserve les lignes avant / après ; core_activity_events fournit les changements et commentaires utilisateur. Les coûts et les totaux sont recalculés par Pricing serveur ; les options ne gonflent pas le revenu prévisionnel.

Archive consolidée S02 : `/private/tmp/horizon-devis-structure.zip`, 66 fichiers vérifiés, SHA-256 `c5b670b1c509bff48bbca4400e90adb05e18995bba4d4236b03f6a59050313e1`. Installer après sauvegarde / arrêt du container : copier `pb_hooks` et `pb_migrations` sous `/volume1/docker/horizon`, conserver `pb_data`, redémarrer et vérifier `1791504003_sales_quote_editor.js`. Frontend du même lot requis. Aucune intervention NAS réalisée par l’agent.

Devis S03 — migration `1791504004_quote_column_actions.js` : ajoute la largeur Option aux paramètres existants, conserve les largeurs personnalisées et garantit # ≥ 52 px / Actions ≥ 64 px. Bornes appliquées côté API et dans Paramètres → Ventes ; aucune modification des montants ou lignes historiques. Archive consolidée `/private/tmp/horizon-devis-grille.zip` : 67 fichiers vérifiés, SHA-256 `34debbe0c91c81f458bd8a4f3e349875a4b5d40345fa4d724f31565d7bbd02f9`. Après sauvegarde cohérente et arrêt du conteneur, copier `pb_hooks` et `pb_migrations` dans `/volume1/docker/horizon` en conservant `pb_data`, redémarrer / vérifier les migrations et installer le frontend correspondant. Aucun déploiement NAS effectué.

Devis S04 — migration additive `1791504005_quote_margin_tax.js` : marge / TVA de ligne, taux de devis, défaut TVA dans settings_sales. Aucune réécriture des montants historiques ; anciens taux initialisés à 0, nouveaux brouillons à 20 % selon configuration. Pricing et TaxService recalculent les montants côté serveur, contrôlent bornes / coût non nul pour le mode marge / sécurité entière des centimes, conservent les droits et l’immutabilité hors draft. Le taux par défaut reste réservé aux administrateurs de paramètres ; le taux du brouillon requiert sales.write. Les modifications TVA / TTC alimentent le fil et l’audit.

Archive consolidée S04 : `/private/tmp/horizon-devis-marge-tva.zip`, 69 fichiers vérifiés, SHA-256 `c53b4ddb393aaddf8e9633df93751c3aef074cb1e27d3a75f28bcde3005af918`. Sauvegarder pb_data, arrêter le conteneur, copier pb_hooks et pb_migrations sous `/volume1/docker/horizon`, conserver pb_data, redémarrer / vérifier 1791504005_quote_margin_tax.js, puis utiliser le frontend correspondant. Aucun déploiement distant réalisé.

Devis S05 — migration 1791504006_quote_heading_level3.js étend kind sans modifier les lignes historiques. Le serveur rejette tout tax_rate injecté dans les données du devis et lit le taux depuis settings_sales dans la transaction. Paramétrage réservé Admin / Superuser avec settings.references ; sauvegarde toujours draft-only et droits Sales inchangés. HRecordConfirmation conserve par défaut la saisie forte ; requireText=false uniquement pour retirer une ligne de brouillon avant sauvegarde.

S05 : core_audit.metadata limité à 2 Mio pour les devis longs, sans changement des permissions. Lot consolidé `/private/tmp/horizon-devis-sections.zip` : 70 fichiers vérifiés, SHA-256 `20b8311ed20e41cc21d353da8ecce69fbe2ab56e719f59ed7c4f7783cdab6e22`. Sauvegarder pb_data, arrêter le conteneur, copier pb_hooks et pb_migrations dans `/volume1/docker/horizon`, conserver pb_data, redémarrer / vérifier 1791504006_quote_heading_level3.js, installer le frontend correspondant. Aucun déploiement NAS réalisé.

Devis S07 : migration additive 1791504007_quote_footer_discount.js, remise document 0–100 % validée serveur, bases fiscales après allocation au centime et snapshots de marge. API rejette les montants calculés injectés ; sauvegarde draft uniquement, version / permissions / audit inchangés. Migration conserve les montants historiques et initialise les nouvelles bases depuis les lignes existantes. Installer les hooks, migrations et frontend correspondants ensemble.

Archive S07 `/private/tmp/horizon-devis-remise.zip` : 71 fichiers hooks / migrations vérifiés octet par octet, SHA-256 `c7a2ec2a42555067b14ed4224decda848c1678a8af88ea4acdf2a797ae7c4814`. Après sauvegarde cohérente de pb_data, arrêter le conteneur, copier pb_hooks / pb_migrations dans `/volume1/docker/horizon` en conservant pb_data, redémarrer et vérifier 1791504007_quote_footer_discount.js ; utiliser le frontend de ce lot. Aucun déploiement NAS effectué.

Devis S09 : migration 1791504008_quote_terms_units.js, unités centrales (code unique immuable, archivage, audit, écriture Admin / Superuser avec settings.references) et snapshots des CGV serveur. Montant de remise validé et borné, snapshots / totaux injectés refusés, cohérence draft / version / droits inchangée. Modèles CGV structurés en allowlist, texte simple 20 000 caractères / 30 entrées maximum. settings_sales.terms et core_audit.before / after autorisent jusqu’à 4 Mio pour les textes longs, sans modifier les droits ni supprimer les anciens audits. Aucun appel Sage / SUPER PDP ni document officiel généré.

Lot NAS S09 `/private/tmp/horizon-devis-cgv-unites.zip` : 72 fichiers hooks / migrations vérifiés, SHA-256 `ab1f6990940370881ecbc986e0c456a3f4f1b409d32e84d687af3700aaa44218`. Après sauvegarde cohérente de pb_data, arrêter le conteneur, copier pb_hooks / pb_migrations dans `/volume1/docker/horizon` sans toucher pb_data, redémarrer et vérifier 1791504008_quote_terms_units.js, installer le frontend correspondant. Aucun déploiement distant effectué.

Devis S10 : remplacer le hook lib/pricing.js avec le frontend correspondant pour les options de section. Héritage forcé côté serveur, aucune API Rule assouplie ni migration. Remises de ligne bornées à 0–100 % indépendamment du mode de remise globale.

Lot NAS S10 `/private/tmp/horizon-devis-options-sections.zip` : 72 fichiers hooks / migrations vérifiés octet par octet, SHA-256 `f3a3d7a6345c452d5cd39381565ebe6f6f2141ad84c43fb18d0d0d2b60555e53`. Remplace le lot S09 pour les options de section. Même installation avec sauvegarde de pb_data, conteneur arrêté puis redémarré et frontend correspondant ; aucune intervention distante effectuée.

CRM — choix Dernier état : installer `pocketbase/pb_migrations/1791504009_crm_last_view.js` avant le frontend correspondant. Migration additive du Select `settings_crm.default_view` : Kanban / Liste / Dernier état ; valeurs et permissions existantes conservées. Seul le réglage de départ est administré ; la dernière vue Kanban / Liste reste locale par utilisateur et navigateur.

### Gotenberg — préparation du NAS pour le studio Documents

L’utilisateur confirme le 8 octobre 2026 qu’aucun service Gotenberg n’est installé. Configuration préparée dans `deploy/gotenberg.compose.yaml`, image épinglée `gotenberg/gotenberg:8.37.0` ; aucune installation distante réalisée. Ce fichier est un complément au projet Horizon existant, pas un remplacement de son YAML PocketBase.

Dans Container Manager → Projet Horizon → YAML, ajouter l’entrée `gotenberg` sous les `services` existants. Conserver les montages, le port et les arguments actuels de PocketBase. Les deux services doivent partager le même réseau bridge privé : réseau par défaut du projet, ou réseau explicitement commun si PocketBase utilise un réseau dédié. Gotenberg n’expose aucun port sur le NAS : `expose: 3000` sert au réseau Docker uniquement. Aucun reverse proxy ou accès direct depuis le navigateur.

Redéployer le projet puis vérifier que le service passe healthy. Depuis le terminal du conteneur Gotenberg :

```bash
curl --fail --silent http://127.0.0.1:3000/health
```

D01 raccorde le Document Service à `http://gotenberg:3000` via `HORIZON_GOTENBERG_URL`, variable serveur PocketBase uniquement, jamais `VITE_*`. Sans cette variable, l’aperçu HTML fonctionne et la génération PDF renvoie une erreur compréhensible.

Configuration initiale : plafond 1 Gio, sans quota CPU CFS (non pris en charge par le noyau du NAS signalé par l’utilisateur), mémoire partagée 256 Mio, deux conversions simultanées, file bornée et limite de requête 60 s / 25 Mio. Les ajuster après recette des devis volumineux. JavaScript, accès HTTP(S) sortants privés / publics et webhooks désactivés ; les images et polices du modèle devront être transmises avec l’HTML ou intégrées dans le document, sans récupération de ressources distantes par Chromium. Conversion LibreOffice désactivée pour ce lot HTML → PDF.

La conversion de recette complète (vrai devis → PDF) sera réalisée avec le Document Service. Docker n’est pas disponible dans le poste d’exécution de l’agent : configuration contrôlée statiquement, démarrage et conversion réels encore à vérifier sur le NAS. Sources officielles : [configuration](https://gotenberg.dev/docs/configuration), [version 8.37.0](https://github.com/gotenberg/gotenberg/releases/tag/v8.37.0).

Gotenberg — preuve de démarrage fournie par l’utilisateur le 8 octobre 2026 : export HTML des logs du conteneur `horizon-gotenberg-1`, version 8.37.0, Chromium démarré automatiquement et API en écoute sur le port 3000. Les avertissements de connexions Google bloquées correspondent au filtrage des adresses publiques configuré ; aucun échec de démarrage visible dans cet export. Ces logs ne prouvent pas encore l’état healthy, la communication depuis PocketBase ni une conversion PDF. Aucun accès distant effectué par l’agent.


### Installation NAS — Documents D01

1. Sauvegarder `pb_data` de manière cohérente et arrêter PocketBase. Copier le lot `pb_hooks` (y compris `assets` et ses polices intégrées) et `pb_migrations` sous les montages actuels `/volume1/docker/horizon`, sans remplacer ou supprimer `pb_data`.
2. Dans l’environnement du **service PocketBase**, ajouter `HORIZON_GOTENBERG_URL=http://gotenberg:3000`. Gotenberg est déjà lancé selon les logs fournis ; conserver son service et le réseau commun. Le fichier `deploy/gotenberg.compose.yaml` sert de complément, jamais de remplacement au projet existant.
3. Redémarrer PocketBase avec ses arguments habituels et vérifier l’application de `1791504010_documents_studio.js`. Installer le frontend correspondant. La migration verrouille le CRUD direct des modèles, ajoute les versions et attribue documents.template.manage seulement aux profils administratifs déjà autorisés dans Paramètres. Les futures accréditations Admin / Superuser reçoivent cette capacité via la policy serveur.
4. Dans Paramètres → Modèles de pièces, créer / enregistrer un modèle, choisir un vrai devis pour l’aperçu HTML puis PDF ; publier et vérifier le bouton PDF depuis le devis. Tester un devis multipage et les pieds / en-têtes répétés. La conversion réelle sur NAS n’est pas attestée par les tests locaux.

Les ressources du document sont embarquées (images PNG / JPEG / WebP, polices Inter / Montserrat sous SIL OFL). Aucun chargement de ressources externes par Chromium. Endpoint de conversion défini uniquement par l’environnement serveur ; aucun URL serveur, chemin de fichier ou HTML libre fourni par le navigateur. Réponse PDF bornée à 25 Mo, entête no-store et validation du type de contenu / signature PDF. Les aperçus ne créent pas de document finalisé. Les versions publiées sont immuables, y compris via les hooks de modification / suppression ; les modèles s’archivent.

### Installation NAS — Documents D02

Lot consolidé `horizon-documents-studio-D02.zip` : `pb_hooks` (avec toutes les polices / licences), `pb_migrations`, configuration Gotenberg et manifeste d’intégrité. Remplacer les hooks / assets et installer le frontend D02 ensemble, après sauvegarde et arrêt de PocketBase, puis redémarrer. Aucune migration supplémentaire à D01 : le nouveau JSON reste v1 et les anciennes versions publiées restent lisibles. La migration 1791504010 reste nécessaire si D01 n’a pas été installé. Conserver les montages et `HORIZON_GOTENBERG_URL` sur PocketBase ; ne pas toucher à `pb_data`. Vérifier un modèle contenant une adresse client, plusieurs blocs sur une ligne et une nouvelle police. Aucun déploiement NAS effectué par l’agent.

### Installation NAS — Documents D03

Le lot `horizon-documents-studio-D03.zip` remplace D02 (hooks, assets / polices, migrations consolidées et manifeste). Le défaut de position et de styles dans l’aperçu HTML était côté serveur : il faut mettre à jour `pb_hooks/lib/document-renderer.js` et `document-layout.js` avec le frontend D03, puis redémarrer PocketBase, pour voir la correction. Installer le lot complet après sauvegarde et arrêt du conteneur sans toucher à `pb_data` ; aucune migration supplémentaire à D01/D02. Les nouvelles valeurs d’ancrage sont en allowlist et les versions publiées ne sont pas réécrites. Gotenberg et `HORIZON_GOTENBERG_URL` restent identiques. Aucun déploiement NAS exécuté par l’agent.

### Installation NAS — Documents D04

Le lot `horizon-documents-studio-D04.zip` remplace D03 : hooks, assets / polices, migrations consolidées, complément Gotenberg et manifeste. Installer avec le frontend correspondant, puis redémarrer PocketBase. La validation serveur accepte les métadonnées de ratio / verrou d’image bornées ; aucun URL externe ni HTML libre ajouté. Aucune migration supplémentaire à D01. Les anciens types Totaux / CGV restent lisibles pour les publications historiques ; leur conversion en champs liés se fait dans la copie de travail et exige une sauvegarde explicite. Ne pas toucher à `pb_data` ; aucun déploiement NAS exécuté par l’agent.

### Installation NAS — Documents D05

Lot consolidé `horizon-documents-studio-D05.zip` : installer les hooks / assets avec le frontend correspondant, puis redémarrer PocketBase. Aucune migration supplémentaire à D01. Les propriétés facultatives des fonds restent dans le JSON v1 contrôlé : couleurs hexadécimales, opacités 0–1, ajustement contain / cover, images PNG / JPEG / WebP intégrées sous les mêmes bornes ; URLs distantes interdites. Le fond est isolé du texte dans le HTML et les documents de conversion PDF. Vérifier sur le vrai Gotenberg NAS la répétition / couverture des fonds et des zones d’en-tête / pied avant émission officielle. Aucun déploiement NAS effectué par l’agent.

Studio D07 : synchroniser frontend et hooks Documents pour le champ JSON facultatif `block.tableHeadings` (trois styles, uniquement sur un tableau). Validation serveur stricte et rendu HTML dédié ; aucune migration supplémentaire, anciens modèles inchangés et fallback sur `layout.headings`. Redémarrer PocketBase après remplacement des hooks.

### Installation NAS — Documents D09 à D14

Synchroniser le frontend avec les hooks Documents : validation et rendu des styles de tableau (en-tête, lignes, notes et trois niveaux de titres). Le JSON v1 et les modèles existants restent compatibles ; aucune migration supplémentaire depuis D01 pour ces styles. L’aperçu HTML paginé utilise Paged.js embarqué côté frontend, sans CDN. Configurer HORIZON_GOTENBERG_URL sur le service PocketBase, dans le même réseau Docker privé que Gotenberg, puis redémarrer PocketBase ; aucun port public supplémentaire requis. La génération PDF et les aperçus restent soumis aux permissions métier. Ne pas modifier les versions publiées ni les PDF historiques.

Documents D15 — correctif de rendu PDF (9 octobre 2026) : recopier `pocketbase/pb_hooks/lib/document-renderer.js` dans `/volume1/docker/horizon/pb_hooks/lib/document-renderer.js`, puis redémarrer le conteneur PocketBase pour recharger les hooks. Aucune migration ni modification de `pb_data`. Le fond des templates répétés est désormais borné à leur zone pour ne pas recouvrir la feuille. Les ajustements de pagination HTML appartiennent au frontend et sont pris en compte par Vite / une nouvelle compilation du frontend ; le ZIP NAS ne les remplace pas.

Documents D16 — installation NAS : recopier les hooks et ajouter la migration 1791504011_document_filenames.js dans pb_migrations, appliquer les migrations avec le binaire PocketBase et les chemins /pb_data et /pb_migrations, puis redémarrer PocketBase. automigrate=false reste conservé : il désactive la génération automatique de fichiers, pas leur exécution. Le redémarrage applique la migration présente dans le dossier monté. La migration ajoute une collection privée de formats et sa ligne par défaut ; aucun devis ni PDF historique n’est réécrit. Les hooks mis à jour requièrent cette migration avant utilisation. L’interface / zoom nécessitent la version frontend mise à jour.

Documents D17 — installation : mettre à jour les hooks (documents.js et document-filenames.js), puis redémarrer PocketBase ; aucune migration supplémentaire par rapport à D16. settings_document_files et sa migration D16 doivent déjà être installées. L’insertion des champs et la présentation sont frontend.

Documents — suppression des modèles jamais publiés : mettre à jour `pb_hooks/documents.pb.js` et `pb_hooks/lib/documents.js`, puis redémarrer PocketBase. Route POST `/api/horizon/documents/templates/delete`, réservée Admin / Superuser habilité documents.template.manage, updated obligatoire, contrôle transactionnel des versions et audit. Aucune migration supplémentaire. Toute version publiée interdit également la suppression via le hook de collection.


## Catalogue P01 — permissions et installation

Module Inventory devient disponible avec inventory.read / inventory.write, périmètre all ; aucune élévation des profils métier existants. Les administrateurs reçoivent l’accréditation du module à la migration. Viewer reste en consultation. Familles tarifaires : lecture inventory.read ou settings.references, écriture uniquement Admin / Superuser habilité settings.references. Produits / offres écrits par routes serveur, allowlist, validation, concurrence updated, transaction, audit, unicité du favori et historique de tarifs ; CRUD REST d’écriture verrouillé. Images protégées : accès inventory.read, extensions / MIME PNG JPEG WebP, tailles bornées, pas de téléchargement serveur d’URL distante.



Installation NAS — Catalogue P01 : installer les hooks complets et la migration additive `1791504012_inventory_catalog.js` avec le frontend correspondant. Le paquet `horizon-catalogue-P01-nas.zip` contient les dossiers `pb_hooks` et `pb_migrations`, les fichiers de déploiement et ce document ; il ne contient aucune base, clé ou configuration privée.

1. Sauvegarder la base PocketBase de manière cohérente et les hooks actuels.
2. Recopier `pb_hooks/` et `pb_migrations/` dans `/volume1/docker/horizon/`, aux emplacements déjà montés par le conteneur.
3. Appliquer les migrations avec le binaire PocketBase du conteneur, en précisant `--dir=/pb_data --migrationsDir=/pb_migrations`. `automigrate=false` reste conservé : les migrations du dossier monté sont appliquées au démarrage ; migrate up permet aussi une application explicite. Le chemin du binaire dépend de l’image Docker ; réutiliser celui de l’installation existante.
4. Redémarrer PocketBase pour charger les hooks puis utiliser le frontend mis à jour. Se reconnecter pour recharger les droits.

La migration crée trois familles configurables et zéro produit ; elle ajoute les liens facultatifs aux lignes de devis sans réécrire leurs prix. Les Admin existants reçoivent inventory.read / inventory.write. Si leur rôle est partagé avec un compte métier, un rôle séparé est créé pour l’Admin ; aucun droit n’est étendu au compte métier. Superusers et utilisateurs reçoivent les accréditations Catalogue / Stock explicitement via Utilisateurs et accès. Paramétrage des familles : settings.references et profil Admin / Superuser. API de catalogue en lecture / écriture contrôlée ; photos protégées, audit serveur et historique des prix immuable. Aucun déploiement NAS effectué par l’agent.

Catalogue P02 — installer les hooks mis à jour et `1791504013_product_brands_logistics.js`, après P01, appliquer les migrations explicitement puis redémarrer PocketBase et mettre à jour le frontend. Les anciennes marques texte sont raccordées à des marques uniques, les offres et devis historiques ne sont pas recalculés. Marques : inventory.read / inventory.write, création serveur transactionnelle avec nom normalisé unique et audit, REST privé, viewer sans écriture. Coût manuel et caractéristiques logistiques validés côté serveur. Les anciennes photos de galerie sont conservées ; aucune purge. Aucun droit comptable ni appel externe ajouté par l’onglet préparatoire.


Catalogue P03 : appliquer la migration additive `1791504014_product_pricing_coefficient.js` après P02 avec les hooks mis à jour, puis redémarrer PocketBase et mettre à jour le frontend. Anciennes fiches en mode coefficient automatique, valeur manuelle initiale 1. Modification réservée à inventory.write ; coefficient manuel strictement positif, maximum 100, contrôlé côté serveur. Modification du coefficient famille sans effet sur les produits en mode manuel ; snapshots devis conservés.


Catalogue — synchronisation NAS après coefficient manuel : le paquet P02 n’accepte pas les champs coefficient_override / manual_coefficient. Un frontend récent face à ces hooks renvoie 400 « Champs non autorisés. ». Installer le paquet consolidé `horizon-catalogue-nas.zip` (hooks complets et migrations, dont 1791504014_product_pricing_coefficient.js), appliquer les migrations explicitement avec les chemins existants puis redémarrer PocketBase. Aucun assouplissement de l’allowlist : synchroniser le contrat serveur / frontend. Le paquet ne contient ni base ni secret ; aucun déploiement automatique exécuté.


GET /api/horizon/inventory/products/{id}/quotes : nécessite inventory.read et sales.read, utilisateur Horizon actif. Exécution déléguée au service Ventes ; champs du compte analytique et lien CRM renvoyés uniquement avec crm.read, client uniquement avec contacts.read. DTO en allowlist, identifiant et pagination validés. Aucun CRUD ni élargissement des API Rules.

Compteur Devis des produits : le frontend récent nécessite la route GET /api/horizon/inventory/products/{id}/quotes et le service Ventes correspondant. Une réponse 404 File not found avec fiche lisible indique notamment des hooks non synchronisés. Installer les hooks consolidés puis redémarrer PocketBase ; aucune migration nouvelle pour ce compteur. La mise à jour des seuls fichiers sans redémarrage ne recharge pas les routes JS.


Cycle Devis : nouvelles permissions sales.quote.validate et sales.order.confirm, administrateurs habilités par migration additive sans élargir les rôles métier partagés. Routes dédiées de finalisation et confirmation contrôlant droits effectifs, profil non viewer, version updated, statut, lignes, opportunité active, identité du commercial et champs en allowlist. Confirmation transactionnelle avec snapshots, audit et événement utilisateur. Preuve PDF / PNG / JPEG / WebP de 10 Mio maximum dans le fil protégé, validée serveur ; lecture sales.read, pas de lien public permanent. Numéro / preuve facultatifs, aucun contournement de droits en cas d’absence.


Devis — annulation, archivage et suppression : `cancelled` est un état métier distinct ; `archived_at` retire une pièce des listes courantes sans modifier son état ni ses engagements. Réactivation disponible. `sent_at` conserve le premier envoi, même après retour en brouillon. Suppression serveur autorisée avec `sales.write` uniquement sans envoi historique et sans aucune commande liée (même annulée) ; les autres pièces restent archivables. Une commande doit revenir en devis avant annulation du devis.


Installation NAS — cycle devis / commandes : paquet consolidé `horizon-sales-lifecycle-nas.zip`, contenant les hooks et migrations jusqu’à `1791504015_quote_lifecycle.js`. Sauvegarder la base et les fichiers de façon cohérente, recopier les dossiers montés `pb_hooks` / `pb_migrations`, puis exécuter explicitement `migrate up --dir=/pb_data --migrationsDir=/pb_migrations` avec le binaire PocketBase de l’image existante. `automigrate=false` ne bloque pas l’exécution au démarrage : migrate up est une possibilité de déploiement contrôlé, pas une obligation technique. Redémarrer après migration, synchroniser le frontend et se reconnecter. Admins existants reçoivent les deux permissions dédiées sans élever les rôles métier partagés ; autres habilitations explicites dans Utilisateurs et accès. Migration sans purge de pièces ; retour arrière par sauvegarde cohérente. Aucun déploiement NAS effectué localement.

Compteurs de devis : GET /api/horizon/sales/quotes/summary requiert sales.read, mêmes droits CRM pour un périmètre opportunité explicite. Agrégation SQL serveur sans pagination, pièces archivées exclues. Installer les hooks sales.pb.js et lib/sales.js mis à jour puis redémarrer PocketBase ; aucun changement de schéma pour ce bandeau.


Documents D18 — installation : sauvegarder PocketBase puis copier les hooks complets (assets compris) et migrations, appliquer explicitement `1791630000_product_labels.js` avec les mêmes chemins / binaire que les migrations précédentes, redémarrer PocketBase et actualiser le frontend. La migration ajoute le type product_label et le référentiel documents_paper_formats, sans modifier les versions de modèles existantes ; pas de retour arrière destructif, restaurer une sauvegarde cohérente si nécessaire. Gestion des formats / modèles réservée à documents.template.manage ; lecture et impression d’une étiquette nécessitent inventory.read, contexte produit limité aux champs autorisés, pas de prix d’achat ni de mutation du catalogue. Collections de formats fermées au REST générique ; contrôle serveur, conflit updated et audit des sauvegardes. Iframe d’impression isolée sans same-origin, communication vérifiée par source et jeton, aucun accès produit direct. Aucun déploiement NAS effectué par l’agent.


### Paquet NAS — étiquettes produit et formats d’impression

Archive de transfert locale : `horizon-etiquettes-formats-nas.zip`. Contient les hooks complets avec assets / polices, toutes les migrations dont `1791630000_product_labels.js`, la documentation canonique, un manifeste SHA-256 et le frontend compilé dans `portal/`. Aucun fichier de base, compte ou secret. La configuration Docker existante et Gotenberg sont conservés. Le frontend `portal/` est fourni pour une installation statique ; si le portail sert uniquement de lanceur et que le frontend est hébergé ailleurs, mettre à jour cet hébergement et conserver le lanceur existant.

Depuis SSH sur le NAS, relever le binaire / l’image du conteneur installé puis arrêter PocketBase :

```sh
PB_IMAGE=$(sudo docker inspect --format '{{.Image}}' horizon-pocketbase)
PB_BIN=$(sudo docker exec horizon-pocketbase sh -c 'command -v pocketbase || readlink /proc/1/exe')
sudo docker stop horizon-pocketbase
```

Avec PocketBase arrêté, sauvegarder ensemble `/volume1/docker/horizon/pocketbase`, `pb_hooks`, `pb_migrations` et le frontend actuellement servi. Extraire l’archive ; copier `pb_hooks/` et `pb_migrations/` dans `/volume1/docker/horizon/` et synchroniser le frontend. Ne pas extraire dans le dossier `pocketbase/` : ce dossier contient les données existantes. Reprendre la même session SSH pour appliquer les migrations dans un conteneur ponctuel utilisant l’image et les volumes de l’installation actuelle :

```sh
sudo docker run --rm --volumes-from horizon-pocketbase --entrypoint "$PB_BIN" "$PB_IMAGE" migrate up --dir=/pb_data --migrationsDir=/pb_migrations --hooksDir=/pb_hooks
```

Après succès de la migration :

```sh
sudo docker start horizon-pocketbase
sudo docker logs --tail 60 horizon-pocketbase
```

En cas d’échec, conserver le conteneur arrêté pour examiner l’erreur et restaurer la sauvegarde cohérente si nécessaire. Ne pas forcer l’historique des migrations. La génération PDF utilise toujours `HORIZON_GOTENBERG_URL` déjà configurée sur PocketBase et le conteneur Gotenberg existant. Recette : ouvrir Formats d’impression, contrôler A4 et Étiquette produit 95 × 28 mm, créer un modèle d’étiquette puis ouvrir un produit enregistré avec code-barres et essayer HTML / PDF / impression à 100 %. Vérifier le résultat sur l’imprimante cible. Ces commandes sont fournies pour l’installation utilisateur ; aucun déploiement distant n’a été exécuté.


Catalogue — unicité code-barres : paquet consolidé `horizon-produits-code-barres-nas.zip`, installation selon la procédure du paquet Étiquettes ci-dessus. Inclut aussi `1791630001_product_barcode_unique.js` : index unique partiel et champ caché barcode_requested utilisé uniquement pour les retries. Sauvegarde cohérente requise. Les codes historiques uniques et vides sont conservés ; les doublons non vides existants sont suffixés et audités, sans prendre les codes déjà réservés. Proposition et allocation sous inventory.write, validation et transaction serveur. Le paquet contient le frontend actualisé, les hooks / assets et toutes les migrations ; aucun déploiement automatique.


Achats A01 / Stock S01 — migration `1791630002_purchasing_stock.js` et paquet consolidé `horizon-achats-stock-nas.zip`. Installation selon la procédure NAS des Étiquettes ci-dessus : sauvegarder la base arrêtée, copier les hooks complets / migrations et le frontend, puis `migrate up` avec l’image PocketBase actuelle. Cette migration ajoute les objets d’achat et de stock, les séquences DA / BC, les paramètres Achats et les relations du fil. Elle initialise un entrepôt CVS et un emplacement vide, aucun solde de stock. Elle complète uniquement les droits des administrateurs ERP existants, avec isolation d’un rôle partagé ; les utilisateurs métier restent à habiliter explicitement. Les nouveaux comptes sont gérés depuis Utilisateurs et accès. Permissions `purchasing.read`, `purchasing.write`, `purchasing.request.validate`, `purchasing.order.validate`, `inventory.stock.reserve`, `inventory.stock.adjust` ; profil viewer toujours interdit en mutation. Collections d’achat, mouvements et réservations verrouillées en REST brut, routes métier strictes, transactions et audit. Validation fige prix / taxes / devises / ventilations / fournisseur. Les clés de création et d’ajustement protègent les retries et les contrôles de quantités couvrent les accès concurrents. Une réservation n’est pas une sortie de stock.
Recette NAS : créer une DA rattachée à une opportunité, choisir fournisseur / prix, valider puis préparer un BC brouillon, valider et ouvrir HTML / PDF. Ajuster un stock initial avec justification, confirmer une commande client avec réservation partielle et vérifier le besoin net proposé. Colonnes Achats / Réceptions / Livraisons uniquement sur Commande client. PDF utilise Gotenberg existant ; aucune nouvelle dépendance serveur. Réceptions, livraisons effectives, lots / séries, inventaires et e-mail restent au lot suivant. Aucun déploiement NAS automatique.

Achats — évolution du 11 octobre 2026 : déployer ensemble le frontend, les hooks complets et `1791710000_purchasing_request_lifecycle.js`, selon la procédure NAS ci-dessus. La migration recalcule Validée / Partiellement traitée / Traitée selon les BC réellement envoyés, sans changer les pièces envoyées. La validation DA prépare les BC dans la même transaction ; le retour confirmé en brouillon retire seulement les préparations non envoyées, avec snapshot et audit. Les droits de validation + écriture sont contrôlés côté serveur. L’annulation globale avant envoi requiert les droits DA et BC et bloque les BC partagés / envoyés / exécutés. Aucun mail n’est envoyé par ces transitions.

Paquet NAS actualisé du 11 octobre 2026 : `horizon-achats-cycle-nas.zip`. Contient `frontend/` (application compilée pour `http://172.30.10.10:50190`), `pb_hooks/` complet avec assets, `pb_migrations/` complet jusqu’à `1791710001_purchase_order_identity.js`, les documents canoniques et un manifeste SHA-256. Aucun `pb_data`, fichier `.env` ni secret. Remplace le paquet Achats précédent pour cette mise à jour. Installer selon la procédure ci-dessus : sauvegarde arrêtée, synchronisation hooks / migrations, migration explicite, redémarrage et mise à jour du frontend hébergé. `frontend/` est l’application, pas le lanceur du portail NAS ; conserver un éventuel lanceur existant. Aucun déploiement distant effectué.


BC fournisseur — identité du 11 octobre 2026 : installer aussi `1791710001_purchase_order_identity.js`. Ajoute owner et delivery_warehouse ; complète seulement les brouillons historiques. Le serveur contrôle un acheteur actif habilité aux achats et un entrepôt actif à la validation. La projection des entrepôts accessibles à Achats expose uniquement identifiant, code et nom, aucun solde de stock. TVA fournisseur, nom/e-mail acheteur et destination sont snapshotés ; les pièces validées historiques ne sont pas réécrites.


Paramètres UX — appliquer `1791710002_ux_settings.js` puis `1791710003_ux_appearance.js` et livrer `ux.pb.js` / `lib/ux-settings.js` avant le frontend correspondant. Lecture de la configuration non sensible pour tout compte Horizon / rôle actif ; écriture uniquement Admin ou Superuser habilité settings.references. Écriture directe fermée, allowlists strictes et bornes serveur, verrou optimiste et audit. Aucun CSS arbitraire stocké. Mise à jour NAS : hooks + migrations, migration au démarrage ou explicite avec migrate up (automigrate=false ne désactive que la génération), puis frontend ; aucune modification manuelle de collection production.

Livraison locale / NAS — préférence du 11 octobre 2026 : tant que le portail est développé localement, fournir uniquement `pb_hooks` et `pb_migrations` dans le pack PocketBase. Ne pas inclure `frontend`, portail, données PocketBase ou secrets. Une modification purement visuelle ne nécessite pas de nouvelle migration ni de déploiement serveur.

DA — devis source : appliquer `1791710004_purchase_request_quote.js` avec les hooks Purchasing / Sales associés avant le frontend. La migration ajoute et renseigne source_quote pour les demandes issues de commandes, sans toucher aux lignes historiques. Choix du devis soumis à sales.read, validation d’état actif / affaire / devise côté serveur. Pack NAS PocketBase uniquement ; sauvegarde et migration au démarrage ou explicite avant redémarrage ; automigrate=false ne bloque pas son application.

Stock S02 — migration `1791710006_stock_operations.js` et hooks à déployer ensemble, après sauvegarde cohérente. Lecture `inventory.read`, édition `inventory.write`, réalisation `inventory.stock.validate` ; les référentiels et locks sont administrés via settings.references / profil admin. Pas d’accès direct aux opérations, aux compteurs ni au singleton settings_stock. Idempotence de création et de ledger, verrou optimiste, transactions, audit et conservation des mouvements. Réalisations non supprimables ; corrections via retours ou inventaire. Un entrepôt avec stock, réservations ou opérations ouvertes ne peut pas être désactivé. Réservations tierces protégées, transferts limités au disponible libre. Pack NAS PocketBase uniquement : pb_hooks + pb_migrations, aucun portal ni pb_data.

Stock V01 — installer `1791710007_stock_valuation.js` et les hooks/lib de valorisation du même pack, puis redémarrer PocketBase. Les deux collections de valorisation sont privées (API Rules null), accessibles uniquement par les routes Horizon : lecture `inventory.read`, révision du standard / ouverture / changement de méthode Admin ou Superuser avec `settings.references`, contrôles serveur et audit. Les écritures de valorisation sont immuables, avec clés uniques et transaction commune aux mouvements. Les stocks antérieurs ne sont pas chiffrés arbitrairement par la migration : valider explicitement les coûts et valeurs d’ouverture dans Paramètres → Stock, transit antérieur inclus. Un produit nécessitant une reprise bloque les nouvelles réalisations jusqu’à sa validation. Méthode globale standard par défaut, devise EUR ; pas de conversion implicite des BC en devise. Changement de méthode refusé tant que des ouvertures restent à valider ou un transfert est en transit. Aucune mise à jour manuelle de production ni écriture comptable Sage dans ce lot.

Stock S04 — déployer la migration `1791710008_warehouse_codes.js` et les hooks associés ensemble après sauvegarde. Le code unique reprend l’ancien trigramme ; aucune relation ni pièce historique n’est recréée. Migration au démarrage ou explicite ; automigrate=false ne désactive que la génération.

Réceptions fournisseur automatiques — déployer `1791710009_purchase_receipts.js` avec les hooks du même pack après sauvegarde ; automigrate=false désactive la génération, pas l’exécution des migrations : application au démarrage ou via migrate up. Création dans la transaction de validation purchasing.order.validate, aucune permission de réalisation de stock accordée implicitement. Réception effective reste soumise à inventory.write + inventory.stock.validate et contrôles existants (source, reliquat, emplacement, unité, traçabilité, inventaire, valorisation). Annulations / reprises auditées ; migration ne touche pas au ledger ni aux réalisations.

Reprise des BC antérieurs sans entrepôt : la réception reprend Meudon (MEU) ou l’unique entrepôt actif, sans réécrire le snapshot historique du BC. En l’absence de destination non ambiguë, la reprise signale le champ à renseigner.

Réceptions fournisseur : Inventory utilise la frontière Purchasing pour vérifier les lignes source et réaliser une réception avec les seuls droits inventory.read / inventory.write / inventory.stock.validate. Le DTO fournit uniquement identité expéditeur, numéro / identifiant du BC et codes / quantités d’affaires nécessaires à la logistique ; consulter le BC complet exige toujours purchasing.read. Coûts / ventilations privées restent filtrés par les permissions sources, aucun coût dans le contexte imprimable Stock. Source BC immuable après création ; modification d’entrepôt limitée aux IN fournisseur en attente, numérotation atomique et audit. Aucun changement d’API Rules ni migration supplémentaire pour ces projections / snapshots JSON.

Projection d’affaires en réception : nom du client limité à l’identité opérationnelle associée au compte analytique, sans coordonnées ni accès Contacts complet. Dans Purchasing, ce nom est filtré selon contacts.read dans le DTO, les choix et les snapshots exposés. La popup BC garde purchasing.read et les permissions métier de la page complète.

Dashboard Stock : aucun nouvel accès aux collections ni prix fournisseur exposé ; les indicateurs et files utilisent les services Inventory existants sous inventory.read. Le filtre de lecture status=open ne modifie ni permissions ni transitions.

Prévision Stock : projection agrégée de lecture sous inventory.read, mêmes contraintes de périmètre que la liste et compteurs complets avant pagination ; aucun nom, coût ou nouvel accès intermodule dans les séries. Les dates de réalisation sont converties avec Timezone Europe/Paris côté PocketBase. Aucune écriture ni changement de schéma.

Dashboard — installer les hooks dashboard.pb.js, lib/dashboard.js et lib/dashboard-metrics.js puis redémarrer PocketBase ; aucune migration nouvelle. Routes de lecture authentifiées core_users, utilisateur et rôle actifs via access-policy. Agrégats CRM / Ventes / Achats filtrés par leurs droits read avant toute lecture. Source_module ET source_entity contrôlés pour activité / tâches, fiche source vérifiée avant export ; tâches limitées au connecté. DTO en allowlist, pas de coût ou événement d’un module non autorisé. Période des métriques au plus un an, plafond 10 000 pièces par projection avec erreur explicite, monnaies séparées et dates de confirmation en Europe/Paris. Aucun changement des API Rules.

Calendrier manuel — migration `1791710010_calendar_events.js` avec hooks calendar / calendar-manual. Après sauvegarde cohérente, copier les hooks et migrations puis exécuter `migrate up` et redémarrer PocketBase (aucun pb_data ni portal dans le pack). Permissions calendar.read / calendar.write configurables dans Utilisateurs et accès ; migration : lecture pour les rôles existants, contribution pour ceux disposant déjà d’une écriture métier / administration. Profil viewer toujours interdit en mutation. Lire : propriétaire ou visibilité équipe, rôle et compte actifs. Modifier / retirer : propriétaire uniquement avec read + write, contrôles serveur sur route et allowlists ; REST brut en écriture fermé. Validation dates / fin / fuseau / couleur, contrôle updated contre écrasement concurrent, création idempotente par propriétaire + clé, transaction et audit. Retrait = archived, aucune purge. Reconnexion après migration pour recharger les droits côté frontend.

Courbes Dashboard : mettre à jour lib/dashboard.js et lib/dashboard-metrics.js puis redémarrer PocketBase. Aucune nouvelle migration pour les courbes. Séries agrégées côté serveur à partir des mêmes lectures déjà autorisées ; aucun détail de pièce ni montant d’un module privé supplémentaire. Plafond et contrôle de période existants conservés.

AO — migration `1791710011_tender_download_stage.js` et hook lib/tender-cases.js à installer ensemble après sauvegarde puis migrate up / redémarrage. Étape À télécharger additive avant À analyser, ordres suivants décalés, dossiers / relations existants conservés. Aucun nouveau droit ; À télécharger ne crée ni opportunité ni compte analytique. Retour vers cette étape après promotion conserve l’affaire.

Sidebar UX : migration additive `1791710012_sidebar_appearance.js` et hook lib/ux-settings.js à déployer ensemble après sauvegarde ; migrate up puis redémarrage. Aucun nouveau droit ou CSS libre. Largeurs / dimensions dans une allowlist bornée, textes d’entrées / sous-menus par pas de 0,5 px ; contrôle updated, validation et audit habituels. Les réglages antérieurs sont conservés.

La migration 1791710012 inclut les couleurs sidebar en #RRGGBB ; seules les clés de couleur connues sont acceptées. Le gradient est construit par Horizon depuis ces valeurs, aucun CSS arbitraire ni URL autorisé.

Apparence tableaux : installer hooks UX et appliquer 1791710013_table_border_appearance. Couleurs table_border_light / dark en allowlist hexadécimale, permissions et verrou updated existants conservés ; aucun CSS libre.

Analyse : droits analysis.read (opérationnel), analysis.financial (montants agrégés), analysis.labor_costs (coûts individuels), périmètres own / all dans access_grants. Contrôle serveur avant lecture / agrégation ; pas de champs financiers dans une réponse opérationnelle. Admin global explicite, autres profils sans droit implicite. Source consultable seulement avec son droit métier ; projection financière ne délivre ni taux individuels ni snapshots bruts. Nouveau droit sensible non attribué automatiquement aux utilisateurs existants.

Analytique A01 : installer hooks et migration 1791710014_analytic_order_accounts. La reprise initialise uniquement la nouvelle relation analytic_child, conserve updated et les snapshots des commandes historiques. Les comptes restent sans CRUD REST utilisateur. Aucun droit d’analyse ajouté implicitement à un profil User / Viewer / Superuser ; Admin actif global. Les KPI financiers du dashboard nécessitent aussi analysis.read + analysis.financial et respectent le périmètre own, achats multi-affaires limités aux portions autorisées. Le cache frontend distingue l’utilisateur et sa révision d’accès.

Consultation des réservations produit : authentification core_users et permission inventory.read côté service Stock ; noms des acteurs et références métier de réservation uniquement, aucun accès CRUD utilisateur / coordonnée privée. Les comptes lecture seule peuvent consulter le détail sans obtenir de droit de modification.

UX — couleur du texte des en-têtes : appliquer 1791710015_table_header_text_appearance.js avec les hooks ux-settings actualisés ; deux clés hexadécimales en allowlist serveur, permissions et verrou de concurrence UX inchangés. Migration additive, aucun réglage existant écrasé.

UX — fond des en-têtes de suivi de commande : livrer
`lib/ux-settings.js` et `1791840014_order_tracking_appearance.js`, appliquer la
migration puis livrer le frontend correspondant. Deux couleurs #RRGGBB dans
`settings_ux.config`, aucune modification des données de commandes. Même
allowlist stricte, permission `settings.references`, verrou optimiste et audit
que les autres réglages UX. Ne pas installer uniquement le frontend : le hook
et la migration sont nécessaires à l’enregistrement des nouveaux paramètres.

Historique des achats depuis Produit : projection par Purchasing, exposée uniquement avec purchasing.read (null sinon), sans détails de contact ni allocations. Les commandes liées s’ouvrent via l’éditeur canonique et ses permissions ; les brouillons et annulations sont exclus de cette lecture historique. Mise à jour des hooks catalog.js et purchasing.js, aucune migration supplémentaire.

Mon compte : routes account.pb.js et lib/account.js, GET /api/horizon/account, POST /save, POST /password. Auth core_users et compte / rôle actifs vérifiés dans le service ; cible toujours event.auth.id, aucun id fourni accepté. Allowlist identité uniquement, sans changement email de connexion / droits / employé / expéditeur. Écriture transactionnelle avec contrôle updated et audit personnel sans secrets. Photo de l’employé associé en lecture, imports/retraits refusés dans Mon compte ; reprise des anciens fichiers et route binaire protégée décrites dans le complément « Photos Employés / comptes » du 13 octobre. Changement de mot de passe : ancien secret vérifié serveur, nouveau secret confirmé, ancien token invalidé par PocketBase et session locale purgée. Aucune modification des règles CRUD core_users. Le lot initial ne nécessitait pas de migration ; le complément photos du 13 octobre requiert 1791840008 et les hooks correspondants.

Photos des fils : GET /api/horizon/activity/events/{id}/avatar contrôle le module, la source réelle et ses droits de lecture avant de servir la photo effective de l’employé associé à son auteur (legacy utilisateur si non rattaché) depuis le filesystem PocketBase (local / S3). Pas d’élargissement de core_users.viewRule, aucun profil ni chemin de fichier fourni par le client, requête authentifiée par en-tête et réponse non cacheable. Sans photo : 204 et initiales. Présence personnelle : POST /account/presence accepte seulement available / away / busy / offline, sur event.auth.id, audit serveur. Déployer migration 1791710016_user_presence.js puis hooks Account et Activité.

Présence Hors ligne : déployer la migration additive 1791710017_user_presence_offline.js avec les hooks Account actualisés ; les valeurs existantes sont conservées.

Stock T01 / Parc I01 : identités, journal de traçabilité, parc et registre financier privés en CRUD REST. Réalisation / réservation / affectation dans transactions serveur avec contrôle des quantités et des identités ; aucune modification d’une réalisation passée. Inventory.read pour les identités et le parc, Inventory.write pour préparer / affecter, inventory.stock.validate pour les réalisations. Registre Accounting séparé : accounting.read et accounting.assets.manage ; Admin actif conserve l’accès de gestion, aucun rôle partagé n’est enrichi automatiquement. Aucun coût d’immobilisation dans les DTO magasinier.

Installation T01/I01 : sauvegarder pb_data, copier le pack PocketBase uniquement (pb_hooks + pb_migrations), appliquer 1791710018_traceability_internal_assets.js avec migrate up puis redémarrer. Aucune reprise automatique d’identités depuis du stock non tracé, aucun changement de méthode de valorisation. Collections nouvelles fermées en REST ; routes métier authentifiées sous inventory/traces, inventory/assets et accounting/assets. Droits financiers explicites via Utilisateurs et accès → Immobilisations ; se reconnecter après une modification d’accréditation. Droits inventory.write pour édition du parc, inventory.stock.validate en plus pour affectation/retour ; qualification/déclassement sous accounting.assets.manage. Protection contre un RET générique contournant le parc et les qualifications comptables. Lots : version updated contre écrasement concurrent. Le fil, les tâches et mentions réutilisent les rules métier Inventory, sans ouvrir les données financières.

Parc : identités d’affectataires filtrées côté serveur par hr.read et le périmètre RH effectif, pas seulement masquées en React. Une affectation hors périmètre n’est pas effacée lors d’une édition des autres champs. Les caches de Parc, de ses choix RH et des Immobilisations distinguent utilisateur/révision d’accès. Les bases validées du registre sont modifiables seulement par déclassement motivé, sans réécriture de la valeur d’acquisition.

A02 : migration additive 1791710019_fixed_analytic_accounts et hooks Accounting/Purchasing actualisés. Paramétrage réservé à settings.references Admin/Superuser ; version updated par compte, transaction pour renumérotation multiple, unicité globale. Codes fixes exposés dans les choix Achats aux lecteurs purchasing.read sans droit CRM requis. Les comptes d’affaires restent soumis à CRM ; aucun UUID de compte analytique librement arbitraire accepté en ventilation fixe. Aucun document validé réécrit lors d’une renumérotation.

Confirmation des ventes avec achats préparés : purchase_preparation est une allowlist source_line (ligne du devis), quantity, supplier. Lecture des besoins prévisionnels via needs/{quote}?preview=true, droits achats et ventes, devis finalized actif. Le module Achats reconstitue les besoins après réservation dans la transaction de confirmation : correspondance explicite devis/commande, quantité restante, fournisseur actif, tarif et devise serveur, ventilation analytique enfant. purchasing.write requis ; toute erreur annule commande, fichier, réservations et demande. Retry d’une confirmation déjà acceptée ne crée aucune seconde demande.

CGV par défaut : settings_sales.terms[].is_default autorisé et booléen, un seul vrai et uniquement sur des conditions actives, validation serveur et audit des paramètres existants. Nouveaux devis sélectionnent cet identifiant ; serveur continue à résoudre le texte et à conserver les snapshots existants. Migration 1791710020 sans modification de document historique.

Lecture ciblée du fil — 12 octobre 2026 : GET /api/horizon/activity/events (entity, id, category, page) et /activity/tasks (entity, id), authentification core_users, utilisateur/rôle actifs, module.read, source existante et View Rule de la fiche lorsqu’elle est exposée par collections. Catalogue / Stock / Achats restent privés et utilisent la politique module.read + source réelle déjà définie pour leur fil ; aucune collection privée ouverte. DTO en allowlist, paramètres liés, pagination 20, AO enrichi uniquement des événements de son opportunité lisible, module + entité + id toujours corrélés. Photos d’auteurs réutilisent cette autorisation. Aucune modification des API Rules existantes ou du schéma.
Correctif du timeout documenté dans le log du 12 octobre : COUNT DISTINCT de la règle polymorphe produit des LEFT JOIN sans ON sur toutes les sources, délai 30 s atteint. Le frontend ne passe plus par ce compteur transversal : COUNT sur la seule source autorisée, index source_entity/source_record_id/created existant. Installer les hooks du pack PocketBase puis redémarrer ; aucune nouvelle migration pour ce correctif. Synchroniser le frontend local. Le paquet ne contient ni base ni secrets ; aucun déploiement NAS exécuté.

## État d’installation à confirmer — 12 octobre 2026

Le code est poussé sur `origin/main` (`8e0de25`, `f9bf927`) ; cela ne prouve aucune mise à jour de l’instance Synology. Priorité : remplacer les hooks du dernier pack PocketBase et redémarrer pour la lecture ciblée des fils. Vérifier séparément l’historique des migrations antérieures jusqu’à `1791710020_quote_default_terms.js` ; n’appliquer que celles manquantes via le mécanisme versionné, après sauvegarde de `pb_data`. Aucun schéma à changer pour le correctif Activity lui-même.

Recette après redémarrage : charger et publier une note sur plusieurs modules avec un compte habilité, tester un refus sans droit, les pièces/photos protégées et le regroupement AO/opportunité ; vérifier l’absence du timeout 30 s dans les logs. Synchroniser le frontend local avec ces routes. Ne pas augmenter le timeout ni ouvrir les API Rules comme correction. Le diagnostic fourni établit une requête trop coûteuse ; il n’établit pas une perte de données.

Le pack temporaire remis est un artefact de livraison, pas une sauvegarde ni un état durable d’installation. Sa composition doit être vérifiée : hooks, migrations, manifeste/empreinte ; ni données, ni secret, ni portal. Configuration de valorisation cible : CUMP ; contrôler le paramètre réel avant de le changer avec motif et reprise validée. Les données commerciales historiques restent indépendantes.

### Accueil Achats et filtre DA en attente — 12 octobre 2026

Le filtre de lecture `status=pending` sur `/api/horizon/purchasing/requests` regroupe exclusivement les états existants draft / validated / partially_ordered, non archivés. Le hook `pb_hooks/lib/purchasing.js` doit être synchronisé avec le frontend, puis PocketBase redémarré ; aucune migration nouvelle. Le filtre est refusé sur les commandes fournisseurs ; contrôles purchasing.read inchangés. Pack local consolidé `horizon-purchasing-pending-nas.zip` : hooks, assets, migrations et manifeste SHA-256, sans frontend, base ou secrets. Installation non effectuée par l’agent.

Complément du 13 octobre 2026 — accueil commun DA / BC : synchroniser `purchasing.pb.js` et `lib/purchasing.js` pour la route de lecture `/api/horizon/purchasing/overview`, puis redémarrer PocketBase. Mêmes droits purchasing.read, filtres affaire sous crm.read, collections privées fermées ; aucune nouvelle migration. Pack consolidé local `horizon-purchasing-overview-nas.zip`, PocketBase uniquement, installation non effectuée.

### BL automatiques et partiels — 13 octobre 2026

Installer ensemble les hooks actualisés et la migration `1791840000_stock_deliveries.js` sur une sauvegarde cohérente, appliquer `migrate up`, puis redémarrer PocketBase et livrer le frontend correspondant. Pack local PocketBase uniquement : `/private/tmp/horizon-deliveries-nas.zip` (hooks, assets, migrations, manifeste SHA-256 ; aucune base ni secret). NAS non installé par cette intervention. Activer ensuite Paramètres → Stock → Livraisons selon le besoin ; valeur initiale false. Aucun recalcul des snapshots ou mouvements historiques. Rollback schéma volontairement refusé : restaurer une sauvegarde cohérente pour conserver les relations de reliquats.

Préparation manuelle exige inventory.write et lecture Sales ; affectation des ambiguïtés exige également CRM. Validation conserve inventory.stock.validate et les contrôles de source, version, emplacements, réservations et traces. Réception et préparation / validation partielle et reliquat sont transactionnels, rejouage sans duplication ; source client existante non détachable. API Rules privées et fil Activity inchangés. Disponibilité obtenue via `/api/horizon/inventory/operations/readiness/{id}`, lecture autorisée, SQL ciblé et indexé ; aucun COUNT DISTINCT à jointures polymorphes. Recette cible restante : sauvegarde/migration, activation, réception multi-affaires, choix ambigu, commande à stock nul, livraison partielle et séries/lots.

### Sous-titre de devis et bordures documentaires — 13 octobre 2026

Installer les hooks Documents/Pricing actualisés et appliquer la migration additive `1791840001_quote_subtitle.js` avec le frontend correspondant ; elle étend kind dans sales_quote_lines et sales_order_lines sans réécrire les lignes ou modèles historiques. Redémarrer PocketBase. Pack local PocketBase uniquement : `/private/tmp/horizon-subtitles-nas.zip` (hooks/assets/migrations et SHA256SUMS, sans base ni secret). Aucun déploiement NAS réalisé. Les styles borders et tableSubtitle restent dans le JSON v1 en allowlist, bornés et validés serveur. Permissions existantes et immutabilité des versions conservées ; retour arrière par sauvegarde cohérente. Recette cible : Sous-titre enregistré/confirmé, bordures de titres et Sous-titre dans HTML puis sur le vrai Gotenberg, republication explicite du modèle voulu pour appliquer le nouveau style aux futures générations.

### Conservation des lignes vides de devis — 13 octobre 2026

Migration additive `1791840002_quote_spacers.js` nécessaire sur lignes devis/commandes : ajout de kind spacer et description facultative en collection. Les routes Ventes gardent la description obligatoire pour tous les autres types et refusent un spacer avec produit, texte, quantité ou montant ; collections privées et permissions inchangées. Aucune ligne historique réécrite, aucun document envoyé modifié. Installer hooks Pricing/Documents + migration + frontend cohérents, redémarrer PocketBase puis recetter sauvegarde/rechargement, lignes consécutives, confirmation et PDF Gotenberg. Pack consolidé PocketBase uniquement `/private/tmp/horizon-quote-spacers-nas.zip`, sans base/frontend/secret ; NAS non installé.


## Facturation B01 — installation et permissions, 13 octobre 2026

Installer ensemble le frontend, **tous** les `pb_hooks` (asset `default-invoice-layout.json` inclus) et les migrations jusqu’à `1791840003_billing.js`. Sauvegarder une copie cohérente de `pb_data`/fichiers/configuration avant changement ; appliquer `migrate up` avec la version PocketBase 0.40.4 validée localement puis redémarrer. Tester d’abord en PREPROD. La migration est additive : sociétés, devis, stock et activités historiques ne sont pas réécrits. La restauration demande une sauvegarde cohérente, aucun rollback destructif des factures/règlements. Installation NAS non effectuée dans cette intervention.

Permissions `billing.read`, `billing.write`, `billing.invoice.validate`, `billing.payment.manage`, module disponible dans les accréditations. Les rôles des utilisateurs Admin actifs existants reçoivent ces quatre droits ; les profils Viewer restent non modifiants. Paramétrage réservé aux administrateurs avec `settings.references`. Collections privées : aucun list/create/update/delete natif pour les pièces/lignes/échéances/règlements ; routes serveur avec allowlists, validation fraîche des droits, contrôle de version et transactions. La viewRule des parents autorise seulement `billing.read`, notamment pour les fichiers protégés ; aucun superuser frontend. Références fournisseurs uniques, clés de création/retry hashées et indexées, numéros atomiques à validation, snapshots immuables, annulations/audit conservés.

Source nouvelle : droit Ventes/Achats requis, Stock pour lien de BL/réception ; Catalogue pour produit manuel, CRM pour nouvelle analytique d’affaire. Ces droits ne sont pas remplacés par un masquage React. La facture validée reste lisible sous Billing seul, depuis ses snapshots. Le fil utilise la route ciblée par source et sa pagination existante. Aucun élargissement des listRules polymorphes ni nouveau COUNT transversal ; seuls les droits ciblés de consultation/fichier/publication/tâche Billing sont ajoutés, sans nouvelle jointure polymorphe. Publication et modification d’une tâche vérifient l’objet source serveur.

Compléter l’identité/adresse/TVA/mentions avant la première facture client réelle. Vérifier le converter Gotenberg réel, les quatre séquences, le rapprochement fournisseur et les droits métier après installation. Sage/SUPER PDP en standby, aucun secret/provider/webhook externe nécessaire pour B01.

Conditions de paiement — lot du 13 octobre 2026 : appliquer `1791840004_payment_terms.js` après Billing, avec les hooks et frontend correspondants. Migration additive, sans reprise des factures ni suppression des données, défaut historique conservé ; rollback destructif refusé. Référentiel natif fermé ; lecture via `/api/horizon/settings/payment-terms` pour contacts.read ou billing.read, modification via paramètres Facturation réservés à l’administrateur avec settings.references et contrôle de version transactionnel. Nouveau choix d’une condition inactive refusé côté serveur ; anciennes relations conservées. Une condition retirée est archivée, aucune suppression physique. Les textes et échéances personnalisés des pièces restent figés à validation. NAS non installé par l’agent.

Harmonisation facture / référence client — 13 octobre 2026 : installer la migration additive `1791840005_invoice_customer_order.js` et hooks/frontend correspondants. Champs facultatifs, aucun backfill de facture validée ; texte snapshoté à validation. Route `sales/quotes/customer-order-reference` : sales.read + sales.order.confirm, profil non Viewer, commande confirmée non archivée, version fraîche, transaction et audit avant/après. Aucun droit d’éditer les prix/lignes/snapshots ni de modifier la preuve originale. Route Billing related vérifie billing.read puis utilise les projections propriétaires Sales et Stock, chaque liste conditionnée au droit du module source. Fichiers de confirmation restent protégés via Activity ; règles de liste et permissions Activity inchangées. Sauvegarde cohérente avant migration ; recette NAS et Gotenberg réel non effectuée.

Commandes — actions et ajout de preuve, 13 octobre 2026 : pas de migration supplémentaire après 1791840005. Installer tous les hooks et le frontend correspondant puis redémarrer PocketBase. La route de référence client accepte le fichier optionnel en multipart ; mêmes droits de confirmation/version/archivage, validation MIME/taille côté serveur et conservation de la preuve initiale. Une pièce existante n’est pas remplacée implicitement ; remplacement ou retrait explicite via command_file_action, nouvel événement document et audit de commande dans la transaction, anciens fichiers protégés conservés. Route delivery-needed : inventory.read et lecture Sales requises ; aucune écriture ni modification des règles Activity. Préparations critiques restent contrôlées serveur, leur masquage UI n’est pas une permission. Aucune installation NAS effectuée dans cette intervention.

Gestion des pièces de commande — complément du 13 octobre 2026 : installer le hook `pb_hooks/lib/sales-lifecycle.js` à jour et redémarrer PocketBase, avec frontend correspondant ; aucune migration additionnelle. Remplacement/retrait requièrent sales.order.confirm, commande confirmée non archivée et version fraîche ; remplacement avec fichier unique MIME/taille validés côté serveur. Refus des actions inconnues et combinaisons contradictoires ; toute erreur annule la transaction. La suppression UX retire le lien courant, sans purge historique ni changement des règles Activity.

Pièces multiples de commande — 13 octobre 2026 : installer `1791840006_customer_order_documents.js` et les hooks/frontend correspondants puis redémarrer PocketBase. Migration additive des relations uniquement, sauvegarde cohérente préalable ; aucune suppression d’ancienne preuve. Route customer-order-reference : action append avec multipart répété command_file et command_file_removals (identifiants des événements actifs de cette commande). Allowlist, appartenance des retraits, version, droits, fichiers individuels et limite de 20 contrôlés serveur dans la transaction ; un lot invalide ne modifie pas la liste active. Actions unitaires précédentes maintenues, cible explicite nécessaire avec plusieurs pièces. Confirmation accepte aussi plusieurs fichiers, un événement protégé par fichier ; règles Activity inchangées.

Les fichiers de preuve customer_order, actifs ou retirés de la commande, ne peuvent pas être supprimés physiquement via Activity : contrôle de l’action/source côté serveur, en plus du masquage déjà présent dans le fil. Le retrait fonctionnel passe uniquement par Sales et sa relation de pièces actives. Ajouts multiples refusés tant que la migration de cette relation n’est pas installée.

Filtres Ventes — 13 octobre 2026 : mettre à jour lib/sales.js et ajouter lib/sales-list-filters.js avec le frontend correspondant puis redémarrer PocketBase ; aucune migration supplémentaire pour ce lot. Permissions Sales existantes conservées, paramètres/type/états/archives vérifiés serveur, conditions liées et aucune expression de filtre libre fournie par React. Doublons et valeurs invalides refusés par l’API ; lecture des états de commande via relation native, sans nouvel accès Stock/Billing ni nouvelles API Rules.


Apparence des filtres — 13 octobre 2026 : appliquer `1791840007_filter_appearance.js` et livrer `lib/ux-settings.js`, `lib/sales.js`, `lib/sales-list-filters.js` à jour, puis redémarrer PocketBase avec frontend correspondant. Extension JSON additive, conserve les choix précédents ; bornes, allowlists hexadécimales, permissions/version/audit inchangés. Numéro client filtré/recherché sous les permissions Sales existantes. Pack consolidé `/private/tmp/horizon-pocketbase-filter-ux-20261013.zip` préparé, aucune installation NAS effectuée. Depuis le pack sales-filters : trois hooks remplacés et migration ajoutée ; sauvegarde/recette préalable, application au démarrage ou migrate up explicite ; automigrate=false ne bloque pas leur exécution.


Achats — recherche et regroupements du 13 octobre 2026 : mettre à jour lib/purchasing.js et lib/purchasing-common.js puis redémarrer PocketBase avec le frontend correspondant. Aucune nouvelle migration pour cet ajustement. Recherche d’opportunité restreinte côté serveur à crm.read, sans masquage après recherche ; paramètres liés et permissions Achats existantes. Le frontend ne charge plus les listes de choix Fournisseur/Opportunité pour son panneau de filtres.

Pack consolidé actualisé : `/private/tmp/horizon-pocketbase-purchase-groups-20261013.zip` (195 fichiers hooks/assets/migrations, manifeste vérifié ; installation NAS non effectuée). Depuis filter-ux : seuls les deux hooks Achats ci-dessus changent ; migration UX 1791840007 reste nécessaire si elle n’a pas été appliquée.


Achats — correctif archivage : remplacer lib/purchasing.js puis redémarrer avec frontend correspondant ; aucune migration supplémentaire. Pack consolidé /private/tmp/horizon-pocketbase-purchase-archives-20261013.zip préparé (195 fichiers, manifeste vérifié), NAS non installé. Validation state active/archived et permissions Achats conservées ; synthèse respecte l’archivage sélectionné.


Stock — filtres du 13 octobre 2026 : mettre à jour lib/stock-operations.js, lib/stock.js, lib/catalog.js, lib/internal-assets.js et ajouter lib/stock-list-filters.js, puis redémarrer PocketBase avec frontend cohérent. Aucune nouvelle migration pour les filtres Stock. Bornes/allowlists CSV, paramètres liés ; recherche d’affaires restreinte à crm.read, sources achats/ventes aux droits correspondants avant sélection des résultats. Pack consolidé /private/tmp/horizon-pocketbase-stock-filters-20261013.zip préparé, NAS non installé. Les migrations précédentes, notamment UX 1791840007, restent requises si absentes.


Achats — type DA/BC : mettre à jour lib/purchasing.js puis redémarrer avec frontend correspondant. Pack /private/tmp/horizon-pocketbase-purchase-types-20261013.zip préparé et manifeste vérifié, 196 fichiers ; aucune nouvelle migration pour cette intervention. Kind et états CSV en allowlist, paramètres liés et droits conservés ; ancienne sélection de type par status compatible. NAS non installé.


Photos Employés / comptes — 13 octobre 2026 : appliquer `1791840008_employee_photos.js`, migration additive du marqueur caché `core_users.employee_photo_migrated` et copie conditionnelle des anciennes photos déjà associées. Originaux conservés, conflits conservant la photo employé, rollback sans effacement ; une reprise en échec bloque la migration, sans masquer un fichier manquant. À une nouvelle association, Access appelle le service HR `inheritPhoto` en transaction, audit `photo_inherit`, sans écriture React ni copie répétée après retrait. Aucun changement de droits ou d’API Rules.

`GET /api/horizon/account/avatar/{id}` : authentification core_users, compte et rôle actifs revérifiés, cible propre ou Admin seulement ; réponse binaire non cacheable, 204 sans photo, aucun profil RH exposé. Les lecteurs sans hr.read peuvent voir leur propre avatar, sans accéder à l’annuaire. Mon compte projette `employee_id` de son association et le nom de la photo effective, jamais un chemin client libre ; POST /account/save refuse les imports/retraits de photo, même via un ancien frontend. Les anciens champs avatar restent uniquement historiques, aucun fichier supprimé par la reprise. Fil : accès toujours contrôlé sur l’événement/source avant de résoudre la photo de l’auteur ; aucune ouverture des profils utilisateurs/HR. Mettre à jour ensemble account.pb.js, lib/account.js, lib/identity-photo.js, lib/employees.js, lib/access-management.js, lib/activity-request.js et le frontend, appliquer la migration puis redémarrer. Une mise à jour frontend seule ne suffit pas.

Liste Produits / stock physique — 13 octobre 2026 : mettre à jour lib/catalog.js et lib/stock.js avec le frontend correspondant, puis redémarrer PocketBase. Projection physical_quantity calculée en lot pour la page sous inventory.read, emplacements/entrepôts actifs uniquement ; available_quantity reste distinct et conserve ses réservations. Aucun champ persistant, nouvelle migration ou changement de permissions.

Préparation fournisseur / BC — 13 octobre 2026 : remplacer lib/purchasing-billing-source.js et redémarrer avec le frontend correspondant ; correction de lecture du numéro canonique order_number, aucune nouvelle migration. UI réutilisant documents/prepare et tracking/supplier sous Billing/Purchasing, sans accès PB direct ni API Rule modifiée. Relecture et normalisation serveur lors de la sauvegarde, retenue des brouillons actifs, documents finalisés immuables ; référence fournisseur/original et contrôles d’écart inchangés. Aucun branchement Sage/PDP.

Notes de frais E01 — 13 octobre 2026 : migration 1791840009_expenses.js, hooks expenses.pb.js/lib/expenses.js et mises à jour Access/Tax/NotificationBell à installer avec le frontend. Routes authentifiées core_users ; read/write/submit/validate/reimburse et scope self/reports/all, moindre privilège par défaut, justificatifs protégés et édition propriétaire sur draft/returned uniquement. Aucun accès de manager hérité sans habilitation, aucune auto-validation même Admin, aucune écriture directe des collections. Transitions, totaux, validation des relations, version updated, identités et timestamps côté serveur ; transactions audit/événement/notifications atomiques. Responsable actif habilité snapshoté lors de la soumission ; changement explicite global auditée. Export/Sage/PDP et virements restent hors E01.

Installation Notes de frais E01 — 14 octobre 2026 : pack /private/tmp/horizon-pocketbase-expenses-20261014.zip, 201 hooks/assets/migrations plus manifeste/instructions, SHA-256 8356d32b35d184cb31cb51a902aa56e4bd600ac75458df763f4dcea09072fac5. Depuis supplier-invoice : ajouter expenses.pb.js, lib/expenses.js, migration 1791840009_expenses.js ; remplacer lib/access-policy.js, lib/access-management.js et lib/tax.js. Sauvegarde cohérente, installation en préproduction, migrate up explicite puis redémarrage PocketBase 0.40.4 avec le frontend correspondant. Base neuve et montée depuis 1791840008 testées, migrate up répété ; aucun déploiement NAS réalisé.

Accès E01 : propriétaire seul sur brouillon, validateur reports seulement après soumission et hors état draft ; global explicite via expenses_scope. Les mêmes conditions s’appliquent aux justificatifs protégés. Notifications Expenses réservées au destinataire actif avec expenses.read, contenu/origine immuables, read_at serveur. Aucun droit nouveau pour les comptes ordinaires à migration ; droits Admin additifs. Configurer employés actifs/association compte, responsable principal, utilisateur read/write/submit en self, manager read/validate en reports, finance read/reimburse en all. Validateur global de secours explicitement choisi, réaffectation motivée et auditée ; aucun héritage de permission ni auto-approbation. En E01, EUR/taux 1 et TVA justificative sans déductibilité automatique ; exports/virements/Sage/PDP/marge d’affaire hors livraison.

Expenses / Activity — 14 octobre 2026 : migration 1791840010_expense_activity et libs Activity read/request/core + Expenses à installer ensemble avec le frontend. Chaque lecture, commentaire, tâche, fichier, avatar et retrait est autorisé sur la note source ; mention/assignation ne donne aucun accès et destinataires limités aux lecteurs de cette note. Contributions owner.write / validator.validate / global.write ou validate, hors archivage ; aucun accès manager au brouillon, aucun changement de montant/pièce validée via le fil. Une seule branche API Rule corrélée explicitement à l’identifiant source, aucun nouvel accès global aux événements.

Pack Notes de frais / UX — 14 octobre 2026 : /private/tmp/horizon-pocketbase-expenses-ux-20261014.zip, 202 hooks/assets/migrations plus manifeste/instructions, SHA-256 1deb5ec93df0ccdcb8643dce2b6c79dc7f1e3d09f72130afb78cb266bb05e84e. Depuis expenses E01, ajouter migration 1791840010_expense_activity et remplacer lib/expenses.js, lib/activity.js, lib/activity-read.js, lib/activity-request.js ; frontend correspondant à installer. Sauvegarde/migrate up/redémarrage et recette source/mentions/fichiers impératifs. Montée depuis E01 et migrate up répété testés, corps/dates d’événements et notes conservés ; pas d’installation NAS réalisée.


Tri des en-têtes — installation (14 octobre 2026) : remplacer les hooks de listes Catalogue/Sales/Purchasing/Billing/Expenses/Stock/Operations/Internal assets et ajouter lib/list-sorting.js, puis redémarrer PocketBase avec le frontend correspondant. Tri en allowlist avant pagination, permissions et périmètres existants conservés, aucune écriture métier/migration pour ce lot. Pack consolidé /private/tmp/horizon-pocketbase-column-sorting-20261014.zip : 203 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 28fbadfc251c2c19fead8794031b52e829224d60632cfe7616218963925001e8. Sauvegarder et recetter en préproduction ; migrations précédentes jusqu’à 1791840010 si les lots précédents manquent. Installation NAS non effectuée.


Tri complet des colonnes — correctif du 14 octobre 2026 : installer les hooks consolidés avec le frontend correspondant (toutes les colonnes, vues enregistrées Contacts et pagination des lignes de disponibilités), puis redémarrer PocketBase 0.40.4. Les deux nouvelles bibliothèques crm-list-query/index mutualisent les filtres et exposent un index d’IDs sous crm.read frais ; corps via API Rules natives, noms de sociétés non utilisés dans le tri sans contacts.read. DTO existants et périmètres métier conservés pour les autres listes ; aucune nouvelle règle de lecture, collection, migration ou intégration externe.

Ce pack remplace column-sorting-20261014 : /private/tmp/horizon-pocketbase-column-sorting-complete-20261014.zip, 205 hooks/assets/migrations plus manifeste/instructions, sans frontend/base/exécutable/secrets ; SHA-256 6b0aab3bcd12d8fde8fc446a5e742bf5ff30b709bedc03274e85e19b6c0dc0a7. Sauvegarde et recette préproduction requises avant installation ; migrations antérieures jusqu’à 1791840010 si les lots précédents manquent. Aucun NAS installé par l’agent.

Notes de frais / harmonisation UX — 15 octobre 2026 : aucune migration ni permission modifiée. Seuls trois libellés utilisateur de lib/expenses.js changent de validateur vers manager. Le pack consolidé /private/tmp/horizon-pocketbase-expenses-ux-20261015.zip remplace le pack de tri complet : 205 hooks/assets/migrations plus manifeste/instructions, empreintes vérifiées, sans frontend/base/exécutable/secrets ; SHA-256 8fcb390d44fb0eaf840b5d6fa08e327b99b0e3101dbc4c749da404260eeb0405. Il inclut les hooks du tri complet déjà décrits ci-dessus ; sauvegarde et recette préproduction, migrations antérieures jusqu’à 1791840010 si manquantes, redémarrage PocketBase 0.40.4 et frontend cohérent. Installation NAS non effectuée.

Expenses / code affaire — 15 octobre 2026 : mettre à jour lib/expenses.js et le frontend pour afficher les codes dans les lignes et les choix, avec code snapshoté aux validations futures. Aucun changement de schéma, API Rules, scope ou route d’écriture. Duplication réutilisant la création de ligne existante : contrôle propriétaire/brouillon/retour/version, validation des relations et totaux serveur ; aucun justificatif protégé partagé ou téléchargé pour copier une ligne.

Pack consolidé /private/tmp/horizon-pocketbase-expenses-layout-20261015.zip remplaçant expenses-ux-20261015 : 205 hooks/assets/migrations plus manifeste/instructions, empreintes vérifiées ; SHA-256 e12efea981546d53649cc62be15cfdc6cf06657697a2ff1a7595799f06a2fa77. Sans frontend/base/exécutable/secrets, inclut les hooks du tri complet antérieur. Sauvegarde/recette préproduction, migrations antérieures jusqu’à 1791840010 si manquantes, redémarrage PocketBase 0.40.4 avec frontend cohérent. Aucune nouvelle migration pour ce lot ; NAS non installé.

Véhicules Notes de frais — 15 octobre 2026 : migration additive 1791840011_expense_vehicles, nouvelle collection expenses_vehicles sans API Rules natives de lecture/écriture et relation non destructive expenses_lines.vehicle_record. Paramètres GET/POST /api/horizon/expenses/vehicles réservés au contrôle frais policy.settings (Admin/Superuser + settings.references), whitelist des champs, validation des employés actifs lors d’une affectation nouvelle, immatriculation normalisée unique, version updated et audit. Pas de suppression, désactivation disponible. Choices sous expenses.read ne retourne que les véhicules actifs de l’employé associé au compte. Une nouvelle liaison étrangère/inactive est refusée côté serveur ; le libellé vehicle est dérivé du référentiel et non accepté comme texte libre pour une nouvelle ligne. Les anciennes lignes sans relation restent lisibles/modifiables avec leur libellé existant, et les liaisons déjà enregistrées survivent à une réaffectation sans exposer de nouvelle flotte.

Pack consolidé /private/tmp/horizon-pocketbase-expenses-vehicles-20261015.zip : 206 hooks/assets/migrations plus manifeste/instructions, vérifiés ; SHA-256 1871c5598519f217bf4397482b3e5abb9a1a1f896bbe88d820ab05c3530581c0. Remplace expenses-layout-20261015, contient aussi les hooks antérieurs du tri complet. Depuis ce pack : remplacer expenses.pb.js et lib/expenses.js, ajouter migration 1791840011, sauvegarder, migrate up puis redémarrer PocketBase 0.40.4 avant le frontend cohérent. Aucun frontend/base/exécutable/secret dans l’archive ; installation NAS non effectuée.

Opérations Stock / colonnes — 15 octobre 2026 : installer lib/stock-operation-route.js et remplacer lib/stock-operations.js avec le frontend cohérent, puis redémarrer PocketBase 0.40.4. Projection opérationnelle sans écriture ; stock.guard reste requis, liens BC sous purchasing.read, numéros/liens commande/devis client sous sales.read, bon d’origine RET sous inventory.read. Pas de corps de document source, prix ni nouvelles API Rules ; champs financiers restent filtrés par les droits existants. Aucun changement de schéma/migration pour les colonnes.

Pack consolidé /private/tmp/horizon-pocketbase-operation-columns-20261015.zip : 207 hooks/assets/migrations plus manifeste/instructions vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 c9bef27a1fc8ee0407990b65d13a1b3aa7870e544f67d5b9a06144f5506211ce. Remplace expenses-vehicles-20261015 et inclut ses migrations jusqu’à 1791840011 si manquantes. Sauvegarde et recette préproduction avant mise à jour ; installation NAS non effectuée.

Ventilation Achats / aperçus — 15 octobre 2026 : modifier lib/purchasing.js pour enrichir choices.commands de quote sous le même contrôle sales.read + crm.read, puis redémarrer avec le frontend cohérent. Les fiches CRM et Ventes utilisent leurs services et permissions habituels via RecordWorkspace ; la possibilité d’ouvrir une fiche ne donne aucun droit supplémentaire. Pas de nouvel endpoint, règle de lecture, champ de collection ni migration.

Pack consolidé /private/tmp/horizon-pocketbase-allocation-popup-20261015.zip : 207 hooks/assets/migrations plus manifeste/instructions vérifiés, sans frontend/base/exécutable/secrets ; SHA-256 61a28ea7e84bed0c57048d3b9dadef36dffba5ffe8c0feddf45002aad12556e6. Remplace operation-columns-20261015, contient les migrations antérieures jusqu’à 1791840011 si manquantes. Seul purchasing.js doit être remplacé depuis ce pack précédent ; sauvegarde et recette préproduction avant redémarrage PocketBase 0.40.4. NAS non installé.


Révision de commande — 15 octobre 2026 : POST `/api/horizon/sales/orders/revision-preview` (lecture métier, aucun écrit) puis `/api/horizon/sales/orders/revise` (transaction), GET `/api/horizon/sales/orders/{id}/revisions`. Droits Sales écriture/confirmation + CRM lecture contrôlés serveur ; aucun compte superuser côté UI. Jeton SHA-256 du plan normalisé et de l’état des engagements, recomputé sous transaction à confirmation, verrou optimiste quote.updated et version order ; 409 si obsolète. Plans Stock, Purchasing, Billing appartenant à leurs modules ; pas d’écriture directe des données privées d’un autre module. Ajustements Stock soumis à inventory.read/write/reserve selon les actions et création d’avoirs à billing.read/write. Documents bloquants et historique filtrés selon les droits de consultation ; ni facture ni avoir validé automatiquement, aucune notification externe/provider appelé. Collection sales_order_revisions privée, aucune écriture REST native des commandes/lignes/révisions. Snapshots et écritures validées contrôlés par garde serveur, audit et fil d’activité. Installer la migration 1791840012 avant les hooks/frontend correspondants, sauvegarde cohérente et recette, sans écrasement de pb_data ; rollback par restauration cohérente uniquement.

Révision / pièces brouillons — 15 octobre 2026 : ajustement des BL brouillons soumis à inventory.read + inventory.write ; réalisations et historiques de réservation conservés. Le serveur recalcule l’état de tous les bons à la confirmation (passage brouillon → réalisé après aperçu : 409 puis blocage explicite). Empreinte catalogue stable malgré sa date de capture technique, sans exclure les prix et identités. Les fiches liées ouvertes dans RecordWorkspace conservent leurs contrôles serveur habituels et la protection de saisie ; retour au récapitulatif recalculant les engagements. Aucun nouveau schéma, droit ou accès externe.

Migration 1791840013 / numéros Stock — 15 octobre 2026 : installer la migration avant les hooks cohérents. Champ number facultatif et index unique partiel des valeurs non vides ; aucun backfill ni remise à zéro de séquence. Attribution IN/OUT/PREP dans la transaction de réalisation, rollback des compteurs si échec, contrôle des permissions de validation inchangé. Annulation/archivage automatiques dans le plan Stock d’une révision avec inventory.read/write, historique et relations conservés. Retour arrière par restauration cohérente, pas par suppression des brouillons.


Suivi services / facturation — 15 octobre 2026 : pack consolidé `/private/tmp/horizon-pocketbase-service-tracking-20261015.zip` (220 hooks/assets/migrations, MANIFEST.json vérifié ; SHA-256 `611ddc48ab2ff9a4daffb440092ae7ccd6f3cc11fb231a35b15b2f2a45ea0286`) remplaçant tracking-header. Installer ensemble hooks et frontend, sauvegarde cohérente puis redémarrage. Nouveau helper `lib/catalog-sales-policy.js`, mises à jour sales-line-catalog/purchasing/sales-billing-source/billing. Aucun nouveau schéma/migration pour les services ; les migrations antérieures du pack, dont 1791840014, restent nécessaires si absentes. Contrôle des nouveaux achats internes côté serveur, achats historiques conservés, droits Ventes/Achats/Stock/Billing inchangés. Suivi client indexé par identité commerciale stable sans changer les sources de factures. NAS non installé ; recetter commande mixte, anciens achats et factures après installation.


Couleurs du suivi / rangement UX — 16 octobre 2026 : pack consolidé `/private/tmp/horizon-pocketbase-ux-tracking-colors-20261016.zip` (221 hooks/assets/migrations + manifeste et INSTALL.txt ; SHA-256 `c51b5bf10bd6b07bec21bdfcb1a931e0b818db32b04d2ba2b4925d9879cce306`) remplaçant service-tracking. Sauvegarde cohérente, installation des hooks/migrations sans pb_data, `migrate up` puis redémarrage et frontend correspondant. Nouvelle migration additive `1791840015_order_tracking_text.js`, hook `lib/ux-settings.js` en allowlist #RRGGBB. Configurations précédentes préservées ; la couleur initiale du suivi hérite des textes d’en-tête déjà personnalisés. Même lecture authentifiée, écriture Admin/Superuser + settings.references, verrou de concurrence updated et audit. Recetter Paramètres → Apparence → Tableaux → Suivi des commandes : fond/texte-pictogrammes en clair/sombre, aperçu, sauvegarde/rechargement puis commande réelle ; corps du tableau inchangé. Tester d’abord en PREPROD. NAS non installé ; rollback par restauration cohérente de la sauvegarde et des versions applicatives.


Retour en devis / diagnostic des pièces — 16 octobre 2026 : installer ensemble lib/stock-return-blocks.js, lib/purchasing.js, lib/billing.js et lib/sales-lifecycle.js avec le frontend correspondant, puis redémarrer PocketBase. Aucun changement de schéma ni nouvelle migration. Les vérifications métier restent transactionnelles avant toute écriture ; les références, états et liens ne sont exposés que sous inventory.read, purchasing.read ou billing.read. Sans droit de lecture, seul le motif générique est retourné, sans identifiant. Les fiches ouvertes en popup conservent leurs permissions habituelles. Réponse HTTP 400 explicite data.documents[] ; ne pas passer cette projection à ApiError, qui la normalise comme erreur de validation et perd le détail.

Pack consolidé `/private/tmp/horizon-pocketbase-return-document-links-20261016.zip` : 222 hooks/assets/migrations plus MANIFEST.json et INSTALL.txt, manifeste et empreintes vérifiés ; SHA-256 `54e529f3fa24f0614ea8055cc935c06ca5d008c74a1214a74a380466201ed57e`. Remplace ux-tracking-colors-20261016 et inclut ses migrations jusqu’à 1791840015 si manquantes. Sauvegarde cohérente, arrêt, remplacement hooks/migrations sans pb_data, migrate up si nécessaire et redémarrage avec le frontend cohérent ; recette PREPROD avant NAS. Vérifier brouillon/réalisé, ouverture sans navigation et masquage sans droits. Aucune annulation automatique. Rollback par restauration cohérente de la sauvegarde et des versions applicatives. NAS non installé.


Congés L01 — 16 octobre 2026 : migration additive `1791840016_leave.js`, collections privées leave_types/settings/requests/allocations et core_users.leave_scope. Droits explicites leave.read/write/submit/validate/allocate/settings ; validate exige reports/all, allocate/settings all et profil autre que Viewer. Allocation = fonction RH explicitement accréditée, sans nouveau profil ERP. Admins existants reçoivent les droits, autres utilisateurs restent none jusqu’à configuration ; aucun solde ni congé de test créé par migration. Association employé actif nécessaire pour déposer une demande, pas pour recevoir une allocation RH.
Routes `/api/horizon/leave` : choices, requests, requests/{id}, requests/{id}/transition, preview, balances, allocations, settings, calendar. Whitelists, clés idempotentes avec hash canonique, versions updated, transactions et audit ; double soumission/validation ne peut ni doubler une consommation ni dépasser un solde. Statuts/compteurs calculés serveur. Les allocations ne se modifient/suppriment pas, même via superuser : correction par écriture signée ; code/type à compteur structurels conservés. Ne pas modifier les collections en production manuellement. Paramètres jours travaillés/exclusions/justificatifs réservés leave.settings ; calcul snapshoté à soumission. Aucun moteur d’acquisition automatique.
Fichiers PDF/PNG/JPEG/WebP, 10 Mio chacun, maximum 10, protégés par propriétaire/manager désigné après soumission/global sous leave.read et scope actif. Brouillons privés au manager. Calendrier des collègues limité à l’équipe actuelle, soi, manager et collaborateurs directs, ou global explicitement accrédité : noms, période et attente seulement ; identifiant/lien supprimés si fiche non consultable, aucun type, motif ou justificatif exposé. Fil Core, mentions et tâches corrélés à la demande et à la même visibilité ; aucune mention ne crée de droit. NotificationService interne, sans envoi de mail.
Pack consolidé `/private/tmp/horizon-pocketbase-leave-20261016.zip` : 226 hooks/assets/migrations plus MANIFEST.json et INSTALL.txt, SHA-256 `6035b7637dbc5ead41e2d37f39b07e45366b9f89439b2b05308e36fe684dfaf9`. Remplace return-document-links-20261016, aucune base/frontend/exécutable/secret. Sauvegarde cohérente, arrêt, remplacement hooks/migrations sans pb_data, migrate up et redémarrage avec frontend correspondant ; recette PREPROD puis NAS. Configurer droits, employés/managers, calendrier de décompte et allocations individuelles avant utilisation. Valeur initiale lundi–vendredi, aucune date fériée implicite. Rollback par restauration cohérente ; down destructif interdit. NAS non installé.

Congés — correction des jours fériés du 16 octobre 2026 : installer le pack consolidé `/private/tmp/horizon-pocketbase-leave-holidays-20261016.zip`, qui remplace le pack leave initial : **228 fichiers** hooks/assets/migrations plus manifeste/instructions, SHA-256 `f95e4952487c9289fe4b6ef94c5d30eaacb8db137cc8c9a651219ffebf034cbe`. Migration additive `1791840017_leave_holidays.js` après 0016 : calendrier France métropolitaine actif par défaut, aucune réécriture de demandes/allocations historiques ; exclusions précédentes conservées. Décompte serveur hors ligne ; paramètres RH permettent calendrier manuel, dates supplémentaires et fériés travaillés, avec validation et audit existants. Même procédure sauvegarde/arrêt/hooks+migrations/migrate up/redémarrage/frontend cohérent que ci-dessus, jamais remplacer pb_data. Vérifier en préproduction un férié, une exception travaillée et le maintien d’une ancienne demande soumise. Aucun déploiement NAS effectué.

Congés / Direction sans responsable — exception explicitement approuvée le 16 octobre 2026 : déclaration directe réservée à un employé actif Direction sans manager rattaché, avec droit leave.submit ; aucun privilège issu du simple rôle Admin/Manager. Responsabilité Direction protégée par hr.organisation.manage. Actions serveur declare/cancel_declaration, snapshot du mode, transactions décompte/audit/activité et notifications NotificationService à tous les comptes RH actifs leave.read/leave.allocate all. Aucun justificatif médical diffusé dans les notifications ; les destinataires ont déjà le périmètre global. Sans destinataire RH, erreur explicite, aucune transition. Annulation motivée par le propriétaire avec leave.write, restitution, notification ; pas d’ouverture des permissions sur les autres demandes. Circuit standard et interdiction d’auto-validation inchangés hors de cette exception. Mise à jour coordonnée hooks/frontend, aucune migration supplémentaire au-delà de 0017 ; pack et état d’installation consignés au journal 10.

Pack consolidé Direction : `/private/tmp/horizon-pocketbase-leave-direction-20261016.zip` (228 fichiers plus manifeste/instructions), SHA-256 `cbbb41a79af7f3d5c7c3f19751f97adce349e6de1669f90dc477165475ca55bd`. Remplace leave-holidays pour ce correctif ; contrôlé contre les sources. Aucun frontend/base/secret inclus, aucune migration après 0017, NAS non installé.

Congés / déplacement des réglages dans Paramètres — 16 octobre 2026 : frontend uniquement. Accès RH existant conservé via leave.read + leave.settings (profil non Viewer), page vérifiant également can_settings issu du serveur (périmètre all requis). Un RH sans accès général aux Paramètres est redirigé depuis /settings vers /settings/leave et ne voit que cette rubrique ; accès aux autres routes Paramètres refusé par le layout. Aucun nouveau droit serveur/API Rule ni migration, aucun nouveau pack PocketBase requis.

Calendrier / jours fériés — 16 octobre 2026 : pack consolidé `/private/tmp/horizon-pocketbase-calendar-days-20261016.zip`, 228 fichiers plus manifeste/instructions, SHA-256 `058bef8cc102080d12ab22a5f5a38e615172da633c633eeaaef97460cd4c75b5`. Remplace le pack leave-direction : hooks calendrier et helper de jours fériés commun actualisés, frontend cohérent requis, aucune migration après 0017. Métadonnées nationales calculées sans accès RH ni données privées, événements toujours filtrés par leurs règles d’origine. Sauvegarde cohérente, arrêt, remplacement hooks/migrations sans pb_data, migrate up si migrations précédentes manquantes, redémarrage puis recette préproduction. Aucune installation NAS effectuée.

Calendrier personnel / Congés — 16 octobre 2026 : projection côté serveur du module leave, permission leave.read et scope self/reports/all, requête restreinte user=acteur authentifié avant production des événements. Aucun accès global/équipe hérité dans cette projection personnelle, aucun champ sensible de demande retourné. Revocation de droits retire les entrées à la prochaine lecture. Source Congés autorisée dans le DTO frontend et liens strictement /leave/{id}. Aucun contournement des API Rules natives, aucune mutation depuis Calendar. Hooks et frontend cohérents nécessaires, aucune migration après 0017 ; pack dans le journal 10.

Pack consolidé Calendrier / Congés personnels : `/private/tmp/horizon-pocketbase-calendar-leave-20261016.zip`, 228 fichiers plus manifeste/instructions ; SHA-256 `09ec5423d139ff3a84bc1d590e0985eb1f8bee500bd43a3b5283249c2de84b49`. Remplace calendar-days. Procédure sauvegarde/arrêt/hooks+migrations sans pb_data/migrate up si nécessaire/redémarrage avec frontend cohérent ; aucun nouveau schéma après 0017, aucun NAS installé.


## Reprise propre de la messagerie — 16 octobre 2026

À la demande utilisateur, le prototype local Graph applicatif a été retiré avant commit, avec retour du code à 64bbe9a. Le pack **horizon-pocketbase-messaging-20261016.zip est obsolète et ne doit plus être installé**. L’utilisateur confirme avoir installé ce pack sur le NAS. Son état détaillé et la présence effective de sa migration 1791840018 n’ont pas été interrogés par l’agent ; cette migration est donc conservée strictement à l’identique dans le dépôt. L’agent n’a appliqué aucune migration ni modification de schéma sur le NAS.

Pour cette installation existante, ne pas supprimer les collections ni retirer des entrées de _migrations manuellement : inspecter la base et préparer une migration de compatibilité avec la future reprise. Ne jamais réutiliser 1791840018 pour un autre schéma. La restauration Git ne restaure pas une base PocketBase externe. Les migrations historiques jusqu’à 1791840017 et la migration 1791840018 du pack installé restent dans le dépôt. Toute adaptation du schéma e-mail utilisera une migration suivante avec préservation de l’existant. Ne pas déployer un ancien pack pour tenter d’annuler cette évolution.

Côté Microsoft, les opérations exécutées par l’utilisateur restent indépendantes de Git : application/secret Horizon et principal de service, personnalisation Exchange, périmètre de boîte, appartenance directe temporaire du compte administrateur à Organization Management. L’attribution Application Mail.Send est restée refusée selon les derniers résultats. L’ajout du rôle Entra Administrateur Exchange suggéré n’a pas été confirmé et sa nécessité comme correction n’a pas été démontrée. Ne poursuivre aucune élévation pour le circuit abandonné ; confirmer les ajouts temporaires et prévoir leur retrait contrôlé à la reprise, sans toucher à l’application Odoo ni aux droits préexistants.

Le choix final est Microsoft Graph OAuth délégué, sous MailProvider, sans extension du binaire ; stockage privé chiffré et migration 0019, selon le contrat ci-dessous. Voir 04/08 et le journal 10. Aucun changement Microsoft ni nettoyage des permissions effectué par l’agent lors de la restauration locale.

Avant tout remplacement du backend installé, inventorier les messages/outbox pending, processing et uncertain ainsi que les fichiers et expéditeurs existants. Ne pas rejouer automatiquement via SMTP une tâche préparée pour Graph : préserver sa provenance et son historique, traiter les incertitudes explicitement avant bascule. Le worker du pack NAS actuel n’a pas été désactivé ni remplacé par la restauration Git locale.


## Installation Messagerie Graph OAuth délégué — 16 octobre 2026

1. Sauvegarder intégralement pb_data (SQLite + fichiers) et les hooks/migrations du NAS, inspecter les états pending/processing/uncertain, puis arrêter PocketBase pour interrompre l’ancien worker avant remplacement. Ne supprimer ni collections ni _migrations ; ne jamais remettre un pack ancien.
2. Déployer les hooks et toutes les migrations du nouveau lot, **0018 inchangée + 0019**. Ne pas inclure/écraser pb_data. Redémarrer PocketBase : les migrations non encore appliquées du dossier monté sont exécutées avant le service HTTP. migrate up reste une option explicite avec les mêmes --dir et --migrationsDir ; automigrate=false ne désactive que la génération des fichiers de migration. 0019 arrête la file applicative ancienne (pending failed / processing uncertain) sans renvoi, conserve l’historique et ajoute les collections privées OAuth. Relire le bilan avant remise en route ; aucun NAS traité par l’agent.
3. Variables **du seul serveur PocketBase**, transmises par deploy/horizon.compose.yaml : HORIZON_MAIL_TENANT_ID, HORIZON_MAIL_CLIENT_ID, HORIZON_MAIL_CLIENT_SECRET, HORIZON_MAIL_ENCRYPTION_KEY, HORIZON_MAIL_REDIRECT_URI. Aucun préfixe VITE_, aucune valeur réelle dans Git/frontend. La clé AES est une chaîne aléatoire ASCII de **32 caractères**, indépendante du secret Entra ; générer par exemple avec `python3 -c 'import secrets; print(secrets.token_urlsafe(24))'` dans un terminal privé. Sauvegarder cette clé séparément avec accès restreint ; perdre/changer la clé sans réencryption impose de reconnecter les boîtes. Ne jamais la transmettre au support via capture ou chat. Ne pas activer HORIZON_TEST_MODE/HORIZON_MAIL_TEST_ORIGIN en déploiement.
4. Dans l’inscription Entra **Horizon** (pas Odoo), configurer les permissions Graph **déléguées** User.Read/Mail.Send et le consentement adapté aux politiques du locataire. Web redirect = URL HTTPS du frontend + /messaging/oauth/callback, identique à HORIZON_MAIL_REDIRECT_URI. Aucun besoin de poursuivre les commandes Exchange Application Mail.Send, aucune permission Application requise. Ne pas modifier Odoo.
5. Publier le frontend cohérent, vérifier que la route callback est servie par la SPA, que les paramètres de code/state ne sont pas journalisés au reverse proxy et que cette page ne charge pas de tiers. Les jetons ne transitent jamais dans le navigateur ; le code court est transmis par POST authentifié au backend. Les états ont dix minutes, un propriétaire, une version de boîte, une génération et PKCE ; accès aux collections OAuth entièrement fermé par règles explicites, y compris endpoints natifs d’écriture refusés aux requêtes HTTP. Les superusers techniques restent des administrateurs de confiance de la base, capables de voir le ciphertext mais pas la clé externe.
6. Redémarrer PocketBase puis Paramètres → E-mails → Expéditeurs : adresse exacte de la boîte personnelle, utilisateurs Horizon autorisés, Connecter et authentification Microsoft de cette boîte. Vérifier l’adresse et le statut ; renouvellement/reconnexion appliquent les politiques Microsoft. Déconnecter efface les jetons locaux et invalide les travaux non transmis ; cela ne révoque pas le consentement Entra ni ne rappelle un envoi déjà transmis. Boîtes partagées et alias non pris en charge par ce lot.
7. Recetter explicitement un envoi pilote choisi avec l’utilisateur, PDF réel Gotenberg et présence dans Éléments envoyés ; aucun envoi de test réel automatique. Inspecter les anciens jobs arrêtés avant toute remise en file volontaire. Le bouton Envoyer n’est disponible que pour une boîte connectée et autorisée. L’état Envoyé signifie HTTP 202 accepté par Microsoft, pas livraison. Timeout/5xx après soumission restent À vérifier sans renvoi aveugle.

Le binaire réel validé par les tests est PocketBase **0.40.4** ; vérifier la version du NAS avant installation et épingler une image correspondant à une version testée lors du déploiement. La référence Compose existante :latest n’est pas une preuve de version ; aucun tag d’image non vérifié n’est substitué dans ce lot. Aucun changement d’image, installation NAS, consentement Entra ni nettoyage des anciens droits temporaires effectué par l’agent.

Configuration pilote communiquée par l’utilisateur : locataire **7fe2b2a6-ef64-4926-b429-d377e8cab411**, application **7badf872-5f39-40aa-9ee2-8f5f0dda1d96**, boîte prévue guillaume.clairardin@cvs.fr. Aucun secret collecté. Pour la recette depuis Vite, URI Web `http://localhost:5173/messaging/oauth/callback` et connexion Horizon depuis **http://localhost:5173** ; l’origine doit correspondre avant départ vers Microsoft, sinon le frontend bloque avec l’adresse attendue. Ne pas mélanger localhost et 127.0.0.1, leurs sessions sont distinctes. L’exception HTTP localhost et les contraintes du formulaire Entra sont décrites dans la [documentation Microsoft des redirections](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url). L’adresse HTTPS définitive du portail sera configurée séparément pour l’exploitation, sans URI HTTP réseau. Vérifier les consentements existants de l’application Horizon et inventorier les droits applicatifs éventuellement accordés lors de la tentative précédente avant de les nettoyer ; ne pas toucher aux droits préexistants d’Odoo.

Packs préparés localement et vérifiés (CRC + SHA-256 de chaque fichier comparé aux sources) :

- `/private/tmp/horizon-pocketbase-messaging-delegated-20261016.zip` : 242 fichiers source + manifeste/instructions selon pack ; SHA-256 `1ef857577f41eefe16b11a770f6bc6fe3ebd2466dbdc77d63e03b2b89070c38a`.
- `/private/tmp/horizon-portal-messaging-delegated-20261016.zip` : 228 fichiers source + manifeste/instructions selon pack ; SHA-256 `2a3e1faab419a3617dc802d8d1db91cdde56380ff2a01f6c2261820a514b3c40`.

Le pack PocketBase contient hooks/migrations/Compose et exemple de variables sans secrets ; le pack portail contient le build frontend. Pour le développement Vite existant, seul le backend est à mettre à jour sur NAS ; ouvrir ensuite localhost pour la connexion pilote. Aucun des packs n’a été installé par l’agent.


### Clarification vérifiée : exécution au démarrage et automigrate

PocketBase standard **0.40.4 applique les migrations présentes non encore appliquées au démarrage de serve**, même avec `--automigrate=false`. Ce flag désactive uniquement la génération automatique de fichiers lors des changements de collections via Dashboard/API. Copier les hooks et migrations dans les dossiers réellement montés, puis redémarrer, suffit à déclencher l’exécution ; vérifier les logs et le succès du démarrage. `migrate up` est une alternative explicite, pas une étape obligatoirement distincte du redémarrage. Les fichiers déjà appliqués ne sont pas rejoués.

Comportement confirmé par source officielle et test `check_migration_startup.py` sur instance jetable : premier démarrage sans commande migrate préalable, second démarrage sans réexécution. L’affirmation précédente « automigrate=false empêche l’application au redémarrage » était erronée ; les instructions opérationnelles concernées ont été corrigées. Aucun contrôle distant de l’exécution de 0019 sur NAS. [Référence PocketBase](https://pocketbase.io/docs/js-migrations/).


### Correctif Envoi immédiat — 16 octobre 2026

Pack unique PocketBase : `/private/tmp/horizon-pocketbase-messaging-immediate-20261016.zip`, 242 fichiers source + manifeste/instructions/exemple de variables, SHA-256 `bf29caf78e470c28d16dcaa8b1aba1c49e17d140640c89de50b00a52b5b8edbd`. Comparaison au pack Graph délégué précédent : seuls **lib/messaging.js** et **lib/messaging-worker.js** changent. Pour une installation déjà connectée : sauvegarder, recopier pb_hooks puis redémarrer le conteneur. **Aucune migration nouvelle après 0019, aucun frontend, secret, clé, variable ou consentement Microsoft à modifier.** Migrations historiques incluses et identiques. Pack préparé et CRC/empreintes vérifiés ; installation de ce correctif non confirmée sur NAS.

Le premier traitement a lieu dans la requête HTTP après commit de la file, pour le seul message ajouté ; retour de son état actualisé, le bouton reste occupé durant l’appel Microsoft. Les autres messages restent au cron ; échec du déclenchement avant claim → pending durable récupérable. Le cron garde les reprises avec leurs échéances ; même verrou de claim pour les deux parcours. Délai de réception dépendant du fournisseur inchangé, aucune garantie d’envoi exactement une fois après réponse perdue.


### Activity — consultation des pièces envoyées (16 octobre 2026)

`GET /api/horizon/activity/events/{id}/email-attachment?filename=…` impose une authentification core_users, l’accès au module et à la fiche source de l’événement. Le contrat Messaging vérifie ensuite le message **sent**, le contexte, la source et l’auteur exacts ainsi que l’appartenance du fichier à ses pièces originales. Une référence forgée ne donne aucun accès. La projection du fil expose To, l’expéditeur, l’objet, le corps texte envoyé et les noms de fichiers, conformément à la demande complémentaire du 16 octobre ; ni Cc/Cci, ni jetons, ni HTML actif. Les lecteurs de la fiche voient cette correspondance métier, les messages libres restent privés. Elle ne modifie pas les règles natives des fichiers Messaging, toujours privés au propriétaire. Réponses binaires no-store et nosniff ; authentification par en-tête, jamais par jeton dans l’URL du proxy. Aucun fichier dupliqué, aucune migration supplémentaire. Pour appliquer ce correctif à une installation Messaging existante : copier les pb_hooks du pack unique et redémarrer PocketBase ; conserver les variables et la connexion Microsoft. Installation NAS à confirmer séparément.


### Réception Messaging — migration 1791840020 et consentement

Installer ensemble hooks et migration additive 1791840020, après sauvegarde cohérente ; PocketBase applique la migration au démarrage standard. 0018/0019 restent immuables. Aucune clé nouvelle ni conteneur additionnel. Dans Entra → inscription Horizon → Autorisations API → Microsoft Graph → Autorisations déléguées, ajouter **Mail.Read**, puis consentement selon la politique du locataire. Ensuite Paramètres Horizon → E-mails → Expéditeurs : activer « Recevoir les réponses dans Horizon », enregistrer et reconnecter la boîte. Les connexions send-only existantes restent utilisables pour l’envoi ; pas de révocation/écrasement automatique de leurs jetons. Mail.Read autorise techniquement la lecture de la boîte connectée : Horizon sélectionne les conversations métier et ne conserve que les réponses prouvées. Aucun Mail.ReadWrite, permission Application ou droit Exchange RBAC nécessaire.

Relève uniquement sur boîtes actives, explicitement activées, connectées à l’adresse attendue et porteuses de Mail.Read. Le provider utilise ImmutableId, demandes de corps texte, pagination sur URL Microsoft allowlistée ; aucun bearer transmis à un autre hôte. Collection threads privée, claim persistant dix minutes, échéance relue atomiquement, une page par conversation/passage, 20 conversations au maximum par passage, reprise du curseur après redémarrage. Les boîtes sans consentement sont exclues de la file avant sélection pour éviter de bloquer les autres. Limitation Microsoft Retry-After respectée ; curseur invalide/expiré abandonné pour relire sans duplication. Aucun appel réseau dans une transaction.

Réponses privées, immuables et dédupliquées par hash(boîte + Internet Message-ID), événement/notification créés dans la même transaction ; relecture activation/connexion/claim avant commit. Notifications sans expédition d’e-mail. L’endpoint Activity existant autorise la fiche puis vérifie le lien événement/réponse/envoi d’origine ; aucune lecture directe de la collection privée ni élargissement de ses règles natives. Les lecteurs autorisés de la fiche voient le texte de la correspondance commerciale et les pièces, conformément à la demande utilisateur ; messages libres, Cc/Cci et jetons restent privés. Les images ne chargent que des fichiers protégés importés, jamais des URL/pixels distants du message. PDF/PNG/JPEG/WebP uniquement, dix fichiers et 2 Mio cumulés par réponse ; autres pièces signalées pour consultation Outlook, pas de téléchargement actif HTML/archives. Texte limité à 30 000 caractères avec avertissement. Rejouer la relève n’ajoute ni doublon de message ni doublon de notification.


### Diagnostic des erreurs de relève — 16 octobre 2026

La reconfiguration/reconnexion Microsoft n’efface pas last_error des conversations et ne court-circuite pas next_attempt_at : l’ancienne erreur peut rester visible jusqu’au passage réussi, avec attente minimale de deux minutes après échec ou délai Retry-After supérieur. Ne pas assimiler ce message persistant à une preuve que la nouvelle configuration est invalide.

Les erreurs contrôlées de lecture (copie envoyée, identifiants, contenu texte, fichiers, pagination, HTTP et réseau) portent un code interne et un libellé sûr précis. Les exceptions imprévues affichent seulement l’étape concernée, sans demander systématiquement une reconnexion. Logs « Messaging reply polling interrupted » : thread_id, stage, code, http_status, request_id Microsoft validé et classe d’exception allowlistée ; pas de message d’exception brut, URL, jeton ou contenu de mail. Un succès ultérieur de la conversation efface son erreur. Aucune nouvelle migration ; mettre à jour les hooks et redémarrer pour ce diagnostic. La cause d’un échec NAS reste à confirmer par ces éléments, pas par hypothèse depuis les tests locaux.


### Liens de pagination Graph canoniques — 16 octobre 2026

Le contrôle de destination accepte /me et /users/{id ou adresse vérifiés}/… ainsi que users('id'), les IDs de dossiers mailFolders/{id} et mailFolders('id'), la casse des ressources et un slash final. Identité de boîte comparée à account_id/account_address de la connexion OAuth vérifiée ; aucun autre utilisateur autorisé. Hôte/version Graph fixes (origine loopback uniquement dans les tests existants). URL et query opaques renvoyées sans modification ; refus des autres ressources, hôtes, fragments, contrôles, encodages invalides/doubles et traversées. Aucun jeton transmis avant ce contrôle, aucun nextLink journalisé. Module pur lib/mail-pagination.js réutilisé par le lecteur. Installer pb_hooks complet, incluant ce nouveau fichier, puis redémarrer ; aucune nouvelle migration ou reconfiguration Microsoft pour ce correctif. Une erreur historique reste visible jusqu’au passage réussi, selon l’échéance conservée.


Diagnostic P2 de pagination (16 octobre) : le contrôle expose un motif stable parmi input/length/origin/fragment/control/encoding/path/segments/principal_format/mailbox/resource, sans recopier l’URL, le principal ou la query. Le libellé de rejet contient [P2:motif], identifiant aussi la génération du diagnostic. Les destinations acceptées/refusées restent strictement identiques ; aucune permission élargie pour résoudre un cas NAS non observé. Copier les deux hooks ensemble et redémarrer ; un ancien last_error sans P2 peut subsister jusqu’à une nouvelle exécution effective après échéance. Le simple retour de l’ancien texte ne permet pas de confirmer le pack chargé. Ne demander à l’utilisateur que le code P2, pas l’URL complète ou les jetons.


### GED G01 — sécurité et installation (16 octobre 2026)

Bibliothèque Documents distincte du studio : module documents disponible dans les accréditations, actions read/write/manage/settings. Rôle/utilisateur actifs ; Viewer en consultation seulement. documents.settings exige aussi settings.references. Auteur ou documents.manage pour modifier un fichier/dossier, après droit effectif de lecture ; refus d’écriture sur archive/verrou. L’accès effectif combine document, tous les parents et toutes les sources liées. Aucune exemption administrateur aux restrictions de sources ou ACL ; les sources restent contrôlées par leur contrat métier. Recherche, compteurs, catégories/groupes et fichiers ne projettent que les documents lisibles. Version/concurrence/multi-fichiers atomiques côté serveur. Les téléchargements authentifiés utilisent des fichiers protégés, Cache-Control no-store et nosniff ; aucune URL publique ou exposition générique de collection. Les versions sont immuables par hooks, archivage seul dans l’application. Fichiers HTML/SVG/exécutables exclus ; pas de conversion Office automatique ni chargement distant pour les aperçus.

Migration additive 1791840021 + hooks et frontend cohérents à installer ensemble ; sauvegarder base/fichiers, conserver toutes les anciennes migrations. Aucun historique ou fichier métier déjà installé déplacé/réécrit. Aucun changement d’environnement Microsoft ou conteneur supplémentaire. Installation NAS non effectuée par l’agent ; pack et résultats effectifs seront consignés dans le journal de livraison.


Pack G01 final : `/private/tmp/horizon-pocketbase-ged-20261016.zip`, 252 sources hooks/assets/migrations plus instructions et manifeste, SHA-256 `a83c29cbc4f9d53f80cbfcbf5b0a2b7081e5c3fe6288da3aaa80477abd26fd41`. ZIP et empreintes vérifiés ; toutes les migrations antérieures comparées octet par octet au pack Activité précédent. Remplacer les hooks, ajouter 1791840021 avec les migrations conservées, redémarrer puis vérifier son application dans les logs (même avec automigrate=false). Se reconnecter à Horizon pour actualiser les accréditations ; aucune reconnexion Microsoft ou modification des secrets. Rôles partagés avec un profil non-admin volontairement non élargis par migration : affecter explicitement les droits dans Utilisateurs et accès. L’audit des documents inclut aussi les anciens/nouveaux rattachements ; une suppression de lien ne doit pas disparaître de la trace. État local seulement, NAS non installé.

### GED G02 — catalogue fédéré (17 octobre 2026)

Les endpoints GED list/record/file réutilisent documents.read puis la policy métier propriétaire à chaque lecture et téléchargement. Les identifiants virtuels (`linked-<provider>-<record>-<sha256 filename>`) ne donnent aucun accès par eux-mêmes ; version, nom exact présent et rattachement réel sont revérifiés. Pas de jeton public, de bypass admin, de diffusion de Cc/Bcc ou de message libre non corrélé ; correspondance métier strictement identique au contrat Activity/Messaging. Les originaux demeurent dans leurs fichiers protégés et ne sont ni copiés ni éditables depuis Documents. Révoquer le droit source ou supprimer une PJ la retire immédiatement de la projection/du téléchargement. Les périmètres RH sont conservés, y compris avant soumission au manager.

Ce raccordement nécessite les hooks G02 complets et le frontend correspondant. Aucune migration supplémentaire à 1791840021 : si G01 est déjà installé, remplacer les hooks puis redémarrer ; sinon fournir aussi les migrations conservées et laisser appliquer 0021 au démarrage. Ne pas réinitialiser la base ni modifier une migration déjà appliquée. Installation NAS non effectuée par l’agent.

Pack G02 unique : `/private/tmp/horizon-pocketbase-ged-20261017.zip`, 253 sources hooks/assets/migrations + instructions/manifeste (255 entrées), SHA-256 `f1b1330bea0140c3a9b4eac085bb2bde5f1ca71d831f9d9ca8ed0439db1bb8d3`. Toutes les migrations comparées octet par octet au pack G01 ; aucun changement de schéma additionnel, base, frontend ou secret dans le ZIP. Remplace le pack G01 pour cette version du frontend ; installation NAS non confirmée.

Correctif GED historique — 17 octobre 2026 : les lectures optionnelles d’anciennes commandes/comptes distinguent absence de résultat et erreur technique. En cas d’absence, la pièce de la fiche autorisée reste consultable ; `origin.warning` signale le rattachement indisponible. Log « GED historical relation missing » limité à source_entity/source_id/relation, sans nom, contenu, jeton ni URL ; les autres erreurs remontent. Aucun assouplissement de permission, réparation automatique, migration ou manipulation NAS. Un 404 générique PocketBase ne permet pas seul d’affirmer que les hooks manquent.

Pack correctif 404 du 17 octobre : `/private/tmp/horizon-pocketbase-ged-fix404-20261017.zip`, 253 sources + instructions/manifeste (255 entrées), SHA-256 `d81ad0e19335bda9450a5f8865a3c582ea4d30c8888960d85c5fd82a6569cbd9`. Remplace G02 pour cette correction, hooks complets puis redémarrage et rechargement Horizon ; aucune migration supplémentaire, aucun secret/base/frontend dans le ZIP. Empreintes et conservation des migrations G01 vérifiées ; installation sur instance utilisateur non effectuée.

### GED G03 — sélection et mise à jour (17 octobre 2026)

Le contexte sélectionné est autorisé avant la recherche SQL ; un context_id valide mais non consultable retourne 403, un identifiant invalide 400. Les paramètres SQL sont liés, les noms de collections/champs sont en allowlist statique ; aucun fragment SQL fourni par le client. Chaque source candidate conserve son accès propriétaire, ses ACL et périmètres RH. Le cache frontend inclut utilisateur/révision d’accès/contexte/critères, et les téléchargements revérifient toujours leur droit ; pas de cache serveur partagé entre comptes. Une annulation volontaire de requête n’est pas présentée/loggée comme une panne. Les avertissements historiques du correctif 404 restent actifs.

Installer ensemble hooks G03, migrations conservées incluant **1791840022** (index uniquement) et frontend correspondant, puis redémarrer PocketBase et vérifier la migration. Sauvegarde cohérente préalable, aucun effacement de pb_data ni modification des anciennes migrations. Ce lot n’a pas été installé par l’agent sur le NAS. L’utilisateur a confirmé le fonctionnement du correctif GED précédent et signalé ses lenteurs ; cela ne vaut pas recette G03.

Pack G03 unique : `/private/tmp/horizon-pocketbase-ged-contextes-20261017.zip`, 255 sources hooks/assets/migrations + instructions/manifeste (257 entrées), SHA-256 `260ec82cdc294e08d4875f0f850d9622357fce9cac4f3b4ed2390427a20c5faf`. Intégrité ZIP/empreintes vérifiées, toutes les migrations du pack fix404 comparées octet par octet ; seule 0022 ajoutée. Installer **pb_hooks ET pb_migrations**, puis redémarrer et recharger le frontend correspondant. Aucun accès Microsoft supplémentaire, fichier historique réécrit ou donnée métier déplacée.

GED / correctif provenance et résumé dashboard — 17 octobre 2026 : pack unique `/private/tmp/horizon-pocketbase-ged-pieces-20261017.zip`, remplace le pack GED contextes précédent. Sauvegarder, arrêter PocketBase, remplacer `pb_hooks` complet et copier `pb_migrations`, puis redémarrer ; aucune nouvelle migration, les migrations jusqu’à 1791840022 restent requises et inchangées. La classification est un DTO de lecture, sans modification de catégories/rattachements/fichiers historiques. Les nouvelles recherches de factures/avoirs réutilisent l’autorisation propriétaire billing. Le correctif du schéma de liens du dashboard nécessite le frontend à jour puis son rechargement ; le ZIP contient uniquement PocketBase. Installation NAS non confirmée.

### Notifications privées et largeur de recherche — 17 octobre 2026

Installer hooks complets et migrations additives **1791840023_notification_preferences.js** / **1791840024_ux_search_width.js**, sauvegarder pb_data, arrêter puis redémarrer PocketBase avant de recharger le frontend. Aucune configuration Entra/Microsoft supplémentaire. 0023 ajoute dismissed_at/event_type aux alertes et les préférences privées ; 0024 complète settings_ux sans écraser les valeurs existantes. Anciennes migrations inchangées ; aucun effacement des alertes existantes.

Routes authentifiées core_users : GET/POST `/api/horizon/notifications/preferences` (compte actif implicite, pas de user fourni, allowlist des huit événements, version optimiste, audit) ; POST `/api/horizon/notifications/{id}/dismiss` et `/api/horizon/notifications/dismiss-read` (destinataire actif et policy source encore satisfaite). Aucun DELETE natif ajouté. Date de retrait/lecture serveur et première lecture conservée ; les clauses d’immutabilité des nouveaux champs englobent toutes les branches des anciennes rules. Les préférences ne donnent aucun accès métier, ne sont pas éditables via REST natif et ne déclenchent aucun envoi externe. Tout défaut de préférence conserve le comportement actuel activé ; décision de filtrage avant persistance de la nouvelle alerte dans la transaction métier. Notifications retirées exclues des listes/compteurs de la cloche, historique privé conservé.

Correctif notifications Ventes/Achats (17 octobre 2026) : appliquer 1791840025_sales_purchasing_notifications.js avec le pack complet puis redémarrer PocketBase. Le défaut était une omission des branches Ventes/Achats dans la policy de core_notifications, malgré une création effective de l’alerte. Destinataire actif uniquement, droit sales.read/purchasing.read et source existante requis ; aucun droit de création/suppression natif ouvert. Marquage lu autorisé, métadonnées et dismissed_at immuables en écriture native. Les notifications existantes deviennent visibles si encore autorisées, sans reprise des messages ni réinitialisation des préférences.

Correctif chargement cloche (17 octobre 2026) : les règles polymorphes natives de core_notifications peuvent produire des jointures coûteuses entre catalogues. Le frontend utilise désormais la route privée inbox, qui présélectionne les notifications du compte et contrôle leur source avec le service Activity existant ; lecture, compteur, marquage lu et retrait vérifient tous la source réelle. Pas d’ouverture des règles natives, ni de migration supplémentaire après 0025. Installer les hooks complets et recharger le frontend correspondant ; redémarrer PocketBase pour interrompre les anciennes requêtes bloquées. Timeout frontend de 15 s pour la lecture avec erreur et Réessayer, aucun chargement indéfini.

Imports Contacts R05 — pilote : droit contacts.import en complément de contacts.read/write, profil non Viewer ; configuration Odoo réservée aux Admin/Superuser avec settings.references. Collections de staging et références externes sans CRUD natif ; DTO en allowlist et jobs/profils isolés par créateur. API Odoo côté serveur uniquement, secret chiffré via HORIZON_IMPORT_ENCRYPTION_KEY (32 caractères), jamais renvoyé/loggé. Hôtes SaaS HTTPS *.odoo.com uniquement pour ce pilote ; méthodes res.partner fields_get/search_count/search_read en allowlist, pas de méthode fournie par le navigateur, transport HTTP natif PocketBase ; les réponses non conformes au contrat JSON-2 sont refusées. Les entrées Odoo sont des données non fiables normalisées comme les fichiers. Application contrôlée par les permissions Contacts et validations/audit métier natifs ; valeurs de source ne pilotent ni collection libre ni statut historique.

Installation du pilote R05 : sauvegarder la base et les sources PocketBase, copier le pack complet pb_hooks/pb_migrations, puis redémarrer. Migration additive 1791840026_contact_imports.js ; les collections d’import préexistantes provoquent un refus explicite à examiner plutôt qu’un écrasement. Le droit contacts.import est ajouté aux seuls profils Admin existants ; les autres opérateurs sont accrédités via Utilisateurs et accès → Contacts → Importer les contacts (implique Contribuer/Consulter). Aucun accès natif ouvert aux tables de staging/références. Les exports CSV de rapport neutralisent les préfixes de formule.

Excel/CSV fonctionne sans secret supplémentaire. Pour activer Odoo, ajouter au seul environnement PocketBase `HORIZON_IMPORT_ENCRYPTION_KEY` : chaîne aléatoire ASCII de 32 caractères, indépendante de la clé Microsoft, à conserver avec les sauvegardes. Génération possible dans un terminal privé : `openssl rand -hex 16`. Exemple YAML de variable : `HORIZON_IMPORT_ENCRYPTION_KEY: "<votre clé de 32 caractères>"`. Recréer/redémarrer le conteneur pour transmettre cette variable, puis dans Imports → API Odoo → Configurer Odoo renseigner URL/base/clé API Odoo en privé. La configuration teste la lecture des métadonnées avant enregistrement ; aucun e-mail ni donnée Odoo modifié. Ne pas activer HORIZON_TEST_MODE/HORIZON_ODOO_TEST_ORIGIN en exploitation ; ces variables sont réservées aux fixtures jetables. Aucun conteneur additionnel nécessaire.

Imports — correction Odoo du 17 octobre : installer le pack unique `horizon-pocketbase-imports-odoo-complet-20261017.zip` (hooks complets + migrations conservées), redémarrer puis recharger le frontend correspondant. Aucune nouvelle migration après 1791840026. Chargement automatique complet avec décompte et absence de simulation partielle ; limite JSON de 8 Mo conservée. La clé serveur et la connexion existantes sont conservées. Installation NAS de cette correction non confirmée.

R05 — images/décisions groupées/suppression : nouvelles routes privées resolve-bulk et discard, mêmes droits Contacts et propriété du job revérifiés en transaction. Suppression refusée après démarrage/application, historique et références externes conservés, audit minimal sans données importées. Images raster base64 validées et bornées (200 000 caractères), converties en fichiers protégés natifs à confirmation ; aucune ouverture des règles de fichier. Pack unique `horizon-pocketbase-imports-controles-images-20261017.zip`, hooks/migrations complets inchangés après 1791840026, redémarrage et frontend cohérent requis. Le nouveau snapshot d’image peut bloquer une ancienne simulation de mise à jour : refaire sa vérification plutôt que contourner le contrôle de concurrence. Installation de ce pack NAS non confirmée.

R05 — pack Diagnostic images (17 octobre) : `horizon-pocketbase-imports-diagnostic-images-20261017.zip` remplace les packs Imports précédents, avec contexte binaire explicite, repli des tailles d’image et diagnostic reçu/mappé. Copier hooks/migrations complets après sauvegarde/arrêt, redémarrer et recharger le frontend ; aucune migration après 1791840026. Relire la source Odoo et consulter le compteur réel Images Odoo avant de valider sa récupération. Installation NAS et lecture authentifiée de l’instance CVS non effectuées par l’agent.

R05 — refus e-mail à l’application (17 octobre) : pack unique `horizon-pocketbase-imports-validation-email-20261017.zip` incluant les décisions rapides et validations natives ciblées Email/URL. Remplacer les hooks complets après sauvegarde/arrêt, copier les migrations inchangées, redémarrer et recharger Horizon ; aucune migration après 1791840026. Préparation preview : premier refus détecté avant application persisté comme erreur de ligne après rollback, correction ou ignorance via le gestionnaire existant. Import déjà partiel : blocage explicite et nouvelle simulation nécessaire ; conserver toutes les fiches/références externes et le namespace source. Aucun contenu de cellule, secret ou message technique brut dans les nouveaux logs (job/ligne/statut uniquement). Aucun changement des API Rules. Installation NAS non confirmée.

R05 — récupération après 409 (17 octobre) : pack unique `horizon-pocketbase-imports-reprise-409-20261017.zip`, cumulatif, hooks/migrations complets ; aucune nouvelle migration après 1791840026. Après sauvegarde/arrêt, remplacer les hooks, copier les migrations inchangées, redémarrer et recharger Horizon. Route privée recheck avec mêmes droits/propriété que apply ; aucune requête Odoo ni écriture Contacts pendant la revérification. Après import partiel, elle crée une seule préparation de reprise liée par creation_key serveur à la source, avec les seules lignes restantes ; ancien job/appliqués/références conservés. Confirmer séparément après résolution des correspondances actuelles. Diagnostic de conflit en allowlist (ligne, raison, noms de champs), sans valeurs de cellules dans les logs ; protection concurrente maintenue. Installation NAS non confirmée.

R05 — homonymes à l’intérieur d’un lot (17 octobre) : pack cumulatif `horizon-pocketbase-imports-homonymes-20261017.zip`, sans nouvelle migration. Seul imports.js change par rapport au pack Reprise 409 ; installer les hooks complets cohérents après sauvegarde/arrêt, redémarrer puis recharger. Sur le job actuellement bloqué, Revérifier la préparation prépare les seules lignes restantes et détecte les homonymes internes avant application, avec choix explicite créer distincte/ignorer. Revérifier également toute reprise qui aurait été préparée avant ce pack. Anciennes préparations sans normalized_data.base compatibles ; données déjà appliquées inchangées, aucune ouverture de permissions ni contournement des doublons forts/contrôles concurrents. Installation NAS non confirmée.

R05 — retrait des imports inachevés (18 octobre) : pack unique cumulatif `horizon-pocketbase-imports-retrait-20261018.zip`. Après sauvegarde de pb_data/hooks/migrations et arrêt, remplacer les hooks complets et copier les migrations, puis redémarrer. Nouvelle migration additive `1791840027_import_job_archive.js` : DateField archived_at et index propriétaire/archive/date, sans modifier les imports existants ni leurs lignes. Recharger le frontend à jour pour les corbeilles des imports applying/blocked partiels. discard privé et transactionnel : supprimer le staging inutilisé, ou annuler/archiver après début sans toucher fiches, lignes appliquées, références externes ni préparations de reprise distinctes. Les continuations déjà prévues sont refusées au lot suivant ; le catch ne réactive pas les jobs archivés. completed protégé, audit de retrait minimal et retrait répété idempotent. Installation NAS non effectuée/non confirmée.

### Installation et droits — fusion Contacts, 18 octobre 2026

Installer les hooks complets et la migration additive `1791840028_contact_merge.js`, après sauvegarde de `pb_data`, puis redémarrer PocketBase ; les migrations s’appliquent au démarrage normal. Les anciennes migrations restent inchangées. Recharger Horizon et reconnecter le compte pour renouveler les droits. Les rôles utilisés par les administrateurs existants reçoivent `contacts.merge` ; pour les autres comptes, accréditation Contacts → Fusionner les contacts, nécessitant read/write. Viewer refusé côté serveur même si le droit est présent dans un ancien rôle. Aucun changement d’API Rules ouvrant les collections privées Imports.

Routes privées POST `/api/horizon/contacts/merge/preview` et `/apply` : allowlist, authentification core_users active/rôle actif, droits recontrôlés, choix de champs autorisés seulement, confirmation et empreinte canonique revérifiée dans la transaction. Aucune écriture avant apply. Source archivée et verrouillée côté serveur ; champs merged_into/merged_at non saisissables par REST ; nouvelles relations directes ou liens polymorphiques métier vers une source fusionnée refusés. Historique, fichiers et audit conservés ; références externes traitées uniquement par l’adaptateur Imports. Les dépendances de modules non traitées bloquent avec un motif générique, sans révéler leurs données à un utilisateur non habilité. Source ayant déjà absorbé des fiches protégée contre une chaîne de fusion ; rejeu de la même fusion sans effets supplémentaires.

Premier lot : source sans dépendance métier intermodule, cible pouvant déjà être utilisée. Aucun transfert de compte comptable, document finalisé, tâche ou mail ; conserver la fiche porteuse de ces pièces comme destination. En cas de conflit ou de modification concurrente, aucune fusion partielle n’est enregistrée ; recharger l’aperçu. Aucune annulation automatique de fusion livrée : l’historique demeure consultable et toute correction ultérieure passe par une intervention métier contrôlée. NAS non installé/non confirmé par l’agent.

### Assistant de fusion / Produits — 18 octobre 2026

Pack cumulatif : hooks complets et migrations jusqu’à `1791840029_product_merge.js`, sauvegarde pb_data avant installation, redémarrage pour application de la migration, frontend à jour puis reconnexion. Aucun nouveau conteneur, secret ou variable. La migration ajoute seulement les marqueurs et l’index d’identité fusionnée sur inventory_products et inventory.merge aux administrateurs existants ; si le rôle est partagé avec un non-administrateur, il est isolé pour l’administrateur sans étendre les droits du compte métier. Délégation Contacts/Stock → Fusionner les doublons dans Utilisateurs et accès ; consultation/modification exigées, viewer interdit.

GET `/api/horizon/data-quality/candidates` est privé et vérifie read/write/merge du domaine choisi avant toute lecture. Types, parcours, tri et pagination sont en allowlist, textes de recherche limités, projections d’identité fixes sans fichiers ou coûts. Pas d’analyse à l’ouverture propre du frontend ; seules les pages demandées sont transmises. Limite explicite 50 000 identités actives par domaine, suggestions linéaires et aucune troncature silencieuse. Pas de stockage de simulations ou de contenu importé supplémentaire.

POST `/api/horizon/inventory/merge/preview` et `/apply` : validations, choix de champs autorisés, confirmation et empreinte canonique, droits recontrôlés dans la transaction ; aucun effet avant apply, rejeu idempotent. Les marqueurs sont protégés, source archivée non modifiable/réactivable et nouvelles relations directes/polymorphiques métier refusées. Un produit source utilisé par un mouvement/réservation/lot/série/valorisation/composition/document, ou une offre ayant des usages non traités, bloque la fusion ; la cible peut être utilisée, son stock reste inchangé. Les numéros/SKU/codes-barres historiques restent réservés et recherchables comme alias. Les prix historiques ne sont ni modifiés ni supprimés lors du transfert des offres ; le préféré de la cible est conservé. Copies d’images via le filesystem protégé, sources et galeries préservées.

GET `/api/horizon/inventory/products/{id}/merged-sources` : lecture Inventory autorisée seulement, réponse en allowlist id/name/sku. La collection inventory_products garde sa listRule verrouillée ; aucune ouverture REST pour contourner ce verrou. Contrôles des fichiers protégés existants maintenus. Aucun stock ou document finalisé réécrit, aucune écriture Odoo/Sage/PDP. Sources à deux historiques métier et domaines non pris en charge restent bloqués ; NAS non installé/non confirmé.


### TimeReport BE T01 — installation et droits, 18 octobre 2026

Installer ensemble les hooks complets, toutes les migrations historiques inchangées et l’additive `1791840030_time_report.js`, puis redémarrer PocketBase et recharger/reconnecter le frontend courant. PocketBase 0.40.4 testé ; aucun conteneur ou secret nouveau. Sauvegarder auparavant pb_data/fichiers/hooks/migrations. Aucun taux, horaire contractuel, activité ou temps inventé à la migration. Une collection Time/profils déjà présente provoque un arrêt explicite avant toute reprise manuelle du schéma ; ne pas supprimer ces données. Les administrateurs existants reçoivent les droits Time et le périmètre all, avec rôle isolé si partagé avec un non-administrateur. Les autres utilisateurs gardent leurs droits et time_scope none jusqu’à habilitation explicite dans Utilisateurs et accès.

Droits time.read/write/submit/validate/settings/costs, scopes self/reports/all. Paramètres et coûts exigent all ; validation refuse self et auto-validation. Employé actif associé obligatoire pour saisir. Responsable hiérarchique habilité prioritaire ; à défaut, choix explicite d’un autre valideur global. Une direction sans manager ne s’auto-valide pas dans T01. Le périmètre des brouillons est privé à leur auteur/global ; manager voit les feuilles soumises et décidées qui lui sont attribuées. Réouverture validée motivée et auditée ; le manager revient à sa liste si le nouveau brouillon devient privé. Toute transition/sauvegarde recharge le compte/rôle dans la transaction et vérifie la révision ; aucune écriture de temps par REST natif, même via un composant. Historique des lignes/entrées/coûts conservé dans Core Audit lors des modifications, événements simplifiés dans Activity. Temps validés seuls dans le réalisé ; changements de taux ne recalculent jamais leurs snapshots.

Routes privées : choices/accounts/sold-services/week/sheets/sheets/{id}/settings en GET, week/favorites/settings et sheets/{id}/transition en POST. Chaque route contrôle sa permission/périmètre avant résultat. Les choix analytiques/services sont une projection opérationnelle autorisée par Time.read sans prix, marge, stock ou données RH sensibles. Capacités/éligibilité BE des ressources configurables globalement ; semaines non saisies calculées seulement pour les ressources BE explicitement configurées, hors semaines sans capacité disponible et semaines futures. Jour férié/congé : uniquement nom du férié et fraction indisponible, aucun type de congé/raison/justificatif exposé. Les profils de coûts et entrées sont fermés à la lecture native ; les DTO de saisie/manager n’exposent ni coût ni salaire. Coûts standards EUR uniquement, montants analytiques agrégés via droits financiers existants ; coût manquant/devise différente restent indisponibles. PROD OnSite absent de ce pack fonctionnel ; aucune connexion à sa base.


TimeReport — correction Temps internes du 18 octobre : déployer hooks/frontend cohérents et migration additive `1791840031_internal_time_account.js`, puis redémarrer PocketBase. Le compte central est créé sans toucher aux comptes d’achat ni aux temps/favoris historiques. Code disponible à partir de 99301 ; libellé/code modifiables via les paramètres analytiques fixes existants. Le serveur impose le compte pour les nouvelles sauvegardes internes même si le client transmet une catégorie d’achat. Pour corriger une ancienne feuille, enregistrer explicitement son brouillon ; retirer une soumission ou rouvrir avec motif une feuille validée selon les droits existants. Aucun remplacement automatique d’un historique validé.


TimeReport — éligibilité du 18 octobre : migration additive `1791840032_time_employee_eligibility.js` et hooks/frontend cohérents requis. Aucune activation automatique, aucun temps historique modifié. Après sauvegarde et redémarrage : Employés → Équipes → fiche équipe → TimeReport BE ou Production ; fiche employé → Organisation → Saisit ses heures ; conserver les permissions du compte. Classification réservée à la gestion des équipes, activation réservée à `hr.organisation.manage` et aux droits/périmètres d’écriture RH. Employés non éligibles : historique conservé en consultation, aucune sauvegarde/soumission native BE autorisée même via appel direct. La validation manager ne requiert pas l’éligibilité de saisie personnelle. PROD reste sans import opérationnel dans T01.


TimeReport — garde de compatibilité des paramètres RH : les routes d’enregistrement d’équipe et d’activation employé refusent explicitement (503, message identifiant la migration 1791840032) un schéma dépourvu des champs de 0032, avant toute écriture. PocketBase peut ignorer un champ non défini dans une collection : ne jamais considérer app.save seul comme preuve de persistance d’un nouveau paramètre. Le frontend vérifie également que le serveur retourne le périmètre choisi et conserve le popup ouvert en cas de décalage. Déployer les hooks corrigés avec la migration 0032 déjà livrée, sans la modifier ni ajouter une nouvelle migration.


Catalogue / Nature du produit, 18 octobre : hooks catalogue et frontend cohérents, aucune migration après 0032. Le serveur étend le verrou stock/suivi/unité à kind dès qu’un mouvement, une réservation ou une série existe. Aucun produit de la base utilisateur ni document historique corrigé automatiquement ; changement explicite en fiche uniquement lorsqu’il est autorisé.


Catalogue — décision de sélecteur unique du 18 octobre : installer hooks/frontend cohérents et migration additive `1791840033_product_family_kind.js`. La migration initialise l’usage des familles sans changer les produits ou pièces existants. Paramètres → Catalogue permet d’ajuster l’usage de chaque famille ; les nouvelles affectations reprennent ce réglage côté serveur. Un ancien produit mal classé doit être corrigé explicitement en réappliquant sa famille puis en enregistrant ; aucun script de réparation automatique des historiques. Le verrou nature/stock/suivi/unité après mouvement/réservation/série reste serveur. Aucun nouveau conteneur ni secret.

TimeReport / synthèse équipe — 18 octobre : les brouillons ne contribuent ni aux durées ni aux compteurs de brouillons du manager. Une attente peut être signalée comme Non reçue sans identifier l’existence du brouillon : DTO synthétique sans ID et sans durée lisible dans l’UI. Aucune possibilité d’ouvrir cette attente ; soumission nécessaire pour consulter la feuille. Les attentes sont limitées aux employés éligibles du périmètre RH autorisé et aux capacités connues. Les feuilles soumises/validées restent soumises aux règles TimeReport existantes. Mise à jour des hooks et du frontend nécessaire, sans nouvelle migration.

TimeReport matrice — agrégats bornés semaine/mois/année. Les entrées sont sélectionnées via les relations de feuilles et le périmètre utilisateur/manager, jamais agrégées globalement avant filtrage de permission. Aucune description de temps, salaire ou snapshot de coût n’est retourné. Les cellules attendues sont calculées à partir de capacités datées et du calendrier RH privé expurgé des motifs. Les photos RH passent par `/api/horizon/time/employees/{id}/photo` avec contrôle TimeReport : soi-même, employé éligible du périmètre RH ou historique non brouillon autorisé ; aucun élargissement des règles natives RH. Flux de fichier partagé identity-photo, cache no-store, pas de jeton dans une URL.

TimeReport — garde de réel (18 octobre) : refus serveur des durées/commentaires datés après le jour courant Europe/Paris et des sauvegardes de semaines futures, indépendamment du navigateur. Soumission/validation refuse aussi les éventuelles anciennes entrées futures conservées ; aucune suppression automatique ni réécriture d’historique. Les états edit/submit d’un brouillon futur sont absents des actions serveur. Les DTOs portent today pour aligner les contrôles UI, sans paramètre client permettant de changer l’horloge. Les synthèses Équipe sont calculées sur les seules feuilles lisibles, avant filtres/pagination, et dédupliquent les attentes employé/semaine.

### Espacement partagé des fils — 18 octobre 2026

Pack cumulatif `/private/tmp/horizon-pocketbase-espace-fil-20261018.zip` : hooks complets et migrations jusqu’à `1791840034_ux_activity_gap.js`. Sauvegarder puis arrêter PocketBase, remplacer les hooks complets et ajouter les migrations en conservant pb_data, redémarrer et vérifier les logs. Frontend à jour requis. Extension additive du JSON UX, aucune nouvelle collection ou variable ; droits settings existants, validation entière 0–128 px, verrou updated et audit conservés. Installation NAS non effectuée par l’agent. Les anciennes migrations du pack précédent sont inchangées.

### Couleur des cadres des zones — 18 octobre 2026

Pack cumulatif `/private/tmp/horizon-pocketbase-bordures-zones-20261018.zip` : hooks complets et migrations jusqu’à `1791840035_ux_panel_borders.js`, incluant le réglage d’espace du fil (0034). Remplace le pack espace-fil pour une installation unique. Sauvegarder/arrêter PocketBase, remplacer les hooks complets, ajouter les migrations sans toucher pb_data, redémarrer puis vérifier les logs ; frontend à jour requis. Extension additive de settings_ux.config, deux couleurs hexadécimales en allowlist serveur, valeurs déjà présentes conservées, droits/concurrence/audit existants. Aucun secret ou nouveau conteneur ; installation NAS non effectuée par l’agent.

### Complétude des paramètres UX — 18 octobre 2026

Pack cumulatif `/private/tmp/horizon-pocketbase-ux-cartes-recherche-20261018.zip` : hooks complets et migrations jusqu’à `1791840036_ux_cards_search_fields.js`, incluant espacement du fil et bordures des zones (0034/0035). Une seule installation nécessaire : sauvegarder/arrêter PocketBase, remplacer pb_hooks complet et ajouter les migrations sans toucher pb_data, redémarrer, vérifier les logs puis utiliser le frontend à jour. Extension additive du JSON settings_ux, dimensions entières bornées et couleurs #RRGGBB en allowlist ; conserver les valeurs déjà réglées et le verrou updated/audit/droits existants. Taille du JSON vérifiée sous la limite de 10 Ko. Aucun secret, conteneur ou variable ajouté ; installation NAS non effectuée par l’agent.

### Dashboard personnel — 18 octobre 2026

Pack cumulatif `/private/tmp/horizon-pocketbase-activite-personnelle-20261018.zip` : hooks complets et migrations existantes jusqu’à 0036, aucun nouveau schéma pour ce correctif. Après sauvegarde, remplacer les hooks complets et redémarrer PocketBase ; frontend à jour requis. Le serveur impose le périmètre personnel du résumé même si une query view=team est ajoutée, et contrôle toujours l’accès à chaque source. Mon activité inclut auteur, mentions et tâches actuellement attribuées ; Équipe reste distinct. Installation NAS non effectuée par l’agent. Le pack inclut les précédents réglages UX.

### Préférences de colonnes par compte — 18 octobre 2026

Installer le pack cumulatif `horizon-pocketbase-colonnes-compte-20261018.zip` : sauvegarde NAS, arrêt PocketBase, remplacement du dossier pb_hooks complet et ajout des migrations, conservation de pb_data puis redémarrage. La migration additive `1791840037_table_preferences.js` crée core_table_preferences avec index unique user/table_key et toutes les règles REST verrouillées. Les routes GET/POST `/api/horizon/table-preferences/{context}` imposent le propriétaire de session, un compte/rôle actif et le droit de lecture du module ; un lecteur peut personnaliser son affichage sans obtenir de droit d’écriture métier. Payload en allowlist, tableaux bornés, révision vérifiée dans la transaction et audit core. Aucun choix de propriétaire ni URL/SQL libre, aucun secret, nouvelle variable ou nouveau conteneur. Une restauration est persistée, sans suppression de la ligne. Le frontend cohérent est nécessaire ; avant installation des hooks, le panneau indique le pack manquant et ne prétend pas sauvegarder les choix.

Recette : modifier des colonnes, attendre la synchronisation, ouvrir un navigateur vierge avec le même compte et vérifier l’affichage ; contrôler l’isolation avec un autre compte et la réapparition des valeurs par défaut après restauration. Les préférences locales v1 sont reprises uniquement si aucune préférence serveur n’existe ; un conflit ne les applique pas par-dessus les choix distants. Installation NAS non effectuée par l’agent.


Colonnes proposées — 18 octobre 2026 : installer les hooks complets (incluant `pb_hooks/config/table-columns.json`) et la migration additive `1791840038_table_column_policies.js`, puis redémarrer avant le frontend correspondant. Collection settings_table_columns verrouillée en REST natif. GET `/api/horizon/table-column-policies` ne retourne que la politique de présentation aux comptes/rôles actifs ; POST `/api/horizon/table-column-policies/{context}` exige le profil ERP Admin/Superuser et settings.references frais via policy.settings, vérifié aussi sous transaction. Contextes/colonnes en allowlist, exclusions obligatoires/inconnues interdites, révision optimiste 409 sans écrasement et audit. Le frontend ne remplace aucune API Rule par ce réglage ; des données déjà autorisées restent accessibles par les services métier. Les préférences privées core_table_preferences sont inchangées. Une panne de chargement de politique est affichée avec Réessayer ; aucun affichage transitoire de colonnes exclues au premier chargement. Relecture à navigation/focus, cache commun par compte.

Pack cumulatif `/private/tmp/horizon-pocketbase-colonnes-parametres-20261018.zip` : 305 fichiers source, 307 entrées avec instructions/manifeste, 1 067 638 octets, SHA-256 `ec00490f00a62fa3b706ec916cabff9b718c567b264cdeae33e7372435f79577`. Inclut 0037 et 0038, conserve toutes les anciennes migrations à l’identique ; aucun frontend, secret, base, fichier utilisateur ou exécutable. Installation NAS non effectuée/non confirmée. Sauvegarde cohérente, remplacement du dossier pb_hooks complet (config compris), ajout des migrations, redémarrage et recette requis.


Largeurs privées de tableaux — 18 octobre 2026 : actualiser lib/table-preferences.js pour accepter preference.widths facultatif. Allowlist order/hidden/widths, 100 largeurs maximum, identifiants bornés sans contrôle, valeurs numériques finies de 36 à 10000 px ; tableaux, chaînes, nombres hors limites et champs supplémentaires refusés. Propriété par compte authentifié, accès au module, révision transactionnelle, isolation, audit et REST verrouillé inchangés. Aucun nouveau champ de collection ni migration ; anciens JSON order/hidden toujours acceptés. Écriture une fois en fin de geste, pas par mouvement du pointeur. Échec visible avec retour à la préférence précédente et action de relecture, conflit sans écrasement.

Pack cumulatif `/private/tmp/horizon-pocketbase-colonnes-redimensionnement-20261018.zip` : 305 sources/307 entrées, 1 067 956 octets, SHA-256 `b7e3086faa0a9acb77164a41da08155a673a0c400bad8db166de6deb3a879a3a`. Hooks complets et migrations jusqu’à 0038, toutes identiques aux packs antérieurs ; manifeste/ZIP contrôlés. Sans frontend/base/secrets/exécutable. Si 0038 est déjà appliquée, seul le code serveur change pour ce lot. Sauvegarde, installation du dossier complet pb_hooks (config inclus), conservation des migrations/pb_data, redémarrage PocketBase 0.40.4 et frontend cohérent requis. Installation NAS non confirmée.


Facturation / taux d’acompte — 18 octobre 2026 : installer le pack cumulatif [horizon-pocketbase-acomptes-pourcentage-20261018.zip](/private/tmp/horizon-pocketbase-acomptes-pourcentage-20261018.zip) avec le frontend correspondant. Hooks complets (assets/config inclus), migration additive `1791840039_invoice_deposit_percent.js`, redémarrage PocketBase 0.40.4 ; conserver pb_data et les anciennes migrations. Remplace le pack acompte-entete. Aucun backfill des pièces validées ni changement de droits.

POST /api/horizon/billing/documents/calculate : billing.read + billing.write, profil non Viewer, allowlists, révision du brouillon non archivé, normaliseur métier partagé et aucune écriture/audit/numérotation. Retour des lignes et totaux recalculés ; le client ne peut imposer base_total/TVA, le taux d’un avoir ni les quantités de base de la commande. Les sauvegardes et validations restent transactionnelles et auditées ; elles recontrôlent taux/plafonds/TVA/déductions. Ancien brouillon à taux ambigu : repréparation requise, aucun montant deviné. Installation NAS non confirmée, aucun nouveau service/secret.


## Pagination adaptative — 19 octobre 2026

Installer le frontend et les hooks du pack cumulatif [horizon-pocketbase-pagination-adaptative-20261019.zip](/private/tmp/horizon-pocketbase-pagination-adaptative-20261019.zip), puis redémarrer PocketBase 0.40.4. Aucune nouvelle migration pour ce lot ; les migrations précédentes jusqu’à 0039 sont incluses et inchangées. Conserver pb_data, sauvegarder base/fichiers avant mise à jour et remplacer pb_hooks complet (config/assets inclus). Inclut les hooks d’acomptes du lot précédent. Installation NAS non confirmée.

Paramètre de lecture perPage entier 1..100, borné par list-page-size.js dans les routes de regroupement Contacts, CRM/AO, Ventes, Achats, Facturation, Catalogue, Stock, Notes de frais et Congés. Défaut historique conservé en absence du paramètre. La taille est un choix de présentation, ne remplace ni permissions ni périmètre ; filtres, tri global et comptages appliqués avant découpage. Contacts à tri/regroupement projeté : SQL LIMIT/OFFSET de la taille demandée, puis hydratation de ces seuls IDs via API Rules natives ; aucun chargement complet des fiches. Pas de nouvelle collection, règle, permission, secret ou provider. Les autres projections serveur existantes gardent leurs limites/recherches actuelles.

### Dashboards personnels — pack du 19 octobre 2026

Pack cumulatif [horizon-pocketbase-dashboards-widgets-20261019.zip](/private/tmp/horizon-pocketbase-dashboards-widgets-20261019.zip) : hooks complets et migrations jusqu’à `1791840040_dashboard_preferences.js`. Sauvegarde cohérente, arrêt PocketBase, remplacement complet de pb_hooks (assets/config inclus), ajout des migrations absentes sans remplacer pb_data, redémarrage PocketBase 0.40.4 puis frontend à jour. La migration additive 0040 s’applique au démarrage ; aucun nouveau service ni secret. Les migrations précédentes sont inchangées. ZIP/manifeste vérifiés : 310 sources / 312 entrées, SHA256 `7c1d012e563037112c68191180cb3b21f833494ab10c66cf1d941eec8fb655ee`. Installation NAS non effectuée par l’agent.

Collection dashboard_preferences verrouillée à l’API REST pour les comptes métier. Routes layouts exclusivement core_users actifs avec rôle actif ; propriétaire imposé depuis l’authentification, aucune lecture/écriture d’un autre compte, même pour un administrateur métier. Payload en allowlist stricte, types de widgets et tailles bornés, 12 dashboards maximum et 8 widgets uniques chacun ; défaut référencé valide ou Horizon. Sauvegarde en transaction avec révision comparée (409 si obsolète) et audit. La préférence ne contient aucune donnée financière, requête ou permission ; les services existants continuent de filtrer les données de chaque widget. Aucun partage entre utilisateurs dans ce lot.

### Suivi Équipe des notes de frais — 19 octobre 2026

GET expenses/overview exige expenses.read et scope reports/all, avec compte et rôle actifs via la policy existante. En reports, roster des collaborateurs directement rattachés à l’employé du manager ; notes limitées au validateur connecté, utilisateur distinct, submitted_at renseigné et status différent de draft. Les notes privées n’entrent ni dans les identifiants, états, montants, comptages ou métadonnées. Une note transmise à un autre validateur n’est pas reçue dans ce périmètre ; cela ne révèle pas son existence. En all, même droit de consultation globale qu’avant. Historiques visibles conservés indépendamment du roster actif. Projection minimale sans description, lignes ou justificatifs ; les liens passent ensuite par le contrôle de lecture existant. Aucun nouveau droit RH/validation/remboursement et aucun changement des API Rules ou schéma. Bornage période 2000–2099 (1/3/12 mois), filtres/sort en allowlist, perPage 1–100, lectures bornées à 10000 résultats avec erreur explicite.

Pack cumulatif [horizon-pocketbase-frais-equipe-20261019.zip](/private/tmp/horizon-pocketbase-frais-equipe-20261019.zip) : 312 sources/314 entrées, hooks complets et migrations jusqu’à 0040 ; ZIP/manifeste/SHA256 vérifiés, anciennes migrations inchangées. SHA256 `5d83af88dbbb008de3c066815a6a8ad2ee5730620166d0e2b9ab3d44b5a1cb98`. Sauvegarde cohérente, arrêt, remplacement complet de pb_hooks (assets/config inclus), ajout des migrations absentes sans toucher pb_data, redémarrage PocketBase 0.40.4 et frontend à jour. Aucune nouvelle migration pour cette vue ; le pack inclut les lots antérieurs dont la migration dashboards 0040 si manquante. Aucun secret, executable, frontend ou fichier utilisateur dans le pack ; installation NAS non effectuée.


### Fusion Sociétés / historiques — déploiement du 19 octobre 2026

Utiliser le pack cumulatif fusion-historiques du 19 octobre : sauvegarde cohérente de pb_data/fichiers et hooks, arrêt, remplacement des hooks complets et ajout des migrations absentes jusqu’à 1791840040, redémarrage PocketBase 0.40.4 et frontend cohérent. Aucune migration supplémentaire, variable, secret ou conteneur pour la fusion ; marqueurs merged_into/merged_at déjà introduits en 0028. Aucun accès NAS effectué par l’agent.

Contacts read/write/merge obligatoires, viewer refusé, plus write du module dont des brouillons/offres doivent être réaffectés. Les comptes tiers compatibles sont gérés par Accounting sous les droits Contacts existants. Vérifications réexécutées dans la transaction et audit explicite des rattachements. Les compteurs RH/Frais privés ou documents restreints ne sont pas révélés par l’aperçu ; consultation des pièces liée aux politiques propriétaires, fichiers GED soumis à l’intersection des ACL d’origine. Le regroupement ne donne pas accès à un ancien alias interdit par ses règles natives. Aucune modification de pièce financière finalisée, de snapshot ou de fichier historique. Les anciennes sources restent protégées ; seule l’action serveur peut aplatir merged_into sans changer leurs autres valeurs. Relations nouvelles à un alias refusées, propriétaires responsables de normaliser les nouvelles références. Incompatibilités et dépendances inconnues bloquent sans déplacement partiel. Pas de purge, fusion réelle ni rollback automatique livré.

### TimeReport — corrections du valideur, 19 octobre 2026

La route privée POST sheets/{id}/correct recharge compte, permissions, périmètre et révision dans la transaction. time.read + time.validate, compte non viewer, scope reports avec attribution de la feuille ou all ; auteur et employé du valideur doivent tous deux différer de ceux de la feuille. Aucune exigence de time.write ou d’éligibilité BE personnelle du valideur. Feuilles BE Horizon submitted uniquement : brouillon privé, feuille validée, source OnSite et PROD refusés. Body en allowlist, motif obligatoire, lignes étrangères/dupliquées refusées et contrôles de saisie/analytique existants réutilisés. Identités de la feuille non modifiables. Audit avant/après, événement et notification propriétaire atomiques ; préférences de notification inchangées. Édition native REST toujours interdite. Déployer hooks/frontend cohérents ; aucune migration supplémentaire, aucun secret/service nouveau.

Congés / frise RH, 19 octobre : calendrier privé sous leave.read et scope actif. Choix team limité à soi/équipe actuelle/responsable/directs, même pour un accès global ; company exige leave_scope=all et reste refusé par API pour self/reports indépendamment du toggle. Projections d’identité minimales ; états submitted/approved/cancel_requested seulement, redaction id/href conservée et aucune exposition de type/motif/justificatif. Totaux établis après filtrage du périmètre et de la recherche, avant pagination des collaborateurs. Les scopes leave/expenses déjà présents dans le record authentifié sont conservés dans la projection de session frontend pour masquer les sous-menus non accessibles ; cela ne remplace jamais les contrôles serveur. Installer hooks/frontend cohérents ; aucune migration, variable ou dépendance nouvelle.

Congés / avatars de frise : route photo privée avec leave.read, scope actif et périmètre calendaire contrôlé à chaque lecture ; refus après réaffectation d’équipe/responsable. Le fichier reste propriété HR et utilise identity-photo partagé, no-store et Authorization. Les collègues n’obtiennent ni token de fichier dans l’URL ni droit REST HR.

Congés / aperçu de barre (19 octobre) : type_label projeté côté serveur uniquement pour l’auteur, le manager attribué après soumission ou le périmètre global, selon visible existant ; pas de type médical dans le calendrier d’un collègue non autorisé. Popup à accès limité sans requête record quand l’ID a été expurgé. Informations privées du détail chargées uniquement par la lecture record existante, avec erreurs visibles et aucun lien de fiche en cas de refus. Déployer hook leave.js et frontend cohérents ; aucune migration ou permission nouvelle.

### Préférences d’affichage personnelles — 20 octobre 2026

Routes privées GET/POST /api/horizon/account/display-preferences : auth core_users, compte et rôle actifs exigés, aucun droit module/admin nécessaire pour modifier ses propres choix. user imposé depuis la session et non accepté dans le corps. Allowlist stricte revision/preference et deux booléens showCounters/highlightNonZero, révision entière sûre non négative. Transaction avec contrôle de version, audit display_preferences_update ; aucune écriture métier. core_display_preferences entièrement verrouillée en API native, une ligne par utilisateur via index unique ; aucune lecture/écriture d’un autre compte, même via le formulaire.

Installation : sauvegarder pb_data/fichiers/hooks/migrations, arrêter PocketBase, remplacer les hooks complets et ajouter les migrations absentes jusqu’à 1791840041_display_preferences.js, conserver les précédentes, redémarrer PocketBase puis actualiser le frontend correspondant. Aucune variable, dépendance ou conteneur nouveau. Échec de lecture visible, ancienne préférence conservée si déjà chargée ; conflit de sauvegarde présenté avec rechargement explicite. NAS non installé par l’agent.

### Regroupement des préférences et signatures personnelles — 20 octobre 2026

core_display_preferences conserve ses règles verrouillées et sa révision atomique. Allowlist étendue : theme default/light/dark, searchWidth null ou entier 400–1200, sidebarWidth null ou entier 180–360, density default/compact/comfortable. Booléens requis comme auparavant ; nouveaux champs optionnels conservés depuis la version courante s’ils sont absents du client. Valeurs manquantes d’anciens enregistrements projetées par défaut sans réécriture ; aucune nouvelle migration pour cette extension JSON. Les préférences administrateur ne sont jamais modifiées. Le résultat asynchrone d’un changement de thème est placé dans le cache de son propriétaire initial, pas dans celui d’une session suivante.

GET/POST /api/horizon/messaging/personal-signatures : module propriétaire Messaging, authentification core_users, compte/rôle actifs et messaging.read ; POST exige messaging.write et refuse Viewer. Read limité à user=auth.id ; POST fixe user depuis le compte, refuse user dans le corps et l’accès à tout ID d’un autre compte ou de signature société, y compris avec un rôle administrateur sur cette route personnelle. Les routes d’administration existantes restent distinctes. Allowlist name/body_json/active/is_default, validation Tiptap fermée et variables connues, contrôle updated, transaction et audit personal_signature_save. Réaffectation de défaut limitée aux signatures du même utilisateur, aucun effacement ni modification de document/e-mail historique.

Pack cumulatif preferences-personnelles-20261020 : hooks complets et migrations jusqu’à 0041 ; sauvegarde, arrêt, remplacement des hooks, ajout des migrations absentes uniquement, redémarrage PocketBase et frontend à jour. Si 0041 est déjà appliquée, aucune nouvelle migration à attendre. Aucun secret, périmètre Microsoft ou conteneur supplémentaire ; NAS non déployé par l’agent.

### Dashboard — configurations de widgets, 20 octobre 2026

Extension JSON compatible avec les anciennes dispositions dans dashboard_preferences, sans nouvelle migration structurelle après 0041. Jusqu’à 32 instances par dashboard et douze pages par carrousel ; identifiants, sources, filtres, coordonnées, dimensions, délais et destinations validés en allowlist côté serveur. Doublon d’id refusé ; même type autorisé plusieurs fois. Aucune requête libre, URL externe ou secret accepté. Révision/transaction/audit et collection privée inchangés. Les services CRM/Ventes/Billing/TimeReport/Congés/Notes de frais restent seuls propriétaires des données et vérifient leurs périmètres ; une préférence sauvegardée ne vaut jamais autorisation. Dates et owner validés côté routes métier ; filtres avant pagination. L’extension TimeReport trimestrielle conserve notamment l’exclusion des brouillons privés.

Pack cumulatif unique [horizon-pocketbase-dashboards-widgets-20261020.zip](/private/tmp/horizon-pocketbase-dashboards-widgets-20261020.zip) : 326 sources / 328 entrées, 1 092 529 octets, SHA-256 `d27fbf4e16a840c000f8a2ab3da71bb48981ab5a536196005020c4f635ea32f6`. ZIP/manifeste/empreintes/sources vérifiés, toutes les migrations identiques au pack Préférences personnelles précédent. Sauvegarde cohérente, arrêt PocketBase, remplacement complet des hooks, ajout des migrations absentes jusqu’à 0041, redémarrage puis frontend à jour. Aucune migration supplémentaire si 0041 déjà installée, aucune nouvelle variable ni service. Le frontend et les hooks du dashboard doivent être livrés ensemble ; un ancien serveur refusera les nouvelles configurations. Installation NAS non effectuée ni confirmée.


### Messagerie / Reçus — 21 octobre 2026

Routes GET privées de consultation des réponses importées (`/api/horizon/messaging/replies`, détail et attachment). messaging.read requis ; propriétaire de l’envoi sent et droit sales.read/purchasing.read contrôlés avant lecture, comptage/pagination et accès aux fichiers. Un autre utilisateur autorisé sur la même boîte ne voit pas cette boîte personnelle Horizon. DTO en allowlist, aucune nouvelle API Rule native ; fichiers par requête authentifiée avec Cache-Control no-store et nosniff, nom exact appartenant à la réponse. Corps texte échappé côté UI, aucune ressource HTML externe chargée. Les règles existantes du fil métier restent distinctes et inchangées.

Installer le [pack cumulatif messagerie-recus-20261021](/private/tmp/horizon-pocketbase-messagerie-recus-20261021.zip) et le frontend correspondant : sauvegarde cohérente, arrêt PocketBase, remplacement complet de pb_hooks (assets/config compris), ajout des migrations absentes jusqu’à 0041 sans remplacer pb_data, redémarrage PocketBase 0.40.4. Aucune nouvelle migration, variable, portée Microsoft ni reconnexion si la réception fonctionne déjà. ZIP/manifeste/empreintes vérifiés : 327 sources, 329 entrées, 1 094 360 octets ; SHA-256 `b8e67d20c710dac89f32938c3da7402304399f8e2081a60e87d84ddea5c2ae97`. Sans frontend, base, secrets ni exécutable. Pack préparé localement ; installation NAS non effectuée/non confirmée. Les réponses historiques déjà importées sont immédiatement lisibles après mise à jour, sous leurs permissions.


### Devis / contact — 21 octobre 2026

Champ contact existant accepté par le service de sauvegarde, sans CRUD natif ni changement de collection. sales.write/crm.read restent requis pour un brouillon ; tout changement de contact exige contacts.read et vérifie côté serveur une personne active de la même société canonique (ou choix vide explicite), dans la transaction. Omission du champ compatible avec les anciens clients. Devis finalisés immuables, contact accepté non modifiable par une révision de commande ; changement tracé dans audit/fil avec libellés lisibles. Aucune modification des snapshots/PDF envoyés ou de l’opportunité.

Pack cumulatif [contact-devis-20261021](/private/tmp/horizon-pocketbase-contact-devis-20261021.zip), incluant Messagerie/Reçus : 327 sources / 329 entrées, 1 094 625 octets, SHA-256 `97f9e73e0c0ad2dbaca1eb90c05da88302cfe65e0d65d43061c42b021c484e47`. ZIP/manifeste/empreintes vérifiés ; migrations jusqu’à 0041 identiques, aucune nouvelle migration ni variable. Après sauvegarde cohérente et arrêt PocketBase, remplacer pb_hooks complet (assets/config inclus), ajouter les migrations absentes sans remplacer pb_data, redémarrer PocketBase 0.40.4 et utiliser le frontend à jour. Sans frontend/base/secrets/exécutable ; installation NAS non effectuée/non confirmée.


### 21 octobre 2026 — Actualisation volontaire des coûts des devis

Route privée POST `/api/horizon/sales/quotes/cost-preview` : droits sales.write, crm.read et inventory.read, brouillon actif, rattachement et version du devis vérifiés. Projection Inventory reprenant le coût effectif de la fiche produit, unité et devise ; refus des sources expirées/indisponibles. Comparaison et application ne font aucune écriture. Une empreinte de la source est recontrôlée à l’application puis à la sauvegarde normale ; conflit 409 en cas de changement. Provenance de coût dans le JSON existant, snapshot d’identité conservé et audit de sauvegarde existant. Aucune nouvelle collection/migration, aucun rafraîchissement automatique de pièce finalisée.

Pack cumulatif [actualisation-couts-devis-20261021](/private/tmp/horizon-pocketbase-actualisation-couts-devis-20261021.zip), incluant Contact devis et Reçus : 329 sources / 331 entrées, 1 097 813 octets, SHA-256 `501f4f3a638ec30f99943f5f96d5dee636a34f16572e1ad7d09505eb2dd4f53a`. ZIP/manifeste/empreintes vérifiés. Sauvegarder et arrêter PocketBase, remplacer pb_hooks complet, ajouter les migrations absentes sans toucher pb_data, redémarrer PocketBase 0.40.4 avec le frontend correspondant. Migrations existantes inchangées, aucune nouvelle variable ; sans base/secrets/exécutable/frontend. Installation NAS non effectuée/non confirmée.


### 21 octobre 2026 — Correctif de source du coût courant

Le comparatif relit désormais le coût effectif de la fiche produit via Catalog.productPrice sans forcer l’offre historique de la ligne : coût manuel prioritaire, sinon favori actif, sinon référence. La source courante participe à l’empreinte et à cost_reference ; identité/fournisseur historique de la ligne conservés. Permissions, devise, unité, validité et contrôles de concurrence restent appliqués.

Pack cumulatif [cout-fiche-produit-20261021](/private/tmp/horizon-pocketbase-cout-fiche-produit-20261021.zip) remplaçant le précédent : 329 sources / 331 entrées, 1 097 929 octets, SHA-256 `f6a73b1c226fabb8c8c4cda1ebbb88c06206eb709fa3ff2294fa0f4d09dfee5c`. ZIP/manifeste/empreintes vérifiés. Sauvegarde cohérente, arrêt, remplacement complet pb_hooks, migrations absentes seulement, conservation pb_data et redémarrage PocketBase 0.40.4 ; frontend correspondant requis. Aucune nouvelle migration/variable. Installation NAS non effectuée/non confirmée.


Pack cumulatif comparatif coûts du 21 octobre 2026 : [comparatif-couts-20261021](/private/tmp/horizon-pocketbase-comparatif-couts-20261021.zip), remplace cout-fiche-produit avec old_source pour l’ancien fournisseur. 329 sources / 331 entrées, 1 098 243 octets, SHA-256 `6749b1a15add10f9965fc1cab1a4dccc348e282fe377511c18cd20a477f225e0`. ZIP/manifeste/empreintes vérifiés. Même installation : sauvegarde et arrêt, remplacement pb_hooks complet, migrations absentes seulement, pb_data conservé, redémarrage PocketBase 0.40.4 et frontend correspondant. Aucune nouvelle migration/variable, mêmes contrôles d’accès. Installation NAS non effectuée/non confirmée.
