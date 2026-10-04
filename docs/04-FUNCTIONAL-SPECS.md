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
prospect
fournisseur
partenaire
autre
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

### Première livraison Contacts V1

Listes distinctes Sociétés / Personnes avec recherche, tri serveur, pages de 25 et filtre Actifs / Archivés. Fiches de création / modification avec coordonnées, notes texte brut, langues / devises / identifiants fiscaux société, logo / galerie et avatar protégés. Rattachement facultatif d'une personne, recherche de société dans le sélecteur ; société visible dans la liste et badge logo sur l'avatar.

Après création de la société, chaque rôle et chaque adresse s'enregistre explicitement. Une société peut cumuler tous les rôles ; la désactivation / réactivation réutilise la relation existante. Les adresses sont multiples et modifiables ; aucune suppression applicative d'une fiche ou d'une adresse. Archivage / réactivation de société ou personne avec confirmation ; les liens historiques restent conservés.

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
