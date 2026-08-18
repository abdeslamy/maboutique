"use client";

import { LayoutDashboard, Package, ShoppingBag, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Barre d'onglets de l'espace admin.
 *
 * Chaque onglet est un VRAI lien vers une route (pas un state React) :
 *  - les URLs restent partageables et rechargeables (/admin/produits)
 *  - le bouton retour du navigateur fonctionne
 *  - chaque page reste rendue côté serveur
 *
 * usePathname vient de @/i18n/navigation : il renvoie le chemin SANS le
 * préfixe de langue ("/admin/produits" et non "/fr/admin/produits"), donc
 * la détection de l'onglet actif marche en FR comme en AR.
 *
 * Onglet actif :
 *  - Dashboard = correspondance EXACTE ("/admin"), sinon il serait toujours actif
 *  - Les autres = correspondance par PRÉFIXE, pour que les sous-pages
 *    (/admin/produits/nouveau, /admin/commandes/[id]) gardent leur onglet allumé
 */

const ONGLETS = [
  { cle: "dashboard", href: "/admin", Icon: LayoutDashboard },
  { cle: "produits", href: "/admin/produits", Icon: Package },
  { cle: "commandes", href: "/admin/commandes", Icon: ShoppingBag },
  { cle: "configuration", href: "/admin/configuration", Icon: Settings },
] as const;

export default function OngletsAdmin() {
  const t = useTranslations("admin.onglets");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("aria")}
      // -mb-px fait chevaucher la bordure des onglets avec celle du conteneur,
      // pour que le trait de l'onglet actif "remplace" la ligne de séparation.
      className="-mb-px flex gap-6 overflow-x-auto"
    >
      {ONGLETS.map(({ cle, href, Icon }) => {
        const actif =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={cle}
            href={href}
            aria-current={actif ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-3 pt-1 text-sm transition ${
              actif
                ? "border-gray-900 font-medium text-gray-900"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t(cle)}
          </Link>
        );
      })}
    </nav>
  );
}
