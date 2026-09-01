import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cheminDeRetour, PARAM_SUITE } from "@/lib/redirection";
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
 * titre et le panneau de droite changent.
 *
 * ── Revenir d'où l'on vient ───────────────────────────────────────────────
 *
 * Quelqu'un qui lisait une fiche produit et clique sur l'icône de compte doit
 * y retourner — qu'il se connecte ou qu'il renonce. La page d'origine voyage
 * dans l'URL (`?suite=/produits/vase`) et sert aux DEUX sorties : le lien de
 * retour ici, et la redirection après connexion dans le formulaire.
 *
 * ⚠️ Elle passe par `cheminDeRetour`, qui n'accepte que des chemins internes.
 * Sans ce filtre, `?suite=https://site-pirate.dz` ferait de cette page un
 * tremplin vers n'importe où — voir lib/redirection.ts.
 */
export default async function PageConnexion({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const retour = cheminDeRetour((await searchParams)[PARAM_SUITE]);
  const t = await getTranslations("connexion");

  return (
    <CadreAuth
      locale={locale}
      retour={retour}
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
