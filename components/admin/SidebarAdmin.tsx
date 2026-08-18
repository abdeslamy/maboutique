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
 * Onglet actif :
 *  - Dashboard = correspondance EXACTE, sinon il resterait toujours allumé
 *  - Les autres = par PRÉFIXE, pour que les sous-pages
 *    (/admin/produits/nouveau, /admin/commandes/[id]) gardent leur entrée active
 *
 * État réduit :
 *  - persisté dans un COOKIE (pas localStorage) pour que le serveur connaisse
 *    l'état dès le premier rendu → aucun "saut" visuel à l'hydratation
 *  - sur mobile la sidebar reste toujours en rail d'icônes : l'ouvrir mangerait
 *    l'écran. Le bouton de bascule n'apparaît donc qu'à partir de `sm`.
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

  // Le label est masqué quand la sidebar est réduite, et toujours sur mobile.
  const classeLabel = reduit ? "hidden" : "hidden truncate sm:inline";

  return (
    <aside
      // top-14/sm:top-16 = hauteur de la navbar du site (elle est sticky).
      className={`sticky top-14 z-30 flex h-[calc(100vh-3.5rem)] shrink-0 flex-col border-e border-gray-200 bg-gray-50 transition-[width] duration-200 ease-out sm:top-16 sm:h-[calc(100vh-4rem)] ${
        reduit ? "w-16" : "w-16 sm:w-56"
      }`}
    >
      {/* ─── En-tête ─────────────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center justify-center gap-2 border-b border-gray-200 px-3 sm:justify-start">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
          <Store className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className={`${classeLabel} text-sm font-medium text-gray-900`}>
          {t("badge")}
        </span>
      </div>

      {/* ─── Navigation ──────────────────────────────────────────────── */}
      <nav aria-label={tNav("aria")} className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    reduit ? "justify-center" : "justify-center sm:justify-start"
                  } ${
                    actif
                      ? "bg-white font-medium text-gray-900 ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className={classeLabel}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ─── Bouton réduire / ouvrir (desktop uniquement) ────────────── */}
      <div className="hidden shrink-0 border-t border-gray-200 p-2 sm:block">
        <button
          type="button"
          onClick={basculer}
          aria-label={reduit ? tNav("ouvrir") : tNav("reduire")}
          title={reduit ? tNav("ouvrir") : tNav("reduire")}
          aria-expanded={!reduit}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-white/70 hover:text-gray-900 ${
            reduit ? "justify-center" : "justify-start"
          }`}
        >
          {/* Les icônes sont miroir en RTL : le menu est à droite en arabe. */}
          {reduit ? (
            <PanelLeftOpen
              className="h-4 w-4 shrink-0 rtl:-scale-x-100"
              aria-hidden="true"
            />
          ) : (
            <PanelLeftClose
              className="h-4 w-4 shrink-0 rtl:-scale-x-100"
              aria-hidden="true"
            />
          )}
          <span className={classeLabel}>{tNav("reduire")}</span>
        </button>
      </div>
    </aside>
  );
}
