/**
 * Limitation du nombre de tentatives — protection contre la force brute.
 *
 * ─── Ce que ça vaut, et ce que ça ne vaut pas ──────────────────────────
 * Les compteurs vivent EN MÉMOIRE du processus. Sur Vercel, chaque instance
 * a donc les siens : un attaquant dont les requêtes tombent sur plusieurs
 * instances obtient plusieurs fois le quota, et un redémarrage remet tout à
 * zéro.
 *
 * C'est assumé. Ce garde-fou arrête les scripts naïfs — l'écrasante majorité
 * — pour zéro dépendance et zéro coût. Il ne prétend pas résister à une
 * attaque distribuée.
 *
 * Le jour où ça ne suffira plus, la même interface se rebranche sur un
 * compteur partagé (Redis, ou une table dédiée). C'est pour ça que la
 * fonction ne renvoie qu'un verdict et un délai : les appelants n'ont pas à
 * savoir où sont rangés les compteurs.
 */

type Compteur = { nb: number; expire: number };

const compteurs = new Map<string, Compteur>();

/** Purge les entrées expirées. Sans elle, la table grossit indéfiniment. */
function purger(maintenant: number): void {
  for (const [cle, c] of compteurs) {
    if (c.expire <= maintenant) compteurs.delete(cle);
  }
}

export type Verdict = {
  /** false = quota dépassé, il faut refuser. */
  ok: boolean;
  /** Secondes avant de pouvoir réessayer. 0 quand `ok`. */
  resteSec: number;
};

/**
 * Enregistre une tentative et dit si elle est encore autorisée.
 *
 * ⚠️ À n'appeler que sur les tentatives qui COMPTENT. Pour une connexion,
 * cela veut dire : sur les échecs uniquement. Compter les réussites
 * bloquerait un utilisateur légitime qui se connecte souvent.
 */
export function tenter(cle: string, max: number, fenetreSec: number): Verdict {
  const maintenant = Date.now();

  // Purge opportuniste : une fois sur vingt, pour ne pas parcourir la table
  // à chaque requête.
  if (Math.random() < 0.05) purger(maintenant);

  const actuel = compteurs.get(cle);
  if (!actuel || actuel.expire <= maintenant) {
    compteurs.set(cle, { nb: 1, expire: maintenant + fenetreSec * 1000 });
    return { ok: true, resteSec: 0 };
  }

  actuel.nb += 1;
  if (actuel.nb > max) {
    return { ok: false, resteSec: Math.ceil((actuel.expire - maintenant) / 1000) };
  }
  return { ok: true, resteSec: 0 };
}

/** Efface le compteur — après une connexion réussie, par exemple. */
export function reinitialiser(cle: string): void {
  compteurs.delete(cle);
}

/**
 * Adresse de l'appelant, telle que Vercel la transmet.
 * `x-forwarded-for` peut contenir une chaîne de relais : le client est le
 * PREMIER élément, les suivants sont les intermédiaires.
 */
export function adresseAppelant(req: Request): string {
  const chaine = req.headers.get("x-forwarded-for");
  if (chaine) return chaine.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "inconnue";
}
