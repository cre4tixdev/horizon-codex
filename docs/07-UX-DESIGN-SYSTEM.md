# Horizon — UX & Design System

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
  --hz-magenta: #F52F96;
  --hz-pink: #FF5AAE;
  --hz-violet: #7B3FC7;
  --hz-violet-light: #A56BEA;

  --hz-bg: #F4F5F7;
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
