import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { mettreAJourCommandeAdmin } from "@/lib/orders";
import type { EtatAppel, StatutCommande } from "@/lib/types";

/**
 * PATCH /api/admin/commandes/[id]
 * Body : { statut?, etatAppel?, notes? }  (tous optionnels)
 *
 * Met à jour la gestion d'une commande. Réservé aux admins.
 * Le statut est LIBRE (pas de contrainte de progression).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Garde admin ──────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const user = await getUtilisateurParId(session.id);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    statut?: string;
    etatAppel?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const resultat = await mettreAJourCommandeAdmin(id, {
    statut: body.statut as StatutCommande | undefined,
    etatAppel: body.etatAppel as EtatAppel | undefined,
    notes: body.notes,
  });

  if (!resultat.ok) {
    const status =
      resultat.erreur === "commande_introuvable" ? 404 : 400;
    return NextResponse.json({ erreur: resultat.erreur }, { status });
  }

  return NextResponse.json({ succes: true, commande: resultat.commande });
}
