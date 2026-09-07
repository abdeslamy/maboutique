"use client";

import { useCallback, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import DialogueConfirmation from "@/components/DialogueConfirmation";
import type { StatutCommande } from "@/lib/types";

/**
 * Supprime DÉFINITIVEMENT une commande. Côté vendeur.
 *
 * À ne pas confondre avec <BoutonRetirerCommande />, côté client, qui ne fait
 * que détacher la commande d'un compte : la ligne y survit, ici elle disparaît.
 *
 * ── Le texte s'adapte à l'état de la commande ─────────────────────────────
 *
 * Parce que la conséquence n'est pas la même. Une commande ACTIVE a décrémenté
 * le stock : le supprimer rend les articles. Une commande DÉJÀ ANNULÉE les a
 * déjà rendus à l'annulation — le dire une seconde fois laisserait croire à un
 * double crédit qui n'aura pas lieu.
 *
 * C'est le serveur qui décide (supprimerCommandeAdmin) ; le texte ne fait que
 * décrire fidèlement ce qui va se passer.
 */
export default function BoutonSupprimerCommandeAdmin({
  commandeId,
  statut,
}: {
  commandeId: string;
  statut: StatutCommande;
}) {
  const t = useTranslations("admin.commandes");
  const router = useRouter();

  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);

  const declencheur = useRef<HTMLButtonElement>(null);

  // useCallback : la boîte s'en sert dans un effet, une nouvelle référence à
  // chaque rendu la ferait se réabonner sans raison.
  const fermer = useCallback(() => {
    setOuvert(false);
    setErreur(false);
    declencheur.current?.focus();
  }, []);

  async function supprimer() {
    setChargement(true);
    setErreur(false);
    try {
      const res = await fetch(`/api/admin/commandes/${commandeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setErreur(true);
        setChargement(false);
        return;
      }
      setOuvert(false);
      // La liste vient du serveur : c'est lui qui doit la recalculer.
      router.refresh();
    } catch {
      setErreur(true);
      setChargement(false);
    }
  }

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={t("supprimerAria")}
        title={t("supprimerAria")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-600"
      >
        <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {ouvert && (
        <DialogueConfirmation
          id={commandeId}
          icone={
            <Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.9} aria-hidden="true" />
          }
          titre={t("supprimerTitre")}
          texte={
            statut === "annulee"
              ? t("supprimerTexteAnnulee")
              : t("supprimerTexteActive")
          }
          erreur={erreur ? t("supprimerErreur") : null}
          libelleAnnuler={t("supprimerAnnuler")}
          libelleConfirmer={chargement ? t("supprimerEnCours") : t("supprimer")}
          chargement={chargement}
          onAnnuler={fermer}
          onConfirmer={supprimer}
        />
      )}
    </>
  );
}
