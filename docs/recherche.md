# Recherche — spécification d'implémentation

État du code, pas intention de design. Toute divergence entre ce document et
le code est un bug de l'un des deux.

Dernière mise à jour : itération « unification et raffinement ».

---

## 1. Points d'entrée

Il n'existe **qu'un seul** mécanisme de recherche : l'overlay. Tous les
déclencheurs ouvrent le même composant, dans le même état, avec la même
animation.

| Déclencheur | Où | Composant |
|---|---|---|
| Barre du hero | Page d'accueil | `components/BarreRechercheHome.tsx` |
| Loupe de la capsule | Barre de navigation, ≥ 640 px | `components/BoutonRechercheNavbar.tsx` |
| Cercle haut-droit | Navigation mobile, < 640 px | `BoutonRecherche` dans `components/mobile/NavigationMobile.tsx` |
| `⌘K` / `Ctrl+K` | Partout | `context/RechercheContext.tsx` |
| `/` | Partout, sauf focus dans un champ de saisie | idem |

### Règles communes à tous les déclencheurs

- `aria-haspopup="dialog"` et `aria-expanded` reflétant l'état.
- Le focus part sur le champ de l'overlay, **de façon synchrone** dans le
  gestionnaire de clic. Sur iOS, un `focus()` différé n'ouvre pas le clavier.
  C'est aussi pourquoi l'overlay reste monté en permanence : le champ doit
  déjà exister au moment du tap.
- À la fermeture, le focus **revient au déclencheur d'origine**. Si celui-ci a
  quitté le DOM (clic sur un résultat → navigation), la restitution est
  abandonnée silencieusement.
- L'overlay fermé porte `inert` : il sort du parcours de tabulation et des
  lecteurs d'écran. L'attribut est retiré à la main avant le `focus()`, le
  re-rendu React n'ayant pas encore eu lieu.

### Barre du hero — comportement

Ce n'est pas un champ de saisie. C'est un `<button>`.

- Aucun curseur, aucun clavier système : le tap déclenche l'ouverture.
- Un `<input readOnly>` a été écarté : il promet un curseur, et sur iOS ouvre
  parfois un clavier juste avant celui de l'overlay.
- Effet de pression : `scale(.985)` sur 140 ms, ombre réduite.

---

## 2. Barre du hero — dimensions

Le gabarit est celui du champ de l'overlay. Seuls le fond et l'ombre changent :
la barre flotte sur la page, le champ repose sur un panneau déjà blanc.

| | Barre du hero | Champ de l'overlay (mobile) |
|---|---|---|
| Hauteur | 48 px | 48 px |
| Rayon | 24 px | 24 px |
| Padding | `0 14px` | `0 14px` |
| Gap interne | 10 px | 10 px |
| Loupe | 21 × 21, trait 1,9 | 21 × 21, trait 1,9 |
| Texte | 16 px / 400, `rgba(0,0,0,.40)` | 16 px / 400, `rgba(0,0,0,.40)` |
| Largeur max | 576 px (`max-w-xl`) | `flex:1` |
| **Fond** | **`#FFFFFF`** | **`#F4F3F0`** |
| **Ombre** | **`0 2px 14px rgba(17,17,17,.10)`** | **aucune** |
| Survol | `0 4px 18px rgba(17,17,17,.12)` | — |
| Pression | `scale(.985)`, 140 ms | — |
| Curseur | aucun | barre 1,5 × 19 px |

Le placeholder est la **même chaîne** dans les deux cas
(`recherche.placeholder`).

---

## 3. Overlay — géométrie

Trois formats, aux paliers du document de design d'origine.

| | < 768 px | 768 – 1023 px | ≥ 1024 px |
|---|---|---|---|
| Position | `top: calc(56px + safe-area)`, `inset-inline: 12px` | `top: 76px`, centré | `top: 76px`, centré |
| Largeur | viewport − 24 | `min(700px, 100vw − 80)` | `min(880px, 100vw − 96)` |
| Rayon | 28 px | 24 px | 24 px |
| Ombre | `0 18px 50px rgba(17,17,17,.22)` | `0 24px 64px rgba(17,17,17,.20)` | idem |
| Hauteur max | `visualViewport.height − 56 − 12` | `min(620, vh − 124)` | `min(620, vh − 124)` |
| Origine | `88% -12px` (`12%` en RTL) | `50% -8px` | `50% -8px` |
| Poignée | 22 px, barre 36 × 4 | — | — |
| Fermeture | poignée, pastille ✕, voile, Échap, glissement | pastille ✕, voile, Échap | pastille ✕, voile, Échap |
| Colonnes | 1 | 1 | 2 — `320px 1fr` |

**Hauteur max mobile** : lue sur `visualViewport`, jamais sur une constante de
clavier. Le clavier rétrécit le viewport visuel, donc la formule du document
(844 − 56 − 258 − 12 = 518) en découle sans être écrite.

