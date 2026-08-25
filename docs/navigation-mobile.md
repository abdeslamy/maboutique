# Navigation mobile — Variante B, version 2

État du code. Visible sous **640 px** (`sm:hidden`) ; au-delà, la barre de
navigation classique reprend la main.

Deux éléments flottants, `position: fixed`, `z-index: 20`.

---

## 1. Répartition des actions

| Action | Emplacement |
|---|---|
| Accueil | tab bar, 1ʳᵉ position |
| Panier | tab bar, 2ᵉ position |
| Recherche | tab bar, 3ᵉ position |
| Profil | tab bar, 4ᵉ position |
| Langue | cercle haut droit |
| Filtres | cercle haut droit |

---

## 2. Cercles du haut

| | Valeur |
|---|---|
| Diamètre | 36 px, rayon 18 |
| Gap | 7 px |
| Position | `top: calc(20px + safe-area)`, `inset-inline-end: max(20px, safe-area)` |
| Fond / ombre | `#fff` / `0 8px 26px rgba(17,17,17,.16)` |
| Icône langue | 29 px, trait 1,75 |
| Icône filtres | 28 px, trait 1,72 |
| Pressé | `opacity: .45`, 120 ms |

Icône filtres : trois traits horizontaux de largeurs décroissantes,
`M4.6 7.7 H19.4`, `M7.1 12 H16.9`, `M9.6 16.4 H14.4`, `stroke-linecap: round`.

En RTL, les deux cercles passent à gauche (`inset-inline-end`), l'ordre visuel
s'inverse.

---

## 3. Tab bar

| | Valeur |
|---|---|
| Largeur | **210 px**, intrinsèque — `4 × 42 + 3 × 6 + 2 × 12` |
| Hauteur | 38 px, rayon 19 |
| Disposition | `flex`, `gap: 6px`, `padding: 0 12px` |
| Item | 42 × 38 px |
| Icônes | 28 × 28 px |
| `bottom` | `calc(26px + safe-area)` |
| Centrage | `flex justify-center` sur un conteneur pleine largeur |
| Fond / ombre | `#fff` / `0 8px 26px rgba(17,17,17,.16)` |

Le centrage passe par `justify-content` et non par
`left:50%; translateX(-50%)` : résultat identique, sans transform — donc sans
contexte d'empilement ni flou de sous-pixel sur les icônes.

**L'onglet Recherche est un `<button>`, pas un `<Link>`** : il ouvre un
panneau, il ne mène pas à une page. Il porte `aria-haspopup="dialog"` et
`aria-expanded`. Les trois autres portent `aria-controls="contenu-principal"`.

---

## 4. Centrage optique des icônes

Chaque glyphe a un centre d'encre décalé dans son `viewBox 0 0 24 24`.

| Icône | Correction | Où |
|---|---|---|
| Accueil | `translateY(-0.25px)` | CSS, sur le `<svg>` |
| Panier | `translateY(-0.9px)` | CSS, sur le `<svg>` |
| Recherche | `translate(0.36,0.77) scale(1.03)` | `<g>` interne, unités viewBox |
| Profil | `translateY(-0.6px)` | CSS, sur le `<svg>` |

⚠️ Les corrections **en px sont calées sur des icônes de 28 px**. Changer la
taille des icônes invalide les trois offsets CSS (facteur 28/24 ≈ 1,167 à
appliquer). Celle de la loupe, exprimée en unités de viewBox, suit l'échelle
toute seule — c'est pour cette raison qu'elle n'est pas fondue dans les
coordonnées du tracé.

En Tailwind v4, `-translate-y-[…]` alimente la propriété `translate`, pas
`transform` : chercher `transform` en inspectant l'élément renvoie `none`
alors que le décalage est bien appliqué.

---

## 5. États actif / inactif

Deux `<svg>` superposés en `position: absolute; inset: 0` dans un `<span>` de
28 × 28, bascule par `opacity`, `transition: opacity .18s ease`. Aucun
remplacement de nœud, donc aucun ressaut de layout.

Contour seul en inactif, glyphe rempli `#111` en actif.

Recherche en état actif : **lentille pleine** (`circle` avec
`fill: currentColor`) + manche en `stroke-width: 2.4`. Le disque plein
remplace l'anneau épais de la version 1 : à 28 px, un anneau de 3,3 fermait la
lentille en une tache tout en gardant l'aspect d'un contour raté.

L'onglet Recherche est « actif » tant que l'overlay est ouvert.

---

## 6. Zones tactiles

Le document descend les cercles à 36 px et les items à 42 × 38, sous le
minimum de 44 px, et propose lui-même de corriger « en élargissant la zone de
touche au-delà de la surface visible ». C'est ce qui est fait, par
pseudo-élément — **aucune valeur visuelle n'est modifiée** :

| | Dessin | Cible réelle |
|---|---|---|
| Cercles | 36 × 36 | `::after { inset: -4px }` → **44 × 44** |
| Items | 42 × 38 | `::after { inset: -3px }` → **48 × 44** |

Les 3 px latéraux des items consomment exactement la moitié du gap de 6 px :
deux onglets voisins ne se recouvrent jamais.

**La marge intérieure des cercles n'est pas le problème annoncé.** Le document
craint 3,5 à 4 px entre le glyphe et le bord, en comparant la taille du SVG
(28–29 px) au cercle (36 px). Mais aucun des deux tracés ne remplit son
viewBox : mesurée sur la boîte d'encre réelle, la marge est de **8,3 px** pour
le globe et **9,4 px** pour les filtres.

---

## 7. Réserve de place dans la page

`<main>` porte `padding-top: 132px` sous 640 px.

La réserve du **bas** est portée par le **pied de page**, pas par `<main>` :
c'est le pied de page qui touche le bas du document, donc lui que la tab bar
flottante recouvrait. `padding-bottom: calc(24px + 80px + safe-area)`,
ramené à 24 px à partir de `sm`.

80 px = 26 (offset) + 38 (hauteur de la barre) + 16 de dégagement.

---

## 8. Points ouverts

1. **Destination du bouton Filtres.** Le document place le bouton mais ne dit
   pas ce qu'il ouvre — même trou que le §4 « Non conçu » de la version 1. Il
   pointe pour l'instant sur `/produits`, où vivent les filtres réels du
   catalogue. À remplacer par une vraie feuille de filtres une fois conçue.
2. **Origine de l'animation de l'overlay.** Elle vaut `88% -12px` (`12%` en
   RTL), calée sur le bouton de recherche… qui était en haut à droite. La
   recherche est descendue dans la tab bar, mais la version 2 ne redonne pas
   d'origine. Le panneau grandit donc depuis le coin haut droit, où se trouve
   maintenant le bouton Filtres. Correctif d'une ligne si tu le veux :
   `50% calc(100% + 12px)`.
3. **Recherche en bas, filtres en haut.** Les deux actions de découverte sont
   sur deux bords opposés. Le document le signale lui-même comme à vérifier en
   usage réel.
4. **Pas d'escamotage du déclencheur.** En version 1, le cercle de recherche
   s'effaçait à l'ouverture de l'overlay (`scale(.85)`, opacité 0) pour donner
   l'impression que le panneau en sortait. Non repris : faire disparaître un
   onglet sur quatre laisserait un trou dans la barre.
