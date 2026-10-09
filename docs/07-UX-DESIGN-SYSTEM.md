# Horizon — UX & Design System

Informations légales société : section toujours visible dans Informations, sans chevron ni action de repli. Les champs SIREN, SIRET, TVA et LEI restent dans la grille compacte existante.

Finition du 5 octobre 2026 — largeur des fiches : les sociétés et contacts utilisent toute la largeur disponible du contenu, au lieu d’un bloc centré plafonné à 1080 px. La barre d’actions, les onglets, les sections et le fil d’activité restent alignés. Seules les marges du layout sont conservées : 25 px par côté sur desktop et 12 px sur mobile. Les grilles adaptatives et les dimensions des logos restent inchangées.

## Base validée sur Contacts pour tous les modules

**Décision utilisateur du 6 octobre 2026 : les écrans Contacts sont la référence de réalisation du design Horizon.** Les prochains modules doivent reprendre ces composants, dimensions et comportements. Les variantes métier portent sur les champs, critères, actions et permissions, sans réinventer la présentation.

Ce contrat consolidé et les dernières décisions datées ci-dessous priment sur les anciennes propositions et maquettes présentes dans ce document. Une capture utilisateur fournit une direction visuelle ; les valeurs validées ci-dessous sont le contrat à appliquer. Toute évolution commune doit modifier le composant partagé et cette charte, puis vérifier les écrans déjà raccordés.

| Élément | Règle validée à réutiliser |
|---|---|
| Layout | Top bar fixe, recherche centrée, sidebar du module active sur toutes ses sous-pages. Contenu sur la largeur disponible : marges 25 px sur PC, 12 px sur mobile. Aucun footer décoratif sous les pages. |
| Navigation des fiches | Barre persistante sous la top bar pendant le défilement. Fil d’Ariane Accueil › module › nom courant en gras ; lien module restituant le contexte de liste. Raccourcis métier compacts au centre, compteur et chevrons à droite. Pagination de liste au même endroit, libellée « Page 1 / 3 ». |
| Recherche et filtres | Une recherche contextuelle dans la top bar, contexte visible et mode Tout Horizon disponible. Filtres / Regrouper par / Trier par et vues personnelles ou partagées dans le panneau commun ; critères actifs retirables, archives discrètes. URL et contexte de navigation conservés. La bascule automatique Sociétés / Personnes est propre au répertoire Contacts, pas une règle à imposer à tous les modules. |
| Typographie | Inter Latin 400 / 500 / 600 / 700 embarquées, Montserrat 600 pour les titres de page. En-têtes de section via HSectionHeading : titre 13 px, ligne 18 px, graisse 600 ; description / compteur 11 px, ligne 16 px, graisse 400. Pas de taille ou police locale différente pour un même niveau. |
| Sections de fiche | Écart onglets → contenu 8 px ; padding vertical 12 px, horizontal 18 px (14 px mobile). Titres alignés en haut, y compris avec un logo ou des actions. Mêmes valeurs pour tous les onglets. Variables centralisées, aucun ajustement isolé par section. |
| Cartes | Grille dense commune, colonnes de 280 px minimum, gap 12 px, hauteur fixe 112 px, padding 10 px, rayon 12 px. Même densité pour listes principales, contacts associés et adresses. Surface cliquable lorsqu’elle ouvre une fiche ; l’e-mail affiché ouvre également la fiche ; téléphone et actions secondaires restent indépendants. Aucun bouton flèche redondant. |
| Logos et images | Cadre carré : 36 × 36 en liste, 64 × 64 en carte, 128 × 128 dans la fiche société. Logo entier avec object-fit: contain sur fond blanc, sans recadrage. Une image de logo par société ; recherche d’images partagée, action sous le visuel. |
| Couleurs sémantiques | Client violet, Fournisseur ambre/orange, Société bleu, Personne rose. Tags, filtres actifs, icônes et tuiles de même sens utilisent les mêmes tokens. Accent magenta Horizon pour actions / sélections ; pas de nouvelle palette par module. Clair et sombre cohérents. |
| Formulaires | Champs groupés par sens, compacts et alignés. Libellés et valeurs noirs en clair, tokens lisibles en sombre ; placeholders secondaires. Combobox intégrées au design, chevron centré. Cases 14 px, texte à la taille des libellés, espacement et alignement explicites. Aucun champ ou visuel dupliqué dans plusieurs zones sans besoin validé. |
| Sauvegarde et actions | HSaveButton coloré uniquement lorsqu’une sauvegarde est nécessaire ; édition de la fiche en brouillon jusqu’à Enregistrer. Enregistrer compact avec pictogramme, puis menu engrenage dans la barre sticky du fil d’Ariane, avant la navigation entre fiches, pour Dupliquer / Archiver / Supprimer. Confirmation par saisie ARCHIVER, accent orange ; suppression par saisie SUPPRIMER, accent rouge, avec contrôles des liens métier côté serveur. Aucun toast technique pour chaque champ modifié. |
| Paramètres | Tableaux dans `settings-reference-table` avec `reference-table`, mêmes en-têtes, contour, densité et cellules d’action. Enregistrer dans les actions de HSectionHeading en haut à droite du contenu configuré ; ajout à côté si nécessaire. Pas de sauvegarde sous le tableau. Popups via HDialog / dialog-form / HDialogFooter, comparaison visuelle des onglets avant livraison. |
| Fil d’activité | Sous la fiche, sans box extérieure ; fond légèrement plus foncé à partir de la séparation fine et de son accent discret, densité compacte. Dates / heures centrées entre deux traits, avatar et auteur, action unique ; changements visibles, un champ par ligne. Commentaires en bulles ; mentions visibles avec action explicite et pièces jointes gérées dans le fil. Pas de résumé ou destinataire dupliqué. |

Composants à réutiliser : [HSectionHeading](../src/shared/ui/HSectionHeading.tsx), [HPageHeader](../src/shared/ui/HPageHeader.tsx), [HBreadcrumbActions](../src/shared/ui/HBreadcrumbActions.tsx), [HRecordLinks](../src/shared/ui/HRecordLinks.tsx), [HSaveButton](../src/shared/ui/HSaveButton.tsx), [HRecordActions](../src/shared/ui/HRecordActions.tsx), [HRecordConfirmation](../src/shared/ui/HRecordConfirmation.tsx), [HCombobox](../src/shared/ui/HCombobox.tsx), [SearchFilters](../src/shared/search/SearchFilters.tsx), [SavedViews](../src/shared/search/SavedViews.tsx), [ImageSearch](../src/shared/images/ImageSearch.tsx), [ActivityPanel](../src/shared/activity/ActivityPanel.tsx).

Les cartes Contacts restent une implémentation du module : reprendre leur contrat de taille et leur structure dans les futurs modules, sans importer leurs données métier. Les permissions, compteurs, destinations et critères appartiennent au module concerné. Ne présenter comme actifs que les éléments effectivement raccordés ; les raccourcis intermodules encore indisponibles conservent leur état explicite.

Avant de livrer un écran comparable : vérifier les mêmes dimensions, titres et espacements, la cohérence clair / sombre, l’absence de débordement mobile et la conservation des brouillons / critères. Les tests comparatifs existants des cinq onglets Contacts servent de référence de régression.

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

L’état actif peut utiliser le dégradé signature, mais sur **un seul niveau actif principal**. Le module reste sélectionné sur toutes ses sous-pages, onglets et fiches (ex. Contacts sur Sociétés, Personnes et leurs fiches). Dashboard est actif uniquement à la racine `/`.

Éviter plusieurs blocs magenta simultanés dans la navigation.

Sous-pages — 8 octobre 2026 : un chevron distinct du lien de module déplie / replie ses entrées via `SidebarItem`, déclaré dans la navigation commune. CRM expose Pipeline (`/crm`, opportunités directes et AO) et Appels d’offres (`/crm?area=ao`). Le module conserve l’accent principal ; la sous-page utilise une sélection neutre discrète. Bouton avec aria-expanded / aria-controls, navigation clavier native et sous-pages accessibles en mode pictogrammes / mobile. Le module et ses sous-pages sont masqués ensemble sans permission de lecture CRM. Les liens n’imposent pas `view` : URL explicite prioritaire ; sinon réglage global CRM Kanban / Liste, ou préférence locale par utilisateur avec « Dernier état » (Kanban sans historique). La bascule Kanban / Liste mémorise le choix ; Calendrier AO ne le remplace pas.

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

La devise doit être visible sans être envahissante. Les montants utilisent le symbole de devise et deux décimales systématiques, au format français : `12 000,00 €`, `12,30 $`. `shared/formatters/money` centralise le format des cartes, listes, totaux et résumés ; `HAmountInput` affiche le symbole dans les champs et deux décimales hors saisie. Les valeurs métier ne sont pas arrondies ni réécrites par cette présentation.

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

`/login` reprend le pictogramme officiel sur un fond panoramique navy : dégradés discrets, relief SVG décoratif et ligne d’horizon magenta / violet, sans animation ni asset distant. Sur ordinateur, accroche à gauche et formulaire compact email / mot de passe à droite ; sous 700 px, seul le logo et le formulaire centré restent visibles. La surface du formulaire suit le thème clair / sombre ; les contrôles restent ceux du Design System. Ce traitement expressif est propre à l’écran de connexion, pas aux listes métier. Erreurs liées aux champs, erreur de connexion annoncée par `role="alert"`, état en cours et bouton désactivé pendant l'envoi. Aucun formulaire d'inscription publique ni faux lien de récupération e-mail. Après connexion, retour à la route interne demandée, nom réel en topbar et bouton « Se déconnecter ». Captures desktop / mobile inspectées lors des tests locaux.


## Réalisation Contacts V1

HDataTable partagé : lignes 36 px, en-tête gris clair, tri serveur, bord fin, fond blanc, aucune zebra, scroll horizontal contenu au tableau. Contacts utilise Sociétés / Personnes, barre recherche / état, pagination sous tableau, fiche à trois colonnes desktop et une colonne mobile. Les rôles et adresses restent sous les informations générales. Archive / réactivation nécessite une confirmation. Le layout fournit HBreadcrumb sur les sous-routes Contacts ; logo société / avatar personne utilisent des fichiers distincts et protégés.

## Évolution des fiches Contacts — 5 octobre 2026 (livraison locale)

En-tête compact avec avatar de 48 px et cadre logo carré de 128 × 128 px visible dès la création, aperçu de l’image sélectionnée avant sauvegarde, remplacement et retrait explicites ; respecter les proportions avec `object-fit: contain` pour le logo. Nom et statut dans l’en-tête, actions Enregistrer / Archiver dans la barre supérieure. Relation commerciale à côté de l’identité sur desktop, puis bandeau métier ; ces deux zones précèdent les champs. Le logo reste secondaire, sans grande zone descriptive. La société utilise deux colonnes : identité / coordonnées / informations légales à gauche, adresse du siège / langue et devise à droite. La personne utilise deux cartes côte à côte pour identité et coordonnées. Notes et enrichissement Pappers disposent de leur onglet dédié. Contacts associés et adresses complémentaires sous le formulaire. La galerie est retirée de la fiche pour conserver un seul emplacement visuel de logo.

Les personnes associées sont présentées avec avatar, nom cliquable, fonction et coordonnées ; bouton de création pré-rattachée si autorisé. Cartes blanches à bordure fine, titres avec icônes, champs regroupés par sens, code postal et ville côte à côte. Mobile : blocs empilés, sans débordement horizontal. Respecter les dimensions et styles denses des composants existants.

Combobox commune : libellé + code, recherche, navigation clavier, focus visible, sélection unique et messages chargement / vide / erreur. Les boutons métier affichent les vrais totaux autorisés ; aucun accès sans permission, aucune valeur zéro pour un module non livré. Un filtre société actif doit être visible dans la liste destination et supprimable par l’utilisateur.


### Répertoire Contacts : Cartes / Liste

Cartes par défaut pour identifier sociétés et personnes rapidement : logo / avatar carré de 64 px à gauche, bloc nom / fonction et coordonnées à droite, badges de relation commerciale en pied. Grille adaptative ; aucune donnée fictive pour remplir une carte. Liste tabulaire pour comparaison et tri : lignes de 40 px, relations colorées, statut et survol discret. Barre commune recherche / état / nombre de résultats / tri et sélecteur Cartes / Liste avec `aria-pressed`. La préférence est portée par `?view=cards|list`, sans nouvelle préférence stockée côté serveur. Même pagination serveur dans les deux modes, une colonne de cartes sur mobile et défilement du tableau contenu à son cadre.


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

Le contexte reste visible dans une petite étiquette à l’intérieur de la recherche, même après saisie : « Contacts » par défaut dans le répertoire, « Sociétés » / « Personnes » si le périmètre est choisi, ou « Tout Horizon ». Le lecteur d’écran annonce également le contexte du champ Contacts.

Champs composés (top bar et dialogue de recherche) : un seul cadre extérieur porte le focus ; le champ interne reste sans bordure ni contour, avec une marge de saisie de 6 px. Les champs simples et combobox utilisent une bordure bleue et un halo léger au focus, sans second contour magenta.

Le contexte est sélectionné automatiquement à chaque changement de page : Contacts pour les répertoires sociétés / personnes, ou Paramètres (vue d’ensemble). Son étiquette ouvre un menu pour passer en recherche globale des espaces Horizon ou revenir au contexte local. Le filtre local reste conservé lorsque le mode global est activé. La vue d’ensemble Paramètres utilise désormais cette recherche commune et retire son champ local dupliqué. Les pages sans recherche métier disponible conservent la recherche des espaces.

