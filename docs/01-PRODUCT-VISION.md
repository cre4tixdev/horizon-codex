# Horizon — Product Vision

## Mission

Horizon doit devenir l’outil central de gestion interne de CVS Engineering.

L’objectif n’est pas de reproduire Odoo, Dolibarr ou Axelor.

Horizon doit reprendre leurs bonnes pratiques lorsque pertinentes, tout en restant :

- plus simple ;
- plus adapté aux processus CVS ;
- plus léger à exploiter ;
- plus facile à faire évoluer.

---

# Utilisateurs

Usage interne CVS Engineering.

Charge cible :

```text
~10 utilisateurs simultanés
30 utilisateurs simultanés maximum réaliste
```

Horizon n’est pas conçu pour des milliers d’utilisateurs publics.

---

# Principes produit

Horizon doit être :

```text
rapide
lisible
modulaire
cohérent
très intégré
simple à maintenir
simple à sauvegarder
simple à déployer
```

Les écrans doivent privilégier l’efficacité métier.

---

# Modules

```text
Dashboard
Messagerie
Calendrier
Contacts
CRM
Ventes
Achats
Stock
Projets
SAV
TimeReport
Congés
Dépenses
Facturation
Comptabilité
Documents
Paramètres
```

---

# Intégration forte sans couplage fort

Les modules doivent travailler ensemble.

Exemple :

```text
Contact
  ↓
CRM
  ├── Opportunité directe
  └── Opportunité de type AO
          ↓
        Ventes
  ↓
Projet
  ↓
Stock / Achats
  ↓
Recette / Parc installé / SAV
  ↓
Facturation
  ↓
Comptabilité
```

Mais chaque module reste propriétaire de ses données et de sa logique.

---

# Inspirations ERP

Les solutions suivantes servent de références :

```text
Odoo
Dolibarr
Axelor
ERPNext / Frappe
```

Points à reprendre :

- navigation cohérente ;
- vues liste / formulaire / Kanban ;
- documents générés depuis les données ;
- permissions par rôle ;
- workflows ;
- historique ;
- automatisations ;
- liens entre objets ;
- recherche globale ;
- vues enregistrées ;
- actions rapides.

Points à éviter :

- personnalisation difficile à maintenir ;
- logique métier dispersée ;
- couplage excessif entre modules ;
- dépendance forte à un framework propriétaire ;
- complexité d’exploitation disproportionnée ;
- modules techniquement indépendants mais fonctionnellement incohérents.

---

# Références internes existantes

Certaines applications CVS existantes peuvent servir d’inspiration.

Exemple :

```text
cre4tixdev/cvs-aoboard
```

Cette application est une référence fonctionnelle pour le sous-domaine **AO du CRM** :

- Kanban ;
- vue liste ;
- planning / timeline ;
- publication ;
- échéance de remise ;
- visites ;
- responsable ;
- tags ;
- documents ;
- archivage ;
- realtime.

Elle ne constitue pas une architecture à recopier.

---

# Principe de développement

Ne pas développer tous les modules superficiellement en parallèle.

Préférer :

```text
socle solide
+
module réellement utilisable
```

à :

```text
beaucoup de modules incomplets
```

---

# Objectif long terme

Horizon doit pouvoir devenir l’outil quotidien de CVS pour :

- activité commerciale ;
- CRM et appels d’offres ;
- opérations ;
- projets ;
- temps ;
- stock ;
- achats ;
- documents ;
- facturation ;
- intégration comptable ;
- communication interne.

---

# Stratégie Finance

Horizon doit séparer clairement quatre responsabilités :

```text
Facturation
Comptabilité
Intégration Sage
Facturation électronique
```

## Phase initiale

Au lancement :

```text
Horizon
├── gère les devis, commandes, livraisons, factures et avoirs
├── produit les données de pré-comptabilité
├── transmet les écritures / données nécessaires vers Sage
└── échange les factures électroniques via SUPER PDP
```

**Sage reste la comptabilité officielle et la source de vérité comptable pendant cette phase.**

Horizon conserve néanmoins un modèle comptable suffisamment complet pour :

- préparer les écritures ;
- suivre les exports ;
- contrôler les erreurs ;
- tracer les identifiants Sage ;
- rapprocher Horizon et Sage ;
- permettre une migration progressive vers la comptabilité interne.

## Phase cible

À terme :

```text
Horizon
├── Facturation
├── Facturation électronique
└── Comptabilité interne
```

