# Horizon — Functional Specifications

## Objectif

Ce document décrit **ce que Horizon doit faire**.

La structure technique se trouve ailleurs.

Chaque module sera enrichi progressivement au fur et à mesure des validations.

---

# 1. Dashboard

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

À analyser : dossier seul. No go : dossier conservé sans nouvelle opportunité. En préparation : création de l’affaire liée, puis étapes commerciales indépendantes. Aucun numéro commercial n’est consommé pendant l’analyse. Les dossiers existants et leur historique restent conservés ; revenir en No go après promotion ne supprime pas l’affaire. No go n’est pas Perdue. Les documents, échanges, tâches et rendez-vous fonctionnent dès l’analyse.

Les vues AO utilisent les dossiers comme racine : Kanban de préparation avec No go, liste dédiée (référence, société, titre, tags, publication, visites, préparation, remise, montant, documents, responsable) et planning par dossier. Le planning réutilise les dates et la navigation du calendrier Horizon, sans copier les événements.

### Premier lot AO livré — 7 octobre 2026

Périmètre historique : la création immédiate, la liste et le calendrier AO de ce lot sont remplacés par la décision du 8 octobre ci-dessus. La duplication d’un dossier autonome n’est pas proposée ; la duplication d’une affaire liée reste le parcours CRM.

- Types `direct` / `tender` choisis à la création et convertibles à la sauvegarde avec crm.write. AO → direct archive uniquement l’extension AO ; retour vers AO réactive le même dossier ou le crée s’il n’existe pas. Numéro, compte analytique et historique préservés. Les opportunités existantes restent directes. Une AO reprend société, responsable, montant, devise, description, compte analytique, étapes commerciales et fil de l’opportunité.
- Volet Appels d’offres : mêmes cartes / Kanban avec glissement automatique, colonnes repliables mémorisées par utilisateur, totaux globaux par devise, liste et calendrier. La préparation dispose initialement de À analyser / En préparation / À vérifier / Prête / Déposée ; déplacer la préparation ne modifie pas l’étape commerciale.
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

L’interface affiche explicitement :

```text
Brouillon devis
Devis
```

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

# 14. Dépenses

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

`/settings` présente la vue d’ensemble et une recherche des rubriques. Navigation dédiée en trois ensembles : Socle commun (référentiels, organisation, utilisateurs et accès), Modules métier (Contacts, CRM, Catalogue, Ventes, Achats, Stock, Facturation, Comptabilité, Projets, Planning et temps), Connexions (intégrations). Sur mobile, la navigation devient horizontale et reste contenue à son cadre.

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

- Microsoft Graph ;
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
