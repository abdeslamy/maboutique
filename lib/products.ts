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
import { boutiqueActuelle } from "@/lib/boutique";
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
    stock: p.stock,
    delaiLivraison: p.delaiLivraison,
    livraisonGratuite: p.livraisonGratuite,
  };
}

/** Récupère tous les produits, triés par date de création (les plus récents d'abord). */
export async function getAllProduits(): Promise<Produit[]> {
  const boutiqueId = await boutiqueActuelle();
  const rows = await prisma.produit.findMany({
    where: { boutiqueId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(dbToProduit);
}

/** Récupère un produit par son id. `null` si introuvable. */
export async function getProduitParId(id: string): Promise<Produit | null> {
  const boutiqueId = await boutiqueActuelle();
  // findFirst et non findUnique : l'id seul reste la clé primaire (voir la
  // dette signalée dans le schéma), il faut donc filtrer la boutique nous-mêmes.
  const row = await prisma.produit.findFirst({ where: { id, boutiqueId } });
  return row ? dbToProduit(row) : null;
}

/** Récupère plusieurs produits par leurs ids, dans l'ordre demandé. */
export async function getProduitsParIds(ids: string[]): Promise<Produit[]> {
  if (ids.length === 0) return [];
  const boutiqueId = await boutiqueActuelle();
  const rows = await prisma.produit.findMany({
    where: { id: { in: ids }, boutiqueId },
  });
  const map = new Map(rows.map((r) => [r.id, dbToProduit(r)]));
  // On retourne dans l'ordre des ids reçus, en filtrant ceux introuvables.
  return ids.map((id) => map.get(id)).filter((p): p is Produit => p !== undefined);
}

// ══════════════════════════════════════════════════════════════════════
// ADMIN — Écriture (create / update / delete)
// ══════════════════════════════════════════════════════════════════════

// slugifier vit dans lib/slug.ts (pas d'import Prisma → utilisable côté client).
export { slugifier } from "./slug";

// Données attendues pour créer/modifier un produit.
export type EntreeProduit = {
  id: string;
  nomFr: string;
  nomAr: string;
  descriptionFr: string;
  descriptionAr: string;
  prix: number;
  categorie: Categorie;
  images: string[];
  /** Stock initial / mis à jour. Entier >= 0. */
  stock: number;
  /** Délai annoncé au client pour ce produit. */
  delaiLivraison: string;
  /** Livraison offerte sur ce produit. */
  livraisonGratuite: boolean;
  /** Optionnel : n'est plus saisi dans le formulaire (repli legacy). */
  emoji?: string;
  videoUrl?: string;
};

export type ResultatEcriture =
  | { ok: true; produit: Produit }
  | { ok: false; erreur: string };

/**
 * Crée un nouveau produit dans la base.
 * Retourne { ok: false, erreur: "id_existe" } si le slug est déjà pris.
 */
export async function creerProduit(
  input: EntreeProduit
): Promise<ResultatEcriture> {
  // On vérifie que l'id (slug) n'existe pas déjà.
  const boutiqueId = await boutiqueActuelle();
  // Unicité vérifiée DANS la boutique. Deux marchands peuvent vendre un
  // « casque-bluetooth » sans se gêner — enfin, ils le pourront une fois la
  // clé primaire du produit corrigée ; aujourd'hui la collision reste globale.
  const existant = await prisma.produit.findFirst({
    where: { id: input.id, boutiqueId },
    select: { id: true },
  });
  if (existant) return { ok: false, erreur: "id_existe" };

  try {
    const row = await prisma.produit.create({
      data: {
        id: input.id,
        nomFr: input.nomFr.trim(),
        nomAr: input.nomAr.trim(),
        descriptionFr: input.descriptionFr.trim(),
        descriptionAr: input.descriptionAr.trim(),
        prix: input.prix,
        categorie: input.categorie,
        images: input.images,
        stock: input.stock,
        delaiLivraison: input.delaiLivraison,
        livraisonGratuite: input.livraisonGratuite,
        boutiqueId,
        // Sans valeur fournie, le schéma applique son défaut ("📦").
        ...(input.emoji ? { emoji: input.emoji } : {}),
        videoUrl: input.videoUrl || null,
      },
    });
    return { ok: true, produit: dbToProduit(row) };
  } catch {
    return { ok: false, erreur: "erreur_serveur" };
  }
}

/**
 * Met à jour un produit existant.
 * L'id (slug) N'est PAS modifiable ici — il est stable pour préserver les URLs.
 */
export async function mettreAJourProduit(
  id: string,
  input: Omit<EntreeProduit, "id">
): Promise<ResultatEcriture> {
  const boutiqueId = await boutiqueActuelle();
  try {
    const row = await prisma.produit.update({
      // boutiqueId dans le where : un admin ne peut pas modifier le produit
      // d'un autre marchand, même en devinant son id.
      where: { id, boutiqueId },
      data: {
        nomFr: input.nomFr.trim(),
        nomAr: input.nomAr.trim(),
        descriptionFr: input.descriptionFr.trim(),
        descriptionAr: input.descriptionAr.trim(),
        prix: input.prix,
        categorie: input.categorie,
        images: input.images,
        stock: input.stock,
        delaiLivraison: input.delaiLivraison,
        livraisonGratuite: input.livraisonGratuite,
        // L'emoji n'est plus modifiable depuis le formulaire : on laisse
        // intacte la valeur existante en base plutôt que de l'écraser.
        videoUrl: input.videoUrl || null,
      },
    });
    return { ok: true, produit: dbToProduit(row) };
  } catch {
    return { ok: false, erreur: "produit_introuvable" };
  }
}

/** Supprime un produit. Les LigneCommande référentes voient produitId → NULL (voir schema). */
export async function supprimerProduit(id: string): Promise<boolean> {
  const boutiqueId = await boutiqueActuelle();
  try {
    await prisma.produit.delete({ where: { id, boutiqueId } });
    return true;
  } catch {
    return false;
  }
}
