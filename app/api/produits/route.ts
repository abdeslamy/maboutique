import { NextResponse, type NextRequest } from "next/server";
import { getProduitsResume } from "@/lib/products";

/**
 * GET /api/produits?ids=a,b,c
 *
 * Détails des produits présents dans le panier. Le panier ne stocke que des
 * identifiants et des quantités : il lui manque les noms, les prix et les
 * vignettes pour s'afficher.
 *
 * Avant, il les prenait dans le catalogue complet chargé par le layout — ce
 * qui obligeait CHAQUE page à transporter tout le catalogue pour qu'un badge
 * de navigation puisse fonctionner. Le compteur, lui, n'a besoin que du
 * nombre d'articles, qu'il lit dans le stockage local sans rien demander.
 *
 * Ici, on ne charge que ce qui est demandé, et seulement quand le panier
 * n'est pas vide.
 *
 * ⚠️ Les prix renvoyés servent UNIQUEMENT à l'affichage. Le montant qui fait
 * foi est recalculé côté serveur à la création de la commande, à partir de la
 * base — un prix falsifié ici n'aurait aucun effet sur ce qui est facturé.
 */

/** Un panier plus long relève de l'anomalie ou de l'abus. */
const MAX_IDS = 50;

export async function GET(req: NextRequest) {
  const brut = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = brut
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  if (ids.length === 0) return NextResponse.json({ produits: [] });

  // On relit le catalogue de la boutique courante (déjà cloisonné) puis on
  // filtre. Un `where: { id: { in: ids } }` serait plus direct, mais
  // `getProduitsResume` porte déjà la sélection de colonnes et le
  // cloisonnement — deux choses qu'il vaut mieux ne pas réécrire ailleurs.
  const tous = await getProduitsResume();
  const demandes = new Set(ids);

  return NextResponse.json({
    produits: tous.filter((p) => demandes.has(p.id)),
  });
}
