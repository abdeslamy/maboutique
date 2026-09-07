"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/**
 * Retire une commande de l'historique du client, après confirmation.
 *
 * ⚠️ Le mot « supprimer » est évité à dessein. Rien n'est supprimé en base :
 * la commande est détachée du compte, parce qu'elle reste la pièce comptable
 * du vendeur et porte le stock qu'elle a décrémenté. Voir
 * retirerCommandeDeLHistorique dans lib/orders.ts.
 *
 * Pour le client, l'effet EST définitif — elle ne reviendra jamais — et le
 * texte de la boîte le dit, sans prétendre que le vendeur l'oublie aussi.
 *
 * ── Ce que la boîte de dialogue doit faire, et pourquoi ───────────────────
 *
 * C'est une action irréversible : elle mérite mieux qu'un `confirm()`. D'où
 * une vraie boîte, avec ce qui va avec :
 *
 *  - `role="dialog"` + `aria-modal` + un titre lié par aria-labelledby ;
 *  - le focus part sur ANNULER, jamais sur l'action destructrice. Une frappe
 *    d'Entrée réflexe ne doit pas détruire quoi que ce soit ;
 *  - Échap ferme, un clic sur le voile aussi ;
 *  - le défilement du fond est bloqué tant qu'elle est ouverte ;
 *  - au retour, le focus revient sur l'icône qui l'a ouverte, sinon on
 *    repartirait du haut de la page.
 */
export default function BoutonRetirerCommande({
  commandeId,
}: {
  commandeId: string;
}) {
  const t = useTranslations("compte");
  const router = useRouter();

  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);

  const declencheur = useRef<HTMLButtonElement>(null);
  const boutonAnnuler = useRef<HTMLButtonElement>(null);

  // Ouverture : on donne le focus à Annuler, on bloque le défilement du fond,
  // et Échap referme.
  useEffect(() => {
    if (!ouvert) return;

    boutonAnnuler.current?.focus();

    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("keydown", surTouche);

    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = overflowInitial;
    };
  }, [ouvert]);

  function fermer() {
    setOuvert(false);
    setErreur(false);
    // Le focus revient d'où il venait, sinon il repart au début du document.
    declencheur.current?.focus();
  }

  async function retirer() {
    setChargement(true);
    setErreur(false);
    try {
      const res = await fetch(`/api/commandes/${commandeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setErreur(true);
        setChargement(false);
        return;
      }
      setOuvert(false);
      // La liste est rendue côté serveur : c'est lui qui doit la recalculer.
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
        aria-label={t("retirerAria")}
        title={t("retirerAria")}
        // Zone de clic de 36 px, sans fond au repos : la même grammaire que la
        // barre de navigation. Le rouge n'apparaît qu'au survol — une action
        // destructrice ne doit pas crier tant qu'on ne la vise pas.
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-600"
      >
        <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Le voile. Un bouton et non un div : il se ferme au clavier comme
              à la souris. */}
          <button
            type="button"
            aria-label={t("retirerAnnuler")}
            onClick={fermer}
            className="absolute inset-0 h-full w-full cursor-default bg-gray-900/40 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`retirer-titre-${commandeId}`}
            aria-describedby={`retirer-texte-${commandeId}`}
            className="relative w-full max-w-[400px] rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,.18)] sm:p-7"
          >
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.9} aria-hidden="true" />
            </span>

            <h2
              id={`retirer-titre-${commandeId}`}
              className="text-[19px] font-semibold leading-snug tracking-tight text-gray-900"
            >
              {t("retirerTitre")}
            </h2>

            <p
              id={`retirer-texte-${commandeId}`}
              className="mt-2 text-[14.5px] leading-[1.5] text-gray-600"
            >
              {t("retirerTexte")}
            </p>

            {erreur && (
              <p
                role="alert"
                className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[13.5px] leading-[1.45] text-red-700"
              >
                {t("retirerErreur")}
              </p>
            )}

            {/* Annuler d'abord, à parts égales : la sortie sûre est au moins
                aussi accessible que l'action destructrice.

                `flex-col` et non `flex-col-reverse` : avec l'inverse, Retirer
                s'affichait AU-DESSUS d'Annuler sur mobile alors que l'ordre du
                DOM — donc celui du clavier et du lecteur d'écran — restait
                Annuler puis Retirer. Ordre vu et ordre parcouru doivent
                coïncider, surtout quand l'un des deux détruit. */}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                ref={boutonAnnuler}
                type="button"
                onClick={fermer}
                disabled={chargement}
                className="h-11 flex-1 rounded-full border border-gray-200 text-[14.5px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                {t("retirerAnnuler")}
              </button>
              <button
                type="button"
                onClick={retirer}
                disabled={chargement}
                className="h-11 flex-1 rounded-full bg-red-600 text-[14.5px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {chargement ? t("retirerEnCours") : t("retirer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