Le moteur comptable Horizon pourra devenir la source de vérité comptable lorsque son niveau fonctionnel, ses contrôles et sa fiabilité auront été validés.

La migration ne doit pas nécessiter de réécrire le module Facturation.

## Facturation électronique

SUPER PDP est la plateforme agréée retenue pour l’intégration de facturation électronique.

Horizon doit pouvoir :

- émettre les factures clients ;
- recevoir les factures fournisseurs ;
- transmettre les données nécessaires à la plateforme ;
- suivre les statuts et événements du cycle de vie ;
- gérer les erreurs et rejets ;
- conserver les identifiants de transmission ;
- gérer l’e-reporting lorsque nécessaire.

L’intégration est encapsulée derrière une abstraction afin d’éviter un couplage direct de la logique métier à SUPER PDP.

---

# Colonne vertébrale analytique

Toute opportunité CRM reçoit un **code CRM / compte analytique**.

Exemple :

```text
Opportunité CRM : #11450
        │
        ├── Devis #11450-1
        ├── Devis #11450-2
        ├── Devis #11450-3
        │
        ├── Commande(s) client
        ├── Projet
        ├── Achats
        ├── Stock consommé
        ├── Heures BE
        ├── Heures Production
        ├── Dépenses
        └── Facturation
```

Le code analytique reste le fil conducteur de l’affaire, même lorsque plusieurs devis, commandes ou achats sont générés.

Une dépense ou un achat peut être ventilé sur plusieurs codes analytiques lorsque nécessaire.

---

# Catalogue produits

Horizon doit gérer un catalogue unique comprenant notamment :

```text
services
équipements
consommables
produits composés / kits
```

Les règles de stock et de réapprovisionnement sont pilotées par les propriétés du produit, pas uniquement par son libellé de type.

Un produit peut :

- appartenir à une catégorie ;
- avoir une ou plusieurs images ;
- avoir plusieurs fournisseurs ;
- avoir un fournisseur privilégié ;
- disposer de conditions d’achat différentes par fournisseur ;
- mémoriser la date de mise à jour des prix ;
- mémoriser le dernier prix d’achat ;
- être composé d’autres produits.

---

# Migration et imports

La mise en service de Horizon doit permettre :

- migration des données utiles depuis Odoo ;
- import de catalogues Excel ;
- mise à jour des prix fournisseurs ;
- matching avec les produits existants ;
- prévention des doublons ;
- aperçu avant import ;
- résolution manuelle des conflits.

Les imports doivent être relançables sans recréer les mêmes objets.

---

# Planning et temps

Horizon doit réunir :

```text
Planning prévisionnel
+
Heures réellement réalisées
+
Code analytique
```

La référence fonctionnelle interne pour le planning est :

```text
cre4tixdev/cvs-onsite-backend
```

Les principes utiles à reprendre sont notamment :

- vue hebdomadaire par collaborateur ;
- collaborateurs internes et externes ;
- affectation à un code affaire ;
- journée / nuit ;
- Atelier / IDF / Déplacement ;
- plusieurs affectations sur une même journée ;
- application à plusieurs jours ;
- copie de semaine ;
- gestion des absences.

Horizon doit en plus distinguer les heures / affectations **BE** et **Production** et comparer le prévisionnel au réalisé.


# Pilotage économique de l’affaire

Le code CRM / compte analytique devient la fiche économique de référence d’une affaire.

Exemple :

```text
#11450
├── devis / commandes
├── budget achats
├── achats engagés
├── réceptions
├── stock consommé
├── heures BE
├── heures Production
├── dépenses
├── facturation
└── règlements
```

Horizon distingue systématiquement :

```text
prévu
engagé
réalisé
facturé
payé
```

La fiche affaire doit pouvoir afficher au minimum :

- vente prévisionnelle ;
- vente commandée ;
- montant facturé ;
- montant encaissé ;
- achats budgétés ;
- achats engagés ;
- achats réceptionnés ;
- achats facturés fournisseur ;
- achats payés ;
- heures BE prévues / réalisées ;
- heures Production prévues / réalisées ;
- dépenses ;
- coût de stock consommé ;
- marge prévisionnelle ;
- marge engagée ;
- marge réalisée.

Les règles exactes de valorisation sont centralisées afin d’éviter des calculs différents selon les écrans.

---

# Référentiel prix et coûts

Un produit peut avoir :

