// ============================================================================
// Garde d'accès aux pages/API admin.
// ============================================================================
//
// À utiliser dans les composants serveur (pages / layouts / route handlers)
// qui doivent être RÉSERVÉS AUX ADMINS.
//
// Comportement :
//   1. Pas de session (déconnecté) → redirection vers /admin/connexion
//   2. Session mais rôle != "admin" → 404 (on cache l'existence de l'admin)
//   3. Session + rôle "admin"       → renvoie l'utilisateur
//
// ⚠️ On ne fait PAS confiance au JWT pour le rôle. Le rôle est TOUJOURS
//    relu depuis la base à chaque requête, ce qui garantit qu'un
//    changement de rôle (promotion/démotion) est effectif immédiatement.
// ============================================================================

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "./session";
import { getUtilisateurParId } from "./auth";
import type { Utilisateur } from "./types";

// cache() mémorise le résultat pour la DURÉE D'UN SEUL RENDU serveur.
// Le layout admin et la page qu'il enveloppe peuvent donc appeler requireAdmin
// tous les deux : la base n'est interrogée qu'une fois par requête.
export const requireAdmin = cache(async function requireAdmin(
  locale: string
): Promise<Utilisateur> {
  const session = await getSession();
  if (!session) {
    // Non connecté → page de connexion MARCHAND, pas celle des clients.
    //
    // /connexion s'adresse aux acheteurs (« Retrouvez votre compte et vos
    // commandes »). Y envoyer un marchand venu gérer sa boutique l'accueillait
    // avec le mauvais discours, et le déposait sur /compte après
    // identification au lieu de son tableau de bord.
    //
    // ⚠️ /admin/connexion est volontairement HORS du groupe (espace) — sinon
    // le layout qui appelle cette fonction protégerait aussi la page de
    // connexion, laquelle redirigerait vers elle-même à l'infini.
    redirect(`/${locale}/admin/connexion`);
  }

  const utilisateur = await getUtilisateurParId(session.id);
  if (!utilisateur || utilisateur.role !== "admin") {
    // Connecté mais pas admin → 404 (on masque la présence de l'admin).
    notFound();
  }

  return utilisateur;
});
