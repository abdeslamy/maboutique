"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { useRecherche } from "@/context/RechercheContext";
import {
  AccueilOutline,
  AccueilFilled,
  PanierOutline,
  PanierFilled,
  ProfilOutline,
  ProfilFilled,
  LangueOutline,
  RechercheOutline,
  RechercheFilled,
  FiltreOutline,
} from "./IconesNav";

/**
 * Navigation mobile — Variante B, version 2.
 *
 * Deux éléments flottants, tous deux `position: fixed`, z-index 20 :
 *  - en haut à droite, deux cercles de 36 px (Langue, Filtres) ;
 *  - en bas, une tab bar de 210 × 38 px (Accueil, Panier, Recherche, Profil).
 *
 * Ce qui change par rapport à la version 1 : la recherche descend dans la tab
 * bar et les filtres prennent sa place en haut ; la tab bar passe de 3 à
 * 4 items, rétrécit et cesse d'occuper toute la largeur.
 *
 * Visible en dessous de 640 px uniquement (`sm:hidden`) ; au-delà, la barre
 * de navigation existante reprend la main.
 *
 * Les valeurs chiffrées viennent toutes du document de spécification et sont
 * écrites en dur (`h-[38px]`, `bottom-[26px]`…) plutôt que traduites dans
 * l'échelle Tailwind : arrondir au pas de 4 px casserait les alignements
 * optiques calculés dans le document.
 *
 * ⚠️ Zones tactiles. Le document descend les cercles à 36 px et les items à
 * 42 × 38, sous le minimum de 44 px, et propose lui-même de « corriger en
 * élargissant la zone de touche au-delà de la surface visible ». C'est ce que
 * fait `ZONE_TACTILE` : un pseudo-élément qui déborde le dessin sans le
 * modifier d'un pixel.
 */

/** Ombre unique, partagée par les deux éléments flottants. */
const OMBRE = "shadow-[0_8px_26px_rgba(17,17,17,0.16)]";

/**
 * Étend la cible tactile au-delà du dessin, via `::after`.
 *  - cercles de 36 px  → `-4px` de tous côtés = 44 × 44 ;
 *  - items de 42 × 38  → `-3px` de tous côtés = 48 × 44, et les 3 px latéraux
 *    consomment exactement la moitié du gap de 6 px : aucun recouvrement
 *    entre deux onglets voisins.
 */
const ZONE_TACTILE =
  "after:absolute after:content-[''] after:-inset-[4px]";
const ZONE_TACTILE_ONGLET =
  "after:absolute after:content-[''] after:-inset-[3px]";

/** Décalages de centrage optique — en px, calés sur des icônes de 28 px. */
const CALAGE = {
  accueil: "-translate-y-[0.25px]",
  panier: "-translate-y-[0.9px]",
  // La loupe porte son calage dans le viewBox, pas en CSS : voir IconesNav.
  recherche: "",
  profil: "-translate-y-[0.6px]",
} as const;

