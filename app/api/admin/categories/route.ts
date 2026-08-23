import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { enregistrerCategories } from "@/lib/categories";

/**
 * PUT /api/admin/categories
 * Body : { ids: string[] } — slugs issus du catalogue prédéfini.
 *
 * Les NOMS ne sont pas transmis : on les relit dans le catalogue côté serveur.
 * Une traduction arabe erronée est invisible pour qui ne lit pas la langue —
 * autant ne jamais laisser le client la fournir.
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

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : [];

  const r = await enregistrerCategories(ids);
  if (!r.ok) return NextResponse.json({ erreur: r.erreur }, { status: 400 });
  return NextResponse.json({ succes: true });
}
