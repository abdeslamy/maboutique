import { ShoppingCart } from "lucide-react";
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
 * Disposition :
 *   [logo]        [Accueil · Produits]        [ langue · loupe · panier ] [profil]
 *                    (desktop seulement)              capsule
 *
 * Les trois actions secondaires sont regroupées dans une CAPSULE, le profil
 * reste isolé à l'extrémité : c'est l'élément le plus personnel, il mérite
 * d'être distinct du reste.
 *
 * Les quatre pastilles font toutes 36 px : au-delà du confort de clic, une
 * taille commune est ce qui donne l'impression d'un ensemble cohérent —
 * l'ancien avatar, plus gros que ses voisins, cassait cette lecture.
 *
 * Composant SERVEUR : seuls les enfants interactifs (langue, compteur, menu
 * du compte) sont des composants client.
 */
export default async function Navbar({ locale }: { locale: Locale }) {
  const t = await getTranslations("navigation");
  const tMeta = await getTranslations("meta");
  const tVendeur = await getTranslations("connexionMarchand");

  // Gabarit commun aux pastilles de la capsule.
  const pastille =
    "flex h-8 w-8 items-center justify-center rounded-full text-gray-900 transition hover:bg-gray-100";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-6 sm:px-4">
        {/* ── Logo (côté "start") ────────────────────────────────────── */}
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

        {/* ── Zone "end" : appel vendeur + capsule d'actions + profil ── */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Porte d'entrée de l'espace vendeur, depuis la vitrine.
              Discrète à dessein : la barre appartient aux ACHETEURS, et un
              bouton plein leur volerait l'attention pour une action qui ne
              concerne presque aucun d'eux. Un contour suffit à la rendre
              trouvable.

              Masquée sous 1024 px : à cette largeur la barre est déjà serrée,
              et c'est l'action la moins prioritaire des quatre. */}
          <Link
            href="/admin/connexion"
            className="me-1 hidden h-9 items-center rounded-full border border-gray-200 px-4 text-[13.5px] font-medium text-gray-800 transition hover:border-gray-900 hover:text-gray-900 lg:inline-flex"
          >
            {tVendeur("creerCompteMarchand")}
          </Link>

          <div className="flex items-center gap-0.5 rounded-full bg-white p-0.5 shadow-[0_1px_6px_rgba(0,0,0,0.10)]">
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
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2.25} />
              <PanierCompteur />
            </Link>
          </div>

          {/* Profil, à l'extrémité et hors de la capsule. */}
          <MenuCompte />
        </div>
      </nav>
    </header>
  );
}
