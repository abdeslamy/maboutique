import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import SelecteurLangue from "./SelecteurLangue";
import PanierCompteur from "./PanierCompteur";
import MenuCompte from "./MenuCompte";

// Barre de navigation principale, affichée sur toutes les pages.
// Composant SERVEUR (pas de "use client") : il ne fait que de l'affichage,
// pas d'interactivité. Le seul élément interactif (SelecteurLangue) est lui
// un composant client, qu'on intègre ici sans souci.
export default async function Navbar({ locale }: { locale: Locale }) {
  const t = await getTranslations("navigation");
  const tMeta = await getTranslations("meta");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-6 sm:px-4">
        {/* ── Logo (côté "start"). whitespace-nowrap = pas de retour à la ligne ── */}
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-base font-semibold tracking-tight text-black sm:text-lg"
        >
          {tMeta("titreSite")}
        </Link>

        {/* ── Liens de navigation (centre, cachés sur petit écran) ──── */}
        <ul className="hidden items-center gap-6 text-sm text-gray-700 sm:flex">
          <li>
            <Link href="/" className="hover:text-black">
              {t("accueil")}
            </Link>
          </li>
          <li>
            <Link href="/produits" className="hover:text-black">
              {t("produits")}
            </Link>
          </li>
        </ul>

        {/* ── Zone "end" : panier, connexion, langue ───────────────── */}
        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-3">
          {/* Panier */}
          <Link
            href="/panier"
            className="rounded-md px-1.5 py-1 text-gray-700 hover:bg-gray-100 hover:text-black sm:px-2"
            aria-label={t("panier")}
          >
            <span className="inline-flex items-center gap-1">
              <CartIcon />
              <PanierCompteur />
            </span>
          </Link>

          {/* Bloc utilisateur : "Se connecter" OU avatar+menu déroulant */}
          <MenuCompte />

          {/* Sélecteur de langue (composant client) */}
          <SelecteurLangue localeActive={locale} />
        </div>
      </nav>
    </header>
  );
}

// Icône SVG simple d'un panier. Pas de bibliothèque d'icônes — on garde léger.
function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 3h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  );
}
