import { NextResponse, type NextRequest } from "next/server";
import { creerCommande } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { routing, type Locale } from "@/i18n/routing";

/**
 * POST /api/commandes
 * Body : { articles: [{produitId, quantite}], client: {...}, locale: "fr"|"ar" }
 *
 * - Le serveur recalcule TOUS les prix depuis lib/products.ts.
 * - Si une session existe, on rattache la commande à l'email de l'utilisateur.
 * - Renvoie 201 + { commandeId } en cas de succès.
 */
export async function POST(req: NextRequest) {
  let body: {
    articles?: Array<{ produitId?: string; quantite?: number }>;
    client?: {
      nom?: string;
      telephone?: string;
      adresse?: string;
      wilaya?: string;
    };
    locale?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  // ── Normalisation entrée ─────────────────────────────────────────────
  const articles = Array.isArray(body.articles)
    ? body.articles.map((a) => ({
        produitId: String(a?.produitId ?? ""),
        quantite: Math.floor(Number(a?.quantite) || 0),
      }))
    : [];

  const client = {
    nom: String(body.client?.nom ?? ""),
    telephone: String(body.client?.telephone ?? ""),
    adresse: String(body.client?.adresse ?? ""),
    wilaya: String(body.client?.wilaya ?? ""),
  };

  const locale: Locale = routing.locales.includes(body.locale as Locale)
    ? (body.locale as Locale)
    : routing.defaultLocale;

  // ── Récupération de la session (optionnelle) ─────────────────────────
  const session = await getSession();

  // ── Création (avec validation et recalcul des prix côté serveur) ─────
  const resultat = await creerCommande({
    articles,
    client,
    utilisateurId: session?.id,
    locale,
  });

  if (!resultat.ok) {
    return NextResponse.json({ erreur: resultat.erreur }, { status: 400 });
  }

  return NextResponse.json(
    { succes: true, commandeId: resultat.commande.id },
    { status: 201 }
  );
}
