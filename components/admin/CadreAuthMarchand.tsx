import { Newsreader } from "next/font/google";
import { getTranslations } from "next-intl/server";

/**
 * Le cadre commun aux écrans d'accès de l'espace vendeur : connexion et
 * ouverture de boutique.
 *
 * Extrait parce que les deux pages doivent rester identiques au pixel — même
 * colonne de 800, mêmes marges, même resserrement sur les écrans peu hauts.
 * Dupliqué, ce gabarit aurait divergé à la première retouche.
 *
 * Il ne porte QUE la mise en page. Le contenu de la carte, le lien du bas et
 * la composition du panneau de droite sont fournis par la page.
 */

// Newsreader porte les titres et les chiffres. Chargée ICI et pas dans le
// layout racine : une police n'a pas à peser sur les pages qui ne l'affichent
// jamais. next/font l'héberge au build, aucune requête vers Google en prod.
const policeTitre = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--police-newsreader",
  display: "swap",
});

export default async function CadreAuthMarchand({
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
  /**
   * Le lien sous la carte — vers l'autre écran d'accès. Fourni par la page,
   * qui porte aussi son espacement : `mt-7 [@media(max-height:899px)]:mt-[18px]`.
   */
  bas: React.ReactNode;
  /** La composition du panneau de droite. */
  visuel: React.ReactNode;
}) {
  const t = await getTranslations("connexionMarchand");

  // Newsreader n'a pas de glyphes arabes. En arabe, les titres reprennent donc
  // Cairo, déjà chargée par le layout racine — sans quoi le navigateur
  // retomberait sur une police système au milieu de la page.
  const policeDesTitres =
    locale === "ar" ? "var(--font-arabic)" : "var(--police-newsreader)";

  return (
    <div
      className={`${policeTitre.variable} flex min-h-screen bg-[#fefdfc]`}
      style={{ "--police-titre": policeDesTitres } as React.CSSProperties}
    >
      {/* ══════════════════════════════════════════════════════════════
          Colonne du formulaire — 800 px à partir de 1200, pleine largeur
          en dessous, où le visuel disparaît.
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex w-full flex-col min-[1200px]:w-[800px] min-[1200px]:shrink-0">
        {/* Logo. Centré tant que la page est seule à l'écran, ancré au bord
            dès que le visuel apparaît à côté. */}
        <div className="flex items-center justify-center gap-[11px] px-6 pt-11 [@media(max-height:899px)]:pt-7 min-[1200px]:justify-start min-[1200px]:ps-[60px]">
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
