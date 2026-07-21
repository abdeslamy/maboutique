// ============================================================================
// Utilisateurs — lecture/écriture via Prisma
// ============================================================================
//
// AVANT : lecture/écriture du fichier data/users.json
// APRÈS : requêtes Prisma sur la table `Utilisateur`
//
// ⚠️ Ces fonctions ne s'exécutent QUE côté serveur (API routes, server
//    components, server actions).
// ============================================================================

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, Utilisateur } from "./types";
import type { UtilisateurModel } from "@/lib/generated/prisma/models";

/** Coût bcrypt : 10 rounds ~= 100 ms par hash. Bon compromis sécurité/perf. */
const BCRYPT_ROUNDS = 10;

// ── Mapping DB → Utilisateur (type UI) ─────────────────────────────────
function dbToUtilisateur(u: UtilisateurModel): Utilisateur {
  return {
    id: u.id,
    email: u.email,
    nom: u.nom,
    motDePasse: u.motDePasse,
    image: u.image ?? undefined,
    role: (u.role as Role) ?? "user",
    createdAt: u.createdAt.toISOString(),
  };
}

// ── Recherche ──────────────────────────────────────────────────────────

export async function trouverUtilisateurParEmail(
  email: string
): Promise<Utilisateur | null> {
  const u = await prisma.utilisateur.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  return u ? dbToUtilisateur(u) : null;
}

export async function getUtilisateurParId(
  id: string
): Promise<Utilisateur | null> {
  const u = await prisma.utilisateur.findUnique({ where: { id } });
  return u ? dbToUtilisateur(u) : null;
}

// ── Mots de passe ──────────────────────────────────────────────────────

export async function hashMotDePasse(motDePasse: string): Promise<string> {
  return bcrypt.hash(motDePasse, BCRYPT_ROUNDS);
}

export async function verifierMotDePasse(
  motDePasse: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(motDePasse, hash);
}

// ── Création ────────────────────────────────────────────────────────────

export async function creerUtilisateur(input: {
  email: string;
  nom: string;
  motDePasse: string;
}): Promise<Utilisateur> {
  const created = await prisma.utilisateur.create({
    data: {
      email: input.email.trim().toLowerCase(),
      nom: input.nom.trim(),
      motDePasse: await hashMotDePasse(input.motDePasse),
      // role prend la valeur par défaut ("user") — voir schema.prisma
    },
  });
  return dbToUtilisateur(created);
}

// ── Mise à jour ─────────────────────────────────────────────────────────

/**
 * Met à jour les champs autorisés d'un utilisateur.
 * Retourne l'utilisateur mis à jour, ou null si introuvable.
 */
export async function mettreAJourUtilisateur(
  id: string,
  modifs: Partial<Pick<Utilisateur, "nom" | "motDePasse" | "image">>
): Promise<Utilisateur | null> {
  try {
    const updated = await prisma.utilisateur.update({
      where: { id },
      // Prisma refuse les propriétés `undefined`, mais accepte `null` pour
      // effacer une valeur → on normalise image === undefined en pas-de-modif.
      data: {
        nom: modifs.nom,
        motDePasse: modifs.motDePasse,
        // Cas spécial pour effacer la photo : on veut envoyer null en DB.
        image: modifs.image === undefined ? undefined : modifs.image,
      },
    });
    return dbToUtilisateur(updated);
  } catch {
    // Prisma jette si l'id n'existe pas — on retourne null pour un signal propre.
    return null;
  }
}
