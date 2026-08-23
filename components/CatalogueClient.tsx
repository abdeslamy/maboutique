"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import { useProducts } from "@/context/ProductsContext";
import type { Categorie } from "@/lib/types";
import type { Locale } from "@/i18n/routing";


/** Nombre de pastilles affichées avant repli (« Tout » compris). */
const LIMITE_FILTRES = 4;

/**
 * Composant CLIENT qui gère la recherche + le filtre par catégorie.
 *
 * Concepts React qu'on utilise ici :
 *  - useState : crée une "mémoire locale" qui survit aux re-rendus.
 *  - useMemo : recalcule une valeur seulement quand ses dépendances changent
 *              (évite de re-filtrer les produits à chaque frappe inutile).
 */
export default function CatalogueClient({
  categories,
}: {
  /** Rayons de la boutique, lus en base par la page parente. */
  categories: { id: string; nomFr: string; nomAr: string }[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalogue");
  const tCat = useTranslations("categories");
  const { produits } = useProducts();

  // Si on arrive depuis la homepage avec ?q=xxx, on pré-remplit le champ.
  const searchParams = useSearchParams();
  const rechercheInitiale = searchParams.get("q") ?? "";

  // États : chaîne de recherche + catégorie active
  const [recherche, setRecherche] = useState(rechercheInitiale);
  const [categorie, setCategorie] = useState<Categorie | "tout">("tout");
  // Au-delà de quelques rayons, la rangée de filtres devient un mur de
  // pastilles qui repousse les produits hors de l'écran. On en montre 4,
  // le reste se déplie à la demande.
  const [deplie, setDeplie] = useState(false);

  const tousLesFiltres = useMemo(
    () => [{ id: "tout", nomFr: "", nomAr: "" }, ...categories],
    [categories]
  );
  // La catégorie active reste TOUJOURS visible, même repliée : sinon le
  // filtre en cours disparaîtrait de l'écran une fois sélectionné.
  const filtresVisibles = deplie
    ? tousLesFiltres
    : tousLesFiltres.filter((c, i) => i < LIMITE_FILTRES || c.id === categorie);

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

        <div className="flex flex-wrap items-center gap-2">
          {filtresVisibles.map((cat) => {
            const actif = cat.id === categorie;
            return (
              <button
                key={cat.id}
                onClick={() => setCategorie(cat.id)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  actif
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                }`}
              >
                {cat.id === "tout"
                  ? tCat("tout")
                  : locale === "ar"
                  ? cat.nomAr
                  : cat.nomFr}
              </button>
            );
          })}

          {/* Le bouton n'apparaît que s'il reste vraiment des rayons cachés. */}
          {tousLesFiltres.length > LIMITE_FILTRES && (
            <button
              type="button"
              onClick={() => setDeplie((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
            >
              {deplie ? t("voirMoins") : t("voirPlus")}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  deplie ? "rotate-180" : ""
                }`}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          )}
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
