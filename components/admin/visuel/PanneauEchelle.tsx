"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { OMBRE, POLICE_UI } from "@/components/admin/visuel/jetons";

/**
 * L'enveloppe des panneaux décoratifs — et le seul endroit qui rend la
 * composition responsive.
 *
 * ── Le problème ───────────────────────────────────────────────────────────
 *
 * Les cartes sont posées en PIXELS FIXES, calculés pour un panneau de
 * 584 × 788 : la carte des ventes à gauche −40, la notification à droite −34,
 * les fiches produit en bas −58. C'est ce qui fait tenir le dessin, et la spec
 * interdit explicitement de les réagencer.
 *
 * Mais la colonne de droite, elle, mesure ce que l'écran lui laisse. Entre
 * 1200 et 1440 px de large elle est plus étroite que 584, et sur un portable
 * peu haut le panneau descend sous 788. Les cartes, ancrées à des bords qui
 * ont bougé, se chevauchaient alors n'importe comment.
 *
 * ── La réponse ────────────────────────────────────────────────────────────
 *
 * La composition garde ses 584 × 788 EXACTS, et on l'agrandit ou la réduit
 * d'un bloc pour qu'elle tienne dans la place disponible :
 *
 *     k = min(largeur / 584, hauteur / 788)
 *
 * Les proportions ne bougent jamais, rien ne se recompose, et le dessin est
 * juste à toutes les tailles. Comme tout est en SVG et en texte, la réduction
 * ne coûte aucune netteté — c'était l'argument d'abandonner l'image.
 *
 * ── Pourquoi en JavaScript, et pas en CSS ─────────────────────────────────
 *
 * `transform: scale()` attend un NOMBRE sans unité. CSS sait diviser une
 * longueur par un nombre, jamais une longueur par une longueur : ni `calc()`,
 * ni les unités de conteneur (`cqw`, `cqh`) ne savent produire ce rapport. La
 * seule voie purement CSS serait de réécrire chaque dimension du dessin en
 * multiples d'une variable — quelques centaines de valeurs, illisibles.
 *
 * `useLayoutEffect` mesure AVANT la peinture : aucun clignotement à
 * l'affichage. Il n'existe pas au rendu serveur, d'où la bascule sur
 * `useEffect` là-bas — le composant n'est de toute façon pas monté.
 *
 * ⚠️ Une transformation crée un bloc conteneur pour les descendants en
 * `position: fixed`. Il n'y en a aucun ici, tout est en `absolute` — et il ne
 * faut pas en introduire.
 */

/** Les dimensions de référence de la maquette. Ne pas y toucher. */
const LARGEUR = 584;
const HAUTEUR = 788;

const useEffetDeMiseEnPage =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function PanneauEchelle({
  children,
}: {
  children: React.ReactNode;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  // `null` tant qu'on n'a pas mesuré. Le rendu serveur ne connaît pas la
  // taille de l'écran : afficher la composition à l'échelle 1 en attendant
  // laisserait passer, sur un petit écran, une image trop grande et rognée
  // pendant une fraction de seconde. Le panneau reste donc crème et vide
  // jusqu'à la première mesure — soit une frame après l'hydratation.
  const [k, setK] = useState<number | null>(null);

  useEffetDeMiseEnPage(() => {
    const el = cadre.current;
    if (!el) return;

    const mesurer = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return; // panneau masqué sous 1200 px
      setK(Math.min(width / LARGEUR, height / HAUTEUR));
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  return (
    <div
      ref={cadre}
      dir="ltr"
      aria-hidden="true"
      // `overflow-hidden` n'est pas un détail : les cartes débordent
      // volontairement et se font rogner par les coins arrondis. Ce rognage
      // EST le dessin.
      className="relative w-full overflow-hidden rounded-[40px] bg-[#fcfaf6]"
      style={{ fontFamily: POLICE_UI, boxShadow: OMBRE.panneau }}
    >
      {/* La composition, à sa taille de référence, centrée puis mise à
          l'échelle. `top/left: 50%` place son coin, `translate(-50%, -50%)` la
          recentre sur elle-même, `scale(k)` l'ajuste — dans cet ordre, sans
          quoi la translation serait elle aussi mise à l'échelle. */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: LARGEUR,
          height: HAUTEUR,
          transform: `translate(-50%, -50%) scale(${k ?? 1})`,
          // Pas de transition : on ne veut pas d'animation d'entrée sur ce
          // panneau, seulement éviter la frame à la mauvaise taille.
          visibility: k === null ? "hidden" : "visible",
        }}
      >
        {children}
      </div>
    </div>
  );
}
