# Horizon — UX & Design System

Finition du 5 octobre 2026 — largeur des fiches : les sociétés et contacts utilisent toute la largeur disponible du contenu, au lieu d’un bloc centré plafonné à 1080 px. La barre d’actions, les onglets, les sections et le fil d’activité restent alignés. Seules les marges du layout sont conservées : 25 px par côté sur desktop et 12 px sur mobile. Les grilles adaptatives et les dimensions des logos restent inchangées.

## Statut

```text
BASELINE UI V1
Status : VALIDATED
Version : V13
```

Ce document constitue la référence visuelle initiale de Horizon.

Il fixe :

- l’identité graphique ;
- les couleurs ;
- la typographie ;
- la densité ;
- le layout ;
- les composants ;
- les comportements de tableaux et formulaires ;
- les vues métier de référence ;
- les règles de couleur ;
- les contraintes UX à respecter pendant le développement.

Les maquettes de référence sont fournies dans :

```text
docs/assets/horizon-brand-charter.png
docs/assets/horizon-ui-reference-dashboard.png
docs/assets/horizon-ui-reference-crm.png
docs/assets/horizon-ui-reference-quote.png
```

Ces images sont des **références de direction**, pas des spécifications pixel-perfect.

---

# 1. ADN visuel

Horizon doit paraître :

```text
professionnel
dense
moderne
technique
premium
lisible
calme
```

L’interface est conçue pour être utilisée toute la journée.

Elle ne doit pas ressembler :

- à un ERP ancien et gris ;
- à une application grand public très arrondie ;
- à un dashboard marketing surchargé de couleurs ;
- à un assemblage de cartes décoratives ;
- à une interface glassmorphism ;
- à une application où chaque contrôle attire l’œil.

Principe :

> La donnée et l’action métier dominent. La couleur guide, elle ne décore pas.

---

# 2. Principes Horizon

Les quatre principes issus de la charte sont repris dans l’UI.

## Ouverture

L’interface respire malgré une forte densité d’information.

Utiliser :

- espaces réguliers ;
- alignements stricts ;
- sections ouvertes ;
- largeur utile maximale.

## Vision

Les informations permettant de décider doivent être immédiatement visibles.

Exemples :

- marge ;
- statut ;
- prochaines échéances ;
- stock disponible ;
- avancement projet ;
- activité récente.

## Clarté

Une information possède une hiérarchie visuelle évidente.

```text
page
→ section
→ donnée
→ action
```

Éviter les effets décoratifs qui concurrencent les informations.

## Pilotage

Les écrans doivent permettre d’agir rapidement :

- filtrer ;
- modifier ;
- valider ;
- naviguer ;
- comparer ;
- retrouver un historique.

---

# 3. Logo Horizon

Référence :

```text
docs/assets/horizon-brand-charter.png
```

Le symbole représente un **H ouvert / fenêtre**, associé à l’ouverture et à la perspective.

## Variantes autorisées

```text
logo couleur sur fond clair
logo couleur sur fond sombre
pictogramme seul
icône d’application claire
icône d’application sombre
version monochrome sombre
```

## Usage dans Horizon

### Sidebar sombre

Utiliser :

```text
pictogramme couleur
+
HORIZON blanc
```

### Login / splash / documents de marque

Le logo complet peut être utilisé avec davantage d’espace.

### Favicon / app icon / sidebar compacte

Utiliser le pictogramme seul.

## Zone de protection

Toujours conserver une zone libre autour du logo.

Référence :

```text
X = hauteur visuelle du pictogramme
```

Aucun élément graphique ou texte ne doit empiéter sur la zone prévue par la charte.

## Interdits

Ne jamais :

- déformer le logo ;
- changer arbitrairement ses couleurs ;
- modifier les proportions ;
- ajouter ombre, glow ou effet 3D ;
- ajouter un contour ;
- recomposer le pictogramme ;
- utiliser un autre dégradé.

---

# 4. Palette officielle

## Palette principale

| Token | Couleur | Hex | Usage |
|---|---|---|---|
| `hz-navy` | Bleu nuit | `#091C3A` | navigation, texte fort, fonds sombres |
| `hz-magenta` | Magenta | `#F52F96` | action primaire, actif, focus |
| `hz-pink` | Rose | `#FF5AAE` | accent secondaire, hover léger |
| `hz-violet` | Violet | `#7B3FC7` | second accent, gradient |
| `hz-violet-light` | Violet clair | `#A56BEA` | visualisation secondaire |
| `hz-gray-light` | Gris clair | `#F4F5F7` | fond de page / sections |
| `hz-gray-text` | Gris texte | `#7B8794` | texte secondaire |
| `hz-white` | Blanc | `#FFFFFF` | surfaces |

## Dégradé signature

```css
linear-gradient(
  135deg,
  #F52F96 0%,
  #7B3FC7 100%
)
```

Usage autorisé :

- logo ;
- état actif principal dans la sidebar ;
- CTA majeur ponctuel ;
- avatar / élément de marque ;
- accent visuel exceptionnel.

Ne pas utiliser le gradient :

- comme fond de carte entière ;
- sur chaque bouton ;
- dans toutes les icônes ;
- sur tous les graphiques ;
- comme décoration générale.

---

# 5. Répartition des couleurs

Objectif visuel moyen :

```text
70–75 % neutre / blanc / gris
15–20 % bleu nuit
5–10 % couleurs de marque et couleurs fonctionnelles
```

Il ne s’agit pas d’un calcul rigide mais d’une règle de composition.

## Magenta

Réservé principalement à :

- action primaire ;
- navigation active ;
- focus ;
- onglet actif ;
- indicateur majeur ;
- lien important ponctuel.

## Violet

Utilisé comme complément :

- gradient signature ;
- série secondaire dans certains graphiques ;
- éléments de marque ;
- accent de navigation secondaire.

## Bleu nuit

Porte la structure de l’interface :

- sidebar ;
- titres ;
- valeurs importantes ;
- icônes neutres ;
- texte principal.

## Couleurs fonctionnelles

Les statuts conservent des couleurs sémantiques indépendantes de la marque.

```text
vert    = succès / validé
orange  = attente / vigilance
rouge   = erreur / blocage
bleu    = information / en cours
gris    = brouillon / neutre
```

Les teintes doivent rester douces.

Éviter les grands aplats saturés.

---

# 6. Typographie

## Titres

```text
Montserrat SemiBold
```

Usage :

- page title ;
- titre principal ;
- titres marketing / branding rares.

## Interface et données

```text
Inter Regular
Inter Medium
```

Usage :

- menus ;
- tableaux ;
- formulaires ;
- nombres ;
- labels ;
- boutons ;
- textes secondaires.