export default function NavigationMobile() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const { ouvert: rechercheOuverte, ouvrir: ouvrirRecherche } = useRecherche();

  // Un seul onglet actif à la fois. Les sous-pages comptent pour leur onglet
  // (une fiche produit garde « Accueil » actif, par exemple).
  const onglets = [
    {
      cle: "accueil",
      href: "/",
      actif: pathname === "/" || pathname.startsWith("/produits"),
      Outline: AccueilOutline,
      Filled: AccueilFilled,
      label: t("accueil"),
      calage: CALAGE.accueil,
    },
    {
      cle: "panier",
      href: "/panier",
      actif: pathname.startsWith("/panier") || pathname.startsWith("/commande"),
      Outline: PanierOutline,
      Filled: PanierFilled,
      label: t("panier"),
      calage: CALAGE.panier,
    },
    {
      // Seul onglet qui n'est pas un lien : il ouvre l'overlay de recherche.
      cle: "recherche",
      actif: rechercheOuverte,
      Outline: RechercheOutline,
      Filled: RechercheFilled,
      label: t("rechercher"),
      calage: CALAGE.recherche,
      action: ouvrirRecherche,
    },
    {
      cle: "profil",
      href: "/compte",
      actif:
        pathname.startsWith("/compte") || pathname.startsWith("/connexion"),
      Outline: ProfilOutline,
      Filled: ProfilFilled,
      label: t("compte"),
      calage: CALAGE.profil,
    },
  ] as const;

  return (
    <>
      {/* ═══ Boutons circulaires — barre haute ═══════════════════════
          top: 60px = 20px sous une status bar de 40px. La safe area iOS
          reprend le calcul à sa source : 20px + inset réel. */}
      <div
        className="fixed z-20 flex gap-[7px] sm:hidden"
        style={{
          top: "calc(20px + env(safe-area-inset-top))",
          insetInlineEnd: "max(20px, env(safe-area-inset-right))",
        }}
      >
        <BoutonLangue />
        <BoutonFiltres />
      </div>

      {/* ═══ Bottom tab bar ══════════════════════════════════════════
          210 px de large — largeur intrinsèque : 4 × 42 + 3 × 6 + 2 × 12.
          38 px de haut, pill parfait à 19. */}
      <nav
        aria-label={t("navigationPrincipale")}
        className="fixed inset-x-0 z-20 flex justify-center sm:hidden"
        style={{ bottom: "calc(26px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div
          role="tablist"
          className={`flex h-[38px] items-center gap-[6px] rounded-[19px] bg-white px-[12px] ${OMBRE}`}
        >
          {onglets.map((onglet) => {
            const { cle, actif, Outline, Filled, label, calage } = onglet;
            const contenu = (
              /* Les deux états sont superposés et croisent leur opacité :
                 aucun remplacement de nœud, donc aucun ressaut de layout. */
              <span className="relative block h-[28px] w-[28px]">
                <Outline
                  className={`absolute inset-0 h-full w-full transition-opacity duration-[180ms] ease-[ease] ${calage} ${
                    actif ? "opacity-0" : "opacity-100"
                  }`}
                />
                <Filled
                  className={`absolute inset-0 h-full w-full transition-opacity duration-[180ms] ease-[ease] ${calage} ${
                    actif ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
            );

            const classes = `relative flex h-[38px] w-[42px] items-center justify-center rounded-[19px] text-[#111111] ${ZONE_TACTILE_ONGLET} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]`;

            // L'onglet Recherche est un bouton : il ouvre un panneau, il ne
            // mène pas à une page. Le dire au navigateur évite d'annoncer un
            // lien qui ne navigue nulle part.
            if ("action" in onglet) {
              return (
                <button
                  key={cle}
                  type="button"
                  onClick={onglet.action}
                  role="tab"
                  aria-selected={actif}
                  aria-haspopup="dialog"
                  aria-expanded={actif}
                  aria-label={label}
                  className={classes}
                >
                  {contenu}
                </button>
              );
            }

            return (
              <Link
                key={cle}
                href={onglet.href}
                role="tab"
                aria-selected={actif}
                aria-controls="contenu-principal"
                aria-label={label}
                className={classes}
              >
                {contenu}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Bouton Filtres — cercle haut droit, à la place de l'ancienne loupe
// ────────────────────────────────────────────────────────────────────

function BoutonFiltres() {
  const t = useTranslations("navigation");

  return (
    <Link
      href="/produits"
      aria-label={t("filtres")}
      className={`relative flex h-[36px] w-[36px] items-center justify-center rounded-[18px] bg-white text-[#111111] transition-opacity duration-[120ms] ease-[ease] active:opacity-45 ${ZONE_TACTILE} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${OMBRE}`}
    >
      <FiltreOutline className="h-[28px] w-[28px]" />
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────
// Bouton Langue — ouvre le menu des langues disponibles
// ────────────────────────────────────────────────────────────────────

function BoutonLangue() {
  const t = useTranslations("navigation");
  const tLangue = useTranslations("langue");
  const router = useRouter();
  const pathname = usePathname();

  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    function clicExterieur(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    function toucheEchap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", clicExterieur);
    document.addEventListener("keydown", toucheEchap);
    return () => {
      document.removeEventListener("mousedown", clicExterieur);
      document.removeEventListener("keydown", toucheEchap);
    };
  }, [ouvert]);

  function choisir(langue: Locale) {
    setOuvert(false);
    router.replace(pathname, { locale: langue });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={t("langue")}
        // Pas de `scale` au pressed : sur un cercle porteur d'ombre, une
        // réduction d'échelle fait décoller l'ombre et trahit la superposition.
        className={`relative flex h-[36px] w-[36px] items-center justify-center rounded-[18px] bg-white text-[#111111] transition-opacity duration-[120ms] ease-[ease] active:opacity-45 ${ZONE_TACTILE} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${OMBRE}`}
      >
        <LangueOutline className="h-[29px] w-[29px]" />
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute end-0 top-full z-30 mt-2 min-w-36 overflow-hidden rounded-2xl bg-white py-1 shadow-[0_8px_26px_rgba(17,17,17,0.16)]"
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitem"
              onClick={() => choisir(l)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm text-[#111111] transition hover:bg-gray-50"
            >
              <span className="w-6 shrink-0 text-[11px] font-semibold uppercase text-gray-400">
                {l}
              </span>
              <span className="flex-1">{tLangue(l)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