Répertoire Contacts : toute la surface d’une carte et d’une ligne ouvre la fiche. Sur les cartes, l’e-mail ouvre la fiche comme le nom ; téléphone et société associée gardent leur destination. Les liens de coordonnées des tableaux gardent leur destination. Liens natifs pour conserver navigation clavier et ouverture dans un nouvel onglet ; focus visible sur la surface concernée. Le tableau partagé accepte une destination de ligne optionnelle.

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

Fiches et popups — 8 octobre 2026 : aucun texte de chargement visible à l’ouverture. Le composant partagé `HLoadingIndicator` réserve une zone sobre et ne montre son anneau qu’après 200 ms ; un chargement rapide n’affiche aucun indicateur. Même traitement pour le chargement du code, des données Contacts et le démarrage des routes. Nom accessible via `role="status"` / `aria-label`, animation arrêtée en mouvement réduit. Les erreurs et actions Réessayer restent visibles.

Les opérations automatiques Contacts ne rajoutent plus de paragraphes visibles « Chargement des contacts… » / « Enregistrement du rôle… ». La relation commerciale n’a plus de sauvegarde automatique ni d’indicateur propre ; elle suit la sauvegarde de la fiche. Les contacts associés affichent des emplacements de chargement dans la grille. Les états restent annoncés par les attributs ARIA ; les erreurs et la possibilité de réessayer restent visibles.

### Sauvegarde explicite commune à Horizon — clarification du 5 octobre 2026

Changer un champ, une case ou une sélection prépare le formulaire et ne modifie pas la base. Seul Enregistrer sauvegarde les changements de la fiche. Cette règle prévaut sur les anciennes descriptions de sauvegarde automatique : Client / Fournisseur sont désormais préparés localement en création comme en édition, inclus dans le bouton principal et conservés après sauvegarde. Revenir aux valeurs enregistrées désactive le bouton ; recharger sans sauvegarder abandonne les changements. La fiche personne montre les relations de sa société en lecture seule ; elles se modifient dans la fiche société.

Pappers : Reporter dans la fiche remplit les champs et l’adresse du formulaire puis revient aux Informations. L’utilisateur peut encore les modifier ; seul Enregistrer les persiste. Les référentiels et formulaires d’adresse possèdent déjà une sauvegarde explicite. Archivage / réactivation restent des actions métier explicites confirmées.

Dans une fiche contact, la sélection Société reste éditable et son changement active Enregistrer. La mention de lecture seule des relations désigne exclusivement Client / Fournisseur, qui qualifient la société. Le rattachement d’un contact peut être changé ou supprimé depuis sa propre fiche avec sauvegarde explicite.

### Confirmation d’archivage — 5 octobre 2026

Règle commune Horizon : Archiver ouvre une fenêtre modale nommant la pièce / fiche concernée. L’utilisateur doit saisir exactement ARCHIVER (majuscules, sans espace supplémentaire) pour activer la validation. Le composant partagé `HArchiveButton` remplace la confirmation native des sociétés et contacts et doit être réutilisé pour les prochains objets archivables. Champ focalisé à l’ouverture, clavier contenu dans la fenêtre, Annuler / Échap disponibles et retour du focus au déclencheur. Chaque ouverture remet la saisie à vide.

Pendant la requête, les actions sont désactivées et la fenêtre reste ouverte ; en cas de refus, l’erreur est affichée et une nouvelle tentative reste possible. Les données et relations sont conservées selon l’archivage existant. La réactivation garde sa confirmation explicite habituelle.

Finition visuelle retenue après retour utilisateur : fenêtre centrée et blanche, bordures neutres et icône d’archive magenta Horizon sur un petit fond gris. La couleur est limitée à cette icône et au bouton magenta de confirmation. Titre et mot ARCHIVER restent bleu foncé, champ blanc avec focus bleu discret, pied blanc et séparateur léger. Overlay standard sans flou. L’en-tête rosé, le liseré, les accents roses multiples et les ombres colorées ont été refusés comme excessifs. Le mécanisme de validation et les permissions restent inchangés.


Recherche société — règle finale : bouton secondaire « Rechercher sur le web » avec icône globe dans l’en-tête du bloc Identité, disponible en création et sur une fiche existante. L’onglet Enrichissement est retiré. Fenêtre blanche compacte, sélection des informations puis « Remplir le formulaire » ; seul Enregistrer sauvegarde. Requête directement depuis le navigateur, aucune étape de configuration serveur.


Actions complémentaires — règle finale du 5 octobre 2026 : utiliser HRecordActions (menu engrenage à droite d’Enregistrer) pour Dupliquer, Archiver / Réactiver et Supprimer. L’archivage ne figure plus comme bouton isolé en haut des fiches Contacts. Menu blanc discret ; Archiver orange, Supprimer rouge. La fenêtre partagée HRecordConfirmation reste blanche, avec seulement une icône sur fond légèrement teinté et le bouton de confirmation coloré : orange pour ARCHIVER, rouge pour SUPPRIMER. Cette décision remplace la confirmation d’archivage magenta décrite plus haut. Validation exacte, focus initial dans le champ, Annuler / Échap et retour au bouton engrenage ; pendant la requête, annulation et seconde validation sont bloquées. Une erreur conserve le dialogue pour correction ou nouvelle tentative. HArchiveButton réutilise cette confirmation pour les futurs déclencheurs hors menu.


Profil comptable société : tabs Informations / Relations / Comptabilité / Notes, avec Relations disponible après création. En création : Informations / Comptabilité / Notes. Le logo et les Informations ne sont pas répétés dans Comptabilité. Deux blocs blancs compacts, comptes tiers puis facturation électronique, champs en deux colonnes et une colonne sur mobile. Le bouton Enregistrer commun garde son état basé sur les modifications et fonctionne depuis tous les onglets. Le changement d’onglet conserve le brouillon.

Français et Euro sont sélectionnés par défaut à la création, et restent modifiables. Numéro RCS dans le bloc légal à la place de l’identifiant fiscal. Recherche informations : la TVA disponible fait partie des cases de reprise ; si plusieurs numéros sont fournis, une combobox demande lequel reprendre. Les identifiants légaux, comptes et adresses de facturation électronique sont remis à vide lors d’une duplication pour éviter de recopier l’identité comptable du tiers.


Informations légales société : LEI remplace désormais le champ visible Numéro RCS, dans la même grille compacte. Le champ est facultatif avec indication « 20 caractères alphanumériques ». La saisie est normalisée en majuscules lors de la sauvegarde explicite. Aucun remplissage à partir du SIREN, du RCS ou de la TVA.


Cloche : bouton navy compact, avant le profil, compteur rouge réservé aux non lus. Panneau blanc avec bord fin et accent magenta discret sur les notifications non lues, aucun gradient décoratif. Compteur masqué à zéro, état « Vous êtes à jour » si aucun message. Présentation compatible desktop/mobile, lecture explicite par coche.

Logo société : petite loupe sous le cadre, à côté du libellé « Charger », accès clavier ; clic sur le logo et libellé pour importer un fichier. La loupe ne se superpose plus à l’image. Popup blanc à largeur maximale 720 px, marges intérieures 20 px, mots-clés et format sur la première ligne, vignettes entières sur blanc, contour magenta sur l’image sélectionnée, aperçu et source sous la grille, validation en pied. Les dimensions société 128 / 64 / 36 px et object-fit contain restent celles convenues. Sur mobile, recherche et actions se répartissent sans déborder.


### Fil d’activité — design livré

Fil ouvert sous la fiche, directement sur le fond de page : aucun cadre extérieur, fond blanc ou coins de carte. Largeur alignée à la fiche, séparation de 32 px, puis 18 px de respiration avant l’en-tête, avec un retrait latéral supplémentaire de 20 px sur ordinateur. Séparateur révisé le 8 octobre 2026 : une ligne continue de 1 px dans un gris bleuté discret, sans dégradé violet / rose ni repère central. Le fond thémé du fil décrit plus bas marque la séparation sans cadre extérieur. Sur mobile : séparation de 24 px et respiration de 16 px. En-tête compact « Fil d’activité », icône History sur fond violet très léger, sous-titre ; actualisation automatique sans bouton permanent. Seul le rédacteur conserve sa surface blanche délimitée : avatar, zone texte sans double encadrement, actions Joindre / Mentionner / Tâche dans une barre basse claire et bouton Publier magenta uniquement lorsqu’un contenu existe. Une publication reste distincte du bouton Enregistrer de la fiche.

Chronologie sans empilement de cartes : chaque événement commence par sa date et son heure centrées entre deux traits horizontaux fins. Le contenu vient dessous, avec un avatar de 30 px à initiales à côté du nom, y compris pour les modifications faites par un utilisateur ; les événements système gardent une icône neutre. Aucun trait vertical ni date repoussée à droite. Chronologie compacte : 14 px entre événements, 10 px entre date et contenu. Modifications toujours visibles en texte de 10,5 px, sous l’auteur et l’action : un changement par ligne avec 3 px entre lignes et 6 px entre champ, ancienne valeur, flèche et nouvelle valeur. Les valeurs longues se replient dans leur propre ligne de changement ; ne jamais juxtaposer plusieurs champs sur une ligne. Présentation compacte libellé : ancien → nouveau, sans volet repliable ni encart ; booléens Oui / Non, valeur vide « — ». Les fichiers ont un encart compact cliquable ; mentions @Nom reconnues comme destinataires visibles dans la bulle sur fond violet léger, sans pastille dupliquée sous le commentaire. L’action à côté de l’auteur indique « a mentionné un collègue » ou « a mentionné des collègues » ; sans destinataire, elle indique « a publié un commentaire ». Texte enregistré et notifications conservés. Un @Nom sans destinataire enregistré reste du texte ordinaire. Tâche intégrée avec responsable, échéance et état, priorité orange uniquement si haute ; tâche terminée avec coche verte. Filtres soulignés, pas de toggles colorés partout. L’état vide guide sans données fictives et le chargement initial utilise un squelette discret.

Sur mobile : marges du layout de 12 px, retrait supplémentaire de 6 px dans le fil, séparation de 24 px, filtres défilables dans leur zone, date et heure centrées au-dessus de chaque événement, champs de tâche empilés, changements sur des lignes compactes qui se replient selon la largeur, aucune extension de la largeur de page. Le fil reste présent sur Informations / Relations / Comptabilité / Notes. Les notifications métier disposent d’un lien « Voir la fiche » vers #activity, avec défilement après montage.


Commentaires : bulle blanche ajustée au contenu, largeur maximale du fil, bord fin, coins 12 px avec coin supérieur gauche droit pour évoquer un message sans décoration excessive. Les modifications automatiques et les tâches gardent leur présentation distincte. Pièce jointe : lien et corbeille indépendante côte à côte ; corbeille neutre avec survol rouge, libellé accessible comprenant le nom du fichier. Confirmation rouge partagée avec saisie SUPPRIMER et texte spécifique à la pièce jointe.


### Sélecteur d’images commun

Règle finale du 6 octobre 2026 : le même sélecteur est réutilisable pour les logos de société, les futures images produits et les autres formulaires qui acceptent une image. Les textes dépendent de `purpose`, sans recopier le composant.

**Google Images** est le premier onglet, sélectionné à chaque ouverture ; **Wikimedia** est le second. Un seul parcours est affiché à la fois. Les onglets sont accessibles au clavier : flèches pour basculer, Home pour Google, End pour Wikimedia. Les mots-clés et le format restent disponibles dans les deux parcours. Changer de source abandonne le choix local, conserve les mots-clés et les résultats Wikimedia, et ne modifie pas la fiche.

Parcours Google : champ de recherche prérempli et bouton Ouvrir Google Images, puis trois étapes numérotées : rechercher dans la fenêtre externe, clic droit → Copier l’image, retour dans Horizon → collage. La grande zone de collage affiche ⌘ V / Ctrl V. Le focus est préparé dans cette zone avant l’ouverture de Google. Après collage, l’aperçu remplace les instructions dans la même surface, avec Retirer l’image collée et la validation en pied. Ni résultats Wikimedia vides ni second encart d’aperçu dans cet onglet.

Parcours Wikimedia : recherche explicite, grille de vignettes, sélection unique, aperçu et lien vers la source. Aucun choix automatique ou import en arrière-plan. Importer un fichier reste une alternative discrète en pied, dans les deux onglets.

Popup blanc compact, onglet actif souligné magenta Horizon, traits fins et instructions sobres. Les images sont affichées entières sur blanc ; format carré du logo conservé. Sur mobile : barre de recherche sur deux lignes, étapes empilées, actions adaptées et popup défilable sans débordement.