## Échelle desktop recommandée

```text
Page title              26–28 px / Montserrat SemiBold
Section title           16–18 px / Inter SemiBold ou Medium
Card / panel title      14–16 px / Inter Medium
Body                    13–14 px / Inter Regular
Table                   12.5–14 px / Inter Regular
Label                   12–13 px / Inter Medium
Secondary               11.5–12.5 px
KPI value               20–24 px / Inter SemiBold
```

Éviter les textes de 15–16 px partout : Horizon doit conserver une densité professionnelle.

Ne jamais descendre sous une taille rendant la lecture fatigante sur un écran desktop standard.

---

# 7. Densité de référence

Horizon est **dense mais respirable**.

Cible desktop 1440p / 1600px :

```text
10–15 lignes métier visibles
+
header
+
actions
+
informations essentielles
```

sans scroll vertical excessif.

## Dimensions de référence

```text
Topbar                 48–52 px
Sidebar ouverte        205–225 px
Sidebar réduite        58–64 px
Content padding        14–20 px
Table header           32–36 px
Table row              34–38 px
Input standard         34–38 px
Input compact          30–34 px
Tabs                    36–40 px
Section gap            12–16 px
Panel padding          12–16 px
```

Les écrans métier doivent privilégier la largeur utile.

---

# 8. Layout principal

Structure desktop :

```text
┌─────────────────────────────────────────────────────┐
│ Sidebar │ Topbar / recherche / utilisateur          │
│         ├───────────────────────────────────────────┤
│         │ Breadcrumb                                │
│         │ PageHeader                                │
│         │ Tabs / toolbar                            │
│         │                                           │
│         │ Zone métier                               │
│         │                                           │
└─────────────────────────────────────────────────────┘
```

## Sidebar

Fond :

```text
#091C3A
```

Menu :

- icône claire ;
- texte blanc / gris clair ;
- item inactif sans fond ;
- item actif avec accent magenta/violet maîtrisé ;
- sous-menu légèrement indenté.

L’état actif peut utiliser le dégradé signature, mais sur **un seul niveau actif principal**.

Éviter plusieurs blocs magenta simultanés dans la navigation.

## Réduction

La sidebar doit pouvoir se réduire en mode pictogrammes.

```text
ouverte  → logo + labels
réduite  → pictogramme Horizon + icônes
```

---

# 9. Topbar

Contenu :

```text
recherche globale
notifications
avatar
nom utilisateur
menu compte
```

La barre doit rester discrète.

Pas de couleur de marque permanente sauf notification / avatar.

La recherche globale peut occuper environ :

```text
420–620 px
```

sur grand écran.

---

# 10. Breadcrumb

Composant :

```text
HBreadcrumb
```

Exemple :

```text
CRM > Opportunités > #11450 — TF1
```

Règles :

- ancêtres cliquables ;
- page actuelle non cliquable ;
- maximum d’environ 4 niveaux visibles ;
- `…` si profondeur importante ;
- texte secondaire gris ;
- compact.

Le breadcrumb ne remplace pas la sidebar.

---

# 11. Surfaces et panneaux

Horizon utilise peu d’effets de profondeur.

## Surface standard

```text
background: #FFFFFF
border: 1px solid neutral-light
radius: 7–9 px
shadow: none
```

Les ombres sont réservées à :

- dropdown ;
- popover ;
- modal ;
- drawer ;
- menu flottant.

## Cards

Ne pas transformer chaque groupe d’information en grosse card décorative.

Préférer :

```text
section
+
border
+
titre
+
contenu
```

Les cartes sont surtout adaptées à :

- KPI ;
- petits résumés ;
- blocs latéraux ;
- paramètres.

---

# 12. Boutons

## Primaire

```text
magenta
ou
gradient magenta → violet
```

Une seule action primaire dominante par zone.

Exemples :

```text
Valider
Nouveau devis
Créer
Enregistrer et envoyer
```

## Secondaire

```text
fond blanc
bordure légère
texte bleu nuit
```

## Destructif

Utiliser une couleur rouge sémantique.

Ne jamais utiliser le magenta pour signifier une erreur.

## Hauteur

```text
standard 34–38 px
compact  30–34 px
```

---

# 13. Inputs / Select / Combobox

Les contrôles doivent rester **visuellement discrets**.

Ils ne doivent pas dominer la page.

## Style

```text
background      blanc
border          fine / gris très clair
radius          5–6 px
shadow          none
height          32–36 px
chevron         gris
text            bleu nuit
placeholder     gris texte
```

## Focus

```text
border magenta
+
focus ring très léger
```

Ne pas utiliser :

- gros contour coloré ;
- fond coloré permanent ;
- chevron très marqué ;
- radius type "pill" ;
- ombre permanente.

## Combobox dans les tableaux

Encore plus compacte.

Elle peut visuellement se rapprocher d’une cellule éditable :

```text
Unité  ⌄
```

avec une bordure presque invisible hors hover / focus.

---

# 14. Tabs

Pattern :

```text
Vue d’ensemble
Devis
Commandes
Projet
Finance
Activité
Documents
```

État actif :

```text
texte magenta
+
underline 2 px magenta
```

Éviter les tabs sous forme de gros boutons colorés.

---

# 15. Statuts

Composant :

```text
HStatus
```

Format compact.

Exemple :

```text
● Brouillon
● Validé
● Envoyé
● Accepté
● En cours
● Terminé
```

Le fond peut être légèrement teinté.

La couleur ne doit jamais être le seul indicateur.

Toujours conserver le libellé.

---

# 16. Icônes

Base :

```text
Lucide
```

Style :

```text
stroke régulier
16–18 px standard
14–16 px dense
```

Par défaut :

```text
bleu nuit / gris
```

La couleur est utilisée lorsque :

- l’action est primaire ;
- l’icône représente un statut ;
- elle sert d’accent de marque.

Éviter une icône magenta devant chaque titre.

---

# 17. Tableaux

Le tableau est un composant central de Horizon.

Composant :

```text
HDataTable
```

## Capacités

- tri ;
- filtres ;
- recherche ;
- colonnes configurables ;
- pagination ;
- sélection ;
- actions groupées ;
- sticky header ;
- colonnes numériques alignées ;
- sauvegarde de vues lorsque pertinente.

## Style

```text
header gris très léger
lignes blanches
séparateurs fins
hover discret
texte dense
pas de zebra très marqué
```

## Alignement

```text
texte        gauche
quantité     droite
prix         droite
pourcentage  droite
dates        gauche ou centre selon contexte
actions      droite
```

## Colonnes

Limiter la largeur des colonnes descriptives secondaires pour préserver les colonnes financières utiles.

