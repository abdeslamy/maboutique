"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import QuantitySelector from "./QuantitySelector";
import { useCart } from "@/context/CartContext";
import type { Produit } from "@/lib/types";

/**
 * Bloc "ajouter au panier" : [sélecteur de quantité] [bouton noir].
 * Après un clic, le bouton bascule en vert "✓ Ajouté" pendant 2 secondes,
 * puis revient à son état normal. Confirmation visuelle simple, sans toast.
 */
export default function BoutonAjouterPanier({ produit }: { produit: Produit }) {
  const t = useTranslations("produit");
  const { ajouter } = useCart();

  const [quantite, setQuantite] = useState(1);
  const [vientDeAjouter, setVientDeAjouter] = useState(false);
  const minuterieRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyage du timer si le composant est démonté entre temps
  // (sinon on aurait un "memory leak" sur des changements rapides de page).
  useEffect(() => {
    return () => {
      if (minuterieRef.current) clearTimeout(minuterieRef.current);
    };
  }, []);

  function ajouterAuPanier() {
    ajouter(produit.id, quantite);
    setVientDeAjouter(true);
    if (minuterieRef.current) clearTimeout(minuterieRef.current);
    minuterieRef.current = setTimeout(() => setVientDeAjouter(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <QuantitySelector value={quantite} onChange={setQuantite} />
      <button
        type="button"
        onClick={ajouterAuPanier}
        className={`rounded-full px-6 py-3 text-sm font-medium text-white transition ${
          vientDeAjouter
            ? "bg-green-600 hover:bg-green-700"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {vientDeAjouter ? `✓ ${t("ajoute")}` : t("ajouterAuPanier")}
      </button>
    </div>
  );
}
