import { NextResponse, type NextRequest } from "next/server";
import {
  creerUtilisateur,
  trouverUtilisateurParEmail,
} from "@/lib/auth";

/**
 * POST /api/auth/inscription
 * Body JSON attendu : { nom, email, motDePasse }
 *
 * Validation effectuée :
 *  - email présent et bien formé
 *  - nom d'au moins 2 caractères
 *  - mot de passe d'au moins 8 caractères
 *  - email pas déjà utilisé
 *
 * ⚠️ Cette validation DOIT exister côté serveur même si on la fait aussi côté
 *    client. Le client peut être contourné (curl, modification du JS),
 *    seul le serveur est une vraie barrière de sécurité.
 */
export async function POST(req: NextRequest) {
  let body: { nom?: string; email?: string; motDePasse?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { erreur: "json_invalide" },
      { status: 400 }
    );
  }

  const nom = (body.nom ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";

  // ── Validations ────────────────────────────────────────────────────────
  if (nom.length < 2) {
    return NextResponse.json({ erreur: "nom_court" }, { status: 400 });
  }
  // Regex très simple pour l'email — pas parfait, mais suffisant pour démarrer.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { erreur: "email_invalide" },
      { status: 400 }
    );
  }
  if (motDePasse.length < 8) {
    return NextResponse.json(
      { erreur: "mot_de_passe_court" },
      { status: 400 }
    );
  }

  // ── Email déjà pris ? ──────────────────────────────────────────────────
  const existant = await trouverUtilisateurParEmail(email);
  if (existant) {
    // 409 Conflict = la ressource existe déjà.
    return NextResponse.json({ erreur: "email_existe" }, { status: 409 });
  }

  // ── Création ───────────────────────────────────────────────────────────
  try {
    const utilisateur = await creerUtilisateur({ nom, email, motDePasse });
    // On NE renvoie JAMAIS le hash du mot de passe au client.
    return NextResponse.json(
      {
        succes: true,
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
        },
      },
      { status: 201 } // 201 Created
    );
  } catch {
    return NextResponse.json(
      { erreur: "erreur_serveur" },
      { status: 500 }
    );
  }
}