## Row density

Cible :

```text
34–36 px
```

pour les tableaux métier principaux.

---

# 18. Vue Devis — référence principale

Référence :

```text
docs/assets/horizon-ui-reference-quote.png
```

La vue Devis est un écran de production.

Elle doit maximiser la zone utile.

## Structure

```text
PageHeader
↓
Informations principales
↓
Tabs
↓
Toolbar
↓
TABLE DEVIS PLEINE LARGEUR
↓
TOTAUX PLEINE LARGEUR
↓
INFORMATIONS SECONDAIRES
```

## Règle forte

**Ne pas placer les totaux dans une grande sidebar qui réduit la largeur du tableau.**

Pendant l’édition :

```text
table devis
→ largeur maximale
```

Les informations secondaires viennent **sous le tableau**.

## Lignes

À 1440p / 1600px, viser :

```text
10 à 15 lignes visibles
```

selon les sections et la hauteur écran.

Les lignes doivent rester compactes.

## Colonnes minimales

```text
Pos
Référence
Description
Qté
Unité
PU HT
Remise
Total HT
TVA
Total TTC
Actions
```

Des colonnes supplémentaires peuvent être activées selon besoin.

## Sections de devis

Supporter des lignes de structure :

```text
1 — Matériel vidéo
2 — Intégration et services
3 — Câblage et accessoires
```

Style :

```text
fond gris léger
titre magenta
totaux section à droite
```

Le magenta reste limité au titre / numéro de section.

## Références produit

Une référence cliquable peut utiliser un bleu d’action distinct du magenta.

Le magenta reste la couleur de marque / action principale.

## Toolbar

Exemple :

```text
+ Ajouter une ligne
Importer
Dupliquer
Supprimer
TVA par défaut
Gestion des articles
```

Une seule action primaire :

```text
+ Ajouter une ligne
```

## Totaux

Les totaux sont affichés **immédiatement sous le tableau**.

Disposition horizontale recommandée :

```text
Remise globale
Frais divers
Total HT
TVA
TOTAL TTC
Marge estimée
```

Le `TOTAL TTC` reçoit un fond magenta très clair / accent de marque.

La marge positive peut utiliser un vert sémantique.

## Informations secondaires

Sous les totaux :

```text
Commentaire global
Statut et suivi
Documents
Activité récente
```

Sur grand écran, ces blocs peuvent être répartis en colonnes.

Ils ne doivent pas réduire la zone principale de saisie du devis.

---

# 19. Vue CRM / Opportunité

Référence :

```text
docs/assets/horizon-ui-reference-crm.png
```

Structure :

```text
breadcrumb
titre + statut + actions
résumé client / montant / date / commercial
tabs
contenu métier
```

## Vue d’ensemble

Présenter en priorité :

```text
CA potentiel
marge
jours restants
phase
devis liés
commandes liées
projet
activité
```

Les devis et commandes doivent rester visibles sans navigation excessive.

## Activité

Un panneau droit est acceptable pour une fiche CRM si la largeur du contenu principal reste suffisante.

Sur écran plus étroit :

```text
activité
↓
sous le contenu
```

---

# 20. Dashboard

Référence :

```text
docs/assets/horizon-ui-reference-dashboard.png
```

Le Dashboard peut être légèrement plus expressif en couleur que les écrans de production.

Cependant :

- maximum 4–6 KPI principaux en haut ;
- graphiques principalement bleu nuit / gris ;
- magenta pour la série ou donnée mise en avant ;
- violet comme seconde série ;
- couleurs sémantiques uniquement lorsque nécessaires.

Éviter :

```text
une couleur différente pour chaque widget
```

## Structure recommandée

```text
KPI
↓
opportunités / planning
↓
graphique principal / activité
↓
analyses secondaires
```

Le Dashboard doit rester dense.

---

# 21. Graphiques

Palette recommandée :

```text
principal       #F52F96
secondaire      #7B3FC7
structure       #091C3A
support         gris / violet clair
```

Pour plusieurs séries :

1. magenta ;
2. bleu nuit ;
3. violet ;
4. violet clair ;
5. gris.

Ne pas utiliser une palette arc-en-ciel.

Les couleurs rouges / vertes sont réservées à leur signification fonctionnelle.

---

# 22. Formulaires

## Petites créations

Utiliser un drawer :

```text
contact
tâche
note
petite configuration
```

## Objets métier complexes

Utiliser une page complète :

```text
devis
commande
facture
produit complexe
projet
```

Éviter les grandes modales avec beaucoup de champs.

## Règles

- labels courts ;
- sections logiques ;
- champs alignés ;
- validation immédiate ;
- erreurs proches du champ ;
- action principale toujours identifiable.

---

# 23. Activity Feed

Composants :

```text
HActivityTimeline
HActivityPanel
```

Afficher :

```text
qui
quoi
quand
```

Contenus :

- changement ;
- note ;
- message ;
- document ;
- mention ;
- tâche ;
- statut.

Les icônes peuvent utiliser une couleur fonctionnelle légère.

Ne pas transformer chaque événement en carte.

---

# 24. Planning

Composant :

```text
HPlanningGrid
```

Vue desktop dense.

```text
Collaborateur | L | M | M | J | V | S | D
```

Afficher selon configuration :

- jour / nuit ;
- plusieurs codes analytiques ;
- logo client ;
- affaire ;
- BE ;
- Production ;
- SAV ;
- emplacement ;
- congé / absence ;
- heures prévues.

Conserver une grille dense.

Éviter de remplacer chaque cellule par un gros composant.

---

# 25. Stock

Les écrans Stock doivent être particulièrement denses.

Afficher clairement :

```text
Physique
Réservé
Disponible
Attendu
```

Les miniatures produits restent petites.

Les lots / séries apparaissent à la demande ou dans une vue dédiée.

---

# 26. Projet

Structure possible :

```text
Vue d’ensemble
Commercial
Phases / Tâches
Planning / Heures
Achats / Stock
Livraisons
Recette / Réserves
Documents
Parc installé
Finance / Marge
Activité
```

Composant :

```text
HProjectTimeline
```

Le suivi projet privilégie la progression et les alertes.

Le magenta indique l’étape active.

Les étapes terminées utilisent une couleur succès discrète.

---

# 27. Paramètres

Navigation secondaire obligatoire.

```text
Paramètres
├── Général
├── Utilisateurs & Organisation
├── Numérotation
├── Ventes
├── Achats
├── Produits & Stock
├── Projets
├── Planning & Temps
├── Finance / TVA
├── Documents
├── SAV
├── Notifications
├── Imports
├── Intégrations
├── API externe
├── Archivage
└── Audit & Système
```

