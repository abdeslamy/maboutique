# Multi-boutiques — état du chantier

Objectif : une plateforme qui héberge plusieurs marchands, chacun isolé des
autres. Ce document décrit ce qui est fait, ce qui reste, et les pièges connus.

---

## 1. Le principe

Chaque table métier porte une **étiquette** `boutiqueId`. Une requête qui
oublie l'étiquette voit les données de tous les marchands — c'est le risque
central de toute l'architecture.

**Règle** : aucune requête ne franchit la frontière d'une boutique, sauf depuis
des fonctions nommées et en lecture seule (la future marketplace).

---

## 2. `boutiqueActuelle()` — le point unique

`lib/boutique.ts` est le **seul** endroit qui répond à « quelle boutique sert
cette requête ? ».

| | Réponse |
|---|---|
| Aujourd'hui | `"boutique-1"`, constante |
| Après les domaines | Lecture de l'hôte (`tyradam.com`, `coursa.maplateforme.dz`, `maplateforme.dz/coursa`) → identifiant de boutique |

Les ~30 appelants ne changeront pas ce jour-là. C'est toute la raison d'être de
cette indirection.

Deux détails qui ont l'air gratuits mais ne le sont pas :

- **La fonction est `async` alors que la réponse est constante.** La vraie
  résolution devra lire les en-têtes et consulter la base. La rendre synchrone
  aujourd'hui obligerait à modifier les trente appelants plus tard.
- **Elle est enveloppée dans `cache()`.** La résolution n'a lieu qu'une fois
  par rendu serveur, même si vingt fonctions la demandent.

Les scripts hors requête HTTP (`prisma/seed.ts`, maintenance) n'ont pas d'hôte
à résoudre : ils importent `BOUTIQUE_PAR_DEFAUT` et nomment la boutique.

---

## 3. Schéma

