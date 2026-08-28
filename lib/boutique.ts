import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { emailPlausible } from "./email-valide";

/**
 * Quelle boutique sert la requête en cours ?
 *
 * C'est le SEUL endroit du projet qui répond à cette question. Tout le reste
 * du code appelle `boutiqueActuelle()` sans savoir comment la réponse est
 * obtenue.
 *
 * Aujourd'hui : il n'y a qu'une boutique, la réponse est constante.
 *
 * Demain, quand chaque marchand aura son domaine, cette fonction lira l'hôte
 * de la requête (`tyradam.com`, `coursa.maplateforme.dz`,
 * `maplateforme.dz/coursa`) et le traduira en identifiant de boutique.
 * **Ce fichier changera. Les trente autres appelants, non.**
 *
 * C'est toute la raison d'être de cette indirection : sans elle, écrire
 * « boutique-1 » à trente endroits imposerait de retrouver ces trente
 * endroits le jour des domaines — et il suffirait d'en oublier un pour
 * qu'un marchand voie les données d'un autre.
 *
 * `cache()` mémorise le résultat pour la durée d'UN rendu serveur : la
 * résolution (qui interrogera la base plus tard) n'a lieu qu'une fois par
 * requête, même si vingt fonctions la demandent.
 */

/**
 * Boutique historique, créée par la migration `multi_boutiques_etiquettes`.
 * Exportée pour les scripts hors requête (seed, maintenance) qui n'ont pas
 * d'hôte à interroger et doivent donc la nommer explicitement.
 */
export const BOUTIQUE_PAR_DEFAUT = "boutique-1";

/**
 * Asynchrone dès aujourd'hui, alors que la réponse est constante : la vraie
 * résolution devra lire les en-têtes de la requête et consulter la base,
 * deux opérations asynchrones. Rendre la fonction synchrone maintenant
 * obligerait à modifier les trente appelants le jour où elle ne peut plus
 * l'être — exactement ce qu'on cherche à éviter.
 */
export const boutiqueActuelle = cache(async function boutiqueActuelle(): Promise<string> {
  return BOUTIQUE_PAR_DEFAUT;
});

// ────────────────────────────────────────────────────────────────────
// Réglages de la boutique
// ────────────────────────────────────────────────────────────────────

export type InfosBoutique = {
  id: string;
  nom: string;
  /** Adresse où le marchand reçoit ses alertes. `null` = pas encore réglée. */
  emailContact: string | null;
};

/** Fiche de la boutique qui sert la requête en cours. */
export async function getInfosBoutique(): Promise<InfosBoutique | null> {
  const id = await boutiqueActuelle();
  const b = await prisma.boutique.findUnique({
    where: { id },
    select: { id: true, nom: true, emailContact: true },
  });
  return b;
}

// La validation d'adresse vit dans un fichier PUR (`lib/email-valide.ts`) :
// le formulaire d'administration s'en sert côté navigateur, et il ne doit
// pas traverser CE fichier-ci, qui importe Prisma.
export { emailPlausible };
export async function enregistrerEmailContact(
  valeur: string
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const email = valeur.trim().toLowerCase();

  // Chaîne vide = le marchand retire son adresse. C'est un choix légitime,
  // pas une erreur de saisie : les alertes cessent, les commandes non.
  if (email !== "" && !emailPlausible(email)) {
    return { ok: false, erreur: "email_invalide" };
  }

  try {
    await prisma.boutique.update({
      where: { id: await boutiqueActuelle() },
      data: { emailContact: email === "" ? null : email },
    });
    return { ok: true };
  } catch (e) {
    console.error("[boutique] echec enregistrerEmailContact :", e);
    return { ok: false, erreur: "erreur_serveur" };
  }
}
