import { NextResponse, type NextRequest } from "next/server";
import {
  trouverUtilisateurParEmail,
  verifierMotDePasse,
} from "@/lib/auth";
import { creerToken, poserCookieSession } from "@/lib/session";
import { adresseAppelant, reinitialiser, tenter } from "@/lib/limiteur";

/**
 * POST /api/auth/connexion
 * Body : { email, motDePasse }
 *
 * Étapes :
 *  1. Récupérer l'utilisateur par email.
 *  2. Comparer le mot de passe au hash bcrypt.
 *  3. Si OK : créer un JWT et le déposer dans un cookie httpOnly.
 *
 * ⚠️ Sécurité : on renvoie le MÊME code d'erreur (identifiants_invalides)
 *    que l'email soit inconnu OU que le mot de passe soit faux. Cela évite
 *    de révéler à un attaquant si un email existe ou pas dans notre base
 *    (technique appelée "user enumeration").
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; motDePasse?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const motDePasse = body.motDePasse ?? "";

  if (!email || !motDePasse) {
    return NextResponse.json(
      { erreur: "champs_manquants" },
      { status: 400 }
    );
  }

  // ── Limitation des tentatives ────────────────────────────────────────
  // Deux compteurs complémentaires :
  //   - par adresse + email : bloque l'acharnement sur UN compte ;
  //   - par adresse seule   : bloque le balayage de MILLE comptes, que le
  //     premier compteur laisserait passer puisque l'email change à chaque
  //     essai.
  // Ils ne sont incrémentés que sur ÉCHEC (voir plus bas) : un utilisateur
  // qui se connecte correctement dix fois de suite n'est jamais gêné.
  const ip = adresseAppelant(req);
  const cleCompte = `connexion:${ip}:${email}`;
  const cleAdresse = `connexion:${ip}`;

  for (const [cle, max, fenetre] of [
    [cleCompte, 5, 900],
    [cleAdresse, 30, 900],
  ] as const) {
    const v = tenter(cle, max, fenetre);
    if (!v.ok) {
      return NextResponse.json(
        { erreur: "trop_de_tentatives", resteSec: v.resteSec },
        { status: 429, headers: { "Retry-After": String(v.resteSec) } }
      );
    }
  }

  const utilisateur = await trouverUtilisateurParEmail(email);
  if (!utilisateur) {
    return NextResponse.json(
      { erreur: "identifiants_invalides" },
      { status: 401 }
    );
  }

  const correct = await verifierMotDePasse(motDePasse, utilisateur.motDePasse);
  if (!correct) {
    return NextResponse.json(
      { erreur: "identifiants_invalides" },
      { status: 401 }
    );
  }

  // Connexion réussie : on efface les compteurs, la suite des tentatives
  // de cet utilisateur repart de zéro.
  reinitialiser(cleCompte);
  reinitialiser(cleAdresse);

  // ── Création de la session ──────────────────────────────────────────
  const token = await creerToken({
    id: utilisateur.id,
    email: utilisateur.email,
    nom: utilisateur.nom,
  });
  await poserCookieSession(token);

  return NextResponse.json({
    succes: true,
    utilisateur: {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      role: utilisateur.role,
      image: utilisateur.image,
    },
  });
}