Les écrans Paramètres peuvent utiliser davantage de panels que les écrans métier.

Ils doivent néanmoins rester sobres.

---

# 28. Numérotation

Toujours afficher un aperçu.

```text
Pattern : FAC-{YYYY}-{SEQ}
Padding : 5

Aperçu :
FAC-2026-00208
```

Si l’affichage des anciennes références est activé :

```text
FAC-2026-00208
(20260208)
```

L’ancienne référence :

- plus petite ;
- grisée ;
- secondaire.

---

# 29. Multi-devise

La devise doit être visible sans être envahissante.

Exemple :

```text
Devise          USD
Taux BCE        1,0834
Date du taux    04/10/2026
```

En brouillon :

```text
taux indicatif / actualisable
```

Après validation :

```text
taux verrouillé
```

Ne pas afficher les détails fiscaux complexes sur tous les écrans.

Les informations avancées restent disponibles dans le détail Finance.

---

# 30. Utilisateurs / Employés

Toujours distinguer visuellement :

```text
Ressource métier
≠
Compte Horizon
```

Exemples :

```text
Jean DUPONT
Technicien Production
Compte Horizon : Actif
```

```text
Pierre MARTIN
Freelance
Compte Horizon : Aucun
```

Un freelance sans compte ne doit pas apparaître comme utilisateur désactivé.

---

# 31. Images / logos métiers

## Société

Afficher le logo lorsqu’il existe.

## Contact

```text
avatar
+
badge société discret
```

## Produit

Miniature facultative dans les listes.

La fiche produit peut afficher :

- image principale ;
- galerie.

Les images ne doivent jamais diminuer excessivement la densité des tableaux.

---

# 32. Recherche globale

Accessible depuis la topbar.

Exemples :

```text
11450
TF1
ATEM-4ME
FAC-2026-00208
ancienne référence
```

Les résultats sont regroupés par type.

L’ancienne référence métier peut apparaître en sous-texte gris.

---

# 33. Responsive

Priorité :

```text
desktop
laptop
tablet utile
mobile consultation / actions terrain
```

Horizon reste desktop-first.

## Mobile

Priorités :

- consultation ;
- planning ;
- tâches ;
- SAV ;
- validations simples ;
- contacts.

Ne pas chercher à reproduire exactement l’éditeur de devis desktop sur mobile.

---

# 34. Accessibilité

Minimum :

- contrastes suffisants ;
- focus visible ;
- labels ;
- navigation clavier ;
- états non transmis uniquement par couleur ;
- zones cliquables suffisantes ;
- tooltip si une icône seule n’est pas évidente.

---

# 35. Composants Horizon

Base :

```text
Tailwind CSS
shadcn/ui
Lucide
```

Composants communs :

```text
HButton
HInput
HSelect
HCombobox
HDatePicker
HDialog
HDrawer
HBadge
HStatus
HDataTable
HPageHeader
HToolbar
HDocumentEditor
HMailComposer
HChatComposer
HActivityTimeline
HActivityPanel
HBreadcrumb
HAvatar
HCompanyLogo
HImportWizard
HPlanningGrid
HProjectTimeline
HAcceptancePanel
HInstalledAssetCard
HServiceTicketPanel
HEmptyState
HLoadingState
HErrorState
```

Tous doivent utiliser les mêmes tokens de design.

---

# 36. Tokens CSS de base

Exemple de socle :

```css
:root {
  --hz-navy: #091C3A;
  --hz-magenta: #E90072;
  --hz-pink: #FF5AAE;
  --hz-violet: #7B3FC7;
  --hz-violet-light: #A56BEA;

  --hz-bg: #F5F8FD;
  --hz-surface: #FFFFFF;
  --hz-text: #091C3A;
  --hz-text-muted: #7B8794;

  --hz-gradient:
    linear-gradient(135deg, #F52F96 0%, #7B3FC7 100%);

  --hz-radius-sm: 5px;
  --hz-radius-md: 8px;

  --hz-control-h-compact: 32px;
  --hz-control-h: 36px;
  --hz-table-row-h: 36px;
}
```

Les nuances de bordure, hover et backgrounds teintés peuvent être dérivées de cette palette.

Ne pas introduire de nouvelles couleurs de marque sans décision explicite.

---

# 37. Règles de cohérence

## À faire

```text
dense
aligné
prévisible
peu de couleurs mais présentes
actions nettes
données visibles
tables larges
inputs discrets
```

## À éviter

```text
gros champs
combobox surmarquées
trop de cards
trop de badges
gradient partout
icônes toutes colorées
ombre sur chaque bloc
espaces verticaux excessifs
sidebar trop large
tableaux pauvres en information
```

---

# 38. Baseline de développement

La direction suivante est considérée comme **validée pour le démarrage** :

```text
Sidebar bleu nuit
Logo Horizon officiel
Fond clair / gris léger
Surfaces blanches
Typographie Montserrat + Inter
Accent magenta / violet contrôlé
Dégradé signature ponctuel
Tables denses
Combobox discrètes
Cards sobres
Statuts légèrement colorés
Devis pleine largeur
Totaux sous le tableau
Informations secondaires en bas
Dashboard un peu plus expressif
CRM clair et dense
```

Toute modification majeure de cette direction doit être traitée comme une évolution du Design System, pas comme une décision locale prise dans un composant.

## Implémentation du layout — 4 octobre 2026

Le lot F06 livre la sidebar 216 px / 64 px, la topbar 52 px, le fil d'Ariane et un dashboard structuré. Les espaces disposent d'une navigation réelle et d'une page temporaire « À venir » jusqu'à leur réalisation. Les indicateurs indisponibles utilisent un tiret ; aucun montant ou événement fictif n'est présenté.

Composants partagés disponibles dans `src/shared/ui/` :

| Composant | Usage actuel |
|---|---|
| `HButton` | Variantes primaire / secondaire / ghost, tailles standard / compacte / icône et composition lien via Slot |
| `HInput` | Contrôle discret 34 px, focus léger et label accessible fourni par l'appelant |
| `HBadge` | Libellés compacts, tons neutre / information / succès / vigilance |
| `HBreadcrumb` | Ancêtres cliquables, page courante et niveaux intermédiaires accessibles au-delà de quatre niveaux |
| `HPageHeader` | Titre Montserrat, description et actions |
| `HEmptyState` | Message explicite, icône neutre et action optionnelle |
| `HDialog` | Dialogue Radix, titre / description, fermeture, focus et clavier |

La recherche des espaces se lance par bouton ou ⌘ K / Ctrl K. Elle filtre les libellés et descriptions, sans distinction de casse ou accents. Elle ne recherche aucun enregistrement métier. Un dialogue d'aide explique les raccourcis. Aucun avatar ou menu de compte utilisateur fictif n'est affiché avant la réalisation de l'authentification.

