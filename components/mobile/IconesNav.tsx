"use client";

import { useId } from "react";

/**
 * Icônes de la navigation mobile — Variante B.
 *
 * Les tracés sont repris TELS QUELS de la spécification : les corrections
 * d'alignement optique sont déjà intégrées aux coordonnées (globe
 * `translate(0.48, 0.52) scale(0.96)`, loupe `translate(-0.3, 0.62) scale(1.03)`).
 * Ne pas les recentrer dans le viewBox ni ajouter une correction CSS sur le
 * bouton : cela doublerait le décalage.
 *
 * Les réserves blanches passent par `fill-rule="evenodd"` (maison) ou par un
 * `<mask>` (globe), jamais par un aplat blanc — un `fill="#fff"` deviendrait
 * visible dès que le fond n'est plus blanc.
 *
 * Tous les SVG portent `aria-hidden` : l'information vit dans l'`aria-label`
 * du bouton qui les contient.
 */

type Props = { className?: string };

const commun = {
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
};

// ── Accueil ─────────────────────────────────────────────────────────

export function AccueilOutline({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.3C12.7 3.3 13.2 3.5 13.7 3.9L20.1 9.2C20.6 9.7 20.8 10.2 20.8 10.9V18.2C20.8 20 19.7 21.1 17.9 21.1H6.1C4.3 21.1 3.2 20 3.2 18.2V10.9C3.2 10.2 3.4 9.7 3.9 9.2L10.3 3.9C10.8 3.5 11.3 3.3 12 3.3Z" />
      <path d="M7.18 17.75H16.82" />
    </svg>
  );
}

export function AccueilFilled({ className }: Props) {
  return (
    <svg {...commun} className={className} fill="currentColor">
      {/* evenodd : le trait intérieur est une RÉSERVE, pas un aplat blanc. */}
      <path
        fillRule="evenodd"
        d="M12 3.3C12.7 3.3 13.2 3.5 13.7 3.9L20.1 9.2C20.6 9.7 20.8 10.2 20.8 10.9V18.2C20.8 20 19.7 21.1 17.9 21.1H6.1C4.3 21.1 3.2 20 3.2 18.2V10.9C3.2 10.2 3.4 9.7 3.9 9.2L10.3 3.9C10.8 3.5 11.3 3.3 12 3.3ZM7.18 16.85H16.82A0.5 0.5 0 0 1 17.32 17.35V18.14A0.5 0.5 0 0 1 16.82 18.64H7.18A0.5 0.5 0 0 1 6.68 18.14V17.35A0.5 0.5 0 0 1 7.18 16.85Z"
      />
    </svg>
  );
}

// ── Panier ──────────────────────────────────────────────────────────
// Aucun décalage vertical ici (contrairement à la Variante A) : l'icône est
// dans la tab bar, alignée sur la maison et le profil.

export function PanierOutline({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 9.1V7.3C9 5.6 10.3 4.3 12 4.3C13.7 4.3 15 5.6 15 7.3V9.1" />
      <path d="M7.2 8.9H16.8C18.3 8.9 19.4 10 19.6 11.5L20.3 17.4C20.6 19.9 19.2 21.3 16.7 21.3H7.3C4.8 21.3 3.4 19.9 3.7 17.4L4.4 11.5C4.6 10 5.7 8.9 7.2 8.9Z" />
    </svg>
  );
}

export function PanierFilled({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* L'anse reste en trait : elle passe au-dessus de la bouche du sac. */}
      <path d="M9 9.1V7.3C9 5.6 10.3 4.3 12 4.3C13.7 4.3 15 5.6 15 7.3V9.1" />
      <path
        fill="currentColor"
        d="M7.2 8.9H16.8C18.3 8.9 19.4 10 19.6 11.5L20.3 17.4C20.6 19.9 19.2 21.3 16.7 21.3H7.3C4.8 21.3 3.4 19.9 3.7 17.4L4.4 11.5C4.6 10 5.7 8.9 7.2 8.9Z"
      />
    </svg>
  );
}

// ── Profil ──────────────────────────────────────────────────────────

export function ProfilOutline({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7.2" r="3.4" />
      <path d="M12 13.9C16.4 13.9 19.4 16.3 19.4 19.6C19.4 20.7 18.7 21.3 17.4 21.3H6.6C5.3 21.3 4.6 20.7 4.6 19.6C4.6 16.3 7.6 13.9 12 13.9Z" />
    </svg>
  );
}

