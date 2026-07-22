import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { mettreAJourStatutCommande } from "@/lib/orders";
import type { StatutCommande } from "@/lib/types";

const STATUTS_VALIDES: StatutCommande[] = [
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

/**
 * PATCH /api/admin/commandes/[id]/statut
 * Body : { statut: "en_attente" | "confirmee" | "en_livraison" | "livree" | "annulee" }
 *
 * Sécurité :
 *  - Requiert un admin (garde stricte)
 *  - La transition doit être autorisée par la machine à états
 *    (voir transitionsAutorisees dans lib/orders.ts)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const user = await getUtilisateurParId(session.id);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  const { id } = await params;

  let body: { statut?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const nouveauStatut = body.statut as StatutCommande;
  if (!STATUTS_VALIDES.includes(nouveauStatut)) {
    return NextResponse.json({ erreur: "statut_invalide" }, { status: 400 });
  }

  const resultat = await mettreAJourStatutCommande(id, nouveauStatut);
  if (!resultat.ok) {
    const status =
      resultat.erreur === "commande_introuvable"
        ? 404
        : resultat.erreur === "transition_interdite"
        ? 409
        : 500;
    return NextResponse.json({ erreur: resultat.erreur }, { status });
  }

  return NextResponse.json({ succes: true, commande: resultat.commande });
}
