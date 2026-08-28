"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  FiltreOutline,
} from "./IconesNav";

/**
 * Navigation mobile — refonte Liquid Glass (iOS 26), option 3b.
 *
 * En bas, une rangée de deux conteneurs de verre, frères et alignés :
 *  - une capsule élastique (56 pt de haut) portant 3 onglets icône + label ;
 *  - un cercle de 56 pt, séparé, qui ouvre la recherche.
 * En haut à droite, deux cercles de 40 pt (Langue, Filtres), même matière.
 *
 * Ce qui change par rapport à la version précédente : la recherche sort de la
 * tab bar, les onglets gagnent un label, et le blanc opaque devient du verre.
 *
 * La matière elle-même vit dans `app/globals.css` (`.verre`) : les huit
 * couches qui la composent sont trop longues pour être répétées en classes
 * utilitaires, et elles doivent rester rigoureusement identiques sur les
 * quatre conteneurs.
 *
 * Visible en dessous de 640 px uniquement (`sm:hidden`).
 */

/**
 * Étend la cible tactile des cercles de 40 pt à 44 pt, sans toucher au dessin.
 *
 * Le pseudo-élément du verre étant déjà pris par le reflet spéculaire, la
 * zone est portée par `::before`.
 *
 * Dimensions explicites plutôt qu'un `inset` négatif : le verre porte une
 * bordure de 0,5 px, un élément absolu se cale sur la boîte de padding, et
 * `-inset-[2px]` donnait 43,2 px au lieu de 44. Mesuré, pas supposé.
 */
const ZONE_TACTILE =
  "before:absolute before:left-1/2 before:top-1/2 before:h-[44px] before:w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']";

/**
 * Décalages de centrage optique — **recalés pour des icônes de 25 pt**.
 *
 * Les valeurs de la version précédente (−0,25 / −0,9 / −0,6) étaient calées
 * sur 28 px. Elles sont ici multipliées par 25/28 ≈ 0,893, comme le prévoyait
 * la note du document : un décalage exprimé en pixels ne suit pas l'échelle
 * de l'icône, il faut le convertir à chaque changement de taille.
 */
const CALAGE = {
  accueil: "-translate-y-[0.22px]",
  panier: "-translate-y-[0.8px]",
  profil: "-translate-y-[0.54px]",
} as const;