export function ProfilFilled({ className }: Props) {
  return (
    <svg {...commun} className={className} fill="currentColor">
      <circle cx="12" cy="7.2" r="3.4" />
      <path d="M12 13.9C16.4 13.9 19.4 16.3 19.4 19.6C19.4 20.7 18.7 21.3 17.4 21.3H6.6C5.3 21.3 4.6 20.7 4.6 19.6C4.6 16.3 7.6 13.9 12 13.9Z" />
    </svg>
  );
}

// ── Langue ──────────────────────────────────────────────────────────
// stroke 1,75 et rendu 29 px : le globe est un cercle dans un cercle, il
// paraît plus grand que la loupe à dimension égale.

export function LangueOutline({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12.04" r="8.06" />
      <path d="M12 3.98C14.78 6.38 15.94 9.06 15.94 12.04C15.94 15.02 14.78 17.7 12 20.1C9.7 17.7 8.54 15.02 8.54 12.04C8.54 9.06 9.7 6.38 12 3.98Z" />
      <path d="M4.03 12.04H19.97" />
    </svg>
  );
}

export function LangueFilled({ className }: Props) {
  // useId garantit un identifiant unique PAR INSTANCE : sans lui, la première
  // occurrence dans le DOM masquerait toutes les autres.
  const idMasque = `globe-mask-${useId()}`;
  return (
    <svg {...commun} className={className}>
      <mask id={idMasque}>
        <circle cx="12" cy="12.04" r="8.06" fill="#fff" />
        <g
          fill="none"
          stroke="#000"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3.98C14.78 6.38 15.94 9.06 15.94 12.04C15.94 15.02 14.78 17.7 12 20.1C9.7 17.7 8.54 15.02 8.54 12.04C8.54 9.06 9.7 6.38 12 3.98Z" />
          <path d="M4.33 12.04H19.67" />
        </g>
      </mask>
      {/* Masque plutôt qu'evenodd : méridien et équateur se croisent, un
          evenodd recréerait des taches pleines aux quatre intersections. */}
      <circle
        cx="12"
        cy="12.04"
        r="8.06"
        fill="currentColor"
        mask={`url(#${idMasque})`}
      />
    </svg>
  );
}

// ── Recherche ───────────────────────────────────────────────────────
// Devenue un onglet de la tab bar en version 2. Son décalage optique n'est
// plus fondu dans les coordonnées mais porté par un `transform` sur le <g>,
// comme le veut la spécification : `translate(0.36,0.77) scale(1.03)`.
// C'est cette écriture qui rend la valeur relisible quand elle change.

/** Décalage optique de la loupe dans la tab bar — unités du viewBox. */
const CALAGE_LOUPE = "translate(0.36,0.77) scale(1.03)";

export function RechercheOutline({ className, trait = 1.7 }: Props & { trait?: number }) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={trait}
      strokeLinecap="round"
    >
      <g transform={CALAGE_LOUPE}>
        <circle cx="10.7" cy="10.7" r="7.4" />
        <path d="M16.2 15.7 L19.3 18.5" />
      </g>
    </svg>
  );
}

/**
 * État actif : lentille pleine, manche épaissi à 2,4.
 *
 * Le disque est un `fill` et non un anneau épais — à 28 px, un anneau de
 * 3,3 fermait la lentille en une tache illisible tout en gardant l'aspect
 * d'un contour raté.
 */
export function RechercheFilled({ className }: Props) {
  return (
    <svg {...commun} className={className} fill="none">
      <g transform={CALAGE_LOUPE}>
        <circle cx="10.7" cy="10.7" r="7.4" fill="currentColor" />
        <path
          d="M16.2 15.7 L19.3 18.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// ── Filtre ──────────────────────────────────────────────────────────

export function FiltreOutline({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.72"
      strokeLinecap="round"
    >
      <path d="M4.6 7.7H19.4" />
      <path d="M7.1 12H16.9" />
      <path d="M9.6 16.4H14.4" />
    </svg>
  );
}

export function FiltreFilled({ className }: Props) {
  return (
    <svg
      {...commun}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.9"
      strokeLinecap="round"
    >
      <path d="M4.6 7.7H19.4" />
      <path d="M7.1 12H16.9" />
      <path d="M9.6 16.4H14.4" />
    </svg>
  );
}