| Table | Étiquette | Clé primaire |
|---|---|---|
| `Boutique` | — | `id` |
| `Produit` | `boutiqueId` | `id` (slug) — ⚠️ voir dette |
| `Commande` | `boutiqueId` | `id` (cuid) |
| `Utilisateur` | `boutiqueId` | `id` + `@@unique([boutiqueId, email])` |
| `Categorie` | `boutiqueId` | **`@@id([boutiqueId, id])`** |
| `TarifLivraison` | `boutiqueId` | **`@@id([boutiqueId, wilaya])`** |
| `ParametresBoutique` | — | `boutiqueId` (l'étiquette *est* la clé) |
| `LigneCommande` | aucune | rattachée via sa commande |

**Pourquoi deux clés composites.** `Categorie.id` et `TarifLivraison.wilaya`
étaient des clés primaires globales. Les rayons viennent d'un catalogue fixe de
38 slugs et les wilayas sont au nombre de 58 : deux marchands voulant tous deux
« mode » ou un tarif pour Alger entraient en collision **à coup sûr**, pas
seulement en théorie. Corrigé.

**Suppression d'une boutique** : `CASCADE` sur produits, catégories, tarifs,
paramètres et comptes ; `RESTRICT` sur les commandes. C'est de la comptabilité,
elle doit survivre au marchand.

---

## 4. ⚠️ Dette connue — l'identité du produit

`Produit.id` est encore un **slug lisible** *et* la clé primaire, donc globale.
Deux marchands qui vendent un « casque-bluetooth » entrent en collision.

Sans conséquence tant qu'il n'y a qu'une boutique. **À corriger avant le
deuxième marchand** : clé technique + `@@unique([boutiqueId, slug])`. Ça touche
les URLs des fiches produit et le panier en `localStorage`.

---

## 5. Fait / reste à faire

| | État |
|---|---|
| Table `Boutique`, migration des données existantes | ✅ Fait, vérifié, zéro perte |
| Étiquettes sur les 6 tables | ✅ Fait |
| Cloisonnement des ~30 requêtes (`lib/` : products, orders, auth, categories, livraison) | ✅ Fait |
| `visibleMarketplace` (un marchand peut refuser la vitrine agrégée) | ✅ Champ posé, non exploité |
| Garde-fou automatique (extension Prisma) | ✅ Fait, 13 cas testés |
| Row Level Security PostgreSQL (second filet) | ⬜ Voir §5 bis — coût réel à peser |
| Résolution par domaine | ⬜ Étape suivante |
| Identité produit globale | ⬜ Avant le marchand n° 2 |
| Thème et personnalisation par boutique | ⬜ Plus tard |

---

## 5 bis. Le garde-fou de cloisonnement

`lib/prisma-cloisonnement.ts` enveloppe le client Prisma. Toute requête sur une
table de marchand qui **ne mentionne pas** `boutiqueId` lève une
`ErreurCloisonnement`.

**Il refuse, il ne corrige pas.** Beaucoup d'implémentations multi-tenant
injectent le filtre manquant automatiquement. Deux raisons de ne pas le faire :

1. Une injection silencieuse fait « marcher » une requête fausse. Celui qui l'a
   écrite n'apprend jamais qu'il a oublié quelque chose.
2. Une injection doit comprendre **toutes** les formes de requête — écritures
   imbriquées, `connect`, `include`. Le moindre trou dans cette logique
   redevient une fuite silencieuse. Une détection n'a qu'à constater une
   absence : ses erreurs sont bruyantes, jamais discrètes.

**Il n'a pas d'échappatoire, et c'est voulu.** Aucune requête légitime ne
traverse les boutiques aujourd'hui. Le jour où la vitrine agrégée existera, le
garde refusera ses requêtes — et forcera à concevoir cette ouverture dans un
module dédié en lecture seule, plutôt qu'à la laisser apparaître par
distraction.

Ce qu'il accepte : `boutiqueId` à n'importe quelle profondeur du `where` ou du
`data`, la relation `boutique`, et les filtres relationnels comme
`{ commande: { boutiqueId } }` — c'est ainsi que `LigneCommande`, qui n'a pas
d'étiquette propre, est légitimement cloisonnée.

### Row Level Security — pourquoi ce n'est pas fait

RLS placerait la règle dans PostgreSQL lui-même, donc hors de portée d'une
erreur applicative. C'est plus solide que le garde ci-dessus.

Le coût est réel : RLS s'appuie sur une variable de session
(`SET LOCAL app.boutique_id`). Avec le pooler Neon en mode transaction, chaque
requête devrait être enveloppée dans une transaction pour que la variable
tienne. Ça change la stratégie de connexion de toute l'application.

À faire quand plusieurs marchands réels sont en production — pas avant.

---

## 6. Pièges rencontrés, pour mémoire

**Les `deleteMany({})` sans filtre.** `enregistrerCategories` et
`enregistrerGroupes` effaçaient tout avant de réinsérer. Sans étiquette dans le
`where`, un marchand qui enregistrait ses rayons **effaçait ceux de tous les
autres**. Les deux sont désormais filtrés.

**Les mouvements de stock.** Dans `mettreAJourCommandeAdmin`, l'incrément de
stock passait par `update({ where: { id } })`. Devenu `updateMany` avec
l'étiquette : un admin ne peut pas modifier le stock d'un autre marchand, même
en devinant un identifiant.

**Le seuil de livraison gratuite est par marchand.** Sur un panier marketplace
à trois marchands, trois seuils distincts sont évalués — le client peut n'en
atteindre aucun alors que son total global les dépasse. À expliquer dans
l'interface.

---

## 7. Base de développement

Le développement tourne sur une **branche Neon `dev`**, copie de la production
prise le 27/08/2026. `.env` pointe dessus.

⚠️ `prisma.config.ts` charge **uniquement `.env`** (via `dotenv/config`), alors
que Next.js lit `.env.local` en priorité. Mettre l'URL de développement dans
`.env.local` ferait tourner le site sur la base de dev pendant que les
migrations partiraient en production. **L'URL de développement doit être dans
`.env`.**

La production tire sa `DATABASE_URL` des variables d'environnement Vercel, pas
de ces fichiers.
