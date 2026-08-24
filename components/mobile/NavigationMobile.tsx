"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import {
  AccueilOutline,
  AccueilFilled,
  PanierOutline,
  PanierFilled,
  ProfilOutline,
  ProfilFilled,
  LangueOutline,
  RechercheOutline,
} from "./IconesNav";

/**
 * Navigation mobile — Variante B.
 *
 * Deux éléments flottants, tous deux `position: fixed`, z-index 20 :
 *  - en haut à droite, deux cercles de 44 px (Langue, Recherche) ;
 *  - en bas, un pill de 238 × 53 px (Accueil, Panier, Profil).
 *
 * Le filtre n'est PAS ici : il vit dans le contenu de page (voir la note
 * dans le résumé — la spécification le laisse à concevoir, et notre catalogue
 * possède déjà ses propres filtres en page).
 *
 * Visible en dessous de 640 px uniquement (`sm:hidden`) ; au-delà, la barre
 * de navigation existante reprend la main.
 *
 * Les valeurs chiffrées viennent toutes du document de spécification et sont
 * écrites en dur (`h-[44px]`, `bottom-[26px]`…) plutôt que traduites dans
 * l'échelle Tailwind : arrondir au pas de 4 px casserait les alignements
 * optiques calculés dans le document.
 */

/** Ombre unique, partagée par les trois éléments flottants. */
const OMBRE = "shadow-[0_8px_26px_rgba(17,17,17,0.16)]";

export default function NavigationMobile() {
  const t = useTranslations("navigation");
  const pathname = usePathname();

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
    },
    {
      cle: "panier",
      href: "/panier",
      actif: pathname.startsWith("/panier") || pathname.startsWith("/commande"),
      Outline: PanierOutline,
      Filled: PanierFilled,
      label: t("panier"),
    },
    {
      cle: "profil",
      href: "/compte",
      actif:
        pathname.startsWith("/compte") || pathname.startsWith("/connexion"),
      Outline: ProfilOutline,
      Filled: ProfilFilled,
      label: t("compte"),
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
        {/* La loupe mène au catalogue, où vit la recherche. */}
        <Link
          href="/produits"
          aria-label={t("rechercher")}
          className={`flex h-[44px] w-[44px] items-center justify-center rounded-[22px] bg-white text-[#111111] transition-opacity duration-[120ms] ease-[ease] active:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${OMBRE}`}
        >
          <RechercheOutline className="h-[30px] w-[30px]" />
        </Link>
      </div>

      {/* ═══ Bottom tab bar ══════════════════════════════════════════
          238 px de large (61 % de 390), 53 px de haut, pill parfait à 26,5.
          Grille de 3 colonnes égales sans gap : toute la colonne est la zone
          tactile (79,33 × 53 px), bien au-delà des 44 px requis en largeur. */}
      <nav
        aria-label={t("navigationPrincipale")}
        className="fixed inset-x-0 z-20 flex justify-center sm:hidden"
        style={{ bottom: "calc(26px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div
          role="tablist"
          className={`grid h-[53px] w-[238px] grid-cols-3 rounded-[26.5px] bg-white ${OMBRE}`}
        >
          {onglets.map(({ cle, href, actif, Outline, Filled, label }) => (
            <Link
              key={cle}
              href={href}
              role="tab"
              aria-selected={actif}
              aria-controls="contenu-principal"
              aria-label={label}
              className="flex items-center justify-center rounded-[26.5px] text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
            >
              {/* Les deux états sont superposés et croisent leur opacité :
                  aucun remplacement de nœud, donc aucun ressaut de layout. */}
              <span className="relative block h-[30px] w-[30px]">
                <Outline
                  className={`absolute inset-0 h-full w-full transition-opacity duration-[180ms] ease-[ease] ${
                    actif ? "opacity-0" : "opacity-100"
                  }`}
                />
                <Filled
                  className={`absolute inset-0 h-full w-full transition-opacity duration-[180ms] ease-[ease] ${
                    actif ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
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
        className={`flex h-[44px] w-[44px] items-center justify-center rounded-[22px] bg-white text-[#111111] transition-opacity duration-[120ms] ease-[ease] active:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${OMBRE}`}
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
