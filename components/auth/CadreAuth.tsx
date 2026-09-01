import { Newsreader } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Le cadre des QUATRE écrans d'accès — connexion et création de compte, côté
 * client comme côté vendeur.
 *
 * ── Un seul composant, et c'est le but ────────────────────────────────────
 *
 * Les deux familles avaient chacune le leur. Ils ont diverge : titre à 34 d'un
 * côté et 58 de l'autre, carte à 24 de retrait contre 34, seuil à 1024 contre
 * 1200, resserrement sur écran court d'un seul côté. Deux gabarits « qui se
 * ressemblent » redivergent au premier réglage ; un seul ne le peut pas.
 *
 * Ce qui distingue encore les écrans tient donc au CONTENU, pas à la forme :
 * le titre, et surtout le panneau de droite — le vendeur y voit ce qu'il
 * encaisse, le client ce qu'il reçoit.
 *
 * ── Pas de barre de navigation, et c'est délibéré ─────────────────────────
 *
 * Aucun de ces écrans ne porte l'habillage de la boutique. C'est la norme —
 * Stripe, Shopify, Klarna, Linear, Notion : un écran d'identification
 * s'affranchit de la navigation du site, qui distrait d'une tâche unique et
 * propose des sorties dont on ne veut pas là.
 *
 * En contrepartie, DEUX chemins de retour explicites : le logo est cliquable,
 * et un lien nommé occupe le coin opposé. Sans eux, un visiteur qui renonce à
 * se connecter serait piégé sur la page.
 */

// Newsreader porte les titres. Chargée ICI et pas dans un layout : une police
// n'a pas à peser sur les pages qui ne l'affichent jamais. next/font l'héberge
// au build, aucune requête vers Google en production.
const policeTitre = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--police-newsreader",
  display: "swap",
});

export default async function CadreAuth({
  locale,
  titre,
  sousTitre,
  carte,
  bas,
  visuel,
}: {
  locale: string;
  titre: string;
  sousTitre: string;
  /** La carte flottante du formulaire. */
  carte: React.ReactNode;
  /** Le lien sous la carte, vers l'écran jumeau. */
  bas: React.ReactNode;
  /** La composition du panneau de droite. */
  visuel: React.ReactNode;
}) {
  const t = await getTranslations("authPartage");

  // Newsreader n'a pas de glyphes arabes. En arabe, les titres reprennent donc
  // Cairo, déjà chargée par le layout racine — sans quoi le navigateur
  // retomberait sur une police système au milieu de la page.
  const policeDesTitres =
    locale === "ar" ? "var(--font-arabic)" : "var(--police-newsreader)";

  return (
    <div
      className={`${policeTitre.variable} relative flex min-h-screen bg-[#fefdfc]`}
      style={{ "--police-titre": policeDesTitres } as React.CSSProperties}
    >
      {/* La sortie de secours, en haut à droite de la PAGE — à l'opposé du
          logo, et posée une seule fois plutôt qu'une par colonne. Discrète,
          mais nommée : sans elle, un visiteur qui renonce à se connecter
          n'aurait que le bouton « précédent » de son navigateur. */}
      <Link
        href="/"
        className="absolute end-6 top-11 z-10 rounded-full px-3 py-2 text-[13.5px] font-medium text-[#8b8377] transition-colors hover:bg-[#f4f1ec] hover:text-[#0a0a0a] [@media(max-height:899px)]:top-7 min-[1200px]:end-14"
      >
        {t("retourBoutique")}
      </Link>
      {/* ══════════════════════════════════════════════════════════════
          Colonne du formulaire — 800 px à partir de 1200, pleine largeur
          en dessous, où le visuel disparaît.
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex w-full flex-col min-[1200px]:w-[800px] min-[1200px]:shrink-0">
        {/* Logo à gauche, sortie à droite. Les deux ramènent à la boutique :
            l'un par réflexe, l'autre en le disant. */}
        <div className="flex items-center px-6 pt-11 [@media(max-height:899px)]:pt-7 min-[1200px]:ps-[60px]">
          <Link href="/" className="flex items-center gap-[11px]">
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
            <span className="font-[family-name:var(--police-titre)] text-[19px] font-medium tracking-[-.005em] text-[#0a0a0a]">
              {t("marque")}
            </span>
          </Link>

        </div>

        {/* Titre + carte, centrés verticalement dans ce qui reste.
            Les variantes [@media(max-height:899px)] resserrent les blancs sur
            un portable peu haut, SANS toucher à la taille des composants : ce
            sont les respirations qui cèdent, jamais la maquette. */}
        <div className="flex flex-1 flex-col items-center justify-center px-[26px] pb-10 [@media(max-height:899px)]:pb-5 min-[1200px]:px-[60px]">
          <h1 className="text-balance text-center font-[family-name:var(--police-titre)] text-[40px] font-light leading-[1.03] tracking-[-.018em] text-[#0a0a0a] min-[1200px]:text-[58px] min-[1200px]:[@media(max-height:899px)]:text-[46px]">
            {titre}
          </h1>

          <p className="mt-[18px] max-w-[404px] text-pretty text-center font-[family-name:var(--police-titre)] text-[17.5px] leading-[1.45] text-[#5d564d] [@media(max-height:899px)]:mt-3.5">
            {sousTitre}
          </p>

          <div className="mt-[34px] w-full max-w-[452px] [@media(max-height:899px)]:mt-[22px]">
            {carte}
          </div>

          {bas}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Colonne du visuel — purement décorative, donc la première à
          partir quand la place manque.

         ══════════════════════════════════════════════════════════════ */}
      <div className="hidden min-w-0 flex-1 py-14 pe-14 min-[1200px]:flex">
        {visuel}
      </div>
    </div>
  );
}
