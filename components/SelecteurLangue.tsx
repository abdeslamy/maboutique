"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Sélecteur de langue — pastille compacte affichant le code actif (FR / AR),
 * qui ouvre un petit menu ancré juste dessous.
 *
 * Pourquoi un menu plutôt qu'une bascule directe :
 * l'ancienne version changeait de langue AU CLIC, sans prévenir. Un clic par
 * curiosité (ou par erreur) rechargeait toute la page dans une autre langue,
 * sans moyen d'annuler avant. Le menu rend le choix explicite et réversible :
 * un clic à côté et il ne s'est rien passé.
 *
 * Volontairement un menu léger, pas un panneau plein écran : le choix est
 * trop simple pour justifier d'interrompre la navigation.
 */
export default function SelecteurLangue({
  localeActive,
}: {
  localeActive: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("langue");

  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Fermeture au clic en dehors et à la touche Échap.
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
    if (langue === localeActive) return;
    // replace : changer de langue ne doit pas empiler une entrée dans
    // l'historique, sinon « retour » ramène à la langue précédente.
    router.replace(pathname, { locale: langue });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={t("actuelle", { langue: t(localeActive) })}
        title={t("actuelle", { langue: t(localeActive) })}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold uppercase transition ${
          ouvert
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-black"
        }`}
      >
        {localeActive}
      </button>

      {ouvert && (
        <div
          role="menu"
          // end-0 : le menu se colle au bord "fin" du bouton — à droite en
          // français, à gauche en arabe, sans une ligne de JavaScript.
          className="absolute end-0 top-full z-50 mt-2 min-w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {routing.locales.map((l) => {
            const actif = l === localeActive;
            return (
              <button
                key={l}
                type="button"
                role="menuitem"
                onClick={() => choisir(l)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition ${
                  actif
                    ? "font-medium text-gray-900"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="w-6 shrink-0 text-[11px] font-semibold uppercase text-gray-400">
                  {l}
                </span>
                <span className="flex-1 text-start">{t(l)}</span>
                {actif && (
                  <Check
                    className="h-4 w-4 shrink-0 text-gray-900"
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
  );
}