- un coût de référence ;
- plusieurs prix fournisseurs ;
- un dernier prix d’achat ;
- un prix catalogue de vente ;
- plusieurs listes tarifaires ;
- un prix spécifique client ;
- une devise ;
- une unité de vente ;
- une unité d’achat ;
- une TVA par défaut ;
- des remises encadrées.

La marge prévisionnelle doit être calculable dès le devis.

---

# Organisation CVS

Horizon doit représenter les services et équipes CVS.

Exemples :

```text
Commerce
BE
Production
Achats
Administration
Comptabilité
Direction
```

Les équipes servent notamment à :

- filtrer les vues ;
- affecter les responsabilités ;
- définir les capacités ;
- appliquer des droits ;
- déterminer certains circuits de validation ;
- produire des KPI.

---

# International et multi-devise

Horizon doit fonctionner avec plusieurs devises.

Une transaction conserve :

- devise du document ;
- taux de change utilisé ;
- date / source du taux ;
- contre-valeur éventuelle en devise de référence.

Les règles fiscales doivent pouvoir différencier notamment :

- France ;
- Union européenne ;
- hors Union européenne ;
- exonérations / cas spécifiques.

Les documents doivent prévoir :

- pays ;
- adresses internationales ;
- langue ;
- Incoterm lorsque pertinent ;
- devise.

---

# Recherche et notifications

Horizon doit proposer une recherche globale permettant de retrouver depuis un point unique :

```text
11450
TF1
référence produit
nom fournisseur
contact
commande
BL
facture
projet
```

Les notifications doivent pouvoir être :

- in-app ;
- éventuellement relayées par e-mail ;
- liées à un objet métier ;
- marquées lues ;
- paramétrables par type.

---

# Archivage

Les objets finalisés et documents historiques sont conservés selon une politique d’archivage configurable.

La durée de conservation dépend du type d’objet et des obligations applicables.

Horizon doit distinguer :

```text
actif
clos
archivé
```

L’archivage ne doit pas casser les relations historiques ni les rapports.


---

# Continuité commerciale : plusieurs devis et commandes

Une opportunité n’est pas limitée à un seul devis validé.

Exemple :

```text
Opportunité #11450
├── Devis #11450-1 → validé → accepté → Commande A
├── Devis #11450-2 → validé → non retenu
├── Devis #11450-3 → validé → accepté → Commande B
└── Devis #11450-4 → validé → accepté plus tard → Commande C
```

Plusieurs devis peuvent être :

- validés en interne ;
- envoyés ;
- acceptés par le client.

Une opportunité peut donc générer plusieurs commandes client.

Toutes restent rattachées au même compte analytique `#11450`, sauf décision explicite de découpage analytique.

Le passage de l’opportunité au statut gagné ne doit pas empêcher l’ajout ultérieur de nouveaux devis ou commandes liés à la même affaire.

---

# Parcours Projet

Le Projet couvre l’exécution opérationnelle de l’affaire.

Parcours de référence :

```text
Opportunité / Commandes
        ↓
Préparation projet
        ↓
Kick-off
        ↓
BE / études
        ↓
Approvisionnement
        ↓
Production / préparation / intégration
        ↓
Livraison
        ↓
Installation
        ↓
Mise en service / commissioning
        ↓
Recette
        ↓
Réserves éventuelles
        ↓
Levée des réserves
        ↓
Remise documentaire / handover
        ↓
Clôture opérationnelle
        ↓
Garantie / Parc installé
        ↓
SAV / Maintenance
```

Toutes les phases ne sont pas obligatoires.

Le parcours est configurable selon le type de projet.

Un projet peut agréger plusieurs commandes issues de la même opportunité.

Une même opportunité peut également porter plusieurs projets si le découpage opérationnel l’exige ; le compte analytique peut rester commun.

---

# Clôture Projet

Horizon distingue :

```text
clôture opérationnelle
≠
clôture financière
```

La clôture opérationnelle signifie que le projet est techniquement terminé :

- installation terminée ;
- recette réalisée ;
- réserves levées ou formellement acceptées ;
- livrables remis ;
- parc installé constitué lorsque nécessaire.

La clôture financière intervient lorsque les éléments économiques sont finalisés :

- achats ;
- dépenses ;
- heures ;
- facturation ;
- paiements / écritures selon périmètre.

Un projet peut donc être opérationnellement clos tout en restant financièrement ouvert.

---

# SAV / Maintenance / Interventions

Le module SAV assure la continuité après livraison.

Il couvre :

