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

## 2 bis. Où vivent les adresses

Décidé au moment de séparer la connexion marchand de celle des clients. Rien
de tout cela n'est implémenté — tout tient encore sur un seul domaine — mais la
règle doit être écrite **avant** les domaines personnalisés, parce qu'après
elle coûte une migration d'authentification.

**Règle : la vitrine porte le nom du marchand, l'administration porte le
nôtre.**

| | Adresse | Qui possède le nom |
|---|---|---|
| Vitrine client | `www.tyradam.com` ou `tyradam.laplateforme.dz` | le marchand |
| Compte client | même domaine que sa vitrine | le marchand |
| **Administration** | **`admin.laplateforme.dz`** — une seule, tous marchands confondus | **nous** |

L'adresse d'administration ne dit pas quelle boutique : c'est la **session**
qui le dit. La boutique apparaît ensuite dans le chemin
(`admin.laplateforme.dz/coursa/produits`) pour que les liens soient
partageables et qu'un marchand à deux boutiques bascule sans se reconnecter.
Ce chemin est un confort de navigation, **jamais une barrière** : c'est le
serveur qui vérifie l'appartenance.

### Pourquoi l'admin ne descend jamais sur le domaine d'un marchand

**1. Les scripts tiers de la vitrine.** Un marchand installe un pixel, un
widget d'avis, un chat. C'est notre métier de le lui permettre, et il ne les a
pas écrits. Si la session d'administration est un cookie posé sur son domaine,
une faille dans le moindre de ces scripts ne vole plus un panier : elle vole le
back-office. Sur une origine séparée, ce chemin **n'existe pas** — le
navigateur le refuse.

**2. Le DNS appartient au marchand.** Domaine expiré, registrar compromis,
marchand parti fâché : le nom pointe où quelqu'un d'autre décide. Déléguer son
contrôle d'accès à un client n'est pas une option.

### Le piège du sous-domaine

`admin.tyradam.com` semble régler le problème 1. Il ne le règle qu'à moitié,
et pas du tout le problème 2 :

- **Les cookies n'obéissent pas à la règle d'origine.** Deux sous-domaines sont
  bien deux origines — la vitrine ne peut pas *lire* le cookie de l'admin. Mais
  elle peut en **écrire** un sur `.tyradam.com`, que l'admin recevra sans
  pouvoir dire qui l'a posé. C'est la fixation de session par sous-domaine. Le
  préfixe `__Host-` s'en défend, mais c'est une parade à un problème que
  l'autre option n'a pas.
- **`SameSite=Lax` ne protège pas** entre sous-domaines : pour le navigateur,
  c'est le même *site*.
- **Un certificat et une ligne DNS par marchand**, contre un seul nom d'hôte.
- **Le marchand sans domaine** aurait son admin en
  `admin.tyradam.laplateforme.dz` — non couvert par le joker
  `*.laplateforme.dz`, qui ne vaut que pour un seul niveau. Puis son adresse
  d'admin changerait le jour où il achète son domaine.

### État actuel

`/admin/connexion` (voir `app/[locale]/admin/`). Tant que tout tient sur un
domaine, c'est la bonne forme : l'origine séparée n'apporterait rien de plus.

Le groupe de routes `(espace)` porte le garde et la barre latérale ;
`connexion/` reste dehors, **sans quoi la page de connexion se redirigerait
vers elle-même sans fin**. C'est aussi ce découpage qui rendra le déménagement
mécanique le jour venu.

### Question ouverte, en amont de tout le reste

**Le client est-il global à la plateforme, ou propre à une boutique ?**
Aujourd'hui il porte un `boutiqueId` : il appartient à une boutique. Une
marketplace agrégée suppose qu'il navigue entre elles.

Conséquence à connaître : avec des domaines personnalisés, **un client connecté
sur `tyradam.com` ne l'est pas sur `coursa.com`** — cookies différents,
domaines différents, et c'est le navigateur qui l'impose. Une session client
valable partout demanderait une origine d'identité centrale
(`compte.laplateforme.dz`) et une redirection de type OIDC. C'est un
chantier, pas un réglage.

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
| Connexion marchand séparée de celle des clients | ✅ Fait — `/admin/connexion`, voir §2 bis |
| Règle des origines (vitrine / administration) | ✅ Décidée et écrite, §2 bis — non implémentée |
| Résolution par domaine | ⬜ Étape suivante |
| Table d'appartenance (`utilisateur × boutique × rôle`) | ⬜ Avant le marchand n° 2 |
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

**Un layout protège sa propre page de connexion.** Le layout `/admin` appelle
`requireAdmin()`, donc tout ce qui vit sous lui est gardé — page de connexion
comprise, qui redirigeait alors vers elle-même sans fin. La sortie est un
groupe de routes : `(espace)` porte le garde, `connexion/` reste dehors, et
les URLs ne bougent pas puisque les parenthèses n'apparaissent pas dedans. Le
piège se reproduira à l'identique pour « mot de passe oublié » et pour toute
page publique qu'on voudra loger sous `/admin`.

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
