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
import { boutiqueActuelle } from "@/lib/boutique";
import { getProduitParId } from "./products";
import {
  getTarifsLivraison,
  getParametresLivraison,
  calculerLivraison,
  modeDisponible,
  estModeValide,
  type ModeLivraison,
} from "./livraison";
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
    modeLivraison: c.modeLivraison,
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
  const boutiqueId = await boutiqueActuelle();
  const c = await prisma.commande.findFirst({
    where: { id, boutiqueId },
    include: { lignes: true },
  });
  return c ? dbToCommande(c) : null;
}

export async function getCommandesParUtilisateurId(
  utilisateurId: string
): Promise<Commande[]> {
  const boutiqueId = await boutiqueActuelle();
  const rows = await prisma.commande.findMany({
    where: { utilisateurId, boutiqueId },
    include: { lignes: true },
    orderBy: { createdAt: "desc" }, // plus récente d'abord
  });
  return rows.map(dbToCommande);
}

/**
 * Retire une commande de l'historique d'un CLIENT.
 *
 * ⚠️ Ce n'est pas une suppression, et c'est délibéré. Une commande n'appartient
 * pas qu'à l'acheteur : c'est la pièce comptable du vendeur, et le stock
 * qu'elle a décrémenté. La détruire en base ferait deux dégâts irréparables —
 * la vente disparaîtrait des livres du marchand, et le stock resterait amputé
 * pour toujours, puisque seul un passage en « annulee » le rend
 * (voir mettreAJourCommandeAdmin).
 *
 * On DÉTACHE donc la commande de son compte plutôt que de l'effacer. Le
 * schéma prévoit exactement ce cas : `utilisateurId` est nullable, avec
 * onDelete: SetNull, « si un utilisateur est supprimé, ses commandes ne sont
 * PAS supprimées (comptabilité !). Juste dé-rattachées. »
 *
 * Pour le client, l'effet est celui d'une suppression définitive : la commande
 * ne réapparaîtra jamais dans son historique, et rien ne permet de la lui
 * réassocier. Pour le vendeur, rien ne change — nomClient, telephone, adresse,
 * wilaya, total et lignes sont stockés SUR la commande, pas sur le compte.
 *
 * Le `where` porte les trois filtres : l'identifiant, le propriétaire et la
 * boutique. Sans le propriétaire, n'importe quel client connecté pourrait
 * retirer la commande d'un autre en devinant un identifiant.
 */
export async function retirerCommandeDeLHistorique(
  commandeId: string,
  utilisateurId: string
): Promise<{ ok: boolean }> {
  const boutiqueId = await boutiqueActuelle();

  const resultat = await prisma.commande.updateMany({
    where: { id: commandeId, utilisateurId, boutiqueId },
    data: { utilisateurId: null },
  });

  // 0 ligne touchée : la commande n'existe pas, appartient à quelqu'un
  // d'autre, ou relève d'une autre boutique. On ne distingue pas les trois —
  // le dire renseignerait sur l'existence de commandes qui ne regardent pas
  // l'appelant.
  return { ok: resultat.count === 1 };
}

/**
 * Supprime DÉFINITIVEMENT une commande. Réservé au vendeur.
 *
 * Contrairement au retrait côté client, la ligne disparaît vraiment. C'est
 * légitime : le vendeur est propriétaire de sa pièce comptable. Deux effets
 * doivent être traités, sinon on corrompt en silence.
 *
 * ── 1. Le stock ───────────────────────────────────────────────────────────
 *
 * Une commande a DÉCRÉMENTÉ le stock à sa création. Seul un passage en
 * « annulee » le rend (voir mettreAJourCommandeAdmin). Supprimer une commande
 * encore active sans rien faire laisserait donc le stock amputé pour toujours,
 * sans plus aucune trace permettant de le corriger.
 *
 * On rend donc les articles AVANT de supprimer — sauf si la commande était
 * déjà annulée, auquel cas ils sont déjà revenus et les rendre une seconde
 * fois gonflerait le stock.
 *
 * Le tout dans UNE transaction : impossible d'avoir une commande supprimée
 * dont les articles ne sont pas revenus, ou l'inverse.
 *
 * ── 2. Les lignes ─────────────────────────────────────────────────────────
 *
 * LigneCommande porte onDelete: Cascade sur commandeId : les lignes partent
 * avec la commande, sans qu'on ait à les toucher.
 *
 * ── Ce qui est perdu, et qu'il faut assumer ───────────────────────────────
 *
 * Le chiffre d'affaires de cette commande disparaît des statistiques, et si
 * elle était rattachée à un client, elle quitte aussi son historique. C'est le
 * sens même d'une suppression ; la boîte de confirmation le dit.
 */