- tickets clients ;
- incidents ;
- demandes de support ;
- interventions ;
- maintenance ;
- garantie ;
- techniciens ;
- temps passés ;
- pièces utilisées ;
- documents ;
- historique.

Une intervention peut être :

```text
garantie
facturable
contrat / maintenance
interne
```

Une intervention sous garantie peut continuer à impacter le compte analytique de l’affaire d’origine afin d’obtenir la marge réelle finale du projet.

Une intervention facturable peut être rattachée à une nouvelle opportunité / un nouveau compte analytique lorsque nécessaire.

---

# Parc installé client

Horizon maintient un registre des équipements installés chez les clients.

Pour un équipement :

```text
Client : TF1
Site : Boulogne
Produit : ...
N° série : ...
Affaire origine : #11450
Projet : ...
BL : ...
Date installation : ...
Date mise en service : ...
Garantie : ...
Statut : en service
```

Le parc installé sert de point d’entrée pour :

- SAV ;
- maintenance ;
- garantie ;
- historique des interventions ;
- localisation du matériel ;
- identification des numéros de série.


# Employés et utilisateurs Horizon

Horizon distingue deux notions.

## Employé / Ressource

Le module **Employés** représente toutes les personnes pouvant intervenir dans l’activité CVS :

```text
salarié
freelance
intérimaire
externe
prestataire récurrent
```

Une ressource peut être utilisée pour :

- planning ;
- TimeReport ;
- projets ;
- interventions SAV ;
- équipes ;
- capacités ;
- coûts analytiques ;
- congés lorsque applicable.

Une ressource n’a pas nécessairement accès à Horizon.

## Utilisateur Horizon

Un utilisateur est une identité autorisée à se connecter à Horizon.

```text
Utilisateur Horizon
→ authentification
→ rôle
→ permissions
→ préférences
```

Un utilisateur peut être relié à une ressource Employés.

Relation :

```text
Employé / Ressource
        │
        └── 0..1 Utilisateur Horizon
```

Exemples :

```text
Technicien CVS
→ employé + utilisateur Horizon

Freelance planifié
→ employé / ressource
→ aucun compte Horizon

Comptable externe avec accès limité
→ ressource externe + utilisateur Horizon limité

Compte API
→ pas un utilisateur humain
```

La désactivation d’un utilisateur ne supprime jamais l’historique de l’employé.

---

# API externe Horizon

Horizon expose une API externe dédiée pour les intégrations futures.

Cette API ne donne jamais un accès direct et générique à PocketBase.

Chaque client API possède des droits explicites.

Exemple :

```text
Client API : Application X

Resource : contacts.people
Actions  : read

Champs autorisés :
- id
- first_name
- last_name
- email
- company

Champs interdits :
- notes
- private_phone
- données internes
```

Les autorisations peuvent être définies par :

```text
ressource
+
action
+
champs en lecture
+
champs en écriture
+
périmètre de données
```

Une clé API peut être :

- activée / désactivée ;
- révoquée ;
- expirée ;
- renouvelée ;
- limitée par IP si nécessaire ;
- limitée en débit ;
- auditée.

L’API externe utilise les mêmes services métier que l’application Horizon afin de ne pas contourner les règles de validation.


# Décisions financières et d’identification V12

## Taux de change

Horizon utilise la Banque centrale européenne (BCE / ECB) comme source de référence des taux de change.

Principe :

```text
BCE
↓
historique quotidien des taux
↓
document draft : dernier taux disponible
↓
validation : snapshot
↓
historique immuable
```

Chaque document conserve son propre taux.

Un devis, une commande et une facture liés peuvent donc avoir des taux différents si leurs dates de validation diffèrent.

## TVA

CVS utilise par défaut :

```text
TVA = 20 %
```

Horizon reste capable de gérer d’autres taux et contextes :

```text
France
UE
intracommunautaire
autoliquidation
export hors UE
exonération
achat
vente
```

## Numérotation

Le numéro métier d’un document n’est jamais son identifiant technique.

```text
PocketBase record id
→ identité technique stable

business_number
→ référence utilisateur configurable
```

Les changements de format de numérotation ne cassent aucune relation.

Les anciennes références sont conservées, recherchables et affichables en option.

## Authentification

Le mode par défaut est l’authentification Horizon.

Microsoft OAuth2 / Entra peut être activé en complément.

Les rôles et permissions restent gérés par Horizon, quel que soit le mode de connexion.