`HorizonMark` affiche une fenêtre SVG sur les pixels de la variante sombre officielle dans `horizon-brand-charter.png`. Le fichier bitmap n'est pas modifié et le pictogramme n'est ni redessiné ni recoloré. Le mot HORIZON blanc accompagne le pictogramme dans la sidebar. Limite d'asset : cette méthode charge la charte complète (~1,9 Mo) ; un pictogramme officiel autonome pourra remplacer la source lorsqu'il sera disponible.

Le layout se réorganise sur écrans étroits : navigation en icônes, indicateurs sur deux colonnes et panneaux sur une colonne. Le rendu a été inspecté à 1440 × 1000 et 390 × 844 ; aucun débordement horizontal n'a été constaté. Les textes, états vides et valeurs absentes sont les états réels du frontend sans données raccordées.


## Connexion native — premier écran disponible

`/login` reprend le pictogramme officiel, un bandeau navy et un formulaire compact email / mot de passe. Erreurs liées aux champs, erreur de connexion annoncée par `role="alert"`, état en cours et bouton désactivé pendant l'envoi. Aucun formulaire d'inscription publique ni faux lien de récupération e-mail. Après connexion, retour à la route interne demandée, nom réel en topbar et bouton « Se déconnecter ». Captures desktop / mobile inspectées lors des tests locaux.


## Réalisation Contacts V1

HDataTable partagé : lignes 36 px, en-tête gris clair, tri serveur, bord fin, fond blanc, aucune zebra, scroll horizontal contenu au tableau. Contacts utilise Sociétés / Personnes, barre recherche / état / actualisation, pagination sous tableau, fiche à trois colonnes desktop et une colonne mobile. Les rôles et adresses restent sous les informations générales. Archive / réactivation nécessite une confirmation. Le layout fournit HBreadcrumb sur les sous-routes Contacts ; logo société / avatar personne utilisent des fichiers distincts et protégés.

## Évolution des fiches Contacts — 5 octobre 2026 (livraison locale)

En-tête compact avec avatar de 48 px et cadre logo carré de 128 × 128 px visible dès la création, aperçu de l’image sélectionnée avant sauvegarde, remplacement et retrait explicites ; respecter les proportions avec `object-fit: contain` pour le logo. Nom et statut dans l’en-tête, actions Enregistrer / Archiver dans la barre supérieure. Relation commerciale à côté de l’identité sur desktop, puis bandeau métier ; ces deux zones précèdent les champs. Le logo reste secondaire, sans grande zone descriptive. La société utilise deux colonnes : identité / coordonnées / informations légales à gauche, adresse du siège / langue et devise à droite. La personne utilise deux cartes côte à côte pour identité et coordonnées. Notes et enrichissement Pappers disposent de leur onglet dédié. Contacts associés et adresses complémentaires sous le formulaire. La galerie est retirée de la fiche pour conserver un seul emplacement visuel de logo.

Les personnes associées sont présentées avec avatar, nom cliquable, fonction et coordonnées ; bouton de création pré-rattachée si autorisé. Cartes blanches à bordure fine, titres avec icônes, champs regroupés par sens, code postal et ville côte à côte. Mobile : blocs empilés, sans débordement horizontal. Respecter les dimensions et styles denses des composants existants.

Combobox commune : libellé + code, recherche, navigation clavier, focus visible, sélection unique et messages chargement / vide / erreur. Les boutons métier affichent les vrais totaux autorisés ; aucun accès sans permission, aucune valeur zéro pour un module non livré. Un filtre société actif doit être visible dans la liste destination et supprimable par l’utilisateur.


### Répertoire Contacts : Cartes / Liste

Cartes par défaut pour identifier sociétés et personnes rapidement : logo / avatar carré de 64 px à gauche, bloc nom / fonction et coordonnées à droite, badges de relation commerciale en pied. Grille adaptative ; aucune donnée fictive pour remplir une carte. Liste tabulaire pour comparaison et tri : lignes de 40 px, relations colorées, statut et survol discret. Barre commune recherche / état / actualisation / nombre de résultats / tri et sélecteur Cartes / Liste avec `aria-pressed`. La préférence est portée par `?view=cards|list`, sans nouvelle préférence stockée côté serveur. Même pagination serveur dans les deux modes, une colonne de cartes sur mobile et défilement du tableau contenu à son cadre.


### Révision visuelle autorisée depuis la référence utilisateur — 5 octobre 2026

L’utilisateur demande explicitement une évolution de charte : surfaces blanc / bleu très clair (`#F5F8FD`), sidebar bleu profond (`#031C2C` à `#0B1832`), accent principal magenta `#E90072`, bordures froides, badges arrondis et icônes de section magenta. Le pictogramme Horizon et la typographie Montserrat / Inter restent en place. Le gradient de marque magenta / violet reste disponible ; la navigation sélectionnée utilise un magenta plus sombre pour améliorer sa lisibilité.

Le répertoire propose une synthèse de quatre vrais totaux actifs : contacts, sociétés, sociétés clientes et fournisseurs. Pas de pourcentage d’évolution sans historique de référence. Ces totaux concernent tout le répertoire accessible, indépendamment de la recherche ou de la page courante. Cartes identifiables, lignes compactes de 40 px, en-tête bleu clair et alternance de fond très discrète sur Contacts. Barre de recherche / état / tri / présentation commune. Les couleurs de relation sont sémantiques : client violet, fournisseur orange, prospect bleu, partenaire vert bleuté.

La fiche comporte une identité compacte, relations commerciales en haut, bandeau de coordonnées cliquables, raccourcis métier, puis de vrais onglets Informations / Relations / Notes / Enrichissement. Les personnes disposent d’Informations / Notes ; les relations commerciales et raccourcis affichés en tête concernent leur société. Les panneaux restent montés pour préserver les saisies lors de la navigation, mais seuls les contenus de l’onglet sélectionné sont visibles. Navigation clavier par flèches, Home / End ; `tablist`, `tab`, `tabpanel` et états sélectionnés explicites. Aucun onglet Activité / Documents fictif.

Les logos utilisent `object-fit: contain` dans toutes les présentations, avec centrage, fond blanc et marge intérieure : un logo horizontal ou vertical reste entier, les zones restantes sont blanches ; les portraits seuls utilisent `cover`. Cadres carrés de 128 × 128 px en fiche, 64 × 64 px en carte et 36 × 36 px en tableau ; le petit badge société sur un avatar conserve aussi le logo entier. Pas de transformation ni recadrage des fichiers enregistrés.

