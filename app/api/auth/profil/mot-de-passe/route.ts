import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import {
  getUtilisateurParId,
  hashMotDePasse,
  mettreAJourUtilisateur,
  verifierMotDePasse,
} from "@/lib/auth";

/**
 * PATCH /api/auth/profil/mot-de-passe
 * Body : { actuel: string, nouveau: string }
 *
 * Sécurité :
 *  - Doit être connecté.
 *  - On REVÉRIFIE l'ancien mot de passe avant de le changer.
 *    Empêche que quelqu'un qui s'asseoit devant un PC laissé connecté
 *    puisse changer le mot de passe et bloquer le vrai propriétaire.
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }

  let body: { actuel?: string; nouveau?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const actuel = body.actuel ?? "";
  const nouveau = body.nouveau ?? "";

  if (!actuel || !nouveau) {
    return NextResponse.json({ erreur: "champs_manquants" }, { status: 400 });
  }
  if (nouveau.length < 8) {
    return NextResponse.json({ erreur: "mot_de_passe_court" }, { status: 400 });
  }

  const utilisateur = await getUtilisateurParId(session.id);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "utilisateur_introuvable" }, { status: 404 });
  }

  // ── Vérification de l'ancien mot de passe (étape sensible) ──────────
  const correct = await verifierMotDePasse(actuel, utilisateur.motDePasse);
  if (!correct) {
    return NextResponse.json({ erreur: "mot_de_passe_actuel_incorrect" }, { status: 401 });
  }

  // ── Hachage et sauvegarde du nouveau ────────────────────────────────
  const nouveauHash = await hashMotDePasse(nouveau);
  await mettreAJourUtilisateur(session.id, { motDePasse: nouveauHash });

  return NextResponse.json({ succes: true });
}
