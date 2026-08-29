import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import FormulaireConnexionMarchand from "@/components/admin/FormulaireConnexionMarchand";
import VisuelConnexion from "@/components/admin/VisuelConnexion";

/**
 * /admin/connexion — porte d'entrée des marchands.
 *
 * ⚠️ Cette page est le SEUL segment de /admin qui ne soit pas protégé, et
 * c'est délibéré : le layout de (espace) appelle requireAdmin(), qui redirige
 * ici quand personne n'est connecté. Si la page vivait sous ce layout, elle se
 * redirigerait vers elle-même sans fin. D'où le groupe (espace) : il porte le
 * garde et la barre latérale sans toucher à l'URL, et connexion/ reste
 * dehors.
 *
 * Elle n'appelle donc PAS requireAdmin, et ne divulgue rien : le formulaire
 * est le même que n'importe quel écran d'identification.
 *
 * Elle vit aussi hors du groupe (boutique) : ni barre de navigation, ni pied
 * de page, ni tab bar mobile. C'est un plein écran qui s'appartient.
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

export const metadata: Metadata = {
  // Rien à gagner à voir un écran d'identification dans les résultats de
  // recherche — et l'y laisser expose la surface d'attaque au tout-venant.
  robots: { index: false, follow: false },
};

export default async function PageConnexionMarchand({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("connexionMarchand");

  // Marchand déjà identifié : inutile de lui redemander. On saute au tableau
  // de bord. Le rôle est relu en base, jamais pris dans le JWT.
  const session = await getSession();
  if (session) {
    const utilisateur = await getUtilisateurParId(session.id);
    if (utilisateur?.role === "admin") {
      redirect(`/${locale}/admin`);
    }
    // Session de client : on le laisse voir le formulaire. Le composant lui
    // expliquera, s'il insiste, que ce n'est pas sa porte.
  }

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
          Colonne du formulaire — 800 px à partir de 1180, pleine largeur
          en dessous, où le visuel disparaît.
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex w-full flex-col min-[1180px]:w-[800px] min-[1180px]:shrink-0">
        {/* Logo. Centré tant que la page est seule à l'écran, ancré à gauche
            dès que le visuel apparaît à côté. */}
        <div className="flex items-center justify-center gap-[11px] px-6 pt-11 [@media(max-height:900px)]:pt-7 min-[1180px]:justify-start min-[1180px]:ps-[60px]">
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

        {/* Titre + carte, centrés verticalement dans ce qui reste. */}
        <div className="flex flex-1 flex-col items-center justify-center px-[26px] pb-10 [@media(max-height:900px)]:pb-5 min-[1180px]:px-[60px]">
          <h1 className="text-balance text-center font-[family-name:var(--police-titre)] text-[40px] font-light leading-[1.03] tracking-[-.018em] text-[#0a0a0a] min-[1180px]:text-[58px] min-[1180px]:[@media(max-height:900px)]:text-[46px]">
            {t("titre")}
          </h1>

          <p className="mt-[18px] [@media(max-height:900px)]:mt-3.5 max-w-[404px] text-pretty text-center font-[family-name:var(--police-titre)] text-[17.5px] leading-[1.45] text-[#5d564d]">
            {t("sousTitre")}
          </p>

          <div className="mt-[34px] [@media(max-height:900px)]:mt-[22px] w-full max-w-[452px]">
            <FormulaireConnexionMarchand />
          </div>

          {/* DÉCORATIF — l'inscription libre des marchands n'existe pas : un
              accès est ouvert par la plateforme, jamais demandé en self-service.
              Le lien est là parce que la maquette le montre, mais il ne mène
              nulle part et sort du parcours au clavier. */}
          <span
            role="link"
            aria-disabled="true"
            tabIndex={-1}
            className="mt-7 [@media(max-height:900px)]:mt-[18px] cursor-default border-b border-[#d6cfc4] pb-[3px] text-[13.5px] font-medium text-[#0a0a0a] transition-colors hover:border-[#0a0a0a]"
          >
            {t("creerCompteMarchand")}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Colonne du visuel — purement décorative, donc la première à
          partir quand la place manque.
         ══════════════════════════════════════════════════════════════ */}
      <div className="hidden flex-1 items-center justify-center py-14 pe-14 min-[1180px]:flex">
        <VisuelConnexion />
      </div>
    </div>
  );
}
