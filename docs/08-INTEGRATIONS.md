# Horizon — Integrations

## Principe

Toutes les intégrations externes sont isolées derrière des services / adapters.

Les modules métier ne dépendentent pas directement des fournisseurs externes.

---

# E-mail — Microsoft Graph et OAuth délégué

**Choix final validé le 16 octobre 2026**, après comparaison de la maintenance SMTP : Microsoft Graph avec OAuth délégué. PocketBase standard et hooks JS, aucun nouveau conteneur, SDK ou binaire personnalisé. Cela remplace la cible SMTP intermédiaire et le prototype Graph client_credentials retiré avant commit.

```text
Module métier → Messaging Service → MailProvider → Microsoft Graph v1.0
```

Les modules métier ne contactent pas Graph. `sales-mail.js` et `purchasing-mail.js` sont les contrats propriétaires de projection/transition des pièces. Envoi partagé de messages libres, devis finalisés et BC validés ; PDF généré par Documents/Gotenberg et conservé dans les fichiers protégés du message. Templates/signatures Tiptap à variables allowlistées, HTML construit côté serveur sans HTML utilisateur exécutable. La réception ciblée des réponses aux devis/BC est ajoutée ci-dessous ; chat, factures, boîte de réception générale et boîtes partagées restent hors de ce lot.

## Connexion administrée

Dans Paramètres → E-mails → Expéditeurs, créer l’adresse, les utilisateurs Horizon explicitement autorisés, puis Connecter. Profil Admin/Superuser et droits messaging.read/settings requis pour configurer ; From contrôlé par l’allowlist même pour l’administrateur. **Première version : une boîte personnelle connectée par expéditeur** ; `/me` de Graph doit renvoyer exactement l’adresse sélectionnée (mail, sinon UPN). Aucun alias/Send As implicite ; boîtes partagées à traiter explicitement dans un lot ultérieur.

Autorisation Microsoft : flux authorization_code confidentiel + PKCE S256, scopes `offline_access`, `https://graph.microsoft.com/User.Read` et `https://graph.microsoft.com/Mail.Send`. Application Entra à locataire unique ; pas de permissions Graph Application ni d’attribution Exchange Application Mail.Send pour ce mode. La connexion peut demander MFA/consentement selon les politiques existantes ; aucun assouplissement de sécurité du locataire.

L’URI Web de redirection Entra doit être **l’origine frontend Horizon suivie de `/messaging/oauth/callback`**, identique à HORIZON_MAIL_REDIRECT_URI (HTTPS en déploiement ; HTTP seulement localhost/127.0.0.1 avec port en développement). Elle diffère de celle d’Odoo, qui reste intacte. Aucun implicit grant ni configuration SPA de secret. Le navigateur reçoit un code court, jamais de jeton Microsoft : état lié à son onglet dans sessionStorage, suppression immédiate de la query au retour, puis POST authentifié au backend Horizon qui échange le code et vérifie `/me`. Ne pas journaliser les paramètres de cette route au reverse proxy, ne pas ajouter de ressources tierces à cette page.

État serveur aléatoire, hashé, propriétaire, expiration dix minutes et consommation atomique avant échange ; vérificateur PKCE chiffré. Relire permissions, version de boîte et génération de connexion avant de sauvegarder : un callback ancien ne doit pas rétablir une connexion après déconnexion/reconnexion concurrente. Pas de lecture de JWT non vérifié pour identifier l’expéditeur.

Jetons AES-256-GCM (helper natif PocketBase) dans une collection privée à champs cachés ; clé serveur séparée de la base. Renouvellement sérialisé par claim persistant, rotation conservée, accès révoqué → reconnexion ; un refresh interrompu ne repart pas aveuglément après expiration de son claim. Déconnecter efface les jetons locaux, invalide états OAuth et génération des envois ; la révocation du consentement dans Microsoft reste une opération distincte. Un envoi déjà transmis à Microsoft ne peut pas être rappelé.

## File persistante et reprises

Enqueue côté serveur : permissions, expéditeur, connexion et version source relus ; snapshot transport `graph-delegated-v1` + génération de connexion dans l’outbox. Une seule prise en charge atomique, aucun appel réseau dans une transaction SQLite. Dès le commit de la mise en file, la route déclenche le même worker pour le seul message nouvellement ajouté, puis renvoie son état actualisé. Ce premier traitement s’exécute dans la requête HTTP (le bouton reste occupé pendant l’appel Microsoft), sans timer JS ni tâche en mémoire. Une interruption du déclenchement laisse la file durable au cron de secours toutes les minutes (cinq candidats par passage). Le worker relit état et échéance dans la transaction de claim ; double clic, traitement concurrent et Retry-After ne peuvent pas forcer une seconde prise en charge. Un nouvel enqueue sur un message déjà pending/processing/sent ne redéclenche pas ce chemin immédiat. Le bouton process reste réservé aux paramètres pour diagnostic, sans étendre ce droit aux utilisateurs habilités à envoyer. Les dates de filtrage de file utilisent le format normalisé PocketBase (espace entre date/heure), et non une comparaison SQLite avec `T`.

