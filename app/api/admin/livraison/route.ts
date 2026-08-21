import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { enregistrerGroupes, type GroupeTarif } from "@/lib/livraison";

/**
 * PUT /api/admin/livraison
 * Remplace l'intégralité des groupes de tarifs + le seuil de gratuité.
 *
 * Body : {
 *   groupes: [{ wilayas: string[], prixDomicile: number, prixStopdesk: number }],
 *   parametres: { seuilLivraisonGratuite: number|null }
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
    groupes?: unknown;
    parametres?: { seuilLivraisonGratuite?: unknown };
  };

  if (!Array.isArray(brut.groupes)) {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const groupes: GroupeTarif[] = brut.groupes.map((g) => {
    const o = g as Record<string, unknown>;
    return {
      wilayas: Array.isArray(o.wilayas)
        ? o.wilayas.filter((w): w is string => typeof w === "string")
        : [],
      prixDomicile: Number(o.prixDomicile),
      prixStopdesk: Number(o.prixStopdesk),
    };
  });

  const seuilBrut = brut.parametres?.seuilLivraisonGratuite;
  const resultat = await enregistrerGroupes(groupes, {
    // Champ vidé → pas de gratuité (null), et non 0 qui signifierait
    // « offerte dès le premier dinar ».
    seuilLivraisonGratuite:
      seuilBrut === null || seuilBrut === "" || seuilBrut === undefined
        ? null
        : Number(seuilBrut),
  });

  if (!resultat.ok) {
    return NextResponse.json({ erreur: resultat.erreur }, { status: 400 });
  }
  return NextResponse.json({ succes: true });
}