Champs organisés en panneaux légers, libellés de 10,5 px, contrôles de 33 px, bordures `#DCE6F4`, texte de saisie de 12 px, code postal / ville côte à côte. Sur mobile : synthèse sur deux colonnes, titres et création sur deux lignes, cartes sur une colonne, formulaires empilés et tableau contenu à son défilement horizontal. Cette révision prévaut sur les descriptions historiques V1 ci-dessus.


### Disposition des cartes retenue par l’utilisateur — 5 octobre 2026

Carte horizontale blanche aux angles arrondis : logo / avatar 64 × 64 px à gauche, nom cliquable sur plusieurs lignes à droite, puis e-mail, localisation du siège et téléphone si renseignés. Pour une personne, fonction et société associée restent visibles ; la localisation est celle du siège de sa société. Pas de séparateur horizontal entre identité et coordonnées. Badges des relations commerciales en bas du bloc texte et raccourci de consultation à droite. Grille de cartes de 350 px minimum lorsque l’espace le permet, une colonne sur mobile, texte long retourné à la ligne. Les liens image et titre ouvrent la fiche ; mail et téléphone déclenchent les actions correspondantes.

La recherche des espaces est centrée géométriquement dans la top bar, avec des zones latérales de même largeur pour la commande de navigation et le compte utilisateur. Largeur maximale 480 px, adaptation à la largeur disponible ; sur mobile, recherche sur la largeur disponible. Le libellé du compte peut être tronqué pour préserver les actions et éviter les chevauchements.


### Combobox et espace Paramètres — 5 octobre 2026

Combobox : libellé du choix sur une seule ligne avec ellipse si nécessaire ; chevron dans un emplacement fixe de 20 × 20 px, centré verticalement et retourné à l’ouverture. Menu aligné sur le champ, bordure bleu clair, coins de 9 px, ombre légère, recherche intégrée avec icône, codes dans une petite étiquette à droite et coche réservée à la sélection. Survol bleu clair, sélection violette légère ; scroll clavier de l’option active, recherche sans accents, Enter pour choisir et Escape pour fermer. Le même composant remplace les sélecteurs de filtres, tri, société et type d’adresse ; les codes techniques de ces choix ne sont pas affichés.

Le pied de page global « Horizon · CVS Engineering / Documents » est supprimé. Documents reste accessible par la navigation métier. Une marge inférieure protège le contenu sans ajouter de texte de marque sous les écrans.

Paramètres : navigation locale à gauche, groupée en Socle commun / Modules métier / Connexions, vue d’ensemble en cartes avec recherche et état Disponible / Prévu, zone de contenu à droite. Référentiels dans une page dédiée avec onglets Pays / Langues / Devises et actions d’administration selon permissions. Les domaines futurs présentent leur périmètre ; aucune fausse saisie de réglages. Mobile : navigation locale horizontale, cartes sur une colonne et tableaux avec défilement interne.


### Top bar persistante, recherche contextuelle et menu utilisateur — 5 octobre 2026

La top bar de 52 px reste ancrée en haut pendant le défilement, au-dessus du contenu. Les ancres des fiches et la navigation Paramètres tiennent compte de sa hauteur. Recherche toujours centrée ; sur mobile le compte reste accessible par son avatar à droite.

Sur `/contacts` et `/contacts/people`, un unique champ dans la top bar filtre le répertoire courant via les services Contacts existants. Plus de champ de recherche dupliqué dans la barre de filtres. Le terme `q` est conservé dans l’URL et lors du passage cartes / liste ou du rechargement ; un nouveau terme remet la pagination à la première page. Le changement d’onglet sociétés / personnes ouvre le nouveau répertoire sans reprendre le terme précédent. Bouton d’effacement et ⌘ K / Ctrl K pour focaliser le champ. Sur les autres pages, la recherche des espaces conserve son dialogue et son raccourci clavier.

Le clic sur le compte ouvre un menu accessible au clavier : Mon compte, Paramètres, puis Se déconnecter. Nom et rôle visibles sur grand écran, avatar compact sur les petits écrans. `/account` présente le nom, l’e-mail et le rôle de la session en lecture seule ; les changements de profil ou d’accès restent du ressort de l’administrateur.

Le contexte reste visible dans une petite étiquette à l’intérieur de la recherche, même après saisie : « Sociétés », « Personnes » ou « Espaces Horizon ». Le lecteur d’écran annonce également le contexte du champ Contacts.

Champs composés (top bar et dialogue de recherche) : un seul cadre extérieur porte le focus ; le champ interne reste sans bordure ni contour, avec une marge de saisie de 6 px. Les champs simples et combobox utilisent une bordure bleue et un halo léger au focus, sans second contour magenta.

Le contexte est sélectionné automatiquement à chaque changement de page : Sociétés, Personnes, ou Paramètres (vue d’ensemble). Son étiquette ouvre un menu pour passer en recherche globale des espaces Horizon ou revenir au contexte local. Le filtre local reste conservé lorsque le mode global est activé. La vue d’ensemble Paramètres utilise désormais cette recherche commune et retire son champ local dupliqué. Les pages sans recherche métier disponible conservent la recherche des espaces.

Répertoire Contacts : toute la surface d’une carte et d’une ligne ouvre la fiche. Les liens e-mail, téléphone et société associée restent prioritaires et gardent leur destination. Liens natifs pour conserver navigation clavier et ouverture dans un nouvel onglet ; focus visible sur la surface concernée. Le tableau partagé accepte une destination de ligne optionnelle.

Révision de densité : flèche de consultation retirée des cartes entièrement cliquables ; panneaux des fiches à 12 × 14 px, espaces entre panneaux de 10 px, champs espacés de 9 px, contrôles conservés à 33 px. À partir de 1200 px, coordonnées des sociétés sur trois colonnes et identifiants légaux sur quatre colonnes. Cette première présentation par interrupteurs a été refusée par l’utilisateur ; elle est remplacée par la révision ci-dessous.

### Harmonisation des fiches et relations validées — 5 octobre 2026

En-tête blanc unifié avec logo / avatar, identité et relation commerciale. Deux cases à cocher indépendantes Client / Fournisseur dans un bloc commun discret, sans interrupteurs ni pastilles violettes ; cumul admis. Identité et coordonnées réunies dans un panneau avec séparation légère, informations légales sans étirement artificiel. Adresse et préférences dans la seconde colonne. Pays et région côte à côte sur grand écran ; empilement lisible sur mobile. Les formats des logos 128 / 64 / 36 px restent ceux demandés.