Utiliser ce logo / Utiliser cette image ne fait que préparer le brouillon. Annuler ou fermer abandonne le choix en cours ; rouvrir repart dans Google Images sans sélection. Seul Enregistrer dans la fiche persiste le fichier. Formats PNG/JPEG/WebP, une seule image de 2 Mio maximum ; les erreurs de format, taille ou décodage restent visibles. Le détail technique de raccordement appartient au [contrat d’architecture](03-ARCHITECTURE.md#sélecteur-dimages-transversal--contrat-de-réutilisation).

### Répertoires Contacts / Adresses d’une société

Remplacer le titre Relations par Contacts et donner aux Adresses un onglet distinct, avant Comptabilité. Adresses reprend un répertoire de cartes : icône discrète par usage, libellé, coordonnées lisibles et action Modifier. Grille partagée avec les cartes Contacts (colonnes de 280 px minimum, hauteur fixe 112 px, espacements 12 px) ; formulaire compact sous les cartes sélectionnées, aucune écriture intermédiaire. Les e-mails sont des liens et les adresses postales sont condensées en deux lignes, coordonnées complètes accessibles au survol et dans l’éditeur. Le bouton Enregistrer principal reflète aussi les brouillons du répertoire. Pas de gros bandeau supplémentaire ni de nouvelle palette ; blanc / navy, accents violets discrets et action principale Horizon. Fil d’activité conservé sous la fiche sans box.


Contacts associés — filtre d’archives : afficher Actifs / Archivés avec le nombre d’archives uniquement si la société possède au moins un contact archivé. Filtre compact dans l’en-tête, à côté d’Ajouter un contact, police Inter commune et sélection soulignée discrètement ; aucune case à cocher isolée. Le filtre consulte les données sans écriture et revient à la première page lors d’un changement. Présentation responsive et disponible aux lecteurs autorisés.

Contacts associés — cartes unifiées : l’onglet Contacts d’une société réutilise directement `ContactCards`, comme le répertoire Contacts. Même grille adaptative, avatar 64 × 64 px avec badge logo société, nom, fonction, lien société, coordonnées avec pictogrammes, relations commerciales et état archivé. Toute la surface ouvre la fiche ; l’e-mail ouvre la fiche, les liens téléphone et société gardent leur destination. Aucune variante de carte propre aux contacts associés : les évolutions du composant commun s’appliquent aux deux vues. Le filtre d’archives conditionnel et la pagination serveur sont conservés.

Cartes compactes à hauteur fixe — 6 octobre 2026 : cette révision remplace le minimum historique de 350 px et les textes sur un nombre libre de lignes. Grille à partir de 280 px par carte (minimum révisé le 6 octobre pour préserver la lisibilité), espacement 12 px ; le nombre de colonnes dépend de la largeur disponible, sans quota imposé. Hauteur fixe de 112 px pour les sociétés et les personnes, répertoire et contacts associés ; remplissage 10 px, avatar conservé à 64 px. Typographie légèrement réduite : noms à 13 px, fonction / société / coordonnées à 10,5 px et badges à 10 px, sans modifier la hauteur ni la grille. La première proposition de 224 px a été refusée car trop haute. Nom société limité à deux lignes, nom personne à une ligne. Pour les personnes : nom, fonction, puis société sur trois lignes distinctes alignées ; aucune répartition de la fonction et de la société sur une même ligne étroite. Une quatrième ligne affiche en priorité l’e-mail, sinon la localisation, sinon le téléphone, avec ellipse. Les autres coordonnées disponibles restent accessibles par leurs pictogrammes (téléphone cliquable, localisation complète au survol). Pour les sociétés : e-mail sur sa propre ligne, localisation et téléphone côte à côte ; nom, fonction, société et e-mail complets accessibles au survol, contenu intégral dans la fiche. Les badges occupent une ligne dédiée en pied sur toute la largeur de la carte et les liens gardent leur destination. Le nombre de colonnes s’adapte à la largeur disponible, une colonne sur mobile ; les emplacements de chargement gardent la même grille et hauteur.


Lisibilité des formulaires : libellés et valeurs des champs en noir `#111111` via le token partagé `--color-horizon-form-text`. Application aux saisies, textes longs, combobox et options ordinaires, Contacts / Adresses / Comptabilité / Paramètres et formulaires communs. Les placeholders, textes d’aide et états désactivés restent secondaires ; les erreurs et sélections conservent les couleurs Horizon. Ne pas hériter de la couleur grise du libellé pour la valeur saisie.


Fiche contact : action Ouvrir la fiche société directement à droite de la combobox Société, sous forme de lien compact avec une flèche sortante et libellé accessible comprenant le nom. Cible la sélection courante du formulaire, disponible également en lecture seule, masquée sans société. Remplace le raccourci auparavant placé dans Coordonnées ; choisir une société reste un brouillon jusqu’à Enregistrer.

### Thèmes clair et sombre — 6 octobre 2026

Le bouton de thème appartient au groupe de droite dans la top bar, avant la cloche et le compte. Icône lune en clair / soleil en sombre, libellé accessible et tooltip indiquant l’action. Interface sombre navy : fond général `#0e1726`, panneaux `#162236`, surfaces secondaires `#1c2a40`, bordures neutres `#364860`, texte principal `#e8eef8`, valeurs de formulaire `#f3f6fc`. Utiliser les tokens `--theme-surface*`, `--theme-text*`, `--theme-border*` et les tokens d’état coloré de `shared/theme.css` ; les couleurs claires actuelles restent en fallback. Pas de filtre d’inversion des images. Les logos / leurs marges demeurent blancs et la sidebar conserve ses couleurs de marque.

Les menus et dialogues portalisés doivent utiliser les mêmes tokens. Placeholder et état désactivé restent lisibles et secondaires ; erreurs, succès et actions Horizon conservent un sens coloré. Préserver le noir des libellés et valeurs en mode clair. À 700 px et moins, la top bar utilise deux lignes de 88 px au total pour accueillir thème, cloche et compte sans écraser la recherche, centrée en seconde ligne. Le choix est local au navigateur et appliqué dès le démarrage.

### Recherche et filtres uniformes — 6 octobre 2026

Pour les listes métier disposant d’une recherche contextuelle, les critères de filtrage appartiennent à la recherche de la top bar. Un bouton « Filtres » avec icône Lucide SlidersHorizontal ouvre un panneau compact aligné à droite sous la barre. Le panneau porte les libellés métier et les choix, sans codes techniques ; changements appliqués immédiatement en lecture, fermeture par Terminé, clic extérieur ou Échap avec restitution du focus. Réinitialiser remet les critères du contexte et le tri à leurs défauts, sans effacer le texte recherché ni changer la présentation.

Le nombre sur le bouton compte les critères différents des valeurs par défaut. Ceux-ci apparaissent aussi sous forme de pastilles retirables à côté du contexte dans le champ composé, sans second cadre. Les pastilles longues sont tronquées avec leur libellé complet accessible ; plusieurs critères défilent dans une zone bornée afin de préserver la saisie. Sur mobile, le bouton conserve son icône et son compteur mais masque « Filtres » ; panneau limité à la largeur de l’écran. Sous 380 px, les pastilles sont masquées pour préserver la saisie : le compteur reste visible et le panneau permet de lire/retirer les critères. La recherche centrée peut atteindre 600 px sur desktop pour accueillir les critères sans comprimer le texte. Même composition en clair et sombre, palette Horizon discrète.

Premier raccordement : Sociétés et Personnes, avec État des fiches = Actifs par défaut ou Archivés. Retrait de l’ancien sélecteur dans la barre des résultats ; compteur et Cartes / Liste restent près des résultats ; le tri rejoint ensuite la colonne Regrouper par du panneau commun (voir évolution ci-dessous). Les critères sont validés contre les choix déclarés et conservés dans l’URL (`state=archived`) : rechargement, lien partagé et navigation précédent / suivant. Le défaut est omis de l’URL. Changer recherche ou état repart à la première page. Passer en mode global masque les contrôles locaux tout en conservant les critères ; revenir au contexte les restaure. Changer de répertoire depuis les onglets conserve la recherche, les filtres et la présentation ; les tris sont adaptés au type de fiche et le regroupement Société retiré en passant aux sociétés. Avec une recherche saisie, ce choix manuel fixe son périmètre pour éviter une bascule automatique contraire au choix utilisateur.

Ce contrat s’applique aux prochains modules (produits, devis, factures, etc.) : réutiliser le panneau commun et déclarer leurs filtres, sans ajouter une seconde recherche locale. Les critères métier et les permissions restent propres à chaque module ; aucun filtre non fonctionnel n’est affiché pour les modules à venir. Les petites listes intégrées à une fiche, comme Contacts associés, conservent leurs contrôles dans l’en-tête de leur section tant qu’elles ne disposent pas d’une recherche contextuelle dédiée.

Répertoire Contacts — filtres commerciaux : Relation commerciale est le premier critère du panneau, avec Toutes (défaut), Clients et Fournisseurs. Une société aux deux rôles est incluse dans chaque filtre correspondant ; aucun rôle désactivé ne doit produire de correspondance. Pour Personnes, la relation est celle de la société associée ; sans société, la personne n’apparaît que dans Toutes. Le choix est conservé dans `role=customer` / `role=supplier` et se combine avec recherche et archives. Le filtre ne modifie pas les totaux de synthèse globale.

L’état Actifs / Archivés devient secondaire : deux petits boutons radio natifs neutres, sans tuiles, fond violet ni coche décorative, placés après les relations commerciales. La pastille Archivés reste retirable mais utilise un fond gris discret. Le défaut Actifs n’ajoute aucune pastille. Le composant partagé accepte `appearance: 'compact'` pour les critères secondaires ; les filtres principaux à plus de deux choix sont présentés en lignes pour rester lisibles dans le panneau.

### Panneau Filtres / Regrouper par et vues enregistrées

Panneau élargi à 540 px sur desktop, deux colonnes séparées par un trait fin : Filtres à gauche ; Regrouper par et Trier par à droite. Icônes Lucide List / Globe / Building2 pour Aucun, Pays et Société. Sur petit écran (≤ 600 px), les colonnes s’empilent dans le panneau défilable borné au viewport. Actifs / Archivés reste compact et neutre. Le compteur et les pastilles incluent le regroupement non standard. Réinitialiser restaure filtres, regroupement et tri par défaut, sans perdre recherche ni présentation.

Contacts : Pays utilise le siège principal, ou l’unique siège si aucun n’est principal ; sinon Pays non renseigné. Pour Personnes, le pays vient du siège de la société associée. Société est disponible uniquement pour Personnes ; les personnes non rattachées sont regroupées sous Sans société. En-têtes de groupes légers, pictogramme, nom et total ; « N sur cette page » lorsqu’un groupe est réparti entre pages. Cartes et tableau conservent liens, coordonnées, tri et pagination ; le tri s’applique à l’intérieur de chaque groupe. Le tri URL persiste aussi hors regroupement, et son ancien contrôle est retiré de la barre des résultats.

Vues enregistrées dans une section en bas du panneau : nom, pictogramme privé / globe, indication Personnelle / Partagée. Nouvelle ouvre un petit formulaire intégré : nom, Moi uniquement ou Tous les utilisateurs du module, puis Enregistrer la vue (seule action d’écriture). Application d’une vue = lecture/navigation uniquement. Modifier permet de renommer la vue, changer sa visibilité et remplacer ses critères par les choix actuels ; indication explicite avant Enregistrer. Suppression avec confirmation intégrée. Boutons de modification/suppression visibles au créateur ou administrateur des vues uniquement. Une vue ne modifie pas les filtres d’un autre module. Les erreurs restent visibles avec Réessayer ; sur un backend non mis à jour, les filtres existants restent disponibles et la section signale le lot manquant.

### Navigation précédente / suivante des fiches

À droite du fil d’Ariane, sur la même ligne : compteur discret en Inter 11 px à chiffres tabulaires, puis chevrons gauche / droite de 15 px dans des actions de 25 px. Pas de nouveau bandeau encadré. Le nombre représente la position dans les résultats courants. Premiers / derniers résultats et opérations en cours : bouton désactivé ; labels accessibles Société précédente / Société suivante (ou Contact). Aucun bouclage. Chargement neutre « — / — », erreur avec une action de reprise et message au survol, sans encart supplémentaire. Le rendu utilise les tokens clair / sombre et reste contenu sur mobile. Confirmation d’abandon via le dialogue Horizon, Rester sur la fiche / Quitter sans enregistrer ; aucune sauvegarde implicite. Le slot partagé pourra recevoir les navigateurs des autres modules.

Défilement des fiches — transition stable : garder la fiche et son compteur visibles pendant le chargement de la suivante ; basculer seulement lorsque fiche, adresses, comptes et compteur sont prêts. Aucune page blanche, aucun « Chargement de la fiche… » entre deux fiches via les flèches, aucune animation de fondu. Les interactions de la fiche sont suspendues sans changement de son apparence et annoncées par aria-busy. Si la cible ne charge pas, conserver la fiche actuelle et afficher un dialogue Horizon ; aucune perte implicite du brouillon. Le chargement d’un accès direct sans cache reste distinct de cette transition.

### Barre de raccourcis contextuels

À partir de 1001 px : fil d’Ariane à gauche, raccourcis centrés dans l’espace disponible, compteur et chevrons à droite. Ancien bandeau de gros boutons sous le titre retiré. Petites actions de 26 px, texte 10,5 px, pictogrammes 13 px et nombres à chiffres tabulaires sur une étiquette neutre ; libellés courts, description complète du périmètre au survol. Au plus sept liens directs sur desktop, puis menu « … » Autres raccourcis pour éviter de tasser la ligne. À 1000 px et moins : fil d’Ariane / pagination gardent leur première ligne, deux raccourcis directs sur la seconde et le reste dans le menu. Menu partagé Horizon, clavier et thème sombre ; pas de chevauchement ou nouvelle grande box.

Contenu déterminé par la page et les rôles enregistrés : Client → ventes / facturation client / CRM, Fournisseur → achats / réceptions / facturation fournisseur, cumul admis. Les fiches contacts réutilisent la société associée ; les prochains modules, dont Produits, fourniront leur propre périmètre. Seuls les modules livrés avec données et destinations réelles sont activables. Les entrées prévues affichent « — » et restent désactivées ; le tiret signifie indisponible, jamais zéro. Un vrai zéro reste un lien valide vers la liste vide. Contacts et Adresses restent dans les onglets de la société, avec une petite étiquette numérique neutre à côté du libellé (zéro inclus). Aucun raccourci vers ces sections dans la barre métier. Le compteur Contacts porte sur les personnes actives ; Adresses compte les adresses et e-mails enregistrés, sans présenter les brouillons comme sauvegardés. Pendant le défilement, les actions sont inert sans modification d’apparence pour conserver la transition stable.

Répertoires Sociétés / Personnes — 6 octobre 2026 : retrait du bouton d’actualisation manuel isolé sous les onglets. Les listes continuent à se mettre à jour via leurs requêtes et invalidations après sauvegarde ; Réessayer reste disponible en cas d’erreur.

Synthèse Contacts — 6 octobre 2026 : conserver exactement quatre tuiles, dans l’ordre Clients / Fournisseurs / Sociétés / Personnes. Le libellé Personnes remplace Contacts pour éviter la confusion avec le nom du module. Compteurs des fiches actives existants, quatre colonnes sur PC et deux sur mobile.

Les quatre tuiles de synthèse sont des liens natifs : Clients → Sociétés actives filtrées Client ; Fournisseurs → Sociétés actives filtrées Fournisseur ; Sociétés → toutes les sociétés actives ; Personnes → toutes les personnes actives. La présentation cartes / liste est conservée. Recherche, archives et autres critères précédents sont réinitialisés pour que la destination corresponde au périmètre du compteur. Survol discret et focus clavier visible ; ouverture dans un nouvel onglet possible.

Densité du fil — 6 octobre 2026 : en-tête et filtres espacés de 12 px, saisie initiale sur deux lignes redimensionnables, marges internes du rédacteur 10–12 px et barre d’actions 6 px. Bulles de commentaires : marges internes 8 × 12 px. Police et avatars conservés pour la lisibilité ; séparation Horizon et présentation sans box extérieure maintenues.

Actions du fil — 6 octobre 2026 : afficher une seule fois l’action à côté de l’auteur (a créé / modifié / archivé / réactivé la fiche). Retirer le résumé répété « Fiche mise à jour » lorsque les champs modifiés sont présents. Un retrait de rôle Client / Fournisseur reste une modification ; il ne signifie pas que la société est archivée. Les événements système sans détail conservent leur texte explicatif.

Fiches Contacts — fil d’Ariane : Accueil › Contacts › nom de la fiche, dernier niveau en gras et aria-current=page. Contacts ouvre le répertoire Sociétés ou Personnes d’origine en conservant recherche, filtres, tri, présentation et page dans l’historique. Le bouton Retour / Répertoire sous le fil d’Ariane est supprimé. En création, le dernier niveau indique Nouvelle société / Nouveau contact ; le nom enregistré identifie les fiches existantes. Les noms longs sont tronqués visuellement avec texte complet au survol, sans pousser les raccourcis et le compteur hors du contenu.

Couleurs du répertoire — 6 octobre 2026 : Client = violet, Fournisseur = ambre/orange, Société = bleu, Personne = rose Horizon. Les icônes de tuiles Clients / Fournisseurs partagent exactement les couleurs de texte et de fond des tags correspondants dans les cartes et tableaux. Sociétés et Personnes reprennent les tokens bleu et rose existants ; surfaces légères, sans teinter toute la tuile. Les variantes sombres utilisent les mêmes tokens sémantiques ; ne pas associer le token rose au rôle Fournisseur.

Type des cartes Contacts — 6 octobre 2026 : pictogramme 14 px en bas à droite, dans le pied de hauteur fixe 18 px. Société : bâtiment bleu ; Personne : personnes rose. Même palette que les tuiles de synthèse, thème sombre via tokens existants. Survol « Société » / « Personne », lien natif vers la fiche avec conservation du contexte, focus clavier visible. Les badges commerciaux restent à gauche et la carte conserve sa hauteur 112 px. Le composant partagé applique ce repère aussi aux contacts associés d’une société.

Recherche Contacts — 6 octobre 2026 : périmètre Contacts par défaut sur les deux répertoires. La saisie filtre les listes existantes ; si l’onglet courant ne contient aucun résultat et l’autre en contient, bascule automatique vers l’autre onglet avec conservation du texte, de la présentation et des filtres commerciaux / archives. Focus conservé pour poursuivre la saisie. Des résultats dans les deux types ou aucun résultat : onglet courant conservé. Les choix explicites Sociétés / Personnes limitent la recherche au type choisi (`scope=companies` / `scope=people`) ; revenir à Contacts réactive la bascule. Aucun panneau de résultats supplémentaire. Tout Horizon conserve la recherche des espaces disponible aujourd’hui.

Pastilles commerciales de recherche — 6 octobre 2026 : Clients violet, Fournisseurs ambre, avec exactement les mêmes règles CSS et tokens que les tags commerciaux et les tuiles de synthèse, en clair et sombre. Les options de filtres partagés déclarent leur ton ; les critères sans ton gardent leur apparence habituelle, archives neutres.

Pagination des répertoires Contacts — 6 octobre 2026 : déplacement dans le slot navigation à droite du fil d’Ariane, identique aux fiches : compteur « Page 1 / 3 » et chevrons compacts précédent / suivant. Suppression de la grande barre encadrée sous les résultats. Boutons désactivés aux bornes et pendant le chargement ; noms accessibles explicites. Présentations cartes et liste, filtres et pagination métier conservés.

Adresses — 6 octobre 2026 : retrait de la carte virtuelle E-mail général, déjà disponible dans Informations. Cet e-mail reste enregistré sur la société et n’entre plus dans le compteur Adresses. L’e-mail de facturation et les adresses par usage conservent leur fonctionnement.

Case Adresse principale — 6 octobre 2026 : même police Inter et taille 11 px que les libellés du formulaire, ligne 16 px, case 14 px alignée au centre avec espacement 7 px. Marge supérieure 12 px pour séparer des champs. Réutilisation de l’apparence et des états clavier des cases commerciales de la fiche, accent magenta Horizon.

### En-têtes de section figés — 6 octobre 2026

Utiliser `shared/ui/HSectionHeading` pour les titres de blocs de formulaire, répertoires intégrés et tableaux de même niveau. Contrat unique : Inter 13 px / ligne 18 px / graisse 600 pour le titre ; Inter 11 px / ligne 16 px / graisse 400 pour sous-texte et compteur entre parenthèses ; icône 14 px facultative, espace 8 px ; sous-texte à 3 px du titre ; marge inférieure 12 px. Actions alignées à droite, repli sur mobile sans changer la typographie. Couleurs via tokens clair / sombre. Aucun override de police ou taille par module. Les titres de page restent dans HPageHeader ; les libellés de champs conservent leur hiérarchie propre.

Premier raccordement : sections Identité, Coordonnées, Adresse du siège, Préférences, Informations légales, Notes, Comptes tiers, Facturation électronique, Contacts associés, Adresses de la société et éditeur d’adresse. Les trois sections Contacts / Adresses / Comptabilité partagent le même composant plutôt que des règles locales divergentes.

Espacements des sections de fiche — 6 octobre 2026 : écart unique de 8 px entre onglets et surface de contenu sur Informations, Contacts, Adresses, Comptabilité et Notes. Padding vertical de surface 12 px, horizontal 18 px (14 px mobile). Les en-têtes partagés alignent le titre en haut même en présence d’un bouton ; Identité ne se centre plus verticalement par rapport au logo. Variables `--record-tab-content-gap` et `--record-panel-padding-block` centralisées sur la fiche. Retrait de la marge propre aux répertoires intégrés et de la marge supplémentaire de grille Adresses ; typographie identique conservée.

Polices embarquées — 6 octobre 2026 : charger explicitement Inter Latin 400, 500, 600 et 700 ; Montserrat Latin 600 pour les titres de page. Les en-têtes de section utilisent le vrai fichier Inter 600. Ne pas compter sur un gras simulé par le navigateur, dont le rendu varie selon la plateforme. Taille et espacements du contrat de section inchangés.

Barre de contexte persistante — 6 octobre 2026 : fil d’Ariane, raccourcis métier et compteur / chevrons restent ensemble sous la top bar pendant le scroll. Sticky à 52 px sur desktop, 88 px mobile, décalage piloté par la même variable que la hauteur de top bar. Fond opaque avec les tokens clair / sombre, trait inférieur discret, surface couvrant les marges latérales pour masquer le contenu qui défile dessous. Sur petit écran, les raccourcis passent en seconde ligne et restent dans la barre persistante. Comportement partagé pour fiches et listes.

Fond du fil d’activité — 6 octobre 2026 : surface légèrement plus foncée sous la ligne de séparation pour distinguer le fil de la fiche. Ce fond couvre toute la largeur de la zone de contenu jusqu’à la sidebar et au bord droit, sans bandes latérales claires ; compensation des marges du layout pour conserver l’alignement du texte et des champs. Token partagé `--theme-activity-background` : #e5ebf3 en clair, #111d2e en sombre (gris bleuté Horizon un peu plus foncé, choisi le 8 octobre 2026 après rejet du gris froid et du gris chaud). Aucune bordure extérieure, ombre ou arrondi sur cette zone ; seule une fine ligne gris bleuté sépare le fil de la fiche. Le rédacteur et les bulles conservent leurs surfaces habituelles. Même traitement pour tous les modules réutilisant ActivityPanel.

Alignement du contenu du fil — 6 octobre 2026 : détails des modifications, bulles de commentaires, pièces jointes, tâches et actions alignés sous le nom de l’auteur, avec retrait de 38 px (avatar 30 px + espace 8 px). L’avatar et l’en-tête conservent leur position ; séparateurs date / heure conservent la largeur complète. Même alignement desktop et mobile, sans agrandir les espacements verticaux.

Actions secondaires du fil — 6 octobre 2026 : Créer une tâche à partir d’une note devient une icône ClipboardPlus 15 px dans un bouton discret 24 px, à côté de la bulle, sans ligne de texte supplémentaire. Nom accessible et texte au survol, focus clavier visible, mêmes permissions et fonctionnement. Pour une note contenant uniquement des PJ, icône dans la ligne des pièces jointes. Règle générale : actions secondaires compactes adjacentes à leur contenu, libellé accessible / survol ; conserver les libellés des actions principales. Composant ActivityPanel partagé dans tout Horizon.

Recherche web société — 6 octobre 2026 : action globe « Rechercher sur le web » dans l’en-tête Identité, en bouton ghost compact. L’action est rapprochée des champs qu’elle renseigne ; la barre supérieure reste consacrée à la sauvegarde et aux actions sur la fiche. La fenêtre « Recherche informations » conserve la source officielle de l’État et la validation explicite des champs à reprendre.

Largeur minimale des cartes — 6 octobre 2026 : minimum commun relevé de 240 à 280 px (valeur finale demandée par l’utilisateur), variable `--directory-card-min-width`. Répertoire sociétés / personnes, contacts associés, adresses et emplacements de chargement reprennent la même grille. Les cartes passent à la ligne au lieu de compresser leurs coordonnées ; hauteur 112 px conservée. Sur un conteneur de moins de 280 px, une carte utilise toute la largeur disponible sans débordement horizontal.

Navigation depuis l’e-mail des cartes — 6 octobre 2026 : le texte et le pictogramme e-mail ouvrent désormais la fiche concernée, pour les sociétés, les personnes et les contacts associés. Ils utilisent un lien React Router natif vers la fiche avec le même contexte de liste que le nom / portrait ; aucun déclenchement du logiciel de messagerie. Téléphone, société associée et liens e-mail des autres vues inchangés. Cette décision remplace la destination mailto historique des cartes Contacts.

CRM classique — 6 octobre 2026 : reprend le shell Contacts, barre de contexte persistante, pagination supérieure, recherche / filtres de top bar, HSectionHeading, HSaveButton, HRecordActions et fil sans box. HRecordTabs est partagé avec Contacts pour les dimensions et la navigation flèches / Home / End. Fiche dense à sections blanches, synthèse compacte avec société / montant / échéance / responsable / compte ; Informations et Description conservent le même formulaire. Kanban : colonnes teintées discrètement et liseré bleu / violet / rose, cartes blanches de 112 px, titre et surface cliquables. Déplacements au drag & drop à la souris ou au clavier, enregistrés immédiatement. Défilement horizontal limité au Kanban sur mobile, sans élargir la page. Tons, marges et corps typographiques viennent du Design System.


CRM — Kanban révisé : colonnes ouvertes sans grandes boxes teintées, séparations verticales fines, titre 13 px / graisse 600, pastille de marque 6 px, compteur discret et totaux 12 px sous le titre. Replier affiche un rail compact de 52 px, titre et totaux conservés. Cartes min 280 px / hauteur 112 px ; destination de glissement pointillée, source estompée, animation de 280 ms entre positions réelles, supprimée avec prefers-reduced-motion. Cette direction remplace les colonnes teintées du premier lot.

Sélecteurs partagés : croix discrète à droite d’une valeur remplie et modifiable, bouton accessible « Effacer : [champ] », séparé du déclencheur et du chevron. La validation obligatoire s’applique à la sauvegarde. Description riche partagée : barre compacte de boutons 27 × 26 px, surface blanche / token sombre, Inter 13 px, zone initiale 220 px, compteur discret. Titres, texte et listes suivent la hiérarchie Horizon sans palette supplémentaire.


Colonnes CRM repliées : préférence de présentation conservée dans le navigateur sous horizon.crm.collapsed-stages.[userId], séparée par utilisateur. Rechargement et retour dans le CRM conservent les colonnes fermées ; ouvrir une colonne met aussi la préférence à jour. Aucun appel PocketBase ni modification de fiche. Un stockage indisponible conserve le comportement dans la session courante.

Kanban dnd-kit — 6 octobre 2026 : carte flottante identique à la carte normale, ombre légère pendant le glissement seulement, source estompée et déplacement animé des voisines (240 ms). Dépôt dans une colonne vide, remplie ou repliée ; ouverture de la colonne au survol avec une carte après 300 ms, mémorisée. Seuil souris de 6 px pour préserver le clic de fiche, maintien tactile 250 ms ; boutons internes conservés. Échap annule, déplacement au clavier par Espace / flèches / Espace et annonces en français. Mouvements réduits : transitions et animation de dépôt désactivées. Les changements d’étape sont enregistrés au dépôt à la souris ou au clavier ; l’ordre manuel des cartes est uniquement visuel dans la vue courante et le tri choisi reprend au refresh. Remplace l’ancien drag HTML5 / FLIP.

Pendant le glissement et son animation finale, les actions pagination, changement de vue et repli / dépli manuel sont temporairement indisponibles pour garder la cinématique intacte.

CRM — ajustement utilisateur du 6 octobre 2026 : colonnes sur un fond neutre légèrement distinct de la page, cadre fin de 10 px de rayon et en-tête compact ; total plus affirmé, compteur et pastille de marque discrets, hauteur initiale 320 px. Code des cartes en texte noir / texte clair du mode sombre, 11 px graisse 500 et chiffres tabulaires. Liste : colonne Code dédiée, séparée du titre et triable dans les deux sens. Le survol d’une colonne repliée pendant le drag la déplie après 300 ms ; son ouverture est mémorisée. Aucun bouton Enregistrer dans le répertoire CRM ; autosauvegarde uniquement du changement d’étape, rollback visuel / erreur en cas d’échec. Le formulaire conserve son enregistrement explicite. Cette décision remplace le brouillon Kanban demandé auparavant.

Carte Kanban en déplacement — 6 octobre 2026 : inclinaison de −4° sur la carte flottante seulement (sens et amplitude ajustés à la demande utilisateur) ; retour à 0° au dépôt avec transition 160 ms. Transformation appliquée au contenu de l’overlay pour conserver le positionnement géré par dnd-kit. Désactivée avec prefers-reduced-motion.

Colonnes Kanban — couleurs renforcées à la demande utilisateur : fond mêlant 7 % du ton configuré bleu / violet / rose avec la surface neutre, cadre légèrement teinté, liseré supérieur de 2 px et compteur coloré. Survol de destination renforcé à 15 %. Cartes et textes métier gardent leur surface / contraste, mêmes tokens en mode sombre ; aucune nouvelle palette.

CRM — 7 octobre 2026 : retrait du liseré supérieur des colonnes. Couleurs distinctes des étapes standard : Nouveau bleu, Qualifié violet, Gagné vert, Terminé navy, Perdue orange, Annulé rose ; tokens Horizon existants et fond teinté à 7 %, destination à 15 %. Les étapes supplémentaires conservent leur ton configuré. Cette règle remplace le liseré décrit précédemment. Cartes sans double flèche ni badge d’état redondant. Initiales du responsable dans un avatar de 22 px, nom au survol ; logo client de 22 px en contain, avec icône de repli. Même identité en liste. La hauteur de carte reste 112 px et sa largeur minimale 280 px.

Ciblage Kanban : colonnes vides et repliées prioritaires sous le pointeur ; pas de collision de colonne par simple chevauchement de la carte flottante, pour éviter qu’une colonne voisine empêche l’ouverture au survol. Les cartes restent triables et animées par dnd-kit.

CRM — nouvelle présentation du 7 octobre 2026 : remplace les grandes surfaces uniformément teintées. En-tête compact rempli à 14 % du ton configuré, titre et compteur sur une ligne, total tabulaire 17 px ; corps neutre, cartes blanches 112 px, cadre fin et aucun liseré supérieur. Le titre ouvre les réglages si autorisé. La couleur vient exclusivement de tone, jamais du code d’étape. HTag utilise ce même token avec fond à 11 % ; HTonePicker propose six pastilles Horizon (bleu, violet, rose, vert, orange, navy), navigation native radio et focus visible. HTagPicker présente les sélections en tags retirables et une liste de choix multiples avec recherche, compatible clavier et lecture seule. Paramètres CRM reprend HRecordTabs et HSectionHeading.

CRM — simplification des colonnes demandée le 7 octobre 2026 : remplace les en-têtes remplis et les grands cadres. Colonnes ouvertes transparentes, titre 13 px et compteur portant la couleur configurée, total discret 12 px, simple séparation horizontale neutre. Espacement entre colonnes 16 px ; état vide en texte libre sans box. Seule la destination de drag reçoit une teinte à 5 % et un contour pointillé ; rail replié neutre. Densité, couleurs configurables, repli persistant et interactions existantes conservés.

CRM — ajustement selon les deux références visuelles utilisateur, 7 octobre 2026 : colonnes à fond gris neutre (texte 5 % / surface), contour neutre fin, rayon 10 px et espacement 12 px. En-tête sans bande teintée ni liseré, titre navy 13 px, petite pastille cerclée et compteur portant la couleur configurée ; total 12 px dessous. Cartes blanches de 112 px, rayon 8 px et ombre de séparation 4 %. États vides sans box ; rail replié dans le même style neutre et destination de déplacement seule accentuée. Remplace les colonnes transparentes du précédent ajustement.

CRM — correction explicite utilisateur du 7 octobre 2026 : retirer les pastilles rondes et remettre un bord supérieur de 3 px dans la couleur configurée de chaque étape. Colonnes davantage délimitées : corps gris neutre à 9 %, contour neutre à 12 %, rayon 6 px ; en-tête blanc compact avec titre et compteur puis total sans retrait. Rail replié conserve son bord coloré. Cette décision remplace le précédent retrait du liseré et la pastille cerclée.

CRM — finition des cartes demandée le 7 octobre 2026 : hauteur fixe 112 px conservée, code / titre / société alignés à gauche, initiales du responsable en haut à droite et logo client de 38 px dessous (contain). Deux tags de marché visibles, mêmes couleurs que les paramètres ; compteur +N pour les types supplémentaires et liste complète au survol. Titre et libellés longs tronqués avec texte complet au survol, carte entièrement cliquable. État Aucune opportunité centré dans le corps de la colonne sans box. Logo en liste reste 22 px.

CRM — disposition finale des cartes, 7 octobre 2026 : première ligne « #numéro – Client » face à l’avatar du responsable ; titre de l’opportunité puis montant à gauche, logo client unique de 38 px à droite sur ces deux lignes. Dernière ligne : tags de marché à gauche, probabilité à droite. L’échéance reste consultable dans la liste et la fiche. Cette disposition remplace l’empilement code / titre / société et le précédent pied montant / probabilité. Hauteur 112 px, deux tags puis +N et textes complets au survol conservés.

Paramètres — 7 octobre 2026 : actions de configuration des tableaux sous forme d’engrenage 16 px dans un bouton ghost, colonne de 52 px centrée horizontalement et verticalement, nom accessible « Modifier [code] » et survol « Configurer [code] ». Séquences dans Socle commun, édition en dialogue dense et aperçu du prochain numéro ; Enregistrer seulement actif et coloré si modification. Étapes CRM : six lignes actives fixes, aucun bouton Ajouter ni contrôle de désactivation / signification. Choix de couleur partagé : six tons Horizon proposés et sélecteur natif de couleur libre ; retour à un ton supprime la couleur personnalisée. Même couleur pour bord / compteur Kanban, tags de liste, marchés de carte et formulaire.

### Utilisateurs / Employés

Listes denses, engrenage de configuration des accès, titres `HSectionHeading`, cases `h-choice`, couleurs de profil par `HTag`. Fiches dans les dialogues partagés : en-tête fixe, formulaire défilant, sauvegarde explicite et grisée sans modification. Matrice des modules disponibles compacte ; futurs modules dans un volet discret. Organigramme : cartes blanches (surface thémée en Dark), largeur fixe 280 px / hauteur 112 px, avatar, nom cliquable, poste et équipe, Manager violet / Direction navy / compte ; traits fins violets, fond neutre, repli / zoom / recentrage. Sur petit écran le graphe et les tableaux défilent dans leur cadre, sans élargir la page. Le poste reste une étiquette descriptive ; aucune décoration ne suggère des droits implicites.

Employés — responsabilité Direction (7 octobre 2026) : un seul sélecteur compact Collaborateur / Manager / Direction dans Organisation, badge `HTag` navy pour Direction et violet pour Manager, mêmes dimensions de cartes et typographie. Liens hiérarchiques explicites, aucune décoration de profil ERP ou suggestion de droits hérités.

Recherche Employés et Utilisateurs / accès — 7 octobre 2026 : `/hr` et `/settings/users` sont raccordés à la recherche contextuelle de la top bar, au même titre que Contacts / CRM. Les pages ne portent aucun champ local de recherche ou de filtre. Employés déclare Équipe et Statut (Actifs par défaut), Utilisateurs déclare Profil ERP (Tous par défaut), dans `SearchFilters` et ses pastilles communes. Recherche `q` et critères `team` / `status` / `profile` conservés dans l’URL, valeurs invalides ramenées aux défauts. Liste / Organigramme et fermeture d’une fiche préservent les critères. Réinitialiser retire seulement les filtres, sans effacer la recherche. ⌘ K / Ctrl K focalise le champ, Tout Horizon conserve le mode global. Les options d’équipes viennent du service Employés autorisé et de son cache partagé. Les actions de création et la présentation des résultats restent dans la page. Aucun bouton d’actualisation permanent ; une relance apparaît uniquement en cas d’erreur. Ce raccordement fait partie de la recette obligatoire de toute nouvelle liste métier ; seuls les formulaires et petites listes intégrées conservent les contrôles locaux adaptés à leur section.

Panneau transverse complet — 7 octobre 2026 : même `SearchFilters` et même CSS pour toutes les listes raccordées. Largeur desktop 540 px et deux colonnes dès qu’un tri ou regroupement est déclaré : Filtres à gauche, Regrouper par / Trier par à droite. Aucun panneau local et aucun style spécifique Contacts pour ce pattern ; les modules déclarent leurs critères et exécutent leurs traitements métier. Sans présentation déclarée, une colonne sans zone vide. Tri seul visible dans CRM, même sans regroupement. Compteur / Réinitialiser tiennent aussi compte du tri non standard.

Employés en liste : regroupement Équipe / Responsabilité, tri nom ascendant / descendant, e-mail ascendant / descendant ou poste. Utilisateurs : regroupement Profil ERP / Responsabilité, tri nom ou e-mail dans les deux sens. Tri appliqué à l’intérieur des groupes ; en-têtes communs `GroupedResults` avec icône, libellé et total, utilisés aussi par Contacts. Valeurs URL `group` / `sort` validées. Organigramme conserve ses vrais liens hiérarchiques : les regroupements tabulaires ne remplacent pas l’organisation, sont masqués dans son panneau et restaurés au retour Liste ; les filtres / tri restent applicables. Les changements du CSS / JSX partagés impactent tous ces contextes. Les vues enregistrées restent disponibles sur Contacts, dont le backend supporte ces contextes, sans afficher une fonctionnalité non raccordée ailleurs.

Employés / Équipes — 7 octobre 2026 : onglets `HRecordTabs` partagés, équipes dans un panneau sans seconde navigation ni boîte de choix préalable. Table compacte et vraie recherche contextuelle Équipes dans la top bar ; `SearchFilters` / `GroupedResults` partagés. Éditeur : nom lisible, sélection multiple de managers via `HTagPicker` avec libellé adapté et avatars dans la liste, état discret ; aucun code métier artificiel ni identifiant technique visible. Sauvegarde explicite et engrenage `HRecordActions` dans l’en-tête du popup d’édition avec les seules actions disponibles. Le composant partagé accepte l’absence de duplication / suppression, sans bouton factice. Archivage avec `HRecordConfirmation` et ARCHIVER ; pas de case Active qui contourne la confirmation sur une équipe existante. Relations d’équipes archivées conservées.

Popup Équipe finalisé — 7 octobre 2026 : `HDialog` expose un emplacement partagé `actions` à droite du titre, avant Fermer ; `HRecordActions` y porte Archiver / Réactiver pour une équipe enregistrée. Aucun badge Active ni engrenage à la création. Badge d’état d’une équipe existante à côté du titre du popup, via l’emplacement partagé `HDialog.titleBadge` ; Nom de l’équipe et Managers utilisent le même `HSectionHeading` avec pictogramme 14 px (`UsersRound` pour l’équipe, `Network` pour l’encadrement) ; le titre Nom reste un label associé au champ via `titleFor`. Section Managers et sélection multiple espacées de façon régulière, sans doublon de titre Équipe. `HDialogFooter` partagé, bordure fine et boutons à droite, hors de la zone défilante ; sauvegarde associée au formulaire par son identifiant. Même rendu clair / sombre et mobile. Archive accessible lorsque le formulaire est modifié : avertissement d’abandon des changements dans la confirmation, sans sauvegarde silencieuse. Aucun changement du schéma.


Couleurs des profils et responsabilités — 7 octobre 2026 : Paramètres → Utilisateurs et accès, onglet Tags dans `HRecordTabs` ; aucune nouvelle entrée de navigation. Un seul titre de page au-dessus des onglets ; aucun second titre Comptes utilisateurs ou Tags utilisateurs en dessous. Compteurs et actions sur une même ligne compacte dans Utilisateurs. Zones Profils ERP / Responsabilités avec tableaux et engrenages partagés. Popup compact `HTonePicker`, couleur personnalisée #RRGGBB, aperçu `HTag` et pied `HDialogFooter`. Source globale `settings_identity_tags`, lecture mutualisée TanStack Query et invalidation après sauvegarde. `IdentityTag` / `useIdentityTagStyle` exposés par Paramètres et réutilisés dans les listes Employés / Utilisateurs, organigramme et sélection des managers. Libellés et responsabilités restent fixes. Recherche Tags dans la top bar, sans filtres / tri / regroupements des comptes ; changement d’onglet efface la recherche textuelle du contexte précédent. Repli sur les teintes initiales au chargement ; si lecture impossible, erreur technique loggée et survol explicite sur les tags, erreur visible avec Réessayer dans les réglages.


Sélecteur de couleurs partagé — 7 octobre 2026 : `HTonePicker` propose 24 pastilles (six tons sémantiques Horizon et dix-huit couleurs hexadécimales supplémentaires), puis une pastille ronde « + » ouvrant le choix natif d’une couleur personnalisée. Survol nommé, groupe radio clavier, anneau de sélection et focus visible ; palette repliée sur plusieurs lignes selon la largeur disponible. La pastille personnalisée conserve son indicateur si la couleur choisie est hors palette. Même composant pour tags utilisateurs, responsabilités, étapes CRM et types de marché. Les couleurs supplémentaires utilisent le champ `color` existant, sans nouvelle valeur métier ni migration.


Popup Séquence — 7 octobre 2026 : formulaire défilant partagé `dialog-form`, pied fixe `HDialogFooter` et sauvegarde associée par identifiant de formulaire. Deux sections compactes `HSectionHeading` : Compteur (départ / prochaine valeur, deux colonnes) et Format du numéro (préfixe / nombre de chiffres / suffixe, trois colonnes). Champs empilés sur petit écran. Aperçu dynamique du prochain numéro sur fond neutre discret, valeur tabulaire alignée à droite. Indication de verrouillage sous les compteurs si séquence déjà utilisée. Aucun changement des règles de numérotation, du serveur ou des permissions.


Actualisation — 7 octobre 2026 : aucun bouton refresh permanent dans les listes, paramètres ou fils déjà mis à jour après mutation / retour au focus. Retirés dans Employés, Utilisateurs et accès, Séquences et `ActivityPanel` partagé (Contacts et CRM). Le fil conserve son actualisation automatique de 30 secondes et après publication / modification. Les caches restent invalidés après les sauvegardes. Seules les actions de récupération d’erreur Réessayer restent visibles lorsque nécessaires, dont la navigation des fiches Contacts. Ne pas réintroduire un refresh sans besoin concret d’une opération métier distincte.


Employés / Équipes harmonisés — 7 octobre 2026 : un seul `HPageHeader` au-dessus des onglets ; action primaire contextuelle au même emplacement (Nouvel employé / Nouvelle équipe), selon les permissions. Aucun titre ou sous-titre Équipes répété sous les onglets. Chaque onglet commence par la même barre compacte de résultats (`hr-view-toolbar`) avant le tableau : ressources / responsabilités et choix de vue pour Employés ; nombre d’équipes filtrées pour Équipes. Éditeur piloté par la page, mêmes composants de popup et actions existantes ; recherche / filtres restent dans la top bar. Principe Horizon : action de création au niveau de l’en-tête de page, pas une seconde en-tête spécifique dans un onglet.


Listes métier — 7 octobre 2026 : Employés et Équipes réutilisent `HDataTable`, le composant de Contacts, avec les mêmes fonds alternés, en-tête, densité, survol et focus. Les règles de présentation auparavant limitées à `.contact-directory` sont centralisées dans le tableau partagé. Une ligne ouvre une fiche sur toute sa surface : lien natif pour une navigation, bouton natif transparent pour un popup (`getRowAction`), utilisable au clavier. Aucun bouton sur le nom ni engrenage en fin de ligne pour ouvrir une fiche. Les actions internes éventuelles restent prioritaires. Les réglages de paramètres conservent leurs engrenages, dont l’action est précisément de configurer. Équipes : consultation également disponible en lecture seule, aucun champ / action d’écriture sans permission de gestion. Ne pas créer un tableau métier parallèle pour ce même usage.


Avatars sans photo — 7 octobre 2026 : fond rose Horizon identique aux boutons primaires (`--color-horizon-magenta`) et initiales / pictogramme blancs. Règle CSS commune pour Employés, équipes, organigramme, Utilisateurs et accès, menu utilisateur, personnes Contacts, responsable CRM et auteurs du fil. Les photos prennent la place du fallback ; badge logo société conservé sur les contacts. Les placeholders des logos de sociétés et les événements système du fil gardent leur rôle visuel propre. Même couleur en Light / Dark, sans couleur de responsabilité codée dans l’avatar.


Champs obligatoires — 7 octobre 2026 : utiliser `HFieldLabel` dans le label natif, avec `required`, pour afficher un seul astérisque à côté du libellé, dans le rose des actions primaires (`--color-horizon-magenta`). Aucun astérisque écrit directement dans une chaîne de libellé. Les champs facultatifs restent sans marque ; les obligations conditionnelles suivent la validation du formulaire (adresse postale, mot de passe initial). Ne pas rendre obligatoires séparément prénom et nom d’un contact quand la règle permet l’un ou l’autre. La marque est masquée aux lecteurs d’écran ; l’obligation est exposée par `required` ou `aria-required` sur le contrôle, y compris les combobox partagées. Réutiliser ce composant dans les prochains modules.


## AO et calendrier partagé — 7 octobre 2026

Le volet AO réutilise les cartes / colonnes CRM, `HDataTable`, `HRecordTabs`, `HSectionHeading`, les formulaires / dialogues et les filtres de la top bar. Ne pas recréer de recherche locale. Les tags de filtre personnalisés utilisent le ton / la couleur du référentiel avec le rendu commun `h-tone` ; Contacts conserve ses couleurs Client / Fournisseur.

`BusinessCalendar` centralise semaine, mois, trimestre et année pour AO et Calendrier. `HZonedDateInput` affiche une heure locale avec fuseau et stocke un instant UTC, refuse les heures inexistantes lors d’un changement d’heure. `ActivityFileLink` centralise l’ouverture des fichiers protégés du fil et des dépôts AO. Les dépôts sont présentés en historique immutable, les visites / soutenances dans un tableau commun ouvrant l’éditeur au clic de ligne.


## Créer / ouvrir une fiche depuis un sélecteur — 8 octobre 2026

Pattern transversal validé : action `+ Créer une société / un contact / un produit…` dans le menu d’un sélecteur de fiches ; action compacte flèche sortante à droite d’une fiche sélectionnée. Recherche préparée comme valeur initiale, jamais comme création automatique. Absence de résultat ≠ absence de fiche (archives, filtres, permissions) ; aucun bouton de création pendant chargement / erreur ou sans droits. La création reste aussi disponible quand des résultats existent. Les sélecteurs de valeurs structurelles / étapes fixes ne proposent pas d’ajout libre.

Une grande fenêtre commune réutilise **le formulaire de la page classique**, ses sections, validations et permissions. La page d’origine reste montée ; son URL, ses filtres et son brouillon ne changent pas. Enregistrer persiste la fiche liée, ferme la fenêtre et sélectionne le résultat créé ; une modification recharge les libellés / données du sélecteur. La croix de fermeture / Échap sans changements revient sans modifier la sélection ; avec changements, confirmation Abandonner / Continuer la saisie. Mutation en cours : fermeture bloquée. La nouvelle fiche existe dès son enregistrement, même si le brouillon d’origine est ensuite abandonné.

Même mécanisme pour les créations imbriquées, avec retour à la fiche précédente sans perdre sa saisie. Une consultation autorisée reste accessible en lecture seule, sans boutons d’écriture. Liens natifs vers les fiches conservés pour l’ouverture volontaire dans un autre onglet ; clic normal ouvre le popup. Retour du focus à la combobox ou à l’icône d’ouverture, navigation clavier contenue dans la fenêtre active. Identifiants de champs / formulaires distincts, pas de modification du breadcrumb de la page derrière la fenêtre.

Composants : `HRecordPicker`, `RecordWorkspace`, `HDialog` et mêmes éditeurs métier. Premier raccordement Contacts / CRM ; futurs sélecteurs Produits et autres entités réutilisent cette infrastructure quand leur formulaire est disponible. Aucun stockage de brouillon ni maintien de popup après rechargement promis : le refresh suit la règle habituelle de la fiche. Présentation commune claire / sombre, grande fenêtre défilante, actions de sauvegarde visibles et responsive.

Popup de fiche — ajustement du 8 octobre 2026 : largeur maximale commune de 1 440 px, limitée à l’espace de travail à droite de la sidebar avec 32 px de marge de chaque côté (16 px sur mobile), y compris verticalement. Le centrage horizontal suit cet espace, jamais l’écran entier. Le token partagé `--workspace-sidebar-width` pilote à la fois la grille du layout et les dialogues rendus en portal : 216 px déployée, 64 px repliée ou sur mobile, 0 px hors workspace. Les dialogues et confirmations communs utilisent aussi ce centrage et cette largeur disponible ; le voile modal conserve sa portée habituelle. Une seule action de fermeture, la croix de l’en-tête ; aucun bouton Fermer répété dans la fiche. Le contenu reste le même `ContactPage / ContactEditor` que la page classique : les évolutions de champs, sections et styles communs se propagent aux deux présentations.

Alignement des sélecteurs — 8 octobre 2026 : `HCombobox` centre verticalement ses actions, réserve des emplacements fixes pour Effacer puis le chevron et intègre l’ouverture de fiche dans le même cadre, à droite d’un séparateur fin. Hauteur totale de 34 px conservée, texte tronqué sans chevauchement des actions, focus bleu discret pour le groupe avec ouverture de fiche. Règles partagées, y compris en consultation seule et sur mobile.

Action de création des sélecteurs — 8 octobre 2026 : pied compact sur fond neutre léger, séparateur fin, icône Plus 14 px dans une pastille carrée de 22 px rose atténué et libellé Inter 12 px. La recherche préparée apparaît en texte secondaire de 11 px, tronqué si nécessaire ; la ligne peut se réorganiser sur écran étroit. Style unique pour société, contact et futurs adaptateurs.

Identité de fiche CRM — 8 octobre 2026 : le badge à côté du titre affiche l’étape commerciale enregistrée, avec son libellé et sa couleur du référentiel, via `HTag`, comme en liste / Kanban. L’état serveur agrégé (`open` pour Nouveau et Qualifié) reste un critère métier interne. Il n’est affiché ni dans l’en-tête de fiche ni dans une colonne État des listes CRM / AO : seule l’Étape commerciale et son tag coloré sont présentés, avec la Préparation distincte dans le volet AO. Archivage présenté séparément par Archivée.

Harmonisation de la fiche Opportunité — 8 octobre 2026 : les groupes de champs sans label natif utilisent `.h-form-field` dans la grille commune, avec exactement le même Inter 11 px / interligne 16 px et écart label–contrôle de 5 px que les labels Contacts. Types de marché et Tags AO suivent cette règle au lieu de titres locaux à 13 px. Titres de section inchangés via `HSectionHeading` (13 px / 18 px, icône 14 px) ; Description utilise aussi son emplacement de sous-titre. Marge estimée alignée avec les champs et sections AO espacées comme les autres panneaux CRM.

Focus des sélecteurs liés — 8 octobre 2026 : un seul indicateur sur le cadre commun via `:has(:focus-visible)`. Aucun outline additionnel autour de l’icône d’ouverture ou d’effacement ; le clic souris seul ne colore pas le groupe. Le retour du focus après popup reste conservé et la navigation clavier garde une bordure bleue discrète, y compris en consultation seule.

Audit du focus partagé — 8 octobre 2026 : la recherche top bar accentue son cadre uniquement pour la saisie au clavier, pas pour ses boutons Filtres / périmètre. Le rédacteur du fil et l’éditeur riche accentuent leur cadre uniquement pendant la saisie, laissant les actions de toolbar avec leur repère propre. Le lien de carte CRM porte un seul outline sur la surface de carte via son pseudo-élément, aucun second autour du texte. Joindre expose le focus du fichier sur son label uniquement au clavier. Les contours de sélection, états métier et zones de dépôt restent indépendants du focus.

Conversion Directe / AO — 8 octobre 2026 : Type d’opportunité reste modifiable sur une fiche active avec droit d’écriture CRM. Le changement est un brouillon jusqu’à Enregistrer ; une indication discrète explique la création, l’archivage ou la réactivation du dossier AO. En directe, onglet et badge AO masqués, historique du fil conservé. Revenir en AO reprend les champs, visites et dépôts existants sans deuxième formulaire ni nouvelle affaire. Consultation seule / fiche archivée : changement interdit.

Finitions des popups — 8 octobre 2026 : marges internes de 24 px (12 px sur mobile). Le conteneur `record-workspace-body` fournit son propre `--workspace-content-gutter` au fil partagé : compensation des marges jusqu’aux bords gauche / droit du popup, aucune bande blanche latérale ou en pied du fil. Les repères de focus génériques et des sélecteurs liés utilisent `--theme-focus-ring` bleu (#7189ab en clair, #8caada en sombre), à la place des contours roses persistants. Focus clavier et restitution du focus conservés ; couleurs métier / sélections indépendantes.

AO — 8 octobre 2026 : le volet affiche les dossiers, y compris À analyser / No go sans affaire. Référence AO sur les cartes et dans la première colonne ; aucun faux numéro commercial. Formulaire canonique `OpportunityEditor` commun aux routes opportunité et dossier AO, avec étape commerciale / analytique visibles seulement après liaison. Liste dédiée, tags communs, préparation modifiable inline avec permissions et contrôle de version, ouverture par la ligne, sans colonne d’action. Planning par dossier via la variante timeline de `BusinessCalendar` ; mêmes périodes, dates, filtres et calendrier général, publication → remise et jalons multiples. Libellés / survols accessibles, surfaces neutres clair / sombre, label fixe et défilement horizontal limité à la timeline sur mobile. Recherche, tri et regroupement restent dans la top bar partagée.

Rendez-vous AO — 8 octobre 2026 : popup compact à deux colonnes pour type / état et date-heure / fuseau ; lieu, participants et notes en pleine largeur, champs empilés sur mobile. Aucun champ ni colonne Fin. Les anciennes fins restent stockées ; changer la date du rendez-vous efface sa fin legacy pour éviter une validation cachée. Date seule dans la liste, heure conservée dans la fiche et le calendrier. Sélections structurelles sans croix d’effacement ; astérisques, contrôles et pied partagés.

Sauvegarde des fiches — 8 octobre 2026 : conserver l’onglet actif après création, modification et actualisation des données sauvegardées. `useRecordSection`, partagé dans `shared/records`, porte la sélection dans la page, hors de l’éditeur remonté à chaque nouvelle version ; Contacts / CRM / AO le réutilisent. Une autre identité de fiche retrouve son onglet initial. La création transmet la section active vers la fiche enregistrée. Les fiches Contacts embarquées suivent le même principe, sans modifier la navigation de la page derrière le popup ; la fermeture après sauvegarde du sélecteur lié conserve son contrat existant. Une erreur de validation peut toujours ouvrir la section contenant le champ à corriger.

Échéances visuelles — 8 octobre 2026 : `HDeadline` partagé associe un drapeau, un libellé explicite et une date en chiffres tabulaires. Remise AO : date colorée précédée d’un petit calendrier, sans fond dans les cartes (`HDeadline variant="text"`), bloc dédié en tête du dossier avec date mise en avant et contrôle date-heure adjacent ; empilement sur mobile. Vert par défaut, ambre entre 48 heures et 7 jours, rouge dans les 48 dernières heures et pour une date passée, avec explication au survol. La date de remise se place en bas à droite des cartes, les marchés sous le titre et le tag AO en bas à gauche ; aucune probabilité en pourcentage sur les cartes, directes ou AO. Ces repères décrivent la date et ne déclarent ni retard métier ni changement de statut ; horaires / fuseaux conservés côté données, dates seules sur les cartes. Tons et fonds issus des tokens clair / sombre, accents concentrés sur les informations importantes ; éviter de colorer l’ensemble des champs. Réutiliser ce composant pour les échéances des prochains modules.

Démarrage / restauration de session — 8 octobre 2026 : aucun texte visible « Vérification de votre session ». `HLoadingIndicator` partagé remplace le texte de bootstrap : anneau discret après 200 ms uniquement si l’attente se prolonge, libellé accessible via `role=status` / `aria-label`. L’application attend toujours la restauration de session avant d’afficher une page protégée.

Actions supérieures des fiches — 8 octobre 2026 : `HRecordPageActions` place les actions Contacts / CRM / AO dans l’emplacement commun du breadcrumb, avant le compteur et les flèches. Boutons de 28 px dans cette barre, conservés au défilement. Sur mobile, le fil d’Ariane et les actions occupent deux lignes pour éviter tout chevauchement. Les fiches embarquées gardent leurs actions dans le popup grâce à un contexte isolé ; aucun bouton ne remplace celui de la page derrière. `HSaveButton` ajoute le pictogramme Enregistrer et utilise la taille compacte par défaut dans tous les formulaires, en conservant les états neutre / modifié / en cours et les droits existants. Les futurs écrans de fiche réutilisent ces composants plutôt qu’une barre locale.

Création depuis les listes — 8 octobre 2026 : les actions Nouvelle société / Nouveau contact / Nouvelle opportunité / Nouvel AO / Nouvel employé / Nouvelle équipe / Nouvel utilisateur utilisent le même emplacement sticky que la sauvegarde des fiches. `HPageHeader` y place ses actions par défaut via `HRecordPageActions` ; une information de titre comme la date du dashboard reste inline. Le groupe d’actions est décalé de 8 px vers la gauche pour ménager un espace avant la navigation et le bord, règle partagée avec Enregistrer et l’engrenage. Droits et destinations inchangés.

Présentation du dossier AO — 8 octobre 2026 : références, préparation, lien, tags et visite obligatoire regroupés à gauche ; calendrier de largeur maîtrisée à droite, séparé par un trait discret. Remise dans un bloc compact, date colorée et saisie adjacente verticalement ; publication et résultat attendu alignés en dessous, puis fuseau. Suppression du bandeau pleine largeur et du sous-titre technique. Champs et titres utilisent les composants et tailles partagés. À moins de 900 px les deux zones s’empilent ; contrôles de préparation / fuseau sans effacement, permissions et données inchangées.

Visite obligatoire — 8 octobre 2026 : contrôle déplacé dans l’en-tête Visites et soutenances, visible dès la création du dossier. Case et pictogramme de lieu dans une pastille discrète, accent ambre lorsqu’activée ; même contrôle désactivé en consultation. Modifie le brouillon AO et se sauvegarde avec Enregistrer en haut de la fiche. La planification des rendez-vous attend toujours la première sauvegarde et ne modifie pas implicitement cette obligation. En-tête réparti sur plusieurs lignes sur mobile.

Simplification du dossier AO — 8 octobre 2026 : retirer le champ Tags AO du formulaire. Visite obligatoire reprend sa place sous le lien de consultation, sous forme de case à cocher standard avec libellé aligné, sans cadre, fond ni présentation de bouton. Aucun doublon dans l’en-tête Visites et soutenances. Cette décision remplace le déplacement précédent de cette option. Les types de marché communs restent dans Informations ; les données historiques de tags restent conservées.

Paramètres CRM / Tags rendez-vous — 8 octobre 2026 : remplace Tags AO. Visite et Soutenance sont des types fixes ; leurs couleurs sont réglables avec le dialogue couleur partagé des tags utilisateurs (24 teintes et couleur personnalisée). Aperçu dans les paramètres et mêmes couleurs dans le tableau Visites et soutenances. Pas d’ajout / suppression de types, ni d’impact sur la logique métier ; Admin / Superuser uniquement en écriture.

Devis / liens CRM — 8 octobre 2026 : HRecordLinks au centre du breadcrumb, compteur de tous les devis de l’affaire ; un seul devis ouvre directement sa fiche, zéro ou plusieurs ouvrent la liste filtrée, création depuis l’opportunité enregistrée et liste filtrée avec contexte URL. HPageHeader / HRecordPageActions pour les actions supérieures ; HRecordActions accepte aussi des actions métier explicites (annuler un devis). Fiche dense de brouillon, Informations puis tableau pleine largeur de lignes libres, montant HT sous les lignes, notes ; aucun total dans une sidebar. Quantité, unité, prix HT, total et suppression de ligne ; défilement horizontal contenu au tableau sur mobile. Ventes reprend SearchFilters / GroupedResults communs ; pas de deuxième recherche dans la page. Montants avec deux décimales et symbole commun.


Devis S02 — 8 octobre 2026 : grille dense à colonnes fixées par Paramètres → Ventes ; aucun redimensionnement qui déborde du tableau sur mobile. Ordre # / Description / Marque / Référence / Qté / Unité / Coût / PUV / Remise % / PTV / Commande / Actions. Description textarea auto-adaptée, retour à la ligne sans troncature, titres niveau 1 légèrement accentués sur fond neutre, titres niveau 2 en retrait, notes en texte secondaire. Menu discret de ligne pour duplication / montée / descente / option / affichage de total / suppression. HRecordConfirmation réutilisé et propagation du submit arrêtée pour ne jamais enregistrer le formulaire parent depuis un dialogue. Numérotation des positions continue, sections et notes comprises. Total HT puis Options HT immédiatement sous la grille. ActivityPanel standard sous la fiche et flèche d’inspection HRecordPicker ouvrant la véritable fiche CRM en popup ; aucun bouton Retour à la liste redondant avec le fil d’Ariane. Tous les identifiants de formulaire CRM sont propres à l’instance embarquée.

Devis S03 — 8 octobre 2026 : grille pleine largeur, Description absorbe l’espace disponible avec une largeur minimale paramétrée ; les autres colonnes conservent leurs largeurs configurées. Cellules centrées verticalement, saisies monétaires alignées à droite sans espace réservé à des spinners masqués. Ordre final Commande / Option / Actions : option par case dédiée, duplication et suppression par pictogrammes directs avec texte au survol ; confirmation partagée conservée. Ajouts article / titre 1 / titre 2 / note sous la dernière ligne. Déplacement par poignée dans # avec dnd-kit déjà présent, souris / tactile / clavier, aperçu compact et animation respectant la préférence de réduction du mouvement ; aucune flèche de montée / descente. Le total de section s’affiche via Sigma dans la description. Cette règle remplace le menu de ligne S02.

Devis S04 — grille sans panneau extérieur imbriqué, pleine largeur du contenu. En-têtes et cellules numériques centrés, description alignée à gauche et centrée verticalement ; séparateurs verticaux fins, boutons Actions sur le même axe. Hauteur minimale 32 px contre 40 auparavant (−20 %), saisies 26 px dans cette grille dense ; descriptions longues s’étendent pour rester lisibles. Sections / sous-sections sur gris plus foncé que les lignes alternées, avec Sigma au bout de la seule colonne Description. Poignées d’en-tête redimensionnables à la souris / au tactile et au clavier gauche / droite, préférences locales par utilisateur ; Paramètres Ventes fixe les valeurs communes par défaut. Marge % ajoutée après PUV, avant Remise. Totaux HT / TVA avec taux éditable / TTC puis options HT ; toutes les valeurs monétaires utilisent le format partagé.

Devis S05 : titres niveau 1 navy gras sur blanc avec trait inférieur magenta, niveau 2 sur rose discret, niveau 3 sur gris neutre, reprenant la référence utilisateur dans la palette Horizon. Champs de toutes les cellules sans cadre permanent, bordure au survol / focus ; identique pour Description et données. Colonnes ajustées à la largeur utile sur desktop (minimum lisible 911 px), redimensionnement compensé d’abord sur les colonnes suivantes puis précédentes, sans expansion du tableau ; petit écran avec scroll interne. En-têtes sticky sous top bar / breadcrumb sur desktop. Résumé aligné à droite HT / TVA non éditable / TTC mis en évidence / options ; pas de panneau supplémentaire. Chevrons pour le repli des sections, totaux inchangés. Paramètres Ventes présenté comme Devis, URL historique conservée.

Devis S06 — valeurs Coût / PUV / PTV alignées à droite, en-têtes centrés et navy ; Marge entre Coût et PUV. Titres des trois niveaux de 11 px, texte sur le même axe ; lignes ordinaires et niveau 3 sur blanc en clair (surface du thème en sombre), niveau 2 rose discret conservé. Sigma placé juste avant la cellule du sous-total de section. Montants HT / TVA / TTC / options à 13 px, couleurs conservées. Notes utilise HSectionHeading avec pictogramme et chevron, fermé initialement ; replier conserve les données et reste disponible en lecture seule.

Devis S07 : saisie compacte Remise globale (%) dans le résumé sous la grille, montant de remise adjacent et HT avant remise affiché lorsque le taux est positif. Les totaux HT / TVA / TTC et options conservent leur style. Sous un séparateur discret : Total achats HT, Marge globale HT et Marge sur coût (%), chiffres à deux décimales et mêmes axes / tailles. En lecture seule, saisie désactivée ; aucune nouvelle boîte latérale.

Devis S08 : Remise globale ajoutée par bouton dans les totaux ; achats / marge / taux sans gras. Notes séparées du bloc CGV / totaux par 48 px, en-tête compact de 24 px avec titre et chevron sur le même axe. En-tête Description aligné à gauche. Action de repli global dans le titre Lignes du devis ; dialogue canonique pour duplication titre seul / titre et contenu. Annuler par pictogramme Undo avant Enregistrer, désactivé sans modifications ou pendant sauvegarde, restaure les valeurs initiales sans mutation serveur.

Devis S09 : repli global par pictogramme au début de l’en-tête Description ; Marque / Référence alignés à gauche ; Sigma dans la cellule PTV, à gauche du montant et aligné verticalement. Unités en combobox compacte : code dans la cellule, code et libellé dans les options via displayLabel partagé. Pied de devis en deux colonnes : CGV à gauche et texte sur la hauteur du résumé, totaux légèrement décalés à gauche ; empilement sur mobile. Espace de 48 px après les actions d’ajout. Les boutons de titre préfigurent leur niveau : gras et trait magenta pour le niveau 1, fond rose discret pour le niveau 2, fond gris neutre et semi-gras pour le niveau 3 (bouton et ligne du devis) ; Note en italique comme ses lignes. Remise élargie et choix % / symbole devise. Dialogue de duplication canonique, deux choix avec pictogrammes centrés, fermeture par X ; duplication sans autofocus dans les champs copiés, retour sur son bouton déclencheur. Ajout d’article / titre / note : focus immédiatement dans la description via React Hook Form, avec ouverture des seuls titres repliés contenant la nouvelle ligne. Onglet CGV conservé après sauvegarde des paramètres par URL.

Devis : les titres des trois niveaux utilisent une cellule par colonne, sans fusion de Marque à Remise, pour conserver les séparateurs verticaux et leur alignement avec les articles. Les notes gardent leur cellule fusionnée.

Popup CGV : HDialog de 720 px centré dans le workspace, corps dialog-form avec légendes et champs sur le même axe, astérisques Horizon, texte de hauteur adaptée au viewport et compteur discret, disponibilité séparée par un trait. Pied partagé fixe avec action compacte et pictogramme ; fermeture par X. Les champs h-form-field dans dialog-form utilisent une règle commune, pas une mise en page inline improvisée.

Paramètres / Valeurs par défaut Devis : grille de champs partagée avec Contacts (`contact-fields`), légendes `HFieldLabel` au-dessus des contrôles, deux colonnes puis une sur mobile. Aucun sélecteur de layout Paramètres ne doit surcharger la typographie de HSectionHeading (13 px / 18 px, graisse 600) ; les anciens titres de rubrique restent ciblés par leurs conteneurs explicites.

Devis S10 : légère marge à gauche de Marque / Référence, unité affichée u. et chevron compact. Symboles devise sous Coût / PUV / PTV, % sous Marge / Remise. Saisie monétaire avec devise dans le texte, sans gouttière de pictogramme, virgule et séparateurs français acceptés. Remise globale : bouton d’ajout et ligne de saisie au même emplacement, juste sous Total HT, dès l’ajout et après rechargement ; libellé / corbeille et deux contrôles montant / % sur la même ligne, même hauteur et axe vertical, symboles dans les champs ; suppression retire la remise du brouillon. Option disponible sur les titres et propagée à tout leur contenu. Aucun marquage ni mention Options sur un titre parent non optionnel ; le titre optionnel affiche uniquement son montant entre parenthèses, sur une seule ligne (pas de 0 ni de libellé Options supplémentaire). Le total Options HT général est conservé.

CRM — Vue de départ : troisième choix « Dernier état », même présentation que Kanban / Liste. Reprise de la dernière bascule Kanban / Liste par utilisateur et navigateur ; Planning AO ne remplace pas cette préférence. Les deux choix fixes restent appliqués à chaque ouverture sans paramètre de vue explicite.

Studio Documents — cadrage : blocs paginés avec réglage précis au pixel des champs / blocs dans leur zone ; X / Y, dimensions et espacements visibles dans les propriétés. Pendant le déplacement ou le redimensionnement, surligner les valeurs qui changent et afficher les deltas / guides d’alignement. Coordonnées indépendantes du zoom, sans chevauchement du tableau dynamique avec les blocs suivants.

Studio Documents — titres : propriétés visuelles dédiées pour le titre de pièce et les niveaux 1 / 2 / 3, avec styles homogènes du modèle (typographie, casse, couleurs, fond, bordures, alignement, espacements). Ces styles pilotent aussi les sections du tableau dynamique de devis, sans modifier les données source.


D01 — studio : propriétés Page / Bloc / Titres dans un panneau compact, bibliothèque et page imprimable au centre ; actions Enregistrer / Aperçu / Publier / Archive dans le bandeau du fil d’Ariane. X et espace avant relatifs au flux pour le corps ; X / Y absolus locaux dans les zones répétées. Drag avec valeurs surlignées, deltas et repères de bord ; flèches pour ajuster au pixel. Le papier reste blanc en thème sombre, les panneaux utilisent les tokens sémantiques. Les aperçus utilisent HDialog centré dans l’espace de travail, un selecteur partagé et RecordWorkspace pour consulter le devis source.

D02 — studio : les blocs d’une même ligne gardent leurs X / Y locaux et une hauteur issue du plus grand contenu, sans positionnement absolu global. « Disposition » est accessible avant les dimensions ; largeur répartie au premier regroupement puis ajustable. Propriétés de logo : zone d’import visible, aperçu et pictogramme de retrait. Champs : provenance lisible puis nom du champ, libellé préfixe facultatif. Tableau : source, choix des colonnes et ordre visible dans la liste compacte, largeurs en %. Zoom par boutons − / + autour du pourcentage ; typographie par pictogrammes avec survol texte et état pressé. Les polices documentaires supplémentaires s’appliquent au papier uniquement, sans changer les typographies de l’interface Horizon.

D03 — studio : ruban compact HPageHeader avec titre / nom du modèle / état sur une ligne, actions dans le fil d’Ariane ; l’accessoire facultatif du titre reste fourni par HPageHeader. Zoom − / % / + et Adapter dans le cadre d’édition, bibliothèque à icônes neutres, papier blanc. Barre de sélection navy avec poignée et croix, poignée de taille au coin ; repère violet de changement d’ordre. Ancrages à survol texte et état pressé, déplacement manuel libérant l’ancrage. Une seule barre de gras / italique sur un texte enrichi, avec rendu visible dans la feuille. Titres de texte / tableau raccordés aux trois styles du modèle, couleurs et tailles respectées dans l’HTML. Duplication sous la ligne source sans déplacer ses voisins sur une autre ligne.

D04 — studio : remplace la barre navy D03 par une petite barre blanche (poignée / dupliquer / retirer) et huit points de redimensionnement violets, avec une cible de 18 px écran indépendante du zoom. Le bloc se déplace aussi directement ; les valeurs restent surlignées pendant le geste. Propriétés Zone / Disposition côte à côte, dimensions sur une ligne et police / taille / couleurs sur une ligne. Texte : unique barre Tiptap, sélecteur Texte / H1 / H2 / H3, commandes gardant la sélection. La bibliothèque expose Tableau, Champ lié et Texte, sans raccourci métier Totaux / CGV ; aucun faux titre de section dans le tableau de la feuille. La hauteur du tableau et les vrais titres viennent de la source sélectionnée pour l’aperçu. Import d’image et verrou de proportions explicites.

D05 — studio : séparateurs discrets mais visibles entre les panneaux, cibles de 8 px, focus clavier et indication de glisser / réinitialiser. Les largeurs sont bornées pour garder 280 px de canevas ; adaptation au redimensionnement de l’écran, panneau de propriétés sous la feuille sur écran étroit. Propriétés regroupées avec HSectionHeading, controls alignés et outils regroupés style / alignement. Un seul niveau de titre est édité à la fois. Contenu texte avant apparence, éditeur compact grandissant avec le contenu (36–240 px). Fonds sur une couche distincte : l’opacité ne décolore ni le texte ni les outils. Papier blanc conservé en thème sombre, couleurs des panneaux via tokens.

D06 — studio : Bibliothèque et Blocs deviennent deux groupes repliables distincts. À droite, Mise en page / Fond de page / Disposition / Position et dimensions / Contenu / Valeur liée / Données du tableau / Apparence suivent le même composant de section, avec chevron, titre 13 px et séparateur fin. Le repli garde les champs montés et leur brouillon ; état conservé localement. Curseur d’opacité fin à poignée blanche bordée, valeur numérique discrète à droite, clavier natif conservé. Les couleurs utilisent le contrôle partagé HColorField (petite pastille et code hexadécimal éditable), sans grands aplats de couleur ni nouveau popup.

D07 — studio : tous les groupes sont fermés à la première ouverture (nouvelle clé de préférence v2), puis le choix utilisateur est mémorisé. Onglets Page / Bloc uniquement ; les titres de sections sont propres à chaque tableau, dans « Titres des lignes », avec les trois niveaux de la source devis actuelle. Les futures sources déclareront leurs niveaux sans créer des blocs métier spécifiques. Dans Bloc, contenu / données précèdent Disposition, Position et dimensions, puis Apparence ; grille de dimensions à deux colonnes avec unités explicites. Nom du modèle centré dans le ruban ; statut complet, version publiée éventuelle / modifications non enregistrées, Publier et Archiver regroupés à droite. Enregistrer / Annuler / Aperçu restent dans le fil d’Ariane.

D08 — studio : les réglages de colonnes sont une grille compacte sur une ligne : case à cocher / nom éditable / largeur en % / monter et descendre. Colonnes inactives gardent les mêmes axes, actions désactivées et largeur vide ; aucun libellé répété au-dessus du champ. Source et explication concises, largeur totale affichée une fois en pied. Contrôles proches de cellules, 35 px par ligne, nombre lisible sans spinner. Ruban : nom éditable centré avec légende accessible, aspect de titre discret hors focus ; statut, version éventuelle et actions alignés. Le libellé redondant Devis est retiré sous le statut.

D09 — studio : Titres des lignes propose En-tête / Titre 1 / Titre 2 / Titre 3 sur le même axe. En-tête emploie les mêmes contrôles partagés de typographie, couleur et opacité ; indication concise renvoyant aux noms dans Données du tableau. Pas de second formulaire de libellés. Le style est visible sur les cellules th de la feuille et répété par thead dans le PDF.

D10 — studio : six choix dans Titres des lignes, grille de trois colonnes : En-tête / Ligne / Note puis Titre 1 / Titre 2 / Titre 3. Contrôles communs, styles indépendants. Notes en italique initialement ; nombres toujours alignés à droite. Le tableau vide ne simule pas de contenu métier pour montrer les notes, lesquelles sont visibles dans l’aperçu avec une source réelle.

Studio D11 : la liste Blocs reprend les pictogrammes de la bibliothèque et du titre des propriétés. Poignée de réordonnancement à droite, cible distincte de la sélection ; libellé tronqué avec texte complet au survol et zone en légende compacte. Mapping d’icônes unique dans le studio.

Studio D12 : un accent de sélection commun fondé sur les tokens violets Horizon pour la liste Blocs, l’identité des propriétés à droite et le contour / points de taille dans la feuille. Fond de sélection identique sur les panneaux, contenu du document conservé. Pictogrammes de sections centralisés dans StudioSection : bibliothèque, blocs, page, fond, valeur liée, disposition, position, contenu, tableau, titres et apparence ; icônes neutres hors sélection.

Studio D13 : aucun liseré sur la ligne sélectionnée de Blocs. La bibliothèque emploie le même fond / texte de sélection que les panneaux : survol / focus / déplacement avec le même accent. La bibliothèque ne reflète pas la sélection d’un bloc : ses boutons servent uniquement à ajouter. Les boutons restent des actions de création, pas des toggles.

Studio : zone imprimable matérialisée uniquement par quatre repères d’angle discrets, sans pointillés, suivant la marge en millimètres, le format et le zoom. Guides non interactifs réservés à la feuille d’édition, absents de l’aperçu HTML et du PDF.

Aperçu documentaire : fenêtre jusqu’à 1 600 px, limitée au workspace avec 32 px de marge par côté (16 px sur mobile). Une fois le document chargé, hauteur disponible moins 64 px (32 px mobile), cadre HTML / PDF occupant le reste sous les contrôles.

Studio — sections ouvertes : les enfants directs du panneau de propriétés ne rétrécissent pas quand leur contenu dépasse la hauteur disponible. Le panneau défile, les onglets restent accessibles et le titre / description / actions gardent leur hauteur naturelle, sans chevauchement.

Studio — dimensions : 210 mm au-dessus et 297 mm à droite du papier en gris discret, inversées en paysage ; légendes hors document et indépendantes du zoom. Aperçu : HTML généré automatiquement après sélection du devis / modèle, affiché sur des feuilles A4 paginées par Paged.js. Deux boutons explicites Aperçu HTML / Aperçu PDF ; le PDF montre la pagination réelle, sur demande. L’HTML reste utilisable sans service PDF configuré ; le PDF reste la référence finale, les deux moteurs pouvant fragmenter différemment.

Studio D14 : feuilles blanches séparées sur fond Horizon bleu-gris, ombre discrète et marge de 20 px entre pages ; tailles physiques A4 et coordonnées du modèle conservées. Anneau commun retardé pendant la pagination, feuille masquée jusqu’au rendu complet pour éviter un flash de contenu continu. L’aperçu PDF et le téléchargement restent accessibles dans la même barre.

Studio D15 : le cadre HTML reste visible pour son moteur de rendu pendant la pagination ; un voile opaque avec l’anneau partagé couvre le contenu incomplet. Après un échec, le cadre est vidé pour arrêter le moteur ; Aperçu HTML lance une nouvelle instance isolée, sans nouvelle génération PDF.

Studio D16 : la fenêtre d’aperçu garde sa grande hauteur dès l’ouverture, même sans document choisi. Zone d’attente bleu-gris avec indication de sélection ; génération avec anneau partagé. Zoom HTML dans la zone d’aperçu, − / pourcentage / + et Ajuster à la fenêtre ; la pagination et les dimensions imprimées ne changent pas avec le zoom. En haut à gauche de cette zone : A4, Portrait / Paysage, dimensions en mm et nombre de pages HTML. À droite : zoom et ajustement. Le compteur indique explicitement HTML dans la vue PDF, dont la pagination réelle reste indiquée par le lecteur. Sélecteurs limités à 340 px, actions alignées sur leurs 34 px ; téléchargement séparé à droite avec le bouton primaire Horizon. Les noms des fichiers se règlent dans un onglet de Paramètres → Modèles de pièces, tableau partagé et Enregistrer en haut à droite de la section.

Documents D17 : l’onglet Noms des PDF n’est pas répété comme titre de section. Description compacte / Enregistrer à droite, puis deux combobox partagées pour le format à compléter et le champ à insérer. Libellés avec provenance (Client, Opportunité, Pièce, Responsable, Interlocuteur). Le focus d’un format sélectionne ce format comme cible ; insertion au curseur et reprise immédiate de la saisie. Tableau et exemple restent partagés avec le reste des paramètres.


Modèles de pièces : état coloré via HBadge identique au studio (Brouillon / Publié / Archivé). Colonne Actions de la liste : Archiver pour les modèles actifs et poubelle pour les modèles jamais publiés, confirmation HDialog avec nom du modèle et bouton Supprimer, sans mot à recopier. Actions retirées du studio ; confirmation fermée et liste actualisée après réussite, erreur visible dans le popup en cas d’échec. Cliquer ou activer une icône au clavier n’ouvre pas la fiche.


Tableaux Paramètres : enveloppe partagée `HSettingsTable` pour les référentiels, CRM, séquences, utilisateurs, tags, devis, modèles et noms PDF. Bordures verticales de 1 px avec fallback clair, lignes de 36 px minimum et padding 4 × 12 px, boutons / champs de tableau à 28 px ; les contenus multilignes conservent leur hauteur nécessaire. En-têtes et cellules État / Actions centrés. Compteur commun sous le tableau, 11 px, aligné à droite avec retrait 12 px et libellé métier, issu des lignes réellement affichées. Aucun style de tableau spécifique au studio ; les tableaux métiers hors Paramètres gardent leur contrat.


Titres d’onglets : gras 700 pour les onglets actifs et inactifs, via les styles partagés (fiches, listes, paramètres, recherche d’images et filtres du fil). Même poids pour Page / Bloc dans le studio ; l’état sélectionné reste indiqué par sa couleur et son soulignement / fond, sans variation de poids.


Catalogue Produits — fiche compacte avec photo principale et recherche d’images partagée, identité et prix visibles dans Informations, onglets Achats / Logistique / Comptabilité et fil d’activité commun. Marque obligatoire avant la référence unique. Fournisseurs en tableau partagé à colonnes ajustables, favori visible et suppression confirmée. Coût et coefficient disposent d’un mode manuel ; marge calculée sur le prix de vente. La fiche en popup réutilise ProductPage et conserve ses actions dans la barre supérieure à droite.
