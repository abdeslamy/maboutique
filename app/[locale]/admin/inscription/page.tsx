import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import CadreAuthMarchand from "@/components/admin/CadreAuthMarchand";
import FormulaireInscriptionMarchand from "@/components/admin/FormulaireInscriptionMarchand";
import VisuelInscription from "@/components/admin/VisuelInscription";

/**
 * /admin/inscription — l'ouverture d'une boutique.
 *
 * Comme /admin/connexion, elle vit HORS du groupe (espace) : le layout de
 * (espace) appelle requireAdmin(), qui redirigerait ici même quelqu'un qui
 * vient précisément parce qu'il n'a pas encore de compte.
 *
 * Et hors du groupe (boutique) : ni barre de navigation, ni pied de page, ni
 * tab bar mobile. C'est un plein écran qui s'appartient.
 *
 * ⚠️ La page est une MAQUETTE : le formulaire ne crée aucune boutique, et le
 * dit à l'envoi. Voir FormulaireInscriptionMarchand pour ce qu'il manque.
 */

export const metadata: Metadata = {
  // Rien à gagner à voir un écran d'accès dans les résultats de recherche.
  robots: { index: false, follow: false },
};

export default async function PageInscriptionMarchand({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("inscriptionMarchand");

  // Vendeur déjà identifié : il a une boutique, il n'a rien à faire ici.
  const session = await getSession();
  if (session) {
    const utilisateur = await getUtilisateurParId(session.id);
    if (utilisateur?.role === "admin") {
      redirect(`/${locale}/admin`);
    }
  }

  return (
    <CadreAuthMarchand
      locale={locale}
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      carte={<FormulaireInscriptionMarchand />}
      bas={
        <p className="mt-7 text-center text-[13.5px] text-[#8b8377] [@media(max-height:899px)]:mt-[18px]">
          {t("dejaUnCompte")}{" "}
          {/* Un VRAI lien, celui-ci : les deux écrans d'accès se répondent. */}
          <Link
            href="/admin/connexion"
            className="border-b border-[#d6cfc4] pb-[3px] font-medium text-[#0a0a0a] transition-colors hover:border-[#0a0a0a]"
          >
            {t("seConnecter")}
          </Link>
        </p>
      }
      visuel={<VisuelInscription />}
    />
  );
}
