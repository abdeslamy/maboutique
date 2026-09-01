import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getUtilisateurParId } from "@/lib/auth";
import CadreAuth from "@/components/auth/CadreAuth";
import { LienBasAuth, LIEN_SOULIGNE } from "@/components/auth/ControlesAuth";
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
    <CadreAuth
      locale={locale}
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      carte={<FormulaireInscriptionMarchand />}
      bas={
        <LienBasAuth>
          {t("dejaUnCompte")}{" "}
          <Link href="/admin/connexion" className={LIEN_SOULIGNE}>
            {t("seConnecter")}
          </Link>
        </LienBasAuth>
      }
      visuel={<VisuelInscription />}
    />
  );
}