export async function supprimerCommandeAdmin(
  id: string
): Promise<{ ok: boolean; erreur?: string }> {
  const boutiqueId = await boutiqueActuelle();

  const existante = await prisma.commande.findFirst({
    where: { id, boutiqueId },
    select: {
      statut: true,
      lignes: { select: { produitId: true, quantite: true } },
    },
  });
  if (!existante) {
    return { ok: false, erreur: "commande_introuvable" };
  }

  // Déjà annulée : les articles sont revenus en stock au moment de
  // l'annulation, il n'y a rien à rendre.
  const aRendreAuStock =
    existante.statut === "annulee"
      ? []
      : existante.lignes.filter(
          (l): l is { produitId: string; quantite: number } =>
            // produitId passe à NULL quand un produit est supprimé : il n'y a
            // alors plus rien à recréditer.
            l.produitId !== null
        );

  await prisma.$transaction(async (tx) => {
    for (const l of aRendreAuStock) {
      await tx.produit.updateMany({
        where: { id: l.produitId, boutiqueId },
        data: { stock: { increment: l.quantite } },
      });
    }
    // deleteMany et non delete : l'étiquette de boutique reste dans le where,
    // comme partout ailleurs. Le garde-fou de cloisonnement refuserait un
    // delete par identifiant seul.
    await tx.commande.deleteMany({ where: { id, boutiqueId } });
  });

  return { ok: true };
}

