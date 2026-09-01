import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cheminDeRetour, PARAM_SUITE } from "@/lib/redirection";
import CadreAuth from "@/components/auth/CadreAuth";
import { LienBasAuth, LIEN_SOULIGNE } from "@/components/auth/ControlesAuth";
import FormulaireInscription from "@/components/FormulaireInscription";
import VisuelCompteClient from "@/components/auth/VisuelCompteClient";

/**
 * /inscription — la création de compte CLIENT.
 *
 * Voir /connexion pour le pourquoi de l'absence d'habillage et pour le
 * paramètre `suite`, qui ramène la personne d'où elle vient.
 */
export default async function PageInscription({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const retour = cheminDeRetour((await searchParams)[PARAM_SUITE]);
  const t = await getTranslations("inscription");

  return (
    <CadreAuth
      locale={locale}
      retour={retour}
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