`POST /me/sendMail`, pièces jointes limitées à **10 fichiers et 2 Mio cumulés PDF inclus**, pour rester sous la limite des requêtes Graph sans session d’upload. HTML/identité/PDF figés ; copies dans Éléments envoyés demandées. HTTP 202 → état Horizon Envoyé signifie **accepté par Microsoft**, aucune garantie de livraison/lecture. Succès déclenche les transitions métier dans les modules propriétaires. Activity projette les destinataires À, l’expéditeur, l’objet, le corps texte et les pièces originales du message envoyé pour les lecteurs autorisés à la fiche source ; Cc/Cci, jetons et HTML actif restent exclus. Le contrat Messaging vérifie le lien exact événement/message envoyé/source/auteur ; la route authentifiée `/api/horizon/activity/events/{id}/email-attachment` sert uniquement ces fichiers après autorisation de la source. Les fichiers restent stockés une seule fois dans Messaging et leurs règles natives privées restent inchangées. Les anciens événements liés sont enrichis à la lecture.

HTTP 429 : respecter Retry-After et backoff, au plus cinq tentatives ; délai supérieur à sept jours → arrêt manuel. Erreur temporaire avant transmission du message (auth/token) : reprise bornée également. Refus définitif → Échec ; 401 demande une reconnexion. Timeout/perte de réponse après soumission, 408/5xx ou réponse inattendue positive → À vérifier, **aucune relance automatique** ; traitement processing abandonné depuis dix minutes également. Après vérification manuelle motivée, l’incident peut être clos sans envoyer ni changer la pièce. Pas de garantie exactly-once auprès de Microsoft lorsque la réponse est perdue.

Aucun transport alternatif automatique, aucun mot de passe SMTP, aucun fallback client_credentials. Toute nouvelle connexion invalide les anciens jobs par génération, imposant remise en file explicite. Historique/message envoyé immuable et privé à son propriétaire ; recherche, archive indépendante et filtres URL via les composants communs.

## Compatibilité avec le pack installé

Migration 1791840018 conservée à l’identique, utilisateur ayant confirmé son installation NAS ; **1791840019** ajoute stockage OAuth et empreinte de transport. Elle arrête les anciens pending en failed et met les processing en uncertain ; aucun ancien envoi ne repart automatiquement. Historique sent/draft, boîtes, modèles et fichiers conservés. Installer hooks/migrations/frontend cohérents après sauvegarde, arrêt du worker existant et inventaire de la file. Aucun accès NAS effectué par l’agent ; recette Microsoft réelle non exécutée.

## Sources et diagnostic SMTP conservé

