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
    confirmedAt: c.confirmedAt?.toISOString(),
    enLivraisonAt: c.enLivraisonAt?.toISOString(),
    livreeAt: c.livreeAt?.toISOString(),
    annuleeAt: c.annuleeAt?.toISOString(),
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
// Statistiques agrégées pour le dashboard admin
// ──────────────────────────────────────────────────────────────────────

export type PointEvolution = {
  /** Étiquette courte pour l'axe X (ex "lun 15"). */
  jour: string;
  /** Date ISO du début de la journée (pour tri stable). */
  dateIso: string;
  /** CA du jour (uniquement commandes livrées). */
  ca: number;
  /** Nombre total de commandes créées ce jour-là. */
  nb: number;
};

export type StatistiquesAdmin = {
  caLivre: number; // CA réalisé (livrée)
  caPotentiel: number; // total confirmée + en_livraison (encore à toucher)
  nbCommandesTotal: number;
  nbCommandesEnAttente: number;
  panierMoyen: number;
  commandesParStatut: Record<StatutCommande, number>;
  evolution7Jours: PointEvolution[];
  tauxConfirmationAppel: number; // 0..1
  tauxLivraisonReussie: number; // 0..1
  topProduits: {
    id: string;
    nom: string;
    quantite: number;
    ca: number;
  }[];
};

export async function getStatistiquesAdmin(
  locale: Locale = "fr"
): Promise<StatistiquesAdmin> {
  // Récupère toutes les commandes en une fois (petit volume — ok pour un petit shop).
  const commandes = await prisma.commande.findMany({
    select: {
      id: true,
      createdAt: true,
      total: true,
      statut: true,
      etatAppel: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // ── Répartition par statut ────────────────────────────────────────
  const parStatut: Record<StatutCommande, number> = {
    en_attente: 0,
    confirmee: 0,
    en_livraison: 0,
    livree: 0,
    annulee: 0,
  };
  for (const c of commandes) {
    parStatut[c.statut as StatutCommande]++;
  }

  // ── Chiffre d'affaires ────────────────────────────────────────────
  let caLivre = 0;
  let caPotentiel = 0;
  for (const c of commandes) {
    if (c.statut === "livree") caLivre += c.total;
    if (c.statut === "confirmee" || c.statut === "en_livraison") {
      caPotentiel += c.total;
    }
  }

  // ── Panier moyen (sur commandes livrées) ─────────────────────────
  const panierMoyen =
    parStatut.livree > 0 ? Math.round(caLivre / parStatut.livree) : 0;

  // ── Évolution 7 derniers jours ───────────────────────────────────
  const evolution = construireBucketsSeptJours(commandes, locale);

  // ── Taux clés ─────────────────────────────────────────────────────
  const appelees = commandes.filter(
    (c) => c.etatAppel && c.etatAppel !== "non_appele"
  ).length;
  const confirmees = commandes.filter(
    (c) => c.etatAppel === "confirme"
  ).length;
  const tauxConfirmationAppel = appelees > 0 ? confirmees / appelees : 0;

  const denom = parStatut.livree + parStatut.annulee;
  const tauxLivraisonReussie = denom > 0 ? parStatut.livree / denom : 0;

  // ── Top 5 produits (par quantité vendue) ─────────────────────────
  const topAgg = await prisma.ligneCommande.groupBy({
    by: ["produitId"],
    _sum: { quantite: true, sousTotal: true },
    where: { produitId: { not: null } },
    orderBy: { _sum: { quantite: "desc" } },
    take: 5,
  });
  const produitsIds = topAgg
    .map((t) => t.produitId)
    .filter((id): id is string => !!id);
  const produits =
    produitsIds.length > 0
      ? await prisma.produit.findMany({
          where: { id: { in: produitsIds } },
          select: { id: true, nomFr: true, nomAr: true },
        })
      : [];
  const mapNoms = new Map(
    produits.map((p) => [p.id, locale === "ar" ? p.nomAr : p.nomFr])
  );
  const topProduits = topAgg.map((t) => ({
    id: t.produitId!,
    nom: mapNoms.get(t.produitId!) ?? t.produitId!,
    quantite: t._sum.quantite ?? 0,
    ca: t._sum.sousTotal ?? 0,
  }));

  return {
    caLivre,
    caPotentiel,
    nbCommandesTotal: commandes.length,
    nbCommandesEnAttente: parStatut.en_attente,
    panierMoyen,
    commandesParStatut: parStatut,
    evolution7Jours: evolution,
    tauxConfirmationAppel,
    tauxLivraisonReussie,
    topProduits,
  };
}

/**
 * Découpe les commandes des 7 derniers jours (aujourd'hui inclus) en buckets
 * jour par jour, pour tracer l'évolution.
 */
function construireBucketsSeptJours(
  commandes: { createdAt: Date; total: number; statut: string }[],
  locale: Locale
): PointEvolution[] {
  const buckets: PointEvolution[] = [];
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const jour = new Date(aujourdHui);
    jour.setDate(aujourdHui.getDate() - i);
    const jourFin = new Date(jour);
    jourFin.setDate(jour.getDate() + 1);

    let ca = 0;
    let nb = 0;
    for (const c of commandes) {
      if (c.createdAt >= jour && c.createdAt < jourFin) {
        nb++;
        if (c.statut === "livree") ca += c.total;
      }
    }
    buckets.push({
      jour: jour.toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-DZ", {
        weekday: "short",
        day: "numeric",
      }),
      dateIso: jour.toISOString(),
      ca,
      nb,
    });
  }
  return buckets;
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

  // Si on change le statut, on lit la commande actuelle pour ne remplir
  // le timestamp que la PREMIÈRE fois qu'un statut est atteint (pas d'écrasement).
  let horodatages: {
    confirmedAt?: Date;
    enLivraisonAt?: Date;
    livreeAt?: Date;
    annuleeAt?: Date;
  } = {};

  if (modifs.statut) {
    const existante = await prisma.commande.findUnique({
      where: { id },
      select: {
        confirmedAt: true,
        enLivraisonAt: true,
        livreeAt: true,
        annuleeAt: true,
      },
    });
    if (!existante) {
      return { ok: false, erreur: "commande_introuvable" };
    }
    const now = new Date();
    if (modifs.statut === "confirmee" && !existante.confirmedAt) {
      horodatages.confirmedAt = now;
    } else if (modifs.statut === "en_livraison" && !existante.enLivraisonAt) {
      horodatages.enLivraisonAt = now;
    } else if (modifs.statut === "livree" && !existante.livreeAt) {
      horodatages.livreeAt = now;
    } else if (modifs.statut === "annulee" && !existante.annuleeAt) {
      horodatages.annuleeAt = now;
    }
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
        ...horodatages,
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
