"use client";

/**
 * Icônes de l'overlay de recherche.
 *
 * Les tracés viennent tels quels de la spécification : la loupe porte un
 * `translate(-0.3, 0.62) scale(1.03)` qui compense son déséquilibre optique
 * (le manche tire l'œil vers le bas à droite). Ne pas recentrer dans le
 * viewBox — la correction est déjà dans les coordonnées.
 *
 * L'épaisseur de trait varie selon l'usage et n'est donc pas figée dans le
 * composant : le document donne 1,9 dans le champ, 2 dans les suggestions.
 *
 * Tous les SVG sont `aria-hidden` : l'information vit dans l'`aria-label`
 * du bouton qui les contient.
 */

type PropsLoupe = {
  className?: string;
  /** Épaisseur du trait — 1,9 dans le champ, 2 dans les suggestions. */
  trait?: number;
  /** Couleur du trait. `currentColor` par défaut. */
  couleur?: string;
};

export function Loupe({
  className,
  trait = 1.9,
  couleur = "currentColor",
}: PropsLoupe) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <g transform="translate(-0.3,0.62) scale(1.03)">
        <circle
          cx="10.7"
          cy="10.7"
          r="7.4"
          fill="none"
          stroke={couleur}
          strokeWidth={trait}
        />
        <path
          d="M16.2 15.7 L19.3 18.5"
          fill="none"
          stroke={couleur}
          strokeWidth={trait}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

type PropsCroix = {
  className?: string;
  trait?: number;
  couleur?: string;
};

/**
 * Croix générique. Trois usages, trois épaisseurs, tous dans le document :
 *  - 2,6 blanche dans la pastille d'effacement du champ ;
 *  - 2,4 en rgba(0,0,0,.4) sur les chips de recherches récentes ;
 *  - 2 en #111 sur la croix de fermeture du panneau desktop.
 */
export function Croix({
  className,
  trait = 2.4,
  couleur = "currentColor",
}: PropsCroix) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6 6 L18 18 M18 6 L6 18"
        fill="none"
        stroke={couleur}
        strokeWidth={trait}
        strokeLinecap="round"
      />
    </svg>
  );
}
