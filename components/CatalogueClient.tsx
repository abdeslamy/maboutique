"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import { useProducts } from "@/context/ProductsContext";
import type { Categorie } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

const CATEGORIES: (Categorie | "tout")[] = [
  "tout",
  "mode",
  "electronique",
  "maison",
];

/**
 * Composant CLIENT qui gère la recherche + le filtre par catégorie.
 *
 * Concepts React qu'on utilise ici :
 *  - useState : crée une "mémoire locale" qui survit aux re-rendus.
 *  - useMemo : recalcule une valeur seulement quand ses dépendances changent
 *              (évite de re-filtrer les produits à chaque frappe inutile).
 */
export default function CatalogueClient() {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalogue");
  const tCat = useTranslations("categories");
  const { produits } = useProducts();

  // États : chaîne de recherche + catégorie active
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState<Categorie | "tout">("tout");

  // Liste filtrée : on la recalcule seulement quand recherche, categorie, locale
  // ou la liste de produits changent.
  const produitsFiltres = useMemo(() => {
    const requete = recherche.trim().toLowerCase();
    return produits.filter((p) => {
      // Filtre par catégorie
      if (categorie !== "tout" && p.categorie !== categorie) return false;
      // Filtre par texte : on cherche dans le nom traduit dans la langue active
      if (requete && !p.nom[locale].toLowerCase().includes(requete)) return false;
      return true;
    });
  }, [recherche, categorie, locale, produits]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      {/* Titre */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t("titre")}</h1>
        <p className="text-gray-600">{t("sousTitre")}</p>
      </header>

      {/* Barre de recherche + filtres catégories */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("placeholderRecherche")}
          className="w-full max-w-sm rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-black focus:outline-none"
          aria-label={t("placeholderRecherche")}
        />

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const actif = cat === categorie;
            return (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  actif
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                }`}
              >
                {tCat(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille des produits */}
      {produitsFiltres.length === 0 ? (
        <p className="py-16 text-center text-gray-500">{t("aucunResultat")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produitsFiltres.map((p) => (
            <ProductCard key={p.id} produit={p} />
          ))}
        </div>
      )}
    </div>
  );
}
