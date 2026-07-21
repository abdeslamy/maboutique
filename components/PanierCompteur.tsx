"use client";

import { useCart } from "@/context/CartContext";

/**
 * Petit compteur affiché à côté de l'icône panier dans la Navbar.
 * Lit le nombre d'articles depuis le Context.
 *
 * Tant que le panier n'est pas encore chargé depuis localStorage,
 * on affiche (0) — important pour éviter une différence entre rendu serveur
 * et rendu client (sinon React râle avec une erreur d'hydration).
 */
export default function PanierCompteur() {
  const { nombreArticles, estCharge } = useCart();
  const valeur = estCharge ? nombreArticles : 0;

  return (
    <span
      className={`text-xs ${
        valeur > 0 ? "font-semibold text-black" : "text-gray-500"
      }`}
    >
      ({valeur})
    </span>
  );
}
