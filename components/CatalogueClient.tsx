"use client";

import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import { contient } from "@/lib/recherche";
import type { Categorie, ProduitResume } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

/**
 * Nombre de pastilles au tout premier rendu (« Tout » compris).
 * Ce n'est plus une limite : juste la valeur affichée avant que la mesure
 * réelle ait eu lieu (HTML du serveur, où aucune largeur n'existe encore).
 */
const PASTILLES_AU_DEPART = 4;

/** Écart entre deux pastilles — doit rester synchronisé avec `gap-2`. */
const ECART = 8;

/** Classes partagées par les pastilles réelles ET par leurs clones de mesure. */
const PASTILLE =
  "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm";

/**
 * `useLayoutEffect` mesure avant que le navigateur ne peigne : indispensable
 * ici, sinon on verrait les pastilles de départ apparaître puis se
 * réorganiser. Mais il n'existe pas côté serveur — d'où ce repli.
 */
const useEffetDeMise =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

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
  produits,
}: {
  /** Rayons de la boutique, lus en base par la page parente. */
  categories: { id: string; nomFr: string; nomAr: string }[];
  /** Produits, lus par la page parente — plus par un contexte global. */
  produits: ProduitResume[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalogue");
  const tCat = useTranslations("categories");

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

  const libelle = useCallback(
    (c: { id: string; nomFr: string; nomAr: string }) =>
      c.id === "tout" ? tCat("tout") : locale === "ar" ? c.nomAr : c.nomFr,
    [tCat, locale]
  );

  // ── Combien de pastilles tiennent sur UNE ligne ? ──────────────────
  // La réponse dépend de la largeur de l'écran ET de la longueur des noms
  // (« Maison & déco » n'occupe pas la place de « Mode », et l'arabe est
  // encore différent). Aucune valeur fixe ne peut convenir : on mesure.
  const [nbVisibles, setNbVisibles] = useState(PASTILLES_AU_DEPART);
  const refRangee = useRef<HTMLDivElement | null>(null);
  const refMesure = useRef<HTMLDivElement | null>(null);

  useEffetDeMise(() => {
    const rangee = refRangee.current;
    const mesure = refMesure.current;
    if (!rangee || !mesure) return;

    function recalculer() {
      // La rangée fantôme contient toutes les pastilles PUIS le bouton
      // « Plus » : on lit leurs largeurs naturelles, jamais compressées.
      const largeurs = Array.from(mesure!.children).map(
        (el) => (el as HTMLElement).offsetWidth
      );
      const largeurPlus = largeurs.pop() ?? 0;
      // −1 px de marge : un arrondi sub-pixel suffirait à faire déborder.
      const dispo = rangee!.clientWidth - 1;

      const total =
        largeurs.reduce((s, l) => s + l, 0) + ECART * (largeurs.length - 1);
      // Tout rentre : pas besoin du bouton « Plus » du tout.
      if (total <= dispo) {
        setNbVisibles(largeurs.length);
        return;
      }

      // Sinon on empile tant qu'il reste la place de poser « Plus » à la fin.
      let cumul = 0;
      let n = 0;
      for (let i = 0; i < largeurs.length; i++) {
        const ajout = largeurs[i] + (i > 0 ? ECART : 0);
        if (cumul + ajout + ECART + largeurPlus > dispo) break;
        cumul += ajout;
        n = i + 1;
      }
      // Au minimum « Tout » reste visible, même sur un écran très étroit.
      setNbVisibles(Math.max(1, n));
    }

    recalculer();
    // Rotation d'écran, ouverture d'un panneau, zoom… : on re-mesure.
    const observateur = new ResizeObserver(recalculer);
    observateur.observe(rangee);
    return () => observateur.disconnect();
  }, [tousLesFiltres, libelle, categorie]);

  const enPastilles = tousLesFiltres.slice(0, nbVisibles);
  const dansMenu = tousLesFiltres.slice(nbVisibles);
  // Si le rayon actif est dans le menu, le bouton porte son nom : sans ça,
  // le filtre en cours serait invisible une fois le menu refermé.
  const actifDansMenu = dansMenu.find((c) => c.id === categorie);
  const libellePlus = actifDansMenu
    ? libelle(actifDansMenu)
    : `${t("plusCategories")} (${dansMenu.length})`;

  // Liste filtrée : on la recalcule seulement quand recherche, categorie, locale
  // ou la liste de produits changent.
  const produitsFiltres = useMemo(() => {
    const requete = recherche.trim();
    return produits.filter((p) => {
      // Filtre par catégorie
      if (categorie !== "tout" && p.categorie !== categorie) return false;
      // Filtre par texte : nom traduit ET nom du rayon, insensible aux
      // accents. Même règle que l'overlay de recherche — sans quoi celui-ci
      // annoncerait « 5 résultats » et le catalogue n'en montrerait aucun.
      if (requete) {
        const rayon = categories.find((c) => c.id === p.categorie);
        const cible = `${p.nom[locale]} ${
          rayon ? (locale === "ar" ? rayon.nomAr : rayon.nomFr) : ""
        }`;
        if (!contient(cible, requete)) return false;
      }
      return true;
    });
  }, [recherche, categorie, locale, produits, categories]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      {/* Titre */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t("titre")}</h1>
        <p className="text-gray-600">{t("sousTitre")}</p>
      </header>

      {/* Barre de recherche + filtres catégories.
          Le champ a une largeur FIXE au-delà de sm et ne se comprime pas ;
          la rangée de filtres prend tout le reste (`flex-1`). Sans cela, les
          deux se disputaient l'espace et la rangée se retrouvait plus étroite
          que son contenu — c'est ce qui la faisait passer sur deux lignes
          sur tablette. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("placeholderRecherche")}
          // Largeur fixe et non compressible dès sm, un cran plus large sur
          // grand écran : la rangée de filtres récupère tout le reste.
          className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-black focus:outline-none sm:w-72 sm:shrink-0 lg:w-96"
          aria-label={t("placeholderRecherche")}
        />

        {/* Conteneur de référence : c'est SA largeur qu'on mesure, et c'est
            à SES bords que le menu déroulant s'accroche — et non au bouton,
            qui peut se trouver n'importe où sur la ligne et faire sortir le
            menu de l'écran sur mobile. */}
        <div ref={refMenu} className="relative min-w-0 flex-1">
          <div
            ref={refRangee}
            className="flex flex-nowrap items-center gap-2 sm:justify-end"
          >
            {enPastilles.map((cat) => {
              const actif = cat.id === categorie;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategorie(cat.id)}
                  className={`${PASTILLE} transition ${
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
                leur nombre : la rangée garde toujours sa hauteur. */}
            {dansMenu.length > 0 && (
              <button
                type="button"
                onClick={() => setMenuOuvert((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOuvert}
                className={`inline-flex items-center gap-1.5 ${PASTILLE} transition ${
                  actifDansMenu
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                }`}
              >
                {libellePlus}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    menuOuvert ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {/* Rangée fantôme : toutes les pastilles à leur largeur naturelle.
              `w-max` empêche la compression ; le parent `overflow-hidden`,
              calé sur la rangée réelle, empêche tout débordement de page.
              Invisible et hors du flux — elle ne sert qu'à mesurer. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-0"
          >
            <div ref={refMesure} className="flex w-max items-center gap-2">
              {tousLesFiltres.map((cat) => (
                <span key={cat.id} className={`${PASTILLE} border-black`}>
                  {libelle(cat)}
                </span>
              ))}
              <span
                className={`inline-flex items-center gap-1.5 ${PASTILLE} border-black`}
              >
                {libellePlus}
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </div>
          </div>

          {menuOuvert && dansMenu.length > 0 && (
            <div
              role="menu"
              // Mobile : accroché au bord « début » du conteneur, qui occupe
              // toute la largeur utile — le menu ne peut donc plus sortir de
              // l'écran. Desktop : accroché au bord « fin », sous le bouton.
              className="absolute start-0 top-full z-40 mt-2 max-h-72 w-[min(14rem,100%)] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1.5 shadow-lg sm:start-auto sm:end-0 sm:w-56"
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
