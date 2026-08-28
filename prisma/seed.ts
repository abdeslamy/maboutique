// ============================================================================
// Script de SEED — insère les données de départ dans la base
// ============================================================================
//
// Lancé avec : npx prisma db seed
// (la commande est configurée dans prisma.config.ts)
//
// Idempotent : on utilise `upsert`, donc relancer ce script met à jour les
// données existantes au lieu de crasher.
// ============================================================================

import "dotenv/config";
import { BOUTIQUE_PAR_DEFAUT } from "../lib/boutique";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PRODUITS_INITIAUX as PRODUITS } from "./seed-data";

async function main() {
  // On crée un client Prisma dédié au seed (pas le singleton — on est hors Next.js).
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant");
  const adapter = new PrismaNeon({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seed des produits...\n");

  // Pour chaque produit du catalogue statique, on fait un upsert.
  // upsert = "si un produit avec cet id existe → mettre à jour ; sinon → créer"
  for (const p of PRODUITS) {
    await prisma.produit.upsert({
      // L'étiquette est dans le `where` autant que dans le `create` : le
      // garde de cloisonnement refuse les deux formes sans elle, et il a
      // raison — le seed ne doit peupler qu'une boutique nommée.
      where: { id: p.id, boutiqueId: BOUTIQUE_PAR_DEFAUT },
      // Ce qui est appliqué si le produit existe déjà :
      // le stock n'est PAS remis à zéro — il reflète l'inventaire réel,
      // qui a pu bouger depuis. Seul le contenu éditorial est rafraîchi.
      update: {
        nomFr: p.nom.fr,
        nomAr: p.nom.ar,
        descriptionFr: p.description.fr,
        descriptionAr: p.description.ar,
        prix: p.prix,
        categorie: p.categorie,
        images: p.images,
        emoji: p.emoji,
      },
      // Ce qui est appliqué si le produit n'existe pas :
      create: {
        id: p.id,
        nomFr: p.nom.fr,
        nomAr: p.nom.ar,
        descriptionFr: p.description.fr,
        descriptionAr: p.description.ar,
        prix: p.prix,
        categorie: p.categorie,
        images: p.images,
        emoji: p.emoji,
        stock: p.stock,
        // Hors requête HTTP, aucun hôte à résoudre : la boutique est nommée.
        boutiqueId: BOUTIQUE_PAR_DEFAUT,
      },
    });
    console.log(`  ✓ ${p.nom.fr}`);
  }

  const total = await prisma.produit.count({
    where: { boutiqueId: BOUTIQUE_PAR_DEFAUT },
  });
  console.log(`\n✅ ${total} produits dans la boutique ${BOUTIQUE_PAR_DEFAUT}.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Erreur pendant le seed :", err);
  process.exit(1);
});