Le même bloc de choix Client / Fournisseur est affiché dès Nouvelle société et dans les fiches enregistrées. À la création, cocher prépare les relations de la sauvegarde ; sur une fiche existante, le changement est également préparé pour Enregistrer (règle finale clarifiée ci-dessous).

### Fiche intégrée — révision après retour utilisateur du 5 octobre 2026

L’utilisateur souhaite une composition mieux intégrée et moderne. Une seule surface blanche contient en-tête, onglets et formulaire, largeur limitée à 1180 px. Le logo conserve son cadre 128 px ; Client / Fournisseur sont placés sous le nom avec cases compactes, sans bloc segmenté distant. Sections sans cartes imbriquées, séparateurs fins, icônes neutres, champs légèrement teintés et alignés. Identité / coordonnées / informations légales à gauche, adresse / préférences à droite ; séparation verticale légère sur desktop, empilement sur mobile. Coordonnées sur trois colonnes et informations légales sur quatre lorsque la largeur le permet. Sur mobile, le nom et les relations restent près du logo, et les champs s’empilent sans débordement. Création et fiches enregistrées partagent cette composition, sans changement des sauvegardes ou permissions.

### Gabarits inspirés de la référence utilisateur — 5 octobre 2026

La composition en surface blanche unique a été refusée. La référence fournie distingue un formulaire de création en blocs compacts et une fiche enregistrée avec résumé et onglets. Cette révision prévaut sur la précédente.

Création société / contact : titre et actions Annuler / Enregistrer en haut, blocs blancs sur le fond bleu très clair, icônes de section magenta et contrôles de 34 px. Identité avec logo / photo intégré à droite et choix Client / Fournisseur dès création ; coordonnées dans un bloc séparé. Pour une société : adresse sur deux lignes sur grand écran, informations légales et préférences côte à côte, notes accessibles directement sans onglet. Largeur maximale de 1080 px. Ordre DOM et ordre visuel concordants pour la navigation clavier. Le logo société reste entier sur fond blanc dans son cadre de 128 px, y compris à la création.

Fiche enregistrée : identité compacte, relations près du nom, bandeau de coordonnées, raccourcis métier puis onglets ; panneaux de saisie blancs organisés en deux colonnes sur desktop. Sur mobile, blocs et champs s’empilent, les relations se replient pour éviter tout débordement et les actions restent accessibles. Aucun faux compteur, champ ou bouton fonctionnel ajouté depuis la maquette ; les données, permissions et sauvegardes existantes restent utilisées.

Association société d’un contact : Fonction et Société sont alignées sur une même ligne sur desktop. La recherche de sociétés est intégrée au menu de sélection et interroge le service Contacts ; aucun champ de recherche externe redondant. Le nom choisi reste affiché après fermeture du menu et retour à la liste initiale.

### Même gabarit en création et consultation — clarification du 5 octobre 2026

La référence fournie indiquait le style attendu et ne prescrivait pas deux compositions distinctes. Cette clarification remplace la distinction de gabarits décrite précédemment. Création et fiche enregistrée utilisent désormais les mêmes blocs et placements : titre / actions, Identité avec logo à droite et Client / Fournisseur sous les champs, Coordonnées, Adresse du siège, Informations légales / Préférences côte à côte sur desktop, Notes internes ouvertes. Largeur commune maximale 1080 px et mêmes règles responsive. Les fiches personnes reprennent également ce gabarit commun.

Sur une fiche enregistrée s’ajoutent le statut, l’archivage, les raccourcis métier et les onglets Relations / Notes / Enrichissement. Les actions e-mail, téléphone, site et ouverture de la société associée se trouvent dans l’en-tête des coordonnées, sans répéter les valeurs dans un second bandeau. Les relations sont préparées pour la sauvegarde explicite, en création comme sur une fiche existante. Aucun changement de données, permissions ou migration.

### État des boutons de sauvegarde et logo société associé — 5 octobre 2026

Règle transversale Horizon : Enregistrer est neutre et désactivé en l’absence de changements à sauvegarder, et prend la couleur primaire lorsqu’une sauvegarde est nécessaire. Pendant la sauvegarde, le bouton est désactivé et neutre. Le composant partagé `HSaveButton` porte cette convention et doit être réutilisé dans les futurs formulaires. Elle est appliquée aux fiches société / personne, aux adresses supplémentaires et aux référentiels. Une création vide est neutre ; les saisies, choix préparés ou images à enregistrer activent le bouton.

Le retour aux valeurs initiales désactive de nouveau Enregistrer. Les changements Client / Fournisseur rendent le formulaire modifié ; revenir aux choix enregistrés remet le bouton au repos. Une sauvegarde partielle reste à reprendre et conserve un bouton actif. Le logo de société superposé à la photo d’un contact mesure désormais 26 px dans les cartes (photo 64 px), 16 px dans les listes et 20 px dans les petites identités de détail ; fond blanc, bordure blanche et image entière.

### États de chargement discrets — 5 octobre 2026

Les opérations automatiques Contacts ne rajoutent plus de paragraphes visibles « Chargement des contacts… » / « Enregistrement du rôle… ». La relation commerciale n’a plus de sauvegarde automatique ni d’indicateur propre ; elle suit la sauvegarde de la fiche. Les contacts associés affichent des emplacements de chargement dans la grille. Les états restent annoncés par les attributs ARIA ; les erreurs et la possibilité de réessayer restent visibles.

### Sauvegarde explicite commune à Horizon — clarification du 5 octobre 2026

Changer un champ, une case ou une sélection prépare le formulaire et ne modifie pas la base. Seul Enregistrer sauvegarde les changements de la fiche. Cette règle prévaut sur les anciennes descriptions de sauvegarde automatique : Client / Fournisseur sont désormais préparés localement en création comme en édition, inclus dans le bouton principal et conservés après sauvegarde. Revenir aux valeurs enregistrées désactive le bouton ; recharger sans sauvegarder abandonne les changements. La fiche personne montre les relations de sa société en lecture seule ; elles se modifient dans la fiche société.

Pappers : Reporter dans la fiche remplit les champs et l’adresse du formulaire puis revient aux Informations. L’utilisateur peut encore les modifier ; seul Enregistrer les persiste. Les référentiels et formulaires d’adresse possèdent déjà une sauvegarde explicite. Archivage / réactivation restent des actions métier explicites confirmées.

Dans une fiche contact, la sélection Société reste éditable et son changement active Enregistrer. La mention de lecture seule des relations désigne exclusivement Client / Fournisseur, qui qualifient la société. Le rattachement d’un contact peut être changé ou supprimé depuis sa propre fiche avec sauvegarde explicite.

### Confirmation d’archivage — 5 octobre 2026

