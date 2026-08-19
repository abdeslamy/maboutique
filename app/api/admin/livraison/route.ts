import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { enregistrerLivraison, type EntreeTarif } from "@/lib/livraison";

/**
 * PUT /api/admin/livraison
 * Enregistre les tarifs par wilaya + les paramètres de livraison.
 *
 * Body : {
 *   tarifs: [{ wilaya, prixDomicile, prixStopdesk, actif }],
 *   parametres: { seuilLivraisonGratuite: number|null, delaiMin, delaiMax }
 * }
 *
 * Garde admin explicite : les Route Handlers ne passent PAS par le layout
 * de /admin, sa protection ne s'applique donc pas ici.
 */
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const utilisateur = await getUtilisateurParId(session.id);
  if (!utilisateur || utilisateur.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const brut = body as {
    tarifs?: unknown;
    parametres?: {
      seuilLivraisonGratuite?: unknown;
      delaiMin?: unknown;
      delaiMax?: unknown;
    };
  };

  if (!Array.isArray(brut.tarifs)) {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const tarifs: EntreeTarif[] = brut.tarifs.map((t) => {
    const o = t as Record<string, unknown>;
    return {
      wilaya: String(o.wilaya ?? ""),
      prixDomicile: Number(o.prixDomicile),
      prixStopdesk: Number(o.prixStopdesk),
      actif: Boolean(o.actif),
    };
  });

  const seuilBrut = brut.parametres?.seuilLivraisonGratuite;
  const resultat = await enregistrerLivraison(tarifs, {
    // Champ vidé ou absent → pas de gratuité (null), pas 0 (qui voudrait
    // dire "gratuite dès le premier dinar").
    seuilLivraisonGratuite:
      seuilBrut === null || seuilBrut === "" || seuilBrut === undefined
        ? null
        : Number(seuilBrut),
    delaiMin: Number(brut.parametres?.delaiMin ?? 3),
    delaiMax: Number(brut.parametres?.delaiMax ?? 5),
  });

  if (!resultat.ok) {
    return NextResponse.json({ erreur: resultat.erreur }, { status: 400 });
  }
  return NextResponse.json({ succes: true });
}
