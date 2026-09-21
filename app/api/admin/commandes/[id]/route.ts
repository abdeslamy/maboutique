import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import {
  mettreAJourCommandeAdmin,
  supprimerCommandeAdmin,
} from "@/lib/orders";
import type { EtatAppel, StatutCommande } from "@/lib/types";

/**
 * PATCH /api/admin/commandes/[id]
 * Body : { statut?, etatAppel?, notes?, livraison? }  (tous optionnels)
 *
 * Met à jour la gestion d'une commande. Réservé aux admins.
 * Le statut est LIBRE (pas de contrainte de progression).
 *
 * `livraison` sert à chiffrer après coup une commande partie sans tarif
 * connu : un entier fixe le montant, `null` (ou une chaîne vide) la remet
 * à « à confirmer ». Le total est recalculé côté serveur.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Garde admin ──────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const user = await getUtilisateurParId(session.id);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    statut?: string;
    etatAppel?: string;
    notes?: string;
    livraison?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const resultat = await mettreAJourCommandeAdmin(id, {
    statut: body.statut as StatutCommande | undefined,
    etatAppel: body.etatAppel as EtatAppel | undefined,
    notes: body.notes,
    // Absent → on n'y touche pas. Vide ou null → retour à « à confirmer ».
    // Toute autre valeur est convertie puis VALIDÉE plus bas : un texte
    // devient NaN, que mettreAJourCommandeAdmin refuse.
    livraison:
      body.livraison === undefined
        ? undefined
        : body.livraison === null || body.livraison === ""
        ? null
        : Number(body.livraison),
  });

  if (!resultat.ok) {
    const status =
      resultat.erreur === "commande_introuvable" ? 404 : 400;
    return NextResponse.json({ erreur: resultat.erreur }, { status });
  }

  return NextResponse.json({ succes: true, commande: resultat.commande });
}

/**
 * DELETE /api/admin/commandes/[id]
 *
 * Supprime DÉFINITIVEMENT une commande. Réservé au vendeur.
 *
 * Le stock est rendu au passage quand la commande n'était pas déjà annulée —
 * voir supprimerCommandeAdmin, qui fait les deux dans une seule transaction.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Garde admin ──────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }
  const user = await getUtilisateurParId(session.id);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ erreur: "acces_refuse" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ erreur: "id_manquant" }, { status: 400 });
  }

  const resultat = await supprimerCommandeAdmin(id);
  if (!resultat.ok) {
    return NextResponse.json(
      { erreur: resultat.erreur ?? "erreur_serveur" },
      { status: resultat.erreur === "commande_introuvable" ? 404 : 500 }
    );
  }

  return NextResponse.json({ succes: true });
}
