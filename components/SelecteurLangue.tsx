"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Sélecteur de langue moderne — bouton compact :
 *   [🌐 FR]  ou  [🌐 AR]
 *
 * Comme on n'a que 2 langues, un simple TOGGLE est plus rapide qu'un menu
 * déroulant : un clic = on passe à l'autre langue.
 *
 * Pourquoi pas un <select> ? Il a des limites :
 *  - Style limité (rendu natif du navigateur, varie sur mobile)
 *  - Moins compact, moins moderne
 *  - On n'a que 2 options → un toggle suffit
 */
export default function SelecteurLangue({
  localeActive,
}: {
  localeActive: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("langue");

  // Trouve "l'autre" langue (celle vers laquelle on bascule).
  const autreLangue = routing.locales.find((l) => l !== localeActive) as Locale;

  function basculer() {
    router.replace(pathname, { locale: autreLangue });
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:text-black"
      aria-label={t("basculerVers", { langue: t(autreLangue) })}
      title={t("basculerVers", { langue: t(autreLangue) })}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="uppercase">{localeActive}</span>
    </button>
  );
}
