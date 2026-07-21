import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import {
  getUtilisateurParId,
  mettreAJourUtilisateur,
} from "@/lib/auth";

/**
 * PATCH /api/auth/profil
 * Modifie le NOM et/ou l'IMAGE de l'utilisateur connecté.
 * (Changer le mot de passe est un endpoint séparé : /api/auth/profil/mot-de-passe)
 *
 * Body : { nom?: string, image?: string | null }
 *  - image = string  : nouvelle image en base64 (data URL)
 *  - image = null    : supprimer l'image
 *  - image absent    : on ne touche pas à l'image
 */

// Limite pour éviter de stocker des "petits paquets" trop gros dans la base.
// 500 KB en base64 ≈ 375 KB de fichier original — largement suffisant pour un
// avatar redimensionné côté navigateur.
const IMAGE_MAX_LONGUEUR_BASE64 = 500_000;

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }

  let body: { nom?: string; image?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const modifs: { nom?: string; image?: string } = {};

  // ── Nom ───────────────────────────────────────────────────────────────
  if (typeof body.nom === "string") {
    const nom = body.nom.trim();
    if (nom.length < 2) {
      return NextResponse.json({ erreur: "nom_court" }, { status: 400 });
    }
    modifs.nom = nom;
  }

  // ── Image ─────────────────────────────────────────────────────────────
  if (body.image === null) {
    modifs.image = undefined; // on efface (undefined → colonne mise à NULL)
  } else if (typeof body.image === "string") {
    if (!body.image.startsWith("data:image/")) {
      return NextResponse.json({ erreur: "image_invalide" }, { status: 400 });
    }
    if (body.image.length > IMAGE_MAX_LONGUEUR_BASE64) {
      return NextResponse.json({ erreur: "image_trop_grande" }, { status: 400 });
    }
    modifs.image = body.image;
  }

  if (Object.keys(modifs).length === 0) {
    return NextResponse.json({ erreur: "aucun_changement" }, { status: 400 });
  }

  const utilisateur = await mettreAJourUtilisateur(session.id, modifs);
  if (!utilisateur) {
    return NextResponse.json({ erreur: "utilisateur_introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    succes: true,
    utilisateur: {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      image: utilisateur.image,
    },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const u = await getUtilisateurParId(session.id);
  if (!u) {
    return NextResponse.json({ erreur: "utilisateur_introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    utilisateur: { id: u.id, email: u.email, nom: u.nom, image: u.image },
  });
}
