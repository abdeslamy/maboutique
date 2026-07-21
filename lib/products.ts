// ============================================================================
// Produits — lecture depuis la base de données via Prisma.
// ============================================================================
//
// AVANT : un tableau en dur exporté (const PRODUITS = [...])
// APRÈS : des fonctions ASYNCHRONES qui interrogent la base.
//
// Ces fonctions ne peuvent être appelées que côté SERVEUR (Server Components,
// Route Handlers, Server Actions). Pour les composants CLIENT, on passe par
// le `ProductsContext` qui reçoit les produits en props du serveur.
// ============================================================================

import { prisma } from "@/lib/prisma";
import type { Categorie, Produit } from "./types";
import type { ProduitModel } from "@/lib/generated/prisma/models";

/**
 * Convertit un enregistrement Prisma vers le type Produit utilisé par l'UI.
 * DB : nomFr / nomAr séparés → UI : nom: { fr, ar } imbriqué.
 * On garde ainsi les composants inchangés.
 */
function dbToProduit(p: ProduitModel): Produit {
  return {
    id: p.id,
    nom: { fr: p.nomFr, ar: p.nomAr },
    description: { fr: p.descriptionFr, ar: p.descriptionAr },
    prix: p.prix,
    categorie: p.categorie as Categorie,
    images: p.images,
    videoUrl: p.videoUrl ?? undefined,
    emoji: p.emoji,
  };
}

/** Récupère tous les produits, triés par date de création (les plus récents d'abord). */
export async function getAllProduits(): Promise<Produit[]> {
  const rows = await prisma.produit.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(dbToProduit);
}

/** Récupère un produit par son id. `null` si introuvable. */
export async function getProduitParId(id: string): Promise<Produit | null> {
  const row = await prisma.produit.findUnique({ where: { id } });
  return row ? dbToProduit(row) : null;
}

/** Récupère plusieurs produits par leurs ids, dans l'ordre demandé. */
export async function getProduitsParIds(ids: string[]): Promise<Produit[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.produit.findMany({ where: { id: { in: ids } } });
  const map = new Map(rows.map((r) => [r.id, dbToProduit(r)]));
  // On retourne dans l'ordre des ids reçus, en filtrant ceux introuvables.
  return ids.map((id) => map.get(id)).filter((p): p is Produit => p !== undefined);
}
