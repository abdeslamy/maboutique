"use client";

import { useTranslations } from "next-intl";
import { useRecherche } from "@/context/RechercheContext";
import { Loupe } from "./recherche/IconesRecherche";

/**
 * Barre de recherche du hero de la page d'accueil.
 *
 * Ce n'est PLUS un champ de saisie : c'est un déclencheur. Le tap ouvre
 * l'overlay de recherche, exactement comme la loupe de la barre de
 * navigation — même animation, même contenu, mêmes états, même fermeture.
 * Toute la saisie se passe dans l'overlay.
 *
 * Pourquoi un <button> et pas un <input readOnly> : un champ, même en
 * lecture seule, promet un curseur et un clavier. Sur iOS il en ouvre un
 * dans certains cas, puis l'overlay en ouvre un second — deux claviers pour
 * une recherche. Le bouton dit la vérité au navigateur comme au lecteur
 * d'écran : ceci ouvre quelque chose.
 *
 * Les dimensions sont celles du champ de l'overlay (48 px de haut, rayon 24,
 * loupe de 21 px, placeholder de 16 px) : posés côte à côte, on doit
 * reconnaître le même composant. Seul le fond change — blanc + ombre douce
 * ici, parce que la barre flotte sur le contenu, alors que le champ de
 * l'overlay repose déjà sur un panneau blanc.
 */
export default function BarreRechercheHome() {
  const t = useTranslations("recherche");
  const tNav = useTranslations("navigation");
  const { ouvert, ouvrir } = useRecherche();

  return (
    <button
      type="button"
      onClick={ouvrir}
      aria-label={tNav("rechercher")}
      aria-haspopup="dialog"
      aria-expanded={ouvert}
      className={[
        // Gabarit repris du champ de l'overlay.
        "flex h-[48px] w-full max-w-xl items-center gap-[10px] rounded-[24px] px-[14px]",
        // Ce qui la distingue : elle flotte.
        "bg-white shadow-[0_2px_14px_rgba(17,17,17,0.10)]",
        // Pression : l'enfoncement remplace le curseur qui n'apparaîtra pas.
        "transition-[transform,box-shadow] duration-[140ms] ease-[cubic-bezier(.2,.8,.2,1)]",
        "active:scale-[.985] active:shadow-[0_1px_6px_rgba(17,17,17,0.10)]",
        "hover:shadow-[0_4px_18px_rgba(17,17,17,0.12)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
      ].join(" ")}
    >
      <Loupe className="h-[21px] w-[21px] flex-none" trait={1.9} couleur="#111" />
      {/* Faux placeholder : même taille et même couleur que le vrai, dans
          l'overlay. `text-start` pour rester à gauche en FR, à droite en AR. */}
      <span
        className="min-w-0 flex-1 truncate text-start text-[rgba(0,0,0,0.40)]"
        style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.2 }}
      >
        {t("placeholder")}
      </span>
    </button>
  );
}
