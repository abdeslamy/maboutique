import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { creerCommande } from "@/lib/orders";
import { routing, type Locale } from "@/i18n/routing";

/**
 * POST /api/admin/commandes
 * Saisie manuelle d'une commande par l'admin (reçue par téléphone, sur les
 * réseaux sociaux…).
 *
 * On réutilise `creerCommande`, la MÊME fonction que le tunnel client : prix
 * recalculés depuis la base, tarif de livraison selon la wilaya, décrément du
 * stock en transaction. Une commande saisie à la main suit donc exactement les
 * mêmes règles qu'une commande passée par un client — pas de second chemin à
 * maintenir, ni de risque d'écart entre les deux.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const utilisateur = await getUtilisateurParId(session.id);
  if (!utilisateur || utilisateur.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  let body: {
    articles?: Array<{ produitId?: string; quantite?: number }>;
    client?: {
      nom?: string;
      telephone?: string;
      adresse?: string;
      wilaya?: string;
    };
    modeLivraison?: string;
    locale?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const articles = Array.isArray(body.articles)
    ? body.articles.map((a) => ({
        produitId: String(a?.produitId ?? ""),
        quantite: Math.floor(Number(a?.quantite) || 0),
      }))
    : [];

  const locale: Locale = routing.locales.includes(body.locale as Locale)
    ? (body.locale as Locale)
    : routing.defaultLocale;

  const resultat = await creerCommande({
    articles,
    client: {
      nom: String(body.client?.nom ?? ""),
      telephone: String(body.client?.telephone ?? ""),
      adresse: String(body.client?.adresse ?? ""),
      wilaya: String(body.client?.wilaya ?? ""),
    },
    // Pas d'utilisateurId : la commande n'appartient à aucun compte client.
    modeLivraison: body.modeLivraison,
    locale,
  });

  if (!resultat.ok) {
    return NextResponse.json(
      { erreur: resultat.erreur, produitNom: resultat.produitNom },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { succes: true, commandeId: resultat.commande.id },
    { status: 201 }
  );
}
