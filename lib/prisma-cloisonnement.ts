import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Garde-fou de cloisonnement entre boutiques.
 *
 * ─── Le problème ───────────────────────────────────────────────────────
 * Chaque table métier porte un `boutiqueId`. Une requête qui l'oublie voit
 * les données de TOUS les marchands. Aujourd'hui c'est sans conséquence — il
 * n'y a qu'une boutique. Au deuxième marchand, c'est une fuite de données.
 *
 * Le danger n'est pas le code d'aujourd'hui, qui vient d'être relu ligne à
 * ligne : c'est la requête qu'on écrira dans six mois sans y penser.
 *
 * ─── Le choix : refuser, plutôt que corriger en douce ──────────────────
 * Beaucoup d'implémentations multi-tenant injectent le filtre automatiquement
 * quand il manque. On ne le fait pas, pour deux raisons :
 *
 *  1. Une injection silencieuse fait « marcher » une requête fausse. Celui
 *     qui l'a écrite ne sait jamais qu'il a oublié quelque chose, et prend
 *     l'habitude de ne pas y penser.
 *  2. Une injection doit comprendre TOUTES les formes de requête — écritures
 *     imbriquées, `connect`, `include`… Le moindre trou dans cette logique
 *     redevient une fuite silencieuse. Une détection, elle, n'a qu'à
 *     constater une absence : ses erreurs sont bruyantes, jamais discrètes.
 *
 * Donc : une requête sans étiquette sur un modèle cloisonné **lève une
 * erreur**. Immédiatement, en développement, à l'écriture.
 *
 * ─── Pas d'échappatoire, et c'est volontaire ───────────────────────────
 * Aucune requête légitime ne traverse les boutiques aujourd'hui : la vitrine
 * agrégée n'existe pas encore. Le jour où elle existera, ce garde-fou
 * refusera ses requêtes — et forcera à concevoir cette ouverture
 * explicitement, dans un module dédié et en lecture seule, plutôt qu'à la
 * laisser apparaître par distraction.
 *
 * C'est exactement le service qu'on lui demande.
 */

/**
 * Modèles porteurs d'une étiquette de boutique.
 *
 * `Boutique` n'y figure pas : c'est la table des tenants elle-même.
 * `LigneCommande` non plus : elle n'a pas d'étiquette propre et se rattache
 * par sa commande — d'où l'acceptation de `commande.boutiqueId` plus bas.
 */
const MODELES_CLOISONNES = new Set([
  "Produit",
  "Commande",
  "Utilisateur",
  "Categorie",
  "TarifLivraison",
  "ParametresBoutique",
  "LigneCommande",
]);

/** Opérations dont c'est `where` qui doit porter l'étiquette. */
const OPERATIONS_WHERE = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/** Opérations dont c'est `data` qui doit porter l'étiquette. */
const OPERATIONS_DATA = new Set(["create", "createMany", "createManyAndReturn"]);

/** Profondeur de recherche : au-delà, on est dans du filtre relationnel exotique. */
const PROFONDEUR_MAX = 4;

/**
 * L'étiquette est-elle présente quelque part dans cette structure ?
 *
 * On accepte `boutiqueId` à n'importe quel niveau, ainsi que la relation
 * `boutique` (forme `connect`) et les filtres relationnels du type
 * `{ commande: { boutiqueId } }` — c'est ainsi que les lignes de commande
 * sont légitimement cloisonnées.
 */
function contientEtiquette(valeur: unknown, profondeur = 0): boolean {
  if (profondeur > PROFONDEUR_MAX || valeur === null || typeof valeur !== "object") {
    return false;
  }
  if (Array.isArray(valeur)) {
    // createMany : chaque ligne doit porter l'étiquette, pas seulement une.
    return valeur.length > 0 && valeur.every((v) => contientEtiquette(v, profondeur + 1));
  }
  const obj = valeur as Record<string, unknown>;
  if ("boutiqueId" in obj || "boutique" in obj) return true;
  return Object.values(obj).some((v) => contientEtiquette(v, profondeur + 1));
}

export class ErreurCloisonnement extends Error {
  constructor(modele: string, operation: string, champ: string) {
    super(
      `Cloisonnement : ${modele}.${operation}() sans boutiqueId dans \`${champ}\`. ` +
        `Ajoute le filtre — la valeur vient de boutiqueActuelle() (lib/boutique.ts). ` +
        `S'il s'agit volontairement d'une lecture transverse (vitrine agrégée), ` +
        `elle doit passer par un module dédié, en lecture seule, pas par ici.`
    );
    this.name = "ErreurCloisonnement";
  }
}

export const gardeCloisonnement = Prisma.defineExtension({
  name: "garde-cloisonnement",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!MODELES_CLOISONNES.has(model)) {
          return query(args);
        }

        const a = (args ?? {}) as Record<string, unknown>;

        if (OPERATIONS_WHERE.has(operation) && !contientEtiquette(a.where)) {
          throw new ErreurCloisonnement(model, operation, "where");
        }

        if (OPERATIONS_DATA.has(operation) && !contientEtiquette(a.data)) {
          throw new ErreurCloisonnement(model, operation, "data");
        }

        // upsert touche les deux : il lit avec `where`, puis écrit `create`.
        if (operation === "upsert") {
          if (!contientEtiquette(a.where)) {
            throw new ErreurCloisonnement(model, operation, "where");
          }
          if (!contientEtiquette(a.create)) {
            throw new ErreurCloisonnement(model, operation, "create");
          }
        }

        return query(args);
      },
    },
  },
});
