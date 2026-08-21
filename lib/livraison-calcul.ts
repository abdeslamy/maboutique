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

/** Tarif appliqué tant que l'admin n'a rien personnalisé. */
export const TARIF_PAR_DEFAUT = 500;

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
  prixDomicile: number;
  prixStopdesk: number;
};

/**
 * Groupe de wilayas partageant le même tarif — c'est la vue manipulée par
 * l'admin. En Algérie, le prix est presque toujours identique par région,
 * donc régler 58 wilayas une par une n'a aucun sens.
 */
export type GroupeTarif = {
  wilayas: string[];
  prixDomicile: number;
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
  /** null = la livraison n'est jamais offerte. */
  seuilLivraisonGratuite: number | null;
};

/**
 * Prix de livraison à facturer.
 * `sousTotal` sert uniquement à évaluer le seuil de gratuité.
 *
 * Utilisé aux DEUX bouts : par le formulaire client pour afficher le prix en
 * direct, et par le serveur pour calculer le montant réellement facturé.
 * Une seule fonction = aucun risque d'écart entre les deux.
 */
export function calculerLivraison(
  tarif: TarifWilaya | undefined,
  mode: ModeLivraison,
  sousTotal: number,
  parametres: ParametresLivraison
): number {
  // La gratuité l'emporte sur tout le reste.
  if (
    parametres.seuilLivraisonGratuite !== null &&
    sousTotal >= parametres.seuilLivraisonGratuite
  ) {
    return 0;
  }
  // Wilaya sans tarif = non desservie. L'appelant doit l'avoir écartée avant ;
  // ce repli n'est qu'un garde-fou.
  if (!tarif) return TARIF_PAR_DEFAUT;
  return mode === "stopdesk" ? tarif.prixStopdesk : tarif.prixDomicile;
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
