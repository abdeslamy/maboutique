"use client";

import { useCart } from "@/context/CartContext";

/**
 * Pastille du nombre d'articles, posée sur l'icône du panier.
 *
 * Elle n'apparaît QUE si le panier contient quelque chose : un « 0 » affiché
 * en permanence n'apporte rien et alourdit la barre.
 *
 * Tant que le panier n'est pas relu depuis localStorage, on considère qu'il
 * est vide — sinon le rendu serveur et le rendu client diffèrent et React
 * signale une erreur d'hydratation.
 *
 * Le parent doit être `relative` pour que le positionnement fonctionne.
 */
export default function PanierCompteur() {
  const { nombreArticles, estCharge } = useCart();
  const valeur = estCharge ? nombreArticles : 0;

  if (valeur === 0) return null;

  return (
    <span
      // -end-0.5 : coin supérieur "fin" — droite en français, gauche en arabe.
      className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold tabular-nums text-white"
      aria-hidden="true"
    >
      {valeur > 9 ? "9+" : valeur}
    </span>
  );
}
