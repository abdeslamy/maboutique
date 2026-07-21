// ============================================================================
// Commandes — lecture/écriture via Prisma
// ============================================================================
//
// AVANT : lecture/écriture du fichier data/commandes.json
// APRÈS : requêtes Prisma sur les tables `Commande` + `LigneCommande`
//
// Concept nouveau : la CRÉATION IMBRIQUÉE.
//   `prisma.commande.create({ data: { ..., lignes: { create: [...] } } })`
//   crée en UNE seule opération atomique la commande + toutes ses lignes.
//   Si un INSERT échoue, aucun n'est appliqué (transaction implicite).
// ============================================================================

import { prisma } from "@/lib/prisma";
import { getProduitParId } from "./products";
import { FRAIS_LIVRAISON } from "./format";
import { estWilayaValide } from "./wilayas";
import type { Commande, LigneCommande, StatutCommande } from "./types";
import type { CommandeModel, LigneCommandeModel } from "@/lib/generated/prisma/models";
import type { Locale } from "@/i18n/routing";

// ── Type pour un enregistrement Prisma AVEC ses lignes jointes ────────
type CommandeAvecLignes = CommandeModel & { lignes: LigneCommandeModel[] };

// ── Mapping DB → UI ───────────────────────────────────────────────────
// Transforme la structure plate de Prisma en la structure imbriquée
// attendue par les composants (client.nom, articles[], date...).
function dbToCommande(c: CommandeAvecLignes): Commande {
  return {
    id: c.id,
    date: c.createdAt.toISOString(),
    utilisateurId: c.utilisateurId ?? undefined,
    statut: c.statut as StatutCommande,
    sousTotal: c.sousTotal,
    livraison: c.livraison,
    total: c.total,
    client: {
      nom: c.nomClient,
      telephone: c.telephone,
      adresse: c.adresse,
      wilaya: c.wilaya,
    },
    articles: c.lignes.map(
      (l): LigneCommande => ({
        produitId: l.produitId ?? "",
        nom: l.nomProduit,
        prixUnitaire: l.prixUnitaire,
        quantite: l.quantite,
      })
    ),
  };
}

// ──────────────────────────────────────────────────────────────────────
// Lecture
// ──────────────────────────────────────────────────────────────────────

export async function getCommandeParId(
  id: string
): Promise<Commande | null> {
  const c = await prisma.commande.findUnique({
    where: { id },
    include: { lignes: true },
  });
  return c ? dbToCommande(c) : null;
}

export async function getCommandesParUtilisateurId(
  utilisateurId: string
): Promise<Commande[]> {
  const rows = await prisma.commande.findMany({
    where: { utilisateurId },
    include: { lignes: true },
    orderBy: { createdAt: "desc" }, // plus récente d'abord
  });
  return rows.map(dbToCommande);
}

// ──────────────────────────────────────────────────────────────────────
// Création
// ──────────────────────────────────────────────────────────────────────

type EntreeArticle = { produitId: string; quantite: number };
type Client = {
  nom: string;
  telephone: string;
  adresse: string;
  wilaya: string;
};

export type ResultatCreation =
  | { ok: true; commande: Commande }
  | { ok: false; erreur: string };

/**
 * Crée une commande + ses lignes en UNE seule opération atomique.
 *
 * ⭐ POINT CRITIQUE : on NE FAIT PAS confiance aux prix envoyés par le client.
 *    On les recalcule ici depuis la base (`getProduitParId`).
 */
export async function creerCommande(input: {
  articles: EntreeArticle[];
  client: Client;
  /** ID de l'utilisateur connecté, ou undefined pour une commande anonyme. */
  utilisateurId?: string;
  /** Locale pour "geler" le nom du produit dans la commande. */
  locale: Locale;
}): Promise<ResultatCreation> {
  // ── Validations panier ────────────────────────────────────────────
  if (!Array.isArray(input.articles) || input.articles.length === 0) {
    return { ok: false, erreur: "panier_vide" };
  }

  // ── Validations client ────────────────────────────────────────────
  const { nom, telephone, adresse, wilaya } = input.client;
  if (!nom || nom.trim().length < 2) return { ok: false, erreur: "nom_court" };
  if (!telephone || telephone.trim().length < 8)
    return { ok: false, erreur: "telephone_court" };
  if (!adresse || adresse.trim().length < 5)
    return { ok: false, erreur: "adresse_courte" };
  if (!wilaya || !estWilayaValide(wilaya))
    return { ok: false, erreur: "wilaya_invalide" };

  // ── Construction des lignes avec PRIX SERVEUR ─────────────────────
  const lignesCreation: Array<{
    nomProduit: string;
    prixUnitaire: number;
    quantite: number;
    sousTotal: number;
    produitId: string;
  }> = [];

  for (const a of input.articles) {
    if (!Number.isInteger(a.quantite) || a.quantite < 1) {
      return { ok: false, erreur: "quantite_invalide" };
    }
    const produit = await getProduitParId(a.produitId);
    if (!produit) {
      return { ok: false, erreur: "produit_introuvable" };
    }
    lignesCreation.push({
      produitId: produit.id,
      nomProduit: produit.nom[input.locale],
      prixUnitaire: produit.prix, // ← prix serveur, jamais client
      quantite: a.quantite,
      sousTotal: produit.prix * a.quantite,
    });
  }

  // ── Totaux ───────────────────────────────────────────────────────
  const sousTotal = lignesCreation.reduce((s, l) => s + l.sousTotal, 0);
  const livraison = FRAIS_LIVRAISON;
  const total = sousTotal + livraison;

  // ── Création IMBRIQUÉE — 1 seule opération atomique ──────────────
  try {
    const commande = await prisma.commande.create({
      data: {
        nomClient: nom.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        wilaya,
        sousTotal,
        livraison,
        total,
        utilisateurId: input.utilisateurId, // undefined si commande invitée
        // statut prend sa valeur par défaut : "en_attente"
        lignes: {
          create: lignesCreation, // ← les lignes créées en même temps
        },
      },
      include: { lignes: true },
    });
    return { ok: true, commande: dbToCommande(commande) };
  } catch {
    return { ok: false, erreur: "erreur_serveur" };
  }
}
