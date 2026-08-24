"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRecherche } from "@/context/RechercheContext";

/**
 * Loupe de la capsule d'actions (barre de navigation desktop).
 *
 * Était un lien vers /produits ; ouvre maintenant l'overlay de recherche.
 * L'icône reste celle de la capsule (lucide, trait 2,25) pour ne pas
 * dépareiller au milieu des deux autres pastilles.
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
  const { ouvrir } = useRecherche();

  return (
    <button
      type="button"
      onClick={ouvrir}
      className={className}
      aria-label={t("rechercher")}
      title={t("rechercher")}
    >
      <Search className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}
