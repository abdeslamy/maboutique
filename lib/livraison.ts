// ============================================================================
// Livraison — tarifs par wilaya et paramètres de la boutique.
// ============================================================================
//
// ⚠️ Fonctions SERVEUR uniquement (elles touchent Prisma).
// Les composants client reçoivent les tarifs en props depuis une page serveur.
//
// Règle d'or : le prix de livraison affiché au client est une INDICATION.
// Le prix qui fait foi est recalculé côté serveur au moment de la commande
// (voir creerCommande), exactement comme pour les prix produits.
// ============================================================================

import { prisma } from "@/lib/prisma";
import { WILAYAS } from "@/lib/wilayas";
import { TARIF_PAR_DEFAUT, type TarifWilaya, type ParametresLivraison } from "./livraison-calcul";

// Types et calcul vivent dans livraison-calcul.ts (sans Prisma, donc
// importable côté client). On les ré-exporte pour que le code serveur n'ait
// qu'un seul point d'entrée.
export {
  TARIF_PAR_DEFAUT,
  MODES_LIVRAISON,
  estModeValide,
  calculerLivraison,
} from "./livraison-calcul";
export type {
  ModeLivraison,
  TarifWilaya,
  ParametresLivraison,
} from "./livraison-calcul";

// ──────────────────────────────────────────────────────────────────────
// Lecture
// ──────────────────────────────────────────────────────────────────────

/**
 * Renvoie les 58 tarifs, dans l'ordre des codes wilaya.
 *
 * Auto-réparation : si une wilaya n'a pas encore de ligne en base (première
 * utilisation, ou wilaya ajoutée après coup), on renvoie le tarif par défaut
 * plutôt que de la faire disparaître du site. La base est complétée au
 * premier enregistrement de l'admin.
 */
export async function getTarifsLivraison(): Promise<TarifWilaya[]> {
  const lignes = await prisma.tarifLivraison.findMany();
  const parCode = new Map(lignes.map((l) => [l.wilaya, l]));

  return WILAYAS.map((w) => {
    const t = parCode.get(w.code);
    return {
      wilaya: w.code,
      prixDomicile: t?.prixDomicile ?? TARIF_PAR_DEFAUT,
      prixStopdesk: t?.prixStopdesk ?? TARIF_PAR_DEFAUT,
      actif: t?.actif ?? true,
    };
  });
}

/** Paramètres globaux. Crée la ligne unique si elle n'existe pas encore. */
export async function getParametresLivraison(): Promise<ParametresLivraison> {
  const p = await prisma.parametresBoutique.findUnique({
    where: { id: "boutique" },
  });
  return {
    seuilLivraisonGratuite: p?.seuilLivraisonGratuite ?? null,
    delaiMin: p?.delaiMin ?? 3,
    delaiMax: p?.delaiMax ?? 5,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Écriture (admin)
// ──────────────────────────────────────────────────────────────────────

export type EntreeTarif = {
  wilaya: string;
  prixDomicile: number;
  prixStopdesk: number;
  actif: boolean;
};

/**
 * Enregistre les tarifs modifiés + les paramètres, en une seule transaction.
 * On n'écrit QUE les wilayas réellement transmises : l'admin peut donc
 * sauvegarder une modification partielle sans risquer d'écraser le reste.
 */
export async function enregistrerLivraison(
  tarifs: EntreeTarif[],
  parametres: ParametresLivraison
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  // Validation stricte : un prix négatif ou décimal est refusé.
  for (const t of tarifs) {
    if (!WILAYAS.some((w) => w.code === t.wilaya)) {
      return { ok: false, erreur: "wilaya_invalide" };
    }
    if (
      !Number.isInteger(t.prixDomicile) ||
      t.prixDomicile < 0 ||
      !Number.isInteger(t.prixStopdesk) ||
      t.prixStopdesk < 0
    ) {
      return { ok: false, erreur: "prix_invalide" };
    }
  }
  const seuil = parametres.seuilLivraisonGratuite;
  if (seuil !== null && (!Number.isInteger(seuil) || seuil < 0)) {
    return { ok: false, erreur: "seuil_invalide" };
  }
  if (
    !Number.isInteger(parametres.delaiMin) ||
    !Number.isInteger(parametres.delaiMax) ||
    parametres.delaiMin < 0 ||
    parametres.delaiMax < parametres.delaiMin
  ) {
    return { ok: false, erreur: "delai_invalide" };
  }

  try {
    await prisma.$transaction([
      ...tarifs.map((t) =>
        prisma.tarifLivraison.upsert({
          where: { wilaya: t.wilaya },
          update: {
            prixDomicile: t.prixDomicile,
            prixStopdesk: t.prixStopdesk,
            actif: t.actif,
          },
          create: {
            wilaya: t.wilaya,
            prixDomicile: t.prixDomicile,
            prixStopdesk: t.prixStopdesk,
            actif: t.actif,
          },
        })
      ),
      prisma.parametresBoutique.upsert({
        where: { id: "boutique" },
        update: {
          seuilLivraisonGratuite: seuil,
          delaiMin: parametres.delaiMin,
          delaiMax: parametres.delaiMax,
        },
        create: {
          id: "boutique",
          seuilLivraisonGratuite: seuil,
          delaiMin: parametres.delaiMin,
          delaiMax: parametres.delaiMax,
        },
      }),
    ]);
    return { ok: true };
  } catch {
    return { ok: false, erreur: "erreur_serveur" };
  }
}
