"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Avatar from "@/components/Avatar";

/**
 * Navigation de l'espace admin — deux formats, un seul langage visuel.
 *
 *  MOBILE  : barre fine avec bouton menu → ouvre un TIROIR par-dessus le
 *            contenu, avec voile assombri (logique du menu Upwork).
 *            Lignes hautes, séparateurs en retrait, chevrons.
 *  DESKTOP : sidebar permanente et rétractable, même typographie et mêmes
 *            icônes mais densité resserrée + pastille d'état actif
 *            (une navigation permanente doit montrer où l'on se trouve,
 *             contrairement à un menu qu'on ouvre puis referme).
 *
 * usePathname vient de @/i18n/navigation : il renvoie le chemin SANS le
 * préfixe de langue ("/admin/produits"), donc la détection marche en FR
 * comme en AR.
 *
 * Entrée active :
 *  - Dashboard = correspondance EXACTE, sinon elle resterait toujours allumée
 *  - Les autres = par PRÉFIXE, pour que les sous-pages
 *    (/admin/produits/nouveau, /admin/commandes/[id]) gardent leur entrée active
 *
 * L'état réduit du desktop est persisté dans un COOKIE (pas localStorage) pour
 * que le serveur le connaisse dès le premier rendu → aucun saut à l'hydratation.
 */

const ENTREES = [
  { cle: "dashboard", href: "/admin", Icon: LayoutDashboard },
  { cle: "produits", href: "/admin/produits", Icon: Package },
  { cle: "commandes", href: "/admin/commandes", Icon: ShoppingBag },
  { cle: "configuration", href: "/admin/configuration", Icon: Settings },
] as const;

