"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
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
  // Menu des rayons supplémentaires.
  const [menuOuvert, setMenuOuvert] = useState(false);
  const refMenu = useRef<HTMLDivElement | null>(null);

  // Fermeture au clic en dehors et à la touche Échap.
  useEffect(() => {
    if (!menuOuvert) return;
    function clicExterieur(e: MouseEvent) {
      if (refMenu.current && !refMenu.current.contains(e.target as Node)) {
        setMenuOuvert(false);
      }
    }
    function toucheEchap(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOuvert(false);
    }
    document.addEventListener("mousedown", clicExterieur);
    document.addEventListener("keydown", toucheEchap);
    return () => {
      document.removeEventListener("mousedown", clicExterieur);
      document.removeEventListener("keydown", toucheEchap);
    };
  }, [menuOuvert]);

  const tousLesFiltres = useMemo(
    () => [{ id: "tout", nomFr: "", nomAr: "" }, ...categories],
    [categories]
  );
  // Les premiers rayons restent en pastilles ; le reste passe dans un menu.
  // Déplier en ligne faisait déborder les filtres sur deux ou trois rangées
  // et repoussait les produits hors de l'écran.
  const enPastilles = tousLesFiltres.slice(0, LIMITE_FILTRES);
  const dansMenu = tousLesFiltres.slice(LIMITE_FILTRES);
  // Si le rayon actif est dans le menu, le bouton porte son nom : sans ça,
  // le filtre en cours serait invisible une fois le menu refermé.
  const actifDansMenu = dansMenu.find((c) => c.id === categorie);

  const libelle = (c: { id: string; nomFr: string; nomAr: string }) =>
    c.id === "tout" ? tCat("tout") : locale === "ar" ? c.nomAr : c.nomFr;

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
          {enPastilles.map((cat) => {
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
                {libelle(cat)}
              </button>
            );
          })}

          {/* Menu des rayons restants — une seule pastille, quel que soit
              leur nombre : la rangée de filtres garde toujours sa hauteur. */}
          {dansMenu.length > 0 && (
            <div ref={refMenu} className="relative">
              <button
                type="button"
                onClick={() => setMenuOuvert((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOuvert}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                  actifDansMenu
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                }`}
              >
                {actifDansMenu
                  ? libelle(actifDansMenu)
                  : `${t("plusCategories")} (${dansMenu.length})`}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    menuOuvert ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>

              {menuOuvert && (
                <div
                  role="menu"
                  // end-0 : le menu se colle au bord « fin » du bouton —
                  // à droite en français, à gauche en arabe.
                  className="absolute end-0 top-full z-40 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1.5 shadow-lg"
                >
                  {dansMenu.map((cat) => {
                    const actif = cat.id === categorie;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setCategorie(cat.id);
                          setMenuOuvert(false);
                        }}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-start text-sm transition ${
                          actif
                            ? "font-medium text-gray-900"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="flex-1">{libelle(cat)}</span>
                        {actif && (
                          <Check
                            className="h-4 w-4 shrink-0"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
