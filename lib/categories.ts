// ============================================================================
// Catégories — lecture/écriture en base.
// ⚠️ Fonctions SERVEUR uniquement (Prisma). Le catalogue des choix possibles
// vit dans lib/categories-catalogue.ts, sans Prisma, importable côté client.
// ============================================================================

import { prisma } from "@/lib/prisma";
import { boutiqueActuelle } from "@/lib/boutique";
import { CATALOGUE_CATEGORIES } from "./categories-catalogue";

export type { CategorieCatalogue } from "./categories-catalogue";
export { CATALOGUE_CATEGORIES } from "./categories-catalogue";

export type CategorieBoutique = {
  id: string;
  nomFr: string;
  nomAr: string;
  ordre: number;
};

export type CategorieAvecCompteur = CategorieBoutique & {
  /** Nombre de produits actuellement rattachés à ce rayon. */
  nbProduits: number;
};

/**
 * Catégories + nombre de produits de chacune.
 * Sert à prévenir l'admin AVANT qu'il tente de retirer un rayon occupé,
 * plutôt que de le laisser découvrir le refus au moment d'enregistrer.
 */
export async function getCategoriesAvecCompteur(): Promise<
  CategorieAvecCompteur[]
> {
  // Deux requêtes indépendantes → lancées ensemble.
  const boutiqueId = await boutiqueActuelle();
  const [categories, comptes] = await Promise.all([
    getCategories(),
    prisma.produit.groupBy({
      by: ["categorie"],
      where: { boutiqueId },
      _count: { _all: true },
    }),
  ]);
  const parCategorie = new Map(
    comptes.map((c) => [c.categorie, c._count._all])
  );
  return categories.map((c) => ({
    ...c,
    nbProduits: parCategorie.get(c.id) ?? 0,
  }));
}

/** Catégories de la boutique, dans l'ordre d'affichage. */
export async function getCategories(): Promise<CategorieBoutique[]> {
  const boutiqueId = await boutiqueActuelle();
  return prisma.categorie.findMany({
    where: { boutiqueId },
    orderBy: [{ ordre: "asc" }, { nomFr: "asc" }],
  });
}

/**
 * Remplace la liste des catégories par celle transmise.
 *
 * Les ids proviennent OBLIGATOIREMENT du catalogue prédéfini : on ne fait pas
 * confiance aux noms envoyés par le client, on les relit dans le catalogue.
 * C'est ce qui garantit des traductions correctes et des slugs propres.
 */
export async function enregistrerCategories(
  ids: string[]
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const connus = new Map(CATALOGUE_CATEGORIES.map((c) => [c.id, c]));
  const uniques = [...new Set(ids)];
  if (uniques.some((id) => !connus.has(id))) {
    return { ok: false, erreur: "categorie_inconnue" };
  }
  if (uniques.length === 0) {
    return { ok: false, erreur: "aucune_categorie" };
  }

  // Une catégorie encore portée par des produits ne peut pas disparaître :
  // ces produits deviendraient introuvables dans les filtres.
  const boutiqueId = await boutiqueActuelle();
  const utilisees = await prisma.produit.findMany({
    where: { boutiqueId },
    select: { categorie: true },
    distinct: ["categorie"],
  });
  const orphelines = utilisees
    .map((p) => p.categorie)
    .filter((c) => !uniques.includes(c));
  if (orphelines.length > 0) {
    return { ok: false, erreur: "categorie_utilisee" };
  }

  const lignes = uniques.map((id, i) => {
    const c = connus.get(id)!;
    return { id: c.id, nomFr: c.nomFr, nomAr: c.nomAr, ordre: i, boutiqueId };
  });

  try {
    // Remplacement en bloc : 2 requêtes quel que soit le nombre de rayons.
    await prisma.$transaction(
      [
        // ⚠️ Sans ce filtre, l'enregistrement des rayons d'un marchand
        // effacerait ceux de TOUS les autres.
        prisma.categorie.deleteMany({ where: { boutiqueId } }),
        prisma.categorie.createMany({ data: lignes }),
      ],
      { timeout: 20_000 }
    );
    return { ok: true };
  } catch (e) {
    console.error("[categories] echec enregistrerCategories :", e);
    return { ok: false, erreur: "erreur_serveur" };
  }
}
