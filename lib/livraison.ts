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
import { boutiqueActuelle } from "@/lib/boutique";
import { WILAYAS } from "@/lib/wilayas";
import {
  aplatirGroupes,
  type TarifWilaya,
  type GroupeTarif,
  type ParametresLivraison,
} from "./livraison-calcul";

// Types et calcul vivent dans livraison-calcul.ts (sans Prisma, donc
// importable côté client). On les ré-exporte pour que le code serveur n'ait
// qu'un seul point d'entrée.
export {
  MODES_LIVRAISON,
  estModeValide,
  calculerLivraison,
  panierEnLivraisonOfferte,
  modeDisponible,
  grouperTarifs,
  aplatirGroupes,
  DELAIS_LIVRAISON,
  DELAI_PAR_DEFAUT,
  estDelaiValide,
} from "./livraison-calcul";
export type {
  ModeLivraison,
  TarifWilaya,
  GroupeTarif,
  ParametresLivraison,
  DelaiLivraison,
} from "./livraison-calcul";

// ──────────────────────────────────────────────────────────────────────
// Lecture
// ──────────────────────────────────────────────────────────────────────

/**
 * Wilayas TARIFÉES uniquement, triées par code.
 *
 * Une wilaya absente du résultat n'est pas « non livrée » : elle est livrée
 * à un prix encore inconnu, annoncé au client lors de l'appel de
 * confirmation. Aucune wilaya n'est donc fermée à la commande.
 */
export async function getTarifsLivraison(): Promise<TarifWilaya[]> {
  const boutiqueId = await boutiqueActuelle();
  const lignes = await prisma.tarifLivraison.findMany({
    where: { boutiqueId },
    orderBy: { wilaya: "asc" },
  });
  // On filtre sur WILAYAS pour ignorer un éventuel code obsolète en base.
  const valides = new Set(WILAYAS.map((w) => w.code));
  return lignes
    .filter((l) => valides.has(l.wilaya))
    .map((l) => ({
      wilaya: l.wilaya,
      prixDomicile: l.prixDomicile,
      prixStopdesk: l.prixStopdesk,
    }));
}

/** Paramètres globaux de livraison. */
export async function getParametresLivraison(): Promise<ParametresLivraison> {
  const boutiqueId = await boutiqueActuelle();
  const p = await prisma.parametresBoutique.findUnique({
    where: { boutiqueId },
  });
  return { livraisonGratuite: p?.livraisonGratuite ?? false };
}

// ──────────────────────────────────────────────────────────────────────
// Écriture (admin)
// ──────────────────────────────────────────────────────────────────────

/**
 * Remplace l'INTÉGRALITÉ des groupes de tarifs.
 *
 * L'admin envoie la liste complète des groupes : les wilayas qui n'y figurent
 * plus voient leur ligne supprimée, et repassent donc au prix inconnu annoncé
 * à l'appel. C'est ce qui permet de se passer d'un booléen « actif » —
 * retirer une wilaya d'un groupe suffit à en oublier le prix.
 *
 * Tout se fait dans UNE transaction : jamais d'état intermédiaire où la
 * boutique ne livrerait nulle part.
 */
