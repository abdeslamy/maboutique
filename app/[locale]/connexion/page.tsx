import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import CadreAuth from "@/components/auth/CadreAuth";
import { LienBasAuth, LIEN_SOULIGNE } from "@/components/auth/ControlesAuth";
import FormulaireConnexion from "@/components/FormulaireConnexion";
import VisuelCompteClient from "@/components/auth/VisuelCompteClient";

/**
 * /connexion — l'écran d'accès des CLIENTS.
 *
 * Il vit hors du groupe (boutique) depuis qu'on a retiré l'habillage : ni
 * barre de navigation, ni pied de page, ni tab bar. C'est la norme sur ce type
 * d'écran, et le cadre fournit deux chemins de retour à la place — le logo et
 * un lien nommé.
 *
 * Même cadre, mêmes briques et mêmes réglages que l'écran vendeur. Seuls le
 * titre et le panneau de droite changent : le vendeur y voit ce qu'il
 * encaisse, le client ce qu'il reçoit.
 */
export default async function PageConnexion({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("connexion");

  return (
    <CadreAuth
      locale={locale}
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      carte={<FormulaireConnexion />}
      bas={
        <LienBasAuth>
          {t("pasDeCompte")}{" "}
          <Link href="/inscription" className={LIEN_SOULIGNE}>
            {t("creerCompte")}
          </Link>
        </LienBasAuth>
      }
      visuel={<VisuelCompteClient />}
    />
  );
}
