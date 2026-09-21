// ============================================================================
// Livraison — types et calcul PUR (aucune dépendance à Prisma).
// ============================================================================
//
// Ce fichier est volontairement séparé de lib/livraison.ts : il peut être
// importé par des composants CLIENT sans embarquer Prisma dans le bundle
// navigateur. Même raison d'être que lib/slug.ts.
//
// lib/livraison.ts (serveur) ré-exporte tout ce qui suit : côté serveur on
// n'a donc qu'un seul point d'import à connaître.
// ============================================================================

// Il n'y a PAS de tarif par défaut. Une boutique qui vient d'ouvrir ne
// facture pas 500 DA « en attendant » : elle ne connaît simplement pas encore
// ses frais, et le dit (voir calculerLivraison, qui renvoie alors null).
// Inventer un montant, c'est annoncer au client un total qu'on devra corriger
// au téléphone — le pire des deux mondes.

export type ModeLivraison = "domicile" | "stopdesk";

export const MODES_LIVRAISON: ModeLivraison[] = ["domicile", "stopdesk"];

export function estModeValide(v: string): v is ModeLivraison {
  return v === "domicile" || v === "stopdesk";
}

/**
 * Tarif d'une wilaya. La PRÉSENCE de l'entrée signifie « wilaya desservie » :
 * une wilaya absente de la liste n'est pas livrée.
 */
export type TarifWilaya = {
  wilaya: string;
  /** null = pas de livraison à domicile pour cette wilaya. */
  prixDomicile: number | null;
  prixStopdesk: number;
};

/**
 * Groupe de wilayas partageant le même tarif — c'est la vue manipulée par
 * l'admin. En Algérie, le prix est presque toujours identique par région,
 * donc régler 58 wilayas une par une n'a aucun sens.
 */
export type GroupeTarif = {
  wilayas: string[];
  /** null = ce groupe n’est pas livré à domicile. */
  prixDomicile: number | null;
  prixStopdesk: number;
};

/**
 * Regroupe les tarifs par couple de prix identiques.
 * Les groupes ne sont pas stockés : ils sont DÉDUITS. Deux wilayas au même
 * prix appartiennent au même groupe, ce qui évite une table de jointure et
 * garde la recherche de tarif immédiate au moment de la commande.
 */
export function grouperTarifs(tarifs: TarifWilaya[]): GroupeTarif[] {
  const parPrix = new Map<string, GroupeTarif>();
  for (const t of tarifs) {
    const cle = `${t.prixDomicile}-${t.prixStopdesk}`;
    const existant = parPrix.get(cle);
    if (existant) {
      existant.wilayas.push(t.wilaya);
    } else {
      parPrix.set(cle, {
        wilayas: [t.wilaya],
        prixDomicile: t.prixDomicile,
        prixStopdesk: t.prixStopdesk,
      });
    }
  }
  // Les plus gros groupes d'abord : c'est le tarif principal du marchand.
  return [...parPrix.values()].sort((a, b) => b.wilayas.length - a.wilayas.length);
}

/** Aplatit les groupes en tarifs par wilaya (l'inverse de grouperTarifs). */
export function aplatirGroupes(groupes: GroupeTarif[]): TarifWilaya[] {
  const vus = new Set<string>();
  const sortie: TarifWilaya[] = [];
  for (const g of groupes) {
    for (const w of g.wilayas) {
      // Une wilaya ne peut appartenir qu'à un seul groupe : le premier gagne.
      if (vus.has(w)) continue;
      vus.add(w);
      sortie.push({
        wilaya: w,
        prixDomicile: g.prixDomicile,
        prixStopdesk: g.prixStopdesk,
      });
    }
  }
  return sortie;
}

export type ParametresLivraison = {
  /** true = la livraison est offerte partout, quel que soit le panier. */
  livraisonGratuite: boolean;
};

/**
 * Le panier donne-t-il droit à la livraison offerte ?
 *
 * Il faut que TOUS les articles portent l'option. La livraison est un seul
 * colis : on ne peut pas l'offrir à moitié. Un seul produit sans l'option, et
 * les frais s'appliquent à toute la commande — sans quoi il suffirait
 * d'ajouter un petit article « livraison offerte » pour ne rien payer sur une
 * grosse commande.
 *
 * Un panier vide ne donne droit à rien : `every` renvoie true sur une liste
 * vide, d'où le test de longueur.
 */