export async function enregistrerGroupes(
  groupes: GroupeTarif[]
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const codesValides = new Set(WILAYAS.map((w) => w.code));

  for (const g of groupes) {
    if (!Array.isArray(g.wilayas) || g.wilayas.length === 0) {
      return { ok: false, erreur: "groupe_vide" };
    }
    if (g.wilayas.some((w) => !codesValides.has(w))) {
      return { ok: false, erreur: "wilaya_invalide" };
    }
    // Le prix a domicile peut etre absent (null) : le groupe est alors
    // livre au bureau uniquement. Le stopdesk, lui, est obligatoire.
    if (
      g.prixDomicile !== null &&
      (!Number.isInteger(g.prixDomicile) || g.prixDomicile < 0)
    ) {
      return { ok: false, erreur: "prix_invalide" };
    }
    if (!Number.isInteger(g.prixStopdesk) || g.prixStopdesk < 0) {
      return { ok: false, erreur: "prix_invalide" };
    }
  }

  // Une wilaya ne peut pas être dans deux groupes : ce serait deux prix
  // contradictoires pour la même destination.
  const vues = new Set<string>();
  for (const g of groupes) {
    for (const w of g.wilayas) {
      if (vues.has(w)) return { ok: false, erreur: "wilaya_en_double" };
      vues.add(w);
    }
  }

  const tarifs = aplatirGroupes(groupes);
  const boutiqueId = await boutiqueActuelle();

  try {
    // ⚠️ On efface tout puis on réinsère en bloc, au lieu d'un upsert par
    // wilaya. Raison : un upsert par wilaya faisait 58 allers-retours vers
    // Neon (~120 ms chacun) dans une seule transaction, soit ~7 s — au-delà
    // du délai maximum d'une transaction Prisma (5 s par défaut). L'écriture
    // échouait donc dès qu'on sélectionnait beaucoup de wilayas, c'est-à-dire
    // dans le cas d'usage le plus courant.
    //
    // Ici : 3 requêtes au total, quel que soit le nombre de wilayas.
    // Le tout reste atomique — jamais d'instant où la boutique ne livre nulle
    // part, puisque la suppression et l'insertion sont dans la même transaction.
    await prisma.$transaction(
      [
        // ⚠️ Filtre indispensable : sans lui, un marchand qui enregistre sa
        // grille effacerait celle de tous les autres marchands.
        prisma.tarifLivraison.deleteMany({ where: { boutiqueId } }),
        // ⚠️ On n'émet PAS d'insertion quand il n'y a rien à insérer.
        //
        // Ce n'est pas qu'une optimisation. Le garde-fou multi-boutiques
        // (lib/prisma-cloisonnement.ts) exige que CHAQUE ligne d'un
        // createMany porte son boutiqueId ; un tableau vide n'en porte
        // aucun, il est donc rejeté. Et comme le rejet survient dans la
        // transaction, la suppression était annulée avec lui : le marchand
        // qui effaçait son dernier tarif voyait « une erreur est survenue »
        // et retrouvait sa grille intacte.
        ...(tarifs.length > 0
          ? [
              prisma.tarifLivraison.createMany({
                data: tarifs.map((t) => ({ ...t, boutiqueId })),
              }),
            ]
          : []),
      ],
      // Marge confortable : la valeur par défaut (5 s) est juste quand la
      // latence vers Neon est élevée ou qu'une autre écriture tient un verrou.
      { timeout: 20_000 }
    );
    return { ok: true };
  } catch (e) {
    // On TRACE la cause réelle. Un catch muet rend ce genre d'échec
    // impossible à diagnostiquer depuis les logs de production.
    console.error("[livraison] echec enregistrerGroupes :", e);
    return { ok: false, erreur: "erreur_serveur" };
  }
}

/**
 * Enregistre les réglages généraux, indépendamment des tarifs.
 * Séparé pour que la section « livraison gratuite » ait son propre bouton :
 * l'admin sauve un réglage sans emporter des tarifs encore en cours d'édition.
 */
export async function enregistrerParametres(
  parametres: ParametresLivraison
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const gratuite = parametres.livraisonGratuite;
  if (typeof gratuite !== "boolean") {
    return { ok: false, erreur: "gratuite_invalide" };
  }
  try {
    const boutiqueId = await boutiqueActuelle();
    await prisma.parametresBoutique.upsert({
      where: { boutiqueId },
      update: { livraisonGratuite: gratuite },
      create: { boutiqueId, livraisonGratuite: gratuite },
    });
    return { ok: true };
  } catch (e) {
    console.error("[livraison] echec enregistrerParametres :", e);
    return { ok: false, erreur: "erreur_serveur" };
  }
}
