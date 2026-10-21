# Horizon — Functional Specifications

## Objectif

Ce document décrit **ce que Horizon doit faire**.

La structure technique se trouve ailleurs.

Chaque module sera enrichi progressivement au fur et à mesure des validations.

---

# 1. Dashboard

Accueil : accès rapides retirés au profit des cartes de suivi. Carrousel Suivi commercial avec Opportunités / Devis / Commandes (services existants et droits respectés) et Factures À venir. Rotation toutes les 10 secondes, pause / reprise et navigation manuelle ; réglage personnel automatique / manuel dans l’engrenage de la carte, mémorisé par utilisateur et navigateur.

Objectif :

- synthèse personnelle ;
- indicateurs ;
- alertes ;
- raccourcis ;
- activité récente.

Exemples :

- AO à remettre ;
- opportunités importantes ;
- devis à relancer ;
- commandes en retard ;
- achats en retard ;
- approbations en attente ;
- tâches projet ;
- dépenses à valider ;
- factures échues ;
- messages non lus ;
- charge BE / Production ;
- disponibilité des ressources ;
- marge prévisionnelle / réelle ;
- trésorerie / encaissements selon droits.

Les dashboards sont adaptés au profil :

```text
Direction
Commerce
BE
Production
Achats
Comptabilité
Utilisateur
```

Les KPI Direction doivent notamment permettre une lecture par période, client et code analytique.

---

# 2. Messagerie

## 2.1 E-mail

Fonctions :

- composer un e-mail ;
- From contrôlé ;
- To / Cc / Bcc ;
- modèles ;
- signature ;
- pièces jointes ;
- PDF Horizon ;
- historique ;
- brouillons ;
- statut envoyé / échec ;
- rattachement à un objet métier.

Expéditeur :

```text
prenom.nom@cvs.fr
```

ou alias autorisé.


Décision du 16 octobre 2026 — cible d’envoi : **Microsoft Graph avec OAuth délégué**, choix final validé après comparaison avec SMTP/Odoo. L’administrateur configure les expéditeurs et leurs utilisateurs Horizon autorisés ; une connexion Microsoft initiale autorise chaque compte/boîte selon ses droits réels. Les jetons sont conservés chiffrés côté serveur, renouvelés et révocables ; une reconnexion peut être nécessaire selon les politiques Microsoft. Aucun utilisateur ne fournit son mot de passe Microsoft à Horizon. Le From est contrôlé côté serveur et respecte aussi les droits Microsoft ; l’affectation d’un utilisateur à l’application Entra n’est pas un droit Send As.

L’envoi est déclenché dès la confirmation de mise en file enregistrée côté serveur, sans attendre la minute suivante. Le traitement périodique reste un secours durable ; les reprises différées et les résultats incertains conservent leurs règles.

Premier lot local : modèles contextuels, signatures, compositeur partagé devis/BC/messages libres, PJ/PDF figés, brouillons, file d’envoi et historique. Le prototype local Graph applicatif a été retiré à la demande utilisateur, sans commit ; ses éléments indépendants ont été revus et repris pour le nouveau lot délégué. Réception IMAP et chat restent distincts et futurs. L’URI de retour Web est l’origine frontend Horizon suivie de /messaging/oauth/callback ; code échangé uniquement côté serveur, état lié à la session/onglet initiateurs. Première version : boîtes personnelles dont l’adresse correspond à /me, boîtes partagées/alias hors lot. Configuration et limites détaillées en 08 ; recette Microsoft et NAS à effectuer.

---

## 2.2 Chat interne

Fonctions V1 :

- messages directs ;
- groupes ;
- conversations contextuelles ;
- texte ;
- pièces jointes ;
- réponses ;
- non-lus ;
- statut lu ;
- realtime ;
- recherche simple ;
- notifications Horizon.

Une conversation contextuelle peut être liée à :

```text
AO
Projet
Opportunité
Commande
```

---

# 3. Calendrier

Fonctions :

- vue jour / semaine / mois ;
- événements manuels ;
- événements provenant d’autres modules ;
- filtres ;
- échéances ;
- visites ;
- rendez-vous ;
- soutenances AO ;
- congés ;
- jalons projet.

Repères calendaires : samedi/dimanche sur fond neutre atténué, jours fériés de France métropolitaine sur fond neutre grisé distinct des week-ends, avec leur nom en texte standard. Même rendu semaine/mois/trimestre/année via BusinessCalendar, légende explicite, aujourd’hui conserve son repère et la création d’événements reste possible sur ces dates. Les jours fériés sont des repères publics, distincts des événements privés et des règles RH de décompte : un férié travaillé reste affiché, les exclusions propres à l’entreprise ne deviennent pas des fériés nationaux. Calcul civil commun aux Congés, sans API externe à l’exécution.

Le calendrier général et la vue calendrier du volet AO réutilisent les mêmes composants et le même service d’agrégation. La vue AO applique un contexte CRM / appels d’offres ; les dates restent possédées par le CRM. Les droits sont contrôlés sur les objets sources avant de retourner les événements.

---

# 4. Contacts

Horizon utilise un référentiel unique des sociétés et personnes.

Une société peut cumuler plusieurs rôles :

```text
client
fournisseur
```

Il ne faut pas créer deux sociétés différentes uniquement parce qu’une société est à la fois cliente et fournisseur.

## Sociétés

Fonctions :

- raison sociale ;
- nom usuel ;
- rôles ;
- adresses nationales et internationales ;
- téléphones ;
- e-mails ;
- TVA / identifiants fiscaux ;
- site web ;
- logo ;
- galerie / images utiles ;
- notes ;
- documents liés ;
- historique des objets liés.

## Contacts

Un contact appartient à une société lorsque applicable.

Fonctions :

- prénom ;
- nom ;
- fonction ;
- e-mail ;
- téléphone ;
- mobile ;
- photo / avatar ;
- société ;
- notes ;
- activité.

Dans l’interface, l’avatar du contact peut afficher en petit le logo de sa société afin d’identifier immédiatement son rattachement.

### Fusion des fiches Contacts — parcours prévu le 18 octobre 2026

Évolution demandée, à implémenter : fusion explicite de deux sociétés ou de deux personnes, jamais entre types différents ni automatiquement sur leur nom. Cas motivant : une société M6 dont la raison sociale est METROPOLE TELEVISION et une autre fiche MÉTROPOLE TÉLÉVISION ; la similitude ne suffit pas à prouver une même identité juridique.

- Action « Fusionner avec… » dans le menu de la fiche existante, réutilisant les composants de sélection et de dialogue Horizon. Recherche de la seconde fiche, puis choix explicite de celle à conserver ; nom, raison sociale, identifiants légaux et références externes visibles pour distinguer les homonymes.
- Comparaison des champs : conserver par défaut les valeurs renseignées de la fiche cible, proposer de compléter les champs vides, faire choisir les valeurs différentes et le logo / l’avatar. Une personne conserve un seul rattachement société, à choisir explicitement s’il diffère. Des identifiants juridiques incompatibles bloquent la fusion plutôt que permettre de réunir deux entités distinctes.
- Aperçu avant confirmation : nombres de personnes, adresses, relations Client / Fournisseur, références externes et objets métier concernés, ainsi que les conflits restants. Conserver les adresses distinctes et choisir la principale par usage ; réunir les rôles sans doublon. Les conflits de comptes tiers sont traités par Accounting et bloquent l’application tant qu’ils ne sont pas résolus.
- Les documents finalisés, leurs montants, snapshots et fichiers restent immuables. Leurs anciennes références doivent rester consultables ; les lectures de l’historique depuis la fiche conservée doivent inclure les deux identités, sous les permissions de chaque module. Les rattachements modifiables sont traités par les services propriétaires ; aucune réécriture générique de toutes les relations PocketBase par Contacts.
- Conserver la fiche source archivée avec une trace de fusion et un lien vers la fiche conservée, sans suppression de son historique. Empêcher sa réactivation et de nouvelles affectations à cette identité fusionnée ; ne pas créer de cycle ou de chaîne de destinations ambiguë. Les anciens liens doivent mener à une explication et à la fiche conservée.
- Préserver toutes les références Odoo dans `core_external_references` en les faisant résoudre vers la fiche conservée, via le propriétaire Imports. Un prochain import mettant à jour l’une des anciennes références ne doit recréer aucun doublon ; les anciens rapports d’import restent historiques. Les identifiants internes Horizon ne sont pas remplacés par ceux d’Odoo.
- Aperçu sans écriture, confirmation explicite, habilitation dédiée à prévoir côté serveur, recontrôle des fiches et dépendances au moment d’appliquer, transaction atomique, audit et événement de fil. Une nouvelle modification invalide l’aperçu ; rejouer la même fusion ne doit pas doubler ses effets. Aucun aperçu ne révèle des données de modules auxquels l’utilisateur n’a pas accès ; une dépendance non traitable bloque avec un motif compréhensible.

Avant livraison : contrat de données et migrations additives, adaptateurs des modules propriétaires concernés, tests des références Odoo / documents finalisés / droits / concurrence / rejeu, puis parcours navigateur Horizon clair, sombre et mobile. Ce cadrage ne livre ni bouton actif, ni migration, ni fusion des données utilisateur.

### Fusion Contacts — premier lot local du 18 octobre 2026

État historique du premier lot ; pour les Sociétés, les limitations ci-dessous sont remplacées par l’extension du 19 octobre décrite après l’assistant transversal. Les restrictions Personnes / Produits sont conservées.

L’action « Fusionner avec… » est disponible dans la roue d’une fiche société/personne active, enregistrée sans modifications en attente, pour les utilisateurs habilités `contacts.merge` avec read/write. Recherche paginée de la deuxième fiche, conservation initiale de la fiche ouverte, bouton Inverser, aperçu sans écriture et radios par champ, logo/photo compris. Les champs vides sont complétés par défaut, les valeurs existantes de la cible sont prioritaires ; le choix reste explicite avant confirmation. Rôles réunis, personnes et adresses déplacées en conservant leurs identifiants ; adresses principales de la cible prioritaires par usage. Les anciennes valeurs et fichiers restent conservés sur la source archivée, consultable depuis la cible ; la source comporte un lien vers la fiche conservée. Le fil source n’est ni déplacé ni présenté comme fusionné dans les compteurs de la cible.

Ce premier lot traite le doublon de référentiel vers une fiche métier déjà utilisée. Une dépendance métier sur la source ou sur une personne/adresse déplacée bloque la fusion : conserver plutôt cette fiche comme destination. Cela comprend les comptes tiers, relations entrantes intermodules et liens polymorphiques de documents/tâches/mails ; l’audit et les conversations historiques restent sur la source. Les identifiants juridiques incompatibles et les chaînes de fusions sont refusés. Fusionner deux fiches toutes deux porteuses d’historiques métier reste à réaliser avec leurs services propriétaires ; aucun document finalisé n’est réécrit dans ce lot. Le contrat général ci-dessus décrit cette cible ultérieure.

Les références d’import sont redirigées vers la cible par le propriétaire Imports, les rapports historiques restent inchangés. Les anciennes identités fusionnées sont exclues du rapprochement actif des nouveaux imports. Empreinte canonique des fiches/dépendances, recontrôle transactionnel, confirmation, audit et événements de fil ; rejeu sans nouvel effet et refus des nouvelles affectations à la source. Nécessite les hooks cohérents, la migration `1791840028_contact_merge.js` puis rechargement du compte ; installation NAS non confirmée.

### Assistant transversal de fusion — livraison locale du 18 octobre 2026

Paramètres → Qualité des données → Fusion des doublons : Sociétés / Personnes / Produits, sur les fiches déjà enregistrées, importées ou créées manuellement. Aucun réimport ni préparation d’import n’est nécessaire. Le raccourci « Fusionner avec… » des fiches utilise le même comparateur partagé ; Produits possède également ce raccourci sur sa fiche active sans modifications en attente.

Au premier accès propre, aucune analyse ne démarre. Choisir des fiches lance la sélection manuelle ; Rechercher les doublons lance les suggestions. Recherche dans WorkspaceSearch, parcours et tri dans SearchFilters, critères/pagination dans l’URL. Réponses de 25 lignes, compteur Page X / Y et flèches partagés ; sélection de deux fiches possible sur des pages/recherches différentes, retrait individuel par bouton. Cette sélection de travail est locale, les critères restent conservés au rechargement. La première fiche est conservée initialement, sens inversable dans le comparateur.

Suggestions avec motifs : même SIREN (éventuellement déduit du SIRET), nom usuel ou raison sociale communs après normalisation de casse/accents, e-mail identique sans effacer sa ponctuation, nom complet dans la même société ; pour les produits, marque + référence fabricant ou désignation + marque/type/unité. Ces indices ne prouvent pas l’identité et ne déclenchent jamais une fusion. Pour un groupe important, proposer un nombre linéaire de paires autour de la plus ancienne fiche ; traiter les rapprochements successivement, après une nouvelle comparaison. Aucun traitement global automatique. Les incompatibilités juridiques, structurelles ou les dépendances non prises en charge restent bloquantes.

Les seules colonnes d’identité sont lues côté serveur pour proposer les rapprochements, sans fichiers, valorisation, pricing ou historique ; le navigateur reçoit uniquement sa page. Limite explicite de 50 000 fiches actives par domaine, sans troncature silencieuse. Les détails et dépendances sont lus seulement à l’ouverture de la comparaison. Frise Sélection / Comparaison / Confirmation, choix des valeurs par champ, images protégées ; différences affichées initialement, option pour voir aussi les valeurs identiques. Récapitulatif des éléments réunis, destination visible et case de confirmation obligatoire avant Fusionner. Un changement concurrent impose de recharger l’aperçu ; rejeu sans double effet.

L’UI est partagée (`shared/merge/MergeDialog`), avec callbacks des services Contacts et Inventory. La détection des dépendances, les empreintes et les invariants d’identité sont partagés en lecture/validation ; les écritures restent dans les adaptateurs propriétaires. Une mutation nécessite les droits read/write/merge de son domaine, compte/rôle actifs et profil non viewer, avec recontrôle dans la transaction. Les suggestions ne révèlent aucun contenu des pièces de modules non autorisés.

Produits : unité de base et de vente, kind, marque, politiques de stock/approvisionnement, tracking, composition et devise compatibles ; références fabricant/variantes renseignées des deux côtés compatibles. SKU/code-barres et paramètres structurels affichés en lecture seule ; anciennes références conservées sur l’identité archivée et recherchables dans le catalogue comme alias vers la fiche retenue. Choix de désignation, description, famille, photo et caractéristiques descriptives revalidés par Catalog. Offres fournisseurs transférées en conservant leurs IDs et historique tarifaire ; offre préférée active de la cible prioritaire. Références externes redirigées par Imports, sans changer les IDs Horizon ni modifier un rapport d’import passé ; cela prépare les futurs imports Produits, qui ne sont pas livrés dans le pilote Imports actuel.

Limite explicite : une source portant des mouvements, réservations, lots/séries, valorisation, composition, devis/commandes ou autres pièces métier est bloquée ; même contrôle sur une offre déplacée. La cible peut déjà porter cet historique. Aucun stock n’est additionné et aucun document finalisé, snapshot ou mouvement n’est réécrit. La fusion de deux historiques métier reste à traiter avec leurs services propriétaires. Anciennes fiches archivées, verrouillées et consultables depuis la cible, avec lien inverse ; pas de chaîne de fusions ni d’annulation automatique. Le fil de chaque ancienne fiche reste sur son identité d’origine.

Migration additive `1791840029_product_merge.js`, hooks et frontend cohérents requis ; droits inventory.merge / contacts.merge délégables via Utilisateurs et accès. Anciennes données et fichiers conservés ; aucune installation NAS ni fusion des données utilisateur effectuée par l’agent.


### Fusion Sociétés avec pièces métier — extension locale du 19 octobre 2026

Deux sociétés déjà utilisées peuvent être fusionnées après comparaison et confirmation. Les personnes gardent leur ID et rejoignent la destination ; les adresses sont copiées pour conserver les originaux servant aux anciens rendus. Rôles et références Odoo sont réunis. La source est archivée et verrouillée, jamais supprimée. Fusions successives : anciens alias aplatis vers la nouvelle destination ; anciennes URL redirigées, consultation volontaire des anciennes valeurs par « Fiches fusionnées · historique conservé ».

Les services Sales / Purchasing / Billing / Inventory / Accounting réaffectent les devis jamais envoyés encore brouillons, BC brouillons sans snapshot, fournisseurs suggérés des DA encore brouillons, factures/avoirs brouillons, offres fournisseur actives et comptes tiers compatibles. Ils exigent les droits de modification concernés. Les pièces finalisées, commandes clients, mouvements/réservations, factures validées, règlements, lignes, snapshots, PDF et corrélations de mails gardent leurs identifiants, rattachements historiques et montants. Aucun stock ni montant n’est additionné. Leurs listes filtrées par société, les raccourcis de sa fiche et la GED retrouvent toute la famille sous les permissions de chaque propriétaire. Le fil société réunit les événements/tâches lisibles des anciens alias ; les événements originaux ne sont pas déplacés.

Avoirs, acomptes, règlements et regroupements de sources reconnaissent désormais le même tiers canonique. Les nouveaux devis/commandes/factures se rattachent à la destination ; les pièces corrigées conservent l’identité légale de leur snapshot. Les anciens comptes analytiques restent stables, leur libellé client courant résout la destination. CRM et dépenses existantes conservent leurs références jusqu’à une édition autorisée ; les nouvelles références sont normalisées côté serveur.

Blocages : identité légale incompatible, codes comptables tiers différents, références de factures fournisseur en doublon, dépendance future non prise en charge ou droits insuffisants pour déplacer les brouillons. Empreinte des deux familles et dépendances, recontrôle et écritures dans une transaction, audit et rejeu. Limites explicites : 1 000 alias, 10 000 dépendances par relation et 1 000 candidats par catégorie de raccourci ; aucune troncature silencieuse. Pas d’annulation automatique. Extension limitée aux Sociétés ; Personnes et Produits restent protégés par leur contrat précédent. Aucun nouveau champ/migration pour cette extension ; hooks et frontend cohérents requis, NAS non installé par l’agent.

### Évolution Contacts — retours du 5 octobre 2026

Périmètre demandé le 5 octobre. Référentiels et fiches implémentés localement ; installation / recette NAS requises. Compteurs métier en attente des modules propriétaires. La livraison V1 ci-dessous décrit le socle antérieur.

- Fiche société structurée autour d’un en-tête visuel : logo unique avec aperçu, nom usuel, raison sociale et rôles. Sélection d’une nouvelle image avec aperçu avant enregistrement ; remplacement et retrait explicites. La fiche présente uniquement le logo ; les anciennes images stockées restent conservées.
- Un seul champ « Devise », porté par `default_currency`. « Devise préférée » est retiré après migration des données existantes. La langue, la devise et le pays utilisent des combobox recherchables, réutilisables et alimentées par les référentiels communs.
- SIREN et SIRET explicites, distincts de la TVA et de l’identifiant fiscal international. Adresse principale du siège lisible sur la fiche : adresse, complément, code postal, ville, pays ; les adresses de facturation / livraison restent disponibles. Le code postal reste du texte pour conserver les zéros et formats internationaux.
- Zone « Contacts associés » sur la société : avatar, nom, fonction, coordonnées, lien vers la personne et création pré-rattachée. Pagination et état vide explicite ; accès aux personnes archivées via filtre.
- Fiche personne plus visuelle : avatar en haut, badge / lien société, fonction et coordonnées regroupées, notes séparées ; conserver la densité ERP et la lecture seule selon permissions.
- Bandeau supérieur de boutons avec nombre de devis, factures clients, bons de livraison et opportunités. Chaque bouton ouvre le module propriétaire avec un filtre société effectivement appliqué, conservé dans l’URL. Le total porte sur tous les résultats accessibles, pas seulement sur la page affichée. Zéro réel, chargement, erreur et module indisponible sont des états distincts. Aucun faux compteur pour un module à venir.
- Sur la fiche personne, ne pas présenter les totaux société comme des totaux personnels. Les objets filtrables par personne utilisent son identifiant ; les raccourcis société sont explicitement libellés comme tels.
- Action « Rechercher sur le web » dans le bloc Identité, via l’API publique de l’État par nom, SIREN ou SIRET : choisir une entreprise / un établissement, comparer les champs proposés, puis appliquer explicitement. Ne pas remplacer automatiquement une valeur existante, créer des personnes à partir des dirigeants ou fusionner sur le seul nom. Détails dans `08-INTEGRATIONS.md`.

Recette attendue : création manuelle sans recherche externe ; choix des référentiels ; logo aperçu / remplacement / retrait ; adresse internationale ; personne créée depuis une société ; liste associée paginée ; compteurs et listes destination cohérents selon permissions ; erreurs de recherche sans perte du formulaire.

### Livraison locale de l’évolution Contacts

Paramètres propose une vue d’ensemble par domaine et une rubrique Référentiels (Pays / Langues / Devises), ajout et modification réservés à `settings.references`, lecture pour utilisateurs actifs. Initialisation : 18 pays, 8 langues et 11 devises, extensibles dans Paramètres ; les codes historiques supplémentaires sont préservés par la migration avec leur code comme libellé à compléter. Les combobox recherchent libellés et codes sans dépendre des accents.

Les fiches ont une zone d’image en haut et un aperçu avant enregistrement, SIREN / SIRET, une devise unique, un pays sélectionnable dans les adresses, une adresse principale par type et les contacts associés paginés avec création pré-rattachée. L’adresse du siège est saisissable dès la création, dans une carte visible à côté des coordonnées. Le bouton Enregistrer sauvegarde la société puis son adresse renseignée. La galerie est retirée de cette fiche ; les fichiers historiques restent conservés.

La recherche publique s’utilise dès la création et sur une société existante : appel direct depuis le navigateur, sélection des informations disponibles puis report local. Seul Enregistrer écrit en base. Aucun onglet Enrichissement, clé serveur ou configuration NAS. Voir `08-INTEGRATIONS.md` pour le mapping et les limites.

Historique : le bandeau Devis / Factures / Bons de livraison / Opportunités était désactivé et marqué « À venir ». Il est remplacé par la barre de raccourcis contextuels décrite en fin de document ; les modules métier et leurs compteurs restent à livrer.

Une vérification de version serveur bloque l’édition des fiches si les nouveaux hooks / migrations sont absents ; aucune sauvegarde silencieuse de champs inconnus vers le backend V1.

En-tête compact : logo / avatar de 48 px, identité et relation commerciale au-dessus des champs, puis boutons Devis / Factures / Bons de livraison / Opportunités. Sur une personne rattachée, les relations modifiables et les raccourcis concernent explicitement sa société active ; aucun rôle personnel ou total personnel n’est créé. Les relations sont enregistrées séparément sur une société existante.

En cas de refus de l’adresse après sauvegarde de la société, un message explicite conserve la saisie et l’identifiant créé : Réessayer met à jour la même société sans duplication. Une adresse existante inchangée n’est pas réécrite. Les rôles et adresses complémentaires restent enregistrés séparément.

### Première livraison Contacts V1

Listes distinctes Sociétés / Personnes avec recherche, tri serveur, pages de 25 et filtre Actifs / Archivés. La présentation actuelle propose Cartes (par défaut) et Liste via un sélecteur accessible ; le choix figure dans l’URL et reste conservé au rechargement et entre les onglets Sociétés / Personnes. Les deux vues utilisent les mêmes résultats serveur, filtres et pagination. Fiches de création / modification avec coordonnées, notes texte brut, langues / devises / identifiants fiscaux société, logo / galerie et avatar protégés. Rattachement facultatif d'une personne, recherche de société dans le sélecteur ; société visible dans la liste et badge logo sur l'avatar.

Client et Fournisseur sont sélectionnables dès la création de la société et enregistrés avec l’action Enregistrer. Après création, chaque changement de rôle et chaque adresse supplémentaire s'enregistre explicitement. Une société peut cumuler Client et Fournisseur ; la désactivation / réactivation réutilise la relation existante. Les adresses sont multiples et modifiables ; aucune suppression applicative d'une fiche ou d'une adresse. Archivage / réactivation de société ou personne avec confirmation ; les liens historiques restent conservés.

`contacts.read` ouvre la consultation ; `contacts.write` autorise les écritures en plus de la lecture. Fiches archivées en lecture seule dans l'interface jusqu'à réactivation. Les nouvelles relations à une société archivée sont refusées côté serveur. Modifications auditées côté serveur. Les documents liés, l'historique métier intermodules et l'activité utilisateur seront raccordés avec Documents / Activity Feed / CRM ; ils ne sont pas simulés dans cette première livraison.

---

# 5. CRM

Le CRM couvre l’ensemble des opportunités commerciales.

Une opportunité peut notamment être :

```text
direct
tender
```

`direct` correspond à une opportunité commerciale classique issue par exemple d’un contact client direct.

`tender` correspond à une opportunité gérée sous forme d’appel d’offres.

## 5.1 Opportunités

Chaque opportunité reçoit un numéro / code CRM unique qui devient également son compte analytique de référence.

Exemple :

```text
#11450
```

Fonctions communes :

- numéro / code CRM ;
- compte analytique ;
- société ;
- contact ;
- responsable ;
- type d’opportunité ;
- montant estimé ;
- budget / coût estimé ;
- marge estimée ;
- probabilité ;
- date prévue ;
- étape commerciale ;
- statut ;
- activités ;
- notes ;
- documents ;
- e-mails ;
- historique.

Une opportunité doit rester l’objet commercial principal, quel que soit son type.

## 5.2 Activités

Fonctions :

- appel ;
- e-mail ;
- rendez-vous ;
- tâche ;
- note ;
- date ;
- responsable ;
- statut ;
- rattachement à l’opportunité.

## 5.3 Appels d’offres

Une opportunité de type :

```text
tender
```

active les fonctions AO spécialisées.

Référence fonctionnelle d’inspiration :

```text
cre4tixdev/cvs-aoboard
```

Horizon ne doit pas recopier son architecture.

### Vues

```text
Kanban
Liste
Planning
```

### Kanban AO

- statuts configurables ;
- couleur ;
- ordre ;
- drag & drop ;
- ordre des cartes.

Base fonctionnelle d’inspiration :

```text
À faire
En cours
Saisie
Fait
Perdu
```

Les statuts restent configurables.

### Informations spécifiques AO

En complément des informations communes de l’opportunité :

- référence AO ;
- date de publication ;
- date limite de remise ;
- visite obligatoire ;
- plusieurs dates de visite ;
- une ou plusieurs soutenances ;
- tags ;
- documents ;
- archivage ;
- résultat gagné / perdu à terme.

Avant décision de répondre, le dossier AO porte le client, le responsable, la description et la valeur estimée. Après promotion, ces valeurs proviennent de l’opportunité CRM liée.

### Planning AO

Modes :

```text
semaine
mois
trimestre
année
```

Marqueurs :

```text
publication
visite
remise
soutenance
résultat attendu
```

### Calendrier AO et calendrier Horizon — cadrage validé le 7 octobre 2026

Le CRM possède deux types d’opportunités, `direct` et `tender`. Son volet AO reprend les fonctions utiles d’AOBoard et réutilise le socle commun (société, responsable, documents, tâches, fil d’activité et étapes commerciales). Le volet est accessible par un lien depuis le CRM (`/crm?area=ao`), sans nouvel onglet de navigation principal.

Les visites et soutenances peuvent être multiples. Chaque rendez-vous doit pouvoir préciser date, heure, durée / fin, lieu ou lien de visioconférence, participants et état (prévu, réalisé, annulé). La remise distingue l’échéance avec son fuseau horaire du dépôt effectif ; ces deux dates ne s’écrasent pas. Les modalités détaillées et champs complémentaires seront contractualisés dans le Data Model avant leurs migrations.

Le calendrier AO est une vue spécialisée du calendrier partagé Horizon, filtrée sur les AO et leurs événements. Il réutilise navigation temporelle, rendu, filtres et accès aux événements ; les modes semaine / mois / trimestre / année sont partagés. Publication, visites, échéance de remise, soutenances et résultat attendu sont aussi visibles dans le calendrier général selon les filtres et les permissions. Les tâches de préparation réutilisent les tâches Horizon.

Une date métier reste enregistrée dans son objet CRM source, sans copie systématique dans `calendar_events`. Une modification est reflétée dans les deux vues ; l’annulation ou l’archivage suit le même principe. Depuis un événement, ouvrir le dossier AO concerné. Si l’édition depuis le calendrier est proposée, elle passe par le service CRM et ses permissions, jamais par une écriture parallèle du module Calendrier. Les rappels passent par le service Notifications commun.

Le premier lot est implémenté localement le 7 octobre 2026 ; son périmètre et ses limites sont précisés ci-dessous.

### Décision de réponse AO — 8 octobre 2026

À télécharger puis À analyser : dossier seul. No go : dossier conservé sans nouvelle opportunité. En préparation : création de l’affaire liée, puis étapes commerciales indépendantes. Aucun numéro commercial n’est consommé pendant l’analyse. Les dossiers existants et leur historique restent conservés ; revenir en No go après promotion ne supprime pas l’affaire. No go n’est pas Perdue. Les documents, échanges, tâches et rendez-vous fonctionnent dès l’analyse.

Les vues AO utilisent les dossiers comme racine : Kanban de préparation avec No go, liste dédiée (référence, société, titre, tags, publication, visites, préparation, remise, montant, documents, responsable) et planning par dossier. Le planning réutilise les dates et la navigation du calendrier Horizon, sans copier les événements.

### Premier lot AO livré — 7 octobre 2026

Périmètre historique : la création immédiate, la liste et le calendrier AO de ce lot sont remplacés par la décision du 8 octobre ci-dessus. La duplication d’un dossier autonome n’est pas proposée ; la duplication d’une affaire liée reste le parcours CRM.

- Types `direct` / `tender` choisis à la création et convertibles à la sauvegarde avec crm.write. AO → direct archive uniquement l’extension AO ; retour vers AO réactive le même dossier ou le crée s’il n’existe pas. Numéro, compte analytique et historique préservés. Les opportunités existantes restent directes. Une AO reprend société, responsable, montant, devise, description, compte analytique, étapes commerciales et fil de l’opportunité.
- Volet Appels d’offres : mêmes cartes / Kanban avec glissement automatique, colonnes repliables mémorisées par utilisateur, totaux globaux par devise, liste et calendrier. La préparation dispose initialement de À télécharger / À analyser / En préparation / À vérifier / Prête / Déposée ; déplacer la préparation ne modifie pas l’étape commerciale.
- Paramètres → CRM : onglets Préparation AO / Tags AO, libellés, couleurs (palette 24 + personnalisée), ordre, activation et ajout. Administration réservée Admin / Superuser avec permission de paramétrage. Les étapes commerciales conservent leur nombre fixe de six.
- Recherche et filtres dans la top bar transverse : état commercial, archives, préparation AO et tag ; recherche par titre / numéro / société / référence AO, tri partagé et regroupement de la liste par société. Liste paginée à 100 cartes / lignes ; regroupement sur la page courante, totaux Kanban sur l’ensemble filtré.
- Dossier : référence, lien de consultation, publication, date / heure / fuseau de remise, résultat attendu, tags et visite obligatoire. Rendez-vous multiples de type Visite / Soutenance, avec début, fin facultative, lieu / lien, notes, participants employés et état Prévu / Réalisé / Annulé. Les noms de participants sont visibles selon les droits RH.
- Réponses déposées : date réelle de dépôt, acteur authentifié, notes et pièces du fil. Versions atomiques immuables, reprises idempotentes ; impossible de supprimer une pièce référencée par un dépôt. Le dépôt effectif ne remplace pas l’échéance de remise et ne déplace pas silencieusement l’étape de préparation.
- Calendrier général et vue AO : mêmes dates source, navigation semaine / mois / trimestre / année, ouverture du dossier, mises à jour Realtime. Les rendez-vous annulés sont retirés, les dossiers archivés apparaissent avec le filtre Archives. Les tâches de préparation et documents réutilisent le fil Core.

Ce lot ne livre pas les rappels automatiques, la synchronisation de calendriers externes, les autres fournisseurs Projets / Congés, des événements manuels de calendrier, la rédaction de réponses Tiptap / PDF ou l’export de dossier. Les pièces acceptées restent celles du fil Core (PDF, PNG, JPEG, WebP, texte, 10 Mio) ; un dépôt trace une réponse déjà envoyée, il ne l’envoie pas. Le rang visuel des cartes reprend le tri courant au rafraîchissement. Duplication : nouvelle affaire, nouveau compte et dossier AO vide, sans visites / dépôts / fil copiés. Recette sur le NAS encore à effectuer après installation du backend et du frontend.

### Liste AO

- tri ;
- recherche ;
- groupement client ;
- colonnes configurables ;
- tags ;
- dates ;
- valeur estimée ;
- responsable ;
- statut ;
- documents.

### Évolutions souhaitables

- date résultat attendue ;
- motif gagné / perdu ;
- checklist réponse ;
- questions / réponses ;
- rappels ;
- participants visite ;
- conversation liée ;
- création de projet / commande depuis l’opportunité.

## 5.4 Création d’un AO

Créer un AO depuis l’interface doit créer une **opportunité CRM de type `tender`** et ses données spécifiques AO dans une même opération métier.

L’utilisateur n’a pas à comprendre cette séparation technique.

---

# 6. Ventes

## Devis

Cycle initial :

```text
draft
→ validated
→ sent
→ accepted / rejected / cancelled
```

L’interface affiche une frise Brouillon → Devis → Envoyé → Commande client, avec états Annulé / Archivé distincts. Le tag Brouillon redondant à côté du titre est retiré. Le titre conserve le numéro : Devis 00003-1 devient Commande 00003-1 après acceptation. Le filtre Devis exclut les commandes accepted ; la liste dédiée se nomme Commandes clients.

Un brouillon reste modifiable.

La validation applique les règles métier et verrouille les éléments nécessaires.

Pour une opportunité `#11450`, les devis sont numérotés dans la famille analytique de l’opportunité :

```text
#11450-1
#11450-2
#11450-3
```

Plusieurs devis peuvent donc coexister sur une même opportunité.

**Aucune exclusivité n’existe entre les devis d’une opportunité :**

- plusieurs devis peuvent être validés en interne ;
- plusieurs peuvent être envoyés au client ;
- plusieurs peuvent être acceptés ;
- chacun peut générer une ou plusieurs commandes.

L’acceptation d’un premier devis ne ferme pas techniquement l’opportunité aux devis complémentaires.

Fonctions :

- lignes ;
- produits catalogue ;
- produits composés ;
- services ;
- remises ;
- taxes ;
- conditions ;
- validité ;
- PDF ;
- e-mail ;
- validation ;
- acceptation ;
- annulation ;
- transformation en commande ;
- rattachement systématique au compte analytique.

### Suivi des services en commande — 15 octobre 2026

Un produit de nature `service` et de marque canonique CVS est une prestation interne : aucun besoin d’achat depuis la vente. La comparaison du nom de marque est exacte, après retrait des espaces extérieurs et sans distinction de casse ; CVS Partner n’est pas CVS. Aucun champ Interne supplémentaire. Un service d’une autre marque reste achetable si `purchase_enabled`, sans flux physique. Le matériel de marque CVS conserve ses politiques ordinaires. Le nom de famille et les textes libres ne déterminent pas cette règle. La famille possède un usage configuré ; il est repris dans la nature enregistrée à création/changement ou réapplication explicite de famille, sans conversion des anciens produits.

Les services affichent un tiret en Réceptions/Livraisons ; les prestations internes et produits non achetables également en Achats. Facturé reste disponible pour tous. La préparation depuis devis/commande et la création de DA sourcée appliquent la règle côté serveur. Les achats déjà liés restent consultables : aucun document annulé/supprimé automatiquement ; une DA historique interne peut être conservée ou réduite, sans augmentation ni nouvelle préparation. Les lignes libres conservent leur comportement existant.

La nature et la marque commerciales sont conservées dans le snapshot catalogue. Pour les anciennes lignes sans nature capturée, seule cette nature provient du produit actuel ; la marque historique est conservée lorsqu’elle existe. Aucune réécriture de document validé.

## Prix, marge et révisions

Chaque devis calcule et affiche :

- prix de vente ;
- coût de référence ;
- marge montant ;
- marge pourcentage ;
- devise ;
- TVA ;
- remise.

La source de prix peut provenir :

```text
prix catalogue
liste tarifaire
prix client
prix saisi autorisé
```

Les remises peuvent déclencher une approbation selon les règles configurées.

Un devis envoyé peut recevoir des révisions.

Une révision conserve l’historique de la version précédente.

Un devis rejeté / perdu conserve un motif.

