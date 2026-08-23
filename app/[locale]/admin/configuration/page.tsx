import {
  getTarifsLivraison,
  getParametresLivraison,
  grouperTarifs,
} from "@/lib/livraison";
import ConfigurationLivraison from "@/components/admin/ConfigurationLivraison";
import SectionCategories from "@/components/admin/SectionCategories";
import { getCategories } from "@/lib/categories";
import { getTranslations } from "next-intl/server";

/**
 * Onglet "Configuration" (/admin/configuration).
 * Pour l'instant : uniquement la livraison. Les autres sections
 * (catégories, identité, pixels…) viendront s'ajouter ici.
 *
 * Les tarifs sont stockés par wilaya mais PRÉSENTÉS par groupe : on les
 * regroupe ici, côté serveur.
 */
export default async function AdminConfigurationPage() {
  const t = await getTranslations("admin.configuration");
  const [tarifs, parametres, categories] = await Promise.all([
    getTarifsLivraison(),
    getParametresLivraison(),
    getCategories(),
  ]);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {t("titre")}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t("sousTitre")}</p>
      </header>

      <SectionCategories categoriesInitiales={categories.map((c) => c.id)} />
      <ConfigurationLivraison
        groupesInitiaux={grouperTarifs(tarifs)}
        parametresInitiaux={parametres}
      />
    </>
  );
}
