/**
 * Fonctions pures de la recherche — AUCUN import Prisma ici.
 * Ce fichier est importé par des composants client : la moindre dépendance
 * serveur ferait entrer PrismaClient dans le bundle du navigateur.
 */

/** Diacritiques latins (combinants) + tashkîl arabe. */
const DIACRITIQUES = /[\u0300-\u036f\u064b-\u0652\u0670]/g;

/**
 * Met un texte à plat pour la comparaison : minuscules, sans accents,
 * sans tashkîl arabe.
 *
 * ⚠️ Contrainte forte : la chaîne retournée doit avoir EXACTEMENT la même
 * longueur que l'entrée, caractère par caractère. C'est ce qui permet de
 * retrouver dans le texte d'origine la position d'une correspondance
 * trouvée dans la version normalisée — et donc de surligner la bonne
 * portion, accents compris.
 */
export function normaliser(texte: string): string {
  let sortie = "";
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    const code = c.charCodeAt(0);
    // Moitié de paire de substitution (emoji, etc.) : recopiée telle quelle,
    // la décomposer casserait l'alignement des index.
    if (code >= 0xd800 && code <= 0xdfff) {
      sortie += c;
      continue;
    }
    const base = c.normalize("NFD").replace(DIACRITIQUES, "").toLowerCase();
    sortie += base.length === 1 ? base : c.toLowerCase();
  }
  // Filet de sécurité : si un cas exotique a malgré tout changé la longueur
  // (le « İ » turc, par exemple), on renonce à la normalisation plutôt que
  // de renvoyer des index faux.
  return sortie.length === texte.length ? sortie : texte.toLowerCase();
}

/**
 * Position de `requete` dans `texte`, insensible à la casse ET aux accents.
 * Renvoie -1 si absent. Les index se réfèrent au texte d'ORIGINE.
 */
export function position(texte: string, requete: string): number {
  if (!requete) return -1;
  return normaliser(texte).indexOf(normaliser(requete));
}

/** `texte` contient-il `requete` ? (même insensibilité que `position`) */
export function contient(texte: string, requete: string): boolean {
  return position(texte, requete) !== -1;
}

/**
 * Découpe un texte autour de la partie saisie, pour le surlignage des
 * suggestions de complétion (partie saisie en gras).
 */
export function decouper(
  texte: string,
  requete: string
): { avant: string; correspondance: string; apres: string } {
  const i = position(texte, requete);
  if (i === -1) return { avant: texte, correspondance: "", apres: "" };
  return {
    avant: texte.slice(0, i),
    correspondance: texte.slice(i, i + requete.length),
    apres: texte.slice(i + requete.length),
  };
}

/**
 * Distance de Levenshtein, plafonnée : dès qu'une ligne entière dépasse
 * `max`, on abandonne. Sert au « Essayer <suggestion> » de l'état sans
 * résultat — inutile de calculer une distance de 12 pour la rejeter ensuite.
 */
export function distance(a: string, b: string, max = 3): number {
  const x = normaliser(a);
  const y = normaliser(b);
  if (Math.abs(x.length - y.length) > max) return max + 1;

  let precedente = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const courante = [i];
    let minLigne = i;
    for (let j = 1; j <= y.length; j++) {
      const cout = x[i - 1] === y[j - 1] ? 0 : 1;
      const v = Math.min(
        courante[j - 1] + 1,
        precedente[j] + 1,
        precedente[j - 1] + cout
      );
      courante[j] = v;
      if (v < minLigne) minLigne = v;
    }
    if (minLigne > max) return max + 1;
    precedente = courante;
  }
  return precedente[y.length];
}

/**
 * Terme du corpus le plus proche de la requête — le « vouliez-vous dire ».
 * `null` si rien n'est assez proche : mieux vaut ne rien proposer qu'une
 * correction absurde.
 */
export function correctionProche(
  requete: string,
  corpus: string[]
): string | null {
  const q = requete.trim();
  if (q.length < 3) return null;
  // Tolérance proportionnelle : 1 faute sur un mot court, 2 sur un long.
  const max = q.length <= 5 ? 1 : 2;
  let meilleur: string | null = null;
  let meilleureDistance = max + 1;
  for (const terme of corpus) {
    const d = distance(q, terme, max);
    if (d < meilleureDistance) {
      meilleureDistance = d;
      meilleur = terme;
    }
  }
  return meilleureDistance <= max ? meilleur : null;
}

// ────────────────────────────────────────────────────────────────────
// Historique des recherches — localStorage
// ────────────────────────────────────────────────────────────────────

const CLE_HISTORIQUE = "recherches-recentes";
/** Au-delà, l'historique cesse d'être un raccourci et devient une liste. */
export const MAX_RECENTES = 5;

export function lireRecentes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_HISTORIQUE);
    if (!brut) return [];
    const valeur: unknown = JSON.parse(brut);
    if (!Array.isArray(valeur)) return [];
    return valeur
      .filter((v): v is string => typeof v === "string")
      .slice(0, MAX_RECENTES);
  } catch {
    // Quota, mode privé, JSON corrompu : l'historique est un confort,
    // jamais une raison de faire tomber la recherche.
    return [];
  }
}

export function ecrireRecentes(liste: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(liste));
  } catch {
    /* ignoré volontairement — voir ci-dessus */
  }
}

/** Ajoute une requête en tête, sans doublon (comparaison normalisée). */
export function ajouterRecente(liste: string[], requete: string): string[] {
  const q = requete.trim();
  if (!q) return liste;
  const n = normaliser(q);
  return [q, ...liste.filter((r) => normaliser(r) !== n)].slice(
    0,
    MAX_RECENTES
  );
}