### Bouton de fermeture

Même dessin sur les trois formats — pastille circulaire de **36 px**, fond
`#F4F3F0` (celui du champ voisin), croix de 13 px, trait 2,
`rgba(17,17,17,.72)`. Survol `#E7E4DF`, pressé `#E0DCD5`.

Sur mobile la **cible tactile fait 44 px**, la pastille reste à 36 : l'écart
est absorbé par la boîte du bouton. Le mot « Fermer » qui occupait cette
place a disparu — il était relu à chaque ouverture sans rien apprendre, et
volait une trentaine de pixels au champ, qui passe de 245 à 275 px.

### Recherches récentes — chips (mobile / tablette)

Hauteur **36 px**, rayon 18, `ps-14 pe-4`, gap 6, texte 14 px. Les chips de
catégories restent à 44 px : l'historique est un raccourci, les rayons sont
la vraie porte d'entrée quand on n'a rien à retaper, et l'écart de hauteur
dit cette hiérarchie.

Les deux boutons internes conservent une hauteur de 44 px et débordent la
pastille par des marges négatives de 4 px : le dessin rétrécit, la cible
tactile non. Le débordement de 4 px de part et d'autre est exactement absorbé
par la gouttière de 8 px entre deux rangées de chips.

### Colonne gauche (desktop)

Récentes et catégories y sont des **lignes de 40 px**, pas des chips — le
défilement horizontal n'a pas de sens à la souris.

Un **filet de séparation** les sépare : `1px solid rgba(0,0,0,.07)`, 18 px de
marge au-dessus et de padding en dessous, même teinte que le séparateur de
colonnes. Sans lui, les deux blocs — mêmes lignes, même graisse — se lisaient
comme une seule liste dont le second titre passait pour un intitulé de plus.
Il disparaît en premier usage, où le bloc « récentes » n'existe pas.

### Voile

- Mobile : `rgba(17,17,17,.18)` + `backdrop-filter: blur(8px)`
- Desktop : `rgba(17,17,17,.12)` + `backdrop-filter: blur(5px)`
- Repli `@supports not (backdrop-filter)` : `rgba(251,250,248,.92)`, sans flou.

Le flou est porté par le **voile**, pas par le conteneur de page. Un
`filter: blur()` sur le conteneur créerait un contexte d'empilement et
repositionnerait les deux barres de navigation mobile, qui sont en
`position: fixed`. Le contenu de page ne reçoit que le recul `scale(.985)`.

### Gel de la page

`overflow: hidden` et `scrollbar-gutter: stable` sur `<html>`, `scrollTop`
mémorisé et restauré à la fermeture. `overscroll-behavior: contain` seul ne
suffit pas sur iOS Safari.

---

## 4. Rapprochement

- Insensible à la casse, aux **accents latins** et au **tashkîl arabe**.
- La normalisation préserve la longueur caractère par caractère : les index de
  correspondance restent valides sur le texte d'origine, ce qui permet de
  surligner la bonne portion accents compris. Filet de sécurité : si une
  normalisation change malgré tout la longueur, on retombe sur un simple
  passage en minuscules.
- Champ de recherche : `nom du produit + nom du rayon`. Le modèle produit n'a
  pas de champ « marque » ; le rayon en tient lieu.
- **Le filtre du catalogue applique la même règle** (`components/CatalogueClient.tsx`).
  Sans cela, l'overlay annoncerait des résultats que `/produits?q=…` ne
  montrerait pas.
- « Vouliez-vous dire » : distance de Levenshtein plafonnée — 1 faute tolérée
  jusqu'à 5 caractères, 2 au-delà. Aucune proposition en dessous du seuil.

Code : `lib/recherche.ts`, sans aucune dépendance serveur.

---

## 5. États

| État | Condition | Contenu |
|---|---|---|
| Vide | ouvert, historique non vide | récentes (3 chips mobile / 5 lignes desktop) + catégories + vitrine |
| Premier usage | ouvert, historique vide | idem sans récentes ; titre de vitrine « Nos best-sellers » |
| En saisie | ≥ 1 caractère, ≥ 1 résultat | suggestions (3 mobile / 8 desktop) + produits + chips rayons (max 4) |
| Aucun résultat | ≥ 1 caractère, 0 résultat | titre + aide + correction éventuelle + chips rayons. Desktop : panneau ramené à **une colonne**, hauteur auto |

**Vitrine** : la donnée de popularité n'existe pas. Les libellés « Populaires
cette semaine » et « Nos best-sellers » sont affichés au-dessus des **premiers
produits du catalogue**. À corriger — soit brancher un compteur de ventes
depuis les lignes de commande, soit renommer.

**Barre de chargement** : implémentée, jamais allumée. La recherche est locale
donc instantanée, et le retard de 150 ms la garde éteinte. Aucun délai
artificiel n'a été ajouté. Elle s'allumera si la recherche passe côté serveur.

---

