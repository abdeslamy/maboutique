"use client";

import { useEffect, useRef } from "react";

/**
 * Boîte de confirmation pour une action irréversible.
 *
 * Extraite parce qu'il en existe désormais deux — le client qui retire une
 * commande de son historique, le vendeur qui en supprime une. Deux boîtes
 * « qui se ressemblent » finissent par diverger : ça s'est déjà produit deux
 * fois dans ce projet, sur les cadres d'authentification puis sur leurs
 * contrôles.
 *
 * ── Ce qu'elle fait, et pourquoi ──────────────────────────────────────────
 *
 * Une action irréversible mérite mieux qu'un `confirm()` :
 *
 *  - `role="dialog"` + `aria-modal` + titre et texte liés par
 *    aria-labelledby / aria-describedby ;
 *  - le focus part sur ANNULER, jamais sur l'action destructrice. Une frappe
 *    d'Entrée réflexe ne doit rien détruire ;
 *  - Échap ferme, un clic sur le voile aussi ;
 *  - le défilement du fond est bloqué tant qu'elle est ouverte ;
 *  - à la fermeture, le focus revient sur l'élément qui l'a ouverte, sinon on
 *    repartirait du haut du document.
 *
 * ⚠️ L'ordre du DOM est Annuler PUIS confirmer, et la mise en page ne l'inverse
 * jamais — pas de `flex-col-reverse`. L'ordre vu et l'ordre parcouru au clavier
 * doivent coïncider, surtout quand l'un des deux boutons détruit.
 */
export default function DialogueConfirmation({
  id,
  icone,
  titre,
  texte,
  erreur,
  libelleAnnuler,
  libelleConfirmer,
  chargement,
  onAnnuler,
  onConfirmer,
}: {
  /** Sert à fabriquer des identifiants uniques quand plusieurs boîtes cohabitent. */
  id: string;
  icone: React.ReactNode;
  titre: string;
  texte: string;
  /** Message affiché si l'action a échoué. */
  erreur?: string | null;
  libelleAnnuler: string;
  libelleConfirmer: string;
  chargement?: boolean;
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  const boutonAnnuler = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boutonAnnuler.current?.focus();

    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") onAnnuler();
    }
    document.addEventListener("keydown", surTouche);

    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = overflowInitial;
    };
  }, [onAnnuler]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Le voile. Un bouton et non un div : il se ferme au clavier comme à la
          souris. */}
      <button
        type="button"
        aria-label={libelleAnnuler}
        onClick={onAnnuler}
        className="absolute inset-0 h-full w-full cursor-default bg-gray-900/40 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`confirmation-titre-${id}`}
        aria-describedby={`confirmation-texte-${id}`}
        className="relative w-full max-w-[400px] rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,.18)] sm:p-7"
      >
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-50">
          {icone}
        </span>

        <h2
          id={`confirmation-titre-${id}`}
          className="text-[19px] font-semibold leading-snug tracking-tight text-gray-900"
        >
          {titre}
        </h2>

        <p
          id={`confirmation-texte-${id}`}
          className="mt-2 text-[14.5px] leading-[1.5] text-gray-600"
        >
          {texte}
        </p>

        {erreur && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[13.5px] leading-[1.45] text-red-700"
          >
            {erreur}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            ref={boutonAnnuler}
            type="button"
            onClick={onAnnuler}
            disabled={chargement}
            className="h-11 flex-1 rounded-full border border-gray-200 text-[14.5px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {libelleAnnuler}
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={chargement}
            className="h-11 flex-1 rounded-full bg-red-600 text-[14.5px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