[Graph sendMail v1.0](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0), [OAuth authorization code + PKCE](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [throttling Graph](https://learn.microsoft.com/en-us/graph/throttling), [envoi depuis une autre boîte](https://learn.microsoft.com/en-us/graph/outlook-send-mail-from-other-user). L’implémentation utilise HTTP et les primitives natives PocketBase, sans SDK Microsoft compatible avec le runtime JS embarqué ; protocole isolé et testé avec faux fournisseur, pas de simulation présentée comme recette Entra.

Le parcours [Odoo Outlook OAuth](https://www.odoo.com/documentation/19.0/applications/general/email_communication/azure_oauth.html) et les captures utilisateur montrent les permissions déléguées SMTP.Send/IMAP.AccessAsUser.All/User.Read et un callback `/microsoft_outlook/confirm`. Cela a permis de distinguer le mode délégué du mode applicatif. Le serveur sortant Odoo actif n’a pas été inspecté.

PocketBase 0.40.4 natif ne fournit pas XOAUTH2 : [source smtp.go](https://github.com/pocketbase/pocketbase/blob/v0.40.4/tools/mailer/smtp.go), confirmé par `tests/pocketbase/check_smtp_capability.py` (base jetable, SMTP loopback refusant toutes les authentifications). Une extension Go est officiellement possible mais sa construction/maintenance Docker est évitée par le choix final Graph délégué. Ce diagnostic ne doit pas réintroduire SMTP dans le transport livré.

---

# PDF

```text
Document Service
↓
HTML
↓
Gotenberg
↓
PDF
```

Gotenberg est un service technique.

---

# Sage

## Rôle initial

Au lancement, **Sage reste la comptabilité officielle**.

Horizon produit les données de pré-comptabilité et les transmet via :

```text
Accounting Service
↓
AccountingProvider
↓
SageAccountingProvider
↓
API / export Sage
```

Selon les capacités disponibles de l’environnement Sage CVS, l’adapter pourra utiliser :

- API ;
- export de fichier ;
- ou une combinaison des deux.

Cette différence ne doit pas remonter dans les modules métier.

## Données / opérations envisagées

- clients / fournisseurs si nécessaire ;
- comptes ;
- journaux ;
- factures ;
- avoirs ;
- écritures ;
- règlements ;
- analytique ;
- statuts de synchronisation.

Chaque synchronisation conserve :

```text
objet Horizon
provider
identifiant Sage
statut
hash
date
tentatives
erreur éventuelle
```

Objectif :

- idempotence ;
- retry ;
- audit ;
- réconciliation.

### Parc interne et immobilisations — cadrage

L’affectation de matériel à l’usage interne est pilotée par Inventory ; son rattachement à une immobilisation est une opération comptable distincte. Prévoir des références stables vers le produit, l’exemplaire, la réception et l’actif comptable. Toute synchronisation vers Sage passe par Accounting Service / AccountingProvider / SageAccountingProvider et conserve les exigences de traçabilité, idempotence et rejeu. Aucune intégration ou écriture comptable n’est livrée dans ce cadrage du catalogue.

## Évolution

À terme :

```text
AccountingProvider
├── SageAccountingProvider
└── HorizonAccountingProvider
```

Le module Facturation ne doit pas connaître le provider actif.

---

# SUPER PDP / facturation électronique

SUPER PDP est la **plateforme agréée sélectionnée** pour Horizon.

Intégration :

```text
Billing
↓
EInvoiceService
↓
EInvoiceProvider
↓
SuperPdpProvider
↓
SUPER PDP API
```

## Flux sortants

- factures clients ;
- avoirs ;
- données structurées ;
- pièces jointes autorisées ;
- suivi des statuts ;
- événements du cycle de vie ;
- e-reporting lorsque nécessaire.

## Flux entrants

- factures fournisseurs ;
- avoirs fournisseurs ;
- événements ;
- statuts ;
- documents associés.

Les factures fournisseurs reçues sont intégrées dans Horizon puis rapprochées des achats, commandes et projets lorsque possible.

## Formats

Le provider doit pouvoir gérer les formats structurés nécessaires à la facturation électronique, notamment selon les possibilités de SUPER PDP :

```text
Factur-X
UBL
CII
```

Le format interne Horizon ne doit pas dépendre directement du format externe.

## Synchronisation

Prévoir :

- envoi ;
- réception ;
- webhooks ;
- polling / rattrapage ;
- retry ;
- idempotence ;
- mapping des statuts ;
- journal des erreurs ;
- corrélation via identifiants externes.

## Abstraction

SUPER PDP est le provider initial.

L’interface reste générique :

```text
EInvoiceProvider
```

afin de permettre un changement futur de plateforme agréée sans modifier la logique métier de Facturation.

## Veille réglementaire

Les exigences réglementaires et le statut d’agrément du provider doivent être revérifiés lors des releases qui touchent à la facturation électronique.

---

# Stockage S3

PocketBase local au départ.

Évolution possible :

```text
S3 compatible
MinIO
Synology S3
```

sans changer la logique métier.

---

# API externes futures

Toute nouvelle intégration doit avoir :

```text
adapter
configuration
authentification
logs
gestion erreurs
retry si pertinent
statut de synchronisation
```

---

# Règle

Ne jamais faire dépendre un module métier d’un fournisseur spécifique lorsqu’une abstraction simple permet de l’éviter.

---

# Migration Odoo

Odoo est une **source de migration**, pas une dépendance runtime de Horizon.

Architecture :

```text
Odoo
↓
OdooMigrationProvider
↓
Import Service
↓
normalisation
↓
matching
↓
dry run
↓
validation
↓
Horizon
```

Le périmètre migrable peut inclure selon le besoin :

- sociétés ;
- contacts ;
- produits ;
- fournisseurs ;
- références fournisseurs ;
- prix ;
- opportunités ;
- devis ;
- commandes ;
- données historiques utiles.

Les identifiants Odoo sont conservés dans `core_external_references`.

Cela permet :

- reprise incrémentale ;
- relecture ;
- contrôle ;
- absence de doublon lors d’un nouvel import.

Aucune donnée Odoo n’est considérée valide sans passage par les règles de normalisation Horizon.

---

# Imports Excel Catalogues / Prix

Horizon accepte des fichiers Excel de catalogues / tarifs fournisseurs.

Pipeline :

```text
Excel
↓
mapping colonnes
↓
normalisation
↓
matching catalogue existant
↓
preview
↓
validation
↓
mise à jour
```

Le fichier peut contenir notamment :

- référence interne ;
- fabricant ;
- référence fabricant ;
- fournisseur ;
- référence fournisseur ;
- désignation ;
- prix ;
- devise ;
- quantité minimum ;
- délai.

Le matching doit privilégier les identifiants fiables avant le nom du produit.

Une ligne ambiguë est placée en conflit et nécessite une résolution.

Les imports doivent produire un rapport :

```text
créés
mis à jour
ignorés
conflits
erreurs
```

---

# Référence OnSite

`cre4tixdev/cvs-onsite-backend` est une référence fonctionnelle interne pour le planning des ressources.

Horizon reprend les concepts utiles :

- planning hebdomadaire ;
- collaborateurs internes / externes ;
- codes affaires ;
- jour / nuit ;
- plusieurs affectations ;
- Atelier / IDF / Déplacement ;
- absences ;
- copie de semaine ;
- multi-saisie.

Il n’existe pas de dépendance runtime entre Horizon et ce dépôt sauf décision ultérieure explicite.


# Multi-devise / taux de change

Provider V1 :

```text
ExchangeRateProvider
└── EcbExchangeRateProvider
```

Source unique :

```text
Banque centrale européenne / ECB
```

Horizon synchronise l’historique quotidien.

Chaque enregistrement conserve :

```text
base_currency
quote_currency
rate
rate_date
source = ECB
published_at
retrieved_at
```

Chaque document validé conserve son propre snapshot du taux effectivement appliqué.

Pour la fiscalité, Horizon peut conserver un `tax_exchange_rate` distinct, également sourcé BCE, afin de gérer une date fiscale différente sans introduire un deuxième provider.

Aucun fournisseur de taux commercial supplémentaire n’est requis en V1.

---

# Migration Odoo — périmètre et nettoyage

Avant la migration définitive, chaque domaine est classé :

```text
à migrer
à archiver hors Horizon
à ignorer
à nettoyer
```

L’assistant de migration doit permettre :

- sélection de la période historique ;
- détection des doublons ;
- normalisation sociétés / contacts ;
- normalisation références produits ;
- validation des statuts ;
- rapport d’anomalies.

Les données historiques non nécessaires au fonctionnement quotidien peuvent rester accessibles dans une archive séparée plutôt que d’être toutes injectées dans Horizon.

---

# Tarifs fournisseurs

Les imports doivent supporter des fichiers hétérogènes.

Le mapping est mémorisable par fournisseur.

Un profil d’import peut décrire :

- feuille Excel ;
- ligne d’en-tête ;
- colonne référence ;
- colonne description ;
- colonne prix ;
- colonne devise ;
- unité ;
- conditionnement ;
- quantité minimum ;
- date de validité.

Les tarifs datés futurs peuvent être importés avant leur date d’effet.

Les anciens tarifs restent historisés.


# API externe Horizon

Endpoint de base :

```text
/api/external/v1/
```

L’API est destinée aux intégrations validées avec des systèmes tiers.

Elle utilise une authentification par client API.

Exemple :

```http
Authorization: Bearer <api-key>
```

La clé identifie uniquement un **client technique**, pas un utilisateur humain.

## Ressources initiales possibles

L’exposition est désactivée par défaut.

Ressources potentiellement activables :

```text
contacts.companies
contacts.people
inventory.products
crm.opportunities
projects.projects
service.installed_assets
```

Chaque ressource nécessite une policy explicite.

Les ressources financières / comptables ne sont jamais ouvertes par défaut.

## Versioning

```text
/v1
/v2
```

Une rupture de contrat implique une nouvelle version.

## Pagination / erreurs

Prévoir un contrat cohérent :

```text
pagination
sorting
filters contrôlés
error codes
request_id
```

Les filtres disponibles sont définis par ressource et ne donnent jamais accès à une syntaxe PocketBase arbitraire.

## Webhooks futurs

L’architecture peut ultérieurement exposer des webhooks sortants.

Ils ne sont pas obligatoires en V1.

Si ajoutés :

- signature ;
- retry ;
- idempotence ;
- historique ;
- désactivation par endpoint.

# Recherche d’entreprises publique — décision du 5 octobre 2026

Pappers est remplacé par l’[API Recherche d’entreprises de l’État](https://recherche-entreprises.api.gouv.fr/docs/). Architecture retenue avec l’utilisateur : UI Contacts → CompanyLookupService → CompanyLookupRepository → API publique, directement depuis le navigateur. Aucun relais PocketBase, clé API, configuration serveur ni déploiement NAS nécessaire à cette recherche.

Le bouton « Rechercher sur le web », avec une icône globe, est placé dans l’en-tête du bloc Identité, en création et sur une société existante. Aucun onglet Enrichissement. La fenêtre recherche par nom, SIREN ou SIRET, propose au maximum dix résultats puis les informations disponibles à sélectionner. « Remplir le formulaire » modifie seulement le brouillon local. Seul « Enregistrer » persiste société et adresse via le parcours Contacts habituel, ses validations, permissions et audit.

Les requêtes anonymes utilisent `GET https://recherche-entreprises.api.gouv.fr/search?q=…&per_page=10`, `credentials: omit` et un délai maximal de dix secondes. Aucun token Horizon n’est transmis au fournisseur. Les erreurs réseau, quota HTTP 429, réponse invalide et absence de résultat sont présentées sans perdre le formulaire. La saisie manuelle reste possible.

Mapping : nom complet → nom usuel ; raison sociale → raison sociale ; SIREN ; SIRET du siège pour une recherche par nom / SIREN, ou de l’établissement exact pour une recherche par SIRET. Un SIRET introuvable ne se rabat pas sur le siège. L’adresse française est construite depuis les champs structurés de l’établissement ; les adresses restreintes, étrangères ou insuffisamment structurées ne sont pas proposées. Les entreprises en diffusion restreinte sont exclues.

Les valeurs absentes ne remplacent pas les valeurs locales. Aucun calcul de TVA, import de dirigeants, logo ou coordonnées supposées. La sélection explicite peut remplacer les champs disponibles choisis ; téléphone, e-mail et TVA déjà saisis restent conservés lorsqu’ils ne sont pas fournis.

Les routes serveur de recherche / aperçu / application ont été retirées du code local. La route historique protégée `/api/horizon/company-lookup/status` conserve uniquement le contrôle de version du schéma Contacts utilisé par les sauvegardes ordinaires ; elle ne contacte aucun fournisseur. Les anciens champs et collections techniques ne sont pas supprimés pour préserver les migrations et données existantes ; ils ne sont pas utilisés par ce parcours.


TVA — mise à jour du 5 octobre 2026 : appel direct `search?q=…&per_page=10&minimal=true&include=siege,matching_etablissements,tva`. Le [contrat OpenAPI officiel](https://recherche-entreprises.api.gouv.fr/openapi.json) décrit tva comme une liste de numéros intracommunautaires français actifs, source DGFiP. Réponse réelle vérifiée pour SIREN 552081317 : FR03552081317. Les doublons sont retirés ; une seule valeur est proposée, plusieurs valeurs nécessitent un choix explicite. Pas de numéro construit à partir du SIREN, ni de contrôle VIES prétendu. Aucune propriété RCS dans ce contrat : le numéro RCS reste renseigné manuellement.

Préparation facturation électronique : les champs du destinataire sont stockés dans la fiche. La [DGFiP](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees) distingue la plateforme agréée et le routage ; l’adresse électronique est un identifiant de facturation, pas nécessairement un e-mail. SUPER PDP reste le provider sélectionné pour Horizon dans la spécification, mais aucune transmission / réception ou consultation d’annuaire n’est livrée dans ce lot. Un nom de plateforme saisi n’est pas une preuve d’agrément. Les contrats provider, formats structurés, données de pièce, statuts, webhooks et vérification d’annuaire restent au lot Facturation électronique.


LEI : saisie manuelle dans le formulaire, sans nouvel appel réseau. L’API Recherche d’entreprises utilisée ici ne fournit pas ce champ. Aucun calcul ni assimilation au RCS. Le format s’appuie sur la définition GLEIF (code alphanumérique de 20 caractères), sans validation de registre ou de statut : https://www.gleif.org/fr/organizational-identity/lei-vlei/the-legal-entity-identifier-lei .


### Recherche d’images — Wikimedia Commons

Provider initial public sans secret : MediaWiki Action API `https://commons.wikimedia.org/w/api.php`, query + generator=search, namespace fichier 6, 24 résultats, mots-clés explicites, origin=* (CORS), prop=imageinfo et iiprop=url|mime|size|thumbmime, iiurlwidth=500. Filtres optionnels filemime:image/png, image/jpeg ou image/webp. Les résultats sont triés par index de recherche ; les formats non JPEG/PNG/WebP sont écartés. Un SVG peut être sélectionné sous son rendu PNG fourni par Wikimedia. Hosts images autorisés : upload.wikimedia.org et thumb.wikimedia.org ; source liée commons.wikimedia.org. Téléchargement CORS avec credentials omit, timeout 15 s, préparation d’un File local ; sauvegarde ultérieure via le service/repository du module propriétaire (Contacts actuellement). Pas de scraping HTML Google ni d’API payante activée. Couverture limitée au catalogue Commons ; pas de garantie de résultat pour toute société. Le lien de source permet de consulter les conditions d’utilisation de chaque image.

Documentation primaire : https://www.mediawiki.org/wiki/API:Search ; https://www.mediawiki.org/wiki/API:Imageinfo ; https://www.mediawiki.org/wiki/API:Cross-site_requests . Une recherche web Brave nécessite une clé (https://api-dashboard.search.brave.com/documentation/guides/authentication) et donc une décision d’intégration distincte, avec secret serveur ; elle n’est pas activée par ce lot.


Complément Google Images gratuit — 6 octobre 2026 : ouverture de `https://www.google.com/search` avec tbm=isch et q encodé, suffixe filetype optionnel. Google reste hors du popup Horizon ; aucune API Google/Brave/SerpApi, compte, clé ou abonnement. Copie utilisateur puis collage de l’image dans Horizon, sans téléchargement manuel intermédiaire. Wikimedia reste la recherche intégrée et l’import local reste disponible. Le composant et le provider Wikimedia sont désormais partagés pour les images génériques autant que les logos.

CRM / analytique — 6 octobre 2026 : création locale du compte analytique avec l’opportunité via AnalyticService, dans la même transaction PocketBase. Aucune écriture, synchronisation ou appel Sage / SUPER PDP. Les futurs devis, commandes et projets reprendront cette référence stable via les services des modules concernés ; aucune intégration financière n’est simulée dans ce lot.

Premier lot Devis — 8 octobre 2026 : brouillons locaux et lignes HT libres, liés au compte analytique CRM. Aucun appel Sage / SUPER PDP / e-mail / PDF. La validation, la TVA effective et les taux de change snapshotés seront raccordés aux services communs avant toute émission de document officiel.

Gotenberg — préparation du 8 octobre 2026 : configuration Docker interne dans `deploy/gotenberg.compose.yaml`, installation NAS décrite dans le document 06. Appel prévu exclusivement par Document Service côté serveur à `http://gotenberg:3000/forms/chromium/convert/html`, avec HTML / styles / polices / images contrôlés. Le navigateur demande son aperçu à Horizon ; il ne contacte pas Gotenberg. Raccordement applicatif livré par D01 ; recette de conversion réelle sur NAS encore à réaliser.


Documents D01 : `HORIZON_GOTENBERG_URL=http://gotenberg:3000` sur PocketBase. POST multipart `/forms/chromium/convert/html` avec index.html, header.html, footer.html et options papier / marges ; CSS, images et polices embarquées. Les frontières sont UI → Documents Service → Documents Repository → routes authentifiées Horizon → projection Ventes autorisée → renderer → provider Gotenberg. Le transport multipart / binaire est testé sur PocketBase 0.40.4 avec un convertisseur local simulé, pas une preuve de pagination Gotenberg réelle. [Contrat officiel Gotenberg](https://gotenberg.dev/docs/convert-with-chromium/convert-html-to-pdf), [transport HTTP PocketBase](https://pocketbase.io/docs/js-sending-http-requests/).

Studio D02 : polices documentaires auto-hébergées dans le frontend et intégrées en data URI dans le HTML serveur, sans téléchargement réseau au rendu Gotenberg. Roboto, Open Sans, Lato, Source Sans 3 et Noto Serif issus des paquets Fontsource 5.3.0 ; licences et provenance conservées dans `pocketbase/pb_hooks/assets/` (`additional-fonts.json`). Voir [Fontsource — installation locale](https://fontsource.org/docs/getting-started/install). Les variantes normal / italique / semi-gras sont disponibles ; Lato utilise son gras 700 pour le contrôle Gras. Les assets accompagnent obligatoirement les hooks sur le NAS.

Aperçu HTML Documents — Paged.js 0.4.3 local, validé le 9 octobre 2026 : réutilise l’HTML contrôlé du renderer, dérive dimensions / marges / zones répétées de ce rendu, ajoute `@page A4` et fragmente le corps. Handler du module pour les en-têtes de tableau avant mesure d’overflow ; zones fixes, fond et numéros clonés à chaque page. Aucune dépendance au réseau ou à Gotenberg pour l’HTML. Le flux serveur HTML → Gotenberg → PDF reste identique ; aucune pagination frontend n’est utilisée pour figer une pièce historique. [Documentation Paged.js](https://pagedjs.org/en/documentation/).

Documents D15 — correction du 9 octobre 2026 : les fonds pleine page des templates Chromium d’en-tête / pied de page sont découpés à la hauteur de leur zone. Sans ce découpage, un fond opaque de pied de page recouvre le corps et masque presque entièrement le logo. Reproduit avec Chromium et contrôlé sur un PDF rasterisé, avec logo PNG et fond opaque. Le transport Gotenberg et ses marges sont conservés.

Documents D16 : le provider PDF reçoit un nom sécurisé depuis Documents, issu du contexte métier sauvegardé et de settings_document_files. Content-Disposition fournit filename ASCII de secours et filename* UTF-8 ; l’en-tête est exposé au navigateur via CORS. Le repository retourne le Blob et le nom, le téléchargement utilise ce nom. Pas de changement du transport de conversion ni de nouvelle dépendance.


Devis / Envoyé : statut réservé à un envoi effectivement réalisé par Messaging Service / MailProvider. Le présent lot n’expose aucune action simulant l’envoi. La confirmation client est indépendante du futur transport mail et crée la commande côté Sales, sans écriture comptable ni synchronisation Sage / PDP.


Documents D18 — formats personnalisés : dimensions du modèle en mm converties en pouces pour Gotenberg, en pixels CSS à 96 dpi pour HTML / Paged.js, avec la même orientation / les mêmes marges. Les anciens modèles sans pageSize restent A4. Code 128 généré côté Documents en SVG embarqué, checksum et zones de silence inclus ; aucun téléchargement ni générateur tiers. Impression navigateur des pages déjà paginées avec marges CSS nulles pour éviter de doubler celles du modèle, échelle 100 % à choisir dans le dialogue système. Le bouton PDF utilise toujours le provider Gotenberg existant et sa configuration serveur. Recette locale : dimensions physiques du PDF Chromium vérifiées sur une étiquette 95 × 28 mm ; transport Gotenberg testé avec un convertisseur local simulé, imprimante réelle et conversion NAS à vérifier sur l’installation.


Achats A01 — Documents reçoit un contexte public du service Purchasing, sans accès direct aux collections privées. Le type `purchase_order` et la source `purchasing.order_lines` sont disponibles dans le studio commun ; un modèle standard permet un aperçu immédiat du BC sans modèle personnalisé. Les champs fournisseur, pièces, dates, montants et analytique autorisé sont raccordés ; données commerciales de BC validé relues depuis leur snapshot, y compris l’adresse fournisseur. Les tokens de nommage existants s’appliquent au BC. HTML et PDF utilisent la même chaîne de rendu / Gotenberg existante. Aucun envoi au fournisseur n’est simulé par la validation ; l’envoi futur passe par Messaging et conservera le PDF réellement envoyé. Pas de synchronisation Sage ni d’écriture comptable automatique ajoutée dans ce lot.


Documents BC fournisseur : les champs liés purchase.buyer_name, purchase.buyer_email, purchase.delivery_warehouse et purchase.delivery_warehouse_code proviennent de la projection Purchasing. Après validation, ces valeurs et la TVA fournisseur utilisent le snapshot du BC. Aucun appel direct à Contacts ou Stock depuis Documents / React.

Stock S02 — Documents reçoit un contexte Inventory autorisé pour `stock_operation_id`. Studio / champs liés stock.* / tableau inventory.operation_lines / aperçu HTML paginé / génération Gotenberg réutilisent le pipeline existant. Le modèle standard distingue Réception, Livraison, Préparation chantier, Retour, Transfert et Inventaire. Les quantités affichées sont issues de la pièce, sans prix sur le bon standard ni notes internes. Le naming utilise actuellement le pattern delivery_note et stock.number. Aucun envoi mail simulé ; Messaging reste la future frontière d’envoi.

Stock V01 — valorisation opérationnelle standard / CUMP / FIFO gérée par Inventory, avec snapshots et régularisations datées. Sage demeure la source comptable officielle en Phase 1 ; ce lot ne poste ni ne synchronise d’écriture. Un futur flux comptable devra passer par Accounting Service / AccountingProvider, conserver les identifiants de valorisation sources, appliquer les contextes comptables et régulariser les écarts plutôt que modifier les historiques. Devise de valorisation EUR ; les réceptions de BC en devise sont bloquées tant que le contrat de change effectif / frais d’approche n’est pas raccordé. Les coûts réels connus des BC sont conservés séparément du standard ; la correction par facture et l’incorporation des frais restent un lot ultérieur.

Courbes du dashboard : projection locale des données CRM / Ventes / Achats autorisées et de leurs snapshots, sans provider financier supplémentaire, conversion monétaire implicite, synchronisation Sage ou écriture comptable. Facturation et paiements restent à raccorder par leurs modules propriétaires.

Analytique A01 : comptes affaire / commandes et reporting local via Accounting, sans appel Sage / PDP ni écriture comptable. Le compte racine reste stable et les sous-comptes sont des relations internes ; toute future exportation analytique suivra AccountingProvider et un mapping explicite. Valorisation lue depuis les écritures Inventory historiques, pas depuis un coût catalogue recalculé.

Parc interne / immobilisations : Accounting Service prépare le registre depuis la réalisation Inventory. La qualification ne déclenche pas d’appel Sage ; accounting_reference permet le rapprochement avec la source comptable Phase 1. La future synchronisation passe par AccountingProvider, avec idempotence et historique, jamais par Inventory ou Purchasing directement.

Standby demandé — 13 octobre 2026 : le premier lot Billing est interne uniquement. Sage et SUPER PDP restent des raccordements prévus, sans adapter actif, credentials nouveaux, export, émission, webhook ou polling dans ce lot. Les pièces gardent données structurées, snapshots et IDs stables ; statut de paiement indépendant d’un état futur de transmission.

## Congés : référence des jours fériés — 16 octobre 2026

France métropolitaine : calcul civil déterministe côté serveur, sans appel réseau à la saisie/soumission. Référence de vérification : [jeu de données/service DINUM des jours fériés](https://www.data.gouv.fr/dataservices/jours-feries), fixtures officielles 2026–2028 sous Licence Ouverte 2.0 dans tests/fixtures. Huit dates fixes et lundi de Pâques/Ascension/lundi de Pentecôte ; politiques locales/territoriales à saisir en dates supplémentaires, jours travaillés en exceptions RH. Aucun nouveau fournisseur externe ni ordonnanceur.


## Réception ciblée des réponses aux envois Horizon

Opt-in par boîte personnelle ; scopes OAuth délégués offline_access/User.Read/Mail.Send et **Mail.Read** uniquement lorsqu’activé. Mail.Read est stocké parmi les scopes réellement accordés et vérifié au callback/réception ; refresh des connexions antérieures conserve les scopes send-only. Réception derrière MailProvider.reader, aucun appel Graph métier/React. Sources Microsoft : [List messages](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0), [Get message](https://learn.microsoft.com/en-us/graph/api/message-get?view=graph-rest-1.0), [List attachments](https://learn.microsoft.com/en-us/graph/api/message-list-attachments?view=graph-rest-1.0).

Le transport d’envoi reste /me/sendMail, sans ajout de création de brouillon distant ni risque de renvoi lors de cette évolution. Le worker crée le suivi de l’envoi commercial après acceptation ; migration reprend les anciens envois métier sent. La relève retrouve l’original dans sentitems par date et X-Horizon-Message, stocke InternetMessageId/conversationId, puis liste /me/messages avec filtre conversationId ; In-Reply-To/References établissent le rattachement exact avant lecture du corps/pièces. Le plus proche identifiant connu dans les références prime pour séparer les sources d’une même conversation. Aucun rattachement par objet ni import de conversation aveugle. Un changement de compte Microsoft invalide les identifiants de suivi avant nouvelle découverte. Les copies Outlook envoyées sont nécessaires à la découverte ; elles ne sont pas modifiées.

Cron chaque minute, au plus 20 conversations/pages dues par passage ; après tour complet, prochaine relève dans deux minutes. Pagination et déduplication persistantes, pas de webhook public ou de dépendance supplémentaire. La consultation des conversations complètes est rejouable ; délai variable selon backlog, erreurs et pages, aucun SLA instantané annoncé. Le corps est demandé au format texte et affiché échappé ; pas de HTML externe, tracking ou mutation Outlook, pas de synchronisation d’une boîte de réception générale. Les réponses aux messages libres sans source métier ne sont pas importées dans ce lot.

Un In-Reply-To explicite inconnu reste sans rattachement automatique, même si References mentionne un ancien envoi : éviter d’affecter une réponse à une ancienne pièce. References sert de secours lorsque In-Reply-To est absent. Une réponse à un message intermédiaire envoyé manuellement depuis Outlook (parent inconnu d’Horizon) peut donc rester uniquement dans Outlook ; aucune affectation incertaine par objet/conversation.


Diagnostic de relève : erreurs Microsoft HTTP et réseau différenciées, curseurs invalides signalés comme pagination, erreurs de contenu/fichiers identifiées. Les erreurs internes indiquent l’étape sans exposer la réponse Graph. Les requêtes échouées restent soumises aux échéances existantes, y compris après reconnexion ; les reprises et le transport d’envoi sont inchangés. Voir exploitation en 06.


Pagination de réception corrigée le 16 octobre : ne pas figer les liens à /me/mailFolders/sentitems. Graph peut identifier une boîte ou un dossier par son ID ; accepter les formes de ressources correspondantes en vérifiant qu’il s’agit de la boîte connectée. Garder intégralement l’URL/query de la page suivante, conformément à [Paging Microsoft Graph](https://learn.microsoft.com/en-us/graph/paging), après contrôle strict de destination documenté en 06. L’URL réellement rejetée sur le NAS n’a pas été communiquée ; les formes canoniques sont reproduites et validées sur le faux provider, sans prétendre à une recette réelle.

GED et e-mails métier — 17 octobre 2026 : Documents consulte le contrat public Messaging utilisé par Activity pour afficher les pièces envoyées/reçues déjà enregistrées, après autorisation de la fiche. Le PDF d’un devis envoyé est celui du message historique ; aucune conversion ni connexion Microsoft supplémentaire lors de la consultation GED, aucun envoi. Les messages libres privés et les champs Cc/Bcc ne sont pas exposés. Sage et SUPER PDP inchangés/en attente.

Notifications personnelles — 17 octobre 2026 : les préférences dans Horizon incluent les notifications des réponses e-mail corrélées de Messaging ; elles n’interrompent pas la relève ni la conservation du message dans le fil. La préférence email de canal reste réservée false ; aucun e-mail interne automatique ni changement OAuth/Graph/SMTP ajouté par ce lot. NotificationService filtre uniquement la nouvelle alerte in-app après l’événement métier, dans la transaction existante.

Correctif du 17 octobre 2026 — réponses e-mail : la création de l’alerte seule ne suffit pas à valider le parcours. Vérifier aussi sa lecture avec le jeton réel de l’expéditeur Horizon. La migration 1791840025 raccorde les sources Ventes/Achats à la policy privée des notifications ; corrige les alertes déjà présentes, sans modifier la relève, le transport Microsoft ni recréer des réponses.

Notifications de réponses / performance (17 octobre 2026) : la cloche et ses actions utilisent les routes Core ciblées, sans lire le catalogue polymorphe par sa règle native globale. Source autorisée via Activity Read, pas de changement Microsoft. La migration 0025 reste conservée pour les installations déjà migrées ; ce correctif de chargement ajoute uniquement des routes/hooks et leur usage frontend.