## 6. Lignes produit dans l'overlay — variante B

Retenue après comparaison de trois variantes. Un seul gabarit partout dans
l'overlay : résultats de recherche **et** vitrine, mobile, tablette et
desktop. Le composant est `LigneProduit`.

Format en ligne, un produit par rangée, toute la rangée cliquable.

| | Mobile / tablette | Desktop |
|---|---|---|
| Padding | `8px 20px` | `8px 12px` |
| Gap | 12 px | 12 px |
| Image | 56 × 56, rayon 14 | 48 × 48, rayon 12 |
| Nom | 14,5 / 400, `line-height 1.3`, **2 lignes** max | idem |
| Prix | 15 / 600, **sous le nom**, gap 4 | 14,5 / 600, sous le nom |
| Coin de la rangée | droit | rayon 10 |
| Survol | `#F7F6F3` | `#F7F6F3` |
| Sélection clavier | — | `#F4F3F0` + barre 2 px |
| **Hauteur mesurée** | **76 px** (nom sur 2 lignes) · **72 px** (1 ligne) | **64 px** |

Le rayon du produit n'apparaît plus dans la ligne : il vit dans les chips de
la section « Catégories », juste sous les résultats.

**Padding vertical à 8 px et non 10.** À 10, la rangée à deux lignes montait à
80 px, ce qui faisait tomber le nombre de produits visibles au-dessus du
clavier de 3 à 2. Le plancher de 72 px vient de l'image de 56 px et de ses
marges, pas du texte.

### Pourquoi B

Les noms du catalogue sont longs — « Ruban Adhésif Antidérapant Réutilisable
12 pièces », « Apple AirPods Max – Casque sans fil à réduction de bruit
active ». Une colonne de prix à droite volait la largeur nécessaire et coupait
le nom avant le mot distinctif. Contrepartie assumée : les prix ne forment
plus une colonne alignée, la comparaison de tarifs est moins immédiate.

Les deux autres variantes, écartées : **A** (58 px, image 44, prix à droite)
plus dense mais tronque les noms ; **C** (84 px, image 60, tag rayon) plus
lisible visuellement mais tombe à 2 produits visibles.

### Place disponible — mesuré

Sur 390 × 844, clavier ouvert : panneau **518 px**, moins **84 px** de chrome
(poignée 22 + rangée du champ 60 + barre de chargement 2) = **434 px** de zone
de défilement. Avec trois suggestions de complétion au-dessus :

**3 produits entiers + un quatrième partiellement visible**, ce dernier
servant d'indice de défilement. Sans suggestion, 5 produits entiers.

### Vitrine

Même gabarit que les résultats — le défilement horizontal de vignettes de
118 px a disparu avec la variante B. Il ramenait la mise en page de la grille
du catalogue à l'endroit précis où l'on cherche au lieu de parcourir.
4 produits sur mobile, 6 sur tablette et desktop.

---

## 7. Navigation clavier (desktop)

- `↓` / `↑` : liste plate — suggestions puis résultats puis « Voir les N
  résultats ». Boucle aux extrémités. Le focus fait défiler sa colonne.
- `Entrée` : valide la sélection ; sans sélection, valide la requête brute.
- `⌘/Ctrl + Entrée` : ouvre le résultat dans un nouvel onglet.
- `Échap` : le premier efface le champ, le second ferme.
- Survol `#F7F6F3` ; sélection clavier `#F4F3F0` + barre de 2 px à l'intérieur
  du rayon. Le survol est neutralisé tant que la navigation clavier est
  active, et reprend la main au premier `mousemove`.
- `role="combobox"` sur le champ, `aria-activedescendant`, `role="listbox"` et
  `role="option"` sur les listes.

---

## 8. Glissement (mobile)

- Descente : suit le doigt au pixel. Montée : freinée à 0,25.
- Seuil de fermeture : 90 px de déplacement **ou** 0,5 px/ms de vélocité.
  En dessous, retour élastique.
- Le suivi vit dans une `ref`, pas dans un état : `pointerdown` et le premier
  `pointermove` peuvent tomber dans le même tick, avant re-rendu.
- Le tap sur la poignée ferme, mais le clic de fin de glissement est ignoré
  (déplacement < 4 px).

---

## 9. Points ouverts

1. **Vitrine mensongère** — « Populaires » / « best-sellers » sans donnée de popularité.
2. **Champ « marque »** — absent du modèle, remplacé par le rayon.
3. **Barre du catalogue** — `/produits` garde son champ de filtrage en place,
   qui n'ouvre pas l'overlay. Volontaire (il filtre la liste affichée, il ne
   cherche pas), mais à trancher.
4. **Paliers** — l'overlay bascule à 768 / 1024, la navigation du site à 640.
   Entre 640 et 768, navbar desktop et overlay mobile cohabitent.
5. **`prefers-reduced-motion`** — implémenté, jamais vérifié en conditions
   réelles.