function estActif(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function SidebarAdmin({
  reduitInitial,
  nom,
  image,
}: {
  reduitInitial: boolean;
  nom: string;
  image?: string;
}) {
  const tNav = useTranslations("admin.onglets");
  const pathname = usePathname();

  const [reduit, setReduit] = useState(reduitInitial);
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  // Le tiroir se referme dès qu'on navigue.
  useEffect(() => {
    setTiroirOuvert(false);
  }, [pathname]);

  // Tiroir ouvert : Échap ferme, et le fond ne défile plus.
  useEffect(() => {
    if (!tiroirOuvert) return;
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setTiroirOuvert(false);
    }
    document.addEventListener("keydown", surTouche);
    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = overflowInitial;
    };
  }, [tiroirOuvert]);

  function basculerReduit() {
    const suivant = !reduit;
    setReduit(suivant);
    // 1 an. Relu par le layout serveur au prochain chargement.
    document.cookie = `admin_sidebar=${
      suivant ? "reduite" : "ouverte"
    }; path=/; max-age=31536000; samesite=lax`;
  }

  const sectionCourante = ENTREES.find((e) => estActif(e.href, pathname));

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          MOBILE — barre fine (le tiroir s'ouvre par-dessus)
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 sm:hidden">
        <button
          type="button"
          onClick={() => setTiroirOuvert(true)}
          aria-label={tNav("menu")}
          aria-expanded={tiroirOuvert}
          className="-ms-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span className="truncate text-[15px] font-semibold text-gray-900">
          {sectionCourante ? tNav(sectionCourante.cle) : tNav("menu")}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE — tiroir + voile
          Toujours monté (jamais démonté) : c'est ce qui permet d'animer
          l'ouverture ET la fermeture avec de simples transitions CSS.
         ══════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-[60] sm:hidden ${
          tiroirOuvert ? "" : "pointer-events-none"
        }`}
        aria-hidden={!tiroirOuvert}
      >
        {/* Voile assombri — un clic ferme */}
        <button
          type="button"
          tabIndex={tiroirOuvert ? 0 : -1}
          aria-label={tNav("fermer")}
          onClick={() => setTiroirOuvert(false)}
          className={`absolute inset-0 h-full w-full cursor-default bg-gray-900/40 transition-opacity duration-200 ${
            tiroirOuvert ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panneau — glisse depuis le "start" (gauche en FR, droite en AR) */}
        <aside
          className={`absolute inset-y-0 start-0 flex w-[86%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            tiroirOuvert
              ? "translate-x-0"
              : "-translate-x-full rtl:translate-x-full"
          }`}
        >
          {/* En-tête : identité + fermeture */}
          <div className="flex items-center gap-3 px-5 py-5">
            <Avatar nom={nom} image={image} taille="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-semibold leading-tight text-gray-900">
                {nom}
              </p>
              <p className="truncate text-[15px] leading-tight text-gray-500">
                {tNav("role")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTiroirOuvert(false)}
              aria-label={tNav("fermer")}
              tabIndex={tiroirOuvert ? 0 : -1}
              className="-me-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          {/* Filet pleine largeur sous l'identité (comme la référence) */}
          <div className="h-px bg-gray-100" />

          {/* Entrées — lignes hautes, séparateurs EN RETRAIT sous le texte */}
          <nav aria-label={tNav("aria")} className="flex-1 overflow-y-auto">
            <ul>
              {ENTREES.map(({ cle, href, Icon }, i) => {
                const actif = estActif(href, pathname);
                return (
                  <li key={cle}>
                    <Link
                      href={href}
                      aria-current={actif ? "page" : undefined}
                      tabIndex={tiroirOuvert ? 0 : -1}
                      className="flex items-center gap-5 px-5 py-4 transition-colors active:bg-gray-50"
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${
                          actif ? "text-gray-900" : "text-gray-700"
                        }`}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span
                        className={`flex-1 text-[17px] ${
                          actif
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-800"
                        }`}
                      >
                        {tNav(cle)}
                      </span>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-gray-300 rtl:-scale-x-100"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </Link>
                    {/* Retrait de 60px = 20 (padding) + 20 (icône) + 20 (gap),
                        pour que le filet démarre pile sous le libellé. */}
                    {i < ENTREES.length - 1 && (
                      <div className="ms-[60px] h-px bg-gray-100" />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Pied : sortie vers la boutique */}
          <div className="border-t border-gray-100 px-5 py-5">
            <Link
              href="/"
              tabIndex={tiroirOuvert ? 0 : -1}
              className="flex items-center justify-center gap-2 text-[15px] font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              <Store className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {tNav("voirBoutique")}
            </Link>
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP — sidebar permanente, rétractable
         ══════════════════════════════════════════════════════════════ */}
      <aside
        // top-16 = hauteur de la navbar du site (elle est sticky).
        className={`sticky top-16 z-30 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-e border-gray-100 bg-white transition-[width] duration-200 ease-out sm:flex ${
          reduit ? "w-[68px]" : "w-64"
        }`}
      >
        {/* En-tête : identité + bascule.
            La bascule vit EN HAUT et reste visible dans les deux états.
            Réduite, la sidebar n'affiche plus que ce bouton : le contrôle de
            navigation prime sur l'identité, qui reste lisible dans la navbar. */}
        <div
          className={`flex items-center gap-3 px-3 py-3 ${
            reduit ? "justify-center" : ""
          }`}
        >
          {!reduit && (
            <>
              <Avatar nom={nom} image={image} taille="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-gray-900">
                  {nom}
                </p>
                <p className="truncate text-xs leading-tight text-gray-500">
                  {tNav("role")}
                </p>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={basculerReduit}
            aria-label={reduit ? tNav("ouvrir") : tNav("reduire")}
            title={reduit ? tNav("ouvrir") : tNav("reduire")}
            aria-expanded={!reduit}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20"
          >
            {/* Trait fin (1.5) et flèche orientée : l'icône dit ce que le clic
                va faire. Miroir en RTL, où le menu passe à droite. */}
            {reduit ? (
              <PanelLeftOpen
                className="h-[18px] w-[18px] rtl:-scale-x-100"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            ) : (
              <PanelLeftClose
                className="h-[18px] w-[18px] rtl:-scale-x-100"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        <div className="mx-3 h-px bg-gray-100" />

        {/* Entrées */}
        <nav aria-label={tNav("aria")} className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {ENTREES.map(({ cle, href, Icon }) => {
              const actif = estActif(href, pathname);
              const label = tNav(cle);
              return (
                <li key={cle}>
                  <Link
                    href={href}
                    aria-current={actif ? "page" : undefined}
                    // Infobulle native : indispensable quand seul l'icône est visible.
                    title={reduit ? label : undefined}
                    className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                      reduit ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                    } ${
                      actif
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        actif ? "text-gray-900" : "text-gray-500"
                      }`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    {!reduit && <span className="truncate">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </aside>
    </>
  );
}
