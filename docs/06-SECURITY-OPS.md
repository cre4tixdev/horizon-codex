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

Les rapports analytiques ne doivent pas exposer des données provenant de modules auxquels l’utilisateur n’a pas accès si ces données sont sensibles.


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