## Validation

La validation dépend des droits utilisateur.

Il n’existe pas de seuil automatique par montant, marge ou remise.

Exemples de permissions :

```text
sales.quote.validate
sales.order.confirm
```


## Commandes partielles

Un devis accepté peut générer :

- une commande complète ;
- plusieurs commandes ;
- une commande partielle.

Horizon conserve la quantité commandée et le reliquat par ligne.

## Commandes clients

Cycle :

```text
draft
→ confirmed
→ in_progress
→ completed / cancelled
```

La commande hérite du compte analytique du devis / de l’opportunité.

Une commande confirmée peut créer ou alimenter un projet.

Plusieurs commandes issues de plusieurs devis acceptés peuvent alimenter le même projet.

Par défaut, Horizon propose le projet existant de l’opportunité lorsqu’il existe.

## Approvisionnement depuis les ventes

Depuis un devis ou une commande client, l’utilisateur peut lancer les approvisionnements nécessaires.

Horizon doit pouvoir :

- analyser les produits à acheter ;
- éclater les produits composés selon leurs composants ;
- vérifier les politiques de stock / réappro ;
- proposer les fournisseurs ;
- proposer le fournisseur privilégié ;
- reprendre le dernier prix ou prix fournisseur connu ;
- créer une ou plusieurs demandes d’achat ;
- conserver le code analytique d’origine.

La création d’achats n’est jamais implicite sans visibilité utilisateur.

Une prévisualisation des besoins est affichée avant création.

---

# 7. Achats

Le module Achats couvre d’abord le besoin, puis la commande fournisseur.

## Demandes d’achat

Accueil Achats — complément du 13 octobre 2026 : `/purchasing` affiche une liste commune de DA et bons de commande fournisseurs, avec type DA / BC visible, tri global et pagination commune. Par défaut, les pièces en attente sont sélectionnées : DA non archivées draft / validated / partially_ordered et BC non archivés draft / validated / sent / acknowledged / partially_received. Aucun nouveau statut métier. Quatre cartes, dans l’ordre DA en attente / Brouillon / Validée / Bons de commande, filtrent cette même liste ; Bons de commande couvre tous les BC non archivés, comme la consultation des commandes clients dans Ventes. Les compteurs couvrent le contexte recherché entier, indépendamment du filtre courant et de la page. SearchFilters permet aussi tous les états non archivés, les autres états et les archives. Recherche, regroupement et tri restent dans l’URL ; une ouverture de fiche suivie du retour par le breadcrumb restitue la liste d’origine. Sous-menus DA et Commandes fournisseurs dédiés conservés. Nouvelle commande est l’action principale à droite, Nouvelle demande secondaire ; droits d’écriture Achats requis.

Une demande d’achat peut provenir :

- d’un devis ;
- d’une commande client ;
- d’un projet ;
- d’un besoin manuel ;
- d’un réapprovisionnement stock.

Cycle :

```text
draft
→ validated
→ partially_ordered / ordered
→ completed / cancelled
```

Fonctions :

- fournisseur proposé ou imposé ;
- produits ;
- quantités ;
- date de besoin ;
- source commerciale / projet ;
- documents ;
- notes ;
- compte analytique ;
- ventilation sur plusieurs comptes analytiques.

Une même demande d’achat ou une même commande fournisseur peut concerner plusieurs codes CRM.

La ventilation doit être conservée **au niveau des lignes**.

## Commandes fournisseurs

Une commande fournisseur peut être créée directement depuis la liste, en brouillon, sans demande d’achat préalable. Le fournisseur, les lignes et leur ventilation sur les affaires sont renseignés dans la fiche commune. La validation des demandes conserve sa préparation automatique de BC brouillons.

Cycle :

```text
draft
→ validated
→ sent
→ acknowledged
→ partially_received
→ received
→ closed / cancelled
```

Fonctions :

- fournisseur ;
- lignes ;
- prix ;
- conditions ;
- PDF ;
- e-mail ;
- réception ;
- lien projet / affaire ;
- traçabilité vers demande d’achat ;
- ventilation analytique.

Un document d’achat reste en brouillon tant qu’il n’est pas explicitement validé.

## Validation achats

La validation d’une demande ou commande d’achat dépend des permissions de l’utilisateur.

Aucun moteur de seuils ou d’approbateurs automatiques n’est prévu.


## Réceptions partielles et reliquats

Une commande fournisseur peut être réceptionnée en plusieurs fois.

Horizon suit pour chaque ligne :

```text
commandé
reçu
restant à recevoir
facturé fournisseur
```

Une ligne ou commande peut être annulée totalement ou partiellement si les droits le permettent.

Les reliquats restent visibles tant qu’ils ne sont pas reçus ou explicitement clôturés.

## Hors périmètre : consultation fournisseurs / RFQ

Horizon ne prévoit pas actuellement de workflow :

```text
DA
→ consultation de plusieurs fournisseurs
→ comparaison d’offres
→ attribution
```

Le flux retenu reste :

```text
DA
→ sélection fournisseur
→ commande fournisseur
```

---

# 8. Stock

Le module Stock est également propriétaire du **catalogue produits**.

## Catalogue

Chaque produit possède notamment :

- référence interne ;
- désignation ;
- description ;
- catégorie ;
- type métier ;
- unité ;
- code-barres éventuel ;
- référence fabricant ;
- image principale ;
- galerie d’images ;
- statut actif / inactif.

Types métier initiaux :

```text
service
equipment
consumable
```

Les règles logistiques restent configurables séparément.

## Matériel interne et location — cadrage du catalogue

Décision utilisateur du 9 octobre 2026 : prévoir dès le socle les équipements destinés à l’usage interne et leur rattachement aux immobilisations ; la location est rare et reste un parcours ultérieur.

Le catalogue produit reste unique. La destination appartient au besoin d’achat et aux quantités / exemplaires affectés, pas à une duplication de fiche produit : un même modèle peut être vendu et utilisé en interne. Distinguer l’affectation opérationnelle (stock commercial / parc interne) et le rattachement comptable à une immobilisation. La sortie du stock commercial vers le parc interne est explicite, validée et auditée ; elle réduit les quantités commerciales sans perdre la présence physique, l’emplacement, la réception, le coût historique et le numéro de série. Une simple modification de catégorie produit ou un transfert d’emplacement ne réalise pas cette opération.

Le parc interne conserve des objets identifiés, reliés au produit et, si sérialisés, à `inventory_serials`, sans deuxième numéro de série source de vérité. Affectation à une équipe / ressource / site, disponibilité et historique de maintenance sont à cadrer avant implémentation. Le lien comptable passe par Accounting Service et son provider ; Sage reste la vérité comptable en phase 1. Aucune immobilisation n’est créée automatiquement par le simple choix « usage interne » dans une fiche produit.

Prévoir la possibilité future de louer un équipement du parc sans le réintégrer au stock commercial. L’état physique, l’affectation et la disponibilité doivent rester distincts ; réservation datée, sortie et retour de location réutiliseront les exemplaires et services existants. Tarifs de location, contrats, planning de location et facturation sont différés ; aucun workflow livré dans ce cadrage.

## Catégories

Les produits peuvent être classés dans des catégories hiérarchiques.

Exemple :

```text
Vidéo
├── Caméras
├── Moniteurs
└── Convertisseurs

Audio
├── Consoles
└── Interfaces
```

## Politiques de stock

Un produit peut utiliser une politique telle que :

```text
none
stocked
on_demand
```

Le suivi peut être :

```text
none
lot
serial
```

Exemples :

```text
Service
→ pas de stock

Équipement
→ stock possible
→ numéro de série possible

Consommable
→ stock
→ réappro min/max possible
```

## Réapprovisionnement

Règles possibles :

- aucun réappro automatique ;
- seuil minimum / maximum ;
- achat à la demande ;
- achat lié à une commande client ;
- quantité de réappro ;
- délai fournisseur.

## Produits composés

Un produit peut être constitué d’autres produits.

Exemple :

```text
KIT REGIE MOBILE
├── 1 x switch
├── 2 x convertisseurs
├── 4 x câbles
└── 1 x service configuration
```

Modes prévus :

```text
kit
assembly
```

En mode `kit`, le produit peut rester présenté comme une ligne commerciale unique alors que le stock et les approvisionnements travaillent sur les composants.

Les boucles de composition sont interdites.

## Fournisseurs produits

Un produit peut avoir plusieurs fournisseurs.

Pour chaque relation produit / fournisseur :

- référence fournisseur ;
- prix ;
- devise ;
- quantité minimum ;
- délai ;
- priorité ;
- fournisseur privilégié ;
- date de mise à jour du prix ;
- date du dernier achat ;
- dernier prix d’achat.

Horizon doit pouvoir conserver l’historique utile des prix.

## Import catalogue Excel

Wizard :

```text
fichier Excel
→ mapping colonnes
→ preview
→ matching
→ créations / mises à jour / conflits
→ validation
→ import
```

Matching prioritaire :

1. identifiant externe connu ;
2. référence interne exacte ;
3. code-barres exact ;
4. fabricant + référence fabricant ;
5. fournisseur + référence fournisseur ;
6. résolution manuelle.

Une correspondance ambiguë ne crée jamais automatiquement un second produit.

## Quantités et réservations

Horizon distingue :

```text
physique
réservé
disponible
attendu
```

La réservation peut être liée à :

- commande client ;
- projet ;
- compte analytique.

## Lots et numéros de série

Les produits configurés en suivi `lot` ou `serial` disposent d’un historique complet :

- réception ;
- emplacement ;
- transfert ;
- réservation ;
- livraison ;
- retour.

## Retours / RMA

Prévoir :

- retour client ;
- retour fournisseur ;
- RMA ;
- mise en quarantaine ;
- remise en stock ;
- rebut.

## Inventaires

Fonctions :

- campagne d’inventaire ;
- comptage ;
- écarts ;
- validation ;
- mouvements correctifs ;
- historique.

## Stock projet

Un produit peut être physiquement présent dans l’entreprise tout en étant réservé / attribué à un projet.

Cette affectation doit être visible dans le stock et dans la valorisation analytique.

## Stock opérationnel

Fonctions :

- emplacements ;
- quantités disponibles ;
- mouvements ;
- réservations ;
- transferts ;
- livraisons ;
- retours ;
- inventaires ;
- historique ;
- lien vers compte analytique lorsque le mouvement concerne une affaire.

---

# 9. Projets

Le Projet représente l’exécution opérationnelle d’une affaire.

Il reste rattaché :

- au client ;
- à l’opportunité ;
- au compte analytique ;
- à une ou plusieurs commandes client.

## Origine commerciale

Une opportunité peut produire plusieurs devis validés et plusieurs devis acceptés.

Exemple :

```text
#11450
├── DEV 11450-1 → CMD A
├── DEV 11450-2
├── DEV 11450-3 → CMD B
└── DEV 11450-4 → CMD C
```

Les commandes `A`, `B` et `C` peuvent toutes alimenter un seul projet.

Si un découpage opérationnel est nécessaire, plusieurs projets peuvent être créés tout en conservant le même compte analytique.

## Création du projet

La création peut être :

- manuelle ;
- proposée lors de la première commande confirmée ;
- déclenchée depuis l’opportunité.

Horizon ne doit pas créer silencieusement un projet sans visibilité utilisateur.

Lorsqu’un projet existe déjà pour l’opportunité, les commandes suivantes proposent d’abord de l’y rattacher.

## Cycle global

```text
draft
→ active
→ closing
→ closed
```

États complémentaires :

```text
on_hold
cancelled
```

Le statut global ne doit pas être utilisé pour représenter toutes les étapes techniques.

## Phases

Le projet utilise des phases configurables.

Modèle de référence CVS :

```text
1. Kick-off
2. BE / Études
3. Approvisionnement
4. Production / Préparation / Intégration
5. Livraison
6. Installation
7. Mise en service / Commissioning
8. Recette
9. Levée des réserves
10. Handover / Documentation
```

Un projet simple peut ignorer plusieurs phases.

## Tâches et jalons

Fonctions :

- tâches ;
- responsables ;
- dates ;
- dépendances simples lorsque nécessaires ;
- jalons ;
- documents liés ;
- notes / Activity Feed.

Jalons typiques :

- kick-off ;
- design freeze ;
- FAT ;
- livraison ;
- début installation ;
- SAT ;
- recette ;
- levée des réserves ;
- handover.

## Budget et pilotage

Le projet conserve :

```text
baseline initiale
budget courant
réalisé
écart
```

Pour :

- revenus ;
- achats ;
- heures BE ;
- heures Production ;
- dépenses.

Les commandes client complémentaires peuvent augmenter le budget courant sans écraser la baseline initiale.

## Planning

Le projet est directement exploitable depuis le planning ressources.

Les affectations utilisent :

- compte analytique ;
- projet ;
- phase éventuelle ;
- tâche éventuelle ;
- BE / Production ;
- localisation ;
- heures prévues.

## Approvisionnements / Stock / Livraisons

Depuis le projet, l’utilisateur doit pouvoir visualiser :

- demandes d’achat ;
- commandes fournisseurs ;
- réceptions ;
- reliquats ;
- réservations stock ;
- matériel attribué au projet ;
- livraisons client ;
- numéros de série livrés.

## Recette / PV

La recette fait partie du Projet.

Types possibles :

```text
interne
FAT
SAT
partielle
finale
```

Une recette contient notamment :

- date ;
- type ;
- client / signataire ;
- statut ;
- observations ;
- document / PV ;
- réserves ;
- signatures.

Statuts possibles :

```text
draft
pending
accepted
accepted_with_reservations
rejected
cancelled
```

## Réserves

Une réserve possède :

- description ;
- responsable ;
- date de création ;
- échéance ;
- priorité ;
- statut ;
- preuve / commentaire de résolution.

Statuts :

```text
open
in_progress
resolved
waived
cancelled
```

La levée des réserves est historisée.

## Handover / remise documentaire

Le projet doit pouvoir suivre les livrables de fin :

- DOE / documentation ;
- plans ;
- synoptiques ;
- configurations ;
- sauvegardes ;
- notices ;
- PV ;
- documents de garantie.

La liste dépend du projet.

## Clôture opérationnelle

Une checklist de clôture peut contrôler notamment :

- phases terminées ;
- recette réalisée ;
- réserves closes ou dérogées ;
- livrables remis ;
- matériels sérialisés rattachés au parc installé ;
- interventions de mise en service terminées.

La clôture reste une action explicite avec droits dédiés.

## Clôture financière

Indépendante de la clôture opérationnelle.

Elle tient compte notamment :

- achats ;
- heures ;
- dépenses ;
- facturation ;
- écritures / règlements selon périmètre.

Un projet peut être :

```text
opérationnellement clos
+
financièrement ouvert
```

## Passage en garantie / SAV

Les équipements livrés et installés peuvent être transférés vers le Parc installé.

Le Projet reste l’origine historique :

```text
Projet
→ Livraison
→ N° série
→ Installation
→ Mise en service
→ Garantie
→ Parc installé
→ SAV
```

---

# 10. SAV / Parc installé

Le module SAV couvre la vie du matériel après livraison et la relation de support client.

## Parc installé

Horizon doit permettre de retrouver les équipements installés :

- par client ;
- par site ;
- par projet ;
- par code analytique ;
- par produit ;
- par numéro de série ;
- par statut de garantie.

Une fiche équipement installé contient notamment :

- client ;
- site / adresse ;
- produit ;
- numéro de série ;
- projet origine ;
- commande / BL origine ;
- date de livraison ;
- date d’installation ;
- date de mise en service ;
- statut ;
- photos / documents éventuels ;
- garantie(s) ;
- historique SAV.

Statuts possibles :

```text
planned
installed
in_service
out_of_service
removed
replaced
retired
```

## Garanties

Une garantie peut être :

- garantie CVS ;
- garantie constructeur ;
- extension ;
- contrat spécifique.

Informations :

- début ;
- fin ;
- fournisseur / garant ;
- conditions ;
- document ;
- statut.

Le statut de garantie doit être calculable à la date du ticket / intervention.

## Tickets SAV

Un ticket peut être créé pour :

```text
incident
support
warranty
maintenance
change_request
other
```

Champs principaux :

- numéro ;
- client ;
- contact ;
- équipement installé éventuel ;
- projet origine éventuel ;
- priorité ;
- description ;
- responsable ;
- statut ;
- garantie applicable ;
- mode de facturation ;
- Activity Feed.

Priorités :

```text
low
normal
high
critical
```

Statuts :

```text
new
qualified
planned
in_progress
waiting_customer
waiting_parts
resolved
closed
cancelled
```

## Interventions

Une intervention peut être créée depuis un ticket ou directement.

Elle contient :

- date / créneau ;
- site ;
- techniciens ;
- équipement(s) concerné(s) ;
- diagnostic ;
- actions réalisées ;
- heures ;
- déplacement / localisation ;
- pièces utilisées ;
- photos ;
- documents ;
- compte-rendu ;
- signature / validation client si nécessaire.

Cycle :

```text
draft
→ planned
→ in_progress
→ completed
→ validated
```

Avec `cancelled` si nécessaire.

## Heures

Les temps d’intervention utilisent TimeReport.

Ils peuvent être préremplis depuis le planning puis validés comme heures réelles.

Types de travail possibles :

```text
SAV
Maintenance
Support
```

en complément de BE / Production.

## Pièces utilisées

Une pièce utilisée pendant une intervention :

```text
intervention
→ mouvement de stock
→ coût
→ compte analytique
```

Le numéro de série / lot est conservé lorsque nécessaire.

## Analytique

Pour une intervention sous garantie :

```text
coût SAV
→ compte analytique de l’affaire d’origine
```

par défaut.

Pour une intervention facturable :

```text
ticket
→ opportunité / devis si nécessaire
→ nouveau compte analytique
→ facture
```

ou rattachement manuel à une affaire existante.

## Maintenance

Prévoir des plans de maintenance :

- équipement / groupe d’équipements ;
- fréquence ;
- prochaine échéance ;
- instructions ;
- technicien / équipe ;
- génération d’intervention planifiée.

Le planning SAV réutilise le planning ressources global.

## Facturation SAV

Une intervention facturable peut alimenter :

- devis ;
- commande ;
- facture ;

selon le workflow commercial nécessaire.

Le SAV ne possède pas son propre moteur de facturation.


---

# 11. Employés

Le module Employés représente les ressources humaines utilisables dans Horizon, qu’elles disposent ou non d’un compte.

## Types

```text
employee
freelance
interim
external
```

Un employé / ressource contient notamment :

- prénom ;
- nom ;
- photo ;
- e-mail professionnel ;
- téléphone professionnel ;
- type ;
- fonction ;
- équipe / service ;
- responsable ;
- société externe éventuelle ;
- date de début ;
- date de fin ;
- statut actif ;
- calendrier de travail ;
- capacité ;
- profil de coût ;
- utilisateur Horizon éventuel.

## Utilisateur Horizon

Depuis une fiche Employé autorisée :

```text
Créer / rattacher un utilisateur Horizon
```

Le compte utilisateur gère ensuite :

- authentification ;
- rôle ;
- permissions ;
- préférences ;
- accès aux modules.

La suppression / désactivation du compte utilisateur n’efface pas l’employé.

## Externes / freelances

Une ressource externe peut être :

- liée à une société fournisseur / partenaire ;
- planifiée ;
- affectée à un projet ;
- rattachée à une intervention ;
- utilisée dans les rapports de charge ;
- valorisée via un profil de coût.

Elle n’a pas besoin d’un accès Horizon.

## Données sensibles

Le module Employés n’a pas vocation initiale à devenir une paie ou un SIRH complet.

Éviter de stocker sans besoin :

- salaire détaillé ;
- données médicales ;
- données personnelles non nécessaires.

Le coût analytique peut être géré par profil sans révéler la rémunération réelle.


---

# 12. TimeReport

TimeReport couvre deux dimensions distinctes :

```text
Planning prévisionnel
Heures réalisées
```

## Planning ressources

Référence fonctionnelle :

```text
cre4tixdev/cvs-onsite-backend
```

Fonctions à reprendre / adapter :

- vue semaine ;
- collaborateurs internes et externes ;
- lignes collaborateur ;
- colonnes jours ;
- journée / nuit ;
- plusieurs codes analytiques sur une même journée ;
- affichage du client et de son logo ;
- Atelier / IDF / Déplacement ;
- application à plusieurs jours ;
- copie de semaine ;
- effacement contrôlé d’une semaine ;
- masquage / ordre des collaborateurs ;
- visualisation des congés, récupérations, absences et maladies.

Horizon ajoute :

- type de travail `BE` / `Production` / autre ;
- nombre d’heures planifiées ;
- lien direct vers le compte analytique ;
- comparaison prévu / réalisé ;
- synthèse de charge par équipe ;
- synthèse par code analytique.

Les congés et absences validés sont récupérés depuis le module Congés lorsque possible.

## Capacité et disponibilité

Chaque collaborateur possède une capacité de référence.

Le planning tient compte de :

- calendrier de travail ;
- temps de travail journalier / hebdomadaire ;
- temps partiel ;
- congés ;
- absences ;
- jours fériés ;
- affectations existantes ;
- disponibilité des externes.

La planification peut se faire :

```text
heures
demi-journée
journée
```

Les surcharges doivent être visibles.

Exemple :

```text
capacité : 8 h
planifié : 11 h
→ surcharge 3 h
```

Des vues permettent d’identifier :

- sous-charge ;
- charge complète ;
- surcharge ;
- personnes disponibles.

## Heures réalisées

Fonctions :

- utilisateur ;
- date ;
- durée ;
- compte analytique obligatoire lorsque l’activité concerne une affaire ;
- projet / tâche éventuel ;
- type de travail ;
- localisation ;
- commentaire ;
- statut ;
- validation ;
- vue semaine.

Types de travail initiaux :

```text
BE
Production
Autre
```

Localisations initiales, inspirées de OnSite :

```text
ATE   → Atelier
IDF   → Île-de-France
DEP   → Déplacement
```

Une affectation planning peut préremplir une saisie de temps, mais ne doit jamais créer automatiquement une heure validée.

---

# 13. Congés

Fonctions :

- demande ;
- type ;
- dates ;
- validation ;
- statut ;
- compteur ;
- calendrier ;
- historique.

---

# 14. Notes de frais

Libellé de navigation : Notes de frais, dans Ressources humaines ; module technique `expenses` conservé.

Fonctions :

- note de frais ;
- lignes ;
- catégorie ;
- montant ;
- TVA / identifiants fiscaux ;
- projet ;
- compte analytique ;
- justificatif ;
- validation ;
- remboursement ;
- export comptable.

---

# 15. Facturation

Le module Facturation est indépendant du moteur comptable utilisé.

Fonctions :

- factures clients ;
- avoirs ;
- factures d’acompte si nécessaire ;
- échéances ;
- conditions de paiement ;
- PDF / représentation lisible ;
- données structurées de facture électronique ;
- validation ;
- numérotation définitive ;
- envoi ;
- statut de paiement ;
- relances ;
- lien devis / commande / projet ;
- traçabilité comptable ;
- traçabilité facturation électronique.

Une facture validée devient un objet historique contrôlé.

## Échéanciers et règlements

Une facture peut comporter un ou plusieurs échéances.

Horizon suit :

```text
montant dû
échéance
montant payé
solde
retard
```

Les paiements peuvent être :

- complets ;
- partiels ;
- rapprochés d’une ou plusieurs factures selon les règles futures.

## Fiscalité / devises

Une facture conserve :

- devise ;
- taux de change si nécessaire ;
- règle de TVA appliquée ;
- pays / contexte fiscal ;
- arrondis calculés selon la règle centralisée.

La fiscalité peut différer selon France / UE / hors UE.

## Facturation électronique

SUPER PDP est la plateforme agréée sélectionnée.

Horizon doit gérer :

### Sortant

```text
facture client
→ validation
→ document final
→ données structurées
→ SUPER PDP
→ suivi du cycle de vie
```

### Entrant

```text
SUPER PDP
→ facture fournisseur
→ réception Horizon
→ rattachement fournisseur
→ contrôle Achats
→ validation
→ Comptabilité
```

Fonctions nécessaires :

- transmission ;
- réception ;
- statuts ;
- événements ;
- rejets ;
- erreurs ;
- retry contrôlé ;
- identifiant externe ;
- historique ;
- pièces jointes ;
- e-reporting lorsque nécessaire ;
- webhooks ;
- synchronisation de rattrapage.

Le PDF seul ne constitue pas le modèle de facture électronique.

Horizon conserve les données métier structurées et la représentation humaine.

---

# 16. Comptabilité

La comptabilité est conçue dès maintenant mais déployée progressivement.

## Phase 1 — Sage reste la comptabilité officielle

Horizon :

- prépare les données / écritures comptables ;
- exporte ou synchronise vers Sage ;
- conserve les statuts de synchronisation ;
- conserve les identifiants Sage ;
- détecte les erreurs ;
- évite les doubles exports ;
- permet la réconciliation Horizon / Sage.

Sage reste la source de vérité comptable.

## Phase 2 — Comptabilité Horizon en parallèle

Le moteur comptable Horizon fonctionne en mode shadow.

Objectifs :

- générer les mêmes écritures ;
- comparer journaux ;
- comparer balances ;
- comparer TVA ;
- comparer comptes clients / fournisseurs ;
- vérifier les clôtures.

Sage reste officiel pendant cette phase.

## Phase 3 — Comptabilité interne Horizon

Après validation, Horizon peut devenir la source de vérité comptable.

Périmètre cible à prévoir dès le Data Model :

- plan comptable ;
- journaux ;
- exercices ;
- périodes ;
- écritures ;
- lignes débit / crédit ;
- comptes auxiliaires ;
- TVA / identifiants fiscaux ;
- règlements ;
- lettrage ;
- banque ;
- rapprochement bancaire ;
- analytique / projets ;
- clôtures ;
- à-nouveaux ;
- FEC ;
- exports ;
- contrôles d’équilibre ;
- piste d’audit.

## Fiscalité et règles monétaires

Le moteur comptable prévoit :

- TVA collectée ;
- TVA déductible ;
- taux multiples ;
- exonérations ;
- opérations intracommunautaires ;
- opérations hors UE ;
- arrondis ;
- multi-devise ;
- écarts de change.

Les paramètres exacts sont configurables et doivent être validés avec la comptabilité CVS.

## Mapping Sage

Horizon conserve les mappings :

```text
comptes
journaux
TVA
modes de règlement
analytique
```

Les incohérences de mapping sont détectées avant export.

## Coûts horaires

Les heures BE et Production peuvent être valorisées à partir d’un profil de coût.

Le coût utilisé pour une période / écriture doit rester traçable même si le coût de référence évolue.

## Principe d’intégration

```text
AccountingProvider
├── SageAccountingProvider
└── HorizonAccountingProvider
```

Les autres modules appellent le service Comptabilité et ne dépendentent jamais directement de Sage.

---

# 17. Documents

Tout document opérationnel possède un cycle de vie explicite.

Lorsque pertinent :

```text
draft
→ validated
→ sent / executed
```

Fonctions :

- modèles ;
- WYSIWYG ;
- variables ;
- blocs dynamiques ;
- versioning ;
- génération PDF ;
- pièces jointes ;
- aperçu ;
- historique ;
- liens vers objets métier.

Un document finalisé ou envoyé est figé.

## Modèles CVS

Les modèles doivent pouvoir gérer :

- en-tête ;
- pied de page ;
- identité CVS ;
- CGV ;
- annexes ;
- tableaux ;
- signatures ;
- blocs conditionnels ;
- langue.

## Révisions / duplication

Un modèle peut être versionné.

Un document métier peut être dupliqué pour créer une nouvelle version / révision sans modifier l’historique finalisé.

## Signatures

Prévoir deux niveaux distincts :

```text
signature visuelle / bloc signataire
signature électronique via provider futur
```

Aucune dépendance à un provider de signature n’est imposée en V1.

---


## 17.1 Studio de modèles de pièces — cadrage du 8 octobre 2026

État : cadrage validé le 8 octobre 2026 ; première version D01 du studio implémentée, recette Gotenberg réelle sur NAS restant à faire. Choix confirmés : composition par blocs avec pagination automatique ; modèles communs dans Paramètres (Admin / Superuser), sélection par les utilisateurs depuis leur devis ; premier lot Devis, socle réutilisable pour les autres pièces. Le studio appartient à `documents` et sert plusieurs modules ; son premier fournisseur de données est Ventes / Devis.

### Demande et références examinées

Créer un modèle nommé et associé à un type de pièce (devis, bon de commande, autres types activés ensuite), choisir A4 portrait ou paysage, glisser des blocs depuis une bibliothèque, régler leur présentation et les relier à des champs métier. Tableau de lignes dynamique avec colonnes sélectionnables ; en-tête, pied de page ; aperçu sur un véritable devis et téléchargement PDF depuis le studio.

Références locales : `docs/example/Devis - #11616-5.pdf` (A4 portrait, deux pages) et `docs/example/Devis - #11799-1.pdf` (A4 portrait, une page). Les deux montrent :

- en-tête CVS récurrent : logo, coordonnées, slogan ;
- corps initial : adresses de facturation / livraison, client / interlocuteur / TVA, numéro du devis, affaire, dates et commercial ;
- tableau : désignation, marque, référence, quantité / unité, prix unitaire et montant ;
- descriptions multilignes, sections et notes en italique dans le devis long ;
- totaux HT / TVA / TTC après la dernière ligne, sur la dernière page ;
- pied légal et pagination « page X sur Y » sur chaque page ;
- fond graphique discret, distinct du contenu.

Ces fichiers sont des références de composition, pas des modèles éditables importés automatiquement. La précision de devise reste celle validée pour Horizon (deux décimales), même si les exemples utilisent trois décimales pour certains prix unitaires.

### Composition proposée

Bibliothèque à gauche, feuille A4 au centre avec zoom, propriétés du bloc sélectionné à droite. Actions communes Horizon en haut : sauvegarder le brouillon du modèle, aperçu, téléchargement PDF ; publication d’une version explicite. Liste des modèles avec recherche / filtres partagés.

Choix validé : composition structurée par blocs en flux, lignes de mise en page et colonnes ajustables. Déplacement par drag and drop, largeur, alignement, espacements, police, taille, couleur et bordure réglables. Un tableau de longueur variable pousse les blocs suivants et crée les pages nécessaires. En-tête / pied / fond sont des zones dédiées. Les blocs et champs restent positionnables et redimensionnables au pixel dans leur zone de composition : coordonnées X / Y, largeur / hauteur et espacements ajustables, déplacement précis au clavier. Pendant un glisser-déposer ou redimensionnement, les valeurs modifiées sont mises en surbrillance dans le panneau de propriétés, avec indication des deltas de déplacement et guides d’alignement. Les positions sont mesurées dans le repère du document, indépendamment du zoom ; conversion contrôlée en unités d’impression pour le PDF. Cette précision complète le flux paginé : le tableau pousse les blocs suivants et ne doit jamais recouvrir les totaux ou le pied de page.

Bibliothèque initiale proposée : texte enrichi, champ métier avec libellé facultatif, image / logo, adresse, ligne de mise en page, séparateur, espace, tableau dynamique, totaux, CGV, bloc de signature visuelle, saut de page et numéro de page. Le fond graphique utilise une image contrôlée. La signature visuelle ne constitue pas une signature électronique.

### Styles de titres

Le studio gère les titres de pièce et les niveaux 1 / 2 / 3 : police, taille, graisse, italique, casse, couleur du texte, fond, bordures, alignement et espacements avant / après. Des styles nommés propres au modèle garantissent un rendu homogène ; le panneau de propriétés permet leur réglage visuel. Les titres de section / sous-section des lignes du devis sont raccordés à ces styles selon leur niveau, sans modifier les descriptions métier. Leur éventuel sous-total et leur statut Option restent gérés par le rendu du tableau. Les titres restent avec le contenu suivant lorsque la pagination le permet.

### Liaison aux données

Chaque modèle choisit un type métier. Les champs disponibles viennent d’un registre fourni par le module propriétaire, avec noms compréhensibles : « Devis → Numéro », « Opportunité → Titre », « Client → Nom », etc. Pas de saisie libre de chemin PocketBase, de requête, de JavaScript ou de formule métier. Les relations permises sont résolues côté serveur selon les droits sur la source.

Le tableau choisit une collection métier autorisée (« Lignes du devis »), puis ses colonnes : libellé, champ, ordre, largeur relative, alignement et format. Une ligne de modèle est répétée pour chaque ligne réelle. Le contenu du tableau est obligatoirement issu du devis sélectionné : descriptions, marques, références, quantités, unités, prix, remises, montants, titres et notes. Le studio configure la présentation et les liaisons, pas un deuxième jeu de lignes commerciales ; aperçu et PDF consomment le même contexte du devis. Les titres niveaux 1 / 2 / 3 et les notes ont des rendus distincts, sans devenir de faux articles. Les sections, sous-totaux, options et remises reprennent les valeurs métier calculées côté serveur ; la mise en page ne recalcule ni prix ni taxes. Le repli utilisé dans l’écran d’édition du devis ne masque pas les lignes imprimées.

Le modèle destiné au client exclut par défaut les coûts d’achat et les marges internes. Un éventuel modèle interne doit être explicitement identifié et protégé par les permissions appropriées. Le simple accès au studio ne donne aucun accès supplémentaire au devis choisi pour l’aperçu.

L’identité CVS doit provenir du paramétrage Organisation. Les adresses de facturation / livraison et le contact doivent être explicites dans le contexte du devis ; le schéma livré ne fournit pas encore tous les champs / snapshots nécessaires aux exemples. Les compléter proprement avec le module propriétaire avant de promettre la reproduction entière. Une donnée manquante est signalée, jamais remplacée par une valeur inventée.

### Pagination et aperçu

Réserver l’espace de l’en-tête et du pied en millimètres ; format A4 portrait / paysage, marges réglables. Options de répétition : toutes les pages / première page pour l’en-tête et les blocs d’identité. En-tête du tableau répétable sur les pages suivantes, même si l’exemple long ne le répète pas.

Conserver un titre avec au moins sa première ligne quand ils tiennent sur une page ; éviter de couper une ligne ordinaire. Prévoir explicitement le cas d’une description plus haute qu’une page pour ne pas perdre de texte. Les totaux restent ensemble lorsque possible et suivent le tableau ; les CGV / annexes peuvent commencer sur une nouvelle page. Aucune hauteur fixe correspondant au nombre de lignes du devis.

L’éditeur fournit une représentation visuelle de travail. L’aperçu de référence affiche le PDF réellement produit par le moteur serveur, avec le même rendu que le téléchargement. Choisir un devis autorisé depuis la combobox / fiche transverse, sans dupliquer le formulaire de devis. L’aperçu ne modifie ni le devis ni son état et n’est pas un document finalisé.

### Architecture, droits et versions

Conserver le flux canonique : contenu structuré JSON / Tiptap pour les textes → rendu HTML contrôlé → Gotenberg → PDF. Tiptap partagé pour l’édition du texte ; drag and drop existant pour les blocs. La configuration des blocs utilise un schéma borné et une allowlist d’attributs. Aucun HTML / CSS / script arbitraire exécutable dans un modèle.

Réutiliser les collections cibles `documents_templates`, `documents_template_versions`, `documents_generated` et `documents_links`, en précisant le contrat dans le Data Model avant migration. Le module Documents rend et archive ; Ventes fournit un contexte de données métier via son service. Calculs financiers et accès restent côté serveur.

Proposition de droits : conception / publication des modèles par Admin ou Superuser avec `documents.template.manage` ; utilisation d’un modèle et génération selon les permissions métier et documentaires de la source. Publication d’une version immuable ; modification suivante dans un nouveau brouillon. Un document finalisé / envoyé conserve version du modèle, données nécessaires à sa relecture historique, HTML, PDF, auteur et date ; changer le modèle ne modifie pas les documents existants.

### Lots et critères de recette proposés

1. Socle Documents : contrat, migrations, permissions, registre de données Devis, identité / adresses nécessaires, versions de modèles et connexion Gotenberg.
2. Studio : A4, zones en-tête / corps / pied, bibliothèque, déplacement des blocs, propriétés et tableau dynamique.
3. Rendu : sélection d’un vrai devis, PDF d’aperçu / téléchargement, pagination et premier modèle CVS inspiré des exemples.
4. Intégration Ventes : choix du modèle depuis la fiche Devis, génération et historique figé ; autres types alimentés ensuite par leurs services propriétaires.

Recette indispensable : 0 / 1 / 50 / 200 lignes, descriptions longues, trois niveaux de titres, notes, options, remise globale, CGV longues, portrait / paysage, page X/Y, images, absence d’adresse, permissions refusées, préservation d’un PDF finalisé après changement de modèle. Comparer visuellement le PDF court et le PDF multipage aux deux références.