export function panierEnLivraisonOfferte(
  articles: { livraisonGratuite: boolean }[]
): boolean {
  return articles.length > 0 && articles.every((a) => a.livraisonGratuite);
}

/**
 * Prix de livraison à facturer, ou `null` quand il n'est PAS connu.
 *
 * Les règles, dans cet ordre de priorité :
 *
 *  1. La boutique offre la livraison  → 0 DA, partout. Prime sur tout.
 *  2. Le panier y donne droit         → 0 DA (voir panierEnLivraisonOfferte).
 *  3. La wilaya a un tarif            → ce tarif.
 *  4. La wilaya n'a pas de tarif      → `null` : montant inconnu.
 *
 * Le cas 4 couvre indifféremment « le vendeur n'a encore rien renseigné » et
 * « le vendeur a renseigné d'autres wilayas mais pas celle-ci ». Dans les deux
 * cas la commande passe quand même : les frais seront annoncés au client lors
 * de l'appel de confirmation. C'est ce que `null` veut dire ici — à ne pas
 * confondre avec 0, qui veut dire « offerte ».
 *
 * ⚠️ Une livraison offerte n'est JAMAIS « à confirmer » : 0 est un montant
 * ferme, donc le total affiché est complet. C'est pour cela que les deux
 * gratuités passent avant le cas de la wilaya sans tarif.
 *
 * Utilisé aux DEUX bouts : par le formulaire client pour afficher le prix en
 * direct, et par le serveur pour calculer le montant réellement facturé.
 * Une seule fonction = aucun risque d'écart entre les deux.
 */
export function calculerLivraison(
  tarif: TarifWilaya | undefined,
  mode: ModeLivraison,
  parametres: ParametresLivraison,
  /** Le panier donne droit à la gratuité — voir panierEnLivraisonOfferte. */
  offertParLePanier = false
): number | null {
  // Règles 1 et 2 — la gratuité l'emporte sur tout le reste, y compris sur
  // une wilaya sans tarif : offerte, c'est 0 DA, il n'y a plus rien à
  // confirmer et le total affiché est donc complet.
  if (parametres.livraisonGratuite || offertParLePanier) return 0;

  // Règle 4 — pas de tarif pour cette wilaya : montant inconnu, pas refus.
  if (!tarif) return null;

  // Règle 3 — le tarif de la wilaya s'applique.
  if (mode === "stopdesk") return tarif.prixStopdesk;
  // Domicile non assuré pour ce groupe : l'appelant aurait dû l'écarter via
  // modeDisponible(). On renvoie « inconnu » plutôt que de facturer le prix
  // d'un autre mode que celui choisi.
  return tarif.prixDomicile;
}

/**
 * Ce mode est-il proposé pour cette wilaya ?
 *
 *  - Wilaya sans tarif : les DEUX modes restent proposés. On ne sait rien de
 *    cette destination, or ne rien savoir n'est pas une raison de refuser une
 *    commande — le montant se règle à l'appel, quel que soit le mode.
 *  - Wilaya tarifée : le stopdesk est toujours possible ; le domicile
 *    seulement si le vendeur lui a donné un prix.
 */
export function modeDisponible(
  tarif: TarifWilaya | undefined,
  mode: ModeLivraison
): boolean {
  if (!tarif) return true;
  return mode === "stopdesk" ? true : tarif.prixDomicile !== null;
}

// ──────────────────────────────────────────────────────────────────────
// Délai de livraison — réglé PAR PRODUIT
// ──────────────────────────────────────────────────────────────────────

export type DelaiLivraison = "48h" | "3_5j" | "1semaine" | "plus_1semaine";

export const DELAIS_LIVRAISON: DelaiLivraison[] = [
  "48h",
  "3_5j",
  "1semaine",
  "plus_1semaine",
];

export const DELAI_PAR_DEFAUT: DelaiLivraison = "3_5j";

export function estDelaiValide(v: string): v is DelaiLivraison {
  return (DELAIS_LIVRAISON as string[]).includes(v);
}
