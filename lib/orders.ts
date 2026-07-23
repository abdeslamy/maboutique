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
import type {
  Commande,
  EtatAppel,
  LigneCommande,
  StatutCommande,
} from "./types";
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
    etatAppel: (c.etatAppel as EtatAppel | null) ?? undefined,
    notes: c.notes ?? undefined,
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

/** Récupère TOUTES les commandes (usage admin). */
export async function getAllCommandes(): Promise<Commande[]> {
  const rows = await prisma.commande.findMany({
    include: { lignes: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(dbToCommande);
}

// ──────────────────────────────────────────────────────────────────────
// Mise à jour admin — statut / état d'appel / notes
// ──────────────────────────────────────────────────────────────────────
//
// Choix produit : le statut logistique est désormais LIBRE (l'admin peut
// revenir en arrière ou sauter des étapes). Pas de machine à états stricte.
// On valide seulement que les valeurs envoyées font partie des valeurs connues.

const STATUTS_VALIDES: StatutCommande[] = [
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

const ETATS_APPEL_VALIDES: EtatAppel[] = [
  "non_appele",
  "confirme",
  "ne_repond_pas",
  "telephone_eteint",
  "injoignable",
  "faux_numero",
  "annule_client",
  "report_livraison",
  "demande_modification",
  "absent_livraison",
  "colis_refuse",
  "attente_rappel",
  "doublon",
];

/**
 * Met à jour les champs de gestion d'une commande (côté admin).
 * Chaque champ est optionnel : on ne modifie que ce qui est fourni.
 */
export async function mettreAJourCommandeAdmin(
  id: string,
  modifs: {
    statut?: StatutCommande;
    etatAppel?: EtatAppel;
    notes?: string;
  }
): Promise<
  { ok: true; commande: Commande } | { ok: false; erreur: string }
> {
  // Validation des valeurs connues
  if (modifs.statut && !STATUTS_VALIDES.includes(modifs.statut)) {
    return { ok: false, erreur: "statut_invalide" };
  }
  if (modifs.etatAppel && !ETATS_APPEL_VALIDES.includes(modifs.etatAppel)) {
    return { ok: false, erreur: "etat_appel_invalide" };
  }

  try {
    const row = await prisma.commande.update({
      where: { id },
      data: {
        statut: modifs.statut,
        etatAppel: modifs.etatAppel,
        // notes : chaîne vide → on efface (null). Sinon on enregistre.
        notes:
          modifs.notes === undefined
            ? undefined
            : modifs.notes.trim() === ""
            ? null
            : modifs.notes.trim(),
      },
      include: { lignes: true },
    });
    return { ok: true, commande: dbToCommande(row) };
  } catch {
    return { ok: false, erreur: "commande_introuvable" };
  }
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
  // Téléphone algérien : exactement 10 chiffres, commence par 0.
  if (!telephone || !/^0\d{9}$/.test(telephone.trim()))
    return { ok: false, erreur: "telephone_format_dz" };
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