Arbitrages confirmés : blocs avec pagination automatique ; modèles communs dans Paramètres ; devis en premier avec architecture transverse. Pas de modèle local redessiné dans chaque devis ni de commandes fictives pour anticiper un module non livré. Les lots ci-dessus constituent l’ordre de réalisation ; aucune nouvelle collection ou dépendance n’est créée dans ce cadrage.


# 18. Paramètres

Le module Paramètres regroupe tout ce que CVS doit raisonnablement pouvoir faire évoluer **sans modification du code**, tout en préservant les règles structurantes de Horizon.

Principe :

```text
valeur métier évolutive
→ configurable

règle d’intégrité / workflow critique
→ contrôlée par Horizon
```

## 18.0 Organisation de la navigation (livraison locale)

`/settings` présente les réglages disponibles en tuiles avec pictogrammes et accès Configurer, dans six familles, dans le même ordre sur l’accueil et la navigation locale : Administration (Utilisateurs et accès, Référentiels, Séquences), Ventes et achats (CRM, Catalogue, Devis, Achats, Stock), Finance (Facturation, Codes analytiques fixes), Ressources humaines (Congés, Notes de frais), Documents et e-mails (Modèles de pièces, GED et classement, E-mails), Personnalisation (Apparence et densité, Mes notifications). Les rubriques non livrées sont séparées dans À venir, replié par défaut, et ne chargent pas la navigation locale. La recherche contextuelle de la top bar couvre intitulés, familles et sujets, ignore accents/casse ; elle conserve son texte dans l’URL et ouvre À venir quand un résultat y correspond. Sur mobile, la navigation devient horizontale et reste contenue à son cadre. Mes notifications ouvre les préférences personnelles existantes dans Mon compte ; ce lien ne change pas les droits d’administration ni les permissions des pages.

`/settings/references` fournit les catalogues opérationnels ; le catalogue sélectionné figure dans l’URL (`catalog`) et reste conservé au rechargement. Ajout et modification restent soumis à `settings.references`. Les rubriques métier non livrées ouvrent leur périmètre de réglages prévu sous `/settings/modules/:module` ; aucun formulaire d’écriture ou activation fictive. Les liens vers les référentiels communs évitent de dupliquer pays / langues / devises dans chaque module. Cette organisation prépare les futures pages, elle ne livre pas leur administration métier.

## 18.1 Général

- raison sociale ;
- nom commercial ;
- logo ;
- coordonnées ;
- pays ;
- fuseau horaire ;
- langue par défaut ;
- devise de référence ;
- formats de date / nombre.

## 18.1.1 Référentiels transverses

Section « Référentiels » dans Paramètres : pays, langues et devises. Les collections dédiées sont partagées par Contacts et les autres modules ; aucune liste de choix dupliquée par module. Réutiliser `settings_languages` et `accounting_currencies`, ajouter `settings_countries`.

Administrer les libellés, l’ordre d’affichage et l’activation avec la permission `settings.references`. Les codes normalisés sont stables ; une valeur utilisée se désactive plutôt que se supprime. Une valeur inactive reste lisible sur les fiches et historiques existants mais n’est plus proposée pour un nouveau choix. Initialisation via migrations reproductibles. Les taux de change restent distincts du catalogue des devises.

Les combobox affichent le libellé et le code, permettent une recherche clavier et proposent uniquement des choix autorisés. Un référentiel indisponible affiche une erreur avec réessai. Les valeurs structurantes comme les types d’adresse ou les transitions restent contrôlées par Horizon.

## 18.2 Utilisateurs & Organisation

- utilisateurs Horizon ;
- rôles ;
- permissions ;
- équipes / services ;
- responsables ;
- profils de coût ;
- calendriers de travail ;
- capacité par défaut.

La gestion complète des ressources reste dans **Employés**.

## 18.2.1 Authentification

Modes disponibles :

```text
Horizon email / mot de passe
Microsoft OAuth2 / Entra
```

Le mode Horizon est actif par défaut.

Le login natif et Mon compte sont livrés. Microsoft reste une option de raccordement. La double authentification est reportée à la demande utilisateur : piste mot de passe + OTP e-mail PocketBase, avec configuration SMTP et récupération à cadrer. OTP seul n’est pas un second facteur ; aucun MFA/OTP activé dans cette livraison.

Microsoft peut être activé en complément.

Paramètres :

```text
☑ Auth Horizon
☐ Microsoft
```

Les rôles et permissions restent toujours Horizon.

Un utilisateur Microsoft doit correspondre à un utilisateur Horizon autorisé.

## 18.2.2 Cadrage utilisateurs, droits, managers et organigramme

Récapitulatif du 7 octobre 2026, validé par l’utilisateur pour démarrer la réalisation. Ce cadrage conserve la cible globale ; la section 18.2.3 décrit le périmètre réellement livré et les limites restantes.

### Orientations exprimées par l’utilisateur

- Quatre profils ERP : Admin, Superuser, User et Viewer.
- Paramétrage de Horizon réservé à Admin et Superuser ; accès métier attribués selon les besoins de chacun.
- Le titre du poste est une étiquette descriptive. « Commercial » ou « Responsable bureau d’études » ne donne aucun droit automatiquement.
- Manager est une responsabilité organisationnelle indépendante du profil ERP. Il faut définir les collaborateurs dont la personne est responsable et ses accréditations sur les modules.
- Une validation est une action métier, distincte de l’administration de l’ERP.
- Gestion des utilisateurs et module Employés doivent être cohérents ; Employés proposera une liste et un organigramme.

### Situation du dépôt au moment du cadrage (avant livraison)

| Sujet | État réel |
|---|---|
| Comptes et droits | `core_users` lié à un `core_roles`, qui porte une liste de permissions. Contrôles services / API Rules / hooks serveur. |
| Gestion des comptes et rôles dans Horizon | Non livrée. « Utilisateurs et accès » affiche encore un périmètre à venir ; le socle REST interdit leur administration aux utilisateurs. |
| Quatre profils ERP | Cible demandée, pas encore des profils structurels appliqués par le code. |
| Paramètres fonctionnels | Administration actuellement conditionnée par `settings.references`, sans catégorie Admin / Superuser. Ce droit devra être encadré lors du nouveau lot. |
| Manager et périmètre hiérarchique | Non implémentés dans les autorisations actuelles. |
| Employés, équipes et responsables | Prévus par le Data Model, mais collections métier / écrans / organigramme non livrés. |
| Validation métier | Principe déjà retenu : permission dédiée et transition serveur, sans moteur de seuils par montant. Les workflows non livrés restent à construire. |

### Quatre notions à séparer

| Notion | Question traitée | Exemple |
|---|---|---|
| Employé / ressource | Qui travaille dans l’organisation ? | Salarié, freelance, intérimaire ou externe. |
| Profil ERP du compte | Quel niveau d’administration de Horizon ? | User ou Admin. |
| Responsabilité de manager | De quelles personnes est-il responsable ? | Marie est responsable de Paul et Léa. |
| Accréditation métier | Quelle action peut-il faire sur quelles données ? | Valider les temps de Paul et Léa, consulter le CRM, préparer des devis. |

Un intitulé ne doit jamais déclencher une permission. Une responsabilité de manager ne doit jamais entraîner une élévation du profil ERP. Une personne peut valider des pièces sans être manager si elle possède l’accréditation métier nécessaire.

### Proposition de profils ERP

| Profil | Accès métier | Paramétrage fonctionnel | Sécurité et gestion des accès |
|---|---|---|---|
| Admin | Tous les modules et actions prévues, sous réserve des invariants métier. | Complet. | Comptes, profils, accréditations, authentification et intégrations sensibles. |
| Superuser | Accès étendu ; droits de validation et données sensibles à attribuer explicitement. | Référentiels, séquences, réglages des modules et modèles. | Pas de modification des profils ou permissions, ni des secrets / paramètres de sécurité. |
| User | Modules, actions et périmètres attribués. | Aucun paramétrage global. | Aucun. |
| Viewer | Consultation des modules et périmètres attribués. | Aucun. | Aucun. |

La frontière exacte Admin / Superuser est une proposition à valider. Superuser Horizon reste un compte applicatif normal `core_users`, jamais un superuser technique PocketBase. Les invariants s’appliquent à tous : historique figé, intégrité des relations, contrôle des transitions, archivage distinct de suppression.

Les préférences personnelles et les vues filtrées ne constituent pas l’administration globale de Horizon. Conserver les règles déjà validées : un utilisateur autorisé peut créer une vue personnelle ou globale ; son créateur et les administrateurs autorisés peuvent la modifier / supprimer.

### Accréditations par module : action et périmètre

Proposition : présenter des niveaux usuels pour faciliter la saisie, avec le détail des actions disponible. Les niveaux doivent correspondre à des permissions explicites ; « Manager » ne constitue pas un niveau d’accréditation.

| Niveau présenté | Actions possibles |
|---|---|
| Aucun accès | Module inaccessible. |
| Consultation | Lire les données autorisées. |
| Contribution | Lire et créer / modifier les objets autorisés selon leurs états. |
| Validation | Droits de contribution et validations explicitement cochées. |

Archivage, suppression, export, envoi de documents, consultation des coûts / marges et clôtures restent des actions distinctes quand le module les prévoit. Une accréditation de validation des devis ne donne pas la validation des commandes, factures ou temps. Viewer constitue un plafond de consultation : aucune combinaison ne doit lui donner une écriture métier. Les éventuelles préférences personnelles suivent leur propre policy.

Le périmètre est choisi séparément : soi / ses objets, collaborateurs encadrés, équipe(s) désignée(s), ou ensemble du module. Chaque module précise quels périmètres ont un sens et comment les objets y sont rattachés. Par exemple, les temps se rattachent à un employé ; un devis se rattache à une affaire / un responsable commercial. Ne pas déduire la propriété d’un objet de son seul créateur, ni appliquer un filtre hiérarchique universel à toutes les collections.

Les droits effectifs combinent compte actif, profil ERP, accréditation, périmètre et état de l’objet. Un refus par une règle métier ne peut pas être levé par un simple profil privilégié.

Projection sur les modules Horizon, à traduire dans leurs policies lors de leur livraison :

| Domaine | Actions métier à distinguer | Attention sur le périmètre |
|---|---|---|
| Contacts / CRM | Consulter, contribuer, archiver ; responsabilité d’affaire distincte du responsable hiérarchique. | Référentiel partagé et portefeuille commercial à définir explicitement. |
| Ventes / Achats | Préparer, valider, envoyer, archiver. | Affaires / équipe / ensemble du module ; une validation d’achat n’est pas une validation de vente. |
| Projets / SAV | Piloter, affecter, valider une recette / intervention, résoudre des réserves, clôturer. | Participation ou responsabilité opérationnelle ; clôtures technique et financière distinctes. |
| Planning / TimeReport / Congés / Dépenses | Saisir / organiser, consulter, valider selon le module. | Ressource concernée et collaborateurs encadrés ; règles d’auto-validation à définir. |
| Catalogue / Stock | Gérer le catalogue, consulter / réaliser / corriger des mouvements. | Produits et entrepôts partagés ; être manager ne donne pas un droit de correction de stock. |
| Facturation / Comptabilité | Préparer, valider, comptabiliser, rapprocher, exporter, clôturer. | Accréditations explicites, données sensibles et invariants financiers ; absence de moteur de seuils. |
| Employés | Consulter l’annuaire / organisation, gérer les fiches, lire les données sensibles autorisées. | Annuaire, ressources de son équipe et données confidentielles séparés. |
| Messagerie / Documents / Fil | Envoyer, participer, consulter les fichiers ou publier sur une source autorisée. | Membres de conversation et permissions de l’objet source ; manager ne donne pas accès aux échanges privés. |

Ce tableau décrit la cible, pas une liste de permissions déjà disponibles. Le niveau de détail des actions sera adapté au module sans transformer tous les écrans en matrices complexes.

### Manager et collaborateurs encadrés

Proposition simple : un responsable hiérarchique principal par employé, sans cycle et sans auto-rattachement. L’organigramme et la liste des collaborateurs directs sont dérivés de cette relation. Si les collaborateurs disposent de comptes Horizon, afficher ces comptes à côté des employés ; ne pas maintenir une seconde hiérarchie indépendante entre utilisateurs.

La catégorie Manager peut apparaître comme une responsabilité sur la fiche. Elle ne suffit pas à obtenir un droit. Le périmètre « mes collaborateurs » doit également disposer d’une action autorisée dans le module concerné. Proposition initiale : collaborateurs directs seulement ; l’accès aux équipes indirectes doit être explicite et reste à arbitrer.

| Exemple | Configuration cohérente |
|---|---|
| User manager de Paul et Léa | Peut valider leurs temps si `time.validate` et le périmètre correspondant lui sont attribués ; ne modifie pas les paramètres. |
| User chargé des validations commerciales | Peut valider les devis autorisés sans être responsable hiérarchique de leurs auteurs. |
| Manager ayant seulement consultation CRM | Consulte le périmètre CRM accordé ; ne valide aucun devis par héritage. |
| Superuser sans validation financière | Configure les séquences ; ne comptabilise pas une écriture sans permission dédiée. |

Changer de manager ne réécrit pas les validations passées : conserver auteur et date historiques. Le périmètre courant doit être recalculé côté serveur pour les nouvelles actions. Aucun mécanisme d’auto-validation, délégation ou remplacement temporaire n’est introduit implicitement.

### Lien avec Employés et organigramme

Employés reste propriétaire de la ressource humaine : identité, photo, intitulé libre, service / équipe, responsable, statut et données de planification. Core / Auth reste propriétaire du compte, de l’authentification et des accréditations. Le référentiel d’équipes est partagé conformément au Data Model, sans seconde liste dans chaque module.

Un employé peut ne pas avoir de compte. Un compte peut être sans fiche employé, par exemple pour un accès technique autorisé ; il ne figure alors pas artificiellement dans l’organigramme. Proposition : un responsable hiérarchique doit être une ressource Employés identifiée, même si elle n’a pas de compte. Elle ne peut exercer une action dans Horizon qu’après rattachement à un compte autorisé.

Deux vues complémentaires dans Employés :

| Liste | Organigramme |
|---|---|
| Recherche, filtres équipe / statut / type, coordonnées et lien vers la fiche. | Cartes compactes avec avatar, nom, intitulé et équipe, liens de responsabilité. |
| Visibilité du compte lié et de sa catégorie selon les droits du lecteur. | Repli des branches, zoom / recentrage et recherche d’une personne. |
| Ressources sans compte présentes. | Ressources sans compte présentes ; personnes sans responsable dans une zone dédiée. |

L’organigramme ne révèle ni coûts, ni accréditations, ni données sensibles à un lecteur non autorisé. Il représente la hiérarchie, pas une carte d’accès à toutes les données. Commencer par une vue consultable ; un déplacement de carte modifiant le responsable ne sera ajouté qu’avec validation explicite, sauvegarde serveur et audit.

### Page « Utilisateurs et accès » proposée

Liste dense : identité / avatar, employé lié, profil ERP, responsabilité Manager, modules accessibles, statut du compte et engrenage de configuration. Recherche et filtres dans les patterns communs Horizon.

Fiche utilisateur : identité et rattachement Employés ; profil ERP ; accréditations par module avec actions et périmètres ; aperçu des droits effectifs ; état / accès au compte ; historique des changements sensibles. Le lien Employés ouvre la fiche métier. La responsabilité et les collaborateurs sont montrés depuis l’organisation, sans deuxième liste hiérarchique saisie manuellement dans cette page.

Seul Admin gère les droits dans la proposition actuelle. Un manager peut consulter son équipe dans Employés selon sa permission, sans accorder de droits à ses collaborateurs. Superuser accède aux paramètres fonctionnels autorisés sans administrer les profils.

### Contraintes de réalisation

- Autorisation commune côté serveur, reprise par services et API Rules ; contrôles effectifs sur listes, détails, recherche, agrégats, fichiers, exports et realtime.
- Aucun droit déduit du nom d’un rôle ou du titre du poste, aucune élévation via le REST des utilisateurs.
- Audit de création / désactivation de compte, changement de profil, accréditation, périmètre et rattachement hiérarchique ; secrets exclus des traces.
- Empêcher la suppression / désactivation du dernier Admin actif ; sécuriser les modifications de ses propres droits.
- Une désactivation du compte ne supprime ni l’employé ni son historique. Une fin d’activité Employés ne doit pas laisser un accès actif par oubli : comportement à définir et appliquer explicitement côté serveur.
- Révocation des droits prise en compte côté serveur sans dépendre d’un ancien snapshot de session dans le navigateur.
- Migration contrôlée des rôles actuels, sans promotion automatique fondée sur leur libellé. Mise à jour du Data Model et tests avant toute implémentation.

Source de vérité retenue : `core_users.employee`, relation unique facultative. La projection inverse sur Employés est calculée ; les membres d’équipe viennent de `hr_employees.team`. Aucun second rattachement persistant ni obligation de compte pour rejoindre une équipe.

### Points à arbitrer avant développement

| Sujet | Proposition de départ |
|---|---|
| Superuser | Paramètres fonctionnels, sans gestion des droits ni sécurité. Accès sensibles / validations explicitement attribués. |
| Manager de plusieurs niveaux | Collaborateurs directs par défaut ; descendants seulement avec périmètre explicite. |
| Accréditations | Configuration par utilisateur, avec possibilité de copier un ensemble de droits pour faciliter la saisie ; pas de règle fondée sur le poste. Évaluer ensuite les modèles partagés si le besoin se répète. |
| Responsabilité principale et transverse | Un manager principal pour l’organigramme. Responsabilités projet et périmètres d’équipe traités par les modules, sans ajouter d’emblée une hiérarchie matricielle. |
| Auto-validation et remplacement | Politique par action métier à préciser ; aucune délégation automatique. |
| Fin d’activité d’un employé | Proposer une désactivation liée et contrôlée du compte ; conserver les exceptions explicites pour les comptes techniques. |

### Découpage de réalisation proposé

1. Valider profils, frontières d’administration, hiérarchie et périmètres métier.
2. Définir le contrat Core / Employés / équipes et migrer les rôles existants ; centraliser l’autorisation serveur.
3. Livrer la page Utilisateurs et accès, puis appliquer la nouvelle frontière aux paramètres déjà livrés.
4. Livrer Employés en liste / fiche, rattachements utilisateurs et responsables.
5. Ajouter l’organigramme consultable ; activer ensuite les périmètres de manager sur les modules capables de les contrôler.

Les modules non livrés restent un chantier. Tant qu’un périmètre n’est pas contrôlé réellement côté serveur pour un module, ne pas afficher une accréditation restreinte qui donnerait en réalité un accès global.

## 18.2.3 Livraison Utilisateurs, droits et Employés — 7 octobre 2026

Accord utilisateur pour réaliser le cadrage. `/settings/users` fournit la liste des comptes, recherche, filtre de profil, employé lié, indication Manager, modules accessibles, activation et engrenage de configuration. L’éditeur gère identité, profil ERP, lien unique Employés, mot de passe initial / remplacement facultatif et accréditations. Toutes les modifications sont enregistrées explicitement ; aucun mot de passe existant n’est affiché. Admin seul crée les comptes et modifie les droits. Admin et Superuser accèdent aux paramètres fonctionnels avec `settings.references`. User / Viewer ne voient pas leur navigation ; les routes et règles serveur contrôlent également cette frontière.

| Profil | Administration | Droits métier |
|---|---|---|
| Admin | Comptes, accréditations, paramètres fonctionnels | Toutes les actions des modules actuellement livrés, sous leurs invariants |
| Superuser | Paramètres fonctionnels, sans administration des comptes / droits | Actions explicitement attribuées |
| User | Aucune administration ERP | Actions explicitement attribuées |
| Viewer | Aucune administration ERP | Consultation seulement, dans son périmètre |

Accréditations disponibles : Contacts et CRM `read` / `write`, périmètre global réel ; Employés `hr.read`, `hr.write`, `hr.organisation.manage`. Les périmètres Employés sont soi-même, collaborateurs directs, son équipe principale et tout le module. Un périmètre restreint nécessite un employé lié ; collaborateurs directs nécessite la responsabilité Manager ou Direction, équipe nécessite une équipe. Gérer la hiérarchie exige le périmètre global ; ce droit n’est pas hérité du statut Manager. Modules futurs visibles dans un volet « Modules à venir », sans droits attribuables. La granularité validation / portefeuille / projet sera livrée avec chaque module concerné.

`/hr` propose liste dense et organigramme : recherche, filtres équipe / statut, avatar protégé, poste descriptif, type de ressource, responsable, statut et présence du compte. Fiche éditable selon droits, responsabilité Collaborateur / Manager / Direction et responsable principal, équipe, coordonnées, dates et photo. Types salarié / freelance / intérimaire / externe, sans compte obligatoire. Équipes gérées dans un onglet d’Employés : nom, managers multiples, archivage et réactivation par Admin / Superuser ; aucun code technique affiché. Organigramme consultable avec cartes de largeur 280 px, liens hiérarchiques, repli des branches, zoom et recentrage. Aucun déplacement ne modifie silencieusement la hiérarchie. Une recherche / restriction peut présenter une personne comme racine si son responsable n’est pas dans les résultats visibles.

Le responsable doit être actif et désigné Manager ou Direction. Auto-rattachement et cycles refusés serveur. Un responsable ayant des collaborateurs actifs ne peut être désactivé ou perdre sa responsabilité avant leur réaffectation. Inactiver / terminer une ressource désactive son compte lié dans la même transaction ; les fiches et audits restent conservés. Le dernier Admin actif ne peut être désactivé ou rétrogradé, même via Employés. Compte et rôle actifs requis à chaque appel ; les changements de droits prennent effet serveur immédiatement. Le navigateur rafraîchit la session et purge ses caches lors d’une modification des droits / révision du compte.

Routes dédiées transactionnelles, allowlist, contrôle de version `409` et audit sans secrets. Écritures REST directes Core / Employés / équipes verrouillées. La migration conserve les rôles historiques, initialise les comptes en User et ne promeut que l’e-mail explicitement configuré dans `HORIZON_INITIAL_ADMIN_EMAIL` ; une mise à niveau de comptes existants sans cet e-mail est refusée avant modification. Procédure dans 06. Aucun déploiement NAS effectué.

Restent hors de ce lot : salaires / coûts, capacité, compétences, calendriers, workflows de validation des modules futurs, délégations, hiérarchie indirecte et modèles partagés de droits. Les audits sensibles sont enregistrés côté serveur ; un écran de consultation de ces audits n’est pas livré. H01 reste en cours jusqu’aux autres exigences RH de la roadmap.

## 18.3 Numérotation

Rubrique transversale Paramètres → Séquences : séquences des modules activés, numéro de départ, prochaine valeur, préfixe / suffixe et nombre minimum de chiffres, avec aperçu du prochain numéro. Administration avec settings.references ; sauvegarde explicite. Départ figé après première allocation et compteur ne reculant jamais ensuite. Numérotation et changements de configuration transactionnels côté serveur, conflit visible si une pièce a consommé le numéro pendant l’édition. Aucun nouveau numéro généré par le navigateur, aucune renumérotation des pièces existantes. Le format actuellement activé est {sequence}, sans remise à zéro ; les autres formats ci-dessous restent le modèle cible.

La numérotation métier est entièrement configurable dès le départ.

L’identifiant technique PocketBase reste indépendant et immuable.

Entités configurables :

- CRM ;
- devis ;
- commandes clients ;
- projets ;
- demandes d’achat ;
- commandes fournisseurs ;
- réceptions ;
- BL ;
- factures ;
- avoirs ;
- tickets SAV ;
- interventions ;
- autres documents numérotés.

Paramètres :

```text
préfixe
suffixe
pattern
séparateur
padding
prochaine valeur
règle de reset
```

Tokens autorisés :

```text
{YYYY}
{YY}
{MM}
{SEQ}
{CRM}
{REV}
```

Exemples :

```text
FAC-{YYYY}-{SEQ}
→ FAC-2026-00208

{CRM}-{SEQ}
→ 11450-1
```

Les numéros déjà émis ne changent jamais lorsque la configuration évolue.

### Anciennes références

Horizon peut conserver plusieurs références historiques pour une même pièce.

Exemple :

```text
FAC-2026-00208
ancienne référence : 20260208
```

Les anciennes références :

- restent recherchables ;
- restent liées au même record technique ;
- peuvent être affichées en option.

Paramètre d’affichage :

```text
Afficher l’ancienne référence : oui / non
```

Présentation recommandée :

```text
FAC-2026-00208
(20260208)
```

L’ancienne référence est affichée en information secondaire / grisée.

## 18.4 Ventes

- durée de validité devis ;
- listes tarifaires ;
- règles de remise ;
- conditions commerciales ;
- conditions de paiement par défaut.

## 18.5 Achats

- délais / conditions par défaut ;
- paramètres d’approvisionnement.

Aucun paramètre RFQ n’est prévu.

## 18.6 Produits & Stock

- catégories ;
- unités ;
- politiques de stock ;
- réapprovisionnement ;
- entrepôts ;
- emplacements ;
- types de suivi ;
- règles de lots / séries.

Les valeurs structurelles `service`, `equipment`, `consumable` restent contrôlées.

## 18.7 Projets

- modèles de phases ;
- jalons types ;
- types de recette ;
- types de livrables ;
- checklist de clôture ;
- règles de création / rattachement projet.

## 18.8 Planning & Temps

- calendriers ;
- jours fériés ;
- types de travail ;
- localisations ;
- capacités par défaut ;
- règles de surcharge.

Types initiaux :

```text
BE
Production
SAV
Maintenance
Support
```

## 18.9 Finance / TVA

### TVA

TVA CVS par défaut :

```text
20 %
```

Cette valeur est proposée automatiquement sur les produits et documents standards en France.

Horizon doit néanmoins supporter les cas généraux :

```text
20 %
10 %
5,5 %
2,1 %
0 %
exonération
intracommunautaire
autoliquidation
export hors UE
achat
vente
```

Gestion de codes TVA datés.

Exemple :

```text
code                TVA20
label               TVA 20 %
rate                20 %
country / zone      FR
operation_type      sale / purchase
valid_from
valid_to
account_collected
account_deductible
active
```

Un produit possède un code TVA par défaut.

La TVA réellement appliquée est déterminée selon le contexte :

```text
Produit
+
Client / Fournisseur
+
Pays
+
Type opération
+
Date
↓
TaxService
```

Un code TVA déjà utilisé ne doit pas être réécrit rétroactivement : créer une nouvelle version / période de validité.

## 18.9.1 Taux de change BCE

Source :

```text
BCE / ECB
```

Horizon synchronise et conserve l’historique quotidien.

Pour un document en devise :

```text
draft
→ dernier taux BCE proposé
→ actualisation possible

validation
→ taux figé
→ date du taux conservée
→ source BCE conservée
```

Chaque document possède son propre snapshot.

Champs visibles lorsque pertinent :

```text
currency
exchange_rate
exchange_rate_date
exchange_rate_source

tax_exchange_rate
tax_exchange_rate_date
tax_exchange_rate_source
```

La source reste BCE pour les deux usages.

### Autres paramètres Finance

- devises ;
- taux de change ;
- modes de règlement ;
- échéances ;
- comptes ;
- journaux ;
- mapping Sage ;
- mapping TVA Horizon ↔ Sage ;
- analytique.

## 18.10 Documents

- modèles ;
- versions ;
- CGV ;
- annexes ;
- signatures visuelles ;
- pieds de page ;
- langues.

## 18.11 SAV

- priorités ;
- types de tickets ;
- types de garanties ;
- modèles d’intervention ;
- plans de maintenance.

Les statuts structurels restent contrôlés par Horizon.

## 18.12 Notifications

- préférences par type ;
- in-app ;
- e-mail ;
- règles obligatoires éventuelles.

## 18.13 Imports

- migration Odoo ;
- profils Excel fournisseurs ;
- mappings colonnes ;
- règles de matching ;
- historique imports.

## 18.14 Intégrations

- Microsoft 365 SMTP / OAuth délégué ;
- Microsoft Graph (autres usages futurs) ;
- Sage ;
- SUPER PDP ;
- Gotenberg ;
- autres providers futurs.

Les secrets ne sont jamais affichés en clair après enregistrement.

## 18.15 API externe

Administration des clients API :

- nom ;
- description ;
- propriétaire / usage ;
- actif ;
- expiration ;
- génération de clé API ;
- rotation ;
- révocation ;
- restriction IP ;
- rate limit ;
- dernière utilisation.

## Génération de clé API

La clé est générée directement par Horizon.

Flux :

```text
Créer client API
→ configurer les permissions
→ Générer une clé
→ afficher la clé une seule fois
→ copier / conserver côté intégration
→ Horizon ne conserve ensuite que son hash
```

Exemple de représentation :

```text
hz_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Le préfixe permet d’identifier qu’il s’agit d’une clé Horizon et éventuellement son environnement.

La clé complète n’est plus récupérable après fermeture de l’écran.

En cas de perte :

```text
rotation
→ nouvelle clé
→ ancienne clé révoquée ou période de recouvrement contrôlée
```

Pour chaque client :

```text
ressource
action
champs lecture
champs écriture
périmètre de données
```

Exemple :

```text
contacts.people
read
[id, first_name, last_name, email, company]
```

Une interface d’aperçu doit montrer exactement ce que le client API peut lire / modifier.

## 18.16 Archivage

- politiques par type ;
- délai d’archivage ;
- durée de conservation ;
- purge autorisée ou non ;
- legal hold.

## 18.17 Audit & Système

- journal d’audit ;
- santé intégrations ;
- erreurs récentes ;
- tâches planifiées ;
- version Horizon ;
- informations environnement.

## Statuts

Les statuts système critiques ne sont pas librement créables.

Configuration éventuellement autorisée :

```text
label
couleur
ordre
```

selon le domaine.

La structure et les transitions restent contrôlées par Horizon.

---

# Fonction transverse — Activity Feed

Les principales fiches Horizon affichent un fil d’activité.

Page transverse `/activity` (16 octobre 2026) : accès depuis Espace de travail et le résumé du dashboard, qui garde six événements. Vues Équipe (toutes les fiches autorisées), Mon activité (publications dont l’utilisateur est auteur et événements des tâches qui lui sont assignées), Mes mentions (mentions enregistrées côté serveur, sans nouveau statut lu/non lu). Recherche dans le texte, l’auteur, la référence/titre de fiche et l’objet/adresses des e-mails projetés. Filtres simultanés multisélection Modules / Type d’activité, période glissante 7/30/90/365 jours ou tout l’historique, 30 jours par défaut ; types Modifications / Commentaires / E-mails / Documents / Tâches / Événements. Documents inclut aussi les publications avec pièces, y compris e-mail. Regroupement module/type/jour et ordre récent/ancien, critères conservés dans l’URL ; pagination 20 événements. Les comptages et groupes portent uniquement sur les événements accessibles après contrôle de la fiche source ; sources supprimées/invalides ignorées. Limite explicite de 10 000 candidats par période, au-delà demander une période plus courte sans tronquer silencieusement. Rafraîchissement manuel et toutes les 30 secondes. Réutilisation du rendu Activity existant, des miniatures et blocs de correspondance 65 % desktop / 100 % mobile ; pas de publication ou modification directe depuis le fil global, les actions restent dans la fiche. Lien source ouvrant le gestionnaire de fiches partagé lorsqu’un adaptateur existe, sinon la page métier.

Il permet de voir :

- changements significatifs ;
- ancien / nouveau statut lorsque pertinent ;
- auteur ;
- date / heure ;
- notes ;
- messages internes ;
- documents ajoutés ;
- mentions `@utilisateur` ;
- tâches assignées.

Une note peut mentionner un ou plusieurs utilisateurs.

Une mention génère une notification.

Une note peut être transformée en tâche avec :

- responsable ;
- échéance ;
- priorité ;
- statut ;
- rappel.

Statuts initiaux :

```text
todo
in_progress
blocked
done
cancelled
```

Une tâche peut être :

```text
personnelle
liée à une affaire
liée à un document
liée à un projet
```

Le fil métier ne remplace pas l’audit de sécurité.


---

# Fonction transverse — Recherche globale

Une barre de recherche unique permet de chercher dans les domaines autorisés.

Recherche possible par :

- code CRM ;
- nom client / fournisseur ;
- contact ;
- référence produit ;
- fabricant / référence fabricant ;
- devis ;
- commande ;
- BL ;
- facture ;
- projet ;
- texte documentaire indexé lorsque pertinent.

Les résultats affichent le type d’objet, son identifiant et son contexte.

---

# Fonction transverse — Notifications

Types d’événements initiaux :

- mention ;
- tâche assignée ;
- tâche à échéance ;
- approbation requise ;
- échéance AO ;
- devis à relancer ;
- retard achat ;
- retard livraison ;
- facture échue ;
- erreur d’intégration critique.

Canaux :

```text
in-app
email optionnel
```

L’utilisateur peut configurer ses préférences dans les limites imposées par les règles obligatoires.

---

# Fonction transverse — Pilotage analytique

La fiche d’un compte analytique doit présenter une synthèse économique.

Lecture standard :

```text
prévu
engagé
réalisé
facturé
payé
```

KPI :

- CA estimé ;
- CA commandé ;
- CA facturé ;
- encaissements ;
- achats budgétés ;
- achats engagés ;
- réceptions ;
- factures fournisseurs ;
- paiements fournisseurs ;
- heures BE prévues / réelles / coût ;
- heures Production prévues / réelles / coût ;
- dépenses ;
- stock consommé ;
- marge prévue ;
- marge actuelle ;
- marge finale.

---

# Fonction transverse — International / multi-devise

Les adresses, documents et transactions doivent supporter :

- pays ;
- langue ;
- devise ;
- Incoterm ;
- identifiants fiscaux ;
- TVA selon contexte ;
- taux de change daté.

---

# Fonction transverse — Archivage

Les objets métier possèdent une politique d’archivage selon leur nature.

Une politique définit notamment :

- moment d’archivage ;
- durée minimale ;
- possibilité de purge ;
- restrictions de purge ;
- conservation des pièces jointes.

Les durées exactes sont paramétrables et validées avec les exigences légales / contractuelles applicables.


---

# Fonction transverse — API externe

Horizon expose une API contrôlée pour des applications / services externes.

## Gestion des clients

Un client API est distinct d’un utilisateur humain.

Exemples :

```text
Application mobile externe
BI
site web
outil client
automatisation
```

## Cycle de vie de la clé

Actions administrateur :

```text
Générer
Copier
Renouveler / Rotate
Révoquer
Définir une expiration
```

À la génération, Horizon affiche :

```text
Nom client
Préfixe
Clé complète
Date création
Expiration éventuelle
```

La clé complète est visible **une seule fois**.


## Permissions

Chaque client possède des policies explicites.

Exemple :

```text
contacts.people
├── list : oui
├── read : oui
├── create : non
├── update : non
└── fields read :
    ├── id
    ├── first_name
    ├── last_name
    ├── email
    └── company
