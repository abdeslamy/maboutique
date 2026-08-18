"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Menu latéral de l'espace admin.
 *
 * Navigation : chaque entrée est un VRAI lien vers une route (pas un state).
 * Les URLs restent partageables, le bouton retour du navigateur fonctionne,
 * et chaque page reste rendue côté serveur.
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
 * État réduit :
 *  - persisté dans un COOKIE (pas localStorage) pour que le serveur connaisse
 *    l'état dès le premier rendu → aucun "saut" visuel à l'hydratation
 *  - sur mobile la sidebar reste toujours en rail d'icônes : l'ouvrir mangerait
 *    l'écran. Le bouton de bascule n'apparaît donc qu'à partir de `sm`.
 *
 * Parti pris visuel : aucune bordure interne (pas de header/footer encadrés),
 * la hiérarchie passe uniquement par l'espacement et les aplats de couleur.
 */

const ENTREES = [
  { cle: "dashboard", href: "/admin", Icon: LayoutDashboard },
  { cle: "produits", href: "/admin/produits", Icon: Package },
  { cle: "commandes", href: "/admin/commandes", Icon: ShoppingBag },
  { cle: "configuration", href: "/admin/configuration", Icon: Settings },
] as const;

export default function SidebarAdmin({
  reduitInitial,
}: {
  reduitInitial: boolean;
}) {
  const t = useTranslations("admin");
  const tNav = useTranslations("admin.onglets");
  const pathname = usePathname();
  const [reduit, setReduit] = useState(reduitInitial);

  function basculer() {
    const suivant = !reduit;
    setReduit(suivant);
    // 1 an. Relu par le layout serveur au prochain chargement.
    document.cookie = `admin_sidebar=${
      suivant ? "reduite" : "ouverte"
    }; path=/; max-age=31536000; samesite=lax`;
  }

  // Le libellé est masqué quand la sidebar est réduite, et toujours sur mobile.
  const classeLabel = reduit ? "hidden" : "hidden truncate sm:inline";
  // Alignement partagé par les entrées et le bouton de bascule.
  const alignement = reduit
    ? "justify-center"
    : "justify-center sm:justify-start";

  return (
    <aside
      // top-14/sm:top-16 = hauteur de la navbar du site (elle est sticky).
      // stone plutôt que gray : neutre CHAUD, moins "interface système" que le
      // gris bleuté. Le filet de séparation remplace les bordures internes.
      className={`sticky top-14 z-30 flex h-[calc(100vh-3.5rem)] shrink-0 flex-col border-e border-gray-200/60 bg-stone-50 transition-[width] duration-200 ease-out sm:top-16 sm:h-[calc(100vh-4rem)] ${
        reduit ? "w-[60px]" : "w-[60px] sm:w-60"
      }`}
    >
      {/* ─── Marque ──────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2.5 px-3 pb-1 pt-4 ${alignement}`}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white">
          <Store className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span
          className={`${classeLabel} text-[13px] font-medium text-stone-900`}
        >
          {t("badge")}
        </span>
      </div>

      {/* ─── Navigation ──────────────────────────────────────────────── */}
      <nav aria-label={tNav("aria")} className="flex-1 overflow-y-auto p-2 pt-3">
        <ul className="flex flex-col gap-0.5">
          {ENTREES.map(({ cle, href, Icon }) => {
            const actif =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            const label = tNav(cle);

            return (
              <li key={cle}>
                <Link
                  href={href}
                  aria-current={actif ? "page" : undefined}
                  // Infobulle native : indispensable quand seul l'icône est visible.
                  title={label}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${alignement} ${
                    actif
                      ? "bg-stone-200 font-medium text-stone-900"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      actif ? "text-stone-900" : "text-stone-500"
                    }`}
                    aria-hidden="true"
                  />
                  <span className={classeLabel}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ─── Bascule réduire / ouvrir (desktop uniquement) ───────────── */}
      <div className={`hidden shrink-0 p-2 pb-3 sm:flex ${alignement}`}>
        <button
          type="button"
          onClick={basculer}
          aria-label={reduit ? tNav("ouvrir") : tNav("reduire")}
          title={reduit ? tNav("ouvrir") : tNav("reduire")}
          aria-expanded={!reduit}
          className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
        >
          {/* Icônes miroir en RTL : le menu passe à droite en arabe. */}
          {reduit ? (
            <PanelLeftOpen className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}
