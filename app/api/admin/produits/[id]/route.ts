import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { mettreAJourProduit, supprimerProduit } from "@/lib/products";
import { validerEntree } from "../route";

async function requireAdminApi() {
  const session = await getSession();
  if (!session) return { ok: false as const, status: 401, erreur: "non_connecte" };
  const u = await getUtilisateurParId(session.id);
  if (!u || u.role !== "admin") {
    return { ok: false as const, status: 403, erreur: "acces_refuse" };
  }
  return { ok: true as const };
}

/** PATCH /api/admin/produits/[id] — modifier un produit */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ erreur: auth.erreur }, { status: auth.status });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  // On force l'id de l'URL — pas modifiable par l'admin en édition.
  body.id = id;
  const donnees = validerEntree(body);
  if ("erreur" in donnees) {
    return NextResponse.json({ erreur: donnees.erreur }, { status: 400 });
  }

  // On enlève l'id des champs à mettre à jour (l'id est stable).
  const { id: _id, ...maj } = donnees;
  void _id;

  const resultat = await mettreAJourProduit(id, maj);
  if (!resultat.ok) {
    return NextResponse.json(
      { erreur: resultat.erreur },
      { status: resultat.erreur === "produit_introuvable" ? 404 : 400 }
    );
  }
  return NextResponse.json({ succes: true, produit: resultat.produit });
}

/** DELETE /api/admin/produits/[id] — supprimer un produit */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ erreur: auth.erreur }, { status: auth.status });
  }

  const { id } = await params;
  const ok = await supprimerProduit(id);
  if (!ok) {
    return NextResponse.json(
      { erreur: "produit_introuvable" },
      { status: 404 }
    );
  }
  return NextResponse.json({ succes: true });
}
