"use client";

import { RechercheOutline } from "@/components/mobile/IconesNav";
import { useTranslations } from "next-intl";
import { useRecherche } from "@/context/RechercheContext";

/**
 * Loupe de la capsule d'actions (barre de navigation desktop).
 *
 * Était un lien vers /produits ; ouvre maintenant l'overlay de recherche.
 *
 * L'icône est celle de la NAVIGATION MOBILE, pas une icône de bibliothèque :
 * le même geste doit se reconnaître d'un format à l'autre. Elle porte un
 * léger calage optique hérité de la tab bar (0,36 / 0,77 sur 24), invisible
 * à cette taille.
 *
 * Contrairement au déclencheur mobile, elle NE disparaît PAS à l'ouverture :
 * le document ne prévoit aucun échelonnage depuis le bouton en desktop.
 */
export default function BoutonRechercheNavbar({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("navigation");
  const { ouvert, ouvrir } = useRecherche();

  return (
    <button
      type="button"
      onClick={ouvrir}
      className={className}
      aria-label={t("rechercher")}
      title={t("rechercher")}
      aria-haspopup="dialog"
      aria-expanded={ouvert}
    >
      <RechercheOutline className="h-[19px] w-[19px]" trait={1.9} />
    </button>
  );
}
