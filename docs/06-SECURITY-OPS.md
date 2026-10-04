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
