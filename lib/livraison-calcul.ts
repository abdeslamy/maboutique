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

export type TarifWilaya = {
  wilaya: string;
  prixDomicile: number;
  prixStopdesk: number;
  actif: boolean;
};

export type ParametresLivraison = {
  /** null = la livraison n'est jamais offerte. */
  seuilLivraisonGratuite: number | null;
  delaiMin: number;
  delaiMax: number;
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
  if (!tarif) return TARIF_PAR_DEFAUT;
  return mode === "stopdesk" ? tarif.prixStopdesk : tarif.prixDomicile;
}
