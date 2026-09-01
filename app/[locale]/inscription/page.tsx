import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import CadreAuth from "@/components/auth/CadreAuth";
import { LienBasAuth, LIEN_SOULIGNE } from "@/components/auth/ControlesAuth";
import FormulaireInscription from "@/components/FormulaireInscription";
import VisuelCompteClient from "@/components/auth/VisuelCompteClient";

/**
 * /inscription — la création de compte CLIENT.
 *
 * Voir /connexion pour le pourquoi de l'absence d'habillage : même cadre,
 * mêmes briques, mêmes réglages que l'écran vendeur.
 */
export default async function PageInscription({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("inscription");

  return (
    <CadreAuth
      locale={locale}
      titre={t("titre")}
      sousTitre={t("sousTitre")}
      carte={<FormulaireInscription />}
      bas={
        <LienBasAuth>
          {t("dejaInscrit")}{" "}
          <Link href="/connexion" className={LIEN_SOULIGNE}>
            {t("seConnecter")}
          </Link>
        </LienBasAuth>
      }
      visuel={<VisuelCompteClient />}
    />
  );
}