export default function NavigationMobile() {
  const t = useTranslations("navigation");
  const locale = useLocale();
  const pathname = usePathname();
  const { ouvrir: ouvrirRecherche } = useRecherche();

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
      cle: "profil",
      href: "/compte",
      actif:
        pathname.startsWith("/compte") || pathname.startsWith("/connexion"),
      Outline: ProfilOutline,
      Filled: ProfilFilled,
      label: t("profil"),
      calage: CALAGE.profil,
    },
  ] as const;

  // Rang de l'onglet actif, ou -1 sur une page qui n'appartient à aucun
  // onglet (l'administration, par exemple) : la lentille s'efface alors.
  const indexActif = onglets.findIndex((o) => o.actif);

  // Sens de déplacement de la lentille. En arabe les onglets se lisent de
  // droite à gauche, donc passer au suivant veut dire reculer en X.
  const sens = locale === "ar" ? -1 : 1;

  return (
    <>
      {/* ═══ Cercles du haut — Langue et Filtres ══════════════════════
          Position inchangée depuis la version précédente : 20 px sous la
          safe area. Le document annonce « top: 60pt » mais précise
          « position inchangée » — on garde donc notre formule, qui reste
          juste sur un appareil sans encoche. */}
      <div
        className="fixed z-20 flex gap-[8px] sm:hidden"
        style={{
          top: "calc(20px + env(safe-area-inset-top))",
          insetInlineEnd: "max(20px, env(safe-area-inset-right))",
        }}
      >
        <BoutonLangue />
        <BoutonFiltres />
      </div>

      {/* ═══ Rangée basse ════════════════════════════════════════════
          Capsule élastique + cercle, 10 pt d'écart, 16 pt de marge de
          chaque côté, 34 pt du bas. Sur un écran de 390, la capsule occupe
          donc 390 − 32 − 10 − 56 = 292 pt. */}
      <div
        className="fixed z-20 flex items-center gap-[10px] sm:hidden"
        style={{
          insetInlineStart: "max(16px, env(safe-area-inset-left))",
          insetInlineEnd: "max(16px, env(safe-area-inset-right))",
          // 34 pt = hauteur du home indicator. `max()` plutôt qu'une addition :
          // sur un appareil qui déclare un inset plus grand, on le respecte ;
          // sur les autres, la marge vaut exactement les 34 pt du document.
          bottom: "max(34px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <nav
          aria-label={t("navigationPrincipale")}
          className="verre h-[56px] min-w-0 flex-1 rounded-[28px]"
        >
          <div role="tablist" className="relative flex h-full items-center px-[4px]">
            {/* Lentille de verre — UNE SEULE, qui GLISSE d'un onglet à l'autre.
                Le document la préfère à un fondu par onglet, et le passage sur
                « Reduce Motion » le confirme : il demande de supprimer le
                déplacement en gardant le fondu, donc les deux coexistent.

                Sa largeur vaut le tiers de l'espace intérieur, et elle se
                déplace de 100 % de cette largeur par onglet — aucune valeur en
                pixels codée en dur, la capsule peut donc changer de largeur
                sans casser l'alignement. Opacité 0 quand aucun onglet n'est
                actif : c'est le cas sur les pages d'administration. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 z-0 h-[44px] transition-[transform,opacity] duration-200 ease-[ease] motion-reduce:transition-[opacity]"
              style={{
                // Ancrage logique : bord gauche en français, bord droit en
                // arabe — la lentille part du même côté que le premier onglet.
                insetInlineStart: 4,
                width: "calc((100% - 8px) / 3)",
                // `translateX` reste PHYSIQUE, lui : il ne se retourne pas en
                // RTL. Sans ce signe, la lentille descendait vers la gauche
                // pendant que les onglets se lisaient vers la droite.
                transform: `translate(${Math.max(indexActif, 0) * 100 * sens}%, -50%)`,
                opacity: indexActif === -1 ? 0 : 1,
              }}
            >
              <span className="mx-auto block h-[44px] w-[60px] rounded-[22px] bg-[rgba(255,255,255,0.95)] shadow-[0_2px_6px_rgba(17,17,17,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]" />
            </span>

            {onglets.map(({ cle, href, actif, Outline, Filled, label, calage }) => (
              <Link
                key={cle}
                href={href}
                role="tab"
                aria-selected={actif}
                aria-controls="contenu-principal"
                className="relative flex h-[48px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-[22px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
              >
                {/* Les deux états sont superposés et croisent leur opacité :
                    aucun remplacement de nœud, donc aucun ressaut de layout. */}
                <span className="relative z-10 block h-[25px] w-[25px]">
                  <Outline
                    className={`absolute inset-0 h-full w-full text-[rgba(10,10,10,0.64)] transition-opacity duration-200 ease-[ease] ${calage} ${
                      actif ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <Filled
                    className={`absolute inset-0 h-full w-full text-[#0A0A0A] transition-opacity duration-200 ease-[ease] ${calage} ${
                      actif ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </span>

                <span
                  className="relative z-10 mt-[2px] whitespace-nowrap transition-colors duration-200"
                  style={{
                    fontSize: 10,
                    fontWeight: 590,
                    letterSpacing: "0.01em",
                    lineHeight: 1,
                    color: actif ? "#0A0A0A" : "rgba(10,10,10,0.64)",
                  }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Cercle de recherche — sorti de la tab bar. */}
        <button
          type="button"
          onClick={ouvrirRecherche}
          aria-label={t("rechercher")}
          aria-haspopup="dialog"
          className="verre grid h-[56px] w-[56px] flex-none place-items-center rounded-[28px] text-[#0A0A0A] transition-transform duration-[140ms] ease-[cubic-bezier(.2,.8,.2,1)] active:scale-[.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {/* trait 1,7 pt À L'ÉCRAN : le tracé vit dans un viewBox de 24 rendu
              à 25 px, l'épaisseur doit donc valoir 1,7 × 24/25. */}
          <RechercheOutline className="h-[25px] w-[25px]" trait={1.632} />
        </button>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Cercles du haut
// ────────────────────────────────────────────────────────────────────

/** Gabarit commun aux deux boutons de 40 pt. */
const CERCLE_HAUT = `verre verre--leger relative grid h-[40px] w-[40px] place-items-center rounded-[20px] text-[#0A0A0A] ${ZONE_TACTILE} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]`;

function BoutonFiltres() {
  const t = useTranslations("navigation");
  return (
    <Link href="/produits" aria-label={t("filtres")} className={CERCLE_HAUT}>
      <FiltreOutline className="h-[25px] w-[25px]" />
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
        className={CERCLE_HAUT}
      >
        <LangueOutline className="h-[25px] w-[25px]" />
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
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm text-[#0A0A0A] transition hover:bg-gray-50"
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
