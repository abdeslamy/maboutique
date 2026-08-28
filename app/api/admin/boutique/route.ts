import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import { enregistrerEmailContact } from "@/lib/boutique";

/**
 * PUT /api/admin/boutique
 * Body : { emailContact: string } — chaîne vide pour retirer l'adresse.
 *
 * Sécurité : garde admin stricte, le rôle est relu en base et jamais tiré du
 * JWT. Même patron que les autres routes d'administration.
 *
 * La boutique visée n'est PAS transmise par le client : elle vient de
 * `boutiqueActuelle()` côté serveur. Un admin ne peut donc pas modifier la
 * fiche d'un autre marchand en changeant le corps de la requête.
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

  let body: { emailContact?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  if (typeof body.emailContact !== "string") {
    return NextResponse.json({ erreur: "champ_manquant" }, { status: 400 });
  }

  const r = await enregistrerEmailContact(body.emailContact);
  if (!r.ok) return NextResponse.json({ erreur: r.erreur }, { status: 400 });
  return NextResponse.json({ succes: true });
}
