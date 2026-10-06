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
- congés ;
- jalons projet.

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
- Action « Recherche informations » via l’API publique de l’État par nom, SIREN ou SIRET : choisir une entreprise / un établissement, comparer les champs proposés, puis appliquer explicitement. Ne pas remplacer automatiquement une valeur existante, créer des personnes à partir des dirigeants ou fusionner sur le seul nom. Détails dans `08-INTEGRATIONS.md`.

Recette attendue : création manuelle sans recherche externe ; choix des référentiels ; logo aperçu / remplacement / retrait ; adresse internationale ; personne créée depuis une société ; liste associée paginée ; compteurs et listes destination cohérents selon permissions ; erreurs de recherche sans perte du formulaire.

### Livraison locale de l’évolution Contacts

Paramètres propose une vue d’ensemble par domaine et une rubrique Référentiels (Pays / Langues / Devises), ajout et modification réservés à `settings.references`, lecture pour utilisateurs actifs. Initialisation : 18 pays, 8 langues et 11 devises, extensibles dans Paramètres ; les codes historiques supplémentaires sont préservés par la migration avec leur code comme libellé à compléter. Les combobox recherchent libellés et codes sans dépendre des accents.

Les fiches ont une zone d’image en haut et un aperçu avant enregistrement, SIREN / SIRET, une devise unique, un pays sélectionnable dans les adresses, une adresse principale par type et les contacts associés paginés avec création pré-rattachée. L’adresse du siège est saisissable dès la création, dans une carte visible à côté des coordonnées. Le bouton Enregistrer sauvegarde la société puis son adresse renseignée. La galerie est retirée de cette fiche ; les fichiers historiques restent conservés.

La recherche publique s’utilise dès la création et sur une société existante : appel direct depuis le navigateur, sélection des informations disponibles puis report local. Seul Enregistrer écrit en base. Aucun onglet Enrichissement, clé serveur ou configuration NAS. Voir `08-INTEGRATIONS.md` pour le mapping et les limites.

Le bandeau Devis / Factures / Bons de livraison / Opportunités est présent mais désactivé et marqué « À venir » : les modules ne sont pas encore livrés. Raccordement aux vrais totaux et filtres prévu à leur réalisation.

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
- tags ;
- documents ;
- archivage ;
- résultat gagné / perdu à terme.

Le client, le responsable, la description et la valeur estimée proviennent de l’opportunité CRM et ne doivent pas être dupliqués sans raison.

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
```

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

## 18.3 Numérotation

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


Recherche d’entreprises — décision finale du 5 octobre 2026 : Pappers et son onglet sont remplacés par le bouton Recherche informations dans la barre d’actions de la fiche. Nom / SIREN / SIRET sont interrogés directement depuis le navigateur auprès de l’API publique de l’État. La sélection préremplit le formulaire sans écriture ; Enregistrer utilise la sauvegarde Contacts ordinaire. Cette règle remplace les descriptions historiques d’enrichissement ci-dessus.


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

Navigation actuelle : **Informations → Contacts → Adresses → Comptabilité → Notes**. Contacts remplace Relations et présente toutes les personnes rattachées à la société, avec accès à leur fiche et création d’un contact associé. Les rôles Client / Fournisseur demeurent dans Informations. Adresses regroupe siège, livraison, facturation, autres adresses et e-mails. Cartes par usage, libellé libre, édition des coordonnées et choix de l’adresse principale pour chaque usage. Une ligne peut porter uniquement un e-mail, une adresse postale ou les deux. L’e-mail général et l’e-mail de facturation déjà saisis sont aussi accessibles ici sans doublon en base.

Ajouter ou modifier une adresse active Enregistrer en haut ; aucun bouton intermédiaire n’écrit en base. Les brouillons persistent lors du changement d’onglet. On peut retirer une nouvelle adresse du brouillon ; les adresses enregistrées restent conservées. Sur une nouvelle société, enregistrer d’abord la fiche pour accéder aux répertoires Contacts / Adresses. Les lecteurs et les sociétés archivées consultent ces répertoires sans actions d’édition. La sauvegarde depuis Adresses conserve cet onglet après succès et rechargement.


Contacts associés — filtre d’archives : afficher Actifs / Archivés avec le nombre d’archives uniquement si la société possède au moins un contact archivé. Filtre compact dans l’en-tête, à côté d’Ajouter un contact, police Inter commune et sélection soulignée discrètement ; aucune case à cocher isolée. Le filtre consulte les données sans écriture et revient à la première page lors d’un changement. Présentation responsive et disponible aux lecteurs autorisés.

### Mode clair / sombre

Bouton lune / soleil dans la top bar, à droite de la recherche et à côté des notifications / du compte. Bascule immédiate pour toute l’interface : Dashboard, Contacts, Adresses, Paramètres, champs, tableaux, menus, popups et fil d’activité. Choix mémorisé pour ce navigateur, conservé au rechargement et synchronisé entre onglets ouverts ; mode clair initial sans préférence. Aucune sauvegarde métier ni modification des brouillons. Les logos restent entiers sur fond blanc. Sur mobile, top bar fixe à deux lignes compactes : actions en haut et recherche centrée sur toute la largeur en dessous.
