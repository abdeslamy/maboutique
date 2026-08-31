"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Bouton « Retour » — flèche + libellé.
 *
 * ── Pourquoi il ne ressemble plus à un bouton ─────────────────────────────
 *
 * Il portait une bordure grise, un fond blanc et une ombre de focus décalée :
 * le costume d'une action importante, pour ce qui n'est qu'un pas en arrière.
 * Sur une page de produit, il rivalisait visuellement avec « Ajouter au
 * panier ».
 *
 * Il est désormais « fantôme » : rien au repos, une teinte au survol. C'est le
 * même principe que les icônes de la barre de navigation — le conteneur
 * n'apparaît qu'au moment où on le vise. Le retrait négatif (`-ms-3`) ramène
 * le TEXTE sur la marge de la page : sans lui, le rembourrage du bouton
 * décalerait le libellé par rapport au titre qui le suit.
 *
 * ── RTL ───────────────────────────────────────────────────────────────────
 *
 * La flèche doit pointer vers la droite en arabe : `rtl:-scale-x-100`. À noter
 * — en Tailwind v4 cette classe passe par la propriété `scale` et non par
 * `transform`, ce qui trompe si on inspecte la mauvaise propriété.
 *
 * Avec `href`, c'est un <Link> localisé et préchargé. Sans, un simple retour
 * dans l'historique.
 */
export default function BoutonRetour({
  href,
  libelle,
}: {
  href?: string;
  libelle?: string;
}) {
  const t = useTranslations("navigation");
  const texte = libelle ?? t("retour");

  const classe =
    "-ms-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:bg-gray-100 focus-visible:text-gray-900";

  const contenu = (
    <>
      <ArrowLeft
        className="h-[17px] w-[17px] rtl:-scale-x-100"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>{texte}</span>
    </>
  );

  if (href) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link href={href as any} className={classe}>
        {contenu}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={classe}
    >
      {contenu}
    </button>
  );
}
