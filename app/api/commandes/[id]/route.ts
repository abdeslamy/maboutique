import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { retirerCommandeDeLHistorique } from "@/lib/orders";
import { tenter } from "@/lib/limiteur";

/**
 * DELETE /api/commandes/[id]
 *
 * Retire une commande de l'historique du client connecté.
 *
 * ⚠️ Malgré le verbe DELETE, RIEN n'est supprimé en base : la commande est
 * détachée du compte. Voir retirerCommandeDeLHistorique pour le pourquoi — en
 * deux mots, la commande est la pièce comptable du vendeur et le stock qu'elle
 * a décrémenté.
 *
 * DELETE reste le bon verbe côté HTTP : du point de vue de l'appelant, la
 * ressource « ma commande » cesse d'exister, et l'opération est idempotente.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Il faut un compte : une commande d'invité n'est rattachée à personne,
  //    donc personne ne peut la retirer. ────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });
  }

  // Un client ne retire pas ses commandes en rafale. La limite ferme surtout
  // la porte à l'énumération : sans elle, on pourrait essayer des milliers
  // d'identifiants pour découvrir lesquels existent.
  const limite = tenter(`retrait-commande:${session.id}`, 20, 3600);
  if (!limite.ok) {
    return NextResponse.json(
      { erreur: "trop_de_tentatives", resteSec: limite.resteSec },
      { status: 429, headers: { "Retry-After": String(limite.resteSec) } }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ erreur: "id_manquant" }, { status: 400 });
  }

  const { ok } = await retirerCommandeDeLHistorique(id, session.id);

  if (!ok) {
    // Introuvable, ou appartenant à quelqu'un d'autre : même réponse. La
    // distinction révélerait l'existence de commandes qui ne regardent pas
    // l'appelant.
    return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  }

  return NextResponse.json({ succes: true });
}
