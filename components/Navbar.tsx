import { ShoppingCart } from "lucide-react";
import { Newsreader } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import SelecteurLangue from "./SelecteurLangue";
import PanierCompteur from "./PanierCompteur";
import MenuCompte from "./MenuCompte";
import BoutonRechercheNavbar from "./BoutonRechercheNavbar";

/**
 * Barre de navigation principale, affichée sur toutes les pages.
 *
 *   [pastille + Ma Boutique]   [Accueil · Produits]   [Ouvrir une boutique] [◯◯◯◯]
 *
 * ── Ce qui a été retiré, et pourquoi ──────────────────────────────────────
 *
 * Les trois actions vivaient dans une CAPSULE blanche à ombre portée, avec le
 * profil isolé dans son propre anneau bordé, à côté d'un bouton vendeur à
 * contour. Soit trois traitements de conteneur différents sur quinze
 * centimètres — c'est ce qui donnait l'impression d'ancien.
 *
 * Tout cela disparaît. Les icônes n'ont plus de fond ni de bordure au repos :
 * seulement une zone de clic de 36 px qui se teinte au survol. C'est la
 * grammaire d'Apple — le conteneur n'apparaît qu'au moment où on le vise.
 *
 * Il ne reste donc qu'UNE forme pleine dans toute la barre, l'appel vendeur,
 * et c'est exactement ce qui le rend lisible.
 *
 * ── Le logo ───────────────────────────────────────────────────────────────
 *
 * Repris de la page de connexion vendeur : la pastille noire et le mot en
 * Newsreader. Un logo doit être le même partout — c'est ce qui en fait un
 * logo. Ça ne brouille pas la distinction client / vendeur, qui repose sur la
 * mise en page, les fonds et les contrôles, jamais sur la marque.
 *
 * ⚠️ Coût assumé : Newsreader est désormais chargée sur TOUTES les pages de
 * la vitrine, alors qu'elle ne servait qu'aux écrans d'accès. D'où un seul
 * gabarit demandé ici — la graisse 500 — au lieu des trois de la page de
 * connexion.
 *
 * Composant SERVEUR : seuls les enfants interactifs (langue, compteur, menu
 * du compte) sont des composants client.
 */

// Une seule graisse : ce mot est la seule chose qu'elle a à composer ici.
const policeMarque = Newsreader({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--police-marque",
  display: "swap",
});

export default async function Navbar({ locale }: { locale: Locale }) {
  const t = await getTranslations("navigation");
  const tMeta = await getTranslations("meta");
  const tVendeur = await getTranslations("authPartage");

  // Newsreader n'a pas de glyphes arabes : en arabe le mot reprend Cairo,
  // déjà chargée par le layout racine.
  const policeDuMot =
    locale === "ar" ? "var(--font-arabic)" : "var(--police-marque)";

  // Zone de clic des icônes. Aucun fond au repos, une teinte au survol.
  const pastille =
    "flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:bg-gray-100";

  return (
    <header
      className={`${policeMarque.variable} sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* ── Logo ───────────────────────────────────────────────────── */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#0a0a0a] text-white">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
            </svg>
          </span>
          <span
            className="whitespace-nowrap text-[19px] font-medium tracking-[-.005em] text-[#0a0a0a]"
            style={{ fontFamily: `${policeDuMot}, Georgia, serif` }}
          >
            {tMeta("titreSite")}
          </span>
        </Link>

        {/* ── Liens, au centre ───────────────────────────────────────── */}
        <ul className="hidden items-center gap-8 text-[14.5px] text-gray-600 sm:flex">
          <li>
            <Link href="/" className="transition-colors hover:text-gray-900">
              {t("accueil")}
            </Link>
          </li>
          <li>
            <Link
              href="/produits"
              className="transition-colors hover:text-gray-900"
            >
              {t("produits")}
            </Link>
          </li>
        </ul>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Porte d'entrée de l'espace vendeur.

              Le libellé ne dit plus « Ouvrir une boutique » : à côté d'une
              barre où « boutique » désigne le magasin qu'on visite, le même
              mot pour « devenir marchand » créait une ambiguïté. « Devenir
              vendeur » nomme la personne, et ne peut se confondre avec rien.
              Une pastille pleine et SANS BORDURE : un contour, sur un fond
              blanc, est ce qui datait le plus l'ancienne version. Le gris
              clair la rend trouvable sans crier — la barre appartient aux
              acheteurs, et cette action ne concerne presque aucun d'eux.
              Masquée sous 1024 px, où la barre est déjà serrée. */}
          <Link
            href="/admin/connexion"
            className="me-2 hidden h-9 items-center rounded-full bg-gray-100 px-4 text-[13.5px] font-medium text-gray-900 transition-colors hover:bg-gray-200 lg:inline-flex"
          >
            {tVendeur("devenirVendeur")}
          </Link>

          <SelecteurLangue localeActive={locale} />

          {/* La loupe ouvre l'overlay de recherche (⌘K / Ctrl+K / « / »). */}
          <BoutonRechercheNavbar className={pastille} />

          {/* `relative` porte la pastille du compteur. */}
          <Link
            href="/panier"
            className={`${pastille} relative`}
            aria-label={t("panier")}
            title={t("panier")}
          >
            <ShoppingCart className="h-[19px] w-[19px]" strokeWidth={1.75} />
            <PanierCompteur />
          </Link>

          <MenuCompte />
        </div>
      </nav>
    </header>
  );
}
