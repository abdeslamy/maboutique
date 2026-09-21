import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import {
  enregistrerGroupes,
  enregistrerParametres,
  type GroupeTarif,
} from "@/lib/livraison";

/**
 * PUT /api/admin/livraison
 * Remplace l'intégralité des groupes de tarifs + le réglage de gratuité.
 *
 * Body : {
 *   groupes: [{ wilayas: string[], prixDomicile: number, prixStopdesk: number }],
 *   parametres: { livraisonGratuite: boolean }
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
    parametres?: { livraisonGratuite?: unknown };
  };

  // Enregistrement PARTIEL : chaque section de la page a son propre bouton.
  // On ne touche qu'à ce qui est effectivement transmis, pour qu'un
  // enregistrement des réglages n'emporte pas des tarifs en cours d'édition.
  if (brut.groupes === undefined && brut.parametres === undefined) {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  if (brut.parametres !== undefined) {
    // Tout ce qui n'est pas explicitement `true` vaut « pas de gratuité ».
    // Un réglage aussi lourd de conséquences ne s'active pas par accident,
    // au détour d'une chaîne ou d'un 1 envoyés par un client mal écrit.
    const r = await enregistrerParametres({
      livraisonGratuite: brut.parametres.livraisonGratuite === true,
    });
    if (!r.ok) {
      return NextResponse.json({ erreur: r.erreur }, { status: 400 });
    }
  }

  if (brut.groupes !== undefined) {
    if (!Array.isArray(brut.groupes)) {
      return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
    }
    const groupes: GroupeTarif[] = brut.groupes.map((g) => {
      const o = g as Record<string, unknown>;
      return {
        wilayas: Array.isArray(o.wilayas)
          ? o.wilayas.filter((w): w is string => typeof w === "string")
          : [],
        // Champ vide -> null = pas de livraison a domicile pour ce groupe.
        prixDomicile:
          o.prixDomicile === null ||
          o.prixDomicile === "" ||
          o.prixDomicile === undefined
            ? null
            : Number(o.prixDomicile),
        prixStopdesk: Number(o.prixStopdesk),
      };
    });
    const r = await enregistrerGroupes(groupes);
    if (!r.ok) {
      return NextResponse.json({ erreur: r.erreur }, { status: 400 });
    }
  }

  return NextResponse.json({ succes: true });
}
