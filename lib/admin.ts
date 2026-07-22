// ============================================================================
// Garde d'accès aux pages/API admin.
// ============================================================================
//
// À utiliser dans les composants serveur (pages / layouts / route handlers)
// qui doivent être RÉSERVÉS AUX ADMINS.
//
// Comportement :
//   1. Pas de session (déconnecté) → redirection vers /connexion
//   2. Session mais rôle != "admin" → 404 (on cache l'existence de l'admin)
//   3. Session + rôle "admin"       → renvoie l'utilisateur
//
// ⚠️ On ne fait PAS confiance au JWT pour le rôle. Le rôle est TOUJOURS
//    relu depuis la base à chaque requête, ce qui garantit qu'un
//    changement de rôle (promotion/démotion) est effectif immédiatement.
// ============================================================================

import { notFound, redirect } from "next/navigation";
import { getSession } from "./session";
import { getUtilisateurParId } from "./auth";
import type { Utilisateur } from "./types";

export async function requireAdmin(locale: string): Promise<Utilisateur> {
  const session = await getSession();
  if (!session) {
    // Non connecté → on envoie vers la page de connexion.
    redirect(`/${locale}/connexion`);
  }

  const utilisateur = await getUtilisateurParId(session.id);
  if (!utilisateur || utilisateur.role !== "admin") {
    // Connecté mais pas admin → 404 (on masque la présence de l'admin).
    notFound();
  }

  return utilisateur;
}