Règle commune Horizon : Archiver ouvre une fenêtre modale nommant la pièce / fiche concernée. L’utilisateur doit saisir exactement ARCHIVER (majuscules, sans espace supplémentaire) pour activer la validation. Le composant partagé `HArchiveButton` remplace la confirmation native des sociétés et contacts et doit être réutilisé pour les prochains objets archivables. Champ focalisé à l’ouverture, clavier contenu dans la fenêtre, Annuler / Échap disponibles et retour du focus au déclencheur. Chaque ouverture remet la saisie à vide.

Pendant la requête, les actions sont désactivées et la fenêtre reste ouverte ; en cas de refus, l’erreur est affichée et une nouvelle tentative reste possible. Les données et relations sont conservées selon l’archivage existant. La réactivation garde sa confirmation explicite habituelle.

Finition visuelle retenue après retour utilisateur : fenêtre centrée et blanche, bordures neutres et icône d’archive magenta Horizon sur un petit fond gris. La couleur est limitée à cette icône et au bouton magenta de confirmation. Titre et mot ARCHIVER restent bleu foncé, champ blanc avec focus bleu discret, pied blanc et séparateur léger. Overlay standard sans flou. L’en-tête rosé, le liseré, les accents roses multiples et les ombres colorées ont été refusés comme excessifs. Le mécanisme de validation et les permissions restent inchangés.


Recherche société — règle finale : bouton « Recherche informations » discret dans la barre d’actions en haut de la fiche, disponible en création et sur une fiche existante. L’onglet Enrichissement est retiré. Fenêtre blanche compacte, sélection des informations puis « Remplir le formulaire » ; seul Enregistrer sauvegarde. Requête directement depuis le navigateur, aucune étape de configuration serveur.


Actions complémentaires — règle finale du 5 octobre 2026 : utiliser HRecordActions (menu engrenage à droite d’Enregistrer) pour Dupliquer, Archiver / Réactiver et Supprimer. L’archivage ne figure plus comme bouton isolé en haut des fiches Contacts. Menu blanc discret ; Archiver orange, Supprimer rouge. La fenêtre partagée HRecordConfirmation reste blanche, avec seulement une icône sur fond légèrement teinté et le bouton de confirmation coloré : orange pour ARCHIVER, rouge pour SUPPRIMER. Cette décision remplace la confirmation d’archivage magenta décrite plus haut. Validation exacte, focus initial dans le champ, Annuler / Échap et retour au bouton engrenage ; pendant la requête, annulation et seconde validation sont bloquées. Une erreur conserve le dialogue pour correction ou nouvelle tentative. HArchiveButton réutilise cette confirmation pour les futurs déclencheurs hors menu.


Profil comptable société : tabs Informations / Relations / Comptabilité / Notes, avec Relations disponible après création. En création : Informations / Comptabilité / Notes. Le logo et les Informations ne sont pas répétés dans Comptabilité. Deux blocs blancs compacts, comptes tiers puis facturation électronique, champs en deux colonnes et une colonne sur mobile. Le bouton Enregistrer commun garde son état basé sur les modifications et fonctionne depuis tous les onglets. Le changement d’onglet conserve le brouillon.

Français et Euro sont sélectionnés par défaut à la création, et restent modifiables. Numéro RCS dans le bloc légal à la place de l’identifiant fiscal. Recherche informations : la TVA disponible fait partie des cases de reprise ; si plusieurs numéros sont fournis, une combobox demande lequel reprendre. Les identifiants légaux, comptes et adresses de facturation électronique sont remis à vide lors d’une duplication pour éviter de recopier l’identité comptable du tiers.


Informations légales société : LEI remplace désormais le champ visible Numéro RCS, dans la même grille compacte. Le champ est facultatif avec indication « 20 caractères alphanumériques ». La saisie est normalisée en majuscules lors de la sauvegarde explicite. Aucun remplissage à partir du SIREN, du RCS ou de la TVA.


Cloche : bouton navy compact, avant le profil, compteur rouge réservé aux non lus. Panneau blanc avec bord fin et accent magenta discret sur les notifications non lues, aucun gradient décoratif. Compteur masqué à zéro, état « Vous êtes à jour » si aucun message. Présentation compatible desktop/mobile, lecture explicite par coche.

Logo société : petite loupe sous le cadre, à côté du libellé « Charger », accès clavier ; clic sur le logo et libellé pour importer un fichier. La loupe ne se superpose plus à l’image. Popup blanc à largeur maximale 720 px, marges intérieures 20 px, mots-clés et format sur la première ligne, vignettes entières sur blanc, contour magenta sur l’image sélectionnée, aperçu et source sous la grille, validation en pied. Les dimensions société 128 / 64 / 36 px et object-fit contain restent celles convenues. Sur mobile, recherche et actions se répartissent sans déborder.


### Fil d’activité — design livré

Fil ouvert sous la fiche, directement sur le fond de page : aucun cadre extérieur, fond blanc ou coins de carte. Largeur alignée à la fiche, séparation de 36 px et trait supérieur discret, avec un retrait latéral supplémentaire de 20 px sur ordinateur. En-tête compact « Fil d’activité », icône History sur fond violet très léger, sous-titre et actualisation discrète. Seul le rédacteur conserve sa surface blanche délimitée : avatar, zone texte sans double encadrement, actions Joindre / Mentionner / Tâche dans une barre basse claire et bouton Publier magenta uniquement lorsqu’un contenu existe. Une publication reste distincte du bouton Enregistrer de la fiche.

Chronologie sans empilement de cartes : chaque événement commence par sa date et son heure centrées entre deux traits horizontaux fins. Le contenu vient dessous, avec un avatar de 30 px à initiales à côté du nom, y compris pour les modifications faites par un utilisateur ; les événements système gardent une icône neutre. Aucun trait vertical ni date repoussée à droite. Texte aéré. Modifications repliables, diff en colonnes avec flèche ancien→nouveau, libellés français. Les fichiers ont un encart compact cliquable ; mentions en petites étiquettes violettes. Tâche intégrée avec responsable, échéance et état, priorité orange uniquement si haute ; tâche terminée avec coche verte. Filtres soulignés, pas de toggles colorés partout. L’état vide guide sans données fictives et le chargement initial utilise un squelette discret.

Sur mobile : marges du layout de 12 px, retrait supplémentaire de 6 px dans le fil, séparation de 24 px, filtres défilables dans leur zone, date et heure centrées au-dessus de chaque événement, champs de tâche empilés, diff sur deux colonnes avec libellé au-dessus, aucune extension de la largeur de page. Le fil reste présent sur Informations / Relations / Comptabilité / Notes. Les notifications métier disposent d’un lien « Voir la fiche » vers #activity, avec défilement après montage.