```

Les champs non listés ne sont jamais retournés.

## Écriture

En écriture, seuls les champs autorisés peuvent être fournis.

Les autres champs sont rejetés, pas ignorés silencieusement.

## Traçabilité

Chaque appel est identifiable via un `request_id`.

L’administrateur peut consulter :

- dernier accès ;
- volume ;
- erreurs ;
- endpoints utilisés ;
- révocations / rotations.

## Version

L’API est versionnée :

```text
/api/external/v1/
```

Une évolution incompatible crée une nouvelle version plutôt que de casser les intégrations existantes.


### Synthèse et navigation Contacts — révision visuelle du 5 octobre 2026

Le répertoire affiche les totaux actifs Contacts / Sociétés / Clients / Fournisseurs autorisés par `contacts.read`. Clients et Fournisseurs comptent les relations actives vers une société active ; une société peut apparaître dans les deux catégories. Totaux calculés côté PocketBase, pas à partir des 25 lignes affichées. Une erreur de chargement présente un message et Réessayer, sans inventer un zéro.

La fiche société sépare Informations, Relations (contacts associés / adresses complémentaires), Notes et Enrichissement Pappers en onglets. La fiche personne propose Informations et Notes. Les saisies restent conservées entre onglets ; le bouton Enregistrer fonctionne aussi depuis Notes. Les coordonnées principales sont résumées sous l’identité et les boutons métier restent au-dessus des onglets. Logos proportionnels et portraits recadrés sont traités séparément.

Les cartes présentent désormais la ville et le pays de l’adresse principale du siège, ou de l’unique adresse de siège. Aucun choix arbitraire lorsqu’il existe plusieurs sièges sans principal. Pour une personne, il s’agit du siège de sa société associée. Les libellés pays viennent du référentiel partagé ; à défaut de disponibilité du libellé, le code enregistré reste affiché. Les badges en bas présentent les relations commerciales effectives.


### Navigation du compte et recherche Contacts — 5 octobre 2026

Top bar persistante et recherche contextuelle unique sur les répertoires sociétés / personnes. Filtre `q` conservé entre cartes et liste et au rechargement, pagination réinitialisée lorsque le terme change. Recherche des espaces sur les autres écrans. Menu utilisateur : consultation personnelle `/account` (nom, e-mail, rôle en lecture seule), Paramètres et déconnexion avec purge de la session. Aucun nouveau droit ni formulaire d’administration de compte.

Le sélecteur de recherche permet de passer du contexte de la page à la recherche globale des espaces Horizon. Le contexte local est rétabli à chaque navigation. La vue d’ensemble Paramètres utilise également le filtre `q` de la top bar. La recherche globale des enregistrements métier de tous les modules reste hors du périmètre implémenté.

Décision utilisateur du 5 octobre 2026 : les sociétés disposent uniquement de Client / Fournisseur, cumulables. Les autres relations sont retirées du périmètre. Deux cases à cocher indépendantes dans l’en-tête ; identité et coordonnées regroupées dans un panneau avec séparation légère, densité verticale réduite et présentation adaptée au mobile. La base utilisateur est indiquée sans données historiques à reprendre.

Correction du parcours de création : les cases Client / Fournisseur sont visibles dès Nouvelle société. Les choix sont conservés localement avant Enregistrer, puis le service sauvegarde la société, ses relations et l’adresse éventuelle. En cas d’échec partiel, l’erreur indique le lot restant, conserve la saisie et l’identifiant créé pour reprendre sans doublon. Les relations existantes sont relues avant reprise et seules les différences sont écrites.

Présentation des fiches : surface blanche continue, relations sous le nom, onglets intégrés et sections séparées par des traits fins ; largeur maximale de 1180 px. Cette évolution est visuelle et conserve la création avec relations, reprise après erreur, adresses et archivage.

Révision selon la référence utilisateur : création sans grand bandeau ni onglets, titre / actions en tête, logo et choix commerciaux intégrés au bloc Identité, blocs distincts Coordonnées / Adresse / Informations légales / Préférences / Notes. Notes directement disponibles à la création. Consultation et édition des fiches enregistrées conservent résumé, raccourcis et onglets. Aucun changement métier ou backend pour ce gabarit.

Dans la fiche personne, la recherche des sociétés disponibles est intégrée au menu Société. Le choix conserve son libellé à la fermeture du menu, même si la société sélectionnée est hors de la première page de résultats.

Clarification visuelle du 5 octobre 2026 : la maquette sert de référence de style. Création et fiche enregistrée partagent les mêmes blocs de saisie et placement du logo / des relations. Les fonctions propres aux fiches existantes (statut, archivage, relations associées, enrichissement, raccourcis métier) sont conservées. Les actions e-mail / appel / site sont intégrées au bloc Coordonnées sans second affichage des valeurs.

Bouton Enregistrer — 5 octobre 2026 : les formulaires Contacts, adresses et référentiels refusent une soumission sans changement. Le bouton devient primaire et disponible pour les champs modifiés, changements de logo / photo ou rôles préparés à la création. Annuler une modification en restaurant la valeur d’origine remet le bouton au repos ; une sauvegarde réussie fait de même. Un échec partiel de création garde la possibilité de terminer la sauvegarde. Les relations Client / Fournisseur exigent également le clic sur Enregistrer.

Sauvegarde explicite — règle finale du 5 octobre 2026 : toutes les modifications des formulaires restent locales jusqu’au bouton Enregistrer. La fiche société sauvegarde ses champs, image, relations Client / Fournisseur et adresse du siège dans le même parcours explicite ; les reprises après échec partiel sont conservées. La sélection Pappers préremplit la fiche sans écrire ; la sauvegarde ordinaire Contacts persiste les valeurs. Les relations commerciales affichées dans une fiche personne sont en lecture seule et se modifient dans la société.

Clarification rattachement contact — 5 octobre 2026 : le champ Société d’une fiche personne reste modifiable. Changer la sélection prépare un nouveau rattachement ; Enregistrer met à jour le contact. Celui-ci disparaît alors des contacts associés de l’ancienne société et apparaît dans ceux de la nouvelle. Les cases Client / Fournisseur affichent les qualifications de la société associée ; leur lecture seule dans la fiche personne ne concerne pas le champ Société.

Archivage — 5 octobre 2026 : confirmation explicite dans une fenêtre demandant le mot ARCHIVER exact. Aucune mutation avant la validation ; saisie incorrecte, Annuler et Échap ne modifient rien. Application aux sociétés / personnes actuellement archivables, composant commun prévu pour les futures pièces. Gestion des permissions et archivage en base inchangés.


Recherche d’entreprises — décision finale du 5 octobre 2026 : Pappers et son onglet sont remplacés par le bouton « Rechercher sur le web » dans l’en-tête du bloc Identité (placement révisé le 6 octobre). Nom / SIREN / SIRET sont interrogés directement depuis le navigateur auprès de l’API publique de l’État. La sélection préremplit le formulaire sans écriture ; Enregistrer utilise la sauvegarde Contacts ordinaire. Cette règle remplace les descriptions historiques d’enrichissement ci-dessus.


Actions de fiche — décision du 5 octobre 2026 : un bouton engrenage « Actions de la fiche » à droite d’Enregistrer regroupe Dupliquer, Archiver (ou Réactiver) et Supprimer. Ces actions concernent les sociétés et personnes enregistrées. Les actions restent indisponibles pendant une opération ou si une fiche active a des modifications non enregistrées, pour préserver le brouillon.

Dupliquer ouvre une nouvelle fiche locale : informations générales, relations Client / Fournisseur et adresse principale pour une société ; coordonnées et rattachement société pour une personne. Les identifiants légaux de société (SIREN, SIRET, TVA, identifiant fiscal) sont vidés ; aucun identifiant de ligne, fichier, contact associé, adresse complémentaire ou pièce n’est dupliqué. Seul Enregistrer crée la copie.

Archiver conserve les données et relations : confirmation orange exigeant exactement ARCHIVER. Supprimer est définitif : confirmation rouge exigeant exactement SUPPRIMER. Toute relation entrante d’une autre fiche ou pièce, même archivée et même inaccessible à l’utilisateur, interdit la suppression ; message explicite proposant l’archivage. Les contacts associés bloquent aussi la suppression d’une société. Seuls ses rôles commerciaux et adresses propres sont supprimés avec une société inutilisée, dans une transaction auditée.


Profil société / Comptabilité — livraison du 5 octobre 2026 : nouvelles sociétés proposées en Français (`fr`) et EUR, choix modifiables. Les préférences des sociétés existantes sont conservées. Le numéro RCS remplace l’identifiant fiscal dans Informations légales ; l’ancienne valeur fiscale reste stockée à titre historique et n’est jamais recopiée en RCS.

La recherche publique propose les numéros TVA actifs fournis par la DGFiP via le champ `tva` de l’API. Un seul numéro : case de reprise habituelle ; plusieurs numéros : choix explicite dans une combobox. Aucun calcul de TVA depuis le SIREN. Une TVA absente ne vide pas la fiche. Le contrat public ne fournit pas de RCS : saisie manuelle conservée.

Onglet Comptabilité après Relations sur une société enregistrée, également disponible en création après Informations. Deux comptes simples facultatifs (client, fournisseur), exemples 411100 / 401100, sans génération de numéro ni grand livre. Préparation de la facturation électronique : e-mail de facturation, adresse électronique de routage, plateforme agréée du tiers, code service destinataire et état de préparation (À vérifier / À compléter / Informations renseignées / Non concerné). Cet état est une déclaration locale, pas une validation de l’annuaire ou un statut de transmission. SUPER PDP reste la plateforme Horizon prévue ; la plateforme du destinataire peut différer.

Tout appartient au brouillon de la fiche et seul Enregistrer persiste. Sauvegardes successives société, relations, adresse puis comptes ; un échec comptable conserve l’identifiant société et la saisie, avec reprise différentielle sans créer de copie. Les références de commande / engagement propres à une facture seront portées par les pièces, pas par la fiche société. La distinction compte général / auxiliaire reste prévue pour le futur module Comptabilité ; la saisie simple est retenue provisoirement en l’absence de réponse au choix proposé.


LEI — ajustement de la fiche société (5 octobre 2026). Le champ LEI remplace le RCS dans les informations légales, à la demande de l’utilisateur. Il reste facultatif ; normalisation en majuscules et contrôle de format sur 20 caractères alphanumériques à la sauvegarde. Les valeurs RCS et identifiant fiscal historiques sont conservées sans conversion. La recherche publique d’entreprises ne renseigne pas le LEI. Ce contrôle de format ne vérifie ni l’existence ni le statut du LEI dans un registre.


### Cloche et recherche de logos — 5 octobre 2026

Topbar : cloche avant le menu utilisateur, badge rouge du nombre réel de notifications non lues (99+ au-delà de 99, masqué à zéro). Panneau des 30 dernières notifications, état vide, erreurs explicites et action individuelle « Marquer comme lue ». Rafraîchissement toutes les 30 secondes, au retour au premier plan et à l’ouverture ; pas de données fictives dans l’application. Les événements métier producteurs restent à intégrer au fur et à mesure des modules : cette livraison fournit la boîte de réception, pas des alertes métier inventées.

Société : loupe à la place de l’appareil photo dans la zone logo. Popup « Rechercher un logo », nom prérempli avec le suffixe logo, recherche explicite par mots-clés, filtres PNG / JPEG / WebP / tous formats, grille d’images, sélection et aperçu, lien source, bouton « Utiliser ce logo ». Source initiale Wikimedia Commons sans clé, périmètre plus limité qu’une recherche web générale. Import local conservé par clic sur le carré, le libellé ou l’action du popup. La validation prépare un fichier local dans le brouillon ; seul Enregistrer écrit dans PocketBase. Annuler conserve la fiche telle quelle. Avatars personnes inchangés. Une intégration de recherche web plus large avec clé reste une option à confirmer par l’utilisateur.


### Fil d’activité complet — Sociétés et Contacts

Le fil reste sous la fiche enregistrée, après les onglets et leurs panneaux ; absent avant la première création. Chronologie inverse, auteur, date/heure, résumé et détails ancien/nouveau repliables. Les modifications d’une sauvegarde société sont regroupées : identité, coordonnées, logo, notes internes, langue/devise, informations légales, Client/Fournisseur, adresse et comptes tiers. Le changement de société d’une personne est tracé par noms lisibles. Une mise à jour sans changement métier ne crée pas de bruit dans le fil.

Commentaires en texte, pièces jointes, choix explicite de collègues via @ ou bouton Mentionner, publication par bouton Publier distinct de la sauvegarde de la fiche. Rien n’est écrit pendant la saisie d’un commentaire ou la sélection de fichiers. Dix mentions au maximum ; les destinataires doivent être actifs et pouvoir lire Contacts. Une mention génère une notification interne sauf si l’auteur se mentionne lui-même. La cloche permet d’ouvrir la fiche au niveau du fil. La lecture de sa notification renseigne aussi la mention correspondante.

Tâches : création directe depuis le rédacteur ou conversion d’une note existante ; titre, responsable actif, échéance facultative, priorité basse/normale/haute. Statuts À faire / En cours / Bloquée / Terminée / Annulée, bouton Terminer et réouverture par changement de statut. L’auteur/horodatage de chaque changement sont tracés ; completed_at est imposé côté serveur. Une tâche assignée à un autre collègue produit une notification. La note originale et ses pièces restent conservées lors de la conversion. Titre/description de la tâche publiée sont immuables dans cette livraison ; les changements d’état sont disponibles dans le fil.

Filtres Tout / Modifications / Commentaires / Documents / Tâches, pagination de 20 événements, actualisation manuelle et toutes les 30 secondes. Fiches archivées : lecture seule du fil et des tâches. Historiques non supprimés avec les fiches ; leur accès métier et les fichiers deviennent indisponibles quand la source n’existe plus. Les migrations reprennent les audits métier historiques exploitables des fiches encore présentes, avec leurs dates et auteurs ; les anciens audits ne permettent pas de reconstruire une ancienne opération commune, ils restent séparés.


Commentaires et fichiers — finition : les commentaires publiés sont présentés dans une bulle blanche discrète. Chaque fichier publié propose une corbeille aux utilisateurs disposant de contacts.write sur une fiche active. La suppression nécessite de saisir SUPPRIMER dans la confirmation rouge commune ; Annuler ne modifie rien. Elle retire uniquement ce fichier, conserve le commentaire, son auteur, sa date et ses mentions, et ajoute un événement de suppression avec nom du fichier/auteur/date. Les autres fichiers restent accessibles. Si une publication sans texte perd sa dernière pièce jointe, elle reste visible avec une indication de retrait. Les fichiers sélectionnés dans le brouillon restent retirables avant publication sans écriture en base.


Recherche d’images — Wikimedia + Google/collage : le popup propose Google Images en premier, actif par défaut, et Wikimedia en second ; chaque onglet affiche son propre parcours. Le bouton ouvre une fenêtre séparée avec les mots-clés actuels et le filtre de format ; société : nom + logo, image générique/produit : mots-clés sans suffixe logo. L’utilisateur copie l’image elle-même dans Google, revient dans Horizon et colle via ⌘ V / Ctrl V dans la zone prévue ; aperçu local, retrait, Annuler ou Utiliser. Une seule image PNG/JPEG/WebP de 2 Mio maximum ; contenu vérifié par décodage avant validation. Le presse-papiers est reçu uniquement sur un collage explicite, sans demande de lecture générale. Annuler abandonne la sélection. Le fichier choisi reste dans le brouillon jusqu’à Enregistrer. Composant partagé prêt pour les futures images produits ; actuellement branché aux logos sociétés, le module Produits n’étant pas encore implémenté.


Recherche d’images : Wikimedia et Google/collage sont désormais deux onglets distincts. Google est actif à chaque ouverture. Un seul choix à la fois ; basculer abandonne la sélection locale, pas les mots-clés. L’aperçu Google est intégré à la zone de collage et masque les étapes une fois l’image prête. La sauvegarde reste explicitement celle de la fiche.

### Onglets Contacts et Adresses de la société — 6 octobre 2026

Navigation actuelle : **Informations → Contacts → Adresses → Comptabilité → Notes**. Contacts remplace Relations et présente toutes les personnes rattachées à la société, avec accès à leur fiche et création d’un contact associé. Les rôles Client / Fournisseur demeurent dans Informations. Adresses regroupe siège, livraison, facturation, autres adresses et e-mails. Cartes par usage, libellé libre, édition des coordonnées et choix de l’adresse principale pour chaque usage. Une ligne peut porter uniquement un e-mail, une adresse postale ou les deux. L’e-mail de facturation déjà saisi est aussi accessible ici sans doublon en base. L’e-mail général reste uniquement dans Informations et ne crée pas de carte ni de compteur dans Adresses.

Ajouter ou modifier une adresse active Enregistrer en haut ; aucun bouton intermédiaire n’écrit en base. Les brouillons persistent lors du changement d’onglet. On peut retirer une nouvelle adresse du brouillon ; les adresses enregistrées restent conservées. Sur une nouvelle société, enregistrer d’abord la fiche pour accéder aux répertoires Contacts / Adresses. Les lecteurs et les sociétés archivées consultent ces répertoires sans actions d’édition. La sauvegarde depuis Adresses conserve cet onglet après succès et rechargement.


Contacts associés — filtre d’archives : afficher Actifs / Archivés avec le nombre d’archives uniquement si la société possède au moins un contact archivé. Filtre compact dans l’en-tête, à côté d’Ajouter un contact, police Inter commune et sélection soulignée discrètement ; aucune case à cocher isolée. Le filtre consulte les données sans écriture et revient à la première page lors d’un changement. Présentation responsive et disponible aux lecteurs autorisés.

### Mode clair / sombre

Bouton lune / soleil dans la top bar, à droite de la recherche et à côté des notifications / du compte. Bascule immédiate pour toute l’interface : Dashboard, Contacts, Adresses, Paramètres, champs, tableaux, menus, popups et fil d’activité. Choix mémorisé pour ce navigateur, conservé au rechargement et synchronisé entre onglets ouverts ; mode clair initial sans préférence. Aucune sauvegarde métier ni modification des brouillons. Les logos restent entiers sur fond blanc. Sur mobile, top bar fixe à deux lignes compactes : actions en haut et recherche centrée sur toute la largeur en dessous.

Répertoire Contacts : filtre de relation commerciale Toutes / Clients / Fournisseurs dans la recherche contextuelle, sur Sociétés et Personnes. Les doubles rôles correspondent aux deux filtres ; seules les relations commerciales actives sont prises en compte. Les personnes suivent la relation de leur société associée. Le critère se combine avec l’état Actifs / Archivés et la recherche, est conservé dans l’URL et remet la pagination à la première page lorsqu’il change.

Contacts — regroupements et vues : répertoire regroupable par pays du siège ; personnes également par société. Totaux complets par groupe, 25 fiches par page ; tri serveur à l’intérieur des groupes. Les vues enregistrées conservent recherche, filtres, groupe, tri et cartes/liste par contexte sociétés/personnes. Un utilisateur autorisé à lire le module peut créer une vue personnelle ou la déclarer globale. Les globales sont utilisables par tous les lecteurs du module ; seul le créateur et les administrateurs des vues peuvent modifier/supprimer. Les personnelles sont visibles au propriétaire et aux administrateurs pour gestion. Aucune modification de fiche lors d’un choix ou de l’application d’une vue.

Navigation des fiches Contacts — 6 octobre 2026 : compteur ordinal « 1 / 45 » en haut à droite, en face d’Accueil > Contacts, et flèches précédente / suivante. Disponible pour sociétés et personnes enregistrées ; absent en création. Résultats et ordre de la liste d’origine conservés dans l’onglet courant, franchissement des pages serveur inclus. Sans contexte : toutes les fiches du même état actif / archivé, tri par nom. Limites sans boucle, flèches désactivées au premier / dernier résultat. Si une fiche sort du filtre après modification ou archivage : « Hors filtre · N », aucune destination inventée. Un brouillon déclenche « Quitter sans enregistrer ? » avant le changement par flèche ; Rester le conserve, Quitter l’abandonne sans écriture. Flèches indisponibles pendant la sauvegarde.

Défilement sans flash : le changement par flèche attend les lectures nécessaires avant de quitter la fiche actuelle. La fiche reste visible, ses interactions sont suspendues pendant cette courte attente ; aucune sauvegarde automatique. Un échec de lecture de la cible garde la fiche actuelle et ses modifications. La validation d’un brouillon avant départ reste obligatoire.

Raccourcis contextuels — 6 octobre 2026 : remplace le bandeau historique « À venir » au-dessus du formulaire. Une barre compacte entre fil d’Ariane et compteur de fiches propose seulement les liens liés au contexte. Sur une société cliente : Devis / Commandes / Factures / Livraisons / Opportunités ; fournisseur : Achats / Réceptions / Factures fournisseurs ; les deux rôles cumulent ces familles. Rôles enregistrés et actifs uniquement ; la création sans identifiant n’affiche pas de statistiques métier. Depuis une personne, les raccourcis portent explicitement sur sa société enregistrée.

Contacts et Adresses sont retirés de la barre métier : leurs vrais nombres sont affichés dans les onglets correspondants de la société, sans accès dupliqué dans l’en-tête. Changer de section dans la fiche conserve le brouillon sans écrire ; les liens profonds `?section=contacts` / `?section=addresses` sont conservés au rechargement. Le contexte du répertoire reste attaché aux changements de section. Les compteurs intermodules et leurs listes filtrées ne sont pas encore exécutables, car Ventes / CRM / Facturation / Achats / Stock ne sont pas livrés ; les entrées contextuelles restent désactivées avec un tiret et le module manquant expliqué au survol. À leur livraison, chaque compteur devra avoir une destination portant le même périmètre société / produit / état et respecter les permissions du module. Ce contrat remplace les boutons identiques sur toutes les pages ; aucun écran Produits ni devis simulé n’est livré dans ce lot.

Recherche unifiée du répertoire Contacts — 6 octobre 2026 : contexte Contacts initial, résultats affichés sous Sociétés ou Personnes dans la liste existante. Bascule vers l’autre type uniquement si le type courant ne contient aucun résultat et l’autre au moins un, sous les mêmes critères recherche / relation commerciale / archives. Les deux types avec résultats ou tous deux vides conservent l’onglet courant. Choisir un onglet pendant une recherche ou un périmètre explicite Sociétés / Personnes suspend la bascule ; choisir Contacts la réactive. Présentation, critères compatibles et texte conservés. Aucune écriture de fiche ni évolution PocketBase.

## CRM — premier lot classique réalisé le 6 octobre 2026

Périmètre utilisateur validé : opportunités classiques d’abord, appels d’offres ensuite. `/crm` propose Kanban et liste ; recherche unique dans la top bar par titre, numéro ou société, filtres État / Archives et tri partagé. Les critères de société et responsable sont également supportés par URL. Pagination de 100 fiches, affichée dans la barre supérieure ; les en-têtes de colonne donnent le nombre et le montant estimé de toutes les opportunités filtrées, calculés côté serveur, avec un montant distinct par devise. Les cartes restent paginées.

Fiche : titre, société obligatoire, contact facultatif appartenant à cette société, responsable autorisé à lire le CRM, étape, montant / coût estimés, devise EUR initiale, probabilité, échéance et description. Société / personne restent les référentiels Contacts ; changer de société remet le contact à vide. État commercial Ouverte / Gagnée / Terminée / Perdue / Annulée dérivé de l’étape côté serveur ; archivage distinct. Marge affichée en aperçu et recalculée côté serveur à la sauvegarde.

Six étapes initiales modifiables : Nouveau, Qualifié, Gagné, Terminé, Perdue, Annulé. Les libellés, ordre, activation et tons de marque sont configurables via Paramètres → CRM / Étapes CRM avec `settings.references`. Codes immuables et aucune suppression d’étape. Une étape inactive déjà liée reste lisible ; elle ne reçoit plus de nouveaux rattachements.

Numéro d’affaire et compte analytique alloués ensemble côté serveur. Séquence initiale `00001`, paramétrable avant utilisation ; aucun numéro saisi ou généré par React. Duplication crée un nouveau numéro et un nouveau compte, réouvre l’opportunité et ne copie pas son fil. Sauvegarde explicite dans le formulaire de fiche. Dans le Kanban, le dépôt à la souris ou au clavier enregistre immédiatement la nouvelle étape via le service CRM et les validations serveur. Aucun bouton Enregistrer ni lot de déplacements à confirmer. Un conflit concurrent refuse le changement ; la vue est relue et l’erreur reste visible.

Le fil réutilise commentaires, PJ protégées / suppression confirmée, mentions, tâches et historique. Archivage par saisie ARCHIVER, réactivation dans le menu de fiche. La suppression d’une affaire possédant son compte analytique est refusée côté serveur ; l’archivage conserve la traçabilité et ne constitue pas une clôture comptable. Les raccourcis Opportunités des sociétés clientes affichent le nombre réel d’opportunités ouvertes et ouvrent la liste filtrée.

Non inclus dans le premier lot CRM classique (AO ajouté ensuite, voir section 5) : intégration e-mail, activités commerciales spécialisées Appel / Rendez-vous, vues CRM enregistrées et regroupements personnalisés, transitions vers devis / commandes / projets et comptabilité financière. Les vues enregistrées Contacts existantes restent inchangées. La navigation entre fiches porte sur la page courante de la liste ; utiliser la pagination pour changer de page.


CRM — révision du 6 octobre 2026 : colonnes repliables conservant titre, nombre et totaux, présentation ouverte avec séparations fines, cartes ≥ 280 px. Glissement avec source estompée, emplacement destination selon le même ordre que les cartes et animation entre positions réelles ; mouvements réduits respectés. Menu clavier et sauvegarde automatique au dépôt conservés. Les colonnes fermées commercialement acceptent également des déplacements explicites pour corriger ou rouvrir une affaire ; le serveur applique l’état associé à l’étape. Terminé reste un état CRM, sans clôture de projet ou comptable automatique.

La fiche présente séparément Numéro (lecture seule, attribué à l’enregistrement), Titre, Type de marché et Étape. Le titre de page ne concatène plus numéro et nom. Types de marché facultatifs administrables dans Paramètres : Broadcast, Corporate, Institutionnel, Événementiel, Consulting, Export. Les listes partagées proposent Effacer même pour un choix obligatoire : le brouillon peut être vide, la sauvegarde reste bloquée par validation si une référence obligatoire manque. Description utilise l’éditeur Tiptap partagé : gras, italique, souligné, titres, listes, annuler / rétablir, compteur de caractères, lecture seule selon permissions. Les anciennes descriptions texte sont conservées et chargées sans interprétation HTML ; mise en forme enregistrée uniquement avec la fiche.

Kanban CRM : glissement dnd-kit validé par l’utilisateur, aperçu de destination par déplacement des cartes voisines, carte flottante et dépôt animé. Échap restaure la position avant glissement sans écriture. Survoler une colonne repliée avec une carte pendant 300 ms la déplie et mémorise son ouverture. Les colonnes repliées sont aussi des destinations. Le rang visuel n’est pas un ordre métier enregistré ; le tri de recherche reprend au rafraîchissement. Aucun changement de contrat PocketBase ; chaque changement d’étape reste transactionnel côté serveur.

CRM — 7 octobre 2026 : les cartes et la liste affichent les initiales du responsable (`owner`), avec son nom au survol, et le petit logo de la société cliente. Aucun affichage du créateur ni duplication de son identité. Les cartes n’ont plus de menu à double flèche ni de badge Gagné / Terminé : la colonne indique leur étape ; la liste conserve sa colonne d’état.

CRM — réglages dédiés du 7 octobre 2026 : Paramètres → CRM possède Présentation (vue initiale Kanban / Liste fixe ou Dernier état par utilisateur et navigateur), Étapes (six étapes fixes, noms, ordre et couleur) et Types de marché (noms, ordre, activation et couleur de tag). Référentiels conserve uniquement Pays / Langues / Devises ; les anciennes URL de référentiels CRM redirigent vers la page dédiée. Un clic sur le titre d’une colonne ouvre son réglage pour les utilisateurs disposant de settings.references. La liste affiche l’étape en tag de la même couleur que sa colonne. Plusieurs types de marché peuvent être sélectionnés et retirés dans le brouillon de la fiche, affichés comme tags dans la fiche et la liste ; ils sont enregistrés seulement avec la fiche. Une référence inactive liée reste lisible et retirable. Vue de départ appliquée quand aucun choix explicite n’est fourni dans l’URL ; changer de vue ne modifie pas le réglage global.


CRM — décision du 7 octobre 2026 : Nouveau, Qualifié, Gagné, Terminé, Perdue et Annulé constituent les six étapes fixes. Aucun ajout, suppression, désactivation ou changement de signification ; seuls les titres, couleurs et ordre sont personnalisables. Couleur libre #RRGGBB en complément des six tons Horizon pour étapes et marchés, commune aux colonnes et tags. Les anciennes étapes supplémentaires sont conservées inactives, leurs affaires reprises dans une des six étapes selon leur état commercial.

### Responsabilité Direction — 7 octobre 2026

Dans Employés, le champ Responsabilité propose Collaborateur, Manager ou Direction, indépendamment de l’intitulé du poste et du profil ERP. Direction peut encadrer des managers et des collaborateurs directement ; les liens explicites via le responsable principal dessinent l’organigramme Direction → Manager → Collaborateur. Aucune personne n’est rattachée automatiquement à toute la société. Une Direction ne peut dépendre que d’une autre Direction ; les cycles restent interdits. Badge navy Direction dans la liste, l’organigramme et Utilisateurs et accès, Manager violet conservé. Le changement de responsabilité requiert `hr.organisation.manage`. Réaffectation obligatoire avant retrait d’un responsable ayant des collaborateurs actifs, ou avant rétrogradation d’une Direction ayant des directions rattachées.

Direction n’octroie aucun droit Admin, aucune validation et aucun périmètre global implicite. Le périmètre collaborateurs directs peut être explicitement attribué à une Direction comme à un Manager ; il ne donne pas accès aux descendants indirects. La permission Employés avec périmètre global reste nécessaire pour consulter toute l’organisation. Nouvelle migration additive 1791331204, sans changement des responsabilités ou liens existants.

### Recherche commune Employés / Utilisateurs — 7 octobre 2026

Recherche unique dans la top bar sur Employés et Utilisateurs et accès, filtres dans son panneau commun : Équipe / Statut pour les ressources, Profil ERP pour les comptes. Recherche et critères sont conservés dans l’URL, au rechargement, au changement de présentation et à la fermeture des dialogues. Réinitialiser conserve le texte ; les pastilles permettent de retirer un critère. Même contrat Contacts / CRM, aucun champ dupliqué dans la page. Le filtre ne peut jamais élargir le périmètre autorisé par le serveur. Aucun changement de schéma ou de droits.

Présentation des listes Employés / accès — 7 octobre 2026 : le panneau transverse reprend les deux colonnes Filtres / Regrouper par et Trier par de Contacts. Employés : Équipe ou Responsabilité, tri nom / e-mail / poste ; Utilisateurs : Profil ERP ou Responsabilité, tri nom / e-mail. Les résultats sont réellement ordonnés et groupés dans le périmètre autorisé, sans changer de droits. Organigramme conserve sa hiérarchie réelle et masque le regroupement tabulaire, tout en conservant sa valeur pour le retour Liste. Les groupes Contacts / HR / accès partagent désormais leur composant visuel.

Vue Cartes Employés — 13 octobre 2026 : bascule partagée Cartes / Liste / Organigramme, Cartes par défaut ; `view=list` et `view=org` conservés dans l’URL, anciens liens `view=cards` compatibles. Liste et Cartes sont triées par défaut en A → Z sur le nom de famille, puis le prénom en cas d’égalité, selon la collation française ; un tri explicite choisi dans le panneau reste prioritaire. Cartes d’annuaire denses communes à Contacts : photo protégée ou initiales, nom, poste, équipe, coordonnées professionnelles, responsabilité, type de ressource et état. Toute la carte ouvre le même popup de consultation / édition, accessible au clavier ; le téléphone reste une action indépendante. Recherche, filtres, tri et regroupements partagés restent identiques à Liste, conservés lors des changements de vue, du rechargement et de la fermeture d’une fiche. Organigramme garde sa hiérarchie. Aucun nouveau droit, champ ou compte applicatif implicite.

### Équipes dans Employés — 7 octobre 2026

Onglet Équipes dans `/hr?tab=teams`, avec liste dense nom / managers et avatars / nombre de membres visibles / état / engrenage. Recherche, filtres Actives / Archivées / Toutes, regroupement État et tri nom dans la top bar commune. Création et édition par nom, sélection de plusieurs ressources actives Manager ou Direction ; aucun code saisi ou affiché. Gestion réservée aux Admin / Superuser ; les autres lecteurs Employés consultent selon les identités accessibles. Le nombre de membres reste celui des employés autorisés visibles, sans élargissement de périmètre.

Sauvegarde explicite, grisée sans changement. L’engrenage dans l’en-tête du popup d’édition propose Archiver ou Réactiver, sans action Supprimer / Dupliquer non livrée. Archivage avec confirmation orange et saisie ARCHIVER, conservant membres et managers ; nouvelles affectations à une équipe archivée refusées, rattachements existants conservés. Réactivation préparée dans l’éditeur puis enregistrée, managers revérifiés. Un manager d’une équipe active ne peut être inactivé ou perdre sa responsabilité avant d’être retiré des managers d’équipe. Désigner un manager d’équipe ne change ni sa hiérarchie principale ni ses accréditations.

Popup Équipe — 7 octobre 2026 : pas de badge d’état ni engrenage tant que la nouvelle équipe n’est pas enregistrée. À l’édition, badge de l’état courant à côté du titre de l’équipe ; engrenage dans l’en-tête, à côté de Fermer. Archiver reste accessible en présence de modifications non enregistrées ; la confirmation ARCHIVER précise dans ce cas leur abandon, et archive uniquement la version enregistrée. Réactiver prépare la modification, confirmée ensuite par Enregistrer. Pendant une sauvegarde / un archivage, les actions sont bloquées. Titre et badge alignés, sections compactes, boutons Annuler / Enregistrer à droite dans un pied fixe partagé.


Utilisateurs et accès / Tags — 7 octobre 2026 : onglets partagés Utilisateurs et Tags, sans rubrique supplémentaire dans la navigation Paramètres. Admin accède aux comptes et aux couleurs ; Superuser accède aux couleurs uniquement, sans lecture ni modification des comptes. Onglet Tags : deux zones Profils ERP (Admin, Superuser, User, Viewer) et Responsabilités (Direction, Manager, Collaborateur), aperçu et engrenage par ligne. Seule la couleur est administrable, via palette Horizon ou couleur personnalisée, avec Enregistrer actif uniquement après modification. Configuration globale en base, indépendante des permissions et responsabilités. Même composant `IdentityTag` pour Employés, organigramme et utilisateurs ; le sélecteur de managers des équipes utilise les mêmes couleurs. Recherche contextuelle Tags dans la top bar, sans filtres de comptes appliqués à cet onglet.


Présentation Employés / Équipes — 7 octobre 2026 : titre et description uniques au-dessus des onglets. Bouton primaire de création contextuel à droite de cet en-tête, même emplacement pour Nouvel employé et Nouvelle équipe. Aucun deuxième titre / sous-titre sous l’onglet Équipes ; compteur discret des équipes correspondant aux filtres avant la liste, dans la barre commune à Employés. Action visible uniquement avec les droits correspondants.


Employés et équipes / ouverture des fiches — 7 octobre 2026 : cliquer sur toute la ligne ouvre le popup, pas uniquement le nom ; pas d’engrenage de fin de ligne pour l’ouverture. Le même tableau partagé que Contacts applique les fonds alternés et le focus clavier. Un lecteur peut consulter une équipe sans modifier les champs, archiver ou enregistrer. Les boutons de configuration restent adaptés aux véritables paramètres. Aucun changement des droits ou du backend.


## Création et consultation liées — premier raccordement du 8 octobre 2026

Depuis Société / Contact d’une opportunité, ou Société d’une personne : créer via le `+` du sélecteur, consulter / modifier la sélection via la petite flèche adjacente. Réutilisation de la fiche complète Contacts dans une fenêtre commune ; préremplissage du nom recherché et de la société du contact selon le contexte. Enregistrer crée / modifie par les services Contacts, puis reprend la référence dans le champ sans sauvegarder la pièce d’origine. Son brouillon reste conservé. Si la société du contact est changée, le CRM reprend la société effective pour éviter une association incohérente.

Ouvertures imbriquées supportées (contact depuis société, société depuis contact), fermeture protégée et consultation lecteur sans écriture. Aucun nouveau champ ou changement de collection. Module Produits à raccorder au même contrat lorsqu’il sera livré ; les réglages et valeurs structurelles restent soumis à leurs permissions et invariants. Le bouton de création est masqué pendant chargement / erreur et sans permission d’écriture Contacts ; l’ouverture d’une sélection nécessite la lecture Contacts. Les contrôles serveur habituels restent appliqués.

Badge de fiche CRM — 8 octobre 2026 : une opportunité active affiche son étape commerciale enregistrée (libellé et couleur paramétrés), comme la liste et le Kanban. Ne pas afficher l’état agrégé « Ouverte » à la place de Nouveau / Qualifié. Le serveur continue de dériver `status` depuis l’étape ; les deux étapes ouvertes correspondent à `open`. Une fiche archivée conserve un badge Archivée, sans modifier son étape.

Devis — premier lot du 8 octobre 2026 : module Ventes livré avec liste de devis, recherche top bar / filtres / regroupement / tri partagés, fiche de brouillon et lignes HT libres. Opportunité obligatoire à la création (directe ou AO déjà promu), héritage société / contact / devise / compte analytique, numéro serveur atomique code opportunité + rang propre au devis. Création depuis l’opportunité et depuis la liste générale ; compteur Devis dans le breadcrumb de l’opportunité ouvre tous ses devis, même annulés. Revenu prévisionnel HT par devise : devis actifs (brouillons inclus) plus commandes confirmées, sans compter deux fois la part déjà commandée du devis. Annulation d’un brouillon avec motif, numéro conservé et exclu du revenu ; pas de suppression. Aucun envoi, validation, TVA, catalogue, PDF ou conversion en commande livré dans ce premier lot. Ces workflows restent des prochains lots et ne sont pas simulés par des changements de statut UI.


Devis S02 — édition structurée, 8 octobre 2026 : fil d’activité partagé sous la fiche ; retour à la liste par le fil d’Ariane, sans bouton doublon. Colonnes # / Description / Marque / Référence / Qté / Unité / Coût unitaire HT / PUV HT / Remise % / PTV HT / Commande / Actions. Duplication, montée / descente et suppression confirmée d’une ligne, appliquées au brouillon puis persistées par Enregistrer. Articles, sections niveau 1, sous-sections niveau 2 et notes. Sous-total de section affichable / masquable, calculé jusqu’au titre de même niveau ou supérieur. Les options sont exclues du total principal et du revenu CRM, avec total Options HT distinct ; remise et coût calculés côté serveur. Validité 30 jours par défaut, configurable en jours avec les largeurs globales de colonnes dans Paramètres → Ventes. Texte descriptif sur plusieurs lignes en fonction de la largeur. Consultation / édition de l’opportunité dans le popup transversal utilisant OpportunityPage, brouillon du devis conservé. Colonne Commande réservée au futur suivi Achats : aucun statut simulé. Modèles de devis, catalogue, validation, TVA effective, PDF et commandes restent les lots suivants.

Devis S03 — édition de grille : déplacer les lignes par glisser-déposer, ajouter les nouvelles lignes en pied de tableau, choisir Option dans sa colonne et dupliquer / supprimer par actions directes. L’ordre est sauvegardé avec le brouillon et reste continu après rechargement ; aucune modification des règles de calcul, des droits ou des lignes validées.

Devis S04 — Marge % exprime le taux sur coût avant remise : (PUV − coût) / coût × 100. Saisir le taux passe la ligne en price_source margin et recalcule le PUV lorsque le coût varie ; saisir le PUV repasse en manual et affiche le taux dérivé. Coût nul : taux dérivé 0, saisie de taux désactivée. Remise appliquée après ce prix ; marge totale du document reste après remise et hors options. TVA explicite du brouillon, 20 % par défaut CVS via Paramètres Ventes, modifiable sur le devis (dont 0 %), calcul fiscal côté TaxService serveur par article au centime, options exclues des totaux principaux. HT / TVA / TTC immédiatement sous la grille. Les règles fiscales contextuelles France / UE / export, codes TVA datés et validation restent le lot A01 ; ce calcul de brouillon ne simule pas une facture validée.

Devis S05 : trois niveaux de titres et repli des descendants jusqu’au titre de niveau égal ou supérieur ; le repli ne change ni montants ni contenu. Confirmation de retrait de ligne Annuler / Supprimer sans texte à recopier (confirmation forte conservée sur les autres fiches). TVA réglée uniquement dans Paramètres → Devis, initialement 20 %, appliquée côté serveur à chaque sauvegarde de brouillon ; aucune saisie ni surcharge de taux depuis la fiche. Le taux historique des documents déjà sauvegardés reste conservé tant qu’ils ne sont pas réenregistrés ; les futurs documents validés restent immuables.

Devis S07 : remise globale en pourcentage sous les lignes, après remises de ligne, hors options ; montant soustrait visible et HT / TVA / TTC recalculés. PTV et sous-totaux de sections restent avant remise globale. Total achats HT = somme des quantités × coûts unitaires arrondis, hors options ; ce coût estimé ne représente pas des commandes fournisseurs. Marge globale HT en devise = HT net − total achats, pourcentage sur coût identique à la convention de ligne (coût nul : —). Pricing et TaxService serveur assurent les snapshots et la mise à jour du revenu CRM net.

Devis S08 : remise globale absente par défaut, ajout explicite par bouton ; une remise enregistrée non nulle reste visible. Tout replier / Tout déplier en tête de grille masque les descendants de sections sans changer les calculs. Dupliquer un titre propose titre seul ou titre avec descendants jusqu’au prochain niveau égal / supérieur, sous-sections et notes comprises, limite totale 200 lignes. Annuler les modifications restaure la dernière sauvegarde (ou le formulaire initial en création), lignes / saisies / remise / notes comprises, sans requête de sauvegarde.

Devis S09 : remise globale en pourcentage ou montant HT, conversion de la saisie lors du changement de mode, montant borné au HT avant remise, options exclues. Unités de lignes choisies par combobox depuis inventory_units (Paramètres → Référentiels → Unités), code visible et recherche par libellé ; unité historique conservable mais valeurs inconnues / inactives non ajoutables. Paramètres → Devis → Conditions de vente configure plusieurs textes avec intitulé et archivage. Sélection CGV dans le devis à gauche des totaux, contenu affiché en dessous, libellé / texte snapshotés serveur et inchangés après mise à jour du modèle si le choix est conservé ; aucun texte juridique par défaut.

Devis S10 : Option disponible sur les trois niveaux de titre ; cocher / décocher applique le choix à tout le contenu de la section. Les options héritées du parent ne se modifient pas séparément tant que celui-ci reste en option. Héritage recalculé et imposé côté serveur. Remise globale en deux champs simultanés et synchronisés, montant HT et pourcentage, retirable via corbeille ; ajout toujours explicite, retrait appliqué au brouillon puis Enregistrer.


### Studio Documents D01 — première version utilisable

Accès : Paramètres → Modèles de pièces → Nouveau modèle. Le studio dispose d’une bibliothèque, d’une page A4 portrait / paysage et d’un panneau Page / Bloc / Titres. Ajout par clic ou glisser-déposer, réorganisation des blocs avec dnd-kit, déplacement / redimensionnement au pixel, valeurs surlignées et deltas pendant le drag, réglages indépendants du zoom. Flèches : 1 px, Maj + flèches : 10 px. Dans le corps, l’ordonnée représente l’espace avant du bloc en flux ; dans les zones répétées, les coordonnées sont absolues locales.

Blocs livrés : texte Tiptap, champ lié, image / logo intégré, tableau de lignes du devis, totaux, conditions de vente, séparation, espacement, saut de page et numéro de page. Colonnes sélectionnables / réordonnables, proportions redistribuées pour conserver 100 %. Styles des titres 1 / 2 / 3 et du titre de pièce via le bloc lié : police, taille, graisse, italique, casse, couleurs, trait et alignement. La hauteur du tableau dépend des vraies lignes ; les descriptions reviennent à la ligne. Les sections et notes sont prises en compte.

Aperçu sur un devis réel avec consultation / édition de la fiche source dans le popup partagé. Aperçu HTML contrôlé, aperçu PDF paginé et téléchargement via le même renderer serveur ; bouton PDF dans le bandeau supérieur du devis sauvegardé. Les aperçus ne valident pas le devis et ne constituent pas un document historique envoyé. Gestion des modèles réservée aux Admin / Superuser habilités ; les lecteurs Ventes peuvent utiliser la version publiée. Modification du brouillon sans altération de la version déjà publiée ; archivage conservant toutes les versions.

Restent pour les lots suivants : identité Organisation centralisée et snapshots explicites des adresses de facturation / livraison, variantes de blocs d’adresses, maquette CVS finalisée d’après les PDF fournis, validation / émission et documents_generated immuables. La génération Chromium réelle doit être vérifiée sur le NAS avec les devis longs ; le poste local n’a pas Docker. Le studio n’est pas présenté comme le workflow d’émission officiel complet.

Studio D02 : plusieurs blocs statiques peuvent partager une ligne via « Disposition → Même ligne que le bloc précédent ». Le studio répartit initialement la largeur avec un espacement de 12 px, puis chaque X / largeur reste réglable au pixel. La ligne suivante descend avec le plus grand contenu ; tableau et saut de page démarrent leur propre ligne. L’import de logo dispose d’un bouton visible avec aperçu, remplacement et retrait. Les champs sont choisis par provenance (Ventes / Devis, Contacts / Société ou interlocuteur, CRM / Opportunité, Utilisateurs / Responsable), puis par nom ; texte avant la valeur et styles restent modifiables. Le tableau identifie sa source Ventes / Lignes du devis avant le choix, l’ordre et les largeurs des colonnes. Zoom − / pourcentage / +. Cinq polices supplémentaires : Roboto, Open Sans, Lato, Source Sans 3, Noto Serif ; contrôles gras / italique / casse / alignement par pictogrammes.

Studio D03 : correction des noms de police dans les attributs style HTML ; en-tête, coordonnées, couleurs et titres sont conservés dans l’aperçu. Le studio affiche le Tiptap enrichi et un échantillon des trois niveaux du tableau avec les styles du modèle. Pour un bloc texte, une seule commande Gras / Italique (barre Tiptap) : les propriétés de bloc conservent police, taille, couleurs, casse / trait et alignement. Poignée dans la feuille pour ajuster X / Y et réordonner une ligne du corps, repère d’insertion, redimensionnement au coin et suppression avec confirmation via la croix. Ancrages gauche / centre / droite / haut / bas dans la zone. Duplication placée sous la ligne source ; la hauteur d’une zone fixe peut grandir dans ses bornes pour éviter une superposition (sinon une erreur explicite évite de créer un bloc qui chevauche). Ruban nom / état compact sur une ligne, zoom en haut à droite du cadre et Adapter pour montrer la page entière ; l’échelle s’ajuste aussi au redimensionnement tant qu’Adapter est actif.

Studio D04 : bibliothèque générique, sans blocs métier Totaux / CGV. Les montants HT / TVA / TTC / options / remise et les CGV sont des champs liés composables ; le tableau reçoit une source autorisée (Ventes / Lignes du devis pour ce lot), ses titres / notes viennent uniquement du devis. Les anciens blocs sont développés dans la copie de travail, sans modifier les versions publiées. Poignée de déplacement discrète, déplacement direct du bloc et huit points de taille ; duplication et croix dans une petite barre flottante. Images : dimensions naturelles limitées à la zone, ratio verrouillé par défaut, déverrouillable et modifiable depuis les dimensions ou la feuille. Texte enrichi avec Texte normal / H1 / H2 / H3 ; le gras hérité du bloc est repris en marques Tiptap pour pouvoir le retirer. Panneau de propriétés compact.

Studio D05 : fond de page couleur / image intégrée (image entière ou remplissage) avec opacité ; fond des blocs et titres avec opacité indépendante du texte. Panneaux bibliothèque / propriétés réglables au pointeur et au clavier, double-clic / Home pour revenir aux dimensions par défaut, largeurs conservées localement. Propriétés regroupées par mise en page, géométrie, contenu et apparence ; sélection du niveau de titre au lieu de trois formulaires empilés. L’éditeur de texte grandit naturellement de 36 à 240 px, puis défile.

Studio D06 : bibliothèque / liste des blocs repliables séparément, groupes de propriétés repliables ; états conservés dans le navigateur, sans modifier le document ni perdre le contenu de l’éditeur. Couleurs par pastille et saisie hexadécimale validée, curseurs d’opacité fins. Aucun changement serveur, schéma ou génération documentaire.

Studio D07 : styles des titres de lignes configurés par tableau sélectionné, héritant des styles historiques en absence de réglage local. Les niveaux proviennent du devis ; aucune modification des lignes source. Groupes repliés au premier usage puis préférence locale conservée. Ruban du modèle : nom centré, statut et actions de cycle de vie réunis à droite.

Studio D09 : choix En-tête dans Titres des lignes pour régler le texte et le fond de la première ligne du tableau, sa police, taille, graisse, casse et alignement. Les noms des colonnes restent dans Données du tableau ; styles indépendants des trois niveaux de sections, conservés à sauvegarde et partagés entre studio / HTML / PDF.

Studio D10 : styles Ligne (articles) et Note dans Titres des lignes, indépendants de l’en-tête et des trois niveaux. Même police / taille / texte / fond / opacité / mise en forme ; notes en italique par défaut. Les chiffres restent à droite ; styles conservés et rendus par le renderer HTML / PDF. Dans la feuille sans source réelle, seul l’indicateur des lignes reprend le style Ligne, sans inventer de note.

Studio D14 — aperçu HTML paginé : réutilise le contenu enregistré et les styles du modèle ; feuilles A4 portrait / paysage, marges, tableau distribué, colonnes répétées, en-tête / pied / fond à chaque page, numéros et total de pages, sauts explicites et blocs côte à côte. Les deux boutons Aperçu HTML / Aperçu PDF sont conservés. HTML automatique à l’ouverture après choix du devis et du modèle, indépendant de Gotenberg ; PDF de référence pour l’export, avec différences de fragmentation possibles entre moteurs. Aucun document finalisé ni version publiée modifiés.

Documents D16 (9 octobre 2026) : aperçu ouvert directement dans sa grande fenêtre, zone grise en attente du devis / modèle, sans changement de taille lors de la génération. Aperçu HTML : zoom − / + (10 à 200 %) et Ajuster à la fenêtre pour afficher une page entière ; format, orientation et dimensions physiques en haut à droite. Paramètres → Modèles de pièces → Noms des PDF : format propre à chaque type, tokens {number} obligatoire, {date}, {company}, extension automatique. Nommage effectif des devis calculé côté serveur et transmis au téléchargement. Commandes client / fournisseur et bons de livraison configurables pour leur futur raccordement, sans génération de ces pièces dans D16.

Documents D17 : formats PDF enrichis de champs Client, Opportunité (titre / numéro), Pièce (titre / numéro / date), Responsable et Interlocuteur. Dans l’onglet Noms des PDF, le titre répété est supprimé ; Enregistrer reste en haut à droite. Choix du format à compléter et sélecteur de champs avec provenance ; insertion à la position du curseur et retour au champ de format, exemple mis à jour immédiatement. {company} reste compatible avec les formats existants ; {client} est son alias lisible.


## Catalogue P01 — périmètre validé du 9 octobre 2026

Premier lot : catalogue vide, familles tarifaires configurables dans Paramètres → Catalogue, onglet Achats multi-fournisseurs, fournisseur favori visible par étoile, fiche / images et sélection depuis les devis via le même formulaire embarqué. Aucun stock réel, réception, parc interne, immobilisation ou location dans ce lot. Import Excel avec mapping / matching / dry run / conflits / apply prévu ultérieurement ; aucun import automatique de l’ancienne base.

Une variante achetable est un produit distinct, avec regroupement facultatif par un libellé de groupe. La fiche propose un seul classement visible « Famille de produit » (`category`), commun au catalogue, aux filtres et au coefficient de vente. Le sélecteur redondant « Type de produit » est retiré ; le champ technique `kind` existant reste conservé pour la compatibilité des données, sans deuxième classement présenté à l’utilisateur. Son coefficient positif produit PUV = coût net par unité de base × coefficient, sans confusion avec la marge sur vente. Familles initiales Équipements 1,20, Fournitures 1,35 et Services 1,00, toutes administrables. Une seule offre active favorite au maximum ; aucune sélection silencieuse du fournisseur le moins cher.

Chaque offre conserve prix liste HT, remise %, prix net calculé, devise, référence fournisseur, conditionnement en unités de base, délai et dates de validité. Exemple : touret 1 000 m à 800 € net = 0,80 €/m, vendable en mètres. La fiche distingue prix du conditionnement et coût par unité ; les futurs achats / réceptions utiliseront ces mêmes unités sans simuler de stock maintenant. Prix unitaires jusqu’à six décimales, totaux arrondis au centime. Les lignes de devis libres restent possibles ; prix / coût restent modifiables dans le brouillon et calculés serveur. Le choix d’une autre offre doit être explicite. Pas de conversion de devise implicite : une offre incompatible avec la devise commerciale ne sert pas au calcul sans taux explicite.

Photos chargées dans le brouillon puis persistées à Enregistrer, galerie, identité compacte, onglets Informations / Achats / Logistique / Photos, avec coût, coefficient et prix de vente dès Informations ; navigation et champs partagés Horizon. Catalogue en liste illustrée, recherche dans la top bar et panneau SearchFilters partagé ; regroupement par famille, critères URL conservés. Stock et parc restent des propriétés préparatoires, aucun badge de quantité fictif.

Le fil d’activité partagé est disponible sous la fiche produit (changements, notes, pièces jointes, mentions et tâches selon les droits). Les onglets restent consultables en lecture seule et restent sélectionnés après enregistrement. Les dates de validité du tarif se règlent depuis le calendrier de la ligne, pour conserver une hauteur compacte.

Catalogue P01 — reprise UX : photo principale et galerie réutilisent `shared/images/ImageSearch` (Google Images / collage, Wikimedia, import), avec recherche préremplie marque / référence / nom. Tableau Fournisseurs réutilisant `HDataTable`, prix d’achat et coût unitaire distincts, favori magenta Horizon et actions compactes. Aucun formulaire d’image parallèle. Fil d’activité commun sous tous les onglets d’une fiche enregistrée, publication de notes vérifiée dans le navigateur.

Catalogue P02 — marques, coût manuel et logistique (le sélecteur de tarif de devis décrit à cette étape est retiré par la décision « Ajout / remplacement » ci-dessous) : Marque en combobox avant les références, référentiel Inventory distinct, création depuis la fiche avec sélection automatique, même nom normalisé réutilisé. Le coût manuel est une option explicite sauvegardée ; elle remplace le coût favori pour le calcul du PUV sans changer les offres fournisseurs. Une sélection explicite d’offre dans un devis reste possible. Logistique : poids kg, volume m³, code SH 6 / 8 / 10 chiffres et pays d’origine (référentiel pays partagé). Photo principale unique avec recherche d’images partagée, centrée dans l’identité ; retrait de l’onglet et des photos complémentaires de l’UI sans purge des données existantes. Nom et champs bornés en largeur, grilles compactes. Onglet Comptabilité présent, raccordement comptes / TVA / Accounting Service ultérieur.


Catalogue P03 / P04 : coefficient manuel propre au produit, sauvegardé indépendamment de la famille ; retour automatique uniquement par décochage du mode manuel, sans bouton de rafraîchissement redondant. Coût effectif × coefficient effectif = PUV, calcul et contrôles côté serveur. Les devis déjà associés conservent leur snapshot. Identité illustrée en deux rangées, informations et calcul côte à côte ; logistique en deux zones complémentaires.


Catalogue P04 : une seule Référence produit visible, portée par sku et utilisée lors des nouvelles associations au devis. Les anciens manufacturer_ref et snapshots sont conservés sans nouvelle saisie distincte. Marge affichée sur vente = (PUV − coût) / PUV × 100, distincte de la majoration sur coût utilisée par le moteur de saisie des devis ; pas de taux si PUV nul. Retour coefficient auto par décochage du mode manuel. À l’ajout d’un fournisseur, préremplir sa référence avec la Référence produit (sku) actuellement saisie ; elle reste modifiable et les références des fournisseurs déjà ajoutés sont conservées. Retrait de ligne fournisseur par suppression confirmée, historique conservé. Groupe de variantes : libellé facultatif regroupant des produits distincts, sans génération automatique ni mutualisation de stock / prix.


Produits — passage au coût manuel : reprendre le coût effectif actuellement affiché, y compris celui du fournisseur favori, sans remettre le prix à zéro. Le coût saisi est ensuite sauvegardé normalement. Coefficient manuel : flèches de saisie par pas de 0,1, valeurs positives personnalisées conservées.


Catalogue : marque requise à l’enregistrement, avec astérisque Horizon et création depuis la combobox. Les anciens produits sans marque restent consultables ; une modification nécessite de compléter la marque. Validation également côté serveur.


Ajout / remplacement d’un produit dans un devis : reprise directe du coût et du PUV de la fiche, sans sélecteur de tarif, avec résolution automatique côté serveur (coût manuel ou fournisseur favori, coefficient manuel ou famille). Ne pas forcer le coût de référence ou une ancienne offre depuis le sélecteur. Le rappel coût / PUV reste affiché dans le sélecteur de produit. Les valeurs de la ligne restent éditables ensuite dans le brouillon du devis. Les lignes déjà enregistrées ne sont pas resynchronisées silencieusement.


PDF depuis une fiche devis : le devis courant est imposé à l’aperçu. Un seul modèle publié non archivé disponible est choisi automatiquement et déclenche le rendu HTML, sans demander une sélection inutile. Avec plusieurs modèles publiés, choix de modèle conservé ; aucun modèle draft ou archivé choisi arbitrairement. Sans modèle publié, indication explicite et invitation à publier dans Paramètres.


Fiche produit — smart boutons dans la barre commune : Devis raccordé aux devis enregistrés contenant le produit, regroupés par pièce, avec date, client autorisé, code / libellé analytique autorisé, quantité hors options, quantité en option, montant des lignes HT avant remise globale et état. Historique incluant brouillons et annulations ; ouverture du devis par clic sur sa ligne. Les raccordements ultérieurs ajoutent Demandes, Achats, Ventes (commandes), Livraisons et Stock via les modules propriétaires. Un bouton indisponible reste sans compteur simulé. Tous naviguent vers leur module avec filtre produit ; aucun ne prépare une pièce. Stock : physique / réservé / disponible / entrant par entrepôt, traçabilité analytique et distinction parc interne.


Produit / Achats : zone Dernier prix d’achat au-dessus des fournisseurs, affichant prix unitaire HT, devise / unité, date d’achat et fournisseur. Elle correspond exclusivement à un achat réel ; les tarifs et leur historique ne servent jamais à l’alimenter. Le workflow Achats raccordé utilise la dernière ligne de commande fournisseur validée non annulée ; il ne prétend pas afficher un coût facturé ou une réception. Sans achat correspondant : Aucun achat enregistré et valeurs absentes.


Devis — cycle commercial : frise Brouillon / Devis / Envoyé / Commande client. Finaliser prépare et fige le devis (draft → validated, libellé Devis) ; Confirmer apparaît uniquement après finalisation et réalise l’acceptation client (validated / sent → accepted) et crée atomiquement une commande confirmed avec les mêmes compte analytique / devise / commercial et snapshots de lignes, hors options. Aucun passage manuel à sent : réservé au futur envoi réel Messaging. Confirmation dans un popup : numéro de commande client obligatoire sauf case explicite Attente Commande ; document PDF / image facultatif. Le champ grisé affiche Attente Commande lorsque la case est cochée. Le document peut être présent sans numéro dans ce mode. Preuve stockée une seule fois dans le fil protégé, consultable depuis le fil et près de la référence. Confirmation rejouée ne crée pas de doublon. Aucune livraison, facturation ou commande fournisseur définitive automatique. Des réservations et une demande d’achat draft peuvent être préparées explicitement dans le popup puis enregistrées dans la transaction de confirmation (voir le complément du 12 octobre). Commercial = owner, compte Horizon actif sélectionnable dans le brouillon. Droits sales.quote.validate et sales.order.confirm distincts de sales.write.


Retours : Devis / Envoyé → Brouillon avec sales.quote.validate ; Commande client → Devis avec sales.order.confirm, uniquement tant que toutes les commandes concernées sont confirmed sans exécution. Retour annule explicitement les commandes précédentes, sans suppression, et conserve preuves / snapshots. Une confirmation ultérieure crée le rang commande suivant, sans réutiliser le numéro. Toute transition est auditée et visible dans le fil.


Retour Commande → Devis — détails du blocage (16 octobre 2026) : les contrôles serveur restent inchangés sur le fond (opération de stock non annulée, demande d’achat active, facture/acompte non annulé). En cas de refus, la commande reste confirmée et le devis accepté, sans libération ni annulation. Le dialogue détaille chaque pièce accessible : référence, nature/état et action attendue. Un BL draft est présenté comme préparation à annuler, sans prétendre qu’il a été exécuté ; une réalisation/une facture validée impose la conservation de sa source et oriente vers Modifier la commande. Un lien ouvre la pièce canonique dans RecordWorkspace, sans nouvelle page. À la fermeture, retirer le diagnostic périmé et remettre le focus sur Confirmer ; Vérifier à nouveau recalcule toujours les contrôles côté serveur. Sans droit de lecture du module, fournir seulement un motif générique sans référence ni lien. Aucun traitement automatique ni assouplissement des engagements.

Devis — annulation, archivage et suppression : `cancelled` est un état métier distinct ; `archived_at` retire une pièce des listes courantes sans modifier son état ni ses engagements. Réactivation disponible. `sent_at` conserve le premier envoi, même après retour en brouillon. Suppression serveur autorisée avec `sales.write` uniquement sans envoi historique et sans aucune commande liée (même annulée) ; les autres pièces restent archivables. Une commande doit revenir en devis avant annulation du devis.


Recherche de produit dans un devis : recherche dynamique multi-mots sur marque, référence, nom et description ; produits actifs vendables seulement, pagination serveur. Résultats structurés marque / référence-modèle / description / PUV. Fiche et création utilisent ProductPage embarquée existante ; coûts et PUV appliqués depuis le service de pricing.

Copier un devis depuis la roue : recherche par numéro / titre / client / opportunité, sélection puis saisie exacte COPIER. Disponible sur Nouveau devis et sur un brouillon actif enregistré sans modifications en attente. En création, la roue propose uniquement Copier un devis ; le rattachement peut être choisi après la copie et reste obligatoire à l’enregistrement. Reprend titre, lignes et sections, notes, coûts / PUV, remises et choix CGV dans le formulaire ouvert ; conserve numéro, opportunité, dates, commercial et devise. Source relue avant copie, refus si modifiée ou de devise différente. La copie remplace le contenu du formulaire, reste annulable avant Enregistrer et utilise la validation / pricing serveur habituels ; aucun état, commande, document ou fil historique n’est copié.

Nouveau devis : le sélecteur Opportunité propose Créer une opportunité aux utilisateurs disposant de crm.write / crm.read. Réutilise OpportunityPage dans RecordWorkspace, titre prérempli depuis la recherche, sélection automatique après sauvegarde ; le devis et ses saisies restent ouverts. Le rattachement d’un devis existant reste immuable.

Liste Devis : bandeau de synthèse Brouillon / Devis / Envoyé / Commande client, compteurs serveur des pièces non archivées sur la recherche / société / opportunité courantes, indépendants du filtre de statut et de la pagination. Clic applique le statut à la liste existante en conservant les autres critères.

Catalogue — duplication depuis l’engrenage de la fiche : préparation d’une nouvelle fiche produit dans le même éditeur, sans création serveur avant Enregistrer et sans mot de confirmation. Photo principale et réglages repris ; référence et code-barres vidés. Choix de reprendre les fournisseurs, leurs prix et le favori ; nouveaux identifiants d’offres à la sauvegarde. Coût effectif conservé comme référence si les fournisseurs sont omis. Aucun achat historique, mouvement, stock ou événement de fil repris. Permissions de création catalogue et validation serveur habituelles.


Documents D18 — étiquettes produit et formats d’impression : bouton code-barres à la fin du champ de la fiche produit, activé après enregistrement d’un produit avec code-barres. Ouvre l’aperçu partagé HTML paginé / PDF / téléchargement et impression navigateur à taille réelle. Format standard 95 × 28 mm, marque et référence sur la même ligne, désignation puis Code 128 et valeur lisible. Les modèles publiés Étiquette produit sont conçus dans le studio existant : champs Produit, blocs génériques, logo / image, dimensions libres en mm et marges adaptées ; aucune seconde fiche ni second studio. Table Formats d’impression dans Paramètres → Modèles de pièces : nom, largeur, hauteur, disponibilité ; A4 et Étiquette produit initiaux. Sélection du format ou dimensions personnalisées ; le modèle conserve ses dimensions même si le format partagé change. Formats archivables et modèles versionnés, sans suppression des références historiques.


Catalogue — création : code-barres proposé automatiquement depuis la marque (trois premiers caractères sans espaces, majuscules / accents normalisés) et la Référence. Ex. RS PRO + 178-8331 → RSP178-8331. Champ éditable ; le vider sur une nouvelle fiche réactive la proposition. Proposition serveur non réservée avant sauvegarde ; allocation finale transactionnelle ajoute 1, 2, 3… si le code existe, produits archivés inclus. Duplication suit la même règle après saisie de la nouvelle référence. Un code enregistré ne se régénère pas quand marque / référence changent. Retry creation_key renvoie le produit et son suffixe déjà alloué, sans consommer un autre suffixe.


Achats — décision du 10 octobre 2026 : demandes manuelles possibles avec opportunité ; préparation explicite depuis Commande client et contrôle des besoins déjà préparés. Demandes → BC par fournisseur / devise, allocations par ligne sur plusieurs codes CRM. La confirmation client propose les lignes / emplacements / quantités à réserver, sans obligation ; Réserver le stock est une action de fiche disponible ensuite. Aucun smart bouton ne déclenche une création : ils ouvrent le module filtré. La commande affiche le numéro du devis inchangé. Suivi distinct Achats / Réceptions / Livraisons au bout des lignes, visible uniquement au statut Commande client (accepted) et masqué dès le retour en devis ; brouillons de bons exclus du réalisé. Premier lot : demandes, BC / PDF, stock par emplacement et réservations ; réceptions / livraisons opérationnelles et inventaires sont ensuite livrés par S02, lots / séries par T01 (voir ces périmètres).

Achats — cycle du 11 octobre 2026 : la validation d’une DA prépare atomiquement ses BC brouillons par fournisseur / devise, avec fournisseur obligatoire par ligne ; aucun envoi n’est simulé. Frise DA Brouillon / Validée / Traitée ; `ordered` signifie désormais toutes les quantités réellement envoyées (`sent`, `acknowledged`, réception ou clôture), avec `partially_ordered` pour une partie envoyée. La source commerciale est une projection Sales, placée après Affaire ; une DA manuelle peut sélectionner son devis source, une DA issue d’une commande conserve sa provenance. Le tag de ventilation utilise le code enfant complet lorsqu’une commande est affectée. Les BC utilisent la même frise (Brouillon / Validée / Envoyée / Réceptionnée). Retour DA en brouillon confirmé : retrait des préparations brouillon (annulation historique si le BC n’appartient qu’à cette DA ; retrait des lignes concernées et recalcul si partagé), sans toucher aux autres demandes. Tout BC validé doit d’abord revenir en brouillon ; aucun retour après envoi historique ou réception. Les snapshots retirés sont conservés. Retour BC avant envoi avec droit `purchasing.order.validate` et écriture ; retour DA avec `purchasing.request.validate` et écriture. Une annulation groupée demande + BC jamais envoyés est disponible avec les deux droits de validation et écriture ; elle est bloquée pour un BC partagé ou déjà envoyé / exécuté. La politique d’annulation après envoi reste à décider avant le module Messaging / Réceptions. Smart bouton Commandes fournisseurs = liste filtrée par demande, jamais une action de création. Migration `1791710000_purchasing_request_lifecycle.js` recalcule les états historiques des demandes sans simuler de nouveaux envois.


BC fournisseur — identité et destination : fournisseur affiché avec son numéro de TVA lorsqu’il est renseigné, acheteur sélectionnable parmi les utilisateurs actifs habilités aux achats, entrepôt de livraison sélectionnable dans le référentiel Stock. Le créateur est proposé comme acheteur ; un entrepôt unique actif est proposé automatiquement. Acheteur et entrepôt sont requis à la validation. Dates libellées « Date d’émission » et « Date de réception souhaitée ». Une ligne de brouillon peut être retirée après confirmation ; les quantités correspondantes redeviennent disponibles pour une préparation. Les smart boutons consultent les demandes liées ; Réceptions renvoie désormais à la liste filtrée des attentes IN / réalisations du BC ; Factures fournisseurs reste indisponible avant son raccordement, sans action de création.

Synthèses Achats / Stock — 11 octobre 2026 : cartes Brouillon / Validée / Partiellement traitée / Traitée sur les demandes d’achat, Brouillon / Validée / Envoyée / Réceptionnée sur les commandes fournisseurs. Compteurs des pièces non archivées, sur la recherche et les relations courantes, indépendants du statut et de la page. Disponibilités : Produits stockables / En stock / Réservés / Disponibles ; nombre de produits distincts actifs dans les emplacements actifs des entrepôts actifs. Les trois dernières cartes filtrent les emplacements dont la quantité correspondante est strictement positive ; plusieurs emplacements ne comptent qu’une fois le produit. Les filtres restent dans l’URL et dans le panneau partagé.

Catalogue — 11 octobre 2026 : vue Cartes en complément de Liste, même recherche / filtres / regroupement / tri et pagination serveur. Photo principale, marque, nom, référence, famille, PUV HT et quantité disponible après réservations dans tous les emplacements / entrepôts actifs ; aucun stock pour les services non stockables. Navigation et rechargement conservent la présentation.

Ventes — listes distinctes : sous-menu Devis filtré avec `status=quotes` (tous les devis non archivés hors commandes `accepted`), sous-menu Commandes avec `status=accepted`. Le filtre est appliqué côté serveur avant pagination, et reste visible dans le panneau commun.

Achats — ajout de lignes aux BC : un brouillon fournisseur peut recevoir des lignes libres ou du catalogue, avec unité, prix, taxe et ventilation complète sur les affaires. Les lignes issues d’une demande gardent leurs contrôles de source et de quantité restante. La validation fige aussi ces compléments. Lors du retour de la demande source en brouillon, seuls ses préparatifs sont retirés : les compléments directs sont conservés dans le BC, avec recalcul des totaux. Une annulation globale de la DA refuse un BC comportant des compléments directs et invite à traiter cette commande séparément.

Achats — valeurs initiales : une nouvelle DA manuelle ou un nouveau BC contient une première ligne vide à compléter. Le BC propose l’utilisateur créateur comme acheteur et l’entrepôt actif de code MEU (Meudon) ; à défaut de MEU, un entrepôt unique est proposé, sinon le choix est explicite. Les valeurs des pièces existantes sont conservées. La DA affiche Affaire et Devis source sur la première ligne, dates sur la suivante. Un devis actif peut être choisi sur une DA manuelle : l’affaire et la devise sont reprises, les lignes restent saisies explicitement ; une DA issue d’une commande conserve sa provenance et ses contrôles de besoin net.

Achats — les lignes de demande d’achat et de commande fournisseur peuvent être
enregistrées incomplètes en brouillon, y compris sans description ou ventilation
complète. Elles sont conservées à la réouverture. La validation serveur exige une
description par ligne et une ventilation couvrant toute la quantité ; les fournisseurs
sont requis avant la préparation des commandes. Les contrôles de provenance,
de droits et de quantités restent applicables dès l’enregistrement.

BC — ajout d’un produit : si le fournisseur de la commande n’est pas référencé
dans les fournisseurs actifs du produit, avertir avant l’ajout. L’utilisateur peut
continuer avec le prix proposé à vérifier, ou ouvrir la fiche produit canonique
sur Achats pour ajouter le fournisseur. Aucun fournisseur n’est créé silencieusement.

### Stock S02 — opérations et inventaires (11 octobre 2026)

Décisions utilisateur : deux entrepôts initiaux Meudon (MEU) et Sèvres (SEV), codes entrepôts uniques à trois lettres ; numéros serveur atomiques `<code>/<type>/<séquence sur 5 chiffres>`, séquences continues par entrepôt / type. IN = entrée, OUT = sortie, RET = retour, PREP = préparation chantier, INT = transfert interne. Une PREP validée sort réellement les quantités et exige une affaire ; elle ne constitue pas une simple réservation. La mise au rebut est un OUT avec motif obligatoire. Le dropshipping relie BC et commande client sans passage par le stock local.

Les pièces brouillon ne modifient aucun solde. IN / OUT / RET / PREP sont réalisés à validation ; INT entre entrepôts passe par transit puis réception, un transfert intra-entrepôt est atomique. Une quantité réservée à une autre commande ne peut pas être sortie. Les réalisations sont immuables, les retours restent liés à l'opération d'origine. Les lignes de source, quantités, coûts et affectations analytiques sont conservés ; les reliquats sont contrôlés à validation, y compris en concurrence.

Inventaires : campagne annuelle ou tournante, date planifiée, périmètre d'emplacements et vue calendrier. Numéro de campagne INV dans une séquence distincte, sans ajouter un sixième type de mouvement physique : les écarts produisent des corrections signées. Démarrer le comptage capture le théorique et peut verrouiller la validation des opérations sur les emplacements concernés selon Paramètres → Stock. Les brouillons restent accessibles. Validation de l'inventaire vérifie que les soldes n'ont pas changé et que les réservations restent couvertes ; elle génère les corrections auditées puis libère le verrou. Annuler le comptage libère également le verrou.

Les retours fournisseur sont des RET rattachés à une réception IN réalisée, avec sortie physique ; les retours client / chantier sont rattachés à une OUT/PREP, avec entrée physique. Le cumul retourné ne dépasse pas le document d’origine. Les réalisations ne rouvrent pas automatiquement les demandes ni les factures ; les régularisations comptables restent distinctes.

Stock S03 — navigation corrigée à la demande utilisateur : clic sur Stock = /inventory/dashboard, avec synthèse des produits distincts, opérations ouvertes, entrepôts et inventaires à préparer. Disponibilités, Opérations et Inventaires sont des pages indépendantes, sans onglets de navigation communs. Opérations ouvre un catalogue de tuiles IN, OUT client, PREP, INT, RET, livraison directe et rebut ; Consulter ouvre la liste filtrée, Créer ouvre la fiche du type choisi déjà fixé. Les renvois existants de pièces continuent à ouvrir leur liste contextuelle.

Valorisation — décision utilisateur du 11 octobre 2026 : tout le stock démarre au coût standard. Il s’agit d’un coût de référence par produit, distinct du prix de vente et des prix fournisseurs ; une réception ne le recalcule pas automatiquement. Prévoir les méthodes standard / CUMP / FIFO avec un changement réservé à un administrateur, contrôlé côté serveur. Après les premiers mouvements valorisés, le changement passe par une procédure datée / autorisée / auditée avec reprise de la valeur d’ouverture et traitement des écarts ; jamais un recalcul silencieux des historiques. La méthode reste cohérente pour les produits de nature et usage similaires et entre les entrepôts CVS.

Méthode et coûts retenus sont conservés dans les mouvements valorisés. Les achats réels et leurs affectations aux affaires restent traçables indépendamment du coût standard ; les écarts au standard et les révisions de ce coût font l’objet de régularisations explicites. Le coût servant au calcul du PUV du catalogue reste distinct du coût de valorisation. Coûts d’achat nets HT, frais attribuables et change sont snapshotés ; écarts facture / réception corrigés explicitement. Transfert = conservation de valeur, réservations = sous-ensemble du stock physique ; PREP distingue localisation chantier et consommation comptable. Sage reste la source officielle en Phase 1. S03 ne livrait pas le moteur. Le lot V01 décrit ci-dessous réalise cette décision. La décision ultérieure du 12 octobre retient CUMP pour la valorisation du stock ; le standard reste le défaut d’installation et une méthode disponible. Le changement se fait via la procédure administrateur, sans effet sur le coût commercial des devis ; la configuration effectivement appliquée au NAS reste à confirmer.


Stock V01 — coût standard, CUMP et FIFO disponibles, méthode globale administrateur dans Paramètres → Stock. Un nouveau produit sans historique reçoit lors de sa première réalisation un coût standard suggéré par le coût catalogue EUR actuel (favori ou coût manuel), figé ensuite indépendamment du pricing. L’administrateur peut le définir auparavant ou le réviser avec motif et contrôle de concurrence ; en standard, une révision régularise toutes les quantités restantes, transit compris. Un coût nul explicite est autorisé. Un stock antérieur exige une ouverture confirmée avec coût par unité, sans réécrire ses mouvements. Les devis et prix de vente ne sont pas modifiés par ces réglages.

La validation d’une opération ou correction de stock crée sa valorisation dans la même transaction. Standard : coût fixe. CUMP : moyenne pondérée des quantités restantes à chaque entrée, commune aux entrepôts et incluant le transit. FIFO : consommation des couches les plus anciennes de l’emplacement choisi ; les retours reprennent les couches consommées de leur sortie valorisée, et un transfert transporte sa valeur. Réservations sans valorisation supplémentaire, dropshipping sans stock local ni valeur locale. Dashboard affiche valeur globale / transit et reprises manquantes ; Disponibilités affiche la valeur par emplacement ; fiche produit affiche la méthode et la valeur, sans afficher le coût standard ni un lien Paramètres dans ce résumé. Historique consultable (100 dernières écritures par produit).

Un changement vers CUMP ou FIFO reprend la valeur restante moyenne dans des couches d’ouverture par emplacement, sans reconstruire un ancien FIFO fictif. Le retour au standard crée une régularisation aux standards conservés. Ouvertures incomplètes et transferts en cours bloquent le changement. Date d’effet = date de validation serveur, acteur / motif / méthode / valeurs conservés. Les achats EUR connus restent distincts et leurs écarts au standard sont visibles dans l’historique avec droit Achats. Les factures, frais d’approche, change, dépréciations comptables et écritures Sage restent hors V01.

Commandes fournisseur / Stock — décision du 11 octobre : retirer le bouton Préparer une réception. La validation d’un BC crée atomiquement une réception IN en attente, préremplie avec les produits gérés en stock, lignes source, quantités, coûts nets, ventilations, entrepôt et date souhaitée. L’emplacement principal STOCK (ou l’unique emplacement) est proposé ; sinon choisir avant réception. Les lignes libres et services sans stock ne génèrent pas de mouvement. Smart bouton Réceptions = liste filtrée, jamais une création. Validation à l’arrivée = stock réel ; réception partielle = nouveau reliquat en attente, sans doubler les réceptions manuelles déjà programmées. Retour BC en brouillon / annulation annule les attentes, conserve l’historique ; réalisations immuables. Les anciennes attentes vides sont reprises par migration.

Réception fournisseur : expéditeur et BC source visibles ; BC non effaçable, flèche de consultation selon le droit Achats. Affaires et quantités ventilées dans le tableau, sans affaire globale ni destination chantier ni colonne de prix. Chaque ligne reçue exige quantité positive et emplacement de destination actif ; une ligne non reçue peut être retirée pour laisser son reliquat en attente. Entrepôt modifiable avant réalisation ; nouveaux brouillons sans numéro, numérotation dans l’entrepôt retenu à réalisation. Les numéros historiques déjà attribués restent conservés. Aucun bouton de reprise des quantités sur une réception fournisseur préremplie. Notes internes repliables selon le composant / style Devis. Bon de réception : expéditeur, numéro source, entrepôt, affaires et destinations par ligne, sans montant ; identité et libellés conservés à réalisation.

Affaires — libellé partagé code - client, présenté en tags. Les lignes de réception ajoutent la quantité ventilée et l’unité, exemple 00003 - TF1 [ 5u ]. Les listes de réceptions agrègent les affaires de toutes les lignes, sans quantité et sans doublon ; colonne Provenance à la place d’Opération. Le smart bouton Réceptions filtre les IN du BC. Changement d’entrepôt propose son emplacement STOCK principal. La flèche du BC ouvre sa fiche canonique dans RecordWorkspace, sans quitter la réception ni perdre ses modifications.

Dashboard Stock : compteurs de réceptions, livraisons, préparations chantier et transferts en cours ; file des prochaines réceptions, inventaires à venir / en comptage, produits stockables / physiques / réservés / disponibles, entrepôts actifs et valeur HT (entrepôts / transit). Les compteurs couvrent toutes les pages et les liens appliquent les filtres correspondants. Le catalogue de création reste sur Opérations, séparé du dashboard.

Opérations Stock : chaque tuile affiche une courbe sur dix jours, de l’avant-veille aux sept prochains jours, avec réalisé / prévu distingués et repère Aujourd’hui. Les pièces sans date et en retard restent signalées à part ; aucune date inventée depuis la date d’émission. Un transfert est réalisé à sa réception finale. Les courbes comptent des pièces, indépendamment de leurs quantités et unités.

Dashboard — période commune aux indicateurs du haut et au pilotage économique : Mois, Trimestre et Année calendaires, navigation précédente / suivante, bornes explicites. À chaque ouverture ou rechargement, sélection du mois en cours en Europe/Paris. Le carrousel, le planning et l’activité restent indépendants. Indicateurs raccordés par une projection serveur : estimations CRM actives selon expected_date (opportunités sans date exclues et signalées), commandes clients non brouillon / non annulées selon order_date, marge prévisionnelle des commandes depuis les coûts snapshotés ; pilotage Engagé = achats HT validés selon validated_at. Jour de commande / validation en Europe/Paris ; pas de somme entre devises. Une marge est rapportée au CA HT des seules commandes au coût historique connu, signalement des pièces sans coût. Réalisé / Facturé / Payé restent indisponibles avant raccordement des modules concernés. Planning : tâches personnelles datées non terminées des modules accessibles et échéances CRM du responsable connecté sur sept jours. Activité : six événements personnels récents (actions, mentions, tâches attribuées), sur des sources accessibles, sans audit brut ni source supprimée.

Calendrier — événements manuels : bouton Ajouter un événement, fiche HDialog canonique, titre, date / horaires début et fin, journée entière, fuseau, lieu / lien, notes, couleur. Visibilité Personnel par défaut ou Équipe ; seul le créateur habilité modifie ou retire l’événement. Clic sur l’événement ouvre la popup ; retrait après confirmation simple, historique conservé par archivage. Dates métier inchangées dans leurs modules sources, aucun envoi mail ni invitation automatique. Les événements personnels datés alimentent aussi Mon planning du dashboard selon les droits.

Courbes des indicateurs du dashboard : tracés en arrière-plan des tuiles, période identique aux montants. Série non cumulative de montants HT : jours pour un mois (31 jours maximum), intervalles de sept jours pour un trimestre (100 jours maximum), mois pour une année. Même base de date, droits, annulations et snapshots que l’agrégat ; jours sans montant à zéro, coûts inconnus exclus de la marge. Devises affichées séparément avec échelles indépendantes, sans conversion. Facturé reste sans courbe avant raccordement des factures.

AO — étape À télécharger (`to_download`) ajoutée avant À analyser. Le dossier reste autonome jusqu’à la décision de répondre ; création par défaut en À analyser conservée. Kanban desktop : colonnes ouvertes réparties dans la largeur restante entre les rails repliés, sans largeur minimale fixe de 280 px.

Apparence → Sidebar : réglages communs de sidebar complétés par largeur dépliée, taille des textes des entrées / sous-menus / titres, taille des pictogrammes, arrondi / marge intérieure des entrées et retrait des sous-menus. Les hauteurs et espacements existants restent disponibles. Aperçu Dépliée / Repliée indépendant de la sidebar réelle ; application après Enregistrer, conservation des valeurs déjà réglées, mobile conservé en mode pictogrammes.

Sidebar / Apparence : couleurs de fond (dégradé trois points), textes, icônes, titres, sous-menus, sélection (dégradé et texte), teinte de survol. Réglages communs aux utilisateurs et aux deux thèmes ; aperçu en direct limité à la zone d’exemple jusqu’à sauvegarde. Couleurs actuelles conservées par défaut.

Apparence : six onglets Général / Tableaux / Champs et textes / Boutons / Sidebar / Menu des modules, avec aperçu propre au thème et sections de sidebar repliables. Réglages numériques sans slider : saisie directe et − / +, limites visibles.

Apparence des tableaux : couleur des bordures configurable dans les deux thèmes, dans la même section que l’en-tête ; aperçu local et propagation commune après Enregistrer.

Analytique A01 : analyse consolidée de l’affaire et détail des commandes. Coûts directs de racine distincts des coûts affectés aux enfants ; chaque source compte une seule fois. Revenus et budget issus des snapshots confirmés, achats engagés séparés des consommations de stock réellement valorisées. Temps, frais et facturation non raccordés restent indisponibles, pas zéro fictif ni marge réelle complète annoncée. Périmètre analyse : affaires dont l’utilisateur est responsable / toutes ; accès financier indépendant de la lecture des fiches métier, coûts individuels réservé par droit supplémentaire.

Analyse — accès disponibles : onglet partagé sur opportunité enregistrée et commande client confirmée ; Finance → Analyse des affaires (/analysis), recherche / état / tri / regroupement par client et pagination via composants communs. Consultation d’une source conserve son droit métier. Choix de commande facultatif dans la ventilation d’achat, à l’intérieur de l’affaire ; sans commande, coûts communs. Les prochaines saisies BE / production / frais reprendront ce même compte racine ou enfant, sans nouveau système de codes.

Analyse — complément heures : tableau BE / PROD (clé technique `production`), colonnes Prévu / Réalisé, détail coûts communs et commandes, total consolidé. Réalisé limité aux time_entries validées ; brouillons / soumis séparés comme attente, annulés / rejetés exclus. Planning distinct. Le lot TimeReport BE T01 fournit la saisie et ses heures validées ; PROD OnSite reste à raccorder. Une source absente reste explicitement indisponible.

Analyse — carte Commande Client : comparaison du montant estimé courant de l’opportunité avec le total HT des commandes confirmées. Dans une analyse de commande seule, la barre Estimé affaire reste explicitement le montant global de l’opportunité.

Catalogue — fiche produit : quantité physique en stock, disponible après réservations et réservée, consolidées sur les emplacements actifs des entrepôts actifs via le service Stock. Même donnée pour le smart bouton et le bandeau d’identité, pas de requête indépendante. Produits sans gestion de stock et fiches non enregistrées sans faux compteur.

Stock de fiche produit : Réservé consultable depuis le compteur, détail des réservations actives avec auteur, commande, affaire / client, emplacement et quantité. Lecture seule possible sans modification de la fiche.

Historique des achats produit : projection Purchasing des lignes de commandes fournisseur validées, hors brouillons et annulations, sous permission purchasing.read. Quantité réellement commandée et unité de la ligne, prix / remise / total historiques, identité fournisseur snapshotée. La colonne 2 Commande ouvre la fiche canonique en popup ; colonne 4 Quantité achetée. Cet historique remplace l’affichage des changements de conditions fournisseurs ; inventory_supplier_price_history reste conservé pour audit des tarifs, sans être présenté comme un achat.

### Mon compte — profil personnel

Chaque compte Horizon actif, y compris Viewer, peut modifier son prénom, son nom, son nom affiché et son e-mail de contact. La photo est gérée dans Employés (PNG / JPEG / WebP, 2 Mio) et récupérée par l’association du compte ; aucun import / remplacement / retrait depuis Mon compte. Nom et photo effective sont affichés dans le menu utilisateur. Adresse de connexion, profil ERP et rôle sont consultables, administrés séparément. Changement de mot de passe avec vérification du mot de passe actuel, confirmation et minimum 12 caractères ; reconnexion nécessaire ensuite. Les données Employés ne sont pas modifiées par ce parcours.

Présence utilisateur : état manuel Présent / Absent / Occupé / Hors ligne, modifiable depuis Mon compte et le menu utilisateur ; rond vert / orange / rouge / gris sur l’avatar du compte. Hors ligne est un choix manuel, sans déduction de connexion. Référentiel prévu pour la future Messagerie, sans présence affichée dans les fils métier. Les fils montrent la photo actuelle de l’auteur, y compris sur les anciens événements, et conservent le nom historique snapshoté.

Stock T01 / Parc I01 — 12 octobre 2026 : premier périmètre opérationnel implémenté et vérifié localement. Réception de lots et séries, sélection des identités aux sorties, réservations, transferts, retours et inventaires ; contrôles serveur atomiques. Numéros conservés lors du passage au parc interne. Les achats distinguent Stock / Vente, Consommation interne, Parc interne, Immobilisation ; destination par ligne (commande mixte possible), conservée depuis la demande jusqu’à la réception, sans fausse affaire CRM pour l’interne. Réception interne : réception IN puis affectation OUT liée par internal_parent, dans une seule transaction ; rattachement au parc ou consommation ; l’immobilisation est préparée en registre draft puis qualifiée séparément en Finance. Sage reste la vérité comptable Phase 1.


Accès : Stock → Parc interne, Finance → Comptabilité → Immobilisations. Saisie lots / séries dans les lignes des réceptions, sorties et transferts via une fenêtre partagée ; fiche produit → Lots / Séries pour état, quantités commerciales et historique des pièces. Lots : péremption, quarantaine, réactivation et clôture uniquement si stock nul ; changements audités et versionnés. Une quarantaine bloque réservations et prélèvements. Livraison directe : identité enregistrée comme livrée, sans mouvement ni stock local. Le suivi et l’unité d’un produit ayant des mouvements/réservations sont figés.

Parc : objets unitaires issus d’un achat explicitement interne ou d’une affectation de stock, provenance IN/OUT, série conservée, entrepôt/emplacement physiques, collaborateur/équipe selon périmètre RH, états Disponible/Affecté/En réparation/Retiré/Remis en stock. Fil utilisateur partagé. Retour via la fiche du matériel, création d’un RET lié, pas de suppression. Une immobilisation enregistrée doit d’abord être déclassée avec motif dans Finance. Les bases d’acquisition enregistrées sont figées, audit complet ; aucun amortissement, écriture comptable, export ou synchronisation Sage implicite. Maintenance détaillée, prêts/location et régularisation de traçabilité d’un stock ancien non identifié restent à cadrer.

A02 : fenêtre de ventilation d’achat commune demandes / commandes : Affaire, Stock ou Interne. Interne sélectionne Immobilisation, Consommable, Logiciel / Abonnement, Prestation / Service, Petit équipement non immobilisé. Stock/interne affectent la quantité entière au compte fixe correspondant ; Affaire conserve les ventilations multi-affaires / commandes. La catégorie d’imputation conserve son identité relationnelle malgré renumérotation. Paramètres → Codes analytiques fixes permet d’éditer numéro et libellé ; catégories structurelles, droits settings.references Admin/Superuser, unicité et audit serveur. Les logiciels/services sans stock restent des lignes d’achat, sans réception fictive.

Confirmation commande client : numéro obligatoire, sauf case explicite Attente Commande (champ grisé affichant Attente Commande, saisie conservée si décochée). Pièce facultative par dépôt ou sélection PDF / JPEG / PNG / WebP, 10 Mo maximum, validation du fichier côté serveur. Les boutons centrés à pictogramme Préparer la commande et Réserver le stock disponible sont des choix activables (état aria-pressed). Préparer la commande, disponible avec droit d’achat, affiche le panneau de besoins dans la confirmation, sous les boutons ; aucune commande fournisseur définitive créée automatiquement.

L’action Préparer les achats de la commande ouvre la même fiche canonique en popup via RecordWorkspace, sans navigation ; les besoins, la source et les quantités nettes sont chargés via le service d’approvisionnement. Zone de dépôt de commande client : hauteur minimale 150 px, contenu centré.

Préparation intégrée à la confirmation : panels Stock et Achats simultanés. Appliquer les réservations / Appliquer la préparation marque le choix prêt par un check ; une modification des réservations invalide la préparation des achats. Le panneau Achats propose sélection de lignes, quantité nette, fournisseur et PUA connu ; les options sont exclues. Confirmer crée côté serveur la commande, les réservations et une demande d’achat draft dans la même transaction. Aucune nouvelle fenêtre ne s’ouvre après cette confirmation. L’action Préparer les achats sur une commande existante conserve la fiche canonique en popup.

Création de devis : CGV actives désignées par défaut dans Paramètres → Ventes → Conditions de vente (case Par défaut dans la liste et CGV par défaut dans le popup), unicité serveur. Nouveau titre proposé depuis l’opportunité sans écraser un titre personnalisé ; première ligne vide réutilisée par l’ajout d’un produit ou d’une ligne. Lignes entièrement vides conservées à la sauvegarde comme espacements sans montant ; données partielles contrôlées normalement. Seul le placeholder initial isolé peut être repris par un ajout ; les espacements enregistrés ne sont jamais remplacés implicitement. Total HT davantage mis en avant que TTC, avec ou sans remise. Recherche Produit partagée sans sélection/check de ligne ; ajout via + uniquement. Produit ajouté : flèche en extension à droite du champ Description ouvre sa fiche canonique dans RecordWorkspace ; coût/PUV du devis ne sont pas modifiés implicitement par une consultation.

Fil d’activité : lecture ciblée des événements et tâches par fiche via le service Core, sans requête transversale sur toutes les sources. AO conserve les échanges de son opportunité. Pagination, filtres, photos protégées et permissions existantes conservés. Un refus de chargement HTTP 400 n’est plus présenté comme une publication refusée.

Livraisons — 13 octobre 2026 : option Paramètres Stock auto_prepare_deliveries, désactivée initialement, préparation de BL OUT draft à validation des réceptions affectées aux affaires. Rattachement exact DA/BC → ligne de commande ou ventilation analytique ; ambiguïtés affectées explicitement, jamais au hasard. Préparer une livraison depuis une commande utilise le même service idempotent et préremplit même à stock nul. Disponibilité par ligne et synthèse homogène (unités différentes : lignes prêtes), sans mouvement avant validation. Validation partielle avec quantités réelles, conservation des quantités prévues et reliquat lié créé transactionnellement ; droits, réservations, identités et immutabilité restent contrôlés serveur.

Précisions Livraisons : préparation couvrant le reste de la commande après déduction des sorties réalisées (même archivées) et des brouillons actifs. Un brouillon automatique intact peut être complété ; un brouillon édité manuellement est conservé. Une réception multi-affaires prépare un BL par commande identifiée ; plusieurs commandes compatibles exigent un choix explicite dans la réception. Activation de la règle applicable aux futures validations de réceptions, sans reprise automatique des réceptions historiques. Disponibilité indicative = libre + réservations propres à la ligne, par emplacement, hors quarantaine/péremption ; elle ne réserve pas les produits. La validation contrôle à nouveau le stock réel et les identités ; livrer 2 sur 4 crée seulement les mouvements de 2 et prépare un brouillon lié de 2, atomiquement. Aucun contournement du stock négatif ; les séries réellement livrées sont sélectionnées dans la confirmation.

Devis / Modèles — 13 octobre 2026 : bouton Sous-titre placé entre Titre niveau 3 et Note. Ligne descriptive sans quantité, montant, sous-total ni nouveau niveau hiérarchique ; elle accompagne les sections et conserve leurs règles de repli / options sans modifier les totaux. Le studio propose un style Sous-titre distinct, gras par défaut. Les styles permettent quatre côtés de bordure indépendants, couleur hexadécimale et épaisseur de 0 à 10 px (décimales acceptées). Styles enregistrés dans le modèle et appliqués à l’aperçu HTML paginé ainsi qu’aux documents transmis à Gotenberg. Ancien trait inférieur de 1 px conservé en absence de réglages explicites ; versions publiées et pièces historiques non réécrites.

Devis — 13 octobre 2026 : les lignes vides ajoutées et les notes laissées vides restent dans leur ordre à l’enregistrement, en kind spacer, sans quantité/unité/prix/coût. Lignes consécutives, duplication et confirmation en commande conservées. Rendu documentaire : espace pleine largeur de 24 px sans chiffres ni bordures. Saisir du texte dans un espace le transforme en Note ; une ligne partiellement renseignée avec un prix ou un produit conserve ses contrôles et ne devient pas silencieusement un espace.

Facturation interne — décision du 13 octobre 2026 : Sage et SUPER PDP en standby, aucun appel/transmission/export automatique. Le bouton principal Facturation ouvre un dashboard en onglets Clients / Fournisseurs, un seul côté à la fois : brouillons, encours/retards, mouvements du mois, sources restant à facturer/rapprocher et prochaines échéances. Factures/avoirs dans de vrais états draft/validated/cancelled, paiement calculé séparément. Préparations explicites depuis commandes/BL/réceptions, facturation partielle, acomptes et solde avec déductions traçables ; factures fournisseurs avec référence originale, fichier protégé et contrôle des écarts motivés. Avoirs liés, règlements partiels/multi-factures et corrections auditées. Premier lot EUR ; les autres devises exigent le service BCE avant validation, sans taux inventé.


### Parcours livré Billing B01 — 13 octobre 2026

Facturation → dashboard → Factures clients / fournisseurs / Avoirs / Règlements. Listes de 30 pièces par page, recherche dans la top bar et critères dans l’URL. Pièces manuelles, produits via le sélecteur partagé, notes descriptives, ordre des lignes conservé, ventilation analytique de chaque ligne manuelle à 100 %, échéanciers à somme TTC. Les préparations depuis commande, BL ou réception sont explicites et créent un brouillon contrôlable ; plusieurs sources du même tiers peuvent être regroupées. Les lignes d’une opération restent liées à cette opération exacte. Une préparation active retient déjà les quantités ; annuler le brouillon les libère. Le suivi Facturé des commandes clients distingue le réalisé des préparations.

Acomptes rattachés aux commandes, déductions plafonnées et traçables par ligne/TVA, solde restant à facturer. Avoirs sur facture validée, quantités et montants limités aux restants ; dernier avoir partiel absorbe les arrondis historiques, y compris TVA. Un acompte consommé doit être corrigé via le solde avant crédit direct. Règlements partiels ou multi-factures d’un même tiers/sens, remboursements plafonnés au réellement remboursable ; annulation motivée conservée. Annuler un paiement ayant financé un remboursement exige de corriger d’abord ce remboursement. Les encours/retards restent visibles malgré l’archivage des pièces.

Facture fournisseur : numéro d’origine unique normalisé par fournisseur/type, original protégé obligatoire à validation, rapprochement commande/réceptions et motif obligatoire des écarts prix/quantité reçue. Une facture peut précéder une réception si l’écart est explicitement motivé ; la facturation ne modifie pas le stock. Les commandes liées à une préparation active ou facture validée ne reviennent pas en brouillon. Les pièces validées se corrigent par avoir, avec snapshots et fil d’activité conservés.

Paramètres → Facturation : identité/adresse/banque/mentions de l’émetteur, codes TVA configurés, délai et conditions. Les taux de codes déjà utilisés dans un historique validé ne sont pas réinterprétés. Paramètres → Modèles de pièces : type Factures et avoirs, champs Billing et aperçu sur facture/avoir existant. Avant émission réelle, compléter et faire vérifier les mentions applicables à CVS ; référence réglementaire : [Service Public — mentions des factures](https://entreprendre.service-public.gouv.fr/vosdroits/F31808?lang=fr). Le lot ne constitue pas une certification de conformité ou une transmission électronique.

Limites explicites : EUR, TVA configurée via le service de taxe existant ; change BCE et automatisation des contextes fiscaux internationaux à compléter avant ouverture de ces parcours. Aucun envoi, statut Envoyé, synchronisation Sage/PDP, paiement bancaire initié ou PDF envoyé archivé simulé. Le dashboard principal Analyse et les écritures comptables restent des raccordements distincts. Installation/recette NAS non effectuées.

### Conditions de paiement et valeurs par défaut — 13 octobre 2026

Paramètres → Facturation → Paiement et mentions : plusieurs conditions (code, libellé, délai en jours, texte sur la facture), ajout et retrait avec archivage. Conditions initiales À réception / 30 / 45 / 60 jours ; le délai et le texte antérieurs sont conservés comme défaut à la migration. Une case rose « Par défaut » dans le tableau désigne la condition globale unique. Le tableau TVA utilise la même colonne, remplaçant le sélecteur séparé.

Fiche société → Comptabilité : combobox « Conditions de paiement du client », ou héritage des paramètres si aucun choix. Nouvelle facture manuelle à sélection du client, ou préparation depuis commandes/BL/réceptions : reprise de sa condition active, sinon du défaut global, et calcul de l’échéance en jours calendaires depuis la date de facture. Dans tout brouillon, choix d’une autre condition, personnalisation libre du texte et de l’échéance ; « Conditions personnalisées » détache le modèle sans effacer le texte. La sauvegarde/relecture conserve ces saisies. Après validation, champs et document sont figés. Changer le client ou le référentiel n’actualise pas les factures déjà enregistrées. Les échéanciers avancés restent saisis explicitement ; aucun calcul de fin de mois ou de mensualités ajouté à ce lot.

### Fiche facture et référence de commande client — 13 octobre 2026

Facture : frise partagée Brouillon → Validée → Soldée ; solde issu des règlements/avoirs serveur, aucun état d’envoi simulé. Annulation de brouillon affichée comme telle. Smart buttons Commandes clients / Bons de livraison dans la zone related du fil d’Ariane, droits des modules sources respectés ; fiche directe pour une pièce, sélection dans HDialog/HDataTable pour plusieurs. Pour une facture préparée depuis des BL, liens vers ces BL exacts ; depuis commandes, liens vers leurs BL associés non annulés (hors sorties internes/rebuts), préparations incluses.

Onglets Informations / Échéancier / Conditions / Pièces jointes, avec champs et tableaux partagés, panneaux montés pour conserver les saisies et onglet conservé dans l’URL. Les changements d’onglet ne déclenchent pas la confirmation de sortie de brouillon. Informations contient la référence externe de commande client, reprise des sources et modifiable en brouillon ; référence visible dans le modèle standard et binding invoice.customer_order_number disponible dans le studio. Une facture validée conserve sa propre référence, indépendamment des changements futurs des commandes.

Commande confirmée : référence externe modifiable dans Informations sans rouvrir les prix/lignes ; vide ou Attente Commande représente l’attente. Enregistrer utilise l’action existante de fiche, version et droits de confirmation contrôlés serveur, modification auditable. Le pictogramme de fichier accolé au champ via HInputWithAction ouvre le popup de gestion de pièce, rose si elle est présente ; miniature et aperçu protégé partagés. Liste Commandes clients : dernière colonne N° commande client, HTag vert pour référence renseignée, rouge pour Attente Commande ; aucun changement des recherches/filtres/navigation de liste.

### Commande client : actions et preuve après confirmation — 13 octobre 2026

Libellé uniforme « Attente Commande » dans confirmations, listes, références de facture et affichage des changements de référence. Les anciennes variantes de casse sont reconnues et présentées ainsi, sans réécriture des snapshots ni des fichiers historiques.

Commande acceptée : boutons à droite des onglets, dans l’ordre Préparer les achats / Réserver le stock / Préparer la livraison / Préparer la facture. Affichage selon permissions et besoins lus depuis les services propriétaires : achats si quantité nette à préparer, réservation si capacité non déjà réservée et disponibilité physique, livraison si quantité physique non encore réalisée, facture si quantité non facturée et non couverte par un brouillon. Un BL déjà préparé reste accessible via les smart buttons et l’action de préparation idempotente tant que la livraison n’est pas réalisée. Achats et factures déjà préparés utilisent leurs smart buttons. Aucun résultat serveur inconnu n’est assimilé à un besoin positif ; erreurs visibles.

Informations de commande : Opportunité / Titre du devis, puis Commercial / Numéro de commande client / Date de la commande sur trois colonnes desktop, empilées sur mobile. Date issue de sales_orders.order_date, en consultation ; date et validité du devis ne sont plus affichées dans cet état. Prix/lignes/commercial restent figés ; référence externe demeure corrigible. Titre et en-têtes du tableau de commande fixes dans le contexte de défilement partagé.

Pictogramme de fichier du champ de référence : ouvre toujours le popup partagé de gestion de pièce, avec miniature cliquable de la preuve actuelle, ajout, remplacement et retrait selon les droits. Ajout après confirmation avec droit sales.order.confirm, sur version fraîche et commande non archivée ; PDF/JPEG/PNG/WebP, 10 Mo maximum par fichier, plusieurs pièces possibles. La zone de dépôt est mutualisée avec la confirmation. Un nouvel événement document reçoit le fichier protégé, la preuve initiale et les montants/snapshots sont conservés. Remplacement et retrait explicitement enregistrés : nouvel événement et audit, anciennes pièces protégées conservées dans le fil. Annuler ou Conserver la pièce actuelle ne modifie rien côté serveur.

Gestionnaire de pièce de commande — disposition du 13 octobre 2026 : dépôt et fichier sélectionné à gauche, aperçu direct PDF/image à droite avec agrandissement. Nom du fichier sans champ de titre supplémentaire ; plusieurs pièces, sélection d’une ligne affichée dans l’aperçu de droite sans autre popup. Sélection de remplacement affichée immédiatement avant enregistrement, retrait/annulation/conservation de la pièce actuelle inchangés ; empilement sur mobile. Aucune modification du contrat serveur ni des preuves historiques.

Pièces multiples — 13 octobre 2026 : sélection/dépôt multiple, ajouts successifs et retrait ciblé avant enregistrement, aussi disponibles à la confirmation. Une nouvelle pièce s’ajoute aux existantes ; remplacer consiste à retirer la pièce voulue et ajouter sa nouvelle version dans le même enregistrement transactionnel. Sélection d’un fichier : uniquement aperçu de droite, aucun agrandissement en popup depuis le gestionnaire. Annuler rétablit toutes les pièces ; les anciens fichiers restent protégés dans le fil. Limite structurelle de 20 pièces actives, PDF/JPEG/PNG/WebP de 10 Mo chacun.

### Filtres dynamiques Ventes — 13 octobre 2026

Première page du chantier de rationalisation, autres modules inchangés dans leur sélection actuelle. Ventes principale affiche devis et commandes ; sous-menu Devis / Commandes clients présélectionne le type sur la même liste. Type de pièce puis états contextuels avec sélections multiples : Devis (Brouillon/Finalisé/Envoyé/Refusé/Annulé), Commandes (confirmed/in_progress/completed existants). Plusieurs états dans une famille = OU. Avec les deux types, chaque famille d’états ne contraint que sa branche ; les branches sont réunies puis intersectées avec recherche, société, opportunité, produit et archives. Choisir un seul type retire les critères incompatibles de l’autre branche.

Archives est indépendant des états, compact comme CRM, non archivés par défaut / archivés. Une pastille par choix, retrait individuel ; réinitialisation conserve le texte recherché et remet la pagination à la première page. Recherche/critères/groupement/tri conservés dans l’URL et au retour de fiche. Anciens liens status=quotes/accepted/archived repris en URL canonique ; filtres et archives validés serveur. Synthèse calculée dans le contexte recherché et d’archives, indépendamment des types/états sélectionnés pour permettre les changements par cartes. Aucune transition métier ni migration ajoutée.


Filtres Ventes — complément du 13 octobre 2026 : N° commande client permet Numéro renseigné / Attente Commande, choix cumulables et contexte conservé dans l’URL. Ne contraint que les commandes si la liste inclut aussi des devis ; recherche inclut le numéro client précis. Regroupements par société, état ou numéro client sur les résultats paginés, via le composant partagé. Apparence et densité ajoute l’onglet Filtres : dimensions et couleurs avec aperçu local interactif, publication commune uniquement à l’enregistrement ; droits Admin/Superuser inchangés.


Achats — filtres et regroupements du 13 octobre 2026 : fournisseur et opportunité se recherchent dans le champ contextuel, sans listes de sélection exhaustives dans SearchFilters. Regroupements Fournisseur / Opportunité / État sur accueil, DA et BC ; une pièce multi-opportunités reste unique, groupe identifié par sa combinaison d’opportunités. Liens métier avec supplier/opportunity conservent leur contexte URL. La recherche couvre les fournisseurs proposés de DA et les noms/numéros d’opportunités ventilées ; recherche CRM seulement avec crm.read.


Achats — correction archivage du 13 octobre 2026 : critère Archives séparé de l’état métier, Non archivés par défaut / Archivés, présentation compacte comme CRM. L’état choisi, le regroupement et la recherche restent conservés lors de la bascule. Synthèses comptées dans le contexte d’archives choisi ; anciens liens status=archived normalisés vers state=archived avec tous les états. Accueil conserve les pièces en attente par défaut, sans confondre ce critère avec l’archivage.


Stock — rationalisation des filtres du 13 octobre 2026 : SearchFilters et GroupedResults partagés, choix multiples compatibles (OU par famille, intersection des critères communs), recherche et critères conservés dans l’URL. Opérations : types multiples, sous-types de sortie contextuels, états multiples dont En cours, archives compactes indépendantes ; regroupements entrepôt/type/état/opportunité/fournisseur. Inventaires : états multiples et archives, groupes entrepôt/état/opportunité, sans critère de type ni fournisseur inutile. Produits : familles multiples, archives compactes en dernier, groupes famille/marque ; les cartes conservent la recherche et les critères de présentation. Disponibilités : physique/réservé/disponible multiples, groupes emplacement/marque, noms/codes d’emplacements et entrepôts dans la recherche. Parc interne : états multiples et groupes état/entrepôt, recherche incluant marque/entrepôt/emplacement. Affaires/emplacements/entrepôts ne sont plus énumérés dans les panneaux ; les liens métier conservent leurs critères de contexte. Aucun archivage artificiel des disponibilités calculées ou du parc : retrait/remise en stock restent des états métier, sans les confondre avec les archives des produits et opérations.


Opérations Stock — présentation du 13 octobre 2026 : bascule Tableau de bord / Liste sur la référence Kanban/Liste du CRM. Tableau de bord à l’ouverture sans critère explicite, tuiles et prévisions de toutes les opérations actives, sans appliquer les critères mémorisés de la liste. Liste : tableau/pagination, recherche/filtres/groupes/tri de la top bar, sans tuiles. Choix view=dashboard|list conservé dans l’URL ; bascule conserve critères mais revient en première page. Les anciens liens filtrés ouvrent la liste, les tuiles écrivent view=list ; recherche depuis le tableau de bord ouvre la liste. Inventaires conserve Liste/Calendrier.


Achats — type DA/BC du 13 octobre 2026 : Type de pièce en premier sur l’accueil commun, DA et BC cumulables ; états contextuels en dessous, multisélection (OU), archives séparées en dernier. Choisir un seul type retire les états incompatibles et conserve recherche/archives/groupes/tri. Accueil en attente par défaut, Tous les états explicite conservé ; cartes DA en attente et Bons de commande portent désormais kind sans mélanger le type au statut. Listes dédiées gardent leurs états multiples sans un sélecteur de type contradictoire avec leur route. Anciens liens normalisés, URL/rechargement et reset conservant q.


### Photos des employés et comptes associés — 13 octobre 2026

La photo se gère uniquement sur la fiche Employé, avec aperçu visible à 88 px, initiales en absence de photo, Ajouter / Remplacer / Retirer, aperçu immédiat du fichier sélectionné et validation PNG/JPEG/WebP, 2 Mio. Import, remplacement et retrait restent préparés jusqu’à Enregistrer ; Annuler conserve la photo actuelle. Le lecteur consulte l’image sans contrôles d’édition. Pied de popup partagé avec Annuler / Enregistrer à droite, visible lors du défilement.

Cartes, Liste, Organigramme, liste Utilisateurs, menu, Mon compte et photos du fil utilisent l’identité photographique de l’employé associé. Mon compte affiche la photo et l’origine, sans import/retrait séparé ; lien vers la fiche avec droit de lecture Employés, sinon indication de contacter son gestionnaire. Compte non rattaché : rattachement explicite par Admin, aucune création automatique d’employé ; ancienne photo du compte conservée en lecture historique. Migration de reprise et nouvelle association conservent les fichiers originaux et ne remplacent pas une photo employé existante. Reprise traitée une seule fois pour empêcher la réapparition après suppression / dissociation / réassociation. Ni responsabilités ni droits ne changent.

Liste Produits / quantité en stock — 13 octobre 2026 : la colonne Unité est remplacée par Qté en stock, quantité physique totale des emplacements/entrepôts actifs avec unité de base et précision maximale de six décimales. Zéro réel affiché, tiret pour un produit sans gestion de stock ou une projection absente ; aucune estimation depuis les commandes entrantes. Distinction conservée avec le disponible après réservations affiché en Cartes et dans la fiche. Tri, filtres, groupes et navigation inchangés.

Recherche contextuelle / réinitialisation rapide — 13 octobre 2026 : une croix intégrée à droite du bouton Filtres permet de remettre les filtres, regroupement et tri aux valeurs par défaut du module, comme Réinitialiser dans le panneau. Visible uniquement avec un critère actif ; recherche, vue et contexte de provenance conservés, pagination remise à la première page. Comportement partagé par toutes les listes raccordées à WorkspaceSearch, utilisable sans ouvrir le panneau et au clavier.


Accueil Facturation / onglets — 13 octobre 2026 : Clients par défaut, Fournisseurs via direction=supplier conservé au rechargement. Une synthèse et ses échéances/pièces/sources à la fois ; création et Toutes les factures concernent le côté sélectionné. Tableaux vides remplacés par leur message de consultation, sans en-têtes inutiles. Fil d’Ariane des listes/fiches fournisseurs et des règlements filtrés Fournisseurs revient au bon onglet. Onglets accessibles au clavier et sur mobile, composants partagés HRecordTabs/HSummaryCards/HDataTable/HSectionHeading. Aucun changement des calculs, statuts, numérotations, données ou permissions ; Sage/SUPER PDP restent en standby.


Préparation de facture fournisseur depuis un BC — 13 octobre 2026 : commande fournisseur active validée, bouton Préparer la facture fournisseur à droite de l’onglet Informations partagé comme les commandes clients. Préparation explicite par le service Billing, ouverture d’une nouvelle facture préremplie sans sauvegarde automatique ; bouton masqué si toutes les quantités sont facturées/couvertes par des brouillons, brouillons accessibles via les liens existants. Dans une nouvelle facture fournisseur, choix direct du bon de commande via combobox, fournisseur et lignes (références, unités, prix nets de remise, TVA, analytique et quantités restantes) repris du serveur. Préparation avancée depuis plusieurs commandes/réceptions conservée. Nouvelle source avec des lignes déjà saisies : confirmation avant remplacement ; numéro fournisseur, dates de facture/prestation, notes et modèle conservés, conditions/échéance reprises du fournisseur, échéancier remis à préparer. Numéro réel de facture fournisseur et pièce originale restent fournis par l’utilisateur ; contrôle de rapprochement inchangé, notamment avant réception. Écriture en draft uniquement à Enregistrer, sauvegarde bloquée pendant le chargement. Source BC conservée dans les lignes et l’en-tête, contrôle serveur des doublons et permissions existant, aucun champ persistant ou workflow externe nouveau.

Création de facture / action de préparation — 13 octobre 2026 : Préparer depuis BC sur facture fournisseur, à droite des onglets. Action de préparation client au même emplacement avec son libellé de source existant. Conditions de disponibilité, rattachement direct et popup de préparation inchangés.

### Notes de frais E01 — cadrage validé le 13 octobre 2026

Une note principale par employé et mois civil ; compléments explicites liés à une note validée/remboursée du même mois, sans réécriture d’historique. Mes notes pour l’utilisateur ; Équipe pour le périmètre manager/global, avec carte À valider et historique accessible via les filtres (onglet À valider retiré le 19 octobre 2026). Statuts draft / submitted / returned / validated / reimbursed / cancelled ; retour motivé vers édition, nouvelle soumission ; aucune auto-validation ni seuil d’approbation. Responsable principal actif lié à un compte habilité par défaut, validateur global explicitement sélectionnable si aucun responsable habilité ; absence bloquant la soumission. Destinataire snapshoté à soumission ; réaffectation réservée à un gestionnaire global et auditée.

Chaque dépense : date du mois, catégorie paramétrable, description/motif, EUR, TTC, TVA justificative (pas de déduction automatique), personnel/entreprise ; opportunité reprenant société/contact/compte analytique existant, sinon société et/ou contact, ou Frais internes avec motif obligatoire. Restaurant : invités contacts multiples, participants internes et motif ; déplacements : trajet ; carburant : véhicule ; matériel : description. Une ou plusieurs pièces PDF/JPEG/PNG/WebP protégées par ligne (10 Mo, 20 pièces), picto fichier rose si présent, gestionnaire partagé avec aperçu à droite. Brouillon incomplet autorisé ; aucune ligne incomplète ni sans justificatif à la soumission. Montants agrégés serveur en centimes, total remboursable limité au paiement personnel. Validation fige lignes, relations/contextes et montants ; correction par retour avant validation ou complément après. Remboursement complet enregistré par permission distincte, date/référence obligatoires, pas de virement ni export Sage/PDP automatique. Notifications internes transactionnelles à soumission, retour, validation et remboursement ; historique core_activity_events, audit distinct.

Notes de frais / correction UX — 14 octobre 2026 : popup segmenté Dépense / Montants et paiement / Rattachement / Participants ou déplacement, justificatifs et aperçu partagé. Fil d’activité partagé sous la fiche, commentaires/mentions/tâches avec contrôle du périmètre de la note, sans tableau Historique parallèle. Mois modifiable sur une note principale draft/returned, unicité mensuelle et version contrôlées côté serveur ; dates de dépense conservées, signalement hors mois et soumission bloquée jusqu’à correction. Compléments liés gardant le mois de l’original et pièces validées immuables.

Notes de frais / harmonisation de la saisie — 15 octobre 2026 : informations Employé (propriétaire créateur, lecture seule), Mois, Manager et Description de la note. Tableau commençant par # puis Date, description explicite, colonne Payé par avec Employé / Société ; numéros recalculés selon l’ordre enregistré, déplacement uniquement en édition. Ajouter une dépense sous le tableau, comme les lignes DA/devis. Popup avec onglets Dépense / Justificatifs : formulaire pleine largeur en zones métier, participants restaurant immédiatement après la dépense, défilement interne et actions fixes ; aperçu dans le gestionnaire partagé. Le trombone ouvre directement Justificatifs ; les saisies et pièces en attente sont conservées entre onglets. Aucun changement de validation ni du montant remboursable.


Commande fournisseur — sélection produit (14 octobre 2026) : le popup Ajouter un produit affiche Disponible immédiatement avant Actions. Quantité disponible consolidée après réservations, emplacements/entrepôts actifs, avec unité de base et six décimales maximum ; zéro affiché, tiret si sans gestion de stock ou projection absente. Réutilise available_quantity du Catalogue, aucun champ persistant ni calcul de stock côté interface. Le sélecteur commun active cette colonne pour les commandes fournisseurs.


Liste Produits — 14 octobre 2026 : Qté disponible suit immédiatement Qté en stock dans /inventory, y compris les tableaux regroupés. Disponible = stock physique moins réservations actives, projection Catalogue existante consolidée sur les emplacements/entrepôts actifs ; unité de base, six décimales maximum, alignement numérique à droite, zéro réel et tiret pour absence de projection ou produit sans stock. Les deux quantités restent distinctes ; aucun changement de schéma, recherche, tri ou filtres.


Tri des en-têtes — 14 octobre 2026 : bouton partagé croissant/décroissant sur les critères disponibles des listes principales. Contacts/CRM reprennent leur tri existant ; Produits expose nom/référence/marque/famille/coût/prix/physique/disponible ; Ventes numéro/titre/date/HT ; Achats numéro/titre/date/date souhaitée ; factures/avoirs numéro/tiers/date/échéance/TTC/solde ; règlements date/tiers/montant/mode/référence ; employés nom de famille/poste, équipes nom, utilisateurs nom ; notes de frais mois/employé/TTC/remboursable ; opérations numéro/titre/date, inventaires date planifiée, disponibilités produit/référence, parc interne numéro/nom. Les autres colonnes ne simulent pas de tri. URL et panneau Trier par partagés, retour en première page, calcul global avant pagination, filtrage métier et permissions conservés. Aucun changement des pièces ni snapshots.


Tri complet des listes — correction du 14 octobre 2026 : toutes les colonnes métier des listes Contacts/personnes, CRM/AO, Ventes, Achats, facturation/règlements, employés/équipes/utilisateurs, notes de frais et Stock sont triables ; seule Actions est exclue. Complète notamment société/fournisseur/affaire/état/référence client, responsable/compte et relations multiples, étapes/tags/visites/documents AO, physique/réservé/disponible/entrant/valeur/emplacement, progression de livraison et affectation du parc. Les flèches sont à droite dans chaque cellule d’en-tête sans déplacer l’alignement des titres. Tri des relations par libellés visibles ordonnés, des nombres par valeur et des livraisons par proportion prête ; données inconnues en fin de liste. Les tris Contacts sont aussi valides dans les vues enregistrées.

Disponibilités — pagination par ligne (14 octobre 2026) : 30 lignes produit/emplacement par page, tri global des lignes avant découpage et totalItems comptant ces lignes. Les cartes summary conservent leurs compteurs de produits distincts. Limite 10 000 lignes, filtre explicite nécessaire au-delà ; unité/entrant/valorisation lus avec cache par requête, seuls les calculs nécessaires au tri ou à la page sont chargés. Aucun changement des stocks, réservations ou valorisations persistées.

Notes de frais / formulaire et duplication — 15 octobre 2026 : à gauche Dépense (date, description, TTC, TVA, Payé par) puis Rattachement ; à droite Catégorie et contenu conditionnel restaurant/invités, trajet/séjour ou véhicule. Sur mobile, Dépense / Catégorie / Rattachement dans une zone défilante avec pied fixe. Les justificatifs restent dans leur onglet partagé. Une action Dupliquer ouvre une nouvelle dépense préremplie avec les champs métier de la source ; annuler ne crée rien, enregistrer ajoute une ligne indépendante à la fin et recalcule les totaux côté serveur. Les justificatifs ne sont pas copiés, indication explicite dans le popup ; pièces propres à chaque dépense requises avant soumission. Code affaire de l’opportunité visible dans Rattachement et en tag devant le titre d’affaire du tableau. Duplication uniquement lorsque la note est modifiable par son propriétaire.

Notes de frais / véhicules — 15 octobre 2026 : référentiel expenses_vehicles dans Paramètres → Notes de frais → Véhicules (onglet voisin de Catégories). Marque, modèle, immatriculation unique, employé rattaché obligatoire, actif ; création/modification/désactivation par Admin/Superuser, pas de suppression métier. Carburant : combobox au lieu du texte libre, libellé marque/modèle/immatriculation, véhicules actifs de l’employé uniquement, proposition automatique si un seul choix. Enregistrement contrôlé côté serveur. Les lignes déjà enregistrées conservent leur libellé après modification/réaffectation/désactivation du véhicule ; anciens textes et pièces validées conservés sans déduction de relation automatique.

Stock / liste des opérations — 15 octobre 2026 : Numéro, Date, Document d’origine, De, Vers, puis colonnes métier conservées (type sauf liste Réceptions, titre, affaires, disponibilité OUT et état). Colonne Entrepôt retirée de cette liste ; la liste Inventaires garde sa présentation. De/Vers indiquent fournisseur → stock pour réception, stock → client pour livraison/chantier, fournisseur → client pour livraison directe, sites/emplacements pour transfert et trajet inversé de l’opération source pour retour ; rebut/usage interne sont identifiés explicitement. Le titre libre ne remplace pas l’identité du destinataire. Document d’origine : numéro BC et/ou commande client (devis à défaut), ou bon source du retour ; liens vers les pièces selon les droits de leur module. Tri partagé dans les en-têtes et top bar, avant pagination serveur.

Achats / ventilation en popup — 15 octobre 2026 : fenêtre élargie à 1 120 px desktop, colonne Commande privilégiée (340 px de base), quantité saisie centrée. Flèches de consultation à droite de l’affaire et de la commande sélectionnées via les contrôles partagés : ouverture des fiches canoniques CRM et Ventes dans RecordWorkspace, sans navigation ni perte des ventilations en cours. Lecture possible même si la ventilation n’est pas modifiable, selon les droits des modules sources ; aucun changement des règles d’affectation ni des identifiants de commande enregistrés.

Commandes / suivi des retours client — 15 octobre 2026 : colonne Livraisons = quantité nette chez le client / quantité commandée, suivie seulement en présence de retours du pictogramme retour et de la quantité (ex. 3/4 ↩ 1). Survol et nom accessible détaillent livré brut / retourné / net. Seuls les RET réalisés issus des OUT/PREP de la commande sont déduits, y compris archivés ; brouillons/annulations exclus, attribution par identifiants de ligne. La consultation des opérations de la commande inclut les RET via leur origine, avec les filtres d’état/archive existants. Le reste à livrer utilise la quantité nette : commandé − (livré brut − retours réalisés). Un retour réalisé rouvre le besoin et le bouton Préparer la livraison ; son action prépare explicitement le BL restant, réutilise/ajuste un brouillon automatique existant et tient compte des autres bons préparés pour éviter les doublons. Exemple : 4 livrés puis 1 retourné → reste 1, nouvelle sortie de 1 → 4 nets livrés pour 5 sorties historiques et 1 retour. Réservations et validation serveur respectent ce même plafond net ; séries et historique conservés. Aucun BL, achat ou avoir créé automatiquement à la validation du retour. Le retour définitif passe par la révision commerciale de commande décrite ci-dessous ; une facture validée reste inchangée.


### Modification d’une commande client confirmée — 15 octobre 2026

Première version : action Modifier la commande dans le bandeau de workflow existant, édition dans la même fiche et le même tableau que le devis ; Annuler les modifications / Enregistrer à droite. Informations titre, commercial, notes, référence client, quantités, prix/coûts/remises et ajout de lignes. Pièces jointes gardent leur gestionnaire partagé. Affaire/client, devise, dates et CGV acceptées conservés. Un BL/PREP uniquement brouillon ne bloque pas la suppression ou le remplacement : ses lignes sont ajustées, et le bon est annulé avec son historique s’il devient vide. Une réalisation Stock ou un historique de réservation, d’achat ou de facturation impose la conservation de l’identité ; une ligne historique entièrement retirée conserve sa quantité zéro. Les options ne deviennent pas implicitement des lignes commandées. Glisser-déposer/clavier, duplication sans identité copiée et ordre persistant conservés.

Enregistrer affiche le récapitulatif serveur Avant / Après, ajustements et documents bloquants avec liens conservant l’édition. Confirmer applique la révision atomiquement ; Reprendre l’édition conserve les saisies. Une modification des engagements depuis le récapitulatif impose son recalcul. Autorisation sales.read + sales.write + sales.order.confirm + crm.read ; droits Stock/Billing supplémentaires lorsque des ajustements relevant de ces modules sont nécessaires. Archive et état non confirmé bloquent la révision.

- Stock : ne pas réduire sous le net déjà livré ; retour physique réalisé nécessaire pour une réduction correspondante. Réservations excédentaires réduites/libérées et BL/PREP brouillons ajustés ou annulés dans la transaction, après présentation des impacts, en préservant leur historique et leurs allocations. Lots/séries sélectionnés à refaire lorsque la quantité réduite ne permet plus de conserver la sélection. Achats encore attendus incompatibles : traiter la DA/BC lié avant réduction, sans altérer les achats validés.
- Facturation : un retrait de quantité déjà facturée prépare explicitement un ou plusieurs avoirs **brouillons**, par facture d’origine, lors de la confirmation du récapitulatif. Prix, TVA et affectations repris de chaque ligne facturée, jamais du tarif courant ; droits billing.read/write requis. Réutilisation des quantités déjà couvertes par des avoirs brouillons, absence de doublon au rejeu ; validation et remboursement séparés. Aucun mouvement de retour Stock créé par un avoir. Factures brouillons incompatibles à ajuster/annuler avant révision.
- Prix sur une ligne partiellement facturée : documents validés inchangés, solde HT réparti sur la quantité restant à facturer, avec information au récapitulatif (ex. commande révisée 6 × 120 = 720, déjà facturé 2 × 100 = 200, solde 4 × 130 = 520). Les montants déjà facturés et acomptes sont protégés ; une ligne entièrement facturée dont le nouveau montant ne correspond pas au solde après avoir exige une régularisation dédiée. Une quantité négative n’est pas stockée comme ligne de commande : le retrait est la diminution de la quantité commandée, jusqu’à zéro en conservant les liens.

Numéro de commande, identifiants des lignes existantes, compte analytique et documents historiques conservés. Le devis accepté et son snapshot restent intacts ; les sources courantes de BL, achats, factures, aperçu/PDF et projections utilisent la commande révisée. Historique Révisions (n) avec auteur/date et changements, plus événement dans le fil. Revenir en devis reste un abandon commercial contrôlé, pas le mécanisme d’édition. Conversions partielles et révisions des CGV/dates hors périmètre de cette première version.

Révision de commande / consultation des pièces — 15 octobre 2026 : les liens vers une DA, un BC, un BL ou une facture/avoir du récapitulatif et de l’historique ouvrent la fiche canonique dans RecordWorkspace. La saisie et l’URL de la commande sont conservées, focus rendu au bouton ; fermeture de la pièce déclenchant un nouveau contrôle des engagements avant confirmation. Pas de nouvelle page ni nouvel onglet.

Stock / numéros et préparations inutiles — 15 octobre 2026 : nouveaux bons de réception IN, livraison OUT et préparation PREP sans numéro définitif en brouillon, affichés par un repère provisoire entrepôt/type/----- (ex. MEU/IN/-----) dans la fiche, la liste et l’aperçu. Numéro atomique attribué dans la transaction de réalisation, avant mouvements et snapshot ; annulation ou validation refusée ne consomme pas la séquence. Pièces existantes numérotées conservées ; autres types Stock inchangés. Lors d’une révision de commande, un BL/PREP brouillon devenu vide est annulé et archivé automatiquement après récapitulatif ; si des lignes restent, bon ajusté sans archivage. Consultation via les archives et l’historique de révision, restauration ne réactivant pas une annulation. Réservations excédentaires libérées selon le plan existant. Factures et avoirs clients/fournisseurs déjà numérotés à validation, inchangés.


## Congés L01 — contrat du 16 octobre 2026
Calendrier général personnel : projection directe des demandes du compte connecté en submitted/approved/cancel_requested ; brouillons, refus et annulations exclus. Une entrée par date civile de la période d’absence (y compris jours non décomptés), demi-journée indiquée aux bornes, statut lisible et lien vers la fiche Congés. Aucun motif, catégorie médicale ou justificatif dans la projection. Accès leave.read et périmètre Congés actif requis, sans imposer calendar.read/CRM. Les congés des collègues restent dans le calendrier d’équipe RH dédié ; les droits globaux RH n’élargissent pas le calendrier personnel. Aucun événement copié dans calendar_events ; annulation acceptée retirant automatiquement les entrées, invalidation du cache Calendrier après transition. Recherche/archives/filtres et contexte AO respectés.

Les règles de décompte, jours travaillés/fériés et justificatifs par type sont regroupées dans **Paramètres → Congés** (`/settings/leave`), sans popup de paramétrage dans la page métier. Les allocations individuelles restent dans Congés → Allocations RH.

Module leave : Mes congés, À valider, calendrier d’équipe et Allocations RH. Types initiaux : Congés payés (paid), Congés maladie (sick), Sans solde (unpaid), Récupération (recovery), Événement familial (family). Seuls paid/recovery consomment un crédit. Allocations et corrections signées par employé/type/année civile, motif obligatoire, registre append-only/idempotent, réservé à leave.allocate et périmètre all (fonction RH ou admin). Pas d’acquisition automatique ni règle légale présumée. Soldes : alloué, validé, réservé en attente, disponible ; annulation demandée conserve le débit jusqu’à accord manager.
Demandes draft/submitted/approved/rejected/cancel_requested/cancelled ; dates inclusives, matin/après-midi, décompte serveur jours travaillés configurables (initialement lundi–vendredi), jours fériés de France métropolitaine exclus automatiquement (calendrier désactivable), dates supplémentaires exclues et exceptions de jours fériés travaillés paramétrables par RH. Un férié tombant hors des jours travaillés ne retire aucun jour supplémentaire. Ventilation par année ; paramètres de décompte snapshotés à la soumission pour préserver l’historique. Contrôle de chevauchement par demi-journée, toutes catégories, et de provision à soumission/validation dans la transaction. Les brouillons ne réservent rien. Refus motivé, reprise explicite en brouillon ; retrait de soumission par le propriétaire, annulation d’une demande approuvée décidée par le manager. Circuit standard : aucune auto-validation, manager hiérarchique habilité par défaut, recours explicite à un manager global si absent ; RH global peut réaffecter une demande avec motif. Exception explicitement validée : employé actif désigné Direction sans responsable rattaché et disposant de leave.submit → déclaration directe, sans manager fictif, avec consommation immédiate des jours et information des gestionnaires RH actifs (leave.read + leave.allocate, périmètre all). Une direction rattachée à un responsable reste dans le circuit standard. Contrôles serveur de solde, chevauchement et justificatifs identiques ; absence de destinataire RH bloquante avec erreur explicite. Annulation directe motivée par le propriétaire, restitution et information RH, historique conservé. Le mode de déclaration est figé dans le snapshot pour conserver ce circuit d’annulation même si l’organisation change ensuite.
Documents protégés multiples facultatifs par défaut ; obligation configurable par type. Fil Core et notifications partagés. Compte utilisateur lié à un employé actif pour demander ; allocations possibles pour un employé sans compte. Calendrier équipe : indisponibilités pending/approved/cancel_requested, noms/dates seuls, aucun type/commentaire/justificatif aux collègues ; équipe actuelle commune, manager/directs et soi. Accès RH global explicite. Planning/TimeReport restent des raccordements futurs.


### Fil d’activité — e-mails et pièces envoyées (16 octobre 2026)

Les événements d’envoi des devis et BC affichent les destinataires **À** réellement enregistrés avec le message envoyé : « Devis envoyé à … » / « Commande envoyée à … ». Les anciens événements liés à un message envoyé bénéficient de cette présentation à la lecture, sans réécrire l’historique. Les pièces originales de cet envoi apparaissent en miniatures nommées, avec une petite loupe ouvrant l’aperçu partagé dans la page. Le filtre Documents inclut ces envois. Les images/PDF joints aux notes du fil utilisent également les miniatures ; les fichiers texte conservent leur lien. Les pièces envoyées ne sont pas supprimables depuis le fil. À la demande complémentaire du 16 octobre, l’objet, l’expéditeur et le corps texte du mail envoyé sont également projetés dans le fil de la fiche autorisée, en bloc compact dépliable. Cc/Cci et jetons restent privés dans Messaging.


### Réception ciblée des réponses aux devis/BC — 16 octobre 2026

Complément du 21 octobre 2026 — Messagerie → Reçus liste les réponses déjà importées aux devis et commandes fournisseur envoyés par l’utilisateur connecté. Tableau partagé Objet / Expéditeur / Pièce / Date réelle de réception, recherche de top bar, filtre Type de pièce, regroupement par expéditeur/type et tri/pagination serveur (30). Consultation dans HDialog : auteur/adresse, destinataire Horizon, date, texte échappé, avertissements, aperçu des pièces jointes et accès à la pièce métier. Les autres dossiers restent consacrés aux envois. Aucun e-mail Microsoft sans rattachement n’est importé, aucun changement de la relève ni bouton Répondre dans ce complément. La lecture exige messaging.read, la propriété de l’envoi d’origine et le droit de lecture du module lié ; mêmes contrôles pour les fichiers. Les réponses déjà stockées deviennent consultables sans réimportation, sans migration.


Paramètres → E-mails → Expéditeurs : option « Recevoir les réponses dans Horizon », désactivée initialement ; enregistrer puis reconnecter la boîte personnelle pour consentir à Mail.Read. La table indique l’état de réception, la dernière relève d’une conversation et ses erreurs éventuelles ; action « Relever les réponses » pour un passage manuel. La relève automatique tourne chaque minute, par pages et file bornée ; ce n’est pas une réception instantanée, le délai augmente avec le nombre de conversations/pages.

Les réponses rattachées à un envoi Horizon **sent** d’un devis ou BC créent un événement dans son fil et une notification interne de l’expéditeur encore habilité. Aucune modification automatique de l’état du devis/BC et aucun envoi de réponse automatique. Le message affiche auteur externe, date de réception réelle, objet et texte, avec miniatures et aperçu des PDF/images reçus. Les envois affichent également leur contenu dans le même bloc compact : De / À, extrait de trois lignes, « Voir le message » / « Réduire », pièces jointes. Pas de HTML externe exécuté ni d’images distantes chargées. Le contenu partagé avec les lecteurs de la fiche inclut désormais le texte métier envoyé/reçu ; Cc/Cci exclus.

Rattachement par identifiants In-Reply-To/References, pas par objet : l’original doit rester retrouvable dans les Éléments envoyés grâce à l’en-tête Horizon. Recherche à ±24 h de l’envoi pour couvrir l’indexation et les décalages horaires ; si copie absente, erreur visible et recherche ultérieure. Les messages sans lien ne sont pas importés. Les descendants peuvent être reconnus via une réponse déjà importée ; si l’ordre des pages diffère, le passage suivant les reprend. Relève dans tous les dossiers de la boîte personnelle pour les conversations connues ; un message supprimé à distance avant relève peut rester indisponible. Les fichiers non pris en charge/au-delà des limites sont signalés dans le fil, à consulter dans Outlook. Pas de boîte de réception générale, de suivi des suppressions distantes, de chat ou de bouton Répondre dans ce lot.

Un In-Reply-To explicite inconnu reste sans rattachement automatique, même si References mentionne un ancien envoi : éviter d’affecter une réponse à une ancienne pièce. References sert de secours lorsque In-Reply-To est absent. Une réponse à un message intermédiaire envoyé manuellement depuis Outlook (parent inconnu d’Horizon) peut donc rester uniquement dans Outlook ; aucune affectation incertaine par objet/conversation.


### 17.2 GED G01 — bibliothèque documentaire (16 octobre 2026)

Périmètre validé : page Documents `/documents`, espaces Affaires / Clients / Fournisseurs / Interne, dossiers imbriqués, liste/cartes et aperçu partagé, dépôt multiple de fichiers, catégories et tags, liens vers fiches métier, versions avec commentaire et historique. Recherche contextuelle, filtres multiples catégorie/type/archives séparées, regroupements par affaire/société/dossier/catégorie/format/auteur et tri partagés, critères URL conservés et 20 documents/page. La recherche porte sur métadonnées, nom et références des sources ; aucun OCR ou recherche plein texte binaire annoncé.

Un document logique possède des versions de fichier immuables ; une nouvelle version conserve tous les octets précédents, reçoit un ordinal serveur atomique et exige une version updated fraîche. Le nom du fichier d’origine reste connu. Les documents officiels verrouillés ne permettent aucune nouvelle version ou mutation depuis la GED. Le premier lot traite les dépôts GED, sans déplacer ni dupliquer silencieusement les pièces déjà détenues par les modules ; leur indexation et les documents générés restent un raccordement progressif distinct. Chaque document peut avoir plusieurs liens, dont la visibilité est l’intersection des droits de lecture sur toutes les sources. Les codes affaires sont projetés depuis le compte analytique existant, jamais générés dans Documents.

Dossiers et documents : accès Équipe (utilisateurs documents.read) ou Restreint (auteur et utilisateurs explicitement sélectionnés). Toute restriction des dossiers parents s’applique aussi ; l’auteur ne contourne pas une source métier devenue interdite. Contribution documents.write ; modification de ses documents/dossiers ou administration documents.manage (avec documents.write, dépendance gérée dans les accréditations). Consultation des fichiers/historiques soumise aux mêmes droits, même après archivage. Archivage sans suppression, pas de partage public. Catégories administrées dans Paramètres → GED par documents.settings et settings.references. Pas de nouveau conteneur ou service externe.

### 17.3 GED G02 — pièces existantes et lecture par affaire (17 octobre 2026)

La bibliothèque ne se limite plus aux dépôts : elle projette les pièces existantes du fil des fiches, les PDF/pièces envoyés et réponses corrélées de Messaging, les originaux de facturation, reçus de dépenses et pièces de congés selon leurs périmètres. Aucun déplacement, recopie, changement de fichier historique ou nouvel envoi. Le devis envoyé s’appuie sur son PDF conservé par Messaging, avec affaire et client projetés seulement si consultables. Les achats reprennent aussi leurs ventilations analytiques autorisées ; aucune nouvelle source de code affaire. Vue Tous les documents et regroupement par Thème par défaut, recherche par mots insensible aux accents/séparateurs incluant le nom de pièce, catégorie/dossier et références métier autorisées. Filtres Thèmes, catégories de dépôts, formats et archives séparées ; regroupements Affaire et Société disponibles. Les dossiers utilisateur classent uniquement les dépôts GED.

Les fichiers des modules restent en lecture seule ici, avec provenance et accès à la fiche propriétaire ; l’édition/version/archivage se fait dans ce module. Aucun document virtuel sans binaire enregistré : une simple prévisualisation PDF non conservée n’est pas ajoutée et n’est pas régénérée pour le catalogue. Pas de boîte mail générale, OCR ou conversion bureautique. Le contrat de projection et ses limites sont dans 05 ; les styles sont dans 07.

### 17.4 GED G03 — choisir avant de charger (17 octobre 2026)

Décision utilisateur remplaçant la vue Tous les documents chargée par défaut de G02 : ouverture sur Affaires avec invitation à choisir une affaire. Clients et Fournisseurs proposent de même une sélection distante du tiers (jusqu’à 20 propositions accessibles dès l’ouverture, recherche temporisée pour affiner), sans chargement de médias au démarrage. Après sélection, afficher seulement ses pièces liées : devis/commandes, achats/ventilations, réceptions/livraisons, factures/avoirs, pièces du fil et PDF envoyés/réponses, ainsi que les dépôts GED rattachés. Le lien canonique `crm_opportunities.analytic_account` et les comptes de devis reliés à l’opportunité permettent de retrouver les factures ; ne pas exiger une commande source pour une facture ventilée sur l’affaire. Les permissions de chaque source restent requises. La consultation client retrouve aussi les pièces d’affaires liées et ne se limite pas à leur espace physique de dépôt.

Choix et critères conservés dans l’URL, dépôt pré-rattaché au contexte choisi ; ajout inactif sans contexte ou dossier, sauf Interne. Les dossiers restent des lectures ciblées des dépôts. Interne conserve les dépôts internes et dépôts non rattachés, y compris les anciens dépôts sans classement métier, ainsi que les justificatifs internes autorisés. Retirer le contexte ou changer d’onglet ne lance pas une lecture globale. Recherche de fichiers dans la sélection, 20 résultats par page ; aperçu et Liste/Cartes réutilisent la liste chargée. Aucun polling périodique de tout le catalogue ni régénération des PDF historiques.

### 17.5 GED — classement par pièce d’origine (17 octobre 2026)

Correction utilisateur : remplacer les thèmes abstraits comme « Affaires et technique » par la provenance métier effective. Par défaut, regrouper les fichiers par pièce d’origine (type + référence de la fiche), avec compteur ; filtrer par Types de pièce et proposer le regroupement par type seul. Distinguer devis/commandes clients, demandes d’achat/commandes fournisseurs, bons de livraison/réception, autres opérations de stock, factures clients/fournisseurs et avoirs clients/fournisseurs. La liste et les cartes affichent ce type, les catégories personnalisées de dépôt restent facultatives et ne déterminent pas la provenance. Un e-mail historique de devis reste classé Devis après conversion en commande. Le dépôt permet également de rechercher/rattacher une facture ou un avoir client/fournisseur, selon les droits billing. Les pièces directement jointes à une affaire ou société gardent leur vrai rattachement ; ne pas les attribuer artificiellement à un devis/une facture. Dépôts anciens non liés explicitement identifiés, sans réécriture ni suppression.

Dashboard / activité : le résumé utilise la même liste de destinations métier canoniques que le fil transverse, incluant GED, facturation, frais, congés et parc interne. L’ajout d’un événement GED ne doit pas invalider la réponse entière dans l’interface ; les liens restent internes vers une fiche identifiée et autorisée côté serveur.

Navigation / sections — 17 octobre 2026 : sections de la sidebar repliables une par une ou toutes ensemble. Choix conservé dans ce navigateur par utilisateur entre pages et après rechargement ; accès des modules toujours filtré par les permissions existantes. Le mode pictogrammes/mobile conserve les icônes de tous les modules autorisés, indépendamment des plis desktop. Aucun changement de permissions ni de données PocketBase.

Lanceur de modules — 17 octobre 2026 : le popup ouvert depuis le logo regroupe les mêmes destinations autorisées avec exactement les catégories de la sidebar : Espace de travail, Activité, Ressources humaines, Finance et Administration, sans recatégorisation propre au popup. Disposition initiale restaurée à la demande utilisateur : sections empilées, titres à gauche et grilles à droite sur desktop, trait de séparation entre sections ; titres au-dessus sur écran étroit, sous-pages toujours dans la sidebar. Retour de focus sans cadre résiduel après souris, repère clavier conservé.

### Notifications personnelles et recherche top bar — 17 octobre 2026

Mon compte → Notifications : préférences par utilisateur pour Mentions, Tâches assignées, Réponses aux e-mails, Congés à valider, Suivi des congés, Notes de frais à valider, Suivi des notes de frais et Autres alertes métier. Tous activés par défaut ; réglage appliqué aux nouvelles alertes dans la cloche par NotificationService côté serveur. Le type e-mail désigne les réponses reçues/corrélées dans Horizon, sans nouveau canal d’envoi d’alertes par e-mail. Désactiver ne masque pas les alertes déjà reçues et ne supprime ni mention, tâche, demande ou circuit de validation. Les brouillons du profil restent préservés entre les onglets du compte.

Cloche : action croix Retirer de la liste par alerte, y compris non lue ; elle est alors considérée lue et retirée de la boîte personnelle, sans suppression de l’historique. Action Retirer les notifications lues pour nettoyer les alertes déjà consultées. Première date de lecture conservée, mentions liées synchronisées, retrait idempotent et strictement personnel. Roue de réglage ouvrant directement Mon compte → Notifications, même lorsque la boîte est vide. Les liens réutilisent les destinations canoniques Activity.

Paramètres → Apparence et densité → Général → Recherche en barre supérieure : largeur maximale 400–1 200 px, défaut 840 px. La recherche reste centrée, limitée par la place nécessaire aux actions, avec disposition mobile partagée ; aperçu via le même HTopbar que le layout. Le réglage est commun à l’entreprise et réservé aux administrateurs habilités.

### Imports Contacts R05 — pilote — 17 octobre 2026

Premier périmètre validé : sociétés et personnes uniquement, autres domaines différés jusqu’à validation UX. Assistant commun uniquement depuis Paramètres → Imports (`/settings/imports`) : Source, Correspondance des colonnes, Vérification puis Résultat, avec HProgressSteps et composants Horizon existants. CSV/XLSX (choix de feuille et ligne d’en-tête) ou connexion Odoo 19+ confirmée par utilisateur ; mapping proposé et modifiable, exemples par colonne, profils privés réutilisables, choix Créer/Mettre à jour/les deux, cellules vides conservant l’existant. Simulation sans écriture métier, distinction créations/mises à jour/inchangés/conflits/erreurs ; détail avant/après et résolution explicite par ligne. Import confirmé avec progression, reprise du même job sans doublons et historique privé. Sociétés d’abord puis personnes ; Odoo reste une source indépendante, jamais une synchronisation bidirectionnelle.

R05 — ajustement Odoo du 17 octobre : chargement complet de la sélection en une action avec total et progression, puis Continuer seulement une fois la lecture réussie ; pas de pagination manuelle ni d’import partiel silencieux. Garde de capacité 8 Mo explicite, fichiers toujours limités à 1 000 lignes. Modes expliqués sous le sélecteur : créer seulement préserve les fiches reconnues ; mettre à jour seulement ignore les fiches absentes ; les deux crée ou met à jour. Cellules vides préservées dans tous les modes. Contacts : société et référence externe visibles avant application, parent manquant identifié avec nom/référence et bloquant jusqu’à import de sa société puis nouvelle simulation. Les identifiants Horizon restent natifs, correspondances Odoo conservées séparément par instance/base.

R05 — décisions en ligne, 17 octobre : la colonne Actions propose un sélecteur unique : règle automatique, Ignorer, Créer une fiche distincte pour un conflit ou Utiliser une fiche existante parmi les correspondances proposées. Choix exclusifs persistés et revérifiés par le service de résolution existant ; aucune écriture Contacts avant confirmation. La loupe ouvre uniquement la comparaison/correction. Les décisions sont verrouillées après démarrage de l’application. Pagination partagée inline, en haut et bas de tableau, 25 lignes/page et bornes recalées après résolution ou changement de catégorie. Aucun bouton Importer dans les listes métier ; entrée centralisée dans Paramètres, ancienne URL redirigée avec critères conservés.

R05 — détail des lignes, 17 octobre : popup agrandi dans l’espace de travail et centré, tableau de comparaison montrant tous les champs du contrat (18 pour les sociétés, image comprise), valeurs actuelles entièrement repliées à la ligne, corps défilant et pied fixe. Navigation précédente/suivante dans la sélection filtrée, compteur et bornes, avec sauvegarde des corrections avant changement de fiche ; un échec reste sur la fiche et affiche l’erreur. Identifiant externe non modifiable. Croix de champ : vide la valeur à importer dans la simulation, conserve l’existant dans Horizon conformément au contrat des cellules vides ; aucune suppression de donnée existante introduite. Fermeture avec corrections non enregistrées demande d’enregistrer ou d’annuler les modifications via le pied de formulaire.

R05 — contrôle et entretien des imports, 17 octobre : la fiche détail affiche un bloc Problème à résoudre, le motif complet, les correspondances proposées et le même sélecteur de résolution que le tableau. La loupe occupe une colonne Voir finale dédiée. Chaque catégorie propose Tout ignorer et Tout en automatique, sur toutes ses lignes et pages (compteur explicite), uniquement avant application et sans écriture Contacts ; la règle automatique réactive les contrôles, jamais une validation forcée des conflits. Mes imports et la préparation courante proposent Supprimer la préparation avec confirmation : pour tout import non terminé : suppression du staging/job avant tout début, ou annulation et archivage d’un import commencé, retiré de la liste sans supprimer son historique ni les fiches déjà importées (ajustement du 18 octobre). Images base64 mappables depuis CSV/XLSX et Odoo image_256/image_128, aperçu miniature/loupe partagé, conversion en logo/photo protégé à confirmation ; PNG/JPEG/WebP bornés à 200 000 caractères par image et contenu global 8 Mo, erreurs explicites.

R05 — absence d’image, 17 octobre : un message Aucune image à importer indique une valeur absente dans la préparation, sans présumer de la présence de photos dans Odoo. La lecture montre désormais le nombre d’images reçues/reconnues sur toutes les fiches, les champs vérifiés et un avertissement si le serveur est ancien ou si aucun champ image n’est accessible. Une préparation sans mapping Image est identifiée dans le détail et invite à relire la source/vérifier la correspondance. Aucun avatar artificiel créé pour masquer une image manquante. La recette de la connexion réelle reste distincte des tests simulés.

R05 — densité des images, 17 octobre : aperçu source et vérification présentent Image en troisième colonne, miniature compacte et clic pour agrandir ; exemples du mapping également compacts. Ordre des colonnes du fichier et associations métier conservés indépendamment de cet ordre visuel.

R05 — réactivité des décisions, 17 octobre : Ignorer/créer/lier/corriger une ligne met à jour cette ligne et les doublons affectés uniquement. La préparation conserve toutes ses lignes, images et navigation ; aucune nouvelle lecture Odoo ni réévaluation des fiches indépendantes. Contrôle complet des changements concurrents maintenu avant confirmation.

R05 — refus de validation à l’application : e-mail et site web sont vérifiés avec les règles natives PocketBase dès la préparation. La fiche affiche le champ refusé en français ; les anciennes préparations affichent aussi le numéro de ligne lors du refus. Sans début d’application, la ligne retourne en erreur pour correction/ignorance. Si des lots ont déjà été appliqués, historique conservé et nouvelle préparation des lignes restantes via Revérifier la préparation, sans recréer les correspondances externes déjà importées. Aucun e-mail invalide automatiquement effacé ou découpé.

R05 — récupération après conflit (17 octobre) : un refus de précondition donne la ligne et distingue changement d’action, de fiche reconnue ou de champs. Action partagée Revérifier la préparation disponible en preview/blocked : corrections et choix conservés, aucun import automatique. Si rien n’a été appliqué, le même job redevient une simulation ; après import partiel, une nouvelle préparation Reprise contient uniquement les lignes restantes, avec leurs numéros d’origine, et conserve l’ancien historique. Les nouvelles ambiguïtés restent à résoudre avant une nouvelle confirmation ; aucun contournement du contrôle concurrent.

R05 — homonymes internes à la source (17 octobre) : deux créations portant le même nom ne sont pas déclarées prêtes uniquement parce que leurs e-mails diffèrent. La préparation signale les homonymes de sociétés, et ceux de personnes dans la même société, avant tout début d’application. Choix explicite Créer une fiche distincte ou Ignorer ; noms identiques jamais fusionnés automatiquement. Les doublons forts restent bloquants même avec Créer distincte. La suppression/correction du premier homonyme recalcule les seuls avertissements dépendants. Les anciennes préparations doivent être revérifiées pour bénéficier de cette détection avant application.


## TimeReport BE T01 — contrat du 18 octobre 2026

Saisie réelle BE native Horizon, indépendante du planning et de la future synchronisation PROD OnSite. Une feuille par employé/semaine civile (lundi), lignes réordonnables activité/imputation, sept journées en minutes entières et commentaire par cellule. Une ligne utilise un produit de service interne explicitement habilité dans Paramètres → Planning et temps, période d’éligibilité facultative ; aucun produit ni heure créé par défaut. Imputations affaire/commande (compte analytique existant), avant-vente/AO (racine) ou interne (compte central Temps internes attribué automatiquement côté serveur, aucune catégorie d’achat à sélectionner). Lien facultatif à une ligne commerciale de service du même produit et du même compte de commande. Semaine principale éditable ; mois de synthèse ouvrant les semaines. Reprise de lignes sans heures, favoris personnels, totaux et état de sauvegarde explicites.

Feuille draft → submitted → validated, ou rejected avec motif → draft. Retrait avant décision possible. Réouverture d’une feuille validée uniquement par un valideur habilité, avec motif et audit ; les temps sortent du réalisé jusqu’à nouvelle validation. Validation par une autre personne habilitée, manager hiérarchique privilégié, choix d’un valideur global de secours ; pas d’auto-validation implicite pour la direction. Droits read/write/submit/validate/settings/costs et périmètres self/reports/all. Validation atomique, version entière et refus des écrasements concurrents ; aucune mutation directe des collections depuis REST. La feuille suit l’employé, jamais un simple nom de compte.

Services figés par identifiant et libellé à validation. Calendrier RH (jours fériés et congés) lu via son propriétaire ; capacité hebdomadaire datée explicitement configurée par ressource, jamais 35/39/40 h inventées. Avertissements de dépassement, congé et jour non travaillé visibles, sans interdire un travail exceptionnel. Les heures ne peuvent excéder 24 h/jour toutes lignes confondues. Coûts de profil centralisés, datés et snapshotés à validation ; absence de taux conservée comme indisponible. Coûts individuels réservés à costs global, montants analytiques aux droits financiers existants. Aucun effet comptable, paie, facturation ou acquisition de congés.

OnSite : adaptateur ultérieur en lecture, identité externe stable, correspondances employés/activités/analytiques et politique de validation à examiner à réception du dépôt. Aucun import PROD, dépendance runtime, secret ou connexion distant livré dans T01.


### TimeReport — population concernée et densité (18 octobre 2026)

Seuls les employés actifs d’une équipe active classée BE ou Production et dont la fiche coche « Saisit ses heures » sont concernés par le relevé. La classification se règle dans la fiche équipe, sans dépendre d’un nom libre ; elle n’accorde aucun droit ERP. Le gestionnaire d’organisation RH active les personnes concernées ; les droits TimeReport du compte restent nécessaires. Aucun activation implicite à la migration. T01 permet la saisie native BE ; la Production est préparée pour OnSite, connexion/import toujours différés.

Le retrait de l’activation ou le changement d’équipe interdit toute nouvelle sauvegarde et soumission BE, sans effacer l’historique. Le retrait d’une soumission, la consultation et les décisions d’un manager restent possibles selon les droits ; un manager hors BE/Production n’a pas à activer sa propre saisie pour valider. Les rappels de semaines non saisies ne concernent que les ressources BE éligibles avec capacité configurée.

Page simplifiée : frise conservée, identité sur une ligne, suppression du badge et du total redondants, un seul titre de lignes dans les onglets, favoris/reprise/aide regroupés à droite. La capacité n’apparaît que si une journée est configurée, aucune capacité inventée. Absence de lignes à reprendre = information neutre ; erreurs réelles, conflits et dépassements restent visibles.


18 octobre — Catalogue / TimeReport : la fiche produit conserve le seul choix Famille de produit. L’usage Équipement / Fourniture / Service est configuré sur la famille et repris lors d’une création ou d’une réapplication explicite. Un service actif de marque CVS peut être autorisé pour la saisie des temps. Les produits existants et documents historiques ne sont pas reclassés par la migration ; le changement de nature reste interdit après mouvement/réservation/série.

### TimeReport — suivi visuel personnel et équipe (18 octobre 2026)

La matrice est l’écran principal de suivi ; une synthèse compacte par cartes reste réservée à Équipe. Une personne non concernée par la saisie RH arrive sur Équipe si elle est manager ; Mes temps est réservé aux employés concernés et un éventuel Historique reste accessible séparément. Les droits de validation ne rendent pas la saisie personnelle obligatoire.

Équipe : personnes en lignes, jours en vue semaine, semaines en vue mois, douze mois en vue année. Heures reçues et état de soumission/validation dans les cellules, accès aux feuilles autorisées ou au mois détaillé. Les périodes mixtes affichent le nombre de semaines validées sur le nombre suivi, sans transformer partiellement validé en validé. Brouillons privés : aucun contenu, ID ni heure du brouillon côté manager. Les collaborateurs BE/PROD activés et les feuilles historiques autorisées restent dans le périmètre ; PROD OnSite non raccordée est explicitement indisponible.

Mes temps : agenda mensuel lundi–dimanche, heures saisies et état de la feuille dans les journées, accès en un clic à la semaine ; total et état de chaque semaine dans une colonne visuellement séparée à droite de ses sept jours, sans bandeau sous la grille. En annuel, douze petits calendriers mensuels avec total/état et repères des jours saisis. Total de période discret dans le titre, sans cartes ni ratio/objectif horaire ou message de capacité inconnue/non renseignée. Vue semaine de saisie conservée. Absences/fériés et périodes futures restent distincts des saisies manquantes ; aucune obligation ou horaire supposé. Heures découpées aux dates exactes de la période. Recherche/filtres/tri/groupement partagés, critères en URL et pagination serveur des personnes (30) ; un filtre d’état sélectionne les personnes concernées sans masquer les autres périodes de leur matrice.

TimeReport — compléments validés du 18 octobre : aucune heure ni commentaire sur une date future, selon le jour civil Europe/Paris calculé côté serveur. Les journées futures de la semaine courante sont verrouillées, ainsi que la sauvegarde d’une semaine entièrement future ; consultation de l’agenda/historique autorisée. Les anciennes données anticipées ne sont pas supprimées automatiquement ; retrait possible d’une saisie future dans un brouillon ouvert, mais soumission/validation refusée tant qu’elle contient du futur. « Copier semaine précédente » reprend uniquement les activités/imputations manquantes, sans durée ni commentaire.

Équipe retrouve cinq cartes compactes HSummaryCards : heures reçues, feuilles à valider, validées, à corriger et semaines non reçues. Agrégats sur le périmètre autorisé et la période complète avant recherche/états/pagination ; une semaine non reçue n’est comptée qu’une fois en annuel même à cheval sur deux mois. Les cartes filtrent les personnes concernées, en conservant la matrice et ses autres colonnes ; aucun brouillon privé compté dans les heures reçues.

TimeReport — un clic sur une carte de synthèse conserve les compteurs et la matrice visibles pendant le chargement du filtre dans le même contexte ; la liste se met à jour à réception, sans écran de chargement intermédiaire. Les totaux hebdomadaires restent alignés à droite mais avec un espace et un contour distinct du calendrier.

Dashboard personnel — 18 octobre 2026 : Mon activité récente présente six événements concernant le compte connecté : actions dont il est auteur, mentions qui lui sont adressées et événements de tâches qui lui sont actuellement attribuées, uniquement sur des sources encore accessibles. Le lien ouvre Activité → Mon activité, avec le même périmètre personnel. Équipe reste une vue distincte de la page Activité. Ce périmètre ne signifie ni appartenance à une équipe RH ni tous les changements des fiches simplement consultables.

Colonnes des listes de consultation — 18 octobre 2026 : affichage et ordre personnalisables depuis le dernier en-tête des listes standard, sans modifier les données ni le tri. Préférence privée par compte/tableau dans PocketBase, retrouvée entre navigateurs et ordinateurs ; reprise des anciens réglages locaux seulement à la première sauvegarde serveur, restauration explicite persistée et concurrence protégée. Voir le contrat UX 07 et le modèle core_table_preferences du document 05. Les matrices calendaires, tableaux natifs de Paramètres, petites listes embarquées et tableaux de saisie restent hors de cette première passe.


Colonnes proposées — 18 octobre 2026 : Paramètres → Personnalisation → Colonnes des tableaux (`/settings/table-columns`) permet aux Admin/Superuser disposant de settings.references de choisir, pour chaque liste de consultation, les colonnes proposées à tous. Le panneau personnel ne propose plus les colonnes exclues, et les tableaux les masquent même si elles figuraient dans une préférence antérieure. Les colonnes obligatoires restent proposées, visibles et déplaçables. Les choix personnels sont conservés et repris à réactivation ; aucune modification des données ou des autorisations de lecture. Enregistrement explicite par tableau, bouton Tout proposer, brouillons conservés entre les sélections de tableaux, révision et audit serveur. Les variantes d’opérations de stock partagent leur politique ; les autres types de pièces ont des réglages distincts. Les grilles de saisie, matrices et documents/PDF restent hors périmètre.


Listes de consultation / redimensionnement — 18 octobre 2026 : toutes les listes déclarant columnSettings disposent par défaut de poignées sur leurs séparations internes. Redimensionnement souris/tactile/clavier avec budget de largeur constant, minimums lisibles et montants protégés ; largeurs enregistrées dans la préférence privée du compte à la fin du geste, puis retrouvées à rechargement et dans un autre navigateur. Double-clic sur une séparation : rétablir les largeurs automatiques, ordre/visibilité conservés. Restaurer par défaut dans le panneau réinitialise l’ensemble de la préférence. Les réglages administrateur des colonnes proposées restent distincts, sans nouveaux droits métier. Une erreur de sauvegarde revient au réglage précédent et s’affiche au-dessus du tableau avec Recharger les colonnes.


### Acomptes : titre de grille et pourcentage — 18 octobre 2026

Les factures d’acompte comportent une ligne structurelle en gras « Acompte de [N] % », dans le tableau avant les produits, sans numéro ni poignée ni suppression. Le taux est une donnée numérique distincte de l’objet, modifiable tant que la facture est en brouillon et figée à validation. L’objet reste libre. Les désignations et quantités d’origine sont conservées ; quantités verrouillées hors avoir, prix net lié à la commande et taux appliqué au montant de chaque ligne côté serveur avant TVA/arrondis. Seules les lignes sélectionnées/conservées constituent la base. Déductions et plafonds par ligne/TVA restent contrôlés, les acomptes ne comptent pas comme des unités livrées ou facturées. Les avoirs héritent du taux source et utilisent les proratas de montants/TVA historiques ; un avoir d’acompte en brouillon ne couvre pas des unités d’une facture normale lors d’une révision de commande.

Recalcul à la saisie via une route sans écriture, différée de 300 ms ; résultat obsolète jamais présenté comme courant et erreur visible. Sauvegarde/validation recontrôlent les mêmes règles. Lignes source, descriptifs, ordre et notes conservés. Boutons d’ajout partagés avec Devis/Commande via HLineAdditions ; factures ordinaires : Produit, Ligne, Note uniquement ; acompte : Note uniquement, les articles proviennent de la commande. Aucun titre supplémentaire au-dessus de la grille ni bouton de titre/sous-titre. Ligne de titre également dans le contexte du nouveau PDF. Documents validés historiques non réécrits.

Anciens brouillons : conversion à la lecture et à sauvegarde/validation si le ratio quantité/source est commun, sans écrire à la lecture. Les préfixes d’acompte répétés sont retirés des descriptions lors de cette conversion. Une base ambiguë n’est pas devinée ; le brouillon doit être annulé et repréparé depuis sa commande avant utilisation du nouveau taux. Migration additive 0039, sans backfill historique.


### Pagination adaptative des listes de consultation — 19 octobre 2026

Contacts sociétés/personnes, CRM/AO en liste, devis/commandes clients, achats/DA/BC, factures/avoirs/règlements, produits, disponibilités, opérations/inventaires en liste, notes de frais et demandes de congés : mode Auto par défaut selon la hauteur utile de l’écran et la hauteur des lignes ; cartes Contacts/Produits selon leur hauteur et le nombre de colonnes. Contrat remplaçant les anciennes limites fixes des listes raccordées. Mesure stabilisée après mise en page/redimensionnement, repli sur 25 avant la première mesure, au plus 100 résultats. Une petite fenêtre conserve au moins cinq lignes ou une rangée de cartes et peut nécessiter le défilement normal. Le calcul vise la place utile ; groupes et textes longs peuvent conserver un défilement.

Choix 25 / 50 / 100 par page près du compteur dans le breadcrumb ; choix manuel conservé dans l’URL perPage et au rechargement, Auto indépendant du navigateur/écran. Changer de taille ou de présentation repart à la première page, recherche/filtres/tri conservés. Contacts conserve aussi la taille automatique dans le contexte de retour de fiche. Le compteur Résultats reste le total autorisé, pas le nombre de lignes chargées. Pagination et regroupements utilisent la même taille, sans plafonner l’hydratation Contacts à 25. Les API historiques sans perPage gardent leur taille par défaut ; routes métier bornées à 1..100. Calendriers/Kanban, fils d’activité, tableaux de saisie et petites listes intégrées gardent leur comportement spécifique.

### Dashboard modulable — livraison locale du 19 octobre 2026

L’accueil propose un modèle Horizon immuable et jusqu’à 12 dashboards personnels par compte, enregistrés côté PocketBase et disponibles après connexion dans un autre navigateur. Sélecteur de disposition, duplication, nom modifiable pendant l’édition, suppression confirmée et étoile pour choisir la disposition ouverte par défaut. Modifier Horizon crée une copie personnelle ; supprimer le dashboard personnel par défaut rétablit Horizon. Aucun partage ni modèle métier administrateur dans ce premier lot.

Huit widgets issus des blocs existants : quatre indicateurs, suivi commercial, pilotage économique, planning personnel et activité personnelle. La grille compacte sur 12 colonnes utilise l’ordre des widgets, sans chevauchement ; déplacement par poignée (souris/tactile/clavier), taille par coin inférieur droit ou popup de dimensions, ajout/retrait, restauration des widgets Horizon dans la copie. Les tailles sont bornées pour garder les contenus lisibles. Enregistrer / Annuler explicites, confirmation avant abandon ou changement de page, erreur visible et brouillon conservé en cas d’échec ou de conflit entre sessions. Sur écran étroit, les dimensions desktop sont conservées en préférence et la présentation se réorganise automatiquement dans l’ordre enregistré ; la popup reste utilisable pour régler ces dimensions.

Les contenus et droits métier restent ceux du dashboard existant ; les indicateurs non raccordés ne deviennent pas de faux chiffres. Les listes des widgets défilent dans leur carte. Le choix de période reste global et repart au mois courant à l’ouverture, comme auparavant. Pas de synchronisation OnSite, modèle partagé, filtre métier supplémentaire ou widget externe livré ici.

### Notes de frais — suivi Équipe, 19 octobre 2026

Onglet Équipe distinct de Mes notes et À valider, accessible en lecture avec un périmètre reports/all. Vue Mois, Trimestre civil ou Année, toujours découpée en colonnes mensuelles et collaborateurs en lignes, regroupée par équipe par défaut. Le manager voit ses collaborateurs directs actifs sur la période, même sans note reçue, ainsi que les historiques des notes effectivement attribuées à sa validation. Les responsables d’équipe sans rattachement hiérarchique individuel ne récupèrent pas automatiquement un nouveau périmètre de lecture. Le scope global conserve ses droits existants, brouillons inclus ; les brouillons restent privés en reports.

Chaque mois affiche les états réels et le TTC des notes accessibles ; plusieurs états sont conservés si note principale et compléments diffèrent. Un clic ouvre la note unique ou une popup de choix entre principale/compléments, puis permet de revenir au suivi avec ses critères. Total TTC visible à droite sur la période, hors notes annulées ; pas de recalcul de TVA, de paiement ou de snapshot. Synthèses À valider, À corriger, À rembourser, Remboursées et mois Non reçus, tenant compte de la recherche/période/archives, hors filtre d’état. Non reçue signifie aucune note transmise dans ce périmètre, sans obligation de déclaration ni retard supposé. Périodes futures et hors dates d’emploi distinctes, historiques préservés après inactivation. Archives séparées, recherche employé/équipe dans la top bar, critères/tri/groupes/page/perPage en URL. Aucun changement du circuit d’approbation, d’auto-validation ou de droit sur les justificatifs.


Référence de commande client — correctif du 19 octobre 2026 : texte libre de 120 caractères maximum, sans obligation de lettre. Les références uniquement numériques, zéros initiaux et longues suites de chiffres sont conservés exactement (hors espaces de bord) à la confirmation et lors de la modification ultérieure. La lecture du formulaire multipart utilise le texte brut afin d’éviter son interprétation automatique comme nombre par PocketBase. Les règles Attente Commande, pièces jointes, permissions, versions et historiques restent inchangées.

### TimeReport — correction par le valideur avant validation (19 octobre 2026)

Une feuille BE native Horizon soumise peut être corrigée par son manager habilité (périmètre reports) ou un valideur global, avec le même droit time.validate que la validation. « Modifier les temps » ouvre la grille existante : durées, commentaires, activités, imputations et ordre des lignes ; ajout/retrait possibles. Enregistrer exige un motif non vide, conserve au moins une durée positive et laisse la feuille À valider. La validation est une action distincte, indisponible avec des modifications non enregistrées. Annuler restitue la version enregistrée. L’auteur reste verrouillé tant que la feuille est soumise.

Les contrôles de saisie restent serveur : aucune date future, services/périodes autorisés, rattachement analytique cohérent, maximum 24 h/jour toutes sources confondues. Employé, auteur, semaine, source et manager ne peuvent pas changer par cette route. La révision protège contre une correction/validation/retrait concurrent. Motif et auteur dans le fil, avant/après complet dans l’audit, notification interne au collaborateur selon ses préférences. Pas d’auto-correction/auto-validation ; le valideur n’a pas besoin d’une habilitation de saisie personnelle. Les temps validés et les sources externes OnSite restent hors édition directe.

### Congés — frise des collaborateurs et navigation RH, 19 octobre 2026

Le calendrier Congés devient une frise de consultation : une ligne par collaborateur, même sans absence, jours en colonnes, barres continues sur la période et bornes en demi-journées, total quotidien en bas. Navigation semaine/mois, période et recherche conservées dans l’URL ; les noms restent fixes pendant le défilement horizontal. Week-ends et jours non travaillés/fériés distingués sans rose ; aujourd’hui conserve son repère Horizon. Les barres indiquent la durée et l’état, avec dates complètes au survol ; le lien ouvre la fiche seulement si elle est consultable. Motif, catégorie médicale et justificatifs ne sont jamais exposés aux collègues par le calendrier.

Périmètres « Mon équipe » (soi, équipe actuelle, responsable et collaborateurs directs) et « Entreprise » (leave_scope all seulement) ; aucun élargissement automatique des droits. Sans employé lié, un accès global ouvre Entreprise par défaut. Seuls les collaborateurs ayant un congé soumis, validé ou en attente d’annulation chevauchant la période sont affichés ; recherche par nom sans accents, 50 collaborateurs par page. Total quotidien sur toute la sélection filtrée, toutes pages comprises, en équivalents journée (0,5 pour une demi-journée), attentes incluses et ventilées au survol. Décompte issu du calendrier snapshoté de chaque absence ; brouillons/refus/annulations acceptées exclus.

Sidebar : Congés → Mes congés / À valider / Calendrier / Allocations RH ; Notes de frais → Mes notes / Équipe. Ordre et libellés identiques aux vues métier, entrées restreintes selon droits et scopes de session. Aucun retour de l’onglet À valider dans Notes de frais.

Congés / libellé et aperçu de frise, 19 octobre 2026 : les barres affichent Nom · Type de congé · Durée pour les lecteurs déjà autorisés à consulter la demande. Pour les collègues, le type est remplacé par Absence. Clic ouvrant une popup de consultation sur place : collaborateur, durée, dates/demi-journées et état ; type, manager et commentaire chargés à la demande via le service de lecture existant uniquement si la fiche est consultable. Fermeture sans changer l’URL/recherche/période, lien Ouvrir la demande facultatif pour poursuivre vers la fiche complète. Aucun élargissement des permissions ni de la visibilité des données médicales.

Congés / frise, ajustement utilisateur du 19 octobre : couleur attribuée automatiquement par collaborateur dans la palette existante, stable après rechargement/filtrage/changement de période ; toutes ses barres reprennent la même couleur. La couleur ne représente plus l’état : contour plein pour validé, pointillé pour attente/annulation demandée, état toujours explicite au survol et dans la popup. Collaborateurs sans congé sur la période exclus côté serveur avant pagination, brouillons/refus/annulations acceptées toujours exclus. Pied renommé Total, chiffres centrés sous chaque jour et alignés verticalement avec le libellé.

Congés — présentation du Total (19 octobre 2026) : pied uniforme sans histogramme, jours sans absence laissés vides, valeurs non nulles centrées sous le jour correspondant. Les équivalents journée et la ventilation au survol restent inchangés.

Fusion Sociétés — conflits juridiques détaillés (19 octobre 2026) : chaque identifiant divergent produit son propre message indiquant le champ SIREN, N° TVA ou LEI, les deux valeurs, les noms des fiches et leur rôle (à fusionner / conservée). Un SIREN provenant des neuf premiers caractères du SIRET est identifié avec son SIRET d’origine. Aperçu et confirmation serveur donnent le même motif ; aucune possibilité de forcer la fusion, aucun changement des critères de compatibilité.

### Mon compte — compteurs personnels, 20 octobre 2026

Onglet Préférences accessible à chaque utilisateur actif, y compris lecteur, sans droit administrateur. Deux cases : Afficher les compteurs et Colorer les compteurs non nuls des smart boutons, activées par défaut. Sauvegarde explicite Annuler/Enregistrer ; la seconde case est désactivée tant que les chiffres sont masqués, sans perdre son choix. Réglages rattachés au compte, retrouvés dans les autres navigateurs et après reconnexion. Aucun changement de réglage global ni des données métier.

HRecordLinks applique le choix aux raccourcis visibles et au menu Autres raccourcis, HSummaryCards aux compteurs des synthèses cliquables ; libellés, filtres et navigation restent disponibles sans chiffre. Les valeurs formatées qui constituent le contenu principal (montants, soldes et durées) restent visibles, ainsi que les KPI principaux du dashboard. La coloration concerne uniquement les smart boutons : zéro et donnée indisponible restent neutres ; toute valeur numérique finie non nulle, positive ou négative, prend l’accent Horizon si demandé. Les cartes de synthèse conservent leurs couleurs habituelles, indépendamment de cette option. Aucun vert automatique ni nouveau sens métier donné au nombre. Le chargement ne montre pas provisoirement des compteurs que l’utilisateur a masqués. Erreurs de lecture/sauvegarde visibles, reprise possible ; conflit de révision impose de recharger les préférences.

### Regroupement des préférences personnelles — 20 octobre 2026

Mon compte conserve deux onglets : Profil et sécurité / Préférences. Préférences regroupe trois blocs avec enregistrements indépendants : Affichage et confort (thème, densité, largeurs, compteurs), Mes signatures e-mail si accès Messagerie, Mes notifications. Anciennes URL tab=display et tab=notifications toujours acceptées ; entrée Mes notifications retirée des Paramètres administrateur. Les réglages partagés d’apparence et de colonnes disponibles restent administrés, ainsi que les signatures société et autorisations d’expéditeurs.

Thème : Par défaut de cet appareil / Clair / Sombre. Un choix explicite suit le compte dans les autres navigateurs ; le bouton supérieur enregistre le même choix. À la sortie du compte, retour au thème de l’appareil, sans appliquer le choix d’un compte précédent. Erreur de sauvegarde visible ; le thème change après succès, avec mode local disponible si aucune préférence serveur ne peut être chargée.

Confort : largeur de recherche personnelle 400–1200 px, largeur du menu 180–360 px, champs vides pour hériter de l’entreprise ; densité Réglage de l’entreprise / Compacte (lignes/champs 30 px) / Confortable (lignes 38 px, champs 36 px). Aucun changement de la configuration partagée : l’aperçu administrateur conserve ses propres valeurs. Une modification concurrente (y compris via le bouton de thème) conserve le brouillon de préférences et impose une nouvelle révision avant de l’appliquer ; rechargement/annulation explicites.

Signatures : liste des signatures du compte, création/modification avec l’éditeur partagé de l’administration, nom, contenu enrichi/variables autorisées, active et par défaut. User fixé côté serveur, aucun sélecteur d’un autre utilisateur en mode personnel ; lecture messaging.read et écriture messaging.write hors Viewer. Une seule signature active par défaut par utilisateur ; signature société gérée séparément dans Paramètres. Le composeur retrouve les mêmes enregistrements et les signatures snapshotées d’e-mails existants ne changent pas. Les autres suggestions de centralisation (CRM, tableaux, dashboards, sections du menu) restent à traiter séparément.

### Dashboard — instances configurables et destination de déplacement, 20 octobre 2026

Extension du premier dashboard modulable : grille douze unités horizontales, taille unité par unité, positions indépendantes et plusieurs instances d’un même widget. Indicateur compact dès 2H × 1V, contenu détaillé dès 2H × 2V. Poignée dédiée, zone de destination teintée/pointillée et dimensions lisibles pendant déplacement/redimensionnement, voisins prévisualisés sans chevauchement, annulation du geste par Échap. Popup équivalente pour dimensions/position, consultation adaptative sur mobile. Brouillon puis Enregistrer/Annuler explicites, dispositions et défaut par compte conservés.

Widget Données métier : source opportunités/devis/commandes/factures clients, titre, périmètre Mes dossiers ou données accessibles (factures : accessible), état, société recherchée à la demande, texte, période héritée ou mois/trimestre/année en cours ou toutes périodes, liste/tableau/compteur et taille de page 3–20. Totaux de résultats et pagination serveur, ouverture des fiches et lien vers la liste filtrée. Les sources restent sous les droits de leur module. Les indicateurs économiques utilisent leurs agrégats existants, avec période propre possible ; les indicateurs financiers non raccordés restent indisponibles.

Carrousel : 1–12 pages nommées, ajout/duplication/suppression/réorganisation, chaque page configurée comme un widget de données ; pagination de résultats indépendante. Défilement automatique optionnel, délai 5–120 s, navigation manuelle, pause au survol/focus, en édition, hors écran et onglet masqué. Configuration sauvegardée avec le dashboard. Seul le contenu de la page active est monté, widgets éloignés chargés à leur première apparition.

Premiers widgets supplémentaires : raccourcis internes autorisés, matrice Temps personnelle ou équipe (mois/trimestre/année), calendrier Absences équipe/entreprise avec photos et couleurs partagées, À valider (congés de l’année courante, notes de frais toutes périodes, TimeReport du mois courant), accès aux listes de validation sans action métier depuis le widget. Employé sans saisie activée : raison explicite, aucun temps manquant inventé. Les permissions/scopes sont vérifiés par les services propriétaires ; erreurs et Réessayer visibles. Fenêtre Absences limitée à trois mois par le calendrier partagé ; pour un dashboard annuel, affiche explicitement son premier mois. Pas de synchronisation OnSite, partage de dashboard ou source externe ajouté.


Dashboard — correction de présentation du 20 octobre 2026 : le catalogue d’ajout présente une prévisualisation du type sélectionné avant confirmation, avec exemples locaux clairement signalés, aucun ajout implicite et aucun accès aux dossiers d’exemple. Les graphiques transparents sont conservés sur les indicateurs compacts raccordés. Les nouvelles instances de données et les pages commerciales par défaut utilisent le tableau Horizon ; les choix explicites Liste/Compteur restent conservés. Contrat visuel dans 07, section « Dashboard — tableaux, courbes et aperçu avant ajout ».


Dashboard — présentation du 21 octobre 2026 : la gestion des dispositions personnelles se fait dans un menu déroulant Mes dashboards accessible par une roue à droite du titre. Le menu principal propose Changer de dashboard (vue recherchable et défilante dans le même menu, avec retour) et Ajouter un dashboard (vide, modèle Horizon ou copie de la disposition personnelle courante), puis les actions sur le dashboard courant. Le choix, le favori, Supprimer et Modifier ne sont plus affichés en permanence. La copie se trouve uniquement dans Ajouter → À partir de ce dashboard ; aucune action Dupliquer séparée. Une création reste en brouillon jusqu’à Enregistrer ; la limite de 12 dispositions personnelles reste appliquée. Le menu ne contient aucun rappel de période ; les dates restent dans l’en-tête. Date et commandes de période centrées dans l’en-tête desktop ; groupe temporel replié sur mobile. En édition, le nom et les actions de grille remplacent le titre et la roue dans le même en-tête, sans barre supplémentaire ni décalage vertical des widgets. Aucun changement du stockage, des droits ou des filtres métier. Contrat UX détaillé dans 07.


### Devis — contact et disposition des informations, 21 octobre 2026

Le contact, déjà stocké dans sales_quotes, est visible et modifiable sur le brouillon actif. À la création, reprise du contact de l’opportunité ; choix d’un autre contact actif de la même société (identité société canonique), ou Sans contact explicite. La recherche est servie par Contacts, limitée à cette société, avec consultation de fiche via HRecordPicker. Changer le contact du devis ne modifie pas le CRM. Un client omettant ce champ conserve le comportement précédent : héritage en création, valeur enregistrée conservée en mise à jour. Modification soumise à contacts.read et sales.write, contrôle serveur dans la transaction de sauvegarde ; devis finalisé immuable jusqu’au retour normal en brouillon. Le PDF et le destinataire proposé par Messaging utilisent déjà ce contact de devis. Aucune réécriture des historiques acceptés ; une révision de commande conserve le contact accepté.

Disposition desktop : Opportunité / Titre, Contact / Commercial, Date du devis / Valable jusqu’au. Empilement commun mobile. Descriptions des lignes : interligne cohérent avec les autres cellules, hauteur automatique tenant compte des bordures effectives et non d’une constante de deux pixels ; retours à la ligne conservés sans texte coupé.
