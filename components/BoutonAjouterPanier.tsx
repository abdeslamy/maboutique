"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import QuantitySelector from "./QuantitySelector";
import { useCart } from "@/context/CartContext";
import type { Produit } from "@/lib/types";

/**
 * Bloc d'achat de la fiche produit.
 *
 * Deux actions, volontairement hiérarchisées :
 *  - « Commander maintenant » : action PRINCIPALE, pleine largeur et pleine
 *    couleur. Elle met l'article au panier PUIS va droit au formulaire de
 *    commande — sans ce passage par le panier, la page de commande s'ouvrirait
 *    sur un panier vide.
 *  - « Ajouter au panier » : action secondaire, en contour. Elle garde le
 *    client sur la page pour qu'il continue ses achats, et confirme par un
 *    « ✓ Ajouté » de 2 secondes.
 *
 * Disposition : tout empilé en pleine largeur sur mobile (le pouce vise
 * facilement), quantité et boutons sur une ligne à partir de `sm`.
 */
export default function BoutonAjouterPanier({ produit }: { produit: Produit }) {
  const t = useTranslations("produit");
  const { ajouter } = useCart();
  const router = useRouter();

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

  const enRupture = produit.stock <= 0;

  function ajouterAuPanier() {
    if (enRupture) return;
    ajouter(produit.id, quantite);
    setVientDeAjouter(true);
    if (minuterieRef.current) clearTimeout(minuterieRef.current);
    minuterieRef.current = setTimeout(() => setVientDeAjouter(false), 2000);
  }

  function commander() {
    if (enRupture) return;
    // On passe par le panier : c'est lui que lit la page de commande.
    ajouter(produit.id, quantite);
    router.push("/commande");
  }

  // Produit épuisé : plus de sélecteur ni de bouton actif.
  if (enRupture) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-full bg-gray-100 px-6 py-3.5 text-sm font-medium text-gray-500 sm:w-auto"
      >
        {t("rupture")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quantité + action secondaire : côte à côte dès qu'il y a la place. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* self-start : dans une colonne, les enfants s'étirent par défaut sur
            toute la largeur. Un sélecteur de quantité étalé sur 343 px n'a
            aucun sens — il doit rester à la taille de son contenu. */}
        <div className="self-start">
          {/* Le sélecteur ne dépasse jamais le stock réellement disponible. */}
          <QuantitySelector
            value={quantite}
            onChange={setQuantite}
            max={produit.stock}
          />
        </div>

        <button
          type="button"
          onClick={ajouterAuPanier}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition sm:w-auto ${
            vientDeAjouter
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-gray-300 bg-white text-gray-900 hover:border-gray-900 hover:bg-gray-50"
          }`}
        >
          {vientDeAjouter ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              {t("ajoute")}
            </>
          ) : (
            <>
              <ShoppingCart
                className="h-4 w-4"
                strokeWidth={2}
                aria-hidden="true"
              />
              {t("ajouterAuPanier")}
            </>
          )}
        </button>
      </div>

      {/* Action principale : pleine largeur sur les deux formats, pour qu'elle
          domine visuellement la ligne du dessus. */}
      <button
        type="button"
        onClick={commander}
        className="w-full rounded-full bg-black px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-gray-800"
      >
        {t("commander")}
      </button>
    </div>
  );
}
