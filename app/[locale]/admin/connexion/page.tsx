import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import CadreAuthMarchand from "@/components/admin/CadreAuthMarchand";
import FormulaireConnexionMarchand from "@/components/admin/FormulaireConnexionMarchand";
import VisuelConnexion from "@/components/admin/VisuelConnexion";

/**
 * /admin/connexion — porte d'entrée des vendeurs.
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
 *
 * La mise en page est portée par CadreAuthMarchand, partagé avec l'ouverture
 * de boutique — les deux écrans doivent rester identiques au pixel.
 */

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

  // Vendeur déjà identifié : inutile de lui redemander. On saute au tableau
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

  return (
    <CadreAuthMarchand
      locale={locale}
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      carte={<FormulaireConnexionMarchand />}
      bas={
        // Naguère un faux lien, faute de page d'arrivée. Elle existe : c'en est
        // un vrai. Le libellé parle de la BOUTIQUE et non de la personne —
        // « marchand » sonnait daté, et « vendeur », juste dans la
        // documentation, réduit une marque à un rôle sur un bouton.
        <Link
          href="/admin/inscription"
          className="mt-7 border-b border-[#d6cfc4] pb-[3px] text-[13.5px] font-medium text-[#0a0a0a] transition-colors hover:border-[#0a0a0a] [@media(max-height:899px)]:mt-[18px]"
        >
          {t("creerCompteMarchand")}
        </Link>
      }
      visuel={<VisuelConnexion />}
    />
  );
}