/** Récupère TOUTES les commandes (usage admin). */
export async function getAllCommandes(): Promise<Commande[]> {
  const boutiqueId = await boutiqueActuelle();
  const rows = await prisma.commande.findMany({
    where: { boutiqueId },
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
  // ⚡ Les 3 requêtes du dashboard sont INDÉPENDANTES → on les lance ensemble.
  //
  // Avant : 3 `await` à la suite. Chaque aller-retour vers Neon coûtant ~120 ms
  // depuis le poste de dev, le dashboard attendait ~360 ms de réseau pur.
  // Promise.all ramène ce coût à celui de la requête la plus lente.
  //
  // Note : on récupère TOUS les noms de produits plutôt que seulement ceux du
  // top 5. Ça évite une 4e requête qui devrait attendre le résultat du groupBy
  // (elle en dépend). Sur un catalogue de cette taille, charger les noms coûte
  // beaucoup moins cher qu'un aller-retour réseau supplémentaire.
  const boutiqueId = await boutiqueActuelle();
  const [commandes, topAgg, tousLesProduits] = await Promise.all([
    prisma.commande.findMany({
      where: { boutiqueId },
      select: {
        id: true,
        createdAt: true,
        total: true,
        statut: true,
        etatAppel: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ligneCommande.groupBy({
      by: ["produitId"],
      _sum: { quantite: true, sousTotal: true },
      // Les lignes n'ont pas d'étiquette : on remonte par leur commande.
      where: { produitId: { not: null }, commande: { boutiqueId } },
      orderBy: { _sum: { quantite: "desc" } },
      take: 5,
    }),
    prisma.produit.findMany({
      where: { boutiqueId },
      select: { id: true, nomFr: true, nomAr: true },
    }),
  ]);

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
  // topAgg et tousLesProduits ont déjà été chargés en parallèle plus haut.
  const mapNoms = new Map(
    tousLesProduits.map((p) => [p.id, locale === "ar" ? p.nomAr : p.nomFr])
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
    /**
     * Frais de livraison fixés APRÈS COUP, typiquement pendant l'appel de
     * confirmation d'une commande partie sans tarif connu.
     *   undefined → on n'y touche pas ;
     *   un entier  → montant facturé (0 = offerte) ;
     *   null       → retour à « montant à confirmer ».
     * Le total de la commande est recalculé en conséquence.
     */
    livraison?: number | null;
  }
): Promise<
  { ok: true; commande: Commande } | { ok: false; erreur: string }
> {
  const boutiqueId = await boutiqueActuelle();
  // Validation des valeurs connues
  if (modifs.statut && !STATUTS_VALIDES.includes(modifs.statut)) {
    return { ok: false, erreur: "statut_invalide" };
  }
  if (modifs.etatAppel && !ETATS_APPEL_VALIDES.includes(modifs.etatAppel)) {
    return { ok: false, erreur: "etat_appel_invalide" };
  }
  if (
    modifs.livraison !== undefined &&
    modifs.livraison !== null &&
    (!Number.isInteger(modifs.livraison) || modifs.livraison < 0)
  ) {
    return { ok: false, erreur: "livraison_invalide" };
  }

  // Si on change le statut, on lit la commande actuelle pour ne remplir
  // le timestamp que la PREMIÈRE fois qu'un statut est atteint (pas d'écrasement).
  let horodatages: {
    confirmedAt?: Date;
    enLivraisonAt?: Date;
    livreeAt?: Date;
    annuleeAt?: Date;
  } = {};

  // Mouvement de stock déclenché par le changement de statut.
  //   "rendre"  : la commande est annulée → les articles retournent en stock
  //   "reprendre" : une commande annulée redevient active → on les ressort
  //   null      : le stock ne bouge pas
  let mouvementStock: "rendre" | "reprendre" | null = null;
  let lignes: { produitId: string | null; quantite: number }[] = [];

  // Nouveau total, uniquement quand les frais de livraison changent.
  // undefined = on ne touche pas au total existant.
  let totalRecalcule: number | undefined;

  // On relit la commande dès que le STATUT ou les FRAIS changent : le premier
  // a besoin de l'état précédent (horodatage déjà posé, stock à bouger), le
  // second du sous-total pour recalculer le total.
  if (modifs.statut || modifs.livraison !== undefined) {
    const existante = await prisma.commande.findFirst({
      where: { id, boutiqueId },
      select: {
        statut: true,
        sousTotal: true,
        confirmedAt: true,
        enLivraisonAt: true,
        livreeAt: true,
        annuleeAt: true,
        lignes: { select: { produitId: true, quantite: true } },
      },
    });
    if (!existante) {
      return { ok: false, erreur: "commande_introuvable" };
    }

    // Le total suit toujours les frais : sans ce recalcul, la commande
    // afficherait un montant de livraison et un total qui ne se répondent
    // plus — et le chiffre d'affaires s'en trouverait faussé.
    if (modifs.livraison !== undefined) {
      totalRecalcule = existante.sousTotal + (modifs.livraison ?? 0);
    }

    // ⚠️ Tout ce qui suit ne concerne QUE le changement de statut, et doit
    // rester derrière cette garde. Sans elle, corriger les seuls frais de
    // livraison d'une commande annulée la ferait ressortir du stock : plus
    // bas, `devientAnnulee` vaudrait false faute de statut transmis, et le
    // code y lirait un retour à la vie.
    if (modifs.statut) {
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

      // On compare l'ANCIEN et le NOUVEAU statut, jamais l'horodatage : c'est
      // ce qui garantit qu'un aller-retour "annulée → confirmée → annulée" ne
      // remet pas deux fois les mêmes articles en stock.
      lignes = existante.lignes;
      const etaitAnnulee = existante.statut === "annulee";
      const devientAnnulee = modifs.statut === "annulee";
      if (!etaitAnnulee && devientAnnulee) mouvementStock = "rendre";
      else if (etaitAnnulee && !devientAnnulee) mouvementStock = "reprendre";
    }
  }

  // Lignes rattachées à un produit encore existant (produitId passe à NULL
  // quand un produit est supprimé — il n'y a alors plus rien à recréditer).
  const lignesAvecProduit = lignes.filter(
    (l): l is { produitId: string; quantite: number } => l.produitId !== null
  );

  try {
    // Statut et stock bougent ensemble : impossible d'avoir une commande
    // annulée dont les articles ne sont pas revenus en stock, ou l'inverse.
    const row = await prisma.$transaction(async (tx) => {
      if (mouvementStock === "rendre") {
        for (const l of lignesAvecProduit) {
          await tx.produit.updateMany({
            where: { id: l.produitId, boutiqueId },
            data: { stock: { increment: l.quantite } },
          });
        }
      } else if (mouvementStock === "reprendre") {
        // Réactiver une commande annulée reprend les articles au stock.
        // Même garde qu'à la création : si le stock ne suffit plus, on refuse
        // plutôt que de le laisser passer sous zéro.
        for (const l of lignesAvecProduit) {
          const { count } = await tx.produit.updateMany({
            where: { id: l.produitId, boutiqueId, stock: { gte: l.quantite } },
            data: { stock: { decrement: l.quantite } },
          });
          if (count === 0) throw new ErreurStockAdmin();
        }
      }

      return tx.commande.update({
        where: { id, boutiqueId },
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
          // undefined laisse le champ tel quel, null y remet « à confirmer ».
          livraison: modifs.livraison,
          total: totalRecalcule,
          ...horodatages,
        },
        include: { lignes: true },
      });
    });
    return { ok: true, commande: dbToCommande(row) };
  } catch (e) {
    if (e instanceof ErreurStockAdmin) {
      return { ok: false, erreur: "stock_insuffisant_reactivation" };
    }
    return { ok: false, erreur: "commande_introuvable" };
  }
}

/** Stock devenu insuffisant pour réactiver une commande annulée. */
class ErreurStockAdmin extends Error {}

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
  | {
      ok: false;
      erreur: string;
      /** Renseignés pour les erreurs de stock, pour un message précis. */
      produitNom?: string;
      stockDisponible?: number;
    };

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
  /** Mode de livraison choisi. Domicile par défaut. */
  modeLivraison?: string;
}): Promise<ResultatCreation> {
  const mode: ModeLivraison = estModeValide(input.modeLivraison ?? "")
    ? (input.modeLivraison as ModeLivraison)
    : "domicile";
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
  }

  // Un seul aller-retour pour tous les produits du panier (au lieu d'une
  // requête par article, qui coûtait ~120 ms chacune).
  const boutiqueId = await boutiqueActuelle();
  const produits = await prisma.produit.findMany({
    where: { id: { in: input.articles.map((a) => a.produitId) }, boutiqueId },
  });
  const parId = new Map(produits.map((p) => [p.id, p]));

  for (const a of input.articles) {
    const produit = parId.get(a.produitId);
    if (!produit) {
      return { ok: false, erreur: "produit_introuvable" };
    }
    // Pré-contrôle du stock : permet de renvoyer un message précis au client.
    // Le contrôle qui FAIT AUTORITÉ est celui de la transaction, plus bas.
    if (produit.stock < a.quantite) {
      return {
        ok: false,
        erreur: produit.stock === 0 ? "rupture_stock" : "stock_insuffisant",
        produitNom: input.locale === "ar" ? produit.nomAr : produit.nomFr,
        stockDisponible: produit.stock,
      };
    }
    lignesCreation.push({
      produitId: produit.id,
      nomProduit: input.locale === "ar" ? produit.nomAr : produit.nomFr,
      prixUnitaire: produit.prix, // ← prix serveur, jamais client
      quantite: a.quantite,
      sousTotal: produit.prix * a.quantite,
    });
  }

  // ── Totaux ───────────────────────────────────────────────────────
  const sousTotal = lignesCreation.reduce((s, l) => s + l.sousTotal, 0);

  // Livraison recalculée ICI depuis la base, jamais reprise du client —
  // même principe que les prix produits. Un client qui bidouillerait la
  // requête ne peut pas s'offrir une livraison à 0.
  const [tarifs, parametres] = await Promise.all([
    getTarifsLivraison(),
    getParametresLivraison(),
  ]);
  // Pas de tarif pour cette wilaya : la commande passe QUAND MEME. Le prix
  // sera annonce au client lors de l appel de confirmation. Refuser ici
  // reviendrait a perdre une vente pour une ligne de configuration absente.
  const tarifWilaya = tarifs.find((t) => t.wilaya === wilaya);
  // Domicile non propose pour une wilaya TARIFEE : on refuse plutot que de
  // facturer un mode que la boutique n assure pas. Sur une wilaya sans tarif,
  // modeDisponible laisse passer les deux modes — rien n est connu, donc
  // rien n est exclu.
  if (!modeDisponible(tarifWilaya, mode)) {
    return { ok: false, erreur: "mode_livraison_indisponible" };
  }
  // null = frais inconnus. Le total est alors HORS livraison, et c est ce
  // qu on enregistre : mieux vaut un total incomplet et signale qu un total
  // complet et faux.
  const livraison = calculerLivraison(tarifWilaya, mode, parametres);
  const total = sousTotal + (livraison ?? 0);

  // ── Création + décrément du stock, en TRANSACTION ────────────────
  //
  // Pourquoi une transaction : entre le contrôle de stock ci-dessus et
  // l'écriture, un autre client peut acheter le dernier article. Sans
  // protection, les deux commandes passeraient et le stock deviendrait négatif
  // (survente). C'est la "race condition" classique du commerce en ligne.
  //
  // La garde est le `where: { stock: { gte: quantite } }` : PostgreSQL
  // n'applique la décrémentation QUE si le stock est encore suffisant au
  // moment précis de l'écriture. Si `count` vaut 0, c'est qu'un autre client
  // est passé avant → on lève une erreur, et TOUTE la transaction est annulée
  // (la commande n'est pas créée, les stocks déjà décrémentés sont restaurés).
  try {
    const commande = await prisma.$transaction(async (tx) => {
      for (const ligne of lignesCreation) {
        const { count } = await tx.produit.updateMany({
          where: { id: ligne.produitId, boutiqueId, stock: { gte: ligne.quantite } },
          data: { stock: { decrement: ligne.quantite } },
        });
        if (count === 0) {
          throw new ErreurStock(ligne.nomProduit);
        }
      }

      return tx.commande.create({
        data: {
          boutiqueId,
          nomClient: nom.trim(),
          telephone: telephone.trim(),
          adresse: adresse.trim(),
          wilaya,
          sousTotal,
          livraison,
          total,
          modeLivraison: mode,
          utilisateurId: input.utilisateurId, // undefined si commande invitée
          // statut prend sa valeur par défaut : "en_attente"
          lignes: {
            create: lignesCreation, // ← les lignes créées en même temps
          },
        },
        include: { lignes: true },
      });
    });
    return { ok: true, commande: dbToCommande(commande) };
  } catch (e) {
    if (e instanceof ErreurStock) {
      return { ok: false, erreur: "stock_insuffisant", produitNom: e.produitNom };
    }
    return { ok: false, erreur: "erreur_serveur" };
  }
}

/** Signale qu'un produit est devenu indisponible pendant la transaction. */
class ErreurStock extends Error {
  constructor(public produitNom: string) {
    super("stock_insuffisant");
  }
}
